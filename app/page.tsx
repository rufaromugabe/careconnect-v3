"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  User,
  FlaskRoundIcon as Flask,
  Thermometer,
  Heart,
  Calendar,
  Activity,
  Clock,
  Shield,
  BarChart,
  Menu,
  X,
} from "lucide-react";
import { AnimatedBeam, AnimatedGradientText, HealthcareConnectionBeams } from "@/components/ui/animated-beam";
import { motion, useScroll, useMotionValueEvent, useTransform, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle, SimpleThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import Link from "next/link";

// New MouseParallax component for device showcase
const MouseParallax = ({ children, strength = 0.1 }: { children: React.ReactNode; strength?: number }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      if (!isHovering) return;
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const posX = (clientX - centerX) * strength;
      const posY = (clientY - centerY) * strength;
      setPosition({ x: posX, y: posY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [strength, isHovering]);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setPosition({ x: 0, y: 0 });
      }}
    >
      <motion.div
        animate={{ 
          x: position.x, 
          y: position.y,
          transition: { 
            type: "spring", 
            stiffness: 100, 
            damping: 30,
            mass: 0.8
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const features = [
    {
      icon: <Activity className="h-10 w-10 text-cyan-400" />,
      title: "Patient Record Management",
      description: "Digital health records for secure and efficient storage and retrieval of patient information."
    },
    {
      icon: <Flask className="h-10 w-10 text-indigo-400" />,
      title: "Prescription Management",
      description: "E-prescribing and medication management for better patient adherence."
      
    },
    {
      icon: <Calendar className="h-10 w-10 text-emerald-400" />,
      title: "Appointment Scheduling",
      description: "Streamlined booking system for patients to schedule visits with healthcare providers."
    },
    {
      icon: <Clock className="h-10 w-10 text-fuchsia-400" />,
      title: "Real-time Notifications",
      description: "Instant alerts for appointments, medication reminders, and important updates."
    },
    {
      icon: <Shield className="h-10 w-10 text-amber-400" />,
      title: "Data Security",
      description: "Robust encryption and compliance with healthcare regulations to protect sensitive information."
    
    },
    {
      icon: <BarChart className="h-10 w-10 text-rose-400" />,
      title: "Analytics Dashboard",
      description: "Data-driven insights for healthcare providers to monitor patient outcomes."
    },
  ];

  const testimonials = [
    {
      quote: "CareConnect has revolutionized how we manage patient care. The integrated system makes coordination between departments seamless.",
      name: "Dr. Sarah Parirenyatwa",
      role: "Cardiologist"
    },
    {
      quote: "As a nurse, I can now easily access patient information and update vitals in real-time. It's made our workflow so much more efficient.",
      name: "Rudo Moyo",
      role: "Head Nurse"
    },
    {
      quote: "I love being able to schedule appointments and access my medical records from my phone. The reminders for medication are a lifesaver!",
      name: "Mary Chikanda",
      role: "Patient"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white dark:bg-gradient-to-b dark:from-black dark:via-slate-950 dark:to-slate-900 dark:text-white light:bg-gradient-to-b light:from-white light:via-blue-50 light:to-blue-100 light:text-slate-900">
      {/* Animated background beam */}
      <AnimatedBeam />

      {/* Header Navigation */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg transition-all duration-300 ${
          scrolled 
            ? "bg-black/70 shadow-md shadow-blue-900/20 border-b border-blue-900/30 dark:bg-black/70 dark:shadow-blue-900/20 dark:border-blue-900/30 light:bg-white/70 light:shadow-blue-300/20 light:border-blue-300/30" 
            : "bg-transparent"
        }`}
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
              <div className="mr-2 relative w-8 h-8">
                <Image 
                  src="/logo.png" 
                  alt="CareConnect Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">CareConnect</span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm relative group">
                <span className="text-gray-300 hover:text-blue-400 transition-colors dark:text-gray-300 light:text-gray-700">Features</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#testimonials" className="text-sm relative group">
                <span className="text-gray-300 hover:text-blue-400 transition-colors dark:text-gray-300 light:text-gray-700">Testimonials</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#about" className="text-sm relative group">
                <span className="text-gray-300 hover:text-blue-400 transition-colors dark:text-gray-300 light:text-gray-700">About</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#contact" className="text-sm relative group">
                <span className="text-gray-300 hover:text-blue-400 transition-colors dark:text-gray-300 light:text-gray-700">Contact</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="/login" className="text-sm relative group">
                <span className="text-gray-300 hover:text-blue-400 transition-colors dark:text-gray-300 light:text-gray-700">Login</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              
              {/* Theme Toggle */}
              <SimpleThemeToggle />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/register")}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium border border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 light:bg-blue-500/20 light:text-blue-600 light:border-blue-500/30"
              >
                Sign Up
              </Button>
            </nav>
            
            {/* Mobile Menu Button and Theme Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <SimpleThemeToggle />
              <motion.button 
                className="p-2 rounded-full hover:bg-slate-800/70 transition-colors dark:hover:bg-slate-800/70 light:hover:bg-slate-200/70"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.nav 
              className="md:hidden py-4 flex flex-col space-y-4 pb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="#features" className="text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 dark:text-gray-300 light:text-gray-700">Features</Link>
              <Link href="#testimonials" className="text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 dark:text-gray-300 light:text-gray-700">Testimonials</Link>
              <Link href="#about" className="text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 dark:text-gray-300 light:text-gray-700">About</Link>
              <Link href="#contact" className="text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 dark:text-gray-300 light:text-gray-700">Contact</Link>
              <Link href="/login" className="text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 dark:text-gray-300 light:text-gray-700">Login</Link>
              <Button 
                variant="ghost"
                onClick={() => router.push("/register")}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium border border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 light:bg-blue-500/20 light:text-blue-600 light:border-blue-500/30"
              >
                Sign Up
              </Button>
            </motion.nav>
          )}
        </div>
      </motion.header>

      {/* Hero Section - adjusted padding for header */}
      <section className="relative z-10 pt-24 md:pt-32">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Modified to stack vertically on mobile and center all items */}
          <div className="flex flex-col items-center justify-center gap-12">
            <motion.div 
              className="w-full text-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="mb-6 flex items-center justify-center">
                <div className="relative w-16 h-16 mr-4">
                  <Image 
                    src="/logo.png" 
                    alt="CareConnect Logo" 
                    fill
                    className="object-contain" 
                  />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  <AnimatedGradientText>CareConnect</AnimatedGradientText>
                </h1>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Healthcare Management Reimagined
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto dark:text-gray-400 light:text-gray-600">
                A comprehensive platform connecting healthcare professionals and patients
                for seamless, efficient, and personalized healthcare delivery.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-700/30"
                  onClick={() => router.push("/register")}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-900/20 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-900/20 light:border-blue-500/50 light:text-blue-600 light:hover:bg-blue-200/20"
                >
                  Login
                </Button>
              </div>
            </motion.div>
            
            {/* Healthcare Connection Beams in full width section */}
            <motion.div
              className="w-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HealthcareConnectionBeams className="max-w-4xl mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Device Showcase Section */}
      <section className="relative z-10 py-16 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Experience CareConnect</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Seamlessly manage healthcare on any device, anywhere.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
            {/* iPhone Mockup */}
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <MouseParallax strength={0.03}>
                  <div className="relative h-[600px] w-[300px] mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/50 to-purple-600/50 rounded-[40px] blur-3xl opacity-40" />
                    <Image
                      src="/iphone.png"
                      alt="CareConnect on Mobile"
                      width={300}
                      height={600}
                      className="object-contain relative z-10"
                      priority
                    />
                    <motion.div
                      className="absolute -top-10 -left-10 h-24 w-24 bg-blue-600/50 rounded-full blur-xl"
                      animate={{
                        y: [0, 10, 0],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-8 -right-4 h-20 w-20 bg-purple-600/50 rounded-full blur-xl"
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 1,
                      }}
                    />
                  </div>
                </MouseParallax>
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-blue-300">Mobile Experience</h3>
                  <p className="text-gray-400">Access your healthcare on the go</p>
                </div>
              </div>
            </motion.div>

            {/* Laptop Mockup */}
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="relative">
                <MouseParallax strength={0.02}>
                  <div className="relative h-[400px] w-[650px] mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-bl from-cyan-600/40 to-blue-600/40 rounded-[20px] blur-3xl opacity-40" />
                    <Image
                      src="/laptop.png"
                      alt="CareConnect on Desktop"
                      width={650}
                      height={400}
                      className="object-contain relative z-10"
                      priority
                    />
                    <motion.div
                      className="absolute -top-10 -right-10 h-32 w-32 bg-cyan-600/30 rounded-full blur-xl"
                      animate={{
                        x: [0, 15, 0],
                        opacity: [0.4, 0.6, 0.4],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-4 -left-10 h-28 w-28 bg-blue-600/30 rounded-full blur-xl"
                      animate={{
                        x: [0, -10, 0],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.5,
                      }}
                    />
                  </div>
                </MouseParallax>
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-cyan-300">Desktop Experience</h3>
                  <p className="text-gray-400">Powerful tools for healthcare professionals</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-950 to-slate-900" id="features">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Powerful Features</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need to streamline healthcare delivery and enhance patient outcomes.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-2xl border border-blue-900/30 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 bg-slate-900/50" id="testimonials">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">What Our Users Say</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Hear from healthcare professionals and patients using CareConnect every day.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-slate-900/90 backdrop-blur-sm p-8 rounded-2xl border border-purple-900/30 shadow-lg shadow-purple-900/10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                <div className="mb-6 text-4xl text-purple-400 opacity-70">"</div>
                <p className="mb-6 italic text-lg text-gray-300">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-blue-400">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-slate-900 to-black" id="about">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Ready to Transform Healthcare Delivery?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals and patients already using CareConnect.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg shadow-purple-900/30"
              onClick={() => router.push("/register")}
            >
              Sign Up Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-black border-t border-blue-900/30" id="contact">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="relative w-8 h-8 mr-2">
                <Image 
                  src="/logo.png" 
                  alt="CareConnect Logo" 
                  fill
                  className="object-contain" 
                />
              </div>
              <span className="text-xl font-bold text-blue-400">CareConnect</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">About</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CareConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
