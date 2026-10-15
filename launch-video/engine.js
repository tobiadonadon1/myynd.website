/* launch-video engine.
 * Every frame is a pure function of time: window.__seek(t) renders it, so frames can be captured one by one.
 * Don't edit this file per video. The product goes in product.css + product.js, the story in scenes.js.
 *
 * Load order (see video.html): GSAP, engine.js, product.js, scenes.js.
 * scenes.js must define: VIDEO (config) and storyboard(). product.js must define buildScreens().
 */
'use strict';

/* ---------- format and layout ---------- */
var QS = new URLSearchParams(location.search);
var FORMATS = { '16x9': { W: 1920, H: 1080 }, '9x16': { W: 1080, H: 1920 } };
/* Layout presets. Scenes read positions from L so one storyboard renders in both formats. */
var LAYOUTS = {
  '16x9': {
    cap: 'side',
    phone:   { sx: 1350, sy: 560, s: 1 },
    laptop:  { sx: 1270, sy: 560, s: 0.76 },
    browser: { sx: 1255, sy: 560, s: 0.74 },
    focusY: 530,             // where a zoomed-in detail sits vertically
    zoom: 1,                 // multiplier applied by Rig.focusOn()
    titleSize: 116,
    closeSize: 62,
    close: { laptop: { sx: 820, sy: 650, s: 0.6 }, browser: { sx: 820, sy: 650, s: 0.58 }, phone: { sx: 1335, sy: 610, s: 0.7 } },
    scrim: 'linear-gradient(90deg, var(--stage) 0, var(--stage) 780px, rgba(0,0,0,0) 900px)'
  },
  '9x16': {
    cap: 'top',
    phone:   { sx: 540, sy: 1260, s: 1.04 },
    laptop:  { sx: 540, sy: 1230, s: 0.8 },
    browser: { sx: 540, sy: 1230, s: 0.76 },
    focusY: 1270,
    capBottom: 600,          // zoomed devices keep their top edge below this when they can
    zoom: 1.12,
    titleSize: 106,
    closeSize: 66,
    close: { laptop: { sx: 540, sy: 1020, s: 0.78 }, browser: { sx: 540, sy: 1020, s: 0.76 }, phone: { sx: 760, sy: 1380, s: 0.66 } },
    scrim: 'linear-gradient(180deg, var(--stage) 0, var(--stage) 720px, rgba(0,0,0,0) 880px)'
  }
};
var FORMAT, W, H, L, DUR, BPM, B, BAR, tl, M = {};
function byFormat(wide, tall){ return FORMAT === '9x16' ? tall : wide; }

/* Every sound lands on the same times the visuals use. */
var CUES = [];
function cue(t, type, opt){ CUES.push({ t: t, type: type, opt: opt || {} }); return t; }

