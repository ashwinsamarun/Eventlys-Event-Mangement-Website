import React, { useRef } from "react";

const MagneticButton = ({ children, className, onClick }) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    ref.current.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  };

  const reset = () => {
    ref.current.style.transform = "translate(0px,0px)";
  };

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ transition: "transform 0.2s ease" }}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
