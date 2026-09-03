"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Video, 
  Bell, 
  X, 
  LogOut, 
  User, 
  History, 
  ThumbsUp, 
  Sparkles, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenUpload?: () => void;
  initialSearchQuery?: string;
}

export default function Navbar({ onToggleSidebar, onOpenUpload, initialSearchQuery = "" }: NavbarProps) {
  const router = useRouter();
  const { user, signInWithGoogle, signOut, isFirebaseActive } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1f2230] bg-[#090a0f]/95 px-4 backdrop-blur-md">
      {/* Left: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="rounded-full p-2 text-zinc-300 hover:bg-[#1b1d2a] hover:text-white transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Citradhara
              </span>
              <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                CodersHigh
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400 tracking-wide">
              A Stream of Wonders
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-4">
        <div className="relative flex w-full items-center">
          <div className="relative flex w-full items-center rounded-l-full border border-[#272a3b] bg-[#12131c] px-4 py-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams of wonder, tech tutorials, code..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-[38px] items-center justify-center rounded-r-full border border-l-0 border-[#272a3b] bg-[#1a1c27] px-5 text-zinc-300 hover:bg-[#252839] hover:text-white transition"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Firebase / Free status badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#151722] border border-[#262838] px-3 py-1 text-xs text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${isFirebaseActive ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
          <span>{isFirebaseActive ? "Firestore Live" : "Demo Mode (Mock)"}</span>
        </div>

        {/* Upload / Create Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition"
        >
          <Video className="h-4 w-4" />
          <span className="hidden sm:inline">Stream Video</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="rounded-full p-2 text-zinc-300 hover:bg-[#1b1d2a] hover:text-white transition relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#282b3d] bg-[#12131e] p-4 shadow-xl z-50 text-sm">
              <div className="flex items-center justify-between border-b border-[#222534] pb-2 mb-3">
                <span className="font-semibold text-white">Wonder Notifications</span>
                <span className="text-[11px] text-amber-400 font-medium">CodersHigh</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg p-2 hover:bg-[#191b28] transition">
                  <span className="h-2 w-2 mt-1.5 rounded-full bg-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-200 font-medium">
                      Welcome to Citradhara — A Stream of Wonders!
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Stream your coding videos using free Google Drive storage.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg p-2 hover:bg-[#191b28] transition">
                  <span className="h-2 w-2 mt-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-200 font-medium">
                      New Masterclass Added
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Check out Next.js & AI Web Applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Google Auth */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center rounded-full ring-2 ring-amber-500/40 hover:ring-amber-400 transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#282b3d] bg-[#12131e] p-2 shadow-2xl z-50">
                <div className="flex items-center gap-3 border-b border-[#222534] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                    alt={user.displayName || "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.displayName || "CodersHigh Member"}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {user.email || "member@codershigh.dev"}
                    </p>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <Link
                    href={`/channel/${user.uid}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1c29] hover:text-white"
                  >
                    <User className="h-4 w-4 text-amber-400" />
                    <span>Your Wonder Channel</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1c29] hover:text-white"
                  >
                    <History className="h-4 w-4 text-indigo-400" />
                    <span>Watch History</span>
                  </Link>
                  <Link
                    href="/liked"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1c29] hover:text-white"
                  >
                    <ThumbsUp className="h-4 w-4 text-rose-400" />
                    <span>Liked Streams</span>
                  </Link>
                </div>

                <div className="border-t border-[#222534] pt-2">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
