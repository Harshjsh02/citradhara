/**
 * YouTube Subscriptions & Long-Form Video Service
 * Fetches user's subscribed channels and their latest long-form video uploads.
 * Strictly filters out Shorts (duration <= 60s and #shorts tags).
 */

import { Video, Category } from "@/types";

export interface YouTubeSubscription {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface YouTubeFeedVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  durationSeconds: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

/**
 * Parses ISO 8601 duration format (e.g. PT15M33S, PT1H2M10S, PT45S) into total seconds.
 */
export function parseISO8601Duration(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS duration string.
 */
export function formatDurationSeconds(seconds: number): string {
  if (seconds <= 0) return "Stream";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Identifies if a video is a YouTube Short:
 * 1. Duration <= 60 seconds.
 * 2. Has #shorts, #short, or /shorts/ in title or description.
 */
export function isShortsVideo(title: string, description: string, durationSeconds: number): boolean {
  if (durationSeconds > 0 && durationSeconds <= 60) return true;
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes("#shorts") || combined.includes("#short") || combined.includes("/shorts/")) {
    return true;
  }
  return false;
}

const SUBS_CACHE_PREFIX = "citra_yt_subs_v5_";
const FEED_CACHE_PREFIX = "citra_yt_feed_v5_";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to preserve quota

/**
 * Maps a YouTube video to Citradhara's curated categories.
 * Prevents entertainment, vlogs, and comedy from erroneously falling into "Gaming" or "Coding & Tech".
 */
export function determineVideoCategory(
  categoryId?: string,
  title: string = "",
  description: string = "",
  tags: string[] = [],
  channelTitle: string = ""
): Category {
  const text = `${title} ${description} ${tags.join(" ")} ${channelTitle}`.toLowerCase();

  // 1. Gaming - Only true gaming content
  if (
    categoryId === "20" ||
    /\b(gaming|gameplay|game|gamer|gamers|minecraft|gta|gta 5|gta v|bgmi|pubg|roblox|fortnite|valorant|esports|walkthrough|playthrough|streamer|speedrun|nintendo|playstation|xbox|free fire|clash royale|elden ring)\b/i.test(text)
  ) {
    return "Gaming";
  }

  // 2. Music & Audio
  if (
    categoryId === "10" ||
    /\b(music|song|audio|soundtrack|concert|album|lyrics|singer|rap|beat|remix|melody|acoustic|track|instrumental|band|orchestra|spotify)\b/i.test(text)
  ) {
    return "Music & Audio";
  }

  // 3. Coding & Tech
  if (
    /\b(code|coding|programming|developer|javascript|typescript|python|react|nextjs|software|hardware|devops|fullstack|frontend|backend|css|html|github|git|api|database|sql|linux|docker|aws|bug|compile|web dev|cybersecurity|terminal)\b/i.test(text)
  ) {
    return "Coding & Tech";
  }

  // 4. Science & Wonders
  if (
    categoryId === "27" ||
    /\b(science|physics|biology|chemistry|mathematics|math|quantum|astronomy|cosmos|space|scientific|experiment|universe|nasa|isro|microscope|telescope|dna|evolution|physics wallah|unacademy)\b/i.test(text)
  ) {
    return "Science & Wonders";
  }

  // 5. Documentaries
  if (
    categoryId === "35" ||
    /\b(documentary|biography|investigation|historical documentary|uncovered|chronicle|untold story|case study|geopolitics)\b/i.test(text)
  ) {
    return "Documentaries";
  }

  // 6. Podcasts & Talks
  if (
    /\b(podcast|interview|talk show|discussion|conversation|speeches|ted talk|in conversation with|q&a|beerbiceps|the ranveer show)\b/i.test(text)
  ) {
    return "Podcasts & Talks";
  }

  // 7. Cinema & Films
  if (
    categoryId === "1" ||
    categoryId === "30" ||
    categoryId === "44" ||
    /\b(cinema|film|movie|trailer|teaser|short film|scene|actor|director|box office|movie review|netflix|web series|episode)\b/i.test(text)
  ) {
    return "Cinema & Films";
  }

  // 8. Art & Animation
  if (
    categoryId === "31" ||
    /\b(art|animation|anime|drawing|illustration|sketch|digital art|speedpaint|3d render|blender 3d|vfx|cgi)\b/i.test(text)
  ) {
    return "Art & Animation";
  }

  // 9. Culture & Travel
  if (
    categoryId === "19" ||
    /\b(travel|culture|tourism|heritage|voyage|explore|city tour|road trip|backpacking|flight|hotel|destination|india|japan|europe|village)\b/i.test(text)
  ) {
    return "Culture & Travel";
  }

  // 10. Vlogs / Lifestyle / Pranks / Entertainment
  // YouTube Category 22 (People & Blogs), 23 (Comedy), 24 (Entertainment)
  if (
    categoryId === "22" ||
    categoryId === "23" ||
    categoryId === "24" ||
    /\b(vlog|daily vlog|lifestyle|prank|challenge|spent|spend|eating|shopping|day in my life|rebuild|friend|friends|family|fukra|insaan|sourav joshi|latent|funny|comedy|roast)\b/i.test(text)
  ) {
    return "Vlogs";
  }

  if (categoryId === "28") return "Coding & Tech";

  return "Vlogs";
}

/**
 * Fetches the user's subscribed channels using their Google OAuth access token.
 */
export async function fetchUserSubscriptions(accessToken: string): Promise<YouTubeSubscription[]> {
  if (!accessToken) return [];

  const cacheKey = `${SUBS_CACHE_PREFIX}${accessToken.slice(-8)}`;
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&order=alphabetical",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("YouTube Subscriptions API error:", res.status, err);
      return [];
    }

    const json = await res.json();
    if (!json.items || !Array.isArray(json.items)) return [];

    const subscriptions: YouTubeSubscription[] = json.items.map((item: any) => ({
      channelId: item.snippet?.resourceId?.channelId || "",
      title: item.snippet?.title || "Creator",
      description: item.snippet?.description || "",
      thumbnail:
        item.snippet?.thumbnails?.default?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    })).filter((s: YouTubeSubscription) => Boolean(s.channelId));

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ timestamp: Date.now(), data: subscriptions })
        );
      } catch {}
    }

    return subscriptions;
  } catch (err) {
    console.error("Failed to fetch YouTube subscriptions:", err);
    return [];
  }
}

