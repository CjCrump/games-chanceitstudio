/* ==========================================================
   Play room (Direction 2) — field-first.

   Top bar: ← All games · title · prev/next switcher · Fullscreen.
   Below: the embedded game iframe filling the rest.

   Fullscreen is hub-owned: we fullscreen the FIELD CONTAINER (the iframe's
   wrapper), and we also pass allow="fullscreen" so a game COULD trigger it
   itself if it ever wants to.
   ========================================================== */

window.Hub = window.Hub || {};
Hub.views = Hub.views || {};

Hub.views.play = {
  render(root, gameId) {
    const game = Hub.games.byId(gameId);
    if (!game) { location.hash = ""; return; }

    const games = Hub.games.all();
    const i = Hub.games.index(gameId);
    const prev = games[(i - 1 + games.length) % games.length];
    const next = games[(i + 1) % games.length];
    const multi = games.length > 1;

    const fitClass = game.fit && game.fit !== "fill" ? "field--ratio" : "field--fill";

    root.innerHTML = `
      <div class="playroom">
        <header class="playbar">
          <button class="btn btn--ghost" id="backBtn" aria-label="Back to all games">← All games</button>
          <div class="playbar__title">
            <h1>${game.title}</h1>
            <span class="playbar__best" id="bestLine"></span>
          </div>
          <div class="playbar__actions">
            ${multi ? `
              <button class="iconbtn" id="prevBtn" title="Previous game (${prev.title})" aria-label="Previous game">‹</button>
              <button class="iconbtn" id="nextBtn" title="Next game (${next.title})" aria-label="Next game">›</button>
            ` : ""}
            <button class="btn btn--primary" id="fsBtn" aria-label="Fullscreen">Fullscreen</button>
          </div>
        </header>

        <div class="field-wrap" id="fieldWrap">
          <div class="field ${fitClass}">
            <iframe
              id="gameFrame"
              src="${Hub.games.urlOf(gameId)}"
              data-game-id="${game.id}"
              title="${game.title}"
              allow="fullscreen; autoplay; gamepad"
              loading="eager"
            ></iframe>
          </div>
        </div>
      </div>`;

    // live "Your best" line; the store notifies us when the game reports a score
    // set via CSSOM, not a style="" attribute, so the CSP can block inline styles
    if (game.fit && game.fit !== "fill") root.querySelector(".field").style.aspectRatio = game.fit.replace(":", "/");
    const bestLine = root.querySelector("#bestLine");
    const showBest = () => {
      bestLine.textContent = `Your best: ${Hub.formatBest(Hub.store.bestFor(gameId)) || "none yet"}`;
    };
    showBest();
    if (Hub.views.play._unsub) Hub.views.play._unsub();
    Hub.views.play._unsub = Hub.store.subscribe(showBest);

    root.querySelector("#backBtn").addEventListener("click", () => { location.hash = ""; });
    if (multi) {
      root.querySelector("#prevBtn").addEventListener("click", () => { location.hash = prev.id; });
      root.querySelector("#nextBtn").addEventListener("click", () => { location.hash = next.id; });
    }

    const fieldWrap = root.querySelector("#fieldWrap");
    root.querySelector("#fsBtn").addEventListener("click", () => {
      const el = fieldWrap;
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      }
    });
  },
};
