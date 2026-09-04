"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Video as VideoIcon, Sparkles, User, Info, Pencil, Trash2, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import EditChannelModal from "@/components/EditChannelModal";
import { Video, UserProfile } from "@/types";
import { fetchVideos, toggleSubscription, isChannelSubscribed, deleteVideo, fetchUserProfile } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { normalizeThumbnailUrl } from "@/lib/drive";

export default function ChannelPage() {
  const params = useParams();
  const channelId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelName, setChannelName] = useState("CodersHigh Creator");
  const [channelAvatar, setChannelAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
  const [channelHandle, setChannelHandle] = useState("codershigh");
  const [channelBanner, setChannelBanner] = useState("linear-gradient(to right, #f59e0b, #e11d48, #4f46e5)");
  const [channelBio, setChannelBio] = useState("Creator and active contributor in the CodersHigh community.");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if this is strictly the user's own channel
  const isOwnChannel = Boolean(user && user.uid && (user.uid === channelId || (!channelId && !!user)));

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all = await fetchVideos();
      const channelVideos = all.filter((v) => v.uploaderUid === channelId);
      setVideos(channelVideos);

      // Try loading custom profile for channelId OR user.uid
      const targetUid = channelId || user?.uid;
      let savedProfile: UserProfile | null = null;
      if (targetUid) {
        savedProfile = await fetchUserProfile(targetUid);
      }
      if (!savedProfile && user?.uid) {
        savedProfile = await fetchUserProfile(user.uid);
      }

      if (savedProfile) {
        if (savedProfile.displayName) setChannelName(savedProfile.displayName);
        if (savedProfile.photoURL) setChannelAvatar(normalizeThumbnailUrl(savedProfile.photoURL) || savedProfile.photoURL);
        if (savedProfile.handle) setChannelHandle(savedProfile.handle);
        if (savedProfile.bannerURL) setChannelBanner(savedProfile.bannerURL);
        if (savedProfile.bio !== undefined) setChannelBio(savedProfile.bio);
      } else if (channelVideos.length > 0) {
        setChannelName(channelVideos[0].uploaderName);
        setChannelAvatar(normalizeThumbnailUrl(channelVideos[0].uploaderAvatar) || channelVideos[0].uploaderAvatar);
        setChannelHandle(channelVideos[0].uploaderHandle);
      } else if (user) {
        setChannelName(user.displayName || "Harsh Joshi");
        setChannelAvatar(user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80");
        setChannelHandle(user.displayName?.toLowerCase().replace(/\s+/g, "_") || "harsh_joshi");
      }

      if (channelVideos.length > 0) {
        setIsSubscribed(isChannelSubscribed(channelVideos[0].uploaderHandle));
      }

      setLoading(false);
    }
    load();
  }, [channelId, user]);

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

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"? This will permanently remove the stream.`)) {
      return;
    }
    await deleteVideo(videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setChannelName(updated.displayName);
    setChannelAvatar(updated.photoURL);
    setChannelHandle(updated.handle);
    if (updated.bannerURL) setChannelBanner(updated.bannerURL);
    if (updated.bio) setChannelBio(updated.bio);
  };

  const currentProfile: UserProfile = {
    uid: channelId || user?.uid || "user_creator",
    displayName: channelName,
    email: user?.email || "",
    photoURL: channelAvatar,
    handle: channelHandle,
    bannerURL: channelBanner,
    bio: channelBio,
    subscribersCount: 0,
    joinedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f6]">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            isSidebarOpen ? "lg:ml-60" : "lg:ml-[72px]"
          } ml-0`}
        >
          {/* Dynamic Channel Banner */}
          <div
            className="relative h-44 sm:h-64 w-full overflow-hidden"
            style={{
              background: channelBanner.startsWith("http")
                ? `url(${channelBanner}) center/cover no-repeat`
                : channelBanner,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent" />
            <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-amber-300 border border-amber-500/20 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Citradhara Creator • CodersHigh</span>
            </div>
          </div>

          {/* Channel Header Profile */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10 pb-6 border-b border-[#181822]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={channelAvatar}
                  alt={channelName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                  }}
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-[#08080a] shadow-2xl bg-[#141624]"
                />

                <div className="space-y-1.5 mb-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      {channelName}
                    </h1>
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    @{channelHandle} • {videos.length} stream uploads • CodersHigh Community
                  </p>
                  {/* Channel Description Snippet in Header */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("about")}
                    className="text-left text-xs text-zinc-300 hover:text-white transition flex items-center gap-1.5 group/desc pt-0.5"
                  >
                    <span className="line-clamp-2 leading-relaxed text-zinc-300 group-hover/desc:text-zinc-100">
                      {channelBio || "Welcome to my channel on Citradhara. Click here to read full about and details."}
                    </span>
                    <span className="text-zinc-500 group-hover/desc:text-amber-400 font-semibold text-[11px] flex items-center flex-shrink-0">
                      ...more <ChevronRight className="h-3 w-3 inline ml-0.5" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mb-2">
                {/* Edit Channel Button */}
                {isOwnChannel ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-[#222230] bg-[#121218] hover:bg-[#1a1a24] px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
                  >
                    <Pencil className="h-3.5 w-3.5 text-amber-400" />
                    <span>Edit Channel</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                      isSubscribed
                        ? "bg-[#1c1c26] text-zinc-300 hover:bg-[#252533]"
                        : "bg-white text-black hover:bg-zinc-200 shadow-sm"
                    }`}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mt-6 border-t border-[#181822] pt-3">
              <button
                onClick={() => setActiveTab("videos")}
                className={`pb-2 text-xs font-semibold border-b-2 transition ${
                  activeTab === "videos"
                    ? "border-amber-400 text-amber-400 font-bold"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Streams & Videos ({videos.length})
              </button>

              <button
                onClick={() => setActiveTab("about")}
                className={`pb-2 text-xs font-semibold border-b-2 transition ${
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
                <div className="rounded-2xl border border-[#181822] bg-[#101015] p-10 text-center">
                  <VideoIcon className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No streams uploaded yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    This creator has not streamed any videos on Citradhara yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  {videos.map((v) => (
                    <div key={v.id} className="flex flex-col space-y-2 group/item">
                      <VideoCard video={v} />
                      {/* Delete Action strictly for Owner */}
                      {isOwnChannel && user && (v.uploaderUid === user.uid || v.uploaderHandle === channelHandle) && (
                        <div className="flex items-center justify-between px-1 pt-1">
                          <span className="text-[10px] text-zinc-500">{v.duration || "Stream"}</span>
                          <button
                            onClick={() => handleDeleteVideo(v.id, v.title)}
                            title="Delete this stream"
                            className="flex items-center gap-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-1 text-[11px] font-medium transition opacity-80 group-hover/item:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                {/* Description Box */}
                <div className="md:col-span-2 rounded-2xl border border-[#181822] bg-[#101015] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#181822] pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-400" />
                      About & Description
                    </h3>
                    {isOwnChannel && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium rounded-full bg-amber-400/10 px-3 py-1 transition"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit Description</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {channelBio || "This creator hasn't written a description yet. Click 'Edit Channel' above to add your bio and links."}
                  </p>
                </div>

                {/* Details Box */}
                <div className="rounded-2xl border border-[#181822] bg-[#101015] p-6 space-y-4 shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-white border-b border-[#181822] pb-3">Channel Details</h3>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="flex items-center justify-between py-1 border-b border-[#181822]">
                      <span className="text-zinc-500">Handle</span>
                      <span className="font-semibold text-amber-400">@{channelHandle}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#181822]">
                      <span className="text-zinc-500">Total Streams</span>
                      <span className="font-semibold text-white">{videos.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#181822]">
                      <span className="text-zinc-500">Community</span>
                      <span className="font-semibold text-zinc-200">CodersHigh</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-zinc-500">Platform</span>
                      <span className="font-semibold text-amber-400">Citradhara</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <EditChannelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={currentProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
