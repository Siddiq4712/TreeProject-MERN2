import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const TreeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  const fetchTree = useCallback(async () => {
    try {
      const res = await api.get(`/trees/${id}`);
      setTree(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleTask = async (taskType) => {
    setTaskLoading(true);
    try {
      await api.post(`/trees/${id}/task`, { task_type: taskType });
      alert(`✅ ${taskType} completed!`);
      fetchTree();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setTaskLoading(false);
    }
  };

  const styles = {
    body: {
      fontFamily: "'Segoe UI', sans-serif",
      backgroundColor: '#f4f7f6',
      minHeight: '100vh',
      padding: '30px',
    },
    container: {
      maxWidth: '800px',
      margin: 'auto',
    },
    backBtn: {
      backgroundColor: 'transparent',
      color: '#2d6a4f',
      border: '2px solid #2d6a4f',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginBottom: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    },
    banner: {
      height: '150px',
      background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '80px',
    },
    body2: {
      padding: '30px',
    },
    badge: {
      display: 'inline-block',
      padding: '6px 15px',
      borderRadius: '15px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: 'white',
      marginRight: '10px',
    },
    infoGrid: {
      display: 'grid',
      gap: '20px',
      marginTop: '25px',
    },
    infoCard: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '10px',
    },
    taskSection: {
      marginTop: '30px',
      borderTop: '2px solid #d8f3dc',
      paddingTop: '25px',
    },
    taskBtns: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '15px',
    },
    taskBtn: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    taskHistory: {
      marginTop: '25px',
    },
    taskItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px',
      background: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '10px',
    },
    timelineCard: {
      padding: '14px',
      background: '#f0fdf4',
      border: '1px solid #d8f3dc',
      borderRadius: '12px',
      marginBottom: '12px',
    },
  };

  if (loading) {
    return (
      <div style={styles.body}>
        <p style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div style={styles.body}>
        <p style={{ textAlign: 'center' }}>Tree not found</p>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/my-trees')}>
          <i className="fas fa-arrow-left"></i> Back to My Trees
        </button>

        <div style={styles.card}>
          <div style={styles.banner}>🌳</div>

          <div style={styles.body2}>
            <div style={{ marginBottom: '15px' }}>
              <span style={{ ...styles.badge, background: '#2d6a4f' }}>
                {tree.status}
              </span>
              <span
                style={{
                  ...styles.badge,
                  background:
                    tree.survival_status === 'Healthy'
                      ? '#2a9d8f'
                      : '#e63946',
                }}
              >
                {tree.survival_status}
              </span>
            </div>

            <p style={{ color: '#888', fontSize: '14px' }}>
              ID: {tree.tree_id}
            </p>
            <h1 style={{ color: '#1b4332', margin: '5px 0 0' }}>
              {tree.species}
            </h1>

            <div className="tree-info-grid" style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Growth Status
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.growth_status}
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Height
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.height_cm} cm
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Sponsor
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.sponsor?.name || 'None'}
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Planted By
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.planter?.name || 'Not yet'}
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Last Watered
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.last_watered
                    ? new Date(tree.last_watered).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                  Last Fertilized
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0 0' }}>
                  {tree.last_fertilized
                    ? new Date(tree.last_fertilized).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>

            {/* Task Actions - 5 Step Pipeline */}
            <div style={styles.taskSection}>
              <h3 style={{ color: '#1b4332' }}>
                Perform Task (5-Step Pipeline)
              </h3>
              <div style={styles.taskBtns}>
                <button
                  style={{ ...styles.taskBtn, background: '#ff9f1c', color: 'white' }}
                  onClick={() => handleTask('Digging')}
                  disabled={taskLoading}
                >
                  <i className="fas fa-shovel"></i> Digging
                </button>
                <button
                  style={{ ...styles.taskBtn, background: '#2a9d8f', color: 'white' }}
                  onClick={() => handleTask('Planting')}
                  disabled={taskLoading}
                >
                  <i className="fas fa-seedling"></i> Planting
                </button>
                <button
                  style={{ ...styles.taskBtn, background: '#3b82f6', color: 'white' }}
                  onClick={() => handleTask('Watering')}
                  disabled={taskLoading}
                >
                  <i className="fas fa-tint"></i> Watering
                </button>
                <button
                  style={{ ...styles.taskBtn, background: '#8b5cf6', color: 'white' }}
                  onClick={() => handleTask('Fertilizing')}
                  disabled={taskLoading}
                >
                  <i className="fas fa-flask"></i> Fertilizer
                </button>
                <button
                  style={{ ...styles.taskBtn, background: '#10b981', color: 'white' }}
                  onClick={() => handleTask('TreeGuard')}
                  disabled={taskLoading}
                >
                  <i className="fas fa-shield-alt"></i> Tree Guard
                </button>
              </div>
            </div>

            {/* Task History */}
            {tree.tasks && tree.tasks.length > 0 && (
              <div style={styles.taskHistory}>
                <h3 style={{ color: '#1b4332' }}>Task History</h3>
                {tree.tasks.map((task, index) => (
                  <div key={getId(task) || index} style={styles.taskItem}>
                    <div>
                      <strong>{task.task_type}</strong>
                      <p
                        style={{
                          color: '#888',
                          fontSize: '12px',
                          margin: '5px 0 0',
                        }}
                      >
                        by {task.volunteer?.name || 'Unknown'}
                      </p>
                    </div>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {new Date(task.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tree.tracking && tree.tracking.length > 0 && (
              <div style={styles.taskHistory}>
                <h3 style={{ color: '#1b4332' }}>Plant Tracking Timeline</h3>
                {tree.tracking.map((entry, index) => (
                  <div key={getId(entry) || index} style={styles.timelineCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <strong style={{ color: '#1b4332' }}>{entry.title}</strong>
                      <span style={{ color: '#52796f', fontSize: '12px' }}>
                        {new Date(entry.tracked_at || entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.notes && <p style={{ margin: '8px 0 0', color: '#52796f', fontSize: '14px' }}>{entry.notes}</p>}
                    <p style={{ margin: '8px 0 0', color: '#2d6a4f', fontSize: '12px', fontWeight: 'bold' }}>
                      {entry.actor?.organization_name || entry.actor?.name || 'System update'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeDetails;
