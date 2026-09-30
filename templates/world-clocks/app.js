/*
 * World clocks — ScreenTinker community template. MIT.
 *
 * Everything this reads comes from window.ST (the server injects the operator's values). Every time
 * shown is the screen's own clock run through Intl.DateTimeFormat with a timeZone: nothing is
 * fetched, nothing is stored, and values are written with textContent only.
 */
(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';
  var MAX_CLOCKS = 8;

  function num(v, lo, hi, dflt) {
    var n = Number(v);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVG, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* A timezone is usable if Intl accepts it. An unknown zone throws a RangeError — caught here, once. */
  function zoneOk(tz) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
  }

  /* "City | Zone" per line. A line with no "|" is taken as a bare zone, named after its last part. */
  function parseClocks(text) {
    var ok = [], skipped = [], extra = 0;
    String(text || '').split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/\s+/g, ' ').trim();
      if (!line) return;
      var bar = line.indexOf('|');
      var city = bar >= 0 ? line.slice(0, bar).trim() : '';
      var tz = (bar >= 0 ? line.slice(bar + 1) : line).trim().replace(/ /g, '_');
      if (!city) city = tz.split('/').pop().replace(/_/g, ' ');
      if (!tz || tz.length > 64 || !zoneOk(tz)) { skipped.push(city || line); return; }
      if (ok.length >= MAX_CLOCKS) { extra++; return; }
      ok.push({ city: city.slice(0, 40), tz: tz });
    });
    return { clocks: ok, skipped: skipped, extra: extra };
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    // Colours are validated as #hex by the server before they get here.
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);

    var face = v.face === 'analog' || v.face === 'digital' ? v.face : 'both';
    var h12 = v.clock_format === '12';
    var showSec = v.show_seconds !== false;
    var dayStart = num(v.day_start, 0, 23, 7);
    var dayEnd = num(v.day_end, 1, 24, 19);
    var locale = v.locale || undefined;
    body.classList.add('f-' + face);
    if (!showSec) body.classList.add('no-seconds');
    if (v.show_date === false) body.classList.add('no-date');
    if (v.show_daynight === false) body.classList.add('no-daynight');

    var title = String(v.title || '').trim();
    document.getElementById('title').textContent = title;

    /* The screen's own zone: the operator's setting if valid, else what the device reports. */
    var home = '';
    if (v.home_timezone && zoneOk(v.home_timezone)) home = v.home_timezone;
    if (!home) {
      try { home = new Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { home = ''; }
    }
    function canonical(tz) {
      try { return new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone; } catch (e) { return tz; }
    }
    var homeCanon = home ? canonical(home) : '';
    document.getElementById('home').textContent = home ? home.replace(/_/g, ' ') : '';

    var parsed = parseClocks(v.clocks);
    var notes = [];
    if (parsed.skipped.length) notes.push('Skipped — unknown timezone: ' + parsed.skipped.join(', '));
    if (parsed.extra) notes.push('Showing the first ' + MAX_CLOCKS + ' clocks; ' + parsed.extra + ' more not shown');
    if (notes.length) {
      document.getElementById('note').textContent = notes.join('  ·  ');
      root.style.setProperty('--noteh', '4vh');
    }

    /* Wall-clock fields of `when` in a zone, via formatToParts (h23, so midnight is 0, never 24). */
    function partsFmt(tz) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
      });
    }
    function fields(fmt, when) {
      var o = {};
      fmt.formatToParts(when).forEach(function (p) { if (p.type !== 'literal') o[p.type] = Number(p.value); });
      if (o.hour === 24) o.hour = 0;
      return o;
    }
    function offsetMin(f, when) {
      var asUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second);
      return Math.round((asUtc - Math.floor(when.getTime() / 1000) * 1000) / 60000);
    }
    function dateFmt(tz) {
      var o = { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' };
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) { return new Intl.DateTimeFormat('en-GB', o); }
    }
    function dayPeriodFmt(tz) {
      var o = { timeZone: tz, hour: 'numeric', hour12: true };
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) { return new Intl.DateTimeFormat('en-US', o); }
    }
    var homeFmt = home ? partsFmt(home) : null;

    /* ---------- build one card per clock, once ---------- */
    var grid = document.getElementById('grid');
    var cards = parsed.clocks.map(function (c, i) {
      var card = el('section', 'card');
      card.style.animationDelay = (0.12 + i * 0.07).toFixed(2) + 's';

      var top = el('div', 'top');
      top.appendChild(el('span', 'city', c.city));
      var here = v.highlight_local !== false && homeCanon && canonical(c.tz) === homeCanon;
      if (here) {
        card.classList.add('here');
        top.appendChild(el('span', 'chip here-chip', String(v.here_label || '').trim() || 'Here'));
      }
      var dn = el('span', 'chip dn-chip');
      var icon = el('i', 'icon');
      var dnText = el('span', null, '');
      dn.appendChild(icon); dn.appendChild(dnText);
      top.appendChild(dn);
      card.appendChild(top);

      var s = svg('svg', { 'class': 'face', viewBox: '0 0 100 100', 'aria-hidden': 'true' });
      s.appendChild(svg('circle', { 'class': 'dial', cx: 50, cy: 50, r: 48 }));
      for (var t = 0; t < 60; t += 5) {
        var major = t % 15 === 0;
        s.appendChild(svg('line', {
          'class': 'tick' + (major ? ' major' : ''), x1: 50, y1: major ? 7 : 8, x2: 50, y2: major ? 15 : 12,
          transform: 'rotate(' + t * 6 + ' 50 50)'
        }));
      }
      var hh = svg('line', { 'class': 'hand h', x1: 50, y1: 54, x2: 50, y2: 27 });
      var mh = svg('line', { 'class': 'hand m', x1: 50, y1: 56, x2: 50, y2: 16 });
      var sh = svg('line', { 'class': 'hand s', x1: 50, y1: 60, x2: 50, y2: 12 });
      s.appendChild(hh); s.appendChild(mh); s.appendChild(sh);
      s.appendChild(svg('circle', { 'class': 'hub', cx: 50, cy: 50, r: 2.6 }));
      card.appendChild(s);

      var time = el('div', 'time');
      var hm = el('span', 'hm'), sec = el('span', 'sec'), ap = el('span', 'ap');
      time.appendChild(hm);
      if (showSec) time.appendChild(sec);
      if (h12) time.appendChild(ap);
      card.appendChild(time);

      var meta = el('div', 'meta');
      var date = el('span', 'date'), sep = el('span', 'sep', '·'), off = el('span', 'off');
      meta.appendChild(date); meta.appendChild(sep); meta.appendChild(off);
      card.appendChild(meta);

      grid.appendChild(card);
      return {
        card: card, here: here, icon: icon, dnText: dnText, hh: hh, mh: mh, sh: sh,
        hm: hm, sec: sec, ap: ap, date: date, sep: sep, off: off,
        pf: partsFmt(c.tz), df: dateFmt(c.tz), apf: dayPeriodFmt(c.tz), lastDay: -1, lastDn: null
      };
    });

    if (!cards.length) {
      grid.appendChild(el('div', 'empty-msg', 'Add clocks in the template settings — one per line, as City | Timezone.'));
    }

    /* ---------- layout: grid, portrait list or strip, from the zone's shape ---------- */
    function layout() {
      var w = window.innerWidth || 1, hgt = window.innerHeight || 1, n = Math.max(1, cards.length);
      var ratio = w / hgt, mode, cols, rows;
      if (ratio > 3.2) { mode = 'strip'; cols = n; rows = 1; }
      else if (ratio < 0.85) { mode = 'list'; cols = 1; rows = n; }
      else if (n <= 4) { mode = 'grid'; cols = n; rows = 1; }
      else { mode = 'grid'; cols = Math.ceil(n / 2); rows = 2; }
      if (mode === 'list' && n > 5 && face !== 'digital' && hgt / n < w * 0.14) { cols = 2; rows = Math.ceil(n / 2); mode = 'grid'; }

      var noHead = !title || mode === 'strip';
      body.classList.toggle('no-head', noHead);
      root.style.setProperty('--headh', noHead ? '0vh' : (mode === 'list' ? '7vh' : '11vh'));
      root.style.setProperty('--padx', mode === 'strip' ? '1.5vw' : mode === 'list' ? '5vw' : '4vw');
      root.style.setProperty('--pady', mode === 'strip' ? '6vh' : mode === 'list' ? '3.5vh' : '4.5vh');
      root.style.setProperty('--cols', cols);
      root.style.setProperty('--rows', rows);

      // Cell shape decides the arrangement inside each card; the design box is what --u fits.
      var cellRatio = (w / cols) / (hgt * (noHead ? 0.9 : 0.8) / rows);
      var arr = mode === 'list' ? 'list' : (face === 'both' && cellRatio > 1.45 ? 'side' : 'stack');
      var box = { list: [220, 76], side: [150, 96], stack: [100, 130] }[arr];
      if (face === 'digital') box = arr === 'list' ? [160, 50] : [80, 66];
      if (face === 'analog') box = arr === 'list' ? [150, 78] : [100, 112];
      if (face === 'digital' && arr === 'side') arr = 'stack';
      ['m-grid', 'm-list', 'm-strip', 'a-list', 'a-stack', 'a-side'].forEach(function (c) { body.classList.remove(c); });
      body.classList.add('m-' + mode); body.classList.add('a-' + arr);
      root.style.setProperty('--wd', box[0]);
      root.style.setProperty('--hd', box[1]);
    }
    layout();
    window.addEventListener('resize', layout);

    /* ---------- the tick: one timer, re-armed for the start of each second ---------- */
    function fmtOffset(mins) {
      if (mins === 0) return '±0h';
      var sign = mins > 0 ? '+' : '−', a = Math.abs(mins);
      return sign + Math.floor(a / 60) + (a % 60 ? ':' + pad2(a % 60) : '') + 'h';
    }
    function periodText(c, when) {
      var p = '';
      try {
        c.apf.formatToParts(when).forEach(function (x) { if (x.type === 'dayPeriod') p = x.value; });
      } catch (e) { p = ''; }
      return p;
    }
    function tick() {
      var when = new Date();
      var homeOff = homeFmt ? offsetMin(fields(homeFmt, when), when) : null;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var f = fields(c.pf, when);
        var h = f.hour, m = f.minute, s = f.second;
        c.hh.setAttribute('transform', 'rotate(' + ((h % 12) * 30 + m * 0.5) + ' 50 50)');
        c.mh.setAttribute('transform', 'rotate(' + (m * 6 + s * 0.1) + ' 50 50)');
        c.sh.setAttribute('transform', 'rotate(' + s * 6 + ' 50 50)');

        var dh = h12 ? (h % 12 || 12) : pad2(h);
        c.hm.textContent = dh + ':' + pad2(m);
        c.sec.textContent = ':' + pad2(s);
        if (h12) c.ap.textContent = periodText(c, when) || (h < 12 ? 'AM' : 'PM');

        var isDay = dayStart < dayEnd ? (h >= dayStart && h < dayEnd) : (h >= dayStart || h < dayEnd);
        if (isDay !== c.lastDn) {
          c.lastDn = isDay;
          c.card.classList.toggle('day', isDay);
          c.card.classList.toggle('night', !isDay);
          c.icon.className = 'icon ' + (isDay ? 'sun' : 'moon');
          c.dnText.textContent = isDay ? 'Day' : 'Night';
        }
        if (f.day !== c.lastDay || s === 0) {
          c.lastDay = f.day;
          c.date.textContent = c.df.format(when);
          if (homeOff === null || c.here) {
            c.off.textContent = '';
            c.sep.style.display = 'none';
          } else {
            c.off.textContent = fmtOffset(offsetMin(f, when) - homeOff);
            c.sep.style.display = '';
          }
        }
      }
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 15);
    }
    var timer = null;
    tick();
    window.addEventListener('pagehide', function () { if (timer) clearTimeout(timer); });
  });
})();
