// Home page: fills the clip grid, follow cards and arcade cards from the data files.
// Everything is built with textContent, never innerHTML, so data can't inject markup.

(() => {
  const PLATFORM_LABEL = { youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  const link = (href, cls, text, label) => {
    const a = el('a', cls, text);
    a.href = href;
    if (label) a.setAttribute('aria-label', label);
    return a;
  };

  function renderClips() {
    const grid = document.getElementById('clipGrid');
    for (const clip of window.CLIPS || []) {
      const li = el('li', 'clip-card static-hover');
      const img = el('img');
      img.src = clip.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 540;
      img.height = 960;
      const body = el('div', 'clip-body');
      body.append(el('h3', '', clip.title));
      const date = el('time', 'dim', new Date(`${clip.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      date.dateTime = clip.date;
      body.append(date);
      const buttons = el('div', 'platforms');
      for (const [p, url] of Object.entries(clip.links || {})) {
        if (url) buttons.append(link(url, `chip ${p}`, PLATFORM_LABEL[p] || p, `Watch ${clip.title} on ${PLATFORM_LABEL[p] || p}`));
      }
      body.append(buttons);
      li.append(img, body);
      grid.append(li);
    }
  }

  function renderFollow() {
    const grid = document.getElementById('followGrid');
    for (const key of ['gamer', 'dev']) {
      const s = window.SOCIALS?.[key];
      if (!s) continue;
      const card = el('div', `follow-card ${key}`);
      card.append(el('p', 'follow-role', s.role), el('h3', '', s.name));
      const list = el('div', 'platforms');
      for (const l of s.links) list.append(link(l.url, `chip ${l.platform}`, l.label, `${s.name} on ${l.label}`));
      card.append(list);
      grid.append(card);
    }
  }

  function renderGames() {
    const grid = document.getElementById('gameGrid');
    for (const g of window.GAMES || []) {
      const li = el('li', 'game-card static-hover');
      const a = link(`arcade/#${encodeURIComponent(g.id)}`, 'game-link');
      const img = el('img');
      img.src = g.thumb;
      img.alt = '';
      img.loading = 'lazy';
      a.append(img, el('h3', '', g.title), el('p', 'dim', g.blurb));
      li.append(a);
      grid.append(li);
    }
  }

  renderClips();
  renderFollow();
  renderGames();
})();
