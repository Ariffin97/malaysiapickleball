import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PickleZoneLogin.css';

function PickleZoneLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('playerLoggedIn');
    if (isLoggedIn) {
      navigate('/picklezone');
    }
  }, [navigate]);

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
        // Success - store token and redirect to PickleZone
        localStorage.setItem('playerToken', data.token);
        localStorage.setItem('playerLoggedIn', 'true');
        localStorage.setItem('playerId', data.player.id);
        localStorage.setItem('playerName', data.player.fullName);
        localStorage.setItem('playerUsername', data.player.username);
        navigate('/picklezone');
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
    <div className="picklezone-login-page">
      <div className="login-container">
        <div className="login-header">
          <img src="/picklezonelogo.png" alt="PickleZone Logo" className="login-logo" width="50" height="50" />
          <p className="powered-by-text">Powered by Fenix Digital</p>
          <h1>Welcome to PickleZone</h1>
          <p>Sign in with your MPA player account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
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
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                Enter PickleZone
              </>
            )}
          </button>

          <div className="register-link">
            <p>Don't have an MPA account?</p>
            <a href="/#register" className="register-button">
              Register as Player
            </a>
          </div>

          <a href="/" className="home-button-inline">
            Back to Home
          </a>
        </form>
      </div>
    </div>
  );
}

export default PickleZoneLogin;
