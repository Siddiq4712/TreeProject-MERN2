import { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import JoinEventModal from './JoinEventModal';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    if (!user) return;
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (event) => {
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const filteredEvents = events.filter(
    (ev) =>
      ev.location.toLowerCase().includes(search.toLowerCase()) ||
      ev.event_id.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (str) => {
    if (!str) return 'Date TBD';
    return new Date(str).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const PHASES = [
    { key: 'WAITING_RESOURCES', label: 'Waiting', icon: 'fa-clock' },
    { key: 'DIGGING', label: 'Digging', icon: 'fa-shovel' },
    { key: 'PLANTING', label: 'Planting', icon: 'fa-seedling' },
    { key: 'WATERING', label: 'Watering', icon: 'fa-tint' },
    { key: 'FERTILIZING', label: 'Fertilizer', icon: 'fa-flask' },
    { key: 'GUARDING', label: 'Guards', icon: 'fa-shield-alt' },
    { key: 'MAINTENANCE', label: 'Maintain', icon: 'fa-tools' },
    { key: 'COMPLETED', label: 'Done', icon: 'fa-check-circle' },
  ];

  const styles = {
    body: {
      display: 'flex',
      backgroundColor: '#f4f7f6',
      color: '#1b4332',
      fontFamily: "'Segoe UI', sans-serif",
      minHeight: '100vh',
    },
    mainContent: {
      marginLeft: '260px',
      width: 'calc(100% - 260px)',
      padding: '30px',
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    searchContainer: {
      position: 'relative',
      width: '50%',
    },
    searchInput: {
      width: '100%',
      padding: '12px 40px',
      borderRadius: '25px',
      border: '1px solid #ddd',
      outline: 'none',
      fontSize: '16px',
    },
    searchIcon: {
      position: 'absolute',
      left: '15px',
      top: '14px',
      color: '#888',
    },
    btnCreate: {
      background: '#2d6a4f',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      borderLeft: '5px solid #2d6a4f',
    },
    eventGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
      gap: '25px',
    },
    eventCard: {
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      transition: '0.3s',
      cursor: 'pointer',
    },
    cardHeader: {
      padding: '20px',
      background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
      position: 'relative',
    },
    initiationBadge: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: 'bold',
      color: 'white',
    },
    eventBody: {
      padding: '20px',
    },
    progressSection: {
      marginTop: '15px',
    },
    progressBar: {
      height: '10px',
      background: '#e0e0e0',
      borderRadius: '5px',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '5px',
      transition: '0.3s',
    },
    resourceTags: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      marginTop: '12px',
    },
    resourceTag: {
      padding: '4px 10px',
      borderRadius: '15px',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    phaseTracker: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '15px 0',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '10px',
      overflow: 'auto',
    },
    volunteerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #eee',
    },
    avatarGroup: {
      display: 'flex',
      marginLeft: '-8px',
    },
    avatar: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: '#2d6a4f',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      border: '2px solid white',
      marginLeft: '-8px',
    },
    joinBtn: {
      padding: '10px 20px',
      border: 'none',
      background: '#1b4332',
      color: 'white',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '13px',
    },
    approvalBadge: {
      padding: '4px 10px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
      marginLeft: '10px',
    },
  };

  const getProgressPercent = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  return (
    <div style={styles.body}>
      <Sidebar />

      <div style={styles.mainContent}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.searchContainer}>
            <i className="fas fa-search" style={styles.searchIcon}></i>
            <input
              type="text"
              placeholder="Search events..."
              style={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button style={styles.btnCreate} onClick={() => navigate('/create-event')}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Available Events</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {events.length}
            </p>
          </div>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Your Karma</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {user?.karma_points || 0} 🌿
            </p>
          </div>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Need Volunteers</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {events.filter((e) => e.initiation_type === 'Sponsor-Led').length}
            </p>
          </div>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Need Sponsors</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {events.filter((e) => e.initiation_type === 'Volunteer-Led').length}
            </p>
          </div>
        </div>

        {/* Event Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Available Events to Join</h3>
          <span>Showing {filteredEvents.length} events</span>
        </div>

        {/* Event Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading events...
          </p>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <i className="fas fa-calendar-times" style={{ fontSize: '50px', marginBottom: '20px', display: 'block' }}></i>
            <p>No events available to join. Create your own!</p>
          </div>
        ) : (
          <div style={styles.eventGrid}>
            {filteredEvents.map((ev) => {
              const volunteers = ev.eventVolunteers || [];
              const sponsors = volunteers.filter((v) => v.contribution_type === 'Capital');
              const laborVolunteers = volunteers.filter((v) => v.contribution_type === 'Labor');
              const fundingPercent = getProgressPercent(ev.funding_fulfilled, ev.funding_goal);
              const laborPercent = getProgressPercent(ev.labor_fulfilled, ev.labor_goal);
              const resources = ev.resources || [];

              return (
                <div
                  key={getId(ev)}
                  style={styles.eventCard}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  onClick={() => navigate(`/event/${getId(ev)}`)}
                >
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <span
                      style={{
                        ...styles.initiationBadge,
                        background: ev.initiation_type === 'Sponsor-Led' ? '#ff9f1c' : '#2a9d8f',
                      }}
                    >
                      {ev.initiation_type}
                    </span>

                    <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>ID: {ev.event_id}</p>
                    <h3 style={{ fontSize: '20px', color: '#1b4332', margin: '5px 0' }}>{ev.location}</h3>
                    <p style={{ fontSize: '14px', color: '#2d6a4f', fontWeight: 'bold', margin: 0 }}>
                      🌳 {ev.tree_count} {ev.tree_species || 'Trees'}
                    </p>
                  </div>

                  <div style={styles.eventBody}>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px' }}>
                      <i className="fas fa-clock"></i> {formatDate(ev.date_time)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                      <i className="fas fa-user"></i> By: {ev.creator?.name || 'Unknown'}
                      <span
                        style={{
                          ...styles.approvalBadge,
                          background: ev.approval_mode === 'Auto' ? '#d8f3dc' : '#fff3cd',
                          color: ev.approval_mode === 'Auto' ? '#2d6a4f' : '#856404',
                        }}
                      >
                        {ev.approval_mode === 'Auto' ? '✓ Auto-Accept' : '⏳ Manual Review'}
                      </span>
                    </p>

                    {/* Progress Bars */}
                    <div style={styles.progressSection}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                        <span><i className="fas fa-rupee-sign"></i> Funding</span>
                        <span>₹{ev.funding_fulfilled || 0} / ₹{ev.funding_goal || 0}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${fundingPercent}%`, background: fundingPercent >= 100 ? '#2d6a4f' : '#ff9f1c' }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                        <span><i className="fas fa-users"></i> Volunteers</span>
                        <span>{ev.labor_fulfilled || 0} / {ev.labor_goal || 0}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${laborPercent}%`, background: laborPercent >= 100 ? '#2d6a4f' : '#3b82f6' }}></div>
                      </div>
                    </div>

                    {/* Resource Tags */}
                    <div style={styles.resourceTags}>
                      {resources.map((r) => (
                        <span
                          key={getId(r) || r.resource_type}
                          style={{
                            ...styles.resourceTag,
                            background: r.status === 'Complete' ? '#d8f3dc' : r.status === 'Partial' ? '#fff3cd' : '#f8d7da',
                            color: r.status === 'Complete' ? '#2d6a4f' : r.status === 'Partial' ? '#856404' : '#721c24',
                          }}
                        >
                          {r.status === 'Complete' ? '✓' : r.status === 'Partial' ? '◐' : '○'} {r.resource_type}
                        </span>
                      ))}
                    </div>

                    {/* Phase Tracker */}
                    {ev.is_ready_to_start && (
                      <div style={styles.phaseTracker}>
                        {PHASES.slice(1, 7).map((phase, index) => {
                          const currentPhaseIndex = PHASES.findIndex((p) => p.key === ev.current_phase);
                          const isActive = currentPhaseIndex > index;
                          const isCurrent = currentPhaseIndex === index + 1;

                          return (
                            <div key={phase.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '45px' }}>
                              <div
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: '4px',
                                  fontSize: '11px',
                                  background: isActive ? '#2d6a4f' : isCurrent ? '#ff9f1c' : '#e0e0e0',
                                  color: isActive || isCurrent ? 'white' : '#999',
                                }}
                              >
                                <i className={`fas ${phase.icon}`}></i>
                              </div>
                              <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', color: isActive || isCurrent ? '#2d6a4f' : '#999' }}>
                                {phase.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Volunteer Section */}
                    <div style={styles.volunteerSection}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.avatarGroup}>
                          {volunteers.slice(0, 4).map((v, i) => (
                            <div
                              key={getId(v) || i}
                              style={{ ...styles.avatar, background: v.contribution_type === 'Capital' ? '#ff9f1c' : '#2d6a4f' }}
                            >
                              {getInitials(v.user?.name)}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          <div>{laborVolunteers.length} Volunteers</div>
                          <div>{sponsors.length} Sponsors</div>
                        </div>
                      </div>

                      <button
                        style={styles.joinBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinClick(ev);
                        }}
                      >
                        <i className="fas fa-hand-paper"></i> Request to Join
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Event Modal */}
      {showJoinModal && selectedEvent && (
        <JoinEventModal
          event={selectedEvent}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;