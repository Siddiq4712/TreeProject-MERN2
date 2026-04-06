import { useState } from 'react';
import api from '../services/api';

const JoinEventModal = ({ event, onClose, onSuccess }) => {
  const [contributionType, setContributionType] = useState('Labor');
  const [selectedHardTasks, setSelectedHardTasks] = useState([]);
  const [selectedSoftTasks, setSelectedSoftTasks] = useState([]);
  const [selectedTreeIds, setSelectedTreeIds] = useState([]);
  const [resourceType, setResourceType] = useState('Saplings');
  const [procurementType, setProcurementType] = useState('Fund');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionQuantity, setContributionQuantity] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  // Hard Tasks (Blocking - required for event progress)
  const hardTasks = [
    { id: 'Digging', label: 'Digging Holes', icon: 'fa-shovel', karma: 15, phase: 'DIGGING' },
    { id: 'Planting', label: 'Planting Saplings', icon: 'fa-seedling', karma: 20, phase: 'PLANTING' },
    { id: 'Watering', label: 'Watering Trees', icon: 'fa-tint', karma: 10, phase: 'WATERING' },
    { id: 'Fertilizing', label: 'Adding Fertilizer', icon: 'fa-flask', karma: 10, phase: 'FERTILIZING' },
    { id: 'GuardFixing', label: 'Fixing Tree Guards', icon: 'fa-shield-alt', karma: 15, phase: 'GUARDING' },
  ];

  // Soft Tasks (Non-blocking - karma only)
  const softTasks = [
    { id: 'SocialMedia', label: 'Social Media Promotion', icon: 'fa-share-alt', karma: 10 },
    { id: 'Awareness', label: 'Awareness / Outreach', icon: 'fa-bullhorn', karma: 10 },
    { id: 'Photography', label: 'Event Photography', icon: 'fa-camera', karma: 5 },
    { id: 'Coordination', label: 'Volunteer Coordination', icon: 'fa-users', karma: 15 },
  ];

  // Resources for sponsors
  const resources = event?.resources || [];

  const getResourceProgress = (resourceType) => {
    const resource = resources.find((r) => r.resource_type === resourceType);
    if (!resource) return { percent: 0, fulfilled: 0, required: 0 };
    const percent = resource.required_amount > 0
      ? Math.round((resource.fulfilled_amount / resource.required_amount) * 100)
      : Math.round((resource.fulfilled_quantity / resource.required_quantity) * 100);
    return {
      percent: Math.min(100, percent),
      fulfilled: resource.fulfilled_amount || resource.fulfilled_quantity,
      required: resource.required_amount || resource.required_quantity,
      status: resource.status,
    };
  };

  const handleHardTaskToggle = (taskId) => {
    if (selectedHardTasks.includes(taskId)) {
      setSelectedHardTasks(selectedHardTasks.filter((t) => t !== taskId));
    } else {
      setSelectedHardTasks([...selectedHardTasks, taskId]);
    }
  };

  const handleSoftTaskToggle = (taskId) => {
    if (selectedSoftTasks.includes(taskId)) {
      setSelectedSoftTasks(selectedSoftTasks.filter((t) => t !== taskId));
    } else {
      setSelectedSoftTasks([...selectedSoftTasks, taskId]);
    }
  };

  const handleTreeToggle = (treeId) => {
    if (selectedTreeIds.includes(treeId)) {
      setSelectedTreeIds(selectedTreeIds.filter((t) => t !== treeId));
    } else {
      setSelectedTreeIds([...selectedTreeIds, treeId]);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    // Validation
    if (contributionType === 'Labor' && selectedHardTasks.length === 0 && selectedSoftTasks.length === 0) {
      setError('Please select at least one task');
      setLoading(false);
      return;
    }

    if (contributionType === 'Capital') {
      if (procurementType === 'Fund' && (!contributionAmount || contributionAmount <= 0)) {
        setError('Please enter a valid funding amount');
        setLoading(false);
        return;
      }
      if (procurementType === 'Procure' && (!contributionQuantity || contributionQuantity <= 0)) {
        setError('Please enter the quantity you will provide');
        setLoading(false);
        return;
      }
    }

    try {
      // Use getId() for the event ID
      const eventId = getId(event);
      const res = await api.post(`/events/${eventId}/join`, {
        contribution_type: contributionType,
        tree_ids: selectedTreeIds,
        hard_tasks: contributionType === 'Labor' ? selectedHardTasks : [],
        soft_tasks: contributionType === 'Labor' ? selectedSoftTasks : [],
        resource_type: contributionType === 'Capital' ? resourceType : null,
        procurement_type: contributionType === 'Capital' ? procurementType : null,
        contribution_amount: procurementType === 'Fund' ? parseFloat(contributionAmount) : 0,
        contribution_quantity: procurementType === 'Procure' ? parseInt(contributionQuantity) : 0,
        social_media_link: socialLink || null,
      });

      // Change the alert message based on response
      alert(
        res.data.request_status === 'ACCEPTED'
          ? `✅ Auto-accepted!\n\n🌿 You earned ${res.data.karma_earned} Karma points!`
          : `📨 Request Sent!\n\nWaiting for organizer approval.\nPotential Karma: +${res.data.karma_earned}`
      );

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  const calculateKarma = () => {
    let karma = 0;
    if (contributionType === 'Labor') {
      selectedHardTasks.forEach((taskId) => {
        const task = hardTasks.find((t) => t.id === taskId);
        if (task) karma += task.karma;
      });
      selectedSoftTasks.forEach((taskId) => {
        const task = softTasks.find((t) => t.id === taskId);
        if (task) karma += task.karma;
      });
    } else {
      karma += Math.floor((parseFloat(contributionAmount) || 0) / 100) * 5;
      if (procurementType === 'Procure') karma += 20;
    }
    if (socialLink) karma += 10;
    return karma;
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: "'Segoe UI', sans-serif",
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      overflow: 'auto',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    },
    header: {
      background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
      color: 'white',
      padding: '25px',
      borderRadius: '20px 20px 0 0',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: 'white',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '16px',
    },
    body: {
      padding: '25px',
    },
    toggleContainer: {
      background: '#f0f0f0',
      borderRadius: '15px',
      padding: '6px',
      marginBottom: '25px',
    },
    toggleBtn: {
      flex: 1,
      padding: '15px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: '0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    activeToggle: {
      background: '#2d6a4f',
      color: 'white',
      boxShadow: '0 4px 10px rgba(45,106,79,0.3)',
    },
    inactiveToggle: {
      background: 'transparent',
      color: '#666',
    },
    section: {
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#1b4332',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sectionSubtitle: {
      fontSize: '12px',
      color: '#888',
      marginTop: '-8px',
      marginBottom: '12px',
    },
    taskGrid: {
      display: 'grid',
      gap: '10px',
    },
    taskCard: {
      padding: '14px',
      borderRadius: '12px',
      border: '2px solid #e0e0e0',
      cursor: 'pointer',
      transition: '0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    taskCardActive: {
      border: '2px solid #2d6a4f',
      background: '#e8f5e9',
    },
    taskIcon: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      color: '#2d6a4f',
    },
    karmaTag: {
      background: '#fff8e6',
      color: '#b8860b',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    resourceCard: {
      padding: '15px',
      borderRadius: '12px',
      border: '2px solid #e0e0e0',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: '0.2s',
    },
    resourceCardActive: {
      border: '2px solid #ff9f1c',
      background: '#fff8e6',
    },
    progressBar: {
      height: '8px',
      background: '#e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '10px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: '0.3s',
    },
    procurementToggle: {
      gap: '10px',
      marginTop: '15px',
    },
    procurementBtn: {
      flex: 1,
      padding: '12px',
      borderRadius: '10px',
      border: '2px solid #e0e0e0',
      background: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '13px',
      transition: '0.2s',
    },
    procurementBtnActive: {
      border: '2px solid #2d6a4f',
      background: '#e8f5e9',
      color: '#2d6a4f',
    },
    input: {
      width: '100%',
      padding: '14px',
      border: '2px solid #e0e0e0',
      borderRadius: '12px',
      fontSize: '15px',
      marginTop: '10px',
      boxSizing: 'border-box',
    },
    socialSection: {
      background: '#f8f9fa',
      padding: '18px',
      borderRadius: '12px',
      marginBottom: '20px',
    },
    karmaPreview: {
      background: 'linear-gradient(135deg, #fff8e6, #fef3c7)',
      padding: '15px 20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #fcd34d',
    },
    btnRow: {
      gap: '12px',
    },
    btnCancel: {
      flex: 1,
      padding: '15px',
      border: '2px solid #ccc',
      background: 'white',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px',
    },
    btnSubmit: {
      flex: 2,
      padding: '15px',
      border: 'none',
      background: '#2d6a4f',
      color: 'white',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px',
    },
    error: {
      background: '#fee',
      color: '#c00',
      padding: '12px',
      borderRadius: '10px',
      marginBottom: '15px',
      textAlign: 'center',
    },
    treeSection: {
      marginTop: '15px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '12px',
    },
    treeChip: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      margin: '4px',
      cursor: 'pointer',
      border: '1px solid #ddd',
      background: 'white',
    },
    treeChipActive: {
      background: '#2d6a4f',
      color: 'white',
      border: '1px solid #2d6a4f',
    },
  };

  const eventTrees = event?.trees || [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="join-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
          <h2 style={{ margin: 0, fontSize: '22px' }}>🌿 Join Event</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
            {event?.location} • {event?.tree_count} Trees • {event?.initiation_type}
          </p>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          {/* Step 1: Contribution Type */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>Step 1:</span> How will you contribute?
            </div>
            <div className="join-toggle" style={styles.toggleContainer}>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(contributionType === 'Labor' ? styles.activeToggle : styles.inactiveToggle),
                }}
                onClick={() => setContributionType('Labor')}
              >
                <i className="fas fa-hands-helping"></i> I'll Volunteer (Labor)
              </button>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(contributionType === 'Capital' ? styles.activeToggle : styles.inactiveToggle),
                }}
                onClick={() => setContributionType('Capital')}
              >
                <i className="fas fa-hand-holding-usd"></i> I'll Sponsor (Fund/Buy)
              </button>
            </div>
          </div>

          {/* Step 2A: Labor Tasks */}
          {contributionType === 'Labor' && (
            <>
              {/* Hard Tasks */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <i className="fas fa-tasks"></i> Hard Tasks (Blocking)
                </div>
                <p style={styles.sectionSubtitle}>
                  These tasks directly contribute to event progress
                </p>
                <div className="join-task-grid" style={styles.taskGrid}>
                  {hardTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        ...styles.taskCard,
                        ...(selectedHardTasks.includes(task.id) ? styles.taskCardActive : {}),
                      }}
                      onClick={() => handleHardTaskToggle(task.id)}
                    >
                      <div style={{
                        ...styles.taskIcon,
                        background: selectedHardTasks.includes(task.id) ? '#2d6a4f' : '#f0f0f0',
                        color: selectedHardTasks.includes(task.id) ? 'white' : '#2d6a4f',
                      }}>
                        <i className={`fas ${task.icon}`}></i>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{task.label}</p>
                        <span style={styles.karmaTag}>+{task.karma} Karma</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soft Tasks */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <i className="fas fa-star"></i> Soft Tasks (Non-Blocking)
                </div>
                <p style={styles.sectionSubtitle}>
                  These earn Karma but don't block event progress
                </p>
                <div className="join-task-grid" style={styles.taskGrid}>
                  {softTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        ...styles.taskCard,
                        ...(selectedSoftTasks.includes(task.id) ? styles.taskCardActive : {}),
                      }}
                      onClick={() => handleSoftTaskToggle(task.id)}
                    >
                      <div style={{
                        ...styles.taskIcon,
                        background: selectedSoftTasks.includes(task.id) ? '#3b82f6' : '#f0f0f0',
                        color: selectedSoftTasks.includes(task.id) ? 'white' : '#3b82f6',
                      }}>
                        <i className={`fas ${task.icon}`}></i>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{task.label}</p>
                        <span style={{ ...styles.karmaTag, background: '#e0f2fe', color: '#0369a1' }}>
                          +{task.karma} Karma
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tree Selection for Volunteers */}
              {eventTrees.length > 0 && (
                <div style={styles.treeSection}>
                  <div style={styles.sectionTitle}>
                    <i className="fas fa-tree"></i> Select Trees to Work On (Optional)
                  </div>
                  <div>
                    {eventTrees.slice(0, 10).map((tree) => {
                      const treeId = getId(tree);
                      return (
                        <span
                          key={treeId}
                          style={{
                            ...styles.treeChip,
                            ...(selectedTreeIds.includes(treeId) ? styles.treeChipActive : {}),
                          }}
                          onClick={() => handleTreeToggle(treeId)}
                        >
                          {tree.tree_id} ({tree.species})
                        </span>
                      );
                    })}
                    {eventTrees.length > 10 && (
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        +{eventTrees.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2B: Sponsor Resources */}
          {contributionType === 'Capital' && (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <i className="fas fa-bullseye"></i> Select Resource to Fund
                </div>
                {['Land', 'Saplings', 'Fertilizer', 'TreeGuards'].map((type) => {
                  const progress = getResourceProgress(type);
                  return (
                    <div
                      key={type}
                      style={{
                        ...styles.resourceCard,
                        ...(resourceType === type ? styles.resourceCardActive : {}),
                      }}
                      onClick={() => setResourceType(type)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            ...styles.taskIcon,
                            background: resourceType === type ? '#fff3cd' : '#f0f0f0',
                          }}>
                            <i className={`fas ${
                              type === 'Land' ? 'fa-map' :
                              type === 'Saplings' ? 'fa-tree' :
                              type === 'Fertilizer' ? 'fa-flask' : 'fa-shield-alt'
                            }`} style={{ color: '#ff9f1c' }}></i>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{type}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                              ₹{progress.fulfilled} / ₹{progress.required}
                            </p>
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: progress.status === 'Complete' ? '#d8f3dc' : progress.status === 'Partial' ? '#fff3cd' : '#f8d7da',
                          color: progress.status === 'Complete' ? '#2d6a4f' : progress.status === 'Partial' ? '#856404' : '#721c24',
                        }}>
                          {progress.percent}% • {progress.status}
                        </span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${progress.percent}%`,
                          background: progress.percent >= 100 ? '#2d6a4f' : '#ff9f1c',
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fund vs Procure Toggle */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <i className="fas fa-exchange-alt"></i> How will you contribute?
                </div>
                <div className="join-procurement-toggle" style={styles.procurementToggle}>
                  <button
                    style={{
                      ...styles.procurementBtn,
                      ...(procurementType === 'Fund' ? styles.procurementBtnActive : {}),
                    }}
                    onClick={() => setProcurementType('Fund')}
                  >
                    <i className="fas fa-rupee-sign"></i> I Will Fund (₹)
                  </button>
                  <button
                    style={{
                      ...styles.procurementBtn,
                      ...(procurementType === 'Procure' ? styles.procurementBtnActive : {}),
                    }}
                    onClick={() => setProcurementType('Procure')}
                  >
                    <i className="fas fa-shopping-cart"></i> I Will Buy & Deliver
                  </button>
                </div>

                {procurementType === 'Fund' && (
                  <input
                    type="number"
                    placeholder="Enter amount (₹)"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    style={styles.input}
                  />
                )}

                {procurementType === 'Procure' && (
                  <input
                    type="number"
                    placeholder={`Enter quantity of ${resourceType} you'll provide`}
                    value={contributionQuantity}
                    onChange={(e) => setContributionQuantity(e.target.value)}
                    style={styles.input}
                  />
                )}

                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {procurementType === 'Fund'
                    ? '💰 Your money goes to the event pool for purchasing resources.'
                    : '📦 You commit to buying and delivering the items yourself. +20 bonus Karma!'}
                </p>
              </div>
            </>
          )}

          {/* Social Media Section */}
          <div style={styles.socialSection}>
            <div style={styles.sectionTitle}>
              <i className="fas fa-share-alt"></i> Share on Social Media
              <span style={styles.karmaTag}>+10 Karma</span>
            </div>
            <input
              type="url"
              placeholder="Paste your social media post link (optional)..."
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              style={{ ...styles.input, marginTop: 0 }}
            />
            <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0' }}>
              Share about this event on Facebook, Instagram, or Twitter
            </p>
          </div>

          {/* Karma Preview */}
          <div className="join-karma-preview" style={styles.karmaPreview}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>Estimated Karma Reward</p>
              <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#b45309' }}>
                Based on your selections
              </p>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>
              +{calculateKarma()} 🌿
            </div>
          </div>

          {/* Buttons */}
          <div className="join-footer-actions" style={styles.btnRow}>
            <button style={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              style={{
                ...styles.btnSubmit,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Join Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinEventModal;
