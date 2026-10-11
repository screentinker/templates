/*
 * Wait times board — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. The services come from a table data source when one is chosen (Google
 * Sheets, CSV, Manual table: ST.data.waits holds row{i}_{column} keys, row_count, columns and an
 * ISO `updated` time, see server/lib/data-sources/tabular.js), otherwise from the typed lines.
 * ST.data is a snapshot; the server re-renders the page when the source syncs, so nothing here
 * polls. Writes with textContent / createElement only, fetches nothing, uses no eval.
 */
(function () {
  'use strict';

  var MAX_SERVICES = 60;
  var OPEN = { open: 1, opened: 1, available: 1, normal: 1, quiet: 1, short: 1, ok: 1, on_time: 1, running: 1 };
  var BUSY = { busy: 1, very_busy: 1, long: 1, long_wait: 1, high: 1, delayed: 1, delay: 1, full: 1, peak: 1 };
  var CLOSED = { closed: 1, close: 1, shut: 1, unavailable: 1, paused: 1, off: 1, suspended: 1, not_available: 1 };

  /* The words on the screen, in the screen's language (picked by the locale's primary subtag, else
     English). An operator's own text in the *_label settings always wins. {time} = the time. */
  var STRINGS = {
    en: {
      open: 'Open',
      busy: 'Busy',
      closed: 'Closed',
      nowait: 'No wait',
      updated: 'Updated {time}',
      empty: 'Waiting times are being updated'
    },
    de: {
      open: 'Offen',
      busy: 'Ausgelastet',
      closed: 'Geschlossen',
      nowait: 'Sofort',
      updated: 'Aktualisiert {time}',
      empty: 'Die Wartezeiten werden aktualisiert'
    },
    es: {
      open: 'Abierto',
      busy: 'Ocupado',
      closed: 'Cerrado',
      nowait: 'Sin espera',
      updated: 'Actualizado: {time}',
      empty: 'Estamos actualizando los tiempos de espera'
    },
    fr: {
      open: 'Ouvert',
      busy: 'Chargé',
      closed: 'Fermé',
      nowait: 'Sans attente',
      updated: 'Mise à jour : {time}',
      empty: 'Mise à jour des temps d\u2019attente en cours'
    },
    hi: {
      open: 'खुला',
      busy: 'व्यस्त',
      closed: 'बंद',
      nowait: 'तुरंत',
      updated: 'अपडेट: {time}',
      empty: 'प्रतीक्षा समय अपडेट हो रहा है'
    },
    it: {
      open: 'Aperto',
      busy: 'Affollato',
      closed: 'Chiuso',
      nowait: 'Subito',
      updated: 'Aggiornato: {time}',
      empty: 'Tempi di attesa in aggiornamento'
    },
    ja: {
      open: '受付中',
      busy: '混雑',
      closed: '受付終了',
      nowait: '待ちなし',
      updated: '{time} 更新',
      empty: '待ち時間を更新しています'
    },
    nl: {
      open: 'Open',
      busy: 'Druk',
      closed: 'Gesloten',
      nowait: 'Direct',
      updated: 'Bijgewerkt {time}',
      empty: 'De wachttijden worden bijgewerkt'
    },
    pt: {
      open: 'Aberto',
      busy: 'Lotado',
      closed: 'Fechado',
      nowait: 'Sem espera',
      updated: 'Atualizado: {time}',
      empty: 'Os tempos de espera estão sendo atualizados'
    },
    zh: {
      open: '开放',
      busy: '繁忙',
      closed: '关闭',
      nowait: '无需等候',
      updated: '{time} 更新',
      empty: '等候时间正在更新'
    }
  };
  // Status words typed in a sheet, in any of these languages (besides the English ones above).
  var MORE = {
    open: ['offen', 'geöffnet', 'abierto', 'ouvert', 'aperto', 'aberto', 'खुला', '受付中', '開放', '开放', '营业中'],
    busy: ['ausgelastet', 'voll', 'ocupado', 'chargé', 'affluence', 'affollato', 'lotado', 'cheio', 'druk', 'व्यस्त', '混雑', '繁忙'],
    closed: ['geschlossen', 'cerrado', 'fermé', 'chiuso', 'fechado', 'gesloten', 'बंद', '受付終了', '休止', '終了', '关闭', '暂停']
  };
  var WORD = {};
  Object.keys(STRINGS).forEach(function (l) {
    ['open', 'busy', 'closed'].forEach(function (k) { WORD[STRINGS[l][k].toLowerCase()] = k; });
  });
  Object.keys(MORE).forEach(function (k) { MORE[k].forEach(function (w) { WORD[w] = k; }); });

  function str(x) { return x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== '') e.textContent = text;
    return e;
  }
  // The same key the server gives a column header (tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }
  function clampNum(x, lo, hi, dflt) {
    var n = Number(x);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var grid = $('grid');
    var stage = $('stage');
    var pager = $('pager');

    body.setAttribute('data-theme', v.theme === 'dark' ? 'dark' : 'light');
    ['accent', 'open', 'busy', 'closed'].forEach(function (k) {
      var c = v[k === 'accent' ? 'accent' : k + '_color'];
      if (c) root.style.setProperty('--' + k, c);
    });

    var lang = str(v.locale) || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    var W = STRINGS[String(lang).split(/[-_]/)[0].toLowerCase()] || STRINGS.en;
    try { root.lang = lang; } catch (e) { /* an odd tag: keep lang="en" */ }

    $('title').textContent = str(v.title);
    $('subtitle').textContent = str(v.subtitle);
    if (v.logo) { $('logo').src = v.logo; $('logo').hidden = false; }
    if (str(v.notice)) { $('notice-text').textContent = str(v.notice); $('notice').hidden = false; }
    if (str(v.checkin)) { $('checkin-text').textContent = str(v.checkin); $('checkin').hidden = false; }

    var labels = {
      open: str(v.open_label) || W.open,
      busy: str(v.busy_label) || W.busy,
      closed: str(v.closed_label) || W.closed,
      nowait: str(v.nowait_label) || W.nowait,
      updated: str(v.updated_label) || W.updated,
      empty: str(v.empty_label) || W.empty
    };
    var busyFrom = clampNum(v.busy_minutes, 1, 600, 40);
    var staleMin = clampNum(v.stale_minutes, 0, 1440, 60);   // 0 = never warn
    var showMeter = v.show_meter !== false;

    /* ---------- dates, times and numbers in the chosen language ---------- */
    var locale = str(v.locale) || undefined;
    var tz = str(v.timezone) || undefined;
    var clockMode = str(v.clock_format) || 'auto';
    function dtf(opts) {
      var o = {}, k;
      for (k in opts) o[k] = opts[k];
      if (tz) o.timeZone = tz;
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(locale, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, opts); }
      }
    }
    function nf(opts) {
      try { return new Intl.NumberFormat(locale, opts); } catch (e) {
        try { return new Intl.NumberFormat(undefined, opts); } catch (e2) { return null; }
      }
    }
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (clockMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (clockMode === '12') timeOpts.hour12 = true;
    var timeFmt = dtf(timeOpts);
    var dateFmt = dtf({ weekday: 'long', day: 'numeric', month: 'long' });
    var shortDateFmt = dtf({ day: 'numeric', month: 'short' });
    var dayKeyFmt = dtf({ year: 'numeric', month: '2-digit', day: '2-digit' });
    var plainNum = nf({ maximumFractionDigits: 1 });
    var minuteFmt = nf({ style: 'unit', unit: 'minute', unitDisplay: 'short' });
    var hourFmt = nf({ style: 'unit', unit: 'hour', unitDisplay: 'short', maximumFractionDigits: 1 });
    if (clockMode === 'off') $('clockbox').hidden = true;

    /* A number with its unit as separate pieces, so the unit can be set smaller: [{t, unit}] */
    function unitParts(fmt, n, fallbackUnit) {
      if (fmt && fmt.formatToParts) {
        try {
          return fmt.formatToParts(n).map(function (p) { return { t: p.value, unit: p.type === 'unit' }; });
        } catch (e) { /* fall through */ }
      }
      return [{ t: plainNum ? plainNum.format(n) : String(n), unit: false }, { t: ' ' + fallbackUnit, unit: true }];
    }
    function durationParts(m) {
      if (m >= 120) return unitParts(hourFmt, Math.round(m / 30) / 2, 'h');
      return unitParts(minuteFmt, Math.round(m), 'min');
    }

    /* ---------- reading a wait ---------- */
    // "25", "25 min", "25m" → 25; "1:30" → 90; "1h 15m" → 75; "15-20" → range; anything else → text.
    function parseWait(raw) {
      var s = str(raw);
      if (!s) return { kind: 'none' };
      var t = s.toLowerCase().replace(',', '.');
      var m;
      if ((m = /^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)?\.?$/.exec(t))) return { kind: 'min', m: parseFloat(m[1]) };
      if ((m = /^(\d{1,2}):([0-5]\d)$/.exec(t))) return { kind: 'min', m: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) };
      if ((m = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\.?(?:\s*(\d+)\s*(?:m|min|mins|minutes?)?\.?)?$/.exec(t))) {
        return { kind: 'min', m: parseFloat(m[1]) * 60 + (m[2] ? parseInt(m[2], 10) : 0) };
      }
      if ((m = /^(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*(?:m|min|mins|minutes?)?\.?$/.exec(t))) {
        var a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        if (a > b) { var x = a; a = b; b = x; }
        return { kind: 'range', a: a, b: b, m: (a + b) / 2 };
      }
      return { kind: 'text', text: s };
    }
    function statusOf(raw, wait) {
      var k = slug(raw);
      var w = WORD[str(raw).toLowerCase()];
      if (CLOSED[k] || w === 'closed') return { s: 'closed', label: labels.closed };
      if (BUSY[k] || w === 'busy') return { s: 'busy', label: labels.busy };
      if (OPEN[k] || w === 'open') return { s: 'open', label: labels.open };
      var derived = (wait.kind === 'min' || wait.kind === 'range') && wait.m >= busyFrom ? 'busy' : 'open';
      // An unknown word ("Triage only") is shown as typed, coloured by the wait.
      return { s: derived, label: str(raw) || labels[derived] };
    }

    /* ---------- the services: from the data source, or the typed lines ---------- */
    // A chosen source replaces the typed lines, even before its first sync (so stale typed figures
    // never show as if they were live). A source that is not a table at all (a Weather source picked
    // by mistake) is ignored, and the typed lines are used.
    var src = (ST.data && ST.data.waits && typeof ST.data.waits === 'object') ? ST.data.waits : null;
    var isTable = !!src && (src.row_count !== undefined || src.columns !== undefined || src.row1_ !== undefined);
    var bound = !!str(v.waits) && (isTable || !src || !Object.keys(src).length);
    var updatedAt = null;
    function fromSource(d) {
      var k = { svc: slug(v.service_col || 'Service'), wait: slug(v.wait_col || 'Wait'),
                st: slug(v.status_col || 'Status'), note: slug(v.note_col || 'Note') };
      var out = [];
      // A heading that is not in the sheet falls back to the English one, so a translated default
      // ("Wartezeit") still reads a sheet set up with the documented headings (Service, Wait …).
      var EN = { svc: 'service', wait: 'wait', st: 'status', note: 'note' };
      Object.keys(EN).forEach(function (n) {
        if (d['row1_' + k[n]] === undefined && d['row1_' + EN[n]] !== undefined) k[n] = EN[n];
      });
      if (!k.svc) return out;
      // A Service column name that matches no heading (the sheet says "Department"): use the first column.
      if (d['row1_' + k.svc] === undefined && d.columns) {
        var first = slug(String(d.columns).split(', ')[0]);
        if (first && d['row1_' + first] !== undefined) k.svc = first;
      }
      for (var i = 1; i <= MAX_SERVICES; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.svc] === undefined) break;
        out.push({ name: str(d[p + k.svc]), wait: str(d[p + k.wait]), status: str(d[p + k.st]), note: str(d[p + k.note]) });
      }
      return out;
    }
    function fromText() {
      return str(v.services) === '' ? [] : String(v.services).split(/\r?\n/).slice(0, MAX_SERVICES).map(function (line) {
        var c = line.split('|');
        return { name: str(c[0]), wait: str(c[1]), status: str(c[2]), note: str(c[3]) };
      });
    }
    var rows;
    if (bound) {
      rows = src ? fromSource(src) : [];
      if (src && src.updated) {
        var t = Date.parse(src.updated);
        if (isFinite(t)) updatedAt = new Date(t);
      }
    } else {
      rows = fromText();
      updatedAt = new Date();      // typed lines: the time this screen received them
    }

    var services = rows.filter(function (r) { return r.name; }).map(function (r, i) {
      var w = parseWait(r.wait);
      var st = statusOf(r.status, w);
      return { name: r.name, note: r.note, wait: w, s: st.s, label: st.label, i: i };
    });
    if (v.order === 'shortest' || v.order === 'longest') {
      var dir = v.order === 'shortest' ? 1 : -1;
      services.sort(function (a, b) {
        var ca = a.s === 'closed' ? 1 : 0, cb = b.s === 'closed' ? 1 : 0;
        if (ca !== cb) return ca - cb;
        var ma = a.wait.m === undefined ? null : a.wait.m, mb = b.wait.m === undefined ? null : b.wait.m;
        if (ma === null && mb === null) return a.i - b.i;
        if (ma === null) return 1;
        if (mb === null) return -1;
        return ma === mb ? a.i - b.i : (ma - mb) * dir;
      });
    }
    var scale = 60;
    services.forEach(function (s) { if (s.s !== 'closed' && s.wait.m > scale) scale = s.wait.m; });

    /* ---------- one service card ---------- */
    function card(s) {
      var c = el('div', 'card ' + s.s);
      var main = c.appendChild(el('div', 'c-main'));
      main.appendChild(el('div', 'c-name', s.name)).dir = 'auto';
      main.appendChild(el('div', 'c-note', s.note)).dir = 'auto';
      var side = c.appendChild(el('div', 'c-side'));
      var w = side.appendChild(el('div', 'c-wait'));
      var showPill = true;
      if (s.s === 'closed') {
        w.className += ' word';
        w.textContent = s.label;
        showPill = false;
      } else if (s.wait.kind === 'min' && s.wait.m <= 0) {
        w.className += ' word';
        w.textContent = labels.nowait;
      } else if (s.wait.kind === 'min' || s.wait.kind === 'range') {
        var parts = durationParts(s.wait.kind === 'range' ? s.wait.b : s.wait.m);
        if (s.wait.kind === 'range' && s.wait.b < 120) {
          w.appendChild(el('span', 'num', (plainNum ? plainNum.format(s.wait.a) : String(s.wait.a)) + '–'));
        }
        parts.forEach(function (p) {
          if (!p.t) return;
          if (p.unit) w.appendChild(el('span', 'unit', p.t));
          else if (/^\s+$/.test(p.t)) w.appendChild(document.createTextNode(p.t));
          else w.appendChild(el('span', 'num', p.t));
        });
      } else if (s.wait.kind === 'text') {
        w.className += ' text';
        w.textContent = s.wait.text;
      } else {
        w.className += ' text';
        w.textContent = '—';
      }
      if (showPill) {
        var pill = side.appendChild(el('div', 'pill'));
        pill.appendChild(el('i', 'pdot'));
        pill.appendChild(document.createTextNode(s.label));
      }
      if (showMeter && s.s !== 'closed' && s.wait.m > 0) {
        var meter = main.appendChild(el('div', 'meter'));
        var fill = meter.appendChild(el('i'));
        fill.style.width = Math.max(3, Math.min(100, s.wait.m / scale * 100)).toFixed(1) + '%';
      }
      return c;
    }

    /* ---------- layout: the column count and text size that fill the stage best ---------- */
    var pages = [[0, services.length]];
    var page = 0;
    var cols = 1, rowsPer = 1;
    var timer = null;

    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      body.classList.remove('strip', 'portrait', 'landscape');
      body.classList.add(W / H > 3.2 ? 'strip' : (H > W ? 'portrait' : 'landscape'));
    }

    function render(a, b) {
      fill(a, b);
      fitNames();
    }
    // A long name or note shrinks (to 72% at most) before it is cut with an ellipsis.
    function fitNames() {
      var nodes = grid.querySelectorAll('.c-name, .c-note, .c-wait');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.style.fontSize = '';
        if (n.scrollWidth > n.clientWidth + 1 && n.clientWidth > 0) {
          var f = Math.max(0.72, n.clientWidth / n.scrollWidth * 0.98);
          var base = parseFloat(window.getComputedStyle(n).fontSize);
          var parent = parseFloat(window.getComputedStyle(n.parentNode).fontSize) || base;
          n.style.fontSize = (base * f / parent).toFixed(3) + 'em';
        }
      }
    }

    /* Does the rendered grid fit at its current size? Every card's content must fit its cell. Then by
       level: 2 = every name and wait fits shrunk to no less than 85%; 1 = waits still fit that way and
       a long name may end in an ellipsis but keeps room for about eight letters; 0 = no width check. */
    var LEVEL_SCORE = [0.6, 0.85, 1];
    function fits(level) {
      var cards = grid.children;
      var px = parseFloat(grid.style.fontSize) || 16;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (c.scrollHeight > c.clientHeight + 1) return false;
        if (!level) continue;
        var nm = c.querySelector('.c-name'), wt = c.querySelector('.c-wait');
        if (wt && wt.clientWidth > 0 && wt.scrollWidth > wt.clientWidth / 0.85 + 1) return false;
        if (!nm || !nm.clientWidth) continue;
        if (level === 2 && nm.scrollWidth > nm.clientWidth / 0.85 + 1) return false;
        // Level 1: a name may be cut, but never to fewer than about eight letters.
        if (level === 1 && nm.clientWidth < Math.min(nm.scrollWidth * 0.85, 4.6 * px)) return false;
      }
      return true;
    }
    function setGrid(c, r, px) {
      cols = c; rowsPer = r;
      grid.style.gridTemplateColumns = 'repeat(' + c + ', minmax(0, 1fr))';
      grid.style.gridTemplateRows = 'repeat(' + r + ', minmax(0, 1fr))';
      grid.style.fontSize = px + 'px';
    }
    function fill(a, b) {
      grid.textContent = '';
      for (var i = a; i < b; i++) grid.appendChild(card(services[i]));
    }
    /* The largest text size in [lo, hi] at which `count` cards fit in c x r cells, or null. A size
       where a name has to shrink counts as 15% smaller when the layouts are compared. */
    function bestSize(c, r, count, lo, hi) {
      setGrid(c, r, lo);
      fill(0, count);
      var level = fits(2) ? 2 : fits(1) ? 1 : fits(0) ? 0 : -1;
      if (level < 0) return null;
      for (var k = 0; k < 14 && hi - lo > 0.25; k++) {
        var mid = (lo + hi) / 2;
        grid.style.fontSize = mid + 'px';
        if (fits(level)) lo = mid; else hi = mid;
      }
      // A layout that has to cut names short only wins when nothing else fits at all.
      return { c: c, r: r, px: lo, score: lo * LEVEL_SCORE[level] - (level ? 0 : 10000) };
    }

    function layout() {
      shape();
      var W = window.innerWidth, H = window.innerHeight;
      var strip = body.classList.contains('strip');
      $('empty').hidden = true;
      if (!services.length) {
        grid.textContent = '';
        $('empty-text').textContent = labels.empty;
        $('empty').hidden = false;
        pages = [[0, 0]];
        drawPager();
        schedule();
        return;
      }
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (sw < 10 || sh < 10) return;
      var gap = Math.round(Math.max(6, Math.min(W, H) * (strip ? 0.06 : 0.022)));
      grid.style.setProperty('--gap', gap + 'px');
      var n = services.length;
      // Readable across a room: never below minPx; a strip card should use most of the strip's height.
      var minPx = strip ? Math.max(14, sh * 0.2) : Math.max(15, 0.026 * Math.min(W, H));
      var maxPx = Math.max(minPx, strip ? sh * 0.42 : 0.062 * Math.min(W, H));
      var maxCols = strip ? 8 : 5;

      var best = null, c, f;
      for (c = 1; c <= Math.min(maxCols, n); c++) {
        var r = Math.ceil(n / c);
        if (strip && r > 1) continue;
        if ((sw - (c - 1) * gap) / c < minPx * 8) break;
        f = bestSize(c, r, n, minPx, maxPx);
        // One more column has to buy a clearly bigger size.
        if (f && (!best || f.score > (best.score > 0 ? best.score * 1.06 : best.score + 1))) best = f;
      }
      if (best && best.score > 0) {
        pages = [[0, n]];
      } else {
        // Too many for one screen: the most cards per page at a comfortable size, then pages.
        var comfy = strip ? minPx * 1.25 : Math.max(minPx, 0.034 * Math.min(W, H));
        var cap = null;
        for (c = 1; c <= maxCols; c++) {
          if ((sw - (c - 1) * gap) / c < comfy * 8) break;
          var rr = strip ? 1 : Math.max(1, Math.floor((sh + gap) / (comfy * 2.6 + gap)));
          for (; rr >= 1; rr--) {
            setGrid(c, rr, comfy);
            fill(0, Math.min(n, c * rr));
            if (fits(1)) break;
          }
          if (rr >= 1 && (!cap || c * rr > cap.c * cap.r)) cap = { c: c, r: rr };
        }
        if (!cap) cap = { c: 1, r: 1 };
        var per = cap.c * cap.r;
        // Spread evenly so the last page is not a lone card.
        var each = Math.ceil(n / Math.ceil(n / per));
        pages = [];
        for (var a = 0; a < n; a += each) pages.push([a, Math.min(n, a + each)]);
        best = bestSize(cap.c, cap.r, Math.min(n, per), Math.min(comfy, minPx), maxPx) || { c: cap.c, r: cap.r, px: minPx };
      }
      setGrid(best.c, best.r, Math.floor(best.px * 4) / 4);
      page = Math.min(page, pages.length - 1);
      render(pages[page][0], pages[page][1]);
      drawPager();
      schedule();
    }

    function drawPager() {
      pager.textContent = '';
      if (pages.length < 2) return;
      for (var i = 0; i < pages.length; i++) pager.appendChild(el('span', i === page ? 'on' : ''));
    }
    var seconds = clampNum(v.page_seconds, 5, 120, 12);
    function schedule() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (pages.length < 2) return;
      timer = setTimeout(function () {
        grid.classList.add('hide');
        timer = setTimeout(function () {
          page = (page + 1) % pages.length;
          render(pages[page][0], pages[page][1]);
          drawPager();
          grid.classList.remove('hide');
          schedule();
        }, 600);
      }, seconds * 1000);
    }

    /* ---------- clock and the last-updated stamp ---------- */
    var showUpdated = v.show_updated !== false && !!updatedAt;
    var lastMinute = '';
    function tick() {
      var now = new Date();
      var t = timeFmt.format(now);
      if (t === lastMinute) return;
      lastMinute = t;
      $('clock').textContent = t;
      $('date').textContent = dateFmt.format(now);
      if (!showUpdated) return;
      var stamp = timeFmt.format(updatedAt);
      if (dayKeyFmt.format(updatedAt) !== dayKeyFmt.format(now)) stamp = shortDateFmt.format(updatedAt) + ', ' + stamp;
      // "Updated {time}" lets a language put the time anywhere; without {time} it goes after the label.
      var text = labels.updated.indexOf('{time}') >= 0 ? labels.updated.split('{time}').join(stamp) : labels.updated + ' ' + stamp;
      // `updated` from the server only moves when a figure changes (an unchanged sync keeps it), so this
      // is "figures unchanged for N minutes": a reminder for staff, not a broken-sync alarm.
      var stale = bound && staleMin > 0 && (now.getTime() - updatedAt.getTime()) > staleMin * 60000;
      $('updated-text').textContent = text;
      $('updated').hidden = false;
      $('updated').classList.toggle('stale', stale);
      var u2 = $('updated-strip');
      u2.querySelector('.updated-strip-text').textContent = text;
      u2.hidden = false;
      u2.classList.toggle('stale', stale);
    }

    tick();
    setInterval(tick, 1000);
    var rt = null;
    window.addEventListener('resize', function () {
      if (rt) clearTimeout(rt);
      rt = setTimeout(layout, 250);
    });
    // Measure with the real fonts, not the fallbacks.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, layout);
    else layout();
  });
})();
