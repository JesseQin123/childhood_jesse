/* 小黄帽的一天 · isometric Memphis miniature engine + scenes.
   Every scene is draw(ctx, t) on a 600×600 logical canvas, deterministic in t. */
(() => {
const TAU = Math.PI * 2;
const K = {
  ink:'#25214A', paper:'#FBF8ED', yellow:'#FFC93C', pink:'#FF8DB5', cobalt:'#2E5BE6', coral:'#FF5A5F',
  mint:'#A9E6C6', sky:'#8DD3F6', lilac:'#D3BEFF', sand:'#F7E7BE', grass:'#CDEFD3', road:'#DCD8EE',
  skin:'#FFD9B8', white:'#FFFFFF', wood:'#F2C48D', red:'#F2433D', green:'#5BC98A', water:'#9ED8F5', hair:'#3A3150',
};
const SH = 'rgba(37,33,74,.17)';
const CN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const MIXC = new Map();
function mix(a, b, t) {
  const key = a + b + t; if (MIXC.has(key)) return MIXC.get(key);
  const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const out = '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  MIXC.set(key, out); return out;
}
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function paint(c, fill, lw = 1.6) { if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.lineWidth = lw; c.strokeStyle = K.ink; c.lineJoin = 'round'; c.stroke(); } }
function limb(c, x1, y1, x2, y2, col, w = 2.4) {
  c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = K.ink; c.lineWidth = w + 1.8; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function pattern(c, key, col) {
  c._pat = c._pat || {}; const k = key + col; if (c._pat[k]) return c._pat[k];
  const s = 24, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
  x.fillStyle = col; x.strokeStyle = col;
  if (key === 'dots') [[6, 6], [18, 18]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 3, 0, TAU); x.fill(); });
  if (key === 'stripes') { x.lineWidth = 4; x.beginPath(); x.moveTo(-6, 6); x.lineTo(6, -6); x.moveTo(-6, 30); x.lineTo(30, -6); x.moveTo(18, 30); x.lineTo(30, 18); x.stroke(); }
  if (key === 'hlines') x.fillRect(0, 0, 24, 5);
  if (key === 'zig') { x.lineWidth = 3; x.beginPath(); x.moveTo(0, 16); x.lineTo(6, 8); x.lineTo(12, 16); x.lineTo(18, 8); x.lineTo(24, 16); x.stroke(); }
  if (key === 'check') { x.fillRect(0, 0, 12, 12); x.fillRect(12, 12, 12, 12); }
  if (key === 'stars') { x.font = '12px sans-serif'; x.fillText('✦', 2, 11); x.fillText('✦', 14, 23); }
  const p = c.createPattern(cv, 'repeat'); p.setTransform(new DOMMatrix().scale(.5)); return (c._pat[k] = p);
}

/* ---------- isometric projection ---------- */
class Iso {
  constructor(c, ox, oy, s) { this.c = c; this.ox = ox; this.oy = oy; this.s = s; }
  p(x, y, z = 0) { return [this.ox + (x - y) * this.s * .866, this.oy + (x + y) * this.s * .5 - z * this.s]; }
  path(pts) { const c = this.c; c.beginPath(); pts.forEach((q, i) => { const [a, b] = this.p(q[0], q[1], q[2] || 0); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); }
  poly(pts, fill, lw = 2) { this.path(pts); paint(this.c, fill, lw); }
  pat(pts, key, col) { this.path(pts); this.c.fillStyle = pattern(this.c, key, col); this.c.fill(); }
  flat(x, y, w, d, fill, o = {}) {
    const pts = [[x, y, o.z || 0], [x + w, y, o.z || 0], [x + w, y + d, o.z || 0], [x, y + d, o.z || 0]];
    this.poly(pts, fill, o.lw ?? 0); if (o.pat) this.pat(pts, o.pat, o.patc);
  }
  ellipse(cx, cy, rx, ry, fill, o = {}) {
    const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, o.z || 0]); }
    this.poly(pts, fill, o.lw ?? 0); if (o.pat) this.pat(pts, o.pat, o.patc); return pts;
  }
  shadow(x, y, w, d, h) { this.c.fillStyle = SH; this.path([[x, y, 0], [x + w, y, 0], [x + w, y + d + h * .85, 0], [x, y + d + h * .85, 0]]); this.c.fill(); }
  box(x, y, z, w, d, h, col, o = {}) {
    const L = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
    const R = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    const T = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
    const lw = o.lw ?? 2;
    this.poly(L, o.l || mix(col, K.ink, .1), 0); if (o.pl) this.pat(L, o.pl, o.plc || mix(col, '#FFFFFF', .45)); this.poly(L, null, lw);
    this.poly(R, o.r || mix(col, K.ink, .24), 0); if (o.pr) this.pat(R, o.pr, o.prc || mix(col, '#FFFFFF', .3)); this.poly(R, null, lw);
    this.poly(T, o.t || mix(col, '#FFFFFF', .12), 0); if (o.pt) this.pat(T, o.pt, o.ptc || mix(col, '#FFFFFF', .5)); this.poly(T, null, lw);
  }
  // quads lying on the visible faces of walls
  at(x0, y0) { return new Iso(this.c, this.ox + (x0 - y0) * this.s * .866, this.oy + (x0 + y0) * this.s * .5, this.s); }
  qL(x, yF, z, w, h) { return [[x, yF, z], [x + w, yF, z], [x + w, yF, z + h], [x, yF, z + h]]; }
  qR(xF, y, z, d, h) { return [[xF, y, z], [xF, y + d, z], [xF, y + d, z + h], [xF, y, z + h]]; }
  textL(str, x, yF, z, size, col, font = CN) {
    const c = this.c, [a, b] = this.p(x, yF, z); c.save(); c.translate(a, b); c.transform(.866, .5, 0, 1, 0, 0);
    c.font = `${size}px ${font}`; c.fillStyle = col; c.textBaseline = 'alphabetic'; c.fillText(str, 0, 0); c.restore();
  }
  textR(str, xF, y, z, size, col, font = CN) {
    const c = this.c, [a, b] = this.p(xF, y, z); c.save(); c.translate(a, b); c.transform(.866, -.5, 0, 1, 0, 0);
    c.font = `${size}px ${font}`; c.fillStyle = col; c.fillText(str, 0, 0); c.restore();
  }
}

