import './TermsAndConditions.css';

function TermsAndConditions() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <h1>Terms and Conditions</h1>
          <p className="last-updated">Last Updated: {currentDate}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using this website and player portal ("the Platform"), you agree to be bound by these
              Terms and Conditions and our Privacy Policy. If you do not agree, please discontinue use immediately.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. About the Malaysia Pickleball Association (MPA)</h2>
            <p>
              The Malaysia Pickleball Association (MPA) is the recognized governing body for pickleball in Malaysia.
              It promotes, develops, and regulates the sport nationwide.
            </p>

            <h3>2.1 Platform Ownership and Technical Partnership</h3>
            <p>
              This website is developed and operated by <strong>Fenix Digital (Company Registration No: MRI/BNR/241/2024)</strong>,
              the Official Technical Partner appointed by MPA's Executive Committee.
            </p>
            <p>
              Fenix Digital manages all technical and digital operations, while MPA manages the sporting and organizational aspects.
            </p>
            <p>
              Full details regarding ownership and data processing are provided in the Privacy Policy.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. User Accounts and Eligibility</h2>
            <p>Users must register to access certain features.</p>
            <ul>
              <li>You agree to provide accurate, up-to-date information and maintain your account securely.</li>
              <li>Users must be 13 years or older; users aged 13–17 require parental consent.</li>
              <li>You are responsible for all activities under your account.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any law or regulation</li>
              <li>Infringe on the rights of others</li>
              <li>Attempt unauthorized access to systems or data</li>
              <li>Upload or transmit harmful code or spam</li>
              <li>Use bots or scraping tools without permission</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>5. Tournament Participation</h2>
            <p>When registering for tournaments, you agree to:</p>
            <ul>
              <li>Provide accurate player details</li>
              <li>Follow MPA's tournament rules</li>
              <li>Pay applicable fees</li>
              <li>Conduct yourself with integrity and sportsmanship</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Data and Privacy</h2>
            <p>
              All personal data on the Platform is collected and managed by <strong>Fenix Digital</strong>, the appointed
              data controller.
            </p>
            <p>
              MPA only has limited read-only access for verification, validation, and tournament operations.
            </p>
            <p>
              For full details, please refer to our Privacy Policy.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Intellectual Property</h2>
            <p>
              All materials, including text, graphics, software, and code, are protected by intellectual property laws.
            </p>
            <ul>
              <li>The MPA name and logo belong to MPA.</li>
              <li>The software, systems, and codebase belong to Fenix Digital.</li>
            </ul>
            <p>
              You may not copy or reuse content without written consent.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Payments and Fees</h2>
            <ul>
              <li>All membership and tournament fees are determined by MPA and are non-refundable unless otherwise specified.</li>
              <li>Payments are securely processed through approved gateways.</li>
              <li>Fenix Digital and MPA do not store full payment card details.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the extent permitted by law, MPA and Fenix Digital are not liable for any indirect, incidental, or
              consequential damages resulting from:
            </p>
            <ul>
              <li>Use or inability to use the Platform</li>
              <li>Unauthorized access or security breaches</li>
              <li>Downtime or technical issues</li>
              <li>Errors or data loss</li>
            </ul>
            <p>
              Fenix Digital's liability is limited to the technical operation of the Platform.
            </p>
            <p>
              MPA remains responsible for all sport-related programs and events.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless MPA, Fenix Digital, and their officers or agents from claims or
              damages arising from your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. Termination</h2>
            <p>
              MPA or Fenix Digital may suspend or terminate access to your account or the Platform at any time, with or
              without notice, for violations, misconduct, or technical reasons.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Updates to Terms</h2>
            <p>
              These Terms may be amended periodically. Updates are effective upon posting. Continued use signifies
              acceptance of revised Terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Malaysia, and disputes shall be resolved under the exclusive
              jurisdiction of Malaysian courts.
            </p>
          </section>

          <section className="terms-section">
            <h2>14. Contact Information</h2>

            <div className="contact-info">
              <p><strong>Malaysia Pickleball Association (MPA)</strong></p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Website: malaysiapickleballassociation.org</p>
            </div>

            <div className="contact-info">
              <p><strong>Fenix Digital (Company Reg. No: MRI/BNR/241/2024)</strong></p>
              <p>Official Technical Partner & Platform Operator</p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Subject: <strong>ATTN: Fenix Digital – Technical Support</strong></p>
            </div>
          </section>

          <section className="terms-section">
            <h2>15. Severability</h2>
            <p>
              If any clause of these Terms is deemed invalid, the remaining provisions shall remain in full effect.
            </p>
          </section>

          <section className="terms-section acceptance-section">
            <h2>16. Acknowledgment</h2>
            <p>
              By using this Platform, you confirm that you have read and understood these Terms and the Privacy Policy,
              and that you agree to comply with them.
            </p>
          </section>
        </div>

        <div className="terms-footer">
          <p>&copy; {currentYear} Fenix Digital</p>
          <p>Company Reg. No: MRI/BNR/241/2024</p>
          <p>Official Technical Partner and Platform Operator for the Malaysia Pickleball Association</p>
          <p>All Rights Reserved | PDPA Registration Under Review</p>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
