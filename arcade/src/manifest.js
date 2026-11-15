/* ==========================================================
   Game registry — the single source of truth for the hub.
   Add a game by appending one object. Nothing else changes.

   Loaded as a plain script (not JSON) so the hub works on file://
   with no server. Swap to fetched JSON later if you ever want pure data.
   ========================================================== */

window.GAMES = [
  {
    id: "bullseye",                                       // also the hash route: #bullseye
    title: "Bullseye",
    blurb: "Aim trainer · timed + tracking",
    url: "games/bullseye-aim-trainer/",                    // git submodule, relative to arcade/
    thumb: "assets/thumbs/bullseye.svg",
    tags: ["aim", "fps"],
    fit: "fill",                                          // "fill" | "16:9" | "4:3"
  },
  {
    id: "lightsnake",
    title: "Light Snake",
    blurb: "Neon dragon · eat the orbs",
    url: "games/snake/",
    thumb: "assets/thumbs/lightsnake.svg",
    tags: ["arcade", "snake"],
    fit: "fill",
  },
  {
    id: "turtlesurf",
    title: "Turtle Surf",
    blurb: "Ocean flapper · glide the reef",
    url: "games/turtle-surf/",
    thumb: "assets/thumbs/turtlesurf.svg",
    tags: ["arcade", "flappy"],
    fit: "fill",
  },
];

/* Lookup helpers (kept here so views/bridge don't each rebuild them). */
window.Hub = window.Hub || {};
Hub.games = {
  all: () => window.GAMES,
  byId: (id) => window.GAMES.find((g) => g.id === id) || null,
  index: (id) => window.GAMES.findIndex((g) => g.id === id),
  // Games are git submodules served from this site, so their origin is ours.
  // URLs in the manifest are relative to arcade/; resolve against that folder.
  urlOf: (id) => {
    const g = Hub.games.byId(id);
    return g ? new URL(g.url, Hub.arcadeBase).href : null;
  },
  originOf: (id) => {
    try { return new URL(Hub.games.urlOf(id)).origin; } catch { return null; }
  },
};

// Pages outside arcade/ (the home page) set data-root on <html> so asset paths
// like thumbnails resolve from the site root either way.
Hub.root = document.documentElement.dataset.root || "";
Hub.asset = (path) => `${Hub.root}${path}`;
Hub.arcadeBase = new URL(`${Hub.root}arcade/`, location.href).href;
