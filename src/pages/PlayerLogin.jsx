import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PlayerLogin.css';

function PlayerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - store token and redirect
        localStorage.setItem('playerToken', data.token);
        localStorage.setItem('playerLoggedIn', 'true');
        localStorage.setItem('playerId', data.player.id);
        localStorage.setItem('playerMpaId', data.player.playerId); // Store MPA ID (e.g., MPA001)
        localStorage.setItem('playerName', data.player.fullName);
        localStorage.setItem('playerUsername', data.player.username);

        // Check if there's a return URL
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
          navigate(returnUrl);
        } else {
          navigate('/player/dashboard');
        }
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotMessage('success');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotMessage('');
        }, 3000);
      } else {
        setForgotMessage(data.error || 'Email not found');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotMessage('Unable to process request. Please try again later.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="player-login-page">
      <div className="login-card">
        <div className="login-header" style={{ paddingBottom: '0', borderBottom: 'none' }}>
          <img src="/mpa.png" alt="MPA Logo" className="login-logo" style={{ width: '140px', height: '140px' }} />
          <h1 style={{ marginBottom: '0', paddingBottom: '0', borderBottom: 'none' }}>Player Portal</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: '2rem' }}>
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

          <div className="forgot-password-link">
            <button type="button" onClick={() => setShowForgotPassword(true)}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="register-link">
            <span>Don't have an account? </span>
            <a href="/#register">Register Here</a>
          </div>

          <a href="/" className="back-link">
            Back to Home
          </a>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Forgot Password</h2>
              <button className="modal-close" onClick={() => setShowForgotPassword(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Enter your registered email address and we'll send you your username and password.
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email Address</label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {forgotMessage && (
                  <div className={`message ${forgotMessage === 'success' ? 'success' : 'error'}`}>
                    {forgotMessage === 'success'
                      ? 'Email sent! Check your inbox for your credentials.'
                      : forgotMessage}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerLogin;
