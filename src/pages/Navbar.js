/* src/pages/Navbar.js */
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, X } from "lucide-react";
import api, { setAuthToken } from "../api/client";
import LoadingOverlay from "../components/LoadingOverlay";


import "../styles/Navbar.css";

const Navbar = ({
  isLoggedIn,
  setIsLoggedIn,
  userRole,
  setUserRole,
  scrollToHome,
  scrollToAbout,
  scrollToEvents,
  theme,
  onToggleTheme,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onDismissNotif,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // Profile Avatar State & Dropdown
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // ✅ Mobile drawer state
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [menuOpen]);

  // Scroll to top on route change (your existing behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
  };

  const finalizeLogout = React.useCallback(() => {
    try {
      // ✅ clear auth storage
      localStorage.removeItem("token");
      localStorage.setItem("eventlys_isLoggedIn", "false");
      localStorage.setItem("eventlys_userRole", "user");
      localStorage.removeItem("userId");

      // ✅ remove axios auth header
      setAuthToken(null);

      // ✅ update app state
      setIsLoggedIn(false);
      setUserRole("user");

      // ✅ navigate home
      navigate("/");
      window.scrollTo(0, 0);
    } finally {
      // ✅ ALWAYS turn off overlay
      setIsLoggingOut(false);
    }
  }, [setIsLoggedIn, setUserRole, navigate]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch avatar whenever logged in or location changes
  useEffect(() => {
    if (isLoggedIn) {
      const fetchAvatar = async () => {
        try {
          const response = await api.get(`/users/me/avatar?t=${Date.now()}`, { responseType: 'blob' });
          if (response.data && response.data.size > 0) {
            setAvatarUrl(URL.createObjectURL(response.data));
          } else {
            setAvatarUrl(null);
          }
        } catch (error) {
          setAvatarUrl(null);
        }
      };
      
      setTimeout(fetchAvatar, 100);
    } else {
      setAvatarUrl(null);
    }
  }, [isLoggedIn, location.pathname]);

  const handleNavClick = (scrollFunc) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.scrollTo(0, 0);
        scrollFunc();
      }, 100);
    } else {
      scrollFunc();
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoggingOut && <LoadingOverlay key="logout-overlay" theme={theme} onComplete={finalizeLogout} speedMultiplier={2.5} />}
      </AnimatePresence>

      <nav className={`main-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div
          className="nav-logo"
          onClick={() => handleNavClick(scrollToHome)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <img src="/favicon.png" alt="Logo" className="navbar-logo-circle" />
          <span className="brand-text">
            EVENTLY<sup className="gold-superscript">$</sup>
          </span>
        </div>

        {/* Desktop links */}
        <div className="nav-links">
          <span className="nav-item" onClick={() => handleNavClick(scrollToHome)}>
            Home
          </span>
          <span className="nav-item" onClick={() => handleNavClick(scrollToAbout)}>
            About
          </span>
          <span className="nav-item" onClick={() => navigate("/events")}>
            Events
          </span>

          {userRole !== "admin" && (
                  <span
                    className="nav-item"
                    style={{ marginRight: "15px", textDecoration: "none" }}
                    onClick={() => navigate("/support")}
                  >
                    Help
                  </span>
                )}

          {/* REGISTER EVENT: Only if Logged In AND NOT Admin */}
          {isLoggedIn && userRole !== "admin" && (
            <span className="nav-item" onClick={() => navigate("/register-event")}>
              Register Event
            </span>
          )}

          {isLoggedIn && (
            <span className="nav-item" onClick={() => navigate("/dashboard")} style={{ textTransform: 'uppercase' }}>
              User Portal
            </span>
          )}

          {isLoggedIn && (
            <span className="nav-item" onClick={() => navigate("/calendar")}>
              CALENDAR
            </span>
          )}

          {/* Auth buttons */}
          <div className="auth-btns">
            {isLoggedIn ? (
              <>
                {userRole === "admin" && (
                  <Link
                    to="/admin"
                    className="nav-item admin-link"
                    style={{
                      color: "#fccb00",
                      fontWeight: "bold",
                      marginRight: "15px",
                      textDecoration: "none",
                    }}
                  >
                    Admin Console
                  </Link>
                )}

                {/* HELP: Only if Logged In AND NOT Admin */}
                

                <button onClick={handleLogout} className="btn-login-outline">
                  Logout
                </button>

                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={onToggleTheme}
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login-outline">
                  Login
                </Link>
                <Link to="/register" className="btn-register-fill">
                  Register
                </Link>

                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={onToggleTheme}
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </>
            )}
          </div>

          {/* Notifications (desktop) */}
          {isLoggedIn && (
            <div className="notification-wrapper" ref={notifRef}>
              <div
                className={`nav-icon ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => {
                  setShowNotif((prev) => !prev);
                  if (onMarkAllRead) onMarkAllRead();
                }}
                title="Notifications"
              >
                <i className="far fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge-dot"></span>}
              </div>

              {showNotif && (
                <div className="notification-dropdown">
                  <div className="notif-header">Notifications</div>

                  {notifications.length === 0 ? (
                    <div className="notif-item">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div className="notif-item" key={n.id}>
                        <p>
                          <strong>{n.title}</strong> {n.message}
                        </p>
                        <span>{n.time}</span>

                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "0.75rem",
                            color: "#888",
                            cursor: "pointer",
                          }}
                          onClick={() => onDismissNotif && onDismissNotif(n.id)}
                        >
                          Dismiss
                        </div>
                      </div>
                    ))
                  )}

                  <div className="notif-footer" onClick={() => setShowNotif(false)}>
                    Close
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown (Extreme Right) */}
          {isLoggedIn && (
            <div className="profile-wrapper" ref={profileRef}>
              <div 
                className="profile-avatar-trigger"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="navbar-avatar-img" />
                ) : (
                  <div className="navbar-avatar-placeholder">
                    <i className="far fa-user"></i>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    className="profile-dropdown-menu"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="profile-dropdown-item" onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}>
                      <i className="far fa-user"></i> Profile
                    </div>
                    <div className="profile-dropdown-item" onClick={() => { navigate('/dashboard'); setShowProfileMenu(false); }}>
                      <i className="fas fa-th-large"></i> User Portal
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ✅ Hamburger button should be OUTSIDE .nav-links so it shows on mobile */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* ✅ Mobile drawer */}
      {menuOpen && (
        <>
          <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="nav-drawer">
            <div className="drawer-header">
              <div className="drawer-brand">
                EVENTLY<sup className="gold-superscript">$</sup>
              </div>
              <button
                className="drawer-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="drawer-links">
              <button className="drawer-link" onClick={() => handleNavClick(scrollToHome)}>
                Home
              </button>
              <button className="drawer-link" onClick={() => handleNavClick(scrollToAbout)}>
                About
              </button>
              <button className="drawer-link" onClick={() => navigate("/events")}>
                Events
              </button>
              <button className="drawer-link" onClick={() => navigate("/support")}>
                Help
              </button>

              {isLoggedIn && userRole !== "admin" && (
                <button className="drawer-link" onClick={() => navigate("/register-event")}>
                  Register Event
                </button>
              )}

              {isLoggedIn && (
                <button className="drawer-link" onClick={() => navigate("/calendar")}>
                  Calendar
                </button>
              )}
            </div>

            <div className="drawer-actions">
              <button
                type="button"
                className="theme-toggle-btn drawer-theme"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Moon size={18} className="inline-block mr-2" /> : <Sun size={18} className="inline-block mr-2" />} Theme
              </button>

              {isLoggedIn ? (
                <>
                  {userRole === "admin" && (
                    <button className="drawer-primary" onClick={() => navigate("/admin")}>
                      Admin Console
                    </button>
                  )}

                  <button className="drawer-primary" onClick={() => navigate("/dashboard")}>
                    User Portal
                  </button>

                  <button className="drawer-primary" onClick={() => navigate("/settings")}>
                    Settings
                  </button>

                  <button className="drawer-secondary" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button className="drawer-primary" onClick={() => navigate("/login")}>
                    Login
                  </button>
                  <button className="drawer-secondary" onClick={() => navigate("/register")}>
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