/* ---------- props ---------- */
function tree(I, x, y, o = {}) {
  const c = I.c, [px, py] = I.p(x, y, 0), k = (o.k || 1) * I.s / 22, h = 13 * k, r = 10 * k;
  c.fillStyle = SH; c.beginPath(); c.ellipse(px - 9 * k, py + 4 * k, 13 * k, 5 * k, 0, 0, TAU); c.fill();
  limb(c, px, py, px, py - h, '#B9835A', 2.4 * k);
  c.beginPath(); c.arc(px, py - h - r * .55, r, 0, TAU); paint(c, o.col || K.green, 1.8);
  c.beginPath(); c.arc(px - r * .3, py - h - r * .9, r * .35, 0, TAU); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  if (o.gui !== false) { // 桂花: osmanthus specks
    const R = rng(Math.round(x * 31 + y * 17)); c.fillStyle = K.yellow;
    for (let i = 0; i < 9; i++) { const a = R() * TAU, d = R() * r * .8; c.beginPath(); c.arc(px + Math.cos(a) * d, py - h - r * .55 + Math.sin(a) * d, 1.3 * k, 0, TAU); c.fill(); }
  }
}
function hill(I, x, y, w, h, col, o = {}) {
  const c = I.c, [px, py] = I.p(x, y, 0);
  if (!o.noShadow) { c.fillStyle = SH; c.beginPath(); c.ellipse(px - w * .5, py + 4, w * 1.05, w * .3, 0, 0, TAU); c.fill(); }
  const shape = () => { c.beginPath(); c.moveTo(px - w, py); c.bezierCurveTo(px - w, py - h * .72, px - w * .58, py - h, px, py - h); c.bezierCurveTo(px + w * .58, py - h, px + w, py - h * .72, px + w, py); c.quadraticCurveTo(px, py + w * .3, px - w, py); };
  shape(); c.fillStyle = col; c.fill();
  c.save(); shape(); c.clip(); c.strokeStyle = mix(col, '#FFFFFF', .38); c.lineWidth = 2.4;
  for (let yy = py - h + 10; yy < py + 10; yy += 8) { c.beginPath(); c.moveTo(px - w, yy); c.lineTo(px + w, yy); c.stroke(); }
  c.fillStyle = mix(col, K.ink, .14); c.fillRect(px + w * .35, py - h, w, h + 20);
  c.restore(); shape(); paint(c, null, 2);
  if (o.bush !== false) { c.beginPath(); c.arc(px - w * .15, py - h + 2, 5, 0, TAU); paint(c, K.green, 1.6); c.beginPath(); c.arc(px + w * .2, py - h + 4, 4, 0, TAU); paint(c, '#7FD6A0', 1.6); }
}
function bird(c, x, y, ph, k = 1, col = K.ink) {
  const f = Math.sin(ph) * 4 * k; c.lineWidth = 1.8; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 7 * k, y - f * .4); c.quadraticCurveTo(x - 3 * k, y - f, x, y); c.quadraticCurveTo(x + 3 * k, y - f, x + 7 * k, y - f * .4); c.stroke();
}
function cloud(c, x, y, k = 1, fill = K.white) {
  c.beginPath(); c.moveTo(x - 24 * k, y); c.arc(x - 12 * k, y - 6 * k, 10 * k, Math.PI * .9, Math.PI * 1.75); c.arc(x + 4 * k, y - 11 * k, 13 * k, Math.PI * 1.15, Math.PI * 1.95);
  c.arc(x + 17 * k, y - 3 * k, 9 * k, Math.PI * 1.4, Math.PI * .45); c.closePath(); paint(c, fill, 1.8);
}
function steam(c, x, y, t, k = 1, col = 'rgba(37,33,74,.45)') {
  c.lineWidth = 1.4; c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = (t * .7 + i / 3) % 1, a = 1 - ph; c.globalAlpha = a;
    c.beginPath(); for (let s = 0; s <= 8; s++) { const yy = y - s * 2.2 * k - ph * 10 * k; const xx = x + (i - 1) * 5 * k + Math.sin(s * .8 + t * 3 + i) * 2 * k; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  }
  c.globalAlpha = 1;
}
function bubble(c, x, y, w, h, tail = 'left') {
  rr(c, x, y, w, h, h / 2.2); paint(c, K.white, 1.8);
  const tx = tail === 'left' ? x + w * .22 : x + w * .78;
  c.beginPath(); c.arc(tx, y + h + 6, 3.2, 0, TAU); paint(c, K.white, 1.6);
  c.beginPath(); c.arc(tx + (tail === 'left' ? -6 : 6), y + h + 13, 2, 0, TAU); paint(c, K.white, 1.4);
}
function say(c, str, x, y, size = 14, col = K.ink) { c.font = `${size}px ${CN}`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, x, y); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; }
function burst(c, x, y, r, str, t = 0) {
  c.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + t, rad = i % 2 ? r * .62 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath(); paint(c, K.yellow, 2);
  say(c, str, x, y + 1, r * .62, K.coral);
}
function heart(c, x, y, k, col = K.coral) {
  c.beginPath(); c.moveTo(x, y + 3 * k); c.bezierCurveTo(x - 7 * k, y - 2 * k, x - 3 * k, y - 8 * k, x, y - 4 * k); c.bezierCurveTo(x + 3 * k, y - 8 * k, x + 7 * k, y - 2 * k, x, y + 3 * k); paint(c, col, 1.5);
}
function pole(I, x, y) {
  I.box(x, y, 0, .22, .22, 4.6, '#B8B3D9', { lw: 1.6 });
  I.box(x - .5, y + .05, 4.1, 1.2, .14, .14, '#B8B3D9', { lw: 1.4 });
}

