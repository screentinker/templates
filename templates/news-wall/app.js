/*
 * News wall — ScreenTinker community template. MIT.
 *
 * Reads window.ST only. A bound RSS/Atom data source arrives in ST.data.feed as the flat keys of the
 * server's rss-resolver: feed_title, item_count and per item (1-based) item{n}_title, _summary,
 * _date (already formatted), _date_iso, _author. Item images are deliberately NOT used: this
 * template declares no network hosts, so the page's CSP would block them. Writes with textContent,
 * fetches nothing, uses no eval or string timers.
 */
(function () {
  'use strict';

  var CARDS = 4;

  function num(v, lo, hi, dflt) {
    var n = Number(v);
    if (!isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function str(v) { return v === null || v === undefined ? '' : String(v).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  /* Where line-clamp is missing, cut long text by characters instead so the layout still holds. */
  var clamp = !!(window.CSS && CSS.supports && (CSS.supports('-webkit-line-clamp', '3') || CSS.supports('line-clamp', '3')));
  function cut(s, max) {
    if (clamp || s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }
  /* The first letter or digit of a headline, for the typographic badges. Any script where the engine
     knows Unicode properties (a kanji, a Devanagari letter), else Latin, Greek and Cyrillic. */
  var LETTER = /[A-Za-z0-9À-ɏͰ-ϿЀ-ӿ]/;
  try { LETTER = new RegExp('[\\p{L}\\p{N}]', 'u'); } catch (e) { /* older engine: keep the fallback */ }
  function initial(s) {
    var m = LETTER.exec(s || '');
    return m ? m[0].toUpperCase() : '•';
  }

  /* Built-in words, picked by the primary subtag of the "locale" setting (empty = the screen's
     language), falling back to English. Typed labels in the settings still win over these. */
  var STRINGS = {
    en: {
      latest: 'Latest news',
      top: 'Top story',
      next: 'Up next',
      empty: 'No stories yet. Bind an RSS data source, or type headlines in the template settings.'
    },
    de: {
      latest: 'Aktuelles',
      top: 'Top-Thema',
      next: 'Als Nächstes',
      empty: 'Noch keine Meldungen. Eine RSS-Datenquelle verbinden oder Schlagzeilen in den Vorlageneinstellungen eintragen.'
    },
    es: {
      latest: 'Últimas noticias',
      top: 'Destacado',
      next: 'A continuación',
      empty: 'Aún no hay noticias. Vincula una fuente RSS o escribe titulares en los ajustes de la plantilla.'
    },
    fr: {
      latest: 'Actualités',
      top: 'À la une',
      next: 'À suivre',
      empty: 'Aucune actualité pour l’instant. Liez une source RSS ou saisissez des titres dans les réglages du modèle.'
    },
    hi: {
      latest: 'ताज़ा ख़बरें',
      top: 'मुख्य ख़बर',
      next: 'आगे',
      empty: 'अभी कोई ख़बर नहीं। कोई RSS डेटा स्रोत जोड़ें, या टेम्पलेट सेटिंग में सुर्खियाँ लिखें।'
    },
    it: {
      latest: 'Ultime notizie',
      top: 'In primo piano',
      next: 'A seguire',
      empty: 'Ancora nessuna notizia. Collega una fonte RSS o scrivi i titoli nelle impostazioni del modello.'
    },
    ja: {
      latest: '最新ニュース',
      top: 'トップニュース',
      next: '次のニュース',
      empty: 'まだ記事がありません。RSS データソースを接続するか、テンプレート設定で見出しを入力してください。'
    },
    nl: {
      latest: 'Laatste nieuws',
      top: 'Uitgelicht',
      next: 'Hierna',
      empty: 'Nog geen berichten. Koppel een RSS-gegevensbron of typ koppen in de sjablooninstellingen.'
    },
    pt: {
      latest: 'Últimas notícias',
      top: 'Destaque',
      next: 'A seguir',
      empty: 'Ainda não há notícias. Vincule uma fonte RSS ou digite manchetes nas configurações do modelo.'
    },
    zh: {
      latest: '最新消息',
      top: '头条',
      next: '接下来',
      empty: '暂无新闻。请绑定 RSS 数据源，或在模板设置中输入标题。'
    }
  };
  /* A usable BCP-47 tag for Intl: the setting if this engine has it, else the screen's language. */
  function pickLocale(tag) {
    var t = String(tag || '').trim();
    if (t) {
      try { if (Intl.DateTimeFormat.supportedLocalesOf([t]).length) return t; } catch (e) { /* invalid tag */ }
    }
    return (typeof navigator !== 'undefined' && navigator.language) || 'en';
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.accent2) root.style.setProperty('--accent2', v.accent2);
    if (clamp) document.body.classList.add('clamp');

    var locale = pickLocale(v.locale);
    // The words follow the setting even where this engine's Intl lacks that language's data.
    var lang = String(v.locale || '').trim() || locale;
    var words = STRINGS[lang.toLowerCase().split(/[-_]/)[0]] || STRINGS.en;
    root.setAttribute('lang', lang);
    var tz = v.timezone || undefined;
    var maxItems = Math.round(num(v.max_items, 1, 20, 8));
    var rotateMs = Math.round(num(v.rotate_seconds, 4, 60, 10) * 1000);
    var dateStyle = v.date_style || 'relative';
    root.style.setProperty('--rotate', (rotateMs / 1000) + 's');

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
    var clockFmt = makeFmt({ hour: 'numeric', minute: '2-digit' });
    var absFmt = makeFmt({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    var rtf = null;
    try { rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); }
    catch (e) { try { rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }); } catch (e2) { rtf = null; } }

    function when(item) {
      if (dateStyle === 'off') return '';
      var t = item.iso ? Date.parse(item.iso) : NaN;
      if (isNaN(t)) return item.date;
      if (dateStyle === 'absolute' || !rtf) return absFmt.format(new Date(t));
      var s = Math.round((t - Date.now()) / 1000);
      var a = Math.abs(s);
      if (a < 60) return rtf.format(0, 'minute');
      if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
      if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
      if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
      return absFmt.format(new Date(t));
    }

    /* ---------- stories: from the feed, or typed in ---------- */
    function fromFeed() {
      var d = (ST.data && ST.data.feed) || null;
      if (!d || typeof d !== 'object') return null;
      var n = Math.round(num(d.item_count, 0, 100, 0));
      var items = [];
      for (var i = 1; i <= n && items.length < maxItems; i++) {
        var title = str(d['item' + i + '_title']);
        if (!title) continue;
        items.push({ title: title, summary: str(d['item' + i + '_summary']), date: str(d['item' + i + '_date']), iso: str(d['item' + i + '_date_iso']), author: str(d['item' + i + '_author']) });
      }
      return items.length ? { title: str(d.feed_title), items: items } : null;
    }
    function fromTyped() {
      var items = [];
      String(v.stories || '').split(/\r?\n/).forEach(function (line) {
        if (items.length >= maxItems) return;
        var bar = line.indexOf('|');
        var title = str(bar < 0 ? line : line.slice(0, bar));
        if (!title) return;
        items.push({ title: title, summary: bar < 0 ? '' : str(line.slice(bar + 1)), date: '', iso: '', author: '' });
      });
      return { title: '', items: items };
    }

    /* ---------- render ---------- */
    var stories = [];
    var index = 0;
    var feature = $('feature'), body = feature.querySelector('.feature-body');

    var nf2 = null;
    try { nf2 = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }); } catch (e) { nf2 = null; }
    function pad(n) { return nf2 ? nf2.format(n) : (n < 10 ? '0' + n : String(n)); }
    function showFeature() {
      var s = stories[index];
      $('glyph').textContent = initial(s.title);
      $('f-kicker').textContent = str(v.feature_label) || words.top;
      var date = when(s);
      var meta = [date, s.author].filter(Boolean).join(' · ');
      $('f-date').textContent = meta;
      $('f-title').textContent = cut(s.title, 140);
      var sum = $('f-summary');
      sum.textContent = cut(s.summary, 240);
      sum.hidden = v.show_summaries === false || !s.summary;
      var count = $('count');
      while (count.firstChild) count.removeChild(count.firstChild);
      count.appendChild(el('b', '', pad(index + 1)));
      count.appendChild(document.createTextNode(' / ' + pad(stories.length)));
      // Restart the entry animation and the progress bar.
      body.classList.remove('swap');
      var bar = $('bar');
      bar.classList.remove('run');
      void body.offsetWidth;
      body.classList.add('swap');
      if (stories.length > 1) bar.classList.add('run');

      var cards = $('cards');
      while (cards.firstChild) cards.removeChild(cards.firstChild);
      var shown = Math.min(CARDS, stories.length - 1);
      for (var k = 1; k <= shown; k++) {
        var it = stories[(index + k) % stories.length];
        var li = el('li', 'card');
        li.style.animationDelay = (k * 80) + 'ms';
        li.appendChild(el('div', 'badge', initial(it.title)));
        var text = el('div', 'card-text');
        var ct = el('div', 'card-title', cut(it.title, 90));
        ct.dir = 'auto';
        text.appendChild(ct);
        var d = when(it);
        if (d) text.appendChild(el('div', 'card-date', d));
        li.appendChild(text);
        cards.appendChild(li);
      }
      document.querySelector('.rail').hidden = shown === 0;
      document.body.classList.toggle('solo', shown === 0);
    }

    var lastKey = '';
    function load() {
      var src = fromFeed() || fromTyped();
      $('title').textContent = str(v.title) || src.title || words.latest;
      $('rail-label').textContent = str(v.next_label) || words.next;
      var key = JSON.stringify(src.items);
      if (key === lastKey) return;
      lastKey = key;
      stories = src.items;
      var empty = $('empty');
      if (!stories.length) {
        empty.textContent = words.empty;
        empty.hidden = false;
        document.querySelector('.wall').hidden = true;
        return;
      }
      empty.hidden = true;
      document.querySelector('.wall').hidden = false;
      if (index >= stories.length) index = 0;
      showFeature();
    }

    function shape() {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var cls = w / h > 3 ? 'strip' : (h > w ? 'portrait' : 'landscape');
      document.body.classList.remove('strip', 'portrait', 'landscape');
      document.body.classList.add(cls);
    }

    var lastClock = '';
    function tick() {
      var c = $('clock');
      if (v.show_clock === false) { c.hidden = true; return; }
      var t = clockFmt.format(new Date());
      if (t !== lastClock) { lastClock = t; c.textContent = t; }
    }

    shape();
    tick();
    load();
    setInterval(tick, 1000);
    setInterval(function () {
      if (stories.length > 1) { index = (index + 1) % stories.length; showFeature(); }
    }, rotateMs);
    // The feed is synced by the server; re-read it every minute (only re-rendered when it changed).
    setInterval(load, 60000);
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(shape, 200);
    });
  });
})();
