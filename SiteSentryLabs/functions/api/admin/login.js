/**
 * POST /api/admin/login — password check, then a DB-backed session token.
 * ADMIN_PASSWORD comes from a Pages secret; there is no hardcoded fallback.
 */
import { json, db, clientIp, timingSafeEqual, SESSION_TTL_MS } from '../../_shared.js';

const LOGIN_WINDOW_MS = 60 * 1000;
const LOGIN_LIMIT = 8;
const loginBuckets = new Map(); // best-effort, per isolate

function loginRateLimited(ip) {
  const now = Date.now();
  const current = loginBuckets.get(ip) || { start: now, count: 0 };
  if (now - current.start > LOGIN_WINDOW_MS) {
    current.start = now;
    current.count = 0;
  }
  current.count += 1;
  loginBuckets.set(ip, current);
  return current.count > LOGIN_LIMIT;
}

export async function onRequestPost({ request, env }) {
  try {
    const configuredPassword = String(env.ADMIN_PASSWORD || '');
    if (!configuredPassword) return json({ error: 'Admin login is disabled.' }, 503);

    const ip = clientIp(request);
    if (loginRateLimited(ip)) return json({ error: 'Too many attempts. Try again in a minute.' }, 429);

    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid password.' }, 401);
    }

    const attempt = String(body.password || '');
    if (!(await timingSafeEqual(attempt, configuredPassword))) {
      return json({ error: 'Invalid password.' }, 401);
    }

    const sql = db(env);
    if (!sql) return json({ error: 'Server is not configured.' }, 500);

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await sql`INSERT INTO admin_sessions (token, expires_at) VALUES (${token}, ${expiresAt})`;
    await sql`DELETE FROM admin_sessions WHERE expires_at < now()`;

    return json({ ok: true, token });
  } catch (error) {
    console.error('admin login error:', error);
    return json({ error: 'Unable to sign in right now.' }, 500);
  }
}
