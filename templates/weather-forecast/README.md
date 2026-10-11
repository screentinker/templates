# Weather forecast

Current conditions and a five-day forecast, laid out as a slide. The numbers come from one of your
own **Weather data sources** — your server fetches the weather (Open-Meteo by default, no key
needed) and the template only arranges it.

**Kind:** slide (declarative — no code runs). Works on every ScreenTinker player that shows slides.

![preview](thumbnail.png)

## Before you use it

Create a data source of type **Weather** (Data Sources → New → Weather) with your location, units
and language. Then pick it in this template's **Weather data source** setting. Units (°C/°F) and
day names follow the data source's settings.

## Settings

| Setting | Type | Default |
| --- | --- | --- |
| Weather data source | data source (required) | — |
| Location name | text (60) | `Local weather` |
| Temperature suffix | text (4) | `°` (use `°C` or `°F` if you prefer) |
| Feels-like / Humidity / Today / Precipitation / Updated label | text (24 / 24 / 16 / 32 / 24) | `Feels like` / `Humidity` / `Today` / `Chance of precipitation` / `Updated` |
| Accent / Background / Text colour | colour | `#6CC4F0` / `#0B1D2E` / `#FFFFFF` |
| Clock timezone / Language / Clock format | timezone / locale / select | the screen's own / 24-hour |

## How it reads the data

Every value is a `{{ds:<source>.<key>}}` reference, built from the chosen source as
`{{ds:{{param:weather}}.temperature}}`. It uses `icon`, `temperature`, `condition`,
`apparent_temperature`, `humidity`, `day0_high/low/precip_prob` (today) and `day1…day5`
`_name/_icon/_high/_low`, plus `updated`. The icons are the data source's emoji, drawn by the
player's own emoji font.

## Languages

The dashboard shows this template's name, description and every setting's label and help in English, German,
Spanish, French, Hindi, Italian, Japanese, Dutch, Portuguese and Chinese (`locales/<lang>.json`; a
server without translation support simply shows English). The words on the slide that are not weather data —
"Feels like", "Humidity", "Today", "Chance of precipitation" and "Updated" — are settings, and
start out in the dashboard's language (for example `Gefühlt`, `Luftfeuchte`, `Heute`,
`Niederschlagsrisiko`, `Aktualisiert` in German). The date follows the **Language** setting (empty =
the screen's language). The forecast day names come from the data source's own language setting; the
condition text ("Partly cloudy") is produced by the server's Weather data source and is currently
English only. The slide renderer's bundled fonts cover Latin; Japanese, Chinese and Hindi fall back to the screen's own
fonts (Noto on ScreenTinker players).

Licence: MIT (see `LICENSE`).
