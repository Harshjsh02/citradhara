"use client";

import React, { useState } from "react";
import { Maximize2, ExternalLink, HardDrive, Info, Sparkles } from "lucide-react";
import { getDriveEmbedUrl, getDriveViewUrl } from "@/lib/drive";

interface VideoPlayerProps {
  driveFileId: string;
  title: string;
  isTheater?: boolean;
  onToggleTheater?: () => void;
}

export default function VideoPlayer({
  driveFileId,
  title,
  isTheater = false,
  onToggleTheater,
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const embedUrl = getDriveEmbedUrl(driveFileId);
  const directUrl = getDriveViewUrl(driveFileId);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-[#181822]">
      {/* 16:9 Video Container */}
      <div className={`relative w-full ${isTheater ? "aspect-[21/9] min-h-[480px]" : "aspect-video"}`}>
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
          className="absolute inset-0 h-full w-full border-0"
        />

        {/* Top Control Bar overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              title={isTheater ? "Default view" : "Theater mode"}
              className="flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-black/80 transition border border-white/10"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline text-[11px]">{isTheater ? "Standard" : "Theater"}</span>
            </button>
          )}

          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Drive"
            className="flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-black/80 transition border border-white/10"
          >
            <HardDrive className="h-3 w-3 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Drive Source</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Under-player G-Drive streamer banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0c0c10] border-t border-[#181822] text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>
            Streaming via <strong className="text-zinc-200">Google Drive Free Storage</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-zinc-400">Zero-Cost Cloud</span>
        </div>
      </div>

      {hasError && (
        <div className="p-4 bg-rose-500/10 border-t border-rose-500/30 text-xs text-rose-300 flex items-center gap-3">
          <Info className="h-4 w-4 shrink-0" />
          <div>
            Video not displaying? Ensure the video in Google Drive has sharing set to:{" "}
            <strong>&ldquo;Anyone with the link can view&rdquo;</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
