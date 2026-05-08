import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { ToastContext } from '../context/toast-context';
import { AuthContext } from '../context/auth-context';
import { useResponsive } from '../hooks/useResponsive';
import { SELECT_PAGE_SIZE, getPaginationParams, normalizePaginatedResponse } from '../services/pagination';

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

const buildEventId = (pinCode, randomSuffix) => {
  const normalizedPin = String(pinCode || '').trim();
  if (!normalizedPin) {
    return String(randomSuffix);
  }

  return `${normalizedPin}-${randomSuffix}`;
};

const parseOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const formatDateTimeLocal = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
};

const resolveLandId = (event) => {
  const landValue = event?.land_id || event?.land;

  if (!landValue) {
    return '';
  }

  if (typeof landValue === 'object') {
    return landValue._id || landValue.id || '';
  }

  return String(landValue);
};

const mergeSelectedLand = (existingLands, event) => {
  const landValue = event?.land_id || event?.land;
  if (!landValue || typeof landValue !== 'object') {
    return existingLands;
  }

  const selectedLandId = landValue._id || landValue.id;
  if (!selectedLandId) {
    return existingLands;
  }

  const alreadyPresent = existingLands.some((land) => String(land._id || land.id) === String(selectedLandId));
  return alreadyPresent ? existingLands : [landValue, ...existingLands];
};

