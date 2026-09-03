"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Video as VideoIcon, Sparkles, User, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import UploadModal from "@/components/UploadModal";
import { Video } from "@/types";
import { fetchVideos, toggleSubscription, isChannelSubscribed } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

export default function ChannelPage() {
  const params = useParams();
  const channelId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelName, setChannelName] = useState("CodersHigh Creator");
  const [channelAvatar, setChannelAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
  const [channelHandle, setChannelHandle] = useState("codershigh");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnChannel = user?.uid === channelId;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all = await fetchVideos();
      const channelVideos = all.filter((v) => v.uploaderUid === channelId);
      setVideos(channelVideos);

      if (channelVideos.length > 0) {
        setChannelName(channelVideos[0].uploaderName);
        setChannelAvatar(channelVideos[0].uploaderAvatar);
        setChannelHandle(channelVideos[0].uploaderHandle);
        setIsSubscribed(isChannelSubscribed(channelVideos[0].uploaderHandle));
      } else if (isOwnChannel && user) {
        setChannelName(user.displayName || "My Channel");
        setChannelAvatar(user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80");
        setChannelHandle("my_channel");
      }

      setLoading(false);
    }
    load();
  }, [channelId, isOwnChannel, user]);

  const handleSubscribe = () => {
    const nowSubscribed = toggleSubscription(channelHandle);
    setIsSubscribed(nowSubscribed);
    if (nowSubscribed) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#e11d48", "#6366f1"],
      });
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
          className={`flex-1 min-w-0 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          {/* Channel Banner */}
          <div className="relative h-44 sm:h-64 w-full bg-gradient-to-r from-amber-600 via-rose-700 to-indigo-900 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-black/60" />
            <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-amber-300 border border-amber-500/20 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Citradhara Creator • CodersHigh</span>
            </div>
          </div>

          {/* Channel Header Profile */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10 pb-6 border-b border-[#1f2230]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={channelAvatar}
                  alt={channelName}
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-[#090a0f] shadow-2xl bg-[#141624]"
                />

                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                      {channelName}
                    </h1>
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    @{channelHandle} • {videos.length} stream uploads • CodersHigh Community
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-3 mb-2">
                {isOwnChannel ? (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                  >
                    <VideoIcon className="h-4 w-4" />
                    <span>Upload Stream</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all ${
                      isSubscribed
                        ? "bg-[#1f2233] text-zinc-300 hover:bg-[#2b2e45]"
                        : "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-500/20 hover:opacity-95"
                    }`}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mt-6 border-t border-[#1f2230] pt-3">
              <button
                onClick={() => setActiveTab("videos")}
                className={`pb-2 text-sm font-semibold border-b-2 transition ${
                  activeTab === "videos"
                    ? "border-amber-400 text-amber-400 font-bold"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Streams & Videos ({videos.length})
              </button>

              <button
                onClick={() => setActiveTab("about")}
                className={`pb-2 text-sm font-semibold border-b-2 transition ${
                  activeTab === "about"
                    ? "border-amber-400 text-amber-400 font-bold"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                About Channel
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {activeTab === "videos" ? (
              loading ? (
                <div className="text-xs text-zinc-500">Loading channel streams...</div>
              ) : videos.length === 0 ? (
                <div className="rounded-2xl border border-[#1f2230] bg-[#11131c] p-10 text-center">
                  <VideoIcon className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No streams uploaded yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                    This creator has not streamed any videos on Citradhara yet.
                  </p>
                  {isOwnChannel && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                    >
                      Upload your first stream
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              )
            ) : (
              <div className="max-w-2xl rounded-2xl border border-[#212433] bg-[#12131d] p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-400" />
                  About {channelName}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Creator and active contributor in the CodersHigh developer community. Streaming tech talks, masterclasses, and coding tutorials on Citradhara — A Stream of Wonders.
                </p>
                <div className="pt-3 border-t border-[#1f2230] text-xs text-zinc-400 space-y-1.5">
                  <p>• Total streams: <strong className="text-white">{videos.length}</strong></p>
                  <p>• Platform: <strong className="text-amber-400">Citradhara (CodersHigh)</strong></p>
                  <p>• Storage backend: <strong className="text-white">Google Drive Cloud (Free Tier)</strong></p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
