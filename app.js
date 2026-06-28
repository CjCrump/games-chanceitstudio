/* ==========================================================
   Boot + routing.

   Boot order: manifest → store → bridge → render.
   Routing (hash-based, works on any static host, back button intact):
     ""        → directory grid
     "#id"     → play room (if id is a known game)
     "#junk"   → redirect to directory
   ========================================================== */

(function () {
  const root = document.getElementById("app");

  function currentId() {
    return (location.hash || "").replace(/^#/, "").trim();
  }

  function route() {
    const id = currentId();
    document.body.dataset.view = id ? "play" : "directory";

    if (!id) {
      Hub.views.directory.render(root);
      return;
    }
    if (Hub.games.byId(id)) {
      Hub.views.play.render(root, id);
      return;
    }
    // Unknown route → fall back to directory without adding history noise.
    location.replace("#");
  }

  // Boot
  Hub.store.init();
  Hub.bridge.init();

  // Re-render the directory live when the profile changes (e.g. new best),
  // but leave an active play session untouched.
  Hub.store.subscribe(() => {
    if (!currentId()) Hub.views.directory.render(root);
  });

  window.addEventListener("hashchange", route);
  route();
})();
