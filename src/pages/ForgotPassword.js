import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { motion } from "framer-motion";
import { requestOtp } from "../api/passwordReset";
import { sendOtpEmail } from "../utils/email";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend should return { ok:true, otp, name, email } for EmailJS sending
      const res = await requestOtp(email);
      const { otp, name } = res.data || {};

      // Always behave same to avoid user enumeration
      // If backend returns no otp (for non-existing email), still show success.
      if (otp) {
        await sendOtpEmail({
          name: name || "User",
          email,
          otp,
          expiresInMinutes: 10,
        });
      }

      // Move to OTP entry screen
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to request OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <>
        {/* loading overlay removed */}

        <div className="auth-wrapper">
          <div className="auth-card animate-up">
            <h2 className="cinzel-font">
              Forgot <span>Password</span>
            </h2>
            <p style={{ opacity: 0.8, marginBottom: 16 }}>
              Enter your email to receive a one-time verification code.
            </p>

            <form onSubmit={handleRequestOtp}>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button className="btn-auth-main" type="submit" disabled={loading}>
                Send OTP
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Back to{" "}
                <span className="auth-link-alt" onClick={() => navigate("/login")}>
                  Login
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    </motion.div>
  );
};

export default ForgotPassword;