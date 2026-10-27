/* 小黄帽的一天 · the short drama.
   One continuous isometric town, a camera that follows the kid, and a 140 s story timeline.
   Story time s is driven by scroll (or by autoplay, which scrolls for you). */
(() => {
const { K, SH, CN, TAU, clamp, smooth, lerp, mix, rng, rr, paint, limb, Iso, tree, hill, bird, cloud, steam, bubble, say, burst, heart, pole, fig,
  holdBroom, holdDuster, holdPaper, holdPlate, melon, sleeper, windowL, windowR, grassTufts, vase } = window.GE;

const TT = 140;
const inOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const seg = (s, a, b) => clamp((s - a) / (b - a), 0, 1);

/* =========================================================
   Story data
   ========================================================= */
const CHAPTERS = [
  { t: 0, n: '01', time: '07:10', zh: '赖床', en: 'Five more minutes', col: K.yellow },
  { t: 26.6, n: '02', time: '10:20', zh: '第三节课', en: "I'd rather be the sparrow", col: K.sky },
  { t: 44, n: '03', time: '12:10', zh: '午饭，和一次挨打', en: 'The vase, the duster, the watermelon', col: K.coral },
  { t: 72, n: '04', time: '14:30', zh: '体育课', en: 'Run it off', col: K.mint },
  { t: 92, n: '05', time: '16:40', zh: '放学路', en: 'The way home', col: K.pink },
  { t: 117.5, n: '06', time: '20:30', zh: '作业，晚饭，晚安', en: 'Homework, dinner, goodnight', col: K.lilac },
];
const CLOCK = [[0, 430], [21, 440], [26.4, 462], [26.6, 620], [43.6, 640], [44.2, 720], [71.6, 770], [72.2, 860], [91.6, 900], [92.2, 990], [117, 1070], [117.6, 1225], [129, 1270], [140, 1300]];
const SUBS = [
  [1.2, 2.8, '', '叮铃铃——', 'Brrring—'],
  [4.4, 5.8, '', '叮铃铃——！', 'Brrring—!'],
  [5.9, 7.3, '妈妈', '起床咯！', 'Up you get!'],
  [7.5, 9.8, '妈妈', '莫磨蹭咯，粉要坨了！', 'Hurry up, the noodles are going soggy!'],
  [9.9, 11.2, '我', '再睡一分钟……就一分钟。', 'One more minute. Just one.'],
  [16.8, 21.4, '', '二两米粉，多放酸豆角，汤喝到见底。', 'Rice noodles, extra pickled beans, every last drop.'],
  [22, 25.8, '', '上学路上，桂花香了一路。', 'The whole way to school smells of osmanthus.'],
  [28.6, 32.2, '老师', '二分之一加三分之一，等于多少？', 'One half plus one third equals…?'],
  [32.5, 35.2, '我（心里）', '麻雀不用上数学课。', 'Sparrows don’t have maths.'],
  [35.5, 38.1, '我（心里）', '昨天听写才 62 分，回家怎么说……', '62 on yesterday’s test. How do I tell them…'],
  [39.2, 41.8, '同桌（纸条）', '放学抓蜻蜓去？', 'Dragonflies after school?'],
  [41.9, 43.4, '我', '好！', 'Deal!'],
  [44.4, 47.4, '', '下课铃一响，跑回家吃午饭。', 'The bell goes. Run home for lunch.'],
  [48.2, 51.6, '我', '看我的金箍棒！', 'Behold — the Monkey King’s staff!'],
  [52.8, 55.0, '爸爸', '你给我站住！', 'Get back here!'],
  [60.2, 62.8, '我', '呜……我错了……', 'I’m sorry…'],
  [63.2, 65.8, '妈妈', '好了好了，吃西瓜。', 'Alright, alright. Watermelon.'],
  [66.6, 71.6, '', '妈妈没说话，把中间最甜的那一勺挖给了我。', 'Mum said nothing, and gave me the sweetest spoonful.'],
  [77.6, 80.6, '体育老师', '最后一圈，加油！', 'Last lap, come on!'],
  [82.6, 88.4, '', '跑完八百米，62 分好像也没那么可怕了。', 'After 800 metres, 62 doesn’t feel so scary.'],
  [95.2, 99.2, '', '放学铃一响，小黄帽们涌出校门。', 'The bell rings and the yellow caps pour out.'],
  [100.2, 102.8, '炸串阿婆', '五毛一串，要辣不？', 'Fifty cents a skewer. Spicy?'],
  [102.9, 104.4, '我', '要！', 'Yes please!'],
  [107.2, 110.0, '同桌', '嘘——它停在荷叶上了。', 'Shh — it’s on the lily pad.'],
  [110.3, 112.6, '', '蚂蚱一下子蹦进了草里。', 'A grasshopper springs into the grass.'],
  [113.0, 115.6, '我', '抓到了！', 'Got it!'],
  [116.0, 117.8, '同桌', '明天见！', 'See you tomorrow!'],
  [121.6, 124.4, '', '台灯下，写完最后一道题。', 'Under the lamp, the last question done.'],
  [124.8, 127.6, '妈妈', '（签字）下次细心点哈。', '(signing) Be more careful next time.'],
  [127.8, 128.9, '我', '嗯！', 'Mm!'],
  [130.4, 134.6, '', '窗外的山黑黢黢的，月亮挂在山尖上。', 'Outside, dark hills, and the moon on their tips.'],
  [135.6, 139.6, '', '晚安，桂林。', 'Goodnight, Guilin.'],
];
const SFX = [[1.0, 'alarm'], [4.2, 'alarm'], [7.4, 'alarm'], [11.0, 'boing'], [17.0, 'slurp'], [19.4, 'slurp'], [25.6, 'bell'], [38.2, 'swish'], [44.0, 'bell'],
  [44.6, 'whoosh'], [48.4, 'swish'], [49.4, 'swish'], [50.4, 'swish'], [51.3, 'swish'], [52.0, 'crash'], [66.8, 'pop'], [67.8, 'pop'], [68.8, 'pop'], [72.4, 'whoosh'],
  [76.2, 'whistle'], [84, 'whistle'], [89, 'whistle'], [94.0, 'bell'], [101.2, 'coin'], [110.3, 'hop'], [113.0, 'pop'], [129.2, 'click'], [136, 'chime']];
const MOODS = [[0, 'morning'], [26.6, 'class'], [44, 'run'], [47.8, 'play'], [55, 'chase'], [60, 'sad'], [66, 'warm'], [72, 'run'], [76, 'pe'], [92, 'street'], [105, 'pond'], [117.5, 'night']];
const CAM = [
  [0, 24, 6, 12], [2.6, 2.2, 3.4, 50], [10.6, 2.2, 3.4, 50], [13.0, 5.6, 6.6, 38], [16.2, 13.0, 8.6, 46], [21.6, 13.0, 8.6, 46],
  [26.0, 29.6, 8.8, 34], [28.2, 35.1, 4.4, 44], [43.4, 35.1, 4.4, 44],
  [47.6, 7.0, 5.0, 42], [51.6, 6.8, 4.6, 46], [52.4, 6.8, 4.6, 52], [55, 7.1, 5.2, 44], [71.6, 7.1, 5.2, 44],
  [75.4, 47.2, 4.2, 34], [91.6, 47.2, 4.2, 34],
  [96.0, 29.6, 9.2, 36], [100.0, 24.2, 9.2, 46], [104.6, 24.2, 9.2, 46], [107.4, 23.2, 14.4, 40], [115.6, 23.2, 14.4, 40],
  [119.6, 5.6, 6.0, 34], [122.0, 1.9, 6.2, 50], [128.4, 1.9, 6.2, 50], [130.4, 2.0, 3.4, 50], [134.8, 2.0, 3.4, 50], [140, 20, 6, 12],
];

/* =========================================================
   Where everyone is at story time s
   ========================================================= */
function along(pts, u) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let d = clamp(u, 0, 1) * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) { const f = L[i] ? clamp(d / L[i], 0, 1) : 0, a = pts[i], b = pts[i + 1]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), (b[0] - a[0]) - (b[1] - a[1]) >= 0 ? 1 : -1]; }
    d -= L[i];
  }
  return [pts[0][0], pts[0][1], 1];
}
const TRACK = { cx: 48, cy: 3.6, rx: 5.8, ry: 3.8 };
const onTrack = a => [TRACK.cx + Math.cos(a) * TRACK.rx, TRACK.cy + Math.sin(a) * TRACK.ry, (-Math.sin(a) * TRACK.rx - Math.cos(a) * TRACK.ry) >= 0 ? 1 : -1];
const lapAngle = s => 1.83 + (clamp(s, 76, 89) - 76) * .62;
const TABLE = { x: 7.1, y: 5.3, rx: 1.75, ry: 1.55 };
const chaseAt = a => [TABLE.x + Math.cos(a) * TABLE.rx, TABLE.y + Math.sin(a) * TABLE.ry, (-Math.sin(a) * TABLE.rx - Math.cos(a) * TABLE.ry) >= 0 ? 1 : -1];

