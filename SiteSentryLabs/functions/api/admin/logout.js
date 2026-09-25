/**
 * POST /api/admin/logout — revokes the presented session token.
 */
import { json, db, requireAdmin } from '../../_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireAdmin(request, env);
    if (auth === null) return json({ error: 'Server is not configured.' }, 500);
    if (!auth) return json({ error: 'Unauthorized' }, 401);

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const sql = db(env);
    if (sql) await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
    return json({ ok: true });
  } catch (error) {
    console.error('admin logout error:', error);
    return json({ error: 'Unable to log out right now.' }, 500);
  }
}
