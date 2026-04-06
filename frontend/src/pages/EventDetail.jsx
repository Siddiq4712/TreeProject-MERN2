import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JoinEventModal from './JoinEventModal';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const res = await api.get(`/events/${id}/detail`);
      setEvent(res.data);
    } catch (err) {
      console.error(err);
      alert('Event not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/events/${id}/requests?status=PENDING`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/events/requests/${requestId}/accept`);
      alert('✅ Request accepted!');
      fetchRequests();
      fetchEventDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.post(`/events/requests/${requestId}/reject`, { reason });
      alert('Request rejected');
      fetchRequests();
      fetchEventDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleAdvancePhase = async () => {
    try {
      const res = await api.post(`/events/${id}/advance`);
      alert(`Event advanced to: ${res.data.event.current_phase}`);
      fetchEventDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot advance');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event? All requests will be cancelled.')) return;
    try {
      await api.delete(`/events/${id}`);
      alert('Event deleted');
      navigate('/my-events');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const formatDate = (str) => {
    if (!str) return 'TBD';
    return new Date(str).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const PHASES = [
    { key: 'WAITING_RESOURCES', label: 'Waiting', icon: 'fa-clock', color: '#888' },
    { key: 'DIGGING', label: 'Digging', icon: 'fa-shovel', color: '#ff9f1c' },
    { key: 'PLANTING', label: 'Planting', icon: 'fa-seedling', color: '#2a9d8f' },
    { key: 'WATERING', label: 'Watering', icon: 'fa-tint', color: '#3b82f6' },
    { key: 'FERTILIZING', label: 'Fertilizer', icon: 'fa-flask', color: '#8b5cf6' },
    { key: 'GUARDING', label: 'Guards', icon: 'fa-shield-alt', color: '#10b981' },
    { key: 'MAINTENANCE', label: 'Maintain', icon: 'fa-tools', color: '#f59e0b' },
    { key: 'COMPLETED', label: 'Complete', icon: 'fa-check-circle', color: '#2d6a4f' },
  ];

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
    backBtn: {
      background: 'transparent',
      border: '2px solid #2d6a4f',
      color: '#2d6a4f',
      padding: '10px 20px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginBottom: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    banner: {
      height: '200px',
      background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '25px',
      position: 'relative',
      overflow: 'hidden',
    },
    bannerContent: {
      textAlign: 'center',
      color: 'white',
      zIndex: 1,
    },
    phaseBadge: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: '8px 16px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '12px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '25px',
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1b4332',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #eee',
      fontSize: '14px',
    },
    progressBar: {
      height: '12px',
      background: '#e0e0e0',
      borderRadius: '6px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '6px',
      transition: '0.3s',
    },
    resourceCard: {
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '12px',
      marginBottom: '12px',
    },
    pipelineContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '20px 0',
      position: 'relative',
    },
    pipelineLine: {
      position: 'absolute',
      top: '40px',
      left: '5%',
      right: '5%',
      height: '4px',
      background: '#e0e0e0',
      zIndex: 0,
    },
    pipelineStep: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 1,
      flex: 1,
    },
    pipelineIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '8px',
      fontSize: '18px',
      border: '3px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    personCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '10px',
      marginBottom: '10px',
    },
    avatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: 'white',
      fontSize: '14px',
    },
    actionBtns: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    actionBtn: {
      flex: 1,
      padding: '15px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    deadlineBanner: {
      padding: '12px 20px',
      borderRadius: '10px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
    },
    statusBadge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
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
      maxWidth: '600px',
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
      borderRadius: '20px 20px 0 0',
    },
    modalBody: {
      padding: '20px',
    },
  };

  if (loading) {
    return (
      <div style={styles.body}>
        <Sidebar />
        <div style={styles.mainContent}>
          <p style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const currentPhaseIndex = PHASES.findIndex((p) => p.key === event.current_phase);
  const laborPercent = event.labor_goal > 0 ? Math.round((event.labor_fulfilled / event.labor_goal) * 100) : 0;
  const fundingPercent = event.funding_goal > 0 ? Math.round((event.funding_fulfilled / event.funding_goal) * 100) : 0;

  return (
    <div style={styles.body}>
      <Sidebar />

      <div style={styles.mainContent}>
        {/* Back Button */}
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>

        {/* Banner */}
        <div style={styles.banner}>
          <div
            style={{
              ...styles.phaseBadge,
              background: PHASES[currentPhaseIndex]?.color || '#888',
              color: 'white',
            }}
          >
            {event.current_phase?.replace('_', ' ')}
          </div>
          <div style={styles.bannerContent}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>ID: {event.event_id}</p>
            <h1 style={{ margin: '10px 0', fontSize: '32px' }}>{event.location}</h1>
            <p style={{ margin: 0, fontSize: '18px' }}>
              🌳 {event.tree_count} {event.tree_species || 'Trees'}
            </p>
          </div>
        </div>

        {/* Join Deadline Banner */}
        {event.join_deadline && (
          <div
            style={{
              ...styles.deadlineBanner,
              background: event.is_join_closed ? '#fee' : '#fff8e6',
              color: event.is_join_closed ? '#c00' : '#856404',
            }}
          >
            <i className={`fas ${event.is_join_closed ? 'fa-lock' : 'fa-clock'}`}></i>
            {event.is_join_closed
              ? 'Join deadline has passed. No more requests accepted.'
              : `Join Deadline: ${formatDate(event.join_deadline)}`}
          </div>
        )}

        {/* Viewer Status Banner */}
        {event.viewer_request_status && !event.is_creator && (
          <div
            style={{
              ...styles.deadlineBanner,
              background:
                event.viewer_request_status === 'ACCEPTED'
                  ? '#d8f3dc'
                  : event.viewer_request_status === 'PENDING'
                  ? '#fff8e6'
                  : '#fee',
              color:
                event.viewer_request_status === 'ACCEPTED'
                  ? '#2d6a4f'
                  : event.viewer_request_status === 'PENDING'
                  ? '#856404'
                  : '#c00',
            }}
          >
            <i
              className={`fas ${
                event.viewer_request_status === 'ACCEPTED'
                  ? 'fa-check-circle'
                  : event.viewer_request_status === 'PENDING'
                  ? 'fa-hourglass-half'
                  : 'fa-times-circle'
              }`}
            ></i>
            {event.viewer_request_status === 'ACCEPTED' && `You've joined as ${event.viewer_contribution_type === 'Capital' ? 'Sponsor' : 'Volunteer'}`}
            {event.viewer_request_status === 'PENDING' && 'Your join request is pending approval'}
            {event.viewer_request_status === 'REJECTED' && 'Your join request was rejected'}
          </div>
        )}

        <div style={styles.grid}>
          {/* Left Column */}
          <div>
            {/* Event Info Card */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-info-circle"></i> Event Details
              </h3>

              <div style={styles.infoRow}>
                <span>Organizer</span>
                <strong>{event.creator?.name}</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Event Date</span>
                <strong>{formatDate(event.date_time)}</strong>
              </div>
              <div style={styles.infoRow}>
                <span>Type</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: event.initiation_type === 'Sponsor-Led' ? '#ff9f1c' : '#2a9d8f',
                    color: 'white',
                  }}
                >
                  {event.initiation_type}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span>Approval Mode</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: event.approval_mode === 'Auto' ? '#d8f3dc' : '#fff8e6',
                    color: event.approval_mode === 'Auto' ? '#2d6a4f' : '#856404',
                  }}
                >
                  {event.approval_mode === 'Auto' ? '✓ Auto-Accept' : '⏳ Manual Review'}
                </span>
              </div>
              {event.land && (
                <div style={styles.infoRow}>
                  <span>Land</span>
                  <strong>{event.land.name}</strong>
                </div>
              )}
              {event.description && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{event.description}</p>
                </div>
              )}
            </div>

            {/* Tree Lifecycle Pipeline */}
            <div style={{ ...styles.card, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-stream"></i> Tree Lifecycle Pipeline
              </h3>

              <div style={styles.pipelineContainer}>
                <div style={styles.pipelineLine}></div>
                {PHASES.map((phase, index) => {
                  const isComplete = index < currentPhaseIndex;
                  const isCurrent = index === currentPhaseIndex;

                  return (
                    <div key={phase.key} style={styles.pipelineStep}>
                      <div
                        style={{
                          ...styles.pipelineIcon,
                          background: isComplete ? '#2d6a4f' : isCurrent ? phase.color : '#e0e0e0',
                          color: isComplete || isCurrent ? 'white' : '#999',
                        }}
                      >
                        <i className={`fas ${phase.icon}`}></i>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: isComplete || isCurrent ? '#2d6a4f' : '#999',
                        }}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resource Status */}
            <div style={{ ...styles.card, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-boxes"></i> Resource Status
              </h3>

              {(event.resource_summary || []).map((resource, index) => (
                <div key={resource.type || index} style={styles.resourceCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i
                        className={`fas ${
                          resource.type === 'Land'
                            ? 'fa-map'
                            : resource.type === 'Saplings'
                            ? 'fa-tree'
                            : resource.type === 'Fertilizer'
                            ? 'fa-flask'
                            : 'fa-shield-alt'
                        }`}
                        style={{ color: resource.status === 'Complete' ? '#2d6a4f' : '#888' }}
                      ></i>
                      <strong>{resource.type}</strong>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                          resource.status === 'Complete' ? '#d8f3dc' : resource.status === 'Partial' ? '#fff8e6' : '#f8d7da',
                        color:
                          resource.status === 'Complete' ? '#2d6a4f' : resource.status === 'Partial' ? '#856404' : '#721c24',
                      }}
                    >
                      {resource.status}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${resource.percent}%`,
                        background: resource.status === 'Complete' ? '#2d6a4f' : '#ff9f1c',
                      }}
                    ></div>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>
                    {resource.fulfilled} / {resource.required} ({resource.percent}%)
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Progress Card */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-chart-pie"></i> Progress
              </h3>

              {/* Labor Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span><i className="fas fa-users"></i> Volunteers</span>
                  <strong>{event.labor_fulfilled} / {event.labor_goal}</strong>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${Math.min(100, laborPercent)}%`, background: '#3b82f6' }}></div>
                </div>
              </div>

              {/* Funding Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span><i className="fas fa-rupee-sign"></i> Funding</span>
                  <strong>₹{event.funding_fulfilled} / ₹{event.funding_goal}</strong>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${Math.min(100, fundingPercent)}%`, background: '#ff9f1c' }}></div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Role Based */}
            <div style={{ ...styles.card, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-hand-pointer"></i> Actions
              </h3>

              {event.is_creator ? (
                <>
                  {/* Creator Actions */}
                  <div style={styles.actionBtns}>
                    <button
                      style={{ ...styles.actionBtn, background: '#2d6a4f', color: 'white' }}
                      onClick={() => {
                        setShowRequestsModal(true);
                        fetchRequests();
                      }}
                    >
                      <i className="fas fa-users-cog"></i> Manage Requests
                      {event.pending_requests_count > 0 && (
                        <span
                          style={{
                            background: '#ff9f1c',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            marginLeft: '5px',
                          }}
                        >
                          {event.pending_requests_count}
                        </span>
                      )}
                    </button>
                  </div>

                  <div style={{ ...styles.actionBtns, marginTop: '10px' }}>
                    <button
                      style={{ ...styles.actionBtn, background: '#3b82f6', color: 'white' }}
                      onClick={handleAdvancePhase}
                      disabled={!event.is_ready_to_start || event.current_phase === 'COMPLETED'}
                    >
                      <i className="fas fa-forward"></i> Advance Phase
                    </button>
                  </div>

                  <div style={{ ...styles.actionBtns, marginTop: '10px' }}>
                    <button
                      style={{ ...styles.actionBtn, background: '#f8f9fa', color: '#1b4332', border: '1px solid #ddd' }}
                      onClick={() => navigate(`/edit-event/${id}`)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, background: '#dc2626', color: 'white' }}
                      onClick={handleDelete}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Non-Creator Actions */}
                  {!event.viewer_request_status && !event.is_join_closed && (
                    <button
                      style={{ ...styles.actionBtn, background: '#2d6a4f', color: 'white', width: '100%' }}
                      onClick={() => setShowJoinModal(true)}
                    >
                      <i className="fas fa-hand-paper"></i> Request to Join
                    </button>
                  )}

                  {event.viewer_request_status === 'PENDING' && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#856404' }}>
                      <i className="fas fa-hourglass-half" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
                      <p style={{ margin: 0 }}>Awaiting organizer approval...</p>
                    </div>
                  )}

                  {event.viewer_request_status === 'ACCEPTED' && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#2d6a4f' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
                      <p style={{ margin: 0 }}>You're part of this event!</p>
                    </div>
                  )}

                  {event.is_join_closed && !event.viewer_request_status && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      <i className="fas fa-lock" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
                      <p style={{ margin: 0 }}>Joining is closed</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Volunteers List */}
            <div style={{ ...styles.card, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-users"></i> Volunteers ({event.accepted_volunteers?.length || 0})
              </h3>

              {(event.accepted_volunteers || []).length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No volunteers yet</p>
              ) : (
                (event.accepted_volunteers || []).slice(0, 5).map((v, index) => (
                  <div key={getId(v) || index} style={styles.personCard}>
                    <div style={{ ...styles.avatar, background: '#2d6a4f' }}>{getInitials(v.user?.name)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{v.user?.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        {(v.hard_tasks || []).join(', ') || 'General Help'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sponsors List */}
            <div style={{ ...styles.card, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-hand-holding-usd"></i> Sponsors ({event.accepted_sponsors?.length || 0})
              </h3>

              {(event.accepted_sponsors || []).length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No sponsors yet</p>
              ) : (
                (event.accepted_sponsors || []).slice(0, 5).map((v, index) => (
                  <div key={getId(v) || index} style={styles.personCard}>
                    <div style={{ ...styles.avatar, background: '#ff9f1c' }}>{getInitials(v.user?.name)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{v.user?.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        ₹{v.contribution_amount} • {v.resource_type || 'General'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <JoinEventModal
          event={event}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            fetchEventDetail();
          }}
        />
      )}

      {/* Requests Management Modal */}
      {showRequestsModal && event.is_creator && (
        <div style={styles.modalOverlay} onClick={() => setShowRequestsModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Pending Requests</h3>
              <button
                onClick={() => setShowRequestsModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {requests.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '30px' }}>No pending requests</p>
              ) : (
                requests.map((req, index) => (
                  <div
                    key={getId(req) || index}
                    style={{
                      padding: '15px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      marginBottom: '15px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            ...styles.avatar,
                            background: req.contribution_type === 'Capital' ? '#ff9f1c' : '#2d6a4f',
                          }}
                        >
                          {getInitials(req.user?.name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{req.user?.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                            {req.contribution_type} • Karma: {req.user?.karma_points || 0}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: req.contribution_type === 'Capital' ? '#fff8e6' : '#e8f5e9',
                          color: req.contribution_type === 'Capital' ? '#ff9f1c' : '#2d6a4f',
                        }}
                      >
                        {req.contribution_type === 'Capital' ? 'Sponsor' : 'Volunteer'}
                      </span>
                    </div>

                    <div style={{ marginTop: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
                      {req.contribution_type === 'Labor' ? (
                        <p style={{ margin: 0 }}>Tasks: {(req.hard_tasks || []).concat(req.soft_tasks || []).join(', ') || 'None'}</p>
                      ) : (
                        <p style={{ margin: 0 }}>Amount: ₹{req.contribution_amount} • {req.resource_type}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        style={{ flex: 1, padding: '10px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => handleAccept(getId(req))}
                      >
                        Accept
                      </button>
                      <button
                        style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => handleReject(getId(req))}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;