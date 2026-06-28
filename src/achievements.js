/* ==========================================================
   Achievement registry — the hub owns the rules; games never know
   what an achievement is. They just emit facts; this decides meaning.

   Phase 1: the seam is live but the registry is empty, so evaluate()
   unlocks nothing. Phase 2 fills `defs` and adds toast UI.

   def shape (Phase 2):
     { id, gameId: "bullseye"|null, title, desc,
       test: (profile, ctx) => boolean }
   ctx = { gameId, type, payload } from the message that triggered eval.
   ========================================================== */

window.Hub = window.Hub || {};

Hub.achievements = {
  defs: [], // Phase 2: seed ~5-6 (per-game skill, completion, completionist, meta)

  // Returns ids newly satisfied this evaluation (not yet unlocked).
  evaluate(profile, ctx) {
    const newly = [];
    for (const a of this.defs) {
      if (profile.achievements[a.id]) continue;
      try {
        if (a.test(profile, ctx)) newly.push(a.id);
      } catch {}
    }
    return newly;
  },
};
