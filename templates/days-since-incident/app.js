/*
 * Days since last incident — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. The date of the last incident comes from the `last_incident` setting, or,
 * when a table data source (Google Sheet, CSV, Manual table) is bound to `incidents` and has the
 * date column, from the most recent date in that column (ST.data.incidents.row{i}_{col}). The
 * streak is counted here, on the screen, once a minute, in the chosen timezone: whole calendar days
 * (midnight to midnight in that timezone) for "Days", elapsed time for the other units.
 * Writes with textContent, fetches nothing, uses no eval.
 */
(function () {
  'use strict';

  var MAX_ROWS = 100;
  var DAY = 86400000;
  var PPE = ['hard_hat', 'goggles', 'hivis', 'gloves', 'boots', 'ear'];

  /* The fixed words on screen, per language (primary subtag of the locale setting, English as fallback).
     A non-empty setting (best_label, status_green, ppe_labels...) always wins over these. */
  var STRINGS = {
    en: {
      best: 'Best ever',
      record: 'New record',
      target: 'Target',
      since: 'Last incident',
      today: 'Incident reported today',
      green: 'On target',
      amber: 'Building',
      red: 'Stay alert',
      ppe: 'PPE required in this area',
      ppe_names: 'Hard hat|Eye protection|Hi-vis|Gloves|Safety boots|Ear protection',
      future: 'The last incident date is in the future',
      unset: 'Set the date of the last incident',
      day: { one: 'day', other: 'days' },
      hour: { one: 'hour', other: 'hours' },
      minute: { one: 'minute', other: 'minutes' }
    },
    de: {
      best: 'Bisheriger Rekord',
      record: 'Neuer Rekord',
      target: 'Ziel',
      since: 'Letzter Vorfall',
      today: 'Heute Vorfall gemeldet',
      green: 'Im Ziel',
      amber: 'Im Aufbau',
      red: 'Aufmerksam bleiben',
      ppe: 'PSA-Pflicht in diesem Bereich',
      ppe_names: 'Schutzhelm|Schutzbrille|Warnweste|Handschuhe|Sicherheits\u00adschuhe|Gehör\u00adschutz',
      future: 'Das Datum des letzten Vorfalls liegt in der Zukunft',
      unset: 'Datum des letzten Vorfalls eintragen',
      day: { one: 'Tag', other: 'Tage' },
      hour: { one: 'Stunde', other: 'Stunden' },
      minute: { one: 'Minute', other: 'Minuten' }
    },
    es: {
      best: 'Mejor marca',
      record: 'Nuevo récord',
      target: 'Objetivo',
      since: 'Último incidente',
      today: 'Incidente registrado hoy',
      green: 'En objetivo',
      amber: 'En progreso',
      red: 'Atención',
      ppe: 'EPI obligatorio en esta zona',
      ppe_names: 'Casco|Gafas de protección|Chaleco reflectante|Guantes|Calzado de seguridad|Protección auditiva',
      future: 'La fecha del último incidente es futura',
      unset: 'Indique la fecha del último incidente',
      day: { one: 'día', other: 'días' },
      hour: { one: 'hora', other: 'horas' },
      minute: { one: 'minuto', other: 'minutos' }
    },
    fr: {
      best: 'Meilleure série',
      record: 'Nouveau record',
      target: 'Objectif',
      since: 'Dernier incident',
      today: 'Incident signalé aujourd’hui',
      green: 'Dans l’objectif',
      amber: 'En progression',
      red: 'Restons vigilants',
      ppe: 'EPI obligatoires dans cette zone',
      ppe_names: 'Casque|Lunettes de protection|Gilet haute visibilité|Gants|Chaussures de sécurité|Protection auditive',
      future: 'La date du dernier incident est dans le futur',
      unset: 'Indiquez la date du dernier incident',
      day: { one: 'jour', other: 'jours' },
      hour: { one: 'heure', other: 'heures' },
      minute: { one: 'minute', other: 'minutes' }
    },
    hi: {
      best: 'सर्वश्रेष्ठ रिकॉर्ड',
      record: 'नया रिकॉर्ड',
      target: 'लक्ष्य',
      since: 'पिछली घटना',
      today: 'आज घटना दर्ज हुई',
      green: 'लक्ष्य पर',
      amber: 'प्रगति पर',
      red: 'सतर्क रहें',
      ppe: 'इस क्षेत्र में PPE अनिवार्य',
      ppe_names: 'हेलमेट|सुरक्षा चश्मा|हाई-विज़ जैकेट|दस्ताने|सेफ़्टी जूते|कान सुरक्षा',
      future: 'पिछली घटना की तारीख़ भविष्य में है',
      unset: 'पिछली घटना की तारीख़ सेट करें',
      day: { one: 'दिन', other: 'दिन' },
      hour: { one: 'घंटा', other: 'घंटे' },
      minute: { one: 'मिनट', other: 'मिनट' }
    },
    it: {
      best: 'Record assoluto',
      record: 'Nuovo record',
      target: 'Obiettivo',
      since: 'Ultimo incidente',
      today: 'Incidente segnalato oggi',
      green: 'In linea',
      amber: 'In crescita',
      red: 'Massima attenzione',
      ppe: 'DPI obbligatori in quest’area',
      ppe_names: 'Elmetto|Occhiali protettivi|Alta visibilità|Guanti|Scarpe antinfor\u00adtunistiche|Protezione udito',
      future: 'La data dell’ultimo incidente è nel futuro',
      unset: 'Inserisci la data dell’ultimo incidente',
      day: { one: 'giorno', other: 'giorni' },
      hour: { one: 'ora', other: 'ore' },
      minute: { one: 'minuto', other: 'minuti' }
    },
    ja: {
      best: '過去最高',
      record: '新記録',
      target: '目標',
      since: '前回の災害',
      today: '本日、災害が発生しました',
      green: '順調',
      amber: '継続中',
      red: '要注意',
      ppe: 'この区域では保護具を着用',
      ppe_names: 'ヘルメット|保護メガネ|安全ベスト|手袋|安全靴|耳栓',
      future: '前回の災害日が未来の日付です',
      unset: '前回の災害日を設定してください',
      day: { other: '日' },
      hour: { other: '時間' },
      minute: { other: '分' }
    },
    nl: {
      best: 'Beste reeks',
      record: 'Nieuw record',
      target: 'Doel',
      since: 'Laatste incident',
      today: 'Vandaag incident gemeld',
      green: 'Op koers',
      amber: 'In opbouw',
      red: 'Blijf alert',
      ppe: 'PBM verplicht in dit gebied',
      ppe_names: 'Veiligheids\u00adhelm|Veiligheids\u00adbril|Signaalvest|Hand\u00adschoenen|Veiligheids\u00adschoenen|Gehoor\u00adbescherming',
      future: 'De datum van het laatste incident ligt in de toekomst',
      unset: 'Vul de datum van het laatste incident in',
      day: { one: 'dag', other: 'dagen' },
      hour: { one: 'uur', other: 'uur' },
      minute: { one: 'minuut', other: 'minuten' }
    },
    pt: {
      best: 'Melhor marca',
      record: 'Novo recorde',
      target: 'Meta',
      since: 'Último incidente',
      today: 'Incidente registrado hoje',
      green: 'Na meta',
      amber: 'Em evolução',
      red: 'Atenção redobrada',
      ppe: 'EPI obrigatório nesta área',
      ppe_names: 'Capacete|Óculos de proteção|Colete refletivo|Luvas|Botas de segurança|Protetor auricular',
      future: 'A data do último incidente está no futuro',
      unset: 'Informe a data do último incidente',
      day: { one: 'dia', other: 'dias' },
      hour: { one: 'hora', other: 'horas' },
      minute: { one: 'minuto', other: 'minutos' }
    },
    zh: {
      best: '最佳纪录',
      record: '新纪录',
      target: '目标',
      since: '上次事故',
      today: '今日发生事故',
      green: '达标',
      amber: '持续累积',
      red: '保持警惕',
      ppe: '本区域须佩戴防护用品',
      ppe_names: '安全帽|护目镜|反光背心|手套|安全鞋|护耳',
      future: '上次事故日期晚于今天',
      unset: '请设置上次事故日期',
      day: { other: '天' },
      hour: { other: '小时' },
      minute: { other: '分钟' }
    }
  };

  function str(x) { return x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function num(x, lo, hi, dflt) {
    var n = Number(x);
    if (x === '' || x === null || x === undefined || !isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    function color(name, key) { if (v[key]) root.style.setProperty(name, v[key]); }
    color('--bg', 'background'); color('--accent', 'accent');
    color('--green', 'green_color'); color('--amber', 'amber_color'); color('--red', 'red_color');

    var locale = str(v.locale) || undefined;
    // The language of the fixed words: the locale setting, else the player's own language.
    var lang = locale || (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages || [])[0])) || 'en';
    var L = STRINGS[String(lang).toLowerCase().split(/[-_]/)[0]] || STRINGS.en;
    function t(key) { return L[key] !== undefined ? L[key] : STRINGS.en[key]; }
    try { root.lang = String(lang); } catch (e) { /* keep "en" */ }
    var plurals = null;
    try { plurals = new Intl.PluralRules(lang); } catch (e) { try { plurals = new Intl.PluralRules(); } catch (e2) { plurals = null; } }
    function pluralWord(n, unit) {
      var w = t(unit);
      var cat = plurals ? plurals.select(n) : (n === 1 ? 'one' : 'other');
      return w[cat] || w.other;
    }
    var tz = str(v.timezone) || undefined;
    var unitMode = str(v.count_unit) || 'days';
    var clockMode = str(v.clock_format) || 'auto';

    /* ---------- Intl helpers (a bad locale or timezone falls back rather than throwing) ---------- */
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
    var intFmt = nf({ maximumFractionDigits: 0 }) || { format: String };
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (clockMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (clockMode === '12') timeOpts.hour12 = true;
    var clockFmt = dtf(timeOpts);
    var dateFmt = dtf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var sinceDateFmt = dtf({ day: 'numeric', month: 'long', year: 'numeric' });
    var sinceTimeFmt = dtf({ day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    var partsFmt = dtf({ year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
    if (clockMode === 'off') $('clockbox').hidden = true;

    /* "104 days" in the chosen language, and just the word ("days") for the label under the count. */
    var unitFmts = {};
    function unitText(n, unit, wordOnly) {
      var key = unit;
      if (!(key in unitFmts)) unitFmts[key] = nf({ style: 'unit', unit: unit, unitDisplay: 'long', maximumFractionDigits: 0 });
      var f = unitFmts[key];
      if (f && f.formatToParts) {
        try {
          var parts = f.formatToParts(n);
          if (!wordOnly) return f.format(n);
          var w = parts.filter(function (p) { return p.type === 'unit'; }).map(function (p) { return p.value; }).join(' ');
          if (w) return w;
        } catch (e) { /* older engine: English below */ }
      }
      var word = pluralWord(n, unit);
      return wordOnly ? word : intFmt.format(n) + ' ' + word;
    }

    /* ---------- time arithmetic in the site timezone ---------- */
    // Wall-clock fields of an instant in the site timezone.
    function wall(t) {
      var o = {};
      try {
        partsFmt.formatToParts(new Date(t)).forEach(function (p) { if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
      } catch (e) { o = {}; }
      if (!o.year) { var d = new Date(t); o = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }; }
      if (o.hour === 24) o.hour = 0;
      return o;
    }
    function offsetAt(t) {
      var w = wall(t);
      return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second || 0) - Math.floor(t / 1000) * 1000;
    }
    // A wall time in the site timezone → an instant (two passes settle a DST change).
    function instantOf(p) {
      var guess = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
      if (p.off !== null) return guess - p.off * 60000;
      var o1 = offsetAt(guess - 0), t = guess - o1, o2 = offsetAt(t);
      return o2 === o1 ? t : guess - o2;
    }
    function validDate(y, m, d) {
      if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1) return false;
      return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
    }
    // "2026-06-24", "2026-06-24 14:30", "2026-06-24T14:30:00Z", "24/06/2026", "6/24/2026 2:30".
    function parseWhen(s, order) {
      s = str(s);
      if (!s) return null;
      var m, p = null;
      if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[T ,]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s))) {
        p = { y: +m[1], m: +m[2], d: +m[3], h: m[4] ? +m[4] : 0, mi: m[5] ? +m[5] : 0, timed: !!m[4], off: null };
        if (m[7]) {
          if (/z/i.test(m[7])) p.off = 0;
          else { var sign = m[7][0] === '-' ? -1 : 1, q = m[7].replace(/[^0-9]/g, ''); p.off = sign * (parseInt(q.slice(0, 2), 10) * 60 + parseInt(q.slice(2), 10)); }
        }
      } else if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[T ,]+(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?)?$/i.exec(s))) {
        var a = +m[1], b = +m[2];
        var day = order === 'mdy' ? b : a, mon = order === 'mdy' ? a : b;
        var h = m[4] ? +m[4] : 0;
        if (m[6]) { var pm = /p/i.test(m[6]); h = (h % 12) + (pm ? 12 : 0); }
        p = { y: +m[3], m: mon, d: day, h: h, mi: m[5] ? +m[5] : 0, timed: !!m[4], off: null };
      }
      if (!p || !validDate(p.y, p.m, p.d) || p.h > 23 || p.mi > 59) return null;
      p.t = instantOf(p);
      // The incident's calendar day, in the site timezone.
      if (p.off !== null) { var w = wall(p.t); p.day = Date.UTC(w.year, w.month - 1, w.day); }
      else p.day = Date.UTC(p.y, p.m - 1, p.d);
      return p;
    }

    /* ---------- where the date and the record come from ---------- */
    function fromSource() {
      var d = ST.data && ST.data.incidents;
      if (!d || typeof d !== 'object') return null;
      var dk = slug(v.date_col || 'Last incident'), bk = slug(v.best_col || '');
      if (!dk) return null;
      var order = str(v.date_order) || 'dmy';
      var latest = null, best = null, seen = false;
      function take(raw) {
        if (raw === undefined) return;
        seen = true;
        var p = parseWhen(raw, order);
        if (p && (!latest || p.t > latest.t)) latest = p;
      }
      function takeBest(raw) {
        var n = parseFloat(str(raw).replace(/[^0-9.\-]/g, ''));
        if (isFinite(n) && n >= 0 && (best === null || n > best)) best = n;
      }
      // A single value (a lookup-mode key, or a REST source with one field) …
      take(d[dk]);
      if (bk && d[bk] !== undefined) takeBest(d[bk]);
      // … and every row of a table: a one-row status sheet or a whole incident log.
      for (var i = 1; i <= MAX_ROWS; i++) {
        var pre = 'row' + i + '_';
        if (d[pre + dk] === undefined) break;
        take(d[pre + dk]);
        if (bk && d[pre + bk] !== undefined) takeBest(d[pre + bk]);
      }
      if (!seen) return null;
      return { latest: latest, best: best };
    }

    var src = fromSource();
    var incident = (src && src.latest) || parseWhen(v.last_incident, str(v.date_order) || 'dmy');
    var bestParam = num(v.best_record, 0, 100000, 0);
    var best = src && src.best !== null ? src.best : bestParam;
    var target = num(v.target_days, 1, 100000, 365);
    var amberFrom = num(v.amber_days, 0, 100000, 30);
    var greenFrom = Math.max(amberFrom, num(v.green_days, 0, 100000, 90));

    /* ---------- static text ---------- */
    $('site').textContent = str(v.site_name);
    $('best-label').textContent = str(v.best_label) || t('best');
    $('target-label').textContent = str(v.target_label) || t('target');
    $('ppe-label').textContent = str(v.ppe_heading) || t('ppe');

    // The gauge's coloured zones, as shares of the target.
    function pct(x) { return Math.max(0, Math.min(100, x / target * 100)); }
    $('z-red').style.width = pct(amberFrom) + '%';
    $('z-amber').style.width = (pct(greenFrom) - pct(amberFrom)) + '%';
    $('z-green').style.width = (100 - pct(greenFrom)) + '%';
    $('t-amber').style.left = pct(amberFrom) + '%';
    $('t-green').style.left = pct(greenFrom) + '%';
    $('t-amber').hidden = pct(amberFrom) <= 0 || pct(amberFrom) >= 100;
    $('t-green').hidden = pct(greenFrom) <= 0 || pct(greenFrom) >= 100 || greenFrom === amberFrom;

    /* ---------- PPE signs ---------- */
    var names = str(v.ppe_labels).split('|');
    var builtinNames = t('ppe_names').split('|');
    var list = $('ppe');
    var shown = 0;
    PPE.forEach(function (key, i) {
      if (v['ppe_' + key] !== true) return;
      var li = el('li');
      var sign = el('span', 'sign');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 64 64');
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#ppe-' + key);
      svg.appendChild(use);
      sign.appendChild(svg);
      li.appendChild(sign);
      li.appendChild(el('span', 'ppe-name', str(names[i]) || builtinNames[i]));
      list.appendChild(li);
      shown++;
    });
    $('ppe-card').hidden = shown === 0;
    body.classList.toggle('no-ppe', shown === 0);
    // Up to four signs in one row, five or six in two rows of three.
    var ppeCols = Math.max(1, shown > 4 ? 3 : shown);
    var ppeRows = Math.ceil(shown / ppeCols) || 1;
    root.style.setProperty('--ppe-cols', String(ppeCols));

    /* ---------- rotating messages ---------- */
    var messages = String(v.messages == null ? '' : v.messages).split(/\r?\n/).map(str).filter(Boolean).slice(0, 50);
    body.classList.toggle('no-msg', !messages.length);
    $('msgbar').hidden = !messages.length;
    var msgIndex = 0;
    var msgEl = $('msg'), dots = $('dots');
    function showMessage() {
      msgEl.textContent = messages[msgIndex];
      while (dots.firstChild) dots.removeChild(dots.firstChild);
      if (messages.length > 1 && messages.length <= 12) {
        for (var i = 0; i < messages.length; i++) dots.appendChild(el('span', i === msgIndex ? 'on' : ''));
      }
    }
    if (messages.length) {
      showMessage();
      if (messages.length > 1) {
        var secs = num(v.message_seconds, 4, 120, 9);
        setInterval(function () {
          msgEl.classList.add('out');
          setTimeout(function () {
            msgIndex = (msgIndex + 1) % messages.length;
            showMessage();
            msgEl.classList.remove('out');
          }, 600);
        }, secs * 1000);
      }
    }

    /* ---------- the count ---------- */
    function setState(c) { root.style.setProperty('--state', c); }
    var lastKey = '';
    function render() {
      var nowT = Date.now();
      var w = wall(nowT);
      $('clock').textContent = clockFmt.format(new Date(nowT));
      $('date').textContent = dateFmt.format(new Date(nowT));

      var countText, unitWord, extra = '', days = 0, state, statusText, headline, sinceText;
      var valid = !!incident && incident.t <= nowT + 60000;
      if (valid) {
        var today = Date.UTC(w.year, w.month - 1, w.day);
        var elapsed = Math.max(0, nowT - incident.t);
        days = unitMode === 'days' ? Math.max(0, Math.round((today - incident.day) / DAY)) : Math.floor(elapsed / DAY);
        var isToday = today === incident.day;
        if (unitMode === 'hours') { var hrs = Math.floor(elapsed / 3600000); countText = intFmt.format(hrs); unitWord = unitText(hrs, 'hour', true); }
        else if (unitMode === 'minutes') { var mins = Math.floor(elapsed / 60000); countText = intFmt.format(mins); unitWord = unitText(mins, 'minute', true); }
        else {
          countText = intFmt.format(days); unitWord = unitText(days, 'day', true);
          if (unitMode === 'days_hours') extra = unitText(Math.floor((elapsed % DAY) / 3600000), 'hour', false);
        }
        if (str(v.unit_label)) unitWord = str(v.unit_label);
        if (isToday) {
          state = 'red'; statusText = str(v.incident_today_label) || t('today');
          headline = str(v.incident_today_note);
        } else {
          state = days >= greenFrom ? 'green' : days >= amberFrom ? 'amber' : 'red';
          statusText = str(v['status_' + state]) || t(state);
          headline = str(v.headline);
        }
        sinceText = (str(v.since_label) || t('since')) + ' · ' +
          (incident.timed ? sinceTimeFmt : sinceDateFmt).format(new Date(incident.t));
        body.classList.toggle('incident', isToday);
      } else {
        // Missing, unreadable or future date: say so rather than invent a number.
        countText = '?'; unitWord = str(v.unit_label) || unitText(0, 'day', true); state = 'amber';
        statusText = '';
        headline = str(v.headline);
        sinceText = incident ? t('future') : t('unset');
        body.classList.remove('incident');
      }
      body.classList.toggle('invalid', !valid);

      var record = valid && days > best;
      var shownBest = record ? days : best;
      var key = [countText, unitWord, extra, state, statusText, headline, sinceText, shownBest, record, window.innerWidth, window.innerHeight].join('|');
      if (key === lastKey) return;
      lastKey = key;

      setState('var(--' + state + ')');
      $('status').textContent = statusText;
      $('status').hidden = !statusText;
      $('count').textContent = countText;
      body.classList.toggle('long', countText.length > 3);
      var unitEl = $('unit');
      unitEl.textContent = unitWord;
      if (extra) { unitEl.appendChild(document.createTextNode(' · ')); unitEl.appendChild(el('span', 'extra', extra)); }
      $('headline').textContent = headline;
      $('headline').hidden = !headline;
      $('since').textContent = sinceText;

      $('best').textContent = unitText(shownBest, 'day', false);
      var rec = $('record');
      rec.textContent = str(v.new_record_label) || t('record');
      rec.hidden = !record;

      var tgt = $('target');
      tgt.textContent = '';
      tgt.appendChild(document.createTextNode(intFmt.format(valid ? days : 0)));
      tgt.appendChild(el('span', 'of', ' / ' + unitText(target, 'day', false)));
      var p = valid ? pct(days) : 0;
      $('fill').style.width = p + '%';
      $('pointer').style.left = p + '%';

      fit();
    }

    /* ---------- layout ---------- */
    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var cls = W / H > 3 ? 'strip' : (H > W ? 'portrait' : 'landscape');
      body.classList.remove('strip', 'portrait', 'landscape');
      body.classList.add(cls);
    }
    // The count is as large as its box allows: measured at 100px off-layout, then scaled to fit.
    function fit() {
      fitSigns();   // first: in portrait the signs decide how much height the plate keeps
      var count = $('count'), wrap = $('count-wrap');
      count.style.fontSize = '';
      var probe = el('span', 'count', count.textContent);
      probe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;font-size:100px';
      body.appendChild(probe);
      var w100 = probe.getBoundingClientRect().width || 1;
      body.removeChild(probe);
      var row = wrap.parentNode;
      var cls = body.classList;
      var beside = cls.contains('strip') || (cls.contains('landscape') && !cls.contains('long'));
      // Beside its words the count may take 60% of the row (half in a strip); stacked, all of it.
      var availW = beside ? row.clientWidth * (cls.contains('strip') ? 0.5 : 0.6) : wrap.clientWidth;
      // Stacked, the count gets the height its words leave over.
      var under = $('unit').parentNode;
      var availH = beside ? row.clientHeight
        : row.clientHeight - under.offsetHeight - (parseFloat(window.getComputedStyle(wrap).marginBottom) || 0);
      if (availW < 4 || availH < 4) return;
      // Oswald's figures fill about 0.84 of the em at this line height; leave a little air.
      // The box is 0.83em tall (see style.css); leave a little air.
      var size = Math.min(availW * 0.97 / w100 * 100, availH * 0.97 / 0.83, parseFloat(window.getComputedStyle(count).fontSize) || 9999);
      count.style.fontSize = Math.max(10, Math.floor(size)) + 'px';
    }
    // PPE signs as large as their cell allows, leaving room for the name under each.
    function fitSigns() {
      if (!shown) return;
      root.style.removeProperty('--sign');
      var cs = window.getComputedStyle(list);
      var gapX = parseFloat(cs.columnGap) || 0, gapY = parseFloat(cs.rowGap) || 0;
      var nameEl = list.querySelector('.ppe-name');
      var nameH = nameEl ? parseFloat(window.getComputedStyle(nameEl).fontSize) * 2.6 : 0;
      var cellW = (list.clientWidth - gapX * (ppeCols - 1)) / ppeCols;
      var cellH = (list.clientHeight - gapY * (ppeRows - 1)) / ppeRows;
      // In portrait the card grows to fit its signs; elsewhere it has a fixed share of the height.
      var tall = body.classList.contains('portrait');
      var s = Math.min(cellW * (tall ? 0.7 : 0.8), tall ? Infinity : cellH - nameH, Math.min(window.innerWidth, window.innerHeight) * (tall ? (ppeRows > 1 ? 0.12 : 0.15) : 0.16));
      if (s > 8) root.style.setProperty('--sign', Math.floor(s) + 'px');
    }

    shape();
    render();
    // The count is computed here, so check the clock every 15 s and redraw when the minute changes.
    setInterval(render, 15000);
    function refit() { lastKey = ''; render(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit, refit);
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { shape(); refit(); }, 200);
    });
  });
})();
