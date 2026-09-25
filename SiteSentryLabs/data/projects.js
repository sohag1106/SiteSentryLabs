/**
 * SiteSentryLabs — Editable Home Page Project Showcase
 * Replace these demo entries with real project information when ready.
 */
window.siteSentryProjects = [
  {
    title: 'Modern Business Website',
    category: 'Web Development',
    description: 'A polished, conversion-focused web experience with a responsive layout and premium visual system.',
    image: 'assets/images/project-business-website.svg',
    link: '#'
  },
  {
    title: 'Billing Application',
    category: 'App Development',
    description: 'A clean mobile product concept focused on intuitive navigation, useful insights and frictionless flows.',
    image: 'assets/images/project-mobile-app.svg',
    link: '#'
  },
  {
    title: 'Business Management Dashboard',
    category: 'Software Development',
    description: 'A sophisticated SaaS dashboard concept for monitoring operations, performance and business analytics.',
    image: 'assets/images/project-management-dashboard.svg',
    link: '#'
  },
  {
    title: 'Cybersecurity Dashboard',
    category: 'Cybersecurity',
    description: 'A futuristic security monitoring concept for visualizing alerts, system health and threat activity.',
    image: 'assets/images/project-cybersecurity-dashboard.svg',
    link: '#'
  }
];

(function renderProjectShowcase() {
  const host = document.getElementById('project-showcase');
  if (!host || !Array.isArray(window.siteSentryProjects)) return;

  host.innerHTML = window.siteSentryProjects.map(function (project, index) {
    const safeTitle = String(project.title || 'Project');
    const safeCategory = String(project.category || 'Digital Solution');
    const safeDescription = String(project.description || '');
    const safeImage = String(project.image || '');
    const safeLink = String(project.link || '#');

    return `
      <article class="project-card glass reveal" data-tilt>
        <a class="project-card__visual" href="${safeLink}" aria-label="View ${safeTitle}" data-project-link>
          <img src="${safeImage}" alt="${safeTitle} demo interface" loading="lazy" />
          <span class="project-card__overlay" aria-hidden="true"></span>
          <span class="project-card__preview-label">DEMO PREVIEW</span>
        </a>
        <div class="project-card__body">
          <span class="project-card__index">${String(index + 1).padStart(2, '0')}</span>
          <p class="project-card__category">${safeCategory}</p>
          <h3>${safeTitle}</h3>
          <p class="project-card__description">${safeDescription}</p>
          <a class="project-card__link" href="${safeLink}" data-project-link>
            View Project
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </article>`;
  }).join('');

  // Demo links stay non-navigational until replaced with a real project URL.
  host.querySelectorAll('[data-project-link]').forEach(function (link) {
    if (link.getAttribute('href') === '#') {
      link.addEventListener('click', function (event) { event.preventDefault(); });
    }
  });
})();
