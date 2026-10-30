// Final grade calculator: everything happens in the page, nothing is sent.
// course = current × (1 − w) + final × w, so final = (target − current × (1 − w)) / w.
(function () {
  var form = document.getElementById('fg');
  if (!form) return;
  var current = document.getElementById('fg-current');
  var weight = document.getElementById('fg-weight');
  var target = document.getElementById('fg-target');
  var need = document.getElementById('fg-need');
  var sub = document.getElementById('fg-sub');
  var answer = document.getElementById('fg-answer');
  var table = document.getElementById('fg-table');
  var SCORES = [100, 90, 80, 70, 60, 50];

  function num(input) {
    var v = parseFloat(input.value);
    return isFinite(v) ? v : null;
  }
  function pct(v) {
    return (Math.round(v * 10) / 10) + '%';
  }
  function letter(v) {
    return v >= 90 ? 'A' : v >= 80 ? 'B' : v >= 70 ? 'C' : v >= 60 ? 'D' : 'F';
  }
  function say(state, needHtml, subText) {
    answer.className = 'fg-answer' + (state ? ' is-' + state : '');
    need.innerHTML = needHtml;
    sub.textContent = subText;
  }

  function update() {
    var c = num(current), w = num(weight), t = num(target);
    var buttons = form.querySelectorAll('[data-target]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(t !== null && Number(buttons[i].dataset.target) === t));
    }
    table.innerHTML = '';
    if (c === null || w === null || t === null || w <= 0 || w > 100) {
      say('', 'Fill in all three numbers.', 'The final’s weight has to be between 1% and 100%.');
      return;
    }
    var share = w / 100;
    var course = function (f) { return c * (1 - share) + f * share; };
    var needed = (t - c * (1 - share)) / share;

    if (needed <= 0) {
      say('safe', 'You’ve already got it.', 'Even a 0 on the final leaves you at ' + pct(course(0)) + '.');
    } else if (needed > 100) {
      say('out', 'You’d need <strong>' + pct(needed) + '</strong>, more than a perfect score.',
        'A 100 on the final gets you ' + pct(course(100)) + '. Ask your professor about extra credit.');
    } else {
      say('', 'You need <strong>' + pct(needed) + '</strong> on the final.', 'That gets you ' + pct(t) + ' in the course.');
    }

    SCORES.forEach(function (f) {
      var g = course(f);
      var tr = document.createElement('tr');
      if (g >= t) tr.className = 'is-met';
      var a = document.createElement('td');
      a.textContent = f + '%';
      var b = document.createElement('td');
      b.textContent = pct(g) + ' · ' + letter(g);
      tr.appendChild(a);
      tr.appendChild(b);
      table.appendChild(tr);
    });
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-target]');
    if (!b) return;
    target.value = b.dataset.target;
    update();
  });
  update();
})();
