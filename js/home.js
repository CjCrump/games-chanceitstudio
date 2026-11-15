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

  // Only links to the platforms we expect, and only https, so a typo in a data
  // file can't turn into a javascript: link.
  const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : '');

  const formatDate = (iso) => new Date(`${iso}T12:00:00`)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  function thumbImg(video) {
    const img = el('img');
    img.src = video.thumb;
    img.alt = '';
    img.loading = 'lazy';
    img.width = video.vertical ? 540 : 480;
    img.height = video.vertical ? 960 : 270;
    if (!video.vertical) img.className = 'wide';
    return img;
  }

  // One card per YouTube upload; extra platform links come from data/clips.js.
  function renderClips() {
    const grid = document.getElementById('clipGrid');
    const extra = window.CLIP_LINKS || {};
    for (const v of window.YOUTUBE?.gamer || []) {
      const li = el('li', 'clip-card static-hover');
      const body = el('div', 'clip-body');
      body.append(el('h3', '', v.title));
      const date = el('time', 'dim', formatDate(v.date));
      date.dateTime = v.date;
      body.append(date);
      const buttons = el('div', 'platforms');
      const links = { youtube: v.url, ...(extra[v.id] || {}) };
      for (const p of ['youtube', 'instagram', 'facebook', 'tiktok']) {
        const url = safeUrl(links[p]);
        if (url) buttons.append(link(url, `chip ${p}`, PLATFORM_LABEL[p], `Watch ${v.title} on ${PLATFORM_LABEL[p]}`));
      }
      body.append(buttons);
      li.append(thumbImg(v), body);
      grid.append(li);
    }
  }

  // Each follow card previews that channel's newest YouTube upload.
  function renderFollow() {
    const grid = document.getElementById('followGrid');
    for (const key of ['gamer', 'dev']) {
      const s = window.SOCIALS?.[key];
      if (!s) continue;
      const card = el('div', `follow-card ${key}`);
      const text = el('div', 'follow-text');
      text.append(el('p', 'follow-role', s.role), el('h3', '', s.name));
      const list = el('div', 'platforms');
      for (const l of s.links) {
        const url = safeUrl(l.url);
        if (url) list.append(link(url, `chip ${l.platform}`, l.label, `${s.name} on ${l.label}`));
      }
      text.append(list);
      card.append(text);
      const latest = window.YOUTUBE?.[key]?.[0];
      if (latest) {
        const a = link(latest.url, 'follow-latest static-hover', '', `Latest from ${s.name}: ${latest.title}`);
        a.append(thumbImg(latest), el('span', '', 'Latest'));
        card.append(a);
      }
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
