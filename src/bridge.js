/* ==========================================================
   Message bridge — receives the game→hub contract.

   A game, embedded in the play field, postMessages results up to the
   hub. We accept a message only if ALL of these hold:
     • data.src === "chanceit-game"
     • data.gameId is a known game in the manifest
     • event.origin === that game's GitHub Pages origin

   Anything else is ignored. Cross-origin pages can only postMessage —
   they can never call hub functions directly.

   Contract (v1):
     { src:"chanceit-game", v:1, gameId, type:"ready" }
     { src:"chanceit-game", v:1, gameId, type:"score", payload:{mode,points,accuracy,reactBest} }
     { src:"chanceit-game", v:1, gameId, type:"event", payload:{name, ...} }
   ========================================================== */

window.Hub = window.Hub || {};

Hub.bridge = (function () {
  function handle({ gameId, type, payload }) {
    if (type === "ready") {
      Hub.store.countPlay(gameId);
    } else if (type === "score") {
      Hub.store.recordScore(gameId, payload || {});
    } else if (type === "event") {
      Hub.store.recordEvent(gameId, payload || {});
    } else {
      return;
    }

    // Achievement seam — empty in Phase 1, so nothing unlocks yet.
    const profile = Hub.store.getProfile();
    const newly = Hub.achievements.evaluate(profile, { gameId, type, payload });
    newly.forEach((id) => {
      if (Hub.store.unlock(id)) console.info("[hub] achievement unlocked:", id);
      // Phase 2: toast here.
    });
  }

  function onMessage(e) {
    const d = e.data;
    if (!d || d.src !== "chanceit-game" || !d.gameId) return;
    if (!Hub.games.byId(d.gameId)) return;            // unknown game
    if (e.origin !== Hub.games.originOf(d.gameId)) return; // origin must match manifest
    handle(d);
  }

  return {
    init() {
      window.addEventListener("message", onMessage);
    },

    /* Console testing helper (same-origin only — cross-origin code can't
       reach this). Skips the origin check so you can verify the pipe
       before a game emits for real:
         Hub.bridge.simulate("bullseye","score",{mode:"timed",points:120,accuracy:0.9,reactBest:240})
       The real listener above still enforces origin on actual messages. */
    simulate(gameId, type, payload) {
      handle({ gameId, type, payload });
      return Hub.store.getProfile();
    },
  };
})();
