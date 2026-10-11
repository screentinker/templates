/* Building directory — ScreenTinker community template. MIT.
   Reads the tenants from a table data source when one is connected (Google Sheet, CSV, Manual
   table and so on), otherwise from the typed-in lines. Groups them by floor, by first letter or by category,
   sizes the list to fill the screen in as many columns as read best, and when it cannot fit at a
   readable size splits it into pages that rotate. Writes with textContent only, fetches nothing. */
(function () {
  'use strict';

  var MAX_ENTRIES = 200;

  /* The words the board writes itself, by language (the primary subtag of the Language setting,
     or of the screen's language when that is empty). {n} is the floor. The settings for these
     words win when they are filled in. */
  var STRINGS = {
    en: { floor: 'Floor {n}', empty: 'No tenants listed yet' },
    de: { floor: 'Etage {n}', empty: 'Noch keine Mieter eingetragen' },
    es: { floor: 'Planta {n}', empty: 'Aún no hay inquilinos' },
    fr: { floor: 'Étage {n}', empty: 'Aucun occupant pour l’instant' },
    hi: { floor: 'मंज़िल {n}', empty: 'अभी कोई किरायेदार नहीं' },
    it: { floor: 'Piano {n}', empty: 'Ancora nessun inquilino' },
    ja: { floor: '{n}階', empty: '入居者はまだありません' },
    nl: { floor: 'Verdieping {n}', empty: 'Nog geen huurders' },
    pt: { floor: 'Andar {n}', empty: 'Nenhum inquilino ainda' },
    zh: { floor: '{n}层', empty: '暂无入驻单位' }
  };
  function pick(lang) {
    var p = String(lang || '').split('-')[0].toLowerCase();
    return Object.prototype.hasOwnProperty.call(STRINGS, p) ? STRINGS[p] : STRINGS.en;
  }
  var SVG = 'http://www.w3.org/2000/svg';

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
    if (k.normalize) k = k.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }
  function norm(s) { return str(s).toLowerCase(); }

  /* ---------- icons, drawn here (no image files) ---------- */
  function svg(paths, opts) {
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    paths.forEach(function (p) {
      var e = document.createElementNS(SVG, p.tag || 'path');
      Object.keys(p).forEach(function (k) { if (k !== 'tag') e.setAttribute(k, p[k]); });
      s.appendChild(e);
    });
    if (opts && opts.rotate) s.style.transform = 'rotate(' + opts.rotate + 'deg)';
    return s;
  }
  var STROKE = { fill: 'none', stroke: 'currentColor', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  function withStroke(o) { var r = {}; var k; for (k in STROKE) r[k] = STROKE[k]; for (k in o) r[k] = o[k]; return r; }
  function pinIcon() {
    return svg([{ d: 'M12 22s7-6.6 7-12.2A7 7 0 0 0 5 9.8C5 15.4 12 22 12 22z', fill: 'currentColor' },
                { tag: 'circle', cx: '12', cy: '9.8', r: '2.7', 'class': 'hole' }]);
  }
  function arrowIcon(deg) { return svg([withStroke({ d: 'M4 12h15M13 5.5l6.5 6.5-6.5 6.5' })], { rotate: deg }); }
  function liftIcon() {
    return svg([withStroke({ d: 'M5 3h14a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 5 3z', 'stroke-width': '2' }),
                { d: 'M12 6.2l3.6 4.2H8.4z', fill: 'currentColor' }, { d: 'M12 17.8l3.6-4.2H8.4z', fill: 'currentColor' }]);
  }
  function stairsIcon() { return svg([withStroke({ d: 'M3 20h5v-5h5v-5h5V5h3' })]); }
  var ARROWS = {
    right: 0, r: 0, e: 0, east: 0, '\u2192': 0, 'down-right': 45, 'right-down': 45, '\u2198': 45,
    down: 90, d: 90, s: 90, back: 90, behind: 90, south: 90, '\u2193': 90, 'down-left': 135, 'left-down': 135, '\u2199': 135,
    left: 180, l: 180, w: 180, west: 180, '\u2190': 180, 'up-left': 225, 'left-up': 225, '\u2196': 225,
    up: 270, u: 270, n: 270, ahead: 270, straight: 270, forward: 270, north: 270, '\u2191': 270, 'up-right': 315, 'right-up': 315, '\u2197': 315,
  };
  // The same directions in the other languages of the board (de, es, fr, it, nl, pt, ja, zh, hi).
  var LOCAL_ARROWS = {
    0: ['rechts', 'derecha', 'droite', 'destra', 'direita', '右', 'दाएँ', 'दाएं', 'दायें'],
    90: ['zurück', 'zuruck', 'atrás', 'atras', 'arrière', 'arriere', 'indietro', 'terug', 'trás', '後ろ', '后', 'पीछे'],
    180: ['links', 'izquierda', 'gauche', 'sinistra', 'esquerda', '左', 'बाएँ', 'बाएं', 'बायें'],
    270: ['geradeaus', 'recto', 'adelante', 'tout-droit', 'dritto', 'avanti', 'rechtdoor', 'em-frente', 'frente',
          '直進', '前', '直行', '向前', 'सीधे', 'आगे']
  };
  var LIFTS = ['lift', 'lifts', 'elevator', 'elevators', 'aufzug', 'fahrstuhl', 'ascensor', 'ascenseur', 'ascensore',
               'elevador', 'エレベーター', '电梯', 'लिफ्ट'];
  var STAIRS = ['stairs', 'stair', 'staircase', 'stairwell', 'treppe', 'escalera', 'escaleras', 'escalier', 'escaliers',
                'scale', 'trap', 'escada', 'escadas', '階段', '楼梯', 'सीढ़ी', 'सीढ़ियाँ', 'सीढ़ियां'];
  function nfc(s) { return s.normalize ? s.normalize('NFC') : s; }
  var WORDS = {};
  Object.keys(LOCAL_ARROWS).forEach(function (deg) { LOCAL_ARROWS[deg].forEach(function (w) { WORDS[nfc(w)] = +deg; }); });
  LIFTS.forEach(function (w) { WORDS[nfc(w)] = 'lift'; });
  STAIRS.forEach(function (w) { WORDS[nfc(w)] = 'stairs'; });
  function iconFor(a) {
    var k = nfc(norm(a).replace(/[\s_]+/g, '-'));
    if (!k) return null;
    if (Object.prototype.hasOwnProperty.call(ARROWS, k)) return arrowIcon(ARROWS[k]);
    if (!Object.prototype.hasOwnProperty.call(WORDS, k)) return null;
    var w = WORDS[k];
    return w === 'lift' ? liftIcon() : w === 'stairs' ? stairsIcon() : arrowIcon(w);
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var list = $('list');
    var stage = $('stage');
    var rail = $('rail');
    var pager = $('pager');

    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    // Text on the accent colour: dark on a light accent, white on a dark one.
    (function () {
      var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.accent || '#2BB3A3');
      if (!m) return;
      var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
      var n = parseInt(h, 16);
      var lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      root.style.setProperty('--on-accent', lum > 0.55 ? '#0B1418' : '#FFFFFF');
    })();

    var locale = str(v.locale) || undefined;
    // The board's own words and the page language follow the Language setting, else the screen's.
    var lang = locale || navigator.language || 'en';
    var T = pick(lang);
    root.lang = lang;
    var tz = str(v.timezone) || undefined;
    var mode = v.group_by === 'alpha' || v.group_by === 'category' ? v.group_by : 'floor';
    var showCat = v.show_category !== false;
    var showIndex = v.show_index !== false;
    var floorWord = str(v.floor_word);
    var hereFloor = norm(v.here_floor);

    /* ---------- header ---------- */
    var building = str(v.building_name);
    $('title').textContent = building;
    $('address').textContent = str(v.address);
    $('footer').textContent = str(v.footer);
    if (v.logo) {
      $('logo').src = v.logo;
      $('logo').hidden = false;
    } else if (building) {
      var words = building.split(' ').filter(function (w) { return /[A-Za-z0-9\u00c0-\uffff]/.test(w); });
      var ini = words.slice(0, 2).map(function (w) { return w.replace(/^[^A-Za-z0-9\u00c0-\uffff]+/, '').charAt(0); }).join('');
      $('mono').textContent = ini.toUpperCase();
      $('mono').hidden = !ini;
    }
    var hereText = str(v.here_text);
    if (hereText) {
      $('here-pin').appendChild(pinIcon());
      $('here-text').textContent = hereText;
      $('here').hidden = false;
    }

    /* ---------- clock ---------- */
    function makeFmt(opts) {
      var o = {}, k;
      for (k in opts) o[k] = opts[k];
      if (tz) o.timeZone = tz;
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(locale, o); } catch (e2) { return new Intl.DateTimeFormat(undefined, opts); }
      }
    }
    var clockMode = v.clock_format || 'auto';
    if (clockMode === 'off') {
      $('clockbox').hidden = true;
    } else {
      var timeOpts = { hour: 'numeric', minute: '2-digit' };
      if (clockMode === '24') { timeOpts.hour = '2-digit'; timeOpts.hourCycle = 'h23'; }
      if (clockMode === '12') timeOpts.hour12 = true;
      var timeFmt = makeFmt(timeOpts);
      var dateFmt = makeFmt({ weekday: 'long', day: 'numeric', month: 'long' });
      var tick = function () {
        var now = new Date();
        $('clock').textContent = timeFmt.format(now);
        $('date').textContent = dateFmt.format(now);
        setTimeout(tick, 60500 - (now.getTime() % 60000));
      };
      tick();
    }

    /* ---------- the tenants ---------- */
    function fromSource() {
      var d = ST.data && ST.data.directory;
      if (!d || typeof d !== 'object') return null;
      var k = {
        name: slug(v.name_col || 'Name'), floor: slug(v.floor_col || 'Floor'), suite: slug(v.suite_col || 'Suite'),
        cat: slug(v.category_col || 'Category'), arrow: slug(v.arrow_col || 'Arrow'),
      };
      if (!k.name) return null;
      var cols = String(d.columns || '').split(',').map(slug);
      // A synced, empty sheet with the right header: an empty directory, not the sample.
      if (d['row1_' + k.name] === undefined) {
        return Number(d.row_count) === 0 && cols.indexOf(k.name) !== -1 ? [] : null;
      }
      // The columns this sheet has that we read: a row missing one of them was cut off by the
      // server's limit on values per data source, so it and the rows after it are left out.
      var have = ['name', 'floor', 'suite', 'cat', 'arrow'].filter(function (f) { return cols.indexOf(k[f]) !== -1; });
      var out = [];
      for (var i = 1; i <= MAX_ENTRIES; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.name] === undefined) break;
        if (have.some(function (f) { return d[p + k[f]] === undefined; })) break;
        out.push({ name: str(d[p + k.name]), floor: str(d[p + k.floor]), suite: str(d[p + k.suite]),
                   cat: str(d[p + k.cat]), arrow: str(d[p + k.arrow]) });
      }
      return out;
    }
    function fromText() {
      return String(v.entries == null ? '' : v.entries).split(/\r?\n/).slice(0, MAX_ENTRIES).map(function (line) {
        var c = line.split('|');
        return { name: str(c[0]), floor: str(c[1]), suite: str(c[2]), cat: str(c[3]), arrow: str(c[4]) };
      });
    }
    var items = (fromSource() || fromText()).filter(function (it) { return it.name; });

    /* ---------- floors ---------- */
    var floorNames = {};
    String(v.floor_names == null ? '' : v.floor_names).split(/\r?\n/).forEach(function (line) {
      var i = line.indexOf('=');
      if (i < 1) return;
      var key = norm(line.slice(0, i)), name = str(line.slice(i + 1));
      if (key && name) floorNames[key] = name;
    });
    // A sortable height for a floor label, or null when it cannot be read ("Annex").
    function floorRank(f) {
      var s = norm(f);
      if (!s) return null;
      var m = /-?\d+(?:\.\d+)?/.exec(s);
      var n = m ? parseFloat(m[0]) : null;
      if (/^(lg|lower ground|ug|upper ground)\b/.test(s)) return /^(ug|upper)/.test(s) ? 0.25 : -0.5;
      if (/^(b|p|u|k|ll|sb)\s*-?\d*$/.test(s) || /basement|parking|underground|lower level|sous-sol|keller|s[o\u00f3]tano/.test(s)) {
        return n == null ? -1 : -Math.abs(n);
      }
      if (/^(g|gf|eg|rdc|pb|l?0)$/.test(s) || /ground|lobby|rez-de|erdgeschoss|planta baja/.test(s)) return 0;
      if (/^(m|mz|mezz)\b/.test(s) || /mezzanine/.test(s)) return 0.5;
      if (/^ph$/.test(s) || /penthouse|roof/.test(s)) return 1000 + (n || 0);
      return n;
    }
    function floorBadge(f) {
      if (f.length <= 3) return f.toUpperCase();
      var r = floorRank(f), m = /\d+/.exec(f);
      if (m) return (r != null && r < 0 ? 'B' : '') + m[0];
      return f.split(' ').filter(Boolean).slice(0, 3).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
    }
    function floorLabel(f) {
      var named = floorNames[norm(f)];
      if (named) return named;
      if (f.length <= 3 || /^-?\d+$/.test(f)) {
        // A typed word goes in front ("Etage 7"), or where {n} is ("{n}F"); empty: the built-in word.
        if (!floorWord) return T.floor.replace('{n}', f);
        return floorWord.indexOf('{n}') !== -1 ? floorWord.replace('{n}', f) : floorWord + ' ' + f;
      }
      return f;
    }

    /* ---------- grouping ---------- */
    var collator;
    try {
      collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
    } catch (e) {
      collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    }
    function byName(a, b) { return collator.compare(a.name, b.name); }
    function initial(name) {
      var s = name;
      if (s.normalize) s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      s = s.replace(/^[^0-9A-Za-z\u00c0-\uffff]+/, '');
      var c = s.charAt(0).toUpperCase();
      if (!c || /[0-9]/.test(c)) return '#';
      return c.toLowerCase() === c ? '#' : c;  // a letter has case; other symbols go under '#'
    }

    var groups = [];
    var byKey = {};
    items.forEach(function (it) {
      var key, label;
      if (mode === 'floor') { key = norm(it.floor); label = it.floor; }
      else if (mode === 'alpha') { key = initial(it.name); label = key; }
      else { key = norm(it.cat); label = it.cat; }
      if (!byKey[key]) { byKey[key] = { key: key, label: label, items: [], order: groups.length }; groups.push(byKey[key]); }
      byKey[key].items.push(it);
    });
    groups.forEach(function (g) { g.items.sort(byName); });
    if (mode === 'floor') {
      var dir = v.floor_order === 'asc' ? 1 : -1;
      groups.forEach(function (g) { g.rank = floorRank(g.label); });
      groups.sort(function (a, b) {
        if (a.rank == null || b.rank == null) return a.rank == null && b.rank == null ? a.order - b.order : (a.rank == null ? 1 : -1);
        return (a.rank - b.rank) * dir || a.order - b.order;
      });
    } else {
      groups.sort(function (a, b) {
        if (!a.key || !b.key) return a.key ? -1 : b.key ? 1 : 0;      // no category: last
        if (a.key === '#' || b.key === '#') return a.key === '#' ? 1 : -1;
        return collator.compare(a.label, b.label);
      });
    }
    var anyArrow = items.some(function (it) { return !!iconFor(it.arrow); });

    // A flat list the pager can cut anywhere: each entry knows its group and whether it opens it.
    var entries = [];
    groups.forEach(function (g) {
      g.items.forEach(function (it, i) { entries.push({ g: g, it: it, first: i === 0 }); });
    });

    function shape() {
      var W = window.innerWidth || 1, H = window.innerHeight || 1;
      var strip = W / H > 3.2;
      body.classList.toggle('strip', strip);
      body.classList.toggle('portrait', !strip && H > W);
      return strip;
    }

    if (!entries.length) {
      shape();
      window.addEventListener('resize', shape);
      var note = list.appendChild(el('div', 'empty-note'));
      var ic = note.appendChild(el('span', 'empty-icon'));
      ic.appendChild(svg([withStroke({ d: 'M4 21V5.5L12 3l8 2.5V21M2.5 21h19M8.5 8.5h2M13.5 8.5h2M8.5 12.5h2M13.5 12.5h2M10.5 21v-4.5h3V21' })]));
      note.appendChild(el('div', 'empty-text', str(v.empty_text) || T.empty));
      rail.hidden = true;
      return;
    }

    /* ---------- drawing ---------- */
    function isHere(g) { return mode === 'floor' && hereFloor && g.key === hereFloor; }
    function headingNode(g, cont) {
      var h;
      if (mode === 'alpha') {
        h = el('div', 'gh letter');
        h.appendChild(el('span', 'lt', g.label));
      } else if (mode === 'floor') {
        h = el('div', 'gh');
        if (g.label) {
          h.appendChild(el('span', 'badge', floorBadge(g.label)));
          h.appendChild(el('span', 'gl', floorLabel(g.label)));
        }
        if (isHere(g)) { var p = el('span', 'pin'); p.appendChild(pinIcon()); h.appendChild(p); }
      } else {
        h = el('div', 'gh');
        if (g.label) h.appendChild(el('span', 'gl', g.label));
      }
      if (cont) h.appendChild(el('span', 'cont', '\u2026'));
      return h;
    }
    function entryNode(it) {
      var n = el('div', 'ent');
      var nm = n.appendChild(el('div', 'nm'));
      nm.appendChild(el('div', 'name', it.name)).dir = 'auto';
      if (showCat && it.cat && mode !== 'category') nm.appendChild(el('div', 'cat', it.cat));
      var loc = el('div', 'loc');
      if (mode !== 'floor' && it.floor) loc.appendChild(el('span', 'fl', floorBadge(it.floor)));
      if (it.suite) loc.appendChild(el('span', 'suite', it.suite));
      if (loc.firstChild) n.appendChild(loc);
      if (anyArrow) {
        var icon = iconFor(it.arrow);
        var a = n.appendChild(el('span', icon ? 'arr' : 'arr blank'));
        if (icon) a.appendChild(icon);
      }
      return n;
    }
    // Render entries [a, b). A heading is kept with the entry under it. `grouped` keeps each whole
    // group in one column, which reads better whenever it still fits.
    var grouping = false;   // whether the list as drawn now keeps whole groups together
    function render(a, b, grouped) {
      list.textContent = '';
      grouping = !!grouped;
      var box = null;
      for (var i = a; i < b; i++) {
        var e = entries[i];
        var opens = i === a || e.first;
        if (grouped) {
          if (opens) { box = list.appendChild(el('div', 'grp')); box.appendChild(headingNode(e.g, !e.first)); }
          box.appendChild(entryNode(e.it));
        } else if (opens) {
          var keep = list.appendChild(el('div', 'keep'));
          keep.appendChild(headingNode(e.g, !e.first));
          keep.appendChild(entryNode(e.it));
        } else {
          list.appendChild(entryNode(e.it)).stG = e.g;
        }
      }
    }
    // A group that runs over a column break carries on at the top of the next column: give it its
    // heading again there, so no tenant ever stands in a column without its floor (or letter, or
    // category) above it. Breaks move with the size and column count, so this runs before every
    // measurement. Inserting a heading pushes the rest down, so it scans in order; balanced columns
    // can then shift, so headings that no longer sit at a column top are taken out again.
    function isBreak(node) {
      var prev = node.previousElementSibling;
      return !!prev && (node.offsetLeft > prev.offsetLeft + 2 || node.offsetTop < prev.offsetTop);
    }
    function unwrap(k) { var ent = k.lastChild; list.replaceChild(ent, k); return ent; }
    function markBreaks() {
      if (Number(list.style.columnCount) < 2) {
        var old = list.querySelectorAll('.keep.brk');
        for (var j = 0; j < old.length; j++) unwrap(old[j]);
        return;
      }
      for (var pass = 0; pass < 4; pass++) {
        var changed = false;
        var node = list.firstElementChild;
        while (node) {
          if (node.classList.contains('brk') && !isBreak(node)) { node = unwrap(node); changed = true; }
          if (node.stG && isBreak(node)) {
            var k = el('div', 'keep brk');
            list.replaceChild(k, node);
            k.appendChild(headingNode(node.stG, true));
            k.appendChild(node);
            node = k;
            changed = true;
          }
          node = node.nextElementSibling;
        }
        if (!changed) break;
      }
    }
    function overflows(strict) {
      if (!grouping) markBreaks();
      // An extra column shows up as a whole column of scroll width; a few pixels are only an edge
      // (balanced columns can poke out by a sub-column amount), so allow up to 1em.
      var em = parseFloat(list.style.fontSize) || 16;
      if (list.scrollWidth > list.clientWidth + em || list.scrollHeight > list.clientHeight + 1) return true;
      return strict ? namesWrap() : false;   // strict: every name also fits on one line
    }
    function namesWrap() {
      var px = parseFloat(list.style.fontSize) || 16;
      var names = list.querySelectorAll('.name');
      for (var i = 0; i < names.length; i++) if (names[i].offsetHeight > px * 1.8) return true;
      return false;
    }
    function setLayout(cols, px) {
      list.classList.remove('even');
      list.style.columnCount = String(cols);
      list.style.fontSize = px + 'px';
    }

    /* ---------- the index rail ---------- */
    var railSpans = {};
    function buildRail() {
      rail.textContent = '';
      railSpans = {};
      if (!showIndex || body.classList.contains('strip')) { rail.hidden = true; return; }
      rail.hidden = false;
      var keys = [];
      if (mode === 'alpha') {
        var latin = groups.every(function (g) { return /^[A-Z#]$/.test(g.key); });
        if (latin) { for (var c = 65; c <= 90; c++) keys.push(String.fromCharCode(c)); if (byKey['#']) keys.push('#'); }
        else keys = groups.map(function (g) { return g.key; });
      } else {
        keys = groups.filter(function (g) { return g.key; }).map(function (g) { return g.key; });
      }
      keys.forEach(function (k) {
        var g = byKey[k];
        var s = el('span', g ? 'has' : '');
        if (mode === 'floor') s.textContent = floorBadge(g.label);
        else if (mode === 'category') { s.className += ' word'; s.textContent = g.label; }
        else s.textContent = k;
        if (g && isHere(g)) { var p = el('span', 'pin'); p.appendChild(pinIcon()); s.insertBefore(p, s.firstChild); }
        rail.appendChild(s);
        railSpans[k] = s;
      });
      // An index that does not fit is left out rather than cut: one line of categories, or two of
      // letters or floors (portrait wraps them).
      var line = rail.firstChild ? rail.firstChild.offsetHeight : 0;
      var lines = mode === 'category' ? 1 : 2;
      if (rail.scrollWidth > rail.clientWidth + 1 || (line && rail.scrollHeight > line * (lines + 0.6))) {
        rail.textContent = ''; rail.hidden = true; railSpans = {};
      }
    }
    function lightRail(a, b) {
      var on = {};
      for (var i = a; i < b; i++) on[entries[i].g.key] = 1;
      // Paging: the groups on this page light up. One page: only the floor of this screen does.
      Object.keys(railSpans).forEach(function (k) {
        var lit = pages.length > 1 ? !!on[k] : !!(byKey[k] && isHere(byKey[k]));
        railSpans[k].classList.toggle('on', lit);
      });
    }

    /* ---------- fitting ---------- */
    var pages = [[0, entries.length]];
    var page = 0;
    var grouped = false;
    var timer = null;

    function layout() {
      list.classList.remove('hide');
      var W = window.innerWidth, H = window.innerHeight;
      var strip = shape();
      buildRail();
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (sw < 10 || sh < 10) return;
      var minPx, maxPx;
      if (strip) { minPx = Math.max(12, sh / 8); maxPx = Math.max(minPx, sh / 3.6); }
      else {
        minPx = Math.max(12, 0.021 * Math.min(W, H));
        maxPx = Math.max(minPx, Math.min(sh / 9, 0.044 * Math.min(H, W * 9 / 16)));
      }
      // A column needs room for about 16 ems (name, suite, arrow; 13 in a strip); the gap is 2.6em.
      var colEm = strip ? 13 : 16;
      function widest(cols) { return sw / (cols * colEm + (cols - 1) * 2.6); }

      // The largest size that fits with `cols` columns, or null when even the smallest does not.
      function fit(cols) {
        var hi = Math.min(maxPx, widest(cols));
        if (hi < minPx) return null;
        setLayout(cols, minPx);
        if (overflows()) return null;
        var strict = !overflows(true);
        var lo = minPx;
        // Names that wrap at the minimum may still fit on one line a touch smaller: prefer that.
        if (!strict) { setLayout(cols, minPx * 0.9); if (!overflows(true)) { strict = true; lo = minPx * 0.9; } }
        for (var k = 0; k < 14 && hi - lo > 0.25; k++) {
          var mid = (lo + hi) / 2;
          setLayout(cols, mid);
          if (overflows(strict)) hi = mid; else lo = mid;
        }
        var score = strict ? lo : lo * 0.85;
        if (sw / cols / lo > 34) score *= 0.8;   // very long lines read worse than another column
        return { px: lo, score: score };
      }
      function bestFor(g) {
        render(0, entries.length, g);
        var b = null;
        for (var cols = 1; cols <= 6; cols++) {
          if (widest(cols) < minPx) break;
          var f = fit(cols);
          if (f && (!b || f.score > b.score * 1.06)) b = { cols: cols, px: f.px, score: f.score, grouped: g };
        }
        return b;
      }
      var loose = bestFor(false);
      var whole = loose && groups.length > 1 ? bestFor(true) : null;
      var best = whole && whole.score >= loose.score * 0.86 ? whole : loose;

      if (best) {
        grouped = best.grouped;
        setLayout(best.cols, Math.floor(best.px * 4) / 4);
        // Share what fits between the columns evenly, unless balancing would push it over; balanced
        // columns are shorter, so grow the type into the room that frees up.
        if (best.cols > 1) {
          render(0, entries.length, grouped);
          var px0 = Math.floor(best.px * 4) / 4;
          setLayout(best.cols, px0);
          var oneLine = !overflows(true);   // keep names on one line if they already are
          var even = function (px) { setLayout(best.cols, px); list.classList.add('even'); return !overflows(oneLine); };
          if (oneLine && even(px0)) {
            var lo = px0, hi = Math.min(maxPx, widest(best.cols));
            for (var k = 0; k < 10 && hi - lo > 0.25; k++) { var mid = (lo + hi) / 2; if (even(mid)) lo = mid; else hi = mid; }
            even(Math.floor(lo * 4) / 4);
          } else if (!even(px0)) {
            setLayout(best.cols, px0);
          }
        }
        pages = [[0, entries.length]];
      } else {
        // Too long for one screen: the smallest readable size (the most per page, so the fewest
        // pages to wait through), as many columns as fit, then cut into pages.
        var px = minPx;
        var c = 1;
        while (c < 6 && widest(c + 1) >= px) c++;
        if (widest(c) < px) px = Math.max(12, widest(c));
        // Names read best on one line: the most columns where a size at most ~10% under the minimum
        // keeps every name on one line; if none does, one column.
        render(0, entries.length, false);
        for (var cc = c; cc >= 1; cc--) {
          var p = px;
          setLayout(cc, p);
          while (p > minPx * 0.9 && namesWrap()) setLayout(cc, p *= 0.96);
          if (!namesWrap() || cc === 1) { c = cc; px = cc === 1 && namesWrap() ? px : p; break; }
        }
        setLayout(c, px);
        grouped = false;
        pages = paginate();
        // As many pages are needed at the smallest size; now take the largest size that still needs
        // no more than that, so the pages are full rather than half empty.
        // Fewer, wider columns may allow a larger size for the same number of pages: try those too.
        if (pages.length > 1) {
          var need = pages.length, bestC = c, bestPx = px;
          for (var cc2 = c; cc2 >= Math.max(1, c - 2); cc2--) {
            var small = cc2 === c ? px : bestPx, big = Math.min(maxPx, widest(cc2));
            if (big <= small) continue;
            var ok = false;
            for (var t = 0; t < 8 && big - small > 0.5; t++) {
              var m = (small + big) / 2;
              setLayout(cc2, m);
              render(0, entries.length, false);
              if (!namesWrap() && paginate().length <= need) { small = m; ok = true; } else big = m;
            }
            if ((ok || cc2 === c) && small > bestPx) { bestPx = small; bestC = cc2; }
          }
          c = bestC;
          px = Math.floor(bestPx * 4) / 4;
          setLayout(c, px);
          pages = paginate();
        }
        // Share the entries evenly between that many pages (rather than full pages and a nearly
        // empty last one), as long as that needs no extra page.
        if (pages.length > 1) {
          var even2 = paginate(Math.ceil(entries.length / pages.length) + 1);
          if (even2.length === pages.length) pages = even2;
        }
      }
      page = Math.min(page, pages.length - 1);
      show();
      schedule();
    }

    // Cut the entries into pages that each fit the list box as it is now (and hold at most `cap`).
    function paginate(cap) {
      var out = [];
      var start = 0;
      while (start < entries.length) {
        var end = start + 1;
        while (end < entries.length && (!cap || end - start < cap)) {
          render(start, end + 1, false);
          if (overflows()) break;
          end++;
        }
        // Don't leave a heading alone at the foot of a page.
        if (end < entries.length && end - start > 1 && entries[end - 1].first) end--;
        out.push([start, end]);
        start = end;
      }
      return out;
    }

    function show() {
      render(pages[page][0], pages[page][1], pages.length > 1 ? false : grouped);
      // A page holds about its share of the list: spread it over every column.
      if (pages.length > 1 && Number(list.style.columnCount) > 1) {
        list.classList.add('even');
        if (overflows()) { list.classList.remove('even'); markBreaks(); }
      } else if (!grouping) {
        markBreaks();
      }

      lightRail(pages[page][0], pages[page][1]);
      pager.textContent = '';
      if (pages.length < 2) return;
      for (var i = 0; i < pages.length; i++) pager.appendChild(el('span', i === page ? 'on' : ''));
    }

    var seconds = Math.min(120, Math.max(5, Number(v.page_seconds) || 12));
    function schedule() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (pages.length < 2) return;
      timer = setTimeout(function () {
        list.classList.add('hide');
        timer = setTimeout(function () {
          page = (page + 1) % pages.length;
          show();
          list.classList.remove('hide');
          schedule();
        }, 700);
      }, seconds * 1000);
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 250);
    });

    // Measure with the real fonts, not the fallbacks: load the faces the list uses first, and measure
    // again if a face lands later (slow players can finish after fonts.ready).
    var f = document.fonts;
    if (f && f.load && window.Promise) {
      Promise.all([f.load('650 20px Inter'), f.load('400 20px Inter'), f.load('800 20px Archivo'), f.load('700 20px Archivo')])
        .then(layout, layout);
      if (f.addEventListener) f.addEventListener('loadingdone', function () {
        if (resizeT) clearTimeout(resizeT);
        resizeT = setTimeout(layout, 120);
      });
    } else {
      layout();
    }
  });
})();
