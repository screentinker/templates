/* Notice board — ScreenTinker community template. MIT.
   Reads the notices from a table data source when one is connected (Google Sheet, CSV, Manual table),
   otherwise from the typed-in lines. Each notice may have a start and an end; the board checks them
   every half minute against its own clock, so notices appear and expire without a re-render.
   Pinned notices sort first; the first notice is featured. Writes with textContent only, fetches
   nothing, uses no eval. */
(function () {
  'use strict';

  var MAX_NOTICES = 60;

  /* The words the board writes itself, by language (the primary subtag of the Language setting,
     or of the screen's language when that is empty). {date} and {time} are filled in with the
     dates of the language. The text settings for these words win when they are filled in. */
  var STRINGS = {
    en: { until: 'Until {date}', today: 'Ends today', todayAt: 'Ends today at {time}', pinned: 'Pinned', empty: 'No notices right now' },
    de: { until: 'Bis {date}', today: 'Endet heute', todayAt: 'Endet heute um {time}', pinned: 'Angeheftet', empty: 'Zurzeit keine Aushänge' },
    es: { until: 'Hasta el {date}', today: 'Termina hoy', todayAt: 'Termina hoy a las {time}', pinned: 'Fijado', empty: 'No hay avisos ahora mismo' },
    fr: { until: 'Jusqu’au {date}', today: 'Se termine aujourd’hui', todayAt: 'Jusqu’à {time} aujourd’hui', pinned: 'Épinglé', empty: 'Aucune annonce pour le moment' },
    hi: { until: '{date} तक', today: 'आज समाप्त', todayAt: 'आज {time} तक', pinned: 'पिन किया गया', empty: 'अभी कोई सूचना नहीं' },
    it: { until: 'Fino al {date}', today: 'Termina oggi', todayAt: 'Termina oggi alle {time}', pinned: 'In evidenza', empty: 'Nessun avviso al momento' },
    ja: { until: '{date}まで', today: '本日まで', todayAt: '本日 {time} まで', pinned: '固定', empty: '現在お知らせはありません' },
    nl: { until: 'Tot {date}', today: 'Eindigt vandaag', todayAt: 'Eindigt vandaag om {time}', pinned: 'Vastgezet', empty: 'Op dit moment geen mededelingen' },
    pt: { until: 'Até {date}', today: 'Termina hoje', todayAt: 'Termina hoje às {time}', pinned: 'Fixado', empty: 'Nenhum aviso no momento' },
    zh: { until: '截至{date}', today: '今天结束', todayAt: '今天 {time} 结束', pinned: '置顶', empty: '暂无通知' }
  };
  function pick(lang) {
    var p = String(lang || '').split('-')[0].toLowerCase();
    return Object.prototype.hasOwnProperty.call(STRINGS, p) ? STRINGS[p] : STRINGS.en;
  }

  // No prototype, so a cell reading 'constructor' or 'tostring' is not taken for a yes.
  var YES = Object.create(null);
  ['yes', 'y', 'true', '1', 'x', 'pinned', 'pin', 'ja', 'oui', 'si', 'sim', 'vrai', 'wahr', 'waar',
   'はい', '固定', '是', '置顶', 'हाँ', 'हां', 'पिन'].forEach(function (w) { YES[word(w)] = 1; });

  // Built-in category colours, by the category's slug. Anything else gets a stable colour from PALETTE.
  var CATEGORY = {
    urgent: '#E5484D', emergency: '#E5484D', alert: '#E5484D', critical: '#E5484D', closure: '#E5484D',
    important: '#F76B15', action_required: '#F76B15', deadline: '#F76B15',
    safety: '#F5A524', health_safety: '#F5A524', health_and_safety: '#F5A524', hse: '#F5A524', security: '#F5A524',
    event: '#8E5CF0', events: '#8E5CF0', social: '#8E5CF0',
    hr: '#14B8A6', people: '#14B8A6', staff: '#14B8A6', benefits: '#14B8A6', payroll: '#14B8A6',
    it: '#4F7CF7', tech: '#4F7CF7', systems: '#4F7CF7', technology: '#4F7CF7',
    info: '#2EA3F2', information: '#2EA3F2', general: '#2EA3F2', notice: '#2EA3F2',
    news: '#22B864', update: '#22B864', updates: '#22B864',
    facilities: '#84B51F', maintenance: '#84B51F', building: '#84B51F', cleaning: '#84B51F',
    celebration: '#E8579B', birthday: '#E8579B', welcome: '#E8579B', congratulations: '#E8579B', kudos: '#E8579B',
    reminder: '#E5B80B', training: '#10A37F', learning: '#10A37F',
    exam: '#06AEC4', exams: '#06AEC4', academic: '#06AEC4', school: '#06AEC4', sport: '#F2711C', sports: '#F2711C',
    production: '#5B8DEF', quality: '#0FA3A3', shift: '#9B7BE6', canteen: '#D98C2B', menu: '#D98C2B'
  };
  // The main categories in the other languages of the board, so a translated sheet keeps its colours.
  var LOCAL_CATEGORY = {
    urgent: ['dringend', 'notfall', 'urgente', 'urgence', 'spoed', 'urgencia', 'emergenza', '緊急', '紧急', 'तत्काल', 'अत्यावश्यक', 'आपातकाल'],
    important: ['wichtig', 'importante', 'important', 'belangrijk', '重要', 'महत्वपूर्ण'],
    safety: ['sicherheit', 'arbeitssicherheit', 'seguridad', 'securite', 'sicurezza', 'veiligheid', 'seguranca', '安全', 'सुरक्षा'],
    event: ['veranstaltung', 'evento', 'evenement', 'evenementen', 'イベント', '活动', 'कार्यक्रम'],
    hr: ['personal', 'personale', 'rh', 'rrhh', 'rr_hh', 'recursos_humanos', 'ressources_humaines', 'risorse_umane', '人事', 'मानव_संसाधन'],
    it: ['edv', 'ti', 'informatique', 'informatica', 'ict', 'आईटी'],
    info: ['hinweis', 'aviso', 'avis', 'avviso', 'mededeling', 'お知らせ', '通知', 'सूचना', 'जानकारी'],
    news: ['neuigkeiten', 'noticias', 'nouvelles', 'actualites', 'notizie', 'nieuws', 'novidades', 'ニュース', '新闻', 'समाचार'],
    facilities: ['gebaude', 'haustechnik', 'instalaciones', 'batiment', 'struttura', 'gebouw', 'instalacoes', '施設', '设施', 'सुविधाएँ'],
    celebration: ['feier', 'celebracion', 'fete', 'festa', 'feest', 'celebracao', 'お祝い', '庆祝', 'उत्सव'],
    reminder: ['erinnerung', 'recordatorio', 'rappel', 'promemoria', 'herinnering', 'lembrete', 'リマインダー', '提醒', 'अनुस्मारक'],
    training: ['schulung', 'formacion', 'formation', 'formazione', 'opleiding', 'treinamento', '研修', '培训', 'प्रशिक्षण']
  };
  Object.keys(LOCAL_CATEGORY).forEach(function (c) {
    LOCAL_CATEGORY[c].forEach(function (w) { var k = word(w); if (!CATEGORY[k]) CATEGORY[k] = CATEGORY[c]; });
  });
  var PALETTE = ['#2EA3F2', '#8E5CF0', '#14B8A6', '#E8579B', '#84B51F', '#F2711C', '#4F7CF7', '#0FA3A3'];

  function str(x) { return x == null ? '' : String(x).replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }
  // A key for a word in any script: the column slug for Latin text, otherwise the word itself in
  // lower case (the slug of 緊急 or सुरक्षा would be empty).
  function word(s) {
    var k = slug(s);
    if (k) return k;
    k = str(s).toLowerCase();
    if (k.normalize) k = k.normalize('NFC');
    return k.replace(/[\s\-.,\/&+]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function hexColor(s) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str(s));
    if (!m) return '';
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return '#' + h.toUpperCase();
  }
  // Dark or white text on a colour, by its relative luminance.
  function onColor(hex) {
    var n = parseInt(hex.slice(1), 16);
    function ch(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
    return L > 0.36 ? '#14161A' : '#FFFFFF';
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var stage = $('stage');
    var pager = $('pager');

    var accent = hexColor(v.accent) || '#F2B33D';
    root.style.setProperty('--accent', accent);
    if (v.theme === 'light') body.classList.add('light');

    $('title').textContent = str(v.title);
    $('subtitle').textContent = str(v.subtitle);
    if (v.logo) {
      $('logo').src = v.logo;
      $('logo').hidden = false;
      $('badge').hidden = true;
    }

    var layoutMode = v.layout === 'rotate' ? 'rotate' : 'featured';
    var seconds = Math.min(120, Math.max(5, Number(v.seconds) || 12));
    var showDates = v.show_dates !== false;
    /* ---------- language ---------- */
    var locale = str(v.locale) || undefined;
    var lang = locale || navigator.language || 'en';
    var T = pick(lang);
    root.lang = lang;
    // Empty text settings: the built-in words in the board's language.
    var untilLabel = str(v.until_label);
    var todayLabel = str(v.today_label);
    var pinnedLabel = str(v.pinned_label) || T.pinned;
    var emptyLabel = str(v.empty_label) || T.empty;

    /* ---------- time ---------- */
    var tz = str(v.timezone) || undefined;
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
    // Validate the timezone once: a bad name falls back to the screen's clock everywhere.
    if (tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch (e) { tz = undefined; } }

    var clockMode = v.clock_format || 'auto';
    var timeOpts = { hour: 'numeric', minute: '2-digit' };
    if (clockMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
    if (clockMode === '12') timeOpts.hour12 = true;
    var timeFmt = makeFmt(timeOpts, tz);
    var dateFmt = makeFmt({ weekday: 'long', day: 'numeric', month: 'long' }, tz);
    // Dates on cards: a date-only end is a calendar date (formatted in UTC so no zone can shift it).
    var dayFmt = makeFmt({ weekday: 'short', day: 'numeric', month: 'short' }, 'UTC');
    var dayTimeFmt = makeFmt({ weekday: 'short', day: 'numeric', month: 'short', hour: timeOpts.hour, minute: '2-digit', hour12: timeOpts.hour12, hourCycle: timeOpts.hourCycle }, tz);
    if (clockMode === 'off') $('clockbox').hidden = true;

    // Numeric wall-clock parts in the board's timezone (en-US only for parsing, never shown).
    var partsFmt = null;
    try {
      var po = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' };
      if (tz) po.timeZone = tz;
      partsFmt = new Intl.DateTimeFormat('en-US', po);
    } catch (e) { partsFmt = null; }
    function wall(t) {
      if (!tz || !partsFmt || !partsFmt.formatToParts) {
        var d = new Date(t);
        return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds() };
      }
      var o = {};
      partsFmt.formatToParts(new Date(t)).forEach(function (p) { if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
      return { y: o.year, m: o.month, d: o.day, h: o.hour === 24 ? 0 : o.hour, mi: o.minute, s: o.second || 0 };
    }
    // Wall-clock time in the board's timezone → epoch ms. Day overflow (d = 32) rolls over correctly.
    function zoned(y, m, d, h, mi) {
      if (!tz) return new Date(y, m - 1, d, h, mi, 0, 0).getTime();
      var guess = Date.UTC(y, m - 1, d, h, mi);
      function off(t) { var w = wall(t); return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(t / 1000) * 1000; }
      var o1 = off(guess);
      var t = guess - o1;
      var o2 = off(t);
      return o2 === o1 ? t : guess - o2;
    }
    function sameDay(a, b) { return a.y === b.y && a.m === b.m && a.d === b.d; }

    // Slash dates like 03/04/2026: month first only for US-style English, unless the operator says.
    var slashOrder = v.date_order === 'mdy' || v.date_order === 'dmy' ? v.date_order : '';
    if (!slashOrder) slashOrder = /^en(-US|-PH)?$/i.test(locale || navigator.language || 'en-US') ? 'mdy' : 'dmy';
    function hour12(h, ap) {
      if (!ap) return h;
      ap = ap.toLowerCase();
      if (ap === 'pm' && h < 12) return h + 12;
      if (ap === 'am' && h === 12) return 0;
      return h;
    }

    /* A start/end cell → { t: epoch ms of the moment, dateOnly, y, m, d, hasTime } or null.
       Accepts 2026-10-14, 2026-10-14 17:00, 2026-10-14T17:00Z, 14/10/2026, 10/14/2026 5:00 PM,
       14.10.2026, and +N / -N (days from today, optionally followed by a time). */
    function parseWhen(raw) {
      var s = str(raw);
      if (!s) return null;
      var y, m, d, h = 0, mi = 0, hasTime = false, mt;
      if ((mt = /^([+-]\d{1,3})\s*(?:d|days?)?(?:\s+(\d{1,2})[:.](\d{2}))?$/i.exec(s))) {
        var today = wall(Date.now());
        var base = new Date(Date.UTC(today.y, today.m - 1, today.d + parseInt(mt[1], 10)));
        y = base.getUTCFullYear(); m = base.getUTCMonth() + 1; d = base.getUTCDate();
        if (mt[2]) { h = +mt[2]; mi = +mt[3]; hasTime = true; }
      } else if ((mt = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*([AaPp][Mm])?\s*(Z|[+-]\d{2}:?\d{2})?)?$/.exec(s))) {
        if (mt[8]) {
          var z = mt[8].toUpperCase() === 'Z' ? 'Z' : mt[8].replace(/^([+-]\d{2}):?(\d{2})$/, '$1:$2');
          var abs = Date.UTC(+mt[1], +mt[2] - 1, +mt[3], hour12(+(mt[4] || 0), mt[7]), +(mt[5] || 0), +(mt[6] || 0));
          if (z !== 'Z') abs -= (z[0] === '-' ? -1 : 1) * (parseInt(z.slice(1, 3), 10) * 60 + parseInt(z.slice(4, 6), 10)) * 60000;
          if (!isFinite(abs)) return null;
          var w = wall(abs);
          return { t: abs, dateOnly: false, hasTime: true, y: w.y, m: w.m, d: w.d };
        }
        y = +mt[1]; m = +mt[2]; d = +mt[3];
        if (mt[4]) { h = hour12(+mt[4], mt[7]); mi = +mt[5]; hasTime = true; }
      } else if ((mt = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})(?:[\s,T]+(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*([AaPp][Mm])?)?$/.exec(s))) {
        var a = +mt[1], b = +mt[2];
        if (a > 12 && b <= 12) { d = a; m = b; } else if (b > 12 && a <= 12) { m = a; d = b; }
        else if (slashOrder === 'mdy') { m = a; d = b; } else { d = a; m = b; }
        y = +mt[3]; if (y < 100) y += 2000;
        if (mt[4]) { h = hour12(+mt[4], mt[6]); mi = +mt[5]; hasTime = true; }
      } else {
        // "October 14, 2026", "14 Oct 2026 9:00": only with a month name and a 4-digit year, because
        // the browser also reads a bare "5" as a date in 2001. Read as wall-clock time in the board's zone.
        if (!/[a-z]{3}/i.test(s) || !/\d{4}/.test(s)) return null;
        var any = new Date(s);
        if (!isFinite(any.getTime())) return null;
        y = any.getFullYear(); m = any.getMonth() + 1; d = any.getDate(); h = any.getHours(); mi = any.getMinutes();
        hasTime = h !== 0 || mi !== 0;
      }
      if (m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
      return { t: zoned(y, m, d, h, mi), dateOnly: !hasTime, hasTime: hasTime, y: y, m: m, d: d };
    }

    /* ---------- category colours ---------- */
    var overrides = {};
    String(v.category_colors || '').split(/\r?\n/).forEach(function (line) {
      var mt = /^(.+?)\s*[=:]\s*(#?[0-9a-f]{3,6})\s*$/i.exec(line.trim());
      if (mt && hexColor(mt[2])) overrides[word(mt[1])] = hexColor(mt[2]);
    });
    function catColor(cat) {
      var k = word(cat);
      if (!k) return accent;
      if (overrides[k]) return overrides[k];
      if (CATEGORY[k]) return CATEGORY[k];
      var first = k.split('_')[0];
      if (CATEGORY[first]) return CATEGORY[first];
      var hsh = 0;
      for (var i = 0; i < k.length; i++) hsh = (hsh * 31 + k.charCodeAt(i)) >>> 0;
      return PALETTE[hsh % PALETTE.length];
    }

    /* ---------- the notices ---------- */
    // Column names to try when the configured heading is not in the sheet.
    var ALIASES = {
      title: ['title', 'headline', 'notice', 'subject'],
      body: ['text', 'body', 'message', 'details', 'description'],
      cat: ['category', 'type', 'tag', 'label'],
      start: ['start', 'starts', 'start_date', 'show_from', 'publish'],
      end: ['end', 'ends', 'end_date', 'expires', 'until', 'expiry'],
      pin: ['pinned', 'pin', 'sticky', 'featured'],
      from: ['from', 'author', 'posted_by', 'by', 'department']
    };
    function fromSource() {
      var d = ST.data && ST.data.source;
      if (!v.source || !d || typeof d !== 'object') return null;
      var wanted = { title: v.title_col, body: v.body_col, cat: v.category_col, start: v.start_col,
                     end: v.end_col, pin: v.pinned_col, from: v.from_col };
      var k = {};
      Object.keys(ALIASES).forEach(function (f) {
        var tries = [slug(wanted[f])].concat(ALIASES[f]);
        k[f] = tries[0] || ALIASES[f][0];
        for (var i = 0; i < tries.length; i++) {
          if (tries[i] && d['row1_' + tries[i]] !== undefined) { k[f] = tries[i]; break; }
        }
      });
      var isTable = d.row_count !== undefined;
      if (d['row1_' + k.title] === undefined) {
        // A table without the title column, or with no rows: show nothing rather than the sample
        // notices, which would look real on a real screen. Anything else (not synced yet, not a
        // table at all) falls back to the typed notices.
        return isTable ? [] : null;
      }
      var out = [];
      for (var i = 1; i <= MAX_NOTICES; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.title] === undefined) break;
        // The server stops at a key cap, writing column by column, so the last row can arrive
        // without its later columns (an End or Start). Leave such a row out rather than show it
        // with no expiry.
        var cut = false;
        for (var f in k) { if (d['row1_' + k[f]] !== undefined && d[p + k[f]] === undefined) { cut = true; break; } }
        if (cut) break;
        out.push({ title: d[p + k.title], body: d[p + k.body], cat: d[p + k.cat], start: d[p + k.start],
                   end: d[p + k.end], pin: d[p + k.pin], from: d[p + k.from] });
      }
      return out;
    }
    function fromText() {
      return String(v.notices || '').split(/\r?\n/).slice(0, MAX_NOTICES).map(function (line) {
        var c = line.split('|');
        return { title: c[0], body: c[1], cat: c[2], start: c[3], end: c[4], pin: c[5], from: c[6] };
      });
    }
    var all = (fromSource() || fromText()).map(function (r, i) {
      var cat = str(r.cat);
      var color = catColor(cat);
      return {
        i: i, title: str(r.title), body: str(r.body), cat: cat, from: str(r.from),
        start: parseWhen(r.start), end: parseWhen(r.end), pinned: !!YES[word(r.pin)],
        color: color, on: onColor(color), urgent: color === CATEGORY.urgent || /^(urgent|emergency|critical|alert)/.test(slug(cat))
      };
    }).filter(function (n) { return n.title || n.body; });

    function isActive(n, now) {
      if (n.start && now < n.start.t) return false;
      if (n.end) {
        // A date alone means "through the end of that day".
        var stop = n.end.dateOnly ? zoned(n.end.y, n.end.m, n.end.d + 1, 0, 0) : n.end.t;
        if (now >= stop) return false;
      }
      return true;
    }
    function activeNotices() {
      var now = Date.now();
      return all.filter(function (n) { return isActive(n, now); }).sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.i - b.i;
      });
    }

    function untilText(n) {
      if (!showDates || !n.end) return null;
      var today = wall(Date.now());
      var isToday = sameDay(today, n.end);
      var txt;
      if (isToday) {
        var at = n.end.hasTime ? timeFmt.format(new Date(n.end.t)) : '';
        if (todayLabel) txt = todayLabel + (at ? ' ' + at : '');
        else txt = at ? T.todayAt.replace('{time}', at) : T.today;
      } else {
        var when = n.end.hasTime ? dayTimeFmt.format(new Date(n.end.t))
                                 : dayFmt.format(new Date(Date.UTC(n.end.y, n.end.m - 1, n.end.d, 12)));
        txt = untilLabel ? untilLabel + ' ' + when : T.until.replace('{date}', when);
      }
      return { text: txt, today: isToday };
    }

    /* ---------- building cards ---------- */
    function pinNode(withLabel) {
      var p = el('span', 'pin');
      p.appendChild($('pin-icon').cloneNode(true)).removeAttribute('id');
      if (withLabel) p.appendChild(el('span', '', pinnedLabel));
      return p;
    }
    function paint(node, n) {
      node.style.setProperty('--cat', n.color);
      node.style.setProperty('--on-cat', n.on);
      if (n.urgent) node.classList.add('urgent');
    }
    function cardNode(n, cls) {
      var c = el('article', 'card' + (cls ? ' ' + cls : ''));
      paint(c, n);
      c.appendChild(el('div', 'wash'));
      if (n.cat || n.pinned) {
        var top = c.appendChild(el('div', 'c-top'));
        if (n.cat) top.appendChild(el('span', 'pill', n.cat));
        if (n.pinned) top.appendChild(pinNode(true));
      }
      if (n.title) c.appendChild(el('h2', 'c-title', n.title)).dir = 'auto';
      c.appendChild(el('p', 'c-body', n.body)).dir = 'auto';
      var u = untilText(n);
      if (n.from || u) {
        var meta = c.appendChild(el('div', 'c-meta'));
        if (n.from) meta.appendChild(el('span', 'from', n.from));
        if (u) meta.appendChild(el('span', u.today ? 'until today' : 'until', u.text));
      }
      return c;
    }
    function lineNode(n) {
      var l = el('div', 'line');
      paint(l, n);
      if (n.cat) l.appendChild(el('span', 'pill', n.cat));
      if (n.pinned) l.appendChild(pinNode(false));
      if (n.title) l.appendChild(el('span', 'l-title', n.title)).dir = 'auto';
      if (n.body) l.appendChild(el('span', 'l-body', n.body)).dir = 'auto';
      var u = untilText(n);
      if (u) l.appendChild(el('span', u.today ? 'until today' : 'until', u.text));
      return l;
    }

    // Set each body's line clamp to the whole lines that fit in the space the card leaves it.
    function clampBodies(scope) {
      var bodies = scope.querySelectorAll('.c-body');
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        b.style.webkitLineClamp = 'none';
        b.style.maxHeight = '';
        b.style.display = '';
        var lh = parseFloat(getComputedStyle(b).lineHeight) || 20;
        var lines = Math.floor((b.clientHeight + 2) / lh);
        if (lines < 1) { b.style.display = 'none'; continue; }
        b.style.webkitLineClamp = String(lines);
        b.style.maxHeight = (lines * lh) + 'px';
      }
    }
    // A big card: the largest font size (≤ max) at which the title and the whole text fit.
    function cardFits(card) {
      if (card.scrollHeight > card.clientHeight + 1) return false;
      var b = card.querySelector('.c-body');
      if (b && b.scrollHeight > b.clientHeight + 1) return false;
      var t = card.querySelector('.c-title');
      return !t || t.scrollHeight <= t.clientHeight + 1;
    }
    // Set the font size on `scope` to the largest (≤ max) at which every card in it fits whole.
    function fitCards(scope, cards, maxPx, minPx) {
      function fits() {
        for (var i = 0; i < cards.length; i++) if (!cardFits(cards[i])) return false;
        return true;
      }
      var lo = minPx, hi = maxPx;
      scope.style.fontSize = hi + 'px';
      if (!fits()) {
        for (var k = 0; k < 12 && hi - lo > 0.5; k++) {
          var mid = (lo + hi) / 2;
          scope.style.fontSize = mid + 'px';
          if (fits()) lo = mid; else hi = mid;
        }
        scope.style.fontSize = lo + 'px';
      }
      clampBodies(scope);
    }
    function fitBig(card, maxPx, minPx) { fitCards(card, [card], maxPx, minPx); }

    /* ---------- layout and paging ---------- */
    var active = [];
    var signature = '';
    var page = 0;
    var pages = 1;
    var pageTimer = null;
    var mode = '';          // featured | rotate | strip | empty

    function clearTimer() { if (pageTimer) { clearTimeout(pageTimer); pageTimer = null; } }
    function drawPager() {
      pager.textContent = '';
      if (pages < 2) return;
      if (pages > 14) { pager.appendChild(el('span', 'count', (page + 1) + ' / ' + pages)); return; }
      for (var i = 0; i < pages; i++) pager.appendChild(el('span', i === page ? 'on' : ''));
    }
    function schedule(step) {
      clearTimer();
      if (pages < 2) return;
      pageTimer = setTimeout(step, seconds * 1000);
    }
    // Fade the node out, swap the content, fade it in.
    function turn(node, swap) {
      node.classList.add('hide');
      pageTimer = setTimeout(function () { swap(); }, 600);
    }

    function emptyState() {
      var e = el('div', 'empty');
      var svg = $('badge').querySelector('svg').cloneNode(true);
      e.appendChild(svg);
      e.appendChild(el('div', '', emptyLabel));
      stage.appendChild(e);
    }

    /* Featured: the first notice large, the rest in a grid of equal cards that pages when needed. */
    var listEl = null, gridEl = null, rest = [], perPage = 1, cols = 1, rows = 1;
    function renderFeatured() {
      var W = stage.clientWidth, H = stage.clientHeight;
      var portrait = H > W * 1.05;
      var unit = Math.min(window.innerHeight / 100, window.innerWidth * 0.009);
      var gap = unit * 3;
      var view = stage.appendChild(el('div', 'view' + (portrait ? ' portrait' : '')));
      var wrap = view.appendChild(el('div', 'feat-wrap'));
      rest = active.slice(1);
      var fw, fh;
      if (!rest.length) { fw = W; fh = H; }
      else if (portrait) { fw = W; fh = Math.round(H * (rest.length > 2 ? 0.42 : 0.5)); }
      else { fw = Math.round(W * (rest.length > 3 ? 0.44 : 0.5)); fh = H; }
      wrap.style.width = fw + 'px';
      wrap.style.height = fh + 'px';
      var feat = wrap.appendChild(cardNode(active[0], 'big' + (rest.length ? '' : ' huge')));
      var maxF = Math.min(fw / (rest.length ? 15 : 20), fh / 9.5, unit * 5.4);
      fitBig(feat, maxF, Math.max(12, unit * 1.9));
      if (!rest.length) { pages = 1; return; }

      listEl = view.appendChild(el('div', 'list'));
      gridEl = listEl.appendChild(el('div', 'grid'));
      var lw = portrait ? W : W - fw - gap;
      var lh = portrait ? H - fh - gap : H;
      var g = unit * 2.2;
      var minW = unit * 34, minH = unit * 24;
      cols = Math.max(1, Math.min(3, Math.floor((lw + g) / (minW + g))));
      rows = Math.max(1, Math.min(5, Math.floor((lh + g) / (minH + g))));
      // A short list (three or fewer): one column of roomy cards that share the whole height,
      // their text centred and sized up to fill, instead of a row of small cards and blank stage.
      var roomy = rest.length <= 3;
      if (roomy) { cols = 1; rows = rest.length; }
      perPage = cols * rows;
      pages = Math.ceil(rest.length / perPage);
      // Share the cards evenly between pages, then shrink the grid to what a page holds.
      var per = Math.ceil(rest.length / pages);
      if (per < perPage) {
        if (per <= cols) { cols = per; rows = 1; }
        else rows = Math.ceil(per / cols);
        perPage = per;
      }
      // Don't let a lone row of cards stretch to the full height.
      var cardH = (lh - g * (rows - 1)) / rows;
      var maxH = unit * 34;
      if (cardH > maxH && rows === 1 && !roomy) { cardH = maxH; }
      gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
      gridEl.style.gridTemplateRows = 'repeat(' + rows + ', ' + Math.floor(cardH) + 'px)';
      gridEl.style.alignContent = 'center';
      var cardW = (lw - g * (cols - 1)) / cols;
      page = Math.min(page, pages - 1);
      if (roomy) {
        gridEl.classList.add('roomy');
        fillGrid();
        fitCards(gridEl, gridEl.children, Math.max(12, Math.min(cardW / 15, cardH / 5.2, unit * 4.4)), Math.max(12, unit * 1.9));
        return;
      }
      gridEl.style.fontSize = Math.max(12, Math.min(cardW / 17, cardH / 7.6, unit * 3.1)) + 'px';
      fillGrid();
    }
    function fillGrid() {
      gridEl.textContent = '';
      var a = page * perPage;
      var shown = rest.slice(a, a + perPage);
      shown.forEach(function (n) { gridEl.appendChild(cardNode(n)); });
      // A short last row: the last card takes the empty cells beside it instead of leaving a hole.
      var spare = cols * Math.ceil(shown.length / cols) - shown.length;
      if (spare > 0 && gridEl.lastChild) gridEl.lastChild.style.gridColumn = 'span ' + (spare + 1);
      if (!gridEl.classList.contains('roomy')) clampBodies(gridEl);
    }
    function nextGridPage() {
      turn(listEl, function () {
        page = (page + 1) % pages;
        fillGrid();
        drawPager();
        listEl.classList.remove('hide');
        schedule(nextGridPage);
      });
    }

    /* One at a time: each notice full screen. */
    var rotView = null;
    function renderOne() {
      rotView.textContent = '';
      var W = stage.clientWidth, H = stage.clientHeight;
      var unit = Math.min(window.innerHeight / 100, window.innerWidth * 0.009);
      var card = rotView.appendChild(cardNode(active[page], 'big huge'));
      var tall = H > W;
      fitBig(card, Math.min(W / (tall ? 12.5 : 19), H / 9, unit * (tall ? 8.6 : 7.4)), Math.max(12, unit * 2));
    }
    function renderRotate() {
      rotView = stage.appendChild(el('div', 'view'));
      pages = active.length;
      page = Math.min(page, pages - 1);
      renderOne();
    }
    function nextOne() {
      turn(rotView, function () {
        page = (page + 1) % pages;
        renderOne();
        drawPager();
        rotView.classList.remove('hide');
        schedule(nextOne);
      });
    }

    /* A strip: one line per notice. */
    var lineEl = null;
    function renderLine(fade) {
      if (lineEl) lineEl.parentNode.removeChild(lineEl);
      var l = lineNode(active[page]);
      if (fade) l.classList.add('hide');
      lineEl = stage.appendChild(l);
      // Fade the new line in on the next frame, as the other layouts do.
      if (fade) requestAnimationFrame(function () { requestAnimationFrame(function () { l.classList.remove('hide'); }); });
    }
    function renderStrip() {
      pages = active.length;
      page = Math.min(page, pages - 1);
      lineEl = null;
      renderLine();
    }
    function nextLine() {
      turn(lineEl, function () {
        page = (page + 1) % pages;
        renderLine(true);
        drawPager();
        schedule(nextLine);
      });
    }

    function layout() {
      clearTimer();
      var W = window.innerWidth, H = window.innerHeight;
      body.classList.toggle('strip', W / H > 3.2);
      stage.textContent = '';
      listEl = gridEl = rotView = lineEl = null;
      pages = 1;
      if (stage.clientWidth < 10 || stage.clientHeight < 10) return;
      if (!active.length) { mode = 'empty'; emptyState(); drawPager(); return; }
      if (body.classList.contains('strip')) { mode = 'strip'; renderStrip(); drawPager(); schedule(nextLine); return; }
      if (layoutMode === 'rotate') { mode = 'rotate'; renderRotate(); drawPager(); schedule(nextOne); return; }
      mode = 'featured';
      renderFeatured();
      drawPager();
      schedule(nextGridPage);
    }

    // Which notices are live right now; the layout is rebuilt only when that set changes.
    function refresh(force) {
      var list = activeNotices();
      var sig = list.map(function (n) { return n.i; }).join(',');
      if (!force && sig === signature) return;
      signature = sig;
      active = list;
      layout();
    }

    /* ---------- clock ---------- */
    var lastClock = '';
    var lastDay = '';
    function tick() {
      var now = new Date();
      if (clockMode !== 'off') {
        var t = timeFmt.format(now);
        if (t !== lastClock) {
          lastClock = t;
          $('clock').textContent = t;
          $('date').textContent = dateFmt.format(now);
        }
      }
      // "Ends today" changes at midnight even when no notice starts or ends.
      var w = wall(now.getTime());
      var day = w.y + '-' + w.m + '-' + w.d;
      if (lastDay && day !== lastDay) refresh(true);
      lastDay = day;
    }

    tick();
    setInterval(tick, 1000);
    setInterval(function () { refresh(false); }, 30000);

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(function () { refresh(true); }, 250);
    });

    // Measure with the real fonts, not the fallbacks.
    function start() { refresh(true); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
    else start();
  });
})();
