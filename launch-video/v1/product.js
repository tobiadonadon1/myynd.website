/* Myynd's screens, rebuilt as HTML so they can animate. One laptop, one view per scene.
 * Demo data is made up: a small logistics company run by "Giulia". */
var LAPTOP;

var ICON = {
  desk: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="10" r="2.2" fill="currentColor"/></svg>',
  todo: '<svg viewBox="0 0 20 20"><path d="m5 10.5 3.2 3.2L15 6.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 20 20"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A1.5 1.5 0 0 1 4 11.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  auto: '<svg viewBox="0 0 20 20"><path d="M11 2.5 4.5 11h5l-1 6.5L15 9h-5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  moon: '<svg width="17" height="17" viewBox="0 0 20 20"><path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1z" fill="#3F5F84"/></svg>',
  clip: '<svg width="18" height="18" viewBox="0 0 16 16"><path d="m13 7.6-5 5a3 3 0 0 1-4.3-4.2l5.4-5.4a2 2 0 0 1 2.8 2.8L6.6 11a1 1 0 0 1-1.4-1.4l4.6-4.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
};

function myShell(views){
  return '<div class="my"><div class="lights"><i></i><i></i><i></i></div>' +
    '<aside class="my-side"><div class="wm"><span>myynd</span></div>' +
      '<nav class="my-nav">' +
        '<span id="n-desk" class="on">' + ICON.desk + 'Myynd<b id="n-count">5</b></span>' +
        '<span>' + ICON.todo + 'To do</span>' +
        '<span>' + ICON.chat + 'Chat</span>' +
        '<span id="n-auto">' + ICON.auto + 'Automations</span>' +
      '</nav>' +
      '<div class="my-user"><span class="my-av">GF</span><span><b>Giulia Ferri</b>Operations</span></div>' +
    '</aside>' +
    '<div class="my-main">' + views + '</div></div>';
}

/* the five things done overnight, reused by the opener and the morning desk */
var NIGHT = [
  ['Replied to Marco at Veneto Retail', '01:12'],
  ['Wrote 3 X posts from your week', '01:31'],
  ['Updated the next step for 4 clients', '01:47'],
  ['Chased 3 overdue invoices', '02:03'],
  ['Built the client invoice page', '02:14']
];
function rows(prefix){
  return NIGHT.map(function(r, i){
    return '<div class="nt-row" id="' + prefix + i + '"><span class="my-ring" id="' + prefix + 'k' + i + '"></span><span>' + r[0] + '</span><time id="' + prefix + 't' + i + '">' + r[1] + '</time></div>';
  }).join('');
}

function vNight(){
  return '<div class="my-view" id="v-night">' +
    '<div class="nt-head"><h1 class="my-h">Working while you sleep.</h1></div>' +
    '<div style="margin-top:14px"><span class="my-pill">' + ICON.moon + '<span id="nt-clock">01:12</span> · Your Mac is on</span></div>' +
    '<div class="my-card nt-list" id="nt-list">' + rows('nr') + '</div>' +
  '</div>';
}

function vInbox(){
  return '<div class="my-view" id="v-inbox" style="visibility:hidden">' +
    '<div class="my-crumb">Inbox › Veneto Retail</div>' +
    '<h1 class="my-h">Reply to Marco.</h1>' +
    '<div class="my-card ib-in"><span class="my-av">MB</span><div><b>Marco Bianchi</b><small>Veneto Retail · 23:48</small>' +
      '<p>Our PO 5520 was due Monday. Where is it? We need a date today.</p></div></div>' +
    '<div class="my-card ib-reply" id="ib-reply">' +
      '<div class="ib-row"><span>To</span>Marco Bianchi</div>' +
      '<div class="ib-row"><span>Subject</span>Re: PO 5520</div>' +
      '<div class="ib-body"><span id="ib-typed"></span><span class="ib-caret" id="ib-caret"></span></div>' +
      '<span class="ib-att" id="ib-att">' + ICON.clip + 'MSKU 4821936 · customs declaration.pdf <small>214 KB</small></span>' +
      '<div class="ib-foot"><p id="ib-note">Saved in your Drafts. You press send.</p><span class="my-btn" id="ib-send">Send</span></div>' +
    '</div>' +
  '</div>';
}

