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

    var locale = v.locale || undefined;
    var tz = v.timezone || undefined;
    var fmtMode = v.clock_format || 'auto';
    var hidden = v.hide_titles === true;
    var reserved = str(v.reserved_label) || 'Reserved';
    var showOrganizer = v.show_organizer !== false && !hidden;

    $('room').textContent = str(v.room_name);
    $('now-label').textContent = str(v.now_label) || 'Now';
    $('next-label').textContent = str(v.next_label) || 'Up next';

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
        var title = str(d['event_' + i + '_title']) || str(d['event_' + i + '_summary']);
        var time = str(d['event_' + i + '_time']);
        if (!title && !time) continue;
        events.push({ title: title, time: time, date: str(d['event_' + i + '_date']), who: str(d['event_' + i + '_organizer']), today: i < today });
      }
      return {
        busy: busy,
        status: str(d.status),
        detail: str(d.status_detail),
        current: busy ? { title: str(d.current_title) || str(d.current_summary), time: str(d.current_time), who: str(d.current_organizer) } : null,
        next: (str(d.next_title) || str(d.next_summary) || str(d.next_time))
          ? { title: str(d.next_title) || str(d.next_summary), time: str(d.next_time), who: str(d.next_organizer) } : null,
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
        { title: 'Quarterly planning', time: span(0, 60), who: 'Maya Okafor', today: true },
        { title: 'Design review: onboarding flow', time: span(90, 150), who: 'Tomás Lindqvist', today: true },
        { title: 'Partner call — Harbour & Finch', time: span(240, 270), who: 'Priya Raman', today: true }
      ];
      return {
        busy: true, status: '', detail: 'Busy until ' + timeFmt.format(at(60)),
        current: { title: ev[0].title, time: ev[0].time, who: ev[0].who },
        next: { title: ev[1].title, time: 'Today, ' + timeFmt.format(at(90)), who: ev[1].who },
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
      $('word').textContent = s.status || (s.busy ? str(v.busy_label) || 'Busy' : str(v.available_label) || 'Available');
      $('detail').textContent = s.detail;
      $('sample').hidden = !s.sample;

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
      $('agenda-label').textContent = todays ? (str(v.agenda_label) || 'Today') : (str(v.upcoming_label) || 'Coming up');
      if (!shown.length) {
        list.appendChild(el('li', 'empty-line', str(v.empty_label) || 'Nothing else booked'));
      }
      shown.forEach(function (e) {
        var li = el('li', 'item');
        var isCurrent = s.current && e.time === s.current.time && e.title === s.current.title;
        if (isCurrent) { li.className += ' current'; }
        // Today's rows show the time span; later rows show the day and start ("Wed 7 Oct, 09:00").
        li.appendChild(el('div', 'when', todays ? e.time : (e.date || e.time)));
        var what = el('div', 'what');
        var t = el('div', 'title', titleOf(e.title));
        if (isCurrent) t.setAttribute('data-now', str(v.now_label) || 'Now');
        what.appendChild(t);
        if (e.who && showOrganizer) what.appendChild(el('div', 'who', e.who));
        li.appendChild(what);
        list.appendChild(li);
      });
      document.body.classList.toggle('quiet', !s.next && !shown.length);
      alignTimes();
      fitAll();
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
      probe.style.font = cs.font; probe.style.letterSpacing = cs.letterSpacing; probe.style.fontVariantNumeric = cs.fontVariantNumeric;
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { alignTimes(); fitAll(); });
    // A web font can finish after fonts.ready on slow players; measure again when any face lands.
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { alignTimes(); fitAll(); });
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
