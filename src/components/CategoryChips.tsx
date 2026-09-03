"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/types";

interface CategoryChipsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center py-2.5 bg-[#08080a]/95 backdrop-blur-md sticky top-14 z-30">
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#14141c] hover:bg-[#1f1f2a] text-zinc-400 hover:text-white transition mr-2"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((category) => {
          const isActive = selected === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-white text-black font-bold shadow-sm"
                  : "bg-[#13131a] hover:bg-[#1c1c24] text-zinc-300 hover:text-white border border-[#1e1e28]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#14141c] hover:bg-[#1f1f2a] text-zinc-400 hover:text-white transition ml-2"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
