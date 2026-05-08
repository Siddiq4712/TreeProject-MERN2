import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const AddLand = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const { isMobile } = useResponsive();
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

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const fetchLand = async () => {
      try {
        const res = await api.get(`/lands/${id}`);
        const land = res.data;
        setName(land.name || '');
        setAddress(land.address || '');
        setLatitude(land.latitude ?? '');
        setLongitude(land.longitude ?? '');
        setAreaSqft(land.area_sqft ?? '');
        setLandType(land.land_type || 'Private');
        setSoilType(land.soil_type || '');
        setWaterAvailability(Boolean(land.water_availability));
        setWaterSource(land.water_source || '');
        setDescription(land.description || '');
      } catch (err) {
        console.error('AddLand fetchLand failed:', err);
        showToast('Unable to load land for editing.', 'error');
        navigate('/my-land');
      }
    };

    fetchLand();
  }, [id, isEditMode, navigate, showToast]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          showToast('Current location captured.', 'success');
        },
        (err) => {
          console.error('AddLand geolocation failed:', err);
          showToast('Unable to retrieve current location.', 'error');
        }
      );
    } else {
      showToast('Geolocation is not supported in this browser.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !address) {
      const message = 'Land name and address are required.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        area_sqft: areaSqft ? parseInt(areaSqft, 10) : null,
        land_type: landType,
        soil_type: soilType || null,
        water_availability: waterAvailability,
        water_source: waterSource || null,
        description: description || null,
      };

      if (isEditMode) {
        await api.put(`/lands/${id}`, payload);
      } else {
        await api.post('/lands', payload);
      }

      showToast(isEditMode ? 'Land updated successfully.' : 'Land added successfully.', 'success');
      navigate('/my-land');
    } catch (err) {
      console.error('AddLand handleSubmit failed:', err);
      const message = err.response?.data?.message || 'Failed to add land.';
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
          'radial-gradient(circle at top right, rgba(187,247,208,0.55), transparent 26%), linear-gradient(180deg, #f6fbf7 0%, #eef7f1 100%)',
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
            onClick={() => navigate('/my-land')}
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
            Back to Land Hub
          </button>

          <div style={{ marginTop: '26px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)' }}>
              New Land Intake
            </div>
            <h1 style={{ margin: '12px 0 0', fontSize: '42px', lineHeight: 1.08 }}>
              {isEditMode ? 'Update this plantation space with the latest land details.' : 'Add a plantation space with the details your future events will need.'}
            </h1>
            <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, fontSize: '17px' }}>
              Capture the land profile, availability, water readiness, and soil conditions so events and trees can be planned properly from day one.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px', marginTop: '26px' }}>
            {[
              ['Accurate mapping', 'Save coordinates to connect real land with event operations.'],
              ['Soil and water context', 'Record readiness for healthy tree survival.'],
              ['Campaign alignment', 'Use this land later when creating an event.'],
            ].map(([title, text]) => (
              <div key={title} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '18px' }}>
                <div style={{ fontWeight: 800, marginBottom: '8px' }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.74)', lineHeight: 1.6 }}>{text}</div>
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
          <h2 style={{ margin: 0, color: '#163126', fontSize: '32px' }}>{isEditMode ? 'Edit Land Details' : 'Land Details'}</h2>
          <p style={{ margin: '8px 0 24px', color: '#52796f', lineHeight: 1.6 }}>
            Fill in the most important operating details. You can refine the land later from the detail view.
          </p>

          {error && (
            <div style={{ marginBottom: '16px', background: '#fff1f2', color: '#be123c', padding: '14px 16px', borderRadius: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Land Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kovilpatti Community Plot" style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Land Type</label>
                <select value={landType} onChange={(e) => setLandType(e.target.value)} style={fieldStyle}>
                  <option value="Private">Private</option>
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                  <option value="Public">Public</option>
                  <option value="Government">Government</option>
                  <option value="School">School</option>
                  <option value="College">College</option>
                  <option value="Community">Community</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address of the land" style={fieldStyle} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '14px', marginBottom: '14px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Latitude</label>
                <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="9.171100" style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Longitude</label>
                <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="77.874100" style={fieldStyle} />
              </div>
              <button
                type="button"
                onClick={getLocation}
                style={{
                  height: '48px',
                  border: 'none',
                  background: '#163126',
                  color: 'white',
                  borderRadius: '16px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Use Current
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Area (sq.ft)</label>
                <input type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} placeholder="5000" style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Soil Type</label>
                <select value={soilType} onChange={(e) => setSoilType(e.target.value)} style={fieldStyle}>
                  <option value="">Select Soil Type</option>
                  <option value="Red">Red</option>
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Loamy">Loamy</option>
                  <option value="Black">Black</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div
              style={{
                padding: '18px',
                borderRadius: '20px',
                background: '#f5fbf7',
                border: '1px solid #e0efe6',
                marginBottom: '14px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: '#163126', cursor: 'pointer' }}>
                <input type="checkbox" checked={waterAvailability} onChange={(e) => setWaterAvailability(e.target.checked)} />
                Water is available on this land
              </label>

              {waterAvailability && (
                <div style={{ marginTop: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Water Source</label>
                  <input value={waterSource} onChange={(e) => setWaterSource(e.target.value)} placeholder="Borewell, tank, rain harvest..." style={fieldStyle} />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anything special about this land, access conditions, or planting potential."
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
              {loading ? (isEditMode ? 'Saving Changes...' : 'Saving Land...') : (isEditMode ? 'Save Land Changes' : 'Save Land')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AddLand;
