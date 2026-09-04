"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Compass, 
  Film, 
  Music, 
  Code2, 
  Sparkles, 
  Gamepad2, 
  Mic, 
  Palette, 
  Tv, 
  Video,
  History, 
  ThumbsUp, 
  Clock,
  ListVideo,
  Plus,
  User
} from "lucide-react";
import { CATEGORIES, Playlist } from "@/types";
import { YouTubeSubscription } from "@/lib/youtubeApi";
import { 
  getPlaylists, 
  getWatchLaterIds, 
  WATCH_LATER_EVENT, 
  PLAYLISTS_EVENT 
} from "@/lib/playlists";

interface SidebarProps {
  isOpen: boolean;
  onOpenSidebar?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  subscriptions?: YouTubeSubscription[];
  selectedChannelId?: string | null;
  onSelectChannel?: (channelId: string | null) => void;
  selectedPlaylistId?: string | null;
  onSelectPlaylist?: (playlistId: string | null) => void;
  isWatchLaterActive?: boolean;
  onToggleWatchLaterView?: () => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "All": <Sparkles className="h-4 w-4 text-amber-400" />,
  "Cinema & Films": <Film className="h-4 w-4 text-zinc-300" />,
  "Music & Audio": <Music className="h-4 w-4 text-zinc-300" />,
  "Coding & Tech": <Code2 className="h-4 w-4 text-zinc-300" />,
  "Science & Wonders": <Sparkles className="h-4 w-4 text-zinc-300" />,
  "Gaming": <Gamepad2 className="h-4 w-4 text-zinc-300" />,
  "Podcasts & Talks": <Mic className="h-4 w-4 text-zinc-300" />,
  "Art & Animation": <Palette className="h-4 w-4 text-zinc-300" />,
  "Culture & Travel": <Compass className="h-4 w-4 text-zinc-300" />,
  "Vlogs": <Video className="h-4 w-4 text-zinc-300" />,
  "Documentaries": <Tv className="h-4 w-4 text-zinc-300" />
};

