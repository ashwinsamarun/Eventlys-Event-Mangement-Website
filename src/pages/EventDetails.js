/* src/pages/EventDetails.js */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/EventDetails.css";
import { useToast } from "../components/ToastProvider";
import { fetchApprovedEvents, fetchEventById } from "../api/event";
import { getCapacity, getBooked, getRemaining, isSoldOut } from "../utils/seats";
import { MapPin, Calendar } from "lucide-react";

const EventDetails = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) prefer passed state (fast)
        const stateEvent = location.state?.event;
        const stateId = stateEvent?._id ?? stateEvent?.id;

        if (stateEvent && String(stateId) === String(id)) {
          if (mounted) setEvent({ ...stateEvent, id: stateId });
        } else {
          // 2) fetch single event by id
          const fetched = await fetchEventById(id);
          if (mounted && fetched) setEvent({ ...fetched, id: fetched._id ?? fetched.id });
        }

        // 3) fetch list for "Similar Events"
        const list = await fetchApprovedEvents();
        const normalized = (Array.isArray(list) ? list : []).map((e) => ({
          ...e,
          id: e._id ?? e.id,
          img:
            e.img ||
            e.image ||
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop",
          category: e.category || "Other",
          location: e.location || "Venue TBA",
          price: e.price || "Free",
          date: e.date || (e.startAt ? String(e.startAt).slice(0, 10) : ""),
        }));

        if (mounted) setAllEvents(normalized);
      } catch {
        if (mounted) {
          setEvent(null);
          setAllEvents([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, location.state]);

  const resolved = useMemo(() => {
    if (event) return event;

    // last fallback: try to find in list (if list loaded first)
    return allEvents.find((e) => String(e.id) === String(id)) || null;
  }, [event, allEvents, id]);

  if (!resolved) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Event not found</h2>
        <p>That event may have been removed or the link is invalid.</p>
        <button className="btn-login-outline" onClick={() => navigate("/events")}>
          Back to Events
        </button>
      </div>
    );
  }

  const soldOut = isSoldOut(resolved);

  const todayStr = new Date().toISOString().split('T')[0];
  const isEnded = resolved.date && resolved.date < todayStr;

  const similar = allEvents
    .filter((e) => e.category === resolved.category && String(e.id) !== String(resolved.id) && (!e.date || e.date >= todayStr))
    .slice(0, 3);

  const checkoutPayload = {
    eventId: resolved._id || resolved.id, // ✅ Mongo _id when available (backend bookings)
    title: resolved.title,
    date: resolved.date,
    location: resolved.location,
    category: resolved.category,
    price: resolved.price,
    img: resolved.img || resolved.image,
    capacity: getCapacity(resolved),
    booked: Math.max(Number(resolved.booked || 0), getBooked(resolved._id || resolved.id)),
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          redirectTo: "/checkout",
          checkoutState: checkoutPayload,
        },
      });
      return;
    }
    navigate("/checkout", { state: checkoutPayload });
  };

  const viewNativeCalendar = () => {
    navigate('/calendar');
  };

  const downloadICS = () => {
    const dtStart = resolved.date.replaceAll("-", "") + "T090000Z";
    const dtEnd = resolved.date.replaceAll("-", "") + "T110000Z";
    const uid = `eventlys-${resolved._id || resolved.id}-${Date.now()}@eventlys`;

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Eventlys//Evently$//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${resolved.title}
DESCRIPTION:${(resolved.description || "").replace(/\n/g, " ").replace(/,/g, "\\,")}
LOCATION:${resolved.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Event_${resolved._id || resolved.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("Calendar file downloaded");
  };

  // Native Calendar replaced Google Calendar

  const seatsTotal = Number(getCapacity(resolved)) || 0;
  const seatsLeft = Number(getRemaining(resolved)) || 0;
  const pctLeft = seatsTotal > 0 ? Math.min(100, Math.max(0, (seatsLeft / seatsTotal) * 100)) : 0;

  return (
    <motion.div 
      className="event-details-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="details-hero"
        style={{
          backgroundImage: `linear-gradient(to top, var(--bg-hero-fade, rgba(10,10,10,0.95)), rgba(0,0,0,0.2)), url(${
            resolved.img || resolved.image
          })`,
        }}
      >
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <button className="back-link premium-back" onClick={() => navigate("/events")}>
            <i className="fas fa-arrow-left"></i> Back to Events
          </button>

          <div className="hero-meta-top">
            <span className="category-tag-refined">{resolved.category}</span>
            {soldOut && <span className="category-tag-refined sold-out-tag">Sold Out</span>}
          </div>
          <h1 className="hero-event-title">
            {resolved.title}
          </h1>
          <div className="hero-meta-bottom">
            <span><i className="far fa-calendar-alt"></i> {resolved.date}</span>
            <span><i className="fas fa-map-pin"></i> {resolved.location}</span>
          </div>
        </motion.div>
      </div>

      <div className="details-grid-container">
        <div className="details-main-content animate-slide-up">
          <h2 className="section-title">About this event</h2>
          <p className="event-description-text">
            {resolved.description ||
              "This event brings the community together with curated sessions and a premium experience. Join us for a memorable time."}
          </p>

          <div className="info-cards-grid">
            <div className="info-card-premium">
              <div className="info-icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="info-text">
                <h3>Venue</h3>
                <p>{resolved.location}</p>
              </div>
            </div>
            
            <div className="info-card-premium">
              <div className="info-icon"><i className="fas fa-user-tie"></i></div>
              <div className="info-text">
                <h3>Organizer</h3>
                <p>{resolved.organizer || "Eventlys Host"}</p>
              </div>
            </div>
          </div>

          {similar.length > 0 && (
            <div className="similar-events-section">
              <h2 className="section-title">Similar Events</h2>
              <div className="similar-cards-container">
                {similar.map((s) => {
                  const sid = s._id || s.id;
                  return (
                    <motion.div
                      key={String(sid)}
                      className="similar-event-card"
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/events/${sid}`, { state: { event: s } })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && navigate(`/events/${sid}`, { state: { event: s } })
                      }
                    >
                      <img
                        src={s.img || s.image}
                        alt={s.title}
                        className="similar-event-img"
                      />
                      <div className="similar-event-info">
                        <div className="similar-event-title">{s.title}</div>
                        <div className="similar-event-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} className="opacity-70" /> {s.location} • <Calendar size={14} className="opacity-70" /> {s.date}
                        </div>
                      </div>
                      <div className="similar-event-price">{s.price}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="booking-sidebar animate-slide-up-delayed">
          <div className="sticky-card glass-panel">
            <div className="sidebar-price-header">
               <p className="sidebar-label">Ticket Price</p>
               <div className="sidebar-price">{resolved.price}</div>
            </div>

            <div className="sidebar-stats-refined">
              <div className="stat-row">
                <div className="stat-icon-wrapper"><i className="far fa-calendar-alt"></i></div>
                <div className="stat-details">
                  <span className="stat-title">Date</span>
                  <p>{resolved.date}</p>
                </div>
              </div>

              <div className="stat-row">
                <div className="stat-icon-wrapper"><i className="fas fa-map-marker-alt"></i></div>
                <div className="stat-details">
                  <span className="stat-title">Location</span>
                  <p>{resolved.location}</p>
                </div>
              </div>

              <div className="stat-row">
                <div className="stat-icon-wrapper"><i className="fas fa-tag"></i></div>
                <div className="stat-details">
                  <span className="stat-title">Category</span>
                  <p>{resolved.category}</p>
                </div>
              </div>
            </div>

            <div className="availability-module">
              <div className="avail-header">
                <span className="stat-title">Availability</span>
                <span className="avail-count">{seatsLeft} / {seatsTotal} Left</span>
              </div>
              <div className="progress-track">
                <motion.div 
                  className="progress-fill" 
                  initial={{ width: 0 }}
                  animate={{ width: `${pctLeft}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {isEnded ? (
              <div 
                className="btn-premium-action" 
                style={{ 
                  background: "rgba(255, 255, 255, 0.05)", 
                  color: "#aaa", 
                  cursor: "not-allowed", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <i className="fas fa-calendar-times"></i> Event Has Ended
              </div>
            ) : (
              <button 
                className="btn-premium-action btn-checkout-glow" 
                onClick={handleCheckout} 
                disabled={soldOut}
              >
                {soldOut ? "Fully Booked" : "Secure Your Ticket"}
              </button>
            )}

            <div className="action-buttons-grid">
              <button className="btn-secondary-action" onClick={viewNativeCalendar} type="button">
                 <i className="far fa-calendar-check"></i> View Calendar
              </button>
              <button className="btn-secondary-action" onClick={downloadICS} type="button">
                 <i className="fas fa-download"></i> Save .ICS
              </button>
            </div>

            <div className="secure-tag"><i className="fas fa-shield-alt"></i> Secure checkout • Instant confirmation</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetails;