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

// Pre-fill "Where are you thinking?" from ?destination= (links from Journal stories)
(function () {
  var input = document.getElementById('destination');
  if (!input || input.value) return;
  var dest = new URLSearchParams(window.location.search).get('destination');
  if (dest) input.value = dest.slice(0, 80);
})();

// ---------------------------------------------------------------
// Form submission (Netlify Forms)
//
// Forms are plain HTML forms marked data-netlify="true"; Netlify detects them
// at deploy time and accepts AJAX POSTs to "/". This script submits
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

      // Netlify Forms processes AJAX posts sent to "/". The form's action is the
      // thank-you page, which we redirect to only after Netlify confirms receipt.
      var thanksUrl = form.getAttribute('action');

      fetch('/', request)
        .then(function (res) {
          if (!res.ok) throw new Error('Bad response ' + res.status);
          if (thanksUrl) {
            window.location.assign(thanksUrl);
            return;
          }
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

// ---------------------------------------------------------------
// Journal: filter stories by section (all stories show without JS)
// ---------------------------------------------------------------
(function () {
  var bar = document.querySelector('[data-filter-bar]');
  var grid = document.querySelector('[data-filter-grid]');
  if (!bar || !grid) return;
  var count = document.querySelector('[data-filter-count]');
  var cards = grid.querySelectorAll('[data-section]');
  bar.hidden = false;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    var f = btn.getAttribute('data-filter');
    bar.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    var shown = 0;
    cards.forEach(function (c) {
      var match = f === 'all' || c.getAttribute('data-section') === f;
      c.hidden = !match;
      if (match) shown++;
    });
    if (count) count.textContent = shown + (shown === 1 ? ' story' : ' stories');
  });
})();

// ---------------------------------------------------------------
// Journal: share buttons (native share sheet where available, copy link)
// ---------------------------------------------------------------
(function () {
  document.querySelectorAll('[data-share]').forEach(function (box) {
    var url = box.getAttribute('data-url');
    var title = box.getAttribute('data-title');
    var status = box.querySelector('.share-status');
    var native = box.querySelector('[data-share-native]');
    var copy = box.querySelector('[data-share-copy]');
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener('click', function () {
        navigator.share({ title: title, url: url }).catch(function () {});
      });
    }
    if (copy) {
      copy.addEventListener('click', function () {
        var done = function () { if (status) status.textContent = 'Link copied'; };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
        } else {
          window.prompt('Copy this link:', url);
        }
      });
    }
  });
})();

// ---------------------------------------------------------------
// Journal: YouTube videos load only when clicked (faster pages, no
// YouTube cookies until the visitor chooses to watch)
// ---------------------------------------------------------------
(function () {
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.video-facade');
    if (!link) return;
    var fig = link.closest('[data-youtube]');
    if (!fig) return;
    e.preventDefault();
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + fig.getAttribute('data-youtube') + '?autoplay=1';
    iframe.title = link.getAttribute('aria-label') || 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    fig.replaceChild(iframe, link);
  });
})();

// ---------------------------------------------------------------
// Disney page: the Disney Travel Center embed reports its height
// ---------------------------------------------------------------
(function () {
  var frame = document.getElementById('disney-iframe');
  if (!frame) return;
  window.addEventListener('message', function (e) {
    if (!/^https:\/\/([\w-]+\.)*disneytravelcenter\.com$/.test(e.origin)) return;
    if (e.data && e.data.frameHeight) frame.style.height = (e.data.frameHeight + 30) + 'px';
  });
})();
