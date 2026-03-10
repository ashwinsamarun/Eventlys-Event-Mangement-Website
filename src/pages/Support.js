/* src/pages/Support.js */
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import '../styles/Settings.css'; // ensure we get the toast CSS

const Support = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;
    
    setIsSubmitting(true);
    // Simulate an API network request to a support desk
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ subject: '', message: '' });
      showToast("Support ticket successfully submitted! We will email you shortly.");
    }, 1500);
  };

  const faqs = [
    { q: "How do I access my purchased tickets?", a: "Once you purchase or join an event, your digital ticket is instantly available in your Dashboard under the 'My Schedule' tab." },
    { q: "What is the refund policy?", a: "Refunds strictly depend on the event organizer's policy. Please contact the organizer directly or reach out to our support team at least 48 hours before the event starts." },
    { q: "How can I host my own event?", a: "Users can submit an event request via the 'Create Event' button. Once reviewed and approved by an Administrator, your event will go live on the Discover feed." },
    { q: "Can I transfer my ticket?", a: "Currently, tickets are locked directly to the email address used during registration. Ticket transfers are disabled to prevent scalping." },
    { q: "Is there a dark mode?", a: "Yes! Eventlys features a fully integrated dynamic Dark Mode that syncs with your system preferences or via the toggle in the Navigation Bar." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
    {toast.show && (
      <div className={`settings-toast ${toast.type} animate-slide-in`} style={{ zIndex: 9999 }}>
        <span className="toast-dot"></span>
        {toast.message}
      </div>
    )}
    <div className="support-container animate-up">
      <header className="support-hero">
        <h1 className="cinzel-font">Help & <span>Support</span></h1>
        <p>Find instant answers or securely contact our response team.</p>
      </header>

      <div className="support-grid">
        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="cinzel-font">Common <span>Questions</span></h2>
          <div className="faq-list">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`} style={{ borderColor: isOpen ? 'var(--dash-gold)' : '' }}>
                  <div className="faq-question" onClick={() => setActiveFaq(isOpen ? null : i)}>
                    <span>{faq.q}</span>
                    <motion.i 
                      className="fas fa-chevron-down"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ color: isOpen ? 'var(--dash-gold)' : 'var(--dash-muted)' }}
                    ></motion.i>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="faq-answer">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-card glass-panel">
          <h2 className="cinzel-font">Contact <span>Us</span></h2>
          <p style={{ color: 'var(--dash-muted)', marginBottom: 20, fontSize: '14px' }}>Fill out the form below and we will get back to you securely.</p>
          <form onSubmit={handleContactSubmit}>
            <input 
              type="text" 
              placeholder="Subject" 
              required 
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              disabled={isSubmitting}
            />
            <textarea 
              placeholder="Describe your issue or request securely..." 
              rows="5" 
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              disabled={isSubmitting}
            ></textarea>
            <button 
              type="submit" 
              className="btn-auth-main" 
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? "Submitting Ticket..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export default Support;