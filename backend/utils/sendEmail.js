const nodemailer = require("nodemailer");

let cachedTransporter;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return cachedTransporter;
};

/**
 * @param {string} to
 * @param {string} subject
 * @param {string|{text?: string, html?: string}} content
 *
 * Passing an HTML string as plain text is what made order confirmations
 * render with visible <h2> tags, so callers now pass { text, html } and
 * nodemailer sets both MIME parts correctly.
 */
const sendEmail = async (to, subject, content) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`[email] credentials not configured - skipped "${subject}" to ${to}`);
    return;
  }

  const { text, html } =
    typeof content === "string" ? { text: content } : content || {};

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

/**
 * Fire-and-forget variant for mail that must never fail the HTTP request that
 * triggered it - a welcome email or an order confirmation is a side effect,
 * not part of the critical path.
 */
const sendEmailSafe = (to, subject, content) =>
  sendEmail(to, subject, content).catch((error) => {
    console.error(`[email] failed to send "${subject}" to ${to}:`, error.message);
  });

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendEmailSafe = sendEmailSafe;
