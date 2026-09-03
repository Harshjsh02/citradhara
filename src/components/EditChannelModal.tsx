"use client";

import React, { useState } from "react";
import { X, Sparkles, Image as ImageIcon, CheckCircle2, User, Palette } from "lucide-react";
import { UserProfile } from "@/types";
import { saveUserProfile } from "@/lib/db";
import { normalizeThumbnailUrl } from "@/lib/drive";

interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

const BANNER_PRESETS = [
  "linear-gradient(to right, #f59e0b, #e11d48, #4f46e5)",
  "linear-gradient(to right, #0f172a, #1e293b, #334155)",
  "linear-gradient(to right, #064e3b, #047857, #10b981)",
  "linear-gradient(to right, #581c87, #7e22ce, #a855f7)",
  "linear-gradient(to right, #7c2d12, #c2410c, #ea580c)",
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
];

export default function EditChannelModal({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}: EditChannelModalProps) {
  const [displayName, setDisplayName] = useState(currentProfile.displayName || "");
  const [handle, setHandle] = useState(currentProfile.handle || "");
  const [photoURL, setPhotoURL] = useState(currentProfile.photoURL || "");
  const [bannerURL, setBannerURL] = useState(currentProfile.bannerURL || BANNER_PRESETS[0]);
  const [bio, setBio] = useState(currentProfile.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      const cleanHandle = handle.trim().replace(/^@/, "").toLowerCase() || displayName.toLowerCase().replace(/\s+/g, "_");
      const cleanAvatar = normalizeThumbnailUrl(photoURL.trim()) || currentProfile.photoURL;
      const cleanBanner = bannerURL.trim().startsWith("http") ? normalizeThumbnailUrl(bannerURL.trim()) : bannerURL.trim();

      const updated: UserProfile = {
        ...currentProfile,
        displayName: displayName.trim(),
        handle: cleanHandle,
        photoURL: cleanAvatar,
        bannerURL: cleanBanner,
        bio: bio.trim(),
      };

      await saveUserProfile(updated);
      onProfileUpdated(updated);
      onClose();
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#1e1e2a] bg-[#0d0d12] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#181822] px-5 py-4 bg-[#101017]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Customize Channel</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-[#1a1a24] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Channel Banner Preview & Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              Channel Banner
            </label>
            <div
              className="h-24 w-full rounded-xl overflow-hidden border border-[#222230] relative flex items-center justify-center"
              style={{
                background: bannerURL.startsWith("http") ? `url(${bannerURL}) center/cover no-repeat` : bannerURL,
              }}
            >
              <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300 backdrop-blur-sm">
                Live Banner Preview
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-zinc-400">Theme:</span>
              <div className="flex gap-1.5">
                {BANNER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBannerURL(preset)}
                    className={`h-5 w-8 rounded-md border transition ${
                      bannerURL === preset ? "border-amber-400 scale-105" : "border-zinc-700 hover:border-zinc-500"
                    }`}
                    style={{ background: preset }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Banner Input */}
            <input
              type="text"
              value={bannerURL.startsWith("linear-gradient") ? "" : bannerURL}
              onChange={(e) => setBannerURL(e.target.value)}
              placeholder="Or paste custom image URL (Google Drive, Unsplash, etc.)"
              className="w-full rounded-xl border border-[#1f1f2a] bg-[#121218] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Avatar Preview & URL */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-400" />
              Profile Avatar
            </label>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeThumbnailUrl(photoURL) || currentProfile.photoURL}
                alt="Avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentProfile.photoURL;
                }}
                className="h-14 w-14 rounded-full object-cover border-2 border-amber-500/40 bg-[#161622]"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="Paste Image URL (Google Drive, Imgur, Unsplash...)"
                  className="w-full rounded-xl border border-[#1f1f2a] bg-[#121218] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
                {/* Avatar presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400">Presets:</span>
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoURL(preset)}
                      className="rounded-full overflow-hidden border border-zinc-700 hover:border-amber-400 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt="preset" className="h-5 w-5 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300">Channel Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Harsh Joshi"
                className="w-full rounded-xl border border-[#1f1f2a] bg-[#121218] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300">Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-zinc-500">@</span>
                <input
                  type="text"
                  value={handle.replace(/^@/, "")}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="harsh_joshi"
                  className="w-full rounded-xl border border-[#1f1f2a] bg-[#121218] pl-7 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Channel Bio / Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-300">About & Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the CodersHigh community about yourself, your projects, or your stream..."
              className="w-full rounded-xl border border-[#1f1f2a] bg-[#121218] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#181822]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-white text-black hover:bg-zinc-200 px-5 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
