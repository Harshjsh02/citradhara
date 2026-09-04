"use client";

import React, { useState, useEffect } from "react";
import { Maximize2, ExternalLink, HardDrive, Play, Sparkles } from "lucide-react";
import { parseVideoUrl, getDriveEmbedUrl, getDriveViewUrl } from "@/lib/drive";

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

  useEffect(() => {
    try {
      localStorage.removeItem("citradhara_player_mode");
    } catch {}
  }, []);

  const details = parseVideoUrl(driveFileId);
  const isYouTube = details?.source === "youtube";
  const isDirect = details?.source === "direct" || driveFileId.endsWith(".mp4") || driveFileId.startsWith("blob:");
  const ytId = details?.id || "";

  // YouTube Embed with error 153 fix (strict-origin-when-cross-origin, rel=0, modestbranding=1, iv_load_policy=3, enablejsapi=1)
  const officialYtEmbed = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1`;

  // Active embed URL based on source
  const embedUrl = isYouTube 
    ? officialYtEmbed
    : (details?.embedUrl || getDriveEmbedUrl(driveFileId));

  const directUrl = details?.viewUrl || getDriveViewUrl(driveFileId);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-[#181822]">
      {/* 16:9 Video Container */}
      <div className={`relative w-full ${isTheater ? "aspect-[21/9] min-h-[480px]" : "aspect-video"}`}>
        {isDirect ? (
          <video
            src={embedUrl}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-contain bg-black"
          />
        ) : (
          <iframe
            key={ytId || driveFileId}
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setHasError(true)}
            className="absolute inset-0 h-full w-full border-0"
          />
        )}

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

          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={isYouTube ? "Open on YouTube" : "Open in Google Drive"}
              className="flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-black/80 transition border border-white/10"
            >
              {isYouTube ? (
                <Play className="h-3 w-3 fill-red-500 text-red-500" />
              ) : (
                <HardDrive className="h-3 w-3 text-amber-400" />
              )}
              <span className="hidden sm:inline text-[11px]">
                {isYouTube ? "YouTube Source" : "Drive Source"}
              </span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Under-player streamer banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#0c0c10] border-t border-[#181822] text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>
            Streaming via{" "}
            <strong className="text-zinc-200">
              {isYouTube 
                ? "YouTube Distraction-Free Player" 
                : isDirect 
                ? "Cloud Media Player" 
                : "Google Drive Free Storage"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-zinc-400 font-medium">
            Zero-Cost CDN
          </span>
        </div>
      </div>

      {hasError && directUrl && (
        <div className="p-4 bg-amber-500/10 border-t border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-3">
          <span>Playback issue detected with this source.</span>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-amber-500 text-black font-semibold rounded-lg text-xs hover:bg-amber-400 transition"
          >
            Open Original
          </a>
        </div>
      )}
    </div>
  );
}