/* ---------- people ---------- */
function fig(I, x, y, z, o = {}) {
  const c = I.c, [px, py] = I.p(x, y, z), k = (o.k || 1) * I.s / 24;
  const kind = o.kind || 'kid', pose = o.pose || 'stand', ph = o.ph || 0, adult = kind !== 'kid';
  const legL = adult ? 12 : 8.5, torH = adult ? 13 : 10, hr = adult ? 5.2 : 5.8;
  c.save(); c.translate(px, py); c.scale(k, k);
  if (!o.noShadow) { c.fillStyle = SH; c.beginPath(); c.ellipse(-3, 1.5, 8.5, 3, 0, 0, TAU); c.fill(); }
  c.scale(o.dir || 1, 1);
  c.translate(0, (pose === 'sit' ? legL * .55 : 0) - (o.hop || 0));
  const sw = pose === 'walk' ? Math.sin(ph) * 2.6 : pose === 'run' ? Math.sin(ph) * 4.2 : 0;
  const shirt = o.shirt || ({ kid: K.white, mom: K.pink, dad: K.sky, teacher: K.lilac, vendor: K.white, fisher: K.sky }[kind]);
  const pants = o.pants || (adult ? '#4B4682' : K.cobalt);
  const top = -legL - torH, hy = top - hr + .8;
  // legs
  if (pose === 'sit') { limb(c, -1, -legL + 1, 6.5, -legL + 1, adult ? pants : K.skin, 2.8); limb(c, 6.5, -legL + 1, 6.5, -legL * .45, adult ? pants : K.skin, 2.8); }
  else {
    limb(c, -2, -legL + 1, -2 + sw, -.6, adult ? pants : K.skin, 2.8); limb(c, 1.8, -legL + 1, 1.8 - sw, -.6, adult ? pants : K.skin, 2.8);
    c.fillStyle = K.ink; [[-2 + sw, 0], [1.8 - sw, 0]].forEach(([a, b]) => { c.beginPath(); c.ellipse(a + .8, b, 2.2, 1.3, 0, 0, TAU); c.fill(); });
  }
  if (!adult) { rr(c, -4.9, -legL - 3.4, 9.8, 4.4, 1.4); paint(c, pants, 1.6); }
  if (kind === 'mom') { c.beginPath(); c.moveTo(-5, top + 6); c.lineTo(5, top + 6); c.lineTo(7, -legL + 5); c.lineTo(-7, -legL + 5); c.closePath(); paint(c, '#7B6BE0', 1.6); }
  if (o.pack) { rr(c, -9.4, top + 1, 5, 9.4, 1.8); paint(c, o.pack, 1.6); }
  // torso
  rr(c, -5.2, top, 10.4, torH, 3.2); paint(c, shirt, 1.6);
  if (kind === 'vendor') { rr(c, -3.6, top + 3, 7.2, torH - 2, 1); paint(c, K.coral, 1.2); }
  if (!adult && o.scarf !== false) { c.beginPath(); c.moveTo(-3.4, top + .6); c.lineTo(3.4, top + .6); c.lineTo(1, top + 6); c.closePath(); paint(c, K.red, 1.3); }
  // arms
  const sh = top + 2.6, armC = shirt === K.white ? K.skin : shirt;
  const swa = pose === 'run' ? Math.sin(ph) * 5 : pose === 'walk' ? Math.sin(ph) * 3 : 0;
  limb(c, -4.6, sh, -5.6 - swa, sh + 7.5, K.skin, 2.3);
  let hand;
  if (o.arm === 'wave') { const a = Math.sin((o.t || 0) * 9) * 2.2; hand = [8.5 + a, top - 6]; }
  else if (o.arm === 'up') hand = [9, top - 4];
  else if (o.arm === 'point') hand = [11, top + 1];
  else if (o.arm === 'hold') hand = [8.6, sh + 4];
  else if (o.arm === 'hips') { limb(c, 4.6, sh, 8, sh + 4, K.skin, 2.3); hand = [4.8, sh + 8.5]; }
  else hand = [5.6 + swa, sh + 7.5];
  if (o.arm === 'hips') limb(c, 8, sh + 4, hand[0], hand[1], K.skin, 2.3); else limb(c, 4.6, sh, hand[0], hand[1], K.skin, 2.3);
  // head
  c.beginPath(); c.arc(0, hy, hr, 0, TAU); paint(c, o.back ? K.hair : K.skin, 1.6);
  if (!o.back) {
    c.fillStyle = K.ink; const ey = hy - .4;
    if (o.mood === 'sleep') { c.lineWidth = 1.2; c.beginPath(); c.arc(1.6, ey, 1, 0, Math.PI); c.arc(4, ey, 1, 0, Math.PI); c.stroke(); }
    else { c.beginPath(); c.arc(1.5, ey, .85, 0, TAU); c.arc(4, ey, .85, 0, TAU); c.fill(); }
    c.lineWidth = 1.2; c.beginPath();
    const m = o.mood || 'smile';
    if (m === 'smile' || m === 'sleep') c.arc(2.8, hy + 1.7, 1.5, .15 * Math.PI, .85 * Math.PI);
    else if (m === 'sad' || m === 'cry') c.arc(2.8, hy + 3.4, 1.4, 1.15 * Math.PI, 1.85 * Math.PI);
    else if (m === 'o') { c.arc(2.8, hy + 2.4, 1.1, 0, TAU); }
    else { c.moveTo(1.8, hy + 2.4); c.lineTo(3.8, hy + 2.4); }
    c.stroke();
    c.fillStyle = 'rgba(255,141,181,.7)'; c.beginPath(); c.arc(-.2, hy + 1.6, 1.3, 0, TAU); c.fill();
    if (m === 'cry') { c.fillStyle = K.sky; for (let i = 0; i < 3; i++) { const d = ((o.t || 0) * 2.2 + i / 3) % 1; c.globalAlpha = 1 - d; c.beginPath(); c.arc(4.6 + d * 2, hy + 1 + d * 10, 1.2, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  }
  // hair & hats
  if (kind === 'kid') {
    if (o.hat === false) { c.beginPath(); c.arc(0, hy, hr + .4, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(hr * .6, hy - 1.6); c.lineTo(-hr * .5, hy - 1); c.closePath(); paint(c, K.hair, 1.4); }
    else { c.beginPath(); c.arc(0, hy - .5, hr + .8, Math.PI, TAU); c.closePath(); paint(c, K.yellow, 1.6); rr(c, hr * .1, hy - 1.4, hr + 3.4, 1.9, .9); paint(c, K.yellow, 1.4); }
  } else if (kind === 'mom') { c.beginPath(); c.arc(0, hy, hr + .4, Math.PI * 1.0, Math.PI * 2.0); c.lineTo(hr * .5, hy - 1.5); c.lineTo(-hr * .6, hy + 2.5); c.closePath(); paint(c, K.hair, 1.4); c.beginPath(); c.arc(-hr + .3, hy - hr + 1.5, 2.7, 0, TAU); paint(c, K.hair, 1.4); }
  else if (kind === 'dad' || kind === 'teacher') { c.beginPath(); c.arc(0, hy, hr + .5, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(hr * .7, hy - 2.2); c.lineTo(-hr * .7, hy - 2.2); c.closePath(); paint(c, K.hair, 1.4);
    if (kind === 'teacher') { c.lineWidth = 1; c.beginPath(); c.arc(1.5, hy - .4, 1.7, 0, TAU); c.arc(4.3, hy - .4, 1.7, 0, TAU); c.stroke(); } }
  else if (kind === 'vendor') { rr(c, -hr, hy - hr - 5, hr * 2, 6, 2.5); paint(c, K.white, 1.4); }
  else if (kind === 'fisher') { c.beginPath(); c.moveTo(-12, hy - 1); c.lineTo(12, hy - 1); c.lineTo(0, hy - hr - 7); c.closePath(); paint(c, '#E9C27A', 1.6); }
  if (o.hold) o.hold(c, hand[0], hand[1]);
  c.restore();
}
const holdBroom = a => (c, x, y) => { c.save(); c.translate(x, y); c.rotate(a); limb(c, 0, 0, 0, -22, '#C98A4B', 1.6); c.beginPath(); c.moveTo(-4, -22); c.lineTo(4, -22); c.lineTo(6, -31); c.lineTo(-6, -31); c.closePath(); paint(c, K.yellow, 1.4); c.restore(); };
const holdDuster = a => (c, x, y) => { c.save(); c.translate(x, y); c.rotate(a); limb(c, 0, 0, 0, -20, '#C98A4B', 1.4);
  [K.coral, K.yellow, K.cobalt, K.pink, K.mint].forEach((col, i) => { c.beginPath(); c.ellipse(Math.sin(i * 1.3) * 2.5, -21 - i * 2.4, 4.4, 2.2, i * .5, 0, TAU); paint(c, col, 1.1); }); c.restore(); };
const holdPaper = (c, x, y) => { c.save(); c.translate(x, y); c.rotate(-.15); rr(c, -1, -9, 10, 12, 1); paint(c, K.white, 1.3); say(c, '62', 4, -4, 6.5, K.coral); c.restore(); };
const holdPlate = (c, x, y) => { c.beginPath(); c.ellipse(x + 2, y - 1, 8, 3, 0, 0, TAU); paint(c, K.white, 1.4); melon(c, x + 2, y - 3, .8); };
function melon(c, x, y, k = 1) { c.beginPath(); c.moveTo(x - 6 * k, y); c.arc(x, y, 6 * k, Math.PI, 0, true); c.closePath(); paint(c, '#58C27D', 1.4); c.beginPath(); c.moveTo(x - 4.6 * k, y); c.arc(x, y, 4.6 * k, Math.PI, 0, true); c.closePath(); c.fillStyle = K.coral; c.fill();
  c.fillStyle = K.ink; [[-2, 1.6], [0, 2.6], [2, 1.6]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a * k, y + b * k, .6, 0, TAU); c.fill(); }); }
function sleeper(I, x, y, z, t) { // head on a pillow
  const c = I.c, [px, py] = I.p(x, y, z), k = I.s / 24;
  c.save(); c.translate(px, py); c.scale(k, k);
  c.beginPath(); c.arc(0, 0, 5.8, 0, TAU); paint(c, K.skin, 1.6);
  c.beginPath(); c.arc(0, 0, 6.2, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(3, -2); c.lineTo(-3, -1); c.closePath(); paint(c, K.hair, 1.3);
  c.lineWidth = 1.1; c.strokeStyle = K.ink; c.beginPath(); c.arc(1, .6, 1, 0, Math.PI); c.arc(3.6, .6, 1, 0, Math.PI); c.stroke();
  c.restore();
  for (let i = 0; i < 3; i++) { const d = (t * .45 + i / 3) % 1; c.globalAlpha = Math.sin(d * Math.PI); say(c, 'z', px + 10 + d * 16 + i * 2, py - 12 - d * 26, 10 + i * 3, K.cobalt); }
  c.globalAlpha = 1;
}
function room(I, w, d, h, wallA, wallB, floor, o = {}) {
  I.c.fillStyle = SH; I.path([[0, d, 0], [w, d, 0], [w + .6, d + 1.1, 0], [.6, d + 1.1, 0]]); I.c.fill();
  I.box(0, 0, 0, w, d, .35, floor, { pt: o.floorPat || 'stripes', ptc: mix(floor, '#FFFFFF', .35) });
  I.box(0, 0, .35, .3, d, h, wallB, { pr: o.patB, prc: mix(wallB, '#FFFFFF', .45), pt: null });
  I.box(0, 0, .35, w, .3, h, wallA, { pl: o.patA, plc: mix(wallA, '#FFFFFF', .45) });
}
function windowL(I, x, yF, z, w, h, inner) { const q = I.qL(x, yF, z, w, h); I.poly(q, K.sky, 2); if (inner) { I.c.save(); I.path(q); I.c.clip(); inner(); I.c.restore(); } I.poly(q, null, 2.4); const m = x + w / 2; I.poly([[m, yF, z], [m, yF, z + h]], null, 1.6); }
function windowR(I, xF, y, z, d, h, inner) { const q = I.qR(xF, y, z, d, h); I.poly(q, K.sky, 2); if (inner) { I.c.save(); I.path(q); I.c.clip(); inner(); I.c.restore(); } I.poly(q, null, 2.4); }
function grassTufts(I, seed, x0, y0, w, d, n, col = '#7FCF98') {
  const R = rng(seed), c = I.c; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const [a, b] = I.p(x0 + R() * w, y0 + R() * d); c.beginPath(); c.moveTo(a - 3, b); c.lineTo(a - 4, b - 5); c.moveTo(a, b); c.lineTo(a, b - 7); c.moveTo(a + 3, b); c.lineTo(a + 4.5, b - 5); c.stroke(); }
}
function sorted(list) { list.sort((a, b) => a[0] - b[0]).forEach(e => e[1]()); }
const walkPath = (pts, u) => { // piecewise linear path through world points, u∈[0,1]
  const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let d = clamp(u, 0, 1) * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), pts[i + 1][0] - pts[i][0] - (pts[i + 1][1] - pts[i][1]) >= 0 ? 1 : -1]; } d -= seg[i]; }
  return [pts[0][0], pts[0][1], 1];
};

/* =========================================================
   Scenes
   ========================================================= */
const S = {};

