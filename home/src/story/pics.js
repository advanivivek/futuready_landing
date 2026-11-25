/*
  Every picture of the story, by its path in public/ ('story/girl-sit.webp', 'tv/1.webp').

  On the live site the pictures come together in ONE file, the "pack" that vite.config.js makes at build: one request
  instead of about forty, which matters on Vercel's free plan (it counts every request). The pack is fetched once the
  first scene is up; each picture inside it becomes a local blob: address and is decoded ahead, so nothing decodes in
  the middle of a scroll. A picture asked for before the pack has arrived (or in dev, where there is no pack) simply
  loads on its own from public/, as before. Once a picture has an address it keeps it, so nothing on screen reloads.
*/
import PACK from 'virtual:pictures'; // { url, files: { path: [start, length] } }, or null in dev

const BASE = import.meta.env.BASE_URL;
const local = {}; // path -> blob: address, once the pack is in
const given = {}; // path -> the address handed out first (kept for good)

export const pic = path => (given[path] ||= local[path] || BASE + path);
export const storyPic = name => pic(`story/${name}.webp`);

let loading;
// fetches the pack (once); resolves with the paths now held locally (none in dev, or if the pack failed)
export function loadPictures() {
  if (!PACK) return Promise.resolve([]);
  return (loading ||= fetch(PACK.url)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(buf => {
      for (const [path, [start, length]] of Object.entries(PACK.files)) {
        const type = path.endsWith('.webp') ? 'image/webp' : path.endsWith('.png') ? 'image/png' : 'image/jpeg';
        local[path] = URL.createObjectURL(new Blob([buf.slice(start, start + length)], { type }));
      }
      return Object.keys(PACK.files);
    })
    .catch(() => []));
}
