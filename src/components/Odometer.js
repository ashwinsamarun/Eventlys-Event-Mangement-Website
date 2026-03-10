// src/components/Odometer.js
import React, { useEffect, useMemo, useRef, memo } from "react";

const Odometer = ({ value, triggerId }) => {
  const numberRef = useRef(null);
  const frameRef = useRef(null);
  const observerRef = useRef(null);
  const hasRunRef = useRef(false);

  const target = useMemo(() => {
    const n = Number(String(value).replace(/[^0-9]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [value]);

  useEffect(() => {
    const el = numberRef.current;
    if (!el) return;

    // Reset if parent wants to force rerun
    if (triggerId !== undefined && triggerId !== null) {
      hasRunRef.current = false;
      el.textContent = "0";
    }

    const duration = 1800;

    const startAnimation = () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      let startTime = null;

      const animate = (time) => {
        if (!startTime) startTime = time;
        const progress = time - startTime;

        const t = Math.min(progress / duration, 1);
        const current = Math.floor(target * t);

        // Direct DOM update — no React rerender
        el.textContent = current.toLocaleString();

        if (t < 1) frameRef.current = requestAnimationFrame(animate);
      };

      frameRef.current = requestAnimationFrame(animate);
    };

    // ✅ Animate only when visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          startAnimation();
          // run once
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observerRef.current.observe(el);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      observerRef.current?.disconnect();
    };
  }, [target, triggerId]);

  return <h3 ref={numberRef}>0</h3>;
};

export default memo(Odometer);
