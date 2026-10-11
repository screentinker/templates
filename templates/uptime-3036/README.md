# UPTIME 3036

An original first-person arcade shooter in the Wolfenstein/DOOM tradition, set on the worst on-call
shift of the year 3036: every server in the datacenter is down, and the floors are crawling with bugs.

- **Autopilot demo.** With nobody playing, a bot works the floors: fixes bugs, grabs coffee and patch
  drives, takes the service lift up. Built for a lobby, an event stand, a helpdesk waiting area.
- **Play.** Click the screen (or give it keyboard focus), then press any key.
  - Move: ↑ ↓ or W / S. Turn: ← → or Q / E. Strafe: A / D.
  - Fire a patch: Space, Ctrl or F. Back to the demo: Esc.
  - Coffee restores uptime; patch drives refill the patch gun. Take the lift (green arrow) to the
    next floor — every floor has more bugs.
- **Hands back.** After the idle time with no input the autopilot takes over again.
- **Trailer intro.** A ScreenTinker cold open plays on start and between games.
- **Everything is generated in code** — server racks, patch panels, bugs, the building itself. No
  images, fonts or sounds are bundled and nothing is fetched. Every run is a different datacenter.

Options: title and tagline, two neon colours, difficulty, render resolution, CRT scanlines,
whether it is playable at all, and the language.

## Languages

Every word the game draws — the HUD, the floor messages, "press any key", the controls line and the
trailer cards — follows the **Language** setting (empty = the player's own language), in English,
German, Spanish, French, Hindi, Italian, Japanese, Dutch, Portuguese and Simplified Chinese
(`strings.js`), falling back to English; numbers and percentages go through `Intl`. Lines are
shrunk to fit the screen, so long German words never run off the edge. The title and tagline are
your own text; the dashboard offers a translated default tagline and translated settings from
`locales/<lang>.json` (servers that do not know that file ignore it). Japanese, Chinese and
Devanagari text uses the player's Noto fonts (nothing is bundled).

## Changes

- **1.1.0** — translatable: a Language setting, every on-screen word per language, translated
  settings (`locales/`).

Licence: MIT (see LICENSE). The ScreenTinker mark in the intro is drawn in code by ScreenTinker.
