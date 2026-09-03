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
import { Sparkles, Search } from "lucide-react";

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
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f6]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUpload={() => setIsUploadOpen(true)}
        initialSearchQuery={urlQuery}
      />

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        <main
          className={`flex-1 min-w-0 px-4 sm:px-6 pb-16 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-60" : "lg:ml-16"
          }`}
        >
          {/* Category Pills Bar */}
          <CategoryChips
            selected={selectedCategory}
            onSelect={(cat) => setSelectedCategory(cat)}
          />

          {/* Search Query header */}
          {urlQuery && (
            <div className="py-3 flex items-center justify-between border-b border-[#181822] mb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-medium text-zinc-200">
                  Search results for: <span className="text-white font-semibold">&ldquo;{urlQuery}&rdquo;</span>
                </h2>
              </div>
              <span className="text-xs text-zinc-500">{videos.length} streams</span>
            </div>
          )}

          {/* Videos Grid */}
          <div className="pt-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse space-y-2.5">
                    <div className="aspect-video w-full rounded-xl bg-[#121218]" />
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
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#121218] border border-[#1d1d28] text-zinc-500 mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No streams found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-5">
                  {urlQuery
                    ? `No streams matched "${urlQuery}". Try different search terms or categories.`
                    : `No streams in "${selectedCategory}". Be the first to upload one!`}
                </p>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="rounded-full bg-white text-black px-5 py-2 text-xs font-semibold hover:bg-zinc-200 transition"
                >
                  Upload Stream
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
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
