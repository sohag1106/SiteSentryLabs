/**
 * Contact form controller.
 *
 * TODO before going live: connect this to an email provider or CRM
 * (e.g. SendGrid, Postmark, SES, or a webhook into your CRM). Read
 * credentials from environment variables — never hard-code them here.
 *
 * Example (SendGrid, once installed and configured via .env):
 *
 *   const sgMail = require('@sendgrid/mail');
 *   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 *   await sgMail.send({
 *     to: process.env.CONTACT_RECEIVER_EMAIL,
 *     from: process.env.CONTACT_SENDER_EMAIL,
 *     subject: `New inquiry from ${fullName}`,
 *     text: message,
 *   });
 */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function submitContactForm(req, res) {
  try {
    const { fullName, email, phone, company, service, message } = req.body || {};

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Full name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'A valid email is required.' });
    }
    if (!service) {
      return res.status(400).json({ ok: false, error: 'Please select a service.' });
    }
    if (!message || message.trim().length < 20) {
      return res.status(400).json({ ok: false, error: 'Message must be at least 20 characters.' });
    }

    // Basic sanitization — strip HTML tags from free-text fields.
    const clean = (value) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '');

    const submission = {
      fullName: clean(fullName),
      email: clean(email),
      phone: clean(phone),
      company: clean(company),
      service: clean(service),
      message: clean(message),
      receivedAt: new Date().toISOString()
    };

    // ---- Integration point -------------------------------------------
    // Replace this block with your email/CRM call. For now we just log
    // the submission server-side so the flow can be tested end to end.
    console.log('New contact form submission:', submission);
    // --------------------------------------------------------------------

    return res.status(200).json({ ok: true, message: 'Message received.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ ok: false, error: 'Unable to process your request right now.' });
  }
}

module.exports = { submitContactForm };
