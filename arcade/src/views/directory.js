/* ==========================================================
   Directory view: grid of game cards with your best score on each.
   Routing, store and bridge don't care how this looks, so the layout
   can change without touching anything else.
   ========================================================== */

window.Hub = window.Hub || {};
Hub.views = Hub.views || {};

Hub.views.directory = {
  render(root) {
    const games = Hub.games.all();

    const cards = games.map((g) => {
      const best = Hub.formatBest(Hub.store.bestFor(g.id)) || "Not played yet";
      const plays = Hub.store.playsFor(g.id);
      const tags = (g.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
      return `
        <li>
          <a class="card static-hover" href="#${g.id}" aria-label="Play ${g.title}. Your best: ${best}">
            <span class="card__thumb"><img src="${Hub.asset(g.thumb)}" alt="" /></span>
            <span class="card__body">
              <span class="card__title">${g.title}</span>
              <span class="card__blurb">${g.blurb}</span>
              <span class="card__tags">${tags}</span>
              <span class="card__best">
                <span class="card__best-k">Your best</span>
                <span class="card__best-v">${best}</span>
                ${plays ? `<span class="card__plays">${plays} play${plays === 1 ? "" : "s"}</span>` : ""}
              </span>
            </span>
          </a>
        </li>`;
    }).join("");

    root.innerHTML = `
      <header class="hubhead">
        <a class="hubhead__home" href="../"><img src="../assets/brand/lockup.png" alt="Slim Chance home" width="1858" height="608" /></a>
        <h1 class="hubhead__title">Arcade</h1>
        <p class="hubhead__hint">Pick a game. Your best scores save in this browser.</p>
      </header>

      <main>
        <ul class="grid" aria-label="Games">${cards}</ul>
      </main>

      <footer class="foot">
        <a href="../">Back to SlimChance</a>
        <span>${games.length} game${games.length === 1 ? "" : "s"}</span>
      </footer>`;
  },
};