function kid(s) {
  // returns { x, y, dir, pose, o }  (pose 'sleep' | 'hide' | fig pose)
  if (s < 11) return { x: 1.3, y: 2.05, pose: 'sleep' };
  if (s < 12.2) return { x: 3.0, y: 4.0, dir: 1, pose: 'stand', o: { arm: 'up', mood: 'o', hop: Math.max(0, Math.sin((s - 11) * 7)) * 6 * (1 - seg(s, 11, 12.2)) } };
  if (s < 16.4) { const [x, y, d] = along([[3.0, 4.0], [3.8, 7.6], [9, 9.7], [13.4, 9.85]], inOut(seg(s, 12.2, 16.4))); return { x, y, dir: d, pose: 'walk' }; }
  if (s < 21.8) return { x: 13.4, y: 9.85, dir: -1, pose: 'sit', o: { arm: 'hold', hold: (c, hx, hy) => limb(c, hx, hy, hx + 4, hy - 7, '#C98A4B', 1.2) } };
  if (s < 26.6) { const [x, y, d] = along([[13.4, 9.85], [29.9, 9.7], [29.9, 8.0]], inOut(seg(s, 21.8, 26.4))); return { x, y, dir: d, pose: 'walk' }; }
  if (s < 44) {
    const note = s > 39.0 && s < 43.6;
    return { x: 33.25, y: 6.7, dir: -1, pose: 'sit', o: { mood: s > 39 ? 'smile' : s > 35.5 ? 'sad' : 'flat', arm: note ? 'hold' : undefined, hold: note ? (c, hx, hy) => { rr(c, hx - 1, hy - 6, 7, 5, 1); paint(c, K.white, 1.1); } : undefined } };
  }
  if (s < 47.8) { const [x, y, d] = along([[33.25, 6.9], [32.4, 8.0], [29.9, 8.3], [29.9, 9.7], [9, 9.7], [7.6, 7.6], [6.4, 3.1]], inOut(seg(s, 44, 47.8))); return { x, y, dir: d, pose: 'run' }; }
  if (s < 52) return { x: 6.4, y: 3.1, dir: 1, pose: 'stand', o: { arm: 'hold', mood: 'smile', hold: holdBroom(Math.sin(s * 9) * 1.1) } };
  if (s < 55) return { x: 6.4, y: 3.1, dir: 1, pose: 'stand', o: { arm: 'up', mood: 'o' } };
  if (s < 60) { const a = -2.0 + (s - 55) * 2.3, [x, y, d] = chaseAt(a); return { x, y, dir: d, pose: 'run', o: { mood: 'cry' } }; }
  if (s < 66) return { x: 6.0, y: 7.4, dir: 1, pose: 'stand', o: { mood: s < 64.5 ? 'cry' : 'sad' } };
  if (s < 72) return { x: 7.2, y: 6.65, dir: -1, pose: 'sit', o: { mood: 'smile', arm: 'hold', hold: (c, hx, hy) => melon(c, hx + 2, hy - 2, .6) } };
  if (s < 76) { const [x, y, d] = along([[7.2, 6.65], [9.2, 9.7], [40.8, 9.7], [42.0, 7.8], [46.5, 7.3]], inOut(seg(s, 72, 76))); return { x, y, dir: d, pose: 'run' }; }
  if (s < 89) { const [x, y, d] = onTrack(lapAngle(s)); return { x, y, dir: d, pose: 'run', o: { mood: s > 84 ? 'smile' : 'sad' } }; }
  if (s < 92) { const [x, y] = onTrack(lapAngle(89)); return { x, y, dir: 1, pose: 'stand', o: { mood: 'smile' } }; }
  if (s < 99.6) { const [sx, sy] = onTrack(lapAngle(89)); const [x, y, d] = along([[sx, sy], [41.4, 7.8], [32.2, 7.9], [29.9, 8.3], [29.9, 9.7], [24.0, 9.85]], inOut(seg(s, 92, 99.6))); return { x, y, dir: d, pose: 'walk' }; }
  if (s < 104.6) return { x: 24.0, y: 9.85, dir: 1, pose: 'stand', o: { arm: s > 101.4 ? 'hold' : undefined, hold: s > 101.4 ? skewer : undefined, mood: 'smile' } };
  if (s < 107.2) { const [x, y, d] = along([[24.0, 9.85], [23.8, 11.0], [23.0, 12.6], [21.6, 13.6]], inOut(seg(s, 104.6, 107.2))); return { x, y, dir: d, pose: 'walk', o: { arm: 'hold', hold: skewer } }; }
  if (s < 111) { const [x, y] = along([[21.6, 13.6], [24.4, 13.5]], seg(s, 107.2, 111)); return { x, y, dir: 1, pose: 'walk', o: { mood: 'o' } }; }
  if (s < 113) { const [x, y] = along([[24.4, 13.5], [25.6, 13.7]], inOut(seg(s, 111, 112.4))); return { x, y, dir: 1, pose: s < 112.4 ? 'run' : 'stand', o: { arm: 'up', mood: 'o' } }; }
  if (s < 116.2) return { x: 25.6, y: 13.7, dir: 1, pose: 'stand', o: { arm: 'up', mood: 'smile', hold: dragonflyHeld } };
  if (s < 120.6) { const [x, y, d] = along([[25.6, 13.7], [22.4, 12.2], [17.2, 10.9], [14.5, 9.7], [9.4, 9.7], [6.4, 8.0], [3.6, 7.6]], inOut(seg(s, 116.2, 120.6))); return { x, y, dir: d, pose: 'walk' }; }
  if (s < 128.8) return { x: 1.85, y: 6.9, dir: -1, pose: 'sit', o: { back: false, mood: s > 127.8 ? 'smile' : 'flat', arm: 'hold', hold: (c, hx, hy) => { const w = Math.sin(s * 18) * 1.5; limb(c, hx, hy, hx + 2 + w, hy - 4, K.yellow, 1.2); } } };
  if (s < 129.6) { const [x, y, d] = along([[1.85, 6.9], [3.0, 5.4]], seg(s, 128.8, 129.6)); return { x, y, dir: d, pose: 'walk' }; }
  return { x: 1.3, y: 2.05, pose: 'sleep' };
}
function skewer(c, x, y) { limb(c, x, y + 2, x + 3, y - 12, '#E8C28A', 1); [[.8, -3], [1.6, -6.5], [2.4, -10]].forEach(([a, b], i) => { c.beginPath(); c.arc(x + a, y + b, 2.4, 0, TAU); paint(c, i === 1 ? '#C9653F' : '#E2894A', 1); }); }
function dragonfly(c, x, y, t, k = 1) {
  c.save(); c.translate(x, y); c.scale(k, k);
  const f = .35 + .65 * Math.abs(Math.sin(t * 38));
  c.fillStyle = 'rgba(255,255,255,.8)'; c.strokeStyle = K.ink; c.lineWidth = .8;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { c.beginPath(); c.ellipse(sx * 4.5, -1 + sy * 1.2, 4.6, 1.5 * f, sx * sy * .25, 0, TAU); c.fill(); c.stroke(); });
  limb(c, -7, 0, 6, 0, K.cobalt, 1.6); c.beginPath(); c.arc(7, 0, 1.7, 0, TAU); paint(c, K.cobalt, .8);
  c.restore();
}
function dragonflyHeld(c, x, y) { dragonfly(c, x + 2, y - 4, performance.now() / 1000, .9); }