/* HERO · 桂林全景: river, karst, raft, bridge, town */
S.hero = (c, t) => {
  const I = new Iso(c, 310, 116, 22);
  c.fillStyle = K.grass; c.fillRect(0, 0, 600, 600);
  I.flat(-30, -30, 70, 34, '#E4F5DE');
  c.fillStyle = K.yellow; c.beginPath(); c.arc(468, 96, 34, 0, TAU); paint(c, K.yellow, 2);
  // far range
  [[4, -9, 70, 150, '#E6DBFF'], [12, -7, 62, 130, '#D7EEFB'], [-3, -5, 58, 120, '#DDF3E6'], [18, -3, 52, 112, '#E6DBFF']].forEach(h => hill(I, h[0], h[1], h[2], h[3], h[4], { noShadow: true, bush: false }));
  // near karst (behind river)
  const hills = [[-5, 2, 34, 92, K.mint], [-1, 0, 40, 118, K.lilac], [3, 1.5, 32, 86, K.sky], [7, 0, 44, 132, K.pink], [11, 2.5, 34, 98, K.lilac], [15, 1, 40, 120, K.mint], [19, 3, 30, 84, K.sky], [1, 4.4, 24, 62, K.pink], [9.5, 4.6, 22, 58, K.sky]];
  hills.sort((a, b) => a[0] + a[1] - b[0] - b[1]).forEach(h => hill(I, ...h));
  // river
  I.flat(-30, 5.6, 80, 3.6, K.water, { lw: 2 });
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6;
  for (let i = 0; i < 26; i++) { const x = ((i * 3.7 + t * .6) % 40) - 10, y = 6 + (i * 1.37) % 2.8; const [a, b] = I.p(x, y); c.beginPath(); c.moveTo(a - 6, b); c.quadraticCurveTo(a, b - 3, a + 6, b); c.stroke(); }
  // raft
  const rx = -6 + (t * .42) % 21, fade = smooth(-6, -4.6, rx) * (1 - smooth(13.5, 15, rx));
  c.globalAlpha = fade;
  I.box(rx, 7, .02, 2.6, .9, .14, K.wood, { pl: 'hlines', plc: '#D9A266', lw: 1.6 });
  fig(I, rx + 1.9, 7.5, .16, { kind: 'fisher', noShadow: true, k: .95 });
  { const [a, b] = I.p(rx + .6, 7.4, .2); c.beginPath(); c.ellipse(a, b - 5, 5, 3.4, -.3, 0, TAU); paint(c, K.ink, 0); c.beginPath(); c.arc(a + 4, b - 9, 2.4, 0, TAU); paint(c, K.ink, 0); c.fillStyle = K.yellow; c.beginPath(); c.moveTo(a + 6, b - 9.5); c.lineTo(a + 10, b - 8.5); c.lineTo(a + 6, b - 8); c.fill(); }
  c.globalAlpha = 1;
  // bridge
  I.box(16.6, 5.2, 0, 1.6, .5, .9, '#E5E0F2', { lw: 1.8 }); I.box(16.6, 8.8, 0, 1.6, .5, .9, '#E5E0F2', { lw: 1.8 });
  I.box(16.6, 5.2, .9, 1.6, 4.1, .28, '#F4F1FB', { pl: 'hlines', plc: '#DCD6EE' });
  I.box(16.6, 5.2, 1.18, .14, 4.1, .4, K.coral, { lw: 1.4 });
  fig(I, 17.5, 7.2, 1.18, { arm: 'wave', t, pack: K.coral, k: .9 });
  I.box(18.06, 5.2, 1.18, .14, 4.1, .4, K.coral, { lw: 1.4 });
  // bank + road
  I.flat(-30, 9.2, 80, .6, '#F7E7BE');
  I.flat(-30, 10.4, 80, 1.5, K.road, { lw: 2 });
  for (let i = -10; i < 30; i += 2) I.flat(i, 11.08, .9, .14, K.yellow);
  // town
  const D = [];
  [[1, 9.6], [6.5, 9.6], [12, 9.6], [21, 9.7], [-4, 9.6]].forEach(([x, y]) => D.push([x + y, () => tree(I, x, y, { k: .85 })]));
  D.push([12 + 12.6, () => { I.shadow(9, 12.4, 5.2, 2.4, 2.6); I.box(9, 12.4, 0, 5.2, 2.4, 2.6, K.cobalt, { pl: 'dots', plc: '#6E8EF0' });
    for (let i = 0; i < 4; i++) I.poly(I.qL(9.5 + i * 1.2, 14.8, 1.2, .7, .8), K.yellow, 1.6);
    I.box(9.2, 14.8, 2.1, 4.8, .12, .55, K.yellow, { lw: 1.6 }); I.textL('桂花小学', 10.1, 14.92, 2.22, 14, K.ink);
    I.box(14.6, 12.6, 0, .14, .14, 4.4, '#B8B3D9', { lw: 1.4 }); const [a, b] = I.p(14.67, 12.67, 4.4); c.beginPath(); c.moveTo(a, b); for (let s = 0; s <= 10; s++) c.lineTo(a + s * 2.2, b + 2 + Math.sin(s * .7 + t * 5) * 1.6); for (let s = 10; s >= 0; s--) c.lineTo(a + s * 2.2, b + 12 + Math.sin(s * .7 + t * 5) * 1.6); c.closePath(); paint(c, K.red, 1.5); }]);
  D.push([3 + 13, () => { I.shadow(3, 13, 3, 2.6, 2.8); I.box(3, 13, 0, 3, 2.6, 2.8, K.pink, { pl: 'dots', plc: '#FFC2D8' });
    I.poly(I.qL(3.5, 15.6, 1.2, .8, .8), K.sky, 1.6); I.poly(I.qL(4.8, 15.6, 0, .8, 1.5), K.ink, 1.6); I.box(5, 13.4, 2.8, .7, .7, .5, K.white, { lw: 1.4 }); }]);
  [[-2, 13.5], [7.5, 15.5], [12.5, 18.5], [1, 17.5], [19.5, 13], [21, 17]].forEach(([x, y]) => D.push([x + y, () => tree(I, x, y)]));
  D.push([13 + 16.4, () => { I.shadow(13.4, 16.4, 2.6, 2.2, 2.2); I.box(13.4, 16.4, 0, 2.6, 2.2, 2.2, K.yellow, { pl: 'zig', plc: '#FFE08A' }); I.poly(I.qL(14.1, 18.6, 0, .8, 1.3), K.ink, 1.6); I.box(13.6, 18.6, 1.55, 2.2, .1, .4, K.coral, { lw: 1.4 }); I.textL('小卖部', 13.95, 18.7, 1.66, 10, K.white); }]);
  D.push([5 + 17, () => { I.shadow(5, 17, 2.4, 2.4, 2.4); I.box(5, 17, 0, 2.4, 2.4, 2.4, K.lilac, { pl: 'dots', plc: '#EDE3FF' }); I.poly(I.qL(5.5, 19.4, 1.1, .7, .7), K.yellow, 1.6); }]);
  for (let i = 0; i < 2; i++) { const x = ((t * .7 + i * 9) % 26) - 6, y = 10.95 + i * .35; D.push([x + y, () => fig(I, x, y, 0, { pose: 'walk', ph: t * 7 + i, pack: i ? K.mint : K.coral, k: .85 })]); }
  I.ellipse(17.6, 20, 2.6, 1.7, K.water, { lw: 2 }); [[17, 19.6], [18.3, 20.4], [17.8, 19.2]].forEach(([x, y]) => { const [a, b] = I.p(x, y); c.beginPath(); c.ellipse(a, b, 6, 3, 0, .3, TAU); c.lineTo(a, b); paint(c, K.green, 1.3); });
  sorted(D);
  grassTufts(I, 5, -6, 15, 30, 12, 26);
  // sky life
  cloud(c, ((t * 8) % 760) - 80, 64, .9); cloud(c, ((t * 5 + 380) % 760) - 80, 112, .7);
  for (let i = 0; i < 3; i++) bird(c, ((t * 26 + i * 40) % 760) - 80, 150 - i * 12 + Math.sin(t + i) * 6, t * 9 + i, .9);
};

