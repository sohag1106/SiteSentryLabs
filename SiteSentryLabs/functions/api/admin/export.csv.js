/**
 * GET /api/admin/export.csv — CSV export of all messages (BOM + quoted,
 * same columns as the Express server).
 */
import { db, requireAdmin, mapMessage } from '../../_shared.js';

const csvEscape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(request, env);
    if (auth === null) {
      return new Response(JSON.stringify({ error: 'Server is not configured.' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }

    const sql = db(env);
    if (!sql) {
      return new Response(JSON.stringify({ error: 'Server is not configured.' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }

    const rows = await sql`SELECT * FROM contact_messages ORDER BY created_at DESC`;
    const messages = rows.map(mapMessage);
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Company', 'Service', 'Status', 'Message'];
    const lines = messages.map((m) =>
      [m.createdAt, m.fullName, m.email, m.phone, m.company, m.service, m.status, m.message]
        .map(csvEscape)
        .join(',')
    );
    const csv = [headers.map(csvEscape).join(','), ...lines].join('\n');

    return new Response('﻿' + csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="sitesentrylabs-messages.csv"',
        'cache-control': 'no-store'
      }
    });
  } catch (error) {
    console.error('admin export error:', error);
    return new Response(JSON.stringify({ error: 'Unable to export messages.' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }
}
