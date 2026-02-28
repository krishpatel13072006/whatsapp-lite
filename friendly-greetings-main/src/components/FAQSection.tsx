import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const FAQ = [
  { q: "Is WhatsApp-Lite free to use?", a: "Yes! The basic version is completely free. We offer optional paid plans for power users." },
  { q: "Is my data secure?", a: "Absolutely. We use end-to-end encryption for all messages and follow industry best practices." },
  { q: "Can I use it on multiple devices?", a: "Yes, your chats sync across all your devices automatically." },
  { q: "How do I import my contacts?", a: "Simply sign up and we'll automatically find contacts who are already on the platform." },
];

const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-label">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQ.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-foreground text-sm">{item.q}</span>
                <ChevronRight
                  size={18}
                  className={`text-muted-foreground transition-transform ${openIdx === idx ? 'rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
