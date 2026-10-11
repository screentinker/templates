# Promo offer

A promotion or flash-sale screen. It shows a big headline, the offer, the price with the old price
struck through, a badge with the saving worked out for you, and a live **ends in** countdown. When
the end time passes, the countdown turns into an "offer ended" message by itself. If you prefer,
the whole promo can step aside for a fallback line. Add a product picture and a QR code that takes
shoppers to your shop page.

Three looks: **Bold retail** (red and yellow, starburst badge), **Clean minimal** (off-white, black
type, one orange accent) and **Warm café** (cream, serif type, terracotta). Each one works full
screen in landscape and portrait, and in a thin strip zone, where it drops to one row: headline,
price, countdown and QR code.

**Kind:** html (code, reviewed). **Network:** none. Nothing is fetched and the QR code is drawn on
the screen, so it works fully offline.

![preview](thumbnail.png)

## Settings

| Setting | Type | Default | What it does |
| --- | --- | --- | --- |
| Style | select | Bold retail | Bold retail, Clean minimal or Warm café: colours, fonts and badge shape. |
| Small heading | text (40) | `Weekend flash sale` | A label above the headline. Empty hides it. |
| Headline | text (70) | `Aura wireless headphones` | The big line. It shrinks to fit in at most three lines. |
| Offer line | text (140) | a product blurb | One or two lines under the headline. Empty hides it. |
| Price | text (30) | `89` | A number (`89`, `89.99`, `$89`, `89,99`) is formatted in your currency and language. Anything else (`2 for 1`, `Free`) is shown as typed. Empty hides it. |
| Was price | text (30) | `149` | Optional. Shown struck through beside the price. |
| Currency code | text (3) | `USD` | A three-letter ISO 4217 code (`USD`, `EUR`, `GBP`, `JPY`, `AUD`…). The symbol, its position and the decimal separator come from the language, so `EUR` in German reads `6,50 €`. Empty shows bare numbers. An unknown code also shows bare numbers. |
| Decimals | select | only when needed | `89` and `89.50`, or always `89.00`. |
| Saving badge | select | percentage | `Save 40%`, `Save $60`, or no badge. It appears only when both prices are numbers and the was price is higher. The percentage is rounded down, so it never claims more than the real saving. |
| Saving badge wording | text (30) | empty | `{saving}` is replaced by the percentage or amount, e.g. `{saving} off`. Empty: `Save {saving}` in the screen's language. A single `-` shows the saving alone. |
| Offer ends | text (40) | empty | When the offer ends (see below). Empty: the offer ends at midnight every night, which suits "today only" deals. |
| Timezone | timezone | screen's clock | The timezone the end time is in. Set it when screens in other timezones show the same promo. |
| Language | locale | screen's language | The language of the built-in words (see *Languages*), and the format of the price, the saving, the countdown units (`hours`, `Stunden`) and the end date. |
| Time format | select | as the language prefers | 24-hour or 12-hour for the end date line. |
| Show the countdown | checkbox | on | Off hides the tiles. The end time still switches the promo to its ended state. |
| Countdown label | text (30) | empty | The word beside the tiles. Empty: `Ends in` in the screen's language. A single `-` hides it. |
| Show when the offer ends | checkbox | on | A line like `Offer ends Sun, Nov 29, 11:59 PM` under the countdown. |
| End date wording | text (30) | empty | Put before the end date. Empty: `Offer ends …` in the screen's language (`Gültig bis …`, `…まで`). A single `-` shows the date on its own. |
| When the offer has ended | select | keep the promo | **Keep the promo and show the ended message**: the countdown becomes the ended message, the price dims and the badge goes. **Replace the whole promo with the fallback line**: a full-screen line instead, under the fallback heading if you set one. |
| Ended message | text (60) | empty | Shown in place of the countdown after the end. Empty: `This offer has ended` in the screen's language. |
| Fallback heading | text (40) | empty | A small line above the fallback line, e.g. `Thanks for shopping`. Empty shows the fallback line alone. |
| Fallback line | text (100) | `New deals every Friday. See you then!` | The full-screen line for the second option above. Empty uses the ended message. |
| Product image | image | the bundled headphones | A PNG with a transparent background looks best. Empty gives a text-only promo with a larger headline. |
| QR code link | text (300) | `https://shop.example.com/aura` | Drawn as a QR code beside the product (beside the price in portrait). Empty hides it. Keep it short: very long links make a dense code that is hard to scan from far away. |
| QR code caption | text (40) | empty | Under the code. Empty: `Scan to shop` in the screen's language. A single `-` hides it. |
| Fine print | text (300) | terms line | Small print along the bottom. Empty hides it. |
| Use my own colours | checkbox | off | Off uses the style's palette. On uses the three colours below, and the style still sets the fonts and the badge shape. |
| Background / Text / Accent colour | colour | `#1D3557` / `#FFFFFF` / `#FFC145` | Used only with *Use my own colours*. The accent colours the price, the badge and the small heading. |

### The end time

Type the end time in this form: `2026-11-29T23:59` (a space works in place of the `T`), or a date
alone like `2026-11-29`, which means the end of that day. The time is read in the **Timezone**
setting, so a promo ending at midnight in London ends at midnight in London on every screen. To
give an exact moment, add an offset: `2026-11-29T23:59:00Z` or `2026-11-29T23:59+01:00`.

A time inside a daylight-saving gap (02:30 on the night the clocks go forward) is moved to just
after the gap. Text the template cannot read as a date (including a day the month does not have,
like `2026-02-31`) hides the countdown and the end date, and writes a warning to the screen's
console. The promo then never switches to its ended state. Leave the setting empty for a daily offer: the countdown runs to
midnight and starts again for the next day.

The countdown shows days, hours, minutes and seconds while more than a day is left, then hours,
minutes and seconds. Numbers and unit names follow the language setting.

### Schedule it too

The template switches its own state at the end time, but it stays in the playlist. To take it off
the screens entirely, give the playlist item a schedule as well.

## Languages

The words the template writes itself (`Ends in`, `Offer ends …`, `Save {saving}`, `This offer has
ended`, `Scan to shop` and the countdown units `days`, `hours`, `minutes`, `seconds`) come in
English, German, Spanish, French, Hindi, Italian, Japanese, Dutch, Portuguese and Simplified Chinese,
picked by the **Language** setting (empty: the screen's own language; anything else falls back to
English). A wording you type in a setting always wins over the built-in one. Prices, percentages,
dates and times are formatted by the screen for that language.

`locales/` holds dashboard translations of the setting names, help texts and the sample wording
(`de`, `es`, `fr`, `hi`, `it`, `ja`, `nl`, `pt`, `zh`). Servers that do not know about them ignore
the folder; the template works the same without it.

The bundled fonts cover Latin scripts only. Japanese, Chinese and Hindi text uses the player's own
Noto Sans CJK / Noto Sans Devanagari (or system) fonts, so those languages look plainer than the
Latin styles. Long German words are hyphenated by the browser and the headline shrinks to fit.

## Files

`index.html`, `style.css`, `app.js` and `qr.js` are all inlined by the server at render time.
`qr.js` is the MIT QR encoder from this repository's `guest-wifi` template, copied unchanged.
`locales/` holds the dashboard translations. `product.svg` is a placeholder product drawn for this template. `fonts/` holds the Archivo, Bitter,
Inter and Oswald latin subsets (SIL OFL 1.1, see `NOTICE`).

Licence: MIT (see `LICENSE`); bundled fonts OFL-1.1.
