// Pulls the newest Shorts from each YouTube channel with the YouTube Data API,
// saves their thumbnails into assets/yt/, and writes data/youtube.js for the home page.
// Every channel has a hidden Shorts-only playlist: "UUSH" + the channel ID minus "UC".
// (YouTube's public RSS feeds return 404 to GitHub's servers, so they can't be used.)
// Needs the YOUTUBE_API_KEY secret. Each run costs 2 of the free 10,000 daily units.
// Run by .github/workflows/youtube.yml once a day. Visitors never contact YouTube:
// the site only serves the files this script saved.
//
// Local test without the network:  FIXTURES=test/fixtures node scripts/update-youtube.mjs

import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// id: the channel's UC... ID (YouTube Studio > Settings > Channel > Advanced settings).
// With the ID set, the script never has to load the channel page, which YouTube
// sometimes blocks from GitHub's servers. Leave id empty and it tries the page.
const CHANNELS = [
  { key: 'gamer', handle: 'SlimchanceGG', id: 'UCUQUHP2QRVr8l08kyaiMHaQ' },
  { key: 'dev', handle: 'chanceitstudio', id: 'UCoutoHiFvQNi0ZMEBHokZAA' },
];
const KEEP = 12; // newest Shorts kept per channel
const THUMB_DIR = 'assets/yt';
const OUT_FILE = 'data/youtube.js';
const FIXTURES = process.env.FIXTURES; // folder of saved responses for offline tests
const API_KEY = process.env.YOUTUBE_API_KEY || '';

const ID_RE = /^[A-Za-z0-9_-]{11}$/; // every YouTube video ID has this shape
const CHANNEL_RE = /^UC[A-Za-z0-9_-]{22}$/;

async function get(url, as = 'text') {
  if (FIXTURES) {
    const name = url.replace(/[?&]key=[^&]*/, '').replace(/^https?:\/\//, '').replace(/[^A-Za-z0-9.]+/g, '_');
    const data = await readFile(join(FIXTURES, name)).catch(() => null);
    if (!data) return null;
    return as === 'text' ? data.toString('utf8') : data;
  }
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) slimchance-hub-updater',
      'accept-language': 'en-US,en;q=0.9',
      cookie: 'CONSENT=YES+1; SOCS=CAI', // skip the EU cookie-consent page
    },
  });
  if (!res.ok) {
    console.log(`  ${res.status} from ${url.replace(API_KEY || '\u0000', '***')}`);
    return null;
  }
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

// The handle page contains the channel ID; the RSS feed needs the ID, not the handle.
async function channelId({ handle, id: fixed }) {
  if (fixed) {
    if (!CHANNEL_RE.test(fixed)) throw new Error(`channel ID for @${handle} looks wrong: ${fixed}`);
    return fixed;
  }
  const html = await get(`https://www.youtube.com/@${handle}`);
  // the canonical link and externalId always point at this channel; a bare
  // "channelId" can belong to another channel shown on the page, so it's last
  const id = html?.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/)?.[1]
    ?? html?.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/)?.[1]
    ?? html?.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/)?.[1];
  if (id) console.log(`  @${handle} -> ${id}`);
  if (!id || !CHANNEL_RE.test(id)) throw new Error(`could not find the channel ID for @${handle}`);
  return id;
}

// The channel's Shorts playlist, newest first. Returns [{ id, title, published }].
async function listShorts(channelId) {
  const playlist = `UUSH${channelId.slice(2)}`;
  const url = 'https://www.googleapis.com/youtube/v3/playlistItems' +
    `?part=snippet&maxResults=${KEEP}&playlistId=${playlist}&key=${encodeURIComponent(API_KEY)}`;
  const json = await get(url);
  if (!json) throw new Error(`YouTube API refused the Shorts list (playlist ${playlist})`);
  const data = JSON.parse(json);
  return (data.items || []).map((it) => ({
    id: it.snippet?.resourceId?.videoId,
    title: it.snippet?.title ?? '',
    published: it.snippet?.publishedAt ?? '',
    fallbackThumb: it.snippet?.thumbnails?.high?.url ?? '',
  })).filter((v) => ID_RE.test(v.id ?? '') && v.title !== 'Private video' && v.title !== 'Deleted video');
}

// Shorts usually have a vertical "oar2" thumbnail; use it when it exists.
async function saveShortThumb(id) {
  const img = await get(`https://i.ytimg.com/vi/${id}/oar2.jpg`, 'buffer');
  if (!img || img.length < 2000) return false;
  await writeFile(join(THUMB_DIR, `${id}.jpg`), img);
  return true;
}

async function main() {
  if (!API_KEY && !FIXTURES) throw new Error('YOUTUBE_API_KEY is not set (add it under repo Settings > Secrets > Actions)');
  await mkdir(THUMB_DIR, { recursive: true });
  const previous = await loadPrevious();
  const out = {};
  const keep = new Set();
  let failures = 0;

  for (const ch of CHANNELS) {
    let shorts = [];
    try {
      shorts = await listShorts(await channelId(ch));
    } catch (err) {
      // one channel failing keeps its last good list instead of wiping it
      // ::warning:: makes GitHub show a yellow warning on the run instead of hiding it
      console.log(`::warning::@${ch.handle}: ${err.message}`);
      failures++;
      out[ch.key] = previous[ch.key] || [];
      for (const v of out[ch.key]) keep.add(v.thumb.split('/').pop());
      continue;
    }
    out[ch.key] = [];
    for (const v of shorts) {
      if (out[ch.key].length >= KEEP) break;
      // vertical thumbnail if YouTube has one, otherwise the playlist's 16:9 one
      let vertical = await saveShortThumb(v.id);
      if (!vertical) {
        const img = /^https:\/\/i\.ytimg\.com\//.test(v.fallbackThumb) ? await get(v.fallbackThumb, 'buffer') : null;
        if (!img) {
          console.log(`  skipped (no thumbnail): ${v.title}`);
          continue;
        }
        await writeFile(join(THUMB_DIR, `${v.id}.jpg`), img);
      }
      keep.add(`${v.id}.jpg`);
      out[ch.key].push({
        id: v.id,
        title: v.title.slice(0, 120),
        date: v.published.slice(0, 10),
        url: `https://youtube.com/shorts/${v.id}`,
        thumb: `${THUMB_DIR}/${v.id}.jpg`,
        vertical,
      });
    }
    console.log(`@${ch.handle}: ${out[ch.key].length} Shorts`);
  }

  // drop thumbnails of videos that fell off the feed
  for (const f of await readdir(THUMB_DIR)) if (!keep.has(f)) await unlink(join(THUMB_DIR, f));

  const body = `// Generated by scripts/update-youtube.mjs. Don't edit by hand; it gets overwritten.\n` +
    `window.YOUTUBE = ${JSON.stringify(out, null, 2)};\n`;
  await writeFile(OUT_FILE, body);
  if (failures === CHANNELS.length) throw new Error('every channel failed; kept the old data');
}

// Last good data, so a failed channel doesn't empty its section on the site.
async function loadPrevious() {
  const js = await readFile(OUT_FILE, 'utf8').catch(() => '');
  const json = js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1);
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
