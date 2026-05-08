import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { confirmAction, showError, showSuccess } from '../services/dialogs';

const TreeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [healthForm, setHealthForm] = useState({
    growth_status: '',
    survival_status: '',
    height_cm: '',
    photo_url: '',
  });
  const [healthLoading, setHealthLoading] = useState(false);

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

  useEffect(() => {
    if (!tree) return;
    setHealthForm({
      growth_status: tree.growth_status || 'Seedling',
      survival_status: tree.survival_status || 'Healthy',
      height_cm: tree.height_cm ?? 0,
      photo_url: tree.photo_url || '',
    });
  }, [tree]);

  const handleTask = async (taskType) => {
    setTaskLoading(true);
    try {
      await api.post(`/trees/${id}/task`, { task_type: taskType });
      await showSuccess(`${taskType} completed`);
      fetchTree();
    } catch (err) {
      showError('Task failed', err.response?.data?.message || 'Action could not be completed.');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleHealthUpdate = async (e) => {
    e.preventDefault();
    setHealthLoading(true);
    try {
      await api.put(`/trees/${id}/health`, {
        growth_status: healthForm.growth_status,
        survival_status: healthForm.survival_status,
        height_cm: Number(healthForm.height_cm || 0),
        photo_url: healthForm.photo_url || null,
      });
      await showSuccess('Tree health updated');
      fetchTree();
    } catch (err) {
      showError('Update failed', err.response?.data?.message || 'Tree health could not be updated.');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleDeleteTree = async () => {
    const result = await confirmAction(
      'Delete this tree?',
      'This will remove the tree and its tracking history.',
      'Delete tree'
    );
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/trees/${id}`);
      await showSuccess('Tree deleted');
      navigate('/my-trees');
    } catch (err) {
      showError('Delete failed', err.response?.data?.message || 'Tree could not be deleted.');
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
    formGrid: {
      display: 'grid',
      gap: '14px',
      marginTop: '15px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid #d8e2dc',
      fontSize: '14px',
      boxSizing: 'border-box',
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
        <button
          style={{ ...styles.backBtn, marginLeft: '12px' }}
          onClick={() => navigate(`/edit-tree/${id}`)}
        >
          <i className="fas fa-edit"></i> Edit Tree
        </button>
        <button
          style={{ ...styles.backBtn, borderColor: '#be123c', color: '#be123c', marginLeft: '12px' }}
          onClick={handleDeleteTree}
        >
          <i className="fas fa-trash"></i> Delete Tree
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

            <div style={styles.taskSection}>
              <h3 style={{ color: '#1b4332' }}>Health Update With Evidence</h3>
              <form onSubmit={handleHealthUpdate} style={styles.formGrid}>
                <select
                  value={healthForm.growth_status}
                  onChange={(e) => setHealthForm((current) => ({ ...current, growth_status: e.target.value }))}
                  style={styles.input}
                >
                  <option value="Seedling">Seedling</option>
                  <option value="Sapling">Sapling</option>
                  <option value="Young">Young</option>
                  <option value="Mature">Mature</option>
                </select>
                <select
                  value={healthForm.survival_status}
                  onChange={(e) => setHealthForm((current) => ({ ...current, survival_status: e.target.value }))}
                  style={styles.input}
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Weak">Weak</option>
                  <option value="Critical">Critical</option>
                  <option value="Dead">Dead</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={healthForm.height_cm}
                  onChange={(e) => setHealthForm((current) => ({ ...current, height_cm: e.target.value }))}
                  style={styles.input}
                  placeholder="Height in cm"
                />
                <input
                  type="url"
                  value={healthForm.photo_url}
                  onChange={(e) => setHealthForm((current) => ({ ...current, photo_url: e.target.value }))}
                  style={styles.input}
                  placeholder="Photo evidence URL"
                />
                <button
                  type="submit"
                  disabled={healthLoading}
                  style={{ ...styles.taskBtn, background: '#1d4ed8', color: 'white', width: 'fit-content' }}
                >
                  <i className="fas fa-camera"></i> {healthLoading ? 'Saving...' : 'Save Health Update'}
                </button>
              </form>
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
                    {entry.metadata?.evidence_photo_url && (
                      <img
                        src={entry.metadata.evidence_photo_url}
                        alt="Evidence"
                        style={{ width: '100%', maxWidth: '280px', borderRadius: '12px', marginTop: '10px', border: '1px solid #d8f3dc' }}
                      />
                    )}
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
