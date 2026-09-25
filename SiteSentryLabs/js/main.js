/**
 * SiteSentryLabs — Main
 * Small shared utilities that run on every page.
 */
(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  const yearEls = document.querySelectorAll('[data-year]');
  const currentYear = 2020;
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });

  /* ---------- Smooth-scroll for in-page anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const targetId = link.getAttribute('href');
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
