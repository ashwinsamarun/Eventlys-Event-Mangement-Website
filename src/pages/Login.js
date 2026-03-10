/* src/pages/Login.js */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";
import LoadingOverlay from "../components/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import api, { setAuthToken } from "../api/client";
import { X } from "lucide-react";


const Login = ({ setIsLoggedIn, setUserRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ checkbox toggle
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const redirectTo = location.state?.redirectTo;
    const checkoutState = location.state?.checkoutState;

    setIsAuthenticating(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      
      setAuthData({
        token: res.data.token,
        role: res.data.role,
        userId: res.data.userId,
        redirectTo,
        checkoutState,
      });

      setShowSplash(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Invalid credentials. Please check your email and password.";
      setErrorMsg(msg);
      setIsAuthenticating(false);
    }
  };

  const finalizeLogin = () => {
    if (!authData) return;
    localStorage.setItem("token", authData.token);
    localStorage.setItem("eventlys_isLoggedIn", "true");
    localStorage.setItem("eventlys_userRole", authData.role || "user");
    if (authData.userId) localStorage.setItem("userId", authData.userId);
    
    setAuthToken(authData.token);

    setIsLoggedIn(true);
    setUserRole(authData.role || "user");

    if (authData.redirectTo) navigate(authData.redirectTo, { state: authData.checkoutState });
    else navigate("/");

    window.scrollTo(0, 0);
  };

  const handleResetRequest = (e) => {
    e.preventDefault();
    alert(`Password reset link sent to: ${email || "your email"}`);
    setShowForgotModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <AnimatePresence>
          {showSplash && <LoadingOverlay onComplete={finalizeLogin} />}
        </AnimatePresence>

        <div className="auth-wrapper">
          <div className="auth-card animate-up">
            <h2 className="cinzel-font">Login</h2>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* ✅ checkbox BEFORE submit */}
              <motion.label
                className="auth-checkbox"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span className="auth-checkbox__box" aria-hidden="true" />
                <span className="auth-checkbox__text">Show password</span>
              </motion.label>

              <button type="submit" className="btn-auth-main" disabled={isAuthenticating}>
                {isAuthenticating ? "Logging in..." : "Login"}
              </button>
            </form>

            <br />

            <div className="auth-options-row">
              <span className="auth-link-alt" onClick={() => navigate("/forgot-password")}>
  Forgot password?
</span>
            </div>

            <div className="auth-footer">
              <p>
                New here?{" "}
                <span className="auth-link-alt" onClick={() => navigate("/register")}>
                  Create Account
                </span>
              </p>
            </div>
          </div>

          {/* --- FORGOT PASSWORD MODAL --- */}
          {showForgotModal && (
            <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
              <div className="modal-content animate-up" onClick={(e) => e.stopPropagation()}>
                <button className="close-panel" onClick={() => setShowForgotModal(false)}>
                  &times;
                </button>
                <h2 className="cinzel-font">
                  Reset <span>Password</span>
                </h2>
                <p className="modal-subtext">
                  Enter your email and we'll send you a link to get back into your account.
                </p>
                <form onSubmit={handleResetRequest}>
                  <input
                    type="email"
                    placeholder="Confirm Email Address"
                    required
                    className="modal-input"
                  />
                  <button type="submit" className="btn-auth-main" style={{ width: "100%" }}>
                    Send Reset Link
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- PROPER AUTH TOAST --- */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="auth-toast"
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="auth-toast__bar" style={{ background: "#ff4a4a" }} />
                <div className="auth-toast__content">
                  <h4 className="auth-toast__title">Login Failed</h4>
                  <p className="auth-toast__message">{errorMsg}</p>
                </div>
                <button className="auth-toast__close" onClick={() => setErrorMsg("")}>
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </>
  );
};

export default Login;