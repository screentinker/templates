/* Leaderboard — ScreenTinker community template. MIT.
   Reads names and scores from a table data source when one is connected, otherwise from the typed
   lines, ranks them, and shows the top three on a podium and the rest as rows with bars. */
(function () {
  'use strict';

  var MAX_READ = 100;

  function str(x) { return x == null ? '' : String(x).trim(); }

  // The same key the server gives a column (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  // "48,250", "$1,200.50", "12.5 km", "1.234,5" → a number; anything else → null.
  function toNumber(raw) {
    var s = str(raw);
    if (!/\d/.test(s)) return null;
    var neg = /^[^\d]*-/.test(s);
    var n = s.replace(/[^\d.,]/g, '');
    var dot = n.lastIndexOf('.'), comma = n.lastIndexOf(',');
    if (dot > -1 && comma > -1) {
      // Both: whichever comes last is the decimal point.
      n = comma > dot ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
    } else if (comma > -1) {
      n = /^\d{1,3}(,\d{3})+$/.test(n) ? n.replace(/,/g, '') : n.replace(/,/g, '.');
    }
    if ((n.match(/\./g) || []).length > 1) return null;
    var f = parseFloat(n);
    if (!isFinite(f)) return null;
    return neg ? -f : f;
  }
  // Decimal places the score was given with, at most 2 ("12.5" → 1).
  function placesOf(raw) {
    var m = /[.,](\d{1,2})\D*$/.exec(str(raw));
    return m && !/^\d{1,3}(,\d{3})+$/.test(str(raw).replace(/[^\d,]/g, '')) ? m[1].length : 0;
  }

  function initials(name) {
    var words = str(name).split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    var first = Array.from ? Array.from(words[0])[0] : words[0].charAt(0);
    var last = words.length > 1 ? (Array.from ? Array.from(words[words.length - 1])[0] : words[words.length - 1].charAt(0)) : '';
    return (first + last).toUpperCase();
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var board = document.getElementById('board');
    var podium = document.getElementById('podium');
    var list = document.getElementById('list');

    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    body.setAttribute('data-font', str(v.font) || 'archivo');

    document.getElementById('title').textContent = str(v.title);
    document.getElementById('period').textContent = str(v.period);
    if (v.logo) {
      var logo = document.getElementById('logo');
      logo.src = v.logo;
      logo.hidden = false;
    }

    var prefix = str(v.score_prefix);
    var suffix = str(v.score_suffix);
    var lowWins = v.order === 'low';
    var showBars = !(v.show_bars === false || v.show_bars === 'false');
    var maxRows = Math.min(20, Math.max(3, Math.round(Number(v.max_rows) || 10)));

    /* ---------- read ---------- */
    function fromSource() {
      var d = ST.data && ST.data.scores;
      if (!d || typeof d !== 'object') return null;
      var kn = slug(v.name_col || 'Name'), ks = slug(v.score_col || 'Score'), kt = slug(v.sub_col || 'Team');
      if (!kn || !ks || d['row1_' + kn] === undefined || d['row1_' + ks] === undefined) return null;
      var out = [];
      for (var i = 1; i <= MAX_READ; i++) {
        var p = 'row' + i + '_';
        if (d[p + kn] === undefined) break;
        out.push({ name: str(d[p + kn]), raw: str(d[p + ks]), sub: str(d[p + kt]) });
      }
      return out;
    }
    function fromText() {
      return str(v.entries).split(/\r?\n/).slice(0, MAX_READ).map(function (line) {
        var c = line.split('|');
        return { name: str(c[0]), raw: str(c[1]), sub: str(c[2]) };
      });
    }
    var people = (fromSource() || fromText()).filter(function (p) { return p.name; });

    var places = 0;
    people.forEach(function (p, i) {
      p.i = i;
      p.score = toNumber(p.raw);
      if (p.score != null) places = Math.max(places, placesOf(p.raw));
    });
    // Best first; a row without a number goes to the bottom; ties keep their typed order.
    people.sort(function (a, b) {
      if (a.score == null || b.score == null) return a.score == null ? (b.score == null ? a.i - b.i : 1) : -1;
      if (a.score !== b.score) return lowWins ? a.score - b.score : b.score - a.score;
      return a.i - b.i;
    });
    // Equal scores share a rank (1, 2, 2, 4).
    people.forEach(function (p, i) {
      var prev = people[i - 1];
      p.rank = prev && p.score != null && prev.score === p.score ? prev.rank : i + 1;
    });
    people = people.slice(0, maxRows);

    function formatScore(p) {
      if (p.score == null) return p.raw || '—';
      var t;
      try {
        t = p.score.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
      } catch (e) {
        t = p.score.toFixed(places);
      }
      var neg = t.charAt(0) === '-';
      if (neg) t = t.slice(1);
      return (neg ? '-' : '') + prefix + t + (suffix ? (/^[%°]/.test(suffix) ? '' : ' ') + suffix : '');
    }
    var lead = people.length && people[0].score != null ? people[0].score : null;
    function ratio(p) {
      if (p.score == null || lead == null) return 0;
      var r;
      if (lowWins) r = p.score > 0 ? lead / p.score : 0;
      else r = lead > 0 ? p.score / lead : 0;
      return Math.max(0.02, Math.min(1, r));
    }

    /* ---------- build ---------- */
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }
    function crown() {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 18');
      svg.setAttribute('class', 'crown');
      svg.setAttribute('aria-hidden', 'true');
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M1.5 16.5 3 4.5l5.2 5L12 1.5l3.8 8L21 4.5l1.5 12z');
      svg.appendChild(path);
      return svg;
    }

    if (!people.length) {
      board.classList.add('solo');
      podium.appendChild(el('div', 'empty-note', 'No scores yet.'));
      return;
    }

    var top = people.slice(0, 3);
    var rest = people.slice(3);
    if (!rest.length) board.classList.add('solo');

    top.forEach(function (p, i) {
      // Places are styled by position; a shared first place still stands on the tallest step only once.
      var place = el('div', 'place p' + (i + 1));
      place.style.setProperty('--d', (0.15 + [0.5, 0.25, 0.7][i]) + 's');
      var who = place.appendChild(el('div', 'who'));
      var av = who.appendChild(el('div', 'avatar', initials(p.name)));
      if (i === 0) av.appendChild(crown());
      who.appendChild(el('div', 'pname', p.name));
      who.appendChild(el('div', 'psub', p.sub));
      who.appendChild(el('div', 'pscore', formatScore(p)));
      var plinth = place.appendChild(el('div', 'plinth'));
      plinth.appendChild(el('span', '', String(p.rank)));
      podium.appendChild(place);
    });

    var rowEls = rest.map(function (p, i) {
      var row = el('div', 'row');
      row.style.setProperty('--d', (0.9 + i * 0.07) + 's');
      row.appendChild(el('div', 'rank', String(p.rank)));
      var info = row.appendChild(el('div', 'info'));
      var line = info.appendChild(el('div', 'line'));
      line.appendChild(el('span', 'rname', p.name));
      line.appendChild(el('span', 'rsub', p.sub));
      if (showBars) {
        var bar = info.appendChild(el('div', 'bar'));
        bar.appendChild(el('i')).style.setProperty('--w', ratio(p).toFixed(4));
      }
      row.appendChild(el('div', 'rscore', formatScore(p)));
      list.appendChild(row);
      return row;
    });

    /* ---------- size ---------- */
    function layout() {
      var W = window.innerWidth, H = window.innerHeight;
      var strip = W / H > 3.2;
      body.classList.toggle('strip', strip);
      body.classList.toggle('portrait', !strip && H > W * 1.05);
      var u = Math.min(H / 100, W * 0.009);

      // Rows: as tall as the list allows, up to a comfortable maximum; drop the ones that can't fit.
      if (rowEls.length) {
        var lh = list.clientHeight;
        var minRow = Math.max(26, u * (strip ? 7 : 4.6));
        var fits = Math.max(1, Math.min(rowEls.length, Math.floor(lh / minRow)));
        var h = Math.min(lh / fits, u * (strip ? 16 : body.classList.contains('portrait') ? 13 : 10));
        rowEls.forEach(function (r, i) {
          r.style.display = i < fits ? '' : 'none';
          r.style.height = h + 'px';
        });
        list.style.fontSize = (h * (showBars ? 0.36 : 0.42)) + 'px';
      }

      // Podium: start from what the box allows, then shrink until nothing spills.
      var pw = podium.clientWidth, ph = podium.clientHeight;
      // A long name may shrink the podium a little, then it is cut with an ellipsis instead.
      var fs = Math.min(pw / 25, ph * (strip ? 0.11 : 0.058), u * 3.6);
      var floor = fs * 0.7;
      for (var k = 0; k < 30; k++) {
        podium.style.fontSize = fs + 'px';
        if (!boxSpills() && (fs < floor || !textSpills())) break;
        fs *= 0.95;
      }
    }
    // Measured from layout boxes, not scroll sizes: the entrance animation moves things with
    // transforms, which would otherwise count as overflow while it runs.
    function boxSpills() {
      var ps = podium.querySelectorAll('.place');
      for (var i = 0; i < ps.length; i++) {
        var who = ps[i].firstChild, plinth = ps[i].lastChild;
        var need = who.offsetHeight + (plinth.offsetParent ? plinth.offsetHeight : 0);
        if (need > podium.clientHeight + 1) return true;
      }
      return false;
    }
    function textSpills() {
      var names = podium.querySelectorAll('.pname, .pscore');
      for (var i = 0; i < names.length; i++) if (names[i].scrollWidth > names[i].clientWidth + 1) return true;
      return false;
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 250);
    });
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, function () {});
  });
})();
