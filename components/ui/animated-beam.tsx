"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MagicCard } from "./magic-card";

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

interface ConnectionBeam {
  id: string;
  from: string;
  to: string;
  color: string;
  delay: number;
  duration: number;
  curvature: number;
}

interface HealthcareConnectionBeamsProps {
  className?: string;
}

export function HealthcareConnectionBeams({ className }: HealthcareConnectionBeamsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const doctorRef = useRef<HTMLDivElement>(null);
  const nurseRef = useRef<HTMLDivElement>(null);
  const patientRef = useRef<HTMLDivElement>(null);
  const pharmacistRef = useRef<HTMLDivElement>(null);
  
  const [ready, setReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Define connection beams
  const connections: ConnectionBeam[] = [
    { id: "doctor-center", from: "doctor", to: "center", color: "blue", delay: 0.2, duration: 4, curvature: 50 },
    { id: "nurse-center", from: "nurse", to: "center", color: "green", delay: 0.4, duration: 3.5, curvature: 50 },
    { id: "patient-center", from: "patient", to: "center", color: "purple", delay: 0.6, duration: 4.2, curvature: 50 },
    { id: "pharmacist-center", from: "pharmacist", to: "center", color: "orange", delay: 0.8, duration: 3.8, curvature: 50 },
  ];
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is standard md breakpoint in Tailwind
    };
    
    // Check on mount
    checkMobile();
    
    // Check on window resize
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Get the reference based on the name
  const getRefFromName = (name: string) => {
    switch(name) {
      case "center": return centerRef;
      case "doctor": return doctorRef;
      case "nurse": return nurseRef;
      case "patient": return patientRef;
      case "pharmacist": return pharmacistRef;
      default: return centerRef;
    }
  };
  
  // Get the color based on the name
  const getGradientColors = (color: string) => {
    switch(color) {
      case "blue": return { start: "#3b82f6", end: "#2563eb" };
      case "green": return { start: "#22c55e", end: "#16a34a" };
      case "purple": return { start: "#a855f7", end: "#7e22ce" };
      case "orange": return { start: "#f97316", end: "#ea580c" };
      default: return { start: "#3b82f6", end: "#2563eb" };
    }
  };
  
  // Set ready state after component mount to ensure refs are available
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={cn("relative w-full flex items-center justify-center h-[300px] md:h-[400px] mr-20")}
      ref={containerRef}
    >
      {/* SVG container for beams */}
      {ready && (
        <>
          {connections.map((conn) => {
            const fromRef = getRefFromName(conn.from);
            const toRef = getRefFromName(conn.to);
            const colors = getGradientColors(conn.color);
            
            return (
              <ConnectingBeam
                key={conn.id}
                containerRef={containerRef}
                fromRef={fromRef}
                toRef={toRef}
                gradientStartColor={colors.start}
                gradientStopColor={colors.end}
                pathColor={`${colors.start}33`}
                pathWidth={isMobile ? 2 : 3}
                curvature={isMobile ? conn.curvature * 0.7 : conn.curvature}
                delay={conn.delay}
                duration={conn.duration}
              />
            );
          })}
        </>
      )}
      
      {/* Central hub - CareConnect Platform */}
      <motion.div
        ref={centerRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          {/* Enhanced outer glow effect */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-blue-500/30 blur-2xl animate-pulse"></div>
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-blue-400/40 to-purple-400/40 blur-md"></div>
          
          <MagicCard
            className="rounded-full w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.45)]"
            gradientSize={120}
            gradientFrom="#3b82f6"
            gradientTo="#8b5cf6"
            gradientColor="#6366f1"
            gradientOpacity={0.5}
          >
            <div className="p-1 relative z-10">
              <motion.div
                className="relative flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 rounded-full border-3 border-blue-300/30 border-dashed"></div>
                <div className="absolute h-8 w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 blur-md"></div>
                <div className="relative h-6 w-6 md:h-10 md:w-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-inner">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-6 md:w-6 text-blue-600" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </MagicCard>
        </div>
        
        <motion.div 
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3 className="font-bold text-sm md:text-lg">CareConnect</h3>
          <p className="text-[10px] md:text-xs text-muted-foreground">Central Healthcare Platform</p>
        </motion.div>
      </motion.div>
      
      {/* Doctor Node */}
      <motion.div
        ref={doctorRef}
        className="absolute left-[15%] top-[25%] transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-2 md:p-4 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 shadow-lg flex items-center justify-center">
          <div className="p-1 md:p-3 rounded-full bg-white dark:bg-gray-800 shadow-inner">
            <svg className="h-5 w-5 md:h-8 md:w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-center">
          <h3 className="font-medium text-xs md:text-base">Doctors</h3>
          <p className="text-[8px] md:text-xs text-muted-foreground">Medical professionals</p>
        </div>
      </motion.div>
      
      {/* Nurse Node */}
      <motion.div
        ref={nurseRef}
        className="absolute left-[85%] top-[25%] transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="p-2 md:p-4 rounded-full bg-green-500/10 backdrop-blur-sm border border-green-500/20 shadow-lg flex items-center justify-center">
          <div className="p-1 md:p-3 rounded-full bg-white dark:bg-gray-800 shadow-inner">
            <svg className="h-5 w-5 md:h-8 md:w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 3v15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-center">
          <h3 className="font-medium text-xs md:text-base">Nurses</h3>
          <p className="text-[8px] md:text-xs text-muted-foreground">Healthcare staff</p>
        </div>
      </motion.div>
      
      {/* Patient Node */}
      <motion.div
        ref={patientRef}
        className="absolute left-[15%] top-[75%] transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="p-2 md:p-4 rounded-full bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 shadow-lg flex items-center justify-center">
          <div className="p-1 md:p-3 rounded-full bg-white dark:bg-gray-800 shadow-inner">
            <svg className="h-5 w-5 md:h-8 md:w-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-center">
          <h3 className="font-medium text-xs md:text-base">Patients</h3>
          <p className="text-[8px] md:text-xs text-muted-foreground">Healthcare consumers</p>
        </div>
      </motion.div>
      
      {/* Pharmacist Node */}
      <motion.div
        ref={pharmacistRef}
        className="absolute left-[85%] top-[75%] transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="p-2 md:p-4 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 shadow-lg flex items-center justify-center">
          <div className="p-1 md:p-3 rounded-full bg-white dark:bg-gray-800 shadow-inner">
            <svg className="h-5 w-5 md:h-8 md:w-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 13h6m-3-3v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-center">
          <h3 className="font-medium text-xs md:text-base">Pharmacists</h3>
          <p className="text-[8px] md:text-xs text-muted-foreground">Medication experts</p>
        </div>
      </motion.div>
    </div>
  );
}

// ConnectingBeam component based on the provided code
interface ConnectingBeamProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fromRef: React.RefObject<HTMLDivElement | null>;
  toRef: React.RefObject<HTMLDivElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  className?: string;
}

function ConnectingBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  className,
}: ConnectingBeamProps) {
  const id = React.useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  // Calculate the gradient coordinates based on the reverse prop
  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      };

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const fromRect = fromRef.current.getBoundingClientRect();
        const toRect = toRef.current.getBoundingClientRect();

        const svgWidth = containerRect.width;
        const svgHeight = containerRect.height;
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        // Calculate positions relative to container
        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;

        // Calculate control point for the curve
        const controlX = (startX + endX) / 2;
        const controlY = Math.min(startY, endY) - curvature;

        // Create SVG path
        const d = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
        setPathD(d);
      }
    };

    // Update path on mount
    updatePath();

    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute left-0 top-0 transform-gpu",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0"></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
