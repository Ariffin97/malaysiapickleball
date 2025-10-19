import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './TournamentRegistration.css';

function TournamentRegistration() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Function to logout player
  const logoutPlayer = () => {
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerLoggedIn');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerMpaId');
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerUsername');
    localStorage.removeItem('selectedTournamentData');
  };
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    playerId: '',
    playerMpaId: '',
    playerName: '',
    playerUsername: ''
  });

  // Registration form data
  const [formData, setFormData] = useState({
    category: '',
    skillLevel: '',
    partnerName: '',
    partnerPhone: '',
    tshirtSize: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    agreeToTerms: false
  });

  useEffect(() => {
    // Check if user is logged in
    const playerToken = localStorage.getItem('playerToken');
    const playerId = localStorage.getItem('playerId');
    const playerMpaId = localStorage.getItem('playerMpaId');
    const playerName = localStorage.getItem('playerName');
    const playerUsername = localStorage.getItem('playerUsername');

    if (!playerToken || !playerId) {
      // Redirect to login with return URL
      navigate(`/player/login?returnUrl=/tournament/register/${tournamentId}`);
      return;
    }

    setPlayerInfo({ playerId, playerMpaId, playerName, playerUsername });

    // Get tournament details from navigation state or localStorage
    loadTournamentData();

    // Cleanup: Auto-logout when component unmounts (user navigates away)
    return () => {
      // Only logout if we're actually leaving the page (not just re-rendering)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/tournament/register/')) {
        logoutPlayer();
      }
    };
  }, [tournamentId, navigate, location]);

  const loadTournamentData = () => {
    try {
      setLoading(true);

      // Try to get from navigation state first
      let tournamentData = location.state?.tournament;

      // If not in state, try localStorage
      if (!tournamentData) {
        const storedData = localStorage.getItem('selectedTournamentData');
        if (storedData) {
          tournamentData = JSON.parse(storedData);
        }
      }

      if (tournamentData) {
        setTournament(tournamentData);
        setError(null);
      } else {
        setError('Tournament data not found. Please select a tournament again.');
      }
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const playerToken = localStorage.getItem('playerToken');

      const registrationData = {
        tournamentId: tournament._id || tournament.applicationId,
        playerId: playerInfo.playerId,
        playerMpaId: playerInfo.playerMpaId,
        playerName: playerInfo.playerName,
        playerUsername: playerInfo.playerUsername,
        ...formData
      };

      const response = await fetch(`${PORTAL_API_URL}/tournaments/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${playerToken}`
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! You will receive confirmation via email.');
        logoutPlayer(); // Auto-logout after successful registration
        navigate('/tournament');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    logoutPlayer(); // Auto-logout when canceling
    navigate('/tournament');
  };

  if (loading) {
    return (
      <div className="tournament-reg-page">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-reg-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>{error || 'Tournament not found'}</h2>
          <button onClick={handleCancel} className="btn-back">
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-reg-page">
      <div className="reg-container">
        <div className="reg-header">
          <h1>Tournament Registration</h1>
          <button onClick={handleCancel} className="btn-back-small">
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>

        <div className="tournament-info-card">
          <div className="tournament-card-header">
            <div className="tournament-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div>
              <h2>{tournament.name}</h2>
              <span className="tournament-type-badge">
                {tournament.type ? tournament.type.charAt(0).toUpperCase() + tournament.type.slice(1) : 'General'} Tournament
              </span>
            </div>
          </div>

          <div className="tournament-card-body">
            <div className="info-section">
              <h4>Event Schedule</h4>
              <div className="info-row-compact">
                <div className="info-col">
                  <i className="fas fa-calendar-alt"></i>
                  <div>
                    <span className="info-label-sm">Start Date</span>
                    <span className="info-value-sm">
                      {new Date(tournament.startDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="info-col">
                  <i className="fas fa-calendar-check"></i>
                  <div>
                    <span className="info-label-sm">End Date</span>
                    <span className="info-value-sm">
                      {new Date(tournament.endDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {(tournament.venue || tournament.city) && (
              <div className="info-section">
                <h4>Location</h4>
                <div className="info-row-compact">
                  {tournament.venue && (
                    <div className="info-col">
                      <i className="fas fa-building"></i>
                      <div>
                        <span className="info-label-sm">Venue</span>
                        <span className="info-value-sm">{tournament.venue}</span>
                      </div>
                    </div>
                  )}
                  {tournament.city && (
                    <div className="info-col">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <span className="info-label-sm">City</span>
                        <span className="info-value-sm">{tournament.city}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(tournament.organizer || tournament.personInCharge || tournament.phoneNumber) && (
              <div className="info-section">
                <h4>Contact Information</h4>
                <div className="info-row-compact">
                  {tournament.organizer && (
                    <div className="info-col">
                      <i className="fas fa-users"></i>
                      <div>
                        <span className="info-label-sm">Organizer</span>
                        <span className="info-value-sm">{tournament.organizer}</span>
                      </div>
                    </div>
                  )}
                  {tournament.personInCharge && (
                    <div className="info-col">
                      <i className="fas fa-user-tie"></i>
                      <div>
                        <span className="info-label-sm">Contact Person</span>
                        <span className="info-value-sm">{tournament.personInCharge}</span>
                      </div>
                    </div>
                  )}
                  {tournament.phoneNumber && (
                    <div className="info-col">
                      <i className="fas fa-phone"></i>
                      <div>
                        <span className="info-label-sm">Phone</span>
                        <span className="info-value-sm">
                          <a href={`tel:${tournament.phoneNumber}`}>{tournament.phoneNumber}</a>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <h3>Player Information</h3>
          <div className="form-section">
            <div className="form-group">
              <label>Player Name</label>
              <input type="text" value={playerInfo.playerName} disabled />
            </div>
            <div className="form-group">
              <label>MPA Player ID</label>
              <input type="text" value={playerInfo.playerMpaId || 'N/A'} disabled />
            </div>
          </div>

          <h3>Registration Details</h3>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select category</option>
                <option value="mens-singles">Men's Singles</option>
                <option value="womens-singles">Women's Singles</option>
                <option value="mens-doubles">Men's Doubles</option>
                <option value="womens-doubles">Women's Doubles</option>
                <option value="mixed-doubles">Mixed Doubles</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="skillLevel">Skill Level *</label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                required
              >
                <option value="">Select skill level</option>
                <option value="beginner">Beginner (2.0-2.5)</option>
                <option value="intermediate">Intermediate (3.0-3.5)</option>
                <option value="advanced">Advanced (4.0-4.5)</option>
                <option value="pro">Pro (5.0+)</option>
              </select>
            </div>

            {(formData.category.includes('doubles')) && (
              <>
                <div className="form-group">
                  <label htmlFor="partnerName">Partner Name *</label>
                  <input
                    type="text"
                    id="partnerName"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleInputChange}
                    placeholder="Enter partner's full name"
                    required={formData.category.includes('doubles')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="partnerPhone">Partner Phone Number *</label>
                  <input
                    type="tel"
                    id="partnerPhone"
                    name="partnerPhone"
                    value={formData.partnerPhone}
                    onChange={handleInputChange}
                    placeholder="Enter partner's phone number"
                    required={formData.category.includes('doubles')}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="tshirtSize">T-Shirt Size *</label>
              <select
                id="tshirtSize"
                name="tshirtSize"
                value={formData.tshirtSize}
                onChange={handleInputChange}
                required
              >
                <option value="">Select size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          <h3>Emergency Contact</h3>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact Name *</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="Enter emergency contact name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone">Emergency Contact Phone *</label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleInputChange}
                placeholder="Enter emergency contact phone"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="medicalConditions">Medical Conditions / Allergies</label>
              <textarea
                id="medicalConditions"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                placeholder="Please list any medical conditions or allergies (optional)"
                rows="3"
              />
            </div>
          </div>

          <div className="terms-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
              />
              <span>
                I agree to the tournament <a href="/terms-and-conditions" target="_blank">terms and conditions</a> and understand that I am participating at my own risk.
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TournamentRegistration;
