// Feedback form: posts to /api/feedback, which emails the maintainer.
(function () {
  var form = document.getElementById('feedback');
  if (!form) return;
  var status = document.getElementById('fb-status');
  var button = document.getElementById('fb-send');

  function show(text, kind) {
    status.textContent = text;
    status.className = 'fb-status' + (kind ? ' is-' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v); });
    if (!data.message || data.message.trim().length < 3) {
      show('Write a little about what happened first.', 'error');
      document.getElementById('fb-message').focus();
      return;
    }
    button.disabled = true;
    button.textContent = 'Sending…';
    show('');
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (res) { return res.json().then(function (b) { return { ok: res.ok, body: b }; }); })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          show('Sent. Thank you, this really helps.', 'ok');
        } else {
          show((r.body && r.body.error) || 'Couldn’t send right now. Try again.', 'error');
        }
      })
      .catch(function () { show('Couldn’t send. Check your connection and try again, or email feedback@jarito.app.', 'error'); })
      .then(function () { button.disabled = false; button.textContent = 'Send feedback'; });
  });
})();
