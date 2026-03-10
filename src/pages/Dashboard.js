/* src/pages/Dashboard.js */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { motion } from "framer-motion";
import { fetchMyBookings, cancelBooking } from "../api/bookings";
import { fetchApprovedEvents, fetchMyEvents, deleteEvent, fetchMyAnalytics } from "../api/event";
import { useToast } from "../components/ToastProvider";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area 
} from "recharts";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const toast = useToast();

  const navigate = useNavigate();
  const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
};

const drawerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease } },
};

const drawerPanelAnim = {
  hidden: { x: 40, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.35, ease } },
};

  const [bookings, setBookings] = useState([]);

  const [browseEvents, setBrowseEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);

  const [analyticsData, setAnalyticsData] = useState(null);

  // BOOKINGS
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyBookings();
        const formatted = (Array.isArray(list) ? list : []).map((b) => ({
          ...b,
          date: b.date ? String(b.date).split("T")[0] : "TBD",
        }));
        setBookings(formatted);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        setBookings([]);
      }
    };
    load();
  }, [activeTab]);

  // DISCOVER (approved events)
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchApprovedEvents();
        const normalized = (Array.isArray(list) ? list : []).map((e) => ({
          ...e,
          id: e._id ?? e.id,
          desc: e.desc || e.description || "",
          price: e.price || "Free",
          date: e.date ? String(e.date).split("T")[0] : "TBD",
          category: e.category || "Other",
        }));
        setBrowseEvents(normalized);
      } catch {
        setBrowseEvents([]);
      }
    };
    load();
  }, [activeTab]);

  // CONTRIBUTIONS (my submissions)
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyEvents();
        const normalized = (Array.isArray(list) ? list : []).map((e) => ({
          ...e,
          id: e._id ?? e.id,
          desc: e.desc || e.description || "",
          price: e.price || "Free",
          date: e.date ? String(e.date).split("T")[0] : "TBD",
          category: e.category || "Other",
          status: e.status || "pending",
        }));
        setMyEvents(normalized.filter((ev) => ev.status !== "deleted"));
      } catch {
        setMyEvents([]);
      }
    };
    load();
  }, [activeTab]);

  // ANALYTICS (Host insights)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyAnalytics();
        setAnalyticsData(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }
    };
    load();
  }, [activeTab]);

  const handleReDownload = (bookingId, eventTitle) => {
    const element = document.createElement("a");
    const file = new Blob(
      [
        `EVENTLY$ OFFICIAL TICKET\n` +
          `Booking ID: ${bookingId}\n` +
          `Event: ${eventTitle}\n` +
          `Status: Confirmed / Paid\n`,
      ],
      { type: "text/plain" }
    );

    element.href = URL.createObjectURL(file);
    element.download = `Ticket_${bookingId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Ticket downloaded successfully.");
  };

  const executeCancel = async (bookingIds, title) => {
    const tableRow = document.getElementById(`booking-row-${bookingIds[0]}`);
    if (tableRow) tableRow.style.opacity = "0.3";

    try {
      await Promise.all(bookingIds.map((id) => cancelBooking(id)));
      
      toast.success(`Successfully cancelled ${bookingIds.length} seat${bookingIds.length > 1 ? "s" : ""} for "${title}". The capacity has been restored.`);
      setConfirmCancelId(null);

      // Reload bookings to remove from schedule
      const list = await fetchMyBookings();
      setBookings(Array.isArray(list) ? list : []);

      // Reload global events so 'Discover' tab capacity instantly restores
      const evList = await fetchApprovedEvents();
      const normalized = (Array.isArray(evList) ? evList : []).map((e) => ({
        ...e,
        id: e._id ?? e.id,
        desc: e.desc || e.description || "",
        price: e.price || "Free",
        date: e.date ? String(e.date).split("T")[0] : "TBD",
        category: e.category || "Other",
      }));
      setBrowseEvents(normalized);

      // Refresh analytics natively to reflect accurate revenue adjustments instantly
      try {
        const freshAnalytics = await fetchMyAnalytics();
        setAnalyticsData(freshAnalytics);
      } catch (err) {}

    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to cancel. Try again.";
      toast.error(msg);
      if (tableRow) tableRow.style.opacity = "1";
    }
  };

  const aggregatedBookings = useMemo(() => {
    const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
    return Object.values(
      activeBookings.reduce((acc, b) => {
        const key = String(b.eventId || b.title);
        const bookingQty = b.qty || 1;
        if (!acc[key]) {
          acc[key] = { ...b, count: bookingQty, bookingIds: [b._id] };
        } else {
          acc[key].count += bookingQty;
          acc[key].bookingIds.push(b._id);
        }
        return acc;
      }, {})
    );
  }, [bookings]);

  // DISCOVER FILTER
  const filteredEvents = useMemo(() => {
    return browseEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [browseEvents, searchTerm]);

  const handleDelete = async (id, title) => {
    const row = document.getElementById(`row-${id}`);
    if (row) row.style.opacity = "0.3";

    try {
      await deleteEvent(id);
      toast.success(`Deletion request for "${title}" has been sent for admin review.`);
      setConfirmDeleteId(null);

      // refresh
      const list = await fetchMyEvents();
      const normalized = (Array.isArray(list) ? list : []).map((e) => ({
        ...e,
        id: e._id ?? e.id,
        desc: e.desc || e.description || "",
        price: e.price || "Free",
        date: e.date ? String(e.date).split("T")[0] : "TBD",
        category: e.category || "Other",
        status: e.status || "pending",
      }));
      setMyEvents(normalized.filter((ev) => ev.status !== "deleted"));

      // Refresh analytics automatically on event deletion
      try {
        const freshAnalytics = await fetchMyAnalytics();
        setAnalyticsData(freshAnalytics);
      } catch (e) {}
    } catch (err) {
      const msg = err?.response?.data?.message || "Delete failed. Try again.";
      toast.error(msg);
      if (row) row.style.opacity = "1";
    }
  };

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    <div
      className="dashboard-wrapper"
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: "24px 16px 40px",
      }}
    >

      {/* Drawer overlay MUST be fixed so it doesn't affect layout */}
      <motion.div
        className={`drawer-overlay ${selectedEvent ? "active" : ""}`}
        onClick={() => setSelectedEvent(null)}
        variants={drawerAnim}
        initial="hidden"
        animate={selectedEvent ? "show" : "hidden"}
        style={{
          position: "fixed",
          inset: 0,
          background: selectedEvent ? "rgba(0,0,0,0.55)" : "transparent",
          pointerEvents: selectedEvent ? "auto" : "none",
          zIndex: 5000,
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        <motion.div
          className={`drawer-content ${selectedEvent ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
          variants={drawerPanelAnim}
          initial="hidden"
          animate={selectedEvent ? "show" : "hidden"}
          style={{
            position: "relative",
            height: "100%",
            width: "min(420px, 92vw)",
            background: "var(--dash-drawer-bg)",
            borderLeft: "1px solid var(--dash-border)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            boxShadow: "-10px 0 40px rgba(0,0,0,0.2)",
            padding: 0
          }}
        >
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <button className="drawer-close-btn" onClick={() => setSelectedEvent(null)}>
                <i className="fas fa-times"></i>
              </button>

              {(selectedEvent.img || selectedEvent.image) ? (
                <div className="drawer-hero-image">
                  <img src={selectedEvent.img || selectedEvent.image} alt={selectedEvent.title} />
                  <div className="drawer-hero-gradient"></div>
                </div>
              ) : (
                <div className="drawer-hero-placeholder"></div>
              )}

              <div className="drawer-content-scrollable">
                <div className="drawer-header-pad">
                   <span className="category-badge-overlay drawer-badge">{selectedEvent.category}</span>
                   <h2 className="drawer-title-refined">{selectedEvent.title}</h2>
                </div>

                <div className="drawer-body-pad">
                  <div className="drawer-meta-grid">
                    <div className="drawer-meta-item">
                      <div className="meta-icon"><i className="far fa-calendar-alt"></i></div>
                      <div className="meta-text">
                        <span className="meta-label">Date & Time</span>
                        <span className="meta-value">{selectedEvent.date || "TBD"} • {selectedEvent.time || "TBD"}</span>
                      </div>
                    </div>
                    
                    {selectedEvent.location && (
                      <div className="drawer-meta-item">
                        <div className="meta-icon"><i className="fas fa-map-marker-alt"></i></div>
                        <div className="meta-text">
                          <span className="meta-label">Location</span>
                          <span className="meta-value">{selectedEvent.location}</span>
                        </div>
                      </div>
                    )}

                    {selectedEvent.organizer && (
                      <div className="drawer-meta-item">
                        <div className="meta-icon"><i className="fas fa-user-tie"></i></div>
                        <div className="meta-text">
                          <span className="meta-label">Organizer</span>
                          <span className="meta-value">{selectedEvent.organizer}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="drawer-divider"></div>

                  <div className="drawer-desc-block">
                    <h4 className="drawer-section-title">About this event</h4>
                    <p className="drawer-desc">{selectedEvent.desc}</p>
                  </div>
                </div>
              </div>

              <div className="drawer-footer-sticky">
                <div className="drawer-footer-price">
                  <span className="price-label">Total Amount</span>
                  <span className="drawer-price">{selectedEvent.price || "Free"}</span>
                </div>
                <div className="footer-action-wrapper">
                  <button
                    className="btn-premium-gold"
                    style={{ width: "100%" }}
                    onClick={() =>
                      navigate(`/events/${selectedEvent.id}`, { state: { event: selectedEvent } })
                    }
                  >
                    View / Book <i className="fas fa-arrow-right" style={{marginLeft: 6}}></i>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Main container - force centered width so content doesn't hug the left */}
      <div
        className="dashboard-container-light"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <motion.header
          className="dashboard-header"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 14,
            padding: "18px 20px",
          }}
        >
          <h2 className="portal-title" style={{ margin: 0 }}>
            User <span>Portal</span>
          </h2>

          <div
            className="header-controls"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div
              className="tab-pill-container"
              style={{
                display: "flex",
                gap: 10,
                padding: 6,
                borderRadius: 999,
              }}
            >
              <button
                className={`tab-pill ${activeTab === "browse" ? "active" : ""}`}
                onClick={() => setActiveTab("browse")}
              >
                Discover
              </button>
              <button
                className={`tab-pill ${activeTab === "bookings" ? "active" : ""}`}
                onClick={() => setActiveTab("bookings")}
              >
                Schedule
              </button>
              <button
                className={`tab-pill ${activeTab === "contributions" ? "active" : ""}`}
                onClick={() => setActiveTab("contributions")}
              >
                Contributions
              </button>
              <button
                className={`tab-pill ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                Insights
              </button>
            </div>

            {activeTab === "browse" && (
              <div
                className="search-box-refined"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 280,
                }}
              >
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </div>
        </motion.header>

        <motion.main
          className="content-area"
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ padding: "18px 20px 24px" }}
        >
          {/* DASHBOARD STATS ROW */}
          <div className="dashboard-stats-row">
            <div className="stat-card-refined">
              <div className="stat-icon-wrapper"><i className="fas fa-ticket-alt"></i></div>
              <div className="stat-content-r">
                <span className="stat-label-r">Active Bookings</span>
                <span className="stat-value-r">{aggregatedBookings.length}</span>
              </div>
            </div>
            <div className="stat-card-refined">
              <div className="stat-icon-wrapper" style={{color: 'var(--dash-gold)'}}><i className="fas fa-calendar-check"></i></div>
              <div className="stat-content-r">
                <span className="stat-label-r">Upcoming Events</span>
                <span className="stat-value-r">
                  {aggregatedBookings.filter(b => new Date(b.date) >= new Date().setHours(0,0,0,0)).length}
                </span>
              </div>
            </div>
            <div className="stat-card-refined">
              <div className="stat-icon-wrapper"><i className="fas fa-pencil-alt"></i></div>
              <div className="stat-content-r">
                <span className="stat-label-r">Contributions</span>
                <span className="stat-value-r">{myEvents.length}</span>
              </div>
            </div>
          </div>

          {activeTab === "browse" && (
            <motion.div
              className="event-grid-refined"
              variants={stagger}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              {filteredEvents.map((event) => (
                <motion.div
                  className="event-card-refined"
                  variants={cardAnim}
                  key={String(event.id)}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="card-image-wrapper">
                    {event.img || event.image ? (
                      <img src={event.img || event.image} alt={event.title} className="card-image" />
                    ) : (
                      <div className="card-image-placeholder">
                        <i className="far fa-image"></i>
                      </div>
                    )}
                    <span className="category-badge-overlay">{event.category}</span>
                  </div>

                  <div className="card-content-refined">
                    <h3 className="event-name" style={{ marginTop: 0 }}>{event.title}</h3>
                    <div className="event-meta-info">
                      <span><i className="far fa-calendar-alt"></i> {event.date}</span>
                      {event.location && <span><i className="fas fa-map-marker-alt"></i> {event.location}</span>}
                    </div>
                  </div>

                  <div className="card-bottom-refined">
                    <span className="event-price-label">{event.price}</span>
                    <button className="btn-outline-dark" onClick={() => setSelectedEvent(event)}>
                      Details <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="dashboard-empty">
                  No events found matching "{searchTerm}"
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <div className="history-table-wrapper fade-in-up">
              <table className="history-table-refined">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Management</th>
                  </tr>
                </thead>

                <tbody>
                  {aggregatedBookings.length > 0 ? (
                    aggregatedBookings.map((b) => (
                      <tr key={b.bookingId} id={`booking-row-${b.bookingIds[0]}`} className="table-row-refined">
                        <td>
                          <span className="id-badge">#{b.bookingId}</span>
                        </td>

                        <td>
                          <div className="td-title">{b.title}</div>
                          <div className="td-subtitle">
                            {b.date} {b.location ? `• ${b.location}` : ""}
                          </div>
                        </td>

                        <td>
                          <span className="status-badge-green">
                            {b.count} Seat{b.count > 1 ? "s" : ""} Booked
                          </span>
                        </td>

                        <td className="actions-cell">
                          <button
                            className="btn-circle-action"
                            onClick={() => navigate("/success", { state: b })}
                            title="View Receipt"
                            type="button"
                          >
                            👁
                          </button>

                          <button
                            className="btn-circle-action"
                            onClick={() => handleReDownload(b.bookingId, b.title)}
                            title="Download"
                            type="button"
                          >
                            ↓
                          </button>

                          {confirmCancelId === (b.eventId || b.title) ? (
                            <button
                              className="btn-confirm-red"
                              onClick={() => executeCancel(b.bookingIds, b.title)}
                              type="button"
                            >
                              Confirm?
                            </button>
                          ) : (
                            <button
                              className="btn-text-danger"
                              onClick={() => setConfirmCancelId(b.eventId || b.title)}
                              type="button"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="table-row-refined">
                      <td colSpan={4} style={{ padding: 22, textAlign: "center", color: "#aaa" }}>
                        No bookings yet. Book an event and it will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "contributions" && (
            <div className="history-table-wrapper fade-in-up">
              <table className="history-table-refined">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proposed Event</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myEvents.map((sub) => (
                    <tr key={String(sub.id)} id={`row-${sub.id}`} className="table-row-refined">
                      <td>
                        <span className="id-badge">#EV-{String(sub.id).slice(-4)}</span>
                      </td>
                      <td>
                        <div className="td-title">{sub.title}</div>
                        <div className="td-subtitle">
                          {sub.category} • {sub.date} {sub.location ? `• ${sub.location}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${sub.status || "pending"}`}>
                          {sub.status === "delete_requested" ? "Delete Requested" : (sub.status || "Pending")}
                        </span>
                      </td>
                      <td className="actions-cell-inline">
                        <button className="btn-text-dark" onClick={() => setSelectedEvent(sub)} type="button">
                          View
                        </button>
                        {sub.status === "delete_requested" ? (
                          <button className="btn-text-danger" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled type="button">
                            Requested
                          </button>
                        ) : confirmDeleteId === sub.id ? (
                          <button className="btn-confirm-red" onClick={() => handleDelete(sub.id, sub.title)} type="button">
                            Confirm?
                          </button>
                        ) : (
                          <button className="btn-text-danger" onClick={() => setConfirmDeleteId(sub.id)} type="button">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {myEvents.length === 0 && (
                    <tr className="table-row-refined">
                      <td colSpan={4} style={{ padding: 22, textAlign: "center", color: "#aaa" }}>
                        No contributions submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="analytics-wrapper fade-in-up" style={{ marginTop: 20 }}>
              {myEvents.length === 0 ? (
                <div className="empty-insights" style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-surface-2, rgba(255,255,255,0.02))", borderRadius: 16 }}>
                  <i className="fas fa-chart-line" style={{ fontSize: "3rem", color: "var(--text-muted)", opacity: 0.5, marginBottom: 20 }}></i>
                  <h3 style={{ fontSize: "1.5rem", marginBottom: 10, color: "var(--text-main)" }}>Unlock Your Event Insights</h3>
                  <p style={{ color: "var(--text-muted)", maxWidth: 500, margin: "0 auto" }}>
                    You haven't hosted any events yet. Once you host your first event, you'll get actionable insights on attendee behavioral patterns, revenue processing, and detailed ticket analysis right here.
                  </p>
                  <button className="btn-premium-gold" onClick={() => navigate("/register-event")} style={{ marginTop: 24 }}>
                    Start Hosting
                  </button>
                </div>
              ) : analyticsData ? (
                <>
                  <div className="dashboard-stats-row" style={{ marginBottom: 30 }}>
                    <div className="stat-card-refined">
                      <div className="stat-icon-wrapper" style={{color: '#8c78f0'}}><i className="fas fa-wallet"></i></div>
                      <div className="stat-content-r">
                        <span className="stat-label-r">Net Revenue (After Fees)</span>
                        <span className="stat-value-r">₹{analyticsData.netRevenue?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="stat-card-refined">
                      <div className="stat-icon-wrapper" style={{color: '#d8ff2a', background: 'rgba(216,255,42,0.1)'}}><i className="fas fa-ticket-alt"></i></div>
                      <div className="stat-content-r">
                        <span className="stat-label-r">Total Tickets Sold</span>
                        <span className="stat-value-r">{analyticsData.ticketsSold}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                    <div className="chart-container" style={{ background: "var(--dash-surface)", padding: 20, borderRadius: 16, border: "1px solid var(--dash-border)" }}>
                      <h4 style={{ marginBottom: 20, fontSize: "1.1rem", color: "var(--text-main)" }}>Attendee Booking Trends</h4>
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData.bookingTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                            <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: 8, color: "var(--text-main)" }}
                              itemStyle={{ color: "#d8ff2a" }}
                            />
                            <Area type="monotone" dataKey="tickets" stroke="#d8ff2a" fill="rgba(216,255,42,0.2)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="chart-container" style={{ background: "var(--dash-surface)", padding: 20, borderRadius: 16, border: "1px solid var(--dash-border)" }}>
                      <h4 style={{ marginBottom: 20, fontSize: "1.1rem", color: "var(--text-main)" }}>Top Performing Events</h4>
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.eventPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                            <YAxis stroke="var(--text-muted)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                            <Tooltip 
                              cursor={{ fill: 'var(--dash-border)' }}
                              contentStyle={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: 8, color: "var(--text-main)" }}
                              itemStyle={{ color: "#8c78f0" }}
                            />
                            <Bar dataKey="tickets" fill="#8c78f0" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Loading Insights...</div>
              )}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  </motion.div>
);
};

export default Dashboard;