/* 01 · 07:10 赖床 */
S.wake = (c, t) => {
  const T = t % 12, I = new Iso(c, 258, 152, 32), k = I.s / 24;
  c.fillStyle = K.sand; c.fillRect(0, 0, 600, 600);
  c.fillStyle = K.yellow; c.beginPath(); c.arc(520, 70, 30, 0, TAU); paint(c, K.yellow, 2);
  [[1, -4, 40, 130, K.mint], [6, -5, 46, 150, K.lilac], [11, -3, 40, 120, K.sky], [-3, -1, 36, 100, K.pink], [14, -1, 34, 96, K.pink]].forEach(h => hill(I, ...h));
  I.flat(-20, 7.9, 60, .7, '#FFF3D6'); I.flat(-20, 8.6, 60, 1.7, K.road, { lw: 2 });
  for (let i = -10; i < 30; i += 2) I.flat(i, 9.38, .9, .14, K.yellow);
  I.flat(-20, 10.3, 60, 20, '#D7F0C8'); grassTufts(I, 11, -6, 10.6, 26, 10, 30);
  const D = [];
  // bedroom
  D.push([2, () => {
    room(I, 5, 5.4, 3, K.lilac, K.sky, K.wood, { patA: 'dots', floorPat: 'stripes' });
    windowL(I, 2.7, .3, 1.5, 1.6, 1.2, () => { const [a, b] = I.p(3.5, .3, 2.1); c.fillStyle = K.yellow; c.beginPath(); c.arc(a + 6, b + 4, 7, 0, TAU); c.fill(); });
    I.poly(I.qR(.3, 3.4, 1.5, 1.1, 1.1), K.pink, 2); I.textR('★', .3, 4.3, 1.8, 16, K.white);
    // bed
    I.box(.35, .5, .35, 2.1, 3, .45, K.white); I.box(.45, .6, .8, 1.9, .9, .22, '#FFFFFF', { pt: null });
    const out = T > 4.4;
    I.box(.4, out ? 1.9 : 1.6, .8, 2.0, out ? 1.5 : 1.9, out ? .14 : .24, K.coral, { pt: 'dots', ptc: '#FFB0B2' });
    if (!out) sleeper(I, 1.3, 1.05, 1.15, t);
    I.box(2.75, .5, .35, .85, .85, .75, K.yellow, { pl: 'zig' });
    { const [a, b] = I.p(3.15, .9, 1.1), ring = T < 4.4, sh = ring ? Math.sin(t * 46) * .22 : 0; c.save(); c.translate(a, b - 7); c.rotate(sh);
      c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); paint(c, K.coral, 1.6); c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); paint(c, K.white, 1.2);
      c.beginPath(); c.arc(-4.8, -5.5, 2.4, 0, TAU); c.arc(4.8, -5.5, 2.4, 0, TAU); paint(c, K.yellow, 1.2);
      c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -3); c.moveTo(0, 0); c.lineTo(2.4, 1); c.stroke(); c.restore();
      if (ring) { c.strokeStyle = K.ink; c.lineWidth = 1.6; [[-12, -12, -17, -16], [12, -12, 17, -16], [-13, -4, -19, -3], [13, -4, 19, -3]].forEach(l => { c.beginPath(); c.moveTo(a + l[0], b - 7 + l[1]); c.lineTo(a + l[2], b - 7 + l[3]); c.stroke(); }); } }
    if (T > 1.4 && T < 4.4) { fig(I, 4.2, 4.6, .35, { kind: 'mom', dir: -1, arm: 'hips', mood: 'flat' }); const [a, b] = I.p(4.2, 4.6, .35); bubble(c, a - 128 * k, b - 86 * k, 138 * k, 40 * k, 'right'); say(c, '莫磨蹭！粉要坨了！', a - 59 * k, b - 66 * k, 16 * k); }
  }]);
  // noodle shop
  D.push([7 + 2.2, () => {
    I.shadow(7, 2.2, 4.2, 3, 2.8); I.box(7, 2.2, 0, 4.2, 3, 2.8, K.pink, { pl: 'dots', plc: '#FFC2D8', pr: 'stripes' });
    I.poly(I.qL(8.9, 5.2, 0, 1, 1.6), K.ink, 1.6);
    I.box(7.3, 5.2, 2.0, 3.6, .14, .62, K.yellow, { lw: 1.6 }); I.textL('桂林米粉', 7.75, 5.34, 2.16, 15, K.ink);
    for (let i = 0; i < 6; i++) I.poly([[7.2 + i * .6, 5.2, 1.95], [7.8 + i * .6, 5.2, 1.95], [7.8 + i * .6, 5.9, 1.5], [7.2 + i * .6, 5.9, 1.5]], i % 2 ? K.white : K.coral, 1.4);
    fig(I, 9.4, 5.45, 0, { kind: 'vendor', noShadow: true });
  }]);
  D.push([8 + 6.3, () => {
    I.box(8, 6.3, 0, 1.6, .9, .7, K.white, { pt: 'check', ptc: '#FFE3EC' });
    const [a, b] = I.p(8.8, 6.75, .7); c.beginPath(); c.ellipse(a, b - 3, 7, 3.4, 0, 0, TAU); paint(c, K.white, 1.5); c.beginPath(); c.ellipse(a, b - 3.6, 5.2, 2.2, 0, 0, TAU); c.fillStyle = '#F6D38E'; c.fill(); steam(c, a, b - 7, t);
  }]);
  const eating = T > 4.4 && T < 8, walking = T >= 8;
  if (eating) D.push([8.8 + 7.5, () => fig(I, 8.8, 7.5, 0, { pose: 'sit', dir: -1, pack: K.coral, arm: 'hold', mood: 'smile', hold: (c2, x, y) => limb(c2, x, y, x + 4, y - 7, '#C98A4B', 1.2) })]);
  if (walking) { const u = (T - 8) / 4, x = lerp(9, 17, u); D.push([x + 8.25, () => fig(I, x, 8.25, 0, { pose: 'walk', ph: t * 8, pack: K.coral })]); }
  [[-1, 6.5], [6, 6.8], [12.5, 6.4], [2, 12], [9, 12.6], [15, 11.3], [-3, 11]].forEach(([x, y]) => D.push([x + y, () => tree(I, x, y)]));
  D.push([.5 + 8, () => pole(I, .5, 8)]); D.push([12.6 + 8, () => pole(I, 12.6, 8)]);
  sorted(D);
  { const a = I.p(.6, 8.1, 4.2), b = I.p(12.7, 8.1, 4.2); c.strokeStyle = K.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, a[1] - 60); c.quadraticCurveTo((a[0] - 10) / 2, a[1] - 10, a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 14, b[0], b[1]); c.quadraticCurveTo(b[0] + 80, b[1] + 50, 620, b[1] + 40); c.stroke(); }
  for (let i = 0; i < 2; i++) bird(c, ((t * 30 + i * 300) % 760) - 80, 120 + i * 30 + Math.sin(t * 1.3 + i) * 8, t * 10 + i);
};

