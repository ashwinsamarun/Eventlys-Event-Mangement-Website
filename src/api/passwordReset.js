import api from "./client";

export const requestOtp = (email) => api.post("/auth/forgot-password", { email });
export const verifyOtp = (email, otp) => api.post("/auth/verify-otp", { email, otp });
export const resetPassword = (email, resetToken, newPassword) =>
  api.post("/auth/reset-password", { email, resetToken, newPassword });