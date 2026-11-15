# games-chanceitstudio

The SlimchanceGG hub at `games.chanceitstudio.com`: latest Shorts,
socials, Clipstack, and an arcade that keeps your best scores.

Vanilla HTML / CSS / JS. No framework, no build step.

## Clone

The arcade games and Clipstack are git submodules, each its own repo.
Clone with them:

```bash
git clone --recurse-submodules https://github.com/CjCrump/games-chanceitstudio.git
```

Already cloned without them:

```bash
git submodule update --init --recursive
```

Pull the latest of every game and Clipstack, then commit the new pointers:

```bash
git submodule update --remote
```

## Repo map

```
index.html              home: TV hero, clips, follow, Clipstack, arcade, footer
css/                    tokens (palette + fonts), space (wormhole bg), home
js/home.js              renders clips, follow cards, game cards
data/                   socials, clip links, youtube.js (generated daily)
scripts/                update-youtube.mjs, run by .github/workflows/youtube.yml
arcade/
  index.html            directory + play room (data-root="../")
  arcade.css
  app.js                boot + hash routing (#gameId)
  src/
    manifest.js         window.GAMES: add a game = one entry
    store.js            local-only profile, best scores, formatBest
    bridge.js           game -> hub postMessage, origin + frame checks
    achievements.js     rule registry
    views/              directory.js, play.js
  games/                submodules: snake, bullseye-aim-trainer, turtle-surf
clipstack/              submodule: CjCrump/clipstack
assets/                 brand art, wormhole, static sprite, thumbs, yt/
CONTRACT.md             the game <-> hub message spec
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Games need a real origin for the score
bridge, so `file://` is not enough for the arcade.

## Deploy

Cloudflare Pages project `slimchancegg-hub`, connected to `main`, output `/`.
Pages checks out submodules, so pushing a new submodule pointer redeploys
that game.

Build command (keeps repo tooling off the live site):

```bash
rm -rf scripts test .github
```

`_headers` sets the CSP and other security headers for the hub, the games
(`/arcade/games/*`) and Clipstack (`/clipstack/*`). Pages only reads the root
`_headers`, so the games' and Clipstack's own header rules live here.
What each header does is on `security.html`.

## Adding a game

1. Make the game its own repo with `hub-bridge.js` from `CONTRACT.md`.
2. `git submodule add https://github.com/CjCrump/<repo>.git arcade/games/<repo>`
3. Add one entry to `arcade/src/manifest.js` (`url: "games/<repo>/"`).
4. Drop a thumbnail in `assets/thumbs/`.
