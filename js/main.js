/* Voyage By Luna — site scripts. No dependencies, no frameworks. */

// ---------------------------------------------------------------
// Mobile navigation
// ---------------------------------------------------------------
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-locked', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(!nav.classList.contains('open'));
  });

  // Close on Escape, and on any nav link tap
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
})();

// ---------------------------------------------------------------
// Header shadow once scrolled
// ---------------------------------------------------------------
(function () {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ---------------------------------------------------------------
// Pre-select trip type from ?trip= (links from the Services page)
// ---------------------------------------------------------------
(function () {
  var select = document.getElementById('trip-type');
  if (!select) return;
  var trip = new URLSearchParams(window.location.search).get('trip');
  if (!trip) return;
  var option = select.querySelector('option[value="' + CSS.escape(trip) + '"]');
  if (option) select.value = trip;
})();

// ---------------------------------------------------------------
// Form submission
//
// IMPORTANT: this site is hosted on GitHub Pages, which is static hosting
// with no server-side code. Forms must POST to an external form service.
// The action attribute is rendered from site.form_endpoint; if that has
// not been configured yet we do NOT fake a success message — we tell the
// visitor to call or email instead, so no enquiry is ever silently lost.
// ---------------------------------------------------------------
(function () {
  var forms = document.querySelectorAll('form[data-lead-form]');

  forms.forEach(function (form) {
    var endpoint = form.getAttribute('action') || '';
    var statusEl = form.parentElement.querySelector('.form-status');
    var successEl = form.parentElement.querySelector('.form-success');
    var submitBtn = form.querySelector('button[type="submit"]');

    var configured = endpoint.indexOf('REPLACE_WITH') === -1 && /^https?:\/\//.test(endpoint);

    if (!configured) {
      // Fail loudly and helpfully rather than silently swallowing a lead.
      form.setAttribute('data-unconfigured', 'true');
      if (statusEl) {
        statusEl.className = 'form-status form-status-warn';
        statusEl.textContent =
          'This form is not connected yet. Please call or email instead — both are listed above.';
      }
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (statusEl) { statusEl.textContent = ''; statusEl.className = 'form-status'; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          // Only celebrate on a real success response from the form service.
          if (!res.ok) throw new Error('Bad response ' + res.status);
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
          if (successEl) successEl.setAttribute('tabindex', '-1');
          if (successEl) successEl.focus();
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send My Trip Details'; }
          if (statusEl) {
            statusEl.className = 'form-status form-status-error';
            statusEl.textContent =
              'Sorry — that did not send. Please call or email instead so your message reaches me.';
          }
        });
    });
  });
})();
