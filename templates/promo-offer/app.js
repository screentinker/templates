/*
 * Promo offer — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. Formats prices with Intl.NumberFormat in the chosen language and currency,
 * works out the saving from the price and the was price, and counts down to the end of the offer in
 * the chosen timezone. At the end it shows the "ended" message, or swaps the whole promo for the
 * fallback line. The QR code is drawn on the screen by qr.js. Nothing is fetched; values are written
 * with textContent only.
 */
(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';

  /* ---------- the words the template writes itself, picked by the language's primary subtag ----------
     A wording setting that is filled in always wins; an empty one uses these. {saving} and {date} are
     filled in by the code. The unit names come in a "one" and an "other" form (Intl.PluralRules). */
  var STRINGS = {
    en: {
      ends_in: 'Ends in',
      offer_ends: 'Offer ends {date}',
      save: 'Save {saving}',
      ended: 'This offer has ended',
      scan: 'Scan to shop',
      day_one: 'day', day_other: 'days',
      hour_one: 'hour', hour_other: 'hours',
      minute_one: 'minute', minute_other: 'minutes',
      second_one: 'second', second_other: 'seconds'
    },
    de: {
      ends_in: 'Endet in',
      offer_ends: 'Gültig bis {date}',
      save: 'Spare {saving}',
      ended: 'Dieses Angebot ist beendet',
      scan: 'Scannen & shoppen',
      day_one: 'Tag', day_other: 'Tage',
      hour_one: 'Stunde', hour_other: 'Stunden',
      minute_one: 'Minute', minute_other: 'Minuten',
      second_one: 'Sekunde', second_other: 'Sekunden'
    },
    es: {
      ends_in: 'Termina en',
      offer_ends: 'Válido hasta el {date}',
      save: 'Ahorra {saving}',
      ended: 'Esta oferta ha terminado',
      scan: 'Escanea y compra',
      day_one: 'día', day_other: 'días',
      hour_one: 'hora', hour_other: 'horas',
      minute_one: 'minuto', minute_other: 'minutos',
      second_one: 'segundo', second_other: 'segundos'
    },
    fr: {
      ends_in: 'Fin dans',
      offer_ends: 'Valable jusqu’au {date}',
      save: 'Remise {saving}',
      ended: 'Cette offre est terminée',
      scan: 'Scannez pour acheter',
      day_one: 'jour', day_other: 'jours',
      hour_one: 'heure', hour_other: 'heures',
      minute_one: 'minute', minute_other: 'minutes',
      second_one: 'seconde', second_other: 'secondes'
    },
    hi: {
      ends_in: 'समाप्त होने में',
      offer_ends: '{date} तक मान्य',
      save: '{saving} की बचत',
      ended: 'यह ऑफ़र समाप्त हो गया है',
      scan: 'स्कैन करें, खरीदें',
      day_one: 'दिन', day_other: 'दिन',
      hour_one: 'घंटा', hour_other: 'घंटे',
      minute_one: 'मिनट', minute_other: 'मिनट',
      second_one: 'सेकंड', second_other: 'सेकंड'
    },
    it: {
      ends_in: 'Termina tra',
      offer_ends: 'Valida fino a {date}',
      save: 'Risparmi {saving}',
      ended: 'Questa offerta è terminata',
      scan: 'Scansiona e acquista',
      day_one: 'giorno', day_other: 'giorni',
      hour_one: 'ora', hour_other: 'ore',
      minute_one: 'minuto', minute_other: 'minuti',
      second_one: 'secondo', second_other: 'secondi'
    },
    ja: {
      ends_in: '終了まで',
      offer_ends: '{date}まで',
      save: '{saving}オフ',
      ended: 'このセールは終了しました',
      scan: 'スキャンして購入',
      day_one: '日', day_other: '日',
      hour_one: '時間', hour_other: '時間',
      minute_one: '分', minute_other: '分',
      second_one: '秒', second_other: '秒'
    },
    nl: {
      ends_in: 'Eindigt over',
      offer_ends: 'Geldig t/m {date}',
      save: 'Bespaar {saving}',
      ended: 'Deze actie is afgelopen',
      scan: 'Scan en shop',
      day_one: 'dag', day_other: 'dagen',
      hour_one: 'uur', hour_other: 'uur',
      minute_one: 'minuut', minute_other: 'minuten',
      second_one: 'seconde', second_other: 'seconden'
    },
    pt: {
      ends_in: 'Termina em',
      offer_ends: 'Válido até {date}',
      save: 'Economize {saving}',
      ended: 'Esta oferta terminou',
      scan: 'Escaneie e compre',
      day_one: 'dia', day_other: 'dias',
      hour_one: 'hora', hour_other: 'horas',
      minute_one: 'minuto', minute_other: 'minutos',
      second_one: 'segundo', second_other: 'segundos'
    },
    zh: {
      ends_in: '距结束',
      offer_ends: '截至{date}',
      save: '立省{saving}',
      ended: '本优惠已结束',
      scan: '扫码购买',
      day_one: '天', day_other: '天',
      hour_one: '小时', hour_other: '小时',
      minute_one: '分钟', minute_other: '分钟',
      second_one: '秒', second_other: '秒'
    }
  };
  function stringsFor(tag) {
    var lang = String(tag || '').toLowerCase().split(/[-_]/)[0];
    var t = STRINGS[lang] || STRINGS.en, out = {};
    for (var k in STRINGS.en) out[k] = t[k] || STRINGS.en[k];
    return out;
  }

  function str(x) { return x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- colours (custom palette) ---------- */
  function rgb(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(c, f) { return 'rgb(' + Math.round(c[0] * f) + ',' + Math.round(c[1] * f) + ',' + Math.round(c[2] * f) + ')'; }
  function luminance(c) {
    function ch(x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function applyCustomColors(v) {
    var bg = rgb(v.background), ink = rgb(v.text_color), acc = rgb(v.accent);
    if (!bg || !ink || !acc) return;
    var s = document.body.style;
    var dark = luminance(bg) < 0.4;
    s.setProperty('--bg', v.background);
    s.setProperty('--bg2', shade(bg, dark ? 0.62 : 0.9));
    s.setProperty('--ink', v.text_color);
    s.setProperty('--muted', rgba(ink, 0.78));
    s.setProperty('--line', rgba(ink, 0.2));
    s.setProperty('--accent', v.accent);
    s.setProperty('--badge-bg', v.accent);
    s.setProperty('--badge-ink', luminance(acc) > 0.45 ? '#141414' : '#FFFFFF');
    s.setProperty('--tile-bg', dark ? 'rgba(0,0,0,.24)' : rgba(ink, 0.07));
    s.setProperty('--tile-ink', v.text_color);
    s.setProperty('--tile-line', rgba(ink, 0.14));
    s.setProperty('--disc', rgba(ink, 0.08));
    s.setProperty('--disc-line', rgba(ink, 0.14));
    s.setProperty('--eyebrow-bg', 'transparent');
    s.setProperty('--eyebrow-ink', v.accent);
    document.body.classList.add('custom');
  }

  /* ---------- time ---------- */
  function makeDateFmt(locale, tz, opts) {
    var o = {};
    for (var k in opts) o[k] = opts[k];
    if (tz) o.timeZone = tz;
    try { return new Intl.DateTimeFormat(locale, o); }
    catch (e) {
      delete o.timeZone;
      try { return new Intl.DateTimeFormat(locale, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, opts); }
    }
  }
  // Wall-clock fields of an instant in a timezone.
  function partsIn(fmt, t) {
    var out = {};
    fmt.formatToParts(new Date(t)).forEach(function (p) { out[p.type] = p.value; });
    var h = Number(out.hour) % 24;
    return { y: Number(out.year), mo: Number(out.month), d: Number(out.day), h: h, mi: Number(out.minute), s: Number(out.second) };
  }
  // The instant at which the clock in `tz` reads the given wall time. No tz: the screen's own clock.
  function zonedToEpoch(y, mo, d, h, mi, s, tzFmt) {
    if (!tzFmt) return new Date(y, mo - 1, d, h, mi, s).getTime();
    var guess = Date.UTC(y, mo - 1, d, h, mi, s);
    function offsetAt(t) {
      var p = partsIn(tzFmt, t);
      return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(t / 1000) * 1000;
    }
    // The two offsets in force a day either side; one of them (or both, in a repeated hour) gives
    // the wall time asked for. Neither does in a DST gap (02:30 on a spring-forward night): take the
    // later instant, so the offer runs to just after the gap rather than ending an hour early.
    function wallAt(t) { var p = partsIn(tzFmt, t); return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s); }
    var a = guess - offsetAt(guess - 86400000), b = guess - offsetAt(guess + 86400000);
    var lo = Math.min(a, b), hi = Math.max(a, b);
    if (wallAt(lo) === guess) return lo;
    if (wallAt(hi) === guess) return hi;
    return hi;
  }
  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
  // The end of the offer as epoch ms; NaN when the text is not a date. Empty: midnight tonight.
  function parseEnd(text, tzFmt, now) {
    if (!text) {
      var p = tzFmt ? partsIn(tzFmt, now) : null;
      if (!p) { var n = new Date(now); p = { y: n.getFullYear(), mo: n.getMonth() + 1, d: n.getDate() }; }
      return zonedToEpoch(p.y, p.mo, p.d + 1, 0, 0, 0, tzFmt);
    }
    var m = ISO_RE.exec(text);
    if (!m) return NaN;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return NaN;   // no 31 February
    if (m[4] === undefined) return zonedToEpoch(y, mo, d + 1, 0, 0, 0, tzFmt);   // a date alone: to the end of that day
    var h = +m[4], mi = +m[5], s = m[6] ? +m[6] : 0;
    if (h > 24 || mi > 59 || s > 59 || (h === 24 && (mi || s))) return NaN;
    if (m[7]) {
      var off = 0;
      if (m[7].toUpperCase() !== 'Z') {
        var z = m[7].replace(':', '');
        off = (z.charAt(0) === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5)));
      }
      return Date.UTC(y, mo - 1, d, h, mi, s) - off * 60000;
    }
    return zonedToEpoch(y, mo, d, h, mi, s, tzFmt);
  }

  /* ---------- the QR code: one <path>, one sub-path per run of dark modules, 4-module quiet zone ---------- */
  function qrSvg(sym) {
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
    p.setAttribute('fill', '#141414');
    s.appendChild(p);
    return s;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var body = document.body;
    var root = document.documentElement;
    var style = { bold: 1, minimal: 1, cafe: 1 }[v.style] ? v.style : 'bold';
    body.setAttribute('data-style', style);
    if (v.custom_colors === true) applyCustomColors(v);

    var locale = str(v.locale) || undefined;
    var tz = str(v.timezone) || undefined;
    if (tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch (e) { tz = undefined; } }   // unknown zone: the screen's clock
    if (locale) { try { new Intl.NumberFormat(locale); } catch (e) { locale = undefined; } }   // not a tag Intl knows: the screen's language
    // The language of the page: the setting, else the screen's. It picks the built-in words, and the
    // lang attribute gives the browser the right hyphenation and CJK line breaking.
    var lang = locale || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    try { root.lang = Intl.getCanonicalLocales(lang)[0]; } catch (e) { root.lang = 'en'; }
    var T = stringsFor(lang);
    // A wording setting: empty uses the built-in words, a single "-" hides the line.
    function wording(x, builtIn) { var s = str(x); return s === '-' ? '' : (s || builtIn); }

    $('eyebrow').textContent = str(v.eyebrow);
    $('headline').textContent = str(v.headline);
    $('offer').textContent = str(v.offer);
    $('fine').textContent = str(v.fine_print);
    $('countdown-label').textContent = wording(v.countdown_label, T.ends_in);
    var endedText = str(v.ended_text) || T.ended;
    $('ended').textContent = endedText;
    var fbHead = str(v.fallback_heading);
    $('fallback-eyebrow').textContent = fbHead;
    $('fallback-eyebrow').hidden = !fbHead;
    $('fallback-text').textContent = str(v.fallback_text) || endedText;

    /* ---------- prices ---------- */
    var currency = str(v.currency).toUpperCase();
    var always = v.decimals === 'always';
    function toNumber(s) {
      // "89", "89.99", "$89", "89,99 €", "1,299" — a single number with an optional sign around it.
      if (!/^[^\d\-]{0,4}-?[\d.,\s]*\d[^\d]{0,4}$/.test(s)) return null;
      var n = s.replace(/[^\d.,\-]/g, '');
      if (/,\d{1,2}$/.test(n) && n.indexOf('.') === -1) n = n.replace(',', '.');
      else n = n.replace(/,/g, '');
      var f = parseFloat(n);
      return isFinite(f) && f >= 0 ? f : null;
    }
    function numberFmt(n, extra) {
      var whole = Math.round(n * 100) % 100 === 0;
      var o = {};
      if (currency) { o.style = 'currency'; o.currency = currency; }
      if (!always && whole) { o.minimumFractionDigits = 0; o.maximumFractionDigits = 0; }
      else if (!currency) { o.minimumFractionDigits = 2; o.maximumFractionDigits = 2; }
      for (var k in extra) o[k] = extra[k];
      try { return new Intl.NumberFormat(locale, o); }
      catch (e) {
        delete o.style; delete o.currency;
        try { return new Intl.NumberFormat(locale, o); } catch (e2) { return new Intl.NumberFormat(); }
      }
    }
    function plain(n) { return numberFmt(n).format(n); }
    // The price in parts, so the symbol and the cents can be set smaller than the units.
    function renderPrice(box, n) {
      box.textContent = '';
      var parts;
      try { parts = numberFmt(n).formatToParts(n); } catch (e) { parts = [{ type: 'integer', value: plain(n) }]; }
      var frac = null;
      parts.forEach(function (p) {
        if (p.type === 'currency') box.appendChild(el('span', 'cur', p.value));
        else if (p.type === 'decimal') { frac = box.appendChild(el('span', 'frac')); frac.appendChild(el('span', 'dec', p.value)); }
        else if (p.type === 'fraction') (frac || box.appendChild(el('span', 'frac'))).appendChild(document.createTextNode(p.value));
        else if (p.type === 'literal' && /^\s+$/.test(p.value)) box.appendChild(document.createTextNode(' '));
        else box.appendChild(document.createTextNode(p.value));
      });
    }

    var priceText = str(v.price), wasText = str(v.was_price);
    var priceN = priceText ? toNumber(priceText) : null;
    var wasN = wasText ? toNumber(wasText) : null;
    var priceEl = $('price'), wasEl = $('was');
    if (priceN !== null) renderPrice(priceEl, priceN);
    else if (priceText) { priceEl.textContent = priceText; priceEl.classList.add('text'); }
    if (wasN !== null) wasEl.textContent = plain(wasN);
    else wasEl.textContent = wasText;
    if (!priceText && !wasText) $('price-row').hidden = true;

    // The saving badge.
    var badgeMode = v.saving || 'percent';
    var saving = '';
    if (badgeMode !== 'off' && priceN !== null && wasN !== null && wasN > priceN && wasN > 0) {
      if (badgeMode === 'amount') saving = plain(Math.round((wasN - priceN) * 100) / 100);
      else {
        var pct = Math.floor((wasN - priceN) / wasN * 100) / 100;   // never round a saving up
        try { saving = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(pct); }
        catch (e) { saving = Math.round(pct * 100) + '%'; }
      }
    }
    if (saving) {
      var badgeWords = wording(v.saving_text, T.save) || '{saving}';
      $('badge-text').textContent = badgeWords.indexOf('{saving}') >= 0 ? badgeWords.split('{saving}').join(saving) : badgeWords + ' ' + saving;
      $('badge').hidden = false;
    }

    /* ---------- image and QR ---------- */
    var img = $('image');
    if (v.image) { img.src = v.image; img.hidden = false; } else body.classList.add('no-image');
    var url = str(v.qr_url);
    var sym = url && window.QRMini ? QRMini.encode(url, 'M') : null;
    if (sym) {
      $('qr').appendChild(qrSvg(sym));
      $('qr-label').textContent = wording(v.qr_label, T.scan);
      $('qr-card').hidden = false;
    }
    if (!v.image && !sym && !saving) body.classList.add('no-visual');

    /* ---------- countdown ---------- */
    var clock = v.clock_format || 'auto';
    var tzFmt = tz ? makeDateFmt('en-US', tz, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }) : null;
    var endOpts = { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' };
    if (clock === '24') { endOpts.hour = '2-digit'; endOpts.hourCycle = 'h23'; }
    if (clock === '12') endOpts.hour12 = true;
    var endFmt = makeDateFmt(locale, tz, endOpts);
    var pad = (function () {
      try { var f = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }); return function (n) { return f.format(n); }; }
      catch (e) { return function (n) { return n < 10 ? '0' + n : String(n); }; }
    })();
    // The unit names under the tiles, from the strings table in the "one" or "other" form.
    var plural = null;
    try { if (window.Intl && Intl.PluralRules) plural = new Intl.PluralRules(lang); } catch (e) { plural = null; }
    function unitLabel(unit, n) {
      var form = plural ? plural.select(n) : (n === 1 ? 'one' : 'other');
      return T[unit + '_' + (form === 'one' ? 'one' : 'other')];
    }

    var endsRaw = str(v.ends_at);
    var rolling = !endsRaw;
    var end = parseEnd(endsRaw, tzFmt, Date.now());
    var showCountdown = v.show_countdown !== false;
    var tiles = $('tiles');
    var tileNodes = null, tileKey = '';
    var state = '';
    if (!isFinite(end)) {
      // Not a date we understand: no countdown, never "ended".
      if (window.console && console.warn) console.warn('promo-offer: "Offer ends" is not a date this template can read (use 2026-11-29T23:59): ' + endsRaw);
      $('timer').hidden = true;
      $('end-date').hidden = true;
    } else {
      if (!showCountdown) { tiles.hidden = true; $('countdown-label').hidden = true; }
    }

    function setEndDate() {
      if (!isFinite(end) || v.show_end_date === false) return;
      var label = str(v.end_date_label);
      if (label === '-') label = '';
      // An end at exactly midnight (a date alone, the daily default, or a typed 00:00/24:00) reads as
      // 23:59 of the last day; any other end time is shown as given.
      var w = tzFmt ? partsIn(tzFmt, end) : (function (n) { return { h: n.getHours(), mi: n.getMinutes(), s: n.getSeconds() }; })(new Date(end));
      var midnight = w.h === 0 && w.mi === 0 && w.s === 0;
      var when = endFmt.format(new Date(midnight ? end - 1000 : end));
      // Your own wording goes before the date; the built-in one is a whole phrase ("{date}まで").
      $('end-date').textContent = label ? label + ' ' + when : (str(v.end_date_label) === '-' ? when : T.offer_ends.split('{date}').join(when));
    }

    function drawTiles(ms) {
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      var units = d > 0 ? [['day', d], ['hour', h], ['minute', m], ['second', sec]] : [['hour', h], ['minute', m], ['second', sec]];
      var key = units.map(function (u) { return u[0]; }).join();
      if (key !== tileKey) {
        tileKey = key;
        tiles.textContent = '';
        tileNodes = units.map(function () {
          var t = tiles.appendChild(el('div', 'tile'));
          return { n: t.appendChild(el('span', 'n')), l: t.appendChild(el('span', 'l')) };
        });
      }
      units.forEach(function (u, i) {
        var n = u[0] === 'day' ? String(u[1]) : pad(u[1]);
        if (u[0] === 'day') { try { n = new Intl.NumberFormat(locale).format(u[1]); } catch (e) { /* keep */ } }
        if (tileNodes[i].n.textContent !== n) tileNodes[i].n.textContent = n;
        var l = unitLabel(u[0], u[1]);
        if (tileNodes[i].l.textContent !== l) tileNodes[i].l.textContent = l;
      });
    }

    function setState(next) {
      if (next === state) return;
      state = next;
      var ended = next === 'ended';
      var fallback = ended && v.after_end === 'fallback';
      body.classList.toggle('fallback-on', fallback);
      $('fallback').hidden = !fallback;
      $('ended').hidden = !ended;
      $('timer').hidden = !isFinite(end) || (!ended && !showCountdown);
      tiles.hidden = ended || !showCountdown;
      $('countdown-label').hidden = ended || !showCountdown;
      $('end-date').hidden = ended || !isFinite(end);
      $('price-row').classList.toggle('ended', ended);
      if (saving) $('badge').hidden = ended;
      layout();
    }

    var timer = null;
    function tick() {
      timer = null;
      var now = Date.now();
      if (rolling && now >= end) end = parseEnd('', tzFmt, now);   // a daily offer: on to tomorrow's midnight
      if (isFinite(end)) {
        var left = end - now;
        if (left > 0) {
          setState('running');
          if (showCountdown) drawTiles(left);
        } else setState('ended');
        setEndDate();
      } else setState('running');
      // Wake on the next second while counting; once a minute otherwise (cheap, and survives a clock change).
      var wait = state === 'running' && isFinite(end) && showCountdown ? 1000 - (now % 1000) + 5 : 60000 - (now % 60000) + 5;
      if (state === 'running' && isFinite(end) && !showCountdown) wait = Math.min(wait, Math.max(50, end - now + 5));
      timer = setTimeout(tick, wait);
    }

    /* ---------- fitting ---------- */
    var copy = $('copy');
    var headline = $('headline');
    function shape() {
      var W = window.innerWidth, H = window.innerHeight;
      body.classList.toggle('strip', W / H > 3.2);
      body.classList.toggle('portrait', H > W * 1.05);
      body.classList.remove('tight', 'tighter');
    }
    function overflowing(e) { return e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1; }
    function lineCount(e) {
      var lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(e.style.fontSize) * 1.0;
      return Math.round(e.offsetHeight / lh);
    }
    var qrCard = $('qr-card');
    function layout() {
      shape();
      // Portrait: the QR code sits beside the price and countdown; otherwise on the picture side.
      var qrHome = body.classList.contains('portrait') ? $('deal') : $('visual');
      if (qrCard.parentNode !== qrHome) qrHome.appendChild(qrCard);
      headline.style.fontSize = '';
      root.style.setProperty('--k', '1');
      if (body.classList.contains('strip')) {
        // Too little room for the whole headline: drop the countdown label, then the small heading.
        // scrollWidth is a whole number, so a line a fraction of a pixel too long (which still gets its
        // "…") would pass; measure the text itself as well.
        var textWider = function () {
          if (!document.createRange) return false;
          var r = document.createRange();
          r.selectNodeContents(headline);
          return r.getBoundingClientRect().width > headline.getBoundingClientRect().width + 0.25;
        };
        var cramped = function () { return headline.scrollWidth > headline.clientWidth + 1 || textWider() || copy.scrollWidth > copy.clientWidth + 1; };
        if (cramped()) body.classList.add('tight');
        if (cramped()) body.classList.add('tighter');
        return;
      }
      // The headline: as big as the style wants, down to 55%, until it takes at most three lines
      // (four in a text-only portrait) and no single word is wider than the column.
      var maxLines = body.classList.contains('portrait') && body.classList.contains('no-visual') ? 4 : 3;
      var base = parseFloat(getComputedStyle(headline).fontSize);
      var size = base;
      // Measure with words kept whole: break-word (the CSS safety net for one absurd word) would
      // otherwise hide a word that is wider than the column from scrollWidth.
      headline.style.overflowWrap = 'normal';
      for (var i = 0; i < 20; i++) {
        if (headline.scrollWidth <= headline.clientWidth + 1 && lineCount(headline) <= maxLines) break;
        size *= 0.94;
        if (size < base * 0.55) { size = base * 0.55; headline.style.fontSize = size + 'px'; break; }
        headline.style.fontSize = size + 'px';
      }
      headline.style.overflowWrap = '';
      // Then the whole column: everything shrinks together until it fits (long offers, big prices).
      var k = 1;
      while (overflowing(copy) && k > 0.6) {
        k -= 0.04;
        root.style.setProperty('--k', k.toFixed(2));
        if (headline.style.fontSize) headline.style.fontSize = (size * k) + 'px';
      }
      fitBadge();
    }

    // The fixed-size badges (the round ones, and the minimal square in portrait): longer words
    // ("Economize", "Bespaar") shrink the type until every word and line fits inside the shape. The
    // minimal style's landscape pill grows with its text instead.
    function fitBadge() {
      var badge = $('badge'), span = $('badge-text');
      span.style.fontSize = '';
      if (badge.hidden || !badge.clientWidth) return;
      if (style === 'minimal' && !body.classList.contains('portrait')) return;
      var bs = getComputedStyle(badge);
      var room = badge.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight);
      var size = parseFloat(getComputedStyle(span).fontSize), min = size * 0.5;
      for (var i = 0; i < 16 && size > min; i++) {
        if (span.scrollWidth <= span.clientWidth + 1 && span.offsetWidth <= room + 1 && span.offsetHeight <= badge.clientHeight * 0.74) break;
        size *= 0.93;
        span.style.fontSize = size + 'px';
      }
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 200);
    });

    tick();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, layout);
    // A face that starts loading later (the numeric font once the tiles appear, a CJK fallback) changes
    // the widths again: fit once more when it arrives.
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { layout(); });
  });
})();
