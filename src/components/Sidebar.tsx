"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Home, 
  Compass, 
  Flame, 
  History, 
  ThumbsUp, 
  Layers, 
  Code2, 
  Brain, 
  Database, 
  Cpu, 
  Cloud, 
  Film, 
  GitBranch, 
  HelpCircle,
  HardDrive,
  Sparkles
} from "lucide-react";
import { CATEGORIES, Category } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "All": <Sparkles className="h-4 w-4 text-amber-400" />,
  "Web Development": <Code2 className="h-4 w-4 text-cyan-400" />,
  "Artificial Intelligence": <Brain className="h-4 w-4 text-rose-400" />,
  "Python & Data": <Database className="h-4 w-4 text-emerald-400" />,
  "Algorithms & DSA": <Cpu className="h-4 w-4 text-amber-400" />,
  "System Design": <Layers className="h-4 w-4 text-indigo-400" />,
  "DevOps & Cloud": <Cloud className="h-4 w-4 text-sky-400" />,
  "Cinematic Tech Stories": <Film className="h-4 w-4 text-purple-400" />,
  "Open Source": <GitBranch className="h-4 w-4 text-lime-400" />,
  "Career & Pods": <Flame className="h-4 w-4 text-orange-400" />
};

export default function Sidebar({ isOpen, selectedCategory = "All", onSelectCategory }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col border-r border-[#1f2230] bg-[#090a0f] transition-all duration-300 overflow-y-auto ${
        isOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      }`}
    >
      <div className="flex-1 space-y-6 py-4 px-3">
        {/* Main Navigation */}
        <div className="space-y-1">
          <Link
            href="/"
            onClick={() => onSelectCategory && onSelectCategory("All")}
            className={`flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === "/" && selectedCategory === "All"
                ? "bg-[#1b1d2b] text-amber-400 shadow-sm shadow-amber-500/10"
                : "text-zinc-300 hover:bg-[#141622] hover:text-white"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>Explore Streams</span>
          </Link>

          <Link
            href="/history"
            className={`flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === "/history"
                ? "bg-[#1b1d2b] text-amber-400"
                : "text-zinc-300 hover:bg-[#141622] hover:text-white"
            }`}
          >
            <History className="h-5 w-5 text-indigo-400" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>History</span>
          </Link>

          <Link
            href="/liked"
            className={`flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname === "/liked"
                ? "bg-[#1b1d2b] text-amber-400"
                : "text-zinc-300 hover:bg-[#141622] hover:text-white"
            }`}
          >
            <ThumbsUp className="h-5 w-5 text-rose-400" />
            <span className={`${!isOpen ? "lg:hidden" : ""}`}>Liked Videos</span>
          </Link>
        </div>

        {/* Categories / Stream of Wonders */}
        <div className={`space-y-2 border-t border-[#1f2230] pt-4 ${!isOpen ? "lg:hidden" : ""}`}>
          <div className="px-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Stream of Wonders
            </span>
            <span className="text-[10px] text-amber-400 font-mono">CodersHigh</span>
          </div>

          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500/20 to-rose-500/10 border border-amber-500/30 text-amber-300"
                      : "text-zinc-400 hover:bg-[#141622] hover:text-zinc-100"
                  }`}
                >
                  <span className="shrink-0">{CATEGORY_ICONS[cat] || <Compass className="h-4 w-4" />}</span>
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Free Stack Info Card */}
        <div className={`border-t border-[#1f2230] pt-4 ${!isOpen ? "lg:hidden" : ""}`}>
          <div className="rounded-2xl border border-[#272a3b] bg-gradient-to-b from-[#131520] to-[#0c0d14] p-3 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
              <HardDrive className="h-4 w-4" />
              <span>Free Community Tech</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
              Hosted on Vercel, streaming zero-cost from Google Drive with Firebase Auth.
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-[#1f2230]">
              <span>CodersHigh Community</span>
              <span className="text-emerald-400">100% Free Tier</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={`pt-2 px-3 text-[11px] text-zinc-500 space-y-1 ${!isOpen ? "lg:hidden" : ""}`}>
          <p className="font-semibold text-zinc-400">Citradhara v1.0</p>
          <p>A Stream of Wonders for coders</p>
          <p>© {new Date().getFullYear()} CodersHigh Community</p>
        </div>
      </div>
    </aside>
  );
}
