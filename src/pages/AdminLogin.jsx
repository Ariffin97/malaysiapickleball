import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get stored credentials or use defaults
    const storedUsername = localStorage.getItem('adminUsername') || 'admin';
    const storedPassword = localStorage.getItem('adminPassword') || 'admin123';

    // Simulate authentication
    setTimeout(() => {
      if (username === storedUsername && password === storedPassword) {
        // Success - redirect to admin dashboard
        localStorage.setItem('adminToken', 'sample-token');
        localStorage.setItem('adminLoggedIn', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="admin-login-page">
      <div className="login-card">
        <div className="login-header" style={{ paddingBottom: '0.5rem' }}>
          <img src="/mpa.png" alt="MPA Logo" className="login-logo" style={{ width: '180px', height: '180px' }} />
          <h1 style={{ marginBottom: '1rem !important' }}>Admin Portal</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: '0.5rem' }}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <a href="/" className="back-link">
            Back to Home
          </a>
        </form>
        <p className="admin-note">This login page can only be accessed by admin and technical team only.</p>
      </div>
    </div>
  );
}

export default AdminLogin;
