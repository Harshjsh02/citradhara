"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  UploadCloud, 
  HardDrive, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Film,
  FileVideo,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Code,
  ExternalLink
} from "lucide-react";
import { CATEGORIES } from "@/types";
import { 
  parseVideoUrl,
  extractDriveFileId, 
  getDriveEmbedUrl, 
  getDriveThumbnailUrl,
  normalizeThumbnailUrl,
  DEFAULT_COMMUNITY_FOLDER_URL
} from "@/lib/drive";
import { uploadVideoFileToDrive, DriveUploadProgress } from "@/lib/driveUpload";
import { addVideo } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Upload Method Tab: 'file' | 'link'
  const [uploadMethod, setUploadMethod] = useState<"file" | "link">("file");

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<DriveUploadProgress | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // Drive Link & Parsed State
  const [driveInput, setDriveInput] = useState("");
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

  const extractThumbnailFromVideo = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        video.onloadedmetadata = () => {
          // Seek past initial black fade (usually 3 to 5 seconds into the video)
          const target = video.duration && video.duration > 10
            ? Math.min(4.0, video.duration * 0.15)
            : Math.min(2.0, (video.duration || 4) / 2);
          video.currentTime = target;
        };

        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
          URL.revokeObjectURL(url);
          resolve("");
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve("");
        };
      } catch {
        resolve("");
      }
    });
  };

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto populate title from filename
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    if (!title) {
      setTitle(cleanTitle);
    }

    setSelectedFile(file);
    setErrorMessage("");

    // Limit check for direct cloud uploads (100 MB recommended for browser cloud streaming)
    const MAX_DIRECT_UPLOAD_MB = 100;
    if (file.size > MAX_DIRECT_UPLOAD_MB * 1024 * 1024) {
      setErrorMessage(
        `This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Direct cloud upload is limited to ${MAX_DIRECT_UPLOAD_MB} MB. For larger videos, please switch to the "Paste Video Link" tab to stream directly from Google Drive or YouTube without any size limits.`
      );
      return;
    }

    // Automatically extract real video thumbnail frame from the video
    extractThumbnailFromVideo(file).then((thumb) => {
      if (thumb) {
        setCustomThumbnail(thumb);
      }
    });

    setIsUploadingToDrive(true);
    try {
      const result = await uploadVideoFileToDrive(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success && result.fileId) {
        setFileId(result.fileId);
        setDriveInput(result.url || `https://drive.google.com/file/d/${result.fileId}/view`);
      } else {
        setUploadProgress(null);
        setSelectedFile(null);
        setFileId(null);
        setErrorMessage(result.error || "Failed to upload file.");
      }
    } catch (err: any) {
      setUploadProgress(null);
      setSelectedFile(null);
      setFileId(null);
      setErrorMessage(err.message || "File upload failed.");
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleDriveUrlChange = (value: string) => {
    setDriveInput(value);
    setErrorMessage("");
    const parsed = parseVideoUrl(value);
    if (parsed) {
      setFileId(parsed.id);
      if (parsed.thumbnailUrl) {
        setCustomThumbnail(parsed.thumbnailUrl);
      }
    } else {
      setFileId(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId) {
      setErrorMessage("Please select a video file or paste a valid Google Drive link.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Please enter a title for your wonder stream.");
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

      const details = parseVideoUrl(fileId);
      const embedUrl = details?.embedUrl || getDriveEmbedUrl(fileId);
      const driveUrl = details?.viewUrl || (fileId.startsWith("http") || fileId.startsWith("blob:") ? fileId : `https://drive.google.com/file/d/${fileId}/view`);
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
              <p className="text-[11px] text-amber-400">Direct Cloud Upload or Video Link</p>
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

        {/* Upload Method Selector Tabs */}
        <div className="flex border-b border-[#212435] bg-[#0d0e17]">
          <button
            type="button"
            onClick={() => setUploadMethod("file")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition ${
              uploadMethod === "file"
                ? "border-amber-400 text-amber-400 bg-amber-400/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Video File (Direct Cloud)</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMethod("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition ${
              uploadMethod === "link"
                ? "border-amber-400 text-amber-400 bg-amber-400/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            <span>Paste Video Link (YouTube or Drive)</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handlePublish} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Method 1: File Dropzone */}
          {uploadMethod === "file" && (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/*"
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2b2f42] hover:border-amber-500/50 bg-[#161826]/50 p-8 text-center cursor-pointer transition group"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <FileVideo className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    Select or drop video file directly
                  </p>
                  <p className="text-xs text-zinc-400 mb-4">
                    Supports MP4, WebM, MOV, MKV files
                  </p>
                  <button
                    type="button"
                    className="rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-black shadow-md hover:bg-amber-400 transition"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#272b3d] bg-[#161826] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <FileVideo className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Google Drive Target
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileId(null);
                        setUploadProgress(null);
                      }}
                      className="text-zinc-400 hover:text-white text-xs"
                    >
                      Change
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {uploadProgress && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>
                          {isUploadingToDrive
                            ? "Uploading video file..."
                            : errorMessage
                            ? "Upload failed"
                            : "Uploaded successfully!"}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">{uploadProgress.percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#202336] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {fileId && !isUploadingToDrive && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready to stream</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Method 2: Link Input */}
          {uploadMethod === "link" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>Google Drive or YouTube Link *</span>
                {fileId && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 normal-case font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Valid Link Detected
                  </span>
                )}
              </label>
              <input
                type="text"
                value={driveInput}
                onChange={(e) => handleDriveUrlChange(e.target.value)}
                placeholder="Paste Google Drive link (e.g. drive.google.com/file/d/...) or YouTube link (e.g. youtu.be/...)"
                className="w-full rounded-xl border border-[#272b3c] bg-[#171926] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
              />
            </div>
          )}

          {/* Video Preview if file ID parsed */}
          {fileId && (
            <div className="rounded-2xl border border-[#262a3c] bg-black p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-amber-400" />
                Stream Preview:
              </p>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-950">
                {fileId.startsWith("blob:") || fileId.includes("firebasestorage") || fileId.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                  <video
                    src={fileId}
                    controls
                    playsInline
                    className="h-full w-full object-contain bg-black"
                  />
                ) : (
                  <iframe
                    src={getDriveEmbedUrl(fileId)}
                    title="Preview"
                    className="h-full w-full border-0"
                    allow="autoplay; fullscreen"
                  />
                )}
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
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 24:15 or Live Stream"
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
                Auto-extracted or upload your custom thumbnail
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
                    className="flex items-center gap-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 px-3 py-1.5 text-xs font-semibold transition shadow-sm"
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
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2.5 text-xs text-rose-300 shadow-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod("link");
                  setErrorMessage("");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 px-3.5 py-1.5 text-xs font-bold transition shadow-sm"
              >
                <span>👉 Switch to &quot;Paste Video Link&quot; Tab</span>
              </button>
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
              disabled={isSubmitting || isUploadingToDrive || !fileId}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{isSubmitting ? "Publishing..." : "Publish to Citradhara"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
