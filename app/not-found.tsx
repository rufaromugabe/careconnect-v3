"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ArrowLeft } from "lucide-react";
import { AnimatedBeam, AnimatedGradientText } from "@/components/ui/animated-beam";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-muted">
      {/* Animated background beam */}
      <AnimatedBeam />

      {/* Header Navigation */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-muted/50/70 shadow-sm border-b border-border/20 transition-all"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between py-4">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                CareConnect
              </span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* 404 Content */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen pt-24 md:pt-32 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <AnimatedGradientText>404</AnimatedGradientText>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-muted-foreground">
            Oops! Page not found.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
