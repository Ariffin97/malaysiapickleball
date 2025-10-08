import './TermsAndConditions.css';

function TermsAndConditions() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <h1>Terms and Conditions</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Malaysia Pickleball Association (MPA) website and player portal, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. About MPA</h2>
            <p>
              The Malaysia Pickleball Association (MPA) is the official governing body for pickleball in Malaysia. Our mission is to promote, develop, and regulate the sport of pickleball throughout the country.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Technical Partnership</h2>
            <p>
              <strong>Fenix Digital</strong> serves as the official technical partner for Malaysia Pickleball Association. All technical infrastructure, data management, and digital services are provided and maintained by Fenix Digital in accordance with industry best practices and applicable laws.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. User Accounts and Registration</h2>
            <h3>4.1 Account Creation</h3>
            <p>
              To access certain features of the MPA portal, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your information to keep it accurate and current</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Notify MPA immediately of any unauthorized use of your account</li>
            </ul>

            <h3>4.2 Account Eligibility</h3>
            <p>
              You must be at least 13 years of age to register for an account. For users under 18 years of age, parental or guardian consent is required.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Use of Services</h2>
            <h3>5.1 Permitted Use</h3>
            <p>You agree to use MPA services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any harmful or malicious code</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
              <li>Interfere with or disrupt the services or servers</li>
              <li>Use automated systems to access the services without permission</li>
            </ul>

            <h3>5.2 Tournament Registration</h3>
            <p>
              When registering for tournaments through the MPA portal, you agree to:
            </p>
            <ul>
              <li>Provide accurate information about your skill level and experience</li>
              <li>Comply with all tournament rules and regulations</li>
              <li>Pay all applicable fees on time</li>
              <li>Conduct yourself in a sportsmanlike manner</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Data Usage and Management</h2>
            <h3>6.1 Data Collection</h3>
            <p>
              MPA, through its technical partner Fenix Digital, collects and processes personal data necessary for the operation of the player portal and management of pickleball activities in Malaysia.
            </p>

            <h3>6.2 Data Storage and Security</h3>
            <p>
              All user data is securely stored and managed by <strong>Fenix Digital</strong> using industry-standard security measures including:
            </p>
            <ul>
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Backup and disaster recovery procedures</li>
              <li>Compliance with applicable data protection regulations</li>
            </ul>

            <h3>6.3 Data Usage Rights</h3>
            <p>
              MPA reserves the right to use collected data for the following purposes, in compliance with applicable laws:
            </p>
            <ul>
              <li>Player registration and membership management</li>
              <li>Tournament organization and administration</li>
              <li>Statistical analysis and reporting</li>
              <li>Communication regarding MPA activities and events</li>
              <li>Improvement of services and user experience</li>
              <li>Compliance with legal and regulatory requirements</li>
            </ul>

            <h3>6.4 Data Sharing</h3>
            <p>
              MPA will not sell, rent, or lease your personal data to third parties. Data may be shared only:
            </p>
            <ul>
              <li>With Fenix Digital for technical and operational purposes</li>
              <li>With authorized tournament organizers for event management</li>
              <li>When required by law or legal process</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>7. Intellectual Property Rights</h2>
            <p>
              All content on the MPA website and portal, including but not limited to text, graphics, logos, images, and software, is the property of Malaysia Pickleball Association or its content suppliers and is protected by intellectual property laws.
            </p>
            <p>
              The MPA logo, branding, and related marks are trademarks of Malaysia Pickleball Association. You may not use these marks without prior written permission.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Payment and Fees</h2>
            <h3>8.1 Membership Fees</h3>
            <p>
              MPA membership fees and tournament registration fees are subject to change. All fees are non-refundable unless otherwise stated.
            </p>

            <h3>8.2 Payment Processing</h3>
            <p>
              All payments are processed securely through authorized payment gateways. MPA and Fenix Digital do not store complete credit card information.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, MPA and Fenix Digital shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:
            </p>
            <ul>
              <li>Your use or inability to use the services</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Any interruption or cessation of transmission to or from the services</li>
              <li>Any bugs, viruses, or similar items that may be transmitted through the services</li>
              <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Malaysia Pickleball Association, Fenix Digital, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use of the services</li>
              <li>Your violation of these Terms and Conditions</li>
              <li>Your violation of any rights of another party</li>
              <li>Your violation of any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>11. Termination</h2>
            <p>
              MPA reserves the right to terminate or suspend your account and access to services at any time, without prior notice, for conduct that violates these Terms or is harmful to other users, MPA, Fenix Digital, or third parties, or for any other reason at MPA's sole discretion.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Changes to Terms</h2>
            <p>
              MPA reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the services after changes are posted constitutes your acceptance of the modified Terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of Malaysia. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Malaysia.
            </p>
          </section>

          <section className="terms-section">
            <h2>14. Contact Information</h2>
            <p>
              For questions or concerns regarding these Terms and Conditions, please contact:
            </p>
            <div className="contact-info">
              <p><strong>Malaysia Pickleball Association</strong></p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Website: malaysiapickleballassociation.org</p>
            </div>
            <div className="contact-info">
              <p><strong>Technical Support (Fenix Digital)</strong></p>
              <p>For technical issues and data-related inquiries</p>
            </div>
          </section>

          <section className="terms-section">
            <h2>15. Severability</h2>
            <p>
              If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="terms-section acceptance-section">
            <h2>Acceptance</h2>
            <p>
              By using the MPA website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
            </p>
          </section>
        </div>

        <div className="terms-footer">
          <p>© {new Date().getFullYear()} Malaysia Pickleball Association. All rights reserved.</p>
          <p>Technical Partner: Fenix Digital</p>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
