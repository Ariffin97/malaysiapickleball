import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerLogin.css';

function PlayerLogin() {
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
        // Success - store token and redirect to player dashboard
        localStorage.setItem('playerToken', data.token);
        localStorage.setItem('playerLoggedIn', 'true');
        localStorage.setItem('playerId', data.player.id);
        localStorage.setItem('playerName', data.player.fullName);
        navigate('/player/dashboard');
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

  return (
    <div className="player-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/mpa.png" alt="MPA Logo" className="login-logo" />
            <h1>Player Login</h1>
            <p>Malaysia Pickleball Association</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-user"></i>
                Username
              </label>
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
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
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
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>

            <a href="/" className="home-button-inline">
              <i className="fas fa-home"></i>
              <span>Back to Home</span>
            </a>
          </form>

          <div className="login-footer">
            <p>
              <i className="fas fa-shield-alt"></i>
              Secure login powered by encryption
            </p>
            <p className="register-prompt">
              Don't have an account? <a href="/">Register here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerLogin;
