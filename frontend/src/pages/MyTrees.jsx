import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const MyTrees = () => {
  const [trees, setTrees] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    fetchTrees();
  }, [filter]);

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const url =
        filter === 'all'
          ? '/trees/mine'
          : `/trees/mine?filter=${filter}`;
      const res = await api.get(url);
      setTrees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Planned: '#888',
      'Hole-Dug': '#ff9f1c',
      Planted: '#2a9d8f',
      Growing: '#2d6a4f',
      Mature: '#1b4332',
      Dead: '#c00',
    };
    return colors[status] || '#888';
  };

  const getSurvivalColor = (status) => {
    const colors = {
      Healthy: '#2d6a4f',
      Weak: '#ff9f1c',
      Critical: '#e63946',
      Dead: '#888',
    };
    return colors[status] || '#888';
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
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
    },
    title: {
      fontSize: '28px',
      color: '#1b4332',
      marginBottom: '10px',
    },
    filterTabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '25px',
      flexWrap: 'wrap',
    },
    tab: {
      padding: '10px 20px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: '0.3s',
    },
    activeTab: {
      background: '#2d6a4f',
      color: 'white',
    },
    inactiveTab: {
      background: 'white',
      color: '#2d6a4f',
      border: '1px solid #2d6a4f',
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
    treeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '25px',
    },
    treeCard: {
      background: 'white',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
      transition: '0.3s',
    },
    treeBanner: {
      height: '80px',
      background: '#d8f3dc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
    },
    treeBody: {
      padding: '20px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      color: 'white',
      marginRight: '8px',
    },
    progressBar: {
      height: '8px',
      background: '#e0e0e0',
      borderRadius: '4px',
      margin: '15px 0',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: '#2d6a4f',
      borderRadius: '4px',
      transition: '0.3s',
    },
    taskList: {
      marginTop: '15px',
      fontSize: '12px',
    },
    taskItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 0',
      borderBottom: '1px solid #eee',
    },
    viewBtn: {
      width: '100%',
      padding: '10px',
      border: '1px solid #2d6a4f',
      background: 'transparent',
      color: '#2d6a4f',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginTop: '15px',
      transition: '0.3s',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px',
      color: '#888',
    },
  };

  const totalTrees = trees.length;
  const healthyTrees = trees.filter(
    (t) => t.survival_status === 'Healthy'
  ).length;
  const plantedTrees = trees.filter(
    (t) =>
      t.status === 'Planted' ||
      t.status === 'Growing' ||
      t.status === 'Mature'
  ).length;

  const getProgress = (status) => {
    const progress = {
      Planned: 10,
      'Hole-Dug': 30,
      Planted: 60,
      Growing: 80,
      Mature: 100,
      Dead: 0,
    };
    return progress[status] || 0;
  };

  return (
    <div style={styles.body}>
      <Sidebar />

      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🌳 My Trees</h1>
            <p style={{ color: '#666' }}>
              Track all trees you've volunteered, sponsored, or planted
            </p>
          </div>

          <button
            onClick={() => navigate('/add-historical-tree')}
            style={{
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
            }}
          >
            <i className="fas fa-plus"></i> Add Old Tree Data
          </button>
        </div>

        {/* Filter Tabs - Add Historical */}
        <div style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All Trees' },
            { key: 'volunteered', label: 'Trees I Volunteered' },
            { key: 'sponsored', label: 'Trees I Sponsored' },
            { key: 'planted', label: 'Trees I Planted' },
            { key: 'historical', label: 'Historical Trees' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                ...styles.tab,
                ...(filter === tab.key
                  ? styles.activeTab
                  : styles.inactiveTab),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Total Trees
            </h4>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2d6a4f',
                margin: '5px 0 0',
              }}
            >
              {totalTrees}
            </p>
          </div>

          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Healthy Trees
            </h4>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2d6a4f',
                margin: '5px 0 0',
              }}
            >
              {healthyTrees}
            </p>
          </div>

          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Planted
            </h4>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2d6a4f',
                margin: '5px 0 0',
              }}
            >
              {plantedTrees}
            </p>
          </div>

          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Survival Rate
            </h4>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#2d6a4f',
                margin: '5px 0 0',
              }}
            >
              {totalTrees > 0
                ? Math.round((healthyTrees / totalTrees) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Tree Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading trees...
          </p>
        ) : trees.length === 0 ? (
          <div style={styles.emptyState}>
            <i
              className="fas fa-tree"
              style={{
                fontSize: '60px',
                marginBottom: '20px',
                display: 'block',
                color: '#ccc',
              }}
            ></i>
            <p>No trees found. Start volunteering or sponsoring trees!</p>
          </div>
        ) : (
          <div style={styles.treeGrid}>
            {trees.map((tree) => {
              const treeId = getId(tree);
              return (
                <div
                  key={treeId}
                  style={styles.treeCard}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform =
                      'translateY(-5px)')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = 'translateY(0)')
                  }
                >
                  <div style={styles.treeBanner}>🌱</div>

                  <div style={styles.treeBody}>
                    <div style={{ marginBottom: '10px' }}>
                      <span
                        style={{
                          ...styles.badge,
                          background: getStatusColor(tree.status),
                        }}
                      >
                        {tree.status}
                      </span>
                      <span
                        style={{
                          ...styles.badge,
                          background: getSurvivalColor(
                            tree.survival_status
                          ),
                        }}
                      >
                        {tree.survival_status}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: '#888',
                        margin: '0 0 5px',
                      }}
                    >
                      ID: {tree.tree_id}
                    </p>
                    <h3
                      style={{
                        fontSize: '18px',
                        margin: '0 0 10px',
                        color: '#1b4332',
                      }}
                    >
                      {tree.species}
                    </h3>

                    {tree.land && (
                      <p style={{ fontSize: '13px', color: '#666' }}>
                        <i className="fas fa-map-marker-alt"></i>{' '}
                        {tree.land.name}
                      </p>
                    )}

                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${getProgress(tree.status)}%`,
                        }}
                      ></div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      <span>Growth: {tree.growth_status}</span>
                      <span>Height: {tree.height_cm} cm</span>
                    </div>

                    {tree.tasks && tree.tasks.length > 0 && (
                      <div style={styles.taskList}>
                        <p
                          style={{
                            fontWeight: 'bold',
                            marginBottom: '5px',
                          }}
                        >
                          Recent Tasks:
                        </p>
                        {tree.tasks.slice(0, 3).map((task, index) => (
                          <div key={getId(task) || index} style={styles.taskItem}>
                            <i
                              className="fas fa-check-circle"
                              style={{ color: '#2d6a4f' }}
                            ></i>
                            <span>{task.task_type}</span>
                            <span
                              style={{
                                marginLeft: 'auto',
                                color: '#999',
                              }}
                            >
                              by {task.volunteer?.name || 'Unknown'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      style={styles.viewBtn}
                      onClick={() =>
                        navigate(`/tree/${treeId}`)
                      }
                      onMouseOver={(e) => {
                        e.target.style.background = '#2d6a4f';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#2d6a4f';
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTrees;