"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/types";
import { fetchVideos } from "@/lib/db";

export default function LikedVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allVideos = await fetchVideos();
      try {
        const raw = localStorage.getItem("citradhara_liked_video_ids");
        const likedIds: string[] = raw ? JSON.parse(raw) : [];
        const likedVideos = allVideos.filter((v) => likedIds.includes(v.id));
        setVideos(likedVideos);
      } catch {
        setVideos([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <main
          className={`flex-1 px-4 sm:px-6 py-6 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-60" : "lg:ml-[72px]"
          } ml-0`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#1f2230] pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ThumbsUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Liked Streams</h1>
              <p className="text-xs text-zinc-400">{videos.length} videos in your collection</p>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-zinc-500 py-10">Loading liked streams...</div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#141624] border border-[#23273a] text-zinc-500 mb-4">
                <ThumbsUp className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No liked streams yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6">
                Click the thumbs-up button on any video you enjoy to save it to your liked streams.
              </p>
              <Link
                href="/"
                className="rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Browse Streams
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
