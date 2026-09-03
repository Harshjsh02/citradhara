"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoId: string;
}

export default function ShareModal({ isOpen, onClose, videoTitle, videoId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/watch/${videoId}` : `https://citradhara.vercel.app/watch/${videoId}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Watch "${videoTitle}" on Citradhara - A Stream of Wonders for CodersHigh!`);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-[#272b3e] bg-[#11131c] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#212435] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Share Wonder Stream</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#171926] p-3 text-zinc-300 hover:text-white hover:bg-[#202334] transition border border-[#242738]"
          >
            <span className="text-sm font-bold">𝕏</span>
            <span className="text-[10px]">Twitter</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#171926] p-3 text-zinc-300 hover:text-emerald-400 hover:bg-[#202334] transition border border-[#242738]"
          >
            <span className="text-sm font-bold">💬</span>
            <span className="text-[10px]">WhatsApp</span>
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#171926] p-3 text-zinc-300 hover:text-sky-400 hover:bg-[#202334] transition border border-[#242738]"
          >
            <span className="text-sm font-bold">in</span>
            <span className="text-[10px]">LinkedIn</span>
          </a>

          <a
            href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#171926] p-3 text-zinc-300 hover:text-rose-400 hover:bg-[#202334] transition border border-[#242738]"
          >
            <span className="text-sm font-bold">👽</span>
            <span className="text-[10px]">Reddit</span>
          </a>
        </div>

        {/* Copy link input */}
        <div className="mt-4 flex items-center rounded-xl border border-[#272b3c] bg-[#171926] p-1.5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent px-3 text-xs text-zinc-300 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black shadow-md hover:bg-amber-400 active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