/* actors other than the kid: [name, s → state | null] */
function others(s, rt) {
  const A = [];
  const P = (x, y, o) => A.push({ x, y, o });
  // mum
  if (s > 4.8 && s < 11.4) P(4.0, 5.0, { kind: 'mom', dir: -1, arm: 'hips', mood: 'flat' });
  if (s >= 63 && s < 66) { const [x, y, d] = along([[10.8, 7.8], [8.6, 7.1]], inOut(seg(s, 63, 64.8))); P(x, y, { kind: 'mom', pose: s < 64.8 ? 'walk' : 'stand', ph: rt * 8, dir: d, arm: 'hold', hold: holdPlate }); }
  if (s >= 66 && s < 72) P(7.0, 4.05, { kind: 'mom', pose: 'sit', mood: 'smile' });
  if (s > 121.6 && s < 128.8) { const u = seg(s, 121.6, 123.4); const [x, y, d] = along([[5.6, 7.6], [3.0, 7.3]], inOut(u)); P(x, y, { kind: 'mom', pose: u < 1 ? 'walk' : 'stand', ph: rt * 8, dir: d, mood: 'smile', arm: 'hold', hold: s > 123.4 ? holdPaper : undefined }); }
  // dad
  if (s >= 47.8 && s < 52.6) P(9.4, 5.2, { kind: 'dad', pose: 'sit', dir: -1, mood: 'flat', arm: 'hold', hold: (c, x, y) => { rr(c, x - 6, y - 10, 13, 10, 1); paint(c, '#EDEAF6', 1.2); } });
  if (s >= 52.6 && s < 55) P(8.8, 5.6, { kind: 'dad', dir: -1, arm: 'up', mood: 'flat', hold: holdDuster(Math.sin(rt * 10) * .3) });
  if (s >= 55 && s < 60) { const a = -2.0 + (s - 55) * 2.3 - 1.0, [x, y, d] = chaseAt(a); P(x, y, { kind: 'dad', pose: 'run', ph: rt * 12, dir: d, arm: 'up', mood: 'flat', hold: holdDuster(Math.sin(rt * 12) * .6) }); }
  if (s >= 60 && s < 66) P(7.2, 7.0, { kind: 'dad', dir: -1, mood: 'flat', hold: holdDuster(.4) });
  if (s >= 66 && s < 72) P(8.75, 5.4, { kind: 'dad', pose: 'sit', dir: -1, mood: 'smile' });
  // classroom
  if (s > 26 && s < 44) {
    P(33.3, 2.1, { kind: 'teacher', arm: 'point', dir: -1, mood: 'smile' });
    P(35.5, 6.7, { pose: 'sit', dir: -1, mood: 'smile', pack: K.mint, arm: s > 37.6 && s < 38.4 ? 'up' : undefined });
    [[2.25, 3.7], [4.5, 3.7], [6.75, 3.7], [6.75, 5.7]].forEach(([x, y]) => P(31 + x, 1 + y, { pose: 'sit', back: true, hat: false }));
  }
  // noodle vendor, snack granny, fisherman: always there
  P(14.9, 9.0, { kind: 'vendor', dir: -1 });
  P(24.4, 7.95, { kind: 'mom', shirt: K.lilac, dir: 1, mood: 'smile' });
  P(19.4, 14.4, { kind: 'fisher', dir: 1, mood: 'flat', arm: 'hold', hold: (c, x, y) => { limb(c, x, y, x + 26, y - 18, '#C98A4B', 1); c.strokeStyle = K.ink; c.lineWidth = .8; c.beginPath(); c.moveTo(x + 26, y - 18); c.lineTo(x + 30, y + 14); c.stroke(); } });
  // PE
  if (s > 72 && s < 92) {
    P(TRACK.cx, TRACK.cy, { kind: 'teacher', shirt: K.mint, arm: 'up', mood: 'o' });
    for (let i = 1; i < 4; i++) { const [x, y, d] = onTrack(lapAngle(Math.min(s, 89)) + i * .45); P(x, y, { pose: s < 89 ? 'run' : 'stand', ph: rt * 13 + i, dir: d, hat: false, shirt: K.white, mood: 'smile', pack: i === 1 ? undefined : undefined }); }
    const hop = Math.max(0, Math.sin(rt * 7)) * 7;
    P(57, 1.8, { arm: 'hold', dir: 1, mood: 'smile', hat: false });
    P(57, 3.6, { hop, arm: 'up', mood: 'smile', shirt: K.pink, hat: false, rope: true });
    P(57, 5.4, { arm: 'hold', dir: -1, mood: 'smile', hat: false });
  }
  // friend after school
  if (s >= 92 && s < 119) {
    let x, y, d = 1, pose = 'stand', o = {};
    if (s < 99.8) { const k = kid(s - .7); x = k.x + .9; y = k.y + .2; d = k.dir || 1; pose = 'walk'; }
    else if (s < 104.6) { x = 25.1; y = 9.95; d = -1; }
    else if (s < 107.4) { const k = kid(s - .5); x = k.x + .9; y = k.y - .1; d = k.dir || 1; pose = 'walk'; }
    else if (s < 116) { x = 23.0; y = 13.3; d = 1; o = { arm: 'point', mood: 'o' }; }
    else { [x, y, d] = along([[23.0, 13.3], [31, 13.6]], seg(s, 116, 119)); pose = 'walk'; o = { arm: 'wave', t: rt }; }
    if (x !== undefined) P(x, y, Object.assign({ pose, ph: rt * 8, dir: d, pack: K.mint, mood: 'smile' }, o));
  }
  // kids pouring out of the gate
  if (s > 94 && s < 106) for (let i = 0; i < 5; i++) {
    const st = 94.4 + i * .7, u = s - st; if (u < 0) continue;
    const dirx = i % 2 ? 1 : -1, x = 29.9 + dirx * u * 1.5, y = u < 1 ? lerp(8.2, 9.6 + (i % 3) * .12, u) : 9.6 + (i % 3) * .12;
    P(x, y, { pose: 'walk', ph: rt * 8 + i, dir: dirx, pack: [K.coral, K.sky, K.pink, K.yellow, K.lilac][i], mood: 'smile' });
  }
  return A;
}

/* =========================================================
   The town
   ========================================================= */
const HILLS = (() => { const R = rng(19), out = [], cols = [K.mint, K.lilac, K.sky, K.pink]; for (let x = -14; x < 70; x += 3.4 + R() * 2.2) out.push([x, -6 - R() * 3.5, 30 + R() * 22, 90 + R() * 70, cols[Math.floor(R() * 4)]]); return out.sort((a, b) => a[0] + a[1] - b[0] - b[1]); })();
const POLES = [-2.4, 15.6, 27.2, 38.8, 50.5];
const TREES = [[10.4, 9.35], [16.6, 9.35], [26.0, 9.35], [36, 9.35], [44, 9.35], [53, 9.35], [-1.6, 4], [11, 2], [-1.2, 8.6], [14, 13.6], [6, 14.6], [1.5, 15.2], [16.5, 19.5], [27.8, 14.2], [29.5, 18.5], [12.5, 17.6], [31, 13.4], [52, 13.6], [3, 18.8], [24.5, 2.5], [21, 3.6], [57, 12.8], [-4, 13]];
const HOUSES = [[-1, 18.4, 3, 2.6, 2.6, K.mint], [4.4, 19, 3.2, 2.8, 3.0, K.lilac], [9.8, 18.6, 2.4, 2.4, 2.2, K.yellow], [33, 13.6, 3, 2.6, 3.2, K.sky], [37.5, 14.2, 3.4, 3, 2.6, K.pink], [42.4, 13.6, 2.6, 2.6, 2.4, K.mint], [47, 14, 3, 2.6, 2.8, K.yellow], [-4.2, 3, 2.8, 3, 2.8, K.pink]];
const FENCE = [[26.0, 28.4], [31.6, 40.4], [41.8, 58]];

let VW = 0, VH = 0;
const onScreen = (I, x, y, m = 1) => { const [a, b] = I.p(x, y); return a > -320 * m && a < VW + 320 * m && b > -260 * m && b < VH + 420 * m; };

