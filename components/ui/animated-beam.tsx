"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedBeam() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full overflow-hidden">
      <div className="absolute inset-0 z-[-1] opacity-50 dark:opacity-20">
        {/* Top gradient beam */}
        <div
          className="absolute -top-[50%] left-[10%] h-[150%] w-[80%] rotate-[-20deg] bg-gradient-to-r from-indigo-500/30 via-blue-500/40 to-cyan-500/30 blur-3xl"
          style={{ transform: "translateZ(0)" }}
        />
        {/* Bottom gradient beam */}
        <div
          className="absolute -bottom-[50%] right-[10%] h-[150%] w-[80%] rotate-[20deg] bg-gradient-to-r from-purple-500/30 via-fuchsia-500/40 to-pink-500/30 blur-3xl"
          style={{ transform: "translateZ(0)" }}
        />
      </div>
    </div>
  );
}

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Update gradient position based on mouse movement for interactive effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (textRef.current) {
        const rect = textRef.current.getBoundingClientRect();
        setPosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <span
      ref={textRef}
      className={cn(
        "relative inline-block bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(${position.x}deg, #3b82f6, #8b5cf6, #6366f1)`,
      }}
    >
      {children}
    </span>
  );
}