/**
 * Fetches recent long-form uploads for the given list of subscribed channels.
 * Uses upload playlists (UU...) to minimize quota usage to 1-2 units per request.
 * Filters out all Shorts (< 60s and #shorts).
 */
export async function fetchSubscribedLongFormVideos(
  accessToken: string,
  subscriptions: YouTubeSubscription[],
  force = false
): Promise<Video[]> {
  if (!accessToken || subscriptions.length === 0) return [];

  const cacheKey = `${FEED_CACHE_PREFIX}${accessToken.slice(-8)}`;
  if (!force && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {}
  }

  try {
    // Look at up to the top 25 channels to stay well within YouTube quota limits
    const targetChannels = subscriptions.slice(0, 25);
    const channelAvatarMap = new Map<string, string>();
    subscriptions.forEach((sub) => channelAvatarMap.set(sub.channelId, sub.thumbnail));

    // Fetch the uploads playlist for each channel in parallel
    // Channel ID format: UCxxxx -> Upload Playlist ID: UUxxxx
    const playlistItemPromises = targetChannels.map(async (sub) => {
      if (!sub.channelId.startsWith("UC")) return [];
      const uploadsPlaylistId = "UU" + sub.channelId.substring(2);

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=4`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return json.items || [];
      } catch {
        return [];
      }
    });

    const playlistResults = await Promise.all(playlistItemPromises);
    const rawItems = playlistResults.flat();
    const videoIds = rawItems
      .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) return [];

    // Batch query video details (contentDetails for duration, statistics for views/likes)
    // Chunk videoIds into batches of 50
    const videoDetailsPromises: Promise<any[]>[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      videoDetailsPromises.push(
        fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(",")}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        )
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then((json) => json.items || [])
          .catch(() => [])
      );
    }

    const videoDetailsResults = await Promise.all(videoDetailsPromises);
    const videoItems = videoDetailsResults.flat();

    // Filter strictly for long-form videos (No Shorts!) and map to Citradhara Video interface
    const cleanVideos: Video[] = [];

    for (const item of videoItems) {
      const title = item.snippet?.title || "";
      const description = item.snippet?.description || "";
      const rawDuration = item.contentDetails?.duration || "";
      const durationSeconds = parseISO8601Duration(rawDuration);

      // STRICT SHORTS FILTER:
      // Exclude if duration is 60 seconds or less
      // Exclude if title or description has #shorts
      if (isShortsVideo(title, description, durationSeconds)) {
        continue;
      }

      const channelId = item.snippet?.channelId || "";
      const avatar = channelAvatarMap.get(channelId) ||
        item.snippet?.thumbnails?.default?.url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      const tags = item.snippet?.tags || ["youtube", "subscribed"];
      const channelTitle = item.snippet?.channelTitle || "Creator";
      const categoryId = item.snippet?.categoryId;

      // Classify productivity
      const { contentType, productivityScore } = classifyVideoContent(
        title,
        description,
        tags,
        channelTitle,
        categoryId
      );

      const vid: Video = {
        id: item.id,
        title,
        description,
        driveFileId: item.id,
        driveUrl: `https://www.youtube.com/watch?v=${item.id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`,
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        uploaderUid: channelId,
        uploaderName: channelTitle,
        uploaderAvatar: avatar,
        uploaderHandle: channelTitle.toLowerCase().replace(/\s+/g, "_"),
        category: determineVideoCategory(categoryId, title, description, tags, channelTitle),
        tags,
        views: parseInt(item.statistics?.viewCount || "0", 10),
        likesCount: parseInt(item.statistics?.likeCount || "0", 10),
        dislikesCount: 0,
        commentsCount: parseInt(item.statistics?.commentCount || "0", 10),
        duration: formatDurationSeconds(durationSeconds),
        createdAt: item.snippet?.publishedAt || new Date().toISOString(),
        contentType,
        productivityScore,
      };

      cleanVideos.push(vid);
    }

    // Default: Sort by publication date (newest first)
    cleanVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (typeof window !== "undefined" && cleanVideos.length > 0) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ timestamp: Date.now(), data: cleanVideos })
        );
      } catch {}
    }

    return cleanVideos;
  } catch (err) {
    console.error("Failed to fetch long-form videos:", err);
    return [];
  }
}