export default function Sidebar({
  isOpen,
  onOpenSidebar,
  selectedCategory = "All",
  onSelectCategory,
  subscriptions = [],
  selectedChannelId = null,
  onSelectChannel,
  selectedPlaylistId = null,
  onSelectPlaylist,
  isWatchLaterActive = false,
  onToggleWatchLaterView,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [watchLaterCount, setWatchLaterCount] = useState(0);
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    setWatchLaterCount(getWatchLaterIds().length);
    setCustomPlaylists(getPlaylists());

    const updateWatchLater = () => setWatchLaterCount(getWatchLaterIds().length);
    const updatePlaylists = () => setCustomPlaylists(getPlaylists());

    window.addEventListener(WATCH_LATER_EVENT, updateWatchLater);
    window.addEventListener(PLAYLISTS_EVENT, updatePlaylists);
    return () => {
      window.removeEventListener(WATCH_LATER_EVENT, updateWatchLater);
      window.removeEventListener(PLAYLISTS_EVENT, updatePlaylists);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 flex flex-col border-r border-[#161620] bg-[#08080a] transition-all duration-300 overflow-y-auto ${
          isOpen ? "w-60 translate-x-0 shadow-2xl" : "w-0 -translate-x-full lg:w-[72px] lg:translate-x-0"
        }`}
      >
      {isOpen ? (
      <div className="flex-1 space-y-5 py-3 px-2">
        {/* Main Feed Links: Home & Watch Later */}
        <div className="space-y-0.5">
          <Link
            href="/"
            onClick={() => {
              if (onSelectCategory) onSelectCategory("All");
              if (onSelectChannel) onSelectChannel(null);
              if (onSelectPlaylist) onSelectPlaylist(null);
              if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
            }}
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/" && selectedCategory === "All" && !selectedChannelId && !isWatchLaterActive && !selectedPlaylistId
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <Home className="h-4 w-4 text-zinc-300 shrink-0" />
            <span>Home</span>
          </Link>

          {/* Watch Later Quick Access */}
          <button
            onClick={() => {
              if (onToggleWatchLaterView) onToggleWatchLaterView();
              if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              isWatchLaterActive
                ? "bg-[#181826] text-amber-400 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <Clock className="h-4 w-4 text-zinc-300 shrink-0" />
            <span className="flex-1 text-left">Watch Later</span>
            {watchLaterCount > 0 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                {watchLaterCount}
              </span>
            )}
          </button>
        </div>

        {/* 1. Custom Playlists Section (Moved directly after Watch Later!) */}
        {customPlaylists.length > 0 && (
          <div className="space-y-1 border-t border-[#161620] pt-3">
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Playlists
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {customPlaylists.length}
              </span>
            </div>

            <div className="space-y-0.5">
              {customPlaylists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (onSelectPlaylist) {
                        onSelectPlaylist(isSelected ? null : pl.id);
                      }
                      if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
                    }}
                    title={pl.title}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-xs font-medium transition ${
                      isSelected
                        ? "bg-[#181824] text-amber-400 font-semibold border border-amber-500/30"
                        : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
                    }`}
                  >
                    <ListVideo className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate flex-1">{pl.title}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {pl.videoIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Categories / Explore Wonders (Moved after Playlists!) */}
        <div className="space-y-1 border-t border-[#161620] pt-3">
          <div className="px-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Explore Wonders
            </span>
          </div>

          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-[#171722] text-amber-400 font-semibold"
                      : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
                  }`}
                >
                  <span className="shrink-0">{CATEGORY_ICONS[cat] || <Compass className="h-3.5 w-3.5" />}</span>
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Subscribed Channels (Moved after Explore Wonders!) */}
        <div className="space-y-1 border-t border-[#161620] pt-3">
          <div className="px-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Subscriptions
            </span>
            {subscriptions && subscriptions.length > 0 && (
              <span className="text-[10px] text-amber-400 font-mono">
                {subscriptions.length}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub) => {
                const isSelected = selectedChannelId === sub.channelId;
                return (
                  <button
                    key={sub.channelId}
                    onClick={() => {
                      if (onSelectChannel) {
                        onSelectChannel(isSelected ? null : sub.channelId);
                      }
                      if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
                    }}
                    title={sub.title}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-xs font-medium transition ${
                      isSelected
                        ? "bg-[#181824] text-amber-400 font-semibold border border-amber-500/30"
                        : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sub.thumbnail}
                      alt={sub.title}
                      className="h-5 w-5 rounded-full object-cover shrink-0 border border-zinc-700/50"
                    />
                    <span className="truncate">{sub.title}</span>
                    {isSelected && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-[11px] text-zinc-500">
                Sign in to view your subscriptions.
              </div>
            )}
          </div>
        </div>

        {/* 4. Library: History & Liked */}
        <div className="space-y-0.5 border-t border-[#161620] pt-3">
          <div className="px-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Library
            </span>
          </div>

          <Link
            href="/history"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
            }}
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/history"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <History className="h-4 w-4 text-zinc-300 shrink-0" />
            <span>History</span>
          </Link>

          <Link
            href="/liked"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
            }}
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/liked"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <ThumbsUp className="h-4 w-4 text-zinc-300 shrink-0" />
            <span>Liked</span>
          </Link>
        </div>

        {/* Minimal Footer & Creator Credit */}
        <div className={`border-t border-[#161620] pt-4 px-3 space-y-2 ${!isOpen ? "lg:hidden" : ""}`}>
          <div>
            <p className="text-zinc-400 font-semibold text-xs flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Citradhara • चित्रधारा</span>
            </p>
            <p className="text-[10px] text-zinc-500">A Stream of Wonders</p>
          </div>
          <div className="pt-2 border-t border-[#181822]">
            <p className="text-[11px] text-zinc-400 leading-snug">
              Created & Designed by{" "}
              <Link
                href="/channel/Uhwkq06XRuOHEGdrs4LbqVtoOGc2"
                className="text-amber-400 hover:text-amber-300 font-bold transition inline-flex items-center gap-1"
              >
                Harsh Joshi
              </Link>
            </p>
          </div>
        </div>
      </div>
      ) : (
        /* Collapsed Desktop Mini-Rail (Important Logos Only, YouTube-style) */
        <div className="hidden lg:flex flex-col items-center py-3 px-1 space-y-2 w-full">
          {/* Home */}
          <Link
            href="/"
            onClick={() => {
              if (onSelectCategory) onSelectCategory("All");
              if (onSelectChannel) onSelectChannel(null);
              if (onSelectPlaylist) onSelectPlaylist(null);
            }}
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition ${
              pathname === "/" && selectedCategory === "All" && !selectedChannelId && !isWatchLaterActive && !selectedPlaylistId
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="Home"
          >
            <Home className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal">Home</span>
          </Link>

          {/* Watch Later */}
          <button
            onClick={() => {
              if (onToggleWatchLaterView) onToggleWatchLaterView();
            }}
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition relative ${
              isWatchLaterActive
                ? "bg-[#181826] text-amber-400 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="Watch Later"
          >
            <Clock className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal">Watch Later</span>
            {watchLaterCount > 0 && (
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Playlists */}
          <button
            onClick={() => {
              if (customPlaylists.length > 0 && onSelectPlaylist) {
                onSelectPlaylist(selectedPlaylistId ? null : customPlaylists[0].id);
              }
            }}
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition ${
              selectedPlaylistId
                ? "bg-[#181826] text-amber-400 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="Playlists"
          >
            <ListVideo className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal">Playlists</span>
          </button>

          {/* Explore Wonders */}
          <button
            onClick={() => {
              if (pathname !== "/") {
                router.push("/");
              }
              if (onSelectCategory) onSelectCategory("All");
              if (onSelectChannel) onSelectChannel(null);
              if (onSelectPlaylist) onSelectPlaylist(null);
              if (onOpenSidebar) {
                onOpenSidebar();
              }
            }}
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition ${
              selectedCategory && selectedCategory !== "All"
                ? "bg-[#181826] text-amber-400 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="Explore Wonders"
          >
            <Compass className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal text-center">Explore Wonders</span>
          </button>

          {/* Subscriptions */}
          <button
            onClick={() => {
              if (onSelectChannel) {
                onSelectChannel(null);
              }
            }}
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition ${
              selectedChannelId
                ? "bg-[#181826] text-amber-400 font-semibold border border-amber-500/30"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="Subscriptions"
          >
            <Tv className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal">Subscriptions</span>
          </button>

          {/* You / History */}
          <Link
            href="/history"
            className={`flex flex-col items-center justify-center w-full py-3.5 px-1 rounded-xl text-center transition ${
              pathname === "/history"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
            title="You"
          >
            <User className="h-5 w-5 mb-1.5 text-zinc-300 shrink-0" />
            <span className="text-[10px] leading-tight font-normal">You</span>
          </Link>
        </div>
      )}
    </aside>
    </>
  );
}