/* 02 · 10:20 第三节课 */
S.class = (c, t) => {
  const T = t % 12, I = new Iso(c, 281, 222, 36), k = I.s / 27;
  c.fillStyle = '#CFEFD9'; c.fillRect(0, 0, 600, 600);
  grassTufts(I, 4, -4, 8, 18, 8, 24);
  [[9.6, .5], [10.4, 4.8], [-1.6, 8.6], [8.8, 8.6], [3.8, 9.8]].forEach(([x, y]) => { if (x + y < 9) tree(I, x, y); });
  room(I, 8.2, 7, 3.3, K.lilac, K.sky, K.wood, { patA: null, floorPat: 'check' });
  // window with sparrow on a laundry pole
  windowR(I, .3, 1.4, 1.35, 2.2, 1.5, () => {
    const a = I.p(.3, 1.4, 2.35), b = I.p(.3, 3.6, 2.35); c.strokeStyle = K.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    const [sx, sy] = I.p(.3, 2.3, 2.35); rr(c, sx - 3, sy - 2, 9, 11, 1); paint(c, K.pink, 1.2);
    const hopX = 2.9 + Math.round(Math.sin(t * 1.7)) * .25, hop = Math.abs(Math.sin(t * 6)) > .9 ? 3 : 0, [bx, by] = I.p(.3, hopX, 2.35);
    c.beginPath(); c.ellipse(bx, by - 4 - hop, 5, 3.6, 0, 0, TAU); paint(c, '#B98A5E', 1.2); c.beginPath(); c.arc(bx - 4, by - 7 - hop, 2.6, 0, TAU); paint(c, '#B98A5E', 1.2); c.fillStyle = K.yellow; c.beginPath(); c.moveTo(bx - 6.5, by - 7 - hop); c.lineTo(bx - 9, by - 6 - hop); c.lineTo(bx - 6.4, by - 5.6 - hop); c.fill();
  });
  // hats on hooks
  for (let i = 0; i < 4; i++) { const [a, b] = I.p(.3, 4.3 + i * .6, 2.25); c.beginPath(); c.arc(a, b, 5, Math.PI, TAU); c.closePath(); paint(c, K.yellow, 1.4); }
  // blackboard + slogan + clock
  I.poly(I.qL(1.6, .3, 1.15, 4.8, 1.7), '#2F5E4E', 2.4);
  I.textL('1/2 + 1/3 = ?', 2.0, .3, 2.25, 15, '#F4F1E6', '"DM Mono", monospace');
  I.textL('= 5/6', 2.6, .3, 1.55, 13, '#F4F1E6', '"DM Mono", monospace');
  I.box(1.9, .3, 3.0, 4.2, .08, .32, K.coral, { lw: 1.4 }); I.textL('好好学习 天天向上', 2.25, .38, 3.07, 11, K.yellow);
  { const [a, b] = I.p(7.3, .3, 2.5); c.beginPath(); c.ellipse(a, b, 8, 9, 0, 0, TAU); paint(c, K.white, 1.6); c.lineWidth = 1.4; c.beginPath(); c.moveTo(a, b); c.lineTo(a + 4, b + 1.5); c.moveTo(a, b); c.lineTo(a + .5, b - 6); c.stroke(); }
  const D = [];
  D.push([2.5 + 1.2, () => fig(I, 2.5, 1.2, .35, { kind: 'teacher', arm: 'point', mood: 'smile', dir: -1 })]);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
    const x = 1.5 + i * 2.25, y = 2.7 + j * 2.1, me = i === 0 && j === 1;
    D.push([x + y + .5, () => I.box(x, y, .35, 1.5, .75, .72, K.wood, { pt: null, t: '#F7D4A6' })]);
    D.push([x + y + 1.6, () => fig(I, x + .75, y + 1.15, .35, { pose: 'sit', back: !me, hat: false, dir: me ? -1 : 1, mood: me ? (T > 6.4 && T < 10.5 ? 'smile' : 'sad') : 'smile', arm: me && T > 6.4 && T < 10.5 ? 'hold' : undefined, hold: me && T > 6.4 && T < 10.5 ? (c2, x2, y2) => { rr(c2, x2 - 1, y2 - 6, 7, 5, 1); paint(c2, K.white, 1.1); } : undefined })]);
  }
  sorted(D);
  // the note flying across the aisle
  if (T > 5 && T < 6.4) { const u = (T - 5) / 1.4, a = I.p(4.5, 5.0, 1.4), b = I.p(2.6, 5.2, 1.4), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 30; c.save(); c.translate(x, y); c.rotate(u * 7); rr(c, -4, -3, 8, 6, 1); paint(c, K.white, 1.3); c.restore(); }
  // thought bubble
  { const [a, b] = I.p(2.25, 4.8, .35), bx = a - 18 * k, by = b - 112 * k;
    bubble(c, bx, by, 92 * k, 46 * k, 'left');
    if (T < 6.4 || T > 10.5) { say(c, '62', bx + 30 * k, by + 25 * k, 22 * k, K.coral); c.globalAlpha = .9; cloud(c, bx + 66 * k, by + 24 * k, .42 * k, '#C9C5DE'); c.strokeStyle = K.cobalt; c.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const d = (t * 1.6 + i / 3) % 1; c.beginPath(); c.moveTo(bx + (58 + i * 7) * k, by + (28 + d * 8) * k); c.lineTo(bx + (56 + i * 7) * k, by + (32 + d * 8) * k); c.stroke(); } c.globalAlpha = 1; }
    else { say(c, '抓蜻蜓？', bx + 46 * k, by + 24 * k, 15 * k, K.cobalt); }
  }
  [[10.4, 4.8], [-1.6, 8.6], [8.8, 8.6], [3.8, 9.8]].forEach(([x, y]) => { if (x + y >= 9) tree(I, x, y); });
};

/* 03 · 12:10 午饭，和一次挨打 */
S.lunch = (c, t) => {
  const T = t % 12, I = new Iso(c, 281, 222, 36), k = I.s / 27;
  c.fillStyle = K.sand; c.fillRect(0, 0, 600, 600); grassTufts(I, 9, -3, 8.5, 16, 8, 18, '#D9B977');
  room(I, 8.2, 7, 3.3, K.pink, K.mint, K.wood, { patA: 'dots', floorPat: 'stripes' });
  windowR(I, .3, 1.2, 1.4, 1.5, 1.3, () => { const [a, b] = I.p(.3, 1.9, 2.1); c.fillStyle = K.yellow; c.beginPath(); c.arc(a, b, 6, 0, TAU); c.fill(); });
  // 福
  I.poly([[6.9, .3, 2.95], [7.45, .3, 2.4], [6.9, .3, 1.85], [6.35, .3, 2.4]], K.red, 1.8); I.textL('福', 6.62, .32, 2.2, 15, K.yellow);
  const D = [];
  const broke = T > 2.4;
  D.push([1.5, () => { I.box(.6, .35, .35, 2.2, .8, 1.1, K.sky, { pl: 'zig' });
    if (!broke) { const [a, b] = I.p(1.7, .75, 1.45); vase(c, a, b); } }]);
  D.push([4, () => { I.box(3.4, .35, .35, 2.4, .8, .75, K.yellow, { pl: 'dots' }); I.box(3.8, .5, 1.1, 1.6, .45, 1.0, '#3D3A6B'); I.poly(I.qL(3.95, .95, 1.2, 1.3, .75), K.sky, 1.6); }]);
  D.push([4.6, () => { I.box(.35, 3, .35, 1.1, 2.6, .55, K.coral, { pt: 'dots', ptc: '#FFB0B2' }); I.box(.35, 3, .9, .35, 2.6, .65, K.coral); }]);
  D.push([3.6 + 3.4 + .6, () => { I.box(3.6, 3.4, .35, 2.4, 1.5, .78, K.white, { pt: 'check', ptc: '#FFF0C7' });
    [[4.2, 3.9], [5.3, 4.3], [4.7, 4.5]].forEach(([x, y], i) => { const [a, b] = I.p(x, y, 1.13); c.beginPath(); c.ellipse(a, b, 6, 3, 0, 0, TAU); paint(c, [K.white, K.sky, K.pink][i], 1.3); });
    if (T > 8.4) { const [a, b] = I.p(4.9, 4.1, 1.13); c.beginPath(); c.ellipse(a, b, 13, 5, 0, 0, TAU); paint(c, K.white, 1.4); melon(c, a - 5, b - 2, .9); melon(c, a + 5, b - 1, .9); } }]);
  // falling vase, shards
  if (T > 2.4 && T < 3.0) { const u = (T - 2.4) / .6, z = lerp(1.45, .35, u * u), y = lerp(.75, 1.4, u), [a, b] = I.p(1.7, y, z); D.push([1.7 + y, () => { c.save(); c.translate(a, b); c.rotate(u * 2); vase(c, 0, 0); c.restore(); }]); }
  if (T >= 3.0 && T < 11.6) D.push([3.2, () => { const R = rng(3); for (let i = 0; i < 7; i++) { const [a, b] = I.p(1.3 + R() * 1.1, 1.2 + R() * .9, .35); c.beginPath(); c.moveTo(a, b); c.lineTo(a + 4 + R() * 3, b - 2); c.lineTo(a + 2, b + 3); c.closePath(); paint(c, i % 2 ? K.cobalt : K.white, 1.1); } }]);
  // the kid / dad / mom choreography
  const cx = 4.8, cy = 4.15;
  if (T < 2.4) D.push([2.6 + 2.5, () => fig(I, 2.6, 2.5, .35, { arm: 'hold', mood: 'smile', hat: false, hold: holdBroom(Math.sin(t * 8) * 1.1) })]);
  else if (T < 3.4) D.push([2.6 + 2.5, () => fig(I, 2.6, 2.5, .35, { arm: 'up', mood: 'o', hat: false })]);
  else if (T < 7) {
    const a = (T - 3.4) * 2.1, k = (ang) => [cx + Math.cos(ang) * 2.7, cy + Math.sin(ang) * 1.85];
    const [kx, ky] = k(a), [dx, dy] = k(a - .95), dirOf = ang => (-Math.sin(ang) * 2.7 - Math.cos(ang) * 1.85) >= 0 ? 1 : -1;
    D.push([kx + ky, () => fig(I, kx, ky, .35, { pose: 'run', ph: t * 14, mood: 'cry', t, hat: false, dir: dirOf(a) })]);
    D.push([dx + dy, () => fig(I, dx, dy, .35, { kind: 'dad', pose: 'run', ph: t * 12, mood: 'flat', arm: 'up', dir: dirOf(a - .95), hold: holdDuster(Math.sin(t * 12) * .6) })]);
  } else if (T < 8.4) {
    D.push([2.6 + 5.6, () => fig(I, 2.6, 5.6, .35, { mood: 'cry', t, hat: false })]);
    D.push([3.7 + 5.0, () => fig(I, 3.7, 5.0, .35, { kind: 'dad', dir: -1, mood: 'flat', hold: holdDuster(.4) })]);
    const u = (T - 7) / 1.4; D.push([lerp(8.4, 6.6, u) + 5.4, () => fig(I, lerp(8.4, 6.6, u), 5.4, .35, { kind: 'mom', pose: 'walk', ph: t * 8, dir: -1, arm: 'hold', hold: holdPlate })]);
  } else {
    D.push([4.3 + 5.5, () => fig(I, 4.3, 5.5, .35, { pose: 'sit', dir: -1, mood: 'smile', hat: false, arm: 'hold', hold: (c2, x, y) => melon(c2, x + 2, y - 2, .6) })]);
    D.push([6.5 + 4.5, () => fig(I, 6.5, 4.5, .35, { kind: 'dad', pose: 'sit', dir: -1, mood: 'smile' })]);
    D.push([4.4 + 2.6, () => fig(I, 4.4, 2.6, .35, { kind: 'mom', pose: 'sit', mood: 'smile' })]);
  }
  sorted(D);
  if (T > 2.9 && T < 4.2) { const [a, b] = I.p(1.7, 1.4, .8); burst(c, a + 4 * k, b - 26 * k, 26 * k * smooth(2.9, 3.15, T), '啪！', T); }
  if (T > 8.6) for (let i = 0; i < 4; i++) { const d = ((T - 8.6) * .45 + i / 4) % 1, [a, b] = I.p(5.2, 4.6, 2.2); c.globalAlpha = Math.sin(d * Math.PI); heart(c, a + (-30 + i * 20 + Math.sin(d * 6 + i) * 4) * k, b - d * 60 * k, 1.1 * k, i % 2 ? K.pink : K.coral); }
  c.globalAlpha = 1;
  [[9.2, 8.5], [-1, 9], [5.5, 10.2]].forEach(([x, y]) => tree(I, x, y));
};
function vase(c, a, b) { c.beginPath(); c.moveTo(a - 3, b); c.quadraticCurveTo(a - 8, b - 9, a - 3, b - 15); c.lineTo(a - 3, b - 19); c.lineTo(a + 3, b - 19); c.lineTo(a + 3, b - 15); c.quadraticCurveTo(a + 8, b - 9, a + 3, b); c.closePath(); paint(c, K.cobalt, 1.5);
  c.strokeStyle = K.white; c.lineWidth = 1.4; c.beginPath(); c.moveTo(a - 5, b - 9); c.quadraticCurveTo(a, b - 6, a + 5, b - 9); c.stroke(); c.beginPath(); c.arc(a, b - 12, 1.6, 0, TAU); c.stroke(); }

