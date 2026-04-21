import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { confirmAction, showError, showSuccess } from '../services/dialogs';

const LandDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  const fetchLandDetail = useCallback(async () => {
    try {
      const res = await api.get(`/lands/${id}/detail`);
      setLand(res.data);
    } catch (err) {
      console.error(err);
      await showError('Land not found', 'This land record is no longer available.');
      navigate('/my-land');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchLandDetail();
  }, [fetchLandDetail]);

  const handleDelete = async () => {
    const result = await confirmAction('Delete this land?', 'This action cannot be undone.', 'Delete land');
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/lands/${id}`);
      await showSuccess('Land deleted');
      navigate('/my-land');
    } catch (err) {
      showError('Failed to delete', err.response?.data?.message || 'Land could not be deleted.');
    }
  };

  const formatDate = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-IN', {
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

  const getStatusColor = (status) => {
    const colors = {
      Available: { bg: '#d8f3dc', color: '#2d6a4f' },
      Reserved: { bg: '#fff8e6', color: '#856404' },
      Active: { bg: '#cce5ff', color: '#004085' },
      Completed: { bg: '#e2e3e5', color: '#383d41' },
    };
    return colors[status] || colors.Available;
  };

  const getActivityIcon = (type) => {
    const icons = {
      LandAdded: 'fa-plus-circle',
      EventCreated: 'fa-calendar-plus',
      DiggingStarted: 'fa-shovel',
      DiggingCompleted: 'fa-check',
      PlantingStarted: 'fa-seedling',
      PlantingCompleted: 'fa-tree',
      WateringDone: 'fa-tint',
      FertilizerApplied: 'fa-flask',
      GuardsInstalled: 'fa-shield-alt',
      PhotoAdded: 'fa-camera',
      StatusUpdated: 'fa-edit',
      TreeDied: 'fa-times-circle',
      Maintenance: 'fa-tools',
    };
    return icons[type] || 'fa-circle';
  };

  const styles = {
    body: {
      backgroundColor: '#f4f7f6',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', sans-serif",
    },
    mainContent: {
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
      height: '220px',
      background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 50%, #14532d 100%)',
      borderRadius: '20px',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '25px',
    },
    bannerOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
    },
    bannerContent: {
      position: 'relative',
      zIndex: 1,
      color: 'white',
      width: '100%',
    },
    statusBadge: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: '8px 18px',
      borderRadius: '25px',
      fontWeight: 'bold',
      fontSize: '13px',
    },
    tabs: {
      gap: '8px',
      marginBottom: '25px',
      background: 'white',
      padding: '8px',
      borderRadius: '15px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    tab: {
      padding: '12px 24px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: '0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    activeTab: {
      background: '#2d6a4f',
      color: 'white',
    },
    inactiveTab: {
      background: 'transparent',
      color: '#666',
    },
    grid: {
      display: 'grid',
      gap: '25px',
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1b4332',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      paddingBottom: '15px',
      borderBottom: '2px solid #d8f3dc',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '14px',
    },
    infoLabel: {
      color: '#888',
    },
    infoValue: {
      fontWeight: '600',
      color: '#1b4332',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    statCard: {
      padding: '20px',
      background: '#f8f9fa',
      borderRadius: '12px',
      textAlign: 'center',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#2d6a4f',
    },
    statLabel: {
      fontSize: '12px',
      color: '#888',
      marginTop: '5px',
    },
    progressBar: {
      height: '10px',
      background: '#e0e0e0',
      borderRadius: '5px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '5px',
      transition: '0.3s',
    },
    speciesItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 15px',
      background: '#f8f9fa',
      borderRadius: '10px',
      marginBottom: '10px',
    },
    eventCard: {
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: '0.2s',
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
      width: '42px',
      height: '42px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: 'white',
      fontSize: '14px',
    },
    activityItem: {
      display: 'flex',
      gap: '15px',
      padding: '15px 0',
      borderBottom: '1px solid #f0f0f0',
    },
    activityIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#d8f3dc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2d6a4f',
      flexShrink: 0,
    },
    photoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
    },
    photoCard: {
      aspectRatio: '1',
      background: '#e0e0e0',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
    },
    actionBtns: {
      gap: '12px',
      marginTop: '20px',
    },
    actionBtn: {
      flex: 1,
      padding: '14px',
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
    mapPlaceholder: {
      height: '200px',
      background: '#e8f5e9',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2d6a4f',
      fontSize: '14px',
      marginTop: '15px',
    },
    resourceCard: {
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '12px',
      marginBottom: '12px',
    },
    noData: {
      textAlign: 'center',
      padding: '30px',
      color: '#888',
    },
  };

  if (loading) {
    return (
      <div className="app-shell" style={styles.body}>
        <Sidebar />
        <div className="app-main" style={styles.mainContent}>
          <p style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading land details...
          </p>
        </div>
      </div>
    );
  }

  if (!land) return null;

  const statusColors = getStatusColor(land.status);

  return (
    <div className="app-shell" style={styles.body}>
      <Sidebar />

      <div className="app-main" style={styles.mainContent}>
        {/* Back Button */}
        <button style={styles.backBtn} onClick={() => navigate('/my-land')}>
          <i className="fas fa-arrow-left"></i> Back to My Land
        </button>

        {/* Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerOverlay}></div>
          <span
            style={{
              ...styles.statusBadge,
              background: statusColors.bg,
              color: statusColors.color,
            }}
          >
            {land.status}
          </span>
          <div style={styles.bannerContent}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
              <i className="fas fa-map-marker-alt"></i> {land.address}
            </p>
            <h1 style={{ margin: '8px 0', fontSize: '32px' }}>{land.name}</h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
              Owned by {land.owner?.name} • {land.area_sqft ? `${land.area_sqft} sq.ft` : 'Area not specified'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs" style={styles.tabs}>
          {[
            { key: 'overview', label: 'Overview', icon: 'fa-info-circle' },
            { key: 'trees', label: 'Trees', icon: 'fa-tree' },
            { key: 'events', label: 'Events', icon: 'fa-calendar' },
            { key: 'people', label: 'People', icon: 'fa-users' },
            { key: 'activity', label: 'Activity', icon: 'fa-history' },
            { key: 'photos', label: 'Photos', icon: 'fa-images' },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.activeTab : styles.inactiveTab),
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`fas ${tab.icon}`}></i> {tab.label}
            </button>
          ))}
        </div>

        <div className="detail-grid" style={styles.grid}>
          {/* Left Column */}
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Land Info */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-info-circle"></i> Land Information
                  </h3>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Land Type</span>
                    <span style={styles.infoValue}>{land.land_type}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Soil Type</span>
                    <span style={styles.infoValue}>{land.soil_type || 'Not specified'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Water Availability</span>
                    <span style={styles.infoValue}>
                      {land.water_availability ? (
                        <span style={{ color: '#2d6a4f' }}>✅ Available</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>❌ Not Available</span>
                      )}
                    </span>
                  </div>
                  {land.water_source && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Water Source</span>
                      <span style={styles.infoValue}>{land.water_source}</span>
                    </div>
                  )}
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>GPS Coordinates</span>
                    <span style={styles.infoValue}>
                      {land.latitude && land.longitude
                        ? `${land.latitude}, ${land.longitude}`
                        : 'Not set'}
                    </span>
                  </div>

                  {land.description && (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: 1.6 }}>
                        {land.description}
                      </p>
                    </div>
                  )}

                  {/* Map Placeholder */}
                  <div style={styles.mapPlaceholder}>
                    <i className="fas fa-map" style={{ marginRight: '8px' }}></i>
                    Map View (Coming Soon)
                  </div>
                </div>

                {/* Resource Status */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-boxes"></i> Resource Status
                  </h3>

                  {(land.resource_summary || []).length === 0 ? (
                    <p style={styles.noData}>No resources tracked yet</p>
                  ) : (
                    (land.resource_summary || []).map((r, index) => (
                      <div key={r.type || index} style={styles.resourceCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i
                              className={`fas ${
                                r.type === 'Saplings' ? 'fa-seedling' : r.type === 'Fertilizer' ? 'fa-flask' : 'fa-shield-alt'
                              }`}
                              style={{ color: '#2d6a4f' }}
                            ></i>
                            <strong>{r.type}</strong>
                          </div>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {r.fulfilled} / {r.required}
                          </span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${r.percent}%`,
                              background: r.percent >= 100 ? '#2d6a4f' : '#ff9f1c',
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Trees Tab */}
            {activeTab === 'trees' && (
              <>
                {/* Tree Stats */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-tree"></i> Tree Statistics
                  </h3>

                  <div style={styles.statGrid}>
                    <div style={styles.statCard}>
                      <div style={styles.statValue}>{land.tree_stats?.total || 0}</div>
                      <div style={styles.statLabel}>Total Trees</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statValue, color: '#22c55e' }}>{land.tree_stats?.alive || 0}</div>
                      <div style={styles.statLabel}>Trees Alive</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statValue, color: '#dc2626' }}>{land.tree_stats?.dead || 0}</div>
                      <div style={styles.statLabel}>Trees Dead</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statValue, color: '#2d6a4f' }}>{land.tree_stats?.survival_rate || 0}%</div>
                      <div style={styles.statLabel}>Survival Rate</div>
                    </div>
                  </div>
                </div>

                {/* Species Distribution */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-leaf"></i> Species Distribution
                  </h3>

                  {(land.species_distribution || []).length === 0 ? (
                    <p style={styles.noData}>No trees planted yet</p>
                  ) : (
                    (land.species_distribution || []).map((species, index) => (
                      <div key={species.species || index} style={styles.speciesItem}>
                        <div>
                          <strong>{species.species}</strong>
                          <span style={{ marginLeft: '10px', color: '#888', fontSize: '13px' }}>
                            ({species.percentage}%)
                          </span>
                        </div>
                        <div
                          style={{
                            background: '#2d6a4f',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          {species.count}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <i className="fas fa-calendar-alt"></i> Events on This Land
                </h3>

                {(land.events || []).length === 0 ? (
                  <p style={styles.noData}>No events conducted yet</p>
                ) : (
                  (land.events || []).map((event, index) => (
                    <div
                      key={getId(event) || index}
                      style={styles.eventCard}
                      onClick={() => navigate(`/event/${getId(event)}`)}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = '#2d6a4f')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#1b4332' }}>{event.location}</h4>
                          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#888' }}>
                            ID: {event.event_id}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: event.current_phase === 'COMPLETED' ? '#d8f3dc' : '#fff8e6',
                            color: event.current_phase === 'COMPLETED' ? '#2d6a4f' : '#856404',
                          }}
                        >
                          {event.current_phase?.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                        <span><i className="fas fa-tree"></i> {event.tree_count} Trees</span>
                        <span><i className="fas fa-user"></i> {event.creator?.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <>
                {/* Volunteers */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-hands-helping"></i> Volunteers ({(land.volunteers || []).length})
                  </h3>

                  {(land.volunteers || []).length === 0 ? (
                    <p style={styles.noData}>No volunteers yet</p>
                  ) : (
                    (land.volunteers || []).map((v, index) => (
                      <div key={getId(v) || index} style={styles.personCard}>
                        <div style={{ ...styles.avatar, background: '#2d6a4f' }}>{getInitials(v.name)}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{v.name}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>
                            Tasks: {(v.tasks || []).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Sponsors */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <i className="fas fa-hand-holding-usd"></i> Sponsors ({(land.sponsors || []).length})
                  </h3>

                  {(land.sponsors || []).length === 0 ? (
                    <p style={styles.noData}>No sponsors yet</p>
                  ) : (
                    (land.sponsors || []).map((s, index) => (
                      <div key={getId(s) || index} style={styles.personCard}>
                        <div style={{ ...styles.avatar, background: '#ff9f1c' }}>{getInitials(s.name)}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{s.name}</p>
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>
                            Sponsored {s.trees_sponsored} trees ({(s.species || []).join(', ')})
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <i className="fas fa-history"></i> Activity Timeline
                </h3>

                {(land.activities || []).length === 0 ? (
                  <p style={styles.noData}>No activities recorded</p>
                ) : (
                  (land.activities || []).map((activity, index) => (
                    <div key={getId(activity) || index} style={styles.activityItem}>
                      <div style={styles.activityIcon}>
                        <i className={`fas ${getActivityIcon(activity.activity_type)}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1b4332' }}>
                          {activity.description}
                        </p>
                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#888' }}>
                          by {activity.user?.name} • {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <i className="fas fa-images"></i> Photo Gallery
                </h3>

                {(land.photos || []).length === 0 ? (
                  <div style={styles.noData}>
                    <i className="fas fa-camera" style={{ fontSize: '40px', marginBottom: '15px', display: 'block', color: '#ccc' }}></i>
                    <p>No photos added yet</p>
                    {land.is_owner && (
                      <button
                        style={{
                          marginTop: '15px',
                          padding: '10px 20px',
                          background: '#2d6a4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        <i className="fas fa-plus"></i> Add Photo
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={styles.photoGrid}>
                    {(land.photos || []).map((photo, idx) => (
                      <div key={idx} style={styles.photoCard}>
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Land photo'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        {photo.caption && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              padding: '8px',
                              fontSize: '12px',
                            }}
                          >
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Info */}
          <div>
            {/* Quick Stats */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <i className="fas fa-chart-pie"></i> Quick Stats
              </h3>

              <div style={styles.statGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{land.total_events_hosted || (land.events || []).length}</div>
                  <div style={styles.statLabel}>Events Hosted</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{land.total_trees_planted || (land.trees || []).length}</div>
                  <div style={styles.statLabel}>Trees Planted</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, marginTop: '10px' }}>
                <div style={{ ...styles.statValue, fontSize: '18px', color: '#2d6a4f' }}>
                  {land.tree_stats?.survival_rate || 0}%
                </div>
                <div style={styles.statLabel}>Survival Rate</div>
                <div style={{ ...styles.progressBar, marginTop: '10px' }}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${land.tree_stats?.survival_rate || 0}%`,
                      background: '#2d6a4f',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Current Event */}
            {land.current_event && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <i className="fas fa-bolt"></i> Active Event
                </h3>

                <div
                  style={{ ...styles.eventCard, border: '2px solid #2d6a4f', cursor: 'pointer' }}
                  onClick={() => navigate(`/event/${getId(land.current_event)}`)}
                >
                  <h4 style={{ margin: 0, color: '#2d6a4f' }}>{land.current_event.location}</h4>
                  <p style={{ margin: '8px 0', fontSize: '13px', color: '#888' }}>
                    Phase: {land.current_event.current_phase?.replace('_', ' ')}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                    🌳 {land.current_event.tree_count} Trees
                  </p>
                </div>
              </div>
            )}

            {/* Availability */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <i className="fas fa-calendar-check"></i> Availability
              </h3>

              <div
                style={{
                  padding: '20px',
                  background: land.status === 'Available' ? '#d8f3dc' : '#fff8e6',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <i
                  className={`fas ${land.status === 'Available' ? 'fa-check-circle' : 'fa-clock'}`}
                  style={{
                    fontSize: '30px',
                    color: land.status === 'Available' ? '#2d6a4f' : '#856404',
                    marginBottom: '10px',
                  }}
                ></i>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'bold',
                    color: land.status === 'Available' ? '#2d6a4f' : '#856404',
                  }}
                >
                  {land.status === 'Available' ? 'Available for Events' : `Currently ${land.status}`}
                </p>
              </div>
            </div>

            {/* Owner Controls */}
            {land.is_owner && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <i className="fas fa-cog"></i> Land Controls
                </h3>

                <div style={styles.actionBtns}>
                  <button
                    style={{ ...styles.actionBtn, background: '#3b82f6', color: 'white' }}
                    onClick={() => navigate(`/edit-land/${id}`)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                </div>

                <div style={{ ...styles.actionBtns, marginTop: '10px' }}>
                  <button style={{ ...styles.actionBtn, background: '#f8f9fa', color: '#2d6a4f', border: '1px solid #ddd' }}>
                    <i className="fas fa-camera"></i> Add Photo
                  </button>
                </div>

                <div style={{ ...styles.actionBtns, marginTop: '10px' }}>
                  <button
                    style={{ ...styles.actionBtn, background: '#dc2626', color: 'white' }}
                    onClick={handleDelete}
                  >
                    <i className="fas fa-trash"></i> Delete Land
                  </button>
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                <i className="fas fa-user"></i> Land Owner
              </h3>

              <div style={styles.personCard}>
                <div style={{ ...styles.avatar, background: '#1b4332' }}>{getInitials(land.owner?.name)}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{land.owner?.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{land.owner?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandDetail;
