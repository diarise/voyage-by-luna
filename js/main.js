// Mobile nav toggle
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
})();

// Pre-select trip type on the contact form based on ?trip= query param
// (used by links like /contact/?trip=cruises coming from the Services page)
(function () {
  var select = document.getElementById('trip-type');
  if (!select) return;
  var params = new URLSearchParams(window.location.search);
  var trip = params.get('trip');
  if (trip) {
    var option = select.querySelector('option[value="' + trip + '"]');
    if (option) select.value = trip;
  }
})();

// Submit forms to Netlify without leaving the page, and show a friendly
// success message instead of a blank redirect.
(function () {
  function encode(data) {
    return Object.keys(data)
      .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]); })
      .join('&');
  }

  document.querySelectorAll('form[data-netlify="true"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload),
      })
        .then(function () {
          form.style.display = 'none';
          var success = form.parentElement.querySelector('.form-success');
          if (success) {
            success.style.display = 'block';
          } else {
            form.insertAdjacentHTML(
              'afterend',
              '<div class="form-success" style="display:block"><h2>Thank you!</h2><p>Your details are on their way. I will follow up shortly.</p></div>'
            );
          }
        })
        .catch(function () {
          alert('Something went wrong sending the form. Please email or call us directly.');
        });
    });
  });
})();