/**
 * Fetches up to 50 long-form videos for a specific YouTube channel.
 * Strictly excludes YouTube Shorts (<61s or #shorts).
 */
export async function fetchChannelLongFormVideos(
  accessToken: string,
  channelId: string,
  channelTitle?: string,
  channelAvatar?: string,
  force = false,
  includeAll = false
): Promise<Video[]> {
  if (!accessToken || !channelId) return [];

  const cacheKey = `citra_channel_feed_v5_${channelId}`;
  if (!force && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {}
  }

  try {
    let uploadsPlaylistId = "";
    if (channelId.startsWith("UC")) {
      uploadsPlaylistId = "UU" + channelId.substring(2);
    } else {
      // Fallback: look up channel's contentDetails to find uploads playlist
      const chRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      if (chRes.ok) {
        const chData = await chRes.json();
        uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || "";
      }
    }

    if (!uploadsPlaylistId) return [];

    // Fetch up to 50 items from the channel's uploads playlist
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) return [];
    const json = await res.json();
    const rawItems = json.items || [];
    const videoIds = rawItems
      .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) return [];

    // Batch query video details (contentDetails for duration, statistics for views/likes)
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!videoRes.ok) return [];
    const videoJson = await videoRes.json();
    const videoItems = videoJson.items || [];

    const cleanVideos: Video[] = [];

    for (const item of videoItems) {
      const title = item.snippet?.title || "";
      const description = item.snippet?.description || "";
      const rawDuration = item.contentDetails?.duration || "";
      const durationSeconds = parseISO8601Duration(rawDuration);

      if (!includeAll && isShortsVideo(title, description, durationSeconds)) {
        continue;
      }

      const effectiveChannelTitle = item.snippet?.channelTitle || channelTitle || "Creator";
      const avatar =
        channelAvatar ||
        item.snippet?.thumbnails?.default?.url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      const tags = item.snippet?.tags || ["youtube", "channel"];
      const categoryId = item.snippet?.categoryId;

      const { contentType, productivityScore } = classifyVideoContent(
        title,
        description,
        tags,
        effectiveChannelTitle,
        categoryId
      );

      const vid: Video = {
        id: item.id,
        title,
        description,
        driveFileId: item.id,
        driveUrl: `https://www.youtube.com/watch?v=${item.id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`,
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        uploaderUid: channelId,
        uploaderName: effectiveChannelTitle,
        uploaderAvatar: avatar,
        uploaderHandle: effectiveChannelTitle.toLowerCase().replace(/\s+/g, "_"),
        category: determineVideoCategory(categoryId, title, description, tags, effectiveChannelTitle),
        tags,
        views: parseInt(item.statistics?.viewCount || "0", 10),
        likesCount: parseInt(item.statistics?.likeCount || "0", 10),
        dislikesCount: 0,
        commentsCount: parseInt(item.statistics?.commentCount || "0", 10),
        duration: formatDurationSeconds(durationSeconds),
        createdAt: item.snippet?.publishedAt || new Date().toISOString(),
        contentType,
        productivityScore,
      };

      cleanVideos.push(vid);
    }

    cleanVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (typeof window !== "undefined" && cleanVideos.length > 0) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ timestamp: Date.now(), data: cleanVideos })
        );
      } catch {}
    }

    return cleanVideos;
  } catch (err) {
    console.error(`Failed to fetch channel uploads for ${channelId}:`, err);
    return [];
  }
}

