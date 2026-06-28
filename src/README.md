# games-chanceitstudio

The hub for `games.chanceitstudio.com` — a directory that plays games
hosted on GitHub Pages inside an embedded field (fullscreen optional),
with a local-only player profile (cross-game high scores + achievements).

Vanilla HTML / CSS / JS. No framework, no build step.

## How it works

- Each game is its own repo, deployed to GitHub Pages, listed in
  `src/manifest.js`.
- The hub embeds the selected game in an `<iframe>` and owns fullscreen.
- Games report results up via `postMessage` (see `CONTRACT.md`); the hub
  stores the unified profile in its own `localStorage` and owns the
  achievement rules.

## Repo map

```
index.html            page shell + script order
styles.css            shared "Range Day" tokens + hub UI
app.js                boot + hash routing
src/
  manifest.js         window.GAMES — add a game = one entry
  store.js            player profile (local-only; swap-ready for a backend)
  bridge.js           game→hub message listener + origin validation
  achievements.js     rule registry + evaluate() (empty until Phase 2)
  views/
    directory.js      game grid (placeholder for the wheel, Phase 3)
    play.js           field-first play room + fullscreen + game switcher
assets/               favicon + game thumbnails
CONTRACT.md           the game↔hub message spec + drop-in snippet
```

## Run locally

It's static and uses plain `<script>` tags (not ES modules), so you can
just open it:

```bash
open index.html        # or double-click
```

`localStorage` on `file://` can be flaky across browsers; persistence is
reliable once deployed to a real origin.

## Deploy (Cloudflare Pages)

You're already on Cloudflare, so host the hub here:

1. Create a Pages project from this repo. No build command, no output dir —
   it's static.
2. In the Pages project's custom domains, add `games.chanceitstudio.com`
   (Cloudflare wires the DNS).

## Adding a game

1. Deploy the game to GitHub Pages.
2. Append one entry to `src/manifest.js` (`id`, `title`, `blurb`, `url`,
   `thumb`, `tags`, `fit`).
3. Drop a thumbnail in `assets/thumbs/`.
4. To feed scores/achievements, add the `hub-bridge.js` snippet from
   `CONTRACT.md` to that game.

## Status

- **Phase 1 (this):** manifest, store, bridge, routing, directory grid,
  play room, fullscreen. Bullseye listed.
- **Phase 2:** Bullseye emits results; achievement rules + unlock toasts.
- **Phase 3:** the wheel directory swaps in over the grid.
- **Later:** optional backend (cross-device), filters, more games.
