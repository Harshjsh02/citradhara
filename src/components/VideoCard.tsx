"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Play, Film } from "lucide-react";
import { Video } from "@/types";
import { normalizeThumbnailUrl } from "@/lib/drive";

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

  let relativeTime = "recently";
  try {
    relativeTime = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });
  } catch {
    relativeTime = "recently";
  }

  // Fallback high-res cover if the provided thumbnail URL fails or is invalid
  const fallbackCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80";
  const cleanThumb = normalizeThumbnailUrl(video.thumbnailUrl);

  return (
    <div className="group flex flex-col space-y-2.5">
      {/* Minimal 16:9 Thumbnail */}
      <Link
        href={`/watch/${video.id}`}
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#121218] border border-[#181822] shadow-sm transition duration-300"
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
      </Link>

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
  );
}