const CreateEvent = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);
  const { isMobile } = useResponsive();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [customTreeCount, setCustomTreeCount] = useState('');
  const [eventRandomSuffix, setEventRandomSuffix] = useState(() => {
    const first = Math.floor(10000000 + Math.random() * 90000000).toString();
    const second = Math.floor(10000000 + Math.random() * 90000000).toString();
    return `${first}${second}`;
  });
  const [form, setForm] = useState({
    event_id: String(eventRandomSuffix),
    pin_code: '',
    location_code: '',
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
    media_coverage: true,
    social_media_handles: '',
    creator_name: '',
    organization_name: '',
    contact_phone: '',
    contact_email: '',
    approval_mode: 'Manual',
    initiation_type: 'Volunteer-Led',
    description: '',
    climate_zone: '',
  });

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    const fetchLands = async () => {
      try {
        const res = await api.get('/lands/mine', {
          params: getPaginationParams(1, SELECT_PAGE_SIZE),
        });
        const normalized = normalizePaginatedResponse(res.data);
        setLands(normalized.items);
      } catch (err) {
        console.error('CreateEvent fetchLands failed:', err);
      }
    };

    fetchLands();
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const fetchEditDependencies = async () => {
      try {
        const [landsRes, eventRes] = await Promise.all([
          api.get('/lands/mine', {
            params: getPaginationParams(1, SELECT_PAGE_SIZE),
          }),
          api.get(`/events/${id}`),
        ]);

        const event = eventRes.data;
        const normalized = normalizePaginatedResponse(landsRes.data);
        const resolvedLands = mergeSelectedLand(normalized.items, event);
        setLands(resolvedLands);

        const eventId = String(event.event_id || '');
        const suffixMatch = eventId.match(/^\d{6}-(\d{16})$/);
        if (suffixMatch) {
          setEventRandomSuffix(suffixMatch[1]);
        }

        const selectedLandId = resolveLandId(event);
        const selectedEventLand = resolvedLands.find(
          (land) => String(land._id || land.id) === String(selectedLandId)
        );
        const proposedLand = event.proposed_land || {};

        setForm((current) => ({
          ...current,
          event_id: eventId || current.event_id,
          pin_code: event.pin_code || '',
          location_code: event.location_code || event.pin_code || '',
          location: event.location || '',
          role: event.role || 'Volunteer',
          budget: event.budget ?? '',
          tree_count: ['10', '100', '200', '500'].includes(String(event.tree_count)) ? String(event.tree_count) : 'Other',
          land_allocation_status: event.land_allocation_status || 'NEEDED',
          selected_land_id: selectedLandId,
          proposed_latitude: proposedLand.latitude ?? selectedEventLand?.latitude ?? '',
          proposed_longitude: proposedLand.longitude ?? selectedEventLand?.longitude ?? '',
          proposed_area_sqft: proposedLand.area_sqft ?? selectedEventLand?.area_sqft ?? '',
          land_support_options: event.land_support_options || [],
          land_support_other: event.land_support_other || '',
          can_run_without_sponsorship: event.can_run_without_sponsorship ?? true,
          date_time: formatDateTimeLocal(event.date_time),
          expected_volunteers: event.expected_volunteers ?? '',
          tree_species: event.tree_species || '',
          maintenance_plan: event.maintenance_plan || '',
          media_coverage: event.media_coverage ?? true,
          social_media_handles: (event.social_media_handles || []).join(', '),
          creator_name: event.contact_person?.name || '',
          organization_name: event.contact_person?.organization || '',
          contact_phone: event.contact_person?.phone || '',
          contact_email: event.contact_person?.email || '',
          approval_mode: event.approval_mode || 'Manual',
          initiation_type: event.initiation_type || 'Volunteer-Led',
          description: event.description || '',
          climate_zone: event.climate_zone || '',
        }));

        if (!['10', '100', '200', '500'].includes(String(event.tree_count))) {
          setCustomTreeCount(String(event.tree_count || ''));
        }
      } catch (err) {
        console.error('CreateEvent fetchEditDependencies failed:', err);
        showToast('Unable to load event for editing.', 'error');
        navigate('/my-events');
      } finally {
        setEventLoading(false);
      }
    };

    setEventLoading(true);
    fetchEditDependencies();
  }, [id, isEditMode, navigate, showToast]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    setForm((current) => ({
      ...current,
      creator_name: user?.name || '',
      organization_name: user?.organization_name || user?.name || '',
      contact_phone: user?.phone || '',
      contact_email: user?.email || '',
    }));
  }, [isEditMode, user]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location_code: current.pin_code.trim(),
      event_id: buildEventId(current.pin_code, eventRandomSuffix),
    }));
  }, [eventRandomSuffix, form.pin_code]);

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

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);

        updateField('proposed_latitude', latitude);
        updateField('proposed_longitude', longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: 'application/json',
              },
            }
          );
          const data = await response.json();
          const postCode = String(data?.address?.postcode || '').replace(/\D/g, '').slice(0, 6);

          if (postCode) {
            setForm((current) => ({
              ...current,
              pin_code: postCode,
              location: current.location || data?.display_name || '',
            }));
            showToast('Location enabled. PIN code captured from your current location.', 'success');
          } else {
            showToast('Location found, but PIN code could not be detected. Please enter it manually.', 'error');
          }
        } catch (fetchError) {
          console.error('CreateEvent reverse geocode failed:', fetchError);
          showToast('Location captured, but PIN code lookup failed. Please enter it manually.', 'error');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error('CreateEvent getLocation failed:', err);
        setLocationLoading(false);
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
    const trimmedPinCode = form.pin_code.trim();
    const trimmedLocation = form.location.trim();
    const trimmedSpecies = form.tree_species.trim();
    const trimmedClimateZone = form.climate_zone.trim();
    const trimmedMaintenancePlan = form.maintenance_plan.trim();
    const trimmedCreatorName = form.creator_name.trim();
    const trimmedOrganizationName = form.organization_name.trim();
    const trimmedContactPhone = form.contact_phone.trim();
    const trimmedContactEmail = form.contact_email.trim();
    const trimmedDescription = form.description.trim();
    const parsedBudget = Number(form.budget);
    const parsedExpectedVolunteers = Number(form.expected_volunteers);
    const eventDate = new Date(form.date_time);

    if (!/^\d{6}$/.test(trimmedPinCode)) {
      const message = 'PIN code must be exactly 6 digits.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!/^\d{6}-\d{16}$/.test(form.event_id) || !form.event_id.startsWith(`${trimmedPinCode}-`)) {
      const message = 'Event ID must match the current PIN code and include a 16-digit unique ID.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    const normalizedLocationCode = form.location_code.trim();

    if (normalizedLocationCode !== trimmedPinCode) {
      const message = 'Location code must match the current PIN code.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!form.date_time || !Number.isInteger(treeCount) || treeCount <= 0) {
      const message = 'Event date and valid tree count are required.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (Number.isNaN(eventDate.getTime()) || eventDate <= new Date()) {
      const message = 'Event date must be a valid future date and time.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (
      !trimmedLocation ||
      !trimmedSpecies ||
      !trimmedClimateZone ||
      !trimmedMaintenancePlan ||
      !trimmedCreatorName ||
      !trimmedOrganizationName ||
      !trimmedContactPhone ||
      !trimmedContactEmail ||
      !trimmedDescription
    ) {
      const message = 'Please fill all required event fields.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      const message = 'Sponsorship budget must be a valid non-negative amount.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!Number.isInteger(parsedExpectedVolunteers) || parsedExpectedVolunteers < 0) {
      const message = 'Expected volunteers must be a valid non-negative whole number.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(trimmedContactEmail)) {
      const message = 'Please enter a valid contact email address.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (!PHONE_REGEX.test(trimmedContactPhone)) {
      const message = 'Please enter a valid contact phone number.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    if (form.land_allocation_status === 'ALLOCATED' && !form.selected_land_id) {
      const message = 'Please select the allocated land.';
      setError(message);
      showToast(message, 'error');
      setLoading(false);
      return;
    }

    const payload = {
      event_id: form.event_id,
      pin_code: trimmedPinCode,
      location_code: normalizedLocationCode,
      location: trimmedLocation,
      role: form.role,
      budget: parsedBudget,
      tree_count: treeCount,
      tree_species: trimmedSpecies,
      date_time: form.date_time,
      land_id: form.land_allocation_status === 'ALLOCATED' ? form.selected_land_id || null : null,
      land_allocation_status: form.land_allocation_status,
      proposed_land:
        form.land_allocation_status === 'ALLOCATED'
          ? {
              latitude: selectedLand?.latitude ?? parseOptionalNumber(form.proposed_latitude),
              longitude: selectedLand?.longitude ?? parseOptionalNumber(form.proposed_longitude),
              area_sqft: selectedLand?.area_sqft ?? parseOptionalNumber(form.proposed_area_sqft),
              address: selectedLand?.address || form.location,
            }
          : {
              latitude: parseOptionalNumber(form.proposed_latitude),
              longitude: parseOptionalNumber(form.proposed_longitude),
              area_sqft: parseOptionalNumber(form.proposed_area_sqft),
              address: form.location,
            },
      land_support_options: form.land_support_options,
      land_support_other: form.land_support_other,
      can_run_without_sponsorship: form.can_run_without_sponsorship,
      expected_volunteers: parsedExpectedVolunteers,
      maintenance_plan: trimmedMaintenancePlan,
      media_coverage: form.media_coverage,
      social_media_handles: Array.from(
        new Set(
          form.social_media_handles
        .split(',')
        .map((item) => item.trim())
            .filter(Boolean)
        )
      ),
      contact_person: {
        name: trimmedCreatorName,
        organization: trimmedOrganizationName,
        phone: trimmedContactPhone,
        email: trimmedContactEmail,
      },
      approval_mode: form.approval_mode,
      initiation_type: form.initiation_type,
      description: trimmedDescription,
      climate_zone: trimmedClimateZone,
      labor_goal: parsedExpectedVolunteers,
      funding_goal: parsedBudget,
      procurement_status: 'PLANNED',
    };

    try {
      if (isEditMode) {
        await api.put(`/events/${id}`, payload);
        showToast(`Event ${form.event_id} updated successfully.`, 'success');
      } else {
        await api.post('/events', payload);
        showToast(`Event ${form.event_id} created successfully.`, 'success');
      }
      navigate('/my-events');
    } catch (err) {
      console.error('CreateEvent handleSubmit failed:', err);
      const message = err.response?.data?.message || (isEditMode ? 'Failed to update event.' : 'Failed to create event.');
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
          <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '24px' : '32px' }}>
            {isEditMode ? 'Edit Tree Plantation Event' : 'Tree Plantation Event Creation Form'}
          </h2>
          <p style={{ margin: '8px 0 24px', color: '#52796f', lineHeight: 1.6 }}>
            Fill the complete event setup and submit when your plantation plan is ready.
          </p>

          {eventLoading ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: '#52796f' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
              Loading event details...
            </div>
          ) : (
            <>
          {error && (
            <div style={{ marginBottom: '16px', background: '#fff1f2', color: '#be123c', padding: '14px 16px', borderRadius: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>PIN Code</label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '12px', alignItems: 'end' }}>
                  <input
                    value={form.pin_code}
                    onChange={(e) => updateField('pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit PIN code"
                    style={fieldStyle}
                    required
                  />
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={locationLoading}
                    style={{
                      ...fieldStyle,
                      width: isMobile ? '100%' : '220px',
                      background: '#163126',
                      color: 'white',
                      border: 'none',
                      cursor: locationLoading ? 'not-allowed' : 'pointer',
                      opacity: locationLoading ? 0.7 : 1,
                    }}
                  >
                    {locationLoading ? 'Detecting...' : 'Use Current Location'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Location Code</label>
                <input value={form.location_code} readOnly style={fieldStyle} required />
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
                <input type="number" value={form.budget} onChange={(e) => updateField('budget', e.target.value)} placeholder="₹ amount" style={fieldStyle} required />
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
                  <select value={form.selected_land_id} onChange={(e) => updateField('selected_land_id', e.target.value)} style={fieldStyle} required>
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
                <input type="datetime-local" value={form.date_time} onChange={(e) => updateField('date_time', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Expected Volunteers</label>
                <input type="number" value={form.expected_volunteers} onChange={(e) => updateField('expected_volunteers', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Climate / Area Hint</label>
                <input value={form.climate_zone} onChange={(e) => updateField('climate_zone', e.target.value)} placeholder="Dry, humid, semi-arid..." style={fieldStyle} required />
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
              <input value={form.tree_species} onChange={(e) => updateField('tree_species', e.target.value)} placeholder="Neem, Pongamia, Tamarind..." style={fieldStyle} required />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Maintenance Plan</label>
              <textarea value={form.maintenance_plan} onChange={(e) => updateField('maintenance_plan', e.target.value)} style={{ ...fieldStyle, minHeight: '90px', resize: 'vertical' }} required />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Social Media Handles</label>
              <input value={form.social_media_handles} onChange={(e) => updateField('social_media_handles', e.target.value)} placeholder="@handle1, @handle2" style={fieldStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event Creator Name</label>
                <input value={form.creator_name} onChange={(e) => updateField('creator_name', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Event Organization</label>
                <input value={form.organization_name} onChange={(e) => updateField('organization_name', e.target.value)} style={fieldStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Contact Phone</label>
                <input value={form.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} style={fieldStyle} required />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Contact Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} style={fieldStyle} required />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#163126' }}>Additional Information</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} style={{ ...fieldStyle, minHeight: '110px', resize: 'vertical' }} required />
            </div>

            <button
              type="submit"
              disabled={loading || eventLoading}
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
              {loading ? (isEditMode ? 'Saving Event...' : 'Creating Event...') : (isEditMode ? 'Save Event Changes' : 'Create Event')}
            </button>
          </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CreateEvent;
