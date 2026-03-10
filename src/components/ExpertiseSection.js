import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/ExpertiseSection.css";

const tabContent = {
  "Event Management": {
    p1: "Complete end-to-end event creation and management platform designed to streamline your entire planning process.",
    p2: "Create, customize, and publish professional event pages in minutes. Manage schedules, speakers, and venue details seamlessly from one dashboard.",
    p3: "Focus on creating memorable experiences while our system handles the complex operational logistics.",
    s1Num: "10K+",
    s1Text: "events hosted",
    s2Num: "50%",
    s2Text: "time saved",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000"
  },
  "Real-time Ticketing": {
    p1: "Secure and seamless ticketing infrastructure that handles everything from free RSVPs to complex paid tiered structures.",
    p2: "Process payments globally, manage capacity automatically, and utilize rapid QR code generation for quick check-ins at the door.",
    p3: "Ensure your attendees have a frictionless booking experience from any device, anywhere in the world.",
    s1Num: "99.9%",
    s1Text: "uptime",
    s2Num: "1M+",
    s2Text: "tickets sold",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000"
  },
  "Data Analytics": {
    p1: "Make informed decisions with actionable insights into your event performance and attendee behavior patterns.",
    p2: "Track ticket sales, check-in rates, demographics, and engagement metrics in real-time through customizable reports.",
    p3: "Leverage pure data to prove your event's ROI and continuously improve your future experiences.",
    s1Num: "Real",
    s1Text: "time data",
    s2Num: "100%",
    s2Text: "custom reports",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000"
  }
};

const tabs = Object.keys(tabContent);

const ExpertiseSection = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <section className="expertise-section">
      <div className="expertise-container">
        
        {/* Left Content Area */}
        <div className="expertise-content">
          <motion.div 
            className="expertise-tag"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            OUR PLATFORM
          </motion.div>
          
          <motion.h2 
            className="expertise-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything you need
          </motion.h2>

          <motion.div 
            className="expertise-tabs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`expertise-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          {/* Animated Tab Content Selection */}
          <div className="expertise-details-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="expertise-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p>{tabContent[activeTab].p1}</p>
                <p>{tabContent[activeTab].p2}</p>
                <p>{tabContent[activeTab].p3}</p>

                <div className="expertise-stats">
                  <div className="expertise-stat-item">
                    <h3>{tabContent[activeTab].s1Num}</h3>
                    <span>{tabContent[activeTab].s1Text}</span>
                  </div>
                  <div className="expertise-stat-item">
                    <h3>{tabContent[activeTab].s2Num}</h3>
                    <span>{tabContent[activeTab].s2Text}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Image Area */}
        <motion.div 
          className="expertise-image-area"
          initial={{ opacity: 0, x: 50, rotateY: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          style={{ perspective: "1000px" }}
        >
          {/* A soft dot in the background to match design */}
          <div className="expertise-floating-dot"></div>

          <motion.div 
            className="expertise-animated-card-container"
            animate={{ 
              y: [0, -15, 0],
              rotateX: [0, 5, 0],
              rotateY: [0, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            whileHover={{ 
              scale: 1.05, 
              rotateY: -10, 
              rotateX: 10,
              transition: { duration: 0.4 }
            }}
          >
            <div className="expertise-image-glow"></div>
            <AnimatePresence mode="wait">
              <motion.img 
                key={tabContent[activeTab].image}
                src={tabContent[activeTab].image} 
                alt={activeTab} 
                className="expertise-pop-img"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
            
            {/* Decorative float UI elements to make it "pop out" */}
            <motion.div 
              className="expertise-floating-ui expertise-ui-1"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="ui-icon">✓</div>
              <div className="ui-text">Access Verified</div>
            </motion.div>

            <motion.div 
              className="expertise-floating-ui expertise-ui-2"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div className="ui-chart-bar b1"></div>
              <div className="ui-chart-bar b2"></div>
              <div className="ui-chart-bar b3"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ExpertiseSection;
