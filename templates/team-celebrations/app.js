/* Team celebrations — ScreenTinker community template. MIT.
   Reads people from a table data source when one is connected (Google Sheet, CSV, Manual table…),
   otherwise from the typed-in lines, works out whose birthday, work anniversary or first day falls
   in the chosen window (all date maths here, in the chosen timezone) and rotates through them. */
(function () {
  'use strict';

  var MAX_ROWS = 150;      // people read from a source or the textarea
  var MAX_EVENTS = 80;     // celebrations shown in one window
  var DAY = 86400000;

  function str(x) { return x == null ? '' : String(x).trim(); }
  function $(id) { return document.getElementById(id); }

  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  /* ---------- calendar dates as day numbers (days since 1970-01-01, no time, no timezone) ---------- */
  function dn(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / DAY); }
  function ymd(n) { var t = new Date(n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function leap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysIn(y, m) { return [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // The day a month/day falls on in year y (29 February is kept on the 28th in other years).
  function onYear(m, d, y) { return dn(y, m, Math.min(d, daysIn(y, m))); }

  /* ---------- the words the template writes itself, picked by the language's primary subtag ----------
     A heading setting that is filled in always wins; an empty one uses these. {n} is the number of
     years ("one" / "other" form by Intl.PluralRules), {col} and {cols} name the columns. */
  var STRINGS = {
    en: {
      birthday: 'Happy birthday',
      years_one: '{n} year with us',
      years_other: '{n} years with us',
      welcome: 'Welcome to the team',
      list: 'Everyone celebrating',
      empty_title: 'No celebrations right now',
      empty_text: 'Birthdays, work anniversaries and new faces will appear here.',
      next: 'Next up',
      today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
      no_column: 'Column \u201c{col}\u201d not found. Columns: {cols}'
    },
    de: {
      birthday: 'Alles Gute zum Geburtstag',
      years_one: '{n} Jahr bei uns',
      years_other: '{n} Jahre bei uns',
      welcome: 'Willkommen im Team',
      list: 'Wer feiert',
      empty_title: 'Gerade gibt es nichts zu feiern',
      empty_text: 'Geburtstage, Jubiläen und neue Gesichter erscheinen hier.',
      next: 'Als Nächstes',
      today: 'Heute', tomorrow: 'Morgen', yesterday: 'Gestern',
      no_column: 'Spalte \u201e{col}\u201c nicht gefunden. Spalten: {cols}'
    },
    es: {
      birthday: '¡Feliz cumpleaños!',
      years_one: '{n} año con nosotros',
      years_other: '{n} años con nosotros',
      welcome: 'Te damos la bienvenida',
      list: 'Quién celebra',
      empty_title: 'Ahora no hay celebraciones',
      empty_text: 'Aquí aparecerán cumpleaños, aniversarios laborales y caras nuevas.',
      next: 'Próximamente',
      today: 'Hoy', tomorrow: 'Mañana', yesterday: 'Ayer',
      no_column: 'No se encontró la columna «{col}». Columnas: {cols}'
    },
    fr: {
      birthday: 'Joyeux anniversaire',
      years_one: '{n} an parmi nous',
      years_other: '{n} ans parmi nous',
      welcome: 'Bienvenue dans l’équipe',
      list: 'À l’honneur',
      empty_title: 'Rien à fêter pour le moment',
      empty_text: 'Anniversaires, ancienneté et nouveaux visages s’afficheront ici.',
      next: 'Prochainement',
      today: 'Aujourd’hui', tomorrow: 'Demain', yesterday: 'Hier',
      no_column: 'Colonne « {col} » introuvable. Colonnes : {cols}'
    },
    hi: {
      birthday: 'जन्मदिन मुबारक',
      years_one: 'हमारे साथ {n} साल',
      years_other: 'हमारे साथ {n} साल',
      welcome: 'टीम में स्वागत है',
      list: 'सबका जश्न',
      empty_title: 'अभी कोई जश्न नहीं',
      empty_text: 'जन्मदिन, कार्य वर्षगांठ और नए चेहरे यहाँ दिखेंगे।',
      next: 'आगे',
      today: 'आज', tomorrow: 'कल', yesterday: 'बीता कल',
      no_column: 'कॉलम “{col}” नहीं मिला। कॉलम: {cols}'
    },
    it: {
      birthday: 'Buon compleanno',
      years_one: '{n} anno con noi',
      years_other: '{n} anni con noi',
      welcome: 'Benvenuti nel team',
      list: 'Chi festeggia',
      empty_title: 'Nessuna festa al momento',
      empty_text: 'Qui compariranno compleanni, anniversari di lavoro e nuovi arrivi.',
      next: 'Prossimamente',
      today: 'Oggi', tomorrow: 'Domani', yesterday: 'Ieri',
      no_column: 'Colonna «{col}» non trovata. Colonne: {cols}'
    },
    ja: {
      birthday: 'お誕生日おめでとう',
      years_one: '勤続{n}年',
      years_other: '勤続{n}年',
      welcome: 'ようこそ、チームへ',
      list: 'お祝いする人',
      empty_title: '現在お祝いはありません',
      empty_text: '誕生日、勤続記念日、新しい仲間がここに表示されます。',
      next: '次のお祝い',
      today: '今日', tomorrow: '明日', yesterday: '昨日',
      no_column: '列「{col}」が見つかりません。列:{cols}'
    },
    nl: {
      birthday: 'Gefeliciteerd',
      years_one: '{n} jaar bij ons',
      years_other: '{n} jaar bij ons',
      welcome: 'Welkom in het team',
      list: 'Wie viert er',
      empty_title: 'Even niets te vieren',
      empty_text: 'Verjaardagen, jubilea en nieuwe gezichten verschijnen hier.',
      next: 'Hierna',
      today: 'Vandaag', tomorrow: 'Morgen', yesterday: 'Gisteren',
      no_column: 'Kolom \u2018{col}\u2019 niet gevonden. Kolommen: {cols}'
    },
    pt: {
      birthday: 'Feliz aniversário',
      years_one: '{n} ano com a gente',
      years_other: '{n} anos com a gente',
      welcome: 'Boas-vindas ao time',
      list: 'Quem comemora',
      empty_title: 'Nenhuma comemoração agora',
      empty_text: 'Aniversários, tempo de casa e novos colegas aparecem aqui.',
      next: 'A seguir',
      today: 'Hoje', tomorrow: 'Amanhã', yesterday: 'Ontem',
      no_column: 'Coluna \u201c{col}\u201d não encontrada. Colunas: {cols}'
    },
    zh: {
      birthday: '生日快乐',
      years_one: '入职{n}周年',
      years_other: '入职{n}周年',
      welcome: '欢迎加入团队',
      list: '庆祝名单',
      empty_title: '目前没有庆祝活动',
      empty_text: '生日、入职周年和新同事都会显示在这里。',
      next: '下一位',
      today: '今天', tomorrow: '明天', yesterday: '昨天',
      no_column: '未找到列\u201c{col}\u201d。现有列:{cols}'
    }
  };
  // The Type column's words in each language (English is always understood too). Compared after
  // dropping accents, case, spaces and punctuation, so "Neu im Team" matches "neu-im-team".
  var TYPE_WORDS = {
    de: { b: ['Geburtstag'], a: ['Jubiläum', 'Firmenjubiläum', 'Dienstjubiläum'], n: ['Neu im Team', 'Neu', 'Willkommen', 'Neuzugang'] },
    es: { b: ['Cumpleaños'], a: ['Aniversario laboral', 'Aniversario'], n: ['Nuevo ingreso', 'Nueva incorporación', 'Bienvenida'] },
    fr: { b: ['Anniversaire'], a: ['Ancienneté', 'Anniversaire d’entrée'], n: ['Nouvel arrivant', 'Nouvelle arrivante', 'Bienvenue', 'Arrivée'] },
    hi: { b: ['जन्मदिन'], a: ['कार्य वर्षगांठ', 'वर्षगांठ'], n: ['नया साथी', 'नए साथी', 'स्वागत'] },
    it: { b: ['Compleanno'], a: ['Anniversario di lavoro', 'Anniversario'], n: ['Nuovo arrivo', 'Nuovo ingresso', 'Benvenuto'] },
    ja: { b: ['誕生日'], a: ['勤続記念', '勤続記念日', '入社記念日'], n: ['新入社員', '新しい仲間', 'ようこそ'] },
    nl: { b: ['Verjaardag'], a: ['Jubileum', 'Dienstjubileum'], n: ['Nieuwe collega', 'Nieuw', 'Welkom'] },
    pt: { b: ['Aniversário'], a: ['Tempo de casa', 'Aniversário de empresa'], n: ['Novo colaborador', 'Nova colaboradora', 'Boas-vindas'] },
    zh: { b: ['生日'], a: ['入职周年', '周年'], n: ['新同事', '新员工', '欢迎'] }
  };
  function primary(tag) { return String(tag || '').toLowerCase().split(/[-_]/)[0]; }
  function stringsFor(tag) {
    var t = STRINGS[primary(tag)] || STRINGS.en, out = {};
    for (var k in STRINGS.en) out[k] = t[k] || STRINGS.en[k];
    return out;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var body = document.body;

    var theme = v.theme === 'elegant' ? 'elegant' : 'playful';
    body.setAttribute('data-theme', theme);

    /* ---------- locale and timezone, checked once ---------- */
    var tz = str(v.timezone) || undefined;
    var loc = str(v.locale) || undefined;
    try { new Intl.DateTimeFormat(loc, { timeZone: tz }); } catch (e) {
      try { new Intl.DateTimeFormat(loc); tz = undefined; } catch (e2) { loc = undefined; tz = undefined; }
    }
    // The page language: the setting, else the screen's. It picks the built-in words, and the lang
    // attribute gives the browser the right hyphenation and CJK line breaking.
    var lang = loc || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    try { document.documentElement.lang = Intl.getCanonicalLocales(lang)[0]; } catch (e) { document.documentElement.lang = 'en'; }
    var T = stringsFor(lang);
    // A heading setting: empty uses the built-in words, a single "-" hides the line.
    function wording(x, builtIn) { var s = str(x); return s === '-' ? '' : (s || builtIn); }
    var plural = null;
    try { if (Intl.PluralRules) plural = new Intl.PluralRules(lang); } catch (e) { plural = null; }
    var nf = null;
    try { nf = new Intl.NumberFormat(loc, { useGrouping: false }); } catch (e) { nf = null; }
    function num(n) { return nf ? nf.format(n) : String(n); }
    var partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' });
    function today() {
      var p = {};
      partsFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return dn(Number(p.year), Number(p.month), Number(p.day));
    }
    // Display formatters work on day numbers, which are UTC midnights.
    function fmt(opts) { opts.timeZone = 'UTC'; try { return new Intl.DateTimeFormat(loc, opts); } catch (e) { return new Intl.DateTimeFormat(undefined, opts); } }
    var fLong = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
    var fShort = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
    var fDayMonth = fmt({ day: 'numeric', month: 'long' });
    var fMonthYear = fmt({ month: 'long', year: 'numeric' });
    function dateOf(n) { return new Date(n * DAY); }
    // "Today" / "Tomorrow" / "Yesterday" in the screen's language, otherwise the date.
    function whenText(n, t, long) {
      var delta = n - t;
      if (delta === 0) return T.today;
      if (delta === 1) return T.tomorrow;
      if (delta === -1) return T.yesterday;
      return (long ? fLong : fShort).format(dateOf(n));
    }

    /* ---------- reading dates ---------- */
    // ISO (2019-10-08, 2019/10/08, with or without a time), month-day (10-08, --10-08), or relative:
    // today, today+3, today-2, today+3-5y (five years ago, three days from now).
    function parseDate(raw, t) {
      var s = str(raw);
      if (!s) return null;
      var m = /^today\s*(?:([+-])\s*(\d{1,4})\s*d?)?\s*(?:([+-])\s*(\d{1,3})\s*y)?$/i.exec(s);
      if (m) {
        var n = t + (m[2] ? (m[1] === '-' ? -1 : 1) * Number(m[2]) : 0);
        var r = ymd(n);
        if (m[4]) r.y += (m[3] === '-' ? -1 : 1) * Number(m[4]);
        if (r.m === 2 && r.d === 29 && !leap(r.y)) r.d = 28;
        return r;
      }
      var y = null, mo, d;
      m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:$|[T\s])/.exec(s);
      if (m) { y = Number(m[1]); mo = Number(m[2]); d = Number(m[3]); }
      else {
        m = /^(?:--)?(\d{1,2})[-\/.](\d{1,2})$/.exec(s);
        if (!m) return null;
        mo = Number(m[1]); d = Number(m[2]);
      }
      if (mo < 1 || mo > 12 || d < 1 || d > (y ? daysIn(y, mo) : daysIn(2000, mo))) return null;
      if (y !== null && (y < 1900 || y > 2200)) return null;
      return { y: y, m: mo, d: d };
    }

    /* ---------- the people ---------- */
    function typeKey(x) {
      var k = str(x);
      if (k.normalize) k = k.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      return k.toLowerCase().replace(/[\s_\-.,:;'\u2019\u00b7\u30fb\/&]+/g, '');
    }
    // The screen's language first, then every other one: "Aniversário" is a birthday in Portuguese.
    var typeWords = {};
    [primary(lang)].concat(Object.keys(TYPE_WORDS)).forEach(function (l) {
      var w = TYPE_WORDS[l];
      if (!w) return;
      ['b', 'a', 'n'].forEach(function (kind) {
        w[kind].forEach(function (word) { var k = typeKey(word); if (k && !typeWords[k]) typeWords[k] = kind; });
      });
    });
    function typeOf(s) {
      var k = slug(s).replace(/_/g, '');
      var local = typeWords[typeKey(s)];
      if (!k) return local || '';
      if (/^(birthday|birthdays|bday|birth|dob|geburtstag|cumpleanos|anniversaire)$/.test(k)) return 'b';
      if (/^(anniversary|anniversaries|workanniversary|anniv|workanniv|service|years|jubilaum|jubilee)$/.test(k)) return 'a';
      if (/^(newhire|newhires|new|welcome|starter|newstarter|joiner|newjoiner|onboarding|newcolleague|hire)$/.test(k)) return 'n';
      return local || '';
    }
    var hint = '';
    function fromSource() {
      hint = '';
      if (!str(v.people)) return null;
      var d = ST.data && ST.data.people;
      if (!d || typeof d !== 'object') return null;
      var k = {
        name: slug(v.name_col || 'Name'), type: slug(v.type_col || 'Type'), date: slug(v.date_col || 'Date'),
        start: slug(v.start_col || 'Start date'), title: slug(v.title_col || 'Title'), team: slug(v.team_col || 'Team'),
      };
      if (!k.name || d['row1_' + k.name] === undefined) {
        // A synced table without the Name column: say so instead of showing made-up people.
        if (d.columns !== undefined && Number(d.row_count) > 0) {
          hint = T.no_column.replace('{col}', str(v.name_col || 'Name')).replace('{cols}', str(d.columns).slice(0, 160));
          return [];
        }
        if (d.columns !== undefined && Number(d.row_count) === 0) return [];
        return null;
      }
      var out = [];
      for (var i = 1; i <= MAX_ROWS; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.name] === undefined) break;
        out.push({ name: str(d[p + k.name]), type: str(d[p + k.type]), date: str(d[p + k.date]),
                   start: str(d[p + k.start]), title: str(d[p + k.title]), team: str(d[p + k.team]) });
      }
      return out;
    }
    function fromText() {
      return str(v.sample).split(/\r?\n/).slice(0, MAX_ROWS).map(function (line) {
        var c = line.split('|');
        return { name: str(c[0]), type: str(c[1]), date: str(c[2]), start: str(c[3]), title: str(c[4]), team: str(c[5]) };
      });
    }
    var people = (fromSource() || fromText()).filter(function (p) { return p.name; });

    /* ---------- the window and who falls in it ---------- */
    var windowKind = ['today', 'week', 'next7', 'month', 'next30'].indexOf(v.window) >= 0 ? v.window : 'next7';
    var weekStart = { monday: 1, sunday: 0, saturday: 6 }[v.week_start];
    if (weekStart === undefined) weekStart = 1;
    var welcomeDays = Math.max(0, Math.min(60, Number(v.welcome_days)));
    if (!isFinite(welcomeDays)) welcomeDays = 14;
    var show = {
      b: v.show_birthdays !== false && v.show_birthdays !== 'false',
      a: v.show_anniversaries !== false && v.show_anniversaries !== 'false',
      n: v.show_new_hires !== false && v.show_new_hires !== 'false',
    };
    var milestonesOnly = v.milestones_only === true || v.milestones_only === 'true';

    function windowFor(t) {
      var r = ymd(t);
      if (windowKind === 'today') return [t, t];
      if (windowKind === 'next7') return [t, t + 6];
      if (windowKind === 'next30') return [t, t + 29];
      if (windowKind === 'month') return [dn(r.y, r.m, 1), dn(r.y, r.m, daysIn(r.y, r.m))];
      var dow = new Date(t * DAY).getUTCDay();
      var s = t - ((dow - weekStart + 7) % 7);
      return [s, s + 6];
    }
    // The occurrence of month/day inside [a, b], or null.
    function within(md, a, b) {
      var y0 = ymd(a).y;
      for (var y = y0 - 1; y <= y0 + 1; y++) {
        var n = onYear(md.m, md.d, y);
        if (n >= a && n <= b) return n;
      }
      return null;
    }
    function isMilestone(years) { return years === 1 || years % 5 === 0; }

    function collect(t, range) {
      var w = range || windowFor(t);
      var lowNew = range ? w[0] : Math.min(w[0], t - welcomeDays);
      var out = [];
      people.forEach(function (p) {
        var kind = typeOf(p.type);
        var base = { name: p.name, title: p.title, team: p.team };
        function add(k, n, years) {
          var e = { kind: k, day: n, years: years || 0, name: base.name, title: base.title, team: base.team };
          out.push(e);
        }
        // Birthday: from Date (or Start date when the row is typed Birthday and has only that).
        if (kind === 'b' || (!kind && p.date)) {
          var bd = parseDate(kind === 'b' ? (p.date || p.start) : p.date, t);
          var bn = bd && within(bd, w[0], w[1]);
          if (bn !== null && bn !== undefined && bd && show.b) add('b', bn);
        }
        // First day: an anniversary when it is a year or more ago, a welcome when it is recent.
        if (kind === 'a' || kind === 'n' || (!kind && p.start)) {
          var sd = parseDate(p.start || (kind ? p.date : ''), t);
          if (!sd) return;
          if (kind !== 'a' && sd.y !== null) {
            var sn = dn(sd.y, sd.m, sd.d);
            if (sn >= lowNew && sn <= w[1]) { if (show.n) add('n', sn); return; }
          }
          if (kind !== 'n' && sd.y !== null) {
            var an = within(sd, w[0], w[1]);
            if (an === null) return;
            var years = ymd(an).y - sd.y;
            if (years < 1 || !show.a) return;
            if (milestonesOnly && !isMilestone(years)) return;
            add('a', an, years);
          }
        }
      });
      // Today first, then what is coming (soonest first), then what has just been.
      out.sort(function (x, y) {
        var dx = x.day - t, dy = y.day - t;
        if ((dx >= 0) !== (dy >= 0)) return dx >= 0 ? -1 : 1;
        if (dx !== dy) return dx >= 0 ? dx - dy : dy - dx;
        if (x.kind !== y.kind) return 'bna'.indexOf(x.kind) - 'bna'.indexOf(y.kind);
        return x.name.localeCompare(y.name);
      });
      return { events: out.slice(0, MAX_EVENTS), win: w };
    }

    /* ---------- avatars ---------- */
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function avatarColour(name) {
      var h = hash(name.toLowerCase()) % 360;
      // Yellows, greens and cyans are bright at the same lightness: darken them so white initials read.
      var l = h >= 35 && h <= 200 ? 38 : 50;
      return theme === 'elegant' ? 'hsl(' + h + ', 32%, 30%)' : 'hsl(' + h + ', 60%, ' + l + '%)';
    }
    function initials(name) {
      var words = name.replace(/[()"“”]/g, ' ').split(/\s+/).filter(function (w) { return w && /[\p{L}\p{N}]/u.test(w); });
      if (!words.length) return '?';
      var first = Array.from(words[0])[0] || '';
      var last = words.length > 1 ? (Array.from(words[words.length - 1])[0] || '') : '';
      return (first + last).toLocaleUpperCase(loc);
    }
    function tierOf(years) {
      if (years >= 20) return 'tier-20';
      if (years === 15) return 'tier-15';
      if (years === 10) return 'tier-10';
      if (years === 5) return 'tier-5';
      if (years === 1) return 'tier-1';
      return '';
    }

    /* ---------- text ---------- */
    function kickerFor(e) {
      if (e.kind === 'b') return wording(v.birthday_label, T.birthday);
      if (e.kind === 'n') return wording(v.new_hire_label, T.welcome);
      // Your own wording first (the one-year line for a first anniversary), else the built-in phrase
      // in the right plural form.
      var one = str(v.anniversary_one_label), many = str(v.anniversary_label);
      var tpl = e.years === 1 && one ? one : many;
      if (!tpl) tpl = T[(plural ? plural.select(e.years) : (e.years === 1 ? 'one' : 'other')) === 'one' ? 'years_one' : 'years_other'];
      if (tpl === '-') return '';
      return tpl.replace(/\{n\}/g, num(e.years));
    }
    var ICON = { b: '#i-birthday', a: '#i-anniversary', n: '#i-new' };
    var SVGNS = 'http://www.w3.org/2000/svg';
    function icon(kind) {
      var s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('aria-hidden', 'true');
      var u = document.createElementNS(SVGNS, 'use');
      u.setAttribute('href', ICON[kind]);
      s.appendChild(u);
      return s;
    }
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }
    function setMeta(node, e) {
      node.textContent = '';
      var bits = [e.title, e.team].filter(Boolean);
      bits.forEach(function (b, i) {
        if (i) node.appendChild(el('span', 'dot', '·'));
        node.appendChild(document.createTextNode(b));
      });
    }

    /* ---------- header ---------- */
    $('title').textContent = str(v.title);
    if (v.logo) { var logo = $('logo'); logo.src = v.logo; logo.hidden = false; }
    $('list-title').textContent = wording(v.list_title, T.list);
    $('empty-title').textContent = str(v.empty_title) || T.empty_title;
    $('empty-text').textContent = wording(v.empty_text, T.empty_text);

    function rangeText(w) {
      if (windowKind === 'today') return fLong.format(dateOf(w[0]));
      if (windowKind === 'month') return fMonthYear.format(dateOf(w[0]));
      try { if (fDayMonth.formatRange) return fDayMonth.formatRange(dateOf(w[0]), dateOf(w[1])); } catch (e) { /* older engines */ }
      return fDayMonth.format(dateOf(w[0])) + ' – ' + fDayMonth.format(dateOf(w[1]));
    }

    /* ---------- state ---------- */
    var events = [];
    var cur = 0;
    var day = null;
    var perPage = 6;
    var seconds = Math.min(60, Math.max(4, Number(v.seconds) || 8));
    var timer = null, swapT = null;

    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      body.classList.toggle('strip', W / H > 3.2);
      body.classList.toggle('tall', W / H < 1.15);
    }

    function showCard(e) {
      var card = $('card');
      card.className = 'card k-' + e.kind;
      $('wm-use').setAttribute('href', ICON[e.kind]);
      var av = $('avatar');
      av.style.background = avatarColour(e.name);
      $('initials').textContent = initials(e.name);
      var badge = $('badge');
      badge.className = 'badge';
      $('badge-use').setAttribute('href', ICON[e.kind]);
      $('badge-num').textContent = '';
      if (e.kind === 'a') {
        badge.className = 'badge medal ' + tierOf(e.years) + (e.years >= 100 ? ' wide' : '');
        $('badge-num').textContent = num(e.years);
      }
      $('kicker').textContent = kickerFor(e);
      var nm = $('name');
      nm.textContent = e.name;
      setMeta($('meta'), e);
      var when = $('when');
      when.textContent = whenText(e.day, day, true);
      when.className = e.day === day ? 'when today' : 'when';
      fitName();
      fitLine($('kicker'), 0.7);
      // The progress bar runs for the time this person is on screen.
      var bar = $('bar');
      bar.style.transition = 'none';
      bar.style.width = '0';
      void bar.offsetWidth;
      if (events.length > 1) {
        bar.style.transition = 'width ' + seconds + 's linear';
        bar.style.width = '100%';
      }
    }
    // The name is as big as the card allows: shrink to fit one line (to 62% at most), then wrap.
    function fitName() {
      var nm = $('name');
      nm.classList.remove('wrap');
      nm.style.fontSize = '';
      if (!nm.clientWidth) return;
      if (nm.scrollWidth > nm.clientWidth + 1) {
        var fs = parseFloat(window.getComputedStyle(nm).fontSize) || 0;
        var f = Math.max(0.62, nm.clientWidth / nm.scrollWidth * 0.98);
        nm.style.fontSize = Math.floor(fs * f) + 'px';
        if (nm.scrollWidth > nm.clientWidth + 1) nm.classList.add('wrap');
      }
    }

    // A one-line heading (the kicker): shrink until it fits, down to `floor`; past that it is cut with "…".
    function fitLine(node, floor) {
      node.style.fontSize = '';
      if (!node.clientWidth || node.scrollWidth <= node.clientWidth + 1) return;
      var fs = parseFloat(window.getComputedStyle(node).fontSize) || 0;
      node.style.fontSize = Math.floor(fs * Math.max(floor, node.clientWidth / node.scrollWidth * 0.98)) + 'px';
    }

    function rowNode(e, i) {
      var li = el('li', 'row k-' + e.kind + (i === cur ? ' on' : '') + (e.day < day ? ' past' : ''));
      var av = li.appendChild(el('div', 'av', initials(e.name)));
      av.style.background = avatarColour(e.name);
      var who = li.appendChild(el('div', 'who'));
      who.appendChild(el('div', 'nm', e.name)).dir = 'auto';
      var sub = who.appendChild(el('div', 'sub'));
      sub.dir = 'auto';
      setMeta(sub, e);
      var tag = li.appendChild(el('div', 'tag'));
      var chip = tag.appendChild(el('div', 'chip'));
      chip.appendChild(icon(e.kind));
      if (e.kind === 'a') {
        chip.appendChild(document.createTextNode(num(e.years)));
        var t = tierOf(e.years);
        if (t) chip.classList.add(t);
      }
      tag.appendChild(el('div', e.day === day ? 'dt today' : 'dt', whenText(e.day, day, false)));
      return li;
    }
    function drawList() {
      var list = $('list');
      var pager = $('pager');
      list.textContent = '';
      pager.textContent = '';
      if (events.length < 2 || body.classList.contains('strip')) return;
      var pages = Math.ceil(events.length / perPage);
      var page = Math.floor(cur / perPage);
      for (var i = page * perPage; i < Math.min(events.length, (page + 1) * perPage); i++) list.appendChild(rowNode(events[i], i));
      if (pages > 1) for (var p = 0; p < pages; p++) pager.appendChild(el('span', p === page ? 'on' : ''));
    }
    // How many rows fit: render one, measure it against the list's height.
    function measureRows() {
      var list = $('list');
      perPage = 6;
      if (events.length < 2 || body.classList.contains('strip')) return;
      list.textContent = '';
      list.appendChild(rowNode(events[0], 0));
      list.appendChild(rowNode(events[1], 1));
      var a = list.children[0].getBoundingClientRect(), b = list.children[1].getBoundingClientRect();
      var step = b.top - a.top;
      var h = list.clientHeight;
      if (step > 0 && h > 0) perPage = Math.max(1, Math.floor((h + (step - a.height)) / step));
      list.textContent = '';
    }

    function render() {
      shape();
      var none = events.length === 0;
      body.classList.toggle('none', none);
      body.classList.toggle('solo', events.length === 1);
      $('empty').hidden = !none;
      $('empty-hint').textContent = none ? hint : '';
      if (none) { drawNext(); return; }
      measureRows();
      cur = Math.min(cur, events.length - 1);
      showCard(events[cur]);
      drawList();
    }

    // Nobody in the window: show who is next, up to a year ahead, so the screen is still useful.
    var nextUp = null;
    function drawNext() {
      var box = $('next');
      box.textContent = '';
      if (!nextUp || body.classList.contains('strip')) return;
      var lab = wording(v.next_label, T.next);
      if (lab) box.appendChild(el('div', 'next-label', lab));
      var row = box.appendChild(rowNode(nextUp, -1));
      row.classList.add('on');
    }

    function schedule() {
      clearTimeout(timer); clearTimeout(swapT);
      if (events.length < 2) return;
      timer = setTimeout(function () {
        var inner = $('card-in');
        inner.classList.add('out');
        swapT = setTimeout(function () {
          cur = (cur + 1) % events.length;
          showCard(events[cur]);
          drawList();
          inner.classList.remove('out');
          schedule();
        }, 450);
      }, seconds * 1000);
    }

    // Recompute who is celebrating; runs at start and whenever the date changes.
    function rebuild() {
      day = today();
      var r = collect(day);
      events = r.events;
      nextUp = events.length ? null : (collect(day, [day + 1, day + 366]).events[0] || null);
      cur = 0;
      $('range').textContent = rangeText(r.win);
      render();
      schedule();
    }

    rebuild();
    setInterval(function () { if (today() !== day) rebuild(); }, 30000);
    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { render(); fx.resize(); }, 250);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (events.length) { measureRows(); drawList(); fitName(); fitLine($('kicker'), 0.7); } });

    /* ---------- background: confetti (playful) or slow gold glints (elegant) ---------- */
    var fx = (function () {
      var canvas = $('fx');
      var ctx = canvas.getContext && canvas.getContext('2d');
      var animate = v.animate !== false && v.animate !== 'false';
      var parts = [];
      var W = 0, H = 0, last = 0, raf = 0;
      var COLS = theme === 'elegant'
        ? ['#D8B46E', '#F1DBA8', '#B89355']
        : ['#FF5D8F', '#FFC93C', '#3CC8B4', '#7B6CF6', '#FF8A3D', '#4FB3FF'];
      function rnd(a, b) { return a + Math.random() * (b - a); }
      function piece(anywhere) {
        var elegant = theme === 'elegant';
        return {
          x: rnd(0, W), y: anywhere ? rnd(0, H) : (elegant ? H + 10 : -20),
          s: elegant ? rnd(1.2, 3.2) : rnd(7, 15) * Math.max(0.6, Math.min(1.4, H / 1080 * 1.2)),
          vy: elegant ? -rnd(6, 16) : rnd(35, 75), vx: rnd(-12, 12),
          a: rnd(0, 6.28), va: rnd(-2.5, 2.5), w: rnd(0, 6.28), vw: rnd(1, 3),
          c: COLS[Math.floor(Math.random() * COLS.length)], shape: Math.random() < 0.3 ? 1 : 0,
        };
      }
      function count() {
        var area = W * H / (1920 * 1080);
        var n = theme === 'elegant' ? 36 : 70;
        return Math.max(12, Math.min(120, Math.round(n * Math.sqrt(Math.max(area, 0.05)))));
      }
      function resize() {
        if (!ctx) return;
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W; canvas.height = H;   // 1:1 pixels on purpose: cheap on small players
        var n = count();
        parts = [];
        for (var i = 0; i < n; i++) parts.push(piece(true));
        draw();
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          ctx.save();
          ctx.translate(p.x, p.y);
          if (theme === 'elegant') {
            ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(p.w));
            ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.2832); ctx.fill();
          } else {
            ctx.rotate(p.a);
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = p.c;
            if (p.shape) { ctx.beginPath(); ctx.arc(0, 0, p.s * 0.42, 0, 6.2832); ctx.fill(); }
            else ctx.fillRect(-p.s / 2, -p.s * 0.22, p.s, p.s * 0.44 * (0.35 + 0.65 * Math.abs(Math.cos(p.w))));
          }
          ctx.restore();
        }
      }
      function step(ts) {
        raf = requestAnimationFrame(step);
        if (document.hidden) { last = ts; return; }
        var dt = (ts - last) / 1000;
        if (dt < 1 / 30) return;            // 30 fps is plenty for falling paper
        if (dt > 0.25) dt = 0.25;
        last = ts;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.w) * 18) * dt;
          p.a += p.va * dt; p.w += p.vw * dt;
          if (p.y > H + 30 || p.y < -30 || p.x < -40 || p.x > W + 40) parts[i] = piece(false);
        }
        draw();
      }
      resize();
      if (ctx && animate) raf = requestAnimationFrame(function (ts) { last = ts; step(ts); });
      return { resize: resize };
    })();
  });
})();
