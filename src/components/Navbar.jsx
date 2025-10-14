import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnWhite, setIsOnWhite] = useState(false);

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

  return (
    <nav className={`navbar-modern ${isScrolled ? 'scrolled' : ''} ${isOnWhite ? 'on-white' : ''}`}>
      <div className="nav-container">
        {/* Left Side - Logo, Brand & Tournament */}
        <div className="nav-left">
          <Link to="/" className="brand-container">
            <img src="/mpa.png" alt="MPA" className="logo-image" />
            <span className="brand-text">Malaysia Pickleball Association</span>
            <span className="beta-badge">Beta 1.0</span>
          </Link>
          <Link to="/tournament" className="nav-link">Tournament</Link>
        </div>

        {/* Right - Home & Admin Login */}
        <div className="nav-links">
          {location.pathname !== '/' && (
            <Link to="/" className="nav-link">
              <span>Home</span>
            </Link>
          )}
          <Link to="/admin" className="nav-link">Admin Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
