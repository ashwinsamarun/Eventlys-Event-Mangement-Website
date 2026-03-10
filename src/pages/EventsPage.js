import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import "../styles/EventsPage.css";
import SkeletonCard from "../components/SkeletonCard";
import { motion } from "framer-motion";
import { useToast } from "../components/ToastProvider";
import { isSoldOut } from "../utils/seats";
import { fetchApprovedEvents } from "../api/event";

const EventsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [filter, setFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);

  const [remoteEvents, setRemoteEvents] = useState([]);

  const [sortBy, setSortBy] = useState("dateAsc");
  const [freeOnly, setFreeOnly] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const gridRef = useRef(null);
  const [cols, setCols] = useState(4);

  // Measure actual grid columns dynamically
  useEffect(() => {
    const updateCols = () => {
      if (gridRef.current) {
        const gridComputed = window.getComputedStyle(gridRef.current);
        const colCount = gridComputed.gridTemplateColumns.split(" ").length;
        setCols(colCount || 4);
      }
    };
    
    // Initial measure after mount
    setTimeout(updateCols, 100); 
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const list = await fetchApprovedEvents();
        if (!mounted) return;

        const normalized = (Array.isArray(list) ? list : []).map((e) => ({
          ...e,
          id: e._id ?? e.id, // ✅ important for routing/details/checkout
          img:
            e.img ||
            e.image ||
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop",
          category: e.category || "Other",
          location: e.location || "Venue TBA",
          price: e.price || "Free",
          date: e.date || (e.startAt ? String(e.startAt).slice(0, 10) : ""),
        }));

        setRemoteEvents(normalized);
      } catch {
        setRemoteEvents([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const allEvents = useMemo(() => remoteEvents, [remoteEvents]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(allEvents.map((e) => e.category))).sort()],
    [allEvents]
  );

  const locations = useMemo(
    () => ["All", ...Array.from(new Set(allEvents.map((e) => e.location))).sort()],
    [allEvents]
  );

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allEvents
      .filter((e) => {
        const matchesCat = filter === "All" || e.category === filter;
        const matchesLoc = locationFilter === "All" || e.location === locationFilter;
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());

        const isFree =
          String(e.price).toLowerCase() === "free" ||
          Number(String(e.price).replace(/[^0-9.]/g, "")) === 0;
        const matchesFree = !freeOnly || isFree;

        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        const matchesUpcoming = !upcomingOnly || eventDate >= today;

        return matchesCat && matchesLoc && matchesSearch && matchesFree && matchesUpcoming;
      })
      .sort((a, b) => {
        if (sortBy === "titleAsc") return a.title.localeCompare(b.title);

        if (sortBy === "priceAsc") {
          const pa =
            String(a.price).toLowerCase() === "free"
              ? 0
              : Number(String(a.price).replace(/[^0-9.]/g, "")) || 0;
          const pb =
            String(b.price).toLowerCase() === "free"
              ? 0
              : Number(String(b.price).replace(/[^0-9.]/g, "")) || 0;
          return pa - pb;
        }

        return new Date(a.date) - new Date(b.date);
      });
  }, [allEvents, filter, locationFilter, searchTerm, freeOnly, upcomingOnly, sortBy]);

  const openEvent = (evt) => {
    navigate(`/events/${evt.id}`, { state: { event: evt } });
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        // Calculate the next multiple of 'cols' to ensure perfect row alignment
        let nextCount = Math.ceil(prev / cols) * cols;
        if (nextCount === prev) nextCount += cols; // Add a full new row if already aligned
        return nextCount;
      });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="events-page-container">
        <header className="events-hero animate-up">
          <h1 className="cinzel-font">
            Explore <span>Catalog</span>
          </h1>

          <div className="master-search-wrapper">
            <input
              type="text"
              placeholder="Search by event title..."
              className="master-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(cols > 0 ? cols * 2 : 4); // Reset to 2 rows
              }}
            />
          </div>
        </header>

        <div className="controls-bar animate-up">
          <div className="filter-section">
            <div
              className="dropdown-group"
              style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%" }}
            >
              <select
                className="location-select-refined"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setVisibleCount(cols > 0 ? cols * 2 : 4);
                  toast.info("Category updated");
                }}
              >
                <option value="All">All Categories</option>
                {categories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>

              <select
                className="location-select-refined"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setVisibleCount(cols > 0 ? cols * 2 : 4);
                }}
              >
                <option value="All">All Venues</option>
                {locations
                  .filter((l) => l !== "All")
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
              </select>

              <select
                className="location-select-refined"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setVisibleCount(cols > 0 ? cols * 2 : 4);
                  toast.info("Sorting updated");
                }}
              >
                <option value="dateAsc">Sort: Date (Soonest)</option>
                <option value="priceAsc">Sort: Price (Low → High)</option>
                <option value="titleAsc">Sort: Title (A → Z)</option>
              </select>

              <button
                className={`pill-refined ${freeOnly ? "active" : ""}`}
                onClick={() => {
                  setFreeOnly((v) => !v);
                  setVisibleCount(cols > 0 ? cols * 2 : 4);
                  toast.info(!freeOnly ? "Showing free events" : "Free filter removed");
                }}
                type="button"
              >
                Free Only
              </button>

              <button
                className={`pill-refined ${upcomingOnly ? "active" : ""}`}
                onClick={() => {
                  setUpcomingOnly((v) => !v);
                  setVisibleCount(cols > 0 ? cols * 2 : 4);
                  toast.info(!upcomingOnly ? "Showing upcoming only" : "Including past events");
                }}
                type="button"
              >
                Upcoming Only
              </button>
            </div>
          </div>
        </div>

        <div className="events-grid-master" ref={gridRef}>
          {isLoading && Array.from({ length: cols > 0 ? cols * 2 : 4 }).map((_, i) => <SkeletonCard key={i} />)}

          {!isLoading && filtered.length > 0 ? (
            filtered.slice(0, visibleCount).map((evt, index) => {
              const soldOut = isSoldOut(evt);

              return (
                <motion.div
                  className="master-event-card fade-in-scale"
                  key={String(evt.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  onClick={() => openEvent(evt)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openEvent(evt)}
                >
                  <div className="card-img-wrapper">
                    <img src={evt.img} alt={evt.title} />
                    <span className="card-category-tag">{evt.category}</span>
                  </div>

                  <div className="card-content-master">
                    <h3>{evt.title}</h3>

                    <div className="card-info-row">
                      <span><MapPin size={16} className="inline-block mr-1 opacity-70"/> {evt.location}</span>
                      <span><Calendar size={16} className="inline-block mr-1 opacity-70"/> {evt.date}</span>
                    </div>

                    <div className="card-footer-master">
                      <span className="card-price-master">{evt.price}</span>
                      <button
                        className="btn-details-master"
                        disabled={soldOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (soldOut) {
                            toast.error("Sold Out");
                            return;
                          }
                          openEvent(evt);
                        }}
                        type="button"
                      >
                        {soldOut ? "Sold Out" : "Book Now"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            !isLoading && (
              <div className="no-results animate-up">
                <h3>No results found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
                <button
                  className="pill-refined active"
                  onClick={() => {
                    setFilter("All");
                    setLocationFilter("All");
                    setSearchTerm("");
                    setSortBy("dateAsc");
                    setFreeOnly(false);
                    setUpcomingOnly(true);
                    setVisibleCount(cols > 0 ? cols * 2 : 4);
                    toast.info("Filters cleared");
                  }}
                  type="button"
                >
                  Clear All
                </button>
              </div>
            )
          )}
        </div>

        {visibleCount < filtered.length && !isLoading && (
          <div className="load-more-container animate-up">
            <button className="btn-load-more" onClick={handleLoadMore} type="button">
              Show More
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EventsPage;