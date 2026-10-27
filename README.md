# 小黄帽的一天 · A Day in Guilin

A primary-school kid's day in Guilin, told as a scroll-driven short drama in a Memphis-style isometric miniature world.

Live: https://childhood.jesseqin.me

- `index.html` — the film: sticky stage, subtitles, draggable progress bar, autoplay
- `film.js` — story timeline, camera, world and characters
- `scenes.js` — isometric canvas engine and the illustrated chapter scenes
- `audio.js` — Web Audio score and sound effects, synthesised in the browser
- `chapters.html` — the illustrated chapter version
- `spec.md` — design notes

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 4174
```
