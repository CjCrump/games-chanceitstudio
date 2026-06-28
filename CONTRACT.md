# Game ↔ Hub contract (v1)

How a game reports results to the hub. The hub is the single source of
truth for scores and achievements; games only **emit facts** and the hub
decides what they mean.

## Messages (game → hub)

Sent with `postMessage` from inside the play-field iframe:

```js
{ src: "chanceit-game", v: 1, gameId: "bullseye", type: "ready" }
{ src: "chanceit-game", v: 1, gameId: "bullseye", type: "score",
  payload: { mode: "timed", points: 142, accuracy: 0.93, reactBest: 238 } }
{ src: "chanceit-game", v: 1, gameId: "bullseye", type: "event",
  payload: { name: "run_finished", mode: "timed" } }
```

- `ready` — game has loaded. Hub counts a play.
- `score` — a result worth ranking. `payload.points` is required; the rest
  is optional and carried with the best run.
- `event` — a named fact (e.g. `run_finished`). Phase 2 achievement rules
  read these.

## What the hub accepts

A message is processed only if **all** hold:

1. `data.src === "chanceit-game"`
2. `data.gameId` is a game in `src/manifest.js`
3. `event.origin` equals that game's URL origin in the manifest

Everything else is ignored. Cross-origin pages can only `postMessage` —
they can never call hub code directly.

## Drop-in snippet for a game (`hub-bridge.js`)

Add this file to a game repo and load it. It no-ops when the game is opened
standalone (not in an iframe), so it's safe to ship in both cases.

```js
(function () {
  if (window.parent === window) return;            // not embedded → no-op
  const GAME_ID = "bullseye";                       // set per game
  function send(type, payload) {
    parent.postMessage(
      { src: "chanceit-game", v: 1, gameId: GAME_ID, type, payload },
      "*"                                            // hub validates origin on receive
    );
  }
  window.HubBridge = {
    ready: () => send("ready"),
    score: (p) => send("score", p),
    event: (name, details) => send("event", { name, ...(details || {}) }),
  };
  HubBridge.ready();
})();
```

Then call it where the game already computes results. For Bullseye (Phase 2),
in `endGame("finished")`:

```js
window.HubBridge?.score({ mode: currentMode, points, accuracy: acc, reactBest: bestReaction() });
window.HubBridge?.event("run_finished", { mode: currentMode });
```

## Testing without a live game

Two ways to verify the pipe before a game emits for real:

- **Real path** — open the hub, navigate to `#bullseye`, open devtools and
  switch the console's execution context to the Bullseye iframe, then run:
  ```js
  parent.postMessage({src:"chanceit-game",v:1,gameId:"bullseye",type:"score",
    payload:{mode:"timed",points:120,accuracy:0.9,reactBest:240}}, "*");
  ```
  `event.origin` is the game's origin, so it passes validation.

- **Quick path** — from the hub's own console (skips origin check, for
  testing only):
  ```js
  Hub.bridge.simulate("bullseye","score",{mode:"timed",points:120,accuracy:0.9,reactBest:240});
  Hub.store.getProfile();   // → best recorded under games.bullseye
  ```
