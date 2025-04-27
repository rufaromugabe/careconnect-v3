"use client";

import type React from "react";
import { useState, useEffect } from "react";
import LoginComponent from "@/components/auth/login";
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
} from "lucide-react";
import { AnimatedBeam, AnimatedGradientText } from "@/components/ui/animated-beam";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { user, session, getUserRole } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const roleIcons = [
    { Icon: Stethoscope, label: "Doctor", delay: 0.1, color: "text-blue-500" },
    { Icon: Thermometer, label: "Nurse", delay: 0.2, color: "text-green-500" },
    { Icon: User, label: "Patient", delay: 0.3, color: "text-purple-500" },
    { Icon: Flask, label: "Pharmacist", delay: 0.4, color: "text-orange-500" },
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

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-32">
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
                  onClick={() => {
                    const loginSection = document.getElementById("login-section");
                    if (loginSection) {
                      loginSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
            
            {/* Right side - if not logged in, show login component */}
            {!isLoggedIn && (
              <motion.div 
                className="flex-1 flex justify-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                id="login-section"
              >
                <LoginComponent />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Role Icons Section */}
      <section className="relative z-10 py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.h2 
            className="text-3xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Connecting Everyone in Healthcare
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            {roleIcons.map(({ Icon, label, delay, color }, index) => (
              <motion.div
                key={label}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.2, duration: 0.5 }}
              >
                <div className={`p-6 rounded-full bg-background shadow-lg mb-4 ${color}`}>
                  <Icon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-medium">{label}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
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
      <section className="relative z-10 py-20 bg-muted/50">
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
      <section className="relative z-10 py-20">
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
      <footer className="relative z-10 py-12 bg-muted/80 border-t border-border/50">
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
