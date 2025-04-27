"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
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
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user, session, getUserRole } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      if (session && user) {
        const role = await getUserRole();
        if (role) {
          setIsLoggedIn(true);
          router.push(`/${role}/dashboard`);
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, [session, user, getUserRole, router]);

  const features = [
    {
      icon: <Activity className="h-10 w-10 text-blue-500" />,
      title: "Patient Record Management",
      description: "Digital health records for secure and efficient storage and retrieval of patient information."
    },
    {
      icon: <Calendar className="h-10 w-10 text-green-500" />,
      title: "Appointment Scheduling",
      description: "Streamlined booking system for patients to schedule visits with healthcare providers."
    },
    {
      icon: <Clock className="h-10 w-10 text-purple-500" />,
      title: "Real-time Notifications",
      description: "Instant alerts for appointments, medication reminders, and important updates."
    },
    {
      icon: <Shield className="h-10 w-10 text-yellow-500" />,
      title: "Secure Communication",
      description: "HIPAA-compliant messaging between patients and healthcare providers."
    },
    {
      icon: <BarChart className="h-10 w-10 text-red-500" />,
      title: "Analytics Dashboard",
      description: "Data-driven insights for healthcare providers to monitor patient outcomes."
    },
    {
      icon: <Stethoscope className="h-10 w-10 text-indigo-500" />,
      title: "Treatment Plans",
      description: "Customized care plans and progress tracking for improved patient outcomes."
    }
  ];

  const testimonials = [
    {
      quote: "CareConnect has revolutionized how we manage patient care. The integrated system makes coordination between departments seamless.",
      name: "Dr. Sarah Johnson",
      role: "Cardiologist"
    },
    {
      quote: "As a nurse, I can now easily access patient information and update vitals in real-time. It's made our workflow so much more efficient.",
      name: "Mark Williams",
      role: "Head Nurse"
    },
    {
      quote: "I love being able to schedule appointments and access my medical records from my phone. The reminders for medication are a lifesaver!",
      name: "Emma Davis",
      role: "Patient"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-muted">
      {/* Animated background beam */}
      <AnimatedBeam />

      {/* Header Navigation */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg transition-all duration-300 ${
          scrolled 
            ? "bg-background/70 shadow-sm border-b border-border/20" 
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
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">CareConnect</span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm relative group">
                <span className="hover:text-primary transition-colors">Features</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#testimonials" className="text-sm relative group">
                <span className="hover:text-primary transition-colors">Testimonials</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#about" className="text-sm relative group">
                <span className="hover:text-primary transition-colors">About</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="#contact" className="text-sm relative group">
                <span className="hover:text-primary transition-colors">Contact</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Link href="/login" className="text-sm relative group">
                <span className="hover:text-primary transition-colors">Login</span>
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/register")}
                className="bg-primary/10 hover:bg-primary/20 text-primary font-medium"
              >
                Sign Up
              </Button>
            </nav>
            
            {/* Mobile Menu Button */}
            <motion.button 
              className="md:hidden p-2 rounded-full hover:bg-muted/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
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
              <Link href="#features" className="hover:text-primary transition-colors px-2 py-1">Features</Link>
              <Link href="#testimonials" className="hover:text-primary transition-colors px-2 py-1">Testimonials</Link>
              <Link href="#about" className="hover:text-primary transition-colors px-2 py-1">About</Link>
              <Link href="#contact" className="hover:text-primary transition-colors px-2 py-1">Contact</Link>
              <Link href="/login" className="hover:text-primary transition-colors px-2 py-1">Login</Link>
              <Button 
                variant="ghost"
                onClick={() => router.push("/register")}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium"
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="mb-6 flex items-center">
                <Heart className="h-12 w-12 text-primary mr-4" />
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  <AnimatedGradientText>CareConnect</AnimatedGradientText>
                </h1>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Healthcare Management Reimagined
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                A comprehensive platform connecting healthcare professionals and patients
                for seamless, efficient, and personalized healthcare delivery.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => router.push("/register")}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/login")}
                >
                  Login
                </Button>
              </div>
            </motion.div>
            
            {/* Healthcare Connection Beams visible on all screen sizes */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HealthcareConnectionBeams />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20" id="features">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline healthcare delivery and enhance patient outcomes.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20 bg-muted/50" id="testimonials">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from healthcare professionals and patients using CareConnect every day.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                <div className="mb-6 text-4xl">"</div>
                <p className="mb-6 italic text-lg">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20" id="about">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Healthcare Delivery?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals and patients already using CareConnect.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
              onClick={() => router.push("/register")}
            >
              Sign Up Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-muted/80 border-t border-border/50" id="contact">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">CareConnect</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">About</a>
              <a href="#" className="hover:text-primary">Features</a>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CareConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