function drawWorld(c, I, s, rt) {
  const Z = I.s, k = Z / 24;
  // ground
  I.flat(-30, -14, 110, 10, '#E4F5DE');
  HILLS.forEach(h => { if (onScreen(I, h[0], h[1], 1.4)) hill(I, h[0], h[1], h[2] * k, h[3] * k, h[4]); });
  I.flat(26, -4, 32, 12.75, '#F3E2B8');
  I.flat(-30, 9.3, 110, .7, '#FFF3D6'); I.flat(-30, 10, 110, 1.8, K.road, { lw: 2 }); I.flat(-30, 11.8, 110, .6, '#FFF3D6');
  for (let i = -20; i < 70; i += 2) if (i < 28 || i > 32) I.flat(i, 10.83, .9, .14, K.yellow);
  for (let j = 0; j < 5; j++) I.flat(28.7 + j * .55, 10.05, .3, 1.7, K.white);
  I.flat(-30, 12.4, 110, 30, '#D7F0C8');
  // track
  if (onScreen(I, TRACK.cx, TRACK.cy, 1.5)) {
    I.ellipse(TRACK.cx, TRACK.cy, 6.8, 4.6, K.coral, { lw: 2, pat: 'stripes', patc: '#FF7B7F' });
    [[6.3, 4.15], [5.8, 3.7], [5.3, 3.25]].forEach(([a, b]) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const g = i / 48 * TAU, p = I.p(TRACK.cx + Math.cos(g) * a, TRACK.cy + Math.sin(g) * b); i ? c.lineTo(...p) : c.moveTo(...p); } c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.3; c.stroke(); });
    I.ellipse(TRACK.cx, TRACK.cy, 4.8, 2.8, '#7ED39B', { lw: 2, pat: 'hlines', patc: '#93DDAC' });
  }
  // pond
  if (onScreen(I, 22.5, 16.6, 1.5)) {
    I.ellipse(22.5, 16.6, 3.9, 2.6, '#BFE3B4', { lw: 0 }); I.ellipse(22.5, 16.6, 3.6, 2.3, K.water, { lw: 2 });
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) { const [a, b] = I.p(20.4 + (i * 1.3 + rt * .3) % 4.4, 15.4 + (i * .7) % 2.6); c.beginPath(); c.moveTo(a - 5 * k, b); c.quadraticCurveTo(a, b - 2.4 * k, a + 5 * k, b); c.stroke(); }
    [[21, 16.2], [22.6, 17.6], [24.2, 16.4], [23.4, 15.4], [20.4, 17.4]].forEach(([x, y], i) => { const [a, b] = I.p(x, y); c.beginPath(); c.ellipse(a, b, 7 * k, 3.4 * k, 0, .35, TAU); c.lineTo(a, b); paint(c, K.green, 1.2); if (i === 2) { c.beginPath(); c.arc(a + 1, b - 3 * k, 2.6 * k, 0, TAU); paint(c, K.pink, 1); } });
    { const [a, b] = I.p(20.95, 15.85); const bob = Math.sin(rt * 3) * 1.2; c.beginPath(); c.arc(a, b + bob, 2 * k, 0, TAU); paint(c, K.coral, 1); }
  }
  grassTufts(I, 7, -10, 12.6, 70, 10, 90);

  const D = [];
  const add = (x, y, f, m = 1) => { if (onScreen(I, x, y, m)) D.push([x + y, f]); };
  const kd = kid(s), act = others(s, rt);
  const inHome = a => a.x > -.1 && a.x < 10.2 && a.y > 1 && a.y < 8.05, inClass = a => a.x > 30.9 && a.x < 39.3 && a.y > 1 && a.y < 7.6;
  const homeA = [], classA = [];
  const kidActor = { x: kd.x, y: kd.y, o: kd, isKid: true };
  [kidActor, ...act].forEach(a => { if (a.o.pose === 'hide') return; if (inHome(a)) homeA.push(a); else if (inClass(a)) classA.push(a); else add(a.x, a.y, () => drawActor(I, a, a.x, a.y, s, rt)); });

  add(5, 4.5, () => drawHome(I.at(0, 1), s, rt, homeA), 3);
  add(35.1, 4.25, () => drawClass(I.at(31, 1), s, rt, classA), 3);
  // shops
  add(13.7, 7.1, () => { I.shadow(11.6, 5.6, 4.2, 3, 2.8); I.box(11.6, 5.6, 0, 4.2, 3, 2.8, K.pink, { pl: 'dots', plc: '#FFC2D8', pr: 'stripes' });
    I.poly(I.qL(13.5, 8.6, 0, 1, 1.6), K.ink, 1.6); I.box(11.9, 8.6, 2.0, 3.6, .14, .62, K.yellow, { lw: 1.6 }); I.textL('桂林米粉', 12.35, 8.74, 2.16, 15 * k, K.ink);
    for (let i = 0; i < 6; i++) I.poly([[11.8 + i * .6, 8.6, 1.95], [12.4 + i * .6, 8.6, 1.95], [12.4 + i * .6, 9.3, 1.5], [11.8 + i * .6, 9.3, 1.5]], i % 2 ? K.white : K.coral, 1.4); });
  add(13.4, 9.05, () => { I.box(12.6, 8.75, 0, 1.6, .6, .7, K.white, { pt: 'check', ptc: '#FFE3EC' }); const [a, b] = I.p(13.4, 9.05, .7); c.beginPath(); c.ellipse(a, b - 3 * k, 7 * k, 3.4 * k, 0, 0, TAU); paint(c, K.white, 1.5); c.beginPath(); c.ellipse(a, b - 3.6 * k, 5.2 * k, 2.2 * k, 0, 0, TAU); c.fillStyle = '#F6D38E'; c.fill(); steam(c, a, b - 7 * k, rt, k); });
  add(19.1, 7.1, () => { I.shadow(17.2, 5.6, 3.8, 3, 2.6); I.box(17.2, 5.6, 0, 3.8, 3, 2.6, K.yellow, { pl: 'dots', plc: '#FFE08A', pr: 'zig' });
    I.poly(I.qL(18.2, 8.6, 0, 1.6, 1.5), K.sky, 1.6); I.box(17.4, 8.6, 1.95, 3.4, .14, .56, K.cobalt, { lw: 1.6 }); I.textL('玩具店', 18.1, 8.74, 2.1, 14 * k, K.white);
    for (let i = 0; i < 6; i++) I.poly([[17.3 + i * .6, 8.6, 1.9], [17.9 + i * .6, 8.6, 1.9], [17.9 + i * .6, 9.25, 1.48], [17.3 + i * .6, 9.25, 1.48]], i % 2 ? K.white : K.cobalt, 1.4); });
  add(21.4, 9.0, () => { I.box(21.35, 8.95, 0, .1, .1, 1.6, '#C98A4B', { lw: 1 }); [[0, 1.6], [-.2, 1.25], [.25, 1.3]].forEach(([dx, z], i) => { const [a, b] = I.p(21.4 + dx, 9.0, z); pinwheel(c, a, b, rt * (3 + i), 6 * k, [K.coral, K.sky, K.yellow][i]); }); });
  add(24.3, 8.65, () => { I.box(23.4, 8.25, 0, 1.8, .8, .85, K.coral, { pl: 'stripes', plc: '#FF8A8D' }); I.textL('炸串', 23.75, 9.05, .55, 11 * k, K.white);
    [[23.8, 8.5], [24.3, 8.55], [24.8, 8.5]].forEach(([x, y]) => { const [a, b] = I.p(x, y, .85); skewer(c, a - 2, b + 1); });
    const [a, b] = I.p(24.3, 8.65, 2.0); I.box(24.27, 8.62, .85, .06, .06, 1.15, '#B8B3D9', { lw: .8 }); c.beginPath(); c.moveTo(a - 22 * k, b + 6 * k); c.quadraticCurveTo(a, b - 12 * k, a + 22 * k, b + 6 * k); c.closePath(); paint(c, K.yellow, 1.6);
    c.save(); c.clip(); c.strokeStyle = K.coral; c.lineWidth = 4 * k; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(a, b - 12 * k); c.lineTo(a + i * 8 * k, b + 8 * k); c.stroke(); } c.restore(); });
  // school gate, fence, main building, flag
  add(28.65, 8.8, () => I.box(28.4, 8.55, 0, .5, .5, 2.4, K.coral, { pl: 'hlines', plc: '#FF8A8D' }));
  add(31.35, 8.8, () => I.box(31.1, 8.55, 0, .5, .5, 2.4, K.coral, { pl: 'hlines', plc: '#FF8A8D' }));
  add(30, 10.4, () => { I.box(28.2, 8.55, 2.4, 3.6, .5, .62, K.yellow, { lw: 1.8 }); I.textL('桂花小学', 28.75, 9.05, 2.56, 16 * k, K.ink); });
  FENCE.forEach(([a, b]) => { for (let x = a; x < b - .01; x += 2) { const w = Math.min(2, b - x); add(x + w / 2, 8.75, () => I.box(x, 8.6, 0, w, .3, .7, K.mint, { pl: 'hlines', plc: '#C9F0DA', lw: 1.6 })); } });
  add(47.5, -5.9, () => { I.shadow(41.5, -7.4, 13, 2.4, 3.6); I.box(41.5, -7.4, 0, 13, 2.4, 3.6, K.cobalt, { pl: 'dots', plc: '#6E8EF0' });
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) I.poly(I.qL(42.1 + i * 1.55, -5.0, .5 + j * 1.4, .8, .85), j ? K.sky : K.yellow, 1.5);
    I.box(45.3, -5.0, 3.2, 5.4, .12, .55, K.yellow, { lw: 1.6 }); I.textL('桂花小学', 46.5, -4.88, 3.33, 17 * k, K.ink); }, 2);
  add(40.4, 1.2, () => { I.box(40.2, 1.0, 0, .5, .5, .4, '#E5E0F2', { lw: 1.4 }); I.box(40.38, 1.18, .4, .14, .14, 4.4, '#B8B3D9', { lw: 1.3 }); const [a, b] = I.p(40.45, 1.25, 4.8); c.beginPath(); c.moveTo(a, b); for (let q = 0; q <= 10; q++) c.lineTo(a + q * 2.6 * k, b + 2 + Math.sin(q * .7 - rt * 5) * 1.8 * k); for (let q = 10; q >= 0; q--) c.lineTo(a + q * 2.6 * k, b + 15 * k + Math.sin(q * .7 - rt * 5) * 1.8 * k); c.closePath(); paint(c, K.red, 1.5); });
  if (s > 72 && s < 92) add(57, 3.6, () => { const a = I.p(57, 1.8, 1.1), b = I.p(57, 5.4, 1.1); c.strokeStyle = K.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a[0] + 8 * k, a[1] - 2); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.cos(rt * 7) * 32 * k, b[0] - 6 * k, b[1] - 2); c.stroke(); });
  HOUSES.forEach(([x, y, w, d, h, col]) => add(x + w / 2, y + d / 2, () => { I.shadow(x, y, w, d, h); I.box(x, y, 0, w, d, h, col, { pl: 'dots', plc: mix(col, '#FFFFFF', .45) }); I.poly(I.qL(x + .5, y + d, h * .45, .7, .7), K.sky, 1.5); I.poly(I.qL(x + w - 1.1, y + d, 0, .7, 1.3), K.ink, 1.5); }));
  TREES.forEach(([x, y]) => add(x, y, () => tree(I, x, y)));
  POLES.forEach(x => add(x, 9.55, () => { pole(I, x, 9.55); }));
  // grasshopper
  if (s > 110.2 && s < 111.4) { const u = seg(s, 110.2, 111.3), x = lerp(25.4, 27.4, u), y = lerp(13.9, 13.0, u); add(x, y, () => { const [a, b] = I.p(x, y, Math.sin(u * Math.PI) * 1.4); c.beginPath(); c.ellipse(a, b - 2, 5 * k, 2.2 * k, -.3, 0, TAU); paint(c, '#6CC24A', 1.2); limb(c, a + 2, b - 2, a + 6, b + 2, '#6CC24A', .8); }); }
  sorted(D);

  // overhead: wires, dragonflies, birds, clouds
  c.strokeStyle = K.ink; c.lineWidth = 1;
  for (let i = 0; i < POLES.length - 1; i++) { const a = I.p(POLES[i] + .1, 9.6, 4.2), b = I.p(POLES[i + 1] + .1, 9.6, 4.2); c.beginPath(); c.moveTo(...a); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 16 * k, ...b); c.stroke(); }
  if (onScreen(I, 23, 15)) for (let i = 0; i < 3; i++) { if (s > 113 && s < 116.2 && i === 0) continue; const x = 23 + Math.cos(rt * .7 + i * 2.1) * 2.2, y = 15.6 + Math.sin(rt * 1.1 + i * 1.7) * 1.2; const [a, b] = I.p(x, y, 1.3 + Math.sin(rt * 2 + i) * .3); dragonfly(c, a, b, rt + i, k); }
  const day = 1 - smooth(116, 121, s);
  if (day > 0) {
    c.globalAlpha = day;
    for (let i = 0; i < 3; i++) cloud(c, ((rt * (10 + i * 3) + i * 420) % (VW + 300)) - 150, 50 + i * 38, .9 + i * .1);
    for (let i = 0; i < 3; i++) bird(c, ((rt * 34 + i * 60) % (VW + 200)) - 100, VH * .2 - i * 14 + Math.sin(rt + i) * 8, rt * 9 + i, 1.1);
    c.globalAlpha = 1;
  }
}
function sorted(list) { list.sort((a, b) => a[0] - b[0]).forEach(e => e[1]()); }
function pinwheel(c, x, y, a, r, col) { c.save(); c.translate(x, y); c.rotate(a); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(r, -r * .2); c.lineTo(r * .3, -r); c.closePath(); paint(c, i % 2 ? col : K.white, 1); } c.restore(); }

