/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Github, ArrowRight, Download } from 'lucide-react';
import KineticGrid from './KineticGrid';
import { initPWAInstall, getDeferredPrompt, setDeferredPrompt, isPWAInstalled } from '../hooks/usePWAInstall';

const HeroSection = ({ onGetStarted }) => {
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  useEffect(() => {
    // Initialize PWA install handler (suppressing setIsInstallable if not used)
    initPWAInstall(() => { });
  }, []);

  const handleInstall = async () => {
    const prompt = getDeferredPrompt();
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else {
      // Fallback: show alert with instructions
      alert('To install WhatsAppLite as an app:\n\n1. Click the browser menu (⋮)\n2. Select "Install WhatsAppLite" or "Add to Home Screen"\n\nor\n\nUse Chrome/Edge for the best install experience.');
    }
  };

  const handleGetStarted = async () => {
    // First try to install
    const prompt = getDeferredPrompt();
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          return;
        }
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    }
    // Then go to the app
    if (onGetStarted) {
      onGetStarted();
    }
  };

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <KineticGrid />
      </div>

      <motion.div
        style={{ y: yBg, opacity: opacityBg, scale: scaleBg }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="absolute w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-primary/10 blur-[80px] md:blur-[120px]" />
        <div className="absolute w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full border border-primary/20 animate-spin-slow" />
        <div className="absolute w-[350px] md:w-[550px] h-[350px] md:h-[550px] rounded-full border border-primary/10 animate-spin-reverse" style={{ borderStyle: 'dashed' }} />
        <div className="absolute w-[450px] md:w-[700px] h-[450px] md:h-[700px] rounded-full border border-primary/5 animate-spin-slower" />

        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[15%] w-2 md:w-3 h-2 md:h-3 rounded-full bg-primary/60" />
        <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[30%] right-[20%] w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-primary/40" />
      </motion.div>

      <div className="relative z-10 text-center px-2 md:px-6 max-w-4xl">


        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] mb-4 md:mb-6"
        >
          <span className="text-foreground">Communication,</span>
          <br />
          <span className="text-gradient">Engineered.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed"
        >
          A high-performance, real-time messaging architecture with end-to-end
          encryption and total privacy controls.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4"
        >
          <button
            onClick={handleGetStarted}
            className="group w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            Start Chatting
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Always visible Install button - shows permanently */}
          <button
            onClick={handleInstall}
            className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 border border-border text-foreground font-semibold rounded-xl hover:bg-muted/50 transition-all flex items-center justify-center gap-2 bg-background/50 backdrop-blur-sm"
          >
            <Download size={18} />
            Install App
          </button>

          <button className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2">
            <Github size={18} />
            View Source
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
