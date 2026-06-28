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
    const ratioStyle = game.fit && game.fit !== "fill"
      ? `style="aspect-ratio:${game.fit.replace(":", "/")}"`
      : "";

    root.innerHTML = `
      <div class="playroom">
        <header class="playbar">
          <button class="btn btn--ghost" id="backBtn" aria-label="Back to all games">← All games</button>
          <div class="playbar__title">${game.title}</div>
          <div class="playbar__actions">
            ${multi ? `
              <button class="iconbtn" id="prevBtn" title="Previous game (${prev.title})" aria-label="Previous game">‹</button>
              <button class="iconbtn" id="nextBtn" title="Next game (${next.title})" aria-label="Next game">›</button>
            ` : ""}
            <button class="btn btn--primary" id="fsBtn" aria-label="Fullscreen">Fullscreen</button>
          </div>
        </header>

        <div class="field-wrap" id="fieldWrap">
          <div class="field ${fitClass}" ${ratioStyle}>
            <iframe
              id="gameFrame"
              src="${game.url}"
              title="${game.title}"
              allow="fullscreen; autoplay; gamepad"
              loading="eager"
            ></iframe>
          </div>
        </div>
      </div>`;

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
