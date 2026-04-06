import { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import { useResponsive } from '../hooks/useResponsive';

const cardStyle = {
  background: 'white',
  borderRadius: '24px',
  padding: '22px',
  border: '1px solid #e7f2ea',
  boxShadow: '0 18px 45px rgba(15, 47, 36, 0.06)',
};

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useResponsive();

  const loadData = useCallback(async () => {
    try {
      const [dashboardRes, usersRes, reportsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
      ]);
      setDashboard(dashboardRes.data);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error('AdminDashboard loadData failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: isMobile ? 'block' : 'flex', minHeight: '100vh', background: '#f4fbf6', fontFamily: "'Segoe UI', sans-serif" }}>
        <Sidebar />
        <main style={{ marginLeft: isMobile ? 0 : isTablet ? '240px' : '280px', width: isMobile ? '100%' : `calc(100% - ${isTablet ? '240px' : '280px'})`, padding: isMobile ? '18px' : '34px' }}>
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#52796f' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Loading admin workspace...
          </div>
        </main>
      </div>
    );
  }

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
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>
            Admin Command Center
          </div>
          <h1 style={{ margin: '10px 0 0', fontSize: isMobile ? '28px' : '42px', lineHeight: 1.08 }}>Manage volunteers, sponsors, organizations, landowners, and plantation impact in one place.</h1>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: '14px', marginTop: '24px' }}>
            {[
              ['Users', dashboard?.stats?.users || 0],
              ['Events', dashboard?.stats?.events || 0],
              ['Trees', dashboard?.stats?.trees || 0],
              ['Donations', `₹${dashboard?.stats?.total_donations || 0}`],
              ['Volunteer Hrs', dashboard?.stats?.volunteer_hours || 0],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: isMobile ? '14px' : '18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px' }}>{label}</div>
                <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: '22px', marginTop: '24px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '22px' : '26px' }}>User Management</h2>
            <p style={{ margin: '8px 0 18px', color: '#52796f' }}>All user types across the platform.</p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {users.slice(0, 10).map((user) => (
                <div
                  key={user._id || user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
                    gap: '12px',
                    alignItems: 'center',
                    background: '#f5fbf7',
                    borderRadius: '18px',
                    padding: '14px 16px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#163126' }}>{user.organization_name || user.name}</div>
                    <div style={{ color: '#52796f', fontSize: '13px' }}>{user.email}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#2d6a4f' }}>{user.role}</div>
                  <div style={{ fontWeight: 700, color: user.is_active ? '#166534' : '#b91c1c' }}>
                    {user.account_type} · {user.is_active ? 'Active' : 'Disabled'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '22px' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '20px' : '24px' }}>Platform Mix</h2>
              <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                {[
                  ['Volunteers', dashboard?.stats?.volunteers || 0],
                  ['Sponsors', dashboard?.stats?.sponsors || 0],
                  ['Landowners', dashboard?.stats?.landowners || 0],
                  ['Organizations', dashboard?.stats?.organizations || 0],
                  ['Healthy Trees', dashboard?.stats?.healthy_trees || 0],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', background: '#f5fbf7', borderRadius: '16px', padding: '14px 16px' }}>
                    <span style={{ color: '#52796f' }}>{label}</span>
                    <strong style={{ color: '#163126' }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: 0, color: '#163126', fontSize: isMobile ? '20px' : '24px' }}>Report Snapshot</h2>
              <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                <div style={{ background: '#f5fbf7', borderRadius: '16px', padding: '14px 16px' }}>
                  <div style={{ color: '#52796f', fontSize: '13px' }}>Donation impact entries</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#163126', marginTop: '6px' }}>{reports?.donationImpact?.length || 0}</div>
                </div>
                <div style={{ background: '#f5fbf7', borderRadius: '16px', padding: '14px 16px' }}>
                  <div style={{ color: '#52796f', fontSize: '13px' }}>Tree monitoring records</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#163126', marginTop: '6px' }}>{reports?.treeImpact?.length || 0}</div>
                </div>
                <div style={{ background: '#f5fbf7', borderRadius: '16px', padding: '14px 16px' }}>
                  <div style={{ color: '#52796f', fontSize: '13px' }}>Event progress lines</div>
                  <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#163126', marginTop: '6px' }}>{reports?.eventProgress?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
