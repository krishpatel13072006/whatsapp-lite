import React from 'react';

const TextBlock = () => (
  <div className="flex items-center justify-around w-max">
    <span className="text-xl md:text-2xl font-black text-white uppercase mx-6 tracking-widest hover:text-blue-400 transition-colors duration-300">
      whatsapplite
    </span>
    <span className="text-lg md:text-xl text-blue-400 mx-4 animate-spin-slow-mq">✨</span>
    <span className="text-xl md:text-2xl font-black text-white uppercase mx-6 tracking-widest hover:text-blue-400 transition-colors duration-300">
      Creator Krish Patel
    </span>
    <span className="text-lg md:text-xl text-blue-400 mx-4 animate-spin-slow-mq">✨</span>
    <span className="text-xl md:text-2xl font-black text-white uppercase mx-6 tracking-widest hover:text-blue-400 transition-colors duration-300">
      whatsapplite
    </span>
    <span className="text-lg md:text-xl text-blue-400 mx-4 animate-spin-slow-mq">✨</span>
    <span className="text-xl md:text-2xl font-black text-white uppercase mx-6 tracking-widest hover:text-blue-400 transition-colors duration-300">
      Creator Krish Patel
    </span>
    <span className="text-lg md:text-xl text-blue-400 mx-4 animate-spin-slow-mq">✨</span>
  </div>
);

// Generate sine wave keyframes: X moves -50% → 0%, Y follows sin curve
function buildSineKeyframes(amplitude = 14, cycles = 3) {
  const steps = 40;
  let css = '@keyframes marquee-sine {\n';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;                             // 0 → 1
    const xPct = -50 + t * 50;                      // -50% → 0%
    const yPx = amplitude * Math.sin(t * cycles * 2 * Math.PI);
    css += `  ${(t * 100).toFixed(1)}% { transform: translateX(${xPct.toFixed(2)}%) translateY(${yPx.toFixed(2)}px); }\n`;
  }
  css += '}';
  return css;
}

export default function InfiniteMarquee() {
  return (
    <div className="relative w-full overflow-hidden py-6 flex items-center">

      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-shimmer-mq pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[10, 30, 50, 70, 90].map((left, i) => (
          <div
            key={i}
            className={`absolute ${i % 2 === 0 ? 'w-3 h-3' : 'w-2 h-2'} bg-blue-400 rounded-full animate-float-mq`}
            style={{ left: `${left}%`, animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </div>

      {/* Sine wave marquee strip */}
      <div className="flex whitespace-nowrap animate-marquee-sine">
        <TextBlock />
        <TextBlock />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        ${buildSineKeyframes(14, 3)}

        .animate-marquee-sine {
          animation: marquee-sine 32s linear infinite;
          width: max-content;
        }
        .animate-marquee-sine:hover { animation-play-state: paused; }

        @keyframes shimmer-mq {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-mq { animation: shimmer-mq 4s ease-in-out infinite; }

        @keyframes float-mq {
          0%, 100% { transform: translateY(0px) scale(1);  opacity: 0.3; }
          50%       { transform: translateY(-25px) scale(1.2); opacity: 0.6; }
        }
        .animate-float-mq { animation: float-mq 5s ease-in-out infinite; }

        .animate-spin-slow-mq {
          display: inline-block;
          animation: spin-mq 3s linear infinite;
        }
        @keyframes spin-mq {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
