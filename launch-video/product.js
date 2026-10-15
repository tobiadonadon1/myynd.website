/* The Mac where Myynd works at night. One laptop rig; the mascot (#bot) moves between windows.
 * Content is Myynd's own work: its nightly scripts, its invoices, its numbers, its waitlist code. */
var LAPTOP;

/* where each window sits on the 1440 × 906 screen, and where the mascot stands next to it */
var WIN = {
  term:  { x: 60,  y: 66,  w: 720, h: 410, bot: { x: 680,  y: 280 } },
  web:   { x: 540, y: 78,  w: 850, h: 470, bot: { x: 1215, y: 370 } },
  sheet: { x: 100, y: 220, w: 820, h: 560, bot: { x: 840,  y: 540 } },
  code:  { x: 590, y: 184, w: 800, h: 570, bot: { x: 1215, y: 580 } },
  home:  { bot: { x: 655, y: 330 } },
  app:   { bot: { x: 1010, y: 470 } },
  end:   { bot: { x: 1200, y: 470 } }
};

var TERM = [
  ['cmd', '<span class="t-p">~</span> myynd run nightly'],
  ['backup', '<span class="t-dim">→</span> backup.sh            <span class="t-ok" id="tk0"></span>'],
  ['sort', '<span class="t-dim">→</span> sort-downloads.sh    <span class="t-ok" id="tk1"></span>'],
  ['export', '<span class="t-dim">→</span> export-numbers.py    <span class="t-ok" id="tk2"></span>']
];
var TERM_OK = ['✓ 1,284 files backed up', '✓ 212 files sorted', '✓ october.csv'];

var SITES = [
  ['Hosting', 'billing.hosting.example/invoices', ['INV-0931', '€189.00'], ['INV-0874', '€189.00']],
  ['Ads', 'ads.example/billing', ['AD-22-10', '€1,240.00'], ['AD-22-09', '€980.00']],
  ['Software', 'account.software.example/receipts', ['R-55102', '€96.00'], ['R-55017', '€96.00']],
  ['Travel', 'trips.example/receipts', ['TR-8812', '€412.50'], ['TR-8790', '€138.00']]
];

var SHEET = [
  ['Jul', '38,400', '33,100', '14%', 52],
  ['Aug', '41,900', '35,200', '16%', 62],
  ['Sep', '44,700', '37,600', '16%', 66]
];

var CODE = [
  ['', '12', '<span class="k">export async function</span> join(email) {'],
  ['del', '13', '-  <span class="k">await</span> sheet.append(email)'],
  ['add', '13', '+  <span class="k">const</span> known = <span class="k">await</span> sheet.has(email)'],
  ['add', '14', '+  <span class="k">if</span> (known) <span class="k">return</span> { ok: <span class="k">true</span> }'],
  ['add', '15', '+  <span class="k">await</span> sheet.append(email)'],
  ['', '16', '   <span class="k">return</span> { ok: <span class="k">true</span> }'],
  ['', '17', '}']
];

var JOBS = [
  ['Run the nightly scripts', '01:12'],
  ['Download October’s invoices', '01:40'],
  ['Update the October numbers', '02:05'],
  ['Fix duplicate waitlist sign-ups', '02:31']
];

function win(id, cls, title, body){
  return '<div class="win ' + cls + '" id="' + id + '"><div class="tb"><i></i><i></i><i></i><span>' + title + '</span></div>' + body + '</div>';
}

