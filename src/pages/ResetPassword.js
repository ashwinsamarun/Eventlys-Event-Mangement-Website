import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { motion } from "framer-motion";
import LoadingOverlay from "../components/LoadingOverlay";
import { verifyOtp, resetPassword } from "../api/passwordReset";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = useMemo(() => state?.email || "", [state]);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Missing email. Please restart the reset flow.");
      navigate("/forgot-password");
      return;
    }

    if (newPassword !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const v = await verifyOtp(email, otp);
      const resetToken = v.data?.resetToken;

      await resetPassword(email, resetToken, newPassword);

      alert("Password reset successful. Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Reset failed. Check OTP and try again.");
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
        {loading && <LoadingOverlay message="UPDATING PASSWORD..." />}

        <div className="auth-wrapper">
          <div className="auth-card animate-up">
            <h2 className="cinzel-font">
              Reset <span>Password</span>
            </h2>

            <p style={{ opacity: 0.8, marginBottom: 16 }}>
              OTP sent to: <span style={{ opacity: 1 }}>{email}</span>
            </p>

            <form onSubmit={handleReset}>
              <div className="input-group">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

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

              <button className="btn-auth-main" type="submit" disabled={loading}>
                Update Password
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Didn’t get a code?{" "}
                <span className="auth-link-alt" onClick={() => navigate("/forgot-password")}>
                  Resend
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    </motion.div>
  );
};

export default ResetPassword;