// Import all email template extensions
import './welcomeEmail';
import './passwordResetEmail';
import './verificationEmail';
import './emailVerificationTemplate';
import './userRegistrationEmail';

// Re-export the mailer with all extensions
export { mailer } from '@/config/mailer';
