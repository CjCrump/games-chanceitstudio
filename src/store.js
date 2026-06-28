/* ==========================================================
   Player profile store — local-only (v1).

   The hub is the single source of truth. Everything lives in the hub's
   own localStorage (origin = games.chanceitstudio.com), so it persists
   across every embedded game.

   Designed as a thin interface (get/record/best) so a backend can slot
   in behind the same methods later without touching callers.
   ========================================================== */

window.Hub = window.Hub || {};

Hub.store = (function () {
  const KEY = "chanceit_profile_v1";
  const subscribers = [];
  let profile = null;

  function nowISO() { return new Date().toISOString(); }

  function fresh() {
    return { v: 1, games: {}, achievements: {}, meta: { firstSeen: nowISO(), totalPlays: 0 } };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      profile = raw ? JSON.parse(raw) : fresh();
    } catch {
      profile = fresh();
    }
    if (!profile || profile.v !== 1) profile = fresh();
    return profile;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch {}
    emit();
  }

  function emit() {
    for (const fn of subscribers) { try { fn(profile); } catch {} }
  }

  function ensureGame(id) {
    if (!profile.games[id]) {
      profile.games[id] = { plays: 0, best: null, lastPlayed: null };
    }
    return profile.games[id];
  }

  // v1 ranking: higher points wins (carries that run's accuracy/reactBest).
  function isBetter(candidate, current) {
    if (!current) return true;
    return (candidate.points ?? -1) > (current.points ?? -1);
  }

  return {
    init() { return load(); },
    getProfile() { return profile || load(); },

    countPlay(id) {
      const g = ensureGame(id);
      g.plays += 1;
      g.lastPlayed = nowISO();
      profile.meta.totalPlays += 1;
      save();
    },

    // payload: { mode, points, accuracy, reactBest }
    recordScore(id, payload) {
      const g = ensureGame(id);
      const candidate = {
        points: payload.points ?? 0,
        accuracy: payload.accuracy ?? null,
        reactBest: payload.reactBest ?? null,
        mode: payload.mode ?? null,
        date: nowISO(),
      };
      const isNewBest = isBetter(candidate, g.best);
      if (isNewBest) g.best = candidate;
      g.lastPlayed = candidate.date;
      save();
      return { best: g.best, isNewBest };
    },

    // payload: { name, ...details } — Phase 2 achievement rules read these.
    recordEvent(id, payload) {
      const g = ensureGame(id);
      g.lastPlayed = nowISO();
      g.lastEvent = payload && payload.name ? payload.name : null;
      save();
    },

    bestFor(id) { return profile.games[id]?.best || null; },
    playsFor(id) { return profile.games[id]?.plays || 0; },

    unlock(achId) {
      if (!profile.achievements[achId]) {
        profile.achievements[achId] = nowISO();
        save();
        return true;
      }
      return false;
    },
    hasAchievement(achId) { return !!profile.achievements[achId]; },

    subscribe(fn) {
      subscribers.push(fn);
      return () => {
        const i = subscribers.indexOf(fn);
        if (i > -1) subscribers.splice(i, 1);
      };
    },

    reset() { profile = fresh(); save(); },
  };
})();
