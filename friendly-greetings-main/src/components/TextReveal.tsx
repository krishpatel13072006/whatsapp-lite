import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface TextRevealWordProps {
  word: string;
  index: number;
  totalWords: number;
  scrollYProgress: any;
}

const TextRevealWord: React.FC<TextRevealWordProps> = ({ word, index, totalWords, scrollYProgress }) => {
  const start = index / totalWords;
  const end = start + 1 / totalWords;
  const opacity = useTransform(scrollYProgress, [start, end], [0.1, 1]);
  const y = useTransform(scrollYProgress, [start, end], [8, 0]);

  return (
    <motion.span style={{ opacity, y }} className="inline-block mr-[0.3em] text-foreground font-display">
      {word}
    </motion.span>
  );
};

interface TextRevealProps {
  text: string;
}

const TextReveal: React.FC<TextRevealProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 40%"],
  });

  const words = text.split(" ");

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-6">
      <p className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
        {words.map((word, i) => (
          <TextRevealWord key={i} word={word} index={i} totalWords={words.length} scrollYProgress={scrollYProgress} />
        ))}
      </p>
    </div>
  );
};

export default TextReveal;
