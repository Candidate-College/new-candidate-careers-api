import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendEmailVerificationTemplate(
      to: string,
      userName: string,
      verificationToken: string,
      verificationUrl: string,
      expiryHours?: number
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a professional email verification email with modern design
 */
MailerService.prototype.sendEmailVerificationTemplate = async function (
  to: string,
  userName: string,
  verificationToken: string,
  verificationUrl: string,
  expiryHours: number = 24
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Verify Your Email Address - Complete Your Registration';

  const verificationLink = `${verificationUrl}?token=${verificationToken}`;

  const text = `
Hello ${userName},

Thank you for registering with us! To complete your account setup, please verify your email address by clicking the link below:

${verificationLink}

This verification link will expire in ${expiryHours} hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
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
            <h1>🔐 Email Verification</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${userName},
            </div>
            
            <div class="message">
                Thank you for registering with us! To complete your account setup and ensure the security of your account, please verify your email address by clicking the button below.
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
                🔒 <strong>Security Note:</strong> If you didn't create an account with us, please ignore this email. Your account security is important to us.
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
