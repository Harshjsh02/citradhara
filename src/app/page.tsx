"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import { Video, FeedMode, Playlist } from "@/types";
import { fetchVideos } from "@/lib/db";
import { 
  YouTubeSubscription, 
  fetchUserSubscriptions, 
  fetchSubscribedLongFormVideos,
  fetchChannelLongFormVideos,
  sortVideosProductiveFirst,
  sortVideosEntertainmentFirst,
  filterProductiveOnly,
  filterEntertainmentOnly
} from "@/lib/youtubeApi";
import { 
  getWatchLaterIds, 
  getPlaylists, 
  clearWatchLater, 
  WATCH_LATER_EVENT, 
  PLAYLISTS_EVENT 
} from "@/lib/playlists";
import { useAuth } from "@/context/AuthContext";
import { 
  Sparkles, 
  Search, 
  Film, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Target, 
  Popcorn, 
  Clock3, 
  ListVideo, 
  Trash2,
  ChevronRight
} from "lucide-react";

function HomeFeed() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("search") || "";
  const { user, googleAccessToken, signInWithGoogle } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [feedMode, setFeedMode] = useState<FeedMode>("productive-first");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Deep channel videos map and loading indicator
  const [channelVideosMap, setChannelVideosMap] = useState<Record<string, Video[]>>({});
  const [channelLoading, setChannelLoading] = useState(false);

  // Watch Later & Custom Playlist States
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>([]);
  const [isWatchLaterView, setIsWatchLaterView] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isWatchLaterShelfDismissed, setIsWatchLaterShelfDismissed] = useState(false);

  useEffect(() => {
    // Sidebar stays closed by default on all screens for spacious distraction-free view
    setWatchLaterIds(getWatchLaterIds());
    setPlaylists(getPlaylists());

    const updateWatchLater = () => setWatchLaterIds(getWatchLaterIds());
    const updatePlaylists = () => setPlaylists(getPlaylists());

    window.addEventListener(WATCH_LATER_EVENT, updateWatchLater);
    window.addEventListener(PLAYLISTS_EVENT, updatePlaylists);
    return () => {
      window.removeEventListener(WATCH_LATER_EVENT, updateWatchLater);
      window.removeEventListener(PLAYLISTS_EVENT, updatePlaylists);
    };
  }, []);

  // Fetch subscriptions and long-form uploads
  useEffect(() => {
    let isCancelled = false;

    async function loadFeed() {
      setLoading(true);

      // If user has a Google access token with YouTube permissions
      if (googleAccessToken) {
        try {
          const subs = await fetchUserSubscriptions(googleAccessToken);
          if (!isCancelled) setSubscriptions(subs);

          if (subs.length > 0) {
            const ytVideos = await fetchSubscribedLongFormVideos(googleAccessToken, subs);
            if (!isCancelled) {
              if (ytVideos.length > 0) {
                setVideos(ytVideos);
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.warn("Could not load YouTube subscription feed:", err);
        }
      }

      // Fallback: load local/curated streams if not signed in or API returns empty
      const localVideos = await fetchVideos(selectedCategory, urlQuery);
      if (!isCancelled) {
        setVideos(localVideos);
        setLoading(false);
      }
    }

    loadFeed();

    return () => {
      isCancelled = true;
    };
  }, [googleAccessToken, selectedCategory, urlQuery]);

  // Fetch deep channel uploads (up to 50 long-form videos) when a channel is selected
  useEffect(() => {
    const targetChannelId = selectedChannelId;
    const token = googleAccessToken;
    if (!targetChannelId || !token) return;

    if (channelVideosMap[targetChannelId] && channelVideosMap[targetChannelId].length > 0) {
      return;
    }

    let isCancelled = false;
    async function loadChannelUploads(chId: string, tok: string) {
      setChannelLoading(true);
      try {
        const targetSub = subscriptions.find((s) => s.channelId === chId);
        const channelVids = await fetchChannelLongFormVideos(
          tok,
          chId,
          targetSub?.title,
          targetSub?.thumbnail
        );
        if (!isCancelled && channelVids.length > 0) {
          setChannelVideosMap((prev) => ({ ...prev, [chId]: channelVids }));
        }
      } catch (err) {
        console.error("Failed to load channel videos:", err);
      } finally {
        if (!isCancelled) setChannelLoading(false);
      }
    }

    loadChannelUploads(targetChannelId, token);

    return () => {
      isCancelled = true;
    };
  }, [selectedChannelId, googleAccessToken, subscriptions, channelVideosMap]);

  const handleRefreshFeed = async (isManual = false) => {
    const token = googleAccessToken;
    if (!token) return;
    if (isManual) setIsRefreshing(true);
    try {
      const targetChannelId = selectedChannelId;
      if (targetChannelId) {
        const targetSub = subscriptions.find((s) => s.channelId === targetChannelId);
        const freshChannelVids = await fetchChannelLongFormVideos(
          token,
          targetChannelId,
          targetSub?.title,
          targetSub?.thumbnail,
          true
        );
        if (freshChannelVids.length > 0) {
          setChannelVideosMap((prev) => ({ ...prev, [targetChannelId]: freshChannelVids }));
        }
      } else if (subscriptions.length > 0) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`citra_yt_feed_${token.slice(-8)}`);
        }
        const freshVideos = await fetchSubscribedLongFormVideos(token, subscriptions, true);
        if (freshVideos.length > 0) {
          setVideos(freshVideos);
        }
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  // Auto-refresh in background every 60s and on tab focus / visibility
  useEffect(() => {
    if (!googleAccessToken || subscriptions.length === 0) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleRefreshFeed(false);
      }
    }, 60000);

    const handleFocusSync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        handleRefreshFeed(false);
      }
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleFocusSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleFocusSync);
    };
  }, [googleAccessToken, subscriptions]);

  // 1. Filter base list by channel / playlist / watch-later view
  let processedVideos = [...videos];

  if (isWatchLaterView) {
    processedVideos = processedVideos.filter((v) => watchLaterIds.includes(v.id));
  } else if (selectedPlaylistId) {
    const targetPl = playlists.find((p) => p.id === selectedPlaylistId);
    if (targetPl) {
      processedVideos = processedVideos.filter((v) => targetPl.videoIds.includes(v.id));
    }
  } else if (selectedChannelId) {
    if (channelVideosMap[selectedChannelId] && channelVideosMap[selectedChannelId].length > 0) {
      processedVideos = channelVideosMap[selectedChannelId];
    } else {
      processedVideos = processedVideos.filter((v) => v.uploaderUid === selectedChannelId);
    }
  }

  // 2. Category filter
  if (selectedCategory && selectedCategory !== "All") {
    processedVideos = processedVideos.filter(
      (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // 3. Apply Feed Ordering Mode
  if (feedMode === "productive-first") {
    processedVideos = sortVideosProductiveFirst(processedVideos);
  } else if (feedMode === "only-productive") {
    processedVideos = sortVideosProductiveFirst(filterProductiveOnly(processedVideos));
  } else if (feedMode === "only-entertainment") {
    processedVideos = sortVideosEntertainmentFirst(filterEntertainmentOnly(processedVideos));
  } else if (feedMode === "newest") {
    processedVideos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 4. Search query filter
  if (urlQuery) {
    const q = urlQuery.toLowerCase();
    processedVideos = processedVideos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.uploaderName.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const selectedChannel = subscriptions.find((s) => s.channelId === selectedChannelId);
  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Watch Later videos for the top shelf
  const watchLaterVideos = videos.filter((v) => watchLaterIds.includes(v.id));

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f6]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        initialSearchQuery={urlQuery}
      />

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setIsWatchLaterView(false);
            setSelectedPlaylistId(null);
          }}
          subscriptions={subscriptions}
          selectedChannelId={selectedChannelId}
          onSelectChannel={(channelId) => {
            setSelectedChannelId(channelId);
            setIsWatchLaterView(false);
            setSelectedPlaylistId(null);
          }}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(plId) => {
            setSelectedPlaylistId(plId);
            setIsWatchLaterView(false);
            setSelectedChannelId(null);
          }}
          isWatchLaterActive={isWatchLaterView}
          onToggleWatchLaterView={() => {
            setIsWatchLaterView(!isWatchLaterView);
            setSelectedPlaylistId(null);
            setSelectedChannelId(null);
          }}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main
          className={`flex-1 min-w-0 px-4 sm:px-6 pb-16 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-60" : "lg:ml-[72px]"
          } ml-0`}
        >
          {/* Guest Welcome Banner if not signed in */}
          {!user && (
            <div className="my-5 rounded-3xl border border-[#232332] bg-gradient-to-b from-[#14141c] to-[#0c0c12] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Citradhara • Distraction-Free YouTube</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Your Subscribed Channels. Zero Shorts. No Algorithmic Noise.
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Sign in with your Google account to instantly view high-quality long-form videos exclusively from channels you already follow, prioritized by productivity.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Sign in with Google</span>
                  </button>
                  <span className="text-[11px] text-zinc-500">
                    🔒 Read-only permission • Shorts automatically filtered
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PINNED TOP WATCH LATER SHELF ==================== */}
          {watchLaterVideos.length > 0 && !isWatchLaterShelfDismissed && !isWatchLaterView && (
            <section className="mt-4 mb-6 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[#161620] to-[#0f0f15] p-4 sm:p-5 shadow-lg relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#212130]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>Watch Later Queue</span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        {watchLaterVideos.length} saved
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsWatchLaterView(true)}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsWatchLaterShelfDismissed(true)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Hide shelf"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Row of Watch Later Items */}
              <div className="mt-3.5 flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {watchLaterVideos.slice(0, 6).map((video) => (
                  <div key={`shelf-${video.id}`} className="w-56 sm:w-64 shrink-0">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ==================== TOP ACTION & FOCUS MODE BAR ==================== */}
          <div className="my-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#181822] pb-3">
            {/* Left side: Active Filter Indicator or Subscribed Feed Badge */}
            <div className="flex items-center gap-2 text-xs">
              {isWatchLaterView ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Watch Later Queue</span>
                  </span>
                  <button
                    onClick={() => setIsWatchLaterView(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : selectedPlaylist ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <ListVideo className="h-3.5 w-3.5" />
                    <span>Playlist: {selectedPlaylist.title}</span>
                  </span>
                  <button
                    onClick={() => setSelectedPlaylistId(null)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : selectedChannel ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <Film className="h-3.5 w-3.5" />
                    <span>Channel: {selectedChannel.title}</span>
                  </span>
                  <button
                    onClick={() => setSelectedChannelId(null)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : selectedCategory && selectedCategory !== "All" ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Category: {selectedCategory}</span>
                  </span>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Clear filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : urlQuery ? (
                <div className="flex items-center gap-2 text-zinc-200">
                  <Search className="h-4 w-4 text-amber-400" />
                  <span>Search: &ldquo;{urlQuery}&rdquo;</span>
                  <Link href="/" className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                    <X className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Subscribed Long-Form Feed</span>
                </span>
              )}

              <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
                • {processedVideos.length} videos
              </span>
            </div>

            {/* Right side: Focus Mode Selector Buttons & Live Auto-Sync Status */}
            <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
              {/* Mode Selector Chips: Hidden when sidebar is open! */}
              {!isSidebarOpen && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                  <button
                    onClick={() => setFeedMode("productive-first")}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      feedMode === "productive-first"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "bg-[#14141e] text-zinc-400 hover:bg-[#1c1c28] hover:text-zinc-200 border border-[#202030]"
                    }`}
                    title="Productive, educational & tech videos appear first"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>Productive First</span>
                  </button>

                  <button
                    onClick={() => setFeedMode("only-productive")}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      feedMode === "only-productive"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "bg-[#14141e] text-zinc-400 hover:bg-[#1c1c28] hover:text-zinc-200 border border-[#202030]"
                    }`}
                    title="Deep focus: hide entertainment videos completely"
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>Only Productive</span>
                  </button>

                  <button
                    onClick={() => setFeedMode("only-entertainment")}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      feedMode === "only-entertainment"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "bg-[#14141e] text-zinc-400 hover:bg-[#1c1c28] hover:text-zinc-200 border border-[#202030]"
                    }`}
                    title="Relax mode: show entertainment videos"
                  >
                    <Popcorn className="h-3.5 w-3.5" />
                    <span>Entertainment</span>
                  </button>

                  <button
                    onClick={() => setFeedMode("newest")}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      feedMode === "newest"
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "bg-[#14141e] text-zinc-400 hover:bg-[#1c1c28] hover:text-zinc-200 border border-[#202030]"
                    }`}
                    title="Standard chronological order"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>Newest First</span>
                  </button>
                </div>
              )}

              {/* Live Auto-Refresh Status & Quick Trigger */}
              {user && subscriptions.length > 0 && (
                <button
                  onClick={() => handleRefreshFeed(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 rounded-full border border-zinc-800/80 bg-[#121218] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 active:scale-95 transition"
                  title="Feed auto-refreshes every minute. Click to refresh immediately."
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-[11px] text-zinc-300">Auto-Syncing</span>
                  <RefreshCw className={`h-3 w-3 ml-0.5 text-zinc-400 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Channel Deep Loading Notification */}
          {channelLoading && selectedChannel && (
            <div className="flex items-center gap-2.5 py-3 px-4 mb-4 rounded-2xl bg-[#13131c] border border-amber-500/20 text-xs text-amber-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
              <span>Fetching all long-form uploads from <strong className="text-white font-medium">{selectedChannel.title}</strong>...</span>
            </div>
          )}

          {/* Videos Grid */}
          <div className="pt-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="animate-pulse space-y-2.5">
                    <div className="aspect-video w-full rounded-2xl bg-[#121218]" />
                    <div className="flex gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#181820]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 rounded bg-[#181820] w-4/5" />
                        <div className="h-3 rounded bg-[#121218] w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : processedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121218] border border-[#1d1d28] text-zinc-500 mb-3">
                  <Brain className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No videos in this view</h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
                  {isWatchLaterView
                    ? "Your Watch Later queue is empty. Tap the clock icon on any video to save it for later."
                    : feedMode === "only-productive"
                    ? "No productive videos found in the current filter. Try switching to 'Productive First' or 'All'."
                    : urlQuery
                    ? `No videos matched "${urlQuery}".`
                    : "Sign in with Google to sync all your subscribed channels."}
                </p>
                {isWatchLaterView ? (
                  <button
                    onClick={() => setIsWatchLaterView(false)}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 text-xs font-bold transition"
                  >
                    Back to All Subscriptions
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => signInWithGoogle()}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 text-xs font-bold transition"
                  >
                    Sign in with Google
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {processedVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>

          {/* Footer with Creator Credit */}
          <footer className="mt-20 border-t border-[#161620] py-8 text-center text-xs text-zinc-500">
            <p className="flex items-center justify-center gap-1.5 font-semibold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Citradhara • चित्रधारा</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              A Stream of Wonders — Created & Designed by{" "}
              <Link
                href="/channel/Uhwkq06XRuOHEGdrs4LbqVtoOGc2"
                className="text-amber-400 hover:text-amber-300 font-bold transition"
              >
                Harsh Joshi
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080a] flex items-center justify-center text-zinc-500 text-xs">Loading Citradhara...</div>}>
      <HomeFeed />
    </Suspense>
  );
}