function drawActor(Ii, a, x, y, s, rt) {
  const o = a.o;
  if (a.isKid && o.pose === 'sleep') { sleeper(Ii, x, y, 1.15, rt); return; }
  const opts = Object.assign({ pose: o.pose || 'stand', dir: o.dir || 1, ph: rt * (o.pose === 'run' ? 14 : 8) }, a.isKid ? { pack: K.coral } : {}, o.o || o);
  if (a.isKid && (o.pose === 'sit')) delete opts.pack;
  fig(Ii, x, y, o.z || (a.inRoom ? .35 : 0), opts);
  if (a.isKid && s > 35.5 && s < 88.5) { // the worry cloud follows the kid around
    const sc = 1 - smooth(80, 88.4, s), [px, py] = Ii.p(x, y, a.inRoom ? .35 : 0), k = Ii.s / 24;
    if (sc > .02) { c2(Ii).globalAlpha = .92; cloud(Ii.c, px + 4 * k, py - 52 * k, .5 * k * sc, '#C9C5DE'); Ii.c.strokeStyle = K.cobalt; Ii.c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { const d = (rt * 1.6 + i / 3) % 1; Ii.c.beginPath(); Ii.c.moveTo(px + (-4 + i * 6) * k * sc, py - (46 - d * 10) * k); Ii.c.lineTo(px + (-5 + i * 6) * k * sc, py - (43 - d * 10) * k); Ii.c.stroke(); }
      Ii.c.globalAlpha = 1; }
  }
}
const c2 = I => I.c;

