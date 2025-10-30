import './TermsAndConditions.css';

function TermsAndConditions() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <h1>Terms & Conditions</h1>
          <p className="last-updated">Last Updated: October 30, 2025</p>
        </div>

        <div className="terms-content">
          {/* Section 1 */}
          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using this website or platform ("the Platform"), you agree to comply with these Terms & Conditions and the Privacy Policy. If you do not agree, please discontinue use.
            </p>
          </section>

          {/* Section 2 */}
          <section className="terms-section">
            <h2>2. Platform Ownership</h2>
            <p>
              This Platform is developed and managed by <strong>Fenix Digital (MRI/BNR/241/2024)</strong>, appointed by the Malaysia Pickleball Association (MPA) as the official technical partner.
            </p>
            <ul>
              <li>Fenix Digital oversees digital infrastructure, security, and system operations.</li>
              <li>MPA oversees tournament governance and sport administration.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="terms-section">
            <h2>3. User Registration</h2>
            <p>Users must register to access certain platform features.</p>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate and current information.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Be responsible for all activities under your account.</li>
              <li>Obtain parental consent if under 18 years of age.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="terms-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any laws or third-party rights.</li>
              <li>Attempt unauthorized access to systems or data.</li>
              <li>Upload harmful code or spam.</li>
              <li>Engage in activities that could disrupt the platform or harm others.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="terms-section">
            <h2>5. Tournament and Membership Use</h2>
            <p>When registering for tournaments or membership programs, you agree to:</p>
            <ul>
              <li>Provide accurate player information.</li>
              <li>Follow MPA's official tournament rules and regulations.</li>
              <li>Conduct yourself with fairness and respect.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="terms-section">
            <h2>6. Intellectual Property</h2>
            <p>
              All website content, software, and code are owned or licensed by Fenix Digital.
              The MPA name and logo are the property of MPA.
              You may not reproduce or reuse materials without written consent.
            </p>
          </section>

          {/* Section 7 */}
          <section className="terms-section">
            <h2>7. Data and Privacy</h2>
            <p>
              All personal data is processed by Fenix Digital in accordance with our Privacy Policy.
              MPA only has limited, read-only access for tournament validation and operations.
            </p>
          </section>

          {/* Section 8 */}
          <section className="terms-section">
            <h2>8. Payment Terms</h2>
            <ul>
              <li>All payments for events, membership, or tournaments are handled securely through approved gateways.</li>
              <li>Fees are non-refundable unless otherwise stated by MPA.</li>
              <li>Neither MPA nor Fenix Digital stores full payment card details.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="terms-section">
            <h2>9. Limitation of Liability</h2>
            <p>Fenix Digital and MPA shall not be held liable for:</p>
            <ul>
              <li>Service interruptions or downtime</li>
              <li>Unauthorized data access</li>
              <li>Loss of data due to system error</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p>
              Fenix Digital's liability is limited to technical operations, while MPA's liability is limited to sport-related programs.
            </p>
          </section>

          {/* Section 10 */}
          <section className="terms-section">
            <h2>10. Termination</h2>
            <p>
              Fenix Digital and MPA reserve the right to suspend or terminate accounts for violations, misconduct, or security reasons.
            </p>
          </section>

          {/* Section 11 */}
          <section className="terms-section">
            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of Malaysia. Any disputes shall fall under the exclusive jurisdiction of Malaysian courts.
            </p>
          </section>

          {/* Section 12 - Contact */}
          <section className="terms-section">
            <h2>12. Contact Information</h2>

            <div className="contact-info">
              <p><strong>For technical or platform inquiries:</strong></p>
              <p>📧 <a href="mailto:ariffin@fenixdigital.my">ariffin@fenixdigital.my</a></p>
            </div>

            <div className="contact-info">
              <p><strong>For tournament or membership issues:</strong></p>
              <p>📧 <a href="mailto:tournament@malaysiapickleballassociation.org">tournament@malaysiapickleballassociation.org</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="terms-footer">
          <p>&copy; {currentYear} Fenix Digital. All Rights Reserved.</p>
          <p>Official Technical Partner of the Malaysia Pickleball Association.</p>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
