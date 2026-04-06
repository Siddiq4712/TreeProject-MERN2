import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ToastContext } from '../context/toast-context';
import { useResponsive } from '../hooks/useResponsive';

const fieldStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid #d4e9db',
  background: '#fbfffc',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

const AddHistoricalTree = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const { isMobile } = useResponsive();
  const [lands, setLands] = useState([]);
  const [species, setSpecies] = useState('');
  const [landId, setLandId] = useState('');
  const [plantedDate, setPlantedDate] = useState('');
  const [growthStatus, setGrowthStatus] = useState('Sapling');
  const [survivalStatus, setSurvivalStatus] = useState('Healthy');
  const [heightCm, setHeightCm] = useState('');
  const [hasTreeGuard, setHasTreeGuard] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLands = async () => {
      try {
        const res = await api.get('/lands/mine');
        setLands(res.data);
      } catch (err) {
        console.error('AddHistoricalTree fetchLands failed:', err);
      }
    };

    fetchLands();
  }, []);

  const getId = (item) => item?._id || item?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!species.trim()) {
      const message = 'Tree species is required.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    try {
      await api.post('/trees/historical', {
        species: species.trim(),
        land_id: landId || null,
        planted_date: plantedDate || null,
        growth_status: growthStatus,
        survival_status: survivalStatus,
        height_cm: heightCm ? parseInt(heightCm, 10) : 0,
        has_tree_guard: hasTreeGuard,
        photo_url: photoUrl || null,
        notes: notes || null,
      });

      showToast('Historical tree added successfully.', 'success');
      navigate('/my-trees?filter=historical');
    } catch (err) {
      console.error('AddHistoricalTree handleSubmit failed:', err);
      const message = err.response?.data?.message || 'Failed to add tree.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top right, rgba(187,247,208,0.55), transparent 24%), linear-gradient(180deg, #f6fbf7 0%, #eef7f1 100%)',
        fontFamily: "'Segoe UI', sans-serif",
        padding: '28px',
      }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.9fr 1.1fr', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            padding: '30px',
            color: 'white',
            background:
              'radial-gradient(circle at top right, rgba(187,247,208,0.35), transparent 24%), linear-gradient(135deg, #081c15 0%, #1b4332 50%, #2d6a4f 100%)',
            boxShadow: '0 24px 60px rgba(12, 35, 24, 0.14)',
          }}
        >
          <button
            onClick={() => navigate('/my-trees')}
            style={{
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              borderRadius: '16px',
              padding: '12px 16px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '10px' }}></i>
            Back to Tree Tracker
          </button>

          <div style={{ marginTop: '28px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>
              Historical Tree Intake
            </div>
            <h1 style={{ margin: '12px 0 0', fontSize: '42px', lineHeight: 1.08 }}>Record older trees that were planted before this application started tracking them.</h1>
            <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, fontSize: '17px' }}>
              Use this form for legacy plantations, already-grown trees, or manually documented field records. These trees appear immediately in your Tree Tracker.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px', marginTop: '26px' }}>
            {[
              ['Best for', 'Legacy trees, prior plantation drives, and imported field records'],
              ['Visible in', 'Tree Tracker under the Historical filter and your full tree portfolio'],
              ['Can include', 'Land reference, growth stage, health status, height, tree guard, and photo link'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px' }}>{label}</div>
                <div style={{ fontSize: '19px', fontWeight: 700, marginTop: '6px', lineHeight: 1.5 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '30px',
            padding: '32px',
            boxShadow: '0 24px 60px rgba(15, 47, 36, 0.08)',
            border: '1px solid #e8f3eb',
          }}
        >
          <h2 style={{ margin: 0, color: '#163126', fontSize: '32px' }}>Add Historical Tree</h2>
          <p style={{ margin: '8px 0 24px', color: '#52796f', lineHeight: 1.6 }}>
            Capture the current known state of the tree so your dashboard has a complete plantation history.
          </p>

          {error && (
            <div style={{ marginBottom: '16px', background: '#fff1f2', color: '#be123c', padding: '14px 16px', borderRadius: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Tree Species</label>
              <input
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Neem, Peepal, Mango, Teak..."
                style={fieldStyle}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Planted Date</label>
                <input type="date" value={plantedDate} onChange={(e) => setPlantedDate(e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Land</label>
                <select value={landId} onChange={(e) => setLandId(e.target.value)} style={fieldStyle}>
                  <option value="">Select Land</option>
                  {lands.map((land) => (
                    <option key={getId(land)} value={getId(land)}>
                      {land.name} · {land.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Growth Status</label>
                <select value={growthStatus} onChange={(e) => setGrowthStatus(e.target.value)} style={fieldStyle}>
                  <option value="Seedling">Seedling</option>
                  <option value="Sapling">Sapling</option>
                  <option value="Young">Young</option>
                  <option value="Mature">Mature</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Health Status</label>
                <select value={survivalStatus} onChange={(e) => setSurvivalStatus(e.target.value)} style={fieldStyle}>
                  <option value="Healthy">Healthy</option>
                  <option value="Weak">Weak</option>
                  <option value="Critical">Critical</option>
                  <option value="Dead">Dead</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Current Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="150" style={fieldStyle} />
              </div>
            </div>

            <div
              style={{
                marginBottom: '14px',
                padding: '18px',
                borderRadius: '20px',
                background: '#f5fbf7',
                border: '1px solid #e0efe6',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: '#163126', cursor: 'pointer' }}>
                <input type="checkbox" checked={hasTreeGuard} onChange={(e) => setHasTreeGuard(e.target.checked)} />
                This tree already has a guard or protection installed
              </label>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/tree-photo.jpg"
                style={fieldStyle}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Notes</label>
              <textarea
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add useful context like plantation campaign name, caretaker details, or the present condition of the tree."
                style={{ ...fieldStyle, minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                border: 'none',
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: 'white',
                borderRadius: '18px',
                padding: '16px',
                fontWeight: 800,
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving Historical Tree...' : 'Save Historical Tree'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AddHistoricalTree;
