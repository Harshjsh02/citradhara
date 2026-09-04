"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Check, ListPlus, FolderPlus } from "lucide-react";
import { 
  getPlaylists, 
  createPlaylist, 
  addVideoToPlaylist, 
  removeVideoFromPlaylist, 
  isVideoInPlaylist,
  PLAYLISTS_EVENT 
} from "@/lib/playlists";
import { Playlist, Video } from "@/types";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
}

export default function PlaylistModal({ isOpen, onClose, video }: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const refreshPlaylists = () => {
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    if (isOpen) {
      refreshPlaylists();
      setIsCreating(false);
      setNewTitle("");
      setNewDesc("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUpdate = () => refreshPlaylists();
    window.addEventListener(PLAYLISTS_EVENT, handleUpdate);
    return () => window.removeEventListener(PLAYLISTS_EVENT, handleUpdate);
  }, []);

  if (!isOpen || !video) return null;

  const handleToggleVideo = (playlistId: string) => {
    const isInside = isVideoInPlaylist(playlistId, video.id);
    if (isInside) {
      removeVideoFromPlaylist(playlistId, video.id);
    } else {
      addVideoToPlaylist(playlistId, video.id);
    }
    refreshPlaylists();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = createPlaylist(newTitle.trim(), newDesc.trim());
    addVideoToPlaylist(created.id, video.id);
    setNewTitle("");
    setNewDesc("");
    setIsCreating(false);
    refreshPlaylists();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-[#232332] bg-[#0f0f15] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b1b26]">
          <div className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Save to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video preview mini bar */}
        <div className="my-4 flex items-center gap-3 rounded-2xl bg-[#14141d] p-2.5 border border-[#1e1e2c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-10 w-16 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{video.title}</p>
            <p className="text-[11px] text-zinc-400 truncate">{video.uploaderName}</p>
          </div>
        </div>

        {/* Existing Playlists list */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 py-1">
          {playlists.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No custom playlists yet. Create your first one below!
            </div>
          ) : (
            playlists.map((pl) => {
              const checked = isVideoInPlaylist(pl.id, video.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => handleToggleVideo(pl.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition ${
                    checked
                      ? "bg-[#181826] text-amber-400 border border-amber-500/30"
                      : "text-zinc-300 hover:bg-[#14141e] border border-transparent"
                  }`}
                >
                  <span className="truncate">{pl.title}</span>
                  <div className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                    checked ? "bg-amber-400 border-amber-400 text-black" : "border-zinc-600"
                  }`}>
                    {checked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create new playlist form / toggle */}
        <div className="mt-4 pt-3 border-t border-[#1b1b26]">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-amber-400/60 p-2.5 text-xs font-semibold text-zinc-300 hover:text-amber-400 transition"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create New Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNew} className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist name (e.g. Deep Work, AI Tutorials)"
                autoFocus
                className="w-full rounded-xl border border-[#262638] bg-[#14141e] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-1.5 text-xs font-bold transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create & Save</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