var POST1 = 'We moved 214 shipments this week. Not one arrived late.\n\nSmall team, boring logistics, very happy clients.';
function vPosts(){
  var who = '<div class="ps-who"><span class="my-av">GF</span><span><b>Giulia Ferri</b><br><small>Draft for X</small></span></div>';
  return '<div class="my-view" id="v-posts" style="visibility:hidden">' +
    '<div class="my-crumb">Myynd › Posts</div>' +
    '<h1 class="my-h">Three posts, from your week.</h1>' +
    '<div class="ps-from">From:<span class="my-chip" id="ps-c0">214 shipments</span><span class="my-chip" id="ps-c1">2 new clients</span><span class="my-chip" id="ps-c2">Koper route live</span></div>' +
    '<div class="ps-grid">' +
      '<div class="my-card ps-post" id="ps-main">' + who + '<p class="ps-text" id="ps-typed"></p>' +
        '<div class="ps-foot"><span class="my-chip ps-voice" id="ps-voice">In your voice</span><span id="ps-count">0/280</span><span class="my-ghost">Post</span></div></div>' +
      '<div class="ps-side">' +
        '<div class="my-card ps-post" id="ps-p1">' + who + '<p class="ps-text">Two new clients this week. Both came from a referral.</p></div>' +
        '<div class="my-card ps-post" id="ps-p2">' + who + '<p class="ps-text">The Koper route is live. Thursday deliveries just got a day faster.</p></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

var CLIENTS = [
  ['VR', '#B9532E', 'Veneto Retail', 'Shipment late, Marco asked twice', 'Reply drafted'],
  ['NH', '#4F7A4C', 'Nordic Home', 'Asked for a quote 3 days ago', 'Quote drafted, €4.20/pallet'],
  ['LS', '#3F5F84', 'Lumen Studio', 'Quiet for 12 days', 'Check-in drafted'],
  ['CA', '#8A5A9B', 'Corte Alta', 'Contract renews 3 Nov', 'Renewal brief ready']
];
function vClients(){
  return '<div class="my-view" id="v-clients" style="visibility:hidden">' +
    '<div class="my-crumb">Myynd › Clients</div>' +
    '<h1 class="my-h">Every client, one step ahead.</h1>' +
    '<div class="my-card cl-table" id="cl-table">' +
      '<div class="cl-row"><span>Client</span><span>Where it stands</span><span>Next step</span></div>' +
      CLIENTS.map(function(c, i){
        return '<div class="cl-row" id="cl' + i + '"><span class="cl-name"><span class="cl-logo" style="background:' + c[1] + '">' + c[0] + '</span>' + c[2] + '</span>' +
          '<span class="cl-state"><i></i>' + c[3] + '</span><span class="cl-next"><span class="my-chip" id="cl-n' + i + '">Waiting on you</span></span></div>';
      }).join('') +
    '</div>' +
  '</div>';
}

var INVOICES = [
  ['#2038', 'Veneto Retail', '€6,200', '23 Sep', 1],
  ['#2041', 'Lumen Studio', '€4,800', '25 Sep', 1],
  ['#2044', 'Corte Alta', '€7,400', '28 Sep', 1],
  ['#2047', 'Nordic Home', '€3,900', '22 Oct', 0]
];
function vInvoices(){
  return '<div class="my-view" id="v-inv" style="visibility:hidden">' +
    '<div class="iv-top"><div><div class="my-crumb">Myynd › Invoices</div><h1 class="my-h">Who still owes you.</h1></div>' +
      '<div class="iv-kpi"><small>Overdue</small><b id="iv-total">€0</b></div></div>' +
    '<div class="my-card iv-table" id="iv-table">' +
      '<div class="iv-row"><span>Invoice</span><span>Client</span><span>Amount</span><span>Due</span><span>Status</span></div>' +
      INVOICES.map(function(v, i){
        return '<div class="iv-row" id="iv' + i + '"><span class="num">' + v[0] + '</span><span>' + v[1] + '</span><span class="amt">' + v[2] + '</span><span class="num">' + v[3] + '</span>' +
          '<span class="iv-st" id="iv-s' + i + '"><span class="my-chip">' + (v[4] ? 'Open' : 'Not due yet') + '</span></span></div>';
      }).join('') +
    '</div>' +
    '<p class="iv-note" id="iv-note">3 reminders written in your tone, waiting in Drafts. Nothing sent.</p>' +
  '</div>';
}

var CODE = [
  '<span class="k">export default function</span> <b>OpenInvoices</b>({ client }) {',
  '  <span class="k">const</span> open = invoices(client).<span class="k">filter</span>(i =&gt; !i.paid)',
  '  <span class="k">return</span> &lt;<b>Page</b> title=<span class="s">"Your invoices"</span>&gt;',
  '    &lt;<b>Table</b> rows={open} sort=<span class="s">"due"</span> /&gt;',
  '    &lt;<b>PayButton</b> invoices={open} /&gt;',
  '  &lt;/<b>Page</b>&gt;',
  '}'
];
function vBuild(){
  return '<div class="my-view" id="v-build" style="visibility:hidden">' +
    '<div class="my-crumb">Myynd › Build</div>' +
    '<h1 class="my-h">A page for clients’ invoices.</h1>' +
    '<div class="bd-grid"><div>' +
      '<span class="my-card bd-ask">Let clients see what they still owe us.</span>' +
      '<div class="bd-code" id="bd-code"><div class="fn"><b>portal/invoices.tsx</b><span>new file</span></div>' +
        CODE.map(function(l, i){ return '<div class="bd-ln" id="bd-l' + i + '">' + l + '</div>'; }).join('') +
        '<div class="bd-test" id="bd-test">✓ 24 tests passed</div></div>' +
    '</div>' +
    '<div class="my-card bd-prev" id="bd-prev"><div class="hd">Preview <span class="my-chip" style="background:rgba(79,122,76,.12);color:#4F7A4C">Ready</span></div>' +
      '<div class="bd-shot"><b>Your invoices</b><div><span>#2038 · 23 Sep</span><em>€6,200</em></div><div><span>#2044 · 28 Sep</span><em>€7,400</em></div><div><span>#2047 · 22 Oct</span><span>€3,900</span></div></div>' +
      '<p>Waiting for your review. Nothing deployed.</p></div>' +
    '</div>' +
  '</div>';
}

function vEnd(){
  return '<div class="my-view" id="v-end" style="visibility:hidden">' +
    '<h1 class="my-h">5 things done while you slept.</h1>' +
    '<div style="margin-top:14px"><span class="my-pill">Friday 9 October · 07:30</span></div>' +
    '<div class="my-card en-list nt-list">' + rows('er') + '</div>' +
  '</div>';
}

function buildScreens(){
  LAPTOP = Rig('laptop', myShell(vNight() + vInbox() + vPosts() + vClients() + vInvoices() + vBuild() + vEnd()));
  /* 9:16 frames a narrower app so text stays readable on a phone */
  if (FORMAT === '9x16') LAPTOP.inner.querySelector('.my').classList.add('tall');
  /* the morning desk is already finished */
  NIGHT.forEach(function(r, i){ $('erk' + i).classList.add('ok'); });
}
