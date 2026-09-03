"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Bookmark, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  HardDrive,
  Trash2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import ShareModal from "@/components/ShareModal";
import UploadModal from "@/components/UploadModal";
import { formatViewCount } from "@/components/VideoCard";
import { Video } from "@/types";
import { 
  fetchVideoById, 
  fetchVideos, 
  incrementVideoViews, 
  toggleLikeVideo, 
  recordWatchHistory,
  toggleSaveLiked,
  isVideoLikedLocally,
  toggleSubscription,
  isChannelSubscribed,
  deleteVideo
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

export default function WatchPage() {
  const params = useParams();
  const videoId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();

  const [video, setVideo] = useState<Video | null>(null);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTheater, setIsTheater] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // User engagement states
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    async function loadData() {
      setLoading(true);
      const data = await fetchVideoById(videoId);
      if (data) {
        setVideo(data);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
        setIsLiked(isVideoLikedLocally(videoId));
        setIsSubscribed(isChannelSubscribed(data.uploaderHandle));

        // Increment views & record to history
        incrementVideoViews(videoId);
        recordWatchHistory(videoId);

        // Fetch recommendations
        const allVideos = await fetchVideos();
        const recs = allVideos.filter((v) => v.id !== videoId).slice(0, 10);
        setRecommendations(recs);
      }
      setLoading(false);
    }

    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [videoId]);

  const handleLike = async () => {
    if (!video) return;
    const nowLiked = toggleSaveLiked(video.id);
    setIsLiked(nowLiked);
    if (nowLiked) {
      setIsDisliked(false);
      const res = await toggleLikeVideo(video.id, true);
      setLikesCount(res.likes);
    } else {
      setLikesCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDislike = async () => {
    if (!video) return;
    setIsDisliked(!isDisliked);
    if (!isDisliked) {
      if (isLiked) {
        toggleSaveLiked(video.id);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
      const res = await toggleLikeVideo(video.id, false);
      setDislikesCount(res.dislikes);
    }
  };

  const handleSubscribe = () => {
    if (!video) return;
    const nowSubscribed = toggleSubscription(video.uploaderHandle);
    setIsSubscribed(nowSubscribed);

    if (nowSubscribed) {
      // Trigger wonder celebration confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#e11d48", "#6366f1"],
      });
    }
  };

  const isOwner = Boolean(user && (user.uid === video?.uploaderUid || user.email));

  const handleDeleteVideo = async () => {
    if (!video) return;
    if (window.confirm(`Are you sure you want to delete "${video.title}"? This cannot be undone.`)) {
      await deleteVideo(video.id);
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white">
        <Navbar onOpenUpload={() => setIsUploadOpen(true)} />
        <div className="max-w-7xl mx-auto p-6 animate-pulse space-y-4">
          <div className="aspect-video w-full max-w-5xl rounded-3xl bg-[#141624]" />
          <div className="h-6 w-3/4 rounded bg-[#1e2135]" />
          <div className="h-4 w-1/2 rounded bg-[#171928]" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white">
        <Navbar onOpenUpload={() => setIsUploadOpen(true)} />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-2xl font-bold mb-2">Wonder Stream Not Found</h2>
          <p className="text-zinc-400 text-sm mb-6">The requested video may have been moved or removed.</p>
          <Link
            href="/"
            className="rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
          >
            Back to Home Feed
          </Link>
        </div>
      </div>
    );
  }

  let relativeTime = "recently";
  try {
    relativeTime = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });
  } catch {
    relativeTime = "recently";
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6]">
      {/* Top Navbar */}
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

      {/* Main Watch Layout */}
      <div className="max-w-[1700px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Player & Details Column (8 cols in standard, 12 in theater) */}
          <div className={isTheater ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-8 space-y-4"}>
            {/* Embedded Player */}
            <VideoPlayer
              driveFileId={video.driveFileId}
              title={video.title}
              isTheater={isTheater}
              onToggleTheater={() => setIsTheater(!isTheater)}
            />

            {/* Video Title */}
            <div className="pt-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {video.title}
              </h1>
            </div>

            {/* Video Action Bar & Channel Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[#1f2230]">
              {/* Channel Details */}
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.uploaderUid}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.uploaderAvatar}
                    alt={video.uploaderName}
                    className="h-11 w-11 rounded-full object-cover border border-[#272a3b] hover:ring-2 hover:ring-amber-500 transition"
                  />
                </Link>

                <div>
                  <Link
                    href={`/channel/${video.uploaderUid}`}
                    className="flex items-center gap-1.5 font-bold text-white hover:text-amber-400 transition"
                  >
                    <span>{video.uploaderName}</span>
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  </Link>
                  <p className="text-xs text-zinc-400">
                    @{video.uploaderHandle} • CodersHigh Creator
                  </p>
                </div>

                <button
                  onClick={handleSubscribe}
                  className={`ml-3 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isSubscribed
                      ? "bg-[#1c1c26] text-zinc-300 hover:bg-[#252533] hover:text-white"
                      : "bg-white text-black hover:bg-zinc-200 shadow-sm"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              {/* Action Buttons (Like, Dislike, Share) */}
              <div className="flex items-center gap-2">
                {/* Like / Dislike Pill */}
                <div className="flex items-center rounded-full bg-[#121218] border border-[#1e1e28] overflow-hidden">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition ${
                      isLiked
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-zinc-300 hover:bg-[#1a1a24] hover:text-white"
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-amber-400" : ""}`} />
                    <span>{likesCount > 0 ? formatViewCount(likesCount) : "Like"}</span>
                  </button>

                  <div className="h-3.5 w-[1px] bg-[#22222e]" />

                  <button
                    onClick={handleDislike}
                    className={`px-2.5 py-1.5 text-xs transition ${
                      isDisliked
                        ? "text-rose-400 bg-rose-500/10"
                        : "text-zinc-300 hover:bg-[#1a1a24] hover:text-white"
                    }`}
                  >
                    <ThumbsDown className={`h-3.5 w-3.5 ${isDisliked ? "fill-rose-400" : ""}`} />
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[#121218] border border-[#1e1e28] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-[#1a1a24] hover:text-white transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>

                {/* Direct Google Drive Link */}
                <a
                  href={video.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#121218] border border-[#1e1e28] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-[#1a1a24] hover:text-white transition"
                >
                  <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                  <span>Drive</span>
                </a>
              </div>
            </div>

            {/* Expandable Description Box */}
            <div className="rounded-2xl border border-[#1c1c26] bg-[#0f0f14] p-3.5 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 font-medium text-zinc-300 mb-2">
                <span>{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{relativeTime}</span>
                <span className="rounded-md bg-[#1a1a24] border border-[#252534] px-2 py-0.5 text-zinc-300 text-[11px]">
                  {video.category}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Text Description */}
              <p className={`text-zinc-300 leading-relaxed whitespace-pre-line ${!isDescExpanded ? "line-clamp-3" : ""}`}>
                {video.description}
              </p>

              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-2 flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition text-[11px]"
              >
                <span>{isDescExpanded ? "Show less" : "...more"}</span>
                {isDescExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Comment Section */}
            <CommentSection videoId={video.id} />
          </div>

          {/* Up Next / Recommendations Column */}
          <div className={isTheater ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-4 space-y-4"}>
            <div className="flex items-center justify-between border-b border-[#1f2230] pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Wonders to Explore Next</span>
              </h3>
              <span className="text-[11px] text-zinc-500">CodersHigh Stream</span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => {
                let recTime = "recently";
                try {
                  recTime = formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true });
                } catch {
                  recTime = "recently";
                }

                return (
                  <Link
                    key={rec.id}
                    href={`/watch/${rec.id}`}
                    className="group flex gap-3 rounded-xl p-1.5 hover:bg-[#151724] transition border border-transparent hover:border-[#222638]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-[#181a28]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rec.thumbnailUrl}
                        alt={rec.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {rec.duration || "Stream"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <h4 className="line-clamp-2 text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                          {rec.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-zinc-400 truncate flex items-center gap-1">
                          <span>{rec.uploaderName}</span>
                          <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                        </p>
                      </div>

                      <div className="text-[10px] text-zinc-500">
                        <span>{formatViewCount(rec.views)} views</span> • <span>{recTime}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        videoTitle={video.title}
        videoId={video.id}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
