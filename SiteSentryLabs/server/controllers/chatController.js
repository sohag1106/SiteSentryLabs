/**
 * Sohana chat controller.
 *
 * Uses a centralized, factual SiteSentryLabs context and an optional
 * OpenAI-compatible provider. Secrets are read only from server env vars.
 * When no provider is configured, the local conversational fallback remains usable.
 */
const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY = 10;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 30;
const buckets = new Map();

const SYSTEM_PROMPT = `You are Sohana, the SiteSentryLabs AI Assistant. You are clearly an AI assistant, not a human employee.
Role: AI receptionist, service consultant, project discovery assistant, website guide and lead qualification assistant.
Be professional, friendly, confident, concise and easy to scan. Understand natural language and use the conversation history for context.
Only state SiteSentryLabs facts supplied in the context. Never invent clients, partnerships, certifications, pricing, guarantees, revenue, user counts, awards, project results or team facts.
Services include:
- Web Development: Business websites, Corporate websites, Landing pages, E-commerce websites, Booking systems, Custom web applications, Website maintenance.
- Cybersecurity: Website security, Security audits, Vulnerability assessment, Secure development, Application security, Security monitoring, Security consulting.
- App Development: Android applications, iOS applications, Cross-platform applications, UI/UX, API integration, App maintenance.
- Software Development: Custom business software, Management systems, Dashboards, Automation, API development, Database systems, Custom software solutions.
Technologies/platforms: AWS, Microsoft Azure, Google Cloud, React, Node.js and Cloudflare. Do not describe these as formal partnerships unless explicitly verified.
Pricing: do not give a fixed price. Explain that cost depends on scope, features, design, integrations and complexity, then ask what the visitor wants to build.
Project discovery: ask one relevant follow-up question at a time. Useful fields include project type, industry, objective, features, target users, platform, timeline, existing website/app, optional budget and contact preference.
Portfolio: use only the supplied current Home page project data. Do not invent client names or results.
Navigation: when useful, offer links/buttons to services.html, about.html, team.html or contact.html.
If information is unavailable, say so clearly and direct the visitor to the Contact page.
Keep most replies short; use bullets when useful.`;

function clean(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : '';
}

function limitedHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-MAX_HISTORY).map(item => ({
    role: item && item.role === 'assistant' ? 'assistant' : 'user',
    content: clean(item && item.content).slice(0, MAX_MESSAGE_LENGTH)
  })).filter(item => item.content);
}

function limitedProjects(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map(p => ({
    title: clean(p && p.title).slice(0, 120),
    category: clean(p && p.category).slice(0, 80),
    description: clean(p && p.description).slice(0, 400)
  })).filter(p => p.title);
}

function rateLimited(ip) {
  const now = Date.now();
  const current = buckets.get(ip) || { start: now, count: 0 };
  if (now - current.start > RATE_WINDOW_MS) { current.start = now; current.count = 0; }
  current.count += 1;
  buckets.set(ip, current);
  if (buckets.size > 2000) {
    for (const [key, value] of buckets) if (now - value.start > RATE_WINDOW_MS) buckets.delete(key);
  }
  return current.count > RATE_LIMIT;
}

