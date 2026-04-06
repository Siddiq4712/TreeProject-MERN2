import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import JoinEventModal from "./JoinEventModal";
import api from "../services/api";
import { AuthContext } from "../context/auth-context";
import { useResponsive } from "../hooks/useResponsive";

const quickActions = [
  {
    title: "Create Event",
    copy: "Launch a new plantation campaign.",
    icon: "fa-plus-circle",
    path: "/create-event",
  },
  {
    title: "Track Trees",
    copy: "See growth, tasks, and plant history.",
    icon: "fa-tree",
    path: "/my-trees",
  },
  {
    title: "Manage Land",
    copy: "Map available spaces and host events.",
    icon: "fa-mountain",
    path: "/my-land",
  },
];

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const getId = (item) => item?._id || item?.id;

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Dashboard fetchEvents failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchEvents();
  }, [user, fetchEvents]);

  const handleJoinClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const filteredEvents = events.filter((ev) => {
    const text =
      `${ev.location} ${ev.event_id} ${ev.tree_species || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const formatDate = (str) => {
    if (!str) return "Date TBD";
    return new Date(str).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProgressPercent = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  const phaseTone = {
    WAITING_RESOURCES: "#f59e0b",
    DIGGING: "#f97316",
    PLANTING: "#22c55e",
    WATERING: "#0ea5e9",
    FERTILIZING: "#8b5cf6",
    GUARDING: "#14b8a6",
    MAINTENANCE: "#84cc16",
    COMPLETED: "#166534",
  };

  return (
    <div
      style={{
        display: isMobile ? "block" : "flex",
        background: "linear-gradient(180deg, #f4fbf6 0%, #eef7f1 100%)",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      <main
        style={{
          marginLeft: isMobile ? 0 : isTablet ? "240px" : "280px",
          width: isMobile
            ? "100%"
            : `calc(100% - ${isTablet ? "240px" : "280px"})`,
          padding: isMobile ? "18px" : "30px 34px 40px",
        }}
      >
        <section
          style={{
            borderRadius: "30px",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top right, rgba(187,247,208,0.55), transparent 26%), linear-gradient(135deg, #081c15 0%, #1b4332 48%, #2d6a4f 100%)",
            color: "white",
            padding: isMobile ? "20px" : "34px",
            boxShadow: "0 28px 70px rgba(12, 35, 24, 0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              gap: "24px",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: "700px" }}>
              <div
                style={{
                  display: "inline-flex",
                  gap: "8px",
                  alignItems: "center",
                  borderRadius: "999px",
                  padding: "9px 14px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  marginBottom: "18px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <i className="fas fa-leaf"></i>
                Plantation Command Center
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? "28px" : "44px",
                  lineHeight: 1.05,
                }}
              >
                Welcome back,{" "}
                {user?.organization_name || user?.name || "Planter"}.
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: isMobile ? "14px" : "17px",
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.6,
                }}
              >
                Discover open events, watch resource readiness, and move your
                planting missions from idea to rooted impact.
              </p>
            </div>

            <div
              style={{
                minWidth: "250px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "24px",
                padding: isMobile ? "14px" : "18px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                Your profile
              </div>
              <div
                style={{
                  fontSize: isMobile ? "20px" : "26px",
                  fontWeight: 800,
                  marginTop: "10px",
                }}
              >
                {user?.role || "Volunteer"}
              </div>
              <div style={{ marginTop: "4px", color: "#bbf7d0" }}>
                {user?.account_type || "Individual"} account
              </div>
              <div
                style={{
                  marginTop: "18px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Karma
              </div>
              <div
                style={{
                  fontSize: isMobile ? "22px" : "28px",
                  fontWeight: 800,
                }}
              >
                {user?.karma_points || 0}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr",
              gap: "18px",
              marginTop: "26px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.09)",
                  borderRadius: "22px",
                  padding: isMobile ? "14px" : "18px",
                }}
              >
                <div
                  style={{ color: "rgba(255,255,255,0.68)", fontSize: "13px" }}
                >
                  Open Events
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "24px" : "34px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {events.length}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.09)",
                  borderRadius: "22px",
                  padding: isMobile ? "14px" : "18px",
                }}
              >
                <div
                  style={{ color: "rgba(255,255,255,0.68)", fontSize: "13px" }}
                >
                  Need Sponsors
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "24px" : "34px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {
                    events.filter((e) => e.initiation_type === "Volunteer-Led")
                      .length
                  }
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.09)",
                  borderRadius: "22px",
                  padding: isMobile ? "14px" : "18px",
                }}
              >
                <div
                  style={{ color: "rgba(255,255,255,0.68)", fontSize: "13px" }}
                >
                  Need Volunteers
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "24px" : "34px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {
                    events.filter((e) => e.initiation_type === "Sponsor-Led")
                      .length
                  }
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    borderRadius: "22px",
                    padding: isMobile ? "12px" : "16px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? "17px" : "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <i className={`fas ${action.icon}`}></i>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                    {action.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {action.copy}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: "18px",
            alignItems: isMobile ? "stretch" : "center",
            margin: "28px 0 18px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "28px", color: "#0f2f24" }}>
              Featured Events
            </h2>
            <p style={{ margin: "6px 0 0", color: "#52796f" }}>
              Join live campaigns and move planting work forward.
            </p>
          </div>
          <div
            style={{
              position: "relative",
              width: isMobile ? "100%" : "420px",
              maxWidth: "100%",
            }}
          >
            <i
              className="fas fa-search"
              style={{
                position: "absolute",
                left: "16px",
                top: "16px",
                color: "#84a98c",
              }}
            ></i>
            <input
              type="text"
              placeholder="Search by place, ID, or species"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "18px",
                border: "1px solid #d7ebe0",
                background: "white",
                padding: "14px 16px 14px 42px",
                fontSize: "15px",
                outline: "none",
                boxShadow: "0 10px 30px rgba(35, 76, 53, 0.06)",
              }}
            />
          </div>
        </section>

        {loading ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              color: "#52796f",
            }}
          >
            <i
              className="fas fa-spinner fa-spin"
              style={{ marginRight: "10px" }}
            ></i>
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "28px",
              padding: "56px 24px",
              textAlign: "center",
              color: "#52796f",
              boxShadow: "0 20px 50px rgba(16, 52, 35, 0.06)",
            }}
          >
            <i
              className="fas fa-seedling"
              style={{
                fontSize: "52px",
                color: "#84cc16",
                marginBottom: "18px",
              }}
            ></i>
            <h3 style={{ margin: 0, fontSize: "26px", color: "#1b4332" }}>
              No matching events right now
            </h3>
            <p style={{ margin: "10px 0 0" }}>
              Try a different search or start a new event from your workspace.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "22px",
            }}
          >
            {filteredEvents.map((ev) => {
              const volunteers = ev.eventVolunteers || [];
              const fundingPercent = getProgressPercent(
                ev.funding_fulfilled,
                ev.funding_goal,
              );
              const laborPercent = getProgressPercent(
                ev.labor_fulfilled,
                ev.labor_goal,
              );
              const resources = ev.resources || [];

              return (
                <article
                  key={getId(ev)}
                  onClick={() => navigate(`/event/${getId(ev)}`)}
                  style={{
                    background: "white",
                    borderRadius: "28px",
                    overflow: "hidden",
                    boxShadow: "0 22px 55px rgba(15, 47, 36, 0.08)",
                    cursor: "pointer",
                    border: "1px solid #ecf5ef",
                  }}
                >
                  <div
                    style={{
                      padding: "24px",
                      background:
                        "radial-gradient(circle at top right, rgba(134,239,172,0.35), transparent 22%), linear-gradient(135deg, #f4fff7 0%, #def7e5 100%)",
                      borderBottom: "1px solid #e3f1e8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#52796f",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {ev.event_id}
                        </div>
                        <h3
                          style={{
                            margin: "8px 0 6px",
                            fontSize: "24px",
                            color: "#163126",
                          }}
                        >
                          {ev.location}
                        </h3>
                        <div style={{ color: "#2d6a4f", fontWeight: 700 }}>
                          {ev.tree_count} trees ·{" "}
                          {ev.tree_species || "Mixed species"}
                        </div>
                      </div>
                      <span
                        style={{
                          background: phaseTone[ev.current_phase] || "#2d6a4f",
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.current_phase?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "22px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "14px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: "#f4fbf6",
                          borderRadius: "18px",
                          padding: "14px",
                        }}
                      >
                        <div style={{ color: "#52796f", fontSize: "12px" }}>
                          Date
                        </div>
                        <div
                          style={{
                            marginTop: "6px",
                            fontWeight: 700,
                            color: "#163126",
                            lineHeight: 1.4,
                          }}
                        >
                          {formatDate(ev.date_time)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#f4fbf6",
                          borderRadius: "18px",
                          padding: "14px",
                        }}
                      >
                        <div style={{ color: "#52796f", fontSize: "12px" }}>
                          Organizer
                        </div>
                        <div
                          style={{
                            marginTop: "6px",
                            fontWeight: 700,
                            color: "#163126",
                          }}
                        >
                          {ev.creator?.organization_name ||
                            ev.creator?.name ||
                            "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#3f5f53",
                          marginBottom: "6px",
                        }}
                      >
                        <span>Funding readiness</span>
                        <strong>
                          ₹{ev.funding_fulfilled || 0} / ₹{ev.funding_goal || 0}
                        </strong>
                      </div>
                      <div
                        style={{
                          height: "10px",
                          background: "#e8f3eb",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${fundingPercent}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #f59e0b, #22c55e)",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#3f5f53",
                          marginBottom: "6px",
                        }}
                      >
                        <span>Volunteer readiness</span>
                        <strong>
                          {ev.labor_fulfilled || 0} / {ev.labor_goal || 0}
                        </strong>
                      </div>
                      <div
                        style={{
                          height: "10px",
                          background: "#e8f3eb",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${laborPercent}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #0ea5e9, #22c55e)",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "18px",
                      }}
                    >
                      {resources.slice(0, 4).map((resource) => (
                        <span
                          key={`${getId(resource)}-${resource.resource_type}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "999px",
                            background:
                              resource.status === "Complete"
                                ? "#dcfce7"
                                : resource.status === "Partial"
                                  ? "#fef3c7"
                                  : "#ecfdf5",
                            color:
                              resource.status === "Complete"
                                ? "#166534"
                                : resource.status === "Partial"
                                  ? "#92400e"
                                  : "#166534",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {resource.resource_type}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "18px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {volunteers.slice(0, 4).map((volunteer, index) => (
                          <div
                            key={`${getId(volunteer)}-${index}`}
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#1b4332",
                              color: "white",
                              display: "grid",
                              placeItems: "center",
                              marginLeft: index === 0 ? 0 : -10,
                              border: "2px solid white",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {getInitials(volunteer.user?.name)}
                          </div>
                        ))}
                        <span
                          style={{
                            marginLeft: "12px",
                            fontSize: "13px",
                            color: "#52796f",
                          }}
                        >
                          {volunteers.length} people engaged
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleJoinClick(ev, e)}
                        style={{
                          border: "none",
                          background:
                            "linear-gradient(135deg, #2d6a4f, #1b4332)",
                          color: "white",
                          borderRadius: "16px",
                          padding: "12px 18px",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        Join Event
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {showJoinModal && selectedEvent && (
          <JoinEventModal
            event={selectedEvent}
            onClose={() => setShowJoinModal(false)}
            onSuccess={handleJoinSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
