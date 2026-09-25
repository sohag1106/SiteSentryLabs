/**
 * POST /api/contact — contact form + Sohana lead-form submissions.
 * Validation mirrors server/server.js; storage is Neon (contact_messages).
 */
import { json, clean, db } from '../_shared.js';


export async function onRequestPost({ request, env }) {
  try {
    const sql = db(env);
    if (!sql) return json({ ok: false, error: 'Server is not configured.' }, 500);

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 100000) return json({ ok: false, error: 'Payload too large.' }, 413);

    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON body.' }, 400);
    }

    const fullName = clean(body.fullName, 120);
    const email = clean(body.email, 200);
    const phone = clean(body.phone, 50);
    const company = clean(body.company, 160);
    const service = clean(body.service, 100);
    const message = clean(body.message, 10000);

    if (fullName.length < 2) return json({ ok: false, error: 'Full name is required.' }, 400);
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: 'Valid email is required.' }, 400);
    if (!service) return json({ ok: false, error: 'Service is required.' }, 400);
    if (message.length < 20) {
      return json({ ok: false, error: 'Message must be at least 20 characters.' }, 400);
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO contact_messages (id, full_name, email, phone, company, service, message, status, created_at)
      VALUES (${id}, ${fullName}, ${email}, ${phone}, ${company}, ${service}, ${message}, 'new', now())
    `;
    return json({ ok: true, id });
  } catch (error) {
    console.error('contact error:', error);
    return json({ ok: false, error: 'Unable to process your request right now.' }, 500);
  }
}
