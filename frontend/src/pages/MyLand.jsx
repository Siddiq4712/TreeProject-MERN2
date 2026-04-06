import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';

const MyLand = () => {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const res = await api.get('/lands/mine');
      setLands(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    addBtn: {
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
      transition: '0.3s',
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
    landGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '25px',
    },
    landCard: {
      background: 'white',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
      transition: '0.3s',
    },
    landBanner: {
      height: '100px',
      background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
    },
    landBody: {
      padding: '20px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '10px',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
      fontSize: '14px',
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

  const getStatusColor = (status) => {
    const colors = { Available: '#2d6a4f', 'In Use': '#ff9f1c', Full: '#e63946' };
    return colors[status] || '#888';
  };

  const totalLands = lands.length;
  const totalTrees = lands.reduce((sum, land) => sum + (land.trees?.length || 0), 0);
  const totalEvents = lands.reduce((sum, land) => sum + (land.events?.length || 0), 0);

  return (
    <div style={styles.body}>
      <Sidebar />

      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🏞️ My Land</h1>
            <p style={{ color: '#666', margin: '5px 0 0' }}>Manage your land and tree plantations</p>
          </div>
          <button
            style={styles.addBtn}
            onClick={() => navigate('/add-land')}
            onMouseOver={(e) => {
              e.target.style.background = '#1b4332';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#2d6a4f';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="fas fa-plus"></i> Add Land
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Total Lands</h4>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {totalLands}
            </p>
          </div>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Trees Planted</h4>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {totalTrees}
            </p>
          </div>
          <div style={styles.statCard}>
            <h4 style={{ fontSize: '14px', color: '#666', margin: 0 }}>Events Hosted</h4>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f', margin: '5px 0 0' }}>
              {totalEvents}
            </p>
          </div>
        </div>

        {/* Land Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading lands...
          </p>
        ) : lands.length === 0 ? (
          <div style={styles.emptyState}>
            <i className="fas fa-map" style={{ fontSize: '60px', marginBottom: '20px', display: 'block', color: '#ccc' }}></i>
            <p>No lands added yet. Add your first land to start planting!</p>
            <button
              style={{ ...styles.addBtn, margin: '20px auto' }}
              onClick={() => navigate('/add-land')}
            >
              <i className="fas fa-plus"></i> Add Land
            </button>
          </div>
        ) : (
          <div style={styles.landGrid}>
            {lands.map((land) => {
              const landId = getId(land);
              return (
                <div
                  key={landId}
                  style={styles.landCard}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={styles.landBanner}>🏞️</div>

                  <div style={styles.landBody}>
                    <span style={{ ...styles.badge, background: getStatusColor(land.status) }}>
                      {land.status}
                    </span>

                    <h3 style={{ fontSize: '18px', margin: '0 0 5px', color: '#1b4332' }}>{land.name}</h3>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px' }}>
                      <i className="fas fa-map-marker-alt"></i> {land.address}
                    </p>

                    <div style={styles.infoRow}>
                      <span>Type</span>
                      <strong>{land.land_type}</strong>
                    </div>
                    <div style={styles.infoRow}>
                      <span>Area</span>
                      <strong>{land.area_sqft || 'N/A'} sq.ft</strong>
                    </div>
                    <div style={styles.infoRow}>
                      <span>Trees Planted</span>
                      <strong>{land.trees?.length || 0}</strong>
                    </div>
                    <div style={styles.infoRow}>
                      <span>Events</span>
                      <strong>{land.events?.length || 0}</strong>
                    </div>

                    <button
                      style={styles.viewBtn}
                      onClick={() => navigate(`/land/${landId}`)}
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

export default MyLand;