/* ---------- interiors ---------- */
function drawHome(I, s, rt, actors) {
  const c = I.c, k = I.s / 24;
  c.fillStyle = SH; I.path([[0, 7, 0], [10, 7, 0], [10.6, 8.1, 0], [.6, 8.1, 0]]); c.fill();
  I.box(0, 0, 0, 10, 7, .35, K.wood, { pt: 'stripes', ptc: '#F7D8AE' });
  I.flat(4.8, .4, 5.0, 6.4, '#FFE7C4', { z: .351, pat: 'check', patc: '#FFF3DD' });
  I.box(0, 0, .35, .3, 7, 3.2, K.sky, { pt: null });
  I.box(0, 0, .35, 4.6, .3, 3.2, K.lilac, { pl: 'dots', plc: '#EDE3FF' });
  I.box(4.6, 0, .35, 5.4, .3, 3.2, K.pink, { pl: 'dots', plc: '#FFC2D8' });
  const night = smooth(117, 121, s);
  windowL(I, 2.8, .3, 1.5, 1.4, 1.2, () => { const [a, b] = I.p(3.5, .3, 2.1); if (night < .5) { c.fillStyle = K.yellow; c.beginPath(); c.arc(a + 6 * k, b + 4 * k, 7 * k, 0, TAU); c.fill(); } else { c.fillStyle = '#3B3670'; c.fillRect(a - 40, b - 40, 80, 80); c.fillStyle = '#FFF4C9'; c.beginPath(); c.arc(a + 6 * k, b + 2 * k, 5 * k, 0, TAU); c.fill(); } });
  I.poly(I.qR(.3, 3.4, 1.5, 1.1, 1.1), K.pink, 2); I.textR('★', .3, 4.3, 1.8, 16 * k, K.white);
  I.poly([[6.1, .3, 3.0], [6.6, .3, 2.5], [6.1, .3, 2.0], [5.6, .3, 2.5]], K.red, 1.8); I.textL('福', 5.86, .32, 2.32, 13 * k, K.yellow);
  const D = [];
  const asleep = s < 11 || s >= 129.6;
  D.push([2.4, () => {
    I.box(.35, .4, .35, 2.1, 3, .45, K.white); I.box(.45, .5, .8, 1.9, .9, .22, K.white, { pt: null });
    I.box(.4, asleep ? 1.6 : 1.9, .8, 2.0, asleep ? 1.9 : 1.5, asleep ? .24 : .14, s > 117 ? K.cobalt : K.coral, { pt: s > 117 ? 'stars' : 'dots', ptc: s > 117 ? '#FFE08A' : '#FFB0B2' });
  }]);
  D.push([3.6, () => { I.box(2.75, .4, .35, .85, .85, .75, K.yellow, { pl: 'zig' }); alarm(c, I, s, k); }]);
  D.push([6.2, () => { I.box(.35, 4.9, .35, 1.0, 1.9, .78, K.yellow, { pl: 'zig' }); const [a, b] = I.p(.8, 5.2, 1.13); limb(c, a, b, a - 4 * k, b - 16 * k, K.ink, 1.4); c.beginPath(); c.moveTo(a - 11 * k, b - 14 * k); c.lineTo(a + 1 * k, b - 20 * k); c.lineTo(a + 3 * k, b - 14 * k); c.closePath(); paint(c, K.coral, 1.4);
    const [p, q] = I.p(.85, 6.2, 1.13); rr(c, p - 8 * k, q - 4 * k, 14 * k, 6 * k, 1); paint(c, K.white, 1.1); }]);
  D.push([6.9, () => { I.box(5.0, .4, .35, 2.2, .8, 1.1, K.sky, { pl: 'zig' }); if (s < 52) { const [a, b] = I.p(6.1, .8, 1.45); c.save(); c.translate(a, b); c.scale(k, k); vase(c, 0, 0); c.restore(); } }]);
  D.push([9.4, () => { I.box(7.5, .4, .35, 2.2, .8, .75, K.yellow, { pl: 'dots' }); I.box(7.85, .5, 1.1, 1.5, .45, 1.0, '#3D3A6B'); I.poly(I.qL(8.0, .95, 1.2, 1.2, .75), s > 117 ? '#6C8BD8' : K.sky, 1.6); }]);
  D.push([13.4, () => { I.box(9.1, 3.0, .35, .9, 2.4, .5, K.coral, { pt: 'dots', ptc: '#FFB0B2' }); I.box(9.65, 3.0, .85, .35, 2.4, .6, K.coral); }]);
  D.push([11.4, () => { I.box(6.0, 3.6, .35, 2.2, 1.4, .78, K.white, { pt: 'check', ptc: '#FFF0C7' });
    [[6.5, 4.0], [7.6, 4.4], [7.0, 4.6]].forEach(([x, y], i) => { const [a, b] = I.p(x, y, 1.13); c.beginPath(); c.ellipse(a, b, 6 * k, 3 * k, 0, 0, TAU); paint(c, [K.white, K.sky, K.pink][i], 1.3); });
    if (s >= 66 && s < 72) { const [a, b] = I.p(7.2, 4.3, 1.13); c.beginPath(); c.ellipse(a, b, 13 * k, 5 * k, 0, 0, TAU); paint(c, K.white, 1.4); melon(c, a - 5 * k, b - 2 * k, .9 * k); melon(c, a + 5 * k, b - 1 * k, .9 * k); } }]);
  if (s > 52 && s < 52.5) { const u = seg(s, 52, 52.5), z = lerp(1.45, .35, u * u), y = lerp(.8, 1.5, u); D.push([6.1 + y, () => { const [a, b] = I.p(6.1, y, z); c.save(); c.translate(a, b); c.rotate(u * 2); c.scale(k, k); vase(c, 0, 0); c.restore(); }]); }
  if (s >= 52.5 && s < 72) D.push([7.4, () => { const R = rng(3); for (let i = 0; i < 7; i++) { const [a, b] = I.p(5.6 + R() * 1.1, 1.4 + R() * .9, .35); c.beginPath(); c.moveTo(a, b); c.lineTo(a + (4 + R() * 3) * k, b - 2 * k); c.lineTo(a + 2 * k, b + 3 * k); c.closePath(); paint(c, i % 2 ? K.cobalt : K.white, 1.1); } }]);
  actors.forEach(a => { const lx = a.x, ly = a.y - 1; a.inRoom = true; D.push([lx + ly + .5, () => drawActor(I, a, lx, ly, s, rt)]); });
  sorted(D);
  if (s > 52.3 && s < 54) { const [a, b] = I.p(6.1, 1.5, .8); burst(c, a + 4 * k, b - 26 * k, 26 * k * smooth(52.3, 52.55, s), '啪！', s); }
  if (s > 66.8 && s < 72) for (let i = 0; i < 4; i++) { const d = ((s - 66.8) * .45 + i / 4) % 1, [a, b] = I.p(7.4, 4.8, 2.2); c.globalAlpha = Math.sin(d * Math.PI); heart(c, a + (-30 + i * 20 + Math.sin(d * 6 + i) * 4) * k, b - d * 60 * k, 1.1 * k, i % 2 ? K.pink : K.coral); }
  c.globalAlpha = 1;
}
function alarm(c, I, s, k) {
  const [a, b] = I.p(3.15, .8, 1.1), ring = (s > 1 && s < 2.6) || (s > 4.2 && s < 5.8) || (s > 7.4 && s < 9.0), sh = ring ? Math.sin(performance.now() / 22) * .22 : 0;
  c.save(); c.translate(a, b - 7 * k); c.scale(k, k); c.rotate(sh);
  c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); paint(c, K.coral, 1.6); c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); paint(c, K.white, 1.2);
  c.beginPath(); c.arc(-4.8, -5.5, 2.4, 0, TAU); c.arc(4.8, -5.5, 2.4, 0, TAU); paint(c, K.yellow, 1.2);
  c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -3); c.moveTo(0, 0); c.lineTo(2.4, 1); c.stroke(); c.restore();
  if (ring) { c.strokeStyle = K.ink; c.lineWidth = 1.6; [[-12, -12, -17, -16], [12, -12, 17, -16], [-13, -4, -19, -3], [13, -4, 19, -3]].forEach(l => { c.beginPath(); c.moveTo(a + l[0] * k, b + (l[1] - 7) * k); c.lineTo(a + l[2] * k, b + (l[3] - 7) * k); c.stroke(); }); }
}
function drawClass(I, s, rt, actors) {
  const c = I.c, k = I.s / 24;
  c.fillStyle = SH; I.path([[0, 6.5, 0], [8.2, 6.5, 0], [8.8, 7.6, 0], [.6, 7.6, 0]]); c.fill();
  I.box(0, 0, 0, 8.2, 6.5, .35, K.wood, { pt: 'check', ptc: '#F7D8AE' });
  I.box(0, 0, .35, .3, 6.5, 3.3, K.sky, { pt: null }); I.box(0, 0, .35, 8.2, .3, 3.3, K.lilac);
  windowR(I, .3, 1.4, 1.35, 2.2, 1.5, () => {
    const a = I.p(.3, 1.4, 2.35), b = I.p(.3, 3.6, 2.35); c.strokeStyle = K.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
    const [sx, sy] = I.p(.3, 2.3, 2.35); rr(c, sx - 3 * k, sy - 2 * k, 9 * k, 11 * k, 1); paint(c, K.pink, 1.2);
    const hopX = 2.9 + Math.round(Math.sin(rt * 1.7)) * .25, hop = Math.abs(Math.sin(rt * 6)) > .9 ? 3 * k : 0, [bx, by] = I.p(.3, hopX, 2.35);
    c.beginPath(); c.ellipse(bx, by - 4 * k - hop, 5 * k, 3.6 * k, 0, 0, TAU); paint(c, '#B98A5E', 1.2); c.beginPath(); c.arc(bx - 4 * k, by - 7 * k - hop, 2.6 * k, 0, TAU); paint(c, '#B98A5E', 1.2);
  });
  for (let i = 0; i < 4; i++) { const [a, b] = I.p(.3, 4.3 + i * .6, 2.25); c.beginPath(); c.arc(a, b, 5 * k, Math.PI, TAU); c.closePath(); paint(c, K.yellow, 1.4); }
  I.poly(I.qL(1.6, .3, 1.15, 4.8, 1.7), '#2F5E4E', 2.4);
  const chalk = seg(s, 28.4, 30.4);
  if (chalk > 0) { c.save(); I.path(I.qL(1.6, .3, 1.15, 1.6 + 4.6 * chalk, 1.7)); c.clip(); I.textL('1/2 + 1/3 = ?', 2.0, .3, 2.25, 15 * k, '#F4F1E6', '"DM Mono", monospace'); c.restore(); }
  if (s > 42) I.textL('= 5/6', 2.6, .3, 1.55, 13 * k, '#F4F1E6', '"DM Mono", monospace');
  I.box(1.9, .3, 3.0, 4.2, .08, .32, K.coral, { lw: 1.4 }); I.textL('好好学习 天天向上', 2.25, .38, 3.07, 11 * k, K.yellow);
  { const [a, b] = I.p(7.3, .3, 2.5); c.beginPath(); c.ellipse(a, b, 8 * k, 9 * k, 0, 0, TAU); paint(c, K.white, 1.6); c.lineWidth = 1.4; c.beginPath(); c.moveTo(a, b); c.lineTo(a + 4 * k, b + 1.5 * k); c.moveTo(a, b); c.lineTo(a + .5 * k, b - 6 * k); c.stroke(); }
  const D = [];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { const x = 1.5 + i * 2.25, y = 2.6 + j * 2.0; D.push([x + y + .5, () => I.box(x, y, .35, 1.5, .75, .72, K.wood, { t: '#F7D4A6' })]); }
  actors.forEach(a => { const lx = a.x - 31, ly = a.y - 1; a.inRoom = true; D.push([lx + ly + 1, () => drawActor(I, a, lx, ly, s, rt)]); });
  sorted(D);
  if (s > 38.2 && s < 39.0) { const u = seg(s, 38.2, 39.0), a = I.p(4.5, 5.5, 1.4), b = I.p(2.6, 5.7, 1.4), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 34 * k; c.save(); c.translate(x, y); c.rotate(u * 7); rr(c, -4 * k, -3 * k, 8 * k, 6 * k, 1); paint(c, K.white, 1.3); c.restore(); }
  if (s > 32.4 && s < 43.6) {
    const [a, b] = I.p(2.25, 5.7, .35), bx = a - 20 * k, by = b - 112 * k, w = 92 * k, h = 46 * k, pop = smooth(32.4, 32.8, s);
    c.save(); c.translate(bx + w * .2, by + h); c.scale(pop, pop); c.translate(-(bx + w * .2), -(by + h)); bubble(c, bx, by, w, h, 'left');
    if (s < 35.3) { bird(c, bx + w * .35, by + h * .52, rt * 9, 1.4 * k); bird(c, bx + w * .62, by + h * .42, rt * 9 + 1, 1.1 * k); }
    else if (s < 38.9) { say(c, '62', bx + 30 * k, by + 25 * k, 22 * k, K.coral); cloud(c, bx + 66 * k, by + 24 * k, .42 * k, '#C9C5DE'); }
    else { say(c, '抓蜻蜓！', bx + 46 * k, by + 24 * k, 15 * k, K.cobalt); }
    c.restore();
  }
}

