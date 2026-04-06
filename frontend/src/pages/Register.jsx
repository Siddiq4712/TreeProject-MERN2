import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
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
      fontSize: '24px',
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
    },
    select: {
      width: '100%',
      padding: '14px',
      border: '2px solid #ddd',
      borderRadius: '10px',
      fontSize: '16px',
      boxSizing: 'border-box',
    },
    btnRegister: {
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
    loginLink: {
      marginTop: '20px',
      color: '#666',
    },
    error: {
      background: '#fee',
      color: '#c00',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px',
    },
    demoUsers: {
      background: '#d8f3dc',
      padding: '15px',
      borderRadius: '10px',
      marginTop: '20px',
      textAlign: 'left',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.logo}>🌿</div>
        <h1 style={styles.h1}>Create BioDive Account</h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              placeholder="At least 6 characters"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>I want to join as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="Volunteer">Volunteer</option>
              <option value="Sponsor">Sponsor / Donor</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnRegister,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.background = '#1b4332';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#2d6a4f';
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2d6a4f', fontWeight: 'bold' }}>
            Sign in
          </Link>
        </p>

        <div style={styles.demoUsers}>
          <h4 style={{ color: '#2d6a4f', marginBottom: '10px' }}>
            Demo Accounts (for testing):
          </h4>
          <p>volunteer@test.com / pass123</p>
          <p>sponsor@test.com / pass123</p>
        </div>
      </div>
    </div>
  );
};

export default Register;