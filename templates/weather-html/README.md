# Weather — animated

A full-screen weather scene. The sky, drifting clouds, rain, snow, fog or lightning follow the
current conditions (and go dark at night), with the current reading, feels-like, humidity, wind and
rain chance, and a five-day forecast whose bars share one temperature scale so the week reads at a
glance.

**Kind:** html (code, reviewed). **Network:** none. It reads `ST.data.weather`, which your server
fills from your own Weather data source — the template never talks to a weather service.

![preview](thumbnail.png)

## Before you use it

Create a data source of type **Weather** (Data Sources → New → Weather) and pick it in the
**Weather data source** setting. Units and the place name come from the data source.
Until its first sync the template shows "Waiting for weather data".

## Settings

| Setting | Type | Default |
| --- | --- | --- |
| Weather data source | data source (required) | — |
| Location name | text (60) | empty = the data source's place name |
| Background | Follows the weather / Solid colour | Follows the weather |
| Solid background colour | colour | `#0E1A2B` |
| Accent colour | colour | `#FFD166` |
| Animate the scene | checkbox | on — turn off on very low-powered players |
| Show the clock | checkbox | on |
| Clock timezone | timezone | the screen's own |
| Language | locale | empty = the screen's language |

## Languages

Everything on screen follows the **Language** setting (empty = the player's own language): the
date and clock, the day names (formatted from each forecast day's date), numbers, percentages and
wind speed (`Intl`), the condition (translated from its WMO weather code), and the fixed words —
Feels like, Humidity, Wind, Rain/Snow and the "Waiting for weather data" notice — in English,
Danish, German, Spanish, French, Hindi, Italian, Japanese, Dutch, Portuguese and Simplified Chinese; any
other language falls back to English words with that language's dates and numbers. The settings
themselves are translated for the dashboard in `locales/<lang>.json` (servers that do not know
that file ignore it). The bundled Inter is Latin-only; Japanese, Chinese and Devanagari use the
player's Noto fonts.

## Files

`index.html`, `style.css`, `app.js`, `strings.js` (the on-screen words per language), `locales/`
(the settings, translated); `fonts/inter.woff2` (SIL OFL 1.1, see `NOTICE`). Icons are
drawn in code — no image files, no emoji font needed.

## Changes

- **1.2.0** — Danish (requested in screentinker/screentinker#667): the fixed words and every
  weather condition.
- **1.1.0** — translatable: a Language setting for every word, date and number on screen, the
  condition and day names in that language, and translated settings (`locales/`).
- **1.0.0** — first release.

Licence: MIT (see `LICENSE`); bundled font OFL-1.1.
