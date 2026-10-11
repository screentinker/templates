/*
 * What's on — ScreenTinker community template. MIT.
 *
 * Reads window.ST only and writes with textContent / createElement. Nothing leaves the page.
 *
 * Where the events come from, in order:
 *   1. ST.data.events, when it is a Calendar (iCal) source: event_N_title/_location/_organizer and,
 *      when the server provides them, event_N_start_iso/_end_iso/_all_day (exact instants). Older
 *      servers give only the pre-formatted event_N_date ("Today, 09:00") and event_N_time
 *      ("09:00 – 10:00"); those are shown as they come, grouped by their day label.
 *   2. ST.data.events, when it is a table (Google Sheet, CSV, Manual table): row{i}_{column} with the
 *      column names set in the settings.
 *   3. The programme typed into the settings, one event per line.
 *
 * The data is a snapshot; the server re-renders the page when the source syncs. The clock, the
 * "now" highlight and the dropping of finished events are worked out here, every few seconds.
 */
(function () {
  'use strict';

  var MAX_EVENTS = 100;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DAY_MS = 86400000;

  /* The board's own words, per language (picked by the primary subtag of the Language setting, or the
     screen's language when that is empty). English is the fallback for a missing word. A word typed
     into the settings always wins. Today / Tomorrow come from Intl first, so any language has them. */
  var STRINGS = {
    en: {
      today: 'Today',
      tomorrow: 'Tomorrow',
      tonight: 'Tonight',
      now: 'Now',
      next: 'Next',
      all_day: 'All day',
      empty: 'Nothing else scheduled',
      private: 'Private event'
    },
    de: {
      today: 'Heute',
      tomorrow: 'Morgen',
      tonight: 'Heute Abend',
      now: 'Jetzt',
      next: 'Als Nächstes',
      all_day: 'Ganztägig',
      empty: 'Keine weiteren Termine',
      private: 'Privater Termin'
    },
    es: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      tonight: 'Esta noche',
      now: 'Ahora',
      next: 'Siguiente',
      all_day: 'Todo el día',
      empty: 'No hay más eventos programados',
      private: 'Evento privado'
    },
    fr: {
      today: 'Aujourd’hui',
      tomorrow: 'Demain',
      tonight: 'Ce soir',
      now: 'En cours',
      next: 'À suivre',
      all_day: 'Toute la journée',
      empty: 'Plus rien de prévu',
      private: 'Événement privé'
    },
    hi: {
      today: 'आज',
      tomorrow: 'कल',
      tonight: 'आज रात',
      now: 'अभी',
      next: 'अगला',
      all_day: 'पूरे दिन',
      empty: 'आगे कुछ निर्धारित नहीं',
      private: 'निजी कार्यक्रम'
    },
    it: {
      today: 'Oggi',
      tomorrow: 'Domani',
      tonight: 'Stasera',
      now: 'Ora',
      next: 'A seguire',
      all_day: 'Tutto il giorno',
      empty: 'Nient’altro in programma',
      private: 'Evento privato'
    },
    ja: {
      today: '今日',
      tomorrow: '明日',
      tonight: '今夜',
      now: '開催中',
      next: '次',
      all_day: '終日',
      empty: 'この後の予定はありません',
      private: '非公開の予定'
    },
    nl: {
      today: 'Vandaag',
      tomorrow: 'Morgen',
      tonight: 'Vanavond',
      now: 'Nu',
      next: 'Hierna',
      all_day: 'Hele dag',
      empty: 'Verder niets gepland',
      private: 'Privé-afspraak'
    },
    pt: {
      today: 'Hoje',
      tomorrow: 'Amanhã',
      tonight: 'Hoje à noite',
      now: 'Agora',
      next: 'A seguir',
      all_day: 'Dia inteiro',
      empty: 'Nada mais programado',
      private: 'Evento privado'
    },
    zh: {
      today: '今天',
      tomorrow: '明天',
      tonight: '今晚',
      now: '进行中',
      next: '下一场',
      all_day: '全天',
      empty: '暂无其他安排',
      private: '私人活动'
    }
  };

  /* A Calendar data source on a released server sends only display text, written in the data source's
     own language setting (English unless set). Its day words and date format (server/lib/data-sources/
     ical-resolver.js) are listed here so the board can read the text back into dates and times and say
     them again in its own language. [intl, today, tomorrow, title of a private event] */
  var SRV = {
    en: ['en-US', 'Today', 'Tomorrow', 'Busy'],
    de: ['de-DE', 'Heute', 'Morgen', 'Belegt'],
    nl: ['nl-NL', 'Vandaag', 'Morgen', 'Bezet'],
    es: ['es-ES', 'Hoy', 'Mañana', 'Ocupado'],
    fr: ['fr-FR', "Aujourd'hui", 'Demain', 'Occupé'],
    pt: ['pt-PT', 'Hoje', 'Amanhã', 'Ocupado'],
    it: ['it-IT', 'Oggi', 'Domani', 'Occupato'],
    hi: ['hi-IN', 'आज', 'कल', 'व्यस्त'],
    ja: ['ja-JP', '今日', '明日', '使用中'],
    zh: ['zh-CN', '今天', '明天', '使用中']
  };

  function str(x) { return x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function clampNum(x, lo, hi, dflt) {
    var n = Number(x);
    if (!isFinite(n)) n = dflt;
    return Math.max(lo, Math.min(hi, Math.round(n)));
  }
  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }
  function capFirst(s, loc) {
    if (!s) return s;
    var c = s.charAt(0);
    try { c = c.toLocaleUpperCase(loc); } catch (e) { c = c.toUpperCase(); }
    return c + s.slice(1);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- direction arrows: a symbol or a word → degrees clockwise from "ahead" ---------- */
  var ARROWS = {
    '↑': 0, '⬆': 0, '⇧': 0, up: 0, ahead: 0, straight: 0, straightahead: 0, forward: 0, n: 0, north: 0, upstairs: 0,
    '↗': 45, '⬈': 45, upright: 45, aheadright: 45, ne: 45,
    '→': 90, '➡': 90, '⇨': 90, right: 90, r: 90, e: 90, east: 90,
    '↘': 135, '⬊': 135, downright: 135, se: 135,
    '↓': 180, '⬇': 180, '⇩': 180, down: 180, back: 180, behind: 180, downstairs: 180, s: 180, south: 180,
    '↙': 225, '⬋': 225, downleft: 225, sw: 225,
    '←': 270, '⬅': 270, '⇦': 270, left: 270, l: 270, w: 270, west: 270,
    '↖': 315, '⬉': 315, upleft: 315, aheadleft: 315, nw: 315
  };
  function arrowAngle(s) {
    var k = str(s).replace(/\uFE0F/g, '');
    if (!k) return -1;
    if (ARROWS[k] !== undefined) return ARROWS[k];
    k = k.toLowerCase().replace(/[\s_\-]+/g, '');
    return ARROWS[k] !== undefined ? ARROWS[k] : -1;
  }
  function arrowNode(angle) {
    var box = el('div', angle < 0 ? 'ar none' : 'ar');
    if (angle < 0) return box;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', 'rotate(' + angle + ' 12 12)');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke', 'currentColor');
    g.setAttribute('stroke-width', '2.8');
    g.setAttribute('stroke-linecap', 'round');
    g.setAttribute('stroke-linejoin', 'round');
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M12 20V4.5M5 11.5l7-7 7 7');
    g.appendChild(p);
    svg.appendChild(g);
    box.appendChild(svg);
    return box;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;

    /* ---------- colours ---------- */
    function rgb(hex) {
      var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str(hex));
      if (!m) return null;
      var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    if (rgb(v.background)) root.style.setProperty('--bg', v.background);
    if (rgb(v.text_color)) root.style.setProperty('--text', v.text_color);
    var acc = rgb(v.accent);
    if (acc) {
      root.style.setProperty('--accent', v.accent);
      root.style.setProperty('--tint', 'rgba(' + acc.join(',') + ',.14)');
      var lum = (0.2126 * acc[0] + 0.7152 * acc[1] + 0.0722 * acc[2]) / 255;
      root.style.setProperty('--on-accent', lum > 0.55 ? '#10151C' : '#FFFFFF');
    }

    $('title').textContent = str(v.title);
    $('subtitle').textContent = str(v.subtitle);
    $('footer').textContent = str(v.footer);
    if (v.logo) { $('logo').src = v.logo; $('logo').hidden = false; }
    var showClock = v.show_clock !== false;
    $('clockbox').hidden = !showClock;

    /* ---------- settings ---------- */
    var locale = str(v.locale) || undefined;
    // The board's language: the Language setting, else the screen's. It picks the built-in words and the
    // lang attribute (hyphenation, CJK line breaking and glyph choice follow it).
    var lang = locale || navigator.language || 'en';
    try { root.lang = lang; } catch (e) { /* ignore */ }
    var T = STRINGS[String(lang).toLowerCase().split(/[-_]/)[0]] || STRINGS.en;
    function tr(key) { return T[key] || STRINGS.en[key]; }
    var tz = str(v.timezone) || undefined;
    var daysAhead = clampNum(v.days_ahead, 1, 14, 3);
    var perPage = clampNum(v.rows_per_page, 2, 20, 8);
    var pageSeconds = clampNum(v.page_seconds, 5, 120, 12);
    var tonightHour = clampNum(v.tonight_hour, 12, 23, 17);
    var nowLabel = str(v.now_label) || tr('now');
    var nextLabel = v.show_next === false ? '' : (str(v.next_label) || tr('next'));
    var allDayLabel = str(v.all_day_label) || tr('all_day');
    var tonightLabel = v.show_tonight === false ? '' : (str(v.tonight_label) || tr('tonight'));

    /* ---------- dates and times, in the venue's timezone ---------- */
    function makeFmt(loc, opts) {
      var o = {}, k;
      for (k in opts) o[k] = opts[k];
      try { return new Intl.DateTimeFormat(loc, o); } catch (e) { /* a bad locale or zone */ }
      if (o.timeZone && o.timeZone !== 'UTC') delete o.timeZone;
      try { return new Intl.DateTimeFormat(loc, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, o); }
    }
    function withZone(opts, utc) {
      var o = {}, k;
      for (k in opts) o[k] = opts[k];
      if (utc) o.timeZone = 'UTC'; else if (tz) o.timeZone = tz;
      return o;
    }
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (v.clock_format === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (v.clock_format === '12') timeOpts.hour12 = true;
    var timeFmt = makeFmt(locale, withZone(timeOpts));
    var headDateFmt = makeFmt(locale, withZone({ weekday: 'long', day: 'numeric', month: 'long' }));
    // Day headings are formatted from a calendar date (noon UTC), so no zone can shift them.
    var longDayFmt = makeFmt(locale, withZone({ weekday: 'long', day: 'numeric', month: 'long' }, true));
    var weekdayFmt = makeFmt(locale, withZone({ weekday: 'long' }, true));
    var dayMonthFmt = makeFmt(locale, withZone({ day: 'numeric', month: 'long' }, true));
    var shortDayFmt = makeFmt(locale, withZone({ weekday: 'short', day: 'numeric', month: 'short' }, true));
    var partsFmt = tz ? makeFmt('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
    if (partsFmt && partsFmt.resolvedOptions().timeZone !== tz && !/^utc$/i.test(tz)) partsFmt = null;   // unknown zone: the screen's clock

    function wall(ms) {
      if (!partsFmt || !partsFmt.formatToParts) {
        var d = new Date(ms);
        return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds() };
      }
      var o = {};
      partsFmt.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
      return { y: +o.year, mo: +o.month, d: +o.day, h: (+o.hour) % 24, mi: +o.minute, s: +o.second };
    }
    function keyOf(w) { return w.y + '-' + pad(w.mo) + '-' + pad(w.d); }
    function dayKeyOf(ms) { return keyOf(wall(ms)); }
    function keyParts(key) { var a = key.split('-'); return { y: +a[0], mo: +a[1], d: +a[2] }; }
    function keyUTC(key) { var p = keyParts(key); return Date.UTC(p.y, p.mo - 1, p.d); }
    function addDays(key, n) {
      var d = new Date(keyUTC(key) + n * DAY_MS);
      return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
    }
    function validKey(y, mo, d) {
      if (!(y > 1900 && y < 3000 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null;
      var t = new Date(Date.UTC(y, mo - 1, d));
      return t.getUTCMonth() === mo - 1 ? y + '-' + pad(mo) + '-' + pad(d) : null;
    }
    // A wall-clock time on a calendar day in the venue's zone → an instant.
    function wallToMs(key, minutes) {
      var p = keyParts(key);
      var h = Math.floor(minutes / 60), mi = minutes % 60;
      if (!partsFmt) return new Date(p.y, p.mo - 1, p.d, h, mi).getTime();
      var guess = Date.UTC(p.y, p.mo - 1, p.d, h, mi);
      function offset(t) { var w = wall(t); return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(t / 1000) * 1000; }
      var o1 = offset(guess), t1 = guess - o1, o2 = offset(t1);
      return o2 === o1 ? t1 : guess - o2;
    }
    function fmtTime(ms) { try { return timeFmt.format(new Date(ms)); } catch (e) { return ''; } }
    function fmtUTC(f, key) { try { return f.format(new Date(keyUTC(key) + DAY_MS / 2)); } catch (e) { return key; } }

    // Today / Tomorrow in the board's language (Intl.RelativeTimeFormat), unless typed in.
    var rtf = null, rtfShort = null;
    try { rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); } catch (e) { rtf = null; }
    try { rtfShort = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'short' }); } catch (e) { rtfShort = null; }
    // Intl first only when the language is one the strings table does not know (so de/ja/… always read the same).
    var known = T !== STRINGS.en || /^en/i.test(lang);
    var todayWord = str(v.today_label) || (known ? tr('today') : (rtf ? capFirst(rtf.format(0, 'day'), locale) : '')) || tr('today');
    var tomorrowWord = str(v.tomorrow_label) || (known ? tr('tomorrow') : (rtf ? capFirst(rtf.format(1, 'day'), locale) : '')) || tr('tomorrow');

    // Is 05/10/2026 the 5th of October here? Ask the locale which comes first.
    var dayFirst = true;
    try {
      var order = makeFmt(locale, {}).formatToParts(new Date(2026, 0, 31)).map(function (p) { return p.type; });
      dayFirst = order.indexOf('day') < order.indexOf('month');
    } catch (e) { dayFirst = true; }

    /* ---------- parsing typed or sheet values ---------- */
    function parseTime(s) {
      var t = str(s).toLowerCase().replace(/\./g, '');
      if (!t) return null;
      var m = /^(\d{1,2})(?:[:h](\d{2}))?\s*(am|pm|a|p)$/.exec(t);
      if (m) {
        var h = +m[1] % 12, mi = m[2] ? +m[2] : 0;
        if (+m[1] > 12 || mi > 59) return null;
        return (m[3].charAt(0) === 'p' ? h + 12 : h) * 60 + mi;
      }
      m = /^(\d{1,2})[:h](\d{2})(?::\d{2})?$/.exec(t) || /^(\d{2})(\d{2})$/.exec(t);
      if (m && +m[1] <= 24 && +m[2] <= 59) return (+m[1] % 24) * 60 + +m[2];
      if (/^(\d{1,2})$/.test(t) && +t <= 23) return +t * 60;
      return null;
    }
    // '' → today, '+2' → in two days, 2026-10-12, 12/10/2026 (day/month order from the locale).
    function parseDate(s, todayKey) {
      var t = str(s).toLowerCase();
      if (!t || t === 'today') return todayKey;
      if (t === 'tomorrow') return addDays(todayKey, 1);
      var m = /^([+-]?)(\d{1,3})$/.exec(t);
      if (m) return addDays(todayKey, (m[1] === '-' ? -1 : 1) * +m[2]);
      m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(t);
      if (m) return validKey(+m[1], +m[2], +m[3]);
      m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})$/.exec(t);
      if (m) {
        var a = +m[1], b = +m[2], y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
        if (a > 12) return validKey(y, b, a);
        if (b > 12) return validKey(y, a, b);
        return dayFirst ? validKey(y, b, a) : validKey(y, a, b);
      }
      var p = Date.parse(str(s));
      if (isFinite(p)) { var d = new Date(p); return validKey(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
      return null;
    }
    // A full ISO date-time in a start cell ("2026-10-12T09:30", with or without an offset).
    function parseIsoDateTime(s) {
      var t = str(s);
      var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(z|[+-]\d{2}:?\d{2})?$/i.exec(t);
      if (!m) return null;
      if (m[6]) { var p = Date.parse(t.replace(' ', 'T')); return isFinite(p) ? p : null; }
      var key = validKey(+m[1], +m[2], +m[3]);
      return key ? wallToMs(key, +m[4] * 60 + +m[5]) : null;
    }

    var seq = 0;
    function makeEvent(title, loc, host, arrow) {
      return { id: 'e' + (seq++), title: title, loc: loc, host: host, angle: arrowAngle(arrow),
               start: null, end: null, hasEnd: false, allDay: false, label: '', timeText: '', today: false };
    }
    /* A typed line or a sheet row → an event with exact instants, or null. */
    function fromCells(dateS, startS, endS, title, loc, host, arrow, todayKey) {
      if (!title) return null;
      var ev = makeEvent(title, loc, host, arrow);
      var iso = parseIsoDateTime(startS);
      if (iso !== null) {
        ev.start = iso;
        var isoEnd = parseIsoDateTime(endS);
        var endMin = isoEnd === null ? parseTime(endS) : null;
        if (isoEnd !== null) { ev.end = isoEnd; ev.hasEnd = true; }
        else if (endMin !== null) {
          ev.end = wallToMs(dayKeyOf(iso), endMin);
          if (ev.end <= iso) ev.end += DAY_MS;
          ev.hasEnd = true;
        } else ev.end = iso + 3600000;
        return ev;
      }
      var key = parseDate(dateS, todayKey);
      if (!key) return null;
      var st = parseTime(startS), en = parseTime(endS);
      if (st === null) {
        ev.allDay = true;
        ev.start = wallToMs(key, 0);
        ev.end = wallToMs(addDays(key, 1), 0);
        return ev;
      }
      ev.start = wallToMs(key, st);
      if (en !== null) {
        ev.end = wallToMs(en > st ? key : addDays(key, 1), en);
        ev.hasEnd = true;
      } else ev.end = ev.start + 3600000;
      return ev;
    }

    function cleanHost(s) {
      var h = str(s).replace(/^mailto:/i, '');
      return h.indexOf('@') !== -1 ? '' : h;   // an e-mail address is not for a public screen
    }

    /* ---------- the three sources ---------- */
    function isCalendar(d) { return d.event_count !== undefined || typeof d.is_busy === 'boolean'; }
    function fromCalendar(d, todayKey) {
      var count = clampNum(d.event_count, 0, MAX_EVENTS, 0);
      var todayCount = clampNum(d.events_today_count, 0, MAX_EVENTS, 0);
      var out = [];
      for (var i = 0; i < count; i++) {
        var p = 'event_' + i + '_';
        var title = str(d[p + 'title']) || str(d[p + 'summary']);
        var timeText = str(d[p + 'time']);
        if (!title && !timeText) continue;
        for (var c in SRV) if (title && SRV[c][3] === title) { title = tr('private'); break; }
        var ev = makeEvent(title || '—', str(d[p + 'location']), cleanHost(d[p + 'organizer_name'] || d[p + 'organizer']), d[p + 'arrow']);
        var si = str(d[p + 'start_iso']), s = si ? Date.parse(si) : NaN;
        if (isFinite(s)) {
          var allDay = d[p + 'all_day'] === true || d[p + 'all_day'] === 'true' || d[p + 'all_day'] === 1;
          var ei = str(d[p + 'end_iso']), e = ei ? Date.parse(ei) : NaN;
          if (allDay) {
            // An all-day event is a calendar date, not an instant: take the date as written.
            var k = /^\d{4}-\d{2}-\d{2}/.test(si) ? si.slice(0, 10) : dayKeyOf(s);
            var ke = /^\d{4}-\d{2}-\d{2}/.test(ei) ? ei.slice(0, 10) : addDays(k, 1);
            if (ke <= k) ke = addDays(k, 1);
            ev.allDay = true; ev.start = wallToMs(k, 0); ev.end = wallToMs(ke, 0);
          } else {
            ev.start = s;
            ev.hasEnd = isFinite(e) && e > s;
            ev.end = ev.hasEnd ? e : s + 3600000;
          }
          out.push(ev);
          continue;
        }
        // Older server: only display strings ("Wed, Oct 7, 9:00 AM", "9:00 AM – 10:00 AM", "All day").
        // Read them back into a day and wall times, so the board says them in its own language and clock.
        var dateText = str(d[p + 'date']);
        ev.allDay = !/\d/.test(timeText);
        var cut = dateText.lastIndexOf(', ');
        var dayText = !ev.allDay && cut > 0 ? dateText.slice(0, cut) : dateText;
        ev.today = i < todayCount;
        var dayKey = ev.today ? todayKey : srvDayKey(dayText, todayKey);
        var parts = timeText.split(/\s*[–—-]\s*/);
        var a = ev.allDay ? null : parseTime(parts[0]), b = ev.allDay ? null : parseTime(parts[1]);
        if (dayKey && (ev.allDay || a !== null)) {
          if (ev.allDay) {
            ev.start = wallToMs(dayKey, 0); ev.end = wallToMs(addDays(dayKey, 1), 0);
          } else {
            ev.start = wallToMs(dayKey, a);
            ev.hasEnd = b !== null;
            ev.end = b !== null ? wallToMs(b > a ? dayKey : addDays(dayKey, 1), b) : ev.start + 3600000;
          }
        } else {
          // Not a date this board can read (a newer wording): group by the label as written.
          ev.label = dayText;
          ev.timeText = timeText;
          if (ev.today && !ev.allDay && a !== null) {
            ev.start = wallToMs(todayKey, a);
            ev.hasEnd = b !== null;
            ev.end = b !== null ? wallToMs(b > a ? todayKey : addDays(todayKey, 1), b) : ev.start + 3600000;
          }
        }
        if (d.is_busy === true && title && title === str(d.current_title) && timeText === str(d.current_time)) ev.serverNow = true;
        out.push(ev);
      }
      return { events: out, formatted: out.some(function (x) { return !!x.label || x.timeText; }) };
    }
    // A day label written by the server → a calendar day, or null. Today / Tomorrow in any language the
    // server speaks, or its short date ("Wed, Oct 7", "Mi., 7. Okt.") for the week before and the weeks ahead.
    var srvLabels = null, srvLabelsFor = '';
    function srvDayKey(text, todayKey) {
      var t = str(text).toLowerCase();
      if (!t) return null;
      var c, i;
      for (c in SRV) {
        if (SRV[c][1].toLowerCase() === t) return todayKey;
        if (SRV[c][2].toLowerCase() === t) return addDays(todayKey, 1);
      }
      if (srvLabelsFor !== todayKey) {
        srvLabels = {}; srvLabelsFor = todayKey;
        for (c in SRV) {
          var f = null;
          try { f = new Intl.DateTimeFormat(SRV[c][0], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { f = null; }
          if (!f) continue;
          for (i = -7; i <= 60; i++) {
            if (i === 0 || i === 1) continue;
            var k = addDays(todayKey, i);
            srvLabels[str(fmtUTC(f, k)).toLowerCase()] = k;
          }
        }
      }
      return srvLabels[t] || null;
    }
    /* A column setting → the key the server gave that column. The server slugs the heading to a-z0-9 and
       names a column whose heading has no Latin letters at all (日付, तारीख) col1, col2, …, so the
       headings (the "columns" value) are matched by name as well. The English heading is tried last,
       so a sheet with English headings keeps working when the settings were filled in another language. */
    function columnKeys(d) {
      var names = str(d.columns) ? String(d.columns).split(', ') : [];
      var seen = {}, out = [];
      names.forEach(function (name, c) {
        var k = slug(name) || 'col' + (c + 1);
        if (seen[k]) { seen[k]++; k = k + '_' + seen[k]; } else seen[k] = 1;
        out.push({ name: str(name).toLowerCase(), key: k });
      });
      return out;
    }
    function colKey(d, cols, setting, english) {
      var tries = [str(setting), english];
      for (var i = 0; i < tries.length; i++) {
        var want = tries[i];
        if (!want) continue;
        var k = slug(want);
        if (k && d['row1_' + k] !== undefined) return k;
        for (var c = 0; c < cols.length; c++) if (cols[c].name === want.toLowerCase()) return cols[c].key;
      }
      return slug(str(setting) || english);
    }
    function tableKeys(d) {
      var cols = columnKeys(d);
      return {
        date: colKey(d, cols, v.date_col, 'Date'), start: colKey(d, cols, v.start_col, 'Start'), end: colKey(d, cols, v.end_col, 'End'),
        title: colKey(d, cols, v.title_col, 'Title'), loc: colKey(d, cols, v.location_col, 'Location'),
        host: colKey(d, cols, v.host_col, 'Host'), arrow: colKey(d, cols, v.arrow_col, 'Arrow')
      };
    }
    function isTable(d, titleKey) { return d.row_count !== undefined && titleKey && (d['row1_' + titleKey] !== undefined || +d.row_count === 0); }
    function fromTable(d, todayKey) {
      var k = tableKeys(d);
      var out = [];
      for (var i = 1; i <= MAX_EVENTS; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.title] === undefined) break;
        var ev = fromCells(d[p + k.date], d[p + k.start], d[p + k.end], str(d[p + k.title]), str(d[p + k.loc]),
          cleanHost(d[p + k.host]), d[p + k.arrow], todayKey);
        if (ev) out.push(ev);
      }
      return { events: out, formatted: false };
    }
    function fromText(todayKey) {
      var out = [];
      String(v.agenda || '').split(/\r?\n/).slice(0, MAX_EVENTS).forEach(function (line) {
        var c = line.split('|');
        var ev = fromCells(c[0], c[1], c[2], str(c[3]), str(c[4]), str(c[5]), c[6], todayKey);
        if (ev) out.push(ev);
      });
      return { events: out, formatted: false };
    }
    function readEvents(todayKey) {
      seq = 0;
      var d = ST.data && ST.data.events;
      if (d && typeof d === 'object') {
        if (isCalendar(d)) return fromCalendar(d, todayKey);
        if (d.row_count !== undefined && isTable(d, tableKeys(d).title)) return fromTable(d, todayKey);
      }
      // No source, or one that is not events (not synced yet, or the wrong kind): the typed programme.
      return fromText(todayKey);
    }

    /* ---------- what to show right now ---------- */
    function dayHeading(key, todayKey, nowW) {
      var diff = Math.round((keyUTC(key) - keyUTC(todayKey)) / DAY_MS);
      if (diff <= 0) {
        return { label: tonightLabel && nowW.h >= tonightHour ? tonightLabel : todayWord, date: fmtUTC(longDayFmt, key), mini: '' };
      }
      if (diff === 1) return { label: tomorrowWord, date: fmtUTC(longDayFmt, key), mini: tomorrowWord };
      return { label: capFirst(fmtUTC(weekdayFmt, key), locale), date: fmtUTC(dayMonthFmt, key), mini: fmtUTC(shortDayFmt, key) };
    }

    function build(now) {
      var nowW = wall(now);
      var todayKey = keyOf(nowW);
      var lastKey = addDays(todayKey, daysAhead - 1);
      var startOfToday = wallToMs(todayKey, 0);
      var src = readEvents(todayKey);
      var list = src.events.filter(function (ev) { return ev.end === null || ev.end > now; });
      if (!src.formatted) list.sort(function (a, b) { return a.start - b.start || a.end - b.end; });

      var days = [], byKey = {}, labelDays = 0;
      list.forEach(function (ev) {
        var key, head;
        if (ev.start !== null && !ev.label) {
          key = ev.start < startOfToday ? todayKey : dayKeyOf(ev.start);
          if (key > lastKey) return;
        } else if (ev.today) {
          key = todayKey;
        } else {
          key = 'L:' + ev.label;
        }
        if (!byKey[key]) {
          if (key.charAt(0) === 'L') {
            if (++labelDays + (byKey[todayKey] ? 1 : 0) > daysAhead) return;
            head = { label: ev.label, date: '', mini: ev.label };
          } else head = dayHeading(key, todayKey, nowW);
          byKey[key] = { key: key, today: key === todayKey, head: head, events: [] };
          days.push(byKey[key]);
        }
        ev.isNow = !ev.allDay && (ev.serverNow || (ev.start !== null && ev.start <= now && ev.end > now));
        ev.day = byKey[key];
        byKey[key].events.push(ev);
      });
      // "Next": the first session today that has not started.
      if (nextLabel && days.length && days[0].today) {
        for (var i = 0; i < days[0].events.length; i++) {
          var e = days[0].events[i];
          if (!e.isNow && !e.allDay && e.start !== null && e.start > now) { e.isNext = true; break; }
        }
      }
      return { days: days, todayKey: todayKey, now: now };
    }

    /* ---------- drawing ---------- */
    var leadEl = $('lead'), laterEl = $('later'), leadCol = $('lead-col'), laterCol = $('later-col');
    var board = $('board'), pager = $('pager');
    var dyn = [];          // live bits of the page on screen: progress bars and "in 12 min"
    var hasArrows = false;

    function soonText(ev, now) {
      if (!rtfShort || ev.start === null) return '';
      var mins = Math.ceil((ev.start - now) / 60000);
      if (mins < 1 || mins > 120) return '';
      return rtfShort.format(mins, 'minute').replace(/\.$/, '');
    }
    function progress(ev, now) {
      if (ev.start === null || ev.end <= ev.start) return 0;
      return Math.max(0, Math.min(1, (now - ev.start) / (ev.end - ev.start)));
    }

    function eventNode(ev, now, strip) {
      var n = el('div', 'ev' + (ev.isNow ? ' now' : '') + (ev.isNext ? ' next' : ''));
      var t = el('div', 't');
      if (strip && ev.day.head.mini) t.appendChild(el('div', 'day-mini', ev.day.head.mini));
      var st, en = '';
      if (ev.allDay) st = allDayLabel;
      else if (ev.timeText) {
        var parts = ev.timeText.split(/\s+[–—-]\s+/);
        st = parts[0]; en = parts[1] ? '– ' + parts[1] : '';
      } else {
        st = fmtTime(ev.start);
        en = ev.hasEnd ? '– ' + fmtTime(ev.end) : '';
      }
      t.appendChild(el('div', 'st', st));
      if (en) t.appendChild(el('div', 'en', en));
      n.appendChild(t);

      var main = el('div', 'main');
      var ti = el('div', 'ti', ev.title);
      ti.dir = 'auto';
      main.appendChild(ti);
      var meta = el('div', 'meta');
      if (ev.isNow) meta.appendChild(el('span', 'tag', nowLabel));
      else if (ev.isNext) {
        meta.appendChild(el('span', 'tag soft', nextLabel));
        var soon = el('span', 'host soon', soonText(ev, now));
        meta.appendChild(soon);
        dyn.push({ kind: 'soon', node: soon, ev: ev });
      }
      if (ev.loc) { var lo = el('span', 'loc', ev.loc); lo.dir = 'auto'; meta.appendChild(lo); }
      if (ev.host) { var ho = el('span', 'host', ev.host); ho.dir = 'auto'; meta.appendChild(ho); }
      main.appendChild(meta);
      n.appendChild(main);
      if (hasArrows) n.appendChild(arrowNode(ev.angle));
      if (ev.isNow && ev.start !== null) {
        var bar = el('div', 'prog'), fill = el('i');
        fill.style.width = (progress(ev, now) * 100).toFixed(1) + '%';
        bar.appendChild(fill);
        n.appendChild(bar);
        dyn.push({ kind: 'prog', node: fill, ev: ev });
      }
      return n;
    }
    function headingNode(day) {
      var h = el('div', 'dh');
      h.appendChild(el('span', 'dl', day.head.label));
      if (day.head.date) h.appendChild(el('span', 'dd', day.head.date));
      return h;
    }

    // items: [{h: day} | {ev: event}]; a page that starts mid-day repeats that day's heading.
    function renderRange(listEl, items, a, b, now, strip) {
      listEl.textContent = '';
      listEl.style.removeProperty('--tw');
      for (var i = a; i < b; i++) {
        var it = items[i];
        if (it.h) listEl.appendChild(headingNode(it.h));
        else {
          if (i === a && !strip) listEl.appendChild(headingNode(it.ev.day));
          listEl.appendChild(eventNode(it.ev, now, strip));
        }
      }
      // One time column for the whole list: the widest time decides it.
      if (!strip) {
        var ts = listEl.querySelectorAll('.t'), w = 0;
        for (var j = 0; j < ts.length; j++) w = Math.max(w, ts[j].offsetWidth);
        if (w) listEl.style.setProperty('--tw', Math.ceil(w + 1) + 'px');
      }
    }
    function overflows(listEl, strip) {
      if (strip) return listEl.scrollWidth > listEl.clientWidth + 1 || listEl.scrollHeight > listEl.clientHeight + 1;
      return listEl.scrollHeight > listEl.clientHeight + 1;
    }
    function truncated(listEl) {
      var ts = listEl.querySelectorAll('.ti');
      for (var i = 0; i < ts.length; i++) if (ts[i].scrollHeight > ts[i].clientHeight + 1) return true;
      return false;
    }
    function contentHeight(listEl) {
      var last = listEl.lastElementChild;
      return last ? last.offsetTop + last.offsetHeight : 0;
    }
    function eventsIn(items, a, b) { var n = 0; for (var i = a; i < b; i++) if (items[i].ev) n++; return n; }

    /* The size and the pages for one column. The first page (up to `perPage` events) decides the size:
       as large as fits between minPx and maxPx. The rest is cut greedily at that size. */
    function fitColumn(listEl, items, minPx, maxPx, now, strip) {
      if (!items.length) return { px: minPx, pages: [] };
      dyn = [];
      var firstEnd = 0, seen = 0;
      while (firstEnd < items.length && (seen < (strip ? 1 : perPage) || !items[firstEnd].ev)) {
        if (items[firstEnd].ev) seen++;
        firstEnd++;
      }
      var strict = false;
      function fits(a, b, px) {
        listEl.style.fontSize = px + 'px';
        renderRange(listEl, items, a, b, now, strip);
        return !overflows(listEl, strip) && (!strict || !truncated(listEl));
      }
      // Prefer a size at which no title is cut short; give that up only when nothing else fits.
      strict = !strip;
      if (strict && !fits(0, firstEnd, minPx)) strict = false;
      var lo = minPx, hi = maxPx, px;
      if (fits(0, firstEnd, hi)) px = hi;
      else if (!fits(0, firstEnd, lo)) px = lo;
      else {
        for (var k = 0; k < 12 && hi - lo > 0.4; k++) {
          var mid = (lo + hi) / 2;
          if (fits(0, firstEnd, mid)) lo = mid; else hi = mid;
        }
        px = lo;
      }
      px = Math.floor(px * 2) / 2;
      listEl.style.fontSize = px + 'px';
      var pages = [], start = 0;
      while (start < items.length) {
        var end = start + 1;
        while (end < items.length && (!items[end].ev || eventsIn(items, start, end + 1) <= perPage) && fits(start, end + 1, px)) end++;
        // A heading never ends a page; nor does a page end on nothing but headings.
        while (end < items.length && end - start > 1 && items[end - 1].h) end--;
        pages.push([start, end]);
        start = end;
      }
      return { px: px, pages: pages };
    }

    var state = null, fitL = null, fitR = null, page = 0, timer = null, fadeT = null;

    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var cls = W / H > 3.2 ? 'strip' : (H > W ? 'portrait' : 'landscape');
      body.classList.remove('strip', 'portrait', 'landscape');
      body.classList.add(cls);
      return cls;
    }

    function layout() {
      var now = Date.now();
      state = build(now);
      var mode = shape();
      var strip = mode === 'strip';
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var U = Math.min(H / 100, W * 0.009);
      var days = state.days;
      var empty = !days.length;
      $('empty').hidden = !empty;
      leadCol.hidden = empty;
      laterCol.hidden = empty;
      clearTimeout(timer); clearTimeout(fadeT);
      leadEl.classList.remove('hide'); laterEl.classList.remove('hide');
      page = 0;
      if (empty) {
        var head = dayHeading(state.todayKey, state.todayKey, wall(now));
        $('empty-day').textContent = head.label;
        $('empty-text').textContent = str(v.empty_label) || tr('empty');
        leadEl.textContent = ''; laterEl.textContent = '';
        fitL = fitR = null;
        drawPager();
        return;
      }
      hasArrows = days.some(function (d) { return d.events.some(function (e) { return e.angle >= 0; }); });
      body.classList.toggle('no-arrows', !hasArrows);

      var leadItems = [], laterItems = [];
      days.forEach(function (d, i) {
        var target = strip || i === 0 ? leadItems : laterItems;
        if (!strip) target.push({ h: d });
        d.events.forEach(function (e) { target.push({ ev: e }); });
      });
      body.classList.toggle('single', !laterItems.length);

      leadCol.style.height = '';
      if (strip) {
        var bh = board.clientHeight;
        fitL = fitColumn(leadEl, leadItems, Math.max(11, bh / 6.6), Math.max(12, bh / 5.3), now, true);
        fitR = null;
      } else if (mode === 'portrait') {
        var boardH = board.clientHeight;
        if (laterItems.length) leadCol.style.height = Math.floor(boardH * 0.6) + 'px';
        fitL = fitColumn(leadEl, leadItems, 2.5 * U, 4.6 * U, now, false);
        if (laterItems.length) {
          // Give the later days whatever the first day does not need.
          var need = 0;
          for (var p = 0; p < fitL.pages.length; p++) {
            renderRange(leadEl, leadItems, fitL.pages[p][0], fitL.pages[p][1], now, false);
            need = Math.max(need, contentHeight(leadEl));
          }
          leadCol.style.height = Math.ceil(need + 2) + 'px';
          fitR = fitColumn(laterEl, laterItems, 2.0 * U, 3.1 * U, now, false);
        } else fitR = null;
      } else {
        // A first day with only one or two events left gets them larger, so the column does not look empty.
        var few = eventsIn(leadItems, 0, leadItems.length) <= 2;
        fitL = fitColumn(leadEl, leadItems, 2.6 * U, (few ? 5.4 : 4.6) * U, now, false);
        fitR = laterItems.length ? fitColumn(laterEl, laterItems, 2.0 * U, Math.min(3.1 * U, fitL.px * 0.75), now, false) : null;
      }
      state.leadItems = leadItems;
      state.laterItems = laterItems;
      showPage(now);
      schedule();
    }

    function pageCount() { return Math.max(fitL ? fitL.pages.length : 0, fitR ? fitR.pages.length : 0); }
    function showPage(now) {
      dyn = [];
      var strip = body.classList.contains('strip');
      if (fitL && fitL.pages.length) {
        var a = fitL.pages[page % fitL.pages.length];
        leadEl.style.fontSize = fitL.px + 'px';
        renderRange(leadEl, state.leadItems, a[0], a[1], now, strip);
      }
      if (fitR && fitR.pages.length) {
        var b = fitR.pages[page % fitR.pages.length];
        laterEl.style.fontSize = fitR.px + 'px';
        renderRange(laterEl, state.laterItems, b[0], b[1], now, false);
      }
      drawPager();
    }
    function drawPager() {
      pager.textContent = '';
      var n = pageCount();
      if (n < 2) return;
      for (var i = 0; i < n; i++) pager.appendChild(el('span', i === page % n ? 'on' : ''));
    }
    function schedule() {
      clearTimeout(timer);
      if (pageCount() < 2) return;
      timer = setTimeout(function () {
        var multiL = fitL && fitL.pages.length > 1, multiR = fitR && fitR.pages.length > 1;
        if (multiL) leadEl.classList.add('hide');
        if (multiR) laterEl.classList.add('hide');
        fadeT = setTimeout(function () {
          page = (page + 1) % pageCount();
          showPage(Date.now());
          leadEl.classList.remove('hide');
          laterEl.classList.remove('hide');
          schedule();
        }, 600);
      }, pageSeconds * 1000);
    }

    /* ---------- time passing ---------- */
    // What would change the layout: which events are listed, which is on now, the day headings.
    function signature(s) {
      return s.days.map(function (d) {
        return d.key + '|' + d.head.label + '|' + d.events.map(function (e) {
          return e.id + (e.isNow ? '*' : '') + (e.isNext ? '>' : '');
        }).join(',');
      }).join(';') + '@' + window.innerWidth + 'x' + window.innerHeight;
    }
    var lastSig = '';
    function refresh(force) {
      var now = Date.now();
      var s = build(now);
      var sig = signature(s);
      if (force || sig !== lastSig) {
        lastSig = sig;
        layout();
        return;
      }
      dyn.forEach(function (d) {
        if (d.kind === 'prog') d.node.style.width = (progress(d.ev, now) * 100).toFixed(1) + '%';
        else if (d.kind === 'soon') d.node.textContent = soonText(d.ev, now);
      });
    }

    var lastClock = '';
    function tick() {
      if (!showClock) return;
      var now = new Date();
      var t = fmtTime(now.getTime());
      if (t === lastClock) return;
      lastClock = t;
      $('clock').textContent = t;
      try { $('date').textContent = headDateFmt.format(now); } catch (e) { $('date').textContent = ''; }
    }

    tick();
    refresh(true);
    setInterval(tick, 1000);
    setInterval(function () { refresh(false); }, 15000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { refresh(true); }, function () { refresh(true); });
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { refresh(true); }, 250);
    });
  });
})();