/* ---------- light through the day ---------- */
function lighting(c, I, s, rt) {
  const W = VW, H = VH;
  const morning = 1 - smooth(12, 24, s), golden = smooth(92, 112, s) * (1 - smooth(116, 120, s)), dusk = smooth(110, 117, s) * (1 - smooth(118, 121, s)), night = smooth(116.5, 121, s);
  c.globalCompositeOperation = 'multiply';
  if (morning > 0) { c.fillStyle = `rgba(255,226,196,${.55 * morning})`; c.fillRect(0, 0, W, H); }
  if (golden > 0) { c.fillStyle = `rgba(255,205,150,${.5 * golden})`; c.fillRect(0, 0, W, H); }
  if (dusk > 0) { c.fillStyle = `rgba(214,160,214,${.55 * dusk})`; c.fillRect(0, 0, W, H); }
  if (night > 0) { c.fillStyle = mix('#FFFFFF', '#57529A', night); c.fillRect(0, 0, W, H); }
  c.globalCompositeOperation = 'screen';
  const glow = (x, y, z, r, col, a) => { const [px, py] = I.p(x, y, z), g = c.createRadialGradient(px, py, 2, px, py, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2); };
  const lamps = Math.max(dusk * .7, night);
  if (lamps > 0) {
    POLES.forEach(x => glow(x + .1, 9.6, 4.4, 2.2 * I.s, 'rgba(255,214,140,A)', .5 * lamps));
    glow(13.9, 8.6, 1.0, 1.6 * I.s, 'rgba(255,200,120,A)', .45 * lamps); glow(19, 8.6, 1.0, 1.6 * I.s, 'rgba(255,200,120,A)', .4 * lamps);
  }
  if (night > 0) {
    if (s < 129.2) glow(.8, 6.2, 1.6, 3.2 * I.s, 'rgba(255,206,120,A)', .7 * night);
    glow(3.5, 1.3, 2.1, 1.4 * I.s, s < 129.2 ? 'rgba(255,214,140,A)' : 'rgba(141,211,246,A)', .5 * night);
    for (let i = 0; i < 14; i++) { const [a, b] = I.p(19 + (i * 1.9) % 8 + Math.sin(rt * .6 + i) * .5, 13 + (i * 2.3) % 6 + Math.cos(rt * .5 + i) * .4, .8); c.fillStyle = `rgba(255,228,122,${(.4 + .6 * Math.abs(Math.sin(rt * 2 + i * 1.7))) * night})`; c.beginPath(); c.arc(a, b, 2.4, 0, TAU); c.fill(); }
  }
  c.globalCompositeOperation = 'source-over';
  if (night > 0) {
    c.globalAlpha = night; const R = rng(42);
    for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H * .4, tw = .3 + .7 * Math.abs(Math.sin(rt * 1.4 + i)); c.globalAlpha = night * tw; c.fillStyle = '#FFF4C9'; c.fillRect(x, y, 2, 2); }
    c.globalAlpha = night; const mx = W * .8, my = H * .16, mr = Math.min(W, H) * .035;
    c.fillStyle = '#FFF4C9'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.fillStyle = '#4E4990'; c.beginPath(); c.arc(mx + mr * .45, my - mr * .3, mr * .85, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }
}

/* =========================================================
   Camera
   ========================================================= */
function camAt(s) {
  let i = 0; while (i < CAM.length - 2 && s > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], f = inOut(seg(s, a[0], b[0]));
  const dist = Math.hypot(b[1] - a[1], b[2] - a[2]);
  let z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), f));
  if (dist > 9) z *= 1 - .32 * Math.sin(Math.PI * f) * Math.min(1, dist / 25);   // pull back on long pans
  return { x: lerp(a[1], b[1], f), y: lerp(a[2], b[2], f), z };
}

/* =========================================================
   Mask (grainy spray-paint frame) at any aspect
   ========================================================= */
function makeMask(W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), R = rng(7);
  const m = Math.min(W, H), inset = m * .03, rad = m * .05, band = m * .035, erode = m * .022, hx = W / 2 - inset, hy = H / 2 - inset;
  const sd = (px, py) => { const qx = Math.abs(px - W / 2) - (hx - rad), qy = Math.abs(py - H / 2) - (hy - rad); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad; };
  x.fillStyle = '#000'; x.beginPath(); x.roundRect(inset, inset, W - 2 * inset, H - 2 * inset, rad); x.fill();
  const N = Math.round((W + H) * 2 * (band + erode) * .9);
  const pt = () => { // sample near the border only
    const side = R() * 4 | 0, t = R(), d = (R() - .4) * (band + erode) * 2.2;
    if (side === 0) return [t * W, inset - d]; if (side === 1) return [t * W, H - inset + d]; if (side === 2) return [inset - d, t * H]; return [W - inset + d, t * H];
  };
  for (let i = 0; i < N; i++) { const [px, py] = pt(), d = sd(px, py); if (d > 0 && d < band && R() < Math.pow(1 - d / band, 2.4) * .8) { const z = 1 + R() * 2.2; x.fillRect(px, py, z, z); } }
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < N; i++) { const [px, py] = pt(), d = sd(px, py); if (d < 0 && d > -erode && R() < Math.pow(1 + d / erode, 2) * .55) { const z = 1 + R() * 1.8; x.fillRect(px, py, z, z); } }
  return cv;
}

