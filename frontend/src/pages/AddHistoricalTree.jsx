import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddHistoricalTree = () => {
  const navigate = useNavigate();
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
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const res = await api.get('/lands/mine');
      setLands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!species) {
      setError('Tree species is required');
      setLoading(false);
      return;
    }

    try {
      await api.post('/trees/historical', {
        species,
        land_id: landId || null,
        planted_date: plantedDate || null,
        growth_status: growthStatus,
        survival_status: survivalStatus,
        height_cm: heightCm ? parseInt(heightCm) : 0,
        has_tree_guard: hasTreeGuard,
        photo_url: photoUrl || null,
        notes: notes || null,
      });

      alert('✅ Historical tree added successfully!');
      navigate('/my-trees');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tree');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    body: {
      fontFamily: "'Segoe UI', sans-serif",
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      padding: '20px',
    },
    container: {
      maxWidth: '600px',
      margin: 'auto',
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      borderTop: '8px solid #2d6a4f',
    },
    btnBack: {
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
    h2: {
      color: '#2d6a4f',
      textAlign: 'center',
      marginBottom: '10px',
    },
    subtitle: {
      textAlign: 'center',
      color: '#666',
      marginBottom: '30px',
      fontSize: '14px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#444',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
      resize: 'vertical',
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '15px',
      background: '#f1f8f1',
      borderRadius: '8px',
    },
    btnSubmit: {
      backgroundColor: '#2d6a4f',
      color: 'white',
      padding: '15px 30px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '18px',
      cursor: 'pointer',
      width: '100%',
      fontWeight: 'bold',
      marginTop: '20px',
    },
    error: {
      background: '#fee',
      color: '#c00',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    row: {
      display: 'flex',
      gap: '15px',
    },
    col: {
      flex: 1,
    },
    infoBox: {
      background: '#e8f5e9',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '25px',
      fontSize: '13px',
      color: '#2d6a4f',
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <button style={styles.btnBack} onClick={() => navigate('/my-trees')}>
          <i className="fas fa-arrow-left"></i> Back to My Trees
        </button>

        <h2 style={styles.h2}>🌳 Add Historical Tree</h2>
        <p style={styles.subtitle}>Record a tree you planted before using this app</p>

        <div style={styles.infoBox}>
          <i className="fas fa-info-circle"></i> Historical trees are added directly to your profile without going through the event pipeline. They appear in "My Trees" immediately.
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tree Species *</label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. Neem, Peepal, Teak, Mango"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Planted On (Approximate Date)</label>
            <input
              type="date"
              value={plantedDate}
              onChange={(e) => setPlantedDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Land (Optional)</label>
            <select
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Select Land --</option>
              {lands.map((land) => (
                <option key={getId(land)} value={getId(land)}>
                  {land.name} - {land.address}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, ...styles.col }}>
              <label style={styles.label}>Growth Status</label>
              <select
                value={growthStatus}
                onChange={(e) => setGrowthStatus(e.target.value)}
                style={styles.select}
              >
                <option value="Seedling">Seedling</option>
                <option value="Sapling">Sapling</option>
                <option value="Young">Young</option>
                <option value="Mature">Mature</option>
              </select>
            </div>
            <div style={{ ...styles.formGroup, ...styles.col }}>
              <label style={styles.label}>Health Status</label>
              <select
                value={survivalStatus}
                onChange={(e) => setSurvivalStatus(e.target.value)}
                style={styles.select}
              >
                <option value="Healthy">Healthy</option>
                <option value="Weak">Weak</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Current Height (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 150"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={hasTreeGuard}
                onChange={(e) => setHasTreeGuard(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span>Tree has a guard/protection installed</span>
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Photo URL (Optional)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/tree-photo.jpg"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes (Optional)</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the tree..."
              style={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnSubmit,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Adding Tree...' : 'Add Historical Tree'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddHistoricalTree;