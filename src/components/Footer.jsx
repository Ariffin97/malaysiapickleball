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

              {/* Mobile Contact Sections */}
              <div className="mobile-contacts">
                <div className="mobile-contact-section">
                  <h4>Technical Contact</h4>
                  <div className="mobile-contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>ariffin@fenixdigital.my</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-phone"></i>
                    <span>+6011-16197471</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>zac@fenixdigital.my</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-phone"></i>
                    <span>+6017-8941403</span>
                  </div>
                </div>

                <div className="mobile-contact-section">
                  <h4>MPA Contact</h4>
                  <div className="mobile-contact-item">
                    <i className="fas fa-user"></i>
                    <span>Puan Delima Ibrahim</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-phone"></i>
                    <span>+6012-8830407</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>president@malaysiapickleballassociation.org</span>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>tournament@malaysiapickleballassociation.org</span>
                  </div>
                </div>
              </div>

              <div className="mobile-footer-links">
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
                <a href="/tournament" className="footer-link">
                  <i className="fas fa-trophy"></i>
                  <span>Tournaments</span>
                </a>
                <a href="/coaches" className="footer-link">
                  <i className="fas fa-chalkboard-teacher"></i>
                  <span>Coaches</span>
                </a>
                <a href="/venue" className="footer-link">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Venues</span>
                </a>
                <a href="/referee" className="footer-link">
                  <i className="fas fa-whistle"></i>
                  <span>Referees</span>
                </a>
              </nav>
            </div>

            {/* Technical Contact */}
            <div className="footer-section">
              <h4>Technical Contact</h4>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>ariffin@fenixdigital.my</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+6011-16197471</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>zac@fenixdigital.my</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+6017-8941403</span>
              </div>
            </div>

            {/* MPA Contact */}
            <div className="footer-section">
              <h4>MPA Contact</h4>
              <div className="contact-item">
                <i className="fas fa-user"></i>
                <span>Puan Delima Ibrahim</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+6012-8830407</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>president@malaysiapickleballassociation.org</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>tournament@malaysiapickleballassociation.org</span>
              </div>
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
