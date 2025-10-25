import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnWhite, setIsOnWhite] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);

      // Check if we're past the hero section (hero is ~600px tall + 70px navbar)
      setIsOnWhite(scrollY > 670);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar-modern ${isScrolled ? 'scrolled' : ''} ${isOnWhite ? 'on-white' : ''}`}>
        <div className="nav-container">
          {/* Left Side - Logo, Brand & Tournament */}
          <div className="nav-left">
            <Link to="/" className="brand-container">
              <img src="/mpa.png" alt="MPA" className="logo-image" />
              <span className="brand-text">Malaysia Pickleball Association</span>
              <span className="beta-badge">Beta 3.0</span>
            </Link>
            <Link to="/tournament" className="nav-link desktop-link">Tournament</Link>
            <Link to="/registered-organizers" className="nav-link desktop-link">Registered Organizers</Link>
          </div>

          {/* Right - Home (Desktop) */}
          <div className="nav-links">
            {location.pathname !== '/' && (
              <Link to="/" className="nav-link">
                <span>Home</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
          <div className="mobile-menu">
            <Link to="/tournament" className="mobile-menu-link" onClick={closeMobileMenu}>
              <i className="fas fa-trophy"></i>
              Tournament
            </Link>
            <Link to="/registered-organizers" className="mobile-menu-link" onClick={closeMobileMenu}>
              <i className="fas fa-users"></i>
              Registered Organizers
            </Link>
            {location.pathname !== '/' && (
              <Link to="/" className="mobile-menu-link" onClick={closeMobileMenu}>
                <i className="fas fa-home"></i>
                Home
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
