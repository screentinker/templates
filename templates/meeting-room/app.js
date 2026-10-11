/*
 * Meeting room sign — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. A bound Calendar (iCal) data source arrives in ST.data.calendar as the flat
 * keys of the server's ical-resolver: is_busy (boolean), status (localized BUSY/AVAILABLE),
 * status_detail ("Busy until 11:00"), current_title/current_time/current_organizer,
 * next_title/next_time/next_organizer, events_today_count, event_count and per event (0-based)
 * event_N_title/_time/_date/_organizer. Busy vs available is decided from is_busy, never from the
 * localized text. Writes with textContent, fetches nothing, uses no eval.
 */
(function () {
  'use strict';

  var AGENDA_MAX = 5;

  /* The words on the sign, per language (picked by the primary subtag of the Language setting, or the
     screen's language when that is empty). English is the fallback for any missing word. {t} is a time. */
  var STRINGS = {
    en: {
      available: 'Available',
      busy: 'Busy',
      reserved: 'Reserved',
      now: 'Now',
      next: 'Up next',
      today: 'Today',
      coming: 'Coming up',
      empty: 'Nothing else booked',
      busy_until: 'Busy until {t}',
      today_at: 'Today, {t}',
      free_until: 'Free until {t}',
      free_all_day: 'Free all day',
      all_day: 'All day',
      tomorrow: 'Tomorrow',
      day_at: '{d}, {t}',
      sample: 'Sample schedule — connect a calendar',
      sample_1: 'Quarterly planning',
      sample_2: 'Design review: onboarding flow',
      sample_3: 'Partner call — Harbour & Finch'
    },
    de: {
      available: 'Frei',
      busy: 'Belegt',
      reserved: 'Reserviert',
      now: 'Jetzt',
      next: 'Als Nächstes',
      today: 'Heute',
      coming: 'Demnächst',
      empty: 'Keine weiteren Buchungen',
      busy_until: 'Belegt bis {t}',
      today_at: 'Heute, {t}',
      free_until: 'Frei bis {t}',
      free_all_day: 'Den ganzen Tag frei',
      all_day: 'Ganztägig',
      tomorrow: 'Morgen',
      day_at: '{d}, {t}',
      sample: 'Beispielplan — Kalender verbinden',
      sample_1: 'Quartalsplanung',
      sample_2: 'Design-Review: Onboarding',
      sample_3: 'Partnertermin — Harbour & Finch'
    },
    es: {
      available: 'Libre',
      busy: 'Ocupada',
      reserved: 'Reservada',
      now: 'Ahora',
      next: 'A continuación',
      today: 'Hoy',
      coming: 'Próximamente',
      empty: 'No hay más reservas',
      busy_until: 'Ocupada hasta {t}',
      today_at: 'Hoy, {t}',
      free_until: 'Libre hasta {t}',
      free_all_day: 'Libre todo el día',
      all_day: 'Todo el día',
      tomorrow: 'Mañana',
      day_at: '{d}, {t}',
      sample: 'Horario de ejemplo — conecte un calendario',
      sample_1: 'Planificación trimestral',
      sample_2: 'Revisión de diseño: onboarding',
      sample_3: 'Llamada con socios — Harbour & Finch'
    },
    fr: {
      available: 'Libre',
      busy: 'Occupée',
      reserved: 'Réservée',
      now: 'En cours',
      next: 'À suivre',
      today: 'Aujourd’hui',
      coming: 'Prochainement',
      empty: 'Aucune autre réservation',
      busy_until: 'Occupée jusqu’à {t}',
      today_at: 'Aujourd’hui, {t}',
      free_until: 'Libre jusqu’à {t}',
      free_all_day: 'Libre toute la journée',
      all_day: 'Toute la journée',
      tomorrow: 'Demain',
      day_at: '{d}, {t}',
      sample: 'Planning d’exemple — connectez un calendrier',
      sample_1: 'Planification trimestrielle',
      sample_2: 'Revue de design : onboarding',
      sample_3: 'Appel partenaire — Harbour & Finch'
    },
    hi: {
      available: 'उपलब्ध',
      busy: 'व्यस्त',
      reserved: 'आरक्षित',
      now: 'अभी',
      next: 'इसके बाद',
      today: 'आज',
      coming: 'आगामी',
      empty: 'कोई और बुकिंग नहीं',
      busy_until: '{t} तक व्यस्त',
      today_at: 'आज, {t}',
      free_until: '{t} तक उपलब्ध',
      free_all_day: 'पूरे दिन उपलब्ध',
      all_day: 'पूरा दिन',
      tomorrow: 'कल',
      day_at: '{d}, {t}',
      sample: 'नमूना कार्यक्रम — कैलेंडर जोड़ें',
      sample_1: 'तिमाही योजना',
      sample_2: 'डिज़ाइन समीक्षा: ऑनबोर्डिंग',
      sample_3: 'पार्टनर कॉल — Harbour & Finch'
    },
    it: {
      available: 'Libera',
      busy: 'Occupata',
      reserved: 'Riservata',
      now: 'Ora',
      next: 'A seguire',
      today: 'Oggi',
      coming: 'Prossimamente',
      empty: 'Nessun’altra prenotazione',
      busy_until: 'Occupata fino alle {t}',
      today_at: 'Oggi, {t}',
      free_until: 'Libera fino alle {t}',
      free_all_day: 'Libera tutto il giorno',
      all_day: 'Tutto il giorno',
      tomorrow: 'Domani',
      day_at: '{d}, {t}',
      sample: 'Programma di esempio — collega un calendario',
      sample_1: 'Pianificazione trimestrale',
      sample_2: 'Revisione design: onboarding',
      sample_3: 'Call con i partner — Harbour & Finch'
    },
    ja: {
      available: '空き',
      busy: '使用中',
      reserved: '予約済み',
      now: '進行中',
      next: '次の予定',
      today: '本日',
      coming: '今後の予定',
      empty: 'この後の予約はありません',
      busy_until: '{t}まで使用中',
      today_at: '本日 {t}',
      free_until: '{t}まで空き',
      free_all_day: '終日空き',
      all_day: '終日',
      tomorrow: '明日',
      day_at: '{d} {t}',
      sample: 'サンプル — カレンダー未接続',
      sample_1: '四半期計画会議',
      sample_2: 'デザインレビュー：導入フロー',
      sample_3: 'パートナー会議 — Harbour & Finch'
    },
    nl: {
      available: 'Vrij',
      busy: 'Bezet',
      reserved: 'Gereserveerd',
      now: 'Nu',
      next: 'Hierna',
      today: 'Vandaag',
      coming: 'Binnenkort',
      empty: 'Geen andere boekingen',
      busy_until: 'Bezet tot {t}',
      today_at: 'Vandaag, {t}',
      free_until: 'Vrij tot {t}',
      free_all_day: 'De hele dag vrij',
      all_day: 'Hele dag',
      tomorrow: 'Morgen',
      day_at: '{d}, {t}',
      sample: 'Voorbeeldrooster — koppel een agenda',
      sample_1: 'Kwartaalplanning',
      sample_2: 'Designreview: onboarding',
      sample_3: 'Partnergesprek — Harbour & Finch'
    },
    pt: {
      available: 'Livre',
      busy: 'Ocupada',
      reserved: 'Reservada',
      now: 'Agora',
      next: 'A seguir',
      today: 'Hoje',
      coming: 'Em breve',
      empty: 'Nenhuma outra reserva',
      busy_until: 'Ocupada até {t}',
      today_at: 'Hoje, {t}',
      free_until: 'Livre até {t}',
      free_all_day: 'Livre o dia todo',
      all_day: 'Dia inteiro',
      tomorrow: 'Amanhã',
      day_at: '{d}, {t}',
      sample: 'Agenda de exemplo — conecte um calendário',
      sample_1: 'Planejamento trimestral',
      sample_2: 'Revisão de design: onboarding',
      sample_3: 'Reunião com parceiros — Harbour & Finch'
    },
    zh: {
      available: '空闲',
      busy: '使用中',
      reserved: '已预订',
      now: '当前',
      next: '下一场',
      today: '今天',
      coming: '即将开始',
      empty: '暂无其他预订',
      busy_until: '使用至 {t}',
      today_at: '今天 {t}',
      free_until: '空闲至 {t}',
      free_all_day: '全天空闲',
      all_day: '全天',
      tomorrow: '明天',
      day_at: '{d} {t}',
      sample: '示例日程 — 请连接日历',
      sample_1: '季度规划会',
      sample_2: '设计评审：新用户引导',
      sample_3: '合作伙伴电话会 — Harbour & Finch'
    }
  };

  /* The Calendar data source writes its text in ITS own language setting (English unless set), which may
     not be the sign's. These are the server's words (server/lib/data-sources/ical-resolver.js), so the
     sign can recognise them in any of its languages and say them again in its own: {t} is a time.
     [intl, busy until, free until, free all day, all day, today, tomorrow, masked title] */
  var SRV = {
    en: ['en-US', 'Busy until {t}', 'Free until {t}', 'Free all day', 'All day', 'Today', 'Tomorrow', 'Busy'],
    de: ['de-DE', 'Belegt bis {t}', 'Frei bis {t}', 'Ganztägig frei', 'Ganztägig', 'Heute', 'Morgen', 'Belegt'],
    nl: ['nl-NL', 'Bezet tot {t}', 'Vrij tot {t}', 'De hele dag vrij', 'Hele dag', 'Vandaag', 'Morgen', 'Bezet'],
    es: ['es-ES', 'Ocupado hasta las {t}', 'Libre hasta las {t}', 'Libre todo el día', 'Todo el día', 'Hoy', 'Mañana', 'Ocupado'],
    fr: ['fr-FR', "Occupé jusqu'à {t}", "Libre jusqu'à {t}", 'Libre toute la journée', 'Journée entière', "Aujourd'hui", 'Demain', 'Occupé'],
    pt: ['pt-PT', 'Ocupado até {t}', 'Livre até {t}', 'Livre o dia todo', 'Dia inteiro', 'Hoje', 'Amanhã', 'Ocupado'],
    it: ['it-IT', 'Occupato fino alle {t}', 'Libero fino alle {t}', 'Libero tutto il giorno', 'Tutto il giorno', 'Oggi', 'Domani', 'Occupato'],
    hi: ['hi-IN', '{t} तक व्यस्त', '{t} तक उपलब्ध', 'पूरे दिन उपलब्ध', 'पूरा दिन', 'आज', 'कल', 'व्यस्त'],
    ja: ['ja-JP', '{t} まで使用中', '{t} まで空き', '終日空き', '終日', '今日', '明日', '使用中'],
    zh: ['zh-CN', '使用中，至 {t}', '空闲，至 {t}', '全天空闲', '全天', '今天', '明天', '使用中']
  };
  function srvPattern(tpl) {
    return new RegExp('^' + tpl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{t\\}', '(.+)') + '$', 'i');
  }

  function str(v) { return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  /* "#RRGGBB" darkened toward black, for browsers without color-mix. */
  function deepen(hex, f) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '';
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(x) { var s = Math.round(x * f).toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + c(r) + c(g) + c(b);
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    var availableColor = v.available_color || '#1FA971';
    var busyColor = v.busy_color || '#E5484D';

    var locale = str(v.locale) || undefined;
    // The sign's language: the Language setting, else the screen's. It picks the built-in words and the
    // lang attribute (hyphenation, CJK line breaking and glyph choice follow it).
    var lang = locale || (navigator.language || 'en');
    try { document.documentElement.lang = lang; } catch (e) { /* ignore */ }
    var T = STRINGS[String(lang).toLowerCase().split(/[-_]/)[0]] || STRINGS.en;
    function tr(key, t, d) { var s = T[key] || STRINGS.en[key]; return s.replace('{t}', t === undefined ? '' : t).replace('{d}', d === undefined ? '' : d); }
    var tz = v.timezone || undefined;
    var fmtMode = v.clock_format || 'auto';
    var hidden = v.hide_titles === true;
    var reserved = str(v.reserved_label) || tr('reserved');
    var showOrganizer = v.show_organizer !== false && !hidden;

    $('room').textContent = str(v.room_name);
    $('now-label').textContent = str(v.now_label) || tr('now');
    $('next-label').textContent = str(v.next_label) || tr('next');

    /* ---------- clock ---------- */
    function makeFmt(opts) {
      var o = {};
      for (var k in opts) o[k] = opts[k];
      if (tz) o.timeZone = tz;
      try { return new Intl.DateTimeFormat(locale, o); }
      catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(locale, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, opts); }
      }
    }
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (fmtMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (fmtMode === '12') timeOpts.hour12 = true;
    var timeFmt = makeFmt(timeOpts);
    var dateFmt = makeFmt({ weekday: 'long', day: 'numeric', month: 'long' });
    var dayKeyFmt = makeFmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
    if (fmtMode === 'off') $('clock').parentNode.hidden = true;

    var lastClock = '';
    function tick() {
      var now = new Date();
      var t = timeFmt.format(now);
      if (t === lastClock) return;
      lastClock = t;
      $('clock').textContent = t;
      $('date').textContent = dateFmt.format(now);
      fitAll();
    }

    /* ---------- the calendar's text, said again in the sign's language and clock format ---------- */
    var utcTimeOpts = {};
    for (var k0 in timeOpts) utcTimeOpts[k0] = timeOpts[k0];
    utcTimeOpts.timeZone = 'UTC';
    var wallTimeFmt = null, shortDayFmt = null;
    try { wallTimeFmt = new Intl.DateTimeFormat(locale, utcTimeOpts); } catch (e) { wallTimeFmt = null; }
    try { shortDayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { shortDayFmt = null; }
    // "09:00 AM", "9:00", "14.30" → minutes after midnight (a wall time: no zone is applied to it).
    function parseClock(s) {
      var m = /^(\d{1,2})[:.h](\d{2})\s*([ap])?\.?\s*m?\.?$/i.exec(str(s));
      if (!m) return null;
      var h = +m[1], mi = +m[2];
      if (m[3]) { if (h < 1 || h > 12) return null; h = h % 12 + (/p/i.test(m[3]) ? 12 : 0); }
      return h < 24 && mi < 60 ? h * 60 + mi : null;
    }
    function sayTime(s) {
      var m = parseClock(s);
      if (m === null || !wallTimeFmt) return s;
      try { return wallTimeFmt.format(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60))); } catch (e) { return s; }
    }
    function srvIs(s, idx) {
      for (var c in SRV) if (SRV[c][idx].toLowerCase() === s.toLowerCase()) return true;
      return false;
    }
    // A time range ("9:00 AM – 10:00 AM") or the all-day word.
    function saySpan(s) {
      if (!s) return s;
      if (srvIs(s, 4)) return tr('all_day');
      var p = s.split(/\s*[–—]\s*/);
      if (p.length !== 2) return s;
      if (parseClock(p[0]) === null || parseClock(p[1]) === null) return s;
      return sayTime(p[0]) + ' – ' + sayTime(p[1]);
    }
    // The day labels the server may have written for the next few weeks, in every language it speaks.
    var dayLabels = null, dayLabelsFor = '';
    var isoDayFmt = null;
    try { isoDayFmt = new Intl.DateTimeFormat('en-US', tz ? { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' } : { year: 'numeric', month: '2-digit', day: '2-digit' }); }
    catch (e) { try { isoDayFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e2) { isoDayFmt = null; } }
    function labelsNow() {
      if (!isoDayFmt || !isoDayFmt.formatToParts) return {};
      var key = isoDayFmt.format(new Date());
      if (dayLabels && dayLabelsFor === key) return dayLabels;
      dayLabels = {}; dayLabelsFor = key;
      var parts = {};
      try { isoDayFmt.formatToParts(new Date()).forEach(function (x) { parts[x.type] = x.value; }); } catch (e) { return dayLabels; }
      var base = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 12);
      if (!isFinite(base)) return dayLabels;
      for (var c in SRV) {
        var f;
        try { f = new Intl.DateTimeFormat(SRV[c][0], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { continue; }
        for (var i = -7; i < 46; i++) {
          if (i === 0 || i === 1) continue;   // Today / Tomorrow are words
          var dt = new Date(base + i * 86400000);
          dayLabels[str(f.format(dt)).toLowerCase()] = dt;
        }
      }
      return dayLabels;
    }
    // A day label → the sign's words. 'today' / 'tomorrow' / a date, or null when it is not one.
    function sayDay(s) {
      if (srvIs(s, 5)) return { today: true, text: tr('today') };
      if (srvIs(s, 6)) return { text: tr('tomorrow') };
      var dt = labelsNow()[s.toLowerCase()];
      if (dt && shortDayFmt) { try { return { text: shortDayFmt.format(dt) }; } catch (e) { /* fall through */ } }
      return null;
    }
    // "Wed, Oct 7, 9:00 AM" / "Today, 14:00" / "Tomorrow".
    function sayWhen(s) {
      if (!s) return s;
      var whole = sayDay(s);
      if (whole) return whole.text;
      var cut = s.lastIndexOf(', ');
      if (cut < 1) return s;
      var day = sayDay(s.slice(0, cut)), time = s.slice(cut + 2);
      if (!day || parseClock(time) === null) return s;
      return day.today ? tr('today_at', sayTime(time)) : tr('day_at', sayTime(time), day.text);
    }
    function sayDetail(s) {
      if (!s) return s;
      if (srvIs(s, 3)) return tr('free_all_day');
      for (var c in SRV) {
        var m = srvPattern(SRV[c][1]).exec(s);
        if (m && parseClock(m[1]) !== null) return tr('busy_until', sayTime(m[1]));
        m = srvPattern(SRV[c][2]).exec(s);
        if (m && parseClock(m[1]) !== null) return tr('free_until', sayTime(m[1]));
      }
      return s;
    }
    // A private event's masked title ("Busy", "Belegt", …) → the sign's busy word.
    function sayTitle(s) { return s && srvIs(s, 7) ? tr('busy') : s; }

    /* ---------- the schedule: from the calendar, or a sample built around the current time ---------- */
    function bound() {
      var d = (ST.data && ST.data.calendar) || null;
      if (!d || typeof d !== 'object') return null;
      if (typeof d.is_busy !== 'boolean' && d.status_en === undefined) return null;
      return d;
    }
    function fromCalendar(d) {
      var busy = d.is_busy === true || (typeof d.is_busy !== 'boolean' && /^busy$/i.test(str(d.status_en)));
      var count = Math.max(0, Math.min(50, Math.floor(Number(d.event_count) || 0)));
      var today = Math.max(0, Math.min(count, Math.floor(Number(d.events_today_count) || 0)));
      var events = [];
      for (var i = 0; i < count; i++) {
        var title = sayTitle(str(d['event_' + i + '_title']) || str(d['event_' + i + '_summary']));
        var time = saySpan(str(d['event_' + i + '_time']));
        if (!title && !time) continue;
        events.push({ title: title, time: time, date: sayWhen(str(d['event_' + i + '_date'])), who: str(d['event_' + i + '_organizer']), today: i < today });
      }
      var nextTitle = sayTitle(str(d.next_title) || str(d.next_summary)), nextTime = sayWhen(str(d.next_time));
      return {
        busy: busy,
        // A Calendar data source says busy/free with is_busy; the word on the sign is then always the sign's
        // own (its language, or the text typed in). Only a source without is_busy supplies its own word.
        status: typeof d.is_busy === 'boolean' ? '' : str(d.status),
        detail: sayDetail(str(d.status_detail)),
        current: busy ? { title: sayTitle(str(d.current_title) || str(d.current_summary)), time: saySpan(str(d.current_time)), who: str(d.current_organizer) } : null,
        next: (nextTitle || nextTime) ? { title: nextTitle, time: nextTime, who: str(d.next_organizer) } : null,
        events: events,
        todayCount: today,
        sample: false
      };
    }
    function sample() {
      // Busy now, in a meeting that started on the hour; two more later today. Times follow the clock
      // so the sample always reads true ("Busy until" the end of the hour).
      var now = Date.now();
      var start = now - (now % 3600000);
      function at(mins) { return new Date(start + mins * 60000); }
      function span(a, b) { return timeFmt.format(at(a)) + ' – ' + timeFmt.format(at(b)); }
      var ev = [
        { title: tr('sample_1'), time: span(0, 60), who: 'Maya Okafor', today: true },
        { title: tr('sample_2'), time: span(90, 150), who: 'Tomás Lindqvist', today: true },
        { title: tr('sample_3'), time: span(240, 270), who: 'Priya Raman', today: true }
      ];
      return {
        busy: true, status: '', detail: tr('busy_until', timeFmt.format(at(60))),
        current: { title: ev[0].title, time: ev[0].time, who: ev[0].who },
        next: { title: ev[1].title, time: tr('today_at', timeFmt.format(at(90))), who: ev[1].who },
        events: ev, todayCount: 3, sample: true
      };
    }

    /* ---------- render ---------- */
    function titleOf(t) { return hidden ? reserved : (t || reserved); }
    function meta(node, time, who) {
      while (node.firstChild) node.removeChild(node.firstChild);
      if (time) node.appendChild(document.createTextNode(time));
      if (who && showOrganizer) {
        if (time) node.appendChild(el('span', 'sep', '·'));
        node.appendChild(document.createTextNode(who));
      }
    }

    var lastKey = '';
    function render() {
      var d = bound();
      var s = d ? fromCalendar(d) : sample();
      var key = JSON.stringify(s) + window.innerWidth + 'x' + window.innerHeight;
      if (key === lastKey) return;
      lastKey = key;

      var color = s.busy ? busyColor : availableColor;
      root.style.setProperty('--state', color);
      root.style.setProperty('--state-deep', deepen(color, 0.62) || color);
      $('word').textContent = s.status || (s.busy ? str(v.busy_label) || tr('busy') : str(v.available_label) || tr('available'));
      $('detail').textContent = s.detail;
      $('sample').hidden = !s.sample;
      $('sample').textContent = tr('sample');

      var nowBox = $('now');
      if (s.current) {
        nowBox.hidden = false;
        $('now-title').textContent = titleOf(s.current.title);
        meta($('now-meta'), s.current.time, s.current.who);
      } else {
        nowBox.hidden = true;
      }

      var nextBox = $('next');
      if (s.next) {
        nextBox.hidden = false;
        $('next-title').textContent = titleOf(s.next.title);
        meta($('next-meta'), s.next.time, s.next.who);
      } else {
        nextBox.hidden = true;
      }

      // Today's bookings (including the one in progress); when nothing is left today, the next few later ones.
      var list = $('agenda');
      while (list.firstChild) list.removeChild(list.firstChild);
      var todays = s.todayCount > 0;
      var shown = todays ? s.events.filter(function (e) { return e.today; }) : s.events;
      shown = shown.slice(0, AGENDA_MAX);
      $('agenda-label').textContent = todays ? (str(v.agenda_label) || tr('today')) : (str(v.upcoming_label) || tr('coming'));
      if (!shown.length) {
        list.appendChild(el('li', 'empty-line', str(v.empty_label) || tr('empty')));
      }
      shown.forEach(function (e) {
        var li = el('li', 'item');
        var isCurrent = s.current && e.time === s.current.time && e.title === s.current.title;
        if (isCurrent) { li.className += ' current'; }
        // Today's rows show the time span; later rows show the day and start ("Wed 7 Oct, 09:00").
        li.appendChild(el('div', 'when', todays ? e.time : (e.date || e.time)));
        var what = el('div', 'what');
        var t = el('div', 'title', titleOf(e.title));
        t.dir = 'auto';
        if (isCurrent) t.setAttribute('data-now', str(v.now_label) || tr('now'));
        what.appendChild(t);
        if (e.who && showOrganizer) { var who = el('div', 'who', e.who); who.dir = 'auto'; what.appendChild(who); }
        li.appendChild(what);
        list.appendChild(li);
      });
      document.body.classList.toggle('quiet', !s.next && !shown.length);
      alignTimes();
      fitAll();
      clearBadge();
    }

    /* ---------- layout ---------- */
    function shape() {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var cls = w / h > 3 ? 'strip' : (h > w ? 'portrait' : 'landscape');
      document.body.classList.remove('strip', 'portrait', 'landscape');
      document.body.classList.add(cls);
    }
    /* Width of a string in an element's font, measured off-layout (a nowrap flex child grows to fit its
       own text, so measuring it in place always says "fits"). */
    function textWidth(ref, text) {
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';
      var cs = window.getComputedStyle(ref);
      // Longhands, not cs.font: the shorthand reads back as '' when a longhand such as
      // font-variant-numeric cannot be expressed in it (the agenda times), and the probe then measured
      // the body font instead.
      probe.style.fontFamily = cs.fontFamily; probe.style.fontSize = cs.fontSize; probe.style.fontWeight = cs.fontWeight;
      probe.style.fontStyle = cs.fontStyle; probe.style.fontStretch = cs.fontStretch;
      probe.style.letterSpacing = cs.letterSpacing; probe.style.fontVariantNumeric = cs.fontVariantNumeric;
      probe.textContent = text;
      document.body.appendChild(probe);
      var w = probe.getBoundingClientRect().width;
      document.body.removeChild(probe);
      return w;
    }
    /* One column width for every agenda time: at least the widest one (min-width, so a sub-pixel miss
       never ellipsises the end of a time), capped so titles keep most of the row. */
    function alignTimes() {
      var whens = document.querySelectorAll('.item .when');
      var max = 0, i;
      for (i = 0; i < whens.length; i++) max = Math.max(max, textWidth(whens[i], whens[i].textContent));
      var cap = Math.ceil($('agenda').clientWidth * 0.42);
      for (i = 0; i < whens.length; i++) {
        whens[i].style.width = '';
        whens[i].style.minWidth = Math.min(Math.ceil(max) + 2, cap) + 'px';
        whens[i].style.maxWidth = cap + 'px';
      }
    }

    /* Agenda text that would run under the sample badge (bottom right) stops short of it instead. */
    function clearBadge() {
      var badge = $('sample');
      var lines = document.querySelectorAll('.item .title, .item .who'), i;
      for (i = 0; i < lines.length; i++) lines[i].style.paddingRight = '';
      if (badge.hidden) return;
      var b = badge.getBoundingClientRect();
      for (i = 0; i < lines.length; i++) {
        var r = lines[i].getBoundingClientRect();
        var overlap = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);   // a line box grazing the badge is fine
        if (overlap > r.height * 0.3 && r.right > b.left) lines[i].style.paddingRight = Math.ceil(r.right - b.left + 12) + 'px';
      }
    }

    /* The status word is as big as the band allows: the CSS size is the maximum, shrunk to fit the width. */
    function fitAll() {
      // A long room name: shrink (to 60% at most) until its longest word fits on a line, then let it wrap.
      var room = $('room');
      room.style.fontSize = '';
      var words = room.textContent.split(/\s+/), longest = '';
      words.forEach(function (w) { if (w.length > longest.length) longest = w; });
      // Room for the name = the header row minus the clock and the gap between them.
      var top = room.parentNode, box = top.querySelector('.clockbox');
      var gap = parseFloat(window.getComputedStyle(top).columnGap) || 0;
      var avail = top.clientWidth - (box ? box.offsetWidth : 0) - gap;
      var need = longest ? textWidth(room, longest) : 0;
      if (avail > 0 && need > avail) {
        var fs = parseFloat(window.getComputedStyle(room).fontSize);
        room.style.fontSize = Math.floor(fs * Math.max(0.6, avail / need * 0.97)) + 'px';
      }

      var word = $('word'), row = word.parentNode;
      row.style.fontSize = '';
      var dot = row.firstChild;
      var avail = row.clientWidth - (dot && dot.offsetWidth ? dot.offsetWidth * 1.6 : 0);
      var need = word.scrollWidth;
      if (avail > 0 && need > avail) {
        var size = parseFloat(window.getComputedStyle(row).fontSize) || 0;
        if (size) row.style.fontSize = Math.floor(size * avail / need * 0.98) + 'px';
      }
    }

    shape();
    tick();
    render();
    setInterval(tick, 1000);
    // Calendar data is synced by the server; re-read it (and roll the sample forward) every minute.
    setInterval(render, 60000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { alignTimes(); fitAll(); clearBadge(); });
    // A web font can finish after fonts.ready on slow players; measure again when any face lands.
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { alignTimes(); fitAll(); clearBadge(); });
    // The clock/date can change width after the name was fitted (a font swap, a longer weekday): refit then.
    if (window.ResizeObserver) {
      var lastBoxW = 0;
      new ResizeObserver(function (entries) {
        var w = Math.round(entries[0].contentRect.width);
        if (w !== lastBoxW) { lastBoxW = w; fitAll(); }
      }).observe(document.querySelector('.clockbox'));
    }
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { shape(); lastKey = ''; render(); }, 200);
    });
  });
})();