function localReply(question, projects, history) {
  const q = question.toLowerCase();
  const previous = history.filter(item => item.role === 'user').slice(-3).map(item => item.content).join(' ');
  const context = (previous + ' ' + q).toLowerCase();

  if (/\b(cost|price|pricing|budget|quote|quotation|how much|fee)\b/.test(q)) {
    return { reply: 'Project cost depends on the scope, features, design requirements, integrations, and development complexity.\n\nIf you tell me what you’re looking to build, I can help outline the requirements so the SiteSentryLabs team can provide an appropriate estimate.\n\nWhat are you looking to build?' };
  }
  if (/\b(contact|reach|email|phone|call|message|talk|team)\b/.test(q)) {
    return { reply: 'Absolutely. You can contact the SiteSentryLabs team through the Contact page and send your project requirements.', contact: true };
  }
  if (/\b(technology|technologies|tech stack|stack|aws|azure|google cloud|react|node\.js|cloudflare)\b/.test(q)) {
    return { reply: 'We work with technologies and platforms including AWS, Microsoft Azure, Google Cloud, React, Node.js and Cloudflare. The exact stack depends on the project requirements.' };
  }
  if (/\b(project|portfolio|showcase|work|built|example)\b/.test(q) && projects.length) {
    return { reply: 'The Home page currently showcases:\n' + projects.map(p => `• ${p.title} — ${p.category}${p.description ? `\n  ${p.description}` : ''}`).join('\n') + '\n\nI only use information currently published in the site data and will not invent client results or performance claims.' };
  }
  if (/\b(team|member|founder|cto|ceo|advisor)\b/.test(q)) {
    return { reply: 'The SiteSentryLabs team information is available on the Our Team page. I can direct you there rather than inventing additional biographies or roles.', team: true };
  }
  if (/\b(service|services|offer|what do you do)\b/.test(q)) {
    return { reply: 'Here’s what SiteSentryLabs can offer:\n• Web Development\n• Cybersecurity\n• App Development\n• Software Development\n\nTell me what you’re trying to build and I can help identify the relevant service.' };
  }
  if (/\b(cyber|security|vulnerab|audit|secure|threat|monitoring)\b/.test(q) && /need|want|protect|build|company|system|website|app|software/.test(context)) {
    return { reply: 'Cybersecurity services can include:\n• Website security\n• Security audits\n• Vulnerability assessment\n• Secure development\n• Application security\n• Security monitoring\n• Security consulting\n\nWhat are you trying to protect — a website, application, server, or business system?' };
  }
  if (/\b(app|android|ios|mobile|cross-platform)\b/.test(q) && /need|want|build|create|develop/.test(q)) {
    return { reply: 'That sounds like an App Development project. SiteSentryLabs can work with Android, iOS or cross-platform applications, plus UI/UX, API integration and maintenance.\n\nWould you need Android, iOS, or both?' };
  }
  if (/\b(software|management system|dashboard|automation|database|business system)\b/.test(q) && /need|want|build|create|develop/.test(q)) {
    return { reply: 'That sounds like a Software Development project. SiteSentryLabs can build custom business software, management systems, dashboards, automation, APIs and database systems.\n\nWhat business process should the software manage?' };
  }
  if (/\b(website|web site|landing page|e-?commerce|online store|booking site)\b/.test(q) && /need|want|build|create|develop|business/.test(q)) {
    return { reply: 'That sounds like a Web Development project. SiteSentryLabs can help with business or corporate websites, e-commerce, booking systems and custom web applications.\n\nWhat type of website do you need?' };
  }
  if (/start|discuss my project|work together|hire|new project|idea/.test(q)) {
    return { reply: 'Sure! Tell me what you want to build and I’ll help you outline the requirements step by step.\n\nWhat are you looking to build?' };
  }
  if (/\b(company|about sitesentry|who are you|sitesentrylabs)\b/.test(q)) {
    return { reply: 'SiteSentryLabs is presented on this website as an IT company focused on modern digital solutions, including websites, software, applications and cybersecurity.\n\nI can also help you explore services, projects, technologies or project requirements.' };
  }
  return { reply: "I don't have enough information to answer that accurately.\n\nI can help with SiteSentryLabs services, project requirements, technologies, portfolio information, or contacting the team." };
}

async function submitChat(req, res) {
  try {
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
    if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'Please wait a moment before sending another message.' });

    const message = clean(req.body && req.body.message);
    if (!message) return res.status(400).json({ ok: false, error: 'Message is required.' });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });

    const history = limitedHistory(req.body && req.body.history);
    const projects = limitedProjects(req.body && req.body.projects);
    const providerUrl = clean(process.env.AI_API_URL);
    const providerKey = clean(process.env.AI_API_KEY);
    const providerModel = clean(process.env.AI_MODEL);

    if (providerUrl && providerKey && providerModel && typeof fetch === 'function') {
      try {
        const context = [
          projects.length ? `Current Home page projects:\n${projects.map(p => `- ${p.title} (${p.category}): ${p.description}`).join('\n')}` : '',
          'Current website pages: About (about.html), Services (services.html), Our Team (team.html), Contact (contact.html).'
        ].filter(Boolean).join('\n\n');
        const providerResponse = await fetch(providerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerKey}` },
          body: JSON.stringify({
            model: providerModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
              ...history,
              { role: 'user', content: message }
            ],
            temperature: 0.2,
            max_tokens: 420
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (providerResponse.ok) {
          const data = await providerResponse.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) return res.json({ ok: true, reply: clean(reply).slice(0, 2500), mode: 'ai' });
        }
        console.warn('Configured AI provider returned an unsuccessful response; using local fallback.');
      } catch (providerError) {
        console.warn('AI provider request failed; using local fallback.', providerError.message);
      }
    }

    return res.json({ ok: true, ...localReply(message, projects, history), mode: 'local' });
  } catch (error) {
    console.error('Sohana chat error:', error);
    return res.status(500).json({ ok: false, error: 'Unable to process your message right now.' });
  }
}

module.exports = { submitChat };
