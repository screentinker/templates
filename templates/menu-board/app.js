/* Menu board — ScreenTinker community template. MIT.
   Reads the menu from a table data source when one is connected (Google Sheet, CSV, Manual table…),
   otherwise from the typed-in lines, groups it by category and sizes it to fill the screen.
   When the menu cannot fit at a readable size it is split into pages that rotate. */
(function () {
  'use strict';

  var MAX_ITEMS = 100;
  var SOLD_OUT = { sold_out: 1, soldout: 1, sold: 1, unavailable: 1, out_of_stock: 1 };

  function str(x) { return x == null ? '' : String(x).trim(); }

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
    var menuEl = document.getElementById('menu');
    var stage = document.getElementById('stage');
    var pager = document.getElementById('pager');

    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    body.setAttribute('data-font', str(v.font) || 'bitter');

    document.getElementById('title').textContent = str(v.title);
    document.getElementById('subtitle').textContent = str(v.subtitle);
    document.getElementById('footer').textContent = str(v.footer);
    if (v.logo) {
      var logo = document.getElementById('logo');
      logo.src = v.logo;
      logo.hidden = false;
    }

    /* ---------- prices ---------- */
    var currency = str(v.currency);
    var after = v.currency_position === 'after';
    var decimals = str(v.decimals) || '2';
    var comma = v.decimal_comma === true || v.decimal_comma === 'true';

    // A single number, perhaps with a currency sign around it: "3.50", "$3.50", "3,50 €", "1,250".
    function toNumber(s) {
      if (!/^[^\d\-]*-?[\d.,\s]*\d[^\d]*$/.test(s)) return null;
      var n = s.replace(/[^\d.,\-]/g, '');
      if (/,\d{1,2}$/.test(n) && n.indexOf('.') === -1) n = n.replace(',', '.');
      else n = n.replace(/,/g, '');
      var f = parseFloat(n);
      return isFinite(f) ? f : null;
    }
    function formatPrice(raw) {
      var s = str(raw);
      if (!s) return '';
      var n = toNumber(s);
      if (n == null) return s;                       // "Market price", "3.50 / 4.20": shown as typed
      var t;
      if (decimals === '0') t = String(Math.round(n));
      else if (decimals === 'auto') t = String(Math.round(n * 100) / 100);
      else t = n.toFixed(2);
      if (comma) t = t.replace('.', ',');
      if (!currency) return t;
      return after ? t + ' ' + currency : currency + t;
    }

    /* ---------- the menu itself ---------- */
    function fromSource() {
      var d = ST.data && ST.data.menu;
      if (!d || typeof d !== 'object') return null;
      var k = {
        item: slug(v.item_col || 'Item'), price: slug(v.price_col || 'Price'),
        desc: slug(v.desc_col || 'Description'), cat: slug(v.category_col || 'Category'), tag: slug(v.tag_col || 'Tag'),
      };
      if (!k.item || d['row1_' + k.item] === undefined) return null;
      var out = [];
      for (var i = 1; i <= MAX_ITEMS; i++) {
        var p = 'row' + i + '_';
        if (d[p + k.item] === undefined) break;
        out.push({ name: str(d[p + k.item]), price: str(d[p + k.price]), desc: str(d[p + k.desc]),
                   cat: str(d[p + k.cat]), tag: str(d[p + k.tag]) });
      }
      return out;
    }
    function fromText() {
      return str(v.items).split(/\r?\n/).slice(0, MAX_ITEMS).map(function (line) {
        var c = line.split('|');
        return { name: str(c[0]), price: str(c[1]), desc: str(c[2]), cat: str(c[3]), tag: str(c[4]) };
      });
    }
    var items = (fromSource() || fromText()).filter(function (it) { return it.name; });

    // Categories in the order they first appear; items keep their order within each.
    var groups = [];
    var byCat = {};
    items.forEach(function (it) {
      var key = it.cat.toLowerCase();
      if (!byCat[key]) { byCat[key] = { name: it.cat, items: [] }; groups.push(byCat[key]); }
      byCat[key].items.push(it);
    });
    // A flat list the pager can cut anywhere: each entry knows its category and whether it opens it.
    var entries = [];
    groups.forEach(function (g) {
      g.items.forEach(function (it, i) { entries.push({ g: g, it: it, first: i === 0 }); });
    });

    if (!entries.length) {
      var note = document.createElement('div');
      note.className = 'empty-note';
      note.textContent = 'The menu is empty.';
      menuEl.appendChild(note);
      return;
    }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }
    function itemNode(it) {
      var sold = !!SOLD_OUT[slug(it.tag)];
      var n = el('div', sold ? 'it soldout' : 'it');
      var row = el('div', 'row');
      var name = row.appendChild(el('span', 'name', it.name));
      // The pill sits inside the name so it follows the last word if a long name wraps.
      if (it.tag) { name.appendChild(document.createTextNode(' ')); name.appendChild(el('span', 'pill', it.tag)); }
      var price = formatPrice(it.price);
      if (price) {
        row.appendChild(el('span', 'lead'));
        row.appendChild(el('span', 'price', price));
      }
      n.appendChild(row);
      if (it.desc) n.appendChild(el('div', 'desc', it.desc));
      return n;
    }
    function headingNode(g, cont) {
      var h = el('div', 'cat', g.name);
      if (cont) h.appendChild(el('span', 'cont', 'cont.'));
      return h;
    }
    // Render entries [a, b) into the menu. A heading is kept with the item under it. `grouped` keeps
    // each whole category in one column, which reads better whenever it still fits.
    function render(a, b, grouped) {
      menuEl.textContent = '';
      if (grouped) {
        var box = null;
        for (var j = a; j < b; j++) {
          if (j === a || entries[j].first) {
            box = menuEl.appendChild(el('div', 'grp'));
            if (entries[j].g.name) box.appendChild(headingNode(entries[j].g, j === a && !entries[j].first));
          }
          box.appendChild(itemNode(entries[j].it));
        }
        return;
      }
      for (var i = a; i < b; i++) {
        var e = entries[i];
        var node = itemNode(e.it);
        var opens = i === a || e.first;
        if (opens && e.g.name) {
          var keep = el('div', 'keep');
          keep.appendChild(headingNode(e.g, i === a && !e.first));
          keep.appendChild(node);
          menuEl.appendChild(keep);
        } else {
          menuEl.appendChild(node);
        }
      }
    }
    function overflows(strict) {
      if (menuEl.scrollWidth > menuEl.clientWidth + 1 || menuEl.scrollHeight > menuEl.clientHeight + 1) return true;
      if (!strict) return false;
      // Strict: every name must also fit on one line.
      var px = parseFloat(menuEl.style.fontSize) || 16;
      var names = menuEl.querySelectorAll('.name');
      for (var i = 0; i < names.length; i++) if (names[i].offsetHeight > px * 1.8) return true;
      return false;
    }
    function setLayout(cols, px) {
      menuEl.classList.remove('even');
      menuEl.style.columnCount = String(cols);
      menuEl.style.fontSize = px + 'px';
    }

    /* ---------- fitting ---------- */
    var pages = [[0, entries.length]];
    var page = 0;
    var grouped = false;
    var timer = null;

    function layout() {
      var W = window.innerWidth, H = window.innerHeight;
      body.classList.toggle('strip', W / H > 3.2);
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (sw < 10 || sh < 10) return;
      var minPx = Math.max(12, 0.021 * Math.min(W, H));
      var maxPx = Math.max(minPx, Math.min(sh / 9, 0.046 * Math.min(H, W * 9 / 16)));
      // A column needs room for about 15 ems of text; the gap between columns is 3.2em.
      function widest(cols) { return sw / (cols * 15 + (cols - 1) * 3.2); }

      // The largest size that fits with `cols` columns, or 0 when even the smallest does not.
      // `score` ranks layouts: one that makes a name wrap counts as a size 15% smaller.
      // (A short menu may stop at maxPx in several column counts; the first wins.)
      function fit(cols) {
        var hi = Math.min(maxPx, widest(cols));
        if (hi < minPx) return null;
        setLayout(cols, minPx);
        if (overflows()) return null;
        // Prefer sizes where no name has to wrap; accept wrapping only when nothing else fits.
        var strict = !overflows(true);
        var lo = minPx;
        for (var k = 0; k < 14 && hi - lo > 0.25; k++) {
          var mid = (lo + hi) / 2;
          setLayout(cols, mid);
          if (overflows(strict)) hi = mid; else lo = mid;
        }
        var score = strict ? lo : lo * 0.85;
        // Very long lines (a short menu in one wide column) read worse than two columns.
        if (sw / cols / lo > 36) score *= 0.8;
        return { px: lo, score: score };
      }
      function bestFor(grouped) {
        render(0, entries.length, grouped);
        var b = null;
        for (var cols = 1; cols <= 5; cols++) {
          if (widest(cols) < minPx) break;
          var f = fit(cols);
          // One more column must buy a clearly bigger size to be worth the narrower lines.
          if (f && (!b || f.score > b.score * 1.06)) b = { cols: cols, px: f.px, score: f.score, grouped: grouped };
        }
        return b;
      }
      var loose = bestFor(false);
      var whole = loose && groups.length > 1 ? bestFor(true) : null;
      var best = whole && whole.score >= loose.score * 0.86 ? whole : loose;

      if (best) {
        grouped = best.grouped;
        setLayout(best.cols, Math.floor(best.px * 4) / 4);
        if (best.cols > 1 && best.px > maxPx - 0.5) menuEl.classList.add('even');
        pages = [[0, entries.length]];
      } else {
        // Too long for one screen: a comfortable size, as many columns as fit, then cut into pages.
        var px = Math.max(minPx, Math.min(maxPx, sh / 26));
        var c = 1;
        while (c < 5 && widest(c + 1) >= px) c++;
        if (widest(c) < px) px = Math.max(12, widest(c));
        setLayout(c, px);
        grouped = false;
        pages = [];
        var start = 0;
        while (start < entries.length) {
          var end = start + 1;
          while (end < entries.length) {
            render(start, end + 1);
            if (overflows()) break;
            end++;
          }
          // Don't leave a category heading alone at the foot of a page.
          if (end < entries.length && end - start > 1 && entries[end - 1].first && entries[end - 1].g.name) end--;
          pages.push([start, end]);
          start = end;
        }
      }
      page = Math.min(page, pages.length - 1);
      render(pages[page][0], pages[page][1], grouped);
      drawPager();
      schedule();
    }

    function drawPager() {
      pager.textContent = '';
      if (pages.length < 2) return;
      for (var i = 0; i < pages.length; i++) pager.appendChild(el('span', i === page ? 'on' : ''));
    }

    var seconds = Math.min(120, Math.max(5, Number(v.page_seconds) || 12));
    function schedule() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (pages.length < 2) return;
      timer = setTimeout(function () {
        menuEl.classList.add('hide');
        timer = setTimeout(function () {
          page = (page + 1) % pages.length;
          render(pages[page][0], pages[page][1]);
          drawPager();
          menuEl.classList.remove('hide');
          schedule();
        }, 700);
      }, seconds * 1000);
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 250);
    });

    // Measure with the real fonts, not the fallbacks.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout, layout);
    else layout();
  });
})();
