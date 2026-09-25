/**
 * GET /api/admin/messages — all contact messages, newest first.
 * Returns a bare JSON array (admin.js contract).
 */
import { json, db, requireAdmin, mapMessage } from '../../../_shared.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(request, env);
    if (auth === null) return json({ error: 'Server is not configured.' }, 500);
    if (!auth) return json({ error: 'Unauthorized' }, 401);

    const sql = db(env);
    if (!sql) return json({ error: 'Server is not configured.' }, 500);

    const rows = await sql`SELECT * FROM contact_messages ORDER BY created_at DESC`;
    return json(rows.map(mapMessage));
  } catch (error) {
    console.error('admin messages list error:', error);
    return json({ error: 'Unable to load messages.' }, 500);
  }
}
