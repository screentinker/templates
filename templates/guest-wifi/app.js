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
   * The words the screen writes itself, in each catalog language. The "locale" param picks the
   * table by its primary subtag (de-CH -> de); empty means the player's own language; anything
   * unknown falls back to English. A non-empty label/text param always wins over these.
   */
  var STRINGS = {
    en: {
      network: 'Network',
      password: 'Password',
      open: 'No password needed',
      hidden: 'Scan the code to join',
      too_long: 'This network name and password are too long for a QR code.',
      no_ssid: 'Add your network name in the template settings to show the code.'
    },
    de: {
      network: 'Netzwerk',
      password: 'Passwort',
      open: 'Kein Passwort nötig',
      hidden: 'Code scannen und verbinden',
      too_long: 'Netzwerkname und Passwort sind zu lang für einen QR-Code.',
      no_ssid: 'Tragen Sie in den Vorlageneinstellungen den Netzwerknamen ein, um den Code anzuzeigen.'
    },
    es: {
      network: 'Red',
      password: 'Contraseña',
      open: 'Sin contraseña',
      hidden: 'Escanea el código para conectarte',
      too_long: 'El nombre de la red y la contraseña son demasiado largos para un código QR.',
      no_ssid: 'Añade el nombre de la red en los ajustes de la plantilla para mostrar el código.'
    },
    fr: {
      network: 'Réseau',
      password: 'Mot de passe',
      open: 'Aucun mot de passe requis',
      hidden: 'Scannez le code pour vous connecter',
      too_long: 'Le nom du réseau et le mot de passe sont trop longs pour un code QR.',
      no_ssid: 'Ajoutez le nom du réseau dans les réglages du modèle pour afficher le code.'
    },
    hi: {
      network: 'नेटवर्क',
      password: 'पासवर्ड',
      open: 'पासवर्ड की ज़रूरत नहीं',
      hidden: 'जुड़ने के लिए कोड स्कैन करें',
      too_long: 'नेटवर्क का नाम और पासवर्ड QR कोड के लिए बहुत लंबे हैं।',
      no_ssid: 'कोड दिखाने के लिए टेम्पलेट सेटिंग में नेटवर्क का नाम जोड़ें।'
    },
    it: {
      network: 'Rete',
      password: 'Password',
      open: 'Nessuna password richiesta',
      hidden: 'Inquadra il codice per connetterti',
      too_long: 'Il nome della rete e la password sono troppo lunghi per un codice QR.',
      no_ssid: 'Aggiungi il nome della rete nelle impostazioni del modello per mostrare il codice.'
    },
    ja: {
      network: 'ネットワーク',
      password: 'パスワード',
      open: 'パスワード不要',
      hidden: 'コードを読み取って接続',
      too_long: 'ネットワーク名とパスワードが長すぎるため、QR コードにできません。',
      no_ssid: 'コードを表示するには、テンプレート設定でネットワーク名を入力してください。'
    },
    nl: {
      network: 'Netwerk',
      password: 'Wachtwoord',
      open: 'Geen wachtwoord nodig',
      hidden: 'Scan de code om te verbinden',
      too_long: 'De netwerknaam en het wachtwoord zijn te lang voor een QR-code.',
      no_ssid: 'Vul de netwerknaam in bij de sjablooninstellingen om de code te tonen.'
    },
    pt: {
      network: 'Rede',
      password: 'Senha',
      open: 'Não precisa de senha',
      hidden: 'Escaneie o código para entrar',
      too_long: 'O nome da rede e a senha são longos demais para um QR code.',
      no_ssid: 'Adicione o nome da rede nas configurações do modelo para mostrar o código.'
    },
    zh: {
      network: '网络',
      password: '密码',
      open: '无需密码',
      hidden: '扫码即可连接',
      too_long: '网络名称和密码太长，无法生成二维码。',
      no_ssid: '请在模板设置中填写网络名称以显示二维码。'
    }
  };

  /* The template's language: the "locale" param, else the player's, as a canonical BCP-47 tag. */
  function resolveLocale(raw) {
    var l = String(raw == null ? '' : raw).trim();
    if (!l && typeof navigator !== 'undefined') l = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    try { l = Intl.getCanonicalLocales(l || 'en')[0] || 'en'; } catch (e) { l = 'en'; }
    return l;
  }

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
    var locale = resolveLocale(v.locale);
    var T = STRINGS[locale.split('-')[0].toLowerCase()] || STRINGS.en;
    root.lang = locale;
    // Colours are validated as #hex by the server before they get here.
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);

    function str(x) { return String(x == null ? '' : x).trim(); }
    // Operator text: its own direction (dir="auto"), so a right-to-left name still reads right.
    function text(id, value) {
      var e = document.getElementById(id);
      e.textContent = str(value);
      e.setAttribute('dir', 'auto');
    }
    text('eyebrow', v.eyebrow);
    text('headline', v.headline);
    text('footer', v.footer);
    text('hint', v.hint);
    text('ssid-label', str(v.ssid_label) || T.network);
    text('pw-label', str(v.password_label) || T.password);
    if (!String(v.hint || '').trim()) body.classList.add('no-hint');

    var logo = document.getElementById('logo');
    if (v.logo) logo.src = v.logo; else body.classList.add('no-logo');

    var ssid = String(v.ssid || '').trim();
    var password = String(v.password || '');
    var security = v.security || 'WPA';
    var open = security === 'nopass';

    var ssidEl = document.getElementById('ssid');
    ssidEl.textContent = ssid || '—';
    ssidEl.setAttribute('dir', 'auto');

    var pwEl = document.getElementById('password');
    if (open) {
      pwEl.textContent = str(v.open_text) || T.open;
      pwEl.classList.add('muted');
    } else if (v.show_password === false) {
      pwEl.textContent = str(v.hidden_text) || T.hidden;
      pwEl.classList.add('muted');
    } else {
      pwEl.textContent = password || '—';
      pwEl.setAttribute('dir', 'ltr');
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
      box.textContent = ssid ? T.too_long : T.no_ssid;
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
