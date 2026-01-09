const nodemailer = require("nodemailer");
const { logger } = require("../middleware/logging");

/**
 * Enterprise Email Service
 * Handles all email communications with templates and security
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Configure transporter based on environment
      if (process.env.NODE_ENV === "production") {
        // Production email service (e.g., SendGrid, AWS SES)
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        });
      } else {
        // Development - use configured email settings
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      }

      // Verify transporter configuration
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.warn("Email service not available:", {
              error: error.message,
            });
          } else {
            logger.info("Email service ready");
          }
        });
      } else {
        // No email configuration in development
        this.transporter = null;
      }
    } catch (error) {
      logger.error("Email service initialization failed:", {
        error: error.message,
      });

      // In development, continue without email service
      if (process.env.NODE_ENV !== "production") {
        this.transporter = null;
      } else {
        throw error;
      }
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email, token, name) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
      from: {
        name: "AI Trip Planner",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Verify Your Email Address - AI Trip Planner",
      html: this.getEmailVerificationTemplate(name, verificationUrl),
      text: `Hello ${name},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with AI Trip Planner, please ignore this email.\n\nBest regards,\nAI Trip Planner Team`,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email, token, name) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: {
        name: "AI Trip Planner",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Reset Your Password - AI Trip Planner",
      html: this.getPasswordResetTemplate(name, resetUrl),
      text: `Hello ${name},\n\nYou requested a password reset for your AI Trip Planner account.\n\nClick the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this reset, please ignore this email and your password will remain unchanged.\n\nBest regards,\nAI Trip Planner Team`,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: {
        name: "AI Trip Planner",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: "Welcome to AI Trip Planner! 🎉",
      html: this.getWelcomeTemplate(name),
      text: `Welcome to AI Trip Planner, ${name}!\n\nThank you for joining our community of travelers. You can now start planning your dream trips with the power of AI.\n\nGet started by visiting your dashboard: ${process.env.FRONTEND_URL}/dashboard\n\nBest regards,\nAI Trip Planner Team`,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(email, name, alertType, details) {
    const mailOptions = {
      from: {
        name: "AI Trip Planner Security",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: `Security Alert - ${alertType}`,
      html: this.getSecurityAlertTemplate(name, alertType, details),
      text: `Hello ${name},\n\nWe detected ${alertType} on your AI Trip Planner account.\n\nDetails:\n${JSON.stringify(
        details,
        null,
        2
      )}\n\nIf this was you, no action is required. If you didn't perform this action, please secure your account immediately.\n\nBest regards,\nAI Trip Planner Security Team`,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Generic email sender with retry logic
   */
  async sendEmail(mailOptions, retries = 3) {
    if (!this.transporter) {
      if (process.env.NODE_ENV !== "production") {
        logger.info("Email service not available, simulating email send:", {
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
        return { messageId: "simulated-" + Date.now() };
      }
      throw new Error("Email service not initialized");
    }

    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.transporter.sendMail(mailOptions);

        logger.info("Email sent successfully:", {
          to: mailOptions.to,
          subject: mailOptions.subject,
          messageId: result.messageId,
          attempt: i + 1,
        });

        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Email send attempt ${i + 1} failed:`, {
          to: mailOptions.to,
          error: error.message,
        });

        if (i < retries - 1) {
          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, i) * 1000);
        }
      }
    }

    logger.error("All email send attempts failed:", {
      to: mailOptions.to,
      subject: mailOptions.subject,
      error: lastError?.message,
    });

    throw lastError;
  }

  /**
   * Email verification template
   */
  getEmailVerificationTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #ddd; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 AI Trip Planner</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to AI Trip Planner! We're excited to have you on board.</p>
            <p>Please click the button below to verify your email address and activate your account:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Happy travels!<br>The AI Trip Planner Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Trip Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset template
   */
  getPasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #ddd; border-top: none; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 AI Trip Planner</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>You requested a password reset for your AI Trip Planner account.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes for your security.
            </div>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
            <p><strong>If you didn't request this reset, please ignore this email and your password will remain unchanged.</strong></p>
            <p>For security reasons, please don't share this email with anyone.</p>
            <p>Best regards,<br>The AI Trip Planner Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Trip Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  getWelcomeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI Trip Planner</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #ddd; border-top: none; }
          .button { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .feature { margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AI Trip Planner!</h1>
            <p>Your journey starts here</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to AI Trip Planner! We're thrilled to have you join our community of smart travelers.</p>
            
            <div class="features">
              <h3>🚀 What you can do now:</h3>
              <div class="feature">✈️ Generate AI-powered itineraries</div>
              <div class="feature">🏨 Find and book amazing hotels</div>
              <div class="feature">🗺️ Discover hidden gems with our maps</div>
              <div class="feature">📱 Access everything on any device</div>
            </div>

            <div style="text-align: center;">
              <a href="${
                process.env.FRONTEND_URL
              }/dashboard" class="button">Start Planning Your Trip</a>
            </div>

            <p>If you have any questions, feel free to reach out to our support team. We're here to help make your travel planning effortless!</p>

            <p>Happy travels!<br>The AI Trip Planner Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Trip Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Security alert template
   */
  getSecurityAlertTemplate(name, alertType, details) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e55039 0%, #c44569 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 40px; border: 1px solid #ddd; border-top: none; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Security Alert</h1>
            <p>Account Activity Notification</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            
            <div class="alert">
              <strong>⚠️ Security Notice:</strong> We detected ${alertType} on your account.
            </div>

            <p>Activity details:</p>
            <div class="details">
              Time: ${details.timestamp || new Date().toISOString()}<br>
              IP Address: ${details.ip || "Unknown"}<br>
              Device: ${details.device || "Unknown"}<br>
              Location: ${details.location || "Unknown"}
            </div>

            <p><strong>If this was you, no action is required.</strong></p>
            <p>If you don't recognize this activity, please secure your account immediately by:</p>
            <ul>
              <li>Changing your password</li>
              <li>Logging out of all devices</li>
              <li>Contacting our support team</li>
            </ul>

            <p>Best regards,<br>The AI Trip Planner Security Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Trip Planner. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
module.exports = new EmailService();
