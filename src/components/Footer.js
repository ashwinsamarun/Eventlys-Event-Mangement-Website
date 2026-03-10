/* src/components/Footer.js */
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer-main">
      <div className="footer-container">
        {/* Section 1: About - Keeping your original description */}
        <div className="footer-section animate-up">
          <h3 className="footer-logo">EVENTLY<sup className="gold-superscript">$</sup></h3>
          <p className="footer-description">
            Engineering seamless connections through sophisticated event management.
             <span>EVENTLY<sup className="gold-superscript">$</sup></span>  provides the tools to curate, manage, and scale meaningful experiences for organizers and attendees alike.
          </p>
        </div>

        {/* Section 2: Navigation Links */}
        <div className="footer-section animate-up" style={{ animationDelay: '0.1s' }}>
          <h4 className="footer-heading">Navigation</h4>
          <ul className="footer-links">
            <li><Link to="/events">Discover</Link></li>
            <li><Link to="/dashboard">My Schedule</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </div>

        {/* Section 3: Contact & Socials */}
        <div className="footer-section animate-up" style={{ animationDelay: '0.2s' }}>
          <h4 className="footer-heading">Contact Us</h4>
          <div className="contact-details">
            <p><i className="fas fa-envelope"></i> support@evently.com</p>
            <p><i className="fas fa-map-marker-alt"></i> Kochi, Kerala, 683104</p>
          </div>
          
          <div className="footer-socials">
            <a href="https://github.com/ashwinsamarun" target="_blank" rel="noopener noreferrer" className="social-icon-link">
    <i className="fab fa-github"></i>
  </a>
  <a href="https://www.instagram.com/_ashwxn_s/" target="_blank" rel="noopener noreferrer" className="social-icon-link">
    <i className="fab fa-instagram"></i>
  </a>
  <a href="https://www.linkedin.com/in/ashwin-sam-arun-01b01131a/" target="_blank" rel="noopener noreferrer" className="social-icon-link">
    <i className="fab fa-linkedin-in"></i>
  </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 EVENTLY$ Ecosystem. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;