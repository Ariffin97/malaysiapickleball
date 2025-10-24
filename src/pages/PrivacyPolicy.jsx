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
              Fenix Digital ("we", "our", or "us") values your privacy and is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, and safeguard information through our digital platforms
              operated for the Malaysia Pickleball Association (MPA).
            </p>
            <p>
              By using our website or services, you acknowledge that you have read and understood this policy.
            </p>
          </section>

          {/* Who We Are */}
          <section className="privacy-section">
            <h2>2. Who We Are</h2>
            <p>
              Fenix Digital is a technology and e-commerce company that develops and manages digital systems for
              organizations and communities.
            </p>
            <ul>
              <li>We were officially appointed as the Official Technical Partner by the Malaysia Pickleball Association (MPA)
              Executive Committee (EXCO) on 30 June 2025, following a proposal submitted on 29 June 2025.</li>
              <li>An official appointment letter was submitted to MYNIC during the registration of MPA's domains, authorizing
              Fenix Digital to represent MPA in all digital and domain-related matters.</li>
            </ul>
            <p className="highlight-text">
              <strong>As the data controller, Fenix Digital is solely responsible for the collection, processing, and management
              of personal data through this platform.</strong>
            </p>
            <ul>
              <li>MPA does not collect or store personal data independently. MPA's access is limited to verification, validation,
              and tournament management purposes only.</li>
            </ul>
            <p>
              This website is currently in beta, while Fenix Digital's PDPA registration with the Jabatan Perlindungan Data
              Peribadi (JPDP) is under review.
            </p>
          </section>

          {/* What Personal Data We Collect */}
          <section className="privacy-section">
            <h2>3. What Personal Data We Collect</h2>
            <p>
              We may collect the following categories of personal data when you register or use the platform:
            </p>
            <ul>
              <li><strong>Identification:</strong> Full name, IC number, date of birth, age, gender</li>
              <li><strong>Contact:</strong> Email address, phone number, residential address</li>
              <li><strong>Account:</strong> Username, password (encrypted), player ID</li>
              <li><strong>Profile:</strong> Profile photo, skill level, membership details</li>
              <li><strong>Tournament Data:</strong> Registrations, match results, statistics, rankings</li>
              <li><strong>Technical Information:</strong> IP address, device type, browser, and usage analytics</li>
            </ul>
            <p>
              We also use cookies and similar technologies to enhance user experience and remember preferences.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section className="privacy-section">
            <h2>4. How We Use Your Information</h2>
            <p>Fenix Digital processes personal data to:</p>
            <ul>
              <li>Create and manage user accounts</li>
              <li>Operate tournament and registration systems</li>
              <li>Verify memberships and eligibility</li>
              <li>Support official MPA activities (via limited administrative access)</li>
              <li>Ensure platform security and fraud prevention</li>
              <li>Improve system performance and develop new features</li>
              <li>Comply with applicable Malaysian laws</li>
            </ul>
            <p className="highlight-text">
              <strong>We do not sell or share your data for marketing or commercial purposes.</strong>
            </p>
          </section>

          {/* Relationship Between Fenix Digital and MPA */}
          <section className="privacy-section">
            <h2>5. Relationship Between Fenix Digital and MPA</h2>
            <p>
              Fenix Digital serves as the technical and data custodian for the MPA platform.
            </p>
            <p>MPA has read-only access to specific information for:</p>
            <ul>
              <li>Verification of player or club identities</li>
              <li>Validation of tournament participation</li>
              <li>Operational communication and reporting</li>
            </ul>
            <p>
              All access by MPA is conducted through administrative interfaces controlled by Fenix Digital.
            </p>
            <p className="highlight-text">
              <strong>MPA cannot export, copy, or store personal data outside the system.</strong>
            </p>
          </section>

          {/* Data Storage and Security */}
          <section className="privacy-section">
            <h2>6. Data Storage and Security</h2>
            <p>
              Your information is stored securely on servers managed by Fenix Digital.
            </p>
            <p>We implement industry-standard measures including:</p>
            <ul>
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Role-based access controls for staff and administrators</li>
              <li>Regular security audits and backups</li>
              <li>24/7 system monitoring for suspicious activities</li>
            </ul>
            <p>
              Data may be stored locally or on secure cloud infrastructure that complies with international data
              protection standards.
            </p>
          </section>

          {/* Data Retention */}
          <section className="privacy-section">
            <h2>7. Data Retention</h2>
            <p>
              Personal data is retained only as long as necessary to fulfill its original purpose or as required by law.
            </p>
            <p>
              When no longer needed, data is securely deleted or anonymized.
            </p>
          </section>

          {/* Your Rights */}
          <section className="privacy-section">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request corrections or updates</li>
              <li>Request data deletion (subject to legal or operational requirements)</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Manage your communication and cookie preferences</li>
            </ul>
            <p>
              To exercise these rights, contact Fenix Digital (details below).
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="privacy-section">
            <h2>9. Children's Privacy</h2>
            <p>
              This platform is not intended for users under 13 years old.
            </p>
            <p>
              For users aged 13–17, parental or guardian consent is required.
            </p>
            <p>
              If personal data from a child is collected without consent, we will promptly delete it.
            </p>
          </section>

          {/* Legal Compliance */}
          <section className="privacy-section">
            <h2>10. Legal Compliance</h2>
            <p>Fenix Digital complies with:</p>
            <ul>
              <li>Personal Data Protection Act 2010 (PDPA)</li>
              <li>Communications and Multimedia Act 1998</li>
              <li>Other relevant Malaysian laws and JPDP guidelines</li>
            </ul>
            <p>
              All processing is done according to principles of lawfulness, fairness, and transparency.
            </p>
          </section>

          {/* Data Breach Notification */}
          <section className="privacy-section">
            <h2>11. Data Breach Notification</h2>
            <p>
              If a data breach occurs that may affect your personal data, Fenix Digital will:
            </p>
            <ul>
              <li>Investigate immediately</li>
              <li>Notify affected users</li>
              <li>Report to relevant authorities (JPDP, MCMC, etc.)</li>
              <li>Implement corrective measures</li>
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
              WHOIS privacy is applied for cybersecurity reasons.
            </p>
            <p>
              Ownership and technical records can be verified by relevant authorities upon request.
            </p>
          </section>

          {/* Transparency & Independence */}
          <section className="privacy-section">
            <h2>13. Transparency & Independence</h2>
            <p>
              Fenix Digital remains independent, neutral, and cooperative with all elected MPA representatives.
            </p>
            <p>
              Our mission is to ensure continuity, security, and transparency in digital operations while helping the
              association keep pace with the sport's digital growth in Malaysia.
            </p>
            <p>
              All systems and services have been developed and funded by Fenix Digital as a voluntary contribution,
              without any financial involvement from MPA.
            </p>
          </section>

          {/* Contact Information */}
          <section className="privacy-section">
            <h2>14. Contact Information</h2>

            <div className="contact-info-box">
              <h4>Data Controller:</h4>
              <p><strong>Fenix Digital</strong></p>
              <p>Role: Data controller and technical custodian</p>
              <p>PDPA Registration: Submitted to JPDP – Under Review</p>
              <p><br />Email: tournament@malaysiapickleballassociation.org</p>
              <p>Subject Line: <strong>ATTN: Fenix Digital – Data Privacy Inquiry</strong></p>
            </div>

            <div className="contact-info-box">
              <h4>For MPA-related program or membership inquiries:</h4>
              <p><strong>Malaysia Pickleball Association (MPA)</strong></p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Website: malaysiapickleballassociation.org</p>
            </div>
          </section>

          {/* Acknowledgment Section */}
          <section className="privacy-section acknowledgment-section">
            <h2>15. Acknowledgment</h2>
            <p>By using this platform, you acknowledge that:</p>
            <ul>
              <li>Fenix Digital is the data controller responsible for managing personal data</li>
              <li>MPA only has limited access for verification and operational purposes</li>
              <li>The platform is currently in beta while PDPA compliance is being finalized</li>
              <li>Fenix Digital's PDPA registration is under review by JPDP</li>
            </ul>
            <p>
              We remain committed to transparency, professionalism, and data protection, and to supporting the
              continued growth of pickleball in Malaysia through secure and compliant digital solutions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="privacy-footer">
          <p>&copy; {currentYear} Fenix Digital</p>
          <p>Official Technical Partner of the Malaysia Pickleball Association</p>
          <p>Data Controller | PDPA Registration Under Review | Platform in Beta</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
