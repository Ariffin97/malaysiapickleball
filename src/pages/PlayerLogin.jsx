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
  const [forgotStatus, setForgotStatus] = useState(''); // 'success' or 'error'
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
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
    setForgotStatus('');
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
        setForgotStatus('success');
        setForgotMessage('Check your email! We\'ve sent your login credentials.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotStatus('');
          setForgotMessage('');
        }, 4000);
      } else {
        setForgotStatus('error');
        setForgotMessage(data.error || 'Email not found. Please check and try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotStatus('error');
      setForgotMessage('Connection error. Please try again later.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotStatus('');
    setForgotMessage('');
    setForgotLoading(false);
  };

  return (
    <div className="player-login-page">
      <div className="login-container">
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
              <a href="/player-registration/new">Register Here</a>
            </div>

            <a href="/" className="back-link">
              Back to Home
            </a>
          </form>
        </div>

        <div className="technical-helpline">
          <div className="helpline-header">
            <i className="fas fa-headset"></i>
            <h3>Technical Support</h3>
          </div>
          <p className="helpline-description">
            Encounter any problems during registration or login? Contact our helpline for assistance.
          </p>
          <div className="helpline-divider"></div>
          <div className="helpline-contacts">
            <a href="tel:+601116197471" className="helpline-contact">
              <span className="contact-name">Ariffin</span>
              <span className="contact-phone">+6011-16197471</span>
            </a>
            <a href="tel:+60178941403" className="helpline-contact">
              <span className="contact-name">Zac</span>
              <span className="contact-phone">+6017-8941403</span>
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Modern Design */}
      {showForgotPassword && (
        <div className="forgot-overlay" onClick={closeForgotPassword}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="forgot-close" onClick={closeForgotPassword}>
              <i className="fas fa-times"></i>
            </button>

            {/* Icon */}
            <div className="forgot-icon">
              <i className="fas fa-key"></i>
            </div>

            {/* Title */}
            <h2 className="forgot-title">Forgot Password?</h2>
            <p className="forgot-subtitle">Enter your email to receive your credentials</p>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="forgot-form">
              <div className="forgot-input-group">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={forgotLoading || forgotStatus === 'success'}
                />
              </div>

              {/* Status Message */}
              {forgotMessage && (
                <div className={`forgot-message ${forgotStatus}`}>
                  <i className={`fas fa-${forgotStatus === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                  <span>{forgotMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="forgot-submit"
                disabled={forgotLoading || forgotStatus === 'success'}
              >
                {forgotLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : forgotStatus === 'success' ? (
                  <>
                    <i className="fas fa-check"></i>
                    Sent Successfully
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Credentials
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notice Popup */}
      {showNotice && (
        <div className="notice-overlay" onClick={() => setShowNotice(false)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notice-header">
              <button className="notice-close" onClick={() => setShowNotice(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="notice-body">
              <h3>Important Notice</h3>
              <p>
                If you encounter any issues or bugs, please contact the technical team immediately for assistance.
              </p>
            </div>
            <div className="notice-footer">
              <button className="btn-notice-ok" onClick={() => setShowNotice(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerLogin;
