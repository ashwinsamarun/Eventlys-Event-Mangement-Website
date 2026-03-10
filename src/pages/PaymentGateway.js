/* src/pages/PaymentGateway.js */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ToastProvider";
import { createBooking } from "../api/bookings";
import { CreditCard, QrCode, Lock, ShieldCheck, MapPin, Calendar, Clock, ArrowLeft } from "lucide-react";
import "../styles/PaymentGateway.css";

const PaymentGateway = ({ onSeatsBooked }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("card"); // 'card' or 'qr'
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrStatus, setQrStatus] = useState("waiting"); // 'waiting', 'scanned', 'confirmed'
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "" });
  const [formErrors, setFormErrors] = useState({ number: false, expiry: false, cvc: false });
  
  // Extract data passed from Checkout
  const { bookingData, qty, unitPrice, total, currencySymbol = "$" } = location.state || {};

  useEffect(() => {
    // Redirect back if no booking data is found
    if (!bookingData) {
      navigate("/events");
    }
  }, [bookingData, navigate]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: false }));
    if (name === "number") {
      let val = value.replace(/\D/g, "");
      val = val.replace(/(.{4})/g, "$1 ").trim();
      setCardData({ ...cardData, number: val.slice(0, 19) });
    } else if (name === "expiry") {
      let val = value.replace(/\D/g, "");
      if (val.length >= 3) {
        val = val.slice(0, 2) + "/" + val.slice(2, 4);
      }
      setCardData({ ...cardData, expiry: val.slice(0, 5) });
    } else if (name === "cvc") {
      setCardData({ ...cardData, cvc: value.replace(/\D/g, "").slice(0, 4) });
    }
  };

  useEffect(() => {
    if (activeTab === "qr") {
      setQrStatus("waiting");
    }
  }, [activeTab]);

  const processPayment = async (isQr = false) => {
    // Basic format check if using Card
    if (!isQr && activeTab === "card") {
      let hasError = false;
      const newErrors = { number: false, expiry: false, cvc: false };

      if (cardData.number.replace(/\s/g, "").length < 15) {
        toast.error("Invalid format: Card Number must be 16 digits.");
        newErrors.number = true;
        hasError = true;
      }
      if (cardData.expiry.length < 5) {
        if (!hasError) toast.error("Invalid format: Expiry Date must be MM/YY.");
        newErrors.expiry = true;
        hasError = true;
      }
      if (cardData.cvc.length < 3) {
        if (!hasError) toast.error("Invalid format: CVC must be 3 or 4 digits.");
        newErrors.cvc = true;
        hasError = true;
      }

      if (hasError) {
        setFormErrors(newErrors);
        return;
      }
    }

    setIsProcessing(true);
    
    // Simulate payment gateway delay
    setTimeout(async () => {
      try {
        const res = await createBooking({
          eventId: bookingData.eventId,
          qty,
          unitPrice,
        });

        const booking = res?.booking ?? res?.data?.booking ?? {
          eventId: bookingData.eventId,
          qty,
          unitPrice,
          total
        };

        if (typeof onSeatsBooked === "function") {
          onSeatsBooked(bookingData.eventId, qty);
        }

        if (isQr || activeTab === "qr") setQrStatus("confirmed");
        toast.success("Payment successful • Booking confirmed");
        
        // Ensure redirect fires reliably
        window.scrollTo(0, 0);
        navigate("/success", { state: booking, replace: true });
      } catch (err) {
        console.error("Payment flow error:", err);
        const msg = err?.response?.data?.message || "Payment gateway declined. Please check details.";
        toast.error(msg);
        setIsProcessing(false);
        if (isQr || activeTab === "qr") setQrStatus("waiting"); // reset QR state
      }
    }, 2000); // 2 seconds animation
  };

  if (!bookingData) return null;

  return (
    <motion.div 
      className="payment-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="payment-container">
        
        {/* Left Side: Order Summary */}
        <div className="payment-left">
          <button 
            className="back-link dark" 
            onClick={() => navigate(-1)}
            style={{ marginBottom: '20px', alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text)', opacity: 0.7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <ArrowLeft size={16} /> Back to Checkout
          </button>
          
          <h2 className="payment-title cinzel-font">Order <span>Summary</span></h2>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            <img 
              src={bookingData.img} 
              alt={bookingData.title} 
              style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }}
            />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{bookingData.title}</h3>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><MapPin size={12} /> {bookingData.location}</p>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {bookingData.date}</p>
            </div>
          </div>

          <div className="order-summary-box">
            <div className="order-row">
              <span>{bookingData.title} Ticket x{qty}</span>
              <span>{currencySymbol}{unitPrice}</span>
            </div>
            <div className="order-row" style={{ fontSize: '0.9rem' }}>
              <span>Taxes & Fees</span>
              <span>Included</span>
            </div>
            <div className="order-total">
              <span>Total Amount</span>
              <span>{currencySymbol}{total}</span>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <ShieldCheck size={28} style={{ color: 'var(--gold-accent)' }} />
            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>We protect your payment information using AES-256 encryption. Your booking is instantly confirmed.</p>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="payment-right">
          <h2 className="payment-title cinzel-font" style={{ marginBottom: '15px' }}>Secure <span>Checkout</span></h2>
          
          <div className="payment-tabs">
            <div 
              className={`payment-tab-pill ${activeTab === "card" ? "active" : ""}`}
              onClick={() => !isProcessing && setActiveTab("card")}
            >
              <CreditCard size={18} /> Pay with Card
            </div>
            <div 
              className={`payment-tab-pill ${activeTab === "qr" ? "active" : ""}`}
              onClick={() => !isProcessing && setActiveTab("qr")}
            >
              <QrCode size={18} /> Pay with QR Code
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "card" && (
              <motion.div 
                key="card"
                className="payment-form-inner"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="payment-input-group">
                  <label>Card Number</label>
                  <CreditCard size={16} className="payment-input-icon" />
                  <input 
                    type="text" 
                    name="number"
                    placeholder="0000 0000 0000 0000" 
                    value={cardData.number}
                    onChange={handleCardChange}
                    disabled={isProcessing}
                    className={formErrors.number ? "input-error" : ""}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="payment-input-group" style={{ flex: 1 }}>
                    <label>Expiry Date</label>
                    <Clock size={16} className="payment-input-icon" />
                    <input 
                      type="text" 
                      name="expiry"
                      placeholder="MM/YY" 
                      value={cardData.expiry}
                      onChange={handleCardChange}
                      disabled={isProcessing}
                      className={formErrors.expiry ? "input-error" : ""}
                    />
                  </div>
                  <div className="payment-input-group" style={{ flex: 1 }}>
                    <label>CVC</label>
                    <Lock size={16} className="payment-input-icon" />
                    <input 
                      type="text" 
                      name="cvc"
                      placeholder="123" 
                      value={cardData.cvc}
                      onChange={handleCardChange}
                      disabled={isProcessing}
                      className={formErrors.cvc ? "input-error" : ""}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "qr" && (
              <motion.div 
                key="qr"
                className="qr-payment-container"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p style={{ opacity: 0.8, marginBottom: '20px', fontSize: '0.9rem' }}>Scan the QR Code below with your mobile wallet app to complete the payment.</p>
                <div className="qr-placeholder">
   <img src="/assets/images/qr1.jpeg" alt="QR" />
</div>
                {qrStatus === "scanned" ? (
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--gold-accent)' }}>Processing QR Payment...</p>
                ) : qrStatus === "confirmed" ? (
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4CAF50' }}>Payment Confirmed!</p>
                ) : (
                  <>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Scan to pay <span style={{ color: 'var(--gold-accent)' }}>{currencySymbol}{total}</span></p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '10px' }}>Awaiting scan... Payment will process automatically.</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === "card" && (
            <button 
              className="btn-process" 
              onClick={() => processPayment()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><span className="spinner"></span> Processing Payment...</>
              ) : (
                <>Pay {currencySymbol}{total} Now</>
              )}
            </button>
          )}
          
          <div className="secure-badge">
            <Lock size={12} /> Payments are secure and encrypted
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default PaymentGateway;
