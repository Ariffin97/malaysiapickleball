const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Configure email transporter based on environment variables
      // Matches MPA portal configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // Your email
          pass: process.env.EMAIL_PASSWORD  // Your Gmail app password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('📧 Email service initialized with:', process.env.EMAIL_USER);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendRegistrationSuccessEmail(playerData) {
    try {
      if (!this.transporter) {
        console.log('⚠️ Email service not configured, skipping email');
        return { success: false, message: 'Email service not configured' };
      }

      const { fullName, email, username, password } = playerData;

      const mailOptions = {
        from: {
          name: 'Malaysia Pickleball Association',
          address: process.env.EMAIL_USER || 'noreply@malaysiapickleball.org'
        },
        to: email,
        subject: '🎉 Registration Submitted Successfully - Malaysia Pickleball Association',
        html: this.getRegistrationSuccessTemplate(fullName, email, username, password)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Registration success email sent to:', email);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send registration success email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(playerData) {
    try {
      if (!this.transporter) {
        console.log('⚠️ Email service not configured, skipping welcome email');
        return { success: false, message: 'Email service not configured' };
      }

      const { fullName, email, playerId } = playerData;

      const mailOptions = {
        from: {
          name: 'Malaysia Pickleball Association',
          address: process.env.EMAIL_USER || 'noreply@malaysiapickleball.org'
        },
        to: email,
        subject: '🎊 Welcome to Malaysia Pickleball Association!',
        html: this.getWelcomeTemplate(fullName, playerId)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', email);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  getRegistrationSuccessTemplate(fullName, email, username, password) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Submitted Successfully</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
        .credentials-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #4b5563; }
        .credential-value { background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin-left: 10px; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-box strong { color: #92400e; }
        .next-steps { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .next-steps h3 { color: #065f46; margin-top: 0; }
        .next-steps ul { margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 5px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
        .contact-info { margin-top: 15px; }
        .contact-info a { color: #3b82f6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Registration Submitted Successfully!</h1>
          <p>Malaysia Pickleball Association</p>
        </div>

        <div class="content">
          <div class="success-badge">✅ Application Received</div>

          <h2>Dear ${fullName},</h2>

          <p>Thank you for registering with the Malaysia Pickleball Association! Your application has been successfully submitted and is now pending admin approval.</p>
          
          <div class="credentials-box">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Your Account Credentials</h3>
            <div class="credential-item">
              <span class="credential-label">Username:</span>
              <span class="credential-value">${username}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>
          
          <div class="warning-box">
            <strong>⚠️ Important Security Notice:</strong><br>
            Please save these credentials in a secure location. We recommend changing your password after your first login for enhanced security.
          </div>
          
          <div class="next-steps">
            <h3>📝 What happens next?</h3>
            <ul>
              <li><strong>Review Process:</strong> Our admin team will review your application within 24-48 hours</li>
              <li><strong>Approval Notification:</strong> You'll receive another email once your registration is approved</li>
              <li><strong>Player ID:</strong> Upon approval, you'll receive a unique 5-character Player ID</li>
              <li><strong>Tournament Access:</strong> Once approved, you can participate in MPA tournaments</li>
            </ul>
          </div>
          
          <p><strong>Registration Details:</strong></p>
          <ul>
            <li>Full Name: ${fullName}</li>
            <li>Email: ${email}</li>
            <li>Username: ${username}</li>
            <li>Status: Pending Admin Approval</li>
            <li>Submitted: ${new Date().toLocaleDateString('en-MY', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</li>
          </ul>
          
          <p>If you have any questions about your registration, please don't hesitate to contact us.</p>
          
          <p>Thank you for joining the Malaysia Pickleball Association!</p>
          
          <p><strong>Best regards,</strong><br>
          Malaysia Pickleball Association<br>
          Admin Team</p>
        </div>
        
        <div class="footer">
          <p><strong>Malaysia Pickleball Association</strong></p>
          <div class="contact-info">
            <p>📧 Email: <a href="mailto:tournament@malaysiapickleballassociation.org">tournament@malaysiapickleballassociation.org</a></p>
            <p>📞 Phone: <a href="tel:+60128830407">+60 12-883 0407</a></p>
            <p>🌐 Website: <a href="https://malaysiapickleball.my">malaysiapickleball.my</a></p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getWelcomeTemplate(fullName, playerId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MPA</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .player-id-box { background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .player-id { font-size: 24px; font-weight: bold; color: #1d4ed8; font-family: monospace; }
        .benefits-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎊 Welcome to MPA!</h1>
          <p>Malaysia Pickleball Association</p>
        </div>
        
        <div class="content">
          <h2>Dear ${fullName},</h2>
          
          <p>🎉 <strong>Congratulations!</strong> Your registration has been approved and you are now an official member of the Malaysia Pickleball Association!</p>
          
          <div class="player-id-box">
            <h3 style="margin-top: 0;">🏆 Your Official Player ID</h3>
            <div class="player-id">${playerId}</div>
            <p style="margin-bottom: 0; color: #6b7280;">Keep this ID safe - you'll need it for tournaments!</p>
          </div>

          <p>Welcome to the growing community of pickleball players in Malaysia! We look forward to seeing you on the courts.</p>
          
          <p><strong>Best regards,</strong><br>
          Malaysia Pickleball Association<br>
          Admin Team</p>
        </div>
        
        <div class="footer">
          <p><strong>Malaysia Pickleball Association</strong></p>
          <p>📧 tournament@malaysiapickleballassociation.org | 📞 +60 12-883 0407</p>
          <p>🌐 <a href="https://malaysiapickleball.my" style="color: #3b82f6; text-decoration: none;">malaysiapickleball.my</a></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendPasswordRecoveryEmail(playerData) {
    try {
      if (!this.transporter) {
        console.log('⚠️ Email service not configured, skipping password recovery email');
        return { success: false, message: 'Email service not configured' };
      }

      const { fullName, email, username, password } = playerData;

      const mailOptions = {
        from: {
          name: 'Malaysia Pickleball Association',
          address: process.env.EMAIL_USER || 'noreply@malaysiapickleball.org'
        },
        to: email,
        subject: '🔑 Password Recovery - Malaysia Pickleball Association',
        html: this.getPasswordRecoveryTemplate(fullName, username, password)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password recovery email sent to:', email);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send password recovery email:', error);
      return { success: false, error: error.message };
    }
  }

  getPasswordRecoveryTemplate(fullName, username, password) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Recovery</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .credentials-box { background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 10px; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #4b5563; }
        .credential-value { background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin-left: 10px; display: inline-block; }
        .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-box strong { color: #92400e; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
        .contact-info { margin-top: 15px; }
        .contact-info a { color: #3b82f6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Recovery</h1>
          <p>Malaysia Pickleball Association</p>
        </div>

        <div class="content">
          <h2>Dear ${fullName},</h2>

          <p>We received a request to recover your password. Here are your account credentials:</p>

          <div class="credentials-box">
            <h3 style="margin-top: 0; color: #1f2937;">🔐 Your Account Credentials</h3>
            <div class="credential-item">
              <span class="credential-label">Username:</span>
              <span class="credential-value">${username}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>

          <div class="warning-box">
            <strong>⚠️ Security Reminder:</strong><br>
            For your security, we recommend changing your password after logging in. If you did not request this password recovery, please contact us immediately.
          </div>

          <p>You can now log in to your account using the credentials above.</p>

          <p><strong>Best regards,</strong><br>
          Malaysia Pickleball Association<br>
          Admin Team</p>
        </div>

        <div class="footer">
          <p><strong>Malaysia Pickleball Association</strong></p>
          <div class="contact-info">
            <p>📧 Email: <a href="mailto:tournament@malaysiapickleballassociation.org">tournament@malaysiapickleballassociation.org</a></p>
            <p>📞 Phone: <a href="tel:+60128830407">+60 12-883 0407</a></p>
            <p>🌐 Website: <a href="https://malaysiapickleball.my">malaysiapickleball.my</a></p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, message: 'Email service not configured' };
      }

      await this.transporter.verify();
      console.log('✅ Email service connection test successful');
      return { success: true, message: 'Email service is working' };
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();