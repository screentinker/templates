/*
 * News ticker — ScreenTinker community template. MIT.
 *
 * Everything this reads comes from window.ST (the server injects the operator's values). It writes
 * with textContent only, fetches nothing, and uses no eval — the catalog's review rules.
 *
 * Headlines come from, in order:
 *   1. a bound data source (ST.data.feed), a snapshot the server takes at render time and refreshes
 *      by re-rendering the page when the source syncs:
 *        - RSS / Atom (server rss-resolver): item{n}_title, 1-based; headlines_text as a fallback;
 *        - a table (Google Sheets, CSV, Manual table — server tabular.js): row{n}_<column key>, where
 *          the column is the one named by the "column" setting, else the first column;
 *   2. the typed "headlines" textarea, one per line (also used while the source has nothing).
 *
 * Layouts, from the zone's shape: landscape (featured headline + horizontal ticker bar), portrait
 * (featured headline + a vertical ticker below it), side (a tall, narrow zone: the vertical ticker
 * only) and strip (wider than ~3:1: the horizontal ticker bar only).
 */
(function () {
  'use strict';

  function num(v, lo, hi, dflt) {
    var n = Number(v);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }

  /* Built-in words, picked by the primary subtag of the "locale" setting (empty = the screen's
     language), falling back to English. Everything else on screen is the operator's text or Intl. */
  var STRINGS = {
    en: {
      news: 'News',
      empty: 'Add headlines in the template settings, one per line, or connect a data source.'
    },
    de: {
      news: 'Nachrichten',
      empty: 'Schlagzeilen in den Vorlageneinstellungen eintragen (eine pro Zeile) oder eine Datenquelle verbinden.'
    },
    es: {
      news: 'Noticias',
      empty: 'Añade titulares en los ajustes de la plantilla, uno por línea, o conecta una fuente de datos.'
    },
    fr: {
      news: 'Actualités',
      empty: 'Ajoutez des titres dans les réglages du modèle, un par ligne, ou connectez une source de données.'
    },
    hi: {
      news: 'समाचार',
      empty: 'टेम्पलेट सेटिंग में सुर्खियाँ जोड़ें, हर पंक्ति में एक, या कोई डेटा स्रोत जोड़ें।'
    },
    it: {
      news: 'Notizie',
      empty: 'Aggiungi i titoli nelle impostazioni del modello, uno per riga, o collega una fonte dati.'
    },
    ja: {
      news: 'ニュース',
      empty: 'テンプレート設定で見出しを1行に1つずつ入力するか、データソースを接続してください。'
    },
    nl: {
      news: 'Nieuws',
      empty: 'Voeg koppen toe in de sjablooninstellingen, één per regel, of koppel een gegevensbron.'
    },
    pt: {
      news: 'Notícias',
      empty: 'Adicione manchetes nas configurações do modelo, uma por linha, ou conecte uma fonte de dados.'
    },
    zh: {
      news: '新闻',
      empty: '请在模板设置中添加标题（每行一条），或连接数据源。'
    }
  };
  /* A usable BCP-47 tag: the setting if Intl accepts it, else the screen's language. */
  function pickLocale(tag) {
    var t = String(tag || '').trim();
    if (t) {
      try { if (Intl.DateTimeFormat.supportedLocalesOf([t]).length) return t; } catch (e) { /* invalid tag */ }
    }
    return (typeof navigator !== 'undefined' && navigator.language) || 'en';
  }
  function wordsFor(tag) {
    var lang = String(tag).toLowerCase().split(/[-_]/)[0];
    return STRINGS[lang] || STRINGS.en;
  }
  /* One line of plain text: feeds sometimes leave tags or entities' worth of spacing in titles. */
  function clean(s) {
    return s === null || s === undefined ? '' : String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  /* The key the server gives a column header (server/lib/data-sources/tabular.js slugKey). */
  function slug(s) {
    var k = String(s === null || s === undefined ? '' : s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    // Colours are validated as #hex by the server before they get here.
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.text_color) root.style.setProperty('--text', v.text_color);

    var locale = pickLocale(v.locale);
    // The words follow the setting even where this engine's Intl lacks that language's data.
    var lang = String(v.locale || '').trim() || locale;
    var words = wordsFor(lang);
    root.setAttribute('lang', lang);
    var nf2 = null;
    try { nf2 = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }); } catch (e) { nf2 = null; }
    function pad2(n) { return nf2 ? nf2.format(n) : (n < 10 ? '0' : '') + n; }

    var title = String(v.title || '').trim() || words.news;
    document.getElementById('title').textContent = title;
    document.getElementById('label').textContent = title;

    var max = Math.round(num(v.max_items, 1, 30, 12));

    /* ---------- headlines ---------- */
    function fromSource() {
      var d = ST.data && ST.data.feed;
      if (!d || typeof d !== 'object') return [];
      var out = [], i, t;
      if (d.item_count !== undefined || d.item1_title !== undefined) {
        // RSS / Atom. Stops at the first missing item: the page receives a bounded number of keys.
        for (i = 1; i <= 100 && out.length < max; i++) {
          if (d['item' + i + '_title'] === undefined) break;
          t = clean(d['item' + i + '_title']);
          if (t) out.push(t);
        }
        if (!out.length && d.headlines_text) {
          String(d.headlines_text).split(/\r?\n/).forEach(function (s) {
            s = clean(s);
            if (s && out.length < max) out.push(s);
          });
        }
        return out;
      }
      if (d.row_count !== undefined) {
        // A table. The chosen column if it exists, else the first column (the first row1_ key).
        var col = slug(v.column);
        if (!col || d['row1_' + col] === undefined) {
          col = '';
          for (var k in d) {
            if (Object.prototype.hasOwnProperty.call(d, k) && k.indexOf('row1_') === 0) { col = k.slice(5); break; }
          }
        }
        if (!col) return [];
        var rows = Math.round(num(d.row_count, 0, 1000, 0));
        for (i = 1; i <= rows && out.length < max; i++) {
          if (d['row' + i + '_' + col] === undefined) break;
          t = clean(d['row' + i + '_' + col]);
          if (t) out.push(t);
        }
      }
      return out;
    }
    function fromTyped() {
      return String(v.headlines || '').split(/\r?\n/)
        .map(clean)
        .filter(function (s) { return s.length > 0; })
        .slice(0, max);
    }
    var items = fromSource();
    if (!items.length) items = fromTyped();
    if (!items.length) {
      body.classList.add('empty');
      items = [words.empty];
    }

    /* ---------- layout mode, from the zone's shape ---------- */
    var MODES = ['strip', 'portrait', 'side'];
    function mode() {
      var w = window.innerWidth || 1, h = window.innerHeight || 1, r = w / h, m = '';
      if (r > 3.2) m = 'strip';
      else if (r < 0.42) m = 'side';
      else if (r < 0.95) m = 'portrait';
      MODES.forEach(function (c) { body.classList.toggle(c, c === m); });
      // portrait and side both run the ticker vertically
      body.classList.toggle('vertical', m === 'portrait' || m === 'side');
    }
    function vertical() { return body.classList.contains('vertical'); }
    mode();

    /* ---------- clock ---------- */
    var showClock = v.show_clock !== false;
    if (!showClock) body.classList.add('hide-clock');
    var clockEl = document.getElementById('clock');
    var dateEl = document.getElementById('date');
    function fmt(opts) {
      var o = {};
      for (var k in opts) o[k] = opts[k];
      if (v.timezone) o.timeZone = v.timezone;
      try { return new Intl.DateTimeFormat(locale, o); } catch (e) {
        delete o.timeZone;
        try { return new Intl.DateTimeFormat(undefined, o); } catch (e2) { return null; }
      }
    }
    var tf = fmt({ hour: '2-digit', minute: '2-digit' });
    var df = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
    function tick() {
      var now = new Date();
      if (tf) clockEl.textContent = tf.format(now);
      if (df) dateEl.textContent = df.format(now);
    }
    if (showClock) { tick(); setInterval(tick, 1000); }

    /* ---------- featured headline ---------- */
    var feature = document.querySelector('.feature');
    var featured = document.getElementById('featured');
    var countEl = document.querySelector('.count');
    var progress = document.querySelector('.progress');
    var numEl = document.getElementById('num');
    var bar = document.getElementById('bar');
    document.getElementById('total').textContent = pad2(items.length);
    var every = num(v.rotate_seconds, 4, 60, 8);
    var i = 0;
    /* A long headline (feeds can be wordy) shrinks, down to half the design size, to fit its box. */
    function fitFeatured() {
      featured.style.fontSize = '';
      if (!feature.offsetParent) return;
      var size = parseFloat(window.getComputedStyle(featured).fontSize) || 0;
      var floor = size * 0.5;
      for (var k = 0; k < 14 && size > floor; k++) {
        var cs = window.getComputedStyle(featured);
        var need = featured.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) +
          countEl.offsetHeight + progress.offsetHeight;
        if (need <= feature.clientHeight) break;
        size *= 0.92;
        featured.style.fontSize = size.toFixed(1) + 'px';
      }
    }
    function show(n, animate) {
      featured.textContent = items[n];
      numEl.textContent = pad2(n + 1);
      fitFeatured();
      featured.classList.remove('out');
      if (animate) { featured.classList.remove('in'); void featured.offsetWidth; featured.classList.add('in'); }
      bar.classList.remove('run'); void bar.offsetWidth;
      bar.style.animationDuration = every + 's';
      bar.classList.add('run');
    }
    show(0, false);
    if (items.length > 1) {
      setInterval(function () {
        featured.classList.add('out');
        setTimeout(function () { i = (i + 1) % items.length; show(i, true); }, 600);
      }, every * 1000);
    }

    /* ---------- ticker ---------- */
    var track = document.getElementById('track');
    var viewport = track.parentNode;
    function addRun(run) {
      items.forEach(function (t) {
        var s = document.createElement('span'); s.className = 'item'; s.dir = 'auto'; s.textContent = t; run.appendChild(s);
        var d = document.createElement('span'); d.className = 'sep'; run.appendChild(d);
      });
    }
    function fill() {
      while (track.firstChild) track.removeChild(track.firstChild);
      // Two identical runs, so the loop point is invisible. Short lists are repeated until one run
      // is longer than the bar (wider when horizontal, taller when vertical).
      var run = document.createElement('div');
      run.className = 'run';
      addRun(run);
      track.appendChild(run);
      var guard = 0;
      var vert = vertical();
      while ((vert ? run.offsetHeight < viewport.clientHeight : run.scrollWidth < viewport.clientWidth) && guard++ < 20) {
        addRun(run);
      }
      track.appendChild(run.cloneNode(true));
      return run;
    }
    var run = fill();
    var pos = 0;
    var last = null;
    var speed = num(v.speed, 20, 400, 120);
    function frame(t) {
      if (last !== null) {
        var dt = Math.min(0.1, (t - last) / 1000);
        var w = window.innerWidth || 1920, h = window.innerHeight || 1080;
        var vert = vertical();
        var scale;
        if (body.classList.contains('strip')) scale = h / 124;
        // Vertical: the setting is read at a calmer pace (lines are read, not scanned), scaled by width.
        else if (vert) scale = 0.4 * w / 1080;
        else scale = h / 1080;
        pos -= speed * scale * dt;
        var len = vert ? run.offsetHeight : run.getBoundingClientRect().width;
        while (len > 0 && -pos >= len) pos += len;
        track.style.transform = vert
          ? 'translate3d(0,' + pos.toFixed(2) + 'px,0)'
          : 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
      }
      last = t;
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { mode(); run = fill(); pos = 0; fitFeatured(); }, 150);
    });
    // The bundled fonts are inlined but may finish decoding after the first layout.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { run = fill(); fitFeatured(); }, function () {});
  });
})();
