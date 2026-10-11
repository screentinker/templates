/* Goal progress — ScreenTinker community template. MIT.
   A fundraiser / appeal / sales-target screen: amount raised against a goal on a thermometer, bar or
   ring, with milestones, a supporter count and a deadline countdown. The total comes from the
   settings, or from a data source (a sheet with the total, a donations log to add up, a REST object).
   ST.data is a snapshot: the server re-renders the page when the data source syncs, so nothing here
   polls. The only timers are the countdown (once a minute) and an occasional confetti burst. */
(function () {
  'use strict';

  var MAX_MILESTONES = 10;
  var MAX_ROWS = 100;          // the most rows a table data source hands over (tabular.js MAX_ROWS_OUT)
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* The fixed words on screen, per language (primary subtag of the locale setting, English as fallback).
     A non-empty setting (goal_text, percent_label...) always wins; "-" in one of them hides that line. */
  var STRINGS = {
    en: {
      goal: 'raised of our {target} goal',
      percent: 'of the goal',
      supporters: { one: 'supporter', other: 'supporters' },
      countdown: 'left to give',
      ended: 'Appeal closed',
      next: 'Next: {milestone} at {amount} · {remaining} to go',
      reached: 'Goal reached. Thank you!',
      day: { one: '{n} day', other: '{n} days' },
      hour: { one: '{n} hour', other: '{n} hours' },
      minute: { one: '{n} minute', other: '{n} minutes' }
    },
    de: {
      goal: 'gesammelt · unser Ziel: {target}',
      percent: 'des Ziels',
      supporters: { one: 'Unterstützer', other: 'Unterstützer' },
      countdown: 'Zeit zum Spenden',
      ended: 'Aktion beendet',
      next: 'Als Nächstes: {milestone} bei {amount} · noch {remaining}',
      reached: 'Ziel erreicht. Danke!',
      day: { one: '{n} Tag', other: '{n} Tage' },
      hour: { one: '{n} Stunde', other: '{n} Stunden' },
      minute: { one: '{n} Minute', other: '{n} Minuten' }
    },
    es: {
      goal: 'recaudados de nuestra meta de {target}',
      percent: 'de la meta',
      supporters: { one: 'donante', other: 'donantes' },
      countdown: 'para donar',
      ended: 'Campaña cerrada',
      next: 'Siguiente: {milestone} al llegar a {amount} · faltan {remaining}',
      reached: '¡Meta alcanzada! ¡Gracias!',
      day: { one: '{n} día', other: '{n} días' },
      hour: { one: '{n} hora', other: '{n} horas' },
      minute: { one: '{n} minuto', other: '{n} minutos' }
    },
    fr: {
      goal: 'collectés sur un objectif de {target}',
      percent: 'de l’objectif',
      supporters: { one: 'donateur', other: 'donateurs' },
      countdown: 'pour donner',
      ended: 'Collecte terminée',
      next: 'Prochaine étape : {milestone} à {amount} · encore {remaining}',
      reached: 'Objectif atteint. Merci !',
      day: { one: '{n} jour', other: '{n} jours' },
      hour: { one: '{n} heure', other: '{n} heures' },
      minute: { one: '{n} minute', other: '{n} minutes' }
    },
    hi: {
      goal: '{target} के लक्ष्य में से जुटाए गए',
      percent: 'लक्ष्य का',
      supporters: { one: 'समर्थक', other: 'समर्थक' },
      countdown: 'दान के लिए शेष',
      ended: 'अभियान समाप्त',
      next: 'अगला: {milestone} ({amount}) · {remaining} बाकी',
      reached: 'लक्ष्य पूरा हुआ। धन्यवाद!',
      day: { one: '{n} दिन', other: '{n} दिन' },
      hour: { one: '{n} घंटा', other: '{n} घंटे' },
      minute: { one: '{n} मिनट', other: '{n} मिनट' }
    },
    it: {
      goal: 'raccolti sul nostro obiettivo di {target}',
      percent: 'dell’obiettivo',
      supporters: { one: 'sostenitore', other: 'sostenitori' },
      countdown: 'per donare',
      ended: 'Raccolta chiusa',
      next: 'Prossima tappa: {milestone} a {amount} · mancano {remaining}',
      reached: 'Obiettivo raggiunto. Grazie!',
      day: { one: '{n} giorno', other: '{n} giorni' },
      hour: { one: '{n} ora', other: '{n} ore' },
      minute: { one: '{n} minuto', other: '{n} minuti' }
    },
    ja: {
      goal: 'が集まりました（目標 {target}）',
      percent: '達成率',
      supporters: { other: '支援者' },
      countdown: '締め切りまで',
      ended: '募集は終了しました',
      next: '次の目標：{milestone}（{amount}）・あと {remaining}',
      reached: '目標達成！ありがとうございます',
      day: { other: '{n}日' },
      hour: { other: '{n}時間' },
      minute: { other: '{n}分' }
    },
    nl: {
      goal: 'opgehaald van ons doel van {target}',
      percent: 'van het doel',
      supporters: { one: 'gever', other: 'gevers' },
      countdown: 'om te geven',
      ended: 'Actie gesloten',
      next: 'Volgende: {milestone} bij {amount} · nog {remaining}',
      reached: 'Doel bereikt. Bedankt!',
      day: { one: '{n} dag', other: '{n} dagen' },
      hour: { one: '{n} uur', other: '{n} uur' },
      minute: { one: '{n} minuut', other: '{n} minuten' }
    },
    pt: {
      goal: 'arrecadados da nossa meta de {target}',
      percent: 'da meta',
      supporters: { one: 'apoiador', other: 'apoiadores' },
      countdown: 'para doar',
      ended: 'Campanha encerrada',
      next: 'Próxima etapa: {milestone} em {amount} · faltam {remaining}',
      reached: 'Meta alcançada. Obrigado!',
      day: { one: '{n} dia', other: '{n} dias' },
      hour: { one: '{n} hora', other: '{n} horas' },
      minute: { one: '{n} minuto', other: '{n} minutos' }
    },
    zh: {
      goal: '已筹得，目标 {target}',
      percent: '目标完成度',
      supporters: { other: '支持者' },
      countdown: '剩余时间',
      ended: '募捐已结束',
      next: '下一目标：{milestone}（{amount}）· 还差 {remaining}',
      reached: '目标达成，感谢支持！',
      day: { other: '{n} 天' },
      hour: { other: '{n} 小时' },
      minute: { other: '{n} 分钟' }
    }
  };

  function str(x) { return x == null ? '' : String(x).trim(); }
  function isOn(x) { return x === true || x === 'true'; }

  // The same key the server gives a column or field (server/lib/data-sources/tabular.js slugKey).
  function slug(s) {
    var k = str(s);
    if (k.normalize) k = k.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (/^[0-9]/.test(k)) k = 'c' + k;
    return k;
  }

  // A cell or value as a number: "$1,250.50", "1 250", "1.250,50 €", "38450" → number, else null.
  function toNumber(x) {
    if (typeof x === 'number') return isFinite(x) ? x : null;
    var s = str(x).replace(/[\s\u00a0\u202f]/g, '').replace(/[^\d.,\-]/g, '');
    if (!/\d/.test(s)) return null;
    var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // A comma after the last dot is a decimal comma only when 1-2 digits follow it ("3,50"); "1,250" is thousands.
      if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else {
      s = s.replace(/,/g, '');
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function fill(template, map) {
    return str(template).replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : m; });
  }

  ST.ready(function () {
    var v = ST.values || {};
    var root = document.documentElement;
    var body = document.body;
    var animate = v.animate === undefined ? true : isOn(v.animate);

    if (v.background) root.style.setProperty('--bg', v.background);
    if (v.accent) root.style.setProperty('--accent', v.accent);
    if (v.accent2) root.style.setProperty('--accent2', v.accent2);
    if (v.text_color) root.style.setProperty('--text', v.text_color);
    body.setAttribute('data-font', str(v.font) || 'archivo');
    if (!animate) body.classList.add('still');

    /* ---------- formatting ---------- */
    var locale = str(v.locale) || undefined;
    // The language of the fixed words: the locale setting, else the player's own language.
    var lang = locale || (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages || [])[0])) || 'en';
    var L = STRINGS[String(lang).toLowerCase().split(/[-_]/)[0]] || STRINGS.en;
    function t(key) { return L[key] !== undefined ? L[key] : STRINGS.en[key]; }
    try { root.lang = String(lang); } catch (e) { /* keep "en" */ }
    var plurals = null;
    try { plurals = new Intl.PluralRules(lang); } catch (e) { try { plurals = new Intl.PluralRules(); } catch (e2) { plurals = null; } }
    function plural(key, n) {
      var w = t(key);
      var cat = plurals ? plurals.select(n) : (n === 1 ? 'one' : 'other');
      return w[cat] || w.other;
    }
    // A text setting: empty = the built-in words in the screen's language, "-" = hide.
    function words(name, key) {
      var s = str(v[name]);
      if (s === '-') return '';
      return s || t(key);
    }
    function numberFormat(opts) {
      try { return new Intl.NumberFormat(locale, opts); } catch (e) {
        try { return new Intl.NumberFormat(undefined, opts); } catch (e2) { return null; }
      }
    }
    var cents = isOn(v.show_cents);
    var currency = str(v.currency).toUpperCase();
    var moneyFmt = null;
    if (/^[A-Z]{3}$/.test(currency)) {
      var o = { style: 'currency', currency: currency };
      if (!cents) { o.minimumFractionDigits = 0; o.maximumFractionDigits = 0; }
      try { moneyFmt = new Intl.NumberFormat(locale, o); } catch (e) {
        try { moneyFmt = new Intl.NumberFormat(undefined, o); } catch (e2) { moneyFmt = null; }
      }
    }
    var unit = moneyFmt ? '' : str(v.unit);
    var plainFmt = numberFormat(cents ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 });
    var intFmt = numberFormat({ maximumFractionDigits: 0 });
    var pctFmt = numberFormat({ style: 'percent', maximumFractionDigits: 0 });

    function plain(n) { return plainFmt ? plainFmt.format(n) : String(Math.round(n)); }
    // The amount as text, with its unit: "$38,450", "38.450 €", "1,240 books".
    function money(n) {
      if (moneyFmt) return moneyFmt.format(n);
      return plain(n) + (unit ? ' ' + unit : '');
    }
    // The amount as parts, so the big figure can draw the currency sign smaller.
    function moneyParts(n) {
      if (moneyFmt && moneyFmt.formatToParts) {
        return moneyFmt.formatToParts(n).map(function (p) { return { cls: p.type === 'currency' ? 'cur' : '', text: p.value }; });
      }
      var out = [{ cls: '', text: moneyFmt ? moneyFmt.format(n) : plain(n) }];
      if (unit) out.push({ cls: 'unit', text: '\u00a0' + unit });
      return out;
    }

    /* ---------- the numbers: settings, overridden by the data source ---------- */
    var raised = toNumber(v.raised); if (raised == null || raised < 0) raised = 0;
    var target = toNumber(v.target); if (target == null || target < 0) target = 0;
    var supporters = toNumber(v.supporters); if (supporters == null || supporters < 0) supporters = 0;

    (function fromSource() {
      var d = ST.data && ST.data.source;
      if (!d || typeof d !== 'object') return;
      var rowCount = toNumber(d.row_count) || 0;
      // Rows that actually reached the template (a large sheet is cut short, see the README).
      function column(key) {
        var vals = [];
        for (var i = 1; i <= MAX_ROWS; i++) {
          var c = d['row' + i + '_' + key];
          if (c === undefined) break;
          vals.push(c);
        }
        return vals;
      }
      // Reads a field the way the operator asked. Returns { value, rows } or null.
      function read(colName, mode, allowSum) {
        var key = slug(colName);
        if (!key) return null;
        // A REST object ({"raised": 38450}) or a lookup-mode sheet (Key | Value rows) gives the field directly.
        if (d[key] !== undefined && d[key] !== null && typeof d[key] !== 'object') {
          var direct = toNumber(d[key]);
          if (direct != null) return { value: direct, rows: false };
        }
        var vals = column(key);
        if (!vals.length) return null;
        var m = mode;
        if (m === 'auto') m = rowCount > 1 && allowSum ? 'sum' : 'first';
        if (m === 'sum' && !allowSum) m = 'first';
        if (m === 'sum') {
          // The server's own total covers every row of the sheet, even ones the template never sees.
          var s = toNumber(d['sum_' + key]);
          if (s == null) {
            s = 0;
            vals.forEach(function (x) { var n = toNumber(x); if (n != null) s += n; });
          }
          return { value: s, rows: true };
        }
        var list = m === 'last' ? vals.slice().reverse() : vals;
        for (var j = 0; j < list.length; j++) {
          var n = toNumber(list[j]);
          if (n != null) return { value: n, rows: false };
        }
        return null;
      }
      var mode = str(v.amount_mode) || 'auto';
      var amt = read(v.amount_col || 'Raised', mode, true);
      if (!amt) return;                       // not the shape we know: keep the typed-in numbers
      raised = Math.max(0, amt.value);
      var t = read(v.target_col || 'Target', mode === 'last' ? 'last' : 'first', false);
      if (t && t.value > 0) target = t.value;
      var sup = read(v.supporters_col || 'Supporters', mode, true);
      if (sup) supporters = Math.max(0, sup.value);
      else if (amt.rows && rowCount > 0) supporters = rowCount;   // a donations log: one row per gift
    })();

    var ratio = target > 0 ? raised / target : 0;
    var done = target > 0 && raised >= target;
    // Never round up to 100% before the goal is actually reached.
    var shownRatio = done ? Math.floor(ratio * 100) / 100 : Math.min(0.99, Math.floor(ratio * 100) / 100);
    var fillRatio = Math.max(0, Math.min(1, ratio));
    if (done) body.classList.add('done');

    /* ---------- milestones ---------- */
    var milestones = [];
    str(v.milestones).split(/\r?\n/).forEach(function (line) {
      if (!str(line)) return;
      var c = line.split('|');
      var a = toNumber(c[0]);
      if (a == null || a <= 0 || (target > 0 && a > target)) return;
      milestones.push({ amount: a, label: str(c.slice(1).join('|')) });
    });
    milestones.sort(function (a, b) { return a.amount - b.amount; });
    milestones = milestones.slice(0, MAX_MILESTONES);
    // The goal itself is the last mark; a milestone set at the goal lends it its label.
    var marks = milestones.filter(function (m) { return m.amount < target; });
    if (target > 0) {
      var atGoal = milestones.filter(function (m) { return m.amount === target; })[0];
      marks.push({ amount: target, label: atGoal ? atGoal.label : '', goal: true });
    }

    // The same marks as a checklist, for shapes where labels along the gauge would be cramped.
    var mlist = document.getElementById('mlist');
    marks.forEach(function (m) {
      var li = mlist.appendChild(el('li', raised >= m.amount ? 'hit' : ''));
      li.appendChild(el('span', 'dot'));
      li.appendChild(el('span', 'la', money(m.amount)));
      li.appendChild(el('span', 'ln', m.label));
    });

    /* ---------- text ---------- */
    function setText(id, text) {
      var e = document.getElementById(id);
      e.textContent = text;
      e.hidden = !text;
      return e;
    }
    setText('kicker', str(v.kicker));
    setText('headline', str(v.headline));
    setText('thanks', str(v.thanks));
    if (v.logo) {
      var logo = document.getElementById('logo');
      logo.src = v.logo;
      logo.hidden = false;
    }
    if (done) setText('badge', words('celebrate_text', 'reached'));

    var raisedEl = document.getElementById('raised');
    function drawRaised(n) {
      raisedEl.textContent = '';
      moneyParts(n).forEach(function (p) {
        if (p.cls) raisedEl.appendChild(el('span', p.cls, p.text));
        else raisedEl.appendChild(document.createTextNode(p.text));
      });
    }
    drawRaised(raised);
    setText('goal', target > 0 ? fill(words('goal_text', 'goal'), { target: money(target) }) : '');

    var statPct = document.getElementById('stat-pct');
    var statSup = document.getElementById('stat-sup');
    var statTime = document.getElementById('stat-time');
    function stat(node, value, label) {
      node.querySelector('.sv').textContent = value;
      node.querySelector('.sl').textContent = label;
      node.hidden = !value;
    }
    var pctText = target > 0 && pctFmt ? pctFmt.format(shownRatio) : '';
    stat(statPct, pctText, words('percent_label', 'percent'));
    var bigPct = document.getElementById('bigpct');
    bigPct.textContent = pctText;
    var supLabel = str(v.supporters_label) === '-' ? '' : (str(v.supporters_label) || plural('supporters', Math.round(supporters)));
    stat(statSup, supporters > 0 && intFmt ? intFmt.format(Math.round(supporters)) : '', supLabel);

    var next = null;
    for (var i = 0; i < marks.length; i++) if (marks[i].amount > raised && !marks[i].goal) { next = marks[i]; break; }
    var nextText = words('next_text', 'next');
    setText('next', next && !done && nextText
      ? fill(nextText, { milestone: next.label || money(next.amount), amount: money(next.amount), remaining: money(next.amount - raised) })
      : '');

    /* ---------- deadline ---------- */
    var tz = str(v.timezone);
    function tzOffset(epoch) {
      // Milliseconds the zone is ahead of UTC at that instant.
      var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric' });
      var p = {};
      f.formatToParts(new Date(epoch)).forEach(function (x) { p[x.type] = x.value; });
      var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return asUtc - Math.floor(epoch / 1000) * 1000;
    }
    // A wall-clock time in the chosen zone (or the screen's own) as an epoch.
    function zoned(y, mo, d, h, mi) {
      if (tz) {
        try {
          var guess = Date.UTC(y, mo - 1, d, h, mi);
          var off = tzOffset(guess);
          var t = guess - off;
          var off2 = tzOffset(t);
          return off2 === off ? t : guess - off2;
        } catch (e) { /* an unknown zone: fall through to the screen's clock */ }
      }
      return new Date(y, mo - 1, d, h, mi).getTime();
    }
    // Today's year and month in the chosen zone.
    function today() {
      var now = new Date();
      if (tz) {
        try {
          var p = {};
          new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric' }).formatToParts(now)
            .forEach(function (x) { p[x.type] = x.value; });
          return { y: +p.year, m: +p.month };
        } catch (e) { /* fall through */ }
      }
      return { y: now.getFullYear(), m: now.getMonth() + 1 };
    }
    function deadlineEpoch() {
      var s = str(v.deadline).toLowerCase();
      if (!s) return null;
      var t = today();
      if (s === 'year-end' || s === 'year_end' || s === 'yearend') return zoned(t.y + 1, 1, 1, 0, 0);
      if (s === 'month-end' || s === 'month_end' || s === 'monthend') return zoned(t.m === 12 ? t.y + 1 : t.y, t.m === 12 ? 1 : t.m + 1, 1, 0, 0);
      if (s === 'quarter-end' || s === 'quarter_end' || s === 'quarterend') {
        var qm = Math.floor((t.m - 1) / 3) * 3 + 4;      // first month of the next quarter
        return zoned(qm > 12 ? t.y + 1 : t.y, qm > 12 ? qm - 12 : qm, 1, 0, 0);
      }
      var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[t ](\d{1,2}):(\d{2}))?$/.exec(s);
      if (!m) return null;
      // A bare date runs to the end of that day.
      if (m[4] === undefined) return zoned(+m[1], +m[2], +m[3] + 1, 0, 0);
      return zoned(+m[1], +m[2], +m[3], +m[4], +m[5]);
    }
    var deadline = deadlineEpoch();
    // "86 days" in the chosen language; engines without Intl unit formatting use the table above.
    function unitText(n, u) {
      try { return new Intl.NumberFormat(locale, { style: 'unit', unit: u, unitDisplay: 'long', maximumFractionDigits: 0 }).format(n); } catch (e) {
        return plural(u, n).replace('{n}', intFmt ? intFmt.format(n) : String(n));
      }
    }
    var timeTimer = null;
    function drawTime() {
      if (timeTimer) { clearTimeout(timeTimer); timeTimer = null; }
      if (deadline == null || !isFinite(deadline)) { stat(statTime, '', ''); return; }
      var left = deadline - Date.now();
      statTime.classList.toggle('ended', left <= 0);
      if (left <= 0) {
        var endedText = words('ended_label', 'ended');
        stat(statTime, endedText, '');
        statTime.hidden = !endedText;
        return;
      }
      var DAY = 86400000, HOUR = 3600000, MIN = 60000;
      var text;
      if (left >= 2 * DAY) text = unitText(Math.floor(left / DAY), 'day');
      else if (left >= 2 * HOUR) text = unitText(Math.floor(left / HOUR), 'hour');
      else text = unitText(Math.max(1, Math.ceil(left / MIN)), 'minute');
      stat(statTime, text, words('countdown_label', 'countdown'));
      timeTimer = setTimeout(function () { drawTime(); fitAll(); }, MIN - (Date.now() % MIN) + 50);
    }
    drawTime();

    /* ---------- the gauge ---------- */
    var gauge = document.getElementById('gauge');
    var fillEls = [];        // { el, prop, to } animated after the first paint

    function markLabel(m) {
      var lab = el('div', 'mlabel');
      lab.appendChild(el('div', 'ma', money(m.amount)));
      if (m.label) lab.appendChild(el('div', 'mn', m.label));
      return lab;
    }

    function buildThermo() {
      var t = el('div', 'thermo');
      var tube = t.appendChild(el('div', 'tube'));
      var clip = tube.appendChild(el('div', 'tube-clip'));
      var f = clip.appendChild(el('div', 'fill'));
      var scale = tube.appendChild(el('div', 'scale'));
      marks.forEach(function (m) {
        var mk = scale.appendChild(el('div', 'mark' + (raised >= m.amount ? ' hit' : '') + (m.goal ? ' goal' : '')));
        mk.style.bottom = (m.amount / target * 100) + '%';
        mk.appendChild(el('div', 'mline'));
        mk.appendChild(markLabel(m));
      });
      t.appendChild(el('div', 'bulb'));
      gauge.appendChild(t);
      // The fill rises from inside the bulb (0.9 tube widths up) to the top of the scale.
      var h = 'calc(var(--tw) * 0.9 + (100% - var(--tw) * 1.4) * ' + fillRatio.toFixed(4) + ')';
      fillEls.push({ el: f, prop: 'height', from: 'calc(var(--tw) * 0.9)', to: h });
    }

    function buildBar() {
      var b = el('div', 'bar');
      var track = b.appendChild(el('div', 'track'));
      var f = track.appendChild(el('div', 'fill'));
      var labels = b.appendChild(el('div', 'blabels'));
      marks.forEach(function (m) {
        var p = m.amount / target * 100;
        var tick = track.appendChild(el('div', 'bmark' + (raised >= m.amount ? ' hit' : '') + (m.goal ? ' goal' : '')));
        tick.style.left = p + '%';
        var lab = markLabel(m);
        lab.className += (raised >= m.amount ? ' hit' : '') + (m.goal ? ' goal' : '');
        lab.style.left = p + '%';
        labels.appendChild(lab);
      });
      gauge.appendChild(b);
      fillEls.push({ el: f, prop: 'width', from: '0%', to: (fillRatio * 100).toFixed(3) + '%' });
    }

    function buildRing() {
      var R = 84, C = 2 * Math.PI * R;
      var s = svg('svg', { viewBox: '0 0 200 200', preserveAspectRatio: 'xMidYMid meet', 'class': 'ring' });
      var defs = s.appendChild(svg('defs', {}));
      var g = defs.appendChild(svg('linearGradient', { id: 'gp-grad', x1: '0', y1: '1', x2: '1', y2: '0' }));
      g.appendChild(svg('stop', { offset: '0', 'class': 'stop2' }));
      g.appendChild(svg('stop', { offset: '1', 'class': 'stop1' }));
      s.appendChild(svg('circle', { cx: 100, cy: 100, r: R, 'class': 'rtrack' }));
      var arc = s.appendChild(svg('circle', { cx: 100, cy: 100, r: R, 'class': 'rfill', transform: 'rotate(-90 100 100)',
        'stroke-dasharray': C.toFixed(2) + ' ' + C.toFixed(2), 'stroke-dashoffset': C.toFixed(2) }));
      marks.forEach(function (m) {
        if (m.goal) return;
        var a = (m.amount / target) * 2 * Math.PI - Math.PI / 2;
        s.appendChild(svg('circle', { cx: (100 + R * Math.cos(a)).toFixed(2), cy: (100 + R * Math.sin(a)).toFixed(2), r: 4.2,
          'class': 'rmark' + (raised >= m.amount ? ' hit' : '') }));
      });
      var big = s.appendChild(svg('text', { x: 100, y: 104, 'class': 'rpct', 'text-anchor': 'middle' }));
      big.textContent = target > 0 && pctFmt ? pctFmt.format(shownRatio) : '';
      var small = s.appendChild(svg('text', { x: 100, y: 128, 'class': 'rlab', 'text-anchor': 'middle' }));
      small.textContent = words('percent_label', 'percent').slice(0, 24);
      gauge.appendChild(s);
      fillEls.push({ el: arc, attr: 'stroke-dashoffset', to: (C * (1 - fillRatio)).toFixed(2) });
    }

    // Hide milestone labels that would overlap the one before them (the tick stays).
    function uncrowd() {
      var labs = gauge.querySelectorAll('.mlabel');
      var vertical = !!gauge.querySelector('.thermo');
      var prev = -1, prevRect = null;
      for (var i = 0; i < labs.length; i++) labs[i].classList.remove('crowd');
      for (var j = 0; j < labs.length; j++) {
        var r = labs[j].getBoundingClientRect();
        var overlap = prevRect && (vertical ? r.bottom > prevRect.top - 4 : r.left < prevRect.right + 12);
        var isGoal = labs[j].classList.contains('goal') || labs[j].parentNode.classList.contains('goal');
        if (overlap && !isGoal) { labs[j].classList.add('crowd'); continue; }
        // The goal label always shows; it pushes out the one before it instead.
        if (overlap) labs[prev].classList.add('crowd');
        prev = j; prevRect = r;
      }
    }
    // Keep bar labels inside the frame at both ends.
    function clampBarLabels() {
      var labs = gauge.querySelectorAll('.blabels .mlabel');
      var box = gauge.getBoundingClientRect();
      for (var i = 0; i < labs.length; i++) {
        labs[i].style.transform = '';
        var r = labs[i].getBoundingClientRect();
        var shift = 0;
        if (r.left < box.left) shift = box.left - r.left;
        else if (r.right > box.right) shift = box.right - r.right;
        if (shift) labs[i].style.transform = 'translateX(calc(-50% + ' + shift.toFixed(1) + 'px))';
      }
    }

    var built = '';
    var firstPaint = true;
    function buildGauge(kind) {
      if (kind === built) return;
      built = kind;
      gauge.textContent = '';
      fillEls = [];
      if (kind === 'thermometer') buildThermo();
      else if (kind === 'ring') buildRing();
      else buildBar();
      var instant = !animate || !firstPaint;
      fillEls.forEach(function (f) {
        if (f.attr) { if (instant) f.el.setAttribute(f.attr, f.to); }
        else f.el.style[f.prop] = instant ? f.to : f.from;
      });
      if (!instant) {
        // Two frames so the start value is painted before the transition to the end value begins.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fillEls.forEach(function (f) {
              if (f.attr) f.el.setAttribute(f.attr, f.to);
              else f.el.style[f.prop] = f.to;
            });
          });
        });
      }
    }

    /* ---------- fitting text to its box ---------- */
    // Shrinks an element's font from its CSS size until it fits its width (and `lines` lines, if given).
    function fit(e, lines, floor) {
      if (!e || e.hidden) return;
      e.style.fontSize = '';
      var max = parseFloat(getComputedStyle(e).fontSize) || 16;
      var lh = parseFloat(getComputedStyle(e).lineHeight) / max || 1.1;
      var min = max * (floor || 0.45);
      function over(px) {
        e.style.fontSize = px + 'px';
        if (e.scrollWidth > e.clientWidth + 1) return true;
        return lines ? e.scrollHeight > lines * lh * px + 2 : false;
      }
      if (!over(max)) return;
      var lo = min, hi = max;
      for (var k = 0; k < 12 && hi - lo > 0.5; k++) {
        var mid = (lo + hi) / 2;
        if (over(mid)) hi = mid; else lo = mid;
      }
      e.style.fontSize = Math.floor(lo) + 'px';
    }
    function fitAll() {
      var strip = body.classList.contains('strip');
      fit(document.getElementById('headline'), strip ? 2 : 3, 0.5);
      fit(raisedEl, 0, 0.3);
      fit(document.getElementById('goal'), strip ? 1 : 2, 0.6);
      var svs = document.querySelectorAll('.stat .sv');
      for (var i = 0; i < svs.length; i++) fit(svs[i], 0, 0.5);
      // Beside a portrait thermometer the line may wrap once (long German or Hindi phrases).
      fit(document.getElementById('next'), body.classList.contains('portrait') && built === 'thermometer' ? 2 : 1, 0.6);
      fit(document.getElementById('thanks'), strip ? 1 : 2, 0.6);
      if (built === 'bar') clampBarLabels();
      uncrowd();
    }

    function layout() {
      var W = window.innerWidth, H = window.innerHeight;
      var strip = W / H > 3.2;
      var portrait = !strip && H > W * 1.05;
      var wanted = str(v.style) || 'thermometer';
      if (wanted !== 'bar' && wanted !== 'ring') wanted = 'thermometer';
      var kind = strip ? 'bar' : wanted;
      body.classList.toggle('strip', strip);
      body.classList.toggle('portrait', portrait);
      body.classList.toggle('landscape', !portrait && !strip);
      body.classList.remove('k-thermometer', 'k-bar', 'k-ring');
      body.classList.add('k-' + kind);
      buildGauge(kind);
      // The ring draws the percentage inside itself; a landscape bar shows it big beside the amount.
      var bigOn = kind === 'bar' && !portrait && !strip && !!pctText;
      bigPct.hidden = !bigOn;
      var listOn = kind === 'bar' && portrait && marks.length > 1;
      mlist.hidden = !listOn;
      body.classList.toggle('with-list', listOn);
      statPct.hidden = !pctText || kind === 'ring' || bigOn;
      fitAll();
    }

    /* ---------- the celebration ---------- */
    var confetti = document.getElementById('confetti');
    function buildConfetti() {
      var colours = ['var(--accent)', 'var(--accent2)', 'var(--text)'];
      for (var i = 0; i < 34; i++) {
        var c = confetti.appendChild(el('span'));
        c.style.left = (Math.random() * 100).toFixed(1) + '%';
        c.style.background = colours[i % 3];
        c.style.animationDuration = (4 + Math.random() * 3).toFixed(2) + 's';
        c.style.animationDelay = (Math.random() * 2.2).toFixed(2) + 's';
        c.style.setProperty('--drift', ((Math.random() - 0.5) * 30).toFixed(1) + 'vmin');
        c.style.setProperty('--spin', (360 + Math.random() * 720).toFixed(0) + 'deg');
        if (i % 4 === 0) c.className = 'round';
      }
    }
    function burst() {
      confetti.classList.remove('go');
      void confetti.offsetWidth;          // restart the CSS animation
      confetti.classList.add('go');
    }
    if (done && animate) {
      buildConfetti();
      burst();
      setInterval(burst, 120000);         // one short shower every two minutes, not a constant storm
    }

    /* ---------- the amount counts up once ---------- */
    function countUp() {
      if (!animate || raised <= 0) return;
      var t0 = null, dur = 1700;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        drawRaised(k < 1 ? (cents ? raised * eased : Math.round(raised * eased)) : raised);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var resizeT = null;
    window.addEventListener('resize', function () {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(layout, 200);
    });

    function start() {
      layout();
      firstPaint = false;
      countUp();
    }
    // Measure with the real fonts, not the fallbacks.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
    else start();
  });
})();
