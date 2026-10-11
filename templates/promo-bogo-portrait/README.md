# Buy one get one promo (portrait)

A loud, friendly buy-one-get-one screen for a café, bakery or shop. The offer is set in three big lines ("Buy one, / get one / FREE"), with what it applies to and a detail line underneath, a picture on a coloured panel with a round "2 for 1" sticker, and a live countdown to the last day.

**Kind:** slide (declarative — no code runs). Works on every ScreenTinker player that shows slides.
**Shape:** portrait 9:16, for a screen mounted on its side (1080×1920). The same design in landscape is
[`promo-bogo`](../promo-bogo/). On a zone of another shape the player letterboxes the slide rather than
stretching it, so in a thin strip it shows small and centred: use an info strip or ticker template there.
**Network:** none. **Data source:** none — everything is typed into the settings.

Part of the promo pack: `promo-price-drop`, `promo-bogo`, `promo-new-arrival` and `promo-happy-hour`, each in
landscape and portrait, sharing the same logo and store-name settings so a playlist of them looks like one campaign.

![preview](thumbnail.png)

## Settings

| Setting | Type | Default | What it does |
| --- | --- | --- | --- |
| Logo | image | bundled `logo.svg` | Top left. The bundled badge is a placeholder for the fictional "Northwind" stores: replace it with your own (a square-ish PNG or SVG). |
| Show the logo | checkbox | on | Off hides the logo (an empty logo setting with this on shows a faint dashed box). |
| Store name | text (22) | `NORTHWIND` | Shown beside the logo. Leave empty if your logo already includes the name. |
| Small heading | text (30) | `THIS WEEK ONLY` |  |
| Offer, first line | text (10) | `Buy one,` | The offer is set in three big lines, one line each, e.g. "Buy two," / "get one" / "HALF OFF". |
| Offer, second line | text (10) | `get one` |  |
| Offer, third line (accent) | text (8) | `FREE` | The biggest line, so at most 8 characters: FREE, HALF OFF, 50% OFF. |
| What it applies to | text (30) | `Any latte, flat white or mocha` |  |
| Detail line | text (100) | a sample line |  |
| Round sticker | text (8) | `2 FOR 1` | Short — two words at most. Leave empty for a plain dot. |
| Product picture | image | bundled `coffee.svg` | A cut-out PNG or SVG with a transparent background looks best; a photo works too. It is fitted inside its box, never cropped. |
| Show the product picture | checkbox | on | Off hides the picture. (An empty picture setting with this on shows a faint dashed box, which is how the slide renderer marks a missing image.) |
| Show the countdown | checkbox | on | Turn off for an offer with no end date: the label and timer both disappear. |
| Label above the countdown | text (20) | `LIMITED TIME` | It stays after the offer ends, so pick words that read well with the end message too. |
| Offer ends at | text (40) | `2026-12-31T18:00:00+00:00` | When the timer reaches zero. **Format below.** |
| Shown when the countdown ends | text (18) | `Ending soon` | Replaces the numbers once the end time has passed. |
| Language | locale | empty | The language of the live countdown, e.g. de or fr-CA. Leave empty for the screen’s language. Your own text is shown exactly as you type it. |
| Small print | text (140) | a sample line |  |
| Accent colour | color | `#E4472B` | The picture panel and the third offer line. |
| Sticker colour | color | `#FFC24B` |  |
| Text on the panel | color | `#FFF3E2` | The store name, which sits on the accent panel. |
| Background colour | color | `#FFF3E2` |  |
| Text colour | color | `#2E1A12` | Headlines and body text. |
| Background photo | image | none | Optional photo behind everything. |
| Darken the photo | number 0–0.9 | `0.2` | A black scrim over the photo so the text stays readable. Ignored without a photo. |

All text is shown exactly as you type it, so prices, currency signs and dates are written the way
your customers read them (`$179`, `179 €`, `£179.99`, `Avant 249,00 €`) — nothing is translated or
reformatted.

### The countdown

**Offer ends at** takes **ISO 8601 with a timezone offset**:

- `2026-11-01T23:59:00+00:00` — one minute to midnight in London (winter), or write `…Z`
- `2026-11-01T23:59:00-05:00` — the same wall-clock time in New York (winter)
- `2026-07-04T18:00:00-04:00` — 6 pm in New York during daylight saving time

Use the offset **in force on that date**. Without an offset the time is read in the ScreenTinker
server's timezone (often UTC). An empty or unreadable value leaves the timer blank and nothing else
changes. The numbers read `12d 7h 50m` while days remain, then `5h 12m 30s`, then `4m 05s`. The
countdown element is handed the **Language** setting, so a server that localises countdowns shows those
units in the screen's language; an older server ignores it and keeps the format above. The timer runs on
each screen's own clock, so keep players on NTP.

When the end time passes, the numbers are replaced by **Shown when the countdown ends**, and the label
above stays. The defaults (`LIMITED TIME` / `Ending soon`) are chosen to read sensibly
both ways. Remember to take the slide out of the playlist (or schedule it) when the offer is over.

## Languages

The settings page is translated into `de`, `es`, `fr`, `hi`, `it`, `ja`, `nl`, `pt`, `zh` (`locales/<lang>.json`; English
in `manifest.json` is the source and the fallback). A server that reads these files shows the setting
names, help and options in the operator's language, and **pre-fills the text settings with translated
sample text** — prices in the local currency and idiomatic short signage lines, each checked against the
setting's maximum length and rendered in German, Japanese and Hindi to make sure it fits. Older servers
ignore the folder and show English; the slide works the same either way.

Every word on the slide is a setting, so the slide shows whatever language you type. The live countdown
is handed **Language** too (see *The countdown*). The bundled slide fonts are Latin-only; Japanese,
Chinese and Hindi text is drawn in the player's system fallback font (for example Noto Sans CJK or Noto
Sans Devanagari), so it renders, in a different typeface. A player with no CJK or Devanagari font at all
shows boxes for those characters. Brand and sample product names (Northwind, Harbour,
Studio Pro) are kept in every language.

## Tips

- Every text setting has a maximum length, and the layout is drawn so that text at that maximum still
  fits without running into the next line (checked with long, wide words in both orientations).
  Slide text boxes do not shrink to fit, so the maximum is the guard: if a word will not fit, shorten it
  rather than looking for a way around it. Short big lines read best from across a room anyway.
- Colours: the defaults are tuned for contrast. If you change the background, check the accent and
  text colours still read from across the room.
- A background photo goes behind the whole slide (the coloured picture panel stays on top of it); raise **Darken the photo** until the
  text is comfortable to read.

## Files

- `locales/` — translations of the settings page (see Languages)
- `template.json` — the slide (`template` = layout, `fields` = the words), with `{{param:…}}` placeholders
- `logo.svg` — placeholder badge, original work, MIT (see `NOTICE`)
- `coffee.svg` — sample product picture, original work, MIT (see `NOTICE`)
- `thumbnail.png` — catalog preview

Licence: MIT (see `LICENSE`).
