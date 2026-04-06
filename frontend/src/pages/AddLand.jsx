import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddLand = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [landType, setLandType] = useState('Private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterAvailability, setWaterAvailability] = useState(false);
  const [waterSource, setWaterSource] = useState('');
  const [description, setDescription] = useState('');

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        () => alert('Unable to retrieve location.')
      );
    } else {
      alert('Geolocation not supported.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !address) {
      setError('Name and address are required');
      setLoading(false);
      return;
    }

    try {
      await api.post('/lands', {
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        area_sqft: areaSqft ? parseInt(areaSqft) : null,
        land_type: landType,
        soil_type: soilType || null,
        water_availability: waterAvailability,
        water_source: waterSource || null,
        description: description || null,
      });

      alert('✅ Land added successfully!');
      navigate('/my-land');
    } catch (err) {
      console.error('Error adding land:', err);
      setError(err.response?.data?.message || 'Failed to add land');
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
      marginBottom: '30px',
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
    geoBtn: {
      background: '#6c584c',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      marginTop: '5px',
      cursor: 'pointer',
      fontSize: '12px',
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
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <button style={styles.btnBack} onClick={() => navigate('/my-land')}>
          <i className="fas fa-arrow-left"></i> Back to My Land
        </button>

        <h2 style={styles.h2}>🏞️ Add New Land</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Land Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kovilpatti Farm Land"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address of the land"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, ...styles.col }}>
              <label style={styles.label}>Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 9.1711"
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.col }}>
              <label style={styles.label}>Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 77.8741"
                style={styles.input}
              />
            </div>
          </div>

          <button type="button" onClick={getLocation} style={styles.geoBtn}>
            📍 Get Current Location
          </button>

          <div style={{ ...styles.formGroup, marginTop: '20px' }}>
            <label style={styles.label}>Total Area (sq. ft.)</label>
            <input
              type="number"
              value={areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
              placeholder="e.g. 5000"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Land Type</label>
            <select
              value={landType}
              onChange={(e) => setLandType(e.target.value)}
              style={styles.select}
            >
              <option value="Private">Private (Personal)</option>
              <option value="Owned">Owned</option>
              <option value="Leased">Leased / Rented</option>
              <option value="Public">Public</option>
              <option value="Government">Government</option>
              <option value="School">School</option>
              <option value="College">College</option>
              <option value="Community">Community</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Soil Type (Optional)</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Select Soil Type --</option>
              <option value="Red">Red Soil</option>
              <option value="Clay">Clay Soil</option>
              <option value="Sandy">Sandy Soil</option>
              <option value="Loamy">Loamy Soil</option>
              <option value="Black">Black Soil</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={waterAvailability}
                onChange={(e) => setWaterAvailability(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#444' }}>Water Available on Land</span>
            </label>
          </div>

          {waterAvailability && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Water Source</label>
              <input
                type="text"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                placeholder="e.g. Well, Borewell, Nearby lake"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Description (Optional)</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details about the land..."
              style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
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
            {loading ? 'Adding...' : 'Add Land'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLand;