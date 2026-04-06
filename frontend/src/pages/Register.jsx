import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { ToastContext } from '../context/toast-context';
import { useResponsive } from '../hooks/useResponsive';

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

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Volunteer',
    account_type: 'Individual',
    organization_name: '',
    phone: '',
    sponsor_logo_url: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    if (form.account_type === 'Organization' && !form.organization_name.trim()) {
      setError('Organization name is required for organization accounts.');
      showToast('Organization name is required for organization accounts.', 'error');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        account_type: form.account_type,
        organization_name: form.organization_name.trim(),
        phone: form.phone.trim(),
        sponsor_logo_url: form.sponsor_logo_url.trim(),
      });
      showToast('Account created successfully.', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Register page submit failed:', error);
      setError(error.response?.data?.message || 'Registration failed.');
      showToast(error.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top right, rgba(187, 247, 208, 0.7), transparent 30%), linear-gradient(160deg, #081c15 0%, #1b4332 48%, #2d6a4f 100%)',
        fontFamily: "'Segoe UI', sans-serif",
        padding: isMobile ? '16px' : '32px',
      }}
    >
      <div className="auth-register-shell" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ color: 'white', padding: isMobile ? '16px 8px' : '32px 18px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.82 }}>
            New growth starts here
          </div>
          <h1 style={{ fontSize: isMobile ? '32px' : '54px', lineHeight: 1.02, margin: '18px 0 18px' }}>Build a greener platform with volunteers, sponsors, and organizations working together.</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: isMobile ? '14px' : '17px', maxWidth: '520px' }}>
            Create an individual or organization account and unlock event creation, request approval, land management, and tree tracking.
          </p>

          <div style={{ display: 'grid', gap: '16px', marginTop: '28px', maxWidth: '520px' }}>
            {[
              'Organizations can register directly and manage campaign approvals.',
              'Sponsors can fund supplies or claim specific trees.',
              'Volunteers can join planting flows and update lifecycle tasks.',
            ].map((item) => (
              <div key={item} style={{ padding: '16px 18px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: isMobile ? '22px' : '28px', padding: isMobile ? '22px' : '34px', boxShadow: '0 30px 80px rgba(6, 18, 12, 0.24)' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '26px' : '34px', color: '#081c15' }}>Create account</h2>
          <p style={{ margin: '10px 0 24px', color: '#52796f', lineHeight: 1.6 }}>
            Set up your access and choose whether this is an individual or organization profile.
          </p>

          {error && (
            <div style={{ background: '#fff1f2', color: '#be123c', padding: '12px 14px', borderRadius: '14px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-grid-two" style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Full name</label>
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Full name" style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Phone</label>
                <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91..." style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" style={inputStyle} required />
            </div>

            <div className="auth-form-grid-two" style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Account type</label>
                <select value={form.account_type} onChange={(e) => updateField('account_type', e.target.value)} style={inputStyle}>
                  <option value="Individual">Individual</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Role</label>
                <select value={form.role} onChange={(e) => updateField('role', e.target.value)} style={inputStyle}>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Landowner">Landowner</option>
                </select>
              </div>
            </div>

            {form.account_type === 'Organization' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Organization name</label>
                  <input value={form.organization_name} onChange={(e) => updateField('organization_name', e.target.value)} placeholder="Your organization" style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Sponsor Logo URL</label>
                  <input value={form.sponsor_logo_url} onChange={(e) => updateField('sponsor_logo_url', e.target.value)} placeholder="https://..." style={inputStyle} />
                </div>
              </>
            )}

            <div className="auth-form-grid-two" style={{ marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Password</label>
                <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="At least 8 characters" style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#1b4332' }}>Confirm password</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Repeat password" style={inputStyle} required />
              </div>
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
                opacity: loading ? 0.72 : 1,
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '22px', textAlign: 'center', color: '#52796f' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1b4332', fontWeight: 700 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
