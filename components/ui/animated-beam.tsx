"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function AnimatedBeam({
  className,
  interval = 4000,
}: {
  className?: string
  interval?: number
}) {
  const [position, setPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    // Create a smooth random movement for the beam
    const intervalId = setInterval(() => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      })
    }, interval)

    return () => clearInterval(intervalId)
  }, [interval])

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute -inset-[100%] opacity-50 blur-[100px] transition-all duration-2000 ease-in-out"
        style={{
          background: `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(56, 189, 248, 0.8) 0%, rgba(232, 121, 249, 0.8) 25%, rgba(217, 70, 219, 0.6) 50%, rgba(99, 102, 241, 0.4) 75%, rgba(14, 165, 233, 0.2) 100%)`,
          transform: `translate(${position.x / 5 - 10}%, ${position.y / 5 - 10}%)`,
        }}
      />
    </div>
  )
}

export function AnimatedGradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "animate-text-gradient bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-[200%_auto] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  )
}
