import React, { useMemo } from 'react';

const GlobalBackground = ({ theme = "dark" }) => {
  const isDark = theme === "dark";
  const bgColor = isDark ? "#08090b" : "#f4f6f9";
  
  // Premium soft evently$ gold/purple accents
  const goldOrb = isDark ? "rgba(252, 203, 0, 0.12)" : "rgba(252, 203, 0, 0.2)";
  const purpleOrb = isDark ? "rgba(140, 120, 240, 0.08)" : "rgba(140, 120, 240, 0.15)";

  // Pre-calculate randomized particles (No JS execution during run)
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1.5,
      left: Math.random() * 100, // horizontal start percentage
      drift: (Math.random() * 10) - 5, // random left/right drift
      duration: Math.random() * 20 + 20, // 20-40s duration
      delay: Math.random() * -40, // stagger starts heavily
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.8 ? "#fccb00" : (isDark ? "#ffffff" : "#000000"), // mostly white/black, some gold
    }));
  }, [isDark]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -10, // Safely behind Navbar and Footer and other standard components
        background: bgColor,
        overflow: 'hidden',
        pointerEvents: 'none',
        transition: 'background 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>
        {`
          @keyframes gb-orb1 {
            0%, 100% { transform: translate(0%, 0%) scale(1); }
            33% { transform: translate(30%, -20%) scale(1.25); }
            66% { transform: translate(-10%, 10%) scale(0.85); }
          }
          @keyframes gb-orb2 {
            0%, 100% { transform: translate(0%, 0%) scale(1); }
            33% { transform: translate(-30%, 30%) scale(1.3); }
            66% { transform: translate(20%, -20%) scale(0.8); }
          }
          @keyframes gb-float {
            0% { transform: translateY(110vh) translateX(0); opacity: 0; }
            5% { opacity: var(--max-opacity); }
            95% { opacity: var(--max-opacity); }
            100% { transform: translateY(-10vh) translateX(var(--drift)); opacity: 0; }
          }
          .gb-particle {
            position: absolute;
            border-radius: 50%;
            top: 0;
            will-change: transform, opacity;
            animation: gb-float linear infinite;
          }
        `}
      </style>

      {/* Dynamic Animated Particles Layer -> 100% CSS ACCELERATED */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="gb-particle"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            left: `${p.left}vw`,
            '--max-opacity': p.opacity,
            '--drift': `${p.drift}vw`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Primary Slow Floating Gold Orb */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          background: `radial-gradient(circle, ${goldOrb} 0%, transparent 60%)`,
          filter: 'blur(80px)',
          borderRadius: '50%',
          animation: 'gb-orb1 35s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      
      {/* Secondary Purple Ambient Light (adds dynamic mood) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '70vw',
          height: '70vw',
          background: `radial-gradient(circle, ${purpleOrb} 0%, transparent 65%)`,
          filter: 'blur(90px)',
          borderRadius: '50%',
          animation: 'gb-orb2 45s ease-in-out infinite',
          willChange: 'transform',
        }}
      />

      {/* Extremely subtle digital noise layer to sell the premium look */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.04 : 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default GlobalBackground;
