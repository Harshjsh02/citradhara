"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Search, 
  Bell, 
  X, 
  LogOut, 
  User, 
  History, 
  ThumbsUp, 
  Sparkles
} from "lucide-react";
import CitradharaLogo from "./CitradharaLogo";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onToggleSidebar?: () => void;
  initialSearchQuery?: string;
}

export default function Navbar({ onToggleSidebar, initialSearchQuery = "" }: NavbarProps) {
  const router = useRouter();
  const { user, signInWithGoogle, signOut, isFirebaseActive } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#181822] bg-[#08080a]/90 px-4 backdrop-blur-md">
      {/* Left: Hamburger & Minimal Citradhara Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="rounded-full p-2 text-zinc-400 hover:bg-[#161620] hover:text-white transition"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <CitradharaLogo size="md" />
      </div>

      {/* Center: Minimalist Search Bar */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-lg mx-6">
        <div className="relative flex w-full items-center">
          <div className="relative flex w-full items-center rounded-full border border-[#20202c] bg-[#101015] px-3.5 py-1.5 focus-within:border-amber-500/60 focus-within:bg-[#13131b] transition">
            <Search className="h-3.5 w-3.5 text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams of wonder, cinema, music, code..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Right: Minimal Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          aria-label="Search streams"
          className="sm:hidden rounded-full p-2 text-zinc-400 hover:bg-[#161620] hover:text-white transition"
        >
          <Search className="h-4 w-4" />
        </button>


        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="rounded-full p-2 text-zinc-400 hover:bg-[#161620] hover:text-white transition relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#222230] bg-[#101015] p-3.5 shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between border-b border-[#1b1b26] pb-2 mb-2">
                <span className="font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-amber-400">Citradhara</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg p-2 hover:bg-[#151520] transition">
                  <p className="text-zinc-200 font-medium">Welcome to Citradhara</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">A stream of wonders across cinema, music, code, and science.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile / Sign In */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center rounded-full ring-1 ring-zinc-700 hover:ring-amber-400 transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                alt={user.displayName || "User"}
                className="h-7 w-7 rounded-full object-cover"
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#222230] bg-[#101015] p-2 shadow-2xl z-50">
                <div className="border-b border-[#1c1c28] p-2.5">
                  <p className="truncate text-xs font-semibold text-white">
                    {user.displayName || "Community Member"}
                  </p>
                  <p className="truncate text-[11px] text-zinc-400">
                    {user.email || "member@codershigh.dev"}
                  </p>
                </div>

                <div className="py-1.5 space-y-0.5 text-xs">
                  <Link
                    href={`/channel/${user.uid}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-[#171722] hover:text-white"
                  >
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Your Channel</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-[#171722] hover:text-white"
                  >
                    <History className="h-3.5 w-3.5 text-zinc-400" />
                    <span>History</span>
                  </Link>
                  <Link
                    href="/liked"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-[#171722] hover:text-white"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Liked Streams</span>
                  </Link>
                </div>

                <div className="border-t border-[#1c1c28] pt-1 mt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10 hover:text-white active:scale-95 transition"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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

      {/* Mobile Search Dropdown Bar */}
      {isMobileSearchOpen && (
        <div className="absolute top-14 left-0 right-0 z-50 border-b border-[#20202c] bg-[#0c0c12] p-3 sm:hidden shadow-2xl">
          <form onSubmit={(e) => { handleSearch(e); setIsMobileSearchOpen(false); }}>
            <div className="relative flex w-full items-center rounded-full border border-[#2c2c3e] bg-[#14141c] px-3.5 py-2">
              <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streams of wonder..."
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-500 hover:text-white mr-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
