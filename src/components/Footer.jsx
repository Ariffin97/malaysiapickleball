import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {

  return (
    <>
      <footer className="footer-gradient">
        <div className="footer-container">
          {/* Mobile Simple Footer */}
          <div className="mobile-footer">
            <div className="mobile-footer-content">
              <div className="mobile-brand">
                <h3>Malaysia Pickleball</h3>
                <p>Connecting Malaysia's pickleball community through tournaments and coaching excellence.</p>
              </div>

              <div className="mobile-footer-links">
                <Link to="/about-us">About Us</Link>
                <span>•</span>
                <Link to="/contact-us">Contact</Link>
                <span>•</span>
                <Link to="/privacy-policy">Privacy</Link>
                <span>•</span>
                <Link to="/terms-and-conditions">Terms</Link>
                <span>•</span>
                <a href="/admin" className="admin-link">Admin</a>
              </div>
              <div className="mobile-fenix">
                <span>Built with</span>
                <i className="fas fa-heart"></i>
                <span>by Fenix Digital</span>
              </div>
            </div>
          </div>

          {/* Desktop Full Footer Content */}
          <div className="desktop-footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <div className="brand-header">
                <div className="brand-logo">
                  <img src="/mpa.png" alt="MPA Logo" />
                </div>
                <div>
                  <h3>Malaysia Pickleball</h3>
                  <p className="brand-subtitle">Association</p>
                </div>
              </div>
              <p className="brand-description">
                Connecting Malaysia's pickleball community through tournaments and coaching excellence.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/malaysiapickleball" target="_blank" rel="noopener noreferrer" className="social-icon facebook">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="https://www.instagram.com/learnplaypickleballmsia/" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h4>Quick Links</h4>
              <nav className="footer-nav">
                <Link to="/tournament" className="footer-link">
                  <i className="fas fa-trophy"></i>
                  <span>Tournaments</span>
                </Link>
                <Link to="/about-us" className="footer-link">
                  <i className="fas fa-info-circle"></i>
                  <span>About Us</span>
                </Link>
                <Link to="/contact-us" className="footer-link">
                  <i className="fas fa-envelope"></i>
                  <span>Contact Us</span>
                </Link>
                <Link to="/registered-organizers" className="footer-link">
                  <i className="fas fa-users"></i>
                  <span>Organizers</span>
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="footer-section">
              <h4>Resources</h4>
              <nav className="footer-nav">
                <Link to="/tournament-guidelines" className="footer-link">
                  <i className="fas fa-book"></i>
                  <span>Tournament Guidelines</span>
                </Link>
                <Link to="/venue-guidelines" className="footer-link">
                  <i className="fas fa-map-marked-alt"></i>
                  <span>Venue Guidelines</span>
                </Link>
                <Link to="/privacy-policy" className="footer-link">
                  <i className="fas fa-shield-alt"></i>
                  <span>Privacy Policy</span>
                </Link>
                <Link to="/terms-and-conditions" className="footer-link">
                  <i className="fas fa-file-contract"></i>
                  <span>Terms & Conditions</span>
                </Link>
              </nav>
            </div>

            {/* Contact Info */}
            <div className="footer-section">
              <h4>Get in Touch</h4>
              <p className="footer-description">
                Have questions? We'd love to hear from you.
              </p>
              <Link to="/contact-us" className="btn-contact">
                <i className="fas fa-envelope"></i>
                <span>Contact Us</span>
              </Link>
            </div>
          </div>

          {/* Desktop Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="footer-copyright">
                <p>&copy; 2025 Malaysia Pickleball Association</p>
                <div className="footer-links">
                  <Link to="/privacy-policy">Privacy</Link>
                  <span>•</span>
                  <Link to="/terms-and-conditions">Terms</Link>
                  <span>•</span>
                  <a href="/admin" className="admin-link">Admin</a>
                </div>
              </div>
              <div className="fenix-credit">
                <span>Built with</span>
                <i className="fas fa-heart"></i>
                <span>by Fenix Digital</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
