/**
 * SiteSentryLabs — Editable Client Testimonials
 * Placeholder content only. Replace with verified client information when ready.
 */
window.siteSentryTestimonials = [
  {
    name: 'Reazul Hasan',
    position: 'Founder',
    company: 'Quick Solution Oman',
    image: 'assets/images/testimonial-placeholder.svg',
    rating: 5,
    review: 'Client review placeholder. Replace this text with a verified testimonial from a real client.'
  },
  {
    name: 'Sheikh Niyaz',
    position: 'Founder & Chairman',
    company: 'Niyaz International Group of Companies',
    image: 'assets/images/testimonial-placeholder.svg',
    rating: 5,
    review: 'Client review placeholder. Replace this text with a verified testimonial from a real client.'
  },
  {
    name: 'Dr. Sarah Johnson',
    position: 'Director',
    company: 'HealthSecure Systems',
    image: 'assets/images/testimonial-placeholder.svg',
    rating: 5,
    review: 'Client review placeholder. Replace this text with a verified testimonial from a real client.'
  },
  {
    name: 'Robert Williams',
    position: 'CEO',
    company: 'EduTech Solutions',
    image: 'assets/images/testimonial-placeholder.svg',
    rating: 5,
    review: 'Client review placeholder. Replace this text with a verified testimonial from a real client.'
  }
];

(function renderTestimonials() {
  const track = document.getElementById('testimonial-track');
  const dots = document.getElementById('testimonial-dots');
  if (!track || !dots || !Array.isArray(window.siteSentryTestimonials)) return;

  const testimonials = window.siteSentryTestimonials;
  let current = 0;
  let timer = null;
  let paused = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  track.innerHTML = testimonials.map(function (item) {
    const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
    return `
      <article class="testimonial-card glass" role="group" aria-roledescription="slide">
        <div class="testimonial-card__quote" aria-hidden="true">&ldquo;</div>
        <div class="testimonial-card__rating" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
        <p class="testimonial-card__review">&ldquo;${String(item.review || '')}&rdquo;</p>
        <div class="testimonial-card__client">
          <img src="${String(item.image || '')}" alt="Placeholder profile photo" />
          <div>
            <h3>${String(item.name || 'Client Name')}</h3>
            <p>${String(item.position || 'Job Title')}</p>
            <span>${String(item.company || 'Company Name')}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  dots.innerHTML = testimonials.map(function (_, index) {
    return `<button type="button" class="testimonial-dot${index === 0 ? ' is-active' : ''}" aria-label="Go to testimonial ${index + 1}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`;
  }).join('');

  const slides = Array.from(track.children);
  const prev = document.getElementById('testimonial-prev');
  const next = document.getElementById('testimonial-next');
  const viewport = document.getElementById('testimonial-viewport');

  function getPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 2;
  }

  function render() {
    const perView = getPerView();
    const maxIndex = Math.max(0, slides.length - perView);
    current = Math.min(current, maxIndex);
    const gap = 24;
    const shift = (100 / perView) * current;
    track.style.transform = `translateX(calc(-${shift}% - ${(gap * current) / perView}px))`;
    dots.querySelectorAll('.testimonial-dot').forEach(function (dot, index) {
      const active = index === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function goTo(index) {
    const maxIndex = Math.max(0, slides.length - getPerView());
    current = index > maxIndex ? 0 : index < 0 ? maxIndex : index;
    render();
  }

  function startAutoPlay() {
    clearInterval(timer);
    timer = setInterval(function () {
      if (!paused) goTo(current + 1);
    }, 5500);
  }

  prev.addEventListener('click', function () { goTo(current - 1); });
  next.addEventListener('click', function () { goTo(current + 1); });
  dots.querySelectorAll('.testimonial-dot').forEach(function (dot, index) {
    dot.addEventListener('click', function () { goTo(index); });
  });

  [viewport, prev, next].forEach(function (element) {
    element.addEventListener('mouseenter', function () { paused = true; });
    element.addEventListener('mouseleave', function () { paused = false; });
    element.addEventListener('focusin', function () { paused = true; });
    element.addEventListener('focusout', function () { paused = false; });
  });

  window.addEventListener('resize', render);
  render();
  if (!prefersReducedMotion) startAutoPlay();
})();
