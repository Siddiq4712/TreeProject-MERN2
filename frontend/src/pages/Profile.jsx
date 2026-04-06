import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/auth-context';
import { ToastContext } from '../context/toast-context';
import { useResponsive } from '../hooks/useResponsive';

const sectionCard = {
  background: 'white',
  borderRadius: '26px',
  padding: '24px',
  border: '1px solid #e8f3eb',
  boxShadow: '0 18px 50px rgba(15, 47, 36, 0.06)',
};

const EmptyBlock = ({ title }) => (
  <div
    style={{
      background: '#f5fbf7',
      borderRadius: '18px',
      padding: '22px',
      textAlign: 'center',
      color: '#52796f',
      border: '1px dashed #cfe5d7',
    }}
  >
    {title}
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
    } catch (error) {
      console.error('Profile loadProfile failed:', error);
      showToast(error.response?.data?.message || 'Unable to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const displayUser = profile?.user || user;

  return (
    <div style={{ display: isMobile ? 'block' : 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #f4fbf6 0%, #edf6f0 100%)', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar />

      <main style={{ marginLeft: isMobile ? 0 : isTablet ? '240px' : '280px', width: isMobile ? '100%' : `calc(100% - ${isTablet ? '240px' : '280px'})`, padding: isMobile ? '18px' : '30px 34px 40px' }}>
        <section
          style={{
            borderRadius: '30px',
            padding: isMobile ? '20px' : '32px',
            color: 'white',
            background:
              'radial-gradient(circle at top right, rgba(187,247,208,0.42), transparent 24%), linear-gradient(135deg, #081c15 0%, #1b4332 45%, #2d6a4f 100%)',
            boxShadow: '0 28px 70px rgba(12, 35, 24, 0.14)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '760px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>
                Profile
              </div>
              <h1 style={{ margin: '10px 0 0', fontSize: isMobile ? '28px' : '42px', lineHeight: 1.08 }}>
                {displayUser?.organization_name || displayUser?.name || 'User Profile'}
              </h1>
              <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: isMobile ? '14px' : '17px' }}>
                See your role, details, engaged events, tracked trees, land portfolio, and account activity in one place.
              </p>
            </div>

            <div
              style={{
                minWidth: '260px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                padding: '18px',
              }}
            >
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.68)' }}>
                Account Summary
              </div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, marginTop: '10px' }}>{displayUser?.role || 'Member'}</div>
              <div style={{ marginTop: '4px', color: '#bbf7d0' }}>{displayUser?.account_type || 'Individual'}</div>
              <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.72)' }}>
                Karma · {displayUser?.karma_points || 0}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#52796f' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Loading profile...
          </div>
        ) : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.95fr 1.05fr', gap: '22px', marginTop: '24px' }}>
              <div style={sectionCard}>
                <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>User Details</h2>
                <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                  {[
                    ['Name', displayUser?.name || 'Not available'],
                    ['Organization', displayUser?.organization_name || 'No organization'],
                    ['Email', displayUser?.email || 'Not available'],
                    ['Phone', displayUser?.phone || 'Not available'],
                    ['Role', displayUser?.role || 'Not available'],
                    ['Account Type', displayUser?.account_type || 'Not available'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', background: '#f5fbf7', borderRadius: '18px', padding: '14px 16px' }}>
                      <span style={{ color: '#52796f' }}>{label}</span>
                      <strong style={{ color: '#163126', textAlign: 'right' }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={sectionCard}>
                <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>Engagement Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
                  {[
                    ['Engaged Events', profile?.stats?.engaged_events || 0],
                    ['Created Events', profile?.stats?.created_events || 0],
                    ['Trees', profile?.stats?.trees || 0],
                    ['Land Records', profile?.stats?.lands || 0],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '18px 14px', textAlign: 'center' }}>
                      <div style={{ color: '#52796f', fontSize: '12px' }}>{label}</div>
                      <div style={{ marginTop: '8px', fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: '#163126' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '22px', marginTop: '24px' }}>
              <div style={sectionCard}>
                <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>Events Engaged With</h2>
                <p style={{ margin: '8px 0 18px', color: '#52796f' }}>Events you created or joined.</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {profile?.engaged_events?.length ? (
                    profile.engaged_events.map((event) => (
                      <div key={`${event._id || event.id || event.event_id}`} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#163126' }}>{event.location || event.event_id}</div>
                        <div style={{ color: '#52796f', fontSize: '13px', marginTop: '4px' }}>
                          {event.event_id} · {event.current_phase || 'Pending'}
                        </div>
                        <div style={{ color: '#35584a', fontSize: '13px', marginTop: '6px' }}>
                          Date: {formatDate(event.date_time)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyBlock title="No data found" />
                  )}
                </div>
              </div>

              <div style={sectionCard}>
                <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>Trees</h2>
                <p style={{ margin: '8px 0 18px', color: '#52796f' }}>Trees you planted or sponsored.</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {profile?.trees?.length ? (
                    profile.trees.map((tree) => (
                      <div key={tree._id || tree.id || tree.tree_id} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#163126' }}>{tree.species}</div>
                        <div style={{ color: '#52796f', fontSize: '13px', marginTop: '4px' }}>
                          {tree.tree_id} · {tree.status} · {tree.survival_status}
                        </div>
                        <div style={{ color: '#35584a', fontSize: '13px', marginTop: '6px' }}>
                          {tree.land_id?.name || tree.event_id?.location || 'No land or event linked'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyBlock title="No data found" />
                  )}
                </div>
              </div>
            </section>

            <section style={{ marginTop: '24px' }}>
              <div style={sectionCard}>
                <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>Land</h2>
                <p style={{ margin: '8px 0 18px', color: '#52796f' }}>Land records owned or managed by this user.</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {profile?.lands?.length ? (
                    profile.lands.map((land) => (
                      <div key={land._id || land.id} style={{ background: '#f5fbf7', borderRadius: '18px', padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#163126' }}>{land.name}</div>
                        <div style={{ color: '#52796f', fontSize: '13px', marginTop: '4px' }}>
                          {land.address} · {land.land_type} · {land.status}
                        </div>
                        <div style={{ color: '#35584a', fontSize: '13px', marginTop: '6px' }}>
                          Trees: {land.total_trees_planted || 0} · Events: {land.total_events_hosted || 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyBlock title="No data found" />
                  )}
                </div>
              </div>
            </section>

            <section style={{ marginTop: '24px' }}>
              <div style={{ ...sectionCard, padding: '28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '18px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>Account Actions</h2>
                  <p style={{ margin: '8px 0 0', color: '#52796f' }}>Use logout when you are done working in the platform.</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    border: 'none',
                    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                    color: 'white',
                    borderRadius: '18px',
                    padding: '14px 22px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <i className="fas fa-sign-out-alt" style={{ marginRight: '10px' }}></i>
                  Logout
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
