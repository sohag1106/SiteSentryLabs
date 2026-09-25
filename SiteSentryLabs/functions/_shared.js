/**
 * Shared helpers for SiteSentryLabs Pages Functions.
 * Underscore-prefixed files are not routed.
 */
import { neon } from '@neondatabase/serverless';

export const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h, same as the Express server

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

/** Strip HTML tags, trim, and cap length (same intent as the Express controllers). */
export function clean(value, max = 5000) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, max);
}

/**
 * Neon over HTTP. Returns null when DATABASE_URL is not configured so
 * handlers can fail closed instead of throwing.
 */
export function db(env) {
  const raw = String(env.DATABASE_URL || '').trim();
  if (!raw) return null;
  let url = raw;
  try {
    // The HTTP driver does not use libpq channel binding; drop the param.
    const parsed = new URL(raw);
    parsed.searchParams.delete('channel_binding');
    url = parsed.toString();
  } catch {
    /* keep raw */
  }
  return neon(url);
}

export function mapMessage(row) {
  const created = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    service: row.service,
    message: row.message,
    status: row.status,
    createdAt: Number.isNaN(created.getTime()) ? String(row.created_at) : created.toISOString()
  };
}

/**
 * Verifies a Bearer session token against admin_sessions.
 * true = valid, false = missing/invalid/expired, null = backend unavailable.
 */
export async function requireAdmin(request, env) {
  const sql = db(env);
  if (!sql) return null;
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const token = match[1].trim();
  if (!token) return false;
  try {
    const rows = await sql`SELECT token, expires_at FROM admin_sessions WHERE token = ${token}`;
    const session = rows[0];
    if (!session) return false;
    const expires = new Date(session.expires_at).getTime();
    if (!Number.isFinite(expires) || expires < Date.now()) {
      await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
      return false;
    }
    return true;
  } catch (error) {
    console.error('admin auth error:', error);
    return null;
  }
}

/** Hash-then-compare so password checks are not trivially timing-sensitive. */
export async function timingSafeEqual(a, b) {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(String(a))),
    crypto.subtle.digest('SHA-256', encoder.encode(String(b)))
  ]);
  const va = new Uint8Array(hashA);
  const vb = new Uint8Array(hashB);
  let diff = 0;
  for (let i = 0; i < va.length; i += 1) diff |= va[i] ^ vb[i];
  return diff === 0;
}
