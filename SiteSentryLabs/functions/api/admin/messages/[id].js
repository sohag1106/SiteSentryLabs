/**
 * PATCH  /api/admin/messages/:id — update status (read | new).
 * DELETE /api/admin/messages/:id — remove a message.
 * Returns the updated message / {ok:true} per the admin.js contract.
 */
import { json, db, requireAdmin, mapMessage } from '../../../_shared.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth === null) return json({ error: 'Server is not configured.' }, 500);
  if (!auth) return json({ error: 'Unauthorized' }, 401);
  return null;
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const id = String(params.id || '');
    if (!UUID_RE.test(id)) return json({ error: 'Message not found.' }, 404);

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const sql = db(env);
    if (!sql) return json({ error: 'Server is not configured.' }, 500);

    if (body.status === 'read' || body.status === 'new') {
      const rows = await sql`
        UPDATE contact_messages SET status = ${body.status} WHERE id = ${id}::uuid RETURNING *
      `;
      if (!rows.length) return json({ error: 'Message not found.' }, 404);
      return json(mapMessage(rows[0]));
    }

    const rows = await sql`SELECT * FROM contact_messages WHERE id = ${id}::uuid`;
    if (!rows.length) return json({ error: 'Message not found.' }, 404);
    return json(mapMessage(rows[0]));
  } catch (error) {
    console.error('admin message patch error:', error);
    return json({ error: 'Unable to update the message.' }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const denied = await authorize(request, env);
    if (denied) return denied;

    const id = String(params.id || '');
    if (!UUID_RE.test(id)) return json({ error: 'Message not found.' }, 404);

    const sql = db(env);
    if (!sql) return json({ error: 'Server is not configured.' }, 500);

    const rows = await sql`DELETE FROM contact_messages WHERE id = ${id}::uuid RETURNING id`;
    if (!rows.length) return json({ error: 'Message not found.' }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error('admin message delete error:', error);
    return json({ error: 'Unable to delete the message.' }, 500);
  }
}
