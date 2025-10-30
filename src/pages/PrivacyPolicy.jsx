import { useState, useEffect } from 'react';
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  const [showNotice, setShowNotice] = useState(false);

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
          <p className="last-updated">Last Updated: October 30, 2025</p>
        </div>

        {/* Main Content */}
        <div className="privacy-content">
          {/* Introduction */}
          <section className="privacy-section intro-section">
            <h2>1. Introduction</h2>
            <p>
              Fenix Digital ("we", "our", or "us") respects your privacy and is committed to protecting your personal data in accordance with the Personal Data Protection Act 2010 (PDPA).
              This Privacy Policy explains how we collect, use, disclose, and safeguard information through our digital platforms developed for the Malaysia Pickleball Association (MPA).
            </p>
            <p>
              By using our websites or related services, you acknowledge that you have read and agreed to the terms below.
            </p>
          </section>

          {/* Platform Ownership */}
          <section className="privacy-section">
            <h2>2. Platform Ownership and Data Responsibility</h2>
            <p>
              The digital platforms and systems—including malaysiapickleball.my and mpaportal.com—are developed, managed, and hosted by Fenix Digital (Company Registration No: MRI/BNR/241/2024), the officially appointed technical partner of MPA.
            </p>
            <p>
              Fenix Digital acts as the <strong>Data Controller</strong>, responsible for all data processing, hosting, and security.
            </p>
            <p>
              MPA acts as the <strong>Data User</strong>, with read-only access limited to tournament management, membership validation, and event coordination.
            </p>
          </section>

          {/* Data Collection */}
          <section className="privacy-section">
            <h2>3. Data We Collect</h2>
            <p>We may collect the following personal data when you use our systems:</p>
            <ul>
              <li>Identification details (name, IC/passport number, date of birth, gender)</li>
              <li>Contact details (email, phone number, address)</li>
              <li>Account information (username, encrypted password, player ID)</li>
              <li>Tournament, ranking, and participation data</li>
              <li>Device and analytics data (browser type, IP, cookies, access time)</li>
            </ul>
          </section>

          {/* Purpose of Processing */}
          <section className="privacy-section">
            <h2>4. Purpose of Processing</h2>
            <p>Your data is processed to:</p>
            <ul>
              <li>Manage accounts and verify membership or player identity</li>
              <li>Facilitate tournaments and record results</li>
              <li>Support communication between users, MPA, and organizers</li>
              <li>Maintain system security and prevent misuse</li>
              <li>Improve platform performance through analytics</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
            <p className="highlight-text">
              <strong>Fenix Digital does not sell, trade, or rent user data to any third party.</strong>
            </p>
          </section>

          {/* Data Security */}
          <section className="privacy-section">
            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures, including:</p>
            <ul>
              <li>SSL/TLS encryption for all web transactions</li>
              <li>Access control and internal authorization procedures</li>
              <li>Periodic security audits and encrypted data backups</li>
              <li>24/7 monitoring to detect unauthorized activity</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="privacy-section">
            <h2>6. Data Retention and Deletion</h2>
            <p>
              We retain personal data only as long as necessary for operational or legal reasons. When no longer required, data will be securely deleted or anonymized.
            </p>
          </section>

          {/* User Rights */}
          <section className="privacy-section">
            <h2>7. Your Rights</h2>
            <p>Under the PDPA, you have the right to:</p>
            <ul>
              <li>Request access to your data</li>
              <li>Correct or update inaccurate information</li>
              <li>Request deletion (subject to legal retention requirements)</li>
              <li>Withdraw consent for processing (where applicable)</li>
            </ul>
            <p>
              Requests can be made directly to Fenix Digital (see contact details below).
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="privacy-section">
            <h2>8. Children's Data</h2>
            <p>
              Users below 13 years old must obtain parental or guardian consent.
              Accounts found without consent may be suspended or deleted.
            </p>
          </section>

          {/* Data Disclosure */}
          <section className="privacy-section">
            <h2>9. Data Disclosure</h2>
            <p>Data may be disclosed to:</p>
            <ul>
              <li>Authorized MPA officers for legitimate operational use</li>
              <li>Event organizers under MPA's sanction</li>
              <li>Government or legal authorities as required by law</li>
              <li>Trusted third-party vendors providing hosting or analytics support</li>
            </ul>
          </section>

          {/* Legal Compliance */}
          <section className="privacy-section">
            <h2>10. Legal Compliance</h2>
            <p>Fenix Digital complies with:</p>
            <ul>
              <li>Personal Data Protection Act 2010 (PDPA)</li>
              <li>Communications and Multimedia Act 1998</li>
              <li>Other relevant Malaysian regulations.</li>
            </ul>
          </section>

          {/* Data Breach */}
          <section className="privacy-section">
            <h2>11. Data Breach Response</h2>
            <p>In the event of a data breach, we will:</p>
            <ul>
              <li>Investigate and contain the incident</li>
              <li>Notify affected users promptly</li>
              <li>Report to JPDP (if required)</li>
              <li>Implement corrective and preventive measures</li>
            </ul>
          </section>

          {/* Transparency */}
          <section className="privacy-section">
            <h2>12. Transparency and Commitment</h2>
            <p>
              Fenix Digital developed and maintains this platform as a voluntary technical partner of the Malaysia Pickleball Association, without direct financial involvement.
              All operations are conducted ethically and transparently, in support of Malaysia's pickleball community.
            </p>
          </section>

          {/* Contact Information */}
          <section className="privacy-section">
            <h2>13. Contact Information</h2>

            <div className="contact-info-box">
              <h4>Data Controller: Fenix Digital</h4>
              <p>Company Reg. No: MRI/BNR/241/2024</p>
              <p>📧 Email: <a href="mailto:ariffin@fenixdigital.my">ariffin@fenixdigital.my</a></p>
              <p>🌐 Website: <a href="https://www.fenixdigital.my" target="_blank" rel="noopener noreferrer">www.fenixdigital.my</a></p>
            </div>

            <div className="contact-info-box">
              <h4>For MPA-related matters:</h4>
              <p>📧 <a href="mailto:tournament@malaysiapickleballassociation.org">tournament@malaysiapickleballassociation.org</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="privacy-footer">
          <p>&copy; {currentYear} Fenix Digital. All Rights Reserved.</p>
          <p>Company Reg. No: MRI/BNR/241/2024</p>
          <p>Compliant with PDPA 2010 | Developed for Malaysia Pickleball Association</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
