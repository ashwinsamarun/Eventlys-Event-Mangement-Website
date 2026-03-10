/* src/pages/AdminDashboard.js */
import React, { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllEvents, updateEventStatus, fetchAdminAnalytics } from "../api/admin";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // 🔄 Load from backend
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchAllEvents();

        // ✅ normalize Mongo docs to match your UI expectations
        const normalized = (Array.isArray(data) ? data : []).map((e) => ({
          ...e,
          id: e._id ?? e.id,
          submittedAt: e.submittedAt || e.createdAt,
        }));

        setEvents(normalized);

        const adminData = await fetchAdminAnalytics();
        setAnalytics(adminData);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Separate events
  const pendingEvents = events.filter((ev) => ev.status === "pending");
  const approvedEvents = events.filter((ev) => ev.status === "approved");
  const deleteRequests = events.filter((ev) => ev.status === "delete_requested");

  // 🔥 Status update via backend
  const triggerAction = async (id, status, title) => {
    try {
      const updated = await updateEventStatus(id, status);

      setEvents((prev) =>
        prev.map((e) =>
          String(e.id) === String(updated.id ?? updated._id)
            ? { ...e, ...updated, id: updated.id ?? updated._id ?? e.id }
            : e
        )
      );

      // If physical deletion occurred, strip it from the local list
      if (status === "deleted") {
        setEvents((prev) => prev.filter((e) => String(e.id) !== String(id)));
      }

      let message = `"${title}" HAS BEEN UPDATED`;
      if (status === "approved") message = `"${title}" IS NOW LIVE`;
      if (status === "deleted") message = `"${title}" HAS BEEN PERMANENTLY REMOVED`;
      if (status === "rejected") message = `"${title}" SUBMISSION/REQUEST REJECTED`;

      setToast({ show: true, message, type: status });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  if (loading) return <div className="admin-wrapper" style={{display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.2rem", fontWeight: "bold"}}>Loading System Setup...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="admin-wrapper"
    >
      <div className="admin-container-refined">
        {/* TOAST */}
        {toast.show && (
          <div
            className={`admin-toast ${
              toast.type === "approved" ? "toast-gold" : "toast-red"
            }`}
          >
            <div className="toast-content">
              <span className="toast-icon">{toast.type === "approved" ? "✓" : "✕"}</span>
              <p>{toast.message}</p>
            </div>
            <div className="toast-progress"></div>
          </div>
        )}

        <div className="admin-header-refined animate-up">
          <h1 className="admin-title">
            Over<span>sight</span>
          </h1>
          <div style={{color: "var(--admin-muted)"}}>Platform Administrator Portal</div>
        </div>

        {/* MODERATION QUEUE */}
        <section className="admin-table-container animate-up" style={{ marginBottom: "40px" }}>
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="admin-section-title" style={{ margin: 0 }}>
              Moderation Queue
            </h3>
            <span className="admin-badge badge-pending">{pendingEvents.length} Pending</span>
          </div>

          <div style={{ overflowX: "auto", padding: "20px" }}>
            <table className="admin-table-unified">
              <thead>
                <tr>
                  <th>User Submission</th>
                  <th>Organizer</th>
                  <th>Meta</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {pendingEvents.map((event) => (
                    <motion.tr 
                      key={event.id} 
                      className="pending-row"
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>
                        <div className="td-event-title">{event.title}</div>
                        <div className="td-event-meta">
                          📍 {event.location || "—"} • 📅{" "}
                          {event.date ? String(event.date).slice(0, 10) : "—"}
                        </div>
                        <div className="td-event-meta" style={{ marginTop: 4 }}>
                          Creator: {event.createdBy?.email || "—"}
                        </div>
                      </td>

                      <td>{event.organizer || "User Submitted"}</td>

                      <td>
                        <div className="td-event-meta" style={{ lineHeight: 1.6 }}>
                          🎟 {event.booked || 0}/{event.capacity || "—"}
                          <br />
                          💰 {event.price || "Free"}
                          <br />
                          🕒 {event.submittedAt ? new Date(event.submittedAt).toLocaleDateString() : "—"}
                        </div>
                      </td>

                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="btn-admin-action btn-admin-approve"
                            onClick={() => triggerAction(event.id, "approved", event.title)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-admin-action btn-admin-reject"
                            onClick={() => triggerAction(event.id, "rejected", event.title)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {pendingEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 18, textAlign: "center", opacity: 0.75 }}>
                      No pending events right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* DELETION REQUESTS QUEUE */}
        {deleteRequests.length > 0 && (
          <section className="admin-table-container animate-up" style={{ marginBottom: "40px" }}>
            <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="admin-section-title" style={{ margin: 0 }}>
                Deletion Requests
              </h3>
              <span className="admin-badge badge-danger">
                {deleteRequests.length} Pending
              </span>
            </div>

            <div style={{ overflowX: "auto", padding: "20px" }}>
              <table className="admin-table-unified">
                <thead>
                  <tr>
                    <th>Target Event</th>
                    <th>Organizer</th>
                    <th>Current State</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence>
                    {deleteRequests.map((event) => (
                      <motion.tr 
                        key={event.id} 
                        className="pending-row"
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td>
                          <div className="td-event-title">{event.title}</div>
                          <div className="td-event-meta">
                            📍 {event.location || "—"} • 📅{" "}
                            {event.date ? String(event.date).slice(0, 10) : "—"}
                          </div>
                          <div className="td-event-meta" style={{ marginTop: 4 }}>
                            Author: {event.createdBy?.email || "—"}
                          </div>
                        </td>

                        <td>{event.organizer || "User Submitted"}</td>

                        <td>
                          <div className="td-event-meta" style={{ lineHeight: 1.6 }}>
                            🎟 {event.booked || 0}/{event.capacity || "—"} Booked
                            <br />
                            💰 {event.price || "Free"}
                            <br />
                            Requested:{" "}
                            {event.updatedAt
                              ? new Date(event.updatedAt).toLocaleDateString()
                              : "—"}
                          </div>
                        </td>

                        <td>
                          <div className="admin-actions-cell">
                            <button
                              className="btn-admin-action btn-admin-reject"
                              onClick={() => triggerAction(event.id, "deleted", event.title)}
                            >
                              Authorize Delete
                            </button>
                            <button
                              className="btn-admin-action"
                              onClick={() => triggerAction(event.id, "rejected", event.title)}
                            >
                              Reject & Keep
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* STATS */}
        {/* STATS */}
        <div className="admin-stats-unified animate-up">
          <div className="stat-card-unified">
            <span className="stat-unified-header"><i className="fas fa-wallet" style={{marginRight: 6}}></i> Admin Revenue (5%)</span>
            <p className="stat-unified-value"><span className="gold">${analytics?.adminRevenue?.toLocaleString() || 0}</span></p>
            <span className="stat-unified-label">From total platform sales of ${analytics?.totalSales?.toLocaleString() || 0}</span>
          </div>

          <div className="stat-card-unified">
            <span className="stat-unified-header"><i className="fas fa-ticket-alt" style={{marginRight: 6}}></i> Total Tickets Sold</span>
            <p className="stat-unified-value">{analytics?.ticketsTotal || 0}</p>
            <span className="stat-unified-label">Platform wide distribution</span>
          </div>

          <div className="stat-card-unified">
            <span className="stat-unified-header"><i className="fas fa-server" style={{marginRight: 6}}></i> Pending Actions</span>
            <p className="stat-unified-value"><span className="purple">{pendingEvents.length + deleteRequests.length}</span></p>
            <span className="stat-unified-label">Awaiting review from moderators</span>
          </div>
        </div>

        {/* ANALYTICS CHARTS */}
        {analytics?.attendeeBehavior && analytics.attendeeBehavior.length > 0 && (
          <div className="admin-analytics-container animate-up">
            <h3 className="admin-section-title">Attendee Behavioral Patterns</h3>
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.attendeeBehavior}>
                  <defs>
                    <linearGradient id="colorTicketsAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--admin-gold)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--admin-gold)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--admin-muted)" tick={{ fill: "var(--admin-muted)", fontSize: 12 }} />
                  <YAxis stroke="var(--admin-muted)" tick={{ fill: "var(--admin-muted)", fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "8px", color: "var(--admin-text)" }}
                    itemStyle={{ color: "var(--admin-gold)", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="tickets" stroke="var(--admin-gold)" fillOpacity={1} fill="url(#colorTicketsAdmin)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="admin-section-desc">
              Total tickets sold strategically overlaid along a 30-day timeline. Track incoming platform traction.
            </p>
          </div>
        )}
        
        {/* APPROVED EVENTS TABLE */}
        <section className="admin-table-container animate-up">
          <div style={{ padding: "20px" }}>
            <h3 className="admin-section-title" style={{ margin: 0 }}>
              Active Events Archive
            </h3>
          </div>

          <div style={{ overflowX: "auto", padding: "0 20px 20px" }}>
            <table className="admin-table-unified">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {approvedEvents.map((event) => (
                  <motion.tr 
                    key={event.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td><strong className="td-event-title" style={{fontSize: "0.95rem"}}>{event.title}</strong></td>
                    <td className="td-event-meta">{event.category}</td>
                    <td className="td-event-meta">{event.date ? String(event.date).slice(0, 10) : "—"}</td>
                    <td className="td-event-meta">{event.booked || 0} / {event.capacity || "—"}</td>
                    <td><span className="admin-badge badge-approved" style={{fontSize: "0.65rem"}}>{event.status}</span></td>
                    <td>
                      <div className="admin-actions-cell">
                        <button
                          className="btn-admin-action"
                          style={{color: "var(--admin-danger)", borderColor: "var(--admin-danger-bg)"}}
                          onClick={() => triggerAction(event.id, "deleted", event.title)}
                        >
                          <i className="fas fa-trash-alt"></i> Remove
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {approvedEvents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 18, textAlign: "center", opacity: 0.75 }}>
                    No approved events yet.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;