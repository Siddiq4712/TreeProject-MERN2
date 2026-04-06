import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState('PENDING');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await api.get('/events/my-created');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/requests?status=${requestFilter}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManageRequests = (event) => {
    setSelectedEvent(event);
    setShowRequests(true);
    fetchRequests(getId(event));
  };

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/events/requests/${requestId}/accept`);
      alert('✅ Request accepted!');
      fetchRequests(getId(selectedEvent));
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.post(`/events/requests/${requestId}/reject`, { reason });
      alert('Request rejected');
      fetchRequests(getId(selectedEvent));
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? All pending requests will be cancelled.')) {
      return;
    }
    try {
      await api.delete(`/events/${eventId}`);
      alert('Event deleted');
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAdvancePhase = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/advance`);
      alert(`Event advanced to: ${res.data.event.current_phase}`);
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot advance phase');
    }
  };

  const formatDate = (str) => {
    if (!str) return 'Date TBD';
    return new Date(str).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const styles = {
    body: {
      display: 'flex',
      backgroundColor: '#f4f7f6',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', sans-serif",
    },
    mainContent: {
      marginLeft: '260px',
      width: 'calc(100% - 260px)',
      padding: '30px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '28px',
      color: '#1b4332',
      margin: 0,
    },
    createBtn: {
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
      cursor: 'pointer',
    },
    cardHeader: {
      padding: '20px',
      background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
      color: 'white',
    },
    cardBody: {
      padding: '20px',
    },
    statsRow: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px',
    },
    statBox: {
      flex: 1,
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '10px',
      textAlign: 'center',
    },
    requestBadge: {
      display: 'inline-block',
      padding: '8px 15px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    actionBtns: {
      display: 'flex',
      gap: '10px',
      marginTop: '15px',
    },
    actionBtn: {
      flex: 1,
      padding: '10px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalHeader: {
      padding: '20px',
      background: '#2d6a4f',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalBody: {
      padding: '20px',
    },
    filterTabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    filterTab: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '13px',
    },
    requestCard: {
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      marginBottom: '15px',
    },
    requestActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '12px',
    },
  };

  return (
    <div style={styles.body}>
      <Sidebar />

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📋 My Created Events</h1>
            <p style={{ color: '#666', margin: '5px 0 0' }}>Manage events you've created</p>
          </div>
          <button style={styles.createBtn} onClick={() => navigate('/create-event')}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading...
          </p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            <i className="fas fa-calendar-plus" style={{ fontSize: '60px', marginBottom: '20px', display: 'block' }}></i>
            <p>You haven't created any events yet.</p>
            <button style={{ ...styles.createBtn, margin: '20px auto' }} onClick={() => navigate('/create-event')}>
              <i className="fas fa-plus"></i> Create Your First Event
            </button>
          </div>
        ) : (
          <div style={styles.eventGrid}>
            {events.map((ev) => {
              const eventId = getId(ev);
              return (
                <div 
                  key={eventId} 
                  style={styles.eventCard}
                  onClick={() => navigate(`/event/${eventId}`)}
                >
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>ID: {ev.event_id}</p>
                        <h3 style={{ margin: '5px 0' }}>{ev.location}</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          🌳 {ev.tree_count} Trees • {formatDate(ev.date_time)}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '15px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: ev.approval_mode === 'Auto' ? 'rgba(255,255,255,0.3)' : 'rgba(255,159,28,0.8)',
                          color: 'white',
                        }}
                      >
                        {ev.approval_mode} Approval
                      </span>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    {/* Stats */}
                    <div style={styles.statsRow}>
                      <div style={styles.statBox}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Phase</p>
                        <p style={{ margin: '3px 0 0', fontWeight: 'bold', color: '#2d6a4f', fontSize: '13px' }}>
                          {ev.current_phase?.replace('_', ' ')}
                        </p>
                      </div>
                      <div style={styles.statBox}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Volunteers</p>
                        <p style={{ margin: '3px 0 0', fontWeight: 'bold', color: '#2d6a4f' }}>
                          {ev.labor_fulfilled}/{ev.labor_goal}
                        </p>
                      </div>
                      <div style={styles.statBox}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Funding</p>
                        <p style={{ margin: '3px 0 0', fontWeight: 'bold', color: '#2d6a4f' }}>
                          ₹{ev.funding_fulfilled}
                        </p>
                      </div>
                    </div>

                    {/* Request Badge */}
                    <div
                      style={{
                        ...styles.requestBadge,
                        background: ev.pending_requests > 0 ? '#ff9f1c' : '#e0e0e0',
                        color: ev.pending_requests > 0 ? 'white' : '#666',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageRequests(ev);
                      }}
                    >
                      <i className="fas fa-user-clock"></i> {ev.pending_requests} Pending Requests
                    </div>

                    <span
                      style={{
                        ...styles.requestBadge,
                        background: '#d8f3dc',
                        color: '#2d6a4f',
                        marginLeft: '10px',
                      }}
                    >
                      <i className="fas fa-user-check"></i> {ev.accepted_requests} Accepted
                    </span>

                    {/* Action Buttons */}
                    <div style={styles.actionBtns}>
                      <button
                        style={{ ...styles.actionBtn, background: '#2d6a4f', color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageRequests(ev);
                        }}
                      >
                        <i className="fas fa-users-cog"></i> Manage Requests
                      </button>
                      <button
                        style={{ ...styles.actionBtn, background: '#3b82f6', color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvancePhase(eventId);
                        }}
                        disabled={!ev.is_ready_to_start}
                      >
                        <i className="fas fa-forward"></i> Advance Phase
                      </button>
                      <button
                        style={{ ...styles.actionBtn, background: '#dc2626', color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(eventId);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Management Modal */}
      {showRequests && selectedEvent && (
        <div style={styles.modalOverlay} onClick={() => setShowRequests(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0 }}>Manage Requests</h3>
                <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '14px' }}>{selectedEvent.location}</p>
              </div>
              <button
                onClick={() => setShowRequests(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Filter Tabs */}
              <div style={styles.filterTabs}>
                {['PENDING', 'ACCEPTED', 'REJECTED'].map((status) => (
                  <button
                    key={status}
                    style={{
                      ...styles.filterTab,
                      background: requestFilter === status ? '#2d6a4f' : '#e0e0e0',
                      color: requestFilter === status ? 'white' : '#666',
                    }}
                    onClick={() => {
                      setRequestFilter(status);
                      fetchRequests(getId(selectedEvent));
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Request List */}
              {requests.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '30px' }}>
                  No {requestFilter.toLowerCase()} requests
                </p>
              ) : (
                requests.map((req, index) => {
                  const reqId = getId(req);
                  return (
                    <div key={reqId || index} style={styles.requestCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#1b4332' }}>{req.user?.name}</h4>
                          <p style={{ margin: '3px 0', fontSize: '13px', color: '#666' }}>{req.user?.email}</p>
                          <p style={{ margin: '3px 0', fontSize: '12px', color: '#888' }}>
                            Karma: {req.user?.karma_points || 0} 🌿
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '5px 12px',
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: req.contribution_type === 'Capital' ? '#ff9f1c' : '#2d6a4f',
                            color: 'white',
                          }}
                        >
                          {req.contribution_type === 'Capital' ? 'Sponsor' : 'Volunteer'}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
                        {req.contribution_type === 'Labor' ? (
                          <>
                            <p style={{ margin: 0 }}>
                              <strong>Hard Tasks:</strong> {(req.hard_tasks || []).join(', ') || 'None'}
                            </p>
                            <p style={{ margin: '5px 0 0' }}>
                              <strong>Soft Tasks:</strong> {(req.soft_tasks || []).join(', ') || 'None'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p style={{ margin: 0 }}>
                              <strong>Resource:</strong> {req.resource_type || 'General'}
                            </p>
                            <p style={{ margin: '5px 0 0' }}>
                              <strong>Type:</strong> {req.procurement_type === 'Fund' ? 'Will Fund' : 'Will Buy & Deliver'}
                            </p>
                            <p style={{ margin: '5px 0 0' }}>
                              <strong>Amount:</strong> ₹{req.contribution_amount || 0}
                              {req.contribution_quantity > 0 && ` (${req.contribution_quantity} units)`}
                            </p>
                          </>
                        )}
                        <p style={{ margin: '5px 0 0' }}>
                          <strong>Potential Karma:</strong> +{req.karma_earned}
                        </p>
                      </div>

                      {/* Actions (only for pending) */}
                      {req.request_status === 'PENDING' && (
                        <div style={styles.requestActions}>
                          <button
                            style={{ flex: 1, padding: '10px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => handleAccept(reqId)}
                          >
                            <i className="fas fa-check"></i> Accept
                          </button>
                          <button
                            style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => handleReject(reqId)}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </div>
                      )}

                      {/* Rejection reason */}
                      {req.request_status === 'REJECTED' && req.rejection_reason && (
                        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#dc2626' }}>
                          <i className="fas fa-info-circle"></i> Reason: {req.rejection_reason}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;