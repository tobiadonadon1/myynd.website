/* Myynd launch video, 20s. At night, Myynd's mascot works the Mac on its own:
 * Terminal scripts, the web, a spreadsheet, a code deploy. Morning: the summary and the ask.
 * Grid: 120 BPM, 1 beat = 0.5s. Four scenes of 3.5s (7 beats) between a 3s opener and a 3s end card. */
var VIDEO = {
  duration: 20,
  formats: ['16x9', '9x16'],
  brand: {
    font: 'Inter',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:opsz,wght@6..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
    stage: '#F6F2EC', night: '#0D1A2A', ink: '#162D46', muted: '#5C6B7C', accent: '#B9532E', accentOnDark: '#F5A06A'
  },
  fonts: ['400 40px "Newsreader"', '400 16px "IBM Plex Mono"', '500 16px "IBM Plex Mono"'],
  music: { bpm: 120, mood: 'tech', intro: 1, dips: [], level: 0 }   // the site plays it silent; encoded without audio
};
var S = [3, 6.5, 10, 13.5], END = 17;
var CAPB = 610;   // 9:16: where the caption block ends
var POSE = [[0, 'front']], FLIP = [[0, 0]], SAY = [[0, '4 jobs tonight']], TAGOK = [[0, 0]];

function scrimFor(){
  return byFormat('linear-gradient(90deg, var(--night) 0, var(--night) 770px, rgba(0,0,0,0) 900px)',
                  'linear-gradient(180deg, var(--night) 0, var(--night) ' + CAPB + 'px, rgba(0,0,0,0) ' + (CAPB + 90) + 'px)');
}
/* frame a window: right of the captions in 16:9, under them in 9:16 */
function view(id, zWide, zTall, ax){
  return LAPTOP.focusOn($(id), byFormat(zWide, zTall), { raw: true, ax: ax == null ? 0.5 : ax, sx: byFormat(1320, 540), sy: byFormat(548, (CAPB + H) / 2 + 20) });
}
/* where the mascot stands for a window: beside it in 16:9, inside its corner in 9:16 */
function spot(k){
  var w = WIN[k];
  if (FORMAT === '9x16' && w.w) return { x: w.x + w.w - 200, y: w.y + w.h - (k === 'web' ? 40 : 100) };
  return w.bot;
}
function hop(t, to, d){
  d = d || 0.6;
  tl.to('#bot', { left: to.x, top: to.y, duration: d, ease: 'power2.inOut' }, t);
  tl.to('#bot-hop', { y: -80, duration: d / 2, ease: 'power2.out' }, t);
  tl.to('#bot-hop', { y: 0, duration: d / 2, ease: 'power2.in' }, t + d / 2);
  tl.fromTo('#bot-hop', { scaleX: 1.1, scaleY: 0.9 }, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' }, t + d);
  cue(t, 'whoosh', { soft: true, up: true });
}
function openWin(t, id, dock){
  gsap.set(id, { autoAlpha: 0 });
  tl.fromTo(id, { autoAlpha: 0, scale: 0.86, y: 50 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out' }, t);
  classAt($(dock), 'on', t);
  cue(t, 'deal');
}
function classAt(node, cls, t, tOff){
  var list = [[0, 0], [t, 1]];
  if (tOff != null) list.push([tOff, 0]);
  steps(list, function(v){ node.classList.toggle(cls, !!v); });
}
function feature(t, num, label, lines, sub){
  var c = Caption({ num: num, label: label, lines: lines, sub: sub, dark: true });
  capIn(c, t);
  capOut(c, t + 3.1);
}

function storyboard(){
  gsap.set('#dark', { opacity: 1 });
  gsap.set('#w-app', { autoAlpha: 1 });
  gsap.set('#bot', { left: WIN.app.bot.x, top: WIN.app.bot.y, scale: 0, transformOrigin: '50% 100%' });
  gsap.set('#bot-tag', { autoAlpha: 0 });
  opener(); scripts(); web(); numbers(); code(); closing(); jobs();
  steps(POSE, function(v){ $('bot').setAttribute('data-pose', v); });
  steps(FLIP, function(v){ $('bot').classList.toggle('flip', !!v); });
  text($('bot-say'), SAY);
  steps(TAGOK, function(v){ $('bot-tag').classList.toggle('done', !!v); });
  text($('mb-clock'), [[0, 'Fri 01:04'], [S[0], 'Fri 01:12'], [S[1], 'Fri 01:40'], [S[2], 'Fri 02:05'], [S[3], 'Fri 02:31'], [END - 0.2, 'Fri 07:30']]);
}

/* 0 to 3: the Mac at night. The mascot climbs out of the menu bar and gets to work */
function opener(){
  var c = Caption({ dark: true, lines: ['You sleep.', '<b>Myynd works.</b>'], size: byFormat(104, 106) });
  capShowNow(c, 0); capShowNow(c, 1);
  var home = LAPTOP.focusOn($('w-app'), byFormat(0.92, 1.2), { raw: true, ax: 0.6, sx: byFormat(1330, 540), sy: byFormat(560, 1200) });
  LAPTOP.show(0);
  LAPTOP.camSet(0, Object.assign({}, home, { sy: home.sy + byFormat(600, 800) }));
  tl.fromTo(LAPTOP.dev, { rotationX: 14, transformPerspective: 2200 }, { rotationX: 0, duration: 1.5, ease: 'expo.out' }, 0.1);
  LAPTOP.camTo(0.1, { sy: home.sy }, 1.3, 'expo.out');
  cue(0.1, 'whoosh', { soft: true });

  tl.to('#bot', { scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 1.0);
  POSE.push([1.0, 'giggle'], [1.6, 'front']);
  tl.fromTo('#bot-tag', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 1.7);
  /* Myynd's window tucks into the dock while the mascot heads out */
  tl.to('#w-app', { autoAlpha: 0, scale: 0.12, x: 150, y: 470, duration: 0.5, ease: 'power3.in' }, S[0] - 0.4);
  tl.to('#darkglow', { opacity: 1, scale: 1.1, duration: 1.2, ease: 'power2.out' }, 1.2);
  capOut(c, 2.65);
}

/* 3 to 6.5: Terminal. Three scripts run, one per beat */
function scripts(){
  var t = S[0];
  feature(t, '01', 'Scripts', ['Runs your', '<b>scripts.</b>'], 'Terminal at 01:12. No one at the keyboard.');
  scrimTo(t - 0.3, 1, 0.5, scrimFor());
  POSE.push([t - 0.15, 'side']);
  hop(t - 0.1, spot('term'), 0.65);
  POSE.push([t + 0.6, 'front']);
  openWin(t + 0.05, '#w-term', 'dk-term');
  LAPTOP.camTo(t - 0.3, view('w-term', 1.32, 1.62, 0.56), 1.0);

  typeText({ field: $('t-cmd'), text: 'myynd run nightly', t0: t + 0.7, t1: t + 1.2 });
  [1, 2, 3].forEach(function(r, i){
    var ti = t + 1.4 + i * 0.55;
    gsap.set('#tr' + r, { autoAlpha: 0 });
    tl.fromTo('#tr' + r, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.25 }, ti);
    text($('tk' + i), [[0, ''], [ti + 0.3, TERM_OK[i]]]);
    cue(ti + 0.3, 'mar', { n: [72, 76, 79][i] });
  });
  SAY.push([t + 1.3, 'Running backup.sh'], [t + 1.85, 'Sorting downloads'], [t + 2.4, 'Exporting numbers'], [t + 2.85, '3 scripts done']);
  TAGOK.push([t + 2.85, 1]);
  POSE.push([t + 2.85, 'laugh']);
}

/* 6.5 to 10: the browser. Four sites, two invoices each, all saved */
function web(){
  var t = S[1];
  feature(t, '02', 'Web', ['Works the', '<b>web.</b>'], 'It opens the sites and gets what you need.');
  TAGOK.push([t - 0.2, 0]);
  POSE.push([t - 0.2, 'side']);
  hop(t - 0.15, spot('web'), 0.7);
  POSE.push([t + 0.6, 'front']);
  openWin(t, '#w-web', 'dk-web');
  LAPTOP.camTo(t - 0.3, view('w-web', 1.18, 1.38, 0.55), 1.0);

  var tabT = SITES.map(function(s, i){ return t + 0.75 + i * 0.55; });
  SITES.forEach(function(s, i){
    steps([[0, i === 0 ? 1 : 0], [tabT[i], 1]].concat(i < 3 ? [[tabT[i + 1], 0]] : []), function(v){ $('wt' + i).classList.toggle('on', !!v); });
    if (i) cue(tabT[i], 'tap');
  });
  text($('w-url'), SITES.map(function(s, i){ return [i ? tabT[i] : 0, s[1]]; }));
  text($('w-h'), SITES.map(function(s, i){ return [i ? tabT[i] : 0, s[0] + ' · Invoices']; }));
  [0, 1].forEach(function(r){
    text($('w-n' + r), SITES.map(function(s, i){ return [i ? tabT[i] : 0, s[2 + r][0]]; }));
    text($('w-a' + r), SITES.map(function(s, i){ return [i ? tabT[i] : 0, s[2 + r][1]]; }));
    var list = [[0, 0]];
    tabT.forEach(function(tt, i){ list.push([tt, 0], [tt + 0.18 + r * 0.14, 1]); });
    steps(list, function(v){ var d = $('w-d' + r); d.classList.toggle('ok', !!v); d.textContent = v ? '✓ Saved' : 'Download'; });
    tabT.forEach(function(tt){ cue(tt + 0.18 + r * 0.14, 'tick'); });
  });
  countTo($('w-count'), 0, 23, t + 0.8, t + 2.9, function(v){ return String(Math.round(v)); }, { linear: true });
  SAY.push([t + 0.7, 'Visiting 4 portals'], [t + 1.3, 'Downloading invoices'], [t + 2.9, '23 invoices saved']);
  TAGOK.push([t + 2.9, 1]);
  POSE.push([t + 2.9, 'giggle']);
  cue(t + 2.9, 'chime');
}

/* 10 to 13.5: the spreadsheet. October fills in, the chart catches up */
function numbers(){
  var t = S[2];
  feature(t, '03', 'Numbers', ['Does the', '<b>numbers.</b>'], 'Your sheets, updated before you wake up.');
  TAGOK.push([t - 0.2, 0]);
  POSE.push([t - 0.2, 'side']);
  FLIP.push([t - 0.2, 1]);
  hop(t - 0.15, spot('sheet'), 0.7);
  POSE.push([t + 0.6, 'front']);
  FLIP.push([t + 0.6, 0]);
  openWin(t, '#w-sheet', 'dk-sheet');
  LAPTOP.camTo(t - 0.3, view('w-sheet', 1.2, 1.45, 0.6), 1.0);

  var num = function(v){ return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  countTo($('s-rev'), 0, 48200, t + 0.8, t + 1.4, num, { ease: 'power3.out', before: '' });
  countTo($('s-cost'), 0, 39500, t + 1.25, t + 1.85, num, { ease: 'power3.out', before: '' });
  countTo($('s-mar'), 0, 18, t + 1.7, t + 2.2, function(v){ return Math.round(v) + '%'; }, { ease: 'power3.out', before: '' });
  classAt($('s-rev'), 'cell', t + 0.8, t + 1.25);
  classAt($('s-cost'), 'cell', t + 1.25, t + 1.7);
  classAt($('s-mar'), 'cell', t + 1.7, t + 2.6);
  [0.8, 1.25, 1.7].forEach(function(d, i){ cue(t + d, 'mar', { n: [72, 74, 79][i] }); });
  tl.to('#s-bar', { height: '74%', duration: 0.7, ease: 'power3.out' }, t + 1.75);
  SAY.push([t + 0.7, 'Updating October'], [t + 2.4, 'Margin up to 18%']);
  TAGOK.push([t + 2.4, 1]);
  POSE.push([t + 2.4, 'laugh']);
  cue(t + 2.4, 'chime');
}

/* 13.5 to 17: the code editor. Myynd fixes its own waitlist, tests pass, it ships */
function code(){
  var t = S[3];
  feature(t, '04', 'Code', ['Ships your', '<b>code.</b>'], 'Fixed, tested and live by morning.');
  TAGOK.push([t - 0.2, 0]);
  POSE.push([t - 0.2, 'side']);
  hop(t - 0.15, spot('code'), 0.7);
  POSE.push([t + 0.6, 'front']);
  openWin(t, '#w-code', 'dk-code');
  tl.fromTo('#w-ask', { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, t - 0.1);
  cue(t - 0.1, 'msg');
  LAPTOP.camTo(t - 0.3, LAPTOP.focusOn($('w-code'), byFormat(1.16, 1.42), { raw: true, ax: 0.55, ay: 0.36, sx: byFormat(1320, 540), sy: byFormat(548, (CAPB + H) / 2 + 20) }), 1.0);

  /* the old line turns red, three new lines open under it */
  steps([[0, ''], [t + 0.75, 'del']], function(v){ $('cl1').className = v; });
  [2, 3, 4].forEach(function(i, k){
    gsap.set('#cl' + i, { height: 0, overflow: 'hidden' });
    tl.to('#cl' + i, { height: 32.4, duration: 0.35, ease: 'power3.out' }, t + 1.0 + k * 0.22);
    cue(t + 1.0 + k * 0.22, 'key', { i: k });
  });
  gsap.set(['#c-t0', '#c-t1'], { autoAlpha: 0 });
  tl.to('#c-t0', { autoAlpha: 1, duration: 0.2 }, t + 1.75);
  text($('c-ok0'), [[0, ''], [t + 2.05, '✓ 42 passed']]);
  tl.to('#c-t1', { autoAlpha: 1, duration: 0.2 }, t + 2.3);
  text($('c-ok1'), [[0, ''], [t + 2.7, '✓ myynd.com is live']]);
  cue(t + 2.05, 'mar', { n: 76 }); cue(t + 2.7, 'done');
  SAY.push([t + 0.7, 'Fixing the waitlist'], [t + 1.75, 'Running tests'], [t + 2.3, 'Deploying'], [t + 2.7, 'Shipped']);
  TAGOK.push([t + 2.7, 1]);
  POSE.push([t + 2.7, 'laugh']);
}

/* 17 to 20: morning. The summary, the mascot cracking up, the ask */
function closing(){
  var t = END;
  scrimTo(t - 0.3, 0, 0.5);
  darkTo(t - 0.15, 0, 0.7);
  tl.to('#day-bg', { opacity: 1, duration: 0.7, ease: 'power2.inOut' }, t - 0.15);
  tl.to(['#w-ask', '#w-term', '#w-web', '#w-sheet', '#w-code'], { autoAlpha: 0, scale: 0.95, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, t - 0.2);
  tl.to('#w-app', { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power3.out' }, t + 0.1);
  cue(t + 0.1, 'whoosh', { soft: true, up: true });
  text($('ap-h'), [[0, 'Tonight.'], [t, 'While you slept.']]);
  text($('ap-pill'), [[0, '4 jobs · starts at 01:10'], [t, 'Friday 9 October · 07:30 · 4 done']]);
  TAGOK.push([t - 0.2, 0]);
  POSE.push([t - 0.2, 'side']);
  hop(t - 0.1, WIN.end.bot, 0.7);
  SAY.push([t + 0.6, 'Good morning']);
  TAGOK.push([t + 0.6, 1]);
  for (var k = 0, tt = t + 0.6; tt < VIDEO.duration; k++, tt += 0.3) POSE.push([tt, k % 2 ? 'giggle' : 'laugh']);
  tl.to('#bot-hop', { y: -16, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 15 }, t + 0.7);

  var vEnd = byFormat({ s: 0.72, fx: 0, fy: 0, sx: 960, sy: 742 }, LAPTOP.focusOn($('w-app'), 1.1, { raw: true, ax: 0.62, sx: 540, sy: 1180 }));
  LAPTOP.camTo(t - 0.2, vEnd, 1.0);
  cue(t - 0.15, 'whoosh', { soft: true });
  var c = Caption({ center: true, size: byFormat(84, 92), lines: ['Meet <b>Myynd.</b>', '<span class="cta-pill">Join the waitlist</span>'] });
  capIn(c, t + 0.3);
}

/* Myynd's window keeps score while it is in the dock: each job runs during its scene */
function jobs(){
  var at = [[S[0] + 0.6, S[0] + 2.85], [S[1] + 0.6, S[1] + 2.9], [S[2] + 0.6, S[2] + 2.4], [S[3] + 0.6, S[3] + 2.7]];
  at.forEach(function(a, i){
    steps([[0, 0], [a[0], 1], [a[1], 2]], function(v){
      var st = $('as' + i);
      st.textContent = ['Queued', 'Running', 'Done ' + JOBS[i][1]][v];
      st.className = 'ap-st' + (v === 1 ? ' run' : v === 2 ? ' ok' : '');
      $('ar' + i).classList.toggle('done', v === 2);
    });
  });
}
