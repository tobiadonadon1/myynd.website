/* Myynd launch video, 20s: a night opener, five things it does, and a waitlist end card.
 * Grid: 120 BPM, 1 beat = 0.5s, 1 bar = 2s. Each feature gets 3s (6 beats).
 * One world throughout: Giulia's logistics company. The five lines Myynd finishes overnight
 * in the opener are the five scenes that follow. */
var VIDEO = {
  duration: 20,
  formats: ['16x9', '9x16'],
  brand: {
    font: 'Inter',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:opsz,wght@6..72,400&family=IBM+Plex+Mono:wght@400;600&display=swap',
    stage: '#F6F2EC', night: '#132A42', ink: '#162D46', muted: '#5C6B7C', accent: '#B9532E', accentOnDark: '#F5A06A'
  },
  fonts: ['400 40px "Newsreader"', '400 16px "IBM Plex Mono"', '600 16px "IBM Plex Mono"'],
  music: { bpm: 120, mood: 'bright', intro: 1, dips: [] }
};
var G = {};
var S = [3, 6, 9, 12, 15];      // feature scene starts
var CAP_BOTTOM_TALL = 470;      // 9:16: where the caption block ends (no sub lines in this video)
var VM, VOPEN, VEND;

function euro(v){ return '€' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* frame the app's main area: 16:9 keeps it right of the captions, 9:16 centers it under them */
function frameOn(node, zWide, zTall, sxWide){
  var v = LAPTOP.focusOn(node, byFormat(zWide, zTall), { sx: byFormat(sxWide || 1360, 540) });
  var e = LAPTOP.edges(v);
  if (FORMAT === '9x16') v.sy += (CAP_BOTTOM_TALL + H) / 2 - (e.top + e.bottom) / 2;
  else if (e.bottom - e.top < H) v.sy += H / 2 - (e.top + e.bottom) / 2;
  return v;
}

function storyboard(){
  VM = frameOn(document.querySelector('.my-main'), 1.15, 1.5, 1392);
  VOPEN = byFormat({ s: 0.86, fx: 0, fy: 0, sx: 1310, sy: 560 }, frameOn(document.querySelector('.my-main'), 1.2, 1.3));
  VEND = byFormat({ s: 0.56, fx: 0, fy: 0, sx: 960, sy: 700 }, { s: 0.82, fx: 0, fy: 0, sx: 540, sy: 1000 });

  G.copper = Glow('rgba(185,83,46,.16)', { x: byFormat(1360, 540), y: byFormat(560, 1200) });
  G.navy = Glow('rgba(22,45,70,.12)', { x: byFormat(1360, 540), y: byFormat(560, 1200) });
  G.close = Glow('rgba(185,83,46,.14)', { x: byFormat(960, 540), y: byFormat(700, 1080), rx: byFormat(1300, 1000) });
  opener(); inbox(); posts(); clients(); invoices(); build(); closing();
}

/* swap the app to another view while the previous caption leaves */
function toView(t, from, to){
  tl.to('#' + from, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t);
  tl.fromTo('#' + to, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, t + 0.15);
  cue(t + 0.1, 'whoosh', { soft: true });
}
function feature(t, num, label, lines){
  var c = Caption({ num: num, label: label, lines: lines });
  capIn(c, t);
  capOut(c, t + 2.62);
  return c;
}
/* a class that turns on at time t (seek-safe) */
function classAt(node, cls, t){ steps([[0, 0], [t, 1]], function(v){ node.classList.toggle(cls, !!v); }); }

/* 0 to 3: night. The Mac keeps working, five things get done */
function opener(){
  gsap.set('#dark', { opacity: 1 });
  var c = Caption({ dark: true, lines: ['You sleep.', '<b>Myynd works.</b>'], size: byFormat(100, 106) });
  capShowNow(c, 0); capShowNow(c, 1);   // frame 0 is the thumbnail
  LAPTOP.show(0);
  LAPTOP.camSet(0, Object.assign({}, VOPEN, { sy: VOPEN.sy + byFormat(620, 900) }));
  tl.fromTo(LAPTOP.dev, { rotationX: 14, transformPerspective: 2200 }, { rotationX: 0, duration: 1.5, ease: 'expo.out' }, 0.1);
  LAPTOP.camTo(0.1, { sy: VOPEN.sy }, 1.4, 'expo.out');
  cue(0.1, 'whoosh', { soft: true });

  NIGHT.forEach(function(r, i){
    var t = 0.9 + i * 0.34;
    gsap.set('#nr' + i, { opacity: 0.38 });
    tl.to('#nr' + i, { opacity: 1, duration: 0.25, ease: 'power2.out' }, t);
    classAt($('nrk' + i), 'ok', t);
    tl.fromTo('#nrk' + i, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: 'power3.out' }, t);
    cue(t, 'mar', { n: [72, 74, 76, 79, 84][i] });
  });
  text($('nt-clock'), NIGHT.map(function(r, i){ return [i === 0 ? 0 : 0.9 + i * 0.34, r[1]]; }));
  tl.to('#darkglow', { opacity: 1, scale: 1.1, duration: 1.0, ease: 'power2.out' }, 2.3);

  capOut(c, 2.55);
  darkTo(2.6, 0, 0.55);
  glowTo(G.copper, 2.7, 1);
}

