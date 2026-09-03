import { Video, Comment, UserProfile } from "@/types";
import { INITIAL_VIDEOS, INITIAL_COMMENTS } from "./seedData";
import { db, isFirebaseConfigured } from "./firebase";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  query, 
  where, 
  orderBy,
  addDoc,
  deleteDoc
} from "firebase/firestore";

const STORAGE_KEYS = {
  VIDEOS: "citradhara_videos",
  COMMENTS: "citradhara_comments",
  LIKED: "citradhara_liked_video_ids",
  HISTORY: "citradhara_history_video_ids",
  SUBSCRIPTIONS: "citradhara_subscriptions",
};

// Local storage helpers
function getLocalVideos(): Video[] {
  if (typeof window === "undefined") return INITIAL_VIDEOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(INITIAL_VIDEOS));
      return INITIAL_VIDEOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_VIDEOS;
  }
}

function saveLocalVideos(videos: Video[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  } catch (e) {
    console.error("Failed saving local videos:", e);
  }
}

function getLocalComments(videoId: string): Comment[] {
  if (typeof window === "undefined") return INITIAL_COMMENTS[videoId] || [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.COMMENTS}_${videoId}`);
    if (!raw) {
      const initial = INITIAL_COMMENTS[videoId] || [];
      localStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${videoId}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMENTS[videoId] || [];
  }
}

function saveLocalComments(videoId: string, comments: Comment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${videoId}`, JSON.stringify(comments));
  } catch (e) {
    console.error("Failed saving comments:", e);
  }
}

// -------------------------------------------------------------
// Core Database APIs
// -------------------------------------------------------------

// Timeout wrapper to prevent hanging when adblockers or Brave Shields block firestore.googleapis.com
function withTimeout<T>(promise: Promise<T>, ms: number = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore request timed out or blocked by client")), ms)
    ),
  ]);
}

export async function fetchVideos(category?: string, searchQuery?: string): Promise<Video[]> {
  let videos: Video[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const videosRef = collection(db, "videos");
      const q = query(videosRef, orderBy("createdAt", "desc"));
      const snapshot = await withTimeout(getDocs(q), 2500);
      
      if (!snapshot.empty) {
        videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      } else {
        // If Firestore is empty, seed it with initial videos
        videos = INITIAL_VIDEOS;
        for (const v of INITIAL_VIDEOS) {
          withTimeout(setDoc(doc(db, "videos", v.id), v), 2000).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Firestore fetch error / blocked by client, falling back to local:", err);
      videos = getLocalVideos();
    }
  } else {
    videos = getLocalVideos();
  }

  // Filter by category
  if (category && category !== "All") {
    videos = videos.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    videos = videos.filter(v => 
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.uploaderName.toLowerCase().includes(q) ||
      v.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return videos;
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "videos", id);
      const snapshot = await withTimeout(getDoc(docRef), 2500);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Video;
      }
    } catch (err) {
      console.warn("Firestore fetchVideoById error:", err);
    }
  }

  const local = getLocalVideos();
  return local.find(v => v.id === id) || null;
}

export async function incrementVideoViews(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "videos", id);
      await updateDoc(docRef, { views: increment(1) });
      return;
    } catch (err) {
      console.warn("Views increment error:", err);
    }
  }

  const local = getLocalVideos();
  const updated = local.map(v => v.id === id ? { ...v, views: v.views + 1 } : v);
  saveLocalVideos(updated);
}

export async function addVideo(videoData: Omit<Video, "id" | "views" | "likesCount" | "dislikesCount" | "commentsCount" | "createdAt">): Promise<Video> {
  const newVideo: Video = {
    ...videoData,
    id: `citra-${Date.now()}`,
    views: 1,
    likesCount: 0,
    dislikesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "videos", newVideo.id), newVideo);
      return newVideo;
    } catch (err) {
      console.warn("Firestore addVideo error:", err);
    }
  }

  const local = getLocalVideos();
  saveLocalVideos([newVideo, ...local]);
  return newVideo;
}

export async function toggleLikeVideo(videoId: string, isLike: boolean): Promise<{ likes: number; dislikes: number }> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "videos", videoId);
      if (isLike) {
        await updateDoc(docRef, { likesCount: increment(1) });
      } else {
        await updateDoc(docRef, { dislikesCount: increment(1) });
      }
    } catch (err) {
      console.warn("Toggle like error:", err);
    }
  }

  const local = getLocalVideos();
  let result = { likes: 0, dislikes: 0 };
  const updated = local.map(v => {
    if (v.id === videoId) {
      const likes = isLike ? v.likesCount + 1 : v.likesCount;
      const dislikes = !isLike ? v.dislikesCount + 1 : v.dislikesCount;
      result = { likes, dislikes };
      return { ...v, likesCount: likes, dislikesCount: dislikes };
    }
    return v;
  });
  saveLocalVideos(updated);
  return result;
}

