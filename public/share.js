// Share button on the static pages: the device share sheet, or copy the link.
(function () {
  var button = document.getElementById('share-jarito');
  if (!button) return;
  var SITE = 'https://jarito.app';
  var MESSAGE = 'Jarito watches Canvas and Brightspace for moved deadlines. Free, no account.';
  function copy() {
    if (!navigator.clipboard) { button.textContent = 'Share this link: jarito.app'; return; }
    navigator.clipboard.writeText(MESSAGE + ' ' + SITE).then(
      function () { button.textContent = 'Link copied, paste it in your group chat'; },
      function () { button.textContent = 'Share this link: jarito.app'; }
    );
  }
  button.addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({ title: 'Jarito', text: MESSAGE, url: SITE }).catch(function (err) {
        if (!err || err.name !== 'AbortError') copy();
      });
    } else {
      copy();
    }
  });
})();
