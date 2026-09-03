"use client";

import React from "react";
import Link from "next/link";

interface CitradharaLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CitradharaLogo({
  className = "",
  showSubtitle = true,
  size = "md",
}: CitradharaLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  const titleSizes = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-2xl tracking-tight",
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Minimal Icon: Flowing Dhara (stream) wrapping cinematic aperture with play core */}
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105 duration-200`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Citradhara Logo"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold ${titleSizes[size]} text-white group-hover:text-amber-400 transition-colors`}>
            citradhara
          </span>
          <span className="text-[10px] font-medium text-amber-500/80 uppercase font-mono tracking-widest">
            चित्रधारा
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] font-medium text-zinc-400 tracking-wider">
            A Stream of Wonders
          </span>
        )}
      </div>
    </Link>
  );
}