const PRODUCTIVE_KEYWORDS = [
  "tutorial", "course", "learn", "how to", "guide", "lecture", "explained",
  "code", "coding", "programming", "developer", "javascript", "typescript",
  "python", "react", "nextjs", "software", "hardware", "engineering", "ai",
  "artificial intelligence", "machine learning", "deep learning", "neural network",
  "science", "physics", "quantum", "mathematics", "math", "biology", "chemistry",
  "astronomy", "cosmos", "documentary", "history", "biography", "philosophy",
  "productivity", "deep work", "focus", "habit", "study", "business",
  "finance", "investing", "economics", "startup", "architecture", "design",
  "tech", "system design", "database", "cybersecurity", "linux", "cloud", "ielts", "toefl"
];

const ENTERTAINMENT_KEYWORDS = [
  "gameplay", "gaming", "streamer", "walkthrough", "let's play", "esports",
  "trailer", "teaser", "movie", "cinema", "film clip", "scene",
  "music video", "official audio", "song", "remix", "cover", "album", "lyrics",
  "comedy", "funny", "meme", "prank", "pranks", "sketch", "roast", "standup",
  "vlog", "daily vlog", "challenge", "challenges", "reaction", "reacting", "drama",
  "spent", "spend", "rebuild", "luxury", "fake", "insaan", "fukra", "lifestyle",
  "entertainment", "unboxing", "shopping", "surprise", "road rage", "sister", "brother",
  "24 hours", "overnight", "expensive", "cheap", "crore", "lakh", "latent", "india's got latent"
];

/**
 * Classifies a video as 'productive', 'entertainment', or 'general' with a score from 0 to 100.
 */
export function classifyVideoContent(
  title: string,
  description: string,
  tags: string[] = [],
  channelTitle: string = "",
  categoryId?: string
): { contentType: 'productive' | 'entertainment' | 'general'; productivityScore: number } {
  let score = 50;

  // 1. YouTube Category ID weights
  if (categoryId) {
    if (categoryId === "27" || categoryId === "28") score += 35; // Education, Science & Tech
    else if (categoryId === "26") score += 20; // Howto & Style
    else if (categoryId === "25") score += 10; // News & Politics
    else if (categoryId === "10") score -= 30; // Music
    else if (categoryId === "20") score -= 30; // Gaming
    else if (categoryId === "23" || categoryId === "24") score -= 35; // Comedy, Entertainment
    else if (categoryId === "22") score -= 30; // People & Blogs
  }

  // 2. Keyword analysis
  const combinedText = `${title} ${description} ${tags.join(" ")} ${channelTitle}`.toLowerCase();

  let productiveMatches = 0;
  for (const kw of PRODUCTIVE_KEYWORDS) {
    if (combinedText.includes(kw)) productiveMatches++;
  }

  let entertainmentMatches = 0;
  for (const kw of ENTERTAINMENT_KEYWORDS) {
    if (combinedText.includes(kw)) entertainmentMatches++;
  }

  score += Math.min(productiveMatches * 10, 45);
  score -= Math.min(entertainmentMatches * 12, 50);

  const finalScore = Math.max(0, Math.min(100, score));

  let contentType: 'productive' | 'entertainment' | 'general' = 'general';
  if (finalScore >= 55) {
    contentType = 'productive';
  } else if (finalScore <= 45) {
    contentType = 'entertainment';
  }

  return { contentType, productivityScore: finalScore };
}