/* 3 to 6: Marco's email gets a reply, the file attached, ready for you to send */
function inbox(){
  var t = S[0];
  toView(t - 0.3, 'v-night', 'v-inbox');
  LAPTOP.camTo(t - 0.35, VM, 0.95);
  /* 16:9 only: hide the app's sidebar behind the captions. In 9:16 the laptop sits below them. */
  scrimTo(t - 0.2, byFormat(1, 0), 0.5, 'linear-gradient(90deg, var(--stage) 0, var(--stage) 800px, rgba(0,0,0,0) 872px)');
  feature(t, '01', 'Inbox', ['Inbox,', '<b>answered.</b>']);
  typeText({ field: $('ib-typed'), caret: $('ib-caret'), text: 'Hi Marco, it’s held at customs in Munich. The paperwork goes in today, so it lands Thursday. Declaration attached.', t0: t + 0.5, t1: t + 1.7 });
  gsap.set('#ib-att', { autoAlpha: 0 });
  tl.fromTo('#ib-att', { autoAlpha: 0, y: -18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, t + 1.85);
  cue(t + 1.85, 'deal');
  gsap.set('#ib-note', { autoAlpha: 0 });
  tl.to('#ib-note', { autoAlpha: 1, duration: 0.4 }, t + 2.05);
  tapAt(LAPTOP.stageOf($('ib-send'), VM), t + 2.3);
  tl.to('#ib-send', { scale: 0.94, duration: 0.08 }, t + 2.3).to('#ib-send', { scale: 1, duration: 0.2 }, t + 2.38);
}

/* 6 to 9: three posts for X, written from what happened this week */
function posts(){
  var t = S[1];
  toView(t - 0.3, 'v-inbox', 'v-posts');
  feature(t, '02', 'Posts', ['X posts,', '<b>written.</b>']);
  [0, 1, 2].forEach(function(i){
    gsap.set('#ps-c' + i, { autoAlpha: 0 });
    tl.fromTo('#ps-c' + i, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, t + 0.35 + i * 0.15);
  });
  cue(t + 0.4, 'ui');
  typeText({ field: $('ps-typed'), text: POST1, t0: t + 0.75, t1: t + 1.8 });
  countTo($('ps-count'), 0, POST1.length, t + 0.75, t + 1.8, function(v){ return Math.round(v) + '/280'; }, { linear: true });
  gsap.set(['#ps-p1', '#ps-p2', '#ps-voice'], { autoAlpha: 0 });
  tl.fromTo('#ps-p1', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, t + 1.9);
  tl.fromTo('#ps-p2', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, t + 2.1);
  cue(t + 1.9, 'deal'); cue(t + 2.1, 'deal');
  tl.fromTo('#ps-voice', { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, t + 2.25);
  cue(t + 2.25, 'chime');
}

/* 9 to 12: every client's next step gets done, one per beat */
function clients(){
  var t = S[2];
  toView(t - 0.3, 'v-posts', 'v-clients');
  feature(t, '03', 'Clients', ['Clients,', '<b>handled.</b>']);
  CLIENTS.forEach(function(c, i){
    var ti = t + 0.6 + i * 0.45;
    classAt($('cl' + i), 'done', ti);
    text($('cl-n' + i), [[0, 'Waiting on you'], [ti, c[4]]]);
    tl.fromTo('#cl-n' + i, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: 'power3.out' }, ti);
    cue(ti, 'mar', { n: [72, 74, 76, 79][i] });
  });
  cue(t + 2.15, 'done');
}

/* 12 to 15: overdue invoices found, the total adds up, reminders drafted */
function invoices(){
  var t = S[3];
  toView(t - 0.3, 'v-clients', 'v-inv');
  feature(t, '04', 'Invoices', ['Invoices,', '<b>chased.</b>']);
  var running = [0, 6200, 11000, 18400];
  INVOICES.forEach(function(v, i){
    if (!v[4]) return;
    var tl1 = t + 0.5 + i * 0.3, tl2 = t + 1.45 + i * 0.3;
    classAt($('iv' + i), 'late', tl1);
    html($('iv-s' + i), [[0, '<span class="my-chip">Open</span>'], [tl1, '<span class="my-chip">Overdue ' + [16, 14, 11][i] + 'd</span>'], [tl2, '<span class="iv-act"><span class="my-chip">Reminder drafted</span></span>']]);
    cue(tl1, 'tick'); cue(tl2, 'mar', { n: [74, 77, 81][i] });
    tl.fromTo('#iv-s' + i, { scale: 0.85 }, { scale: 1, duration: 0.3, ease: 'power3.out' }, tl2);
  });
  countTo($('iv-total'), 0, 18400, t + 0.5, t + 1.3, euro, { ease: 'power3.out' });
  gsap.set('#iv-note', { autoAlpha: 0 });
  tl.to('#iv-note', { autoAlpha: 1, duration: 0.4 }, t + 2.3);
}

/* 15 to 18: a plain request becomes a working page, tested, waiting for review */
function build(){
  var t = S[4];
  toView(t - 0.3, 'v-inv', 'v-build');
  feature(t, '05', 'Build', ['Software,', '<b>built.</b>']);
  CODE.forEach(function(l, i){
    gsap.set('#bd-l' + i, { autoAlpha: 0 });
    tl.fromTo('#bd-l' + i, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: 'power2.out' }, t + 0.45 + i * 0.14);
    cue(t + 0.45 + i * 0.14, 'key', { i: i });
  });
  gsap.set(['#bd-test', '#bd-prev'], { autoAlpha: 0 });
  tl.fromTo('#bd-test', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, t + 1.55);
  cue(t + 1.55, 'chime');
  tl.fromTo('#bd-prev', { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }, t + 1.95);
  cue(t + 1.95, 'deal');
}

/* 18 to 20: the morning desk, and the ask */
function closing(){
  var t = 18;
  scrimTo(t - 0.4, 0, 0.5);
  toView(t - 0.3, 'v-build', 'v-end');
  LAPTOP.camTo(t - 0.35, VEND, 1.0);
  glowTo(G.copper, t - 0.3, 0); glowTo(G.close, t - 0.3, 1);
  var c = Caption({ center: true, size: byFormat(84, 92), lines: ['Meet <b>Myynd.</b>', '<span class="cta-pill">Join the waitlist</span>'] });
  capIn(c, t);
  cue(t + 0.1, 'swell', { dur: 0.6 });
}
