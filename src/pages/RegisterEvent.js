/* src/pages/RegisterEvent.js */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterEvent.css";
import { motion } from "framer-motion";
import { CATEGORY_OPTIONS } from "../data/eventsData";
import api from "../api/client";
import "../styles/Settings.css"; // Reuse premium toast styling

const RegisterEvent = () => {
  const navigate = useNavigate();
  const defaultCategory = useMemo(() => CATEGORY_OPTIONS?.[0] || "Other", []);
  
  const [imageType, setImageType] = useState("url");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [form, setForm] = useState({
    title: "",
    organizer: "",
    date: "",
    price: "",
    image: "",
    category: defaultCategory,
    customCategory: "",
    location: "",
    startTime: "",
    endTime: "",
    capacity: "",
    isPaid: false,
    priceAmount: "",
    currency: "USD",
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const finalCategory =
    form.category === "Other" ? (form.customCategory || "Other") : form.category;

  const formatTime = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const finalTime = `${formatTime(form.startTime)} - ${formatTime(form.endTime)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const currencyMap = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
      const currSymbol = currencyMap[form.currency] || "$";

      let finalImageUrl = form.image;
      if (imageType === "upload" && selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        
        try {
          const uploadRes = await api.post("/events/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          finalImageUrl = uploadRes.data.imageUrl;
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          showToast("Image upload failed. Please try again.", "danger");
          setIsSubmitting(false);
          return;
        }
      }

      await api.post("/events", {
        title: form.title,
        organizer: form.organizer,
        date: form.date,           // required by backend
        time: finalTime,
        location: form.location,
        category: finalCategory,
        price: form.isPaid ? `${currSymbol}${form.priceAmount}` : "Free",
        image: finalImageUrl,
        capacity: Number(form.capacity) || 200, // strictly passed as Number
      });

      showToast("Event successfully requested! Redirecting...", "success");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Create event failed:", err?.response?.data || err);
      showToast(err?.response?.data?.message || "Failed to submit event. Please try again.", "danger");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {toast.show && (
        <div className={`settings-toast ${toast.type} animate-slide-in`} style={{ zIndex: 9999 }}>
          <span className="toast-dot"></span>
          {toast.message}
        </div>
      )}
      <div className="register-event-page animate-up">
        <div className="form-card" style={{ flex: "1 1 auto" }}>
          <h2 className="cinzel-font">
            Host Your <span>Event</span>
          </h2>
          <p>Submit your details for administrative review.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Event Name</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Organizer / Host Name</label>
                <input
                  type="text"
                  required
                  value={form.organizer}
                  onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  className="premium-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  style={{ width: "100%", padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {form.category === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={form.customCategory}
                    onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                    style={{ marginTop: 10 }}
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label>Time Window</label>
                <div className="time-split-group">
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", color: "var(--text)" }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", color: "var(--text)" }}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Seats (Capacity)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  min="1"
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Admission Type</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select 
                    value={form.isPaid ? "Paid" : "Free"} 
                    onChange={(e) => setForm({ ...form, isPaid: e.target.value === "Paid", priceAmount: "" })}
                    style={{ width: "40%", padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>

                  {form.isPaid && (
                    <div style={{ display: "flex", flex: 1, gap: "5px", minWidth: 0 }}>
                      <select 
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        style={{ padding: "14px 10px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", color: "var(--text)", outline: "none", minWidth: "80px" }}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Price"
                        min="1"
                        required
                        value={form.priceAmount}
                        onChange={(e) => setForm({ ...form, priceAmount: e.target.value })}
                        style={{ flex: 1, minWidth: 0, padding: "14px" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Venue / Location</label>
              <input
                type="text"
                placeholder="Venue / City / Full Address"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Banner Image</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button 
                  type="button" 
                  className={`btn-toggle ${imageType === 'url' ? 'active' : ''}`}
                  onClick={() => setImageType('url')}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: imageType === 'url' ? "var(--primary-gold)" : "var(--surface-2)", color: imageType === 'url' ? "#000" : "var(--text)", transition: "0.2s" }}
                >
                  Link URL
                </button>
                <button 
                  type="button" 
                  className={`btn-toggle ${imageType === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageType('upload')}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: imageType === 'upload' ? "var(--primary-gold)" : "var(--surface-2)", color: imageType === 'upload' ? "#000" : "var(--text)", transition: "0.2s" }}
                >
                  Upload from PC
                </button>
              </div>

              {imageType === "url" ? (
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        showToast("File size must be under 5MB", "danger");
                        return;
                      }
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  style={{ padding: "10px 14px", background: "var(--surface-2)" }}
                />
              )}
            </div>

            <button type="submit" className="btn-submit-premium" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? "Submitting..." : "Request Approval"}
            </button>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className="preview-container" style={{ width: "350px", flexShrink: 0, marginTop: "20px" }}>
          <h3 className="cinzel-font" style={{ marginBottom: "15px", fontSize: "1.4rem" }}>Live Preview</h3>
          <p style={{ opacity: 0.7, fontSize: "0.85rem", marginBottom: "20px" }}>This is how your event will appear in the Discover section.</p>
          <div
            className="event-card-refined"
            style={{
              borderRadius: 16,
              padding: 14,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "var(--shadow)"
            }}
          >
            <div className="card-image-wrapper" style={{ position: "relative", width: "100%", height: 180, borderRadius: 12, overflow: "hidden", background: "var(--surface-2)" }}>
              {(imageType === "upload" && previewUrl) || (imageType === "url" && form.image) ? (
                <img src={imageType === "upload" ? previewUrl : form.image} alt="Event Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <i className="far fa-image" style={{ fontSize: "2rem" }}></i>
                </div>
              )}
              <span className="category-badge-overlay" style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.65)", padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px", zIndex: 10 }}>
                {finalCategory || "Category"}
              </span>
            </div>
            
            <div className="card-content-refined" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 className="event-name" style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {form.title || "Event Title"}
              </h3>
              <div className="event-meta-info" style={{ display: "flex", gap: 15, fontSize: "0.85rem", opacity: 0.8, alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><i className="far fa-calendar-alt"></i> {form.date || "Date"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><i className="fas fa-map-marker-alt"></i> {form.location || "Location"}</span>
              </div>
            </div>
            
            <div className="card-bottom-refined" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span className="event-price-label" style={{ fontWeight: "bold", color: "var(--primary-gold)", fontSize: "1.1rem" }}>
                {form.isPaid ? `${{ USD: "$", EUR: "€", GBP: "£", INR: "₹" }[form.currency] || "$"}${form.priceAmount || 0}` : "Free"}
              </span>
              <button disabled className="btn-outline-dark" style={{ border: "2px solid var(--border)", background: "transparent", color: "var(--text)", padding: "6px 14px", borderRadius: 20, cursor: "not-allowed", fontSize: "0.85rem", fontWeight: "bold", opacity: 0.5 }}>
                Details <i className="fas fa-arrow-right" style={{ marginLeft: "4px" }}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterEvent;