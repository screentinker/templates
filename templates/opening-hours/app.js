/*
 * Opening hours — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. The regular week comes from the seven hours_* settings; special dates
 * (holidays, reduced hours) come from a bound table data source (ST.data.specials_source, keys
 * row{i}_{col}) or, when none is bound, from the typed "Special dates" lines. A special date
 * overrides the week on the day it applies. Everything is computed in the business's timezone
 * from the screen's clock, and every day/month/time name comes from Intl in the chosen locale.
 * Writes with textContent, fetches nothing, uses no eval.
 */
(function () {
  'use strict';

  var MAX_SPECIALS = 100;           // lines read from the textarea or the data source
  var LOOKAHEAD_DAYS = 400;         // how far ahead the "special opening times" list looks
  var DAY_MS = 86400000;
  var WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];   // Date#getUTCDay order
  var CLOSED_WORDS = /^(closed|close|geschlossen|ferm[ée]e?|cerrado|chiuso|gesloten|stängt|stengt|lukket|suljettu|zamkni[eę]te|fechado|kapal[ıi]|休業|定休日|休み|休息|关闭|关门|闭店|बंद|-+|–|—|x|n\/a)$/i;

  /* ---------- the built-in words, in the screen's language (picked by the primary subtag, else en) ----------
     {time} is a time of day and {day} a weekday name, both already written in the chosen language. */
  var STRINGS = {
    en: {
      open: 'Open now', soon: 'Closing soon', closed: 'Closed', always: 'Open 24 hours',
      closes: 'Closes at {time}', reopens: 'Back at {time} after a break',
      opensToday: 'Opens today at {time}', opensTomorrow: 'Opens tomorrow at {time}', opensOn: 'Opens {day} at {time}',
      hoursHeading: 'Opening hours', specialsHeading: 'Special opening times', today: 'Today'
    },
    de: {
      open: 'Jetzt geöffnet', soon: 'Schließt bald', closed: 'Geschlossen', always: '24 Stunden geöffnet',
      closes: 'Schließt um {time}', reopens: 'Nach der Pause ab {time} wieder offen',
      opensToday: 'Öffnet heute um {time}', opensTomorrow: 'Öffnet morgen um {time}', opensOn: 'Öffnet am {day} um {time}',
      hoursHeading: 'Öffnungszeiten', specialsHeading: 'Sonderöffnungszeiten', today: 'Heute'
    },
    es: {
      open: 'Abierto', soon: 'Cierra pronto', closed: 'Cerrado', always: 'Abierto 24 horas',
      closes: 'Cierra a las {time}', reopens: 'Volvemos a las {time} tras la pausa',
      opensToday: 'Abre hoy a las {time}', opensTomorrow: 'Abre mañana a las {time}', opensOn: 'Abre el {day} a las {time}',
      hoursHeading: 'Horario', specialsHeading: 'Horarios especiales', today: 'Hoy'
    },
    fr: {
      open: 'Ouvert', soon: 'Ferme bientôt', closed: 'Fermé', always: 'Ouvert 24 h/24',
      closes: 'Ferme à {time}', reopens: 'De retour à {time} après la pause',
      opensToday: 'Ouvre aujourd’hui à {time}', opensTomorrow: 'Ouvre demain à {time}', opensOn: 'Ouvre {day} à {time}',
      hoursHeading: 'Horaires d’ouverture', specialsHeading: 'Horaires exceptionnels', today: 'Aujourd’hui'
    },
    hi: {
      open: 'अभी खुला है', soon: 'जल्द बंद होगा', closed: 'बंद', always: '24 घंटे खुला',
      closes: '{time} पर बंद होगा', reopens: 'ब्रेक के बाद {time} पर फिर खुलेगा',
      opensToday: 'आज {time} पर खुलेगा', opensTomorrow: 'कल {time} पर खुलेगा', opensOn: '{day} को {time} पर खुलेगा',
      hoursHeading: 'खुलने का समय', specialsHeading: 'विशेष समय', today: 'आज'
    },
    it: {
      open: 'Aperto', soon: 'Chiude a breve', closed: 'Chiuso', always: 'Aperto 24 ore su 24',
      closes: 'Chiude alle {time}', reopens: 'Riapre alle {time} dopo la pausa',
      opensToday: 'Apre oggi alle {time}', opensTomorrow: 'Apre domani alle {time}', opensOn: 'Apre {day} alle {time}',
      hoursHeading: 'Orari di apertura', specialsHeading: 'Orari speciali', today: 'Oggi'
    },
    ja: {
      open: '営業中', soon: 'まもなく閉店', closed: '休業', always: '24時間営業',
      closes: '{time}まで営業', reopens: '休憩後、{time}に再開',
      opensToday: '本日 {time}から営業', opensTomorrow: '明日 {time}から営業', opensOn: '{day} {time}から営業',
      hoursHeading: '営業時間', specialsHeading: '特別営業日', today: '本日'
    },
    nl: {
      open: 'Nu open', soon: 'Sluit binnenkort', closed: 'Gesloten', always: '24 uur per dag open',
      closes: 'Sluit om {time}', reopens: 'Na de pauze weer open om {time}',
      opensToday: 'Opent vandaag om {time}', opensTomorrow: 'Opent morgen om {time}', opensOn: 'Opent {day} om {time}',
      hoursHeading: 'Openingstijden', specialsHeading: 'Afwijkende openingstijden', today: 'Vandaag'
    },
    pt: {
      open: 'Aberto agora', soon: 'Fecha em breve', closed: 'Fechado', always: 'Aberto 24 horas',
      closes: 'Fecha às {time}', reopens: 'Volta às {time} após o intervalo',
      opensToday: 'Abre hoje às {time}', opensTomorrow: 'Abre amanhã às {time}', opensOn: 'Abre {day} às {time}',
      hoursHeading: 'Horário de funcionamento', specialsHeading: 'Horários especiais', today: 'Hoje'
    },
    zh: {
      open: '营业中', soon: '即将打烊', closed: '休息', always: '24小时营业',
      closes: '{time} 打烊', reopens: '午休后 {time} 恢复营业',
      opensToday: '今天 {time} 开门', opensTomorrow: '明天 {time} 开门', opensOn: '{day} {time} 开门',
      hoursHeading: '营业时间', specialsHeading: '特殊营业时间', today: '今天'
    }
  };

  function str(x) { return x == null ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== '') e.textContent = text;
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  /* ---------- colours (mixed here, so old players without color-mix get the same result) ---------- */
  function rgb(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {          // t of colour a, (1 - t) of colour b
    var x = rgb(a), y = rgb(b);
    if (!x || !y) return a || b;
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var c = Math.round(x[i] * t + y[i] * (1 - t)).toString(16);
      out += c.length < 2 ? '0' + c : c;
    }
    return out;
  }
  function luminance(hex) {
    var c = rgb(hex);
    if (!c) return 1;
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }

  /* ---------- hours: "08:30-13:00, 14:00-18:30", "9am-5pm", "Closed", "24h", "18:00-02:00" ---------- */
  var RANGE = /(\d{1,2})(?:[:.h](\d{2})|h)?\s*([ap])?\.?\s*m?\.?\s*(?:-|–|—|~|〜|～|to|until|till|bis|à)\s*(\d{1,2})(?:[:.h](\d{2})|h)?\s*([ap])?\.?\s*m?\.?/gi;
  function to24(h, ap) {
    if (!ap) return h;
    h = h % 12;
    return /p/i.test(ap) ? h + 12 : h;
  }
  var hoursCache = {};
  function parseHours(text) {
    var s = str(text);
    if (Object.prototype.hasOwnProperty.call(hoursCache, s)) return hoursCache[s];
    var out = { ranges: [], raw: '', allDay: false };
    if (/^(24\s*(h|hrs?|hours?|\/\s*7)|open\s*24\b.*)$/i.test(s)) {
      out.ranges.push([0, 1440]);
      out.allDay = true;
    } else if (s && !CLOSED_WORDS.test(s)) {
      RANGE.lastIndex = 0;
      var m;
      while ((m = RANGE.exec(s)) && out.ranges.length < 6) {
        var h1 = +m[1], m1 = +(m[2] || 0), ap1 = m[3], h2 = +m[4], m2 = +(m[5] || 0), ap2 = m[6];
        if (!ap1 && ap2) ap1 = (h1 <= h2 && h1 !== 12) ? ap2 : (/p/i.test(ap2) ? 'a' : 'p');
        h1 = to24(h1, ap1); h2 = to24(h2, ap2);
        if (h1 > 24 || h2 > 24 || m1 > 59 || m2 > 59) continue;
        var a = h1 * 60 + m1, b = h2 * 60 + m2;
        if (a >= 1440) continue;
        if (b <= a) b += 1440;            // past midnight
        out.ranges.push([a, b]);
      }
      if (!out.ranges.length) out.raw = s;   // "By appointment": shown as typed, counted as closed
      if (out.ranges.length === 1 && out.ranges[0][0] === 0 && out.ranges[0][1] === 1440) out.allDay = true;
    }
    hoursCache[s] = out;
    return out;
  }

  /* ---------- dates: 2026-12-24, 2026/12/24, 12-24 (every year), ranges with .. or a spaced dash ---------- */
  function dayNum(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS); }
  function ymd(dn) { var t = new Date(dn * DAY_MS); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), w: t.getUTCDay() }; }
  function parseDay(s) {
    var m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(s);
    if (m) {
      var mo = +m[2], d = +m[3];
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      return { dn: dayNum(+m[1], mo, d) };
    }
    m = /^(\d{1,2})[-\/](\d{1,2})$/.exec(s);
    if (m) {
      var mm = +m[1], dd = +m[2];
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
      return { md: mm * 100 + dd };
    }
    return null;
  }
  function parseDateSpec(text) {
    var s = str(text);
    if (!s) return null;
    var parts = s.split(/\s*\.\.\s*|\s+(?:to|-)\s+|\s*[–—]\s*/);
    var a = parseDay(parts[0]);
    if (!a) return null;
    var b = parts.length > 1 ? parseDay(parts[1]) : a;
    if (!b || (a.dn !== undefined) !== (b.dn !== undefined)) b = a;
    if (a.dn !== undefined) return { from: Math.min(a.dn, b.dn), to: Math.max(a.dn, b.dn) };
    return { mdFrom: a.md, mdTo: b.md };
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;

    /* ---------- colours and text ---------- */
    var bg = v.background || '#F4F1EA';
    var text = v.text_color || '#1D2733';
    var accent = v.accent || '#1F6F66';
    var colors = { open: v.open_color || '#17915A', soon: v.soon_color || '#C9820A', closed: v.closed_color || '#C8423B' };
    var dark = luminance(bg) < 0.45;
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--text', text);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-tint', mix(accent, bg, dark ? 0.16 : 0.10));
    root.style.setProperty('--card', dark ? mix('#FFFFFF', bg, 0.05) : mix('#FFFFFF', bg, 0.6));
    root.style.setProperty('--line', mix(text, bg, 0.12));
    root.style.setProperty('--muted', mix(text, bg, 0.66));
    body.setAttribute('data-font', str(v.font) || 'archivo');
    body.classList.toggle('dark', dark);

    $('title').textContent = str(v.title);
    $('subtitle').textContent = str(v.subtitle);
    $('footer').textContent = str(v.footer);
    if (v.logo) { var logo = $('logo'); logo.src = v.logo; logo.hidden = false; }

    /* ---------- language: the locale setting, else the player's own ---------- */
    var locale = str(v.locale) || undefined;
    var langTag = locale || (typeof navigator !== 'undefined' && navigator.language) || 'en';
    var lang = String(langTag).split('-')[0].toLowerCase();
    var T = Object.prototype.hasOwnProperty.call(STRINGS, lang) ? STRINGS[lang] : STRINGS.en;
    try { root.setAttribute('lang', langTag); } catch (e) { root.setAttribute('lang', 'en'); }
    // An empty setting uses the built-in word in the screen's language; a single dash hides a line.
    function word(x, builtin) {
      var s = str(x);
      if (s === '-' || s === '–' || s === '—') return '';
      return s || builtin;
    }

    var hoursHeading = word(v.hours_heading, T.hoursHeading);
    var specialsHeading = word(v.specials_heading, T.specialsHeading);
    $('hours-heading').textContent = hoursHeading;
    $('specials-heading').textContent = specialsHeading;
    if (!hoursHeading) $('hours-heading').style.display = 'none';
    if (!specialsHeading) $('specials-heading').style.display = 'none';

    var L = {
      open: str(v.open_label) || T.open,
      soon: str(v.soon_label) || T.soon,
      closed: str(v.closed_label) || T.closed,
      always: str(v.always_open_label) || T.always,
      closes: word(v.closes_text, T.closes),
      reopens: word(v.reopens_text, T.reopens),
      opens: word(v.opens_text, ''),          // empty: the built-in today / tomorrow / weekday phrases
      opensHidden: str(v.opens_text) === '-' || str(v.opens_text) === '–' || str(v.opens_text) === '—'
    };
    var soonMinutes = Math.max(0, Math.min(120, Number(v.soon_minutes) || 0));
    if (v.soon_minutes === undefined || v.soon_minutes === null || v.soon_minutes === '') soonMinutes = 30;
    var specialsCount = Math.max(0, Math.min(6, Math.floor(Number(v.specials_count))));
    if (!isFinite(specialsCount)) specialsCount = 3;

    /* ---------- Intl ---------- */
    var tz = str(v.timezone) || undefined;
    var mode = str(v.clock_format) || 'auto';
    function makeFmt(opts, zone) {
      var o = {};
      for (var k in opts) o[k] = opts[k];
      if (zone) o.timeZone = zone;
      try { return new Intl.DateTimeFormat(locale, o); }
      catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(locale, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, opts); }
      }
    }
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (mode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (mode === '12') timeOpts.hour12 = true;
    // Wall-clock times of the hours table are formatted as UTC instants so no zone shifts them.
    var wallFmt = makeFmt(timeOpts, 'UTC');
    var clockFmt = makeFmt(timeOpts, tz);
    var headDateFmt = makeFmt({ weekday: 'long', day: 'numeric', month: 'long' }, tz);
    var weekdayFmt = makeFmt({ weekday: 'long' }, 'UTC');
    var shortDateFmt = makeFmt({ weekday: 'short', day: 'numeric', month: 'short' }, 'UTC');
    var partsFmt = null;
    try {
      partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
    } catch (e) {
      partsFmt = null;
    }
    var rtf = null;
    try { if (Intl.RelativeTimeFormat) rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); } catch (e) { rtf = null; }
    if (mode === 'off') $('clockbox').hidden = true;

    function upperFirst(s) { return s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s; }
    function weekdayName(dn) { return weekdayFmt.format(new Date(dn * DAY_MS)); }
    function shortDate(dn) { return shortDateFmt.format(new Date(dn * DAY_MS)); }
    function wallTime(min) { return wallFmt.format(new Date(Date.UTC(2024, 0, 1) + ((min % 1440) + 1440) % 1440 * 60000)); }
    function rangeText(r) { return wallTime(r[0]) + ' – ' + wallTime(r[1]); }
    // "today", "tomorrow" in the chosen language, else the weekday's name.
    function dayWord(diff, dn) {
      if (rtf && (diff === 0 || diff === 1)) return rtf.format(diff, 'day');
      return weekdayName(dn);
    }
    // Languages outside the strings table still get their own word for "today" from Intl.
    var builtinToday = T === STRINGS.en && lang !== 'en' && rtf ? upperFirst(rtf.format(0, 'day')) : T.today;
    var todayWord = str(v.today_label) || builtinToday || 'Today';
    function fill(tpl, day, time) { return tpl.replace(/\{day\}/g, day).replace(/\{time\}/g, time); }

    /* The business's current date (as a day number) and minute of the day. */
    function now() {
      var t = new Date();
      if (partsFmt && partsFmt.formatToParts) {
        var p = {};
        partsFmt.formatToParts(t).forEach(function (x) { p[x.type] = x.value; });
        var y = +p.year, mo = +p.month, d = +p.day, h = (+p.hour) % 24, mi = +p.minute;
        if (y && mo && d && isFinite(h) && isFinite(mi)) return { dn: dayNum(y, mo, d), min: h * 60 + mi };
      }
      return { dn: dayNum(t.getFullYear(), t.getMonth() + 1, t.getDate()), min: t.getHours() * 60 + t.getMinutes() };
    }

    /* ---------- the week and the special dates ---------- */
    var week = {};
    WEEK_KEYS.forEach(function (k) { week[k] = str(v['hours_' + k]); });

    function specialsFromSource() {
      var d = ST.data && ST.data.specials_source;
      if (!d || typeof d !== 'object') return null;
      var kd = slug(v.date_col || 'Date'), kh = slug(v.hours_col || 'Hours'), kn = slug(v.note_col || 'Note');
      if (!kd || d['row1_' + kd] === undefined) return null;
      var out = [];
      for (var i = 1; i <= MAX_SPECIALS; i++) {
        var p = 'row' + i + '_';
        if (d[p + kd] === undefined) break;
        out.push({ date: str(d[p + kd]), hours: str(d[p + kh]), note: str(d[p + kn]) });
      }
      return out;
    }
    function specialsFromText() {
      return String(v.specials || '').split(/\r?\n/).slice(0, MAX_SPECIALS).filter(function (line) {
        return str(line) && str(line).charAt(0) !== '#';
      }).map(function (line) {
        var c = line.split('|');
        return { date: str(c[0]), hours: str(c[1]), note: str(c.slice(2).join('|')) };
      });
    }
    var specials = (specialsFromSource() || specialsFromText()).map(function (row) {
      var spec = parseDateSpec(row.date);
      if (!spec) return null;
      spec.hours = row.hours; spec.note = row.note;
      return spec;
    }).filter(Boolean);

    // A dated entry beats an every-year one; otherwise the first line that matches wins.
    var specialCache = {};   // reset every day, so it stays a few hundred entries
    function specialFor(dn) {
      if (Object.prototype.hasOwnProperty.call(specialCache, dn)) return specialCache[dn];
      var hit = -1, i, s;
      for (i = 0; i < specials.length && hit < 0; i++) {
        s = specials[i];
        if (s.from !== undefined && dn >= s.from && dn <= s.to) hit = i;
      }
      if (hit < 0) {
        var t = ymd(dn), md = t.m * 100 + t.d;
        for (i = 0; i < specials.length && hit < 0; i++) {
          s = specials[i];
          if (s.mdFrom === undefined) continue;
          if (s.mdFrom <= s.mdTo ? (md >= s.mdFrom && md <= s.mdTo) : (md >= s.mdFrom || md <= s.mdTo)) hit = i;
        }
      }
      specialCache[dn] = hit;
      return hit;
    }
    function dayHours(dn) {
      var i = specialFor(dn);
      if (i >= 0) return { h: parseHours(specials[i].hours), note: specials[i].note, special: true, index: i };
      return { h: parseHours(week[WEEK_KEYS[ymd(dn).w]]), note: '', special: false, index: -1 };
    }
    function hoursLabel(h) {
      if (h.allDay) return L.always;
      if (h.ranges.length) return h.ranges.map(rangeText).join(', ');
      return h.raw || L.closed;
    }

    /* ---------- status: open, closing soon, or closed and when it opens ---------- */
    function intervals(today) {
      var list = [];
      for (var dn = today - 1; dn <= today + 8; dn++) {
        dayHours(dn).h.ranges.forEach(function (r) { list.push([dn * 1440 + r[0], dn * 1440 + r[1]]); });
      }
      list.sort(function (a, b) { return a[0] - b[0]; });
      var merged = [];
      list.forEach(function (r) {
        var last = merged[merged.length - 1];
        if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else merged.push([r[0], r[1]]);
      });
      return merged;
    }
    function status(n) {
      var t = n.dn * 1440 + n.min;
      var list = intervals(n.dn);
      var cur = null, next = null, i;
      for (i = 0; i < list.length; i++) {
        if (list[i][0] <= t && t < list[i][1]) { cur = list[i]; next = list[i + 1] || null; break; }
        if (list[i][0] > t) { next = list[i]; break; }
      }
      if (cur) {
        if (cur[1] - t >= 7 * 1440) return { state: 'open', word: L.always, detail: '', detail2: '' };
        var left = cur[1] - t;
        var soon = soonMinutes > 0 && left <= soonMinutes;
        var closeAt = wallTime(cur[1] % 1440);
        var d2 = '';
        if (next && L.reopens && Math.floor(next[0] / 1440) === Math.floor((cur[1] - 1) / 1440)) d2 = fill(L.reopens, '', wallTime(next[0] % 1440));
        return { state: soon ? 'soon' : 'open', word: soon ? L.soon : L.open, detail: L.closes ? fill(L.closes, '', closeAt) : '', detail2: d2 };
      }
      var detail = '';
      if (next && !L.opensHidden) {
        var ndn = Math.floor(next[0] / 1440), diff = ndn - n.dn, at = wallTime(next[0] % 1440);
        if (L.opens) detail = fill(L.opens, dayWord(diff, ndn), at);
        else detail = fill(diff === 0 ? T.opensToday : diff === 1 ? T.opensTomorrow : T.opensOn, weekdayName(ndn), at);
        detail = upperFirst(detail);
      }
      return { state: 'closed', word: L.closed, detail: detail, detail2: '' };
    }

    /* ---------- render ---------- */
    var startIdx = { sunday: 0, monday: 1, saturday: 6 }[str(v.week_start)];
    if (startIdx === undefined) startIdx = 1;

    function renderWeek(today) {
      var list = $('days');
      clear(list);
      var w = ymd(today).w;
      for (var i = 0; i < 7; i++) {
        var wd = (startIdx + i) % 7;
        // Each row is the NEXT time that weekday comes round (today included), so every row is true.
        var dn = today + ((wd - w + 7) % 7);
        var info = dayHours(dn);
        var li = el('li', 'day');
        if (dn === today) li.className += ' today';
        if (info.special) li.className += ' special';
        var name = el('div', 'name', upperFirst(weekdayName(dn)));
        if (dn === today) { name.appendChild(document.createTextNode(' ')); name.appendChild(el('span', 'tag', todayWord)); }
        li.appendChild(name);
        var hours = el('div', 'hours');
        var ranges = el('div', 'ranges');
        if (info.h.allDay) ranges.appendChild(el('span', 'range', L.always));
        else if (info.h.ranges.length) info.h.ranges.forEach(function (r) { ranges.appendChild(el('span', 'range', rangeText(r))); });
        else ranges.appendChild(el('span', info.h.raw ? 'raw' : 'closed', info.h.raw || L.closed));
        hours.appendChild(ranges);
        if (info.special) hours.appendChild(el('div', 'note', info.note ? shortDate(dn) + ' · ' + info.note : shortDate(dn)));
        li.appendChild(hours);
        list.appendChild(li);
      }
    }

    function renderSpecials(today) {
      var list = $('special-list');
      clear(list);
      var items = [];
      if (specialsCount > 0 && specials.length) {
        var cur = null;
        for (var dn = today; dn < today + LOOKAHEAD_DAYS && items.length <= specialsCount; dn++) {
          var i = specialFor(dn);
          if (cur && i === cur.index && dn === cur.to + 1) { cur.to = dn; continue; }
          cur = null;
          if (i >= 0) { cur = { index: i, from: dn, to: dn }; items.push(cur); }
        }
        items = items.slice(0, specialsCount);
      }
      items.forEach(function (it) {
        var s = specials[it.index];
        var li = el('li', 'sp');
        var when = it.from === it.to ? shortDate(it.from) : shortDate(it.from) + ' – ' + shortDate(it.to);
        li.appendChild(el('div', 'when', when));
        var what = el('div', 'what');
        var h = parseHours(s.hours), sh = el('div', 'sh');
        if (h.ranges.length && !h.allDay) h.ranges.forEach(function (r) { sh.appendChild(el('span', 'range', rangeText(r))); });
        else sh.textContent = hoursLabel(h);
        what.appendChild(sh);
        what.appendChild(el('div', 'sn', s.note));
        li.appendChild(what);
        list.appendChild(li);
      });
      $('specials').classList.toggle('none', !items.length);
      body.classList.toggle('nospecials', !items.length);
    }

    function renderStatus(n) {
      var s = status(n);
      var c = colors[s.state];
      root.style.setProperty('--state', c);
      root.style.setProperty('--state-tint', mix(c, bg, dark ? 0.2 : 0.13));
      root.style.setProperty('--state-ring', mix(c, bg, 0.25));
      $('state').textContent = s.word;
      $('detail').textContent = s.detail;
      $('detail2').textContent = s.detail2;
      $('today-note').textContent = todayWord + ': ' + hoursLabel(dayHours(n.dn).h);
      body.setAttribute('data-state', s.state);
    }

    /* ---------- layout and fitting ---------- */
    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var cls = W / H > 3 ? 'strip' : (H > W ? 'portrait' : 'landscape');
      body.classList.remove('strip', 'portrait', 'landscape');
      body.classList.add(cls);
      var u = cls === 'strip' ? H / 100 : (cls === 'portrait' ? Math.min(W / 100, H / 177.8) : Math.min(H / 100, W / 177.8));
      root.style.setProperty('--u', u.toFixed(2) + 'px');
      return cls;
    }
    function over(node) { return node && (node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1); }
    // A row's content is centred, so it can spill upwards where scrollHeight does not see it: measure it.
    function rowOver(row) {
      var cs = window.getComputedStyle(row);
      var room = row.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
      for (var i = 0; i < row.children.length; i++) {
        var c = row.children[i];
        if (c.offsetHeight > room + 1 || c.scrollWidth > c.clientWidth + 1) return true;
      }
      return false;
    }
    function overflowing() {
      var main = document.querySelector('.body');
      if (over(main) || over($('days')) || over($('status')) || over($('special-list').parentNode)) return true;
      var rows = document.querySelectorAll('.day, .sp');
      for (var i = 0; i < rows.length; i++) if (rowOver(rows[i])) return true;
      return false;
    }
    // One width for the day names (and the special dates) so the hours line up, capped at 46% of a row.
    function alignColumns() {
      [['.day .name', '--name-w', $('days')], ['.sp .when', '--when-w', $('special-list')]].forEach(function (c) {
        root.style.setProperty(c[1], 'auto');
        var nodes = document.querySelectorAll(c[0]), max = 0;
        for (var i = 0; i < nodes.length; i++) max = Math.max(max, nodes[i].scrollWidth);
        var cap = c[2].clientWidth * 0.46;
        if (max) root.style.setProperty(c[1], Math.ceil(Math.min(max + 2, cap)) + 'px');
      });
    }
    // The status word as big as the card allows (it is clipped, so compare its full width with its box).
    function fitState() {
      var word = $('state'), row = word.parentNode;
      row.style.fontSize = '';
      for (var i = 0; i < 3 && word.scrollWidth > word.clientWidth + 1; i++) {
        var size = parseFloat(window.getComputedStyle(row).fontSize) || 0;
        if (!size) break;
        row.style.fontSize = Math.floor(size * Math.max(0.4, word.clientWidth / word.scrollWidth) * 0.98) + 'px';
      }
    }
    // True when a day's split hours no longer fit on one line.
    function wrapped() {
      var rows = document.querySelectorAll('.day .ranges');
      for (var i = 0; i < rows.length; i++) {
        var spans = rows[i].children;
        if (spans.length > 1 && spans[spans.length - 1].offsetTop > spans[0].offsetTop + 2) return true;
      }
      return false;
    }
    function setK(k) {
      root.style.setProperty('--k', k.toFixed(2));
      alignColumns(); fitState();
    }
    // Largest size that fits: split hours on one line if that works down to 85%, else one range per line.
    function fit() {
      body.classList.remove('stack');
      setK(1);
      if (body.classList.contains('strip')) return;
      var k;
      for (k = 1; k >= 0.85; k -= 0.03) {
        setK(k);
        if (!wrapped() && !overflowing()) return;
      }
      body.classList.add('stack');
      for (k = 1; k > 0.5; k -= 0.03) {
        setK(k);
        if (!overflowing()) return;
      }
    }

    var lastKey = '';
    function tick(force) {
      var t = new Date();
      if (mode !== 'off') {
        $('clock').textContent = clockFmt.format(t);
        $('date').textContent = upperFirst(headDateFmt.format(t));
      }
      var n = now();
      var key = n.dn + ':' + n.min;
      if (!force && key === lastKey) return;
      var newDay = lastKey.split(':')[0] !== String(n.dn);
      lastKey = key;
      renderStatus(n);
      if (newDay) specialCache = {};
      if (force || newDay) { renderWeek(n.dn); renderSpecials(n.dn); }
      fit();
    }

    shape();
    tick(true);
    setInterval(function () { tick(false); }, 5000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit, fit);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fit);
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { shape(); tick(true); }, 200);
    });
  });
})();
