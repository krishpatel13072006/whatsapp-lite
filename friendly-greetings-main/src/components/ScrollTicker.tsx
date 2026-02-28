import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollTicker: React.FC = () => {
  const { scrollY } = useScroll();
  const x1 = useTransform(scrollY, [0, 3000], [0, -1000]);
  const x2 = useTransform(scrollY, [0, 3000], [-1000, 0]);

  const words = ["REAL-TIME", "SECURE", "FAST", "INTUITIVE", "POWERFUL", "MODERN", "RELIABLE", "SEAMLESS"];

  return (
    <div className="py-16 overflow-hidden relative">
      <div className="absolute inset-0 hero-glow opacity-30" />
      <motion.div style={{ x: x1 }} className="flex gap-8 mb-6 whitespace-nowrap">
        {[...words, ...words, ...words].map((word, i) => (
          <span key={i} className={i % 2 === 0 ? "ticker-text" : "ticker-text-fill"}>
            {word}
          </span>
        ))}
      </motion.div>
      <motion.div style={{ x: x2 }} className="flex gap-8 whitespace-nowrap">
        {[...words, ...words, ...words].map((word, i) => (
          <span key={i} className={i % 2 === 1 ? "ticker-text" : "ticker-text-fill"}>
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default ScrollTicker;