/* 04 · 14:30 体育课 */
S.pe = (c, t) => {
  const T = t % 12, I = new Iso(c, 290, 86, 24);
  c.fillStyle = '#F3E2B8'; c.fillRect(0, 0, 600, 600);
  const cx = 10, cy = 10;
  const D = [];
  D.push([0, () => { I.shadow(-2.6, 1.5, 2.6, 10, 3.2); I.box(-2.6, 1.5, 0, 2.6, 10, 3.2, K.cobalt, { pr: 'dots', prc: '#6E8EF0' });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) I.poly(I.qR(0, 2.1 + i * 1.55, .5 + j * 1.3, .8, .8), j ? K.sky : K.yellow, 1.5);
    I.box(0, 3.6, 2.85, .12, 5.6, .6, K.yellow, { lw: 1.6 }); I.textR('桂花小学', .12, 8.75, 2.98, 19, K.ink); }]);
  sorted(D.splice(0));
  I.ellipse(cx, cy, 7.2, 4.6, K.coral, { lw: 2, pat: 'stripes', patc: '#FF7B7F' });
  [[6.7, 4.15], [6.15, 3.6]].forEach(([a, b]) => { const pts = []; for (let i = 0; i <= 48; i++) { const g = i / 48 * TAU; pts.push(I.p(cx + Math.cos(g) * a, cy + Math.sin(g) * b)); } c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.4; c.stroke(); });
  I.ellipse(cx, cy, 5.5, 2.9, '#7ED39B', { lw: 2, pat: 'hlines', patc: '#93DDAC' });
  I.ellipse(cx, cy, 1.4, 1.4, null, { lw: 0 }); { const pts = []; for (let i = 0; i <= 32; i++) { const g = i / 32 * TAU; pts.push(I.p(cx + Math.cos(g) * 1.3, cy + Math.sin(g) * 1.3)); } c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.6; c.stroke(); }
  // flag
  D.push([3 + 3, () => { I.box(3, 3, 0, .5, .5, .4, '#E5E0F2', { lw: 1.4 }); I.box(3.18, 3.18, .4, .14, .14, 4.4, '#B8B3D9', { lw: 1.3 }); const [a, b] = I.p(3.25, 3.25, 4.8); c.beginPath(); c.moveTo(a, b); for (let s = 0; s <= 10; s++) c.lineTo(a + s * 2.6, b + 2 + Math.sin(s * .7 - t * 5) * 1.8); for (let s = 10; s >= 0; s--) c.lineTo(a + s * 2.6, b + 15 + Math.sin(s * .7 - t * 5) * 1.8); c.closePath(); paint(c, K.red, 1.5); c.fillStyle = K.yellow; c.beginPath(); c.arc(a + 5, b + 7, 2, 0, TAU); c.fill(); }]);
  // runners
  const shrink = 1 - .78 * smooth(0, 9.5, T);
  for (let i = 0; i < 5; i++) {
    const g = T * .52 + i * .42 + 2, x = cx + Math.cos(g) * 6.4, y = cy + Math.sin(g) * 3.9, dir = (-Math.sin(g) * 6.4 - Math.cos(g) * 3.9) >= 0 ? 1 : -1, me = i === 0;
    D.push([x + y, () => { fig(I, x, y, 0, { pose: 'run', ph: t * 13 + i, dir, mood: me ? (shrink > .6 ? 'sad' : 'smile') : 'smile', shirt: K.white, hat: me });
      if (me) { const [a, b] = I.p(x, y, 0); c.globalAlpha = .9; cloud(c, a + 2, b - 58, .6 * shrink, '#C9C5DE'); c.globalAlpha = 1; } }]);
  }
  D.push([cx + cy, () => { fig(I, cx, cy, 0, { kind: 'teacher', arm: 'up', mood: 'o', shirt: K.mint }); if (T % 3 < .5) { const [a, b] = I.p(cx, cy, 0); say(c, '嘟—', a + 22, b - 50, 13, K.coral); } }]);
  // skipping rope
  { const rx = 18.4, ph = t * 7, hop = Math.max(0, Math.sin(ph)) * 7;
    D.push([rx + 6.4, () => fig(I, rx, 6.4, 0, { arm: 'hold', dir: 1, shirt: K.white, mood: 'smile' })]);
    D.push([rx + 8.3, () => { const a = I.p(rx, 6.4, 1.1), b = I.p(rx, 10.2, 1.1); c.strokeStyle = K.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0] + 8, a[1] - 2); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.cos(ph) * 32, b[0] - 6, b[1] - 2); c.stroke();
      fig(I, rx, 8.3, 0, { hop, arm: 'up', mood: 'smile', shirt: K.pink, hat: false }); }]);
    D.push([rx + 10.2, () => fig(I, rx, 10.2, 0, { arm: 'hold', dir: -1, shirt: K.white, mood: 'smile' })]); }
  // football
  { const u = (Math.sin(t * 1.6) + 1) / 2, bx = lerp(10.6, 14.4, u), by = lerp(17.1, 16.7, u), hop = Math.abs(Math.sin(u * Math.PI)) * .6;
    D.push([10 + 17.3, () => fig(I, 10, 17.3, 0, { pose: 'run', ph: t * 6, mood: 'smile', shirt: K.yellow, hat: false })]);
    D.push([15 + 16.5, () => fig(I, 15, 16.5, 0, { pose: 'run', ph: t * 6 + 2, dir: -1, mood: 'smile', shirt: K.sky, hat: false })]);
    D.push([bx + by, () => { const [a, b] = I.p(bx, by, hop); c.fillStyle = SH; const [ga, gb] = I.p(bx, by, 0); c.beginPath(); c.ellipse(ga, gb, 4, 1.6, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(a, b - 3.5, 3.6, 0, TAU); paint(c, K.white, 1.4); c.fillStyle = K.ink; c.beginPath(); c.arc(a, b - 3.5, 1.2, 0, TAU); c.fill(); }]); }
  [[3, 13.5], [1.2, 15.5], [15, 1], [5, 0], [22, 12.5], [13.5, 19.5], [19, 16.5], [8, -1]].forEach(([x, y]) => D.push([x + y, () => tree(I, x, y)]));
  sorted(D);
  grassTufts(I, 21, 2, 15.5, 20, 6, 20, '#C9B57E');
  for (let i = 0; i < 2; i++) bird(c, ((t * 34 + i * 340) % 760) - 80, 46 + i * 26, t * 9 + i);
};

