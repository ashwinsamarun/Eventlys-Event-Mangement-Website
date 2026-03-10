/* src/pages/EventCalendar.js */
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/EventCalendar.css';
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyBookings } from '../api/bookings';

const EventCalendar = ({ events = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('public');
  const [userBookings, setUserBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const list = await fetchMyBookings();
        if (Array.isArray(list)) {
          // Normalize the bookings to match the event UI
          const normalizedBookings = list.map(b => ({
            id: b.bookingId || b._id,
            title: b.title,
            date: b.date,
            category: "Registered",
            price: "Booked",
            time: "Confirmed"
          }));
          setUserBookings(normalizedBookings);
        }
      } catch (err) {
        console.error("Failed to load user bookings for calendar:", err);
      }
    };
    loadBookings();
  }, []);

  // Unified helper to normalize dates for comparison
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getFilteredEvents = (date, mode) => {
    const dataSource = mode === 'public' ? events : userBookings;
    return dataSource.filter(ev => isSameDay(ev.date, date));
  };

  const activeEvents = getFilteredEvents(selectedDate, viewMode);

  // Determine top upcoming events
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const source = viewMode === 'public' ? events : userBookings;
    
    // Group by unique events
    const uniqueFuture = source.reduce((acc, ev) => {
      const evDate = new Date(ev.date);
      evDate.setHours(0,0,0,0);
      if (evDate >= today && !acc[ev.title]) {
        acc[ev.title] = { ...ev, dateObj: evDate };
      }
      return acc;
    }, {});
    
    return Object.values(uniqueFuture)
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 5); // top 5
  };

  const upcomingHighlights = getUpcomingEvents();

  // Aggregate selected day's events to combine duplicates as "Seats Booked"
  const aggregatedEvents = Object.values(
    activeEvents.reduce((acc, ev) => {
      if (!acc[ev.title]) {
        acc[ev.title] = { ...ev, count: 1 };
      } else {
        acc[ev.title].count += 1;
      }
      return acc;
    }, {})
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
    <div className="calendar-wrapper animate-up">
      <div className="calendar-max-container">
        
        <header className="calendar-view-header">
          <div className="header-titles">
            <h1 className="cinzel-font">Event <span>Itinerary</span></h1>
            <p>Your curated schedule across the platform.</p>
          </div>
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'public' ? 'active' : ''} 
              onClick={() => setViewMode('public')}
            >
              Discover All
            </button>
            <button 
              className={viewMode === 'personal' ? 'active' : ''} 
              onClick={() => setViewMode('personal')}
            >
              My Registered
            </button>
          </div>
        </header>

        <div className="calendar-main-grid">
          <div className="calendar-left-column">
            <div className="calendar-card-container glass-panel">
              <Calendar 
                onChange={setSelectedDate} 
                value={selectedDate}
                // This adds the "Gold Dot" to every date that has an event across the app
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const hasEvents = getFilteredEvents(date, viewMode).length > 0;
                    return hasEvents ? <div className={`dot-indicator ${viewMode} pulse-animation`}></div> : null;
                  }
                }}
              />
            </div>

            {upcomingHighlights.length > 0 && (
              <div className="upcoming-events-mini animate-slide-up-delayed">
                <h3 className="cinzel-font">Upcoming <span>{viewMode === 'public' ? 'Highlights' : 'Bookings'}</span></h3>
                <div className="upcoming-list-flex">
                  {upcomingHighlights.map((ev, i) => (
                    <div 
                      key={ev.id || i} 
                      className="upcoming-pill" 
                      onClick={() => setSelectedDate(new Date(ev.date))}
                    >
                      <h5>{ev.title}</h5>
                      <p><i className="far fa-calendar-alt"></i> {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="agenda-sidebar-container glass-panel">
            <div className="agenda-date-header">
              <h2 className="date-number">{selectedDate.getDate()}</h2>
              <div className="date-sub">
                <span className="day-name">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                <span className="month-year">{selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="agenda-scroll-box">
              <AnimatePresence mode="popLayout">
                {aggregatedEvents.length > 0 ? (
                  aggregatedEvents.map((ev, i) => (
                    <motion.div 
                      key={String(ev.id) + viewMode} 
                      className="agenda-card-premium"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                    >
                      <div className="card-accent-line"></div>
                      <div className="card-info">
                        <div className="card-top">
                          <span className="tag">{ev.category}</span>
                          <span className="event-price-tag">
                            {viewMode === 'personal' ? `${ev.count} Seat${ev.count > 1 ? 's' : ''} Booked` : (ev.price || 'Free')}
                          </span>
                        </div>
                        <h4>{ev.title}</h4>
                        <p className="meta"><i className="far fa-clock"></i> {ev.time || "TBD"}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    key="empty"
                    className="empty-agenda"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className="far fa-calendar-times"></i>
                    <p>No events found for this date.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export default EventCalendar;