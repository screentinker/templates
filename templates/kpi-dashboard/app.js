/*
 * KPI dashboard — ScreenTinker community template. MIT.
 *
 * Reads window.ST only (the server injects the operator's values and, when a data source is bound,
 * its flat values in ST.data.data). Writes with textContent, fetches nothing, uses no eval.
 *
 * A table-shaped data source (Google Sheets, CSV, REST API returning a list, Manual table) arrives as
 * flat keys — row_count, row1_metric, row1_value, row1_target, … — where each column key is the
 * header lower-cased with non-alphanumerics turned into "_" (see the server's tabular.js).
 */
(function () {
  'use strict';

  var MAX = 12;
  // Metrics where going DOWN is the good direction, whatever "An increase is good" says.
  var LOWER_IS_BETTER = /\b(open|backlog|response|wait|queue|churn|cost|spend|error|errors|incident|incidents|bugs?|latency|downtime|defects?|complaints?)\b/i;
  var CURRENCY = /^[$€£¥₹₩₽¢]$|^(usd|eur|gbp|jpy|chf|aud|cad)$/i;

  function num(v, lo, hi, dflt) {
    var n = Number(v);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function str(v) { return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim(); }
  /* "1,234.5", "$1,234", "12%", "3,5" -> number, or null. */
  function parseNumber(s) {
    s = str(s).replace(/[\s$€£¥₹₩₽¢%]/g, '');
    if (!s) return null;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^[+-]?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  function decimals(s) {
    var m = /[.,](\d+)\s*%?$/.exec(str(s).replace(/[^\d.,%-]/g, ''));
    return m ? Math.min(2, m[1].length) : 0;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    if (v.good_color) root.style.setProperty('--good', v.good_color);
    if (v.bad_color) root.style.setProperty('--bad', v.bad_color);

    var locale = v.locale || undefined;
    var upIsGood = v.up_is_good !== false;
    var showTargets = v.show_targets !== false;
    var maxTiles = Math.round(num(v.max_tiles, 1, MAX, MAX));
    document.getElementById('title').textContent = str(v.title) || 'Key metrics';

    var nf = {};
    function fmt(n, dp) {
      var key = dp;
      if (!nf[key]) {
        try { nf[key] = new Intl.NumberFormat(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
        catch (e) { nf[key] = new Intl.NumberFormat(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
      }
      return nf[key].format(n);
    }
    var compactNf = null;
    function fmtValue(n, dp) {
      if (Math.abs(n) >= 1e6) {
        try {
          if (!compactNf) compactNf = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
          return compactNf.format(n);
        } catch (e) { /* notation unsupported: fall through */ }
      }
      return fmt(n, dp);
    }

    /* ---------- where the rows come from ---------- */
    function pick(d, i, names) {
      for (var k = 0; k < names.length; k++) {
        var key = 'row' + i + '_' + names[k];
        if (Object.prototype.hasOwnProperty.call(d, key)) return str(d[key]);
      }
      return '';
    }
    function fromSource() {
      var d = (ST.data && ST.data.data) || null;
      if (!d || typeof d !== 'object') return null;
      var n = Math.round(num(d.row_count, 0, 1000, 0));
      if (!n) return null;
      var rows = [];
      for (var i = 1; i <= n && rows.length < MAX; i++) {
        var metric = pick(d, i, ['metric', 'name', 'kpi', 'label', 'title']);
        var value = pick(d, i, ['value', 'actual', 'current', 'amount', 'total']);
        if (!metric && !value) continue;
        rows.push({
          metric: metric, value: value,
          target: pick(d, i, ['target', 'goal', 'budget', 'plan']),
          unit: pick(d, i, ['unit', 'units', 'suffix']),
          change: pick(d, i, ['change', 'delta', 'trend', 'diff', 'vs_last'])
        });
      }
      return rows.length ? { rows: rows, updated: str(d.updated) } : null;
    }
    function fromTyped() {
      var rows = [];
      String(v.metrics || '').split(/\r?\n/).forEach(function (line) {
        if (rows.length >= MAX || !line.trim()) return;
        var p = line.split('|').map(str);
        if (!p[0] && !p[1]) return;
        rows.push({ metric: p[0] || '', value: p[1] || '', target: p[2] || '', unit: p[3] || '', change: p[4] || '' });
      });
      return { rows: rows, updated: '' };
    }

    /* ---------- one tile ---------- */
    function affixed(text, unit) {
      var wrap = el('span', 'value');
      if (unit && CURRENCY.test(unit)) { wrap.appendChild(el('span', 'affix', unit)); wrap.appendChild(document.createTextNode(text)); }
      else {
        wrap.appendChild(document.createTextNode(text));
        if (unit) wrap.appendChild(el('span', 'affix', unit === '%' ? '%' : ' ' + unit));
      }
      return wrap;
    }
    function tile(r, index, compact) {
      var t = el('section', 'tile' + (compact ? ' compact' : ''));
      t.style.animationDelay = (index * 70) + 'ms';
      var head = el('div', 'head');
      head.appendChild(el('div', 'label', r.metric || '—'));
      var ch = str(r.change);
      if (ch) {
        var cn = parseNumber(ch.replace(/^\+/, ''));
        var sign = cn === null ? 0 : (cn > 0 ? 1 : (cn < 0 ? -1 : 0));
        var goodUp = LOWER_IS_BETTER.test(r.metric) ? !upIsGood : upIsGood;
        var cls = sign === 0 ? '' : ((sign > 0) === goodUp ? ' good' : ' bad');
        var chip = el('span', 'change' + cls);
        chip.appendChild(el('span', 'arrow', sign > 0 ? '▲' : (sign < 0 ? '▼' : '■')));
        chip.appendChild(el('span', '', ch.replace(/^[+-]/, '')));
        head.appendChild(chip);
      }
      t.appendChild(head);

      var row = el('div', 'value-row');
      var n = parseNumber(r.value);
      var shown = n === null ? (r.value || '—') : fmtValue(n, decimals(r.value));
      row.appendChild(affixed(shown, r.unit));
      t.appendChild(row);

      var target = parseNumber(r.target);
      if (showTargets && target !== null && target !== 0 && n !== null) {
        var ratio = n / target;
        var hit = ratio >= 1;
        var p = el('div', 'progress');
        var track = el('div', 'track');
        var fill = el('div', 'fill' + (hit ? ' hit' : ''));
        track.appendChild(fill);
        p.appendChild(track);
        var label = el('div', 'target' + (hit ? ' hit' : ''));
        label.appendChild(el('b', '', fmt(Math.round(ratio * 100), 0) + '%'));
        label.appendChild(document.createTextNode(' of ' + fmtValue(target, decimals(r.target)) + (r.unit && !CURRENCY.test(r.unit) && r.unit !== '%' ? ' ' + r.unit : (r.unit === '%' ? '%' : '')) + ' target'));
        p.appendChild(label);
        t.appendChild(p);
        fill.style.width = Math.max(2, Math.min(100, ratio * 100)) + '%';
        fill.style.animationDelay = (150 + index * 70) + 'ms';
      } else {
        // Same height as a progress block, so values line up across tiles.
        var ph = el('div', 'progress placeholder');
        ph.appendChild(el('div', 'track'));
        ph.appendChild(el('div', 'target', ' '));
        t.appendChild(ph);
      }
      return t;
    }

    /* ---------- layout: the grid shape that gives the biggest, least squashed tiles ---------- */
    var grid = document.getElementById('grid');
    function layout(count) {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var strip = w / h > 3;
      document.body.classList.toggle('strip', strip);
      var gw = grid.clientWidth || w, gh = grid.clientHeight || h;
      var gap = Math.min(w, h) * 0.022;
      var best = null;
      for (var cols = 1; cols <= count; cols++) {
        var rows = Math.ceil(count / cols);
        var tw = (gw - gap * (cols - 1)) / cols, th = (gh - gap * (rows - 1)) / rows;
        if (tw <= 0 || th <= 0) continue;
        var aspect = tw / th;
        // Prefer tiles around 1.7:1; penalise empty cells a little.
        var score = Math.min(tw, th * 1.7) * (1 - 0.08 * (cols * rows - count)) / (aspect > 3.2 ? aspect / 3.2 : 1);
        if (!best || score > best.score) best = { cols: cols, rows: rows, tw: tw, th: th, score: score };
      }
      if (!best) best = { cols: 1, rows: count, tw: gw, th: gh / count };
      grid.style.gridTemplateColumns = 'repeat(' + best.cols + ', minmax(0, 1fr))';
      grid.style.gridTemplateRows = 'repeat(' + best.rows + ', minmax(0, 1fr))';
      root.style.setProperty('--tile-w', Math.round(best.tw) + 'px');
      root.style.setProperty('--tile-h', Math.round(best.th) + 'px');
      return best.tw / best.th > 3.4 || best.th < h * 0.14;
    }

    var updatedEl = document.getElementById('updated');
    var tf;
    try { tf = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: v.timezone || undefined }); }
    catch (e) { tf = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }); }

    var lastKey = '';
    function render(force) {
      var src = fromSource() || fromTyped();
      var rows = src.rows.slice(0, maxTiles);
      var key = JSON.stringify(rows) + '|' + (window.innerWidth + 'x' + window.innerHeight);
      var when = src.updated ? new Date(src.updated) : new Date();
      if (isNaN(when.getTime())) when = new Date();
      updatedEl.textContent = 'Updated ' + tf.format(when);
      if (!force && key === lastKey) return;
      lastKey = key;

      var empty = document.getElementById('empty');
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      if (!rows.length) {
        empty.textContent = 'Add metrics in the template settings (Metric | Value | Target | Unit | Change), or connect a table data source.';
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      var compact = layout(rows.length);
      rows.forEach(function (r, i) { grid.appendChild(tile(r, i, compact)); });
      fitValues();
    }

    /* Shrink any value wider than its tile (long numbers, text values) so nothing is clipped. */
    function fitValues() {
      var vals = grid.querySelectorAll('.value');
      for (var i = 0; i < vals.length; i++) {
        var vEl = vals[i];
        vEl.style.fontSize = '';
        var avail = vEl.parentNode.clientWidth;
        var need = vEl.scrollWidth;
        if (avail > 0 && need > avail) {
          var size = parseFloat(window.getComputedStyle(vEl).fontSize) || 0;
          if (size) vEl.style.fontSize = Math.floor(size * avail / need * 0.98) + 'px';
        }
      }
    }
    // The bundled font is inlined, but may still finish decoding after the first layout.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitValues);

    render(true);
    // Data sources sync on the server; re-read what the page was given once a minute (cheap, bounded:
    // the grid is rebuilt only when something changed).
    setInterval(function () { render(false); }, 60000);
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { render(true); }, 200);
    });
  });
})();
