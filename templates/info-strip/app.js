/*
 * Info strip — ScreenTinker community template. MIT.
 *
 * A clock, the date, the current weather and a rotating line of short messages, laid out for the
 * shape it is given: a horizontal strip, a vertical side bar or a full screen.
 *
 * Everything comes from the server: ST.values (the operator's settings) and, when a Weather data
 * source is chosen, ST.data.weather (its flat keys: temperature, condition, code, units,
 * day1_high, ...). Nothing is fetched, so the manifest declares no network hosts. Text is written
 * with textContent and icons are built with createElementNS — no innerHTML, no eval.
 */
(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var MAX_MESSAGES = 50;

  /* ---------- weather words in the screen's language, by WMO code (English comes from the data source) ----------
     Order: clear, mainly clear, partly cloudy, overcast, fog, drizzle, freezing drizzle, rain, heavy rain,
     freezing rain, snow, heavy snow, snow showers, rain showers, thunderstorm, thunderstorm with hail. */
  var WX_KEYS = ['clear', 'mostly', 'partly', 'overcast', 'fog', 'drizzle', 'fdrizzle', 'rain', 'hrain',
    'frain', 'snow', 'hsnow', 'ssnow', 'showers', 'storm', 'hail'];
  var WX_WORDS = {
    de: ['Klar', 'Überwiegend klar', 'Teils bewölkt', 'Bedeckt', 'Nebel', 'Nieselregen', 'Gefrierender Niesel', 'Regen', 'Starker Regen',
      'Gefrierender Regen', 'Schnee', 'Starker Schnee', 'Schneeschauer', 'Regenschauer', 'Gewitter', 'Gewitter mit Hagel'],
    es: ['Despejado', 'Casi despejado', 'Parcialmente nublado', 'Cubierto', 'Niebla', 'Llovizna', 'Llovizna helada', 'Lluvia', 'Lluvia fuerte',
      'Lluvia helada', 'Nieve', 'Nevada fuerte', 'Chubascos de nieve', 'Chubascos', 'Tormenta', 'Tormenta con granizo'],
    fr: ['Ciel dégagé', 'Plutôt dégagé', 'Partiellement nuageux', 'Couvert', 'Brouillard', 'Bruine', 'Bruine verglaçante', 'Pluie', 'Forte pluie',
      'Pluie verglaçante', 'Neige', 'Fortes chutes de neige', 'Averses de neige', 'Averses', 'Orage', 'Orage avec grêle'],
    hi: ['साफ़ आसमान', 'ज़्यादातर साफ़', 'आंशिक बादल', 'घने बादल', 'कोहरा', 'बूँदाबाँदी', 'जमने वाली बूँदाबाँदी', 'बारिश', 'भारी बारिश',
      'जमने वाली बारिश', 'बर्फ़बारी', 'भारी बर्फ़बारी', 'बर्फ़ की बौछारें', 'बौछारें', 'आंधी-तूफ़ान', 'ओलों के साथ तूफ़ान'],
    it: ['Sereno', 'Poco nuvoloso', 'Parzialmente nuvoloso', 'Coperto', 'Nebbia', 'Pioviggine', 'Pioviggine gelata', 'Pioggia', 'Pioggia forte',
      'Pioggia gelata', 'Neve', 'Neve forte', 'Rovesci di neve', 'Rovesci', 'Temporale', 'Temporale con grandine'],
    ja: ['快晴', '晴れ', '晴れ時々曇り', '曇り', '霧', '霧雨', '着氷性の霧雨', '雨', '大雨',
      '着氷性の雨', '雪', '大雪', 'にわか雪', 'にわか雨', '雷雨', 'ひょうを伴う雷雨'],
    nl: ['Onbewolkt', 'Overwegend helder', 'Half bewolkt', 'Bewolkt', 'Mist', 'Motregen', 'IJzel', 'Regen', 'Zware regen',
      'IJzel', 'Sneeuw', 'Zware sneeuwval', 'Sneeuwbuien', 'Regenbuien', 'Onweer', 'Onweer met hagel'],
    pt: ['Céu limpo', 'Poucas nuvens', 'Parcialmente nublado', 'Nublado', 'Nevoeiro', 'Garoa', 'Garoa congelante', 'Chuva', 'Chuva forte',
      'Chuva congelante', 'Neve', 'Neve forte', 'Pancadas de neve', 'Pancadas de chuva', 'Trovoada', 'Trovoada com granizo'],
    zh: ['晴', '大部晴朗', '多云', '阴', '雾', '毛毛雨', '冻毛毛雨', '雨', '大雨',
      '冻雨', '雪', '大雪', '阵雪', '阵雨', '雷暴', '雷暴伴冰雹']
  };
  function wxKey(code) {
    var c = Number(code);
    if (code === '' || code == null || !isFinite(c)) return '';
    if (c === 0) return 'clear';
    if (c === 1) return 'mostly';
    if (c === 2) return 'partly';
    if (c === 3) return 'overcast';
    if (c === 45 || c === 48) return 'fog';
    if (c >= 51 && c <= 55) return 'drizzle';
    if (c === 56 || c === 57) return 'fdrizzle';
    if (c === 61 || c === 63) return 'rain';
    if (c === 65) return 'hrain';
    if (c === 66 || c === 67) return 'frain';
    if (c === 71 || c === 73 || c === 77) return 'snow';
    if (c === 75) return 'hsnow';
    if (c === 85 || c === 86) return 'ssnow';
    if (c >= 80 && c <= 82) return 'showers';
    if (c === 95) return 'storm';
    if (c === 96 || c === 99) return 'hail';
    return '';
  }

  function str(x) { return x == null ? '' : String(x).trim(); }
  function has(x) { return x !== undefined && x !== null && x !== ''; }
  function num(x) { var n = Number(x); return has(x) && isFinite(n) ? n : null; }
  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgEl(name, attrs, parent) {
    var e = document.createElementNS(SVG, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rgba(hex, a) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return 'rgba(' + parseInt(h.substr(0, 2), 16) + ', ' + parseInt(h.substr(2, 2), 16) + ', ' + parseInt(h.substr(4, 2), 16) + ', ' + a + ')';
  }

  /* ---------- weather icons (viewBox 0 0 100 100), drawn here ---------- */
  function group(code) {
    var c = num(code);
    if (c === null) return 'cloudy';
    if (c <= 1) return 'clear';
    if (c === 2) return 'partly';
    if (c === 3) return 'cloudy';
    if (c === 45 || c === 48) return 'fog';
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
    if (c >= 95) return 'storm';
    return 'rain';
  }
  var CLOUD = 'M30 72 H72 A14 14 0 0 0 72 44 A20 20 0 0 0 34 40 A16 16 0 0 0 30 72 Z';
  function sun(g, cx, cy, r, accent, spin) {
    var rays = svgEl('g', spin ? { 'class': 'spin' } : {}, g);
    for (var i = 0; i < 12; i++) {
      var a = (i * Math.PI) / 6, r1 = r + 6, r2 = r + (i % 2 ? 11 : 15);
      svgEl('line', {
        x1: (cx + Math.cos(a) * r1).toFixed(2), y1: (cy + Math.sin(a) * r1).toFixed(2),
        x2: (cx + Math.cos(a) * r2).toFixed(2), y2: (cy + Math.sin(a) * r2).toFixed(2),
        stroke: accent, 'stroke-width': 3.6, 'stroke-linecap': 'round',
      }, rays);
    }
    svgEl('circle', { cx: cx, cy: cy, r: r, fill: accent }, g);
  }
  function moon(g, cx, cy, r) {
    svgEl('path', {
      d: 'M' + (cx + r * 0.2) + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + (cy + r * 0.35)
        + ' A' + (r * 0.8) + ' ' + (r * 0.8) + ' 0 0 1 ' + (cx + r * 0.2) + ' ' + (cy - r) + ' Z',
      fill: '#F4F1DE', 'class': 'mn',
    }, g);
  }
  function cloud(g, shade, dx, dy, scale, cls) {
    svgEl('path', { d: CLOUD, fill: shade, 'class': cls || 'cl', transform: 'translate(' + dx + ' ' + dy + ') scale(' + scale + ')' }, g);
  }
  function icon(kind, accent, night, spin) {
    var s = svgEl('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    var g = svgEl('g', {}, s);
    if (kind === 'clear') {
      if (night) moon(g, 50, 50, 26); else sun(g, 50, 50, 21, accent, spin);
    } else if (kind === 'partly') {
      if (night) moon(g, 62, 34, 17); else sun(g, 63, 36, 15, accent, spin);
      cloud(g, '#F3F6FA', -4, 8, 1);
    } else if (kind === 'cloudy') {
      cloud(g, '#AEB9C7', 14, -10, 0.8, 'cl2');
      cloud(g, '#F3F6FA', -4, 4, 1);
    } else if (kind === 'fog') {
      cloud(g, '#DCE2E8', 0, -10, 1);
      for (var f = 0; f < 3; f++) {
        svgEl('line', { x1: 20 + f * 4, y1: 72 + f * 9, x2: 80 - f * 6, y2: 72 + f * 9,
          stroke: '#E8ECF0', 'stroke-width': 4.5, 'stroke-linecap': 'round', opacity: 0.85, 'class': 'fg' }, g);
      }
    } else if (kind === 'rain' || kind === 'storm') {
      for (var d = 0; d < 4; d++) {
        svgEl('line', { x1: 36 + d * 10, y1: 72, x2: 32 + d * 10, y2: 84,
          stroke: '#8FD0FF', 'stroke-width': 4, 'stroke-linecap': 'round', 'class': 'rn' }, g);
      }
      cloud(g, kind === 'storm' ? '#9AA5B4' : '#E3E9F0', 0, -8, 1);
      if (kind === 'storm') svgEl('polygon', { points: '52,56 42,76 51,76 46,94 62,68 53,68 58,56', fill: accent }, g);
    } else {
      for (var k = 0; k < 5; k++) {
        svgEl('circle', { cx: 32 + k * 9, cy: 74 + (k % 2) * 8, r: 3, fill: '#FFFFFF', 'class': 'sn' }, g);
      }
      cloud(g, '#F3F6FA', 0, -8, 1);
    }
    return s;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var stage = document.getElementById('stage');
    var msgBox = document.getElementById('msg');
    var prog = document.getElementById('prog');
    var animate = v.animate !== false;

    /* ---------- colours ---------- */
    var accent = v.accent || '#F2B84B';
    if (v.background) root.style.setProperty('--bg', v.background);
    root.style.setProperty('--accent', accent);
    if (v.text_color) {
      root.style.setProperty('--text', v.text_color);
      var m = rgba(v.text_color, 0.68), l = rgba(v.text_color, 0.16), p = rgba(v.text_color, 0.06);
      if (m) { root.style.setProperty('--muted', m); root.style.setProperty('--line', l); root.style.setProperty('--panel', p); }
    }
    if (animate) body.classList.add('anim');
    // On a light background the white clouds, moon and snow get darker shades (style.css, .light).
    var bgHex = String(v.background || '#0F1B2D').replace('#', '');
    if (bgHex.length === 3) bgHex = bgHex.replace(/(.)/g, '$1$1');
    if (/^[0-9a-fA-F]{6}$/.test(bgHex)) {
      var lum = 0.2126 * parseInt(bgHex.substr(0, 2), 16) + 0.7152 * parseInt(bgHex.substr(2, 2), 16) + 0.0722 * parseInt(bgHex.substr(4, 2), 16);
      if (lum > 150) body.classList.add('light');
    }

    /* ---------- brand ---------- */
    var nameText = str(v.name);
    document.getElementById('name').textContent = nameText;
    if (v.logo) {
      var logo = document.getElementById('logo');
      logo.src = v.logo;
      logo.hidden = false;
    }
    if (!v.logo && !nameText) document.getElementById('brand').hidden = true;

    /* ---------- language: the locale setting, else the player's own ---------- */
    var locale = str(v.locale) || undefined;
    var langTag = locale || (typeof navigator !== 'undefined' && navigator.language) || 'en';
    var lang = String(langTag).split('-')[0].toLowerCase();
    try { root.setAttribute('lang', langTag); } catch (e) { root.setAttribute('lang', 'en'); }
    function condition(code, fallback) {
      var words = Object.prototype.hasOwnProperty.call(WX_WORDS, lang) ? WX_WORDS[lang] : null;
      var i = words ? WX_KEYS.indexOf(wxKey(code)) : -1;
      return i >= 0 ? words[i] : fallback;
    }

    /* ---------- clock and date ---------- */
    var tz = str(v.timezone) || undefined;
    function formatter(opts) {
      var o = {};
      for (var k in opts) o[k] = opts[k];
      if (tz) o.timeZone = tz;
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(locale, o); } catch (e2) {
          try { return new Intl.DateTimeFormat(undefined, o); } catch (e3) { return null; }
        }
      }
    }
    var cf = str(v.clock_format) || '24';
    var seconds = v.show_seconds === true;
    var topts = { hour: cf === '12' ? 'numeric' : '2-digit', minute: '2-digit' };
    if (seconds) topts.second = '2-digit';
    if (cf === '24') topts.hourCycle = 'h23';
    if (cf === '12') topts.hour12 = true;
    var tf = formatter(topts);
    var hourF = formatter({ hour: 'numeric', hourCycle: 'h23' });
    var df = str(v.date_format) || 'long';
    var fullDate = df === 'none' ? null : formatter(
      df === 'short' ? { weekday: 'short', day: 'numeric', month: 'short' }
        : df === 'numeric' ? { year: 'numeric', month: '2-digit', day: '2-digit' }
          : { weekday: 'long', day: 'numeric', month: 'long' });
    // The side bar puts the weekday on its own line above the day and month.
    var wdF = df === 'long' || df === 'short' ? formatter({ weekday: df }) : null;
    var dmF = df === 'long' || df === 'short' ? formatter({ day: 'numeric', month: df }) : null;
    if (df === 'none') document.getElementById('date').hidden = true;

    var timeEl = document.getElementById('time');
    var ampmEl = document.getElementById('ampm');
    var wdEl = document.getElementById('wd');
    var dmEl = document.getElementById('dm');
    var mode = 'row';
    var lastTime = '', lastDate = '';

    function timeParts(now) {
      if (!tf) return { t: String(now.getHours()) + ':' + ('0' + now.getMinutes()).slice(-2), p: '' };
      if (!tf.formatToParts) return { t: tf.format(now), p: '' };
      var t = '', p = '', pre = false;
      tf.formatToParts(now).forEach(function (x) {
        if (x.type === 'dayPeriod' || x.type === 'dayperiod') { p = x.value; pre = !t; }
        else t += x.value;
      });
      return { t: t.trim(), p: p, pre: pre };
    }
    function tick() {
      var now = new Date();
      var tp = timeParts(now);
      var key = tp.t + '|' + tp.p;
      if (key !== lastTime) {
        var refit = key.length !== lastTime.length;
        lastTime = key;
        timeEl.textContent = tp.t;
        ampmEl.textContent = tp.p;
        // Japanese, Chinese and Korean put the day period first (午後 2:30).
        if (tp.pre !== ampmEl.classList.contains('pre')) {
          ampmEl.classList.toggle('pre', !!tp.pre);
          timeBox.insertBefore(ampmEl, tp.pre ? timeEl : null);
        }
        if (refit) fitClock();
      }
      if (fullDate) {
        var dk = mode === 'column' && wdF ? wdF.format(now) + '|' + dmF.format(now) : fullDate.format(now) + '|';
        if (dk !== lastDate) {
          lastDate = dk;
          var parts = dk.split('|');
          wdEl.textContent = parts[0];
          dmEl.textContent = parts[1];
        }
      }
    }
    // The clock is as big as its layout allows, shrunk only when it would not fit the column
    // (seconds plus a long AM/PM marker in a narrow side bar).
    var timeBox = timeEl.parentNode;
    function fitClock() {
      timeBox.style.fontSize = '';
      if (mode === 'row') return;
      var avail = timeBox.clientWidth, need = timeBox.scrollWidth;
      if (avail > 0 && need > avail + 1) {
        var px = parseFloat(window.getComputedStyle(timeBox).fontSize) || 0;
        if (px) timeBox.style.fontSize = Math.floor(px * avail / need * 0.98) + 'px';
      }
    }
    function currentHour() {
      try { return parseInt(hourF.format(new Date()), 10) % 24; } catch (e) { return new Date().getHours(); }
    }

    /* ---------- weather ---------- */
    var w = (ST.data && ST.data.weather) || null;
    var hasWx = !!(w && typeof w === 'object' && num(w.temperature) !== null);
    var nf = null;
    try { nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }); } catch (e) { nf = null; }
    function deg(x) {
      var n = num(x);
      if (n === null) return '–';
      return (nf ? nf.format(Math.round(n)) : String(Math.round(n))) + '°';
    }
    if (hasWx) {
      var hour = currentHour();
      var night = hour < 6 || hour >= 20;
      document.getElementById('wxicon').appendChild(icon(group(w.code), accent, night, animate));
      document.getElementById('temp').textContent = deg(w.temperature);
      document.getElementById('cond').textContent = condition(w.code, str(w.condition));
      document.getElementById('place').textContent = str(v.location) || str(w.location);
      if (v.show_forecast !== false) {
        var days = document.getElementById('days');
        // Weekday names in the template's language; the date is a calendar day, so read it in UTC.
        var dayF = null;
        try { dayF = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }); } catch (e) { dayF = null; }
        for (var d = 1; d <= 3; d++) {
          if (num(w['day' + d + '_high']) === null && num(w['day' + d + '_low']) === null) continue;
          var label = str(w['day' + d + '_name']);
          var iso = str(w['day' + d + '_date']);
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && dayF) {
            var dt = new Date(iso + 'T12:00:00Z');
            if (!isNaN(dt.getTime())) label = dayF.format(dt);
          }
          var card = el('div', 'day', null, days);
          el('div', 'dn', label || '–', card);
          el('div', 'di', null, card).appendChild(icon(group(w['day' + d + '_code']), accent, false, false));
          var hl = el('div', 'hl', null, card);
          el('b', null, deg(w['day' + d + '_high']), hl);
          hl.appendChild(document.createTextNode(' '));
          el('span', null, deg(w['day' + d + '_low']), hl);
        }
      }
      document.getElementById('wx').hidden = false;
    } else {
      body.classList.add('nowx');
    }

    /* ---------- messages ---------- */
    var messages = str(v.messages).split(/\r?\n/).map(function (line) {
      var s = str(line);
      if (!s) return null;
      var i = s.indexOf('|');
      if (i > 0 && i <= 24) return { tag: str(s.slice(0, i)), text: str(s.slice(i + 1)) };
      if (i === 0) return { tag: '', text: str(s.slice(1)) };
      return { tag: '', text: s };
    }).filter(function (x) { return x && (x.text || x.tag); }).slice(0, MAX_MESSAGES);
    if (!messages.length) msgBox.classList.add('empty');
    if (messages.length < 2) body.classList.add('single');

    var seconds_per = Math.min(120, Math.max(3, Number(v.message_seconds) || 8));
    var index = 0;
    var current = null;
    var timer = null;

    function sizes() {
      var u = parseFloat(root.style.getPropertyValue('--u')) || 10;
      if (mode === 'row') return { hi: u * 26, lo: Math.max(11, u * 15) };
      if (mode === 'column') return { hi: u * 10, lo: Math.max(11, u * 5.5) };
      return { hi: u * 4, lo: Math.max(11, u * 2.4) };
    }
    function fits(n) {
      return n.offsetHeight <= stage.clientHeight + 1 && n.scrollWidth <= stage.clientWidth + 1;
    }
    // The largest size at which the whole message fits the box (it may wrap), down to a readable
    // minimum; below that it is cut with an ellipsis rather than shrunk further.
    function fit(n) {
      var s = sizes();
      n.classList.remove('clamp');
      n.style.webkitLineClamp = '';
      n.style.fontSize = s.hi + 'px';
      if (fits(n)) return;
      var lo = s.lo, hi = s.hi;
      n.style.fontSize = lo + 'px';
      if (!fits(n)) {
        var lines = Math.max(1, Math.floor(stage.clientHeight / (lo * 1.18)) - (mode === 'column' && n.querySelector('.tag') ? 1 : 0));
        n.classList.add('clamp');
        n.style.webkitLineClamp = String(lines);
        return;
      }
      for (var k = 0; k < 12 && hi - lo > 0.5; k++) {
        var mid = (lo + hi) / 2;
        n.style.fontSize = mid + 'px';
        if (fits(n)) lo = mid; else hi = mid;
      }
      n.style.fontSize = Math.floor(lo * 2) / 2 + 'px';
    }
    function build(msg) {
      var n = el('div', 'm');
      if (msg.tag) el('span', 'tag', msg.tag, n);
      el('span', 'text', msg.text, n);
      return n;
    }
    function restartProgress() {
      if (!animate || messages.length < 2) return;
      prog.style.transition = 'none';
      prog.style.transform = 'scaleX(0)';
      void prog.offsetWidth;   // apply the reset before starting the next run
      prog.style.transition = 'transform ' + seconds_per + 's linear';
      prog.style.transform = 'scaleX(1)';
    }
    function show(i, instant) {
      var old = current;
      var n = build(messages[i]);
      if (animate && !instant) n.classList.add('enter');
      stage.appendChild(n);
      fit(n);
      current = n;
      if (animate && !instant) {
        void n.offsetWidth;
        n.classList.remove('enter');
      }
      if (old) {
        if (animate && !instant) {
          old.classList.add('leave');
          setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 700);
        } else if (old.parentNode) {
          old.parentNode.removeChild(old);
        }
      }
      restartProgress();
    }
    function schedule() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (messages.length < 2) return;
      timer = setTimeout(function () {
        index = (index + 1) % messages.length;
        show(index, false);
        schedule();
      }, seconds_per * 1000);
    }

    /* ---------- layout ---------- */
    function layout() {
      var W = window.innerWidth || 1920, H = window.innerHeight || 1080;
      var ratio = W / H;
      var want = str(v.layout) || 'auto';
      mode = want === 'row' || want === 'column' || want === 'full' ? want
        : ratio >= 2.4 ? 'row' : ratio <= 0.75 ? 'column' : 'full';
      body.className = body.className.replace(/\bm-\w+\b|\btight\w*\b|\bno-days\b/g, '').trim();
      body.classList.add('m-' + mode);

      var u, edgeW;
      if (mode === 'row') { u = Math.min(H / 100, W / 960); edgeW = Math.max(2, Math.round(H * 0.025)); }
      else if (mode === 'column') { u = Math.min(W / 100, H / 210); edgeW = Math.max(2, Math.round(W * 0.012)); }
      else { u = Math.min(W, H * 16 / 9) / 100; edgeW = Math.max(3, Math.round(u * 0.3)); }
      root.style.setProperty('--u', u.toFixed(3) + 'px');
      root.style.setProperty('--edge-w', edgeW + 'px');
      var edge = str(v.edge) || 'auto';
      if (edge === 'auto') edge = mode === 'column' ? 'left' : 'top';
      body.setAttribute('data-edge', edge);

      lastDate = '';
      lastTime = '';
      tick();

      // A narrow strip drops the name beside the logo, then the weather words, then the logo, to leave room to read.
      if (mode === 'row' && messages.length) {
        var steps = ['tight', 'tighter', 'tightest'];
        for (var s = 0; s < steps.length && msgBox.clientWidth < W * 0.36; s++) body.classList.add(steps[s]);
      }
      // A short side bar drops the forecast before the messages get too small.
      if (mode === 'column' && messages.length && hasWx && stage.clientHeight < u * 36) body.classList.add('no-days');

      if (current) fit(current);
    }

    layout();
    if (messages.length) { show(0, true); schedule(); }
    setInterval(tick, 1000);

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 200);
    });
    // Measure with the real fonts, not the fallbacks.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, function () {});
  });
})();
