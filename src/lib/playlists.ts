/**
 * Playlists & Watch Later Management Store
 * Manages user's watch later queue and custom playlists with reactive browser events.
 */

import { Playlist } from "@/types";

const WATCH_LATER_KEY = "citradhara_watch_later_ids";
const PLAYLISTS_KEY = "citradhara_custom_playlists";

export const WATCH_LATER_EVENT = "citra_watch_later_change";
export const PLAYLISTS_EVENT = "citra_playlists_change";

function notifyWatchLater() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WATCH_LATER_EVENT));
  }
}

function notifyPlaylists() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLAYLISTS_EVENT));
  }
}

// ==================== WATCH LATER ====================

export function getWatchLaterIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_LATER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isInWatchLater(videoId: string): boolean {
  if (!videoId || typeof window === "undefined") return false;
  const ids = getWatchLaterIds();
  return ids.includes(videoId);
}

export function toggleWatchLater(videoId: string): boolean {
  if (!videoId || typeof window === "undefined") return false;
  try {
    const ids = getWatchLaterIds();
    const exists = ids.includes(videoId);
    let updated: string[];
    if (exists) {
      updated = ids.filter((id) => id !== videoId);
    } else {
      // Add to front of watch later list
      updated = [videoId, ...ids.filter((id) => id !== videoId)];
    }
    localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(updated));
    notifyWatchLater();
    return !exists;
  } catch (err) {
    console.error("Failed to toggle watch later:", err);
    return false;
  }
}

export function removeFromWatchLater(videoId: string): void {
  if (!videoId || typeof window === "undefined") return;
  try {
    const ids = getWatchLaterIds();
    const updated = ids.filter((id) => id !== videoId);
    localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(updated));
    notifyWatchLater();
  } catch (err) {
    console.error("Failed to remove from watch later:", err);
  }
}

export function clearWatchLater(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WATCH_LATER_KEY);
  notifyWatchLater();
}

// ==================== CUSTOM PLAYLISTS ====================

export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function createPlaylist(title: string, description?: string): Playlist {
  const newPlaylist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    description: description?.trim() || "",
    videoIds: [],
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const lists = getPlaylists();
      lists.unshift(newPlaylist);
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(lists));
      notifyPlaylists();
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  }

  return newPlaylist;
}

export function deletePlaylist(playlistId: string): void {
  if (typeof window === "undefined") return;
  try {
    const lists = getPlaylists();
    const updated = lists.filter((p) => p.id !== playlistId);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
    notifyPlaylists();
  } catch (err) {
    console.error("Failed to delete playlist:", err);
  }
}

export function addVideoToPlaylist(playlistId: string, videoId: string): boolean {
  if (typeof window === "undefined" || !playlistId || !videoId) return false;
  try {
    const lists = getPlaylists();
    const target = lists.find((p) => p.id === playlistId);
    if (!target) return false;

    if (!target.videoIds.includes(videoId)) {
      target.videoIds.unshift(videoId);
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(lists));
      notifyPlaylists();
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to add video to playlist:", err);
    return false;
  }
}

export function removeVideoFromPlaylist(playlistId: string, videoId: string): void {
  if (typeof window === "undefined" || !playlistId || !videoId) return;
  try {
    const lists = getPlaylists();
    const target = lists.find((p) => p.id === playlistId);
    if (!target) return;

    target.videoIds = target.videoIds.filter((id) => id !== videoId);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(lists));
    notifyPlaylists();
  } catch (err) {
    console.error("Failed to remove video from playlist:", err);
  }
}

export function isVideoInPlaylist(playlistId: string, videoId: string): boolean {
  if (typeof window === "undefined" || !playlistId || !videoId) return false;
  const lists = getPlaylists();
  const target = lists.find((p) => p.id === playlistId);
  return target ? target.videoIds.includes(videoId) : false;
}
