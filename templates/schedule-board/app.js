/*
 * Schedule board — ScreenTinker community template. MIT.
 *
 * A now / next board for anything that runs to a timetable: school bells, gym classes, factory
 * shifts and breaks, service times. The schedule comes from a table data source when one is
 * connected (Google Sheet, CSV, Manual table: columns Days, Start, End, Title, Room, Host and an
 * optional Schedule), otherwise from the typed-in lines, otherwise from the preset's sample.
 *
 * Times are wall-clock times in the chosen timezone. Internally everything is "absolute minutes":
 * whole days since 1970-01-01 times 1440, plus the minute of the day. Formatting those minutes as if
 * they were UTC gives back the wall-clock time, so one set of Intl formatters (timeZone: 'UTC') turns
 * them into localized times, weekdays and dates with no hard-coded names.
 *
 * Reads window.ST only, writes with textContent, fetches nothing, uses no eval.
 */
(function () {
  'use strict';

  var MAX_BLOCKS = 200;
  var MAX_ROWS = 100;
  var MAX_SCHEDULES = 8;
  var PRESETS = window.SCHEDULE_PRESETS || {};
  var I18N = window.SCHEDULE_I18N || { langs: [], words: {}, terms: {} };

  function str(x) { return x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null && text !== '') e.textContent = text;
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function setText(n, t) { if (n.textContent !== t) n.textContent = t; }

  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  /* ---------- parsing: days ---------- */
  var FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var TWO = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };

  // "mon", "Monday", "Mondays", "tues", "thur", "mo", "1" (ISO, Monday) … "7" or "0" (Sunday) → 0–6.
  function dayIndex(s) {
    s = s.replace(/\.$/, '');
    if (/^[0-7]$/.test(s)) return Number(s) % 7;
    if (TWO.hasOwnProperty(s)) return TWO[s];
    if (!/^[a-z]{3,}$/.test(s)) return -1;
    var bare = s.replace(/s$/, '');
    for (var i = 0; i < 7; i++) {
      if (FULL[i].slice(0, 3) === s.slice(0, 3) && (FULL[i].indexOf(s) === 0 || FULL[i].indexOf(bare) === 0)) return i;
    }
    return -1;
  }
  function allDays() { return { mask: [true, true, true, true, true, true, true], dates: [] }; }

  // "Mon-Fri", "Tue,Thu", "Sat-Sun", "Fri-Mon", "weekdays", "weekends", "daily", "2026-12-24", empty → every day.
  // Returns null when nothing in it is a day.
  function parseDays(s) {
    var t = str(s).toLowerCase();
    if (!t || /^(daily|every ?day|all|all days|all week|\*)$/.test(t)) return allDays();
    var mask = [false, false, false, false, false, false, false];
    var dates = [];
    var any = false;
    t.split(/\s*[,;\/&+]\s*|\s+and\s+|\s+(?=\d{4}-)/).forEach(function (p) {
      p = p.trim();
      if (!p) return;
      if (/^(daily|every ?day|all)$/.test(p)) { mask = allDays().mask; any = true; return; }
      if (/^week ?days?$/.test(p)) { for (var w = 1; w <= 5; w++) mask[w] = true; any = true; return; }
      if (/^week ?ends?$/.test(p)) { mask[0] = mask[6] = true; any = true; return; }
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) { dates.push(p); any = true; return; }
      var r = p.split(/\s*(?:-|\u2013|\u2014|\bto\b|\bthru\b|\bthrough\b)\s*/);
      if (r.length === 2) {
        var a = dayIndex(r[0]), b = dayIndex(r[1]);
        if (a >= 0 && b >= 0) {
          for (var i = a, guard = 0; guard < 7; i = (i + 1) % 7, guard++) { mask[i] = true; if (i === b) break; }
          any = true;
          return;
        }
      }
      var d = dayIndex(p);
      if (d >= 0) { mask[d] = true; any = true; }
    });
    return any ? { mask: mask, dates: dates } : null;
  }

  /* ---------- parsing: times ---------- */
  // "08:00", "8:00", "8.00", "8h00", "0800", "8", "8:00 am", "12 pm", "8:00:00 AM", a sheet's day fraction "0.3333".
  // Returns minutes after midnight (0–1440) or null.
  function parseTime(s) {
    var t = str(s).toLowerCase().replace(/\s+/g, '').replace(/\./g, function (m, i, all) {
      // keep the dot in "8.30" and "0.3333", drop it in "a.m."
      return /\d/.test(all.charAt(i - 1)) && /\d/.test(all.charAt(i + 1)) ? '.' : '';
    });
    if (!t) return null;
    if (/^0?\.\d+$/.test(t)) return Math.round(parseFloat(t) * 1440);
    var m = /^(\d{1,2})(?:[:.h]?(\d{2}))?(?::\d{2})?(am|pm|a|p)?$/.exec(t);
    if (!m) return null;
    var h = Number(m[1]), mi = m[2] ? Number(m[2]) : 0;
    if (mi > 59) return null;
    if (m[3]) {
      if (h < 1 || h > 12) return null;
      h = h % 12 + (m[3].charAt(0) === 'p' ? 12 : 0);
    }
    if (h > 24 || (h === 24 && mi > 0)) return null;
    return h * 60 + mi;
  }
  // "08:00-08:50", "8:00 am – 8:50 am", "22:00 to 06:00", or a single time. { s, e|null } or null.
  function parseRange(s) {
    var t = str(s);
    if (!t) return null;
    var parts = t.split(/\s*(?:-|\u2013|\u2014|\bto\b|\buntil\b|\btill\b)\s*/i);
    if (parts.length === 1) { var one = parseTime(parts[0]); return one === null ? null : { s: one, e: null }; }
    if (parts.length !== 2) return null;
    var a = parseTime(parts[0]), b = parseTime(parts[1]);
    if (a === null || b === null) return null;
    return { s: a, e: b };
  }

  /* ---------- blocks and schedules ---------- */
  var order = 0;
  function makeBlock(days, range, title, room, host) {
    var d = parseDays(days);
    if (!d || !range || range.s === null) return null;
    title = str(title);
    if (!title) return null;
    var dur = null;
    if (range.e !== null && range.e !== undefined) {
      dur = range.e - range.s;
      if (dur <= 0) dur += 1440;          // past midnight: a night shift 22:00–06:00
    }
    return { mask: d.mask, dates: d.dates, s: Math.min(range.s, 1439), dur: dur,
             title: title.slice(0, 120), room: str(room).slice(0, 80), host: str(host).slice(0, 80), order: order++ };
  }
  // A block typed without an end runs until the next block that starts later on one of its days, else an hour.
  function fillEnds(blocks) {
    blocks.forEach(function (b) {
      if (b.dur !== null) return;
      var best = null;
      blocks.forEach(function (o) {
        if (o === b || o.s <= b.s) return;
        var shares = false;
        for (var i = 0; i < 7; i++) if (b.mask[i] && o.mask[i]) shares = true;
        if (shares && (best === null || o.s < best)) best = o.s;
      });
      b.dur = best !== null ? best - b.s : 60;
    });
    return blocks;
  }

  // Typed lines. "[Name]", "# Name" or "== Name ==" starts a new schedule.
  function fromText(text) {
    var schedules = [];
    var cur = null;
    String(text === null || text === undefined ? '' : text).split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;
      var h = /^\[(.+)\]$/.exec(line) || /^#+\s*(.+)$/.exec(line) || /^={2,}\s*(.+?)\s*=*$/.exec(line);
      if (h) {
        if (schedules.length >= MAX_SCHEDULES) { cur = null; return; }
        cur = { name: str(h[1]).slice(0, 60), blocks: [] };
        schedules.push(cur);
        return;
      }
      var c = line.split(/\s*\|\s*|\t+/);
      if (c.length < 2) return;
      if (!cur) {
        if (schedules.length >= MAX_SCHEDULES) return;
        cur = { name: '', blocks: [] };
        schedules.push(cur);
      }
      if (cur.blocks.length >= MAX_BLOCKS) return;
      // The days field may be left out: "08:00-08:50 | Period 1 | Room 12" runs every day.
      var b = parseRange(c[0]) && !parseDays(c[0])
        ? makeBlock('', parseRange(c[0]), c[1], c[2], c[3])
        : makeBlock(c[0], parseRange(c[1]), c[2], c[3], c[4]);
      if (b) cur.blocks.push(b);
    });
    return schedules.filter(function (s) { return s.blocks.length; });
  }

  // A table data source: row{i}_{column} keys. Column names are matched loosely.
  var ALIASES = {
    days: ['days', 'day', 'weekdays', 'weekday', 'when', 'date', 'dates'],
    start: ['start', 'starts', 'start_time', 'from', 'begin', 'begins'],
    end: ['end', 'ends', 'end_time', 'to', 'until', 'finish', 'finishes'],
    time: ['time', 'times', 'hours'],
    title: ['title', 'name', 'what', 'event', 'class', 'period', 'session', 'activity', 'shift', 'service', 'lesson', 'subject'],
    room: ['room', 'location', 'where', 'place', 'venue', 'area', 'studio'],
    host: ['host', 'teacher', 'instructor', 'leader', 'lead', 'who', 'presenter', 'staff', 'coach', 'trainer'],
    schedule: ['schedule', 'schedule_name', 'timetable', 'plan', 'program', 'programme']
  };
  function fromSource(d) {
    if (!d || typeof d !== 'object') return null;
    var k = {};
    Object.keys(ALIASES).forEach(function (name) {
      var list = ALIASES[name];
      for (var i = 0; i < list.length; i++) {
        if (d['row1_' + list[i]] !== undefined) { k[name] = list[i]; return; }
      }
    });
    if (!k.title || (!k.start && !k.time)) return null;
    var schedules = [];
    var byName = {};
    for (var i = 1; i <= MAX_ROWS; i++) {
      var p = 'row' + i + '_';
      if (d[p + k.title] === undefined) break;
      // The server caps what reaches a template; a row cut off part-way is skipped, not guessed at.
      if (k.start && d[p + k.start] === undefined) break;
      var range;
      if (k.start) {
        var s = parseTime(d[p + k.start]);
        var e = k.end ? parseTime(d[p + k.end]) : null;
        range = s === null ? null : { s: s, e: e };
      } else {
        range = parseRange(d[p + k.time]);
      }
      var b = makeBlock(k.days ? d[p + k.days] : '', range, d[p + k.title], k.room ? d[p + k.room] : '', k.host ? d[p + k.host] : '');
      if (!b) continue;
      var name = k.schedule ? str(d[p + k.schedule]).slice(0, 60) : '';
      var key = name.toLowerCase();
      if (!byName[key]) {
        if (schedules.length >= MAX_SCHEDULES) continue;
        byName[key] = { name: name, blocks: [] };
        schedules.push(byName[key]);
      }
      if (byName[key].blocks.length < MAX_BLOCKS) byName[key].blocks.push(b);
    }
    return schedules;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var presetKey = PRESETS[v.preset] ? v.preset : 'school';
    var base = PRESETS[presetKey];

    /* ---------- language: the preset's words and the sample in the screen's language ---------- */
    var lang = str(v.locale) || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    try { root.lang = lang; } catch (e) { /* an odd tag: keep lang="en" */ }
    var primary = String(lang).split(/[-_]/)[0].toLowerCase();
    var langIdx = I18N.langs.indexOf(primary);
    var words = I18N.words[primary] || {};
    var preset = {};
    [base, { sep: ', ' }, words.common, words[presetKey]].forEach(function (o) {
      if (o) for (var k in o) if (o.hasOwnProperty(k)) preset[k] = o[k];
    });
    // One phrase of the sample: as a whole, as " · " parts, with its number or letter as {n}
    // ("Room 12" → "Room {n}"), or with everything after its first word as {n} ("Ms Patel").
    function term(key) {
      var t = I18N.terms[presetKey + ':' + key] || I18N.terms[key];
      return t && t[langIdx] ? t[langIdx] : null;
    }
    function tr(s) {
      if (langIdx < 0 || !s) return s;
      var hit = term(s);
      if (hit) return hit;
      if (s.indexOf(' \u00b7 ') > 0) return s.split(' \u00b7 ').map(tr).join(' \u00b7 ');
      var w = s.split(' ');
      for (var i = 0; i < w.length; i++) {
        if (!/^(\d+[A-Z]?|[A-Z](\u2013[A-Z])?)$/.test(w[i])) continue;
        var n = w[i];
        w[i] = '{n}';
        hit = term(w.join(' '));
        if (hit) return hit.replace('{n}', n);
        w[i] = n;
      }
      if (w.length > 1) {
        hit = term(w[0] + ' {n}');
        if (hit) return hit.replace('{n}', w.slice(1).join(' '));
      }
      return s;
    }

    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.warn_color) root.style.setProperty('--warn', v.warn_color);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    body.setAttribute('data-font', str(v.font) || 'archivo');

    var view = /^(split|focus|list)$/.test(v.view) ? v.view : 'split';
    var showWhere = v.show_where !== false;
    var warnSec = Math.max(0, Math.min(60, Number(v.warn_minutes) || 0)) * 60;

    function label(param, fallback) { return str(v[param]) || fallback; }
    var L = {
      now: label('now_label', preset.now),
      next: label('next_label', preset.next),
      then: label('then_label', preset.then),
      ends: label('ends_label', preset.ends),
      starts: label('starts_label', preset.starts),
      offToday: label('offhours_today', preset.offToday),
      offLater: label('offhours_later', preset.offLater),
      empty: label('empty_text', preset.empty)
    };

    /* ---------- the schedule ---------- */
    var schedules = null;
    var sample = false;
    var src = ST.data && ST.data.schedule_source;
    var fromSrc = fromSource(src);
    if (fromSrc && fromSrc.length) schedules = fromSrc;
    // Typed lines that parse to nothing show the "nothing scheduled" message, not the sample.
    if (!schedules && str(v.schedule)) schedules = fromText(v.schedule);
    if (!schedules) {
      schedules = fromText((preset.sample || []).join('\n'));
      sample = true;
      schedules.forEach(function (sc) {
        sc.name = tr(sc.name);
        sc.blocks.forEach(function (b) { b.title = tr(b.title); b.room = tr(b.room); b.host = tr(b.host); });
      });
    }
    var pick = Math.max(1, Math.min(MAX_SCHEDULES, parseInt(v.active_schedule, 10) || 1));
    var active = schedules[pick - 1] || schedules[0] || { name: '', blocks: [] };
    var blocks = fillEnds(active.blocks);

    /* ---------- header ---------- */
    var titleText = str(v.title) || (sample ? preset.org : preset.heading);
    var subParts = [];
    if (str(v.subtitle)) subParts.push(str(v.subtitle));
    else if (sample && preset.orgSub) subParts.push(preset.orgSub);
    if (active.name && (schedules.length > 1 || !str(v.subtitle))) subParts.push(active.name);
    $('title').textContent = titleText;
    $('subtitle').textContent = subParts.join(' \u00b7 ');
    if (v.logo) {
      $('logo').src = v.logo;
      $('logo').hidden = false;
    } else if (v.show_badge !== false && titleText) {
      var initials = titleText.split(/\s+/).filter(function (w) { return /^[A-Za-z0-9\u00c0-\u024f]/.test(w); })
        .slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
      if (initials) { $('badge').textContent = initials; $('badge').hidden = false; }
    }

    /* ---------- Intl ---------- */
    var locale = str(v.locale) || undefined;
    var tz = str(v.timezone) || undefined;
    var fmtMode = v.clock_format || 'auto';

    function makeFmt(opts) {
      var o = { timeZone: 'UTC' };
      for (var k in opts) o[k] = opts[k];
      try { return new Intl.DateTimeFormat(locale, o); }
      catch (e) { return new Intl.DateTimeFormat(undefined, o); }
    }
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (fmtMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (fmtMode === '12') timeOpts.hour12 = true;
    var timeFmt = makeFmt(timeOpts);
    var dateFmt = makeFmt({ weekday: 'long', day: 'numeric', month: 'long' });
    var weekdayFmt = makeFmt({ weekday: 'long' });
    var monthDayFmt = makeFmt({ day: 'numeric', month: 'long' });
    var shortDateFmt = makeFmt({ weekday: 'short', day: 'numeric', month: 'short' });
    if (fmtMode === 'off') $('clock').hidden = true;

    var rtf = null;
    try { if (Intl.RelativeTimeFormat) rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); } catch (e) { rtf = null; }

    function capFirst(s) { return s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s; }
    function fmtTime(absMin) { return timeFmt.format(new Date(Math.round(absMin) * 60000)); }
    function fmtDay(dn, f) { return f.format(new Date(dn * 86400000 + 43200000)); }
    // "8:30 – 9:15 AM" where the language does that (formatRange), else "8:30 AM – 9:15 AM".
    function fmtSpan(o) {
      var a = new Date(Math.round(o.s) * 60000), b = new Date(Math.round(o.e) * 60000);
      // (only within one day: across midnight formatRange adds both dates)
      if (timeFmt.formatRange && Math.floor(o.s / 1440) === Math.floor((o.e - 1) / 1440)) {
        try { return timeFmt.formatRange(a, b); } catch (e) { /* fall through */ }
      }
      return timeFmt.format(a) + ' \u2013 ' + timeFmt.format(b);
    }

    // Unit-formatted numbers ("26 minutes", "1 hr", "2 days") split into number and unit parts.
    var unitCache = {};
    var FALLBACK = { second: 's', minute: 'min', hour: 'h', day: 'd' };
    function unitParts(n, unit, display) {
      var key = unit + display;
      if (unitCache[key] === undefined) {
        try { unitCache[key] = new Intl.NumberFormat(locale, { style: 'unit', unit: unit, unitDisplay: display }); }
        catch (e) { unitCache[key] = null; }
      }
      var f = unitCache[key];
      if (f && f.formatToParts) {
        return f.formatToParts(n).map(function (p) {
          return { big: p.type === 'integer' || p.type === 'group' || p.type === 'decimal' || p.type === 'fraction', text: p.value };
        });
      }
      return [{ big: true, text: String(n) }, { big: false, text: ' ' + FALLBACK[unit] }];
    }
    // Seconds → parts: under a minute in seconds, under an hour in minutes, then hours and minutes, then days.
    function durationParts(sec, short) {
      var disp = short ? 'short' : 'long';
      sec = Math.max(0, Math.round(sec));
      if (sec < 60) return unitParts(sec, 'second', disp);
      var m = Math.ceil(sec / 60);
      if (m < 60) return unitParts(m, 'minute', disp);
      var gap = [{ big: false, text: '\u2002' }];
      if (m < 1440) {
        var h = Math.floor(m / 60), mm = m % 60;
        return mm ? unitParts(h, 'hour', 'short').concat(gap, unitParts(mm, 'minute', 'short')) : unitParts(h, 'hour', disp);
      }
      var d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60);
      return hh ? unitParts(d, 'day', disp).concat(gap, unitParts(hh, 'hour', 'short')) : unitParts(d, 'day', disp);
    }
    function durationText(sec, short) {
      return durationParts(sec, short).map(function (p) { return p.text; }).join('').replace(/\u2002/g, ' ');
    }
    function whenText(dn, targetDn) {
      var diff = targetDn - dn;
      if (diff === 1 && rtf) return rtf.format(1, 'day');
      if (diff >= 1 && diff < 7) return fmtDay(targetDn, weekdayFmt);
      return fmtDay(targetDn, shortDateFmt);
    }
    function dayLabel(dn, targetDn) {
      var diff = targetDn - dn;
      if ((diff === 0 || diff === 1) && rtf) return capFirst(rtf.format(diff, 'day'));
      return capFirst(fmtDay(targetDn, weekdayFmt));
    }

    /* ---------- now, in the chosen timezone ---------- */
    var partsFmt = null;
    if (tz) {
      try {
        partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric',
          day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
      } catch (e) { partsFmt = null; }
    }
    function wallNow() {
      var d = new Date();
      var y, mo, da, h, mi, s;
      if (partsFmt) {
        var p = {};
        partsFmt.formatToParts(d).forEach(function (x) { p[x.type] = Number(x.value); });
        y = p.year; mo = p.month; da = p.day; h = p.hour % 24; mi = p.minute; s = p.second;
      } else {
        y = d.getFullYear(); mo = d.getMonth() + 1; da = d.getDate(); h = d.getHours(); mi = d.getMinutes(); s = d.getSeconds();
      }
      var dn = Math.floor(Date.UTC(y, mo - 1, da) / 86400000);
      return { dn: dn, t: dn * 1440 + h * 60 + mi + (s + d.getMilliseconds() / 1000) / 60 };
    }

    /* ---------- occurrences around today ---------- */
    var occs = [];
    var occsDn = null;
    function isoOf(dn) { return new Date(dn * 86400000).toISOString().slice(0, 10); }
    function buildOccs(dn) {
      occs = [];
      for (var d = dn - 1; d <= dn + 8; d++) {
        var wd = ((d + 4) % 7 + 7) % 7;            // 1970-01-01 was a Thursday
        var key = isoOf(d);
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          if (b.mask[wd] || b.dates.indexOf(key) >= 0) {
            var s = d * 1440 + b.s;
            occs.push({ b: b, s: s, e: s + b.dur, day: d, id: d + ':' + b.order });
          }
        }
      }
      occs.sort(function (a, b) { return a.s - b.s || a.b.order - b.b.order; });
      occsDn = dn;
    }

    function compute(now) {
      if (occsDn !== now.dn) buildOccs(now.dn);
      var t = now.t, dayStart = now.dn * 1440, dayEnd = dayStart + 1440;
      var cur = null, next = null, lastEnd = null, endedToday = false;
      for (var i = 0; i < occs.length; i++) {
        var o = occs[i];
        if (o.s <= t && t < o.e) {
          // Overlapping blocks (a break inside a shift): the one that started last is "now".
          if (!cur || o.s > cur.s || (o.s === cur.s && o.e < cur.e)) cur = o;
        } else if (o.e <= t) {
          if (lastEnd === null || o.e > lastEnd) lastEnd = o.e;
          if (o.e > dayStart) endedToday = true;
        }
      }
      for (i = 0; i < occs.length; i++) if (occs[i].s > t && occs[i] !== cur) { next = occs[i]; break; }
      var mode = cur ? 'now' : (next && endedToday && next.s < dayEnd ? 'gap' : (next ? 'off' : 'empty'));
      var after = null;
      if (next && mode !== 'now') {
        for (i = 0; i < occs.length; i++) if (occs[i].s > next.s) { after = occs[i]; break; }
      }
      var listDay = mode === 'off' ? next.day : now.dn;
      var ls = listDay * 1440, le = ls + 1440;
      var list = occs.filter(function (o) { return o.s < le && o.e > ls; });
      return { mode: mode, cur: cur, next: next, after: after, lastEnd: lastEnd, listDay: listDay, list: list, now: now };
    }

    /* ---------- fitting helpers ---------- */
    // The largest font size (between lo and hi px) at which the element's text fits its width in `lines` lines.
    function fitText(node, hi, lo, lines) {
      node.style.fontSize = hi + 'px';
      if (fits(node, lines)) return hi;
      var a = lo, b = hi;
      for (var k = 0; k < 12 && b - a > 0.5; k++) {
        var mid = (a + b) / 2;
        node.style.fontSize = mid + 'px';
        if (fits(node, lines)) a = mid; else b = mid;
      }
      node.style.fontSize = Math.floor(a) + 'px';
      return a;
    }
    function fits(node, lines) {
      if (node.scrollWidth > node.clientWidth + 1) return false;
      var cs = window.getComputedStyle(node);
      var lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1;
      return node.scrollHeight <= lh * lines + 2;
    }
    // Sizes in px, in step with --u in style.css: 1% of the height, but at most 0.9% of the width.
    function px(name) {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var u = Math.min(H / 100, W * 0.009);
      switch (name) {
        case '--u': return u;
        case '--list-min': return Math.max(13, u * 2.1);
        case '--list-max': return u * (view === 'list' ? (H > W ? 3.9 : 4.8) : 3.5);
        case '--count-max':
          if (body.classList.contains('strip')) return H * 0.56;
          if (view === 'focus') return u * (H > W ? 54 : 34);
          return u * (H > W ? 36 : 26);
        case '--strip-title': return H * 0.2;
        default: return 0;
      }
    }

    /* ---------- render ---------- */
    var focus = $('focus'), listEl = $('list');
    var state = null;
    var structKey = '';
    var countKey = '';

    function whereOf(b) {
      if (!showWhere) return '';
      return [b.room, b.host].filter(function (x) { return x; }).join(' \u00b7 ');
    }
    function setMeta(node, parts) {
      setText(node, parts.filter(function (x) { return x; }).join('  \u00b7  '));
    }
    function fill(text, now) {
      var n = state && state.next;
      if (!n) return text;
      return capFirst(text.replace(/\{time\}/g, fmtTime(n.s)).replace(/\{day\}/g, whenText(now.dn, n.day)).replace(/\{title\}/g, n.b.title));
    }

    function renderStructure(s) {
      var shape = body.classList.contains('strip') ? 'strip' : 'full';
      body.setAttribute('data-mode', s.mode);
      focus.setAttribute('data-mode', s.mode);

      var o = s.mode === 'now' ? s.cur : s.next;
      if (s.mode === 'now') {
        setText($('kicker'), L.now);
        setText($('ftitle'), s.cur.b.title);
        setMeta($('fmeta'), [fmtSpan(s.cur), whereOf(s.cur.b)]);
        setText($('countlabel'), L.ends);
      } else if (s.mode === 'gap') {
        setText($('kicker'), L.next);
        setText($('ftitle'), s.next.b.title);
        setMeta($('fmeta'), [fmtSpan(s.next), whereOf(s.next.b)]);
        setText($('countlabel'), L.starts);
      } else if (s.mode === 'off') {
        setText($('kicker'), L.next);
        setText($('ftitle'), fill(s.next.day === s.now.dn ? L.offToday : L.offLater, s.now));
        setMeta($('fmeta'), [s.next.b.title, whereOf(s.next.b)]);
        setText($('countlabel'), L.starts);
      } else {
        setText($('kicker'), '');
        setText($('ftitle'), L.empty);
        setText($('fmeta'), '');
        setText($('countlabel'), '');
      }
      $('kicker').hidden = !$('kicker').textContent;
      $('countbox').hidden = s.mode === 'empty';
      $('progress').hidden = s.mode === 'off' || s.mode === 'empty';
      if (s.mode === 'now') { setText($('pfrom'), fmtTime(s.cur.s)); setText($('pto'), fmtTime(s.cur.e)); }
      if (s.mode === 'gap') { setText($('pfrom'), fmtTime(s.lastEnd)); setText($('pto'), fmtTime(s.next.s)); }

      // The card under the countdown: what follows the block on the big display.
      var nx = s.mode === 'now' ? s.next : s.after;
      $('next').hidden = !nx;
      if (nx) {
        setText($('nextlabel'), s.mode === 'now' ? L.next : L.then);
        setText($('nexttime'), nx.day === s.now.dn ? fmtTime(nx.s) : capFirst(whenText(s.now.dn, nx.day)) + preset.sep + fmtTime(nx.s));
        setText($('nexttitle'), nx.b.title);
        setText($('nextmeta'), whereOf(nx.b));
        $('nextmeta').hidden = !$('nextmeta').textContent;
      }

      renderList(s);
      fitFocus(shape);
      countKey = '';
    }

    /* The day's list: one line per block, the current one highlighted with its own progress. */
    var rowNodes = [];
    function rowFor(o, s, later) {
      var cls = 'row';
      if (later) cls += ' is-later';
      else if (s.cur && o === s.cur) cls += ' is-current';
      else if (o.e <= s.now.t) cls += ' is-done';
      else if (s.next && o === s.next) cls += ' is-next';
      var li = el('li', cls);
      li.appendChild(el('span', 'r-fill'));
      li.appendChild(el('span', 'r-time', fmtSpan(o)));
      var what = el('span', 'r-what');
      what.appendChild(el('span', 'r-title', o.b.title));
      var where = whereOf(o.b);
      if (where) what.appendChild(el('span', 'r-where', where));
      li.appendChild(what);
      // The current row's tag shows the time left; renderCount() keeps it up to date.
      if (!later && o === s.cur) li.appendChild(el('span', 'r-tag', L.now));
      return { li: li, o: o };
    }
    function dayRow(s, d) {
      var li = el('li', 'row day-row');
      li.appendChild(el('span', 'd-name', dayLabel(s.now.dn, d)));
      li.appendChild(el('span', 'd-date', fmtDay(d, monthDayFmt)));
      return { li: li, o: null };
    }

    function renderList(s) {
      setText($('listlabel'), dayLabel(s.now.dn, s.listDay));
      // "Today · Tuesday 6 October", but "Monday · 12 October" (no weekday twice).
      var named = s.listDay - s.now.dn >= 0 && s.listDay - s.now.dn <= 1 && rtf;
      setText($('listdate'), fmtDay(s.listDay, named ? dateFmt : monthDayFmt));
      clear(listEl);
      rowNodes = [];
      if (body.classList.contains('strip') || view === 'focus') return;
      var lo = px('--list-min'), hi = px('--list-max');
      if (!s.list.length) {
        listEl.style.fontSize = Math.floor(hi) + 'px';
        listEl.appendChild(el('li', 'row empty-row', L.empty));
        return;
      }
      var rows = s.list.map(function (o) { return rowFor(o, s, false); });

      // Size: every row the same height; shrink to fit. When even the smallest readable size cannot
      // show them all, show a window that starts just before the current row, plus a "+N" line.
      var avail = listEl.clientHeight;
      var per = 2.5;                                  // row height in em, including the gap
      var n = rows.length;
      // The timetable alone on a wide screen: two columns of rows, so they can be twice as big.
      var cols = view === 'list' && window.innerWidth > window.innerHeight * 1.3 && n > 6 ? 2 : 1;
      listEl.classList.toggle('two', cols === 2);
      if (cols === 2) hi *= 0.72;
      function slots(sz) { return Math.floor(avail / (sz * per) + 0.02) * cols; }
      var startAt = 0, count = n, size = avail / (Math.ceil(n / cols) * per);
      function windowAt(c) {
        var anchor = n - 1;
        for (var i = 0; i < n; i++) if (!/is-done/.test(rows[i].li.className)) { anchor = i; break; }
        return Math.max(0, Math.min(anchor - 1, n - c));
      }
      if (size < lo) {
        var cap = Math.max(1, slots(lo));
        count = cap;
        startAt = windowAt(count);
        if (startAt + count < n) { count = Math.max(1, cap - 1); startAt = windowAt(count); }
        size = avail / (Math.ceil((count + (startAt + count < n ? 1 : 0)) / cols) * per);
      }
      size = Math.max(lo * 0.8, Math.min(hi, size));
      var shown = rows.slice(startAt, startAt + count);
      var hiddenAfter = n - startAt - count;

      // Spare room under a short day: the next days of the week, each under its own heading.
      var later = [];
      if (hiddenAfter <= 0) {
        var spare = slots(size) - shown.length;
        for (var d = s.listDay + 1; d <= s.listDay + 6 && spare >= 2; d++) {
          var those = occs.filter(function (o) { return o.day === d; });
          if (!those.length) continue;
          later.push(dayRow(s, d));
          spare--;
          for (var j = 0; j < those.length && spare >= 1; j++, spare--) later.push(rowFor(those[j], s, true));
        }
      }

      listEl.style.fontSize = Math.floor(size) + 'px';
      shown.concat(later).forEach(function (r) { listEl.appendChild(r.li); if (r.o) rowNodes.push(r); });
      if (hiddenAfter > 0) listEl.appendChild(el('li', 'row more', '+' + hiddenAfter));

      // One width for the time column, measured with the real font.
      // (a nowrap flex: none span is exactly as wide as its text while no width is set)
      listEl.style.removeProperty('--tw');
      var max = 0;
      rowNodes.forEach(function (r) { max = Math.max(max, r.li.querySelector('.r-time').getBoundingClientRect().width); });
      listEl.style.setProperty('--tw', Math.ceil(max + 1) + 'px');
    }

    function fitFocus(shape) {
      var u = px('--u');
      var ft = $('ftitle');
      // A long name in the header shrinks a little before it is cut short.
      var title = $('title');
      title.style.fontSize = '';
      var full = parseFloat(window.getComputedStyle(title).fontSize) || 0;
      if (full) fitText(title, full, full * 0.62, 1);
      if (shape === 'strip') {
        fitText(ft, px('--strip-title'), px('--strip-title') * 0.5, 1);
      } else {
        var big = view === 'focus' ? 11 : 8.4;
        if (body.classList.contains('portrait') && view !== 'list') big = view === 'focus' ? 12 : 8.4;
        fitText(ft, u * big, u * 4, 2);
      }
      var nt = $('nexttitle');
      nt.style.fontSize = '';
    }

    function fitCount() {
      var box = $('countbox'), c = $('count');
      if (box.hidden) return;
      var lab = $('countlabel');
      var h = box.clientHeight - (parseFloat(window.getComputedStyle(box).paddingTop) || 0) - (lab.offsetHeight || 0);
      var w = box.clientWidth;
      if (h < 4 || w < 4) return;
      var hi = Math.min(h / 0.86, px('--count-max'));
      c.style.fontSize = hi + 'px';
      var need = c.scrollWidth;
      var size = need > w ? hi * w / need * 0.98 : hi;
      c.style.fontSize = Math.floor(size) + 'px';
      if (c.offsetHeight > h) c.style.fontSize = Math.floor(size * h / c.offsetHeight) + 'px';
    }

    function renderCount(s) {
      var sec = 0;
      if (s.mode === 'now') sec = (s.cur.e - s.now.t) * 60;
      else if (s.next) sec = (s.next.s - s.now.t) * 60;
      var parts = durationParts(sec);
      var key = parts.map(function (p) { return p.text; }).join('|') + (body.className);
      var warn = s.mode === 'now' && warnSec > 0 && sec <= warnSec;
      focus.classList.toggle('warn', warn);
      if (key !== countKey) {
        countKey = key;
        var c = $('count');
        clear(c);
        parts.forEach(function (p) { c.appendChild(el('span', p.big ? 'n' : 'u', p.text)); });
        fitCount();
      }
      // Progress of the block (or of the gap) on the big display, and of the current row in the list.
      var pct = 0;
      if (s.mode === 'now') pct = (s.now.t - s.cur.s) / (s.cur.e - s.cur.s);
      else if (s.mode === 'gap' && s.lastEnd !== null) pct = (s.now.t - s.lastEnd) / Math.max(1, s.next.s - s.lastEnd);
      pct = Math.max(0, Math.min(1, pct));
      $('fill').style.transform = 'scaleX(' + pct.toFixed(4) + ')';
      rowNodes.forEach(function (r) {
        if (r.o !== s.cur || /is-later/.test(r.li.className)) return;
        r.li.querySelector('.r-fill').style.transform = 'scaleX(' + pct.toFixed(4) + ')';
        var tag = r.li.querySelector('.r-tag');
        if (tag) setText(tag, durationText(sec, true));
      });
      // The chip in list view and the "in N min" of the next card.
      var chip = $('listchip');
      if (view === 'list' && s.mode === 'now') {
        setText(chip, s.cur.b.title + ' \u00b7 ' + durationText(sec, true));
        chip.hidden = false;
      } else if (view === 'list' && (s.mode === 'gap' || s.mode === 'off')) {
        setText(chip, L.starts + ' ' + durationText(sec, true));
        chip.hidden = false;
      } else chip.hidden = true;
      var nx = s.mode === 'now' ? s.next : s.after;
      if (nx && rtf) {
        var mins = Math.max(1, Math.ceil(nx.s - s.now.t));
        var rel = mins < 60 ? rtf.format(mins, 'minute') : '';
        setText($('nextin'), rel);
      } else setText($('nextin'), '');
    }

    function clockTick(now) {
      setText($('clock'), fmtTime(Math.floor(now.t)));
      setText($('date'), fmtDay(now.dn, dateFmt));
    }

    function shape() {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var cls = w / h > 3.2 ? 'strip' : (h > w * 1.05 ? 'portrait' : 'landscape');
      body.classList.remove('strip', 'portrait', 'landscape', 'view-split', 'view-focus', 'view-list');
      body.classList.add(cls, 'view-' + view);
    }

    function tick() {
      var now = wallNow();
      var s = compute(now);
      state = s;
      clockTick(now);
      var key = [s.mode, s.cur && s.cur.id, s.next && s.next.id, s.listDay, s.list.map(function (o) {
        return o.e <= now.t ? 'd' : 'u';
      }).join(''), s.mode === 'off' ? s.next.day - now.dn : '', window.innerWidth, window.innerHeight].join('/');
      if (key !== structKey) {
        structKey = key;
        renderStructure(s);
      }
      renderCount(s);
    }

    shape();
    tick();
    setInterval(tick, 1000);
    function refit() { structKey = ''; countKey = ''; tick(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit, refit);
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { shape(); refit(); }, 200);
    });
  });
})();
