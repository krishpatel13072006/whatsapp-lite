const nodemailer = require('nodemailer');

/**
 * Email Transporter Configuration
 */
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password-here'
  }
});

if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password-here') {
  console.warn('\n⚠️  WARNING: EMAIL_PASS is not configured correctly in .env!');
  console.warn('⚠️  To fix Password Reset emails:');
  console.warn('⚠️  1. Go to your Google Account > Security > 2-Step Verification');
  console.warn('⚠️  2. Create an App Password and paste it into .env as EMAIL_PASS');
  console.warn('⚠️  3. Restart the server.\n');
}

/**
 * Send verification code email for password reset
 * @param {String} email - Recipient email address
 * @param {String} code - Verification code
 * @param {String} username - Username for personalization
 * @returns {Promise<Boolean>} Success status
 */
const sendVerificationEmail = async (email, code, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
      to: email,
      subject: 'WhatsApp-Lite Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #25D366; margin-bottom: 20px;">WhatsApp-Lite Password Reset</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="color: #666; font-size: 14px;">You requested to reset your password. Use the following verification code:</p>
            <div style="background-color: #25D366; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
              ${code}
            </div>
            <p style="color: #999; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© WhatsApp-Lite Team</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    return false;
  }
};

/**
 * Send welcome email to new users
 * @param {String} email - Recipient email address
 * @param {String} username - Username for personalization
 * @returns {Promise<Boolean>} Success status
 */
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
      to: email,
      subject: 'Welcome to WhatsApp-Lite!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #25D366; margin-bottom: 20px;">Welcome to WhatsApp-Lite! 🎉</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="color: #666; font-size: 14px;">Thank you for joining WhatsApp-Lite! We're excited to have you on board.</p>
            <p style="color: #666; font-size: 14px;">You can now start messaging your friends, make voice and video calls, and much more!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background-color: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Start Chatting</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© WhatsApp-Lite Team</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email: ${error.message}`);
    return false;
  }
};

/**
 * Send notification email
 * @param {String} email - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} message - Email message
 * @returns {Promise<Boolean>} Success status
 */
const sendNotificationEmail = async (email, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #25D366; margin-bottom: 20px;">WhatsApp-Lite</h2>
            <p style="color: #333; font-size: 16px;">${message}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© WhatsApp-Lite Team</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send notification email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendNotificationEmail
};