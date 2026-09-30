/*
 * Guest Wi-Fi — ScreenTinker community template. MIT.
 *
 * Builds the standard join-a-network QR payload from the operator's values and draws it with
 * qr.js (bundled, no network). Everything comes from window.ST; values are written with textContent
 * and the code is built with createElementNS, never innerHTML.
 */
(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';

  /*
   * The Wi-Fi QR format (WIFI:T:…;S:…;P:…;;) uses ; : , as separators and " \ for quoting, so those
   * five characters inside a network name or password must each be preceded by a backslash. An
   * unescaped ";" in a password silently truncates it on the guest's phone — the code still scans,
   * and the join fails with "wrong password". This is why the template is HTML and not a slide.
   */
  function wifiEscape(s) {
    return String(s).replace(/([\\;,:"])/g, '\\$1');
  }
  function wifiPayload(ssid, password, security, hidden) {
    var t = security === 'WEP' || security === 'nopass' ? security : 'WPA';
    var out = 'WIFI:T:' + t + ';S:' + wifiEscape(ssid) + ';';
    if (t !== 'nopass' && password) out += 'P:' + wifiEscape(password) + ';';
    if (hidden) out += 'H:true;';
    return out + ';';
  }

  /* One <path>, one sub-path per horizontal run of dark modules, inside a 4-module quiet zone. */
  function qrSvg(sym, dark) {
    var q = 4, n = sym.size + q * 2, d = [];
    for (var y = 0; y < sym.size; y++) {
      for (var x = 0; x < sym.size; x++) {
        if (!sym.get(x, y)) continue;
        var run = 1;
        while (sym.get(x + run, y)) run++;
        d.push('M' + (x + q) + ' ' + (y + q) + 'h' + run + 'v1h-' + run + 'z');
        x += run - 1;
      }
    }
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 ' + n + ' ' + n);
    s.setAttribute('shape-rendering', 'crispEdges');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d.join(''));
    p.setAttribute('fill', dark);
    s.appendChild(p);
    return s;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    // Colours are validated as #hex by the server before they get here.
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);

    function text(id, value) { document.getElementById(id).textContent = String(value == null ? '' : value).trim(); }
    text('eyebrow', v.eyebrow);
    text('headline', v.headline);
    text('footer', v.footer);
    text('hint', v.hint);
    text('ssid-label', v.ssid_label || 'Network');
    text('pw-label', v.password_label || 'Password');
    if (!String(v.hint || '').trim()) body.classList.add('no-hint');

    var logo = document.getElementById('logo');
    if (v.logo) logo.src = v.logo; else body.classList.add('no-logo');

    var ssid = String(v.ssid || '').trim();
    var password = String(v.password || '');
    var security = v.security || 'WPA';
    var open = security === 'nopass';

    var ssidEl = document.getElementById('ssid');
    ssidEl.textContent = ssid || '—';

    var pwEl = document.getElementById('password');
    if (open) {
      pwEl.textContent = String(v.open_text || '').trim() || 'No password needed';
      pwEl.classList.add('muted');
    } else if (v.show_password === false) {
      pwEl.textContent = String(v.hidden_text || '').trim() || 'Scan the code to join';
      pwEl.classList.add('muted');
    } else {
      pwEl.textContent = password || '—';
    }

    // A long name and password cannot both sit on one line of a thin strip at full size.
    if (ssidEl.textContent.length + pwEl.textContent.length > 34) body.classList.add('long-creds');

    var box = document.getElementById('qr');
    var sym = ssid ? QRMini.encode(wifiPayload(ssid, password, security, v.hidden === true), 'M') : null;
    if (sym) {
      box.appendChild(qrSvg(sym, '#0F1419'));
    } else {
      // Never a broken-looking code: an honest placeholder the operator will notice.
      box.classList.add('empty');
      box.textContent = ssid ? 'This network name and password are too long for a QR code.' : 'Add your network name in the template settings to show the code.';
    }

    function layout() {
      var r = (window.innerWidth || 1) / (window.innerHeight || 1);
      var mode = r > 3.2 ? 'm-strip' : r < 0.85 ? 'm-port' : 'm-land';
      ['m-strip', 'm-port', 'm-land'].forEach(function (c) { body.classList.toggle(c, c === mode); });
    }
    layout();
    window.addEventListener('resize', layout);
  });
})();
