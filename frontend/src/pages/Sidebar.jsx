import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        width: '260px',
        height: '100vh',
        background: '#2d6a4f',
        color: 'white',
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Logo */}
      <h1
        style={{
          fontSize: '22px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <i className="fas fa-seedling"></i> TreeNadu
      </h1>

      {/* Navigation Links */}
      <ul style={{ listStyle: 'none', flexGrow: 1, padding: 0, margin: 0 }}>
        <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-th-large"></i> Home
          </NavLink>
        </li>

        <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/my-events"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-calendar-alt"></i> My Events
          </NavLink>
        </li>

        <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/my-trees"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-tree"></i> My Trees
          </NavLink>
        </li>

        {/* ✅ ADD HISTORICAL TREE LINK */}
        {/* <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/add-historical-tree"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-history"></i> Add Old Tree
          </NavLink>
        </li> */}

        {/* <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/create-event"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-plus-circle"></i> Add Tree Spot
          </NavLink>
        </li> */}

        <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/my-land"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-map-marker-alt"></i> My Land
          </NavLink>
        </li>

        {/* <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/watering"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-tint"></i> Watering Tasks
          </NavLink>
        </li> */}

        {/* <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/contributions"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-hand-holding-heart"></i> Contributions
          </NavLink>
        </li> */}

        {/* <li style={{ margin: '15px 0' }}>
          <NavLink
            to="/reports"
            style={({ isActive }) => ({
              color: isActive ? 'white' : '#d8f3dc',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: '0.3s',
            })}
          >
            <i className="fas fa-chart-line"></i> Impact Reports
          </NavLink>
        </li> */}

        <li style={{ margin: '15px 0' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ff6b6b',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: '0.3s',
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>

      {/* User Card */}
      <div
        style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '15px',
          borderRadius: '10px',
          fontSize: '14px',
        }}
      >
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>{user?.name || 'Loading...'}</strong>
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          Role: {user?.role || 'Loading...'}
        </p>
        <p style={{ margin: 0 }}>
          Karma Points: {user?.karma_points || 450} 🌿
        </p>
      </div>
    </div>
  );
};

export default Sidebar;