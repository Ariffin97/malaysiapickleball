import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journeyService from '../services/journeyService';
import tournamentService from '../services/tournamentService';
import './Home.css';

// Function to calculate skill level from DUPR rating
function calculateSkillLevel(duprRating) {
  if (!duprRating || duprRating <= 0) {
    return 'Beginner';
  }

  if (duprRating <= 2.499) {
    return 'Novice';
  } else if (duprRating <= 2.999) {
    return 'Intermediate';
  } else if (duprRating <= 3.499) {
    return 'Intermediate+';
  } else if (duprRating <= 3.999) {
    return 'Advanced';
  } else if (duprRating <= 4.499) {
    return 'Advanced+';
  } else {
    return 'Elite';
  }
}

function Home() {
  const [milestones, setMilestones] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [news, setNews] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [picklezonePosts, setPicklezonePosts] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [showImagePopup, setShowImagePopup] = useState(false);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await journeyService.getAllMilestones();
        console.log('Fetched milestones:', data);
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
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

        // Fetch latest news (only 2)
        const newsResponse = await fetch(`${PORTAL_API_URL}/news?status=published&limit=2`);
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

  // Fetch upcoming tournaments and total count
  useEffect(() => {
    const fetchUpcomingTournaments = async () => {
      try {
        const data = await tournamentService.getApprovedTournaments();

        // Set total tournament count for Quick Stats
        setTotalTournaments(data.length);

        // Filter only upcoming tournaments (start date is in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data
          .filter(tournament => {
            const startDate = new Date(tournament.startDate);
            return startDate >= today;
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3); // Get only the next 3 tournaments

        setUpcomingTournaments(upcoming);
      } catch (error) {
        console.error('Error fetching upcoming tournaments:', error);
      }
    };

    fetchUpcomingTournaments();
  }, []);

  // Fetch PickleZone posts
  useEffect(() => {
    const fetchPicklezonePosts = async () => {
      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
        const response = await fetch(`${PORTAL_API_URL}/posts?limit=5`);
        const data = await response.json();
        setPicklezonePosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching PickleZone posts:', error);
        setPicklezonePosts([]);
      }
    };

    fetchPicklezonePosts();
  }, []);

  // Track website visitors with Google Analytics and backend API
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

        // Check if user has visited before (using session storage to count once per session)
        const hasVisitedThisSession = sessionStorage.getItem('mpa_visited_this_session');

        if (!hasVisitedThisSession) {
          // Track with Google Analytics
          if (window.gtag) {
            window.gtag('event', 'page_view', {
              page_title: 'Home',
              page_location: window.location.href,
              page_path: '/'
            });
          }

          // Track new visitor (increment count in backend for display)
          const response = await fetch(`${PORTAL_API_URL}/visitors/track`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          setTotalVisitors(data.count);
          sessionStorage.setItem('mpa_visited_this_session', 'true');
        } else {
          // Just fetch the current count without incrementing
          const response = await fetch(`${PORTAL_API_URL}/visitors/count`);
          const data = await response.json();
          setTotalVisitors(data.count);
        }
      } catch (error) {
        console.error('Error tracking visitor:', error);
        // Fallback to 0 if API fails
        setTotalVisitors(0);
      }
    };

    trackVisitor();
  }, []);

  // Show image popup on page load
  useEffect(() => {
    // Show popup after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      setShowImagePopup(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Pause/resume animation on hover
  useEffect(() => {
    if (milestones.length === 0) return;

    const wrapper = document.querySelector('.timeline-wrapper');
    const container = document.getElementById('timelineContainer');
    if (!wrapper || !container) return;

    // Pause animation on hover
    const handleMouseEnter = () => {
      wrapper.style.animationPlayState = 'paused';
    };

    const handleMouseLeave = () => {
      wrapper.style.animationPlayState = 'running';
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [milestones]);


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
              <div className="stat-title">Players</div>
              <div className="stat-subtitle">In Malaysia</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalTournaments > 0 ? totalTournaments : '...'}</div>
              <div className="stat-title">Tournaments</div>
              <div className="stat-subtitle">Total events</div>
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
            <div className="stat-card">
              <div className="stat-number">{totalVisitors > 0 ? totalVisitors.toLocaleString() : '...'}</div>
              <div className="stat-title">Website Visitors</div>
              <div className="stat-subtitle">Total visits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gatorade Championship CTA */}
      <section className="gatorade-championship-cta">
        <div className="container">
          <div className="gatorade-cta-card">
            <div className="gatorade-cta-logo">
              <img src="/gatorade.png" alt="Gatorade Logo" />
            </div>
            <div className="gatorade-cta-content">
              <div className="gatorade-badge">
                <i className="fas fa-trophy"></i>
                <span>Tournament Registration Open</span>
              </div>
              <h2>Gatorade Malaysia Closed Pickleball Championship 2025</h2>
              <p>Register now for the premier pickleball championship event of the year</p>
              <a
                href="https://tournament.malaysiapickleball.my/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gatorade-register"
              >
                <i className="fas fa-ticket-alt"></i>
                Register for Tournament
                <i className="fas fa-arrow-right"></i>
              </a>
            </div>
            <div className="gatorade-cta-graphic">
              <i className="fas fa-table-tennis"></i>
            </div>
          </div>
        </div>
      </section>

      <section className="registration-picklezone-posts-wrapper">
        <div className="container">
          <div className="registration-picklezone-posts-grid">
            {/* Left Column - Player Registration and PickleZone Section */}
            <div className="left-column">
              <div className="player-registration">
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
                    <Link to="/player-registration/new" className="btn-register">
                      Register as Player
                    </Link>
                    <Link to="/player/login" className="btn-login">
                      Player Login
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mpa-portal-section">
                <div className="mpa-portal-card">
                  <div className="mpa-portal-icon">
                    <img src="/mpa.png" alt="MPA Portal Logo" />
                  </div>
                  <div className="mpa-portal-content">
                    <div className="mpa-portal-text">
                      <h2>MPA Portal</h2>
                      <p>Your gateway to official tournament applications and skill assessments</p>
                      <ul className="portal-benefits-list">
                        <li><i className="fas fa-check-circle"></i> Apply for tournaments</li>
                        <li><i className="fas fa-check-circle"></i> Take skill assessments</li>
                        <li><i className="fas fa-check-circle"></i> Track your applications</li>
                        <li><i className="fas fa-check-circle"></i> View assessment results</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mpa-portal-actions">
                    <a
                      href="https://mpaportal.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-visit-portal"
                    >
                      Visit MPA Portal
                    </a>
                  </div>
                </div>
              </div>

              <div className="picklezone-section-inline">
                <div className="picklezone-card">
                  <div className="picklezone-icon">
                    <img src="/picklezonelogo.png" alt="PickleZone Logo" />
                  </div>
                  <div className="picklezone-content">
                    <div className="picklezone-text">
                      <h2>PickleZone - Social Hub for Pickleball Players</h2>
                      <p>Connect with fellow players in Malaysia's first dedicated pickleball social media platform. Register as an MPA player to unlock access to this exclusive community.</p>
                      <ul className="picklezone-benefits-list">
                        <li><i className="fas fa-check-circle"></i> Share your pickleball moments</li>
                        <li><i className="fas fa-check-circle"></i> Connect with players nationwide</li>
                        <li><i className="fas fa-check-circle"></i> Join community discussions</li>
                        <li><i className="fas fa-check-circle"></i> Stay updated with latest news</li>
                      </ul>
                    </div>
                  </div>
                  <div className="picklezone-actions">
                    <Link to="/picklezone/login" className="btn-picklezone-login">
                      Enter PickleZone
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - PickleZone Posts */}
            <div className="right-column">
              <div className="picklezone-posts-section">
                <div className="posts-header">
                  <div className="posts-header-left">
                    <img src="/picklezonelogo.png" alt="PickleZone" className="posts-header-logo" />
                    <h2>Community</h2>
                  </div>
                  <Link to="/picklezone/login" className="btn-join-community">
                    Join
                  </Link>
                </div>
                <div className="posts-feed">
                  {picklezonePosts.length > 0 ? (
                    picklezonePosts.map((post) => {
                      return (
                        <div key={post._id} className="post-card">
                          <div className="post-header">
                            <div className="post-author">
                              {post.author?.profilePicture ? (
                                <img
                                  src={post.author.profilePicture}
                                  alt={post.author?.fullName || 'User'}
                                  className="author-avatar"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <div className={`author-avatar-icon ${post.author?.gender === 'Male' ? 'male' : post.author?.gender === 'Female' ? 'female' : 'neutral'}`}>
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              <div className="author-info">
                                <span className="author-name">{post.author?.username || post.author?.fullName || 'Anonymous'}</span>
                                <span className="post-time">
                                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="post-content">
                            <p>{post.content}</p>

                            {/* Video Embed from Link */}
                            {post.linkData && post.linkData.isVideo && (
                              <div className="post-video-embed" style={{ marginTop: '1rem' }}>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                                  <iframe
                                    src={post.linkData.embedUrl}
                                    title={post.linkData.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                  ></iframe>
                                </div>
                              </div>
                            )}

                            {/* Link Preview (non-video) */}
                            {post.linkData && !post.linkData.isVideo && (
                              <div className="post-link-preview" style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.open(post.linkData.url, '_blank')}>
                                {post.linkData.image && (
                                  <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                                    <img src={post.linkData.image} alt={post.linkData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                )}
                                <div style={{ padding: '1rem' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    <i className="fas fa-link"></i> {post.linkData.url ? new URL(post.linkData.url).hostname : ''}
                                  </div>
                                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{post.linkData.title}</h4>
                                  {post.linkData.description && (
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>{post.linkData.description}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Images */}
                            {(post.imageUrls && post.imageUrls.length > 0) || post.imageUrl ? (
                              <div className="post-media" style={{ marginTop: '1rem' }}>
                                <img
                                  src={post.imageUrls ? post.imageUrls[0] : post.imageUrl}
                                  alt="Post media"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            ) : null}
                          </div>
                          <div className="post-stats">
                            <span><i className="fas fa-heart"></i> {post.likes?.length || 0}</span>
                            <span><i className="fas fa-comment"></i> {post.comments?.length || 0}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-posts">
                      <i className="fas fa-comments"></i>
                      <p>No posts yet. Join PickleZone to see community updates!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="picklezone-section" style={{ display: 'none' }}>
        <div className="container">
          <div className="picklezone-card">
            <div className="picklezone-actions">
              <Link to="/picklezone/login" className="btn-picklezone-login">
                <i className="fas fa-sign-in-alt"></i>
                Enter PickleZone
              </Link>
            </div>
            <div className="picklezone-content">
              <div className="picklezone-text">
                <h2>PickleZone - Social Hub for Pickleball Players</h2>
                <p>Connect with fellow players in Malaysia's first dedicated pickleball social media platform. Register as an MPA player to unlock access to this exclusive community.</p>
                <ul className="picklezone-benefits-list">
                  <li><i className="fas fa-check-circle"></i> Share your pickleball moments</li>
                  <li><i className="fas fa-check-circle"></i> Connect with players nationwide</li>
                  <li><i className="fas fa-check-circle"></i> Join community discussions</li>
                  <li><i className="fas fa-check-circle"></i> Stay updated with latest news</li>
                </ul>
              </div>
              <div className="picklezone-icon">
                <img src="/picklezonelogo.png" alt="PickleZone Logo" />
              </div>
            </div>
          </div>
        </div>
      </section>

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
                <Link to="/tournament-guidelines" className="guideline-detail-button">Tournament Guidelines</Link>
              </div>
              <div className="guideline-card">
                <h3>Venue Guidelines</h3>
                <ul>
                  <li>Court specifications and dimensions</li>
                  <li>Safety standards and requirements</li>
                  <li>Facility management protocols</li>
                  <li>Booking and reservation procedures</li>
                </ul>
                <Link to="/venue-guidelines" className="guideline-detail-button">Venue Guidelines</Link>
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
                <div key={tournament._id || tournament.applicationId} className="tournament-card">
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
                <a href="/training">
                  <button className="training-button">Explore Courses</button>
                </a>
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
                <a href="/training">
                  <button className="training-button">Book Clinics</button>
                </a>
              </div>
            </div>
            <h2>
              <div>Training</div>
              <div>Programs</div>
            </h2>
          </div>
        </div>
      </section>

      <section className="certification-roadmap">
        <div className="container">
          <div className="roadmap-header">
            <h2>Professional Development for Pickleball Instructors & Coaches</h2>
            <p>Progress through our comprehensive certification pathway</p>
          </div>

          <div className="roadmap-timeline">
            <div className="roadmap-level">
              <div className="level-badge">START</div>
              <div className="level-card">
                <h3>Pickleball Basic Fundamentals</h3>
                <div className="level-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar-day"></i>
                    <span>1 Day Course</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-certificate"></i>
                    <span>Certificate of Attendance</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>32 - 36 participants</span>
                  </div>
                  <div className="detail-item price">
                    <i className="fas fa-tag"></i>
                    <span>RM250 per pax</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="roadmap-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="roadmap-level">
              <div className="level-badge level-1">LEVEL 1</div>
              <div className="level-card">
                <h3>MPA Level 1 Associate Coach</h3>
                <div className="level-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar-day"></i>
                    <span>4 Days Course</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-certificate"></i>
                    <span>Full Certificate of Competence</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-id-card"></i>
                    <span>License to Practice</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>24 - 32 participants</span>
                  </div>
                  <div className="detail-item price">
                    <i className="fas fa-tag"></i>
                    <span>RM750 per pax</span>
                  </div>
                  <div className="isn-badge">ISN Endorsement in progress</div>
                </div>
              </div>
            </div>

            <div className="roadmap-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="roadmap-level">
              <div className="level-badge level-2">LEVEL 2</div>
              <div className="level-card">
                <h3>MPA Level 2 Professional Coach</h3>
                <div className="level-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar-day"></i>
                    <span>4.5 Days Course</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-certificate"></i>
                    <span>Full Certificate of Competence</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-id-card"></i>
                    <span>License to Practice</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>24 - 32 participants</span>
                  </div>
                  <div className="detail-item price">
                    <i className="fas fa-tag"></i>
                    <span>RM850 per pax</span>
                  </div>
                  <div className="isn-badge">ISN Endorsement in progress</div>
                </div>
              </div>
            </div>

            <div className="roadmap-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="roadmap-level">
              <div className="level-badge level-3">LEVEL 3</div>
              <div className="level-card">
                <h3>MPA Level 3 Master Coach</h3>
                <div className="level-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar-day"></i>
                    <span>5 Days Course</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-certificate"></i>
                    <span>Full Certificate of Competence</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-id-card"></i>
                    <span>License to Practice</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>24 - 32 participants</span>
                  </div>
                  <div className="detail-item price">
                    <i className="fas fa-tag"></i>
                    <span>RM1000 per pax</span>
                  </div>
                  <div className="isn-badge">ISN Endorsement in progress</div>
                </div>
              </div>
            </div>
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
            {milestones.length > 0 ? (
              <div className="timeline-wrapper">
                {/* Render milestones 3 times for truly seamless infinite loop */}
                {[...milestones, ...milestones, ...milestones].map((milestone, index) => (
                  <div key={`milestone-${milestone._id}-${index}`} className="timeline-item">
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
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>Loading milestones...</p>
              </div>
            )}
          </div>

          <div className="view-all-milestones">
            <Link to="/milestones" className="btn-view-all">
              View All Milestones
            </Link>
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
                            src={item.media[0].url}
                            alt={item.title}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <p>{item.summary || item.content.substring(0, 150)}...</p>
                      <Link to={`/news/${item.newsId || item._id}`} className="news-link">
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
                    src={selectedNews.media[0].url.startsWith('http') ? selectedNews.media[0].url : `http://localhost:5001${selectedNews.media[0].url}`}
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

      {/* Image Popup Modal */}
      {showImagePopup && (
        <div className="modal-overlay" onClick={() => setShowImagePopup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '70vw', maxHeight: 'none', overflow: 'visible', padding: 0, background: 'transparent', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="modal-close popup-close-btn"
                onClick={() => setShowImagePopup(false)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  zIndex: 10,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4), 0 0 0 3px rgba(239, 68, 68, 0.1)',
                  backdropFilter: 'blur(4px)',
                  outline: 'none'
                }}
              >
                ✕
              </button>
              <a href="https://tournament.malaysiapickleball.my" target="_blank" rel="noopener noreferrer">
                <img
                  src="/malaysiaclosed.png"
                  alt="Announcement"
                  style={{
                    maxWidth: '70vw',
                    width: 'auto',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                    cursor: 'pointer'
                  }}
                  onError={(e) => {
                    console.error('Failed to load image');
                    setShowImagePopup(false);
                  }}
                />
              </a>
              <p style={{
                color: 'white',
                textAlign: 'center',
                marginTop: '0.75rem',
                fontSize: '0.9rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
              }}>
                Click the poster to get information
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
