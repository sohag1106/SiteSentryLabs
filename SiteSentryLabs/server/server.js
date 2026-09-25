const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is not set. Refusing to start with a default admin password.');
  process.exit(1);
}
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

const sessions = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 8;

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

function readMessages() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeMessages(messages) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(messages, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function clean(value, max = 5000) {
  return String(value ?? '').trim().slice(0, max);
}

function makeId() {
  return crypto.randomUUID();
}

function makeSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies?.admin_session;
  const expires = token && sessions.get(token);
  if (!expires || expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Contact form endpoint used by contact.js
app.post('/api/contact', (req, res) => {
  const { fullName, email, phone, company, service, message } = req.body || {};

  const item = {
    id: makeId(),
    fullName: clean(fullName, 120),
    email: clean(email, 200),
    phone: clean(phone, 50),
    company: clean(company, 160),
    service: clean(service, 100),
    message: clean(message, 10000),
    status: 'new',
    createdAt: new Date().toISOString()
  };

  if (item.fullName.length < 2) return res.status(400).json({ error: 'Full name is required.' });
  if (!/^\S+@\S+\.\S+$/.test(item.email)) return res.status(400).json({ error: 'Valid email is required.' });
  if (!item.service) return res.status(400).json({ error: 'Service is required.' });
  if (item.message.length < 20) return res.status(400).json({ error: 'Message must be at least 20 characters.' });

  const messages = readMessages();
  messages.unshift(item);
  writeMessages(messages);
  res.json({ ok: true, id: item.id });
});

// Admin authentication
app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password || '');
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password.' });
  const token = makeSession();
  res.json({ ok: true, token });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  res.json(readMessages());
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const messages = readMessages();
  const index = messages.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Message not found.' });

  if (req.body.status === 'read' || req.body.status === 'new') {
    messages[index].status = req.body.status;
  }
  writeMessages(messages);
  res.json(messages[index]);
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const messages = readMessages();
  const filtered = messages.filter(m => m.id !== req.params.id);
  if (filtered.length === messages.length) return res.status(404).json({ error: 'Message not found.' });
  writeMessages(filtered);
  res.json({ ok: true });
});

app.get('/api/admin/export.csv', requireAdmin, (req, res) => {
  const messages = readMessages();
  const headers = ['Date', 'Name', 'Email', 'Phone', 'Company', 'Service', 'Status', 'Message'];
  const csvEscape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = messages.map(m => [m.createdAt, m.fullName, m.email, m.phone, m.company, m.service, m.status, m.message].map(csvEscape).join(','));
  const csv = [headers.map(csvEscape).join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sitesentrylabs-messages.csv"');
  res.send('\ufeff' + csv);
});

// Serve the admin panel and the existing website from the project root.
app.use('/admin', express.static(path.join(ROOT, 'admin')));
app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log(`SiteSentryLabs server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/`);
});
