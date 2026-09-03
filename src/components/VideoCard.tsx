"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Play, HardDrive } from "lucide-react";
import { Video } from "@/types";

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
  let relativeTime = "recently";
  try {
    relativeTime = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });
  } catch {
    relativeTime = "recently";
  }

  return (
    <div className="group flex flex-col space-y-3">
      {/* Thumbnail Container */}
      <Link
        href={`/watch/${video.id}`}
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#151722] border border-[#212433] shadow-md transition-all duration-300 group-hover:border-amber-500/50 group-hover:shadow-amber-500/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg shadow-amber-500/30">
            <Play className="h-6 w-6 fill-black ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-xs font-semibold text-white tracking-wider backdrop-blur-sm">
          {video.duration || "Stream"}
        </span>

        {/* Google Drive indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur-sm border border-amber-500/20">
          <HardDrive className="h-3 w-3" />
          <span>G-Drive</span>
        </div>
      </Link>

      {/* Video Details */}
      <div className="flex gap-3 px-0.5">
        {/* Channel Avatar */}
        <Link
          href={`/channel/${video.uploaderUid}`}
          className="shrink-0 transition-transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.uploaderAvatar}
            alt={video.uploaderName}
            className="h-9 w-9 rounded-full object-cover border border-[#272a3b]"
          />
        </Link>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 leading-snug group-hover:text-amber-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            href={`/channel/${video.uploaderUid}`}
            className="mt-1 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors truncate"
          >
            <span>{video.uploaderName}</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
            <span>{formatViewCount(video.views)} views</span>
            <span>•</span>
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
