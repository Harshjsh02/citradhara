"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CategoryChips from "@/components/CategoryChips";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/types";
import { fetchVideos } from "@/lib/db";
import { 
  YouTubeSubscription, 
  fetchUserSubscriptions, 
  fetchSubscribedLongFormVideos 
} from "@/lib/youtubeApi";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Search, ShieldCheck, Film, X, RefreshCw, CheckCircle2 } from "lucide-react";

function HomeFeed() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("search") || "";
  const { user, googleAccessToken, signInWithGoogle } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
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

  const handleRefreshFeed = async () => {
    if (!googleAccessToken || subscriptions.length === 0) return;
    setIsRefreshing(true);
    try {
      // Clear session cache for fresh data
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`citra_yt_feed_${googleAccessToken.slice(-8)}`);
      }
      const freshVideos = await fetchSubscribedLongFormVideos(googleAccessToken, subscriptions);
      if (freshVideos.length > 0) {
        setVideos(freshVideos);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter videos by selected channel or search query
  const displayedVideos = videos.filter((v) => {
    if (selectedChannelId && v.uploaderUid !== selectedChannelId) {
      return false;
    }
    if (urlQuery) {
      const q = urlQuery.toLowerCase();
      const matches =
        v.title.toLowerCase().includes(q) ||
        v.uploaderName.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const selectedChannel = subscriptions.find((s) => s.channelId === selectedChannelId);

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
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          subscriptions={subscriptions}
          selectedChannelId={selectedChannelId}
          onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main
          className={`flex-1 min-w-0 px-4 sm:px-6 pb-16 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-60" : "lg:ml-16"
          }`}
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
                  Sign in with your Google account to instantly view high-quality long-form videos exclusively from channels you already follow.
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

          {/* Feed Info Bar: Filter Status / Channel Details */}
          {user && (
            <div className="pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#181822] mb-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Film className="h-4 w-4 text-amber-400" />
                  {selectedChannel ? (
                    <span className="flex items-center gap-1.5">
                      <span>Channel:</span>
                      <span className="text-amber-400 font-bold">{selectedChannel.title}</span>
                      <button
                        onClick={() => setSelectedChannelId(null)}
                        className="ml-1 p-0.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Clear channel filter"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span>All Subscribed Channels (Long-Form Only)</span>
                  )}
                </div>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {displayedVideos.length} videos
                </span>
              </div>

              {subscriptions.length > 0 && (
                <button
                  onClick={handleRefreshFeed}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#121218] px-3 py-1 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  title="Refresh latest uploads"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                  <span>Refresh</span>
                </button>
              )}
            </div>
          )}

          {/* Search Query header */}
          {urlQuery && (
            <div className="py-2.5 flex items-center justify-between border-b border-[#181822] mb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-medium text-zinc-200">
                  Search results for: <span className="text-white font-semibold">&ldquo;{urlQuery}&rdquo;</span>
                </h2>
              </div>
              <span className="text-xs text-zinc-500">{displayedVideos.length} results</span>
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
            ) : displayedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121218] border border-[#1d1d28] text-zinc-500 mb-3">
                  <Film className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No videos found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
                  {selectedChannelId
                    ? "No long-form videos found for this channel right now."
                    : urlQuery
                    ? `No videos matched "${urlQuery}".`
                    : "Sign in with Google to sync all your subscribed channels and watch their latest uploads."}
                </p>
                {!user && (
                  <button
                    onClick={() => signInWithGoogle()}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 text-xs font-bold transition"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {displayedVideos.map((video) => (
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

