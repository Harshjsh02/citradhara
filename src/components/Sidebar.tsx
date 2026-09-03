"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ThumbsUp
} from "lucide-react";
import { CATEGORIES } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
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

export default function Sidebar({ isOpen, selectedCategory = "All", onSelectCategory }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-40 flex flex-col border-r border-[#161620] bg-[#08080a] transition-all duration-300 overflow-y-auto ${
        isOpen ? "w-60" : "w-0 -translate-x-full lg:w-16 lg:translate-x-0"
      }`}
    >
      <div className="flex-1 space-y-5 py-3 px-2">
        {/* Main Feed Links */}
        <div className="space-y-0.5">
          <Link
            href="/"
            onClick={() => onSelectCategory && onSelectCategory("All")}
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/" && selectedCategory === "All"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <Home className="h-4 w-4 text-zinc-300 shrink-0" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>Home</span>
          </Link>

          <Link
            href="/history"
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/history"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <History className="h-4 w-4 text-zinc-300 shrink-0" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>History</span>
          </Link>

          <Link
            href="/liked"
            className={`flex items-center gap-3.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              pathname === "/liked"
                ? "bg-[#14141c] text-white font-semibold"
                : "text-zinc-400 hover:bg-[#121218] hover:text-zinc-200"
            }`}
          >
            <ThumbsUp className="h-4 w-4 text-zinc-300 shrink-0" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>Liked</span>
          </Link>
        </div>

        {/* Categories / Streams of Wonder */}
        <div className={`space-y-1 border-t border-[#161620] pt-3 ${!isOpen ? "lg:hidden" : ""}`}>
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
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
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
    </aside>
  );
}