/* 06 · 20:30 作业，晚饭，晚安 (night) */
S.night = (c, t) => {
  const T = t % 12, I = new Iso(c, 258, 231, 32), k = I.s / 26;
  c.fillStyle = '#BDE6C5'; c.fillRect(0, 0, 600, 600);
  [[0, -5, 48, 170, K.lilac], [5, -6, 54, 190, K.sky], [10, -4, 44, 150, K.mint], [-4, -2, 40, 130, K.pink]].forEach(h => hill(I, ...h));
  I.ellipse(8, 10.4, 3, 1.5, K.water, { lw: 2 });
  room(I, 9, 6, 3.2, K.sky, K.lilac, K.wood, { patA: 'dots', floorPat: 'stripes' });
  I.box(4.6, .3, .35, .22, 2.8, 2.6, K.yellow, { lw: 1.8 });
  windowL(I, 6.7, .3, 1.4, 1.6, 1.2);
  const lamp = T < 7.4;
  const D = [];
  D.push([1.5, () => { I.box(.7, .4, .35, 2.6, 1, .78, K.yellow, { pl: 'zig' });
    const [a, b] = I.p(2.9, .7, 1.13); limb(c, a, b, a - 4, b - 16, K.ink, 1.4); c.beginPath(); c.moveTo(a - 11, b - 14); c.lineTo(a + 1, b - 20); c.lineTo(a + 3, b - 14); c.closePath(); paint(c, K.coral, 1.4);
    const [p, q] = I.p(1.7, 1.1, 1.13); c.save(); c.translate(p, q); rr(c, -9, -4, 16, 7, 1); paint(c, K.white, 1.2); c.restore(); }]);
  D.push([5.6 + .6 + 1.5, () => { I.box(5.4, .5, .35, 2.4, 3.2, .45, K.white); I.box(5.5, .6, .8, 2.2, .9, .22, K.white, { pt: null });
    const asleep = T >= 7.4; I.box(5.45, asleep ? 1.4 : 1.8, .8, 2.3, asleep ? 2.3 : 1.9, asleep ? .26 : .14, K.cobalt, { pt: 'stars', ptc: '#FFE08A' });
    if (asleep) sleeper(I, 6.5, .95, 1.15, t); }]);
  if (!(T >= 7.4)) {
    D.push([2.1 + 2.0, () => fig(I, 2.1, 2.0, .35, { pose: 'sit', back: true, hat: false, arm: 'hold', hold: (c2, x, y) => { const w = Math.sin(t * 18) * 1.5; limb(c2, x, y, x + 2 + w, y - 4, K.yellow, 1.2); } })]);
    if (T > 3.2) { const u = smooth(3.2, 4.6, T); D.push([lerp(4.2, 3.3, u) + lerp(4.8, 2.6, u), () => fig(I, lerp(4.2, 3.3, u), lerp(4.8, 2.6, u), .35, { kind: 'mom', pose: u < 1 ? 'walk' : 'stand', ph: t * 8, dir: -1, mood: 'smile', arm: 'hold', hold: T > 4.6 ? holdPaper : undefined })]); }
  }
  [[10.5, 2.5], [10, 7.5], [2, 9], [12, 5], [4.6, 12]].forEach(([x, y]) => D.push([x + y, () => tree(I, x, y, { gui: false })]));
  sorted(D);
  // night: darken everything, then add light
  c.globalCompositeOperation = 'multiply'; c.fillStyle = '#5D589A'; c.fillRect(0, 0, 600, 600);
  c.globalCompositeOperation = 'screen';
  if (lamp) { const [a, b] = I.p(2.6, .9, 1.4), g = c.createRadialGradient(a, b, 4, a, b, 120); g.addColorStop(0, 'rgba(255,214,120,.85)'); g.addColorStop(.5, 'rgba(255,190,90,.25)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 600, 600); }
  { const q = I.qL(6.7, .3, 1.4, 1.6, 1.2); I.path(q); c.fillStyle = 'rgba(141,211,246,.55)'; c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // moon & stars
  c.fillStyle = '#FFF4C9'; c.beginPath(); c.arc(470, 64, 18, 0, TAU); c.fill(); c.fillStyle = '#5D589A'; c.beginPath(); c.arc(478, 58, 15, 0, TAU); c.fill();
  const R = rng(42); for (let i = 0; i < 26; i++) { const x = R() * 600, y = R() * 140, tw = .4 + .6 * Math.abs(Math.sin(t * 1.4 + i)); c.globalAlpha = tw; c.fillStyle = '#FFF4C9'; c.fillRect(x, y, 2, 2); }
  c.globalAlpha = 1;
  for (let i = 0; i < 12; i++) { const [a, b] = I.p(2 + (i * 1.9) % 11 + Math.sin(t * .6 + i) * .5, 7.5 + (i * 2.3) % 5 + Math.cos(t * .5 + i) * .4, .8); c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 2 + i * 1.7)); c.fillStyle = '#FFE47A'; c.beginPath(); c.arc(a, b, 2.2, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  if (T > 4.6 && T < 7.4) { const [a, b] = I.p(3.3, 2.6, .35); bubble(c, a - 8 * k, b - 96 * k, 128 * k, 36 * k, 'left'); say(c, '下次细心点哈。', a + 56 * k, b - 78 * k, 15 * k); }
};

/* =========================================================
   Runtime: grain mask, sizing, visibility, loop
   ========================================================= */
function makeMask(N = 1200) {
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), R = rng(7);
  const inset = N * .07, rad = N * .07, h = N / 2 - inset, band = N * .045, erode = N * .03;
  const sd = (px, py) => { const qx = Math.abs(px - N / 2) - (h - rad), qy = Math.abs(py - N / 2) - (h - rad); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad; };
  x.fillStyle = '#000'; x.beginPath(); x.roundRect(inset, inset, N - 2 * inset, N - 2 * inset, rad); x.fill();
  for (let i = 0; i < 260000; i++) { const px = R() * N, py = R() * N, d = sd(px, py); if (d > 0 && d < band && R() < Math.pow(1 - d / band, 2.4) * .8) { const s = 1.5 + R() * 2.5; x.fillRect(px, py, s, s); } }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260000; i++) { const px = R() * N, py = R() * N, d = sd(px, py); if (d < 0 && d > -erode && R() < Math.pow(1 + d / erode, 2) * .55) { const s = 1.5 + R() * 2; x.fillRect(px, py, s, s); } }
  return cv;
}
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeBack = x => { const c1 = 1.25; return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
let MASK;
const list = [];
function resize(sc) {
  const r = sc.cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), px = Math.max(2, Math.round(r.width * dpr));
  if (sc.cv.width !== px) { sc.cv.width = sc.cv.height = px; sc.ctx._pat = null; }
}
function render(sc, t) {
  const { cv, ctx } = sc, W = cv.width;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
  ctx.setTransform(W / 600, 0, 0, W / 600, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  S[sc.name](ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-in';
  const m = W * Math.max(sc.grow, .001); ctx.drawImage(MASK, (W - m) / 2, (W - m) / 2, m, m);
  ctx.globalCompositeOperation = 'source-over';
}
function loop(now) {
  for (const sc of list) {
    if (!sc.vis) continue;
    if (sc.t0 == null) sc.t0 = now;
    const e = (now - sc.t0) / 1000;
    sc.grow = reduce ? 1 : easeBack(clamp(e / 1.4, 0, 1));
    if (reduce && sc.drawn) continue;
    render(sc, reduce ? sc.still : e + sc.offset); sc.drawn = true;
  }
  requestAnimationFrame(loop);
}
window.GE = { K, SH, CN, TAU, clamp, smooth, lerp, mix, rng, rr, paint, limb, pattern, Iso, tree, hill, bird, cloud, steam, bubble, say, burst, heart, pole, fig, holdBroom, holdDuster, holdPaper, holdPlate, melon, sleeper, room, windowL, windowR, grassTufts, vase };
window.GuilinScenes = {
  start() {
    MASK = makeMask();
    const io = new IntersectionObserver(es => es.forEach(e => { const sc = e.target._sc; sc.vis = e.isIntersecting; if (!sc.vis) sc.drawn = false; }), { rootMargin: '80px 0px', threshold: .12 });
    document.querySelectorAll('canvas[data-scene]').forEach(cv => {
      const sc = { cv, ctx: cv.getContext('2d'), name: cv.dataset.scene, grow: 0, vis: false, t0: null, offset: +(cv.dataset.offset || 0), still: +(cv.dataset.still || 3) };
      cv._sc = sc; resize(sc); list.push(sc); io.observe(cv);
    });
    addEventListener('resize', () => list.forEach(sc => { resize(sc); sc.drawn = false; }));
    requestAnimationFrame(loop);
  },
};
})();
