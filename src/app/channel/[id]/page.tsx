"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Video as VideoIcon, Sparkles, User, Info, Pencil, Trash2, ChevronRight, RefreshCw, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import EditChannelModal from "@/components/EditChannelModal";
import { Video, UserProfile } from "@/types";
import { fetchVideos, toggleSubscription, isChannelSubscribed, deleteVideo, fetchUserProfile } from "@/lib/db";
import { 
  fetchMyYouTubeChannel, 
  fetchMyYouTubeVideos, 
  fetchYouTubeChannelById, 
  fetchChannelLongFormVideos, 
  fetchUserSubscriptions, 
  YouTubeSubscription, 
  YouTubeChannelProfile 
} from "@/lib/youtubeApi";
import { useAuth } from "@/context/AuthContext";
import { normalizeThumbnailUrl } from "@/lib/drive";

export default function ChannelPage() {
  const params = useParams();
  const channelId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { user, googleAccessToken, signInWithGoogle } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [channelName, setChannelName] = useState("The JoyBoy Journal");
  const [channelAvatar, setChannelAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
  const [channelHandle, setChannelHandle] = useState("thejoyboyjournal");
  const [channelBanner, setChannelBanner] = useState("linear-gradient(to right, #f59e0b, #e11d48, #4f46e5)");
  const [channelBio, setChannelBio] = useState("Creator and active contributor in the CodersHigh community.");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ytProfile, setYtProfile] = useState<YouTubeChannelProfile | null>(null);

  // Check if this is strictly the user's own channel
  const isOwnChannel = Boolean(user && user.uid && (user.uid === channelId || (!channelId && !!user)));

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);

      // 1. Fetch user subscriptions if access token is available so sidebar is populated
      if (googleAccessToken) {
        try {
          const subs = await fetchUserSubscriptions(googleAccessToken);
          if (!isCancelled) setSubscriptions(subs);
        } catch (err) {
          console.warn("Could not load subscriptions on channel page:", err);
        }
      }

      // 2. Fetch local/database videos for this channel
      const all = await fetchVideos();
      const localChannelVideos = all.filter(
        (v) => v.uploaderUid === channelId || (isOwnChannel && user && v.uploaderUid === user.uid)
      );

      // 3. Try loading custom saved profile for channelId OR user.uid
      const targetUid = channelId || user?.uid;
      let savedProfile: UserProfile | null = null;
      if (targetUid) {
        savedProfile = await fetchUserProfile(targetUid);
      }
      if (!savedProfile && user?.uid) {
        savedProfile = await fetchUserProfile(user.uid);
      }

      // 4. Fetch YouTube uploads!
      let ytVideos: Video[] = [];

      if (isOwnChannel && googleAccessToken) {
        try {
          const myYtChannel = await fetchMyYouTubeChannel(googleAccessToken);
          if (myYtChannel && !isCancelled) {
            setYtProfile(myYtChannel);

            // Populate profile details from YouTube if saved profile doesn't have custom values
            if (!savedProfile?.displayName) setChannelName(myYtChannel.title);
            if (!savedProfile?.handle) setChannelHandle(myYtChannel.handle.replace(/^@/, ""));
            if (!savedProfile?.photoURL && myYtChannel.avatar) setChannelAvatar(myYtChannel.avatar);
            if ((!savedProfile?.bannerURL || savedProfile.bannerURL.includes("gradient")) && myYtChannel.banner) {
              setChannelBanner(myYtChannel.banner);
            }
            if (!savedProfile?.bio && myYtChannel.description) setChannelBio(myYtChannel.description);
          }

          const uploadedVids = await fetchMyYouTubeVideos(googleAccessToken);
          if (!isCancelled) {
            ytVideos = uploadedVids;
          }
        } catch (err) {
          console.warn("Error fetching user's own YouTube channel videos:", err);
        }
      } else if (channelId && channelId.startsWith("UC")) {
        try {
          const publicChannel = await fetchYouTubeChannelById(googleAccessToken || "", channelId);
          if (publicChannel && !isCancelled) {
            setYtProfile(publicChannel);
            setChannelName(publicChannel.title);
            setChannelHandle(publicChannel.handle.replace(/^@/, ""));
            if (publicChannel.avatar) setChannelAvatar(publicChannel.avatar);
            if (publicChannel.banner) setChannelBanner(publicChannel.banner);
            if (publicChannel.description) setChannelBio(publicChannel.description);
          }

          const chVids = await fetchChannelLongFormVideos(
            googleAccessToken || "",
            channelId,
            publicChannel?.title,
            publicChannel?.avatar,
            false,
            true
          );
          if (!isCancelled) {
            ytVideos = chVids;
          }
        } catch (err) {
          console.warn("Error fetching public YouTube channel:", err);
        }
      }

      // Apply saved profile overrides
      if (savedProfile) {
        if (savedProfile.displayName) setChannelName(savedProfile.displayName);
        if (savedProfile.photoURL) setChannelAvatar(normalizeThumbnailUrl(savedProfile.photoURL) || savedProfile.photoURL);
        if (savedProfile.handle) setChannelHandle(savedProfile.handle);
        if (savedProfile.bannerURL) setChannelBanner(savedProfile.bannerURL);
        if (savedProfile.bio !== undefined) setChannelBio(savedProfile.bio);
      } else if (!isOwnChannel && localChannelVideos.length > 0) {
        setChannelName(localChannelVideos[0].uploaderName);
        setChannelAvatar(normalizeThumbnailUrl(localChannelVideos[0].uploaderAvatar) || localChannelVideos[0].uploaderAvatar);
        setChannelHandle(localChannelVideos[0].uploaderHandle);
      } else if (user && isOwnChannel && (!channelName || channelName === "CodersHigh Creator")) {
        setChannelName(user.displayName || "Harsh Joshi");
        setChannelAvatar(user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80");
        setChannelHandle(user.displayName?.toLowerCase().replace(/\s+/g, "_") || "harsh_joshi");
      }

      // Combine YouTube videos and local videos (avoiding duplicates)
      const combinedVideos = [...ytVideos];
      for (const lv of localChannelVideos) {
        if (!combinedVideos.some((y) => y.id === lv.id)) {
          combinedVideos.push(lv);
        }
      }

      if (!isCancelled) {
        setVideos(combinedVideos);
        if (combinedVideos.length > 0) {
          setIsSubscribed(isChannelSubscribed(combinedVideos[0].uploaderHandle));
        }
        setLoading(false);
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [channelId, user, googleAccessToken, isOwnChannel]);

  const handleSyncYouTube = async () => {
    if (!googleAccessToken) {
      await signInWithGoogle();
      return;
    }
    setIsSyncing(true);
    try {
      const myYtChannel = await fetchMyYouTubeChannel(googleAccessToken);
      if (myYtChannel) {
        setYtProfile(myYtChannel);
        setChannelName(myYtChannel.title);
        setChannelHandle(myYtChannel.handle.replace(/^@/, ""));
        if (myYtChannel.avatar) setChannelAvatar(myYtChannel.avatar);
        if (myYtChannel.banner) setChannelBanner(myYtChannel.banner);
        if (myYtChannel.description) setChannelBio(myYtChannel.description);
      }
      const refreshed = await fetchMyYouTubeVideos(googleAccessToken, true);
      if (refreshed.length > 0) {
        setVideos(refreshed);
      }
    } catch (err) {
      console.error("Failed to sync YouTube uploads:", err);
    } finally {
      setIsSyncing(false);
    }
  };

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
        <Sidebar 
          isOpen={isSidebarOpen} 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          onClose={() => setIsSidebarOpen(false)} 
          subscriptions={subscriptions}
          onSelectChannel={(chId) => {
            if (chId) router.push(`/channel/${chId}`);
            else router.push("/");
          }}
          onSelectCategory={(cat) => {
            router.push(`/?category=${encodeURIComponent(cat)}`);
          }}
        />

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
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                {isOwnChannel ? (
                  <>
                    {googleAccessToken ? (
                      <button
                        onClick={handleSyncYouTube}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition shadow-sm"
                        title="Sync uploaded videos from your YouTube channel"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing..." : "Sync YouTube"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => signInWithGoogle()}
                        className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition shadow-sm"
                        title="Sign in with Google to sync your YouTube channel uploads"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Connect YouTube</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-full border border-[#222230] bg-[#121218] hover:bg-[#1a1a24] px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition shadow-sm"
                    >
                      <Pencil className="h-3.5 w-3.5 text-amber-400" />
                      <span>Edit Channel</span>
                    </button>
                  </>
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
                  <h3 className="text-base font-bold text-white mb-1">No uploads found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
                    {isOwnChannel
                      ? googleAccessToken
                        ? "We couldn't find any uploaded videos on this YouTube channel. If you just uploaded a video, click sync below to refresh."
                        : "Connect your Google account to automatically load and display your YouTube channel's uploaded videos."
                      : "This creator has not streamed any videos on Citradhara yet."}
                  </p>
                  {isOwnChannel && (
                    googleAccessToken ? (
                      <button
                        onClick={handleSyncYouTube}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-bold shadow-lg transition active:scale-95"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>{isSyncing ? "Syncing Uploads..." : "Sync from YouTube"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => signInWithGoogle()}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-bold shadow-lg transition active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Sign in with Google</span>
                      </button>
                    )
                  )}
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
