import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/LoadingOverlay.css';

const LoadingOverlay = ({ onComplete, theme, speedMultiplier = 1 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smoother, slightly slower duration for the fluid fill effect bringing it to ~2.2s total
    const duration = 2200 / speedMultiplier; 
    const intervalTime = 16; // approx 60fps
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          clearInterval(timer);
          // Wait for the logo "push in" animation to finish, then trigger the fade-in of the homepage
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 800 / speedMultiplier);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete, speedMultiplier]);

  // For light/dark theme adaptation
  const activeTheme = theme || localStorage.getItem("theme") || "dark";
  const isDark = activeTheme === "dark";
  const bgColor = isDark ? "#08090b" : "#f7f8fa"; 
  const textColor = isDark ? "#ffffff" : "#111111"; 
  const outlineColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
  
  // Create EXTREMELY erratic, layering SVG fluid waves
  // Use slightly translucent gold colors so they multiply over each other forming life-like depth
  const fill1 = encodeURIComponent("rgba(252, 203, 0, 0.8)");
  const fill2 = encodeURIComponent("rgba(252, 203, 0, 0.5)");
  const fill3 = encodeURIComponent("rgba(252, 203, 0, 0.3)");

  // Deep crests, smooth curves, completely offset paths
  const waveSvg1 = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200' preserveAspectRatio='none'><path d='M 0 100 C 50 20, 150 20, 200 100 C 250 180, 350 180, 400 100 L 400 200 L 0 200 Z' fill='${fill1}'/></svg>")`;
  const waveSvg2 = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200' preserveAspectRatio='none'><path d='M 0 100 C 50 160, 150 160, 200 100 C 250 40, 350 40, 400 100 L 400 200 L 0 200 Z' fill='${fill2}'/></svg>")`;
  const waveSvg3 = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200' preserveAspectRatio='none'><path d='M 0 100 C 100 -20, 300 -20, 400 100 C 500 220, 700 220, 800 100 L 800 200 L 0 200 Z' fill='${fill3}'/></svg>")`;

  return (
    <motion.div 
      className={`global-loader-overlay`}
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.4 / speedMultiplier }} 
    >
      <div className="neoleaf-loader-content">
        {/* Scale the text OUT of the camera dynamically when we hit 100 before we vanish */}
        <motion.div 
           className="neoleaf-text-wrapper"
           initial={{ scale: 1, opacity: 1 }}
           animate={{ 
             scale: progress === 100 ? 4 : 1, // Massive push-in
             opacity: progress === 100 ? 0 : 1 
           }}
           transition={{ duration: 0.8 / speedMultiplier, ease: "easeInOut" }}
        >
          {/* Outline Text (Background) */}
          <h1 
            className="neoleaf-text outline-text"
            style={{ WebkitTextStrokeColor: outlineColor }}
          >
            EVENTLY<span className="neoleaf-superscript">$</span>
            
            <div className="neoleaf-counter" style={{ color: textColor }}>
              {Math.floor(progress)}<span className="percent-sign">%</span>
            </div>
          </h1>
          
          {/* Filled Text (Erratic Liquid Wave Foreground) */}
          <h1 
            className="neoleaf-text filled-text liquid-wave-fill"
            style={{ 
              backgroundImage: `${waveSvg1}, ${waveSvg2}, ${waveSvg3}`,
              backgroundPositionY: `${progress}%, ${progress}%, ${progress}%`
            }}
          >
            EVENTLY<span className="neoleaf-superscript">$</span>
          </h1>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;