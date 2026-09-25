/** SiteSentryLabs — Team page rendering + profile modal. */
(function () {
  'use strict';

  // Support both the window property and the global lexical binding created by data/team.js.
  // The previous implementation only checked window.SITESENTRYLABS_TEAM, while team.js
  // declared the dataset with `const`, which left the renderer with an empty array.
  const data = Array.isArray(window.SITESENTRYLABS_TEAM)
    ? window.SITESENTRYLABS_TEAM
    : (typeof SITESENTRYLABS_TEAM !== 'undefined' && Array.isArray(SITESENTRYLABS_TEAM)
      ? SITESENTRYLABS_TEAM
      : []);
  const grids = {
    founder: document.getElementById('founders-grid'),
    advisor: document.getElementById('advisors-grid'),
    member: document.getElementById('members-grid')
  };

  // Normalize category values so Founder/founder, "Advisor — Demo Placeholder", etc.
  // all resolve to the same section without silently dropping a card.
  function normalizeCategory(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.startsWith('founder')) return 'founder';
    if (normalized.startsWith('advisor')) return 'advisor';
    if (normalized.startsWith('member')) return 'member';
    return 'member';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));
  }

  function initials(fullName) {
    return String(fullName || 'SS').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(x => x[0]).join('').toUpperCase() || 'SS';
  }

  let openProfile = function () {};

  function card(person, index) {
    const article = document.createElement('article');
    article.className = 'team-card glass reveal';
    article.setAttribute('data-tilt', '');
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Open profile for ${person.name || 'team member'}`);
    article.dataset.teamIndex = String(index);

    const photoHtml = person.photo
      ? `<img src="${escapeHtml(person.photo)}" alt="${escapeHtml(person.name)} profile placeholder">`
      : `<span class="team-card__initial">${escapeHtml(initials(person.name))}</span>`;

    article.innerHTML = `
      <div class="team-card__photo">${photoHtml}</div>
      <div class="team-card__body">
        <h3>${escapeHtml(person.name)}</h3>
        <span class="team-card__role">${escapeHtml(person.role)}</span>
        <p class="team-card__bio">${escapeHtml(person.bio)}</p>
        <div class="team-card__social"><span aria-hidden="true">View profile</span></div>
      </div>`;

    const activate = () => openProfile(index);
    article.addEventListener('click', activate);
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
    return article;
  }

  // Render cards independently of the modal. A missing/changed modal must never
  // prevent the Team Page itself from rendering.
  const renderedCards = [];
  data.forEach((person, index) => {
    const section = normalizeCategory(person.category);
    const grid = grids[section];
    if (!grid) return;
    const element = card(person, index);
    grid.appendChild(element);
    renderedCards.push(element);
  });

  // animations.js runs before team.js and therefore cannot observe dynamically
  // inserted .reveal elements. Activate them on the next frame so they remain
  // animated while never getting stuck at opacity: 0.
  requestAnimationFrame(() => {
    renderedCards.forEach((el, i) => {
      el.style.setProperty('--stagger-index', i % 8);
      requestAnimationFrame(() => el.classList.add('is-visible'));
    });
  });

  const modal = document.getElementById('team-modal');
  if (!modal) return;

  const dialog = modal.querySelector('.team-modal__dialog');
  const photo = document.getElementById('team-modal-photo');
  const category = document.getElementById('team-modal-category');
  const name = document.getElementById('team-modal-name');
  const role = document.getElementById('team-modal-role');
  const bio = document.getElementById('team-modal-bio');
  const expertise = document.getElementById('team-modal-expertise');
  const social = document.getElementById('team-modal-social');
  let lastFocus = null;

  function open(index) {
    const person = data[index];
    if (!person) return;

    lastFocus = document.activeElement;
    category.textContent = person.category || 'Team Profile';
    name.textContent = person.name || 'Team Member';
    role.textContent = person.role || '';
    bio.textContent = person.bio || '';
    expertise.innerHTML = (person.expertise || [])
      .map(item => `<li>${escapeHtml(item)}</li>`).join('');

    const socialNames = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['instagram', 'Instagram']];
    social.innerHTML = socialNames.map(([key, label]) =>
      `<a href="${escapeHtml(person.social?.[key] || '#')}" aria-label="${label}">${label}</a>`
    ).join('');

    photo.innerHTML = person.photo
      ? `<img src="${escapeHtml(person.photo)}" alt="${escapeHtml(person.name)} profile placeholder">`
      : `<span>${escapeHtml(initials(person.name))}</span>`;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('team-modal-open');
    if (dialog) dialog.focus();
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('team-modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  openProfile = open;

  modal.querySelectorAll('[data-team-modal-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
