/* 小黄帽的一天 · score and sound effects, synthesised with Web Audio.
   A pentatonic tune that changes mood with the story, plus effects on story events. */
window.GAudio = (() => {
  let ctx, master, music, fx, noise, on = false, timer = null, keepAlive = null;
  let mood = 'morning', step = 0, bar = 0, nextT = 0, deg = 2, nextCricket = 0, nextBird = 0;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const SCALE = [0, 2, 4, 7, 9];                       // C major pentatonic
  const MOOD = {
    morning: { bpm: 92, lead: 'pluck', roots: [60, 57, 53, 55], perc: 'shaker', dens: .5, base: 72, pad: 1, birds: 1 },
    class: { bpm: 84, lead: 'pluck', roots: [57, 53, 60, 55], perc: 'tick', dens: .32, base: 72, pad: 0 },
    run: { bpm: 132, lead: 'pizz', roots: [60, 55, 57, 55], perc: 'shaker', dens: .72, base: 72, pad: 0 },
    play: { bpm: 104, lead: 'pluck', roots: [60, 57, 53, 55], perc: 'shaker', dens: .6, base: 74, pad: 0 },
    chase: { bpm: 152, lead: 'pizz', roots: [57, 55, 53, 55], perc: 'kick', dens: .85, base: 69, pad: 0 },
    sad: { bpm: 70, lead: 'box', roots: [57, 53, 60, 55], perc: null, dens: .28, base: 72, pad: 1 },
    warm: { bpm: 84, lead: 'pluck', roots: [53, 60, 55, 57], perc: 'shaker', dens: .42, base: 72, pad: 1 },
    pe: { bpm: 116, lead: 'pluck', roots: [60, 57, 60, 55], perc: 'drum', dens: .58, base: 72, pad: 0 },
    street: { bpm: 96, lead: 'pluck', roots: [53, 60, 57, 55], perc: 'shaker', dens: .48, base: 72, pad: 1, birds: 1 },
    pond: { bpm: 86, lead: 'pluck', roots: [60, 53, 57, 55], perc: null, dens: .38, base: 76, pad: 1 },
    night: { bpm: 64, lead: 'box', roots: [60, 57, 53, 55], perc: null, dens: .3, base: 79, pad: 1, crickets: 1 },
  };

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = .5; fx = ctx.createGain(); fx.gain.value = .75;
    const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
    dl.delayTime.value = .32; fb.gain.value = .24; wet.gain.value = .22; lp.type = 'lowpass'; lp.frequency.value = 2600;
    music.connect(dl); dl.connect(lp).connect(fb).connect(dl); lp.connect(wet).connect(master);
    music.connect(master); fx.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  /* ---------- iOS: play through the silent switch ----------
     Web Audio starts in the "ambient" session, which the ringer switch mutes. A tap has to move the page into
     the "playback" session, the one video and music players use. */
  function silentWavUrl() {
    const n = 4410, buf = new ArrayBuffer(44 + n), v = new DataView(buf), w = (o, str) => [...str].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8820, true); v.setUint32(28, 8820, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function unlock() {                       // must run inside the tap
    let sessionApi = false;
    try { if (navigator.audioSession) { navigator.audioSession.type = 'playback'; sessionApi = true; } } catch (e) {}
    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!sessionApi && iOS) {               // iOS 16 and older: a playing <audio> element switches the session
      if (!keepAlive) { keepAlive = new Audio(silentWavUrl()); keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); keepAlive.setAttribute('x-webkit-airplay', 'deny'); }
      keepAlive.play().catch(() => {});
    }
    const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0);
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  }
  // iOS suspends ("interrupted") the context after a call, Siri or a trip to the home screen
  const wake = () => { if (on && ctx && ctx.state !== 'running') { ctx.resume().catch(() => {}); if (keepAlive) keepAlive.play().catch(() => {}); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  addEventListener('pointerdown', wake, { passive: true });

  /* ---------- voices ---------- */
  function tone(t, f, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain(), a = o.a ?? .005, peak = o.g ?? .2;
    osc.type = o.type || 'triangle'; osc.frequency.setValueAtTime(f, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide ?? dur));
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibD || 40; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g).connect(o.bus || music); osc.start(t); osc.stop(t + dur + .05);
  }
  function hiss(t, dur, o = {}) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), a = o.a ?? .004;
    src.buffer = noise; src.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q ?? 1;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.g ?? .2, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(o.bus || music); src.start(t, Math.random() * .5); src.stop(t + dur + .05);
  }
  const pluck = (t, m, v) => { tone(t, mtof(m), .7, { g: .16 * v }); tone(t, mtof(m) * 2, .28, { type: 'sine', g: .06 * v }); };
  const pizz = (t, m, v) => { tone(t, mtof(m), .2, { g: .15 * v }); tone(t, mtof(m) * 3, .08, { type: 'sine', g: .03 * v }); };
  const box = (t, m, v) => { tone(t, mtof(m), 1.8, { type: 'sine', g: .13 * v }); tone(t, mtof(m) * 3, .5, { type: 'sine', g: .025 * v }); tone(t, mtof(m) * 5.4, .2, { type: 'sine', g: .012 * v }); };
  const bass = (t, m, d) => { tone(t, mtof(m), d, { type: 'sine', g: .22 }); tone(t, mtof(m) * 2, d * .5, { type: 'triangle', g: .04 }); };
  function pad(t, root, d) {
    const minor = root % 12 === 9, notes = [root, root + (minor ? 3 : 4), root + 7];
    notes.forEach(n => { [-6, 6].forEach(det => { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.012, t + .5); g.gain.setValueAtTime(.012, t + d - .4); g.gain.linearRampToValueAtTime(0, t + d); o.connect(f).connect(g).connect(music); o.start(t); o.stop(t + d + .05); }); });
  }

  /* ---------- deterministic little composer ---------- */
  const hash = n => { n = Math.imul(n ^ 61 ^ (n >>> 16), 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };
  function scheduleStep(t, M) {
    const sp = step % 16, root = M.roots[bar % 4], barDur = 60 / M.bpm * 4;
    if (sp === 0) { if (M.pad) pad(t, root - 12, barDur); }
    if (sp === 0 || (sp === 8 && M.bpm > 90)) bass(t, root - 24, M.bpm > 120 ? .3 : .6);
    if (M.perc === 'shaker' && sp % 4 === 2) hiss(t, .05, { type: 'highpass', f: 7000, g: .05 });
    if (M.perc === 'tick' && sp % 4 === 0) { tone(t, sp % 8 ? 1500 : 1100, .05, { type: 'sine', g: .07 }); }
    if (M.perc === 'drum') { if (sp % 8 === 0) tone(t, 130, .25, { type: 'sine', f2: 45, glide: .18, g: .35 }); if (sp % 8 === 4) hiss(t, .1, { f: 1600, q: .8, g: .12 }); if (sp % 2 === 1) hiss(t, .03, { type: 'highpass', f: 8000, g: .025 }); }
    if (M.perc === 'kick' && sp % 4 === 0) { tone(t, 110, .18, { type: 'sine', f2: 50, glide: .12, g: .3 }); hiss(t + .001, .04, { type: 'highpass', f: 6000, g: .04 }); }
    // melody: chord tone on the downbeat, a gentle random walk otherwise
    const seed = bar * 31 + sp * 7 + M.base * 13, r = hash(seed);
    const strong = sp % 4 === 0, play = sp === 0 || (strong ? r < M.dens + .25 : sp % 2 === 0 ? r < M.dens * .7 : r < M.dens * .25);
    if (play) {
      if (sp === 0) { const pc = root % 12; deg = SCALE.reduce((b, v, i) => Math.abs(v - pc) < Math.abs(SCALE[b] - pc) ? i : b, 0) + 5 * (hash(seed + 3) < .5 ? 0 : 1); }
      else deg = Math.max(0, Math.min(9, deg + [-2, -1, -1, 1, 1, 2, 0][Math.floor(hash(seed + 1) * 7)]));
      const m = M.base - 12 + Math.floor(deg / 5) * 12 + SCALE[deg % 5], v = strong ? 1 : .7;
      (M.lead === 'pizz' ? pizz : M.lead === 'box' ? box : pluck)(t, m, v);
    }
    step++; if (step % 16 === 0) bar++;
  }
  function tick() {
    if (!ctx) return;
    const M = MOOD[mood], stepDur = 60 / M.bpm / 4;
    while (nextT < ctx.currentTime + .15) { scheduleStep(nextT, M); nextT += stepDur; }
    const now = ctx.currentTime;
    if (M.crickets && now > nextCricket) { for (let i = 0; i < 3; i++) tone(now + .05 + i * .06, 4600, .04, { type: 'sine', g: .025, bus: fx }); nextCricket = now + .7 + Math.random() * .9; }
    if (M.birds && now > nextBird) { const b = now + .05; tone(b, 2600, .09, { type: 'sine', f2: 3600, g: .04, bus: fx }); tone(b + .12, 2900, .08, { type: 'sine', f2: 3900, g: .035, bus: fx }); nextBird = now + 3 + Math.random() * 4; }
  }

  /* ---------- effects ---------- */
  const SFX = {
    alarm: t => { for (let i = 0; i < 18; i++) tone(t + i * .055, i % 2 ? 2100 : 1700, .05, { type: 'square', g: .045, bus: fx }); },
    bell: t => { for (let i = 0; i < 4; i++) { tone(t + i * .3, 1046, 1.1, { type: 'sine', g: .14, bus: fx }); tone(t + i * .3, 2637, .5, { type: 'sine', g: .04, bus: fx }); } },
    boing: t => tone(t, 170, .4, { type: 'sine', f2: 560, glide: .25, g: .28, bus: fx, vib: 18, vibD: 30 }),
    slurp: t => { hiss(t, .32, { f: 500, f2: 2400, q: 5, g: .22, bus: fx }); hiss(t + .34, .22, { f: 700, f2: 2000, q: 5, g: .16, bus: fx }); },
    swish: t => hiss(t, .22, { f: 900, f2: 3200, q: 1.2, g: .22, bus: fx, a: .05 }),
    whoosh: t => hiss(t, .8, { f: 300, f2: 1800, q: .8, g: .16, bus: fx, a: .3 }),
    crash: t => { tone(t, 90, .3, { type: 'sine', f2: 40, g: .4, bus: fx }); hiss(t, .5, { type: 'highpass', f: 2200, g: .32, bus: fx });
      for (let i = 0; i < 9; i++) tone(t + .02 + Math.random() * .35, 2200 + Math.random() * 3200, .12, { type: 'sine', g: .07, bus: fx }); },
    pop: t => tone(t, 520, .16, { type: 'sine', f2: 1100, glide: .1, g: .2, bus: fx }),
    whistle: t => tone(t, 2650, .55, { type: 'sine', g: .09, bus: fx, vib: 32, vibD: 140, a: .02 }),
    coin: t => { tone(t, 1318, .1, { type: 'square', g: .04, bus: fx }); tone(t + .08, 1760, .45, { type: 'square', g: .04, bus: fx }); },
    hop: t => tone(t, 600, .14, { type: 'triangle', f2: 1300, g: .14, bus: fx }),
    click: t => hiss(t, .03, { type: 'highpass', f: 2500, g: .3, bus: fx }),
    chime: t => [72, 76, 79, 84, 88].forEach((m, i) => box(t + i * .22, m, 1)),
  };

  return {
    isOn: () => on,
    setOn(v) {
      init(); on = v;
      if (v) {
        unlock(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.9, ctx.currentTime, .4);
        if (!timer) { nextT = ctx.currentTime + .08; timer = setInterval(tick, 25); }
      } else if (ctx) {
        master.gain.setTargetAtTime(0, ctx.currentTime, .12);
        clearInterval(timer); timer = null;
        if (keepAlive) keepAlive.pause();
      }
    },
    mood(m) { if (MOOD[m]) mood = m; },
    sfx(n) { if (on && ctx && SFX[n]) SFX[n](ctx.currentTime + .01); },
  };
})();
