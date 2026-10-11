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
  // The same idea for metric names typed in other languages: lower-cased substrings, by language.
  var LOWER_WORDS = {
    de: ['offen', 'rückstand', 'antwortzeit', 'reaktionszeit', 'wartezeit', 'warteschlange', 'abwanderung', 'kosten', 'ausgaben', 'fehler', 'störung', 'vorfäll', 'latenz', 'ausfall', 'mängel', 'beschwerde', 'reklamation'],
    es: ['abiert', 'pendiente', 'respuesta', 'espera', 'cola', 'abandono', 'coste', 'costo', 'gasto', 'error', 'incidente', 'incidencia', 'latencia', 'caída', 'defecto', 'queja', 'reclamación'],
    fr: ['ouvert', 'en attente', 'réponse', 'attente', 'file', 'attrition', 'résiliation', 'coût', 'dépense', 'erreur', 'incident', 'bogue', 'latence', 'panne', 'interruption', 'défaut', 'plainte', 'réclamation'],
    hi: ['खुले', 'खुला', 'लंबित', 'प्रतिक्रिया', 'जवाब', 'प्रतीक्षा', 'इंतज़ार', 'कतार', 'लागत', 'खर्च', 'त्रुटि', 'घटना', 'विलंब', 'डाउनटाइम', 'दोष', 'शिकायत'],
    it: ['apert', 'arretrat', 'risposta', 'attesa', 'coda', 'abbandon', 'costo', 'costi', 'spesa', 'errore', 'errori', 'incident', 'latenza', 'disserviz', 'difett', 'reclam'],
    ja: ['未対応', '未解決', '未処理', 'オープン', '応答時間', '対応時間', '待ち', '解約', 'コスト', '費用', 'エラー', '障害', 'インシデント', 'バグ', '遅延', 'ダウンタイム', '停止', '不良', '欠陥', '苦情', 'クレーム'],
    nl: ['open', 'achterstand', 'reactietijd', 'antwoordtijd', 'wachttijd', 'wachtrij', 'verloop', 'kosten', 'uitgaven', 'fout', 'incident', 'storing', 'latentie', 'uitval', 'defect', 'klacht'],
    pt: ['abert', 'pendente', 'resposta', 'espera', 'fila', 'cancelamento', 'custo', 'gasto', 'despesa', 'erro', 'incidente', 'latência', 'indisponibilidade', 'defeito', 'reclamaç'],
    zh: ['未解决', '未处理', '待处理', '响应时间', '回复时间', '等待', '排队', '流失', '成本', '费用', '支出', '错误', '故障', '事件', '缺陷', '延迟', '停机', '宕机', '投诉']
  };
  var CURRENCY = /^[$€£¥₹₩₽¢]$|^(r\$|usd|eur|gbp|jpy|chf|aud|cad)$/i;

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
    else if (/^[+-]?\d*,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^[+-]?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  /* Built-in words, picked by the primary subtag of the "locale" setting (empty = the screen's
     language), falling back to English. {pct}, {target} and {time} are filled in by the page. */
  var STRINGS = {
    en: {
      title: 'Key metrics',
      target: '{pct} of {target} target',
      updated: 'Updated {time}',
      empty: 'Add metrics in the template settings (Metric | Value | Target | Unit | Change), or connect a table data source.'
    },
    de: {
      title: 'Kennzahlen',
      target: '{pct} von {target} Ziel',
      updated: 'Aktualisiert {time}',
      empty: 'Kennzahlen in den Vorlageneinstellungen eintragen (Kennzahl | Wert | Ziel | Einheit | Änderung) oder eine Tabellen-Datenquelle verbinden.'
    },
    es: {
      title: 'Indicadores clave',
      target: '{pct} del objetivo de {target}',
      updated: 'Actualizado {time}',
      empty: 'Añade métricas en los ajustes de la plantilla (Métrica | Valor | Objetivo | Unidad | Cambio) o conecta una fuente de datos de tabla.'
    },
    fr: {
      title: 'Indicateurs clés',
      target: '{pct} de l’objectif de {target}',
      updated: 'Mis à jour {time}',
      empty: 'Ajoutez des indicateurs dans les réglages du modèle (Indicateur | Valeur | Objectif | Unité | Évolution) ou connectez une source de données en tableau.'
    },
    hi: {
      title: 'मुख्य आँकड़े',
      target: '{target} लक्ष्य का {pct}',
      updated: 'अपडेट {time}',
      empty: 'टेम्पलेट सेटिंग में आँकड़े जोड़ें (मीट्रिक | मान | लक्ष्य | इकाई | बदलाव), या कोई टेबल डेटा स्रोत जोड़ें।'
    },
    it: {
      title: 'Indicatori chiave',
      target: '{pct} dell’obiettivo di {target}',
      updated: 'Aggiornato {time}',
      empty: 'Aggiungi gli indicatori nelle impostazioni del modello (Indicatore | Valore | Obiettivo | Unità | Variazione) o collega una fonte dati a tabella.'
    },
    ja: {
      title: '主要指標',
      target: '目標 {target} の {pct}',
      updated: '{time} 更新',
      empty: 'テンプレート設定で指標を入力するか（指標 | 値 | 目標 | 単位 | 変化）、表形式のデータソースを接続してください。'
    },
    nl: {
      title: 'Kerncijfers',
      target: '{pct} van doel {target}',
      updated: 'Bijgewerkt {time}',
      empty: 'Voeg cijfers toe in de sjablooninstellingen (Cijfer | Waarde | Doel | Eenheid | Verandering) of koppel een tabelgegevensbron.'
    },
    pt: {
      title: 'Indicadores-chave',
      target: '{pct} da meta de {target}',
      updated: 'Atualizado {time}',
      empty: 'Adicione indicadores nas configurações do modelo (Indicador | Valor | Meta | Unidade | Variação) ou conecte uma fonte de dados em tabela.'
    },
    zh: {
      title: '关键指标',
      target: '目标 {target}，完成 {pct}',
      updated: '{time} 更新',
      empty: '请在模板设置中添加指标（指标 | 数值 | 目标 | 单位 | 变化），或连接表格数据源。'
    }
  };
  /* A usable BCP-47 tag for Intl: the setting if this engine has it, else the screen's language. */
  function pickLocale(tag) {
    var t = String(tag || '').trim();
    if (t) {
      try { if (Intl.NumberFormat.supportedLocalesOf([t]).length) return t; } catch (e) { /* invalid tag */ }
    }
    return (typeof navigator !== 'undefined' && navigator.language) || 'en';
  }
  /* "{pct} of {target} target" -> text nodes, with {pct} in <b>. */
  function phrase(parent, pattern, vals, bold) {
    String(pattern).split(/(\{[a-z]+\})/).forEach(function (part) {
      var m = /^\{([a-z]+)\}$/.exec(part);
      if (!m) { if (part) parent.appendChild(document.createTextNode(part)); return; }
      var val = vals[m[1]] === undefined ? '' : String(vals[m[1]]);
      if (m[1] === bold) parent.appendChild(el('b', '', val));
      else parent.appendChild(document.createTextNode(val));
    });
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

    var locale = pickLocale(v.locale);
    // The words follow the setting even where this engine's Intl lacks that language's data.
    var lang = String(v.locale || '').trim() || locale;
    var primary = lang.toLowerCase().split(/[-_]/)[0];
    var words = STRINGS[primary] || STRINGS.en;
    var lowerWords = LOWER_WORDS[primary] || [];
    root.setAttribute('lang', lang);
    function lowerIsBetter(metric) {
      if (LOWER_IS_BETTER.test(metric)) return true;
      var m = String(metric || '').toLowerCase();
      for (var k = 0; k < lowerWords.length; k++) if (m.indexOf(lowerWords[k]) >= 0) return true;
      return false;
    }
    var upIsGood = v.up_is_good !== false;
    var showTargets = v.show_targets !== false;
    var maxTiles = Math.round(num(v.max_tiles, 1, MAX, MAX));
    document.getElementById('title').textContent = str(v.title) || words.title;

    var nf = {};
    function fmt(n, dp) {
      var key = dp;
      if (!nf[key]) {
        try { nf[key] = new Intl.NumberFormat(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
        catch (e) { nf[key] = new Intl.NumberFormat(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
      }
      return nf[key].format(n);
    }
    var pctNf = null;
    /* 0.92 -> "92%" ("92 %" in German, "92 %" in French): the locale's own percent style. */
    function pct(ratio) {
      try {
        if (!pctNf) pctNf = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
        return pctNf.format(Math.round(ratio * 100) / 100);
      } catch (e) { return fmt(Math.round(ratio * 100), 0) + '%'; }
    }
    /* A typed change like "+6.4%", "-0.4" or "+18": its number in the locale's format, the rest as typed. */
    function fmtChange(ch) {
      var m = /^([^\d]*?)(\d[\d.,]*)(.*)$/.exec(ch);
      if (!m) return ch;
      var n = parseNumber(m[2]);
      return n === null ? ch : m[1] + fmt(n, decimals(m[2])) + m[3];
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
    /* Does this language put a currency before the number ($184,250, € 184.250) or after it
       (184.250 €)? Asked of Intl once; the symbol itself stays as typed. */
    var curFirst = true;
    try {
      var cparts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).formatToParts(1);
      for (var ci = 0; ci < cparts.length; ci++) {
        if (cparts[ci].type === 'currency') break;
        if (cparts[ci].type === 'integer') { curFirst = false; break; }
      }
    } catch (e) { curFirst = true; }
    function affixed(text, unit) {
      var wrap = el('span', 'value');
      if (unit && CURRENCY.test(unit) && curFirst) { wrap.appendChild(el('span', 'affix', unit)); wrap.appendChild(document.createTextNode(text)); }
      else if (unit && CURRENCY.test(unit)) { wrap.appendChild(document.createTextNode(text)); wrap.appendChild(el('span', 'affix', '\u00a0' + unit)); }
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
      var lab = el('div', 'label', r.metric || '—');
      lab.dir = 'auto';
      head.appendChild(lab);
      var ch = str(r.change);
      if (ch) {
        var cn = parseNumber(ch.replace(/^\+/, ''));
        var sign = cn === null ? 0 : (cn > 0 ? 1 : (cn < 0 ? -1 : 0));
        var goodUp = lowerIsBetter(r.metric) ? !upIsGood : upIsGood;
        var cls = sign === 0 ? '' : ((sign > 0) === goodUp ? ' good' : ' bad');
        var chip = el('span', 'change' + cls);
        chip.appendChild(el('span', 'arrow', sign > 0 ? '▲' : (sign < 0 ? '▼' : '■')));
        chip.appendChild(el('span', '', fmtChange(ch.replace(/^[+-]/, ''))));
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
        var tText = fmtValue(target, decimals(r.target));
        if (r.unit && CURRENCY.test(r.unit)) tText = curFirst ? r.unit + tText : tText + '\u00a0' + r.unit;
        else if (r.unit === '%') tText = tText + '%';
        else if (r.unit) tText = tText + ' ' + r.unit;
        phrase(label, words.target, { pct: pct(ratio), target: tText }, 'pct');
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
    catch (e) { tf = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }); }

    var lastKey = '';
    function render(force) {
      var src = fromSource() || fromTyped();
      var rows = src.rows.slice(0, maxTiles);
      var key = JSON.stringify(rows) + '|' + (window.innerWidth + 'x' + window.innerHeight);
      var when = src.updated ? new Date(src.updated) : new Date();
      if (isNaN(when.getTime())) when = new Date();
      updatedEl.textContent = words.updated.replace('{time}', tf.format(when));
      if (!force && key === lastKey) return;
      lastKey = key;

      var empty = document.getElementById('empty');
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      if (!rows.length) {
        empty.textContent = words.empty;
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
