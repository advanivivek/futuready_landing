/*
  Every picture of the story, by its path in public/ ('story/girl-sit.webp', 'tv/1.webp').

  On the live site (vite.config.js, the "pictures" plugin) the pictures arrive in as few requests as possible, which
  matters on Vercel's free plan (it counts every request):
    - inline: the first scene's three cut-outs and the H2S logo come inside the page's script, ready at once;
    - packs[0]: the pictures of the next few scenes, one file, fetched a moment after the page opens;
    - packs[1]: everything else, one file, fetched once the visitor starts scrolling (someone who only looks at
      the first screen never downloads it).
  Each pack exists twice: as AVIF (about 40% lighter) and as WebP. The browser gets the AVIF one when it can show AVIF
  with see-through edges (every current browser), else the WebP one (iPhones on iOS 15 and older).
  Each picture in a pack becomes a local blob: address and is decoded ahead, so nothing decodes mid-scroll. A picture
  asked for before its pack has arrived (or in dev, where there are no packs) simply loads on its own from public/.
  Once a picture has an address it keeps it, so nothing on screen reloads.
*/
// { inline: { path: data URI }, packs: [{ url, files: { path: [start, length, type] } }], avif: [same] }, or null in dev
import PICS from 'virtual:pictures';

const BASE = import.meta.env.BASE_URL;
const local = {}; // path -> blob: address, once its pack is in
const given = {}; // path -> the address handed out first (kept for good)

export const pic = path => (given[path] ||= local[path] || PICS?.inline?.[path] || BASE + path);
export const storyPic = name => pic(`story/${name}.webp`);

// a one-pixel, fully see-through AVIF: it must load, and stay see-through (some older browsers drop AVIF transparency,
// which would put a box around every cut-out)
const PIXEL =
  'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAAGGbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAACxpbG9jAAAAAEQAAAIAAQAAAAEAAAHCAAAAHgACAAAAAQAAAa4AAAAUAAAAQmlpbmYAAAAAAAIAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAABppbmZlAgAAAAACAABhdjAxQWxwaGEAAAAAGmlyZWYAAAAAAAAADmF1eGwAAgABAAEAAADDaXBycAAAAJ1pcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBIAAAAAAAE2NvbHJuY2x4AAEADQAGgAAAAA5waXhpAAAAAAEIAAAADGF2MUOBABwAAAAAOGF1eEMAAAAAdXJuOm1wZWc6bXBlZ0I6Y2ljcDpzeXN0ZW1zOmF1eGlsaWFyeTphbHBoYQAAAAAeaXBtYQAAAAAAAAACAAEEAQKDBAACBAEFhgcAAAA6bWRhdBIACgQYAA5VMgoYAAABACWX/3PoEgAKBzgABtAQ0GkyERlCYwTAADQAAACQQMkcYIpq';
let packs;
const which = () =>
  (packs ||= !PICS?.avif
    ? Promise.resolve(PICS?.packs)
    : new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          let ok = img.width === 1;
          try {
            const g = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
            g.drawImage(img, 0, 0);
            ok = g.getImageData(0, 0, 1, 1).data[3] < 128;
          } catch {
            /* cannot read the pixel back: trust that it loaded */
          }
          resolve(ok ? PICS.avif : PICS.packs);
        };
        img.onerror = () => resolve(PICS.packs);
        img.src = PIXEL;
      }));

const loading = [];
// fetches pack i (once); resolves with the paths it holds (none in dev, or if it failed: they load one by one)
export function loadPictures(i) {
  if (!PICS?.packs?.[i]) return Promise.resolve([]);
  let pack;
  return (loading[i] ||= which()
    .then(list => fetch((pack = list[i]).url))
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(buf => {
      for (const [path, [start, length, type]] of Object.entries(pack.files)) {
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
