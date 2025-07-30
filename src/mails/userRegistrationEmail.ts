/**
 * User Registration Email Templates
 *
 * Provides email templates for user registration workflow including welcome emails
 * and registration confirmation emails with professional design and branding.
 *
 * @module src/mails/userRegistrationEmail
 */

import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendWelcomeEmail(
      to: string,
      userName: string,
      loginUrl?: string
    ): Promise<nodemailer.SentMessageInfo>;

    sendRegistrationConfirmationEmail(
      to: string,
      userName: string,
      verificationUrl: string,
      verificationToken: string,
      expiryHours?: number
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a welcome email to newly registered users
 */
MailerService.prototype.sendWelcomeEmail = async function (
  to: string,
  userName: string,
  loginUrl?: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Welcome to CC Career Platform! 🎉';
  const defaultLoginUrl =
    loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  const text = `
Hello ${userName},

Welcome to CC Career Platform! 🎉

We're excited to have you join our team. Your account has been successfully created and you're now part of our recruitment management system.

Here's what you can do next:
• Complete your profile setup
• Explore the dashboard
• Start managing job postings and applications

To get started, please log in to your account:
${defaultLoginUrl}

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Best regards,
The CC Career Platform Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CC Career Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
        }
        .features {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .features h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .features ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .features li {
            margin: 8px 0;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            color: #6c757d;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to CC Career Platform!</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${userName},
            </div>
            
            <div class="message">
                Welcome to CC Career Platform! We're excited to have you join our team. Your account has been successfully created and you're now part of our recruitment management system.
            </div>
            
            <div class="features">
                <h3>🚀 What you can do next:</h3>
                <ul>
                    <li>Complete your profile setup</li>
                    <li>Explore the dashboard</li>
                    <li>Start managing job postings and applications</li>
                    <li>Review candidate applications</li>
                    <li>Generate recruitment reports</li>
                </ul>
            </div>
            
            <div class="button-container">
                <a href="${defaultLoginUrl}" class="login-button">
                    Get Started - Log In
                </a>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 6px; color: #155724; font-size: 14px;">
                💡 <strong>Tip:</strong> If you have any questions or need assistance, don't hesitate to reach out to our support team.
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;

  return this.sendMail({ to, subject, text, html });
};

/**
 * Send a registration confirmation email with verification link
 */
MailerService.prototype.sendRegistrationConfirmationEmail = async function (
  to: string,
  userName: string,
  verificationUrl: string,
  verificationToken: string,
  expiryHours: number = 24
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Registration Confirmation - Verify Your Email';
  const verificationLink = `${verificationUrl}?token=${verificationToken}`;

  const text = `
Hello ${userName},

Thank you for registering with CC Career Platform! Your account has been created successfully.

To complete your registration and activate your account, please verify your email address by clicking the link below:

${verificationLink}

This verification link will expire in ${expiryHours} hours for security reasons.

If you didn't create an account with us, please ignore this email.

Best regards,
The CC Career Platform Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .expiry-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
            font-size: 14px;
        }
        .security-notice {
            background-color: #f8f9fa;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            color: #155724;
            font-size: 14px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            color: #6c757d;
            font-size: 14px;
        }
        .link-fallback {
            word-break: break-all;
            color: #667eea;
            text-decoration: none;
        }
        .link-fallback:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Registration Confirmation</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${userName},
            </div>
            
            <div class="message">
                Thank you for registering with CC Career Platform! Your account has been created successfully. To complete your registration and activate your account, please verify your email address by clicking the button below.
            </div>
            
            <div class="button-container">
                <a href="${verificationLink}" class="verify-button">
                    Verify Email Address
                </a>
            </div>
            
            <div class="expiry-notice">
                ⏰ <strong>Important:</strong> This verification link will expire in ${expiryHours} hours for security reasons.
            </div>
            
            <div class="security-notice">
                🔒 <strong>Security Note:</strong> If you didn't create an account with us, please ignore this email.
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; font-size: 14px; color: #6c757d;">
                <strong>Having trouble with the button?</strong><br>
                Copy and paste this link into your browser:<br>
                <a href="${verificationLink}" class="link-fallback">${verificationLink}</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;

  return this.sendMail({ to, subject, text, html });
};