function desktop(){
  var term = win('w-term', 'w-term', 'Terminal — myynd', '<pre>' + TERM.map(function(r, i){
    return '<span class="t-row" id="tr' + i + '">' + (i === 0 ? '<span id="t-cmd-pre" class="t-p">~</span> <span id="t-cmd"></span>' : r[1]) + '</span>';
  }).join('') + '</pre>');

  var web = win('w-web', 'w-web', 'Invoices', '<div class="tabs">' + SITES.map(function(s, i){ return '<span id="wt' + i + '">' + s[0] + '</span>'; }).join('') + '</div>' +
    '<div class="url" id="w-url">' + SITES[0][1] + '</div>' +
    '<div class="page"><h3 id="w-h">Hosting · Invoices</h3><small>October 2026</small>' +
      [0, 1].map(function(r){ return '<div class="inv"><span id="w-n' + r + '">' + SITES[0][2 + r][0] + '</span><span class="amt" id="w-a' + r + '">' + SITES[0][2 + r][1] + '</span><span class="dl" id="w-d' + r + '">Download</span></div>'; }).join('') +
      '<div class="saved">Saved to <b>Accounting / October</b><span style="margin-left:auto"><b id="w-count">0</b> invoices</span></div>' +
    '</div>');

  var sheet = win('w-sheet', 'w-sheet', 'October numbers.xlsx', '<div class="sh"><div class="grid">' +
      '<div><span></span><span>Revenue</span><span>Costs</span><span>Margin</span></div>' +
      SHEET.map(function(r){ return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span><span>' + r[2] + '</span><span>' + r[3] + '</span></div>'; }).join('') +
      '<div class="now"><span>Oct</span><span id="s-rev"></span><span id="s-cost"></span><span id="s-mar" class="pos"></span></div>' +
    '</div><div class="chart"><small>Margin</small><div class="bars">' +
      SHEET.map(function(r){ return '<div><i style="height:' + r[4] + '%"></i>' + r[0] + '</div>'; }).join('') +
      '<div class="now"><i id="s-bar" style="height:0"></i>Oct</div>' +
    '</div></div></div>');

  var code = win('w-code', 'w-code', 'myynd-web', '<div class="ftab"><span class="on">waitlist.ts</span><span>apps-script.gs</span></div>' +
    '<div class="code">' + CODE.map(function(l, i){ return '<div class="' + l[0] + '" id="cl' + i + '"><em>' + l[1] + '</em>' + l[2] + '</div>'; }).join('') + '</div>' +
    '<div class="term2"><div id="c-t0"><span class="t-p">~</span> npm test   <span class="t-ok" id="c-ok0"></span></div><div id="c-t1"><span class="t-p">~</span> myynd deploy   <span class="t-ok" id="c-ok1"></span></div></div>');

  var app = '<div class="win w-app" id="w-app"><span class="lt"><i></i><i></i><i></i></span>' +
    '<div class="ap-side"><span class="wm">myynd</span><nav class="ap-nav">' +
      '<span class="on">Myynd<b id="ap-count">4</b></span><span>To do</span><span>Chat</span><span>Automations</span></nav>' +
      '<div class="ap-me"><i></i>You</div></div>' +
    '<div class="ap-main"><h3 id="ap-h">Tonight.</h3><span class="ap-pill" id="ap-pill">4 jobs · starts at 01:10</span>' +
      '<div class="ap-list">' + JOBS.map(function(j, i){
        return '<div class="ap-row" id="ar' + i + '"><span class="ring"></span>' + j[0] + '<span class="ap-st" id="as' + i + '">Queued</span></div>';
      }).join('') + '</div></div></div>';

  var ask = '<div class="w-ask" id="w-ask"><span class="av"><i></i></span><div><small>Your note to Myynd · 23:40</small><b>People sign up twice. Fix it tonight.</b></div></div>';

  var bot = '<div class="bot" id="bot" data-pose="front"><div class="bot-hop" id="bot-hop"><div class="bot-face">' +
    ['front', 'side', 'back', 'laugh', 'giggle'].map(function(p){ return '<img class="p-' + p + '" src="assets/bot-' + p + '.png" alt="">'; }).join('') +
    '</div></div><div class="bot-tag" id="bot-tag"><i></i><span id="bot-say">4 jobs tonight</span></div></div>';

  return '<div class="dk" id="dk"><div class="day-bg" id="day-bg"></div>' +
    '<div class="mb"><img src="assets/myynd-mark-ivory.svg" alt=""><b>Myynd</b><span>File</span><span>Edit</span><span>View</span>' +
      '<span class="r"><span class="bot-ic"></span><span id="mb-clock">Thu 01:04</span></span></div>' +
    term + web + sheet + code + ask + app + bot +
    '<div class="dock"><span class="d-files">▤</span><span class="d-term" id="dk-term">&gt;_</span><span class="d-web" id="dk-web">◎</span>' +
      '<span class="d-sheet" id="dk-sheet">▦</span><span class="d-code" id="dk-code">&lt;/&gt;</span><span class="d-myynd on"><i></i></span></div>' +
  '</div>';
}

function buildScreens(){
  LAPTOP = Rig('laptop', desktop());
}
