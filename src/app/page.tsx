"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CategoryChips from "@/components/CategoryChips";
import VideoCard from "@/components/VideoCard";
import UploadModal from "@/components/UploadModal";
import { Video } from "@/types";
import { fetchVideos } from "@/lib/db";
import { Sparkles, Video as VideoIcon, Search } from "lucide-react";

function HomeFeed() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("search") || "";

  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchVideos(selectedCategory, urlQuery);
      setVideos(data);
      setLoading(false);
    }
    load();
  }, [selectedCategory, urlQuery]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6]">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUpload={() => setIsUploadOpen(true)}
        initialSearchQuery={urlQuery}
      />

      {/* Main Layout */}
      <div className="flex">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Content Area */}
        <main
          className={`flex-1 min-w-0 px-4 sm:px-6 pb-16 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          {/* Category Chips Bar */}
          <CategoryChips
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat)}
          />

          {/* Hero Wonder Banner (on 'All' with no search query) */}
          {selectedCategory === "All" && !urlQuery && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 p-6 sm:p-8 my-4 shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Citradhara • CodersHigh Community</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  A Stream of Wonders
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Stream, share, and discover high-impact coding tutorials, tech cinema, system design, and AI streams. 100% free hosting powered by Vercel and Google Drive cloud.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
                  >
                    <VideoIcon className="h-4 w-4" />
                    <span>Upload Stream (Free Drive)</span>
                  </button>
                  <a
                    href="#explore-grid"
                    className="rounded-full border border-[#2c2f42] bg-[#141622] px-5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#1d2030] transition"
                  >
                    Browse Wonders
                  </a>
                </div>
              </div>

              {/* Background gradient decorative shapes */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-32 -mb-16 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
            </div>
          )}

          {/* Search Query header */}
          {urlQuery && (
            <div className="py-4 flex items-center justify-between border-b border-[#1f2230] mb-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-semibold text-zinc-200">
                  Search results for: <span className="text-amber-400 font-bold">&ldquo;{urlQuery}&rdquo;</span>
                </h2>
              </div>
              <span className="text-xs text-zinc-500">{videos.length} videos found</span>
            </div>
          )}

          {/* Videos Grid */}
          <div id="explore-grid" className="pt-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse space-y-3">
                    <div className="aspect-video w-full rounded-2xl bg-[#171926]" />
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#1e2133]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded bg-[#1e2133] w-5/6" />
                        <div className="h-3 rounded bg-[#171926] w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#161824] border border-[#262a3c] text-zinc-500 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No Wonder Streams Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-6">
                  {urlQuery
                    ? `No streams matched "${urlQuery}". Try different keywords or browse all categories.`
                    : `No videos found in "${selectedCategory}". Be the first to add one!`}
                </p>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                >
                  Upload a Stream
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400">Loading Citradhara...</div>}>
      <HomeFeed />
    </Suspense>
  );
}
