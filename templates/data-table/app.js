/* Data table — ScreenTinker community template. MIT.
   Shows any table as a styled board. The rows come from a table data source when one is connected
   (Google Sheet, CSV, REST list, Manual table: the server hands them over as row{i}_{col} keys),
   otherwise from the typed-in table, otherwise from the chosen starting point's sample.
   The text is sized to fill the screen; when the table cannot be read comfortably on one screen it
   is cut into even pages that rotate. Cells of one column can be coloured by simple rules. */
(function () {
  'use strict';

  var MAX_COLS = 30;
  var MAX_ROWS = 300;
  var MEASURE_PX = 40;          // font size of the off-screen measuring table

  /* ---------- starting points: sample rows, titles and rules ---------- */
  var PRESETS = {
    league: {
      title: 'Northwind Sunday League',
      subtitle: 'Division One · Table after matchweek 18',
      footer: 'Top four qualify for the Northwind Cup · Bottom two are relegated',
      disclosure: '',
      hcol: 'Pos', rules: '<= 4 green; >= 11 red', style: 'row',
      rows: [
        'Pos | Team | P | W | D | L | GF | GA | GD | Pts | Form',
        '1 | Northwind FC | 18 | 13 | 3 | 2 | 41 | 15 | +26 | 42 | WWDWW',
        '2 | Harbour City | 18 | 12 | 4 | 2 | 38 | 17 | +21 | 40 | WWWDW',
        '3 | Riverside Rovers | 18 | 11 | 3 | 4 | 35 | 20 | +15 | 36 | WLWWD',
        '4 | Ashford Town | 18 | 10 | 4 | 4 | 30 | 21 | +9 | 34 | DWWLW',
        '5 | Kingsbridge United | 18 | 8 | 4 | 6 | 29 | 24 | +5 | 28 | LWDWL',
        '6 | Millbrook Athletic | 18 | 6 | 6 | 6 | 26 | 23 | +3 | 24 | DDWLW',
        '7 | Eastgate Wanderers | 18 | 6 | 4 | 8 | 24 | 25 | −1 | 22 | WLLDW',
        '8 | Fairhaven | 18 | 5 | 5 | 8 | 22 | 26 | −4 | 20 | LDWLD',
        '9 | Oakley Park | 18 | 4 | 5 | 9 | 20 | 27 | −7 | 17 | LLDWL',
        '10 | Stonebridge | 18 | 3 | 6 | 9 | 19 | 29 | −10 | 15 | DLLDW',
        '11 | Westmoor Albion | 18 | 3 | 4 | 11 | 16 | 34 | −18 | 13 | LLWLD',
        '12 | Pinecrest | 18 | 2 | 2 | 14 | 12 | 51 | −39 | 8 | LLLDL'
      ]
    },
    rates: {
      title: 'Savings rates',
      subtitle: 'Northwind Savings · Rates effective from 1 October 2026',
      footer: 'Ask in branch for the full terms and conditions of every account',
      disclosure: 'AER stands for Annual Equivalent Rate and illustrates what the interest rate would be if interest was paid and compounded once each year. ' +
        'Gross p.a. is the contractual rate of interest payable before tax. Rates are variable unless the account has a fixed term, and may change. ' +
        'Fixed Rate Bonds do not allow withdrawals before maturity. Sample figures for illustration only: Northwind Savings is a fictional name.',
      hcol: 'AER', rules: '>= 4.4 green', style: 'cell',
      rows: [
        'Account | Term | AER | Gross p.a. | Interest paid | Min. deposit',
        'Easy Access Saver | No term | 3.85% | 3.78% | Monthly | £1',
        'Bonus Saver | No term | 4.40% | 4.31% | Monthly | £500',
        'Notice Saver 95 | 95 days\' notice | 4.35% | 4.27% | Monthly | £1,000',
        'Regular Saver | 12 months | 6.00% | 5.84% | At maturity | £25 a month',
        'Fixed Rate Bond | 1 year | 4.45% | 4.45% | At maturity | £1,000',
        'Fixed Rate Bond | 2 years | 4.20% | 4.12% | Annually | £1,000',
        'Fixed Rate Bond | 3 years | 4.05% | 3.98% | Annually | £1,000',
        'Tax-free Saver | No term | 4.10% | 4.10% | Annually | £100',
        'Junior Saver | No term | 5.00% | 4.89% | Monthly | £1'
      ]
    },
    stock: {
      title: 'Stock levels',
      subtitle: 'Northwind Supply · Warehouse B',
      footer: 'Red: under 5 on hand · Amber: under 15 · Recounted every 15 minutes',
      disclosure: '',
      hcol: 'On hand', rules: '< 5 red; < 15 amber', style: 'cell',
      rows: [
        'SKU | Product | Bin | On hand | Reorder at | Supplier',
        'NW-1042 | Cordless drill 18V | A-03 | 24 | 10 | Harbor Tools',
        'NW-1077 | Impact driver 18V | A-04 | 3 | 8 | Harbor Tools',
        'NW-2210 | Wood screws 4×40 (200) | C-11 | 142 | 50 | Fixall',
        'NW-2215 | Wall plugs, brown (100) | C-12 | 12 | 40 | Fixall',
        'NW-3301 | Laser level | B-07 | 7 | 5 | Linea Instruments',
        'NW-3318 | Tape measure 8 m | B-02 | 58 | 20 | Linea Instruments',
        'NW-4120 | Safety glasses | D-01 | 0 | 25 | Brightguard',
        'NW-4126 | Work gloves, size L | D-02 | 36 | 30 | Brightguard',
        'NW-5004 | Extension lead 10 m | E-05 | 9 | 12 | Volta Supply',
        'NW-5019 | LED work light | E-06 | 18 | 10 | Volta Supply',
        'NW-6150 | Sanding discs P120 (50) | C-20 | 4 | 15 | Fixall',
        'NW-6188 | Masking tape 48 mm | C-21 | 77 | 30 | Fixall'
      ]
    },
    generic: {
      title: 'Today\'s training',
      subtitle: 'Northwind Learning Centre · Level 2',
      footer: 'Book a seat at the front desk or on the intranet',
      disclosure: '',
      hcol: 'Seats left', rules: '= 0 red; < 4 amber', style: 'cell',
      rows: [
        'Session | Trainer | Room | Starts | Ends | Seats left',
        'Fire safety induction | Priya Nair | Room 2.01 | 08:30 | 09:15 | 6',
        'Excel: pivot tables | Tom Becker | Lab 2.10 | 09:00 | 10:30 | 0',
        'First aid refresher | Grace Mensah | Room 2.04 | 09:30 | 12:00 | 3',
        'Leading hybrid teams | Daniel Ortiz | Room 2.01 | 10:00 | 11:30 | 11',
        'Customer conversations | Aiko Tanaka | Room 2.06 | 11:00 | 12:00 | 8',
        'Data protection basics | Priya Nair | Room 2.01 | 13:00 | 13:45 | 14',
        'Presenting with confidence | Marcus Hale | Room 2.04 | 13:30 | 15:00 | 2',
        'Excel: dashboards | Tom Becker | Lab 2.10 | 14:00 | 15:30 | 5',
        'Wellbeing at work | Grace Mensah | Room 2.06 | 15:30 | 16:15 | 20'
      ]
    }
  };

  /* Highlight colours: bright ones for the dark themes, deeper ones for the light theme. */
  var COLOURS = {
    dark:  { red: '#FF6B6B', amber: '#FFB547', green: '#3DDC97', blue: '#5AA9FF', purple: '#B794F6', grey: '#9AA4B2' },
    light: { red: '#C62F2F', amber: '#A86410', green: '#18804B', blue: '#2563B0', purple: '#7048B6', grey: '#5E6675' }
  };
  var COLOUR_ALIASES = { orange: 'amber', yellow: 'amber', gray: 'grey', muted: 'grey', violet: 'purple' };

  function str(x) { return x == null ? '' : String(x).trim(); }

  /* ---------- language (words and samples in i18n.js) ---------- */
  var I18N = typeof DATA_TABLE_I18N === 'object' && DATA_TABLE_I18N ? DATA_TABLE_I18N : { en: { words: {}, form: { w: 'W', d: 'D', l: 'L' }, lead: [] } };
  // Colour words of every language work in the rules, whatever the screen's language.
  Object.keys(I18N).forEach(function (lang) {
    var c = I18N[lang].colours || {};
    Object.keys(c).forEach(function (w) { if (!COLOUR_ALIASES[w]) COLOUR_ALIASES[w] = c[w]; });
  });
  /* A usable BCP-47 tag: the setting if Intl accepts it, else the screen's language. */
  function pickLocale(tag) {
    var t = str(tag);
    if (t) {
      try { if (Intl.DateTimeFormat.supportedLocalesOf([t]).length) return t; } catch (e) { /* invalid tag */ }
    }
    return (typeof navigator !== 'undefined' && navigator.language) || 'en';
  }
  function langOf(tag) {
    var lang = String(tag).toLowerCase().split(/[-_]/)[0];
    return I18N[lang] ? lang : 'en';
  }

  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  // A cell as a number, or null: "1,250", "+9", "-4", "4.45%", "£1,000", "3,85 %", "R$ 1.000" and
  // "−3" all count. Only "1.250" / "1,250" are ambiguous; the screen's decimal mark decides those.
  var MARK = '.';
  function toNumber(v) {
    var s = str(v);
    if (!s) return null;
    s = s.replace(/−/g, '-').replace(/R\$|[\s\u00a0\u202f$€£¥￥₹%+'’]/g, '');
    var dot = s.lastIndexOf('.'), comma = s.lastIndexOf(',');
    if (dot > -1 && comma > -1) {
      s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (comma > -1) {
      // Thousands (1,250,000) or Indian lakhs (12,50,000).
      var groups = /^-?\d{1,3}(,\d{3})+$/.test(s) || /^-?\d{1,2}(,\d{2})+,\d{3}$/.test(s);
      s = groups && !(MARK === ',' && s.split(',').length === 2) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (dot > -1 && s.split('.').length > 2) {
      s = /^-?\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : '';
    } else if (dot > -1 && MARK === ',' && /^-?\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace('.', '');
    }
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function isHex(s) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var body = document.body;
    var root = document.documentElement;
    var stage = document.getElementById('stage');
    var table = document.getElementById('table');
    var colsEl = document.getElementById('cols');
    var headRow = document.getElementById('headrow');
    var tbody = document.getElementById('body');
    var mtable = document.getElementById('mtable');
    var mhead = document.getElementById('mhead');
    var mbody = document.getElementById('mbody');
    var note = document.getElementById('note');
    var pager = document.getElementById('pager');
    var progress = document.getElementById('progress');
    var bar = document.getElementById('progress-bar');
    var spage = document.getElementById('spage');
    var locale = pickLocale(v.locale);
    var lang = langOf(locale);
    var L = I18N[lang];
    var EN = I18N.en || L;
    function word(k) { return (L.words && L.words[k]) || (EN.words && EN.words[k]) || ''; }
    root.setAttribute('lang', locale);
    var numFmt = null;
    try { numFmt = new Intl.NumberFormat(locale); } catch (e) { numFmt = null; }
    try { MARK = (1.5).toLocaleString(locale).indexOf(',') !== -1 ? ',' : '.'; } catch (e) { MARK = '.'; }
    function fmtNum(x) { try { return numFmt ? numFmt.format(x) : String(x); } catch (e) { return String(x); } }

    var theme = { midnight: 1, graphite: 1, paper: 1, contrast: 1 }[v.theme] ? v.theme : 'midnight';
    body.setAttribute('data-theme', theme);
    body.setAttribute('data-font', str(v.font) || 'archivo');
    var accent = isHex(str(v.accent)) ? str(v.accent) : '#4DA3FF';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', rgba(accent, theme === 'paper' ? 0.10 : 0.16));
    var palette = theme === 'paper' ? COLOURS.light : COLOURS.dark;

    var presetKey = PRESETS[v.preset] ? v.preset : (v.preset === 'none' ? '' : 'league');
    var preset = presetKey ? localPreset(presetKey) : null;

    /* A starting point in the screen's language: texts, headings and sample cells from i18n.js,
       amounts, percentages and the date written by Intl. English is PRESETS as it stands. */
    function localPreset(key) {
      var base = PRESETS[key];
      var tr = lang !== 'en' && L.presets && L.presets[key];
      if (!tr) return base;
      var enHead = base.rows[0].split('|').map(str);
      var head = tr.head && tr.head.length === enHead.length ? tr.head : enHead;
      var cells = tr.cells || {};
      var money = L.money || { currency: 'GBP', scale: 1 };
      function fmt(n, opts) {
        try { return new Intl.NumberFormat(locale, opts).format(n); } catch (e) { return String(n); }
      }
      function cell(text, c) {
        if (enHead[c] === 'Form') {
          var f = L.form || EN.form;
          return text.replace(/[WDL]/g, function (ch) { return f[ch.toLowerCase()] || ch; });
        }
        if (cells[text] !== undefined) return cells[text];
        var pct = /^(\d+(?:\.\d+)?)%$/.exec(text);
        if (pct) return fmt(Number(pct[1]) / 100, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        var m = /£([\d,]+)/.exec(text);
        if (m) {
          var amount = fmt(Number(m[1].replace(/,/g, '')) * money.scale,
            { style: 'currency', currency: money.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
          var pattern = text.replace(m[0], '{m}');
          return (cells[pattern] !== undefined ? cells[pattern] : pattern).replace('{m}', amount);
        }
        return text;
      }
      var date = '';
      try {
        date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
          .format(new Date(Date.UTC(2026, 9, 1, 12)));
      } catch (e) { date = '2026-10-01'; }
      var rows = [head.join(' | ')].concat(base.rows.slice(1).map(function (line) {
        return line.split('|').map(function (x, c) { return cell(str(x), c); }).join(' | ');
      }));
      var hi = enHead.indexOf(base.hcol);
      return {
        title: str(tr.title) || base.title,
        subtitle: str(tr.subtitle || base.subtitle).replace('{date}', date),
        footer: str(tr.footer) || base.footer,
        disclosure: tr.disclosure !== undefined ? tr.disclosure : base.disclosure,
        hcol: hi > -1 ? head[hi] : base.hcol,
        rules: base.rules, style: base.style, rows: rows
      };
    }

    // A text setting: "-" hides it, empty falls back to the starting point.
    function setting(name, presetField) {
      var s = str(v[name]);
      if (s === '-') return '';
      if (s) return s;
      return preset ? str(preset[presetField]) : '';
    }

    var title = setting('title', 'title');
    var subtitle = setting('subtitle', 'subtitle');
    document.getElementById('title').textContent = title;
    document.getElementById('subtitle').textContent = subtitle;
    document.getElementById('footer').textContent = setting('footer', 'footer');
    document.getElementById('disclosure').textContent = setting('disclosure', 'disclosure');
    var hasLogo = false;
    if (v.logo) {
      var logo = document.getElementById('logo');
      logo.src = v.logo;
      logo.hidden = false;
      hasLogo = true;
    }
    if (!title && !subtitle && !hasLogo) document.getElementById('head').classList.add('empty');
    if (v.zebra !== false && v.zebra !== 'false') table.classList.add('zebra');

    /* ---------- the rows ---------- */
    function prettyKey(k) {
      var s = k.replace(/_/g, ' ');
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function sameKey(name, key) {
      var k = slug(name);
      // A heading in another script (順位, स्थान) has no Latin key: the server numbers it col1, col2, …
      if (!k) return /^col\d+(_\d+)?$/.test(key);
      return k === key || k === key.replace(/_\d+$/, '');
    }
    // Does a heading typed in a setting name this column? By its key, or (any script) by its text.
    function names(typed, col) {
      var k = slug(typed);
      if (k && (slug(col.name) === k || col.key === k)) return true;
      return str(typed).toLowerCase() === str(col.name).toLowerCase();
    }
    // The server and the typed table call an empty heading "Column 3": say it in the screen's language.
    function shownName(name) {
      var m = /^Column (\d+)$/.exec(name);
      return m ? word('column').replace('{n}', fmtNum(Number(m[1]))) : name;
    }

    // { state: 'ok' | 'waiting' | 'empty', columns: [{name, key}], rows: [[...]], updated }
    function fromSource() {
      var bound = !!str(v.table);
      var d = ST.data && ST.data.table;
      if (!d || typeof d !== 'object' || !Object.keys(d).length) return bound ? { state: 'waiting', columns: [], rows: [] } : null;
      var keys = [];
      Object.keys(d).forEach(function (k) {
        var m = /^row1_(.+)$/.exec(k);
        if (m && keys.length < MAX_COLS) keys.push(m[1]);
      });
      if (!keys.length) {
        // A table with no rows yet, or a source that is not a table at all (then show the sample).
        if (Number(d.row_count) === 0 && d.columns !== undefined) {
          var cols0 = String(d.columns).split(', ').filter(Boolean).slice(0, MAX_COLS);
          return { state: 'empty', columns: cols0.map(function (n) { return { name: n, key: slug(n) }; }), rows: [], updated: d.updated };
        }
        return null;
      }
      // Header names: the source lists them comma-separated, and a name may itself hold ", ".
      var names = String(d.columns == null ? '' : d.columns).split(', ');
      var j = 0;
      var columns = keys.map(function (key) {
        for (var t = j; t < Math.min(names.length, j + 6); t++) {
          var name = names.slice(j, t + 1).join(', ');
          if (sameKey(name, key)) { j = t + 1; return { name: name, key: key }; }
        }
        return { name: prettyKey(key), key: key };
      });
      var rows = [];
      for (var i = 1; i <= MAX_ROWS; i++) {
        var row = [];
        var whole = true;
        for (var c = 0; c < keys.length; c++) {
          var cell = d['row' + i + '_' + keys[c]];
          if (cell === undefined) { whole = false; break; }
          row.push(str(cell));
        }
        if (!whole) break;   // the end of the table, or the end of what the server passed on
        rows.push(row);
      }
      return { state: 'ok', columns: columns, rows: rows, updated: d.updated, total: Number(d.row_count) || 0 };
    }

    function fromText(text) {
      var lines = String(text).split(/\r?\n/).filter(function (l) { return str(l) !== ''; });
      if (!lines.length) return null;
      var head = lines[0].split('|').map(str).slice(0, MAX_COLS);
      var seen = {};
      var columns = head.map(function (n, i) {
        var name = n || ('Column ' + (i + 1));   // shown through shownName()
        var key = slug(name) || ('col' + (i + 1));
        if (seen[key]) { seen[key]++; key = key + '_' + seen[key]; } else seen[key] = 1;
        return { name: name, key: key };
      });
      var rows = lines.slice(1, MAX_ROWS + 1).map(function (l) {
        var cells = l.split('|').map(str);
        var r = [];
        for (var i = 0; i < columns.length; i++) r.push(cells[i] || '');
        return r;
      });
      return { state: rows.length ? 'ok' : 'empty', columns: columns, rows: rows };
    }

    var data = fromSource();
    var fromDataSource = !!data;
    if (!data && str(v.rows)) data = fromText(v.rows);
    if (!data && preset) data = fromText(preset.rows.join('\n'));
    if (!data) data = { state: 'empty', columns: [], rows: [] };

    /* ---------- which columns, in which order ---------- */
    var order = data.columns.map(function (c, i) { return i; });
    var wanted = str(v.show_columns).split(',').map(str).filter(Boolean);
    if (wanted.length && data.columns.length) {
      var picked = [];
      wanted.forEach(function (w) {
        for (var i = 0; i < data.columns.length; i++) {
          if (names(w, data.columns[i]) && picked.indexOf(i) === -1) { picked.push(i); break; }
        }
      });
      if (picked.length) order = picked;
    }
    var columns = order.map(function (i) { return data.columns[i]; });
    var rows = data.rows ? data.rows.map(function (r) { return order.map(function (i) { return r[i] || ''; }); }) : [];

    /* ---------- what each column holds ---------- */
    // A form guide: a column called Form (or the screen language's word), only W/D/L letters
    // (or the screen language's letters, S/U/N, V/N/D, 勝/分/敗 …).
    function formSet(f) {
      var map = {};
      map[f.w.toUpperCase()] = 'w'; map[f.d.toUpperCase()] = 'd'; map[f.l.toUpperCase()] = 'l';
      return map;
    }
    var formSets = [formSet(L.form || EN.form)];
    if (L !== EN) formSets.push(formSet(EN.form));
    var formHeads = ['form'].concat(L.formHead || []);
    var leadNames = (EN.lead || []).concat(L !== EN ? L.lead || [] : []);
    function lettersOf(x) { return Array.from ? Array.from(x.replace(/[\s,]/g, '').toUpperCase()) : x.replace(/[\s,]/g, '').toUpperCase().split(''); }
    var kinds = columns.map(function (col, c) {
      var vals = rows.map(function (r) { return r[c]; }).filter(function (x) { return x !== ''; });
      var nums = vals.filter(function (x) { return toNumber(x) !== null; }).length;
      var numeric = vals.length > 0 && nums / vals.length >= 0.8;
      var form = null;
      var low = str(col.name).toLowerCase();
      if (vals.length > 0 && (slug(col.name) === 'form' || formHeads.indexOf(low) !== -1)) {
        for (var fs = 0; fs < formSets.length && !form; fs++) {
          var set = formSets[fs];
          if (vals.every(function (x) {
            var ls = lettersOf(x);
            return ls.length > 0 && ls.length <= 8 && ls.every(function (ch) { return !!set[ch]; });
          })) form = set;
        }
      }
      return { numeric: numeric, form: form };
    });
    var keyCol = -1;
    for (var kc = 0; kc < kinds.length; kc++) if (!kinds[kc].numeric && !kinds[kc].form) { keyCol = kc; break; }
    var leadCol = -1;   // a points / total column at the end reads as the "answer"
    var lastC = columns.length - 1;
    for (var lc = lastC; lc >= Math.max(0, lastC - 1); lc--) {
      if (kinds[lc] && kinds[lc].numeric && (leadNames.indexOf(str(columns[lc].name).toLowerCase()) !== -1 || (EN.lead || []).indexOf(slug(columns[lc].name)) !== -1)) { leadCol = lc; break; }
    }

    /* ---------- highlight rules ---------- */
    var hName = setting('highlight_col', 'hcol');
    var hRules = str(v.highlight_rules) === '-' ? '' : (str(v.highlight_rules) || (str(v.highlight_col) ? '' : (preset ? preset.rules : '')));
    var hStyle = v.highlight_style === 'row' || v.highlight_style === 'cell' ? v.highlight_style : (preset ? preset.style : 'cell');
    var hCol = -1;
    if (hName) {
      for (var h = 0; h < columns.length; h++) if (names(hName, columns[h])) { hCol = h; break; }
    }
    function colourOf(word) {
      var w = word.toLowerCase();
      if (isHex(word)) return word;
      if (w === 'accent') return accent;
      return palette[COLOUR_ALIASES[w] || w] || null;
    }
    var rules = [];
    hRules.split(';').forEach(function (part) {
      var s = str(part);
      if (!s) return;
      var m = /^(<=|>=|!=|<>|==|=|<|>|≤|≥|≠|contains\b|is not\b|is\b|not\b)?\s*(.*)$/i.exec(s);
      var op = (m[1] || '=').toLowerCase();
      var rest = str(m[2]);
      var sp = rest.lastIndexOf(' ');
      var colour = colourOf(sp === -1 ? rest : rest.slice(sp + 1));
      var value = sp === -1 ? '' : str(rest.slice(0, sp));
      if (!colour || (!value && !m[1])) return;
      op = { '==': '=', 'is': '=', '<>': '!=', '≠': '!=', 'not': '!=', 'is not': '!=', '≤': '<=', '≥': '>=' }[op] || op;
      rules.push({ op: op, value: value, num: toNumber(value), colour: colour });
    });
    function ruleFor(cell) {
      var n = toNumber(cell);
      var low = str(cell).toLowerCase();
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        var both = n !== null && r.num !== null;
        var hit = false;
        if (r.op === '<') hit = both && n < r.num;
        else if (r.op === '<=') hit = both && n <= r.num;
        else if (r.op === '>') hit = both && n > r.num;
        else if (r.op === '>=') hit = both && n >= r.num;
        else if (r.op === '=') hit = both ? n === r.num : low === r.value.toLowerCase();
        else if (r.op === '!=') hit = both ? n !== r.num : low !== r.value.toLowerCase();
        else if (r.op === 'contains') hit = !!r.value && low.indexOf(r.value.toLowerCase()) !== -1;
        if (hit) return r;
      }
      return null;
    }
    function paint(node, colour) {
      node.style.setProperty('--hl', colour);
      node.style.setProperty('--hl-text', colour);
      node.style.setProperty('--hl-soft', rgba(colour, theme === 'paper' ? 0.12 : 0.17));
      node.style.setProperty('--hl-line', rgba(colour, 0.45));
    }

    /* ---------- building rows ---------- */
    function cellClass(c) {
      var k = kinds[c];
      var cls = k.numeric ? (c === 0 ? 'ctr' : 'num') : '';
      if (c === keyCol) cls += ' key';
      if (c === leadCol || (c === 0 && k.numeric)) cls += ' lead';
      return str(cls);
    }
    function headerInto(tr) {
      tr.textContent = '';
      columns.forEach(function (col, c) {
        var th = el('th', kinds[c].numeric ? (c === 0 ? 'ctr' : 'num') : (kinds[c].form ? 'ctr' : ''), shownName(col.name));
        tr.appendChild(th);
      });
    }
    function rowNode(r) {
      var tr = el('tr');
      var rule = hCol >= 0 && rules.length ? ruleFor(r[hCol]) : null;
      if (rule && hStyle === 'row') { tr.className = 'hl'; paint(tr, rule.colour); }
      for (var c = 0; c < columns.length; c++) {
        var td = el('td', cellClass(c));
        var text = r[c];
        if (kinds[c].form && text) {
          td.className = 'ctr';
          var set = kinds[c].form;
          lettersOf(text).forEach(function (ch) {
            td.appendChild(el('span', 'chip ' + (set[ch] || 'd'), ch));
          });
        } else if (rule && c === hCol && hStyle === 'cell' && text) {
          var b = td.appendChild(el('span', 'badge', text));
          paint(b, rule.colour);
        } else {
          if (rule && c === hCol) td.className += ' hcell';
          // Text cells sit in a span, so they can take two lines when the table is set to wrap.
          if (!kinds[c].numeric && !kinds[c].form && text) td.appendChild(el('span', 't', text)).dir = 'auto';
          else td.textContent = text;
        }
        tr.appendChild(td);
      }
      return tr;
    }
    function emptyRow() {
      var tr = el('tr');
      for (var c = 0; c < Math.max(1, columns.length); c++) tr.appendChild(el('td', 'dim' + (c === 0 ? ' ctr' : ''), '—'));
      return tr;
    }

    /* ---------- states without rows ---------- */
    function showNote(waiting) {
      note.hidden = false;
      note.textContent = waiting ? '· · ·' : '—';
      table.style.visibility = 'hidden';
      progress.classList.add('off');
    }
    if (data.state === 'waiting' || !columns.length) { showNote(data.state === 'waiting'); return; }

    // Measure every row once (columns keep the same width on every page).
    headerInto(mhead);
    headerInto(headRow);
    (rows.length ? rows : [null]).forEach(function (r) { mbody.appendChild(r ? rowNode(r) : emptyRow()); });

    /* ---------- the last-updated stamp ---------- */
    if (fromDataSource && data.updated && v.show_updated !== false && v.show_updated !== 'false') {
      var when = new Date(String(data.updated));
      if (!isNaN(when.getTime())) {
        var opts = { hour: '2-digit', minute: '2-digit' };
        var tz = str(v.timezone);
        var loc = locale;
        var stamp = '';
        try {
          if (tz) opts.timeZone = tz;
          var dayFmt = new Intl.DateTimeFormat(loc, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz || undefined });
          if (dayFmt.format(when) !== dayFmt.format(new Date())) { opts.month = 'short'; opts.day = 'numeric'; }
          stamp = new Intl.DateTimeFormat(loc, opts).format(when);
        } catch (e) {
          try { stamp = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(when); } catch (e2) { stamp = ''; }
        }
        // Empty = the built-in word in the screen's language; a single - shows the time alone.
        var label = str(v.updated_label) === '-' ? '' : (str(v.updated_label) || word('updated'));
        if (stamp) document.getElementById('updated').textContent = (label ? label + ' ' : '') + stamp;
      }
    }

    /* ---------- more rows in the source than reached the screen (the server's per-screen cap) ---------- */
    if (fromDataSource && data.total > data.rows.length && data.rows.length > 0) {
      var lim = str(v.limit_label) || word('limit');
      document.getElementById('limit').textContent = lim
        .replace('{shown}', fmtNum(data.rows.length)).replace('{total}', fmtNum(data.total));
    }

    /* ---------- fitting ---------- */
    var pages = [[0, rows.length]];
    var page = 0;
    var timer = null;
    var seconds = Math.min(120, Math.max(4, Number(v.page_seconds) || 10));
    var perPage = Math.max(0, Math.min(40, Math.floor(Number(v.rows_per_page) || 0)));

    // The width of what is inside a cell (text, chips, badge), without its padding.
    function contentWidth(node) {
      var range = document.createRange();
      range.selectNodeContents(node);
      var w = range.getBoundingClientRect().width;
      if (range.detach) range.detach();
      return w;
    }

    // The narrowest width that holds a cell's text on two lines, broken at a space or a hyphen (or
    // anywhere in Japanese / Chinese): the longer half of the best split. A cell with no break
    // point (a code like "NW-1042"), or with chips or a badge, keeps one line.
    function twoLineWidth(node) {
      var full = contentWidth(node);
      var tn = null;
      if (node.childNodes.length === 1) {
        var only = node.firstChild;
        if (only.nodeType === 3) tn = only;
        else if (only.className === 't' && only.childNodes.length === 1 && only.firstChild.nodeType === 3) tn = only.firstChild;
      }
      if (!tn) return full;
      var text = tn.data, best = full;
      var range = document.createRange();
      // Japanese and Chinese break between any two characters, so they may split in the middle.
      var cjk = text.indexOf(' ') === -1 && /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(text);
      if (cjk && text.length > 1) {
        var mid = Math.ceil(text.length / 2);
        range.setStart(tn, 0); range.setEnd(tn, mid);
        var first = range.getBoundingClientRect().width;
        range.setStart(tn, mid); range.setEnd(tn, text.length);
        best = Math.min(best, Math.max(first, range.getBoundingClientRect().width));
      }
      // Break points: every space, and every hyphen between two letters (German compounds such as
      // "Junior-Sparkonto"; a code like "NW-1042" has a digit after it and stays whole).
      var cuts = [];
      for (var i = text.indexOf(' '); i > 0; i = text.indexOf(' ', i + 1)) cuts.push([i, i + 1]);
      var hy = /[A-Za-z\u00c0-\u024f]-(?=[A-Za-z\u00c0-\u024f])/g, h;
      while ((h = hy.exec(text))) cuts.push([h.index + 2, h.index + 2]);
      for (var k = 0; k < cuts.length; k++) {
        range.setStart(tn, 0); range.setEnd(tn, cuts[k][0]);
        var a = range.getBoundingClientRect().width;
        range.setStart(tn, cuts[k][1]); range.setEnd(tn, text.length);
        var b = range.getBoundingClientRect().width;
        best = Math.min(best, Math.max(a, b));
      }
      if (range.detach) range.detach();
      return best;
    }

    // Natural sizes, in ems of the table font, from the measuring copy. Two ways of setting the table:
    // "line" keeps every cell on one line; "wrap" lets headings and text cells take two lines,
    // which on a narrow (portrait) screen lets the text grow instead of the rows.
    function measure() {
      var ths = mhead.children;
      var nMeasured = Math.max(1, mbody.children.length);
      var tdPad = 0, thPad = 0;
      var firstTd = mbody.querySelector('td');
      if (firstTd) { var cs = getComputedStyle(firstTd); tdPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight); }

      mtable.classList.remove('wrap');
      var line = { em: [], head: mhead.getBoundingClientRect().height / MEASURE_PX,
        row: mbody.getBoundingClientRect().height / MEASURE_PX / nMeasured };
      // A little slack per column, so rounding never cuts the widest cell to "1…".
      for (var i = 0; i < ths.length; i++) line.em.push(ths[i].getBoundingClientRect().width / MEASURE_PX + 0.15);
      var cellW = [], cellTwo = [];
      for (var c = 0; c < ths.length; c++) { cellW.push(0); cellTwo.push(0); }
      for (var r = 0; r < mbody.children.length; r++) {
        var tds = mbody.children[r].children;
        for (var k = 0; k < tds.length && k < cellW.length; k++) {
          cellW[k] = Math.max(cellW[k], contentWidth(tds[k]));
          if (!kinds[k].numeric && !kinds[k].form) cellTwo[k] = Math.max(cellTwo[k], twoLineWidth(tds[k]));
        }
      }

      mtable.classList.add('wrap');
      if (ths.length) { var hs = getComputedStyle(ths[0]); thPad = parseFloat(hs.paddingLeft) + parseFloat(hs.paddingRight); }
      var headW = [], headTwo = [];
      for (var h = 0; h < ths.length; h++) { headW.push(contentWidth(ths[h])); headTwo.push(twoLineWidth(ths[h])); }
      var wrapHead1 = mhead.getBoundingClientRect().height / MEASURE_PX;
      var wrapRow1 = mbody.getBoundingClientRect().height / MEASURE_PX / nMeasured;
      mtable.classList.remove('wrap');

      var wrap = { em: [], head: wrapHead1, row: wrapRow1 };
      var headWraps = false, bodyWraps = false;
      for (var w = 0; w < ths.length; w++) {
        var isText = !kinds[w].numeric && !kinds[w].form;
        var px = Math.max(headTwo[w] + thPad, (isText ? cellTwo[w] : cellW[w]) + tdPad);
        if (headW[w] + thPad > px + 1) headWraps = true;
        if (isText && cellW[w] + tdPad > px + 1) bodyWraps = true;
        wrap.em.push(px / MEASURE_PX + 0.15);
      }
      if (headWraps) wrap.head += 0.74 * 1.15;    // one more heading line (heading type is .74em, line-height 1.15)
      if (bodyWraps) wrap.row += 1.22;            // one more text line
      wrap.useful = headWraps || bodyWraps;
      return { line: line, wrap: wrap };
    }
    var sizes = null;

    function layout() {
      var W = window.innerWidth, H = window.innerHeight;
      var strip = W / H > 3.2;
      body.classList.toggle('strip', strip);
      // Narrow screens spend less width on cell padding, so the text can be bigger.
      root.style.setProperty('--padx', W / H < 1 ? '.45em' : '.72em');
      body.classList.toggle('narrow', W / H < 1);   // portrait: bigger heading labels
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (sw < 10 || sh < 10) return;
      sizes = measure();
      var n = Math.max(1, rows.length);

      var fMin = strip ? H * 0.115 : Math.max(14, 0.02 * Math.min(W, H));
      var fMax = strip ? H * 0.17 : Math.max(fMin, 0.052 * Math.min(W, H));
      var textCols = [];
      for (var t = 0; t < kinds.length; t++) if (!kinds[t].numeric && !kinds[t].form) textCols.push(t);

      // One way of setting the table → font size, rows a page, column widths and row height.
      function plan(s) {
        var em = s.em, headEm = s.head, rowEm = s.row;
        var sumEm = em.reduce(function (a, b) { return a + b; }, 0);
        function hFit(r) { return sh * 0.985 / (headEm + r * rowEm); }
        var fW = sw * 0.99 / sumEm;
        // Text columns can give up width (ending in "…") so the numbers stay readable.
        function canSqueeze(f) {
          if (!textCols.length) return false;
          var fixed = 0, flex = 0;
          for (var c = 0; c < em.length; c++) { if (textCols.indexOf(c) === -1) fixed += em[c] * f; else flex += em[c] * f; }
          return sw - fixed >= Math.min(flex, textCols.length * 5 * f);
        }
        var widthCap = fW >= fMin ? fW : (canSqueeze(fMin) ? fMin : Math.max(10, fW));
        var f, R;
        if (perPage > 0) {
          R = Math.min(perPage, n);
          f = Math.max(9, Math.min(widthCap, hFit(R), fMax * 1.3));
        } else {
          var fAll = Math.min(widthCap, hFit(n), fMax);
          if (fAll >= Math.min(fMin, widthCap) - 0.01) {
            f = fAll; R = n;
          } else {
            var comfy = strip ? fMin : Math.max(fMin, Math.min(fMax, hFit(12)));
            f = Math.max(9, Math.min(widthCap, comfy));
            R = Math.max(1, Math.floor((sh * 0.985 / f - headEm) / rowEm));
          }
        }
        f = Math.floor(f * 4) / 4;
        // Even pages: 23 rows at 10 a page reads better as 8 + 8 + 7 than 10 + 10 + 3.
        var count = Math.max(1, Math.ceil(n / R));
        R = Math.ceil(n / count);

        // Column widths: natural, then spare width to the text columns (or squeeze them).
        var widths = em.map(function (e) { return e * f; });
        var total = widths.reduce(function (a, b) { return a + b; }, 0);
        var grow = textCols.length ? textCols : widths.map(function (x, k) { return k; });
        var growSum = grow.reduce(function (a, k) { return a + widths[k]; }, 0);
        var spare = sw - total;
        if (spare < 0 && !textCols.length) spare = 0;
        grow.forEach(function (k) { widths[k] = Math.max(f * 2, widths[k] + spare * widths[k] / growSum); });

        // Spare height (a short table on a tall screen, or less than one row left over): taller rows,
        // the same on every page, instead of an empty band under the table.
        var stretch = Math.max(1, Math.min(3.2, (sh * 0.985 / f - headEm) / (R * rowEm)));
        return { f: f, R: R, count: count, widths: widths, rowh: rowEm * f * stretch };
      }

      var chosen = plan(sizes.line);
      var wrapMode = false;
      if (!strip && sizes.wrap.useful) {
        var alt = plan(sizes.wrap);
        if (alt.f > chosen.f * 1.08 && alt.count <= chosen.count) { chosen = alt; wrapMode = true; }
      }
      table.classList.toggle('wrap', wrapMode);

      pages = [];
      for (var p = 0; p < chosen.count; p++) pages.push([p * chosen.R, Math.min(rows.length, (p + 1) * chosen.R)]);
      table.style.fontSize = chosen.f + 'px';
      table.style.width = Math.floor(sw) + 'px';
      colsEl.textContent = '';
      chosen.widths.forEach(function (x) { var col = el('col'); col.style.width = Math.floor(x) + 'px'; colsEl.appendChild(col); });
      table.style.setProperty('--rowh', chosen.rowh.toFixed(2) + 'px');

      page = Math.min(page, pages.length - 1);
      renderPage();
      schedule();
    }

    function renderPage() {
      tbody.textContent = '';
      if (!rows.length) tbody.appendChild(emptyRow());
      for (var i = pages[page][0]; i < pages[page][1]; i++) tbody.appendChild(rowNode(rows[i]));
      drawPager();
    }

    function drawPager() {
      pager.textContent = '';
      spage.textContent = '';
      if (pages.length < 2) { progress.classList.add('off'); return; }
      progress.classList.remove('off');
      spage.textContent = fmtNum(page + 1) + ' / ' + fmtNum(pages.length);   // shown only in a strip
      if (pages.length > 12) {
        pager.appendChild(el('span', 'count', fmtNum(page + 1) + ' / ' + fmtNum(pages.length)));
      } else {
        for (var i = 0; i < pages.length; i++) pager.appendChild(el('span', i === page ? 'on' : ''));
      }
      // The thin bar along the bottom fills up until the next page.
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
      void bar.offsetWidth;
      bar.style.transition = 'transform ' + seconds + 's linear';
      bar.style.transform = 'scaleX(1)';
    }

    function schedule() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (pages.length < 2) return;
      timer = setTimeout(function () {
        table.classList.add('hide');
        timer = setTimeout(function () {
          page = (page + 1) % pages.length;
          renderPage();
          table.classList.remove('hide');
          schedule();
        }, 600);
      }, seconds * 1000);
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 250);
    });

    // Measure with the real fonts, not the fallbacks.
    var done = false;
    function first() { if (!done) { done = true; layout(); } }
    if (document.fonts && document.fonts.load && window.Promise) {
      var fam = { archivo: 'Archivo', oswald: 'Oswald', inter: 'Inter' }[str(v.font)] || 'Archivo';
      Promise.all([document.fonts.load('400 20px Inter'), document.fonts.load('700 20px Inter'), document.fonts.load('700 20px ' + fam)])
        .then(function () { return document.fonts.ready; })
        .then(first, first);
      setTimeout(first, 3000);   // never wait forever for a font
    } else first();
  });
})();