/* ---------- small helpers ---------- */
var $ = function(id){ return document.getElementById(id); };
function el(h){ var d = document.createElement('div'); d.innerHTML = String(h).trim(); return d.firstChild; }
function rng(seed){ var s = seed >>> 0; return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
/* Layout position of a node inside a positioned ancestor. Ignores transforms, which is what we want for camera math.
 * The node must be laid out (visibility:hidden is fine, display:none is not). */
function offIn(node, anc){
  var x = 0, y = 0, n = node;
  while (n && n !== anc){ x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  if (n !== anc) throw new Error('offIn: ancestor is not in the offsetParent chain of ' + (node.id || node.className));
  return { x: x, y: y, w: node.offsetWidth, h: node.offsetHeight, cx: x + node.offsetWidth / 2, cy: y + node.offsetHeight / 2 };
}

/* ---------- time-driven state (works for any seek, unlike timeline callbacks) ---------- */
var CONT = [];
/* steps([[t0, v0], [t1, v1], ...], apply): applies the latest value whose time has passed */
function steps(list, apply){
  var last;
  CONT.push(function(t){
    var v = list[0][1];
    for (var i = 1; i < list.length; i++) if (t >= list[i][0]) v = list[i][1];
    if (v !== last){ last = v; apply(v); }
  });
}
function text(node, list){ steps(list, function(v){ node.textContent = v; }); }
function html(node, list){ steps(list, function(v){ node.innerHTML = v; }); }
function every(fn){ CONT.push(fn); }   // fn(t) runs on every frame

/* ---------- devices and camera rigs ---------- */
/* Device sizes in px. ix/iy/is: where the screen content (.inner) starts inside the device and its scale. */
var DEVICES = {
  phone:   { w: 430,  h: 880, ix: 12, iy: 64, is: 1 },
  laptop:  { w: 1240, h: 830, ix: 22, iy: 22, is: 0.8306 },
  browser: { w: 1320, h: 860, ix: 0,  iy: 48, is: 0.91667 }
};
var RIGS = [];
function deviceHTML(type, inner, opts){
  opts = opts || {};
  if (type === 'phone') return '<div class="dev phone"><div class="scr"><div class="island"></div>' +
    '<div class="sbar"><span>9:41</span><span class="ic">' +
      '<svg width="19" height="12" viewBox="0 0 19 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
      '<svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 11.5l2.6-3a3.6 3.6 0 00-5.2 0zM3.5 6.2a7 7 0 0110 0l1.6-1.8a9.5 9.5 0 00-13.2 0zM.3 2.6a12 12 0 0116.4 0"/></svg>' +
      '<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2"/><rect x="24.5" y="4.5" width="1.6" height="4" rx=".8" opacity=".4"/></svg>' +
    '</span></div><div class="inner">' + inner + '</div><div class="homeind"></div></div></div>';
  if (type === 'laptop') return '<div class="dev laptop"><div class="lid"><div class="cam"></div><div class="mscr"><div class="inner">' + inner + '</div></div></div><div class="base"></div></div>';
  if (type === 'browser') return '<div class="dev browser"><div class="bar"><span class="lights"><i></i><i></i><i></i></span><span class="url">' + (opts.url || 'yourapp.com') + '</span></div>' +
    '<div class="bscr"><div class="inner">' + inner + '</div></div></div>';
  throw new Error('unknown device ' + type);
}
/* Rig: a device on its own camera. The camera puts point (fx, fy) of the rig at stage point (sx, sy), zoomed by s.
 * Never scale the .dev element itself (animate the camera instead) or the point math below drifts. */
function Rig(type, inner, opts){
  opts = opts || {};
  var spec = DEVICES[type];
  var node = el('<div class="rig" id="rig-' + (opts.id || type) + '">' + deviceHTML(type, inner, opts) + '</div>');
  $('rigs').appendChild(node);
  var home = L[type];
  var r = { type: type, spec: spec, node: node, dev: node.firstChild, inner: node.querySelector('.inner'),
            home: home, cam: { s: home.s, fx: 0, fy: 0, sx: home.sx, sy: home.sy } };
  r.last = Object.assign({}, r.cam);
  gsap.set(node, { autoAlpha: opts.visible ? 1 : 0, zIndex: opts.z != null ? opts.z : { phone: 3, browser: 2, laptop: 1 }[type] });   // phones sit in front of laptops
  /* device px (from the device's top-left) of a node inside the screen */
  r.at = function(n){ var o = offIn(n, r.inner); return { x: spec.ix + o.x * spec.is, y: spec.iy + o.y * spec.is, w: o.w * spec.is, h: o.h * spec.is }; };
  /* rig coordinates of a device px point, or of a node (ax, ay: 0..1 anchor inside the node, default center) */
  r.pt = function(dx, dy){ return { x: dx - spec.w / 2, y: dy - spec.h / 2 }; };
  r.ptOf = function(n, ax, ay){ var a = r.at(n); return r.pt(a.x + a.w * (ax == null ? 0.5 : ax), a.y + a.h * (ay == null ? 0.5 : ay)); };
  r.toStage = function(p, c){ c = c || r.last; return { x: c.sx - c.s * c.fx + c.s * p.x, y: c.sy - c.s * c.fy + c.s * p.y }; };
  r.stageOf = function(n, c, ax, ay){ return r.toStage(r.ptOf(n, ax, ay), c); };
  r.edges = function(c){ c = c || r.last; var m = r.toStage({ x: 0, y: 0 }, c); return { left: m.x - spec.w / 2 * c.s, right: m.x + spec.w / 2 * c.s, top: m.y - spec.h / 2 * c.s, bottom: m.y + spec.h / 2 * c.s }; };
  /* a camera state that brings node into focus at zoom s (multiplied by the format's zoom).
     Zoom is absolute stage scale, not relative to home: the phone's home is 1.0, laptop and browser about 0.75.
     Good ranges in 16:9: phone 1.15 to 1.5, laptop/browser 0.9 to 1.3. o.ax/o.ay anchor inside the node (0..1),
     o.sx/o.sy pin the focus point on stage (o.sy turns off automatic framing), o.free keeps focusY without framing. */
  r.focusOn = function(n, s, o){
    o = o || {};
    var p = r.ptOf(n, o.ax, o.ay), v = { s: s * (o.raw ? 1 : L.zoom), fx: p.x, fy: p.y, sx: o.sx != null ? o.sx : home.sx, sy: o.sy != null ? o.sy : L.focusY };
    if (!o.free && o.sy == null){
      /* framing. The region a device may use: the whole frame in 16:9, the space under the caption in 9:16.
         A device that fits in it is centered in it (no empty band above or below).
         A taller one keeps the focus point at focusY, then closes any gap at the region's top or bottom edge,
         as long as the focus point stays at least 140px inside the region. */
      var rTop = L.cap === 'top' ? L.capBottom : 0, gap = 140, dh = spec.h * v.s, e = r.edges(v);
      if (dh <= H - rTop) v.sy += (rTop + H) / 2 - (e.top + e.bottom) / 2;
      else {
        if (e.top > rTop) v.sy -= Math.max(0, Math.min(e.top - rTop, v.sy - (rTop + gap)));
        e = r.edges(v);
        if (e.bottom < H) v.sy += Math.max(0, Math.min(H - e.bottom, H - gap - v.sy));
      }
    }
    return v;
  };
  r.homeView = function(){ return { s: home.s, fx: 0, fy: 0, sx: home.sx, sy: home.sy }; };
  /* tween the camera; returns the full target state, for aiming taps and callouts */
  r.camTo = function(t, target, dur, ease){
    tl.to(r.cam, Object.assign({ duration: dur == null ? 0.9 : dur, ease: ease || 'power3.inOut' }, target), t);
    r.last = Object.assign({}, r.last, target);
    return Object.assign({}, r.last);
  };
  r.camSet = function(t, target){ tl.set(r.cam, target, t); r.last = Object.assign({}, r.last, target); return Object.assign({}, r.last); };
  r.show = function(t){ tl.set(node, { autoAlpha: 1 }, t); };
  r.hide = function(t){ tl.set(node, { autoAlpha: 0 }, t); };
  RIGS.push(r);
  return r;
}
function applyRigs(){ RIGS.forEach(function(r){ var c = r.cam; r.node.style.transform = 'translate(' + (c.sx - c.s * c.fx) + 'px,' + (c.sy - c.s * c.fy) + 'px) scale(' + c.s + ')'; }); }

/* ---------- background ---------- */
var GLOWS = 0;
/* Glow(color): a soft radial light behind the devices. Returns its id for glowTo(). */
function Glow(color, o){
  o = o || {};
  var id = 'glow' + (GLOWS++), x = o.x != null ? o.x : L.phone.sx, y = o.y != null ? o.y : L.phone.sy, rx = o.rx || byFormat(1000, 900), ry = o.ry || byFormat(820, 1100);
  var g = el('<div class="glow" id="' + id + '" style="background:radial-gradient(' + rx + 'px ' + ry + 'px at ' + x + 'px ' + y + 'px, ' + color + ', rgba(0,0,0,0) 70%)"></div>');
  $('glows').appendChild(g);
  gsap.set(g, { opacity: o.on ? 1 : 0 });
  return id;
}
function glowTo(id, t, v, dur){ tl.to('#' + id, { opacity: v, duration: dur || 0.9, ease: 'power2.inOut' }, t); }
function darkTo(t, v, dur){ tl.to('#dark', { opacity: v, duration: dur || 0.7, ease: 'power2.inOut' }, t); }
/* scrimTo(t, v, dur, gradient): fade the caption side to the stage color. gradient (optional CSS) replaces the format's default from time t,
   e.g. a wider fade when a zoomed browser's sidebar would show through */
var SCRIMS = [];
function scrimTo(t, v, dur, gradient){
  if (gradient) SCRIMS.push([t, gradient]); else if (v > 0) SCRIMS.push([t, null]);
  tl.to('#scrim', { opacity: v, duration: dur || 0.5, ease: 'power2.out' }, t);
}

/* ---------- captions ---------- */
/* Caption({num:'01', label:'Capture', lines:['Add anything', 'in <b>one line.</b>'], sub:'...', dark, center, size}) */
function Caption(o){
  var c = el('<div class="cap' + (o.dark ? ' dark' : '') + (o.center ? ' center' : '') + '">' +
    (o.num ? '<div class="eyebrow"><span class="num">' + o.num + '</span>' + o.label + '</div>' : '') +
    '<div class="headline"' + (o.size ? ' style="font-size:' + o.size + 'px"' : '') + '>' +
      o.lines.map(function(l){ return '<span class="mask"><span>' + l + '</span></span>'; }).join('') + '</div>' +
    (o.sub ? '<p class="sub">' + o.sub + '</p>' : '') + '</div>');
  $('caps').appendChild(c);
  gsap.set(c.querySelectorAll('.mask > span'), { yPercent: 115 });
  var extra = c.querySelectorAll('.eyebrow, .sub');
  if (extra.length) gsap.set(extra, { autoAlpha: 0 });
  return c;
}
function capIn(c, t){
  var eb = c.querySelector('.eyebrow'), sub = c.querySelector('.sub');
  if (eb) tl.fromTo(eb, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, t);
  tl.fromTo(c.querySelectorAll('.mask > span'), { yPercent: 115 }, { yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: 0.1 }, t + 0.08);
  if (sub) tl.fromTo(sub, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, t + 0.32);
}
function capOut(c, t){ tl.to(c, { autoAlpha: 0, y: -22, duration: 0.4, ease: 'power2.in' }, t); }
/* show line i of a caption from frame 0 (for the opener, so the first frame works as a muted thumbnail) */
function capShowNow(c, i){ gsap.set(c.querySelectorAll('.mask > span')[i || 0], { yPercent: 0 }); }

/* ---------- touches and callouts ---------- */
function tapAt(p, t, quiet){
  tl.fromTo('#tap', { left: p.x, top: p.y, autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'power2.out' }, t - 0.14)
    .to('#tap', { scale: 0.86, duration: 0.08, ease: 'power2.out' }, t)
    .to('#tap', { autoAlpha: 0, scale: 1.15, duration: 0.3, ease: 'power2.out' }, t + 0.1);
  if (!quiet) cue(t, 'tap');
}
/* callout(p, side, label, tIn, tOut, o): a dot on stage point p with a line out to a label.
 * side: 'left' | 'right' | 'up' | 'down' (the preferred side; if the label would leave the frame, the first side that fits is used).
 * o.len: line length in px. o.clear: an edges() box that left/right labels must sit outside of (the device).
 * o.wide / o.tall: overrides for 16:9 / 9:16, e.g. { tall: { p: otherPoint, side: 'up', len: 70 } }.
 * o.only: '16x9' or '9x16' to show the callout in one format only.
 * Timing: it takes about 0.85s to draw, so give it tOut - tIn >= 1.7 (about 0.9s fully visible),
 * and keep the camera still until it has faded (tOut + 0.3). */
function callout(p, side, label, tIn, tOut, o){
  o = o || {};
  if (o.only && o.only !== FORMAT) return null;
  var ov = FORMAT === '9x16' ? o.tall : o.wide;
  if (ov){ p = ov.p || p; side = ov.side || side; o = Object.assign({}, o, ov); }
  if (tOut - tIn < 1.6) console.warn('callout "' + label + '" is fully visible for only ' + Math.max(0, tOut - tIn - 0.83).toFixed(2) + 's; give it tOut - tIn >= 1.7');
  var n = el('<div class="callout" style="left:' + p.x + 'px; top:' + p.y + 'px"><span class="line"></span><span class="lbl">' + label + '</span><span class="dot"></span></div>');
  $('callouts').appendChild(n);
  var line = n.querySelector('.line'), lbl = n.querySelector('.lbl'), dot = n.querySelector('.dot');
  var lw = lbl.offsetWidth, lh = lbl.offsetHeight, pad = 24;
  var lenFor = function(sd){
    if (o.len != null) return o.len;
    var hz = sd === 'left' || sd === 'right', sg = sd === 'left' || sd === 'up' ? -1 : 1;
    if (o.clear && hz) return (sg < 0 ? p.x - o.clear.left : o.clear.right - p.x) + 46;
    return hz ? 160 : 110;   // vertical labels sit over the screen rather than clearing a tall device
  };
  var fits = function(sd){
    var ln = lenFor(sd);
    if (sd === 'left') return p.x - ln - 6 - lw >= pad;
    if (sd === 'right') return p.x + ln + 6 + lw <= W - pad;
    var inX = p.x - lw / 2 >= pad && p.x + lw / 2 <= W - pad;
    if (sd === 'up') return inX && p.y - ln - 6 - lh >= pad;
    return inX && p.y + ln + 6 + lh <= H - pad;
  };
  var order = [side].concat(['left', 'right', 'down', 'up'].filter(function(s){ return s !== side; }));
  side = order.filter(fits)[0] || side;
  var horiz = side === 'left' || side === 'right', sign = side === 'left' || side === 'up' ? -1 : 1, len = lenFor(side);
  if (horiz){
    gsap.set(line, { left: sign < 0 ? -len : 0, top: -1, width: len, height: 2, scaleX: 0, transformOrigin: sign < 0 ? '100% 50%' : '0% 50%' });
    gsap.set(lbl, { left: sign < 0 ? -len - 6 : len + 6, top: 0, xPercent: sign < 0 ? -100 : 0, yPercent: -50, autoAlpha: 0 });
  } else {
    gsap.set(line, { top: sign < 0 ? -len : 0, left: -1, height: len, width: 2, scaleY: 0, transformOrigin: sign < 0 ? '50% 100%' : '50% 0%' });
    gsap.set(lbl, { top: sign < 0 ? -len - 6 : len + 6, left: 0, xPercent: -50, yPercent: sign < 0 ? -100 : 0, autoAlpha: 0 });
  }
  gsap.set(dot, { scale: 0 });
  tl.to(dot, { scale: 1, duration: 0.35, ease: 'power3.out' }, tIn);
  tl.to(line, horiz ? { scaleX: 1, duration: 0.45, ease: 'power3.inOut' } : { scaleY: 1, duration: 0.45, ease: 'power3.inOut' }, tIn + 0.1);
  tl.fromTo(lbl, horiz ? { autoAlpha: 0, x: sign * -14 } : { autoAlpha: 0, y: sign * -14 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.45, ease: 'power3.out' }, tIn + 0.38);
  tl.to(n, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, tOut);
  cue(tIn + 0.38, 'ui');
  return n;
}

/* ---------- common UI motions ---------- */
/* typeText({field, placeholder, caret, text, t0, t1, clearAt}): types text into field between t0 and t1 with key sounds */
function typeText(o){
  var len = o.text.length;
  every(function(t){
    var on = t >= o.t0 && t < (o.clearAt || 1e9);
    o.field.textContent = on ? o.text.slice(0, Math.round(clamp01((t - o.t0) / (o.t1 - o.t0)) * len)) : '';
    if (o.placeholder) o.placeholder.style.display = on ? 'none' : '';
    if (o.caret) o.caret.style.opacity = on && (t < o.t1 || Math.floor(t * 3) % 2 === 0) ? 1 : 0;
  });
  for (var i = 0; i < len; i++) if (o.text[i] !== ' ') cue(o.t0 + (o.t1 - o.t0) * i / len, 'key', { i: i });
}
/* countTo(node, from, to, t0, t1, fmt, o): a number or clock that runs between t0 and t1.
 * Ease-in by default; o.linear, or o.ease: any GSAP ease name ('power3.out' to match a bar growing at the same time). */
function countTo(node, from, to, t0, t1, fmt, o){
  o = o || {};
  var EASE = o.ease ? gsap.parseEase(o.ease) : null;
  every(function(t){
    if (o.before != null && t < (o.startAt != null ? o.startAt : t0)){ node.textContent = o.before; return; }
    var p = clamp01((t - t0) / (t1 - t0)); p = o.ease ? EASE(p) : o.linear ? p : p * p;
    node.textContent = fmt(from + (to - from) * p);
  });
  if (o.ticks) for (var i = 0; i < o.ticks; i++) cue(t0 + (t1 - t0) * Math.sqrt(i / o.ticks), 'tick');
}
function clock(secs){ var s = Math.max(0, Math.ceil(secs)), m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
/* swapView(t, fromNode, toNode, dir, width): slide one screen out and the next in, like a tab change (dir 1: next comes from the right) */
function swapView(t, from, to, dir, width){
  width = width || to.offsetWidth || 406;
  tl.set(to, { autoAlpha: 1 }, t);
  tl.fromTo(to, { x: dir * width }, { x: 0, duration: 0.5, ease: 'power3.inOut' }, t);
  tl.to(from, { x: -dir * width, duration: 0.5, ease: 'power3.inOut' }, t);
  cue(t, 'whoosh', { soft: true });
}
/* growIn(t, node, height): a row that opens in place (start it with style="height:0;overflow:hidden") */
function growIn(t, node, h){
  tl.to(node, { height: h, duration: 0.55, ease: 'power3.out' }, t);
  tl.fromTo(node.firstElementChild, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, t + 0.08);
}

/* ---------- time control ---------- */
function seekSync(t){
  tl.seek(Math.max(t, 1e-6), false);
  applyRigs();
  for (var i = 0; i < CONT.length; i++) CONT[i](t);
}
window.__seek = function(t){
  seekSync(t);
  /* wait two frames so the page is painted; if frames stop (a sleeping display can pause them), don't hang */
  return new Promise(function(res){
    var done = false, finish = function(){ if (!done){ done = true; res(true); } };
    requestAnimationFrame(function(){ requestAnimationFrame(finish); });
    setTimeout(finish, 250);
  });
};
window.__info = function(){ return { W: W, H: H, DUR: DUR, FORMAT: FORMAT }; };

/* ---------- audio: synthesized music and soft UI sounds ---------- */
var SR = 48000;
function NOTE(n){ return 440 * Math.pow(2, (n - 69) / 12); }
var CHORDS = {
  Fmaj7: [53, 57, 60, 64], G6: [55, 59, 62, 64], Am7: [57, 60, 64, 67], Cmaj7: [55, 59, 60, 64],
  Cadd9: [55, 60, 62, 64], Gsus: [55, 60, 62, 67], Fmaj9: [53, 57, 64, 67],
  Dm9: [53, 57, 60, 64], G13: [53, 59, 64, 67], Cmaj9: [52, 55, 59, 62], Am9: [55, 59, 60, 64],
  Em7: [52, 55, 59, 62], Dsus: [50, 55, 57, 62], Bbmaj7: [50, 53, 57, 58]
};
var ROOTS = { Fmaj7: 41, G6: 43, Am7: 45, Cmaj7: 48, Cadd9: 48, Gsus: 43, Fmaj9: 41, Dm9: 38, G13: 43, Cmaj9: 48, Am9: 45, Em7: 40, Dsus: 38, Bbmaj7: 46 };
/* moods: progression (one chord per bar) and the chord the last bar resolves to */
var MOODS = {
  warm:   { prog: ['Fmaj7', 'G6', 'Am7', 'Cmaj7'], resolve: 'Cmaj7' },   // friendly, consumer apps
  bright: { prog: ['Cadd9', 'Gsus', 'Am7', 'Fmaj9'], resolve: 'Cadd9' },  // upbeat: social, creative, money, fitness
  calm:   { prog: ['Dm9', 'G13', 'Cmaj9', 'Am9'], resolve: 'Cmaj9' },     // meditation, sleep: only when calm is the promise
  tech:   { prog: ['Am9', 'Fmaj7', 'Cmaj7', 'Gsus'], resolve: 'Am9' }      // dev tools, B2B, AI
};
function renderAudio(){
  var mu = Object.assign({ mood: 'warm', intro: 2, dips: [], level: 1 }, VIDEO.music || {});
  var mood = MOODS[mu.mood] || MOODS.warm, nBars = Math.ceil(DUR / BAR - 0.01), lastBar = nBars - 1;
  var chordAt = function(bar){ return bar >= lastBar ? mood.resolve : mood.prog[bar % mood.prog.length]; };
  var ctx = new OfflineAudioContext(2, Math.round(SR * DUR), SR);
  var master = ctx.createGain(); master.gain.value = 0.85;
  var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
  master.connect(comp); comp.connect(ctx.destination);
  var music = ctx.createGain(); music.gain.value = 0.62 * mu.level; music.connect(master);
  var duck = ctx.createGain(); duck.gain.value = 1; duck.connect(music);       // gentle sidechain for the harmony
  var sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
  var r = rng(4242), len = SR * 2.6, ir = ctx.createBuffer(2, len, SR);
  for (var ch = 0; ch < 2; ch++){ var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
  var verb = ctx.createConvolver(); verb.buffer = ir; var verbOut = ctx.createGain(); verbOut.gain.value = 0.32; verb.connect(verbOut); verbOut.connect(master);
  var dl = ctx.createDelay(1); dl.delayTime.value = B * 0.75; var fb = ctx.createGain(); fb.gain.value = 0.3; var dlo = ctx.createGain(); dlo.gain.value = 0.28;
  dl.connect(fb); fb.connect(dl); dl.connect(dlo); dlo.connect(music);
  var nr = rng(99), NB = ctx.createBuffer(1, SR * 2, SR), nd = NB.getChannelData(0);
  for (var j = 0; j < nd.length; j++) nd[j] = nr() * 2 - 1;

  /* a gain starts at 1 by default: set it to silence first, or any delayed note blasts at full volume until its envelope begins */
  function env(g, t, a, peak, dd){ g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dd); }
  function send(node, amt){ var g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(verb); }
  function osc(t, f, type, a, dd, peak, dest, verbAmt){
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
    env(g, t, a, peak, dd); o.connect(g); g.connect(dest); if (verbAmt) send(g, verbAmt); o.start(t); o.stop(t + a + dd + 0.05);
  }
  function noise(t, dd, type, f, q, peak, dest, verbAmt){
    var s = ctx.createBufferSource(); s.buffer = NB; s.loop = true;
    var fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    var g = ctx.createGain(); env(g, t, 0.001, peak, dd);
    s.connect(fl); fl.connect(g); g.connect(dest); if (verbAmt) send(g, verbAmt);
    s.start(t, (t * 7.3) % 1.5); s.stop(t + dd + 0.05);
  }
  function sweep(t, dd, f0, f1, peak, dest, swell){
    var s = ctx.createBufferSource(); s.buffer = NB; s.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dd);
    var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t);
    if (swell){ g.gain.exponentialRampToValueAtTime(peak, t + dd); g.gain.linearRampToValueAtTime(0.0001, t + dd + 0.03); }
    else { g.gain.exponentialRampToValueAtTime(peak, t + dd * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dd); }
    s.connect(bp); bp.connect(g); g.connect(dest); send(g, 0.3); s.start(t, (t * 3.1) % 1.5); s.stop(t + dd + 0.05);
  }
  function keys(t, name, dd, vel){
    CHORDS[name].forEach(function(n, i){
      var f = NOTE(n), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 2600;
      env(g, t + i * 0.012, 0.006, vel, dd);
      var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; var g2 = ctx.createGain(); g2.gain.value = 0.16;
      var o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = f * 1.002; var g3 = ctx.createGain(); g3.gain.value = 0.1;
      o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(lp); lp.connect(duck); send(lp, 0.45);
      [o1, o2, o3].forEach(function(o){ o.start(t); o.stop(t + dd + 0.2); });
    });
  }
  function pad(t0, t1, name, level){
    CHORDS[name].forEach(function(n, i){
      [-8, 8].forEach(function(det){
        var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
        o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det + i * 2;
        f.type = 'lowpass'; f.frequency.value = 950; f.Q.value = 0.6;
        g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(level / 8, t0 + 0.6);
        g.gain.setValueAtTime(level / 8, Math.max(t0 + 0.6, t1 - 0.4)); g.gain.linearRampToValueAtTime(0.0001, t1);
        p.pan.value = det < 0 ? -0.45 : 0.45;
        o.connect(f); f.connect(g); g.connect(p); p.connect(duck); send(p, 0.5); o.start(t0); o.stop(t1 + 0.05);
      });
    });
  }
  function sub(t, n, dd, v){ osc(t, NOTE(n), 'sine', 0.01, dd, v || 0.32, music); osc(t, NOTE(n) * 2, 'triangle', 0.01, dd * 0.6, (v || 0.32) * 0.18, music); }
  function kick(t, v){
    var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    env(g, t, 0.003, v || 0.75, 0.32); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.4);
    duck.gain.setValueAtTime(0.7, t); duck.gain.linearRampToValueAtTime(1, t + 0.3);
  }
  function snap(t, v){ noise(t, 0.12, 'bandpass', 1900, 0.9, v || 0.22, music, 0.35); noise(t + 0.008, 0.06, 'highpass', 4000, 0.7, (v || 0.22) * 0.5, music); }
  function hat(t, v){ noise(t, 0.035, 'highpass', 8500, 0.7, v || 0.06, music); }
  function shaker(t, v){ noise(t, 0.05, 'bandpass', 6500, 1.2, v || 0.025, music); }
  function pluck(t, n, v){
    var g = ctx.createGain(); env(g, t, 0.004, v || 0.07, 0.45);
    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = NOTE(n);
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = NOTE(n) * 2; var g2 = ctx.createGain(); g2.gain.value = 0.3;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(music); g.connect(dl); send(g, 0.4);
    o1.start(t); o2.start(t); o1.stop(t + 0.55); o2.stop(t + 0.55);
  }

  /* arrangement: intro (pad + keys), groove (drums, bass, arpeggio), dips (drums out), last bar resolves */
  for (var bar = 0; bar < nBars; bar++){
    var t0 = bar * BAR, name = chordAt(bar), last = bar === lastBar, isDip = mu.dips.indexOf(bar) >= 0, isIntro = bar < mu.intro;
    pad(t0, last ? DUR : Math.min(DUR, t0 + BAR + 0.1), name, last ? 0.26 : 0.2);
    keys(t0, name, last ? 2.2 : 1.6, last ? 0.07 : 0.05);
    if (!last && !isIntro) keys(t0 + B * 1.5, name, 0.5, 0.025);
    if (!isIntro && !isDip && !last){
      for (var b = 0; b < 4; b++){
        var tb = t0 + b * B;
        if (b === 0 || b === 2) kick(tb, 0.7);
        if (b === 1 || b === 3) snap(tb);
        hat(tb + B / 2, 0.07); hat(tb, 0.035);
        if (bar >= mu.intro + 2) for (var s = 0; s < 4; s++) shaker(tb + s * B / 4, s % 2 ? 0.018 : 0.028);
      }
      if (bar % 2 === 1) kick(t0 + B * 3.5, 0.45);
      sub(t0, ROOTS[name], 0.85); sub(t0 + B * 2, ROOTS[name], 0.4, 0.24); sub(t0 + B * 3.5, ROOTS[name], 0.2, 0.18);
      if (bar >= mu.intro + 2 && bar < lastBar - 1){
        var arp = CHORDS[name].map(function(n){ return n + 12; });
        [0, 2, 1, 3, 2, 1, 3, 2].forEach(function(p, i){ pluck(t0 + i * B / 2, arp[p], i === 0 ? 0.075 : 0.055); });
      }
    } else if (isDip){
      for (var h = 0; h < 8; h++) hat(t0 + h * B / 2, h % 2 ? 0.05 : 0.025);
      sub(t0, ROOTS[name], 1.6, 0.2);
    } else if (isIntro){
      sub(t0, ROOTS[name], 1.8, 0.16);
      var motif = CHORDS[name].map(function(n){ return n + 12; });
      [0, 2, 3, 2].forEach(function(p, i){ pluck(t0 + 1 + i * B / 2, motif[p], 0.05); });
    }
  }
  if (mu.intro > 0) sweep(mu.intro * BAR - 1, 1, 300, 4200, 0.12, sfx, true);   // swell into the beat
  var tEnd = lastBar * BAR;
  kick(tEnd, 0.75); sub(tEnd, ROOTS[mood.resolve], 1.8, 0.28);
  CHORDS[mood.resolve].concat(CHORDS[mood.resolve].slice(0, 2).map(function(n){ return n + 12; })).forEach(function(n, i){ pluck(tEnd + 0.25 + i * 0.12, n + 12, 0.06); });

  /* sounds from the shared cue list */
  CUES.forEach(function(c){
    var t = c.t, o = c.opt;
    if (t < 0 || t > DUR) return;
    switch (c.type){
      case 'key': noise(t, 0.018, 'bandpass', 3400 + (o.i * 53) % 900, 2.5, 0.11, sfx); break;
      case 'tap': noise(t, 0.025, 'bandpass', 2600, 1.6, 0.2, sfx); osc(t, 900, 'sine', 0.002, 0.04, 0.05, sfx); break;
      case 'deal': sweep(t, 0.35, 700, 2600, 0.1, sfx); osc(t + 0.12, 180, 'sine', 0.004, 0.14, 0.12, sfx); break;
      case 'whoosh': sweep(t, 0.4, o.up ? 600 : 2400, o.up ? 3000 : 600, 0.07, sfx); break;
      case 'swell': sweep(t, o.dur || 1, 300, 4200, 0.12, sfx, true); break;
      case 'ui': osc(t, 2093, 'sine', 0.003, 0.09, 0.035, sfx, 0.3); break;
      case 'chime': osc(t, 1318.5, 'sine', 0.003, 0.8, 0.08, sfx, 0.5); osc(t + 0.05, 1975.5, 'sine', 0.003, 0.7, 0.05, sfx, 0.5); break;
      case 'msg': osc(t, o.low ? 620 : 740, 'sine', 0.003, 0.11, 0.09, sfx, 0.3); osc(t + 0.04, o.low ? 830 : 990, 'sine', 0.003, 0.09, 0.05, sfx, 0.3); break;
      case 'mar': { var f = NOTE(o.n || 76); osc(t, f, 'sine', 0.002, 0.35, 0.11, sfx, 0.35); osc(t, f * 3.98, 'sine', 0.002, 0.08, 0.025, sfx); break; }
      case 'tick': osc(t, 2000, 'sine', 0.002, 0.025, 0.045, sfx); break;
      case 'done': [1046.5, 1318.5, 1568, 2093].forEach(function(fr, i){ osc(t + i * 0.06, fr, 'sine', 0.003, 1.0, 0.07, sfx, 0.55); }); break;
    }
  });
  master.gain.setValueAtTime(0.85, Math.max(0, DUR - 0.8)); master.gain.linearRampToValueAtTime(0.0001, DUR - 0.02);
  return ctx.startRendering();
}
function wavBase64(buf){
  var n = buf.length, ch = 2, bytes = 44 + n * ch * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab);
  function str(o, s){ for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  str(0, 'RIFF'); v.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, SR, true); v.setUint32(28, SR * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  var L0 = buf.getChannelData(0), R0 = buf.getChannelData(1), o = 44, peak = 1e-9, i;
  for (i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L0[i]), Math.abs(R0[i]));
  /* normalize, then a gentle tanh soft clip for a fuller level without hard clipping */
  var DRIVE = 1.5, k = Math.tanh(DRIVE), sc = function(x){ return Math.tanh(DRIVE * x / peak) / k * 0.94; };
  for (i = 0; i < n; i++){
    v.setInt16(o, Math.round(sc(L0[i]) * 32767), true); o += 2;
    v.setInt16(o, Math.round(sc(R0[i]) * 32767), true); o += 2;
  }
  var u = new Uint8Array(ab), s = '', CHUNK = 0x8000;
  for (i = 0; i < u.length; i += CHUNK) s += String.fromCharCode.apply(null, u.subarray(i, i + CHUNK));
  return { b64: btoa(s), peak: peak };
}
window.__renderAudio = function(){ return renderAudio().then(wavBase64); };

