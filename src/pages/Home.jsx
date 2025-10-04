import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journeyService from '../services/journeyService';
import tournamentService from '../services/tournamentService';
import './Home.css';

function Home() {
  const [milestones, setMilestones] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [news, setNews] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [icValidation, setIcValidation] = useState({ status: '', message: '' });
  const [registerFormData, setRegisterFormData] = useState({
    fullName: '',
    profilePicture: null,
    gender: '',
    icNumber: '',
    age: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await journeyService.getAllMilestones();
        setMilestones(data);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      }
    };

    fetchMilestones();
  }, []);

  // Fetch news and featured video
  useEffect(() => {
    const fetchNewsAndVideo = async () => {
      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        // Fetch latest news (only 2)
        const newsResponse = await fetch(`${PORTAL_API_URL}/news?status=Published&limit=2`);
        const newsData = await newsResponse.json();
        setNews(Array.isArray(newsData) ? newsData : []);

        // Fetch featured video
        const videoResponse = await fetch(`${PORTAL_API_URL}/featured-video`);
        const videoData = await videoResponse.json();
        setFeaturedVideo(videoData);
      } catch (error) {
        console.error('Error fetching news and video:', error);
      }
    };

    fetchNewsAndVideo();
  }, []);

  // Fetch upcoming tournaments
  useEffect(() => {
    const fetchUpcomingTournaments = async () => {
      try {
        const data = await tournamentService.getApprovedTournaments();

        // Filter only upcoming tournaments (start date is in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data
          .filter(tournament => {
            const startDate = new Date(tournament.startDate);
            return startDate >= today;
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 4); // Get only the next 4 tournaments

        setUpcomingTournaments(upcoming);
      } catch (error) {
        console.error('Error fetching upcoming tournaments:', error);
      }
    };

    fetchUpcomingTournaments();
  }, []);

  // Continuous horizontal auto-scroll
  useEffect(() => {
    if (milestones.length === 0) return;

    let autoScrollInterval;
    let isPaused = false;
    let isUserScrolling = false;
    let userScrollTimeout;
    const scrollSpeed = 0.5; // pixels per frame

    const container = document.getElementById('timelineContainer');
    if (!container) return;

    // Calculate halfway point for seamless loop
    const getHalfwayScrollWidth = () => {
      const itemWidth = 320; // milestone card width + gap
      return itemWidth * milestones.length;
    };

    // Continuous smooth auto-scroll
    const continuousAutoScroll = () => {
      if (isPaused || isUserScrolling) return;

      const halfwayPoint = getHalfwayScrollWidth();

      // Move scroll position by speed
      container.scrollLeft += scrollSpeed;

      // Reset to beginning when reached halfway for seamless loop
      if (container.scrollLeft >= halfwayPoint) {
        container.scrollLeft = 0;
      }
    };

    // Start auto-scroll
    const startAutoScroll = () => {
      stopAutoScroll();
      autoScrollInterval = setInterval(continuousAutoScroll, 16); // ~60fps
    };

    // Stop auto-scroll
    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    // Pause auto-scroll when user interacts
    const pauseAutoScroll = () => {
      isPaused = true;

      // Resume after 3 seconds of no interaction
      setTimeout(() => {
        if (isPaused) {
          isPaused = false;
        }
      }, 3000);
    };

    // User interaction detection
    container.addEventListener('mousedown', () => {
      isUserScrolling = true;
      clearTimeout(userScrollTimeout);
      pauseAutoScroll();
    });

    container.addEventListener('mouseup', () => {
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 100);
    });

    container.addEventListener('touchstart', () => {
      isUserScrolling = true;
      clearTimeout(userScrollTimeout);
      pauseAutoScroll();
    });

    container.addEventListener('touchend', () => {
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 100);
    });

    // Pause on hover
    container.addEventListener('mouseenter', pauseAutoScroll);

    // Start auto-scroll
    startAutoScroll();

    // Cleanup
    return () => {
      stopAutoScroll();
      if (container) {
        container.removeEventListener('mousedown', () => {});
        container.removeEventListener('mouseup', () => {});
        container.removeEventListener('touchstart', () => {});
        container.removeEventListener('touchend', () => {});
        container.removeEventListener('mouseenter', pauseAutoScroll);
      }
    };
  }, [milestones]);

  // Handle IC number change and auto-calculate age
  const handleIcChange = async (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Auto-format as XXXXXX-XX-XXXX
    let formatted = digitsOnly;
    if (digitsOnly.length > 6) {
      formatted = `${digitsOnly.substring(0, 6)}-${digitsOnly.substring(6, 8)}`;
      if (digitsOnly.length > 8) {
        formatted += `-${digitsOnly.substring(8, 12)}`;
      }
    }

    // Limit to 12 digits (XXXXXX-XX-XXXX format)
    if (digitsOnly.length <= 12) {
      setRegisterFormData(prev => ({ ...prev, icNumber: formatted }));

      // Calculate age from IC number (YYMMDD format)
      if (digitsOnly.length >= 6) {
        const year = parseInt(digitsOnly.substring(0, 2));
        const currentYear = new Date().getFullYear() % 100;
        const fullYear = year > currentYear ? 1900 + year : 2000 + year;
        const age = new Date().getFullYear() - fullYear;
        setRegisterFormData(prev => ({ ...prev, age: age.toString() }));
      }

      // Check IC validation when complete (12 digits)
      if (digitsOnly.length === 12) {
        try {
          const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
          const checkResponse = await fetch(`${PORTAL_API_URL}/players/check-ic/${formatted}`);
          const checkResult = await checkResponse.json();

          if (checkResult.exists) {
            setIcValidation({
              status: 'error',
              message: 'This I/C number is already registered'
            });
          } else {
            setIcValidation({
              status: 'success',
              message: 'I/C number is available'
            });
          }
        } catch (error) {
          setIcValidation({ status: '', message: '' });
        }
      } else {
        setIcValidation({ status: '', message: '' });
      }
    }
  };

  const handleFormChange = (field, value) => {
    setRegisterFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegisterFormData(prev => ({ ...prev, profilePicture: file }));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (registerFormData.password !== registerFormData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (!registerFormData.termsAccepted) {
      alert('Please accept the terms and privacy policy!');
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      // Check if IC number already exists
      const checkResponse = await fetch(`${PORTAL_API_URL}/players/check-ic/${registerFormData.icNumber}`);
      const checkResult = await checkResponse.json();

      if (checkResult.exists) {
        alert('This I/C number is already registered. A player with this I/C number already exists in our system. If you believe this is an error, please contact support.');
        return;
      }

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('fullName', registerFormData.fullName);
      formData.append('gender', registerFormData.gender);
      formData.append('icNumber', registerFormData.icNumber);
      formData.append('age', registerFormData.age);
      formData.append('email', registerFormData.email);
      formData.append('phoneNumber', registerFormData.phoneNumber);
      formData.append('addressLine1', registerFormData.addressLine1);
      formData.append('addressLine2', registerFormData.addressLine2);
      formData.append('city', registerFormData.city);
      formData.append('state', registerFormData.state);
      formData.append('username', registerFormData.username);
      formData.append('password', registerFormData.password);
      formData.append('termsAccepted', registerFormData.termsAccepted);

      // Add profile picture if uploaded
      if (registerFormData.profilePicture) {
        formData.append('profilePicture', registerFormData.profilePicture);
      }

      const response = await fetch(`${PORTAL_API_URL}/players/register`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result = await response.json();
      alert('Registration successful! Welcome to Malaysia Pickleball Association!');

      // Reset form and close modal
      setRegisterFormData({
        fullName: '',
        profilePicture: null,
        gender: '',
        icNumber: '',
        age: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        phoneNumber: '',
        username: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false
      });
      setShowRegisterModal(false);
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <img src="/mpa.png" alt="MPA Logo" className="hero-logo" />
          <h1>
            <div className="hero-line-1">Welcome to</div>
            <div className="hero-line-2">Malaysia Pickleball Association</div>
            <div className="hero-line-3">Official Website</div>
          </h1>

          <div className="hero-description">
            <p className="hero-intro">
              The Malaysia Pickleball Association (MPA), the national governing body for pickleball, promotes and regulates the sport in Malaysia. It organizes tournaments, supports training and certification, advocates for dedicated facilities, and builds inclusive communities. By collaborating with government and sports bodies, the MPA drives pickleball's growth, fostering active lifestyles and positioning Malaysia as a regional hub for this dynamic sport.
            </p>

            <div className="hero-grid">
              <div className="hero-left">
                <div className="hero-mission">
                  <h3>Mission</h3>
                  <ul>
                    <li>To inspire and unite Malaysians through pickleball, promoting an active lifestyle for all.</li>
                    <li>To develop a strong pipeline of talented players and coaches to elevate the sport nationally.</li>
                    <li>To host world-class tournaments that showcase Malaysia's growing pickleball prowess.</li>
                    <li>To build accessible training facilities across states to support grassroots growth.</li>
                    <li>To establish pickleball as a leading sport, reflecting national pride and excellence.</li>
                  </ul>
                </div>
              </div>

              <div className="hero-divider"></div>

              <div className="hero-right">
                <div className="hero-vision">
                  <h3>Vision</h3>
                  <p>Pickleball will be a vibrant and popular sport in Malaysia that contributes towards nation building and social development by reaching out to all Malaysians in its pursuit of glory for the country.</p>
                </div>

                <div className="hero-objective">
                  <h3>Objective</h3>
                  <p>To establish Malaysia as a leading pickleball nation through comprehensive development programs, world-class facilities, and excellence in international competitions while promoting the sport as an inclusive activity for all Malaysians.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <div className="container">
          <h2>Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">400,000+</div>
              <div className="stat-title">Active Players</div>
              <div className="stat-subtitle">Registered members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">27+</div>
              <div className="stat-title">Tournaments</div>
              <div className="stat-subtitle">Annual events</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">472+</div>
              <div className="stat-title">Venues</div>
              <div className="stat-subtitle">Across Malaysia</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-title">Coaches</div>
              <div className="stat-subtitle">Certified trainers</div>
            </div>
          </div>
        </div>
      </section>

      <section className="player-registration">
        <div className="container">
          <div className="registration-card">
            <div className="registration-content">
              <div className="registration-icon">
                <img src="/mpa.png" alt="MPA Logo" />
              </div>
              <div className="registration-text">
                <h2>Join the Malaysia Pickleball Community</h2>
                <p>Register as an official Malaysia Pickleball player and unlock exclusive benefits</p>
                <ul className="benefits-list">
                  <li><i className="fas fa-check-circle"></i> Access to official tournaments</li>
                  <li><i className="fas fa-check-circle"></i> Player ranking and statistics</li>
                  <li><i className="fas fa-check-circle"></i> Training programs and certifications</li>
                  <li><i className="fas fa-check-circle"></i> Networking with fellow players</li>
                </ul>
              </div>
            </div>
            <div className="registration-actions">
              <button onClick={openRegisterModal} className="btn-register">
                <i className="fas fa-user-plus"></i>
                Register as Player
              </button>
              <Link to="/player/login" className="btn-login">
                <i className="fas fa-sign-in-alt"></i>
                Player Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="register-modal-overlay" onClick={closeRegisterModal}>
          <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="register-modal-header">
              <h2>
                <i className="fas fa-user-plus"></i>
                Player Registration
              </h2>
              <button className="modal-close-btn" onClick={closeRegisterModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form className="register-form" onSubmit={handleRegisterSubmit}>
              <div className="form-scroll-container">
                {/* Personal Information Section */}
                <div className="form-section">
                  <h3>Personal Information</h3>

                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={registerFormData.fullName}
                      onChange={(e) => handleFormChange('fullName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender <span className="required">*</span></label>
                      <select
                        value={registerFormData.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>I/C Number <span className="required">*</span></label>
                      <input
                        type="text"
                        value={registerFormData.icNumber}
                        onChange={(e) => handleIcChange(e.target.value)}
                        placeholder="920815-01-1234"
                        maxLength="14"
                        className={icValidation.status ? `ic-validation-${icValidation.status}` : ''}
                        required
                      />
                      {icValidation.message && (
                        <div className={`ic-validation-message ic-validation-${icValidation.status}`}>
                          {icValidation.status === 'error' && <i className="fas fa-times-circle"></i>}
                          {icValidation.status === 'success' && <i className="fas fa-check-circle"></i>}
                          {icValidation.message}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="text"
                        value={registerFormData.age}
                        readOnly
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="form-section">
                  <h3>Contact Information</h3>

                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input
                      type="email"
                      value={registerFormData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      value={registerFormData.phoneNumber}
                      onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                      placeholder="+60"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Address Line 1 <span className="required">*</span></label>
                    <input
                      type="text"
                      value={registerFormData.addressLine1}
                      onChange={(e) => handleFormChange('addressLine1', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={registerFormData.addressLine2}
                      onChange={(e) => handleFormChange('addressLine2', e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City <span className="required">*</span></label>
                      <input
                        type="text"
                        value={registerFormData.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>State <span className="required">*</span></label>
                      <select
                        value={registerFormData.state}
                        onChange={(e) => handleFormChange('state', e.target.value)}
                        required
                      >
                        <option value="">Select State</option>
                        <option value="Johor">Johor</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Labuan">Labuan</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Penang">Penang</option>
                        <option value="Perak">Perak</option>
                        <option value="Perlis">Perlis</option>
                        <option value="Putrajaya">Putrajaya</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Terengganu">Terengganu</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="form-section">
                  <h3>Account Information</h3>

                  <div className="form-group">
                    <label>Username <span className="required">*</span></label>
                    <input
                      type="text"
                      value={registerFormData.username}
                      onChange={(e) => handleFormChange('username', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Password <span className="required">*</span></label>
                      <input
                        type="password"
                        value={registerFormData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password <span className="required">*</span></label>
                      <input
                        type="password"
                        value={registerFormData.confirmPassword}
                        onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="form-section">
                  <div className="form-group-checkbox">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={registerFormData.termsAccepted}
                      onChange={(e) => handleFormChange('termsAccepted', e.target.checked)}
                      required
                    />
                    <label htmlFor="terms">
                      I agree to the <a href="#" target="_blank">Terms and Conditions</a> and <a href="#" target="_blank">Privacy Policy</a> <span className="required">*</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="register-modal-footer">
                <button type="button" className="btn-cancel" onClick={closeRegisterModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <i className="fas fa-user-plus"></i>
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="guidelines">
        <div className="container">
          <div className="guidelines-layout">
            <h2>Guidelines</h2>
            <div className="guidelines-cards">
              <div className="guideline-card">
                <h3>Tournament Guidelines</h3>
                <ul>
                  <li>Application methods for local & international sports events</li>
                  <li>Licensing requirements for companies & organizations</li>
                  <li>Bidding procedures for international events</li>
                  <li>Legal compliance under Sports Development Act 1997</li>
                </ul>
                <button className="guideline-detail-button">Tournament Guidelines</button>
              </div>
              <div className="guideline-card">
                <h3>Venue Guidelines</h3>
                <ul>
                  <li>Court specifications and dimensions</li>
                  <li>Safety standards and requirements</li>
                  <li>Facility management protocols</li>
                  <li>Booking and reservation procedures</li>
                </ul>
                <button className="guideline-detail-button">Venue Guidelines</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="upcoming-tournaments">
        <div className="container">
          <div className="tournaments-header">
            <h2>Upcoming Tournaments</h2>
            <div className="tournaments-line"></div>
          </div>

          <div className="tournaments-grid">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-date">
                    {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {tournament.endDate && tournament.endDate !== tournament.startDate && (
                      <> - {new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </div>
                  <h3>{tournament.name}</h3>
                  <div className="tournament-location">
                    📍 {tournament.venue || tournament.city || 'Location TBA'}
                    {tournament.venue && tournament.city && `, ${tournament.city}`}
                  </div>
                  <p>{tournament.description || 'Join us for this exciting pickleball tournament!'}</p>
                  <Link to="/tournament" className="tournament-button">View Details</Link>
                </div>
              ))
            ) : (
              <div className="no-tournaments">
                <p>No upcoming tournaments at the moment. Check back soon!</p>
              </div>
            )}
          </div>

          {upcomingTournaments.length > 0 && (
            <div className="view-all-tournaments">
              <Link to="/tournament" className="btn-view-all">
                View All Tournaments
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="training-programs">
        <div className="container">
          <div className="training-layout">
            <div className="training-cards">
              <div className="training-card">
                <h3>Structured Courses</h3>
                <ul>
                  <li>4-8 week progressive programs</li>
                  <li>Small group learning (max 8 students)</li>
                  <li>Skill level progression & certification</li>
                  <li>Comprehensive learning materials included</li>
                  <li>Available for all levels (2.0 - 5.0+)</li>
                </ul>
                <button className="training-button">Explore Courses</button>
              </div>
              <div className="training-card">
                <h3>Skill Clinics</h3>
                <ul>
                  <li>Flexible drop-in sessions</li>
                  <li>Skill-specific focus areas</li>
                  <li>Expert certified coaches</li>
                  <li>Immediate feedback & quick results</li>
                  <li>Weekend intensive workshops</li>
                </ul>
                <button className="training-button">Book Clinics</button>
              </div>
            </div>
            <h2>
              <div>Training</div>
              <div>Programs</div>
            </h2>
          </div>
        </div>
      </section>

      <section className="our-journey">
        <div className="container">
          <div className="journey-header">
            <h2>Our Journey</h2>
            <div className="journey-line"></div>
          </div>

          <div className="timeline-container" id="timelineContainer">
            <div className="timeline-wrapper">
              {/* Original milestones */}
              {milestones.map((milestone) => (
                <div key={milestone.id} className="timeline-item">
                  <div className="timeline-date">{new Date(milestone.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="timeline-point"></div>
                  <div className="milestone-content">
                    {milestone.image ? (
                      <img
                        src={milestone.image}
                        alt={milestone.title}
                        onError={(e) => {
                          e.target.outerHTML = `<div class="image-placeholder"><i class="fas fa-flag-checkered"></i></div>`;
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <i className="fas fa-flag-checkered"></i>
                      </div>
                    )}
                    <div className="milestone-title">{milestone.title}</div>
                    <div className="milestone-description">{milestone.description}</div>
                  </div>
                </div>
              ))}
              {/* Duplicate milestones for seamless loop */}
              {milestones.map((milestone) => (
                <div key={`duplicate-${milestone.id}`} className="timeline-item">
                  <div className="timeline-date">{new Date(milestone.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="timeline-point"></div>
                  <div className="milestone-content">
                    {milestone.image ? (
                      <img
                        src={milestone.image}
                        alt={milestone.title}
                        onError={(e) => {
                          e.target.outerHTML = `<div class="image-placeholder"><i class="fas fa-flag-checkered"></i></div>`;
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <i className="fas fa-flag-checkered"></i>
                      </div>
                    )}
                    <div className="milestone-title">{milestone.title}</div>
                    <div className="milestone-description">{milestone.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="news-video">
        <div className="container">
          <div className="news-video-grid">
            <div className="latest-news">
              <h2>Latest News</h2>
              <div className="news-items">
                {news.length > 0 ? (
                  news.map((item) => (
                    <div key={item._id} className="news-item">
                      <div className="news-date">
                        {new Date(item.publishDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <h3>{item.title}</h3>
                      {item.media && item.media.length > 0 && item.media[0].url && (
                        <div className="news-image">
                          <img
                            src={`http://localhost:5001${item.media[0].url}`}
                            alt={item.title}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <p>{item.summary || item.content.substring(0, 150)}...</p>
                      <Link to={`/news/${item.newsId}`} className="news-link">
                        Read More →
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="news-item">
                    <div className="news-date">March 15, 2024</div>
                    <h3>National Championship Registration Open</h3>
                    <p>Registration for the 2024 National Pickleball Championship is now open. Join us for the biggest tournament of the year.</p>
                    <a href="#" className="news-link">Read More →</a>
                  </div>
                )}
              </div>
            </div>

            <div className="featured-video">
              <h2>Featured Video</h2>
              <div className="video-container">
                <iframe
                  width="100%"
                  height="315"
                  src={featuredVideo?.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"}
                  title={featuredVideo?.title || "Featured Video"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <h3>{featuredVideo?.title || "2024 National Championship Highlights"}</h3>
              <p>{featuredVideo?.description || "Watch the exciting highlights from our recent national championship, featuring Malaysia's top pickleball players competing at the highest level."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* News Details Modal */}
      {showNewsModal && selectedNews && (
        <div className="modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="modal-content news-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNews.title}</h2>
              <button className="modal-close" onClick={() => setShowNewsModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedNews.media && selectedNews.media.length > 0 && selectedNews.media[0].url && (
                <div className="news-modal-image" style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={`http://localhost:5001${selectedNews.media[0].url}`}
                    alt={selectedNews.title}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="news-date" style={{ marginBottom: '1rem', color: '#6b7280' }}>
                {new Date(selectedNews.publishDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="news-content" style={{ lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {selectedNews.content}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
