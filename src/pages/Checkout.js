/* src/pages/Checkout.js */
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { motion } from "framer-motion";
import { Lock, MapPin, Calendar } from "lucide-react";

import "../styles/Checkout.css";
import { getRemaining } from "../utils/seats";
import { createBooking } from "../api/bookings";



const Checkout = ({ onSeatsBooked }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const data = useMemo(() => location.state || null, [location.state]);

  // ✅ Guard: if user lands here without selecting an event
  if (!data?.eventId) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-card checkout-empty">
          <h2>No event selected</h2>
          <p>Please choose an event first.</p>
          <button className="btn-premium-action" onClick={() => navigate("/events")}>
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  // ✅ price could be "$10" or "Free" → parse safely
  const isFree = typeof data.price === "string" && data.price.toLowerCase() === "free";
  const unitPrice =
    isFree
      ? 0
      : Number(String(data.price).replace(/[^0-9.]/g, "")) || 0;

  const currentRemaining = getRemaining({
    id: data.eventId,
    capacity: data.capacity,
    booked: data.booked,
  });

  const currencyMatch = String(data.price).match(/[^0-9.,\s]+/);
  const currencySymbol = (!isFree && currencyMatch) ? currencyMatch[0] : "$";
  
  const total = unitPrice * qty;
  
  const handlePay = async () => {
    // ✅ Frontend validation (fast UX)
    if (unitPrice !== 0 && qty <= 0) {
      toast.error("Invalid ticket quantity");
      return;
    }

    // ✅ Optional optimistic capacity check (UX only)
    if (Number.isFinite(currentRemaining)) {
      if (currentRemaining <= 0) {
        toast.error("Sold out • No seats remaining");
        return;
      }
      if (qty > currentRemaining) {
        toast.error(`Only ${currentRemaining} seats left. Reduce quantity.`);
        return;
      }
    }

    if (unitPrice > 0) {
      navigate('/payment-gateway', { state: { bookingData: data, qty, unitPrice, total, currencySymbol } });
    } else {
      processBooking();
    }
  };

  const processBooking = async () => {
    setIsSubmitting(true);
    try {
      // 🔥 Send complete booking payload
      const res = await createBooking({
        eventId: data.eventId,   // must be Mongo _id
        qty,
        unitPrice,
      });

      const booking = res?.booking ?? res?.data?.booking;

      // ✅ Update UI state instantly (optional but safe)
      if (typeof onSeatsBooked === "function") {
        onSeatsBooked(data.eventId, qty);
      }

      toast.success("Payment successful • Booking confirmed");

      navigate("/success", { state: booking });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Booking failed. Please try again.";

      toast.error(msg);
      setIsSubmitting(false);
    }
  };


  return (
    <motion.div 
      className="checkout-wrapper"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="checkout-header">
        <button className="back-link dark" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="cinzel-font">
          Checkout <span>Secure</span>
        </h1>
        <p className="checkout-subtext">
          Review your booking, confirm ticket quantity, and proceed.
        </p>
      </div>

      <div className="checkout-grid">
        {/* LEFT: Event summary */}
        <div className="checkout-main">
          <div className="checkout-event-card">
            <div className="checkout-img">
              <img src={data.img} alt={data.title} />
              <span className="checkout-tag">{data.category || "Event"}</span>
            </div>

            <div className="checkout-event-info">
              <h2>{data.title}</h2>
              <div className="checkout-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} className="opacity-70" /> {data.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} className="opacity-70" /> {data.date}</span>
              </div>

              <div className="checkout-price-row">
                <span className="label">Unit Price</span>
                <span className="value">{data.price}</span>
              </div>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="checkout-qty-card">
            <div className="qty-left">
              <h3>Tickets</h3>
              <p>Choose how many seats you want to book.</p>
            </div>

            <div className="qty-controls">
              <button
                className="qty-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                –
              </button>

              <div className="qty-count">{qty}</div>

              <button
                className="qty-btn"
                onClick={() => {
                  if (qty >= currentRemaining) {
                    toast.error("Maximum Seats Selected");
                  } else {
                    setQty((q) => q + 1);
                  }
                }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Payment summary */}
        <div className="checkout-sidebar">
          <div className="checkout-summary-card">
            <p className="sidebar-label">Order Summary</p>

            <div className="summary-row">
              <span>Tickets</span>
              <span>{qty}</span>
            </div>

            <div className="summary-row">
              <span>Unit Price</span>
              <span>{data.price}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <span>{unitPrice === 0 ? "Free" : `${currencySymbol}${total}`}</span>
            </div>

            <button 
              className="btn-premium-action" 
              onClick={handlePay}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? "Processing..." : "Pay Now"}
            </button>

            <div className="secure-tag" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Lock size={12} /> Secure checkout • Instant confirmation
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;
