import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { useResponsive } from '../hooks/useResponsive';

const MyLand = () => {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const getId = (item) => item?._id || item?.id;

  const fetchLands = useCallback(async () => {
    try {
      const res = await api.get('/lands/mine');
      setLands(res.data);
    } catch (err) {
      console.error('MyLand fetchLands failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  const totalLands = lands.length;
  const totalTrees = lands.reduce((sum, land) => sum + (land.trees?.length || 0), 0);
  const totalEvents = lands.reduce((sum, land) => sum + (land.events?.length || 0), 0);
  const wateredReady = lands.filter((land) => land.water_availability).length;

  const getStatusTone = (status) => {
    const tones = {
      Available: { bg: '#dcfce7', color: '#166534' },
      Reserved: { bg: '#fef3c7', color: '#92400e' },
      Active: { bg: '#dbeafe', color: '#1d4ed8' },
      Completed: { bg: '#e5e7eb', color: '#374151' },
    };
    return tones[status] || tones.Available;
  };

  return (
    <div style={{ display: isMobile ? 'block' : 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #f5fbf7 0%, #edf6f0 100%)', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar />

      <main style={{ marginLeft: isMobile ? 0 : isTablet ? '240px' : '280px', width: isMobile ? '100%' : `calc(100% - ${isTablet ? '240px' : '280px'})`, padding: isMobile ? '18px' : '30px 34px 40px' }}>
        <section
          style={{
            borderRadius: '30px',
            padding: '32px',
            color: 'white',
            background:
              'radial-gradient(circle at top right, rgba(187,247,208,0.4), transparent 24%), linear-gradient(135deg, #0b1f17 0%, #1b4332 45%, #2d6a4f 100%)',
            boxShadow: '0 28px 70px rgba(12, 35, 24, 0.14)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '700px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)' }}>
                Land Hub
              </div>
              <h1 style={{ margin: '10px 0 0', fontSize: '42px', lineHeight: 1.08 }}>Design the spaces where your plantation story grows.</h1>
              <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, fontSize: '17px' }}>
                Track available land, event activity, and planting density across every location you manage.
              </p>
            </div>

            <button
              onClick={() => navigate('/add-land')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #bbf7d0, #86efac)',
                color: '#0f2f24',
                borderRadius: '18px',
                padding: '14px 20px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '10px' }}></i>
              Add Land
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: '14px', marginTop: '24px' }}>
            {[
              ['Total Lands', totalLands],
              ['Trees Across Lands', totalTrees],
              ['Hosted Events', totalEvents],
              ['Water Ready', wateredReady],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '22px', padding: '18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px' }}>{label}</div>
                <div style={{ fontSize: '34px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: '26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#163126', fontSize: '28px' }}>Land Portfolio</h2>
            <p style={{ margin: '6px 0 0', color: '#52796f' }}>Every plot, event, and tree count in one glance.</p>
          </div>
        </section>

        {loading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: '#52796f' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Loading lands...
          </div>
        ) : lands.length === 0 ? (
          <div
            style={{
              marginTop: '22px',
              background: 'white',
              borderRadius: '30px',
              padding: '56px 24px',
              textAlign: 'center',
              boxShadow: '0 18px 50px rgba(15, 47, 36, 0.06)',
            }}
          >
            <i className="fas fa-mountain" style={{ fontSize: '52px', color: '#84cc16', marginBottom: '18px' }}></i>
            <h3 style={{ margin: 0, color: '#163126', fontSize: '26px' }}>No land added yet</h3>
            <p style={{ margin: '10px 0 0', color: '#52796f' }}>Start by mapping your first plantation space.</p>
            <button
              onClick={() => navigate('/add-land')}
              style={{
                marginTop: '18px',
                border: 'none',
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: 'white',
                borderRadius: '18px',
                padding: '14px 18px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Add First Land
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
            {lands.map((land) => {
              const tone = getStatusTone(land.status);
              return (
                <article
                  key={getId(land)}
                  style={{
                    background: 'white',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    border: '1px solid #e8f3eb',
                    boxShadow: '0 20px 55px rgba(15, 47, 36, 0.07)',
                  }}
                >
                  <div
                    style={{
                      padding: '24px',
                      background:
                        'radial-gradient(circle at top right, rgba(187,247,208,0.45), transparent 24%), linear-gradient(135deg, #f4fff7 0%, #e5f7ea 100%)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#52796f', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{land.land_type}</div>
                        <h3 style={{ margin: '8px 0 6px', fontSize: '24px', color: '#163126' }}>{land.name}</h3>
                        <div style={{ color: '#52796f', lineHeight: 1.5 }}>
                          <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#2d6a4f' }}></i>
                          {land.address}
                        </div>
                      </div>
                      <span
                        style={{
                          background: tone.bg,
                          color: tone.color,
                          padding: '8px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {land.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        ['Area', land.area_sqft ? `${land.area_sqft} sq.ft` : 'Not set'],
                        ['Soil', land.soil_type || 'Unknown'],
                        ['Trees', land.trees?.length || 0],
                        ['Events', land.events?.length || 0],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '14px' }}>
                          <div style={{ fontSize: '12px', color: '#52796f' }}>{label}</div>
                          <div style={{ marginTop: '6px', fontWeight: 800, color: '#163126' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 16px',
                        borderRadius: '18px',
                        background: land.water_availability ? '#ecfdf5' : '#f8fafc',
                        color: land.water_availability ? '#166534' : '#64748b',
                        fontWeight: 700,
                      }}
                    >
                      <i className={`fas ${land.water_availability ? 'fa-droplet' : 'fa-droplet-slash'}`} style={{ marginRight: '10px' }}></i>
                      {land.water_availability ? `Water source: ${land.water_source || 'Available'}` : 'Water source not configured'}
                    </div>

                    <button
                      onClick={() => navigate(`/land/${getId(land)}`)}
                      style={{
                        marginTop: '18px',
                        width: '100%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                        color: 'white',
                        borderRadius: '18px',
                        padding: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Open Land Detail
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyLand;
