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
// Form submission (Netlify Forms)
//
// Forms are plain HTML forms marked data-netlify="true"; Netlify detects them
// at deploy time and accepts POSTs to their action URL. This script submits
// them in the background so the visitor stays on the page — but it only
// shows the success message on a genuine 2xx response. Anything else (e.g.
// the site being served from a host with no form handling, which answers
// POSTs with 404/405) shows an error that points to phone and email instead,
// so an enquiry is never silently lost. Without JS, the form posts normally
// and lands on its thank-you page.
// ---------------------------------------------------------------
(function () {
  var forms = document.querySelectorAll('form[data-lead-form]');

  forms.forEach(function (form) {
    var statusEl = form.querySelector('.form-status');
    var successEl = form.parentElement.querySelector('.form-success');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : '';

    function showStatus(kind, text) {
      if (!statusEl) return;
      statusEl.className = 'form-status' + (kind ? ' form-status-' + kind : '');
      statusEl.textContent = text;
    }

    function fileTooLarge() {
      var inputs = form.querySelectorAll('input[type="file"][data-max-mb]');
      for (var i = 0; i < inputs.length; i++) {
        var max = parseFloat(inputs[i].getAttribute('data-max-mb')) * 1024 * 1024;
        var file = inputs[i].files && inputs[i].files[0];
        if (file && file.size > max) return inputs[i];
      }
      return null;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showStatus('', '');

      // novalidate turns off the browser's default bubbles on submit, so run
      // the same checks ourselves and show the browser's native messages.
      if (!form.checkValidity()) {
        form.reportValidity();
        var firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var bigFile = fileTooLarge();
      if (bigFile) {
        showStatus('error', 'That file is too large — please attach one under ' +
          bigFile.getAttribute('data-max-mb') + ' MB, or email it instead.');
        bigFile.focus();
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      var data = new FormData(form);
      var hasFile = !!form.querySelector('input[type="file"]');
      var request = hasFile
        // Netlify needs multipart for file uploads; let the browser set the boundary.
        ? { method: 'POST', body: data }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString(),
          };

      fetch(form.getAttribute('action') || '/', request)
        .then(function (res) {
          if (!res.ok) throw new Error('Bad response ' + res.status);
          form.hidden = true;
          if (successEl) {
            successEl.style.display = 'block';
            successEl.setAttribute('tabindex', '-1');
            successEl.focus();
          }
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
          var phone = form.getAttribute('data-fallback-phone');
          var email = form.getAttribute('data-fallback-email');
          showStatus('error', 'Sorry — that did not send. Please ' +
            (email ? 'email ' + email : 'email') + (phone ? ' or call ' + phone : ' or call') +
            ' so your message reaches me.');
        });
    });
  });
})();
