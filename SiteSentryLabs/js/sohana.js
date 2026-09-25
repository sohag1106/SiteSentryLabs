/**
 * SiteSentryLabs — Sohana AI Assistant
 * Advanced conversational UI with local intelligence and an optional secure /api/chat provider.
 */
(function () {
  'use strict';

  const launcher = document.getElementById('sohana-launcher');
  const panel = document.getElementById('sohana-panel');
  const closeBtn = document.getElementById('sohana-close');
  const minimizeBtn = document.getElementById('sohana-minimize');
  const clearBtn = document.getElementById('sohana-clear');
  const clearTextBtn = document.getElementById('sohana-clear-text');
  const form = document.getElementById('sohana-form');
  const input = document.getElementById('sohana-input');
  const messages = document.getElementById('sohana-messages');
  const suggestions = document.getElementById('sohana-suggestions');
  const status = document.getElementById('sohana-status');
  const leadForm = document.getElementById('sohana-lead-form');
  const leadFields = document.getElementById('sohana-lead-fields');
  const leadCancel = document.getElementById('sohana-lead-cancel');

  if (!launcher || !panel || !form || !input || !messages) return;

  const company = window.siteSentryCompany || {};
  const WELCOME = "Hi! I'm Sohana, the SiteSentryLabs AI Assistant. 👋\n\nI can help you explore our services, understand what we build, discuss your project requirements, and guide you to the right solution.\n\nWhat are you looking to build?";
  const QUICK_ACTIONS = ['Build a Website', 'Build an App', 'Custom Software', 'Cybersecurity', 'Discuss My Project'];
  const MAX_MESSAGE_LENGTH = 800;
  const HISTORY_KEY = 'sitesentrylabs-sohana-history';
  const MAX_HISTORY = 20;
  let history = loadHistory();
  let typingEl = null;
  let minimized = false;
  let discovery = { mode: false, type: '', answers: {} };
  let pendingInquiry = null;

  const intentPatterns = {
    PRICING_QUESTION: /\b(cost|price|pricing|budget|quote|quotation|how much|fee)\b/i,
    CONTACT_REQUEST: /\b(contact|reach|email|phone|call|message|talk|team)\b/i,
    WEBSITE_PROJECT: /\b(website|web site|landing page|e-?commerce|online store|booking site)\b/i,
    APP_PROJECT: /\b(app|android|ios|mobile application|cross[- ]platform)\b/i,
    SOFTWARE_PROJECT: /\b(software|management system|dashboard|automation|database|business system)\b/i,
    CYBERSECURITY_PROJECT: /\b(cyber|security|vulnerab|audit|secure|threat|monitoring)\b/i,
    TECHNOLOGY_QUESTION: /\b(technology|technologies|tech stack|stack|aws|azure|google cloud|react|node\.js|cloudflare)\b/i,
    PORTFOLIO_QUESTION: /\b(project|portfolio|showcase|work|built|example)\b/i,
    COMPANY_INFORMATION: /\b(company|about sitesentry|who are you|sitesentrylabs|what do you do)\b/i,
    TEAM_INFORMATION: /\b(team|member|founder|cto|ceo|advisor)\b/i,
    PROJECT_INQUIRY: /\b(build|create|develop|need|want|looking for|start|hire|work together|project)\b/i
  };

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
    } catch (_) { return []; }
  }

  function saveHistory() {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch (_) {}
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      minimized = false;
      panel.classList.remove('is-minimized');
      window.setTimeout(function () { input.focus(); scrollToBottom(); }, 80);
    }
  }

  function setMinimized(value) {
    minimized = value;
    panel.classList.toggle('is-minimized', value);
    if (!value) window.setTimeout(function () { input.focus(); }, 80);
  }

  function scrollToBottom() { messages.scrollTop = messages.scrollHeight; }

  function addMessage(role, text, options) {
    const item = document.createElement('div');
    item.className = 'sohana-message sohana-message--' + role;
    if (options && options.typing) item.classList.add('is-typing');

    const bubble = document.createElement('div');
    bubble.className = 'sohana-bubble';
    if (options && options.typing) {
      bubble.innerHTML = '<span class="sohana-typing-label">Sohana is typing</span><span class="sohana-dots"><i></i><i></i><i></i></span>';
    } else {
      renderText(bubble, text);
    }
    item.appendChild(bubble);
    messages.appendChild(item);
    scrollToBottom();
    return item;
  }

  function renderText(container, text) {
    container.textContent = '';
    const lines = String(text || '').split('\n');
    lines.forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^[-*•]\s/.test(trimmed)) {
        const li = document.createElement('div');
        li.className = 'sohana-bullet';
        li.textContent = '• ' + trimmed.replace(/^[-*•]\s*/, '');
        container.appendChild(li);
      } else {
        const p = document.createElement('p');
        p.textContent = trimmed;
        container.appendChild(p);
      }
    });
  }

  function addAction(container, label, href, handler) {
    const button = document.createElement('a');
    button.className = 'sohana-action';
    button.textContent = label;
    if (href) button.href = href;
    if (handler) {
      button.href = '#';
      button.addEventListener('click', function (event) { event.preventDefault(); handler(); });
    }
    container.appendChild(button);
  }

  function showTyping() {
    hideTyping();
    typingEl = addMessage('assistant', '', { typing: true });
    status.textContent = 'Sohana is typing…';
  }

  function hideTyping() {
    if (typingEl) typingEl.remove();
    typingEl = null;
    status.textContent = 'Online';
  }

  function detectIntent(question) {
    const intents = [];
    Object.keys(intentPatterns).forEach(function (name) { if (intentPatterns[name].test(question)) intents.push(name); });
    if (!intents.length) return 'UNKNOWN';
    if (intents.includes('PRICING_QUESTION')) return 'PRICING_QUESTION';
    if (intents.includes('CONTACT_REQUEST')) return 'CONTACT_REQUEST';
    if (intents.includes('WEBSITE_PROJECT')) return 'WEBSITE_PROJECT';
    if (intents.includes('APP_PROJECT')) return 'APP_PROJECT';
    if (intents.includes('SOFTWARE_PROJECT')) return 'SOFTWARE_PROJECT';
    if (intents.includes('CYBERSECURITY_PROJECT')) return 'CYBERSECURITY_PROJECT';
    if (intents.includes('TECHNOLOGY_QUESTION')) return 'TECHNOLOGY_QUESTION';
    if (intents.includes('PORTFOLIO_QUESTION')) return 'PORTFOLIO_QUESTION';
    if (intents.includes('TEAM_INFORMATION')) return 'TEAM_INFORMATION';
    if (intents.includes('COMPANY_INFORMATION')) return 'COMPANY_INFORMATION';
    if (intents.includes('PROJECT_INQUIRY')) return 'PROJECT_INQUIRY';
    return 'GENERAL_QUESTION';
  }

  function serviceNameForIntent(intent) {
    return ({ WEBSITE_PROJECT: 'Web Development', APP_PROJECT: 'App Development', SOFTWARE_PROJECT: 'Software Development', CYBERSECURITY_PROJECT: 'Cybersecurity' })[intent] || '';
  }

  function projectListText() {
    const projects = Array.isArray(window.siteSentryProjects) ? window.siteSentryProjects : [];
    if (!projects.length) return 'I don’t have additional project information available right now.';
    return 'The Home page currently showcases:\n' + projects.map(function (p) { return '• ' + (p.title || 'Project') + ' — ' + (p.category || 'Digital Solution'); }).join('\n') + '\n\nI only use information currently published in the site data and won’t invent client results or performance claims.';
  }

  function websiteQuestion() { return 'What type of website do you need?'; }
  function appQuestion() { return 'Would you need Android, iOS, or both?'; }
  function softwareQuestion() { return 'What business process should the software manage?'; }
  function cyberQuestion() { return 'What are you trying to protect — a website, application, server, or business system?'; }

  function beginDiscovery(type) {
    discovery = { mode: true, type: type, answers: {} };
    return { text: type + ' sounds like a good fit. I can help you outline the project requirements step by step.\n\n' + nextDiscoveryQuestion() };
  }

  function nextDiscoveryQuestion() {
    const a = discovery.answers;
    if (!a.projectType) return 'What are you looking to build?';
    if (!a.industry) return 'What business or industry is it for?';
    if (!a.objective) return 'What is the main goal of the project?';
    if (!a.features) return 'What are the most important features you need?';
    if (!a.platform) return 'Which platform should it support?';
    if (!a.timeline) return 'Do you have a preferred launch timeline?';
    return '';
  }

  function captureDiscovery(question) {
    const a = discovery.answers;
    const q = question.trim();
    if (!a.projectType) { a.projectType = q; return 'What business or industry is it for?'; }
    if (!a.industry) { a.industry = q; return 'What is the main goal of the project?'; }
    if (!a.objective) { a.objective = q; return 'What are the most important features you need?'; }
    if (!a.features) { a.features = q; return 'Which platform should it support?'; }
    if (!a.platform) { a.platform = q; return 'Do you have a preferred launch timeline?'; }
    if (!a.timeline) { a.timeline = q; return 'Thanks. Would you like to add an approximate budget or leave that for the team to discuss?'; }
    if (!a.budget) { a.budget = /skip|no|leave|not sure|prefer not/i.test(q) ? 'Not provided' : q; return 'Would you like to send these project details to the SiteSentryLabs team?'; }
    return '';
  }

  function discoverySummary() {
    const a = discovery.answers;
    return 'Here’s what I’ve understood:\n\nProject:\n' + (a.projectType || 'To be discussed') + '\n\nBusiness / Industry:\n' + (a.industry || 'To be discussed') + '\n\nGoal:\n' + (a.objective || 'To be discussed') + '\n\nKey Features:\n• ' + (a.features || 'To be discussed') + '\n\nPlatform:\n' + (a.platform || 'To be discussed') + '\n\nTimeline:\n' + (a.timeline || 'To be discussed') + '\n\nBudget:\n' + (a.budget || 'Not provided');
  }

  function localResponse(question) {
    const q = question.toLowerCase();
    const intent = detectIntent(question);

    if (discovery.mode) {
      const next = captureDiscovery(question);
      if (next === 'Would you like to send these project details to the SiteSentryLabs team?') {
        pendingInquiry = discoverySummary();
        return { text: discoverySummary() + '\n\nWould you like to send these project details to the SiteSentryLabs team?', inquiry: true };
      }
      return { text: next };
    }

    if (intent === 'PRICING_QUESTION') return { text: 'Project cost depends on the scope, features, design requirements, integrations, and development complexity.\n\nIf you tell me what you’re looking to build, I can help outline the requirements so the SiteSentryLabs team can provide an appropriate estimate.\n\nWhat are you looking to build?' };
    if (intent === 'CONTACT_REQUEST') return { text: 'Absolutely. You can contact the SiteSentryLabs team through our Contact page and send your project requirements.', contact: true };
    if (intent === 'TECHNOLOGY_QUESTION') return { text: 'We work with technologies and platforms including AWS, Microsoft Azure, Google Cloud, React, Node.js and Cloudflare. The exact stack depends on the project requirements.' };
    if (intent === 'PORTFOLIO_QUESTION') return { text: projectListText() };
    if (intent === 'TEAM_INFORMATION') return { text: 'The Home site links to the SiteSentryLabs Our Team page, where the team information is published. I won’t invent roles or biographies that are not in the site data.', team: true };
    if (intent === 'COMPANY_INFORMATION') return { text: (company.description || 'SiteSentryLabs provides digital technology solutions.') + '\n\nI can also help you explore our services, projects, technologies, or project requirements.' };

    const service = serviceNameForIntent(intent);
    if (service) {
      const items = company.services && company.services[service] ? company.services[service] : [];
      if (intent === 'WEBSITE_PROJECT' && /need|want|build|create|business|store|website/i.test(q)) return beginDiscovery('Web Development');
      if (intent === 'APP_PROJECT' && /need|want|build|create|app/i.test(q)) return beginDiscovery('App Development');
      if (intent === 'SOFTWARE_PROJECT' && /need|want|build|create|software|system/i.test(q)) return beginDiscovery('Software Development');
      if (intent === 'CYBERSECURITY_PROJECT' && /need|want|protect|security|secure|build/i.test(q)) return beginDiscovery('Cybersecurity');
      return { text: service + ' can include:\n' + items.map(function (item) { return '• ' + item; }).join('\n') + '\n\nTell me a little about your project and I can point you in the right direction.' };
    }

    if (/service|offer|what do you do/.test(q)) return { text: 'Here’s what SiteSentryLabs can offer:\n• Web Development\n• Cybersecurity\n• App Development\n• Software Development\n\nTell me what you’re trying to build and I can help identify the relevant service.' };
    if (/start.*project|work together|hire|discuss my project|project inquiry/.test(q)) return beginDiscovery('Custom Digital Solution');
    if (/about|company|sitesentrylabs/.test(q)) return { text: company.description || 'SiteSentryLabs focuses on modern digital solutions.' };
    return { text: "I don't have enough information to answer that accurately.\n\nI can help with SiteSentryLabs services, project requirements, technologies, portfolio information, or contacting the team." };
  }

  function actionButtons(result) {
    if (!result) return;
    const bubble = result.element.querySelector('.sohana-bubble');
    if (!bubble) return;
    if (result.contact) addAction(bubble, 'Go to Contact →', 'contact.html');
    if (result.team) addAction(bubble, 'Meet Our Team →', 'team.html');
    if (result.inquiry) {
      addAction(bubble, 'Send Project Inquiry', null, openLeadForm);
      addAction(bubble, 'Edit Requirements', null, function () { discovery.mode = true; pendingInquiry = null; input.focus(); });
    }
  }

  function renderSuggestions() {
    if (!suggestions) return;
    suggestions.innerHTML = '';
    QUICK_ACTIONS.forEach(function (question) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sohana-suggestion';
      button.textContent = question;
      button.addEventListener('click', function () { sendMessage(question); });
      suggestions.appendChild(button);
    });
  }

  function addLeadForm() {
    if (!leadForm) return;
    leadForm.hidden = false;
    if (leadFields) leadFields.focus();
  }

  function openLeadForm() {
    if (!leadForm) {
      addMessage('assistant', 'The project inquiry form is not configured in this build. Please use the Contact page instead.');
      return;
    }
    leadForm.hidden = false;
    window.setTimeout(function () { const first = leadForm.querySelector('input'); if (first) first.focus(); }, 60);
  }

  async function submitLead(event) {
    event.preventDefault();
    if (!leadForm) return;
    const formData = new FormData(leadForm);
    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      service: String(formData.get('service') || '').trim(),
      message: (pendingInquiry || discoverySummary()).slice(0, 5000)
    };
    if (!payload.fullName || !payload.email || !payload.service) return;
    const submit = leadForm.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.ok) throw new Error('Inquiry unavailable');
      leadForm.hidden = true;
      addMessage('assistant', 'Thanks! Your project requirements have been submitted to the SiteSentryLabs inquiry endpoint. The team can review the details from there.');
      pendingInquiry = null;
      discovery.mode = false;
    } catch (_) {
      const fallback = addMessage('assistant', 'I couldn’t submit the inquiry from this chat right now. Please use the Contact page to send the same requirements directly to the SiteSentryLabs team.');
      addAction(fallback.querySelector('.sohana-bubble'), 'Go to Contact →', 'contact.html');
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = 'Send Inquiry'; }
    }
  }

  async function getResponse(question) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: history.slice(-10),
          projects: Array.isArray(window.siteSentryProjects) ? window.siteSentryProjects : [],
          company: company
        })
      });
      if (!response.ok) throw new Error('Chat API unavailable');
      const data = await response.json();
      if (data && data.reply) return { text: String(data.reply), contact: Boolean(data.contact), team: Boolean(data.team), inquiry: Boolean(data.inquiry) };
    } catch (_) {}
    return localResponse(question);
  }

  async function sendMessage(raw) {
    const question = String(raw || '').trim();
    if (!question || question.length > MAX_MESSAGE_LENGTH) return;
    input.value = '';
    if (suggestions) suggestions.innerHTML = '';
    addMessage('user', question);
    history.push({ role: 'user', content: question });
    saveHistory();
    showTyping();
    const response = await getResponse(question);
    hideTyping();
    const element = addMessage('assistant', response.text);
    const result = Object.assign({ element: element }, response);
    actionButtons(result);
    history.push({ role: 'assistant', content: response.text });
    saveHistory();
    scrollToBottom();
  }

  function resetConversation() {
    history = [];
    discovery = { mode: false, type: '', answers: {} };
    pendingInquiry = null;
    saveHistory();
    messages.innerHTML = '';
    if (leadForm) leadForm.hidden = true;
    addMessage('assistant', 'Conversation cleared.\n\n' + WELCOME);
    renderSuggestions();
    status.textContent = 'Online';
  }

  function restoreConversation() {
    messages.innerHTML = '';
    if (!history.length) {
      addMessage('assistant', WELCOME);
      renderSuggestions();
      return;
    }
    history.forEach(function (item) { if (item && (item.role === 'user' || item.role === 'assistant')) addMessage(item.role, item.content); });
  }

  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  closeBtn && closeBtn.addEventListener('click', function () { setOpen(false); });
  minimizeBtn && minimizeBtn.addEventListener('click', function () { setMinimized(!minimized); });
  clearBtn && clearBtn.addEventListener('click', resetConversation);
  clearTextBtn && clearTextBtn.addEventListener('click', resetConversation);
  form.addEventListener('submit', function (event) { event.preventDefault(); sendMessage(input.value); });
  leadForm && leadForm.addEventListener('submit', submitLead);
  leadCancel && leadCancel.addEventListener('click', function () { leadForm.hidden = true; input.focus(); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  restoreConversation();
})();
