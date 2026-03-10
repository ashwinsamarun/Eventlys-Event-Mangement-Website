/* src/App.js */
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { getRemaining, getCapacity, getBooked } from "./utils/seats";
import api, { setAuthToken } from "./api/client";

// ✅ NEW: backend API helpers (create this file if you don’t have it yet)
import { fetchApprovedEvents, updateEvent } from "./api/event";

// Import Pages
import Navbar from "./pages/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EventsPage from "./pages/EventsPage";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Footer from "./components/Footer";
import FloatingUtilities from "./components/FloatingUtilities";
import EventDetails from "./pages/EventDetails";
import Checkout from "./pages/Checkout";
import PaymentGateway from "./pages/PaymentGateway";
import Success from "./pages/Success";
import LoadingOverlay from "./components/LoadingOverlay";
import RegisterEvent from "./pages/RegisterEvent";
import EventCalendar from "./pages/EventCalendar";
import HeroBackground from "./components/HeroBackground";
import ExpertiseSection from "./components/ExpertiseSection";

// ✅ Use existing component (instead of inline Odometer)
import Odometer from "./components/Odometer";

// Import Styles
import "./styles/App.css";
import "./styles/Navbar.css";
import "./styles/Landing.css";
import "./styles/LoadingOverlay.css";

