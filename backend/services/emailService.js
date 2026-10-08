import { IS_SAAS_MODE } from "../misc/constants.js";
import { sendMail } from "./mailProvider.js";
import {
  otpEmailTemplate,
  passwordResetConfirmationTemplate,
  sharingNotificationTemplate,
  accessRevokedEmailTemplate,
  accountBannedTemplate,
  accountRecoveredTemplate,
  adminDirectEmailTemplate,
} from "../utils/emailTemplates.js";

const FROM_EMAIL = process.env.FROM_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;

/**
 * Send OTP email for login, registration, or password reset
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - "login" | "register" | "forgot-password"
 */
export const sendOtpEmail = async (username, email, otp, purpose) => {
  try {
    const template = otpEmailTemplate(username, email, otp, purpose);

    const response = await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }

    // console.log(`OTP email sent to ${email} (Purpose: ${purpose})`);
    return response;
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error.message);
    // Don't throw - allow operation to continue even if email fails
    return null;
  }
};

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email address
 */
export const sendPasswordResetConfirmation = async (username, email) => {
  try {
    const template = passwordResetConfirmationTemplate(username);

    const response = await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }

    // console.log(`Password reset confirmation sent to ${email}`);
    return response;
  } catch (error) {
    console.error(
      `Failed to send password reset confirmation to ${email}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Send sharing notification email
 * @param {string} email - Recipient email address
 * @param {string} itemName - Name of shared file/directory
 * @param {string} itemType - "file" | "directory"
 * @param {string} senderName - Name of user who shared
 * @param {string} message - Optional custom message from sender
 */
export const sendSharingNotificationEmail = async (
  email,
  itemName,
  itemType,
  senderName,
  message = "",
) => {
  try {
    const template = sharingNotificationTemplate(
      itemName,
      itemType,
      senderName,
      message,
    );

    const response = await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }

    // console.log(
    //   `Sharing notification sent to ${email} for ${itemType}: ${itemName}`
    // );
    return response;
  } catch (error) {
    console.error(
      `Failed to send sharing notification to ${email}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Send account banned notification email
 * @param {string} email - Recipient email address
 */
export const sendAccountBannedEmail = async (username, email) => {
  try {
    const template = accountBannedTemplate(username);

    const response = await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }

    // console.log(`Account banned notification sent to ${email}`);
    return response;
  } catch (error) {
    console.error(
      `Failed to send account banned notification to ${email}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Send account recovered notification email
 * @param {string} email - Recipient email address
 */
export const sendAccountRecoveredEmail = async (username, email) => {
  try {
    const template = accountRecoveredTemplate(username);

    const response = await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }

    // console.log(`Account recovered notification sent to ${email}`);
    return response;
  } catch (error) {
    console.error(
      `Failed to send account recovered notification to ${email}:`,
      error.message,
    );
    return null;
  }
};

/**
 * Send bulk sharing notification emails
 * @param {Array} emails - Array of email strings
 * @param {string} itemName - Name of shared item
 * @param {string} itemType - "file" | "directory"
 * @param {string} senderName - Name of sender
 * @param {string} message - Optional message
 */
export const sendBulkShareEmails = async (
  emails,
  itemName,
  itemType,
  senderName,
  message = "",
) => {
  return sendBulkEmails(
    emails,
    (email) => sharingNotificationTemplate(itemName, itemType, senderName, message),
  );
};

/**
 * Send bulk access-revoked notification emails
 * @param {Array} emails - Array of email strings
 * @param {string} itemName - Name of item access was revoked from
 * @param {string} itemType - "file" | "directory"
 * @param {string} senderName - Name of owner who revoked access
 * @param {string} message - Optional message
 */
export const sendBulkRevokedEmails = async (
  emails,
  itemName,
  itemType,
  senderName,
  message = "",
) => {
  return sendBulkEmails(
    emails,
    (email) => accessRevokedEmailTemplate(itemName, itemType, senderName, message),
  );
};

const sendBulkEmails = async (emails, buildTemplate) => {
  try {
    const promises = emails.map((email) => {
      const template = buildTemplate(email);
      return sendMail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Sent ${successful}/${emails.length} notification emails`);
    return results;
  } catch (error) {
    console.error(`Failed to send bulk notification emails:`, error.message);
    return [];
  }
};

/**
 * Send a direct email to a user from the admin console
 * @param {Object} user - { name, email }
 * @param {string} subject
 * @param {string} message
 */
export const sendAdminDirectEmail = async (user, subject, message) => {
  if (!IS_SAAS_MODE) return null;

  try {
    const template = adminDirectEmailTemplate(user.name || "there", message);

    const response = await sendMail({
      to: user.email,
      subject,
      html: template.html,
    });

    if (response?.error) {
      throw new Error(`Mail provider error: ${response.error.message}`);
    }
    return response;
  } catch (error) {
    console.error(`Failed to send admin email to ${user.email}:`, error.message);
    throw error;
  }
};