/**
 * SiteSentryLabs — Animations
 * Lightweight, dependency-free motion: loader, custom cursor, particle field,
 * scroll-reveal, animated counters, magnetic buttons, card tilt.
 * All effects respect prefers-reduced-motion.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loading screen ---------- */
  const loader = document.querySelector('.loader');
  if (loader) {
    if (prefersReducedMotion) {
      loader.classList.add('is-hidden');
    } else {
      requestAnimationFrame(function () {
        loader.classList.add('is-animating');
      });
      const hideLoader = function () {
        setTimeout(function () {
          loader.classList.add('is-hidden');
        }, 700);
      };
      if (document.readyState === 'complete') {
        hideLoader();
      } else {
        window.addEventListener('load', hideLoader);
        /* Safety fallback in case 'load' is delayed */
        setTimeout(hideLoader, 2200);
      }
    }
  }

  /* ---------- Custom cursor (desktop only, pointer: fine) ---------- */
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (isFinePointer && !prefersReducedMotion) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const interactiveSelector = 'a, button, input, textarea, select, [data-cursor-hover]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(interactiveSelector)) {
        ring.classList.add('is-active');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(interactiveSelector)) {
        ring.classList.remove('is-active');
      }
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });
  }

  /* ---------- Particle field ---------- */
  const particleHost = document.querySelector('.bg-fx__particles');
  if (particleHost && !prefersReducedMotion) {
    const count = window.innerWidth < 768 ? 14 : 28;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.style.left = Math.random() * 100 + '%';
      span.style.top = Math.random() * 100 + '%';
      span.style.setProperty('--drift-x', (Math.random() * 80 - 40).toFixed(0) + 'px');
      span.style.setProperty('--drift-y', (Math.random() * -120 - 20).toFixed(0) + 'px');
      span.style.animationDuration = 10 + Math.random() * 10 + 's';
      span.style.animationDelay = Math.random() * 8 + 's';
      particleHost.appendChild(span);
    }
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
    } else {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach(function (el, i) {
        el.style.setProperty('--stagger-index', i % 8);
        observer.observe(el);
      });
    }
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-counter'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          if (prefersReducedMotion || isNaN(target)) {
            el.textContent = target + suffix;
            counterObserver.unobserve(el);
            return;
          }
          const duration = 1400;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.35 + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Card tilt (subtle) ---------- */
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(800px) rotateX(' + (py * -6).toFixed(2) + 'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Active timeline step highlight (About page) ---------- */
  const timelineSteps = document.querySelectorAll('.timeline-step');
  if (timelineSteps.length && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-active');
          }
        });
      },
      { threshold: 0.4 }
    );
    timelineSteps.forEach(function (step) {
      timelineObserver.observe(step);
    });
  }
})();
