import './About.css';

function About() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="about-page">
      <section className="page-header">
        <h1>About Us</h1>
        <p>Fenix Digital - Official Technical Partner of MPA</p>
      </section>

      <section className="content-section">
        <div className="container">
          <h2>Who We Are</h2>
          <p>
            Fenix Digital is a Malaysia-based digital innovation company specializing in system development, data management, and secure web infrastructure.
            We are the <strong>Official Technical Partner</strong> appointed by the Malaysia Pickleball Association (MPA) to develop, manage, and maintain its official digital ecosystem—including websites, portals, and data systems.
          </p>

          <h2>Our Mission</h2>
          <p>
            To empower Malaysia's pickleball community with reliable, transparent, and secure digital solutions that strengthen the sport's governance, visibility, and growth.
          </p>

          <h2>What We Do</h2>
          <ul className="services-list">
            <li>Develop and maintain the official MPA website and tournament portal</li>
            <li>Manage data processing, hosting, and security under PDPA compliance</li>
            <li>Support MPA's digital transformation with innovative, cost-effective solutions</li>
            <li>Provide real-time player registration, ranking, and tournament management systems</li>
          </ul>

          <h2>Our Commitment</h2>
          <p>
            Fenix Digital operates independently and transparently, ensuring all digital systems under MPA's network are:
          </p>
          <ul className="services-list">
            <li>Secure, compliant, and continuously improved</li>
            <li>Managed with integrity and professionalism</li>
            <li>Built for long-term community benefit</li>
          </ul>

          <h2>Contact Us</h2>
          <div className="contact-details">
            <p>📧 Email: <a href="mailto:ariffin@fenixdigital.my">ariffin@fenixdigital.my</a></p>
            <p>🌐 Website: <a href="https://www.fenixdigital.my" target="_blank" rel="noopener noreferrer">www.fenixdigital.my</a></p>
            <p>📍 Address: Lot 1875, 1st Floor, Marina Square Phase 2, 98000 Miri, Sarawak</p>
          </div>

          <div className="footer-note">
            <p>&copy; {currentYear} Fenix Digital — All Rights Reserved.</p>
            <p>Official Technical Partner of the Malaysia Pickleball Association.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
