"use client";

import { motion } from 'framer-motion';

export default function RiverDivider() {
  return (
    <div className="relative w-full h-[2px] my-16 md:my-24 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1E5EFF]/30 via-[#16C4D9]/30 via-[#3AF6C3]/30 to-transparent" />
      
      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2
        }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          width: '200px'
        }}
      />
      
      {/* Flowing particles */}
      <div className="absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-1 h-full bg-gradient-to-r from-[#1E5EFF] to-[#16C4D9] rounded-full opacity-60"
            initial={{ x: '-10px', scale: 0 }}
            animate={{ x: 'calc(100vw + 10px)', scale: [0, 1, 1, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}