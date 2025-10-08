import './PrivacyPolicy.css';

function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="privacy-content">
          <section className="privacy-section intro-section">
            <p>
              Malaysia Pickleball Association ("MPA", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and player portal services.
            </p>
            <p>
              <strong>Technical Partner:</strong> All data management and technical infrastructure are provided by <strong>Fenix Digital</strong>, our official technical partner, ensuring the highest standards of data security and privacy protection.
            </p>
          </section>

          <section className="privacy-section">
            <h2>1. Information We Collect</h2>

            <h3>1.1 Personal Information</h3>
            <p>When you register as a player or use our services, we may collect:</p>
            <ul>
              <li><strong>Identification Information:</strong> Full name, IC number, date of birth, age, gender</li>
              <li><strong>Contact Information:</strong> Email address, phone number, residential address (street, city, state)</li>
              <li><strong>Account Information:</strong> Username, password (encrypted), player ID</li>
              <li><strong>Profile Information:</strong> Profile picture, skill level, membership type</li>
              <li><strong>Tournament Information:</strong> Tournament registrations, match results, statistics</li>
            </ul>

            <h3>1.2 Automatically Collected Information</h3>
            <p>When you access our website, we may automatically collect:</p>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Date and time of visits</li>
            </ul>

            <h3>1.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and remember your preferences. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. How We Use Your Information</h2>
            <p>MPA uses collected information for the following purposes, in compliance with applicable Malaysian laws:</p>

            <h3>2.1 Service Provision</h3>
            <ul>
              <li>Create and manage your player account</li>
              <li>Process membership applications and renewals</li>
              <li>Facilitate tournament registrations and participation</li>
              <li>Maintain player rankings and statistics</li>
              <li>Communicate important updates and notifications</li>
            </ul>

            <h3>2.2 Administrative Purposes</h3>
            <ul>
              <li>Verify identity and prevent fraud</li>
              <li>Respond to inquiries and support requests</li>
              <li>Send administrative information and updates</li>
              <li>Manage and improve our services</li>
            </ul>

            <h3>2.3 Communication</h3>
            <ul>
              <li>Send tournament announcements and news</li>
              <li>Share training programs and opportunities</li>
              <li>Provide information about MPA events and activities</li>
              <li>Send newsletters and promotional materials (with consent)</li>
            </ul>

            <h3>2.4 Analytics and Improvement</h3>
            <ul>
              <li>Analyze usage patterns and trends</li>
              <li>Improve website functionality and user experience</li>
              <li>Develop new features and services</li>
              <li>Generate statistical reports on pickleball development in Malaysia</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. Data Storage and Security</h2>

            <h3>3.1 Data Management by Fenix Digital</h3>
            <p>
              All personal data is securely stored and managed by <strong>Fenix Digital</strong>, our official technical partner. Fenix Digital employs industry-standard security measures to protect your information, including:
            </p>
            <ul>
              <li><strong>Encryption:</strong> All data transmission is encrypted using SSL/TLS protocols</li>
              <li><strong>Secure Storage:</strong> Data is stored in secure, encrypted databases with restricted access</li>
              <li><strong>Access Controls:</strong> Role-based access controls limit who can view and modify data</li>
              <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments are conducted regularly</li>
              <li><strong>Backup Systems:</strong> Regular backups ensure data recovery in case of incidents</li>
              <li><strong>Monitoring:</strong> 24/7 monitoring for suspicious activities and unauthorized access attempts</li>
            </ul>

            <h3>3.2 Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When data is no longer needed, it is securely deleted or anonymized.
            </p>

            <h3>3.3 Data Location</h3>
            <p>
              Your data is stored on secure servers managed by Fenix Digital. While we strive to keep data within Malaysia where possible, some data may be stored on cloud servers that comply with international security standards.
            </p>
          </section>

          <section className="privacy-section">
            <h2>4. Information Sharing and Disclosure</h2>

            <h3>4.1 No Sale of Personal Data</h3>
            <p>
              <strong>MPA and Fenix Digital will never sell, rent, or lease your personal information to third parties.</strong>
            </p>

            <h3>4.2 Permitted Sharing</h3>
            <p>We may share your information only in the following circumstances:</p>

            <h4>With Fenix Digital</h4>
            <p>
              As our official technical partner, Fenix Digital has access to personal data solely for the purpose of providing technical services, maintaining infrastructure, and ensuring data security.
            </p>

            <h4>With Tournament Organizers</h4>
            <p>
              When you register for a tournament, necessary information (name, contact details, skill level) is shared with authorized tournament organizers to facilitate event management.
            </p>

            <h4>With Your Consent</h4>
            <p>
              We may share your information with third parties when you have given explicit consent.
            </p>

            <h4>Legal Requirements</h4>
            <p>We may disclose your information when required to:</p>
            <ul>
              <li>Comply with legal obligations and court orders</li>
              <li>Respond to lawful requests from government authorities</li>
              <li>Protect the rights, property, or safety of MPA, our users, or others</li>
              <li>Prevent fraud or security threats</li>
            </ul>

            <h4>Business Transfers</h4>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, subject to the same privacy protections.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Your Rights and Choices</h2>

            <h3>5.1 Access and Correction</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information held by MPA</li>
              <li>Request corrections to inaccurate or incomplete data</li>
              <li>Update your profile information through the player portal</li>
            </ul>

            <h3>5.2 Data Portability</h3>
            <p>
              You have the right to request a copy of your personal data in a structured, commonly used format.
            </p>

            <h3>5.3 Deletion Rights</h3>
            <p>
              You may request deletion of your account and personal data, subject to:
            </p>
            <ul>
              <li>Legal obligations requiring data retention</li>
              <li>Completion of ongoing transactions or tournaments</li>
              <li>Resolution of disputes or enforcement of agreements</li>
            </ul>

            <h3>5.4 Communication Preferences</h3>
            <p>You can opt out of:</p>
            <ul>
              <li>Marketing emails (while still receiving essential communications)</li>
              <li>Newsletter subscriptions</li>
              <li>Promotional notifications</li>
            </ul>

            <h3>5.5 Cookie Management</h3>
            <p>
              You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect website functionality.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13 years of age. For users aged 13-17, parental or guardian consent is required for registration. We do not knowingly collect personal information from children under 13 without parental consent.
            </p>
            <p>
              If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. Third-Party Links and Services</h2>
            <p>
              Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Compliance with Malaysian Laws</h2>
            <p>
              MPA and Fenix Digital are committed to complying with applicable Malaysian data protection laws, including:
            </p>
            <ul>
              <li>Personal Data Protection Act 2010 (PDPA)</li>
              <li>Communications and Multimedia Act 1998</li>
              <li>Other relevant regulations and guidelines</li>
            </ul>
            <p>
              We process personal data in accordance with the principles of lawfulness, fairness, transparency, and data minimization.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Data Breach Notification</h2>
            <p>
              In the unlikely event of a data breach that may compromise your personal information, MPA and Fenix Digital will:
            </p>
            <ul>
              <li>Investigate the breach immediately</li>
              <li>Take appropriate remedial actions</li>
              <li>Notify affected users without undue delay</li>
              <li>Report to relevant authorities as required by law</li>
              <li>Implement measures to prevent future occurrences</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>10. International Data Transfers</h2>
            <p>
              If your data is transferred outside of Malaysia, we ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="privacy-section">
            <h2>11. Updates to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending email notifications for significant changes (where appropriate)</li>
            </ul>
            <p>
              Your continued use of our services after changes are posted constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="privacy-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:
            </p>

            <div className="contact-info">
              <h4>Malaysia Pickleball Association</h4>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Website: malaysiapickleballassociation.org</p>
            </div>

            <div className="contact-info">
              <h4>Technical Partner - Fenix Digital</h4>
              <p>For data security and technical inquiries</p>
              <p>Responsible for: Data storage, security, and technical infrastructure</p>
            </div>

            <div className="contact-info">
              <h4>Data Protection Inquiries</h4>
              <p>For questions about your personal data, privacy rights, or data protection:</p>
              <p>Email: tournament@malaysiapickleballassociation.org</p>
              <p>Subject Line: "Data Protection Inquiry"</p>
            </div>
          </section>

          <section className="privacy-section acknowledgment-section">
            <h2>Acknowledgment</h2>
            <p>
              By using the MPA website and services, you acknowledge that you have read, understood, and agree to this Privacy Policy and our Terms and Conditions.
            </p>
            <p>
              <strong>We are committed to protecting your privacy and ensuring the security of your personal information through our partnership with Fenix Digital.</strong>
            </p>
          </section>
        </div>

        <div className="privacy-footer">
          <p>© {new Date().getFullYear()} Malaysia Pickleball Association. All rights reserved.</p>
          <p>Technical Partner: Fenix Digital</p>
          <p>Committed to protecting your privacy and securing your data.</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
