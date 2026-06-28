/* ==========================================================
   Directory view — grid of game cards.

   This is the plain placeholder for the wheel (Direction 2). The wheel
   is Phase 3; because routing/store/bridge are layout-agnostic, swapping
   this view out later touches nothing else.
   ========================================================== */

window.Hub = window.Hub || {};
Hub.views = Hub.views || {};

Hub.views.directory = {
  render(root) {
    const games = Hub.games.all();

    const cards = games.map((g) => {
      const best = Hub.store.bestFor(g.id);
      const plays = Hub.store.playsFor(g.id);
      const bestLine = best
        ? `${best.points} pts${best.accuracy != null ? ` · ${(best.accuracy * 100).toFixed(0)}%` : ""}${best.reactBest != null ? ` · ${best.reactBest}ms` : ""}`
        : "not played yet";
      const tags = (g.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
      return `
        <button class="card" data-id="${g.id}" aria-label="Play ${g.title}">
          <span class="card__thumb"><img src="${g.thumb}" alt="" /></span>
          <span class="card__body">
            <span class="card__title">${g.title}</span>
            <span class="card__blurb">${g.blurb}</span>
            <span class="card__tags">${tags}</span>
            <span class="card__best">
              <span class="card__best-k">Best</span>
              <span class="card__best-v">${bestLine}</span>
              ${plays ? `<span class="card__plays">${plays} play${plays === 1 ? "" : "s"}</span>` : ""}
            </span>
          </span>
        </button>`;
    }).join("");

    root.innerHTML = `
      <header class="hubhead">
        <div class="brand">
          <img class="brand__logo" src="assets/CIT-logo.png" alt="Chance IT Studio" />
          <span class="brand__tag">GAMES</span>
        </div>
        <div class="hubhead__hint">Pick a game to play</div>
      </header>

      <main class="grid" aria-label="Game directory">
        ${cards}
      </main>

      <footer class="foot">
        <span>games.chanceitstudio.com</span>
        <span>${games.length} game${games.length === 1 ? "" : "s"}</span>
      </footer>`;

    root.querySelectorAll(".card").forEach((el) => {
      el.addEventListener("click", () => { location.hash = el.dataset.id; });
    });
  },
};