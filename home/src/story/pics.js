/*
  Every picture of the story, by its path in public/ ('story/girl-sit.webp', 'tv/1.webp').

  On the live site (vite.config.js, the "pictures" plugin) the pictures arrive in as few requests as possible, which
  matters on Vercel's free plan (it counts every request):
    - inline: the first scene's three cut-outs and the H2S logo come inside the page's script, ready at once;
    - packs[0]: the pictures of the next few scenes, one file, fetched a moment after the page opens;
    - packs[1]: everything else, one file, fetched once the visitor starts scrolling (someone who only looks at
      the first screen never downloads it).
  Each picture in a pack becomes a local blob: address and is decoded ahead, so nothing decodes mid-scroll. A picture
  asked for before its pack has arrived (or in dev, where there are no packs) simply loads on its own from public/.
  Once a picture has an address it keeps it, so nothing on screen reloads.
*/
import PICS from 'virtual:pictures'; // { inline: { path: data URI }, packs: [{ url, files: { path: [start, length] } }] }, or null in dev

const BASE = import.meta.env.BASE_URL;
const local = {}; // path -> blob: address, once its pack is in
const given = {}; // path -> the address handed out first (kept for good)

export const pic = path => (given[path] ||= local[path] || PICS?.inline?.[path] || BASE + path);
export const storyPic = name => pic(`story/${name}.webp`);

const loading = [];
// fetches pack i (once); resolves with the paths it holds (none in dev, or if it failed: they load one by one)
export function loadPictures(i) {
  const pack = PICS?.packs?.[i];
  if (!pack) return Promise.resolve([]);
  return (loading[i] ||= fetch(pack.url)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(buf => {
      for (const [path, [start, length]] of Object.entries(pack.files)) {
        const type = path.endsWith('.webp') ? 'image/webp' : path.endsWith('.png') ? 'image/png' : 'image/jpeg';
        local[path] = URL.createObjectURL(new Blob([buf.slice(start, start + length)], { type }));
      }
      // the crowd photo is a CSS background ("you?"): hand it over too, unless that scene is already showing it
      if (local['story/crowd.webp'] && !document.querySelector('.you')) {
        document.documentElement.style.setProperty('--crowd', `url("${local['story/crowd.webp']}")`);
      }
      return Object.keys(pack.files);
    })
    .catch(() => []));
}
