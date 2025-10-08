import { useState } from 'react';
import './Footer.css';

function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCookies, setShowCookies] = useState(false);

  const openModal = (type) => {
    if (type === 'privacy') setShowPrivacy(true);
    if (type === 'terms') setShowTerms(true);
    if (type === 'cookies') setShowCookies(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowPrivacy(false);
    setShowTerms(false);
    setShowCookies(false);
    document.body.style.overflow = '';
  };

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
                  <button onClick={() => openModal('privacy')}>Privacy</button>
                  <span>•</span>
                  <button onClick={() => openModal('terms')}>Terms</button>
                  <span>•</span>
                  <button onClick={() => openModal('cookies')}>Cookies</button>
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

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="modal show" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Privacy Policy</h2>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-date">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="modal-sections">
                <section>
                  <h3>Information We Collect</h3>
                  <p>
                    Malaysia Pickleball Association collects information you provide directly to us, such as when you create an account, register for tournaments, or contact us for support.
                  </p>
                  <ul>
                    <li>Personal information (name, email, phone number)</li>
                    <li>Tournament registration details</li>
                    <li>Payment information for services</li>
                    <li>Communication preferences</li>
                  </ul>
                </section>

                <section>
                  <h3>How We Use Your Information</h3>
                  <p>We use the information we collect to:</p>
                  <ul>
                    <li>Provide and maintain our services</li>
                    <li>Process tournament registrations</li>
                    <li>Send important notifications and updates</li>
                    <li>Improve our website and services</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h3>Information Sharing</h3>
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
                  </p>
                </section>

                <section>
                  <h3>Contact Us</h3>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at:
                    <br /><strong>Email:</strong> privacy@malaysiapickleball.org
                    <br /><strong>Phone:</strong> +60 3-1234 5678
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal show" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Terms of Service</h2>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-date">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="modal-sections">
                <section>
                  <h3>1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using the Malaysia Pickleball Association website and services, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h3>2. About Our Services</h3>
                  <p>Malaysia Pickleball Association provides:</p>
                  <ul>
                    <li>Tournament organization and management services</li>
                    <li>Player registration and ranking systems</li>
                    <li>Venue and facility information</li>
                    <li>Coach and referee certification programs</li>
                    <li>Live streaming of tournaments</li>
                    <li>Community messaging and communication platforms</li>
                  </ul>
                </section>

                <section>
                  <h3>3. User Responsibilities</h3>
                  <p>Users are responsible for:</p>
                  <ul>
                    <li>Providing accurate registration information</li>
                    <li>Maintaining account security</li>
                    <li>Following tournament rules and regulations</li>
                    <li>Respecting other users and officials</li>
                  </ul>
                </section>

                <section>
                  <h3>4. Limitation of Liability</h3>
                  <p>
                    Malaysia Pickleball Association shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
                  </p>
                </section>

                <section>
                  <h3>5. Contact Information</h3>
                  <p>
                    For questions about these Terms of Service:
                    <br /><strong>Email:</strong> legal@malaysiapickleball.org
                    <br /><strong>Phone:</strong> +60 3-1234 5678
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookies Modal */}
      {showCookies && (
        <div className="modal show" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cookie Policy</h2>
              <button className="close-button" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="modal-date">Last updated: {new Date().toLocaleDateString()}</p>

              <div className="modal-sections">
                <section>
                  <h3>What Are Cookies?</h3>
                  <p>
                    Cookies are small text files that are placed on your computer or mobile device when you visit our website. They help us provide you with a better experience by remembering your preferences and improving functionality.
                  </p>
                </section>

                <section>
                  <h3>How We Use Cookies</h3>
                  <p>Malaysia Pickleball Association uses cookies to:</p>
                  <ul>
                    <li>Keep you logged in during your session</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze website traffic and usage patterns</li>
                    <li>Improve website performance and security</li>
                    <li>Provide personalized content and features</li>
                  </ul>
                </section>

                <section>
                  <h3>Types of Cookies We Use</h3>
                  <div className="cookie-types">
                    <div>
                      <h4>Essential Cookies</h4>
                      <p>Necessary for the website to function properly, including session cookies and security cookies.</p>
                    </div>
                    <div>
                      <h4>Functional Cookies</h4>
                      <p>Enhance functionality and personalization, such as language preferences and user settings.</p>
                    </div>
                    <div>
                      <h4>Analytics Cookies</h4>
                      <p>Help us understand how visitors use our website to improve performance and user experience.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3>Managing Cookies</h3>
                  <p>
                    You can control cookies through your browser settings. Most browsers allow you to view, delete, and block cookies. However, disabling cookies may affect some website functionality.
                  </p>
                </section>

                <section>
                  <h3>Contact Us</h3>
                  <p>
                    Questions about our Cookie Policy?
                    <br /><strong>Email:</strong> privacy@malaysiapickleball.org
                    <br /><strong>Phone:</strong> +60 3-1234 5678
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
