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
      const offset = direction === "left" ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center py-3 bg-[#090a0f]/90 backdrop-blur-sm sticky top-16 z-30">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#151724] border border-[#242738] text-zinc-300 hover:bg-[#202334] hover:text-white transition shadow-md mr-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Horizontal Chips Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((category) => {
          const isActive = selected === category;
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold"
                  : "bg-[#161824] border border-[#26293a] text-zinc-300 hover:bg-[#222538] hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#151724] border border-[#242738] text-zinc-300 hover:bg-[#202334] hover:text-white transition shadow-md ml-2"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
