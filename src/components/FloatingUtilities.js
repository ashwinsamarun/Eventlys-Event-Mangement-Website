/* src/components/FloatingUtilities.js */
import React, { useState, useEffect } from 'react';
import '../styles/FloatingUtilities.css';

const FloatingUtilities = ({ isLoggedIn }) => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 400);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <div className="floating-container">
      {/* Scroll to Top */}
      <div className={`floating-btn scroll-btn ${showScroll ? 'visible' : ''}`} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
        <i className="fas fa-arrow-up"></i>
      </div>
    </div>
  );
};

export default FloatingUtilities;