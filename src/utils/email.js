import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const WELCOME_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_WELCOME_TEMPLATE_ID;
const OTP_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_OTP_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

function assertEnv() {
  if (!SERVICE_ID || !WELCOME_TEMPLATE_ID || !OTP_TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error("EmailJS env vars missing. Check .env and restart frontend.");
  }
}

export async function sendWelcomeEmail({ name, email }) {
  assertEnv();
  return emailjs.send(
    SERVICE_ID,
    WELCOME_TEMPLATE_ID,
    { name, email },
    { publicKey: PUBLIC_KEY }
  );
}

export async function sendOtpEmail({ name, email, otp, expiresInMinutes, type = "Verification" }) {
  assertEnv();
  return emailjs.send(
    SERVICE_ID,
    OTP_TEMPLATE_ID,
    {
      name,
      email,
      otp,
      expires_in: String(expiresInMinutes),
      type: type 
    },
    { publicKey: PUBLIC_KEY }
  );
}