import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const styles = {
    body: {
      background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
    },
    container: {
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      width: '400px',
      textAlign: 'center',
    },
    logo: {
      fontSize: '40px',
      marginBottom: '10px',
    },
    h1: {
      color: '#2d6a4f',
      marginBottom: '30px',
    },
    formGroup: {
      marginBottom: '20px',
      textAlign: 'left',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '14px',
      border: '2px solid #ddd',
      borderRadius: '10px',
      fontSize: '16px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: '0.3s',
    },
    select: {
      width: '100%',
      padding: '14px',
      border: '2px solid #ddd',
      borderRadius: '10px',
      fontSize: '16px',
      boxSizing: 'border-box',
      outline: 'none',
    },
    btnLogin: {
      width: '100%',
      padding: '15px',
      background: '#2d6a4f',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: '0.3s',
    },
    registerLink: {
      marginTop: '20px',
      color: '#666',
    },
    demoUsers: {
      background: '#d8f3dc',
      padding: '15px',
      borderRadius: '10px',
      marginTop: '20px',
      textAlign: 'left',
      fontSize: '14px',
    },
    error: {
      color: '#c00',
      marginBottom: '20px',
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.logo}>🌿</div>
        <h1 style={styles.h1}>TreeNadu Login</h1>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Login As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="Volunteer">Volunteer</option>
              <option value="Sponsor">Sponsor</option>
            </select>
          </div>

          <button
            type="submit"
            style={styles.btnLogin}
            onMouseOver={(e) => {
              e.target.style.background = '#1b4332';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#2d6a4f';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="fas fa-sign-in-alt"></i> Login
          </button>
        </form>

        <p style={styles.registerLink}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2d6a4f', fontWeight: 'bold' }}>
            Register here
          </Link>
        </p>

        <div style={styles.demoUsers}>
          <h4 style={{ color: '#2d6a4f', marginBottom: '10px' }}>Demo Accounts:</h4>
          <p><strong>Volunteer:</strong> volunteer@test.com / pass123</p>
          <p><strong>Sponsor:</strong> sponsor@test.com / pass123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;