/* =========================================================
   Player
   ========================================================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const easeBack = x => { const c1 = 1.25; return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

window.GuilinFilm = {
  TT, CHAPTERS, MOODS, SFX, SUBS, CLOCK,
  start(opts) {
    const section = $('drama'), cv = $('film'), ctx = cv.getContext('2d');
    const PXS = innerWidth < 700 ? 52 : 44;     // scroll pixels per story second
    let sPlay = 0, dragging = false, mask = null, dpr = 1, top = 0, span = 1, sTarget = 0, sShow = 0, prevS = 0, rt0 = null, grow0 = null, playing = false, last = performance.now();
    let lastSub = -1, lastCh = -1, lastMood = '';
    function layout() {
      section.style.height = (TT * PXS + innerHeight) + 'px';
      const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); VW = r.width; VH = r.height;
      cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); ctx._pat = null;
      mask = makeMask(Math.round(VW), Math.round(VH));
      top = section.offsetTop; span = section.offsetHeight - innerHeight;
    }
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 150); });
    layout();
    const sFromScroll = () => clamp((scrollY - top) / span, 0, 1) * TT;
    const scrollFor = s => top + s / TT * span;

    // chapter ticks on the progress bar
    const ticks = $('ticks');
    CHAPTERS.forEach(ch => { const b = document.createElement('span'); b.className = 'tick'; b.dataset.t = ch.t; b.style.left = (ch.t / TT * 100) + '%'; b.style.setProperty('--c', ch.col); b.innerHTML = `<span>${ch.time}</span>`; ticks.appendChild(b); });

    // scrubbing: drag anywhere on the bar (mouse, pen or finger); a tap on a chapter dot jumps to its start
    const bar = $('bar');
    const seek = s => scrollTo({ top: scrollFor(clamp(s, 0, TT)), behavior: 'instant' });
    const sAtX = x => { const r = bar.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1) * TT; };
    let drag = null;
    bar.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.preventDefault(); bar.setPointerCapture(e.pointerId);
      drag = { x0: e.clientX, moved: false, tick: e.target.closest('.tick'), resume: playing };
      if (playing) setPlaying(false);
      dragging = true; bar.classList.add('dragging');
      if (!drag.tick) seek(sAtX(e.clientX));
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x0) > 3) drag.moved = true;
      if (drag.moved || !drag.tick) seek(sAtX(e.clientX));
    });
    const endDrag = e => {
      if (!drag) return;
      if (drag.tick && !drag.moved) seek(+drag.tick.dataset.t + .01);
      const resume = drag.resume; drag = null; dragging = false; bar.classList.remove('dragging');
      if (resume) setPlaying(true);
    };
    bar.addEventListener('pointerup', endDrag); bar.addEventListener('pointercancel', endDrag);
    bar.addEventListener('keydown', e => {
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 20, PageDown: -20 }[e.key];
      if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); seek(e.key === 'Home' ? 0 : TT); return; }
      if (step) { e.preventDefault(); e.stopPropagation(); const was = playing; if (was) setPlaying(false); seek(sFromScroll() + step); if (was) setPlaying(true); }
    });

    function setPlaying(v) {
      playing = v; document.documentElement.classList.toggle('is-playing', v);
      $('play').setAttribute('aria-label', v ? '暂停' : '播放'); $('play').dataset.state = v ? 'pause' : 'play';
      if (v && sFromScroll() >= TT - .2) scrollTo({ top: scrollFor(0), behavior: 'instant' });
      if (v && scrollY < top - 2) scrollTo({ top, behavior: 'instant' });
      if (v) sPlay = sFromScroll();
    }
    this.play = (withSound = true) => { if (withSound) GAudio.setOn(true), syncSound(); setPlaying(true); };
    $('play').onclick = () => { if (!playing && !GAudio.isOn()) { GAudio.setOn(true); syncSound(); } setPlaying(!playing); };
    const syncSound = () => { $('snd').dataset.on = GAudio.isOn() ? '1' : '0'; $('snd').setAttribute('aria-label', GAudio.isOn() ? '关闭声音' : '打开声音'); };
    $('snd').onclick = () => { GAudio.setOn(!GAudio.isOn()); syncSound(); };
    syncSound();
    const stopAuto = () => { if (playing) setPlaying(false); };
    addEventListener('wheel', stopAuto, { passive: true }); addEventListener('touchstart', e => { if (!e.target.closest('.hud')) stopAuto(); }, { passive: true });
    addEventListener('keydown', e => { if (e.target === bar) return; if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) stopAuto(); if (e.key === ' ' && document.activeElement === document.body && sectionVisible()) { e.preventDefault(); $('play').click(); } });
    const sectionVisible = () => scrollY > top - innerHeight * .5 && scrollY < top + span + innerHeight * .5;

    function hud(s) {
      // chapter
      let ci = 0; while (ci < CHAPTERS.length - 1 && s >= CHAPTERS[ci + 1].t) ci++;
      if (ci !== lastCh) {
        lastCh = ci; const ch = CHAPTERS[ci];
        const card = $('ep'); card.classList.remove('in'); void card.offsetWidth;
        $('epN').textContent = `第 ${ch.n} 章`; $('epT').textContent = ch.time; $('epT').style.setProperty('--c', ch.col); $('epZh').textContent = ch.zh; $('epEn').textContent = ch.en;
        $('bigT').textContent = ch.time; $('bigT').style.setProperty('--c', ch.col); $('bigZh').textContent = ch.zh; $('bigEn').textContent = ch.en; $('bigN').textContent = `第 ${ch.n} 章 · Chapter ${ch.n}`;
        card.classList.add('in');
        document.querySelectorAll('.tick').forEach((t, i) => t.classList.toggle('on', i <= ci));
      }
      const ch = CHAPTERS[ci], bigA = smooth(ch.t + .05, ch.t + .5, s) * (1 - smooth(ch.t + 2.0, ch.t + 2.6, s));
      $('big').style.opacity = bigA; $('big').style.transform = `translate(-50%,-50%) scale(${.94 + .06 * bigA})`;
      // subtitles
      let si = SUBS.findIndex(x => s >= x[0] && s < x[1]);
      if (si !== lastSub) {
        lastSub = si; const box = $('sub');
        if (si < 0) box.classList.remove('in');
        else { const [, , who, zh, en] = SUBS[si]; $('subWho').textContent = who; $('subWho').hidden = !who; $('subWho').dataset.who = who.replace(/（.*）/, ''); $('subZh').textContent = zh; $('subEn').textContent = en; box.classList.toggle('narr', !who); box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); }
      }
      // clock + progress
      let k = 0; while (k < CLOCK.length - 2 && s > CLOCK[k + 1][0]) k++;
      const m = lerp(CLOCK[k][1], CLOCK[k + 1][1], seg(s, CLOCK[k][0], CLOCK[k + 1][0])), H = Math.floor(m / 60), M = Math.floor(m % 60);
      $('clockTime').textContent = String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0');
      $('hh').setAttribute('transform', `rotate(${(H % 12) * 30 + M * .5} 20 20)`); $('mh').setAttribute('transform', `rotate(${M * 6} 20 20)`);
      $('fill').style.transform = `scaleX(${s / TT})`; $('knob').style.left = (s / TT * 100) + '%';
      bar.setAttribute('aria-valuenow', Math.round(s)); bar.setAttribute('aria-valuetext', `${$('clockTime').textContent} · ${CHAPTERS[ci].zh}`);
      $('start').classList.toggle('show', s < .35 && !playing);
      // page colour follows the light
      const night = smooth(116.5, 121, s), golden = smooth(92, 112, s) * (1 - night);
      const bg = night > .5 ? mix('#25214A', '#25214A', 0) : mix(mix('#FBF8ED', '#FBEBD5', golden), '#25214A', night * 2 > 1 ? 1 : night * .6);
      document.documentElement.style.setProperty('--stage', bg);
      document.documentElement.classList.toggle('stage-night', night > .5);
    }

    function loop(now) {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      if (playing) {
        const ns = sPlay = Math.min(TT, sPlay + dt);   // keep time ourselves: scroll positions get rounded to whole pixels
        scrollTo({ top: scrollFor(ns), behavior: 'instant' });
        if (ns >= TT) { setPlaying(false); setTimeout(() => $('outro').scrollIntoView({ behavior: 'smooth' }), 900); }
      }
      sTarget = playing ? sPlay : sFromScroll();
      const vis = sectionVisible();
      if (vis) {
        if (rt0 == null) rt0 = now;
        if (grow0 == null && scrollY > top - innerHeight * .6) grow0 = now;
        sShow += (sTarget - sShow) * (playing ? 1 : 1 - Math.exp(-dt * (dragging ? 16 : 7)));
        if (Math.abs(sTarget - sShow) < .002) sShow = sTarget;
        const s = sShow, rt = (now - rt0) / 1000;
        // sound: mood + events crossed going forward at a sane speed
        const mood = (MOODS.filter(m => s >= m[0]).pop() || MOODS[0])[1];
        if (mood !== lastMood) { lastMood = mood; GAudio.mood(mood); }
        if (!dragging && s > prevS && s - prevS < 1.2) SFX.forEach(([t, n]) => { if (t > prevS && t <= s) GAudio.sfx(n); });
        prevS = s;
        render(s, rt, now);
        hud(s);
      }
      requestAnimationFrame(loop);
    }
    function render(s, rt, now) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const cam = camAt(s), base = Math.sqrt(VW * VH) / 700, Z = cam.z * clamp(base, .7, 1.5);
      let shx = 0, shy = 0;
      if (!reduce && s > 52 && s < 52.7) { const d = 1 - seg(s, 52, 52.7); shx = Math.sin(now / 16) * 9 * d; shy = Math.cos(now / 13) * 6 * d; }
      const I = new Iso(ctx, VW / 2 - (cam.x - cam.y) * Z * .866 + shx, VH * .54 - (cam.x + cam.y) * Z * .5 + Z * .8 + shy, Z);
      ctx.fillStyle = K.sand; ctx.fillRect(0, 0, VW, VH);
      drawWorld(ctx, I, s, rt);
      lighting(ctx, I, s, rt);
      // frame: grows in once, closes at the end
      const g = (reduce ? 1 : easeBack(clamp(((now - (grow0 ?? now)) / 1000) / 1.4, 0, 1))) * (1 - smooth(137.8, 140, s));
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-in';
      const w = cv.width * Math.max(g, .001), h = cv.height * Math.max(g, .001); ctx.drawImage(mask, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(loop);
    if (opts && opts.onReady) opts.onReady(this);
  },
};
})();