export async function fetchComments(videoId: string): Promise<Comment[]> {
  if (isFirebaseConfigured && db) {
    try {
      const commentsRef = collection(db, `videos/${videoId}/comments`);
      const q = query(commentsRef, orderBy("createdAt", "desc"));
      const snapshot = await withTimeout(getDocs(q), 2500);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
      }
    } catch (err) {
      console.warn("Firestore fetchComments error:", err);
    }
  }

  return getLocalComments(videoId);
}

export async function addComment(videoId: string, commentData: Omit<Comment, "id" | "createdAt" | "likes">): Promise<Comment> {
  const newComment: Comment = {
    ...commentData,
    id: `comm-${Date.now()}`,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, `videos/${videoId}/comments`), newComment);
      await updateDoc(doc(db, "videos", videoId), { commentsCount: increment(1) });
      return newComment;
    } catch (err) {
      console.warn("Firestore addComment error:", err);
    }
  }

  const current = getLocalComments(videoId);
  const updated = [newComment, ...current];
  saveLocalComments(videoId, updated);

  // Update video comments count
  const videos = getLocalVideos();
  const updatedVideos = videos.map(v => v.id === videoId ? { ...v, commentsCount: v.commentsCount + 1 } : v);
  saveLocalVideos(updatedVideos);

  return newComment;
}

// User Local History & Likes
export function recordWatchHistory(videoId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const filtered = ids.filter(id => id !== videoId);
    filtered.unshift(videoId);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered.slice(0, 50)));
  } catch (e) {
    console.error(e);
  }
}

export function getWatchHistoryIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveLiked(videoId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKED);
    let ids: string[] = raw ? JSON.parse(raw) : [];
    const exists = ids.includes(videoId);
    if (exists) {
      ids = ids.filter(id => id !== videoId);
    } else {
      ids.push(videoId);
    }
    localStorage.setItem(STORAGE_KEYS.LIKED, JSON.stringify(ids));
    return !exists;
  } catch {
    return false;
  }
}

export function isVideoLikedLocally(videoId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKED);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(videoId);
  } catch {
    return false;
  }
}

export function toggleSubscription(channelHandle: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    let subs: string[] = raw ? JSON.parse(raw) : [];
    const exists = subs.includes(channelHandle);
    if (exists) {
      subs = subs.filter(h => h !== channelHandle);
    } else {
      subs.push(channelHandle);
    }
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    return !exists;
  } catch {
    return false;
  }
}

export function isChannelSubscribed(channelHandle: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    const subs: string[] = raw ? JSON.parse(raw) : [];
    return subs.includes(channelHandle);
  } catch {
    return false;
  }
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "videos", videoId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteVideo error:", err);
    }
  }

  // Remove from local storage
  const local = getLocalVideos();
  const filtered = local.filter((v) => v.id !== videoId);
  saveLocalVideos(filtered);

  // Clean from history and liked if present
  if (typeof window !== "undefined") {
    try {
      const likedRaw = localStorage.getItem(STORAGE_KEYS.LIKED);
      if (likedRaw) {
        const liked: string[] = JSON.parse(likedRaw);
        localStorage.setItem(STORAGE_KEYS.LIKED, JSON.stringify(liked.filter(id => id !== videoId)));
      }
      const histRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (histRaw) {
        const hist: string[] = JSON.parse(histRaw);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(hist.filter(id => id !== videoId)));
      }
    } catch {}
  }

  return true;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (err) {
      console.warn("Fetch profile error:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`citra_profile_${uid}`);
      if (saved) {
        return JSON.parse(saved) as UserProfile;
      }
    } catch {}
  }

  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, profile, { merge: true });
    } catch (err) {
      console.warn("Save profile error:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`citra_profile_${profile.uid}`, JSON.stringify(profile));

      // Update local videos by this creator so their channel name, avatar, and handle update across the app
      const local = getLocalVideos();
      const updated = local.map((v) => {
        if (v.uploaderUid === profile.uid) {
          return {
            ...v,
            uploaderName: profile.displayName,
            uploaderAvatar: profile.photoURL,
            uploaderHandle: profile.handle,
          };
        }
        return v;
      });
      saveLocalVideos(updated);
    } catch (e) {
      console.error("Failed saving profile to storage:", e);
    }
  }
}
