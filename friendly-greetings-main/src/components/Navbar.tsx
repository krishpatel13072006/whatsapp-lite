import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Menu, X } from 'lucide-react';

const NAV_LINKS = ['Features', 'How It Works', 'Testimonials', 'Pricing', 'FAQ', 'Contact'];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id.toLowerCase().replace(/ /g, '-'));
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle size={16} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground text-lg">WhatsAppLite</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:brightness-110 transition-all items-center gap-1.5">
              <Zap size={14} />
              Launch App
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-foreground"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[56px] z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 p-4"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link}
                  onClick={() => scrollTo(link)}
                  className="text-sm text-muted-foreground hover:text-foreground py-3 px-4 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {link}
                </button>
              ))}
              <button className="mt-2 w-full px-5 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5">
                <Zap size={14} />
                Launch App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
