import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { useResponsive } from '../hooks/useResponsive';

const navGroups = [
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', icon: 'fa-compass', label: 'Explore Events' },
      { to: '/my-events', icon: 'fa-calendar-check', label: 'Event Studio' },
      { to: '/my-trees', icon: 'fa-tree', label: 'Tree Tracker' },
      { to: '/my-land', icon: 'fa-mountain', label: 'Land Hub' },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/add-historical-tree', icon: 'fa-history', label: 'Add Old Tree' },
      { to: '/profile', icon: 'fa-id-badge', label: 'Profile' },
    ],
  },
];

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavGroups =
    user?.role === 'Admin'
      ? [
          ...navGroups,
          {
            title: 'Administration',
            items: [{ to: '/admin', icon: 'fa-user-shield', label: 'Admin Dashboard' }],
          },
        ]
      : navGroups;

  const sidebarWidth = isMobile ? '100%' : isTablet ? '248px' : '288px';
  const navCardStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: 'white',
    padding: isMobile ? '12px 14px' : '13px 14px',
    borderRadius: '18px',
    background: isActive
      ? 'linear-gradient(135deg, rgba(74,222,128,0.26), rgba(22,163,74,0.2))'
      : 'rgba(255,255,255,0.03)',
    border: isActive ? '1px solid rgba(134,239,172,0.24)' : '1px solid rgba(255,255,255,0.05)',
    boxShadow: isActive ? '0 16px 36px rgba(8, 28, 21, 0.22)' : 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <aside
      style={{
        width: sidebarWidth,
        minHeight: isMobile ? 'auto' : '100vh',
        background:
          'radial-gradient(circle at top, rgba(134,239,172,0.18), transparent 26%), linear-gradient(180deg, #071a13 0%, #0d281f 42%, #173a2c 100%)',
        color: 'white',
        position: isMobile ? 'relative' : 'fixed',
        inset: isMobile ? 'auto' : '0 auto 0 0',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '14px 12px 12px' : '22px 16px 18px',
        fontFamily: "'Segoe UI', sans-serif",
        boxShadow: '24px 0 60px rgba(6, 18, 12, 0.14)',
        overflowY: 'auto',
        maxHeight: isMobile ? 'none' : '100vh',
      }}
    >
      <div
        style={{
          padding: '18px',
          borderRadius: '26px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: isMobile ? '42px' : '48px',
              height: isMobile ? '42px' : '48px',
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #4ade80, #16a34a)',
              boxShadow: '0 14px 30px rgba(74, 222, 128, 0.25)',
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            <i className="fas fa-seedling"></i>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>TreeNadu</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Green Operations
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', marginBottom: '6px' }}>Signed in as</div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 700, lineHeight: 1.35 }}>
            {user?.organization_name || user?.name || 'Tree Member'}
          </div>
          <div style={{ fontSize: '13px', color: '#bbf7d0', marginTop: '4px', lineHeight: 1.35 }}>
            {user?.role || 'Volunteer'} · {user?.account_type || 'Individual'}
          </div>
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: isMobile ? '0' : '4px',
          paddingBottom: '6px',
        }}
      >
        {visibleNavGroups.map((group) => (
          <section
            key={group.title}
            style={{
              padding: '10px',
              borderRadius: '22px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ padding: '2px 8px 10px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.46)' }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} style={navCardStyle}>
                  <span
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#d9f99d',
                      flexShrink: 0,
                    }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                  </span>
                  <span style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '15px', lineHeight: 1.25 }}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div
        style={{
          marginTop: '14px',
          paddingTop: '6px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            border: '1px solid rgba(248,250,252,0.14)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
            color: 'white',
            borderRadius: '18px',
            padding: isMobile ? '12px 14px' : '14px 16px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: isMobile ? '13px' : '14px',
          }}
        >
          <i className="fas fa-sign-out-alt" style={{ marginRight: '10px' }}></i>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