/* ---------- boot ---------- */
function fit(){
  var s = Math.min(innerWidth / W, innerHeight / H);
  $('stage').style.transform = 'translate(' + (innerWidth - W * s) / 2 + 'px,' + (innerHeight - H * s) / 2 + 'px) scale(' + s + ')';
}
function applyBrand(b){
  var map = { stage: '--stage', night: '--night', ink: '--ink', muted: '--muted', accent: '--accent', accentOnDark: '--accent-dark', callout: '--callout', font: '--font' };
  Object.keys(map).forEach(function(k){ if (b[k]) document.documentElement.style.setProperty(map[k], k === 'font' ? "'" + b[k] + "', system-ui, -apple-system, sans-serif" : b[k]); });
  if (b.fontUrl){ var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = b.fontUrl; document.head.appendChild(lk); }
}
function boot(){
  if (typeof VIDEO === 'undefined' || typeof storyboard !== 'function' || typeof buildScreens !== 'function'){
    document.body.innerHTML = '<p style="color:#fff;font:20px sans-serif;padding:40px">scenes.js must define VIDEO and storyboard(), and product.js must define buildScreens().</p>';
    return;
  }
  var want = (QS.get('format') || (VIDEO.formats || ['16x9'])[0]).replace(':', 'x');
  FORMAT = FORMATS[want] ? want : '16x9';
  W = FORMATS[FORMAT].W; H = FORMATS[FORMAT].H; L = LAYOUTS[FORMAT];
  DUR = VIDEO.duration || 30; BPM = (VIDEO.music && VIDEO.music.bpm) || 120; B = 60 / BPM; BAR = B * 4;
  var stage = $('stage'); stage.style.width = W + 'px'; stage.style.height = H + 'px'; stage.setAttribute('data-format', FORMAT);
  $('scrim').style.background = L.scrim;
  $('darkglow').style.background = 'radial-gradient(' + byFormat('900px 760px', '900px 1100px') + ' at ' + L.phone.sx + 'px ' + L.phone.sy + 'px, color-mix(in srgb, var(--accent) 38%, transparent), transparent 70%)';
  gsap.set('#darkglow', { transformOrigin: L.phone.sx + 'px ' + L.phone.sy + 'px' });
  var brand = VIDEO.brand || {};
  applyBrand(brand);
  /* wait for every stylesheet (Google Fonts links included), then for each weight of the brand font and any extra fonts */
  var sheets = [].slice.call(document.querySelectorAll('link[rel="stylesheet"]')).map(function(lk){
    return lk.sheet ? Promise.resolve() : new Promise(function(res){ lk.addEventListener('load', res); lk.addEventListener('error', res); setTimeout(res, 8000); });
  });
  Promise.all(sheets).then(function(){
    var want = (VIDEO.fonts || []).slice();
    if (brand.font) [300, 400, 500, 600, 700, 800].forEach(function(w){ want.push(w + ' 40px "' + brand.font + '"'); });
    return Promise.all(want.map(function(f){ return document.fonts.load(f).catch(function(){}); }));
  }).then(function(){ return document.fonts.ready; }).then(function(){
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', immediateRender: false } });
    buildScreens();
    storyboard();
    if (SCRIMS.length){
      SCRIMS.sort(function(a, b){ return a[0] - b[0]; });
      steps([[0, null]].concat(SCRIMS), function(g){ $('scrim').style.background = g || L.scrim; });
    }
    tl.set({}, {}, DUR);
    seekSync(0);
    window.__ready = true;
    if (QS.has('play')){
      fit(); addEventListener('resize', fit);
      var btn = $('playbtn'); btn.style.display = 'grid';
      btn.onclick = function(){
        btn.textContent = 'Making the sound...';
        renderAudio().then(function(buf){
          btn.style.display = 'none';
          var ac = new AudioContext(), src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
          var start = ac.currentTime + 0.1; src.start(start);
          (function loop(){
            var t = ac.currentTime - start; seekSync(Math.max(0, Math.min(DUR, t)));
            if (t < DUR) requestAnimationFrame(loop); else { btn.textContent = 'Click to replay'; btn.style.display = 'grid'; }
          })();
        });
      };
    } else if (QS.has('t')){
      fit(); var T = parseFloat(QS.get('t'));
      for (var x = 0; x < T; x += 1 / 60) seekSync(x);
      seekSync(T);
    }
  }).catch(function(e){ console.error('boot failed', e); window.__bootError = String(e && e.stack || e); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
