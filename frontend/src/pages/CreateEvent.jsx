import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CreateEvent = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [eventID, setEventID] = useState('TN 69 - Loading...');
  const [eventLoc, setEventLoc] = useState('KOVILPATTAI New Busstand');
  const [role, setRole] = useState('Volunteer');
  const [budget, setBudget] = useState('');
  const [treeCount, setTreeCount] = useState('100');
  const [landAllocated, setLandAllocated] = useState('NO');
  const [latlong, setLatlong] = useState('');
  const [area, setArea] = useState('');
  const [noLandOptions, setNoLandOptions] = useState([]);
  const [noSponsorOk, setNoSponsorOk] = useState('YES');
  const [eventDateTime, setEventDateTime] = useState('');
  const [treeSpecies, setTreeSpecies] = useState('');
  const [maintenancePlan, setMaintenancePlan] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState('');
  const [initiationType, setInitiationType] = useState('Volunteer-Led');
  const [fundingGoal, setFundingGoal] = useState('');
  const [laborGoal, setLaborGoal] = useState('');

  // Helper to get ID (handles both MongoDB _id and SQL id)
  const getId = (item) => item?._id || item?.id;

  useEffect(() => {
    const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000);
    setEventID(`TN 69 - ${random10Digit}`);
    const fetchLands = async () => {
      try {
        const res = await api.get('/lands/mine');
        setLands(res.data);
      } catch (err) { console.error(err); }
    };
    fetchLands();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLatlong(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => alert('Unable to retrieve location.')
      );
    } else alert('Geolocation not supported by browser.');
  };

  const handleNoLandChange = (e) => {
    const value = e.target.value;
    e.target.checked
      ? setNoLandOptions([...noLandOptions, value])
      : setNoLandOptions(noLandOptions.filter((opt) => opt !== value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!eventDateTime) { setError('Please select an Event Date and Time'); setLoading(false); return; }
    if (!agreeTerms) { setError('You must agree to the Terms & Conditions'); setLoading(false); return; }
    try {
      const payload = {
        event_id: eventID,
        location: eventLoc,
        date_time: eventDateTime,
        tree_count: parseInt(treeCount === 'Other' ? 0 : treeCount, 10),
        tree_species: treeSpecies || 'Mixed Trees',
        budget: budget ? parseFloat(budget) : 0,
        role,
        land_id: selectedLandId || null,
        initiation_type: initiationType,
        funding_goal: fundingGoal ? parseFloat(fundingGoal) : null,
        labor_goal: laborGoal ? parseInt(laborGoal) : null,
      };
      await api.post('/events', payload);
      alert(`✅ Success! Event ${eventID} has been created.\n\nOther users can now see this event on their dashboard!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
          --g950: #052e16;
          --g900: #14532d;
          --g800: #166534;
          --g700: #15803d;
          --g600: #16a34a;
          --g500: #22c55e;
          --g400: #4ade80;
          --g300: #86efac;
          --g200: #bbf7d0;
          --g100: #dcfce7;
          --g50:  #f0fdf4;
          --white: #ffffff;
          --slate50:  #f8fafc;
          --slate100: #f1f5f9;
          --slate200: #e2e8f0;
          --slate300: #cbd5e1;
          --slate400: #94a3b8;
          --slate500: #64748b;
          --slate600: #475569;
          --slate700: #334155;
          --slate800: #1e293b;
          --r-sm: 10px;
          --r-md: 14px;
          --r-lg: 18px;
          --r-xl: 24px;
        }

        /* ═══════════ PAGE ═══════════ */
        .ce-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: var(--slate100);
          min-height: 100vh;
          padding-bottom: 120px;
          color: var(--slate800);
        }

        /* ═══════════ TOP BAR ═══════════ */
        .ce-topbar {
          background: var(--white);
          border-bottom: 3px solid var(--g200);
          padding: 0 36px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 300;
          box-shadow: 0 4px 20px rgba(21,128,61,.08);
        }
        .ce-topbar-left { display: flex; align-items: center; gap: 20px; }

        .ce-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--g50); border: 2px solid var(--g200);
          color: var(--g800); padding: 10px 20px; border-radius: 50px;
          cursor: pointer; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px; font-weight: 600;
          transition: all .22s; white-space: nowrap;
        }
        .ce-back-btn:hover {
          background: var(--g700); border-color: var(--g700);
          color: white; box-shadow: 0 4px 14px rgba(21,128,61,.3);
          transform: translateX(-2px);
        }

        .ce-topbar-brand {
          font-size: 22px; font-weight: 700;
          color: var(--g800); letter-spacing: -.3px;
          display: flex; align-items: center; gap: 8px;
        }
        .ce-topbar-brand span { font-weight: 400; color: var(--slate400); font-size: 18px; }

        .ce-topbar-right { display: flex; align-items: center; gap: 12px; }
        .ce-id-badge {
          background: linear-gradient(135deg, var(--g800), var(--g950));
          color: white; padding: 8px 18px; border-radius: 50px;
          font-size: 12px; font-weight: 700; letter-spacing: .8px;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 14px rgba(21,128,61,.35);
        }
        .ce-live { width: 8px; height: 8px; background: var(--g400); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }

        /* ═══════════ SHELL ═══════════ */
        .ce-shell {
          max-width: 1160px;
          margin: 0 auto;
          padding: 36px 32px 0;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 28px;
          align-items: start;
        }

        /* ═══════════ SIDEBAR ═══════════ */
        .ce-sidebar {
          position: sticky;
          top: 90px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ce-sid-hero {
          background: linear-gradient(160deg, var(--g700) 0%, var(--g950) 100%);
          border-radius: var(--r-xl);
          padding: 28px 24px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(21,128,61,.3);
        }
        .ce-sid-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Ccircle cx='30' cy='30' r='20' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='10' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: .5;
        }
        .ce-sid-hero::after {
          content: '🌿'; position: absolute;
          font-size: 90px; right: -18px; bottom: -18px; opacity: .12;
        }
        .ce-sid-label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px;
          opacity: .6; font-weight: 600; margin-bottom: 10px; position: relative;
        }
        .ce-sid-id {
          font-size: 14px; font-weight: 700; line-height: 1.5;
          word-break: break-all; position: relative;
          display: flex; align-items: flex-start; gap: 8px;
        }

        .ce-sid-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .ce-stat {
          background: var(--white);
          border: 2px solid var(--g100);
          border-radius: var(--r-md);
          padding: 14px;
          text-align: center;
        }
        .ce-stat-val {
          font-size: 24px; font-weight: 800; color: var(--g700); line-height: 1;
        }
        .ce-stat-key {
          font-size: 11px; color: var(--slate400); margin-top: 4px; font-weight: 500;
        }

        .ce-nav {
          background: var(--white);
          border: 2px solid var(--slate200);
          border-radius: var(--r-lg);
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,.04);
        }
        .ce-nav-head {
          padding: 12px 18px 10px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          color: var(--slate400); text-transform: uppercase;
          border-bottom: 1px solid var(--slate100);
          background: var(--slate50);
        }
        .ce-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px;
          font-size: 14px; font-weight: 500; color: var(--slate500);
          border-bottom: 1px solid var(--slate100);
          cursor: pointer; text-decoration: none;
          transition: all .18s;
        }
        .ce-nav-item:last-child { border-bottom: none; }
        .ce-nav-item:hover { background: var(--g50); color: var(--g700); padding-left: 22px; }
        .ce-nav-ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--slate100);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0; transition: background .18s;
        }
        .ce-nav-item:hover .ce-nav-ico { background: var(--g100); }

        /* ═══════════ MAIN ═══════════ */
        .ce-main { min-width: 0; }

        /* ═══════════ SECTION CARD ═══════════ */
        .ce-card {
          background: var(--white);
          border: 2px solid var(--slate200);
          border-radius: var(--r-xl);
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,.05);
          overflow: hidden;
          transition: box-shadow .2s;
        }
        .ce-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); }

        .ce-card-head {
          display: flex; align-items: center; gap: 16px;
          padding: 22px 28px;
          border-bottom: 2px solid var(--slate100);
          background: linear-gradient(to right, var(--g50) 0%, white 70%);
          position: relative;
        }
        .ce-card-head::after {
          content: ''; position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px; background: linear-gradient(to bottom, var(--g500), var(--g700));
          border-radius: 0 0 0 0;
        }
        .ce-card-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: var(--g100);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
          border: 2px solid var(--g200);
        }
        .ce-card-title {
          font-size: 18px; font-weight: 700; color: var(--g900); letter-spacing: -.2px;
        }
        .ce-card-sub { font-size: 13px; color: var(--slate400); margin-top: 2px; }

        /* ═══════════ FIELD ROW ═══════════ */
        .ce-row {
          display: grid;
          grid-template-columns: 220px 1fr;
          border-bottom: 1px solid var(--slate100);
        }
        .ce-row:last-child { border-bottom: none; }

        .ce-row-lhs {
          padding: 20px 24px;
          border-right: 2px solid var(--slate100);
          background: var(--slate50);
          display: flex; flex-direction: column; justify-content: center;
        }
        .ce-row-label {
          font-size: 13px; font-weight: 700; color: var(--slate700);
          line-height: 1.4; letter-spacing: .1px;
        }
        .ce-row-hint { font-size: 12px; color: var(--slate400); margin-top: 4px; line-height: 1.45; }
        .ce-req { color: #ef4444; margin-left: 2px; font-size: 15px; }

        .ce-row-rhs {
          padding: 18px 24px;
          display: flex; flex-direction: column; justify-content: center;
        }

        /* ═══════════ INPUTS ═══════════ */
        .ce-input, .ce-select, .ce-textarea {
          width: 100%;
          background: var(--white);
          border: 2px solid var(--slate200);
          border-radius: var(--r-sm);
          padding: 13px 16px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 15px; color: var(--slate800);
          outline: none;
          transition: border .2s, box-shadow .2s, background .2s;
          appearance: none; -webkit-appearance: none;
        }
        .ce-input::placeholder, .ce-textarea::placeholder { color: var(--slate300); }
        .ce-input:hover, .ce-select:hover, .ce-textarea:hover { border-color: var(--g300); }
        .ce-input:focus, .ce-select:focus, .ce-textarea:focus {
          border-color: var(--g500);
          box-shadow: 0 0 0 4px rgba(34,197,94,.14);
          background: var(--g50);
        }
        .ce-sel-wrap { position: relative; }
        .ce-sel-wrap::after {
          content: '▾'; position: absolute;
          right: 14px; top: 50%; transform: translateY(-50%);
          color: var(--g600); pointer-events: none; font-size: 16px; font-weight: bold;
        }
        .ce-textarea { resize: vertical; min-height: 96px; line-height: 1.65; }

        .ce-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ═══════════ PILLS ═══════════ */
        .ce-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .ce-pills input[type="radio"] { display: none; }
        .ce-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 20px;
          border: 2px solid var(--slate200); border-radius: 50px;
          cursor: pointer; font-size: 14px; font-weight: 600;
          color: var(--slate500); background: var(--white);
          transition: all .2s; white-space: nowrap; user-select: none;
        }
        .ce-pill:hover { border-color: var(--g400); color: var(--g700); background: var(--g50); transform: translateY(-1px); }
        .ce-pills input[type="radio"]:checked + .ce-pill {
          background: linear-gradient(135deg, var(--g600), var(--g800));
          border-color: transparent; color: white;
          box-shadow: 0 4px 14px rgba(21,128,61,.35);
          transform: translateY(-1px);
        }

        /* ═══════════ HINT STRIP ═══════════ */
        .ce-hint {
          margin-top: 10px; padding: 10px 16px;
          background: var(--g50); border-left: 4px solid var(--g400);
          border-radius: 0 var(--r-sm) var(--r-sm) 0;
          font-size: 13px; color: var(--g800); line-height: 1.5;
        }

        /* ═══════════ CHECKBOXES ═══════════ */
        .ce-checks { display: flex; flex-direction: column; gap: 10px; }
        .ce-check {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px;
          border: 2px solid var(--slate200); border-radius: var(--r-sm);
          cursor: pointer; font-size: 14px; color: var(--slate600);
          background: var(--white); transition: all .18s; user-select: none;
        }
        .ce-check:hover { border-color: var(--g400); color: var(--g800); background: var(--g50); transform: translateX(3px); }
        .ce-check input[type="checkbox"] {
          width: 18px; height: 18px; accent-color: var(--g600);
          cursor: pointer; flex-shrink: 0;
        }

        /* Geo btn */
        .ce-geo {
          margin-top: 10px; display: inline-flex; align-items: center; gap: 7px;
          background: var(--slate100); border: 2px solid var(--slate200);
          color: var(--slate600); padding: 9px 16px; border-radius: var(--r-sm);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s;
        }
        .ce-geo:hover { background: var(--g50); border-color: var(--g300); color: var(--g700); }

        /* ═══════════ ERROR ═══════════ */
        .ce-error {
          display: flex; align-items: center; gap: 12px;
          background: #fef2f2; border: 2px solid #fecaca;
          color: #991b1b; padding: 16px 20px;
          border-radius: var(--r-md); margin-bottom: 24px; font-size: 14px; font-weight: 500;
        }

        /* ═══════════ ACTION BAR ═══════════ */
        .ce-actionbar {
          position: sticky; bottom: 24px;
          background: var(--white);
          border: 2px solid var(--slate200);
          border-radius: var(--r-xl);
          padding: 22px 28px;
          box-shadow: 0 12px 48px rgba(0,0,0,.12), 0 0 0 1px rgba(22,163,74,.08) inset;
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
          margin-top: 8px;
        }
        .ce-terms-wrap {
          flex: 1; min-width: 260px;
          display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
        }
        .ce-terms-wrap input[type="checkbox"] {
          width: 20px; height: 20px; accent-color: var(--g600);
          cursor: pointer; flex-shrink: 0; margin-top: 2px;
        }
        .ce-terms-text { font-size: 13px; color: var(--slate500); line-height: 1.6; }
        .ce-terms-text strong { color: var(--g700); font-weight: 700; }

        .ce-submit {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, var(--g600) 0%, var(--g800) 100%);
          color: white; border: none; border-radius: var(--r-md);
          padding: 16px 36px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 16px; font-weight: 700; cursor: pointer;
          transition: all .25s; white-space: nowrap;
          box-shadow: 0 6px 20px rgba(21,128,61,.4);
          letter-spacing: .2px;
        }
        .ce-submit:not(:disabled):hover {
          background: linear-gradient(135deg, var(--g500) 0%, var(--g700) 100%);
          box-shadow: 0 10px 30px rgba(21,128,61,.5);
          transform: translateY(-2px);
        }
        .ce-submit:not(:disabled):active { transform: translateY(0); }
        .ce-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .ce-spin {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,.3);
          border-top-color: white; border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        /* ═══════════════════════
           TABLET  ≤ 900px
        ═══════════════════════ */
        @media (max-width: 900px) {
          .ce-shell { grid-template-columns: 1fr; padding: 24px 20px 0; gap: 22px; }
          .ce-sidebar { position: static; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .ce-sid-hero { grid-column: 1 / -1; }
          .ce-sid-stats { display: none; }
          .ce-nav { grid-column: 1 / -1; }
          .ce-topbar { padding: 0 20px; }
          .ce-row { grid-template-columns: 180px 1fr; }
          .ce-actionbar { bottom: 16px; padding: 18px 22px; }
        }

        /* ═══════════════════════
           MOBILE  ≤ 600px
        ═══════════════════════ */
        @media (max-width: 600px) {
          .ce-topbar { padding: 0 14px; height: 60px; }
          .ce-topbar-brand { font-size: 17px; }
          .ce-id-badge { display: none; }
          .ce-back-btn { padding: 8px 14px; font-size: 13px; }

          .ce-shell { padding: 16px 12px 0; gap: 16px; }
          .ce-sidebar { grid-template-columns: 1fr; }
          .ce-nav { display: none; }

          .ce-row { grid-template-columns: 1fr; }
          .ce-row-lhs {
            border-right: none; border-bottom: 1px solid var(--slate100);
            padding: 14px 18px 10px;
          }
          .ce-row-rhs { padding: 14px 18px; }

          .ce-card-head { padding: 18px 18px; }
          .ce-card-title { font-size: 16px; }
          .ce-card-head::after { width: 4px; }

          .ce-split { grid-template-columns: 1fr; gap: 10px; }

          .ce-actionbar {
            bottom: 12px; border-radius: var(--r-lg);
            flex-direction: column; align-items: stretch; gap: 14px;
            padding: 16px 18px;
          }
          .ce-terms-wrap { min-width: 0; }
          .ce-submit { width: 100%; padding: 16px; font-size: 16px; justify-content: center; }
          .ce-pills { gap: 8px; }
          .ce-pill { padding: 10px 16px; font-size: 13px; }
        }
      `}</style>

      <div className="ce-page">

        {/* TOP BAR */}
        <header className="ce-topbar">
          <div className="ce-topbar-left">
            <button className="ce-back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <div className="ce-topbar-brand">
              🌿 Create Event <span>/ Plantation Drive</span>
            </div>
          </div>
          <div className="ce-topbar-right">
            <div className="ce-id-badge">
              <span className="ce-live" />
              {eventID}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="ce-shell">

            {/* ══ SIDEBAR ══ */}
            <aside className="ce-sidebar">

              <div className="ce-sid-hero">
                <div className="ce-sid-label">Auto-Generated Event ID</div>
                <div className="ce-sid-id">
                  <span className="ce-live" style={{marginTop:'6px',flexShrink:0}} />
                  {eventID}
                </div>
              </div>

              <div className="ce-sid-stats">
                <div className="ce-stat">
                  <div className="ce-stat-val">🌱</div>
                  <div className="ce-stat-key">New Event</div>
                </div>
                <div className="ce-stat">
                  <div className="ce-stat-val" style={{color:'var(--g600)',fontSize:'20px'}}>{treeCount}</div>
                  <div className="ce-stat-key">Trees Planned</div>
                </div>
                <div className="ce-stat" style={{gridColumn:'1/-1'}}>
                  <div className="ce-stat-val" style={{fontSize:'16px',color:'var(--slate600)'}}>📍 {eventLoc.length > 22 ? eventLoc.slice(0,22)+'…' : eventLoc}</div>
                  <div className="ce-stat-key">Event Location</div>
                </div>
              </div>

              <nav className="ce-nav">
                <div className="ce-nav-head">Sections</div>
                {[
                  ['📍','Location','sec-Location'],
                  ['🤝','Participation','sec-Participation'],
                  ['🌍','Land Management','sec-LandManagement'],
                  ['📅','Logistics','sec-Logistics'],
                  ['👤','Contact','sec-Contact'],
                ].map(([ico, label, id]) => (
                  <a key={id} href={`#${id}`} className="ce-nav-item">
                    <span className="ce-nav-ico">{ico}</span>
                    {label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* ══ MAIN ══ */}
            <main className="ce-main">
              {error && <div className="ce-error">⚠️ {error}</div>}

              {/* ─ 1. Location ─ */}
              <div className="ce-card" id="sec-Location">
                <div className="ce-card-head">
                  <span className="ce-card-icon">📍</span>
                  <div>
                    <div className="ce-card-title">Event Location</div>
                    <div className="ce-card-sub">Where will the plantation drive take place?</div>
                  </div>
                </div>
                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Location Name <span className="ce-req">*</span></span>
                    <span className="ce-row-hint">Town, village or landmark</span>
                  </div>
                  <div className="ce-row-rhs">
                    <input className="ce-input" type="text" value={eventLoc}
                      onChange={(e) => setEventLoc(e.target.value)} required
                      placeholder="e.g. KOVILPATTAI New Busstand" />
                  </div>
                </div>
              </div>

              {/* ─ 2. Participation ─ */}
              <div className="ce-card" id="sec-Participation">
                <div className="ce-card-head">
                  <span className="ce-card-icon">🤝</span>
                  <div>
                    <div className="ce-card-title">Participation Details</div>
                    <div className="ce-card-sub">Your role, initiation type, goals and budget</div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Your Primary Role</span>
                    <span className="ce-row-hint">How are you contributing to this event?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-pills">
                      <input type="radio" id="rv" name="role" value="Volunteer" checked={role==='Volunteer'} onChange={(e)=>setRole(e.target.value)} />
                      <label className="ce-pill" htmlFor="rv">🙋 Volunteering</label>
                      <input type="radio" id="rs" name="role" value="Sponsor" checked={role==='Sponsor'} onChange={(e)=>setRole(e.target.value)} />
                      <label className="ce-pill" htmlFor="rs">💰 Sponsoring</label>
                    </div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Initiation Type</span>
                    <span className="ce-row-hint">Who is organizing and leading this event?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-pills">
                      <input type="radio" id="iv" name="initiationType" value="Volunteer-Led" checked={initiationType==='Volunteer-Led'} onChange={(e)=>setInitiationType(e.target.value)} />
                      <label className="ce-pill" htmlFor="iv">🌱 Volunteer-Led</label>
                      <input type="radio" id="is" name="initiationType" value="Sponsor-Led" checked={initiationType==='Sponsor-Led'} onChange={(e)=>setInitiationType(e.target.value)} />
                      <label className="ce-pill" htmlFor="is">🏦 Sponsor-Led</label>
                    </div>
                    <div className="ce-hint">
                      {initiationType==='Volunteer-Led'
                        ? '💡 You have volunteers but need funding for saplings, land, etc.'
                        : '💡 You have funding but need people to help with planting.'}
                    </div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Event Goals</span>
                    <span className="ce-row-hint">Funding target & volunteers required</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-split">
                      <input className="ce-input" type="number" value={fundingGoal} onChange={(e)=>setFundingGoal(e.target.value)} placeholder="₹ Funding goal" />
                      <input className="ce-input" type="number" value={laborGoal} onChange={(e)=>setLaborGoal(e.target.value)} placeholder="No. of volunteers" />
                    </div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Budget & Tree Count</span>
                    <span className="ce-row-hint">Sponsorship amount and number of trees</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-split">
                      <input className="ce-input" type="number" value={budget} onChange={(e)=>setBudget(e.target.value)} placeholder="₹ Sponsorship budget" />
                      <div className="ce-sel-wrap">
                        <select className="ce-select" value={treeCount} onChange={(e)=>setTreeCount(e.target.value)}>
                          <option value="10">10 Trees</option>
                          <option value="100">100 Trees</option>
                          <option value="200">200 Trees</option>
                          <option value="500">500 Trees</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Linked Land</span>
                    <span className="ce-row-hint">Optional — attach a registered plot</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-sel-wrap">
                      <select className="ce-select" value={selectedLandId} onChange={(e)=>setSelectedLandId(e.target.value)}>
                        <option value="">— No specific land / Will add later —</option>
                        {lands.map((land)=>(
                          <option key={getId(land)} value={getId(land)}>
                            {land.name} – {land.address} ({land.area_sqft} sq.ft)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─ 3. Land Management ─ */}
              <div className="ce-card" id="sec-LandManagement">
                <div className="ce-card-head">
                  <span className="ce-card-icon">🌍</span>
                  <div>
                    <div className="ce-card-title">Land Management</div>
                    <div className="ce-card-sub">Plot allocation status and GPS coordinates</div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Land Allocated?</span>
                    <span className="ce-row-hint">Do you have a plot confirmed?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-pills">
                      <input type="radio" id="ly" name="la" value="YES" checked={landAllocated==='YES'} onChange={()=>setLandAllocated('YES')} />
                      <label className="ce-pill" htmlFor="ly">✅ Yes, Allocated</label>
                      <input type="radio" id="ln" name="la" value="NO" checked={landAllocated==='NO'} onChange={()=>setLandAllocated('NO')} />
                      <label className="ce-pill" htmlFor="ln">🔍 Not Yet</label>
                    </div>
                  </div>
                </div>

                {landAllocated==='YES' && (
                  <div className="ce-row">
                    <div className="ce-row-lhs">
                      <span className="ce-row-label">GPS & Area</span>
                      <span className="ce-row-hint">Latitude/longitude & plot size in sq. ft.</span>
                    </div>
                    <div className="ce-row-rhs">
                      <div className="ce-split">
                        <div>
                          <input className="ce-input" type="text" value={latlong} onChange={(e)=>setLatlong(e.target.value)} placeholder="e.g. 9.1711, 77.8741" />
                          <button type="button" onClick={getLocation} className="ce-geo">📍 Use My Location</button>
                        </div>
                        <input className="ce-input" type="number" value={area} onChange={(e)=>setArea(e.target.value)} placeholder="Area (sq. ft.)" />
                      </div>
                    </div>
                  </div>
                )}

                {landAllocated==='NO' && (
                  <div className="ce-row">
                    <div className="ce-row-lhs">
                      <span className="ce-row-label">Volunteer Help Needed</span>
                      <span className="ce-row-hint">What can volunteers assist with?</span>
                    </div>
                    <div className="ce-row-rhs">
                      <div className="ce-checks">
                        {[
                          ['🗺️','Help find suitable land'],
                          ['⛏️','Assist in land preparation (Digging, etc.)'],
                          ['📋','Help with local permissions'],
                        ].map(([ico,val])=>(
                          <label key={val} className="ce-check">
                            <input type="checkbox" value={val} checked={noLandOptions.includes(val)} onChange={handleNoLandChange} />
                            <span>{ico}</span> {val}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─ 4. Logistics ─ */}
              <div className="ce-card" id="sec-Logistics">
                <div className="ce-card-head">
                  <span className="ce-card-icon">📅</span>
                  <div>
                    <div className="ce-card-title">Logistics & Sustainability</div>
                    <div className="ce-card-sub">Date, tree species, and long-term care plan</div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">External Sponsorship</span>
                    <span className="ce-row-hint">Can this event run without sponsors?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-pills">
                      <input type="radio" id="nsy" name="nso" value="YES" checked={noSponsorOk==='YES'} onChange={(e)=>setNoSponsorOk(e.target.value)} />
                      <label className="ce-pill" htmlFor="nsy">✅ Yes, Self-Funded</label>
                      <input type="radio" id="nsn" name="nso" value="NO" checked={noSponsorOk==='NO'} onChange={(e)=>setNoSponsorOk(e.target.value)} />
                      <label className="ce-pill" htmlFor="nsn">🤲 Need Sponsors</label>
                    </div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Event Date & Time <span className="ce-req">*</span></span>
                    <span className="ce-row-hint">When will the planting happen?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <input className="ce-input" type="datetime-local" value={eventDateTime} onChange={(e)=>setEventDateTime(e.target.value)} required />
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Tree Species</span>
                    <span className="ce-row-hint">What species will be planted?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <input className="ce-input" type="text" value={treeSpecies} onChange={(e)=>setTreeSpecies(e.target.value)} placeholder="e.g. Neem, Peepal, Teak, Mango" />
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Maintenance Plan</span>
                    <span className="ce-row-hint">Who waters and protects the saplings?</span>
                  </div>
                  <div className="ce-row-rhs">
                    <textarea className="ce-textarea" rows="3" value={maintenancePlan} onChange={(e)=>setMaintenancePlan(e.target.value)} placeholder="Describe the watering schedule, who's responsible, and how trees will be protected..." />
                  </div>
                </div>
              </div>

              {/* ─ 5. Contact ─ */}
              <div className="ce-card" id="sec-Contact">
                <div className="ce-card-head">
                  <span className="ce-card-icon">👤</span>
                  <div>
                    <div className="ce-card-title">Contact Person Details</div>
                    <div className="ce-card-sub">Who should volunteers and sponsors reach out to?</div>
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Full Name <span className="ce-req">*</span></span>
                    <span className="ce-row-hint">Event organiser's full name</span>
                  </div>
                  <div className="ce-row-rhs">
                    <input className="ce-input" type="text" value={contactName} onChange={(e)=>setContactName(e.target.value)} placeholder="Your full name" required />
                  </div>
                </div>

                <div className="ce-row">
                  <div className="ce-row-lhs">
                    <span className="ce-row-label">Phone & Email <span className="ce-req">*</span></span>
                    <span className="ce-row-hint">Primary contact details</span>
                  </div>
                  <div className="ce-row-rhs">
                    <div className="ce-split">
                      <input className="ce-input" type="text" value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" required />
                      <input className="ce-input" type="email" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─ Sticky Action Bar ─ */}
              <div className="ce-actionbar">
                <label className="ce-terms-wrap">
                  <input type="checkbox" checked={agreeTerms} onChange={(e)=>setAgreeTerms(e.target.checked)} required />
                  <span className="ce-terms-text">
                    I agree to the <strong>Terms & Conditions</strong> and confirm this event complies with all local environmental regulations and guidelines.
                  </span>
                </label>
                <button type="submit" className="ce-submit" disabled={loading}>
                  {loading ? <><div className="ce-spin" /> Creating Event…</> : <>🌿 Create Event &amp; Notify Volunteers</>}
                </button>
              </div>

            </main>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateEvent;