import { useContext, useEffect, useMemo, useState } from 'react';
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

const noLandChoices = [
  'Help find a suitable land',
  'Assist in land preparation',
  'Pre-digging support',
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const { isMobile } = useResponsive();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customTreeCount, setCustomTreeCount] = useState('');
  const [form, setForm] = useState({
    event_id: 'TN 69 - Loading...',
    location_code: 'TN 69',
    location: 'KOVILPATTAI New Busstand',
    role: 'Volunteer',
    budget: '',
    tree_count: '100',
    land_allocation_status: 'NEEDED',
    selected_land_id: '',
    proposed_latitude: '',
    proposed_longitude: '',
    proposed_area_sqft: '',
    land_support_options: [],
    land_support_other: '',
    can_run_without_sponsorship: true,
    date_time: '',
    expected_volunteers: '',
    tree_species: '',
    maintenance_plan: '',
    community_engagement_strategy: '',
    media_coverage: true,
    social_media_handles: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    approval_mode: 'Manual',
    initiation_type: 'Volunteer-Led',
    description: '',
    climate_zone: '',
  });

  useEffect(() => {
    const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000);
    setForm((current) => ({ ...current, event_id: `TN 69 - ${random10Digit}` }));

    const fetchLands = async () => {
      try {
        const res = await api.get('/lands/mine');
        setLands(res.data);
      } catch (err) {
        console.error('CreateEvent fetchLands failed:', err);
      }
    };

    fetchLands();
  }, []);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectedLand = useMemo(
    () => lands.find((land) => (land._id || land.id) === form.selected_land_id) || null,
    [lands, form.selected_land_id]
  );

  const getLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('proposed_latitude', position.coords.latitude.toFixed(6));
        updateField('proposed_longitude', position.coords.longitude.toFixed(6));
        showToast('Land coordinates captured.', 'success');
      },
      (err) => {
        console.error('CreateEvent getLocation failed:', err);
        showToast('Unable to retrieve current location.', 'error');
      }
    );
  };

  const handleNoLandOption = (value, checked) => {
    const next = checked
      ? [...form.land_support_options, value]
      : form.land_support_options.filter((item) => item !== value);
    updateField('land_support_options', next);
  };

  const resolveTreeCount = () => {
    if (form.tree_count === 'Other') {
      return Number(customTreeCount || 0);
    }
    return Number(form.tree_count || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const treeCount = resolveTreeCount();
    if (!form.date_time || !treeCount) {
      const message = 'Event date and valid tree count are required.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!form.contact_name || !form.contact_phone || !form.contact_email) {
      const message = 'Contact person name, phone, and email are required.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    const payload = {
      event_id: form.event_id,
      location_code: form.location_code,
      location: form.location,
      role: form.role,
      budget: form.budget ? parseFloat(form.budget) : 0,
      tree_count: treeCount,
      tree_species: form.tree_species,
      date_time: form.date_time,
      land_id: form.land_allocation_status === 'ALLOCATED' ? form.selected_land_id || null : null,
      land_allocation_status: form.land_allocation_status,
      proposed_land:
        form.land_allocation_status === 'ALLOCATED'
          ? {
              latitude: selectedLand?.latitude || Number(form.proposed_latitude || 0) || null,
              longitude: selectedLand?.longitude || Number(form.proposed_longitude || 0) || null,
              area_sqft: selectedLand?.area_sqft || Number(form.proposed_area_sqft || 0) || null,
              address: selectedLand?.address || form.location,
            }
          : {
              latitude: form.proposed_latitude ? Number(form.proposed_latitude) : null,
              longitude: form.proposed_longitude ? Number(form.proposed_longitude) : null,
              area_sqft: form.proposed_area_sqft ? Number(form.proposed_area_sqft) : null,
              address: form.location,
            },
      land_support_options: form.land_support_options,
      land_support_other: form.land_support_other,
      can_run_without_sponsorship: form.can_run_without_sponsorship,
      expected_volunteers: Number(form.expected_volunteers || 0),
      maintenance_plan: form.maintenance_plan,
      community_engagement_strategy: form.community_engagement_strategy,
      media_coverage: form.media_coverage,
      social_media_handles: form.social_media_handles
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      contact_person: {
        name: form.contact_name,
        phone: form.contact_phone,
        email: form.contact_email,
      },
      approval_mode: form.approval_mode,
      initiation_type: form.initiation_type,
      description: form.description,
      climate_zone: form.climate_zone,
      labor_goal: Number(form.expected_volunteers || 0),
      funding_goal: form.budget ? Number(form.budget) : null,
      procurement_status: 'PLANNED',
    };

    try {
      await api.post('/events', payload);
      showToast(`Event ${form.event_id} created successfully.`, 'success');
      navigate('/my-events');
    } catch (err) {
      console.error('CreateEvent handleSubmit failed:', err);
      const message = err.response?.data?.message || 'Failed to create event.';
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.85fr 1.15fr', gap: '24px' }}>
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
            onClick={() => navigate('/my-events')}
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
            Back to Event Studio
          </button>

          <div style={{ marginTop: '28px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>
              Plantation Event Builder
            </div>
            <h1 style={{ margin: '12px 0 0', fontSize: isMobile ? '28px' : '42px', lineHeight: 1.08 }}>Create a full plantation event with land, support model, volunteers, donors, and field planning.</h1>
            <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: isMobile ? '14px' : '17px' }}>
              This form now follows your event flow, including land allocation, sponsorship fallback, volunteer support, contact details, and tree planning.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px', marginTop: '26px' }}>
            {[
              ['Auto Event ID', form.event_id],
              ['Role Focus', `${form.role} · ${form.initiation_type}`],
              ['Land Status', form.land_allocation_status === 'ALLOCATED' ? 'Land allocated already' : 'Land still needed'],
              ['Tree Target', `${resolveTreeCount() || 0} planned trees`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: isMobile ? '14px' : '18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px' }}>{label}</div>
                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, marginTop: '6px' }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '30px',
            padding: isMobile ? '20px' : '32px',
            boxShadow: '0 24px 60px rgba(15, 47, 36, 0.08)',
            border: '1px solid #e8f3eb',
          }}
        >
          <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '24px' : '32px' }}>Tree Plantation Event Creation Form</h2>
          <p style={{ margin: '8px 0 24px', color: '#52796f', lineHeight: 1.6 }}>
            Fill the complete event setup and submit when your plantation plan is ready.
          </p>

          {error && (
            <div style={{ marginBottom: '16px', background: '#fff1f2', color: '#be123c', padding: '14px 16px', borderRadius: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event ID</label>
                <input value={form.event_id} readOnly style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Location Code</label>
                <input value={form.location_code} onChange={(e) => updateField('location_code', e.target.value)} style={fieldStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event Location</label>
              <input value={form.location} onChange={(e) => updateField('location', e.target.value)} style={fieldStyle} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Your Role</label>
                <select value={form.role} onChange={(e) => updateField('role', e.target.value)} style={fieldStyle}>
                  <option value="Volunteer">Volunteering</option>
                  <option value="Sponsor">Sponsoring</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Initiation Type</label>
                <select value={form.initiation_type} onChange={(e) => updateField('initiation_type', e.target.value)} style={fieldStyle}>
                  <option value="Volunteer-Led">Volunteer-Led</option>
                  <option value="Sponsor-Led">Sponsor-Led</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Approval Mode</label>
                <select value={form.approval_mode} onChange={(e) => updateField('approval_mode', e.target.value)} style={fieldStyle}>
                  <option value="Manual">Manual</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Sponsorship Budget (Approx.)</label>
                <input type="number" value={form.budget} onChange={(e) => updateField('budget', e.target.value)} placeholder="₹ amount" style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Number of Trees</label>
                <select value={form.tree_count} onChange={(e) => updateField('tree_count', e.target.value)} style={fieldStyle}>
                  <option value="10">10</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {form.tree_count === 'Other' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Custom Tree Count</label>
                <input type="number" value={customTreeCount} onChange={(e) => setCustomTreeCount(e.target.value)} style={fieldStyle} />
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Land Allocation Already</label>
              <select value={form.land_allocation_status} onChange={(e) => updateField('land_allocation_status', e.target.value)} style={fieldStyle}>
                <option value="ALLOCATED">Yes</option>
                <option value="NEEDED">No</option>
              </select>
            </div>

            {form.land_allocation_status === 'ALLOCATED' ? (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Allocated Land</label>
                  <select value={form.selected_land_id} onChange={(e) => updateField('selected_land_id', e.target.value)} style={fieldStyle}>
                    <option value="">Select from your land bank</option>
                    {lands.map((land) => (
                      <option key={land._id || land.id} value={land._id || land.id}>
                        {land.name} · {land.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr auto', gap: '14px', marginBottom: '14px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Latitude</label>
                    <input value={selectedLand?.latitude || form.proposed_latitude} onChange={(e) => updateField('proposed_latitude', e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Longitude</label>
                    <input value={selectedLand?.longitude || form.proposed_longitude} onChange={(e) => updateField('proposed_longitude', e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Total Area</label>
                    <input value={selectedLand?.area_sqft || form.proposed_area_sqft} onChange={(e) => updateField('proposed_area_sqft', e.target.value)} style={fieldStyle} />
                  </div>
                  <button type="button" onClick={getLocation} style={{ ...fieldStyle, background: '#163126', color: 'white', border: 'none', cursor: 'pointer', height: '48px' }}>
                    Use GPS
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '14px', padding: '18px', borderRadius: '20px', background: '#f5fbf7', border: '1px solid #e0efe6' }}>
                <div style={{ fontWeight: 700, color: '#163126', marginBottom: '12px' }}>If No, Volunteers can</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {noLandChoices.map((choice) => (
                    <label key={choice} style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#35584a' }}>
                      <input
                        type="checkbox"
                        checked={form.land_support_options.includes(choice)}
                        onChange={(e) => handleNoLandOption(choice, e.target.checked)}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
                <input
                  value={form.land_support_other}
                  onChange={(e) => updateField('land_support_other', e.target.value)}
                  placeholder="Other support volunteers can provide"
                  style={{ ...fieldStyle, marginTop: '12px' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event Date & Time</label>
                <input type="datetime-local" value={form.date_time} onChange={(e) => updateField('date_time', e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Expected Volunteers</label>
                <input type="number" value={form.expected_volunteers} onChange={(e) => updateField('expected_volunteers', e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Climate / Area Hint</label>
                <input value={form.climate_zone} onChange={(e) => updateField('climate_zone', e.target.value)} placeholder="Dry, humid, semi-arid..." style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event without Sponsorship</label>
                <select value={form.can_run_without_sponsorship ? 'YES' : 'NO'} onChange={(e) => updateField('can_run_without_sponsorship', e.target.value === 'YES')} style={fieldStyle}>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Media Coverage</label>
                <select value={form.media_coverage ? 'YES' : 'NO'} onChange={(e) => updateField('media_coverage', e.target.value === 'YES')} style={fieldStyle}>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Tree Species</label>
              <input value={form.tree_species} onChange={(e) => updateField('tree_species', e.target.value)} placeholder="Neem, Pongamia, Tamarind..." style={fieldStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Maintenance Plan</label>
              <textarea value={form.maintenance_plan} onChange={(e) => updateField('maintenance_plan', e.target.value)} style={{ ...fieldStyle, minHeight: '90px', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Community Engagement Strategy</label>
              <textarea value={form.community_engagement_strategy} onChange={(e) => updateField('community_engagement_strategy', e.target.value)} style={{ ...fieldStyle, minHeight: '90px', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Social Media Handles</label>
              <input value={form.social_media_handles} onChange={(e) => updateField('social_media_handles', e.target.value)} placeholder="@handle1, @handle2" style={fieldStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Contact Name</label>
                <input value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Contact Phone</label>
                <input value={form.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Contact Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} style={fieldStyle} required />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Additional Information</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} style={{ ...fieldStyle, minHeight: '110px', resize: 'vertical' }} />
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
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CreateEvent;
