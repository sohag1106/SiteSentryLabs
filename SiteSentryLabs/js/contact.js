/**
 * SiteSentryLabs — Contact form
 *
 * Frontend validation + a backend-ready fetch() submission.
 *
 * IMPORTANT (see README.md "Connecting the contact form"):
 * This form currently POSTs to '/api/contact'. That endpoint does not exist
 * until you wire up the included Express starter in /server, or point
 * CONTACT_ENDPOINT below at your own backend / form service. No API keys
 * or secrets are ever placed in this file — credentials belong on the
 * server only.
 */
(function () {
  'use strict';

  const CONTACT_ENDPOINT = '/api/contact';

  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusBox = document.getElementById('form-status');

  const validators = {
    fullName: function (value) {
      return value.trim().length >= 2 ? '' : 'Enter your full name.';
    },
    email: function (value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value.trim()) ? '' : 'Enter a valid email address.';
    },
    phone: function (value) {
      if (!value.trim()) return ''; // optional
      const re = /^[+()\d\s-]{7,20}$/;
      return re.test(value.trim()) ? '' : 'Enter a valid phone number.';
    },
    service: function (value) {
      return value ? '' : 'Select a service.';
    },
    message: function (value) {
      return value.trim().length >= 20 ? '' : 'Message must be at least 20 characters.';
    }
  };

  function fieldWrapper(input) {
    return input.closest('.field');
  }

  function showError(input, message) {
    const wrapper = fieldWrapper(input);
    if (!wrapper) return;
    wrapper.classList.toggle('has-error', Boolean(message));
    const errorEl = wrapper.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
  }

  function validateField(input) {
    const validator = validators[input.name];
    if (!validator) return true;
    const message = validator(input.value);
    showError(input, message);
    return !message;
  }

  /* Live validation on blur */
  Object.keys(validators).forEach(function (name) {
    const input = form.elements[name];
    if (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });
    }
  });

  function setStatus(type, message) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.classList.remove('is-success', 'is-error');
    statusBox.classList.add('is-visible', type === 'success' ? 'is-success' : 'is-error');
  }

  function clearStatus() {
    if (!statusBox) return;
    statusBox.classList.remove('is-visible', 'is-success', 'is-error');
    statusBox.textContent = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    let isValid = true;
    Object.keys(validators).forEach(function (name) {
      const input = form.elements[name];
      if (input && !validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      setStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    const payload = {
      fullName: form.elements.fullName.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      company: form.elements.company.value.trim(),
      service: form.elements.service.value,
      message: form.elements.message.value.trim()
    };

    fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Request failed');
        return response.json().catch(function () {
          return {};
        });
      })
      .then(function () {
        setStatus('success', "Thanks — your message has been sent. We'll be in touch shortly.");
        form.reset();
      })
      .catch(function () {
        /* Backend not configured yet in this environment — see README. */
        setStatus(
          'error',
          "We couldn't send your message right now. Please email us directly, or configure the backend described in README.md."
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });
  });
})();
