"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Play, Film, Clock, ListPlus, Check } from "lucide-react";
import { Video } from "@/types";
import { normalizeThumbnailUrl } from "@/lib/drive";
import { 
  isInWatchLater, 
  toggleWatchLater, 
  WATCH_LATER_EVENT 
} from "@/lib/playlists";
import PlaylistModal from "./PlaylistModal";

interface VideoCardProps {
  video: Video;
}

export function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

export default function VideoCard({ video }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isSavedLater, setIsSavedLater] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  useEffect(() => {
    setIsSavedLater(isInWatchLater(video.id));

    const handleUpdate = () => {
      setIsSavedLater(isInWatchLater(video.id));
    };

    window.addEventListener(WATCH_LATER_EVENT, handleUpdate);
    return () => window.removeEventListener(WATCH_LATER_EVENT, handleUpdate);
  }, [video.id]);

  let relativeTime = "recently";
  try {
    relativeTime = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });
  } catch {
    relativeTime = "recently";
  }

  const fallbackCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80";
  const cleanThumb = normalizeThumbnailUrl(video.thumbnailUrl);

  const handleToggleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const state = toggleWatchLater(video.id);
    setIsSavedLater(state);
  };

  const handleOpenPlaylist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaylistOpen(true);
  };

  return (
    <>
      <div className="group flex flex-col space-y-2.5 relative">
        {/* Minimal 16:9 Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#121218] border border-[#181822] shadow-sm">
          <Link
            href={`/watch/${video.id}`}
            className="block h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgError || !cleanThumb ? fallbackCover : cleanThumb}
              alt={video.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              loading="lazy"
            />

            {/* Fallback category badge if image had to fallback */}
            {imgError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-center">
                <Film className="h-6 w-6 text-amber-400 mb-1 opacity-80" />
                <span className="text-[11px] font-semibold text-zinc-200 line-clamp-1">
                  {video.category}
                </span>
              </div>
            )}

            {/* Minimal Play Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-md">
                <Play className="h-4 w-4 fill-black ml-0.5" />
              </div>
            </div>

            {/* Duration Badge */}
            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {video.duration || "Stream"}
            </span>

            {/* Productivity Pill Badge */}
            {video.contentType === "productive" && (
              <span className="absolute top-1.5 left-1.5 rounded-md bg-amber-500/90 text-black px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase shadow-sm backdrop-blur-sm">
                Productive
              </span>
            )}
          </Link>

          {/* Action Overlay: Watch Later & Add to Playlist Buttons */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10 transition-opacity duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100">
            {/* Watch Later Button */}
            <button
              onClick={handleToggleWatchLater}
              title={isSavedLater ? "Remove from Watch Later" : "Save to Watch Later"}
              className={`rounded-lg p-1.5 backdrop-blur-md transition shadow-md ${
                isSavedLater
                  ? "bg-amber-500 text-black font-bold"
                  : "bg-black/70 text-zinc-300 hover:bg-black/90 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
            </button>

            {/* Add to Playlist Button */}
            <button
              onClick={handleOpenPlaylist}
              title="Add to Playlist"
              className="rounded-lg bg-black/70 p-1.5 text-zinc-300 hover:bg-black/90 hover:text-white backdrop-blur-md transition shadow-md"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      {/* Video Details */}
      <div className="flex gap-2.5 px-0.5">
        <Link
          href={`/channel/${video.uploaderUid}`}
          className="shrink-0 pt-0.5 transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.uploaderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
            alt={video.uploaderName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
            }}
            className="h-8 w-8 rounded-full object-cover border border-[#1f1f2a]"
          />
        </Link>

        <div className="flex flex-col min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-zinc-100 leading-snug group-hover:text-amber-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            href={`/channel/${video.uploaderUid}`}
            className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors truncate"
          >
            <span>{video.uploaderName}</span>
            <CheckCircle2 className="h-3 w-3 text-zinc-400 shrink-0" />
          </Link>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>{formatViewCount(video.views)} views</span>
            <span>•</span>
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>
    </div>

    <PlaylistModal
      isOpen={isPlaylistOpen}
      onClose={() => setIsPlaylistOpen(false)}
      video={video}
    />
  </>
  );
}