/**
 * Sorts videos with highest productivity score first, followed by newest published date.
 */
export function sortVideosProductiveFirst(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => {
    const scoreA = a.productivityScore ?? 50;
    const scoreB = b.productivityScore ?? 50;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Sorts videos with entertainment first, followed by newest published date.
 */
export function sortVideosEntertainmentFirst(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => {
    const scoreA = a.productivityScore ?? 50;
    const scoreB = b.productivityScore ?? 50;
    if (scoreA !== scoreB) {
      return scoreA - scoreB; // lower productivity score = higher entertainment
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filters for only productive content (score >= 50 or contentType === 'productive')
 */
export function filterProductiveOnly(videos: Video[]): Video[] {
  return videos.filter((v) => (v.productivityScore ?? 50) >= 50 || v.contentType === 'productive');
}

/**
 * Filters for only entertainment content (score < 55 or contentType === 'entertainment')
 */
export function filterEntertainmentOnly(videos: Video[]): Video[] {
  return videos.filter((v) => (v.productivityScore ?? 50) < 55 || v.contentType === 'entertainment');
}

export interface YouTubeChannelProfile {
  channelId: string;
  title: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  subscribersCount: number;
  videoCount: number;
  uploadsPlaylistId: string;
}

/**
 * Fetches the authenticated user's YouTube channel details using their Google OAuth access token.
 */
export async function fetchMyYouTubeChannel(accessToken: string): Promise<YouTubeChannelProfile | null> {
  if (!accessToken) return null;

  const cacheKey = "citra_my_yt_channel_v1";
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,brandingSettings,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      console.warn("fetchMyYouTubeChannel HTTP status:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const channelId = item.id || "";
    const title = item.snippet?.title || "My YouTube Channel";
    const rawHandle = item.snippet?.customUrl || `@${title.toLowerCase().replace(/\s+/g, "_")}`;
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
    const description = item.snippet?.description || "";
    const avatar =
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
    const banner =
      item.brandingSettings?.image?.bannerExternalUrl ||
      "linear-gradient(to right, #f59e0b, #e11d48, #4f46e5)";
    const subscribersCount = parseInt(item.statistics?.subscriberCount || "0", 10);
    const videoCount = parseInt(item.statistics?.videoCount || "0", 10);
    const uploadsPlaylistId =
      item.contentDetails?.relatedPlaylists?.uploads ||
      (channelId.startsWith("UC") ? "UU" + channelId.substring(2) : "");

    const profile: YouTubeChannelProfile = {
      channelId,
      title,
      handle,
      description,
      avatar,
      banner,
      subscribersCount,
      videoCount,
      uploadsPlaylistId,
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: profile }));
      } catch {}
    }

    return profile;
  } catch (err) {
    console.error("fetchMyYouTubeChannel exception:", err);
    return null;
  }
}

/**
 * Fetches all videos uploaded by the authenticated user on their YouTube channel.
 */
export async function fetchMyYouTubeVideos(accessToken: string, force = false): Promise<Video[]> {
  if (!accessToken) return [];

  const cacheKey = "citra_my_yt_videos_v1";
  if (!force && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {}
  }

  try {
    const channelProfile = await fetchMyYouTubeChannel(accessToken);
    let uploadsPlaylistId = channelProfile?.uploadsPlaylistId || "";
    const channelId = channelProfile?.channelId || "";
    const channelTitle = channelProfile?.title || "Creator";
    const channelAvatar = channelProfile?.avatar || "";

    if (!uploadsPlaylistId && channelId.startsWith("UC")) {
      uploadsPlaylistId = "UU" + channelId.substring(2);
    }

    let videoIds: string[] = [];

    // 1. Try fetching from uploads playlist
    if (uploadsPlaylistId) {
      try {
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );
        if (plRes.ok) {
          const plJson = await plRes.json();
          const items = plJson.items || [];
          videoIds = items
            .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("Could not load from uploads playlist, trying fallback:", e);
      }
    }

    // 2. Fallback: Search for user's own videos if playlistItems didn't return any
    if (videoIds.length === 0) {
      try {
        const searchUrl = channelId
          ? `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet&order=date&maxResults=50&type=video`
          : "https://www.googleapis.com/youtube/v3/search?forMine=true&part=snippet&order=date&maxResults=50&type=video";
        const sRes = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          const items = sJson.items || [];
          videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean);
        }
      } catch (e) {
        console.warn("Could not search for user uploads:", e);
      }
    }

    if (videoIds.length === 0) return [];

    // 3. Batch query video details
    const videoDetailsPromises: Promise<any[]>[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      videoDetailsPromises.push(
        fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(",")}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        )
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .then((json) => json.items || [])
          .catch(() => [])
      );
    }

    const videoDetailsResults = await Promise.all(videoDetailsPromises);
    const videoItems = videoDetailsResults.flat();

    const cleanVideos: Video[] = [];

    for (const item of videoItems) {
      const title = item.snippet?.title || "";
      const description = item.snippet?.description || "";
      const rawDuration = item.contentDetails?.duration || "";
      const durationSeconds = parseISO8601Duration(rawDuration);
      const effectiveChannelTitle = item.snippet?.channelTitle || channelTitle || "Creator";
      const avatar =
        channelAvatar ||
        item.snippet?.thumbnails?.default?.url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      const tags = item.snippet?.tags || ["youtube", "my-upload"];
      const categoryId = item.snippet?.categoryId;

      const { contentType, productivityScore } = classifyVideoContent(
        title,
        description,
        tags,
        effectiveChannelTitle,
        categoryId
      );

      const vid: Video = {
        id: item.id,
        title,
        description,
        driveFileId: item.id,
        driveUrl: `https://www.youtube.com/watch?v=${item.id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`,
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        uploaderUid: channelId || item.snippet?.channelId || "my_channel",
        uploaderName: effectiveChannelTitle,
        uploaderAvatar: avatar,
        uploaderHandle: effectiveChannelTitle.toLowerCase().replace(/\s+/g, "_"),
        category: determineVideoCategory(categoryId, title, description, tags, effectiveChannelTitle),
        tags,
        views: parseInt(item.statistics?.viewCount || "0", 10),
        likesCount: parseInt(item.statistics?.likeCount || "0", 10),
        dislikesCount: 0,
        commentsCount: parseInt(item.statistics?.commentCount || "0", 10),
        duration: formatDurationSeconds(durationSeconds),
        createdAt: item.snippet?.publishedAt || new Date().toISOString(),
        contentType,
        productivityScore,
      };

      cleanVideos.push(vid);
    }

    cleanVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (typeof window !== "undefined" && cleanVideos.length > 0) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: cleanVideos }));
      } catch {}
    }

    return cleanVideos;
  } catch (err) {
    console.error("fetchMyYouTubeVideos error:", err);
    return [];
  }
}

/**
 * Fetches public channel profile details by YouTube channel ID (e.g. UC...).
 */
export async function fetchYouTubeChannelById(
  accessToken: string,
  channelId: string
): Promise<YouTubeChannelProfile | null> {
  if (!channelId) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,brandingSettings,statistics&id=${channelId}`,
      {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
          : { Accept: "application/json" },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const title = item.snippet?.title || "Creator";
    const rawHandle = item.snippet?.customUrl || `@${title.toLowerCase().replace(/\s+/g, "_")}`;
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;

    return {
      channelId: item.id || channelId,
      title,
      handle,
      description: item.snippet?.description || "",
      avatar:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      banner:
        item.brandingSettings?.image?.bannerExternalUrl ||
        "linear-gradient(to right, #f59e0b, #e11d48, #4f46e5)",
      subscribersCount: parseInt(item.statistics?.subscriberCount || "0", 10),
      videoCount: parseInt(item.statistics?.videoCount || "0", 10),
      uploadsPlaylistId:
        item.contentDetails?.relatedPlaylists?.uploads ||
        (channelId.startsWith("UC") ? "UU" + channelId.substring(2) : ""),
    };
  } catch (err) {
    console.error("fetchYouTubeChannelById error:", err);
    return null;
  }
}