// --- Admin Protection Wrapper ---
const AdminRoute = ({ isLoggedIn, userRole, children }) => {
  if (!isLoggedIn || userRole !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PageShell = ({ children }) => {
  return (
    <div className="page-wrapper">
      <div className="page-surface">{children}</div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
  }, []);

  // ✅ Persisted auth (so refresh doesn’t reset)
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("eventlys_isLoggedIn") === "true"
  );
  const [userRole, setUserRole] = useState(() => localStorage.getItem("eventlys_userRole") || "user");

  useEffect(() => {
    localStorage.setItem("eventlys_isLoggedIn", String(isLoggedIn));
    localStorage.setItem("eventlys_userRole", userRole);
  }, [isLoggedIn, userRole]);

  const getEventLifecycle = (event) => {
    const capacity = getCapacity(event);
    const booked = Math.max(Number(event.booked || 0), getBooked(event.id));
    const eventDate = new Date(event.date);
    const today = new Date();

    if (booked >= capacity) return "sold-out";
    if (eventDate < today) return "completed";
    return event.status || "approved";
  };

  const [notifications, setNotifications] = useState([]);

  // ✅ Pulling fetchNotifs into outer scope to be called instantly by handlers
  const fetchNotifs = async () => {
    try {
      const { data } = await api.get("/notifications/me");
      setNotifications(
        data.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: !n.read,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    let interval;
    if (isLoggedIn) {
      fetchNotifs();
      interval = setInterval(fetchNotifs, 15000); // Check for new fast
    } else {
      setNotifications([]);
    }

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllNotificationsRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (e) {}
  };

  const dismissNotification = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {}
  };

  // Theme (premium light/dark)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(theme === "light" ? "theme-light" : "theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [revealComplete, setRevealComplete] = useState(false);

  // ✅ EVENTS: now backend-driven (no hardcoded array)
  const [events, setEvents] = useState([]);

  // ✅ Load approved events from backend once (Landing + EventsPage)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await fetchApprovedEvents();
        if (!mounted) return;

        const normalized = (Array.isArray(list) ? list : []).map((e) => ({
          ...e,
          id: e._id ?? e.id, // ✅ make routing + seats utils consistent
          title: e.title,
          organizer: e.organizer || "Host",
          status: e.status || "approved",
          category: e.category || "General",
          date: e.date || (e.startAt ? String(e.startAt).slice(0, 10) : ""),
          price: e.price || "Free",
          image:
            e.image ||
            e.img ||
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800",
          location: e.location || "Venue TBA",
          time: e.time || "TBD",
          capacity: e.capacity || 300,
          booked: Number(e.booked || 0),
          description:
            e.description ||
            "A premium curated experience. Reserve your seat today.",
        }));

        setEvents(normalized);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEvents([]); // keep UI functional (shows empty state)
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Keep these functions so previous props/contracts don’t break

  const addNewEvent = (newEvent) => {
    // NOTE: RegisterEvent should POST to backend. This is kept so nothing breaks if called.
    setEvents((prev) => [
      ...prev,
      {
        ...newEvent,
        id: newEvent._id ?? newEvent.id ?? String(Date.now()),
        status: newEvent.status || "pending",
      },
    ]);
  };

  const handleUpdateStatus = async (eventId, newStatus) => {
    // Optimistic UI update (keeps old UX)
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        String(event.id) === String(eventId) ? { ...event, status: newStatus } : event
      )
    );

    // Persist to backend (admin route)
    try {
      await updateEvent(eventId, { status: newStatus });
      // 🔥 Instant Notification Refresh (Delay removed)
      if (isLoggedIn) fetchNotifs();
    } catch (err) {
      console.error("Failed to update status:", err);
      // Optional rollback (kept minimal; you can add if you want)
    }
  };

  const handleSeatsBooked = (eventId, qty) => {
    setEvents((prev) =>
      prev.map((ev) =>
        String(ev.id) === String(eventId)
          ? { ...ev, booked: Number(ev.booked || 0) + Number(qty || 0) }
          : ev
      )
    );

    // 🔥 Instant Notification Refresh (Delay removed)
    if (isLoggedIn) fetchNotifs();
  };

  // ✅ publicEvents: now uses ONLY backend events (no DEFAULT_EVENTS merge)
  const publicEvents = useMemo(() => {
    return (events || [])
      .filter((e) => e.status === "approved" && e.status !== "deleted")
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        category: e.category || "General",
        location: e.location || "Venue TBA",
        price: e.price || "Free",
        image:
          e.image ||
          "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop",
        capacity: e.capacity || 300,
        booked: e.booked || 0,
        organizer: e.organizer || "Host",
        time: e.time || "TBD",
        description: e.description || "A premium curated experience. Reserve your seat today.",
        status: e.status || "approved",
      }));
  }, [events]);

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const eventsRef = useRef(null);

  // Effect for Scroll Button & App Loading
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollBtn(window.scrollY > 500);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Reveal animations (your current behavior)
  useEffect(() => {
    if (!loading) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("revealed");
          });
        },
        { threshold: 0.05 }
      );

      if (eventsRef.current) {
        const grid = eventsRef.current.querySelector(".events-grid");
        if (grid) observer.observe(grid);
      }
      if (aboutRef.current) {
        const aboutContent = aboutRef.current.querySelector(".about-container");
        if (aboutContent) observer.observe(aboutContent);
      }

      return () => observer.disconnect();
    }
  }, [loading, isLoggedIn]);

  const scrollToSection = (elementRef) => {
    if (elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  // Hero spotlight mouse tracking (Throttled for Performance)
  useEffect(() => {
    const hero = homeRef.current;
    if (!hero) return;

    let ticking = false;
    const onMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const r = hero.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;
          hero.style.setProperty("--mx", `${x}%`);
          hero.style.setProperty("--my", `${y}%`);
          ticking = false;
        });
        ticking = true;
      }
    };

    hero.addEventListener("mousemove", onMove, { passive: true });
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  // Global App Mousemove for global --mouse-x/y (Throttled for Performance)
  useEffect(() => {
    let frame;
    const handleGlobalMove = (e) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
      });
    };
    window.addEventListener("mousemove", handleGlobalMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, []);

  const heroKeywords = useMemo(
    () => ["Global Tech", "Elite Gala", "Immersive Music", "Business Forums"],
    []
  );
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % heroKeywords.length), 2600);
    return () => clearInterval(t);
  }, [heroKeywords.length]);

  return (
    <div className="App">
      <AnimatePresence>
        {loading && <LoadingOverlay theme={theme} onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        userRole={userRole}
        setUserRole={setUserRole}
        scrollToHome={() => scrollToSection(homeRef)}
        scrollToAbout={() => scrollToSection(aboutRef)}
        scrollToEvents={() => scrollToSection(eventsRef)}
        theme={theme}
        onToggleTheme={toggleTheme}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllNotificationsRead}
        onDismissNotif={dismissNotification}
      />

      <motion.div
        className="app-reveal-wrapper"
        animate={{ 
          clipPath: loading ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)",
          scale: loading ? 1.15 : 1, 
          filter: loading ? "blur(15px)" : "blur(0px)",
          opacity: loading ? 0.5 : 1 
        }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1], delay: loading ? 0 : 0.1 }}
        onAnimationComplete={() => {
          if (!loading) setRevealComplete(true);
        }}
      >

      <Routes>
        <Route
          path="/"
          element={
            <div className="landing-page">
              <header className="hero-section" ref={homeRef}>
                <div className="hero-media">
                  <HeroBackground theme={theme} />

                  {/* Premium overlays */}
                  <div className="hero-vignette" />
                  <div className="hero-noise" />
                  <div className="hero-spotlight" />
                </div>

                <div className="hero-depth-layer depth-back" />
                <div className="hero-depth-layer depth-front" />

                <div className="hero-overlay">
                  <div className="hero-content">
                    <h1 className="main-title">
                      <span className="word">
                        EVENTLY<span className="superscript">$</span>
                      </span>
                    </h1>

                    <motion.h1
                      key={heroIndex}
                      className="hero-title cinzel-font"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      {heroKeywords[heroIndex]}
                    </motion.h1>

                    <p className="hero-subtitle">
                      Discover and secure your place at the world’s most impactful gatherings.
                    </p>

                    <motion.div
                      className="hero-btns"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <motion.button
                        className="btn btn-primary py-2 px-4"
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                        onClick={() => scrollToSection(eventsRef)}
                      >
                        Explore Events
                      </motion.button>

                      {isLoggedIn ? (
                        <motion.button
                          className="btn btn-primary py-2 px-4"
                          whileHover={{ y: -3, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          onClick={() => navigate("/register-event")}
                        >
                          Register Event
                        </motion.button>
                      ) : (
                        <motion.button
                          className="btn btn-primary py-2 px-4"
                          whileHover={{ y: -3, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          onClick={() => scrollToSection(aboutRef)}
                        >
                          Learn More
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
                </div>
              </header>

              <div
                className={`scroll-to-top ${showScrollBtn ? "visible" : ""}`}
                onClick={() => scrollToSection(homeRef)}
              >
                <span className="arrow-up">↑</span>
              </div>

              {/* ✅ Uses existing Odometer component */}
              {/* ✅ Uses existing Odometer component */}
              <motion.section 
                className="stats-bar"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8 }}
              >
                <div className="stat-item">
                  <Odometer value="1000" />
                  <p>MEMBERS</p>
                </div>
                <div className="stat-item">
                  <Odometer value="100" />
                  <p>ORGANIZERS</p>
                </div>
                <div className="stat-item">
                  <Odometer value="1000" />
                  <p>BOOKINGS</p>
                </div>
                <div className="stat-item">
                  <Odometer value="100" />
                  <p>CITIES</p>
                </div>
              </motion.section>

              <motion.section 
                className="about-section" 
                ref={aboutRef}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8 }}
              >
                <motion.p className="section-tag" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>WHO WE ARE</motion.p>
                <motion.h2 className="section-title" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  About Evently<span className="superscript">$</span>
                </motion.h2>
                <motion.div className="about-container" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <p>
                    <span>
                      EVENTLY<span className="superscript">$</span>
                    </span>{" "}
                    is a premier, full-stack event management ecosystem engineered to bridge the gap
                    between vision and experience.
                  </p>
                </motion.div>

                <div className="features-grid">
                  <motion.div className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.5, delay: 0.5 }} viewport={{ once: true }}>
                    <div className="feature-icon">✨</div>
                    <h3>Elite Curation</h3>
                    <p>Access only the most exclusive, high-impact gatherings globally.</p>
                  </motion.div>
                  <motion.div className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.5, delay: 0.6 }} viewport={{ once: true }}>
                    <div className="feature-icon">🌐</div>
                    <h3>Global Network</h3>
                    <p>Connect with industry leaders and visionaries across continents.</p>
                  </motion.div>
                  <motion.div className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.5, delay: 0.7 }} viewport={{ once: true }}>
                    <div className="feature-icon">🛡️</div>
                    <h3>Flawless Execution</h3>
                    <p>Seamless booking, secure access, and unparalleled support.</p>
                  </motion.div>
                </div>
              </motion.section>

              <ExpertiseSection />

              <motion.section 
                className="partner-slider-section"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                <p className="section-tag">GLOBAL PARTNERS</p>
                <div className="partner-track">
                  {["LEXUS", "GOLDMAN", "EMIRATES", "VOGUE", "APPLE", "TESLA", "ROLEX", "LEXUS", "GOLDMAN", "EMIRATES", "VOGUE", "APPLE", "TESLA", "ROLEX"].map((name, i) => (
                    <div className="partner-logo-box" key={i}>
                      <span className="partner-name-premium">{name}</span>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Modern Testimonials Section */}
              <motion.section 
                className="testimonials-section"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p className="section-tag" style={{ textAlign: "center" }}>COMMUNITY</p>
                <h2 className="section-title" style={{ textAlign: "center" }}>What Leaders Say</h2>
                <div className="testimonials-grid">
                  <motion.div className="testimonial-card" whileHover={{ y: -5, scale: 1.01 }}>
                    <div className="stars">★★★★★</div>
                    <p>"Evently$ transformed how we organize our annual summit. Flawless UI, exceptional experience."</p>
                    <div className="author">- Elena R. / Tech Founder</div>
                  </motion.div>
                  <motion.div className="testimonial-card" whileHover={{ y: -5, scale: 1.01 }}>
                    <div className="stars">★★★★★</div>
                    <p>"The only platform I trust to book premium events. The networking opportunities are unmatched."</p>
                    <div className="author">- Marcus T. / Investor</div>
                  </motion.div>
                  <motion.div className="testimonial-card" whileHover={{ y: -5, scale: 1.01 }}>
                    <div className="stars">★★★★★</div>
                    <p>"An absolute game-changer. The 3D interactions and fast booking make it a joy to use."</p>
                    <div className="author">- Sarah L. / Creative Director</div>
                  </motion.div>
                </div>
              </motion.section>

              <section className="events-grid-section" ref={eventsRef}>
                <p className="section-tag">EVENTS</p>
                <h2 className="section-title">Upcoming Events</h2>

                <motion.div 
                  className="search-container animate-up"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="search-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="event-search-input"
                      placeholder="Search for exclusive events, organizers, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="search-line"></div>
                  </div>
                  <p className="search-hint">
                    Exclusive Upcoming Experiences
                  </p>
                </motion.div>

                <div className="events-grid">
                  {publicEvents
                    .filter((event) => {
                      if (event.date) {
                        const eventDate = new Date(event.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Strip time to just compare dates
                        if (eventDate < today) return false; // Hide past events
                      }
                      return (
                        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (event.organizer || "").toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    })
                    .slice(0, 4) // Limit strictly to 4 events
                    .map((event, index) => (
                      <motion.div
                        className="event-card"
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <div
                          className="card-img-wrapper"
                          style={{
                            backgroundImage: `url(${
                              event.image ||
                              "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800"
                            })`,
                          }}
                        >
                          <div className="time-badge">
                            {event.date 
                              ? new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) 
                              : "Date TBD"
                            }
                          </div>
                        </div>

                        <div className="card-body">
                          <span className="event-category-tag">{event.category}</span>
                          <h3>{event.title}</h3>
                          <p className="pastor-text">
                            by: <span>{event.organizer}</span>
                          </p>
                          <p className="location-text">{event.location || "Location provided upon booking"}</p>

                          <div className="card-footer">
                            <span className="event-price">{event.price || "Free"}</span>

                            <div className="seat-info">
                              <div className="seat-bar">
                                <span style={{ width: `${(event.booked / event.capacity) * 100}%` }} />
                              </div>
                              <small>{getRemaining(event)} seats left</small>
                            </div>

                            <button
                              className="btn-join"
                              disabled={getEventLifecycle(event) === "sold-out"}
                              onClick={() =>
                                navigate(`/events/${event.id}`, {
                                  state: { event },
                                })
                              }
                            >
                              {getEventLifecycle(event) === "sold-out" ? "Sold Out" : "Join Us"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </section>
            </div>
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : (
            <PageShell>
              <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            </PageShell>
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : (
            <PageShell>
              <Register setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            </PageShell>
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : (
            <PageShell>
              <ForgotPassword />
            </PageShell>
            )
          }
        />

        <Route
          path="/reset-password"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : (
            <PageShell>
              <ResetPassword />
            </PageShell>
            )
          }
        />

        {/* UPDATED DASHBOARD ROUTE */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <PageShell>
                <Dashboard events={events} onUpdateStatus={handleUpdateStatus} />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/register-event"
          element={
            isLoggedIn ? (
              <PageShell>
                <RegisterEvent onAdd={addNewEvent} />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/events"
          element={
            <PageShell>
              <EventsPage events={events} />
            </PageShell>
          }
        />

        <Route
          path="/events/:id"
          element={
            <PageShell>
              <EventDetails isLoggedIn={isLoggedIn} />
            </PageShell>
          }
        />

        <Route
          path="/checkout"
          element={
            isLoggedIn ? (
              <PageShell>
                <Checkout onSeatsBooked={handleSeatsBooked} />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/payment-gateway"
          element={
            isLoggedIn ? (
              <PageShell>
                <PaymentGateway onSeatsBooked={handleSeatsBooked} />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/settings"
          element={
            isLoggedIn ? (
              <PageShell>
                <Settings />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/success"
          element={
            isLoggedIn ? (
              <PageShell>
                <Success />
              </PageShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/support"
          element={
            <PageShell>
              <Support />
            </PageShell>
          }
        />

        <Route
          path="/calendar"
          element={
            <PageShell>
              <EventCalendar events={publicEvents} />
            </PageShell>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute isLoggedIn={isLoggedIn} userRole={userRole}>
              <PageShell>
                <AdminDashboard events={events} onUpdateStatus={handleUpdateStatus} />
              </PageShell>
            </AdminRoute>
          }
        />
        
        {/* Catch-all redirect for 404 / broken routes like /profile */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <FloatingUtilities isLoggedIn={isLoggedIn} />
      <Footer />
      </motion.div>
    </div>
  );
}

export default App;