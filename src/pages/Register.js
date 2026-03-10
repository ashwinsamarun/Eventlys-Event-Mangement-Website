/* src/pages/Register.js */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import LoadingOverlay from "../components/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import api, { setAuthToken } from "../api/client";
import { sendWelcomeEmail } from "../utils/email";
import { X } from "lucide-react";


const Register = ({ setIsLoggedIn, setUserRole }) => {
  const navigate = useNavigate();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ checkbox toggle
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // ✅ confirm password validation
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsAuthenticating(true);

    try {
      const res = await api.post("/auth/register", { name, email, password });
      
      try {
        sendWelcomeEmail({ name: name || "User", email }).catch(console.error);
      } catch (e) {
        console.error("Welcome email skipped due to missing config", e);
      }

      setAuthData({
        token: res.data.token,
        role: res.data.role,
        userId: res.data.userId,
      });

      setShowSplash(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Registration failed. Try a different email.";
      setErrorMsg(msg);
      setIsAuthenticating(false);
    }
  };

  const finalizeRegister = () => {
    if (!authData) return;
    localStorage.setItem("token", authData.token);
    localStorage.setItem("eventlys_isLoggedIn", "true");
    localStorage.setItem("eventlys_userRole", authData.role || "user");
    if (authData.userId) localStorage.setItem("userId", authData.userId);

    setAuthToken(authData.token);

    if (setIsLoggedIn) setIsLoggedIn(true);
    if (setUserRole) setUserRole(authData.role || "user");

    navigate("/");
    window.scrollTo(0, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <>
        <AnimatePresence>
          {showSplash && <LoadingOverlay onComplete={finalizeRegister} />}
        </AnimatePresence>

        <div className="auth-wrapper">
          <div className="auth-card animate-up">
            <h2 className="cinzel-font">
              Create <span>Account</span>
            </h2>

            <form onSubmit={handleRegister}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

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

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <button
                type="submit"
                className="btn-auth-main"
                style={{ marginTop: "10px" }}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Authenticating..." : "Register"}
              </button>
              
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <span className="auth-link-alt" onClick={() => navigate("/login")}>
                  Login
                </span>
              </p>
            </div>
          </div>

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
                  <h4 className="auth-toast__title">Registration Failed</h4>
                  <p className="auth-toast__message">{errorMsg}</p>
                </div>
                <button className="auth-toast__close" onClick={() => setErrorMsg("")}>
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </>
    </motion.div>
  );
};

export default Register;