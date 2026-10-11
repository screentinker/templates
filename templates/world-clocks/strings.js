/*
 * World clocks: the words on the screen, per language. MIT.
 *
 * Picked by the primary subtag of the template's Language setting (or the screen's language), with
 * English as the fallback for a language or a key that is missing. {n}, {max}, {list} and {v} are
 * filled in by app.js; numbers are already formatted with Intl for that language. extra_one /
 * extra_other are chosen with Intl.PluralRules.
 */
var CLOCK_STRINGS = {
  en: {
    here: 'Here',
    day: 'Day',
    night: 'Night',
    am: 'AM',
    pm: 'PM',
    offset: '{v}h',
    skipped: 'Skipped — unknown timezone: {list}',
    extra_one: 'Showing the first {max} clocks; {n} more not shown',
    extra_other: 'Showing the first {max} clocks; {n} more not shown',
    empty: 'Add clocks in the template settings — one per line, as City | Timezone.'
  },
  de: {
    here: 'Hier',
    day: 'Tag',
    night: 'Nacht',
    offset: '{v} h',
    skipped: 'Übersprungen – unbekannte Zeitzone: {list}',
    extra_one: 'Die ersten {max} Uhren werden gezeigt; {n} weitere nicht',
    extra_other: 'Die ersten {max} Uhren werden gezeigt; {n} weitere nicht',
    empty: 'Uhren in den Einstellungen der Vorlage hinzufügen – eine pro Zeile, als Stadt | Zeitzone.'
  },
  es: {
    here: 'Aquí',
    day: 'Día',
    night: 'Noche',
    offset: '{v} h',
    skipped: 'Omitidas (zona horaria desconocida): {list}',
    extra_one: 'Se muestran los primeros {max} relojes; {n} más sin mostrar',
    extra_other: 'Se muestran los primeros {max} relojes; {n} más sin mostrar',
    empty: 'Añade relojes en los ajustes de la plantilla: uno por línea, como Ciudad | Zona horaria.'
  },
  fr: {
    here: 'Ici',
    day: 'Jour',
    night: 'Nuit',
    offset: '{v} h',
    skipped: 'Ignorées — fuseau horaire inconnu : {list}',
    extra_one: 'Les {max} premières horloges sont affichées ; {n} autre est masquée',
    extra_other: 'Les {max} premières horloges sont affichées ; {n} autres sont masquées',
    empty: 'Ajoutez des horloges dans les réglages du modèle — une par ligne, sous la forme Ville | Fuseau horaire.'
  },
  hi: {
    here: 'यहाँ',
    day: 'दिन',
    night: 'रात',
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    offset: '{v} घं.',
    skipped: 'छोड़ा गया — अज्ञात टाइमज़ोन: {list}',
    extra_one: 'पहली {max} घड़ियाँ दिख रही हैं; {n} और नहीं दिखाई गई',
    extra_other: 'पहली {max} घड़ियाँ दिख रही हैं; {n} और नहीं दिखाई गईं',
    empty: 'टेम्पलेट की सेटिंग में घड़ियाँ जोड़ें — हर लाइन में एक, शहर | टाइमज़ोन के रूप में।'
  },
  it: {
    here: 'Qui',
    day: 'Giorno',
    night: 'Notte',
    offset: '{v} h',
    skipped: 'Saltati — fuso orario sconosciuto: {list}',
    extra_one: 'Mostrati i primi {max} orologi; {n} altro non mostrato',
    extra_other: 'Mostrati i primi {max} orologi; altri {n} non mostrati',
    empty: 'Aggiungi orologi nelle impostazioni del modello — uno per riga, come Città | Fuso orario.'
  },
  ja: {
    here: '現在地',
    day: '昼',
    night: '夜',
    am: '午前',
    pm: '午後',
    offset: '{v}時間',
    skipped: 'スキップ — 不明なタイムゾーン: {list}',
    extra_one: '最初の{max}個の時計を表示中（ほか{n}個は非表示）',
    extra_other: '最初の{max}個の時計を表示中（ほか{n}個は非表示）',
    empty: 'テンプレートの設定で時計を追加してください。1行に1つ、「都市 | タイムゾーン」の形式です。'
  },
  nl: {
    here: 'Hier',
    day: 'Dag',
    night: 'Nacht',
    offset: '{v} u',
    skipped: 'Overgeslagen — onbekende tijdzone: {list}',
    extra_one: 'De eerste {max} klokken worden getoond; {n} niet getoond',
    extra_other: 'De eerste {max} klokken worden getoond; {n} niet getoond',
    empty: 'Voeg klokken toe in de instellingen van de sjabloon — één per regel, als Stad | Tijdzone.'
  },
  pt: {
    here: 'Aqui',
    day: 'Dia',
    night: 'Noite',
    offset: '{v} h',
    skipped: 'Ignorados — fuso horário desconhecido: {list}',
    extra_one: 'Mostrando os primeiros {max} relógios; mais {n} não exibido',
    extra_other: 'Mostrando os primeiros {max} relógios; mais {n} não exibidos',
    empty: 'Adicione relógios nas configurações do modelo — um por linha, no formato Cidade | Fuso horário.'
  },
  zh: {
    here: '本地',
    day: '白天',
    night: '夜晚',
    am: '上午',
    pm: '下午',
    offset: '{v}小时',
    skipped: '已跳过 — 未知时区：{list}',
    extra_one: '显示前 {max} 个时钟；另有 {n} 个未显示',
    extra_other: '显示前 {max} 个时钟；另有 {n} 个未显示',
    empty: '请在模板设置中添加时钟——每行一个，格式为 城市 | 时区。'
  }
};
