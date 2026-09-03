"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Trash2, Video as VideoIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import UploadModal from "@/components/UploadModal";
import { Video } from "@/types";
import { fetchVideos, getWatchHistoryIds } from "@/lib/db";

export default function HistoryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const allVideos = await fetchVideos();
      const historyIds = getWatchHistoryIds();
      const historyVideos = historyIds
        .map((id) => allVideos.find((v) => v.id === id))
        .filter(Boolean) as Video[];
      setVideos(historyVideos);
      setLoading(false);
    }
    load();
  }, []);

  const clearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("citradhara_history_video_ids");
      setVideos([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`flex-1 px-4 sm:px-6 py-6 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1f2230] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Watch History</h1>
                <p className="text-xs text-zinc-400">Streams of wonder you previously watched</p>
              </div>
            </div>

            {videos.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-xs text-zinc-500 py-10">Loading history...</div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#141624] border border-[#23273a] text-zinc-500 mb-4">
                <History className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Your watch history is empty</h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6">
                Start exploring coding streams, AI wonder showcases, and tutorials on Citradhara.
              </p>
              <Link
                href="/"
                className="rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Explore Streams
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

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
