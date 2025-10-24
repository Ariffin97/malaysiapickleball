import { useState, useEffect } from 'react';
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  const [showNotice, setShowNotice] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Check if user has already seen the notice
    const hasSeenNotice = localStorage.getItem('privacyPolicyNoticeAcknowledged');
    if (!hasSeenNotice) {
      setShowNotice(true);
    }
  }, []);

  const handleCloseNotice = () => {
    setShowNotice(false);
    localStorage.setItem('privacyPolicyNoticeAcknowledged', 'true');
  };

  return (
    <div className="privacy-page">
      {/* Privacy Policy Update Notice Popup */}
      {showNotice && (
        <div className="privacy-notice-overlay">
          <div className="privacy-notice-modal">
            <p>
              We have updated our Privacy Policy to provide greater transparency and integrity in how we handle your personal data.
            </p>
            <button onClick={handleCloseNotice}>OK</button>
          </div>
        </div>
      )}

      <div className="privacy-container">
        {/* Header Section */}
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {currentDate}</p>
        </div>

        {/* Main Content */}
        <div className="privacy-content">
          {/* Introduction */}
          <section className="privacy-section intro-section">
            <h2>1. Introduction</h2>
            <p>
              Fenix Digital ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, and safeguard your information through our digital platforms
              operated for the Malaysia Pickleball Association (MPA).
            </p>
            <p>
              By using this website or its services, you acknowledge that you have read, understood, and agreed to the terms
              of this Privacy Policy.
            </p>
          </section>

          {/* Platform Ownership */}
          <section className="privacy-section">
            <h2>2. Platform Ownership and Technical Partnership</h2>
            <p>
              This website and its associated digital systems are developed, owned, and operated by{' '}
              <strong>Fenix Digital (Company Registration No: MRI/BNR/241/2024)</strong>, the Official Technical Partner
              appointed by the Malaysia Pickleball Association (MPA) Executive Committee on 30 June 2025.
            </p>
            <p>
              An official appointment letter was submitted to MYNIC, authorizing Fenix Digital to represent MPA in all
              digital and domain-related matters.
            </p>
            <p>
              Fenix Digital manages all hosting, data processing, and system infrastructure, while MPA oversees the sport's
              organizational and administrative aspects.
            </p>
            <p>
              This website is currently in beta, and Fenix Digital's PDPA registration with the Jabatan Perlindungan Data
              Peribadi (JPDP) is under review.
            </p>
          </section>

          {/* Data Controller */}
          <section className="privacy-section">
            <h2>3. Data Controller and Data Access</h2>
            <p>
              <strong>Data Controller:</strong> Fenix Digital is solely responsible for collecting, processing, and managing
              all personal data on this platform.
            </p>
            <p>
              <strong>MPA's Role:</strong> MPA does not collect or store personal data independently. MPA has read-only access
              to limited data strictly for verification, validation, and tournament management.
            </p>
          </section>

          {/* Personal Data Collected */}
          <section className="privacy-section">
            <h2>4. Personal Data Collected</h2>
            <p>We may collect:</p>
            <ul>
              <li>Identification details (name, IC number, date of birth, gender)</li>
              <li>Contact information (email, phone, address)</li>
              <li>Account details (username, encrypted password, player ID)</li>
              <li>Tournament and ranking information</li>
              <li>Device and browser data for analytics and security</li>
            </ul>
            <p>
              Cookies are used to improve user experience and remember preferences.
            </p>
          </section>

          {/* How We Use Data */}
          <section className="privacy-section">
            <h2>5. How We Use Your Data</h2>
            <p>We process data to:</p>
            <ul>
              <li>Register and manage user accounts</li>
              <li>Operate tournaments and membership systems</li>
              <li>Support MPA's verification and operational tasks</li>
              <li>Maintain security and prevent misuse</li>
              <li>Improve services through analytics</li>
              <li>Comply with Malaysian laws</li>
            </ul>
            <p className="highlight-text">
              <strong>We do not sell or lease your data.</strong>
            </p>
          </section>

          {/* Data Security */}
          <section className="privacy-section">
            <h2>6. Data Security and Storage</h2>
            <p>
              All data is stored on secure servers managed by Fenix Digital.
            </p>
            <p>Security measures include:</p>
            <ul>
              <li>SSL/TLS encryption</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and backups</li>
              <li>24/7 monitoring for unauthorized access</li>
              <li>PDPA-aligned access limitation and retention policies</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="privacy-section">
            <h2>7. Data Retention</h2>
            <p>
              Data is retained only as long as necessary for operational or legal purposes.
            </p>
            <p>
              When no longer required, it is securely deleted or anonymized.
            </p>
          </section>

          {/* User Rights */}
          <section className="privacy-section">
            <h2>8. User Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and correct your personal information</li>
              <li>Request deletion or portability of your data</li>
              <li>Manage cookie and communication preferences</li>
            </ul>
            <p>
              Requests should be submitted directly to Fenix Digital (see contact below).
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="privacy-section">
            <h2>9. Children's Privacy</h2>
            <p>
              Users under 13 require parental consent. Data collected without consent will be deleted promptly.
            </p>
          </section>

          {/* Legal Compliance */}
          <section className="privacy-section">
            <h2>10. Legal Compliance</h2>
            <p>Fenix Digital complies with:</p>
            <ul>
              <li>Personal Data Protection Act 2010 (PDPA)</li>
              <li>Communications and Multimedia Act 1998</li>
            </ul>
            <p>and other applicable Malaysian regulations.</p>
          </section>

          {/* Data Breach */}
          <section className="privacy-section">
            <h2>11. Data Breach Notification</h2>
            <p>If a data breach occurs, Fenix Digital will:</p>
            <ul>
              <li>Investigate and contain it immediately</li>
              <li>Notify affected users</li>
              <li>Report to JPDP and relevant authorities</li>
              <li>Implement preventive measures</li>
            </ul>
          </section>

          {/* Domain Ownership */}
          <section className="privacy-section">
            <h2>12. Domain Ownership</h2>
            <p>
              The domains <strong>mpaportal.com</strong> and <strong>malaysiapickleball.my</strong> are legally owned
              and maintained by Fenix Digital.
            </p>
            <p>
              WHOIS privacy is used solely for cybersecurity.
            </p>
            <p>
              Ownership and technical records can be verified by relevant authorities.
            </p>
          </section>

          {/* Transparency */}
          <section className="privacy-section">
            <h2>13. Transparency and Commitment</h2>
            <p>
              All systems and hosting have been fully developed and funded by Fenix Digital as a voluntary contribution,
              without financial involvement from MPA.
            </p>
            <p>
              We remain independent, neutral, and cooperative with all MPA representatives.
            </p>
            <p>
              Our goal is to support Malaysia's pickleball community through secure, transparent, and compliant digital
              innovation.
            </p>
          </section>

          {/* Contact Information */}
          <section className="privacy-section">
            <h2>14. Contact Information</h2>

            <div className="contact-info-box">
              <h4>Data Controller – Fenix Digital</h4>
              <p>Company Reg. No: MRI/BNR/241/2024</p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p><br />Subject: <strong>ATTN: Fenix Digital – Data Privacy Inquiry</strong></p>
            </div>

            <div className="contact-info-box">
              <h4>For MPA Membership or Tournament Inquiries</h4>
              <p><strong>Malaysia Pickleball Association (MPA)</strong></p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Website: malaysiapickleballassociation.org</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="privacy-footer">
          <p>&copy; {currentYear} Fenix Digital</p>
          <p>Company Reg. No: MRI/BNR/241/2024</p>
          <p>Official Technical Partner of the Malaysia Pickleball Association</p>
          <p>PDPA Registration Under Review | Platform in Beta | All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
