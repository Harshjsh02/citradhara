"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Film,
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  HelpCircle,
  UploadCloud,
  ChevronDown
} from "lucide-react";
import { CATEGORIES } from "@/types";
import { 
  parseVideoUrl,
  getDriveEmbedUrl, 
  getDriveThumbnailUrl,
  normalizeThumbnailUrl
} from "@/lib/drive";
import { addVideo } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Link & Parsed State
  const [videoInput, setVideoInput] = useState("");
  const [fileId, setFileId] = useState<string | null>(null);

  // Metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Web Development");
  const [tagsInput, setTagsInput] = useState("codershigh, tech");
  const [customThumbnail, setCustomThumbnail] = useState("");
  const [duration, setDuration] = useState("15:00");

  // UI state
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomThumbnail(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoInput(value);
    setErrorMessage("");
    const parsed = parseVideoUrl(value);
    if (parsed) {
      setFileId(parsed.id);
      if (parsed.thumbnailUrl && !customThumbnail) {
        setCustomThumbnail(parsed.thumbnailUrl);
      }
    } else {
      setFileId(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fileId) {
      setErrorMessage("Please enter a valid Google Drive or YouTube video link.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Please enter a title for your stream.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploaderUid = user?.uid || "user_community_creator";
      const uploaderName = user?.displayName || "CodersHigh Creator";
      const uploaderAvatar = user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
      const uploaderHandle = uploaderName.toLowerCase().replace(/\s+/g, "_");

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const details = parseVideoUrl(videoInput);
      const embedUrl = details?.embedUrl || getDriveEmbedUrl(fileId);
      const driveUrl = details?.viewUrl || `https://drive.google.com/file/d/${fileId}/view`;
      const thumbnail = customThumbnail.trim() 
        ? normalizeThumbnailUrl(customThumbnail.trim()) 
        : (details?.thumbnailUrl || getDriveThumbnailUrl(fileId));

      const newVideo = await addVideo({
        title: title.trim(),
        description: description.trim() || "Shared by the CodersHigh community on Citradhara - A Stream of Wonders.",
        driveFileId: fileId,
        driveUrl,
        embedUrl,
        thumbnailUrl: thumbnail,
        uploaderUid,
        uploaderName,
        uploaderHandle,
        uploaderAvatar,
        category,
        tags,
        duration: duration.trim() || "Stream",
      });

      onClose();
      router.push(`/watch/${newVideo.id}`);
    } catch (err) {
      console.error("Failed to publish video:", err);
      setErrorMessage("Something went wrong publishing your video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#272b3e] bg-[#11131c] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#212435] px-6 py-4 bg-[#141622]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stream Video to Citradhara</h2>
              <p className="text-[11px] text-amber-400">Stream directly via Google Drive or YouTube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-zinc-400 hover:bg-[#202334] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handlePublish} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-amber-400" />
                Google Drive or YouTube Link *
              </span>
              {fileId && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 normal-case font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid Link Detected
                </span>
              )}
            </label>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="Paste Google Drive share link (e.g. drive.google.com/file/d/...) or YouTube link"
              className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
              autoFocus
              required
            />
          </div>

          {/* Google Drive Quick Guide Accordion */}
          <div className="rounded-2xl border border-[#212435] bg-[#141624]/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDriveGuide(!showDriveGuide)}
              className="w-full flex items-center justify-between p-3 text-left text-xs font-medium text-zinc-400 hover:text-white transition"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                How to share a video from Google Drive (Unlimited Free Bandwidth)
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDriveGuide ? "rotate-180" : ""}`} />
            </button>

            {showDriveGuide && (
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-[#1e2130] space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                  <li>Upload your video file (MP4, WebM, MOV) to your Google Drive.</li>
                  <li>Right-click the video and choose <strong className="text-white">Share</strong> ➔ <strong className="text-white">Share</strong>.</li>
                  <li>Under General Access, set it to <strong className="text-amber-400">Anyone with the link</strong>.</li>
                  <li>Click <strong className="text-white">Copy link</strong> and paste it right above!</li>
                </ol>
                <p className="text-[11px] text-zinc-500 pt-1">
                  💡 Tip: You can also paste public or unlisted YouTube links for instant 4K/1080p streaming.
                </p>
              </div>
            )}
          </div>

          {/* Video Preview if file ID parsed */}
          {fileId && (
            <div className="rounded-2xl border border-[#262a3c] bg-black p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-amber-400" />
                Stream Preview:
              </p>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-950">
                <iframe
                  src={parseVideoUrl(videoInput)?.embedUrl || getDriveEmbedUrl(fileId)}
                  title="Preview"
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>
          )}

          {/* Video Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Stream Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterclass on Next.js 15 & System Architecture"
              className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
              required
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Duration (MM:SS)
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="15:00"
                className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Description & Topics Covered
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what this wonder stream is about, repository links, code resources..."
              className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Thumbnail Section with Live 16:9 Preview & Image File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                Thumbnail Image
              </span>
              <span className="text-[10px] text-zinc-500 font-normal normal-case">
                Upload image from computer or paste link
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl border border-[#272b3c] bg-[#161826]">
              {/* Live 16:9 Thumbnail Preview */}
              <div className="relative aspect-video w-full sm:w-48 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                {customThumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={normalizeThumbnailUrl(customThumbnail)}
                    alt="Thumbnail Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const match = customThumbnail.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/) || customThumbnail.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                      if (match && match[1]) {
                        (e.target as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${match[1]}=w1280`;
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 text-[11px] p-2 text-center">
                    <ImageIcon className="h-5 w-5 mb-1 opacity-50" />
                    <span>No thumbnail selected</span>
                  </div>
                )}
              </div>

              {/* Upload Thumbnail Button & URL Input */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={thumbInputRef}
                  onChange={handleThumbnailFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 px-3.5 py-1.5 text-xs font-semibold transition shadow-sm"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Thumbnail Image</span>
                  </button>
                  {customThumbnail && (
                    <button
                      type="button"
                      onClick={() => setCustomThumbnail("")}
                      className="text-xs text-zinc-400 hover:text-rose-400 transition px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customThumbnail.startsWith("data:image/") ? "" : customThumbnail}
                  onChange={(e) => setCustomThumbnail(e.target.value)}
                  placeholder="Or paste image URL (Google Drive, Unsplash...)"
                  className="w-full rounded-xl border border-[#272b3c] bg-[#11131c] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="nextjs, python, fullstack"
              className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1 text-xs text-rose-300 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="font-semibold">Notice:</span>
              </div>
              <p className="leading-relaxed pl-6">{errorMessage}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#212435]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !fileId}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? "Publishing Stream..." : "Publish Stream"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
