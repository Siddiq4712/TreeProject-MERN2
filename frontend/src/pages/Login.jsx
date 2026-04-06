import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { ToastContext } from '../context/toast-context';
import { useResponsive } from '../hooks/useResponsive';

const pageStyle = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(134, 239, 172, 0.45), transparent 30%), linear-gradient(135deg, #081c15 0%, #1b4332 45%, #2d6a4f 100%)',
  fontFamily: "'Segoe UI', sans-serif",
};

const cardStyle = {
  width: '100%',
  maxWidth: '460px',
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '28px',
  boxShadow: '0 30px 80px rgba(6, 18, 12, 0.25)',
  padding: '38px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #cce3d4',
  background: '#f8fffb',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      showToast('Signed in successfully.', 'success');
      navigate(user.role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error('Login page submit failed:', err);
      setError(err.response?.data?.message || 'Unable to sign in with those credentials.');
      showToast(err.response?.data?.message || 'Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={pageStyle}>
      <div
        style={{
          padding: isMobile ? '24px 18px' : '56px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              padding: '10px 16px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            Green mission control
          </div>
          <h1 style={{ fontSize: isMobile ? '34px' : '58px', lineHeight: 1.02, margin: '24px 0 16px', maxWidth: '620px' }}>
            Grow events, track trees, and manage your planting network in one place.
          </h1>
          <p style={{ maxWidth: '560px', fontSize: isMobile ? '14px' : '18px', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>
            Sign in as a volunteer, sponsor, or organization and manage planting campaigns with live progress, requests,
            and tree-level tracking.
          </p>
        </div>

        <div className="auth-feature-grid" style={{ maxWidth: '640px' }}>
          {[
            ['Volunteer ready', 'Join events and update field tasks.'],
            ['Sponsor ready', 'Fund resources or sponsor specific trees.'],
            ['Organization ready', 'Create campaigns and review requests.'],
          ].map(([title, copy]) => (
            <div
              key={title}
              style={{
                padding: '18px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>{title}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' }}>{copy}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '40px' }}>
        <div style={{ ...cardStyle, padding: isMobile ? '22px' : cardStyle.padding, borderRadius: isMobile ? '22px' : cardStyle.borderRadius }}>
          <div style={{ fontSize: '14px', color: '#2d6a4f', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Welcome back
          </div>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', color: '#081c15', margin: '10px 0 8px' }}>Sign in to TreeNadu</h2>
          <p style={{ color: '#52796f', marginBottom: '28px', lineHeight: 1.6 }}>
            Use your account to manage campaigns, approvals, and tree lifecycle updates.
          </p>

          {error && (
            <div style={{ background: '#fff1f2', color: '#be123c', padding: '12px 14px', borderRadius: '14px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} required />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={inputStyle} required />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '22px', color: '#52796f', textAlign: 'center' }}>
            New here?{' '}
            <Link to="/register" style={{ color: '#1b4332', fontWeight: 700 }}>
              Create an account
            </Link>
          </div>

          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '14px', background: '#f5fbf7', color: '#2d6a4f', fontSize: '13px', lineHeight: 1.6 }}>
            <strong>Admin Login:</strong> use the seeded admin account from the backend.
            Default email is <code>admin@treenadu.local</code> and default password is <code>admin12345</code> unless you changed
            `ADMIN_EMAIL` or `ADMIN_PASSWORD` in your backend environment.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
