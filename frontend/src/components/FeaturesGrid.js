import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ShieldCheck, Image, Video,
  EyeOff, Lock, Smile, Edit3,
  Users, Settings, SendHorizontal, Link,
  PlaySquare, Timer, Palette, MessageSquare,
  QrCode, Bookmark, Paperclip, Mic,
  Wifi, Cloud, Bell, CheckCircle,
} from 'lucide-react';

const FEATURES = [
  { title: "Real-Time Messaging", desc: "Instant message delivery with WebSocket connections for seamless communication.", icon: MessageCircle, img: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=400&h=400&fit=crop&q=80" },
  { title: "E2E Encryption", desc: "End-to-end encryption keeping your conversations private and secure.", icon: ShieldCheck, img: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=400&fit=crop&q=80" },
  { title: "Media Sharing", desc: "Share images, videos, documents effortlessly.", icon: Image, img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop&q=80" },
  { title: "Voice & Video Calls", desc: "High-quality calls with WebRTC technology.", icon: Video, img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop&q=80" },
  { title: "Privacy Controls", desc: "Manage who sees your status and activity.", icon: EyeOff, img: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=400&fit=crop&q=80" },
  { title: "Two-Step Verification", desc: "Extra layer of security with PIN protection.", icon: Lock, img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop&q=80" },
  { title: "Message Reactions", desc: "React to messages with emojis instantly.", icon: Smile, img: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=400&h=400&fit=crop&q=80" },
  { title: "Edit & Delete", desc: "Edit or delete messages for everyone.", icon: Edit3, img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop&q=80" },
  { title: "Group Chats", desc: "Groups with up to 256 members.", icon: Users, img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop&q=80" },
  { title: "Admin Controls", desc: "Manage members and group settings.", icon: Settings, img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop&q=80" },
  { title: "Broadcast Lists", desc: "Message multiple contacts at once.", icon: SendHorizontal, img: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=400&fit=crop&q=80" },
  { title: "Group Links", desc: "Share invite links to add members.", icon: Link, img: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=400&h=400&fit=crop&q=80" },
  { title: "Status Updates", desc: "24-hour disappearing media updates.", icon: PlaySquare, img: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=400&fit=crop&q=80" },
  { title: "Disappearing Messages", desc: "Auto-delete messages after viewing.", icon: Timer, img: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=400&fit=crop&q=80" },
  { title: "Custom Themes", desc: "Personalize with wallpapers and dark mode.", icon: Palette, img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80" },
  { title: "QR Code Sharing", desc: "Scan QR codes to connect instantly.", icon: QrCode, img: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400&h=400&fit=crop&q=80" },
  { title: "Starred Messages", desc: "Bookmark important messages.", icon: Bookmark, img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=400&fit=crop&q=80" },
  { title: "File Transfers", desc: "Share files up to 100MB.", icon: Paperclip, img: "https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=400&h=400&fit=crop&q=80" },
  { title: "Voice Messages", desc: "Record and send voice notes.", icon: Mic, img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&q=80" },
  { title: "Push Notifications", desc: "Stay updated with instant alerts.", icon: Bell, img: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400&h=400&fit=crop&q=80" },
  { title: "Multi-Device Sync", desc: "Access chats from all devices.", icon: Cloud, img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop&q=80" },
  { title: "Online Status", desc: "See when contacts are active.", icon: Wifi, img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop&q=80" },
  { title: "Read Receipts", desc: "Know when messages are read.", icon: CheckCircle, img: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=400&fit=crop&q=80" },
  { title: "Message Bubbles", desc: "Customize bubble styles and colors.", icon: MessageSquare, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&q=80" },
];

const FeaturesGrid = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [angle, setAngle] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useAnimationFrame((_, delta) => {
    if (!isPaused) {
      setAngle(prev => (prev + delta * 0.008) % 360);
    }
  });

  const count = FEATURES.length;
  const radius = isMobile ? 140 : 320;
  const cardSize = isMobile ? 56 : 90;

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-8 md:mb-16"
        >
          <span className="section-label">Architecture</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mt-4 mb-4 text-foreground">
            Architectural Features
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Core modules designed for performance, security, and seamless user experience.
          </p>
        </motion.div>

        {/* Circular Carousel */}
        <div
          className="relative mx-auto"
          style={{ width: isMobile ? 340 : 740, height: isMobile ? 340 : 740 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => { setIsPaused(false); }}
        >
          {/* Center glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-primary/10 blur-[60px] md:blur-[80px]" />
          </div>

          {/* Orbit ring */}
          <div
            className="absolute rounded-full border border-border/30"
            style={{
              width: radius * 2,
              height: radius * 2,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Feature cards in circle */}
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const itemAngle = (360 / count) * idx + angle;
            const rad = (itemAngle * Math.PI) / 180;
            const centerX = (isMobile ? 340 : 740) / 2;
            const centerY = (isMobile ? 340 : 740) / 2;
            const x = centerX + Math.cos(rad) * radius - cardSize / 2;
            const y = centerY + Math.sin(rad) * radius - cardSize / 2;
            const isActive = activeIndex === idx;

            return (
              <motion.div
                key={idx}
                className="absolute cursor-pointer group"
                style={{
                  left: x,
                  top: y,
                  width: cardSize,
                  height: cardSize,
                  zIndex: isActive ? 40 : 10,
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
                animate={{
                  scale: isActive ? 1.3 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-full h-full rounded-xl md:rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg relative">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute bottom-1 left-1 right-1 md:bottom-1.5 md:left-1.5">
                    <Icon size={isMobile ? 12 : 16} className="text-primary" />
                  </div>
                </div>

                {/* Tooltip on hover - desktop only */}
                <AnimatePresence>
                  {isActive && !isMobile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute left-1/2 -translate-x-1/2 w-48 md:w-64 glass-card p-3 md:p-4 pointer-events-none"
                      style={{ top: cardSize + 8, zIndex: 60 }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="feature-icon-wrap !w-7 !h-7 md:!w-8 md:!h-8 !rounded-lg">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground text-xs md:text-sm">{feature.title}</h4>
                      </div>
                      <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed">{feature.desc}</p>
                      <img
                        src={feature.img}
                        alt={feature.title}
                        className="w-full h-20 md:h-28 object-cover rounded-lg mt-2 border border-border/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Center content - clickable to show details */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex !== null && activeIndex !== -1) {
                setActiveIndex(null);
              } else {
                setActiveIndex(0);
              }
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer"
            aria-label="View features"
          >
            <div className="text-center pointer-events-none">
              <motion.div
                animate={{ rotate: -angle }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-2 md:mb-3"
              >
                <MessageCircle size={isMobile ? 20 : 28} className="text-primary" />
              </motion.div>
              <p className="text-foreground font-display font-bold text-sm md:text-lg">{count}</p>
              <p className="text-muted-foreground text-[10px] md:text-xs">Features</p>
            </div>
          </button>
        </div>

        {/* Feature Detail Modal - Single centered view */}
        <AnimatePresence>
          {activeIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                // Only close if clicking the backdrop, not the modal content
                if (e.target === e.currentTarget) {
                  setActiveIndex(null);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-5 max-w-sm w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="feature-icon-wrap !w-10 !h-10 !rounded-xl">
                      {React.createElement(FEATURES[activeIndex].icon, { size: 20, className: "text-primary" })}
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{FEATURES[activeIndex].title}</h3>
                  </div>
                  <button
                    onClick={() => setActiveIndex(null)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{FEATURES[activeIndex].desc}</p>
                <img
                  src={FEATURES[activeIndex].img}
                  alt={FEATURES[activeIndex].title}
                  className="w-full h-40 object-cover rounded-xl border border-border/30"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FeaturesGrid;
