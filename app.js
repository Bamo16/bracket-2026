'use strict';

// ── Safety check ──────────────────────────────────────────────────
if (typeof PICKS === 'undefined' || typeof R1_MATCHUPS === 'undefined') {
  document.body.innerHTML =
    '<div style="padding:48px;font-family:sans-serif;color:#c0392b;max-width:600px;margin:0 auto">' +
    '<h2 style="margin-bottom:12px">Error: pool_picks.js failed to load</h2>' +
    '<p>Make sure <code>pool_picks.js</code> is in the same folder as <code>index.html</code>.</p>' +
    '</div>';
  throw new Error('pool_picks.js not loaded');
}

// ── Constants ────────────────────────────────────────────────────
var ROUND_WEIGHTS  = {1:1, 2:2, 3:4, 4:6, 5:10, 6:15};
var ROUND_NAMES    = {1:'R1', 2:'R2', 3:'S16', 4:'E8', 5:'FF', 6:'Champ'};
var REGION_NAMES   = ['East','South','West','Midwest'];
var GAME_COUNTS    = [0, 32, 16, 8, 4, 2, 1];
var TIMEZONES = {
  Eastern: 'America/New_York',
  Central: 'America/Chicago',
  Mountain: 'America/Denver',
  Pacific:  'America/Los_Angeles'
};
var ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard' +
               '?groups=100&dates=20260319-20260407';

var NETWORK_META = {
  'CBS':       {bg:'#00458B', fg:'#fff',    local:'logos/cbs.svg'},
  'TBS':       {bg:'#0059A8', fg:'#fff',    local:'logos/tbs.svg'},
  'TNT':       {bg:'#1a1a1a', fg:'#c8a84b', local:'logos/tnt.svg'},
  'truTV':     {bg:'#00A9CE', fg:'#fff',    local:'logos/trutv.svg'},
  'TruTV':     {bg:'#00A9CE', fg:'#fff',    local:'logos/trutv.svg'},
  'TRUTV':     {bg:'#00A9CE', fg:'#fff',    local:'logos/trutv.svg'},
  'truTV/TBS': {bg:'#00A9CE', fg:'#fff',    local:'logos/trutv.svg'},
};

function networkBadge(name) {
  if (!name) return '';
  // Case-insensitive key lookup
  var key = name;
  if (!NETWORK_META[key]) {
    var up = name.toUpperCase();
    for (var k in NETWORK_META) { if (k.toUpperCase() === up) { key = k; break; } }
  }
  var meta = NETWORK_META[key];
  if (!meta) {
    return '<span class="net-badge" style="background:var(--surface2);color:var(--muted);border:1px solid var(--border)">' + name + '</span>';
  }
  // img with onerror fallback to colored badge — known to work with ESPN CDN
  var fb = '<span class="net-badge" style="display:none;background:' + meta.bg + ';color:' + meta.fg + '">' + name + '</span>';
  var src = meta.local || meta.cdn || '';
  var img = '<img class="net-logo" src="' + src + '" alt="' + name + '" ' +
            'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\'" />';
  return img + fb;
}

var TEAM_INFO = {
  'duke':         {espnId:'150',    seed:1},
  'siena':        {espnId:'2561',   seed:16},
  'ohio-st':      {espnId:'194',    seed:8},
  'tcu':          {espnId:'2628',   seed:9},
  'st-johns':     {espnId:'2599',   seed:5},
  'n-iowa':       {espnId:'2460',   seed:12},
  'kansas':       {espnId:'2305',   seed:4},
  'cal-baptist':  {espnId:'2856',   seed:13},
  'louisville':   {espnId:'97',     seed:6},
  's-florida':    {espnId:'58',     seed:11},
  'michigan-st':  {espnId:'127',    seed:3},
  'n-dakota-st':  {espnId:'2449',   seed:14},
  'ucla':         {espnId:'26',     seed:7},
  'ucf':          {espnId:'2116',   seed:10},
  'uconn':        {espnId:'41',     seed:2},
  'furman':       {espnId:'231',    seed:15},
  'florida':      {espnId:'57',     seed:1},
  'prairie-view': {espnId:'2504',   seed:16},
  'clemson':      {espnId:'228',    seed:8},
  'iowa':         {espnId:'2294',   seed:9},
  'vanderbilt':   {espnId:'238',    seed:5},
  'mcneese':      {espnId:'2377',   seed:12},
  'nebraska':     {espnId:'158',    seed:4},
  'troy':         {espnId:'2653',   seed:13},
  'n-carolina':   {espnId:'153',    seed:6},
  'vcu':          {espnId:'2670',   seed:11},
  'illinois':     {espnId:'356',    seed:3},
  'penn':         {espnId:'219',    seed:14},
  'st-marys':     {espnId:'2608',   seed:7},
  'texas-am':     {espnId:'245',    seed:10},
  'houston':      {espnId:'248',    seed:2},
  'idaho':        {espnId:'70',     seed:15},
  'arizona':      {espnId:'12',     seed:1},
  'liu':          {espnId:'112358', seed:16},
  'villanova':    {espnId:'222',    seed:8},
  'utah-state':   {espnId:'328',    seed:9},
  'wisconsin':    {espnId:'275',    seed:5},
  'high-point':   {espnId:'2272',   seed:12},
  'arkansas':     {espnId:'8',      seed:4},
  'hawaii':       {espnId:'62',     seed:13},
  'byu':          {espnId:'252',    seed:6},
  'texas':        {espnId:'251',    seed:11},
  'gonzaga':      {espnId:'2250',   seed:3},
  'kennesaw-st':  {espnId:'338',    seed:14},
  'miami-fl':     {espnId:'2390',   seed:7},
  'missouri':     {espnId:'142',    seed:10},
  'purdue':       {espnId:'2509',   seed:2},
  'queens':       {espnId:'2511',   seed:15},
  'michigan':     {espnId:'130',    seed:1},
  'howard':       {espnId:'47',     seed:16},
  'georgia':      {espnId:'61',     seed:8},
  'saint-louis':  {espnId:'139',    seed:9},
  'texas-tech':   {espnId:'2641',   seed:5},
  'akron':        {espnId:'2006',   seed:12},
  'alabama':      {espnId:'333',    seed:4},
  'hofstra':      {espnId:'2275',   seed:13},
  'tennessee':    {espnId:'2633',   seed:6},
  'miami-oh':     {espnId:'193',    seed:11},
  'virginia':     {espnId:'258',    seed:3},
  'wright-st':    {espnId:'2750',   seed:14},
  'kentucky':     {espnId:'96',     seed:7},
  'santa-clara':  {espnId:'2541',   seed:10},
  'iowa-state':   {espnId:'66',     seed:2},
  'tenn-state':   {espnId:'2634',   seed:15},
};

var ESPN_TO_SLUG = {};
(function() {
  for (var slug in TEAM_INFO) {
    if (TEAM_INFO.hasOwnProperty(slug)) ESPN_TO_SLUG[String(TEAM_INFO[slug].espnId)] = slug;
  }
})();

var PARTICIPANTS = Object.keys(PICKS).sort();

// ── Match ID lists ───────────────────────────────────────────────
function genIds(round, count) {
  var ids = [];
  for (var g = 1; g <= count; g++) ids.push('R' + round + 'G' + String(g).padStart(2, '0'));
  return ids;
}
var R1_IDS        = genIds(1, 32);
var LATER_IDS     = genIds(2,16).concat(genIds(3,8), genIds(4,4), genIds(5,2), genIds(6,1));
var ALL_MATCH_IDS = R1_IDS.concat(LATER_IDS);

// ── State ────────────────────────────────────────────────────────
var GAME_RESULTS        = {};
var espnEvents          = [];
var selectedParticipant = '';
var selectedTZ          = 'Central';
var activeTab           = 'standings';
var lastSyncTime        = null;
var liveScoreSnapshot   = {};  // matchId:espnId → score, before each poll
var scoreChangedSet     = {};  // matchId:espnId → true, populated after poll
var refreshInterval     = 60;  // seconds
var refreshTimer        = null;

// ── Helpers ──────────────────────────────────────────────────────

function getFeederIds(matchId) {
  var round = parseInt(matchId[1], 10);
  var game  = parseInt(matchId.substring(3), 10);
  if (round === 1) return null;
  var p1 = (game - 1) * 2 + 1;
  var p2 = game * 2;
  var pr = round - 1;
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return ['R' + pr + 'G' + pad(p1), 'R' + pr + 'G' + pad(p2)];
}

function getMatchTeamSlugs(matchId) {
  if (matchId.startsWith('R1')) return R1_MATCHUPS[matchId] || null;
  var feeders = getFeederIds(matchId);
  if (!feeders) return null;
  var w1 = GAME_RESULTS[feeders[0]] && GAME_RESULTS[feeders[0]].winner;
  var w2 = GAME_RESULTS[feeders[1]] && GAME_RESULTS[feeders[1]].winner;
  if (!w1 || !w2) return null;
  return [w1, w2];
}

function getRoundRegionLabel(matchId) {
  var round = parseInt(matchId[1], 10);
  var game  = parseInt(matchId.substring(3), 10);
  var rn = ROUND_NAMES[round];
  if (round >= 5) return rn;
  var divisors = [0, 8, 4, 2, 1];
  var reg = Math.ceil(game / divisors[round]);
  return rn + ' \xb7 ' + REGION_NAMES[reg - 1];
}

function isTeamAlive(slug) {
  for (var i = 0; i < ALL_MATCH_IDS.length; i++) {
    var mid    = ALL_MATCH_IDS[i];
    var result = GAME_RESULTS[mid];
    if (!result || !result.final) continue;
    var teams = getMatchTeamSlugs(mid);
    if (teams && teams.indexOf(slug) !== -1 && result.winner !== slug) return false;
  }
  return true;
}

// CDT date string YYYY-MM-DD
function dateCDT(date) {
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var parts = fmt.formatToParts(date);
  var y = parts.find(function(p){ return p.type === 'year';  }).value;
  var m = parts.find(function(p){ return p.type === 'month'; }).value;
  var d = parts.find(function(p){ return p.type === 'day';   }).value;
  return y + '-' + m + '-' + d;
}
function isTodayCDT(dateStr) { return dateCDT(new Date(dateStr)) === dateCDT(new Date()); }

// When timeValid=false ESPN uses a midnight-ET placeholder.
// Bucket by ET so the game lands on the correct calendar day.
function isGameToday(ev) {
  var dateStr = ev.date || '';
  if (!dateStr) return false;
  var timeValid = ev.competitions[0].timeValid !== false;
  if (timeValid) return isTodayCDT(dateStr);
  var etKey   = fmtDateKey(dateStr, 'Eastern');
  var todayEt = fmtDateKey(new Date().toISOString(), 'Eastern');
  return etKey === todayEt;
}

function fmtTime(dateStr, tzKey) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONES[tzKey] || 'America/Chicago',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  }).format(new Date(dateStr));
}

function fmtDate(dateStr, tzKey) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONES[tzKey] || 'America/Chicago',
    weekday: 'short', month: 'short', day: 'numeric'
  }).format(new Date(dateStr));
}

function fmtDateKey(dateStr, tzKey) {
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONES[tzKey] || 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var parts = fmt.formatToParts(new Date(dateStr));
  return parts.find(function(p){return p.type==='year';}).value  + '-' +
         parts.find(function(p){return p.type==='month';}).value + '-' +
         parts.find(function(p){return p.type==='day';}).value;
}

function periodLabel(period) {
  if (period === 1) return '1st Half';
  if (period === 2) return '2nd Half';
  if (period === 3) return 'OT';
  return String(period - 2) + 'OT';
}

function slugName(slug) {
  return slug.split('-').map(function(w){ return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}

function buildNameMap() {
  var map = {};
  for (var i = 0; i < espnEvents.length; i++) {
    var comps = espnEvents[i].competitions[0].competitors;
    for (var j = 0; j < comps.length; j++) {
      var t = comps[j].team;
      if (t && t.id) map[String(t.id)] = t.displayName || t.name || '';
    }
  }
  return map;
}

function logoImg(espnId, size) {
  if (!espnId || parseInt(espnId, 10) < 0) return '';
  var s = size || 22;
  return '<img class="team-logo" width="' + s + '" height="' + s + '" alt="" ' +
         'onerror="this.style.display=\'none\'" ' +
         'src="https://a.espncdn.com/i/teamlogos/ncaa/500/' + espnId + '.png">';
}
function slugLogo(slug, size) {
  var info = TEAM_INFO[slug];
  return info ? logoImg(info.espnId, size) : '';
}

function evNetwork(ev) {
  var comp = ev.competitions[0];
  if (comp.broadcasts && comp.broadcasts[0] && comp.broadcasts[0].names && comp.broadcasts[0].names[0]) {
    return comp.broadcasts[0].names[0];
  }
  if (comp.geoBroadcasts && comp.geoBroadcasts[0] && comp.geoBroadcasts[0].media) {
    return comp.geoBroadcasts[0].media.shortName || '';
  }
  return '';
}

// Parse ESPN event notes headline → {round, region} for fallback matching
function parseNotesRound(ev) {
  var notes = ev.competitions[0].notes;
  if (!notes || !notes[0]) return null;
  var h = notes[0].headline || '';
  var round = null, region = null;
  if      (h.indexOf('First Round')           !== -1) round = 1;
  else if (h.indexOf('Second Round')          !== -1) round = 2;
  else if (h.indexOf('Sweet 16')              !== -1) round = 3;
  else if (h.indexOf('Elite Eight') !== -1 || h.indexOf('Elite 8') !== -1) round = 4;
  else if (h.indexOf('Final Four')            !== -1) round = 5;
  else if (h.indexOf('National Championship') !== -1) round = 6;
  if      (h.indexOf('East')    !== -1) region = 0;
  else if (h.indexOf('South')   !== -1) region = 1;
  else if (h.indexOf('West')    !== -1) region = 2;
  else if (h.indexOf('Midwest') !== -1) region = 3;
  return {round: round, region: region};
}

// Returns the feeder slot index (0 or 1) for a TBD competitor,
// given the other (known) team's slug.
function getTbdFeederSlot(matchId, knownSlug) {
  if (matchId.startsWith('R1') || !knownSlug) return 0;
  var feeders = getFeederIds(matchId);
  if (!feeders) return 0;
  var r0 = GAME_RESULTS[feeders[0]];
  var r1 = GAME_RESULTS[feeders[1]];
  if (r0 && r0.winner === knownSlug) return 1;
  if (r1 && r1.winner === knownSlug) return 0;
  return 0;
}

// Returns rich HTML for a TBD team slot.
// If feeder game is settled: returns winner's logo+seed+name (just like a known team).
// If feeder game is known but unsettled: "Winner of: [logo seed name] vs [logo seed name]"
// If unknown: plain italic TBD.
function tbdLabel(matchId, feederSlotIdx) {
  if (matchId.startsWith('R1')) return '<span style="color:var(--muted2);font-style:italic">TBD</span>';
  var feeders = getFeederIds(matchId);
  if (!feeders) return '<span style="color:var(--muted2);font-style:italic">TBD</span>';
  var fMid    = feeders[feederSlotIdx] || feeders[0];
  var fResult = GAME_RESULTS[fMid];
  // Feeder game already decided — treat exactly like a known team
  if (fResult && fResult.final && fResult.winner) {
    var ws = fResult.winner;
    var wi = TEAM_INFO[ws];
    return (wi ? slugLogo(ws, 20) + ' <span class="seed-chip">' + wi.seed + '</span> ' : '') + slugName(ws);
  }
  // Determine the two teams in the feeder game
  var fTeams;
  if (fMid.startsWith('R1')) {
    fTeams = R1_MATCHUPS[fMid];
  } else {
    var ff = getFeederIds(fMid);
    if (ff) {
      var fw0 = GAME_RESULTS[ff[0]];
      var fw1 = GAME_RESULTS[ff[1]];
      fTeams = (fw0 && fw0.winner && fw1 && fw1.winner) ? [fw0.winner, fw1.winner] : null;
    }
  }
  if (!fTeams || fTeams.length < 2) return '<span style="color:var(--muted2);font-style:italic">TBD</span>';
  var live = fResult && fResult.live;
  function teamChip(s) {
    var info = TEAM_INFO[s];
    return (info ? slugLogo(s, 16) + ' <span class="seed-chip">' + info.seed + '</span> ' : '') + slugName(s);
  }
  var liveTag = live ? ' <span style="color:var(--live);font-family:\'Barlow Condensed\',sans-serif;font-size:10px;font-weight:800;letter-spacing:.08em">● LIVE</span>' : '';
  return '<span style="color:var(--muted);font-family:\'Barlow Condensed\',sans-serif;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Win:</span> ' +
    teamChip(fTeams[0]) +
    ' <span class="upc-vs">vs</span> ' +
    teamChip(fTeams[1]) +
    liveTag;
}

// Infer the user's timezone from the browser's IANA zone name
function detectTZ() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/New_York|Detroit|Indiana|Kentucky|Louisville|Monticello/.test(tz))           return 'Eastern';
    if (/Chicago|Knox_IN|Menominee|Winnipeg|Rainy_River|Rankin_Inlet|Resolute/.test(tz)) return 'Central';
    if (/Denver|Boise|Edmonton|Inuvik|Yellowknife|Ojinaga|Chihuahua|Hermosillo/.test(tz)) return 'Mountain';
    if (/Los_Angeles|Vancouver|Whitehorse|Dawson|Anchorage|Juneau|Nome|Honolulu/.test(tz)) return 'Pacific';
    return null;
  } catch(e) { return null; }
}

// ── ESPN poll & game processing ──────────────────────────────────

function processMatchSlot(matchId, events) {
  var expectedIds;
  if (matchId.startsWith('R1')) {
    var slugs = R1_MATCHUPS[matchId];
    if (!slugs) return;
    var id0 = TEAM_INFO[slugs[0]] && TEAM_INFO[slugs[0]].espnId;
    var id1 = TEAM_INFO[slugs[1]] && TEAM_INFO[slugs[1]].espnId;
    if (!id0 || !id1) return;
    expectedIds = [String(id0), String(id1)];
  } else {
    var feeders = getFeederIds(matchId);
    if (!feeders) return;
    var r0 = GAME_RESULTS[feeders[0]];
    var r1 = GAME_RESULTS[feeders[1]];
    if (!r0 || !r0.winner || !r1 || !r1.winner) return;
    var ei0 = TEAM_INFO[r0.winner] && TEAM_INFO[r0.winner].espnId;
    var ei1 = TEAM_INFO[r1.winner] && TEAM_INFO[r1.winner].espnId;
    if (!ei0 || !ei1) return;
    expectedIds = [String(ei0), String(ei1)];
  }

  var ev = null;
  for (var i = 0; i < events.length; i++) {
    var compIds = events[i].competitions[0].competitors.map(function(c){ return String(c.team.id); });
    if (expectedIds.every(function(id){ return compIds.indexOf(id) !== -1; })) {
      ev = events[i];
      break;
    }
  }
  if (!ev) return;

  var state    = ev.status && ev.status.type && ev.status.type.state;
  var typeName = ev.status && ev.status.type && ev.status.type.name;
  var comps    = ev.competitions[0].competitors;

  if (state === 'post') {
    var winnerComp = null;
    for (var wi = 0; wi < comps.length; wi++) { if (comps[wi].winner) { winnerComp = comps[wi]; break; } }
    if (!winnerComp) {
      winnerComp = comps.reduce(function(a, b) {
        return parseInt(a.score || 0, 10) > parseInt(b.score || 0, 10) ? a : b;
      });
    }
    var loserComp = comps.find(function(c){ return c !== winnerComp; });
    var winSlug   = ESPN_TO_SLUG[String(winnerComp.team.id)];
    if (winSlug) {
      GAME_RESULTS[matchId] = {
        winner: winSlug,
        score: (winnerComp.score || '0') + '-' + (loserComp ? loserComp.score || '0' : '0'),
        final: true
      };
    }
  } else if (state === 'in') {
    if (GAME_RESULTS[matchId] && GAME_RESULTS[matchId].final) return;
    var period  = (ev.status && ev.status.period) || 1;
    var clock   = (ev.status && ev.status.displayClock) || '';
    var network = evNetwork(ev);
    // Halftime detection
    var clockStr = typeName === 'STATUS_HALFTIME'
      ? 'Halftime'
      : (clock + ' ' + periodLabel(period));
    var compData = comps.map(function(c) {
      return {
        slug:   ESPN_TO_SLUG[String(c.team.id)] || null,
        espnId: String(c.team.id),
        name:   c.team.displayName || c.team.name || 'TBD',
        score:  c.score || '0'
      };
    });
    GAME_RESULTS[matchId] = {
      live: true,
      clockStr: clockStr,
      competitors: compData,
      network: network
    };
  } else {
    if (GAME_RESULTS[matchId] && GAME_RESULTS[matchId].live) delete GAME_RESULTS[matchId];
  }
}

function setApiStatus(status, timeStr) {
  var badge = document.getElementById('api-badge');
  var text  = document.getElementById('api-text');
  badge.className = 'api-badge ' + status;
  text.textContent = status === 'ok' ? 'LIVE' : status === 'sync' ? 'SYNCING' : 'ERROR';
  if (timeStr) {
    document.getElementById('sync-time').textContent = timeStr;
    document.getElementById('footer-sync').textContent = 'ESPN \xb7 synced ' + timeStr;
  }
}

async function poll() {
  // Snapshot live scores before fetching so we can detect changes
  liveScoreSnapshot = {};
  for (var mid0 in GAME_RESULTS) {
    if (GAME_RESULTS.hasOwnProperty(mid0) && GAME_RESULTS[mid0] && GAME_RESULTS[mid0].live && GAME_RESULTS[mid0].competitors) {
      GAME_RESULTS[mid0].competitors.forEach(function(c) {
        liveScoreSnapshot[mid0 + ':' + c.espnId] = c.score;
      });
    }
  }

  setApiStatus('sync', null);
  try {
    var res  = await fetch(ESPN_URL, {cache: 'no-store'});
    var data = await res.json();
    espnEvents = data.events || [];

    for (var round = 1; round <= 6; round++) {
      var count = GAME_COUNTS[round];
      for (var g = 1; g <= count; g++) {
        processMatchSlot('R' + round + 'G' + String(g).padStart(2, '0'), espnEvents);
      }
    }

    // Identify which scores changed since last poll
    scoreChangedSet = {};
    for (var mid2 in GAME_RESULTS) {
      if (GAME_RESULTS.hasOwnProperty(mid2) && GAME_RESULTS[mid2] && GAME_RESULTS[mid2].live && GAME_RESULTS[mid2].competitors) {
        GAME_RESULTS[mid2].competitors.forEach(function(c) {
          var key = mid2 + ':' + c.espnId;
          if (liveScoreSnapshot.hasOwnProperty(key) && liveScoreSnapshot[key] !== c.score) {
            scoreChangedSet[key] = true;
          }
        });
      }
    }

    var now = new Date();
    lastSyncTime = now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    setApiStatus('ok', lastSyncTime);
  } catch (err) {
    console.error('ESPN poll failed:', err);
    setApiStatus('err', lastSyncTime);
  }
  renderAll();
}

function startRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(poll, refreshInterval * 1000);
}

// ── buildEvByMatchId — three-pass matching ──────────────────────
// Pass 1: both teams known  →  match by both ESPN IDs
// Pass 2: one team known    →  match by single ESPN ID (other is TBD/-1)
// Pass 3: no teams known    →  match by round+region from notes headline
function buildEvByMatchId() {
  var out = {};
  var used = {};   // ESPN event.id → true

  // Pass 1 ─ both teams known
  for (var mi = 0; mi < ALL_MATCH_IDS.length; mi++) {
    var matchId = ALL_MATCH_IDS[mi];
    var expectedIds;
    if (matchId.startsWith('R1')) {
      var slugs = R1_MATCHUPS[matchId];
      if (!slugs) continue;
      var i0 = TEAM_INFO[slugs[0]] && TEAM_INFO[slugs[0]].espnId;
      var i1 = TEAM_INFO[slugs[1]] && TEAM_INFO[slugs[1]].espnId;
      if (!i0 || !i1) continue;
      expectedIds = [String(i0), String(i1)];
    } else {
      var feeders = getFeederIds(matchId);
      if (!feeders) continue;
      var r0 = GAME_RESULTS[feeders[0]];
      var r1 = GAME_RESULTS[feeders[1]];
      if (!r0 || !r0.winner || !r1 || !r1.winner) continue;
      var ei0 = TEAM_INFO[r0.winner] && TEAM_INFO[r0.winner].espnId;
      var ei1 = TEAM_INFO[r1.winner] && TEAM_INFO[r1.winner].espnId;
      if (!ei0 || !ei1) continue;
      expectedIds = [String(ei0), String(ei1)];
    }
    for (var ei = 0; ei < espnEvents.length; ei++) {
      var evA = espnEvents[ei];
      if (used[evA.id]) continue;
      var cids = evA.competitions[0].competitors.map(function(c){ return String(c.team.id); });
      if (expectedIds.every(function(id){ return cids.indexOf(id) !== -1; })) {
        out[matchId] = evA; used[evA.id] = true; break;
      }
    }
  }

  // Pass 2 ─ exactly one team known (other is TBD)
  for (var mi2 = 0; mi2 < ALL_MATCH_IDS.length; mi2++) {
    var mid2 = ALL_MATCH_IDS[mi2];
    if (out[mid2] || mid2.startsWith('R1')) continue;
    var feeders2 = getFeederIds(mid2);
    if (!feeders2) continue;
    var knownIds2 = [];
    for (var fi2 = 0; fi2 < 2; fi2++) {
      var fr2 = GAME_RESULTS[feeders2[fi2]];
      if (fr2 && fr2.winner) {
        var info2 = TEAM_INFO[fr2.winner];
        if (info2) knownIds2.push(String(info2.espnId));
      }
    }
    if (knownIds2.length !== 1) continue;
    var oneId = knownIds2[0];
    for (var ei2 = 0; ei2 < espnEvents.length; ei2++) {
      var evB = espnEvents[ei2];
      if (used[evB.id]) continue;
      var cids2 = evB.competitions[0].competitors.map(function(c){ return String(c.team.id); });
      if (cids2.indexOf(oneId) !== -1) {
        out[mid2] = evB; used[evB.id] = true; break;
      }
    }
  }

  // Pass 3 ─ no teams known: match by round+region from notes
  var unmatched3 = ALL_MATCH_IDS.filter(function(mid){ return !out[mid] && !mid.startsWith('R1'); });
  if (unmatched3.length > 0) {
    var ROUND_DIVISORS3 = [0, 8, 4, 2, 1];
    var slotsByRR = {};
    for (var ui3 = 0; ui3 < unmatched3.length; ui3++) {
      var mid3   = unmatched3[ui3];
      var rnd3   = parseInt(mid3[1], 10);
      var game3  = parseInt(mid3.substring(3), 10);
      if (rnd3 >= 5) continue;
      var regIdx = Math.ceil(game3 / ROUND_DIVISORS3[rnd3]) - 1;
      var rrKey  = rnd3 + ':' + regIdx;
      if (!slotsByRR[rrKey]) slotsByRR[rrKey] = [];
      slotsByRR[rrKey].push(mid3);
    }
    var evsByRR = {};
    for (var ei3 = 0; ei3 < espnEvents.length; ei3++) {
      var evC = espnEvents[ei3];
      if (used[evC.id]) continue;
      var st3 = evC.status && evC.status.type && evC.status.type.state;
      if (st3 !== 'pre') continue;
      var rr3 = parseNotesRound(evC);
      if (!rr3 || rr3.round === null || rr3.region === null) continue;
      var rrKey3 = rr3.round + ':' + rr3.region;
      if (!evsByRR[rrKey3]) evsByRR[rrKey3] = [];
      evsByRR[rrKey3].push(evC);
    }
    for (var rrk in slotsByRR) {
      if (!slotsByRR.hasOwnProperty(rrk)) continue;
      var slots3 = slotsByRR[rrk];
      var evs3   = evsByRR[rrk] || [];
      for (var si3 = 0; si3 < slots3.length && si3 < evs3.length; si3++) {
        out[slots3[si3]] = evs3[si3]; used[evs3[si3].id] = true;
      }
    }
  }

  return out;
}

// ── Standings ────────────────────────────────────────────────────
function computeStandings() {
  var stats = PARTICIPANTS.map(function(name) {
    var picks = PICKS[name] || {};
    var totalPts = 0, wins = 0, losses = 0;
    var roundPts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    for (var mi = 0; mi < ALL_MATCH_IDS.length; mi++) {
      var matchId = ALL_MATCH_IDS[mi];
      var result  = GAME_RESULTS[matchId];
      if (!result || !result.final) continue;
      var pick = picks[matchId];
      if (!pick) continue;
      var round = parseInt(matchId[1], 10);
      if (result.winner === pick) {
        var seed = TEAM_INFO[pick] ? TEAM_INFO[pick].seed : 0;
        var pts  = seed * ROUND_WEIGHTS[round];
        totalPts += pts; roundPts[round] += pts; wins++;
      } else { losses++; }
    }
    return {name: name, totalPts: totalPts, wins: wins, losses: losses, roundPts: roundPts};
  });

  stats.sort(function(a, b) {
    if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
    if (b.wins     !== a.wins)     return b.wins     - a.wins;
    for (var r = 6; r >= 1; r--) {
      if (b.roundPts[r] !== a.roundPts[r]) return b.roundPts[r] - a.roundPts[r];
    }
    return 0;
  });

  var rank = 1;
  for (var i = 0; i < stats.length; i++) {
    if (i > 0) {
      var prev = stats[i-1], curr = stats[i];
      var same = prev.totalPts === curr.totalPts && prev.wins === curr.wins;
      if (same) {
        for (var r2 = 6; r2 >= 1; r2--) { if (prev.roundPts[r2] !== curr.roundPts[r2]) { same = false; break; } }
      }
      if (!same) rank = i + 1;
    }
    stats[i].rank = rank;
  }
  var rankCounts = {};
  for (var j = 0; j < stats.length; j++) {
    var rk = stats[j].rank;
    rankCounts[rk] = (rankCounts[rk] || 0) + 1;
  }
  for (var k = 0; k < stats.length; k++) stats[k].tied = rankCounts[stats[k].rank] > 1;
  return stats;
}

// ── Render hub ───────────────────────────────────────────────────
function renderAll() {
  renderTicker();
  if      (activeTab === 'standings')  renderStandings();
  else if (activeTab === 'livetoday')  renderLiveToday();
  else if (activeTab === 'future')     renderFuture();
  else if (activeTab === 'pointslog')  renderPointsLog();
}

// ── Ticker ───────────────────────────────────────────────────────
function renderTicker() {
  var nameMap = buildNameMap();
  var items   = [];

  for (var mi = 0; mi < ALL_MATCH_IDS.length; mi++) {
    var matchId = ALL_MATCH_IDS[mi];
    var result  = GAME_RESULTS[matchId];
    if (!result) continue;

    if (result.live) {
      var c  = result.competitors;
      var n0 = c[0] ? (c[0].name || slugName(c[0].slug || '')) : '?';
      var n1 = c[1] ? (c[1].name || slugName(c[1].slug || '')) : '?';
      items.push(
        '<span class="ticker-item">' +
        '<span class="ticker-live-badge">LIVE</span> ' +
        n0 + ' <span class="ticker-score">' + (c[0] ? c[0].score : '0') + ' \u2014 ' + (c[1] ? c[1].score : '0') + '</span> ' + n1 +
        ' <span class="ticker-note">| ' + result.clockStr + '</span>' +
        '</span>'
      );
    } else if (result.final) {
      var winner   = result.winner;
      var teams    = getMatchTeamSlugs(matchId) || [];
      var loser    = teams.find(function(s){ return s !== winner; }) || null;
      var winInfo  = TEAM_INFO[winner];
      var loseInfo = loser ? TEAM_INFO[loser] : null;
      var winName  = (winInfo  && nameMap[winInfo.espnId])  || slugName(winner);
      var loseName = (loseInfo && nameMap[loseInfo.espnId]) || (loser ? slugName(loser) : '?');
      items.push(
        '<span class="ticker-item">' +
        winName + ' <span class="ticker-score">' + result.score + '</span> ' + loseName +
        ' <span class="ticker-note">| FINAL</span>' +
        '</span>'
      );
    }
  }

  var track = document.getElementById('ticker-track');
  if (items.length === 0) {
    track.innerHTML = '<span class="ticker-item">Waiting for game results\u2026</span>';
    track.style.animationDuration = '0s';
    return;
  }
  var content = items.join('');
  track.innerHTML = content + content;
  track.style.animationDuration = Math.max(20, items.length * 230 / 80) + 's';
}

// ── Standings ────────────────────────────────────────────────────
function finalistCell(slug, nameMap) {
  if (!slug) return '<span style="color:var(--muted2)">\u2014</span>';
  var info  = TEAM_INFO[slug];
  var name  = (info && nameMap[info.espnId]) || slugName(slug);
  var alive = isTeamAlive(slug);
  var cls   = alive ? 'alive' : 'out';
  return '<div class="finalist-cell ' + cls + '">' +
    slugLogo(slug, 22) + ' <span>' + name + '</span>' +
    ' <span class="finalist-badge ' + cls + '">' + (alive ? 'ALIVE' : 'OUT') + '</span>' +
    '</div>';
}

function renderStandings() {
  var standings = computeStandings();
  var nameMap   = buildNameMap();

  var html = '<div style="overflow-x:auto"><table class="standings-table"><thead><tr>' +
    '<th style="text-align:center">#</th>' +
    '<th>Participant</th>' +
    '<th class="right">Points</th>' +
    '<th>W\u2013L</th>' +
    '<th class="col-runnerup">Runner-Up Pick</th>' +
    '<th>Champion Pick</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < standings.length; i++) {
    var s       = standings[i];
    var picks   = PICKS[s.name] || {};
    var champPick = picks['R6G01'] || '';
    var ff1       = picks['R5G01'] || '';
    var ff2       = picks['R5G02'] || '';
    var runnerUp  = (ff1 === champPick) ? ff2 : ff1;
    var isYou     = s.name === selectedParticipant;
    var rankStr   = s.tied ? 'T' + s.rank : String(s.rank);
    var rankCls   = 'rank-cell' + (s.rank === 1 ? ' rank-1' : s.rank === 2 ? ' rank-2' : s.rank === 3 ? ' rank-3' : '');

    html += '<tr class="' + (isYou ? 'you-row' : '') + '">';
    html += '<td class="' + rankCls + '">' + rankStr + '</td>';
    html += '<td class="name-cell">' + s.name + (isYou ? '<span class="you-badge">YOU</span>' : '') + '</td>';
    html += '<td class="pts-cell">' + s.totalPts + '</td>';
    html += '<td class="wl-cell">' + s.wins + '\u2013' + s.losses + '</td>';
    html += '<td class="col-runnerup">' + finalistCell(runnerUp, nameMap) + '</td>';
    html += '<td>' + finalistCell(champPick, nameMap) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  document.getElementById('tab-standings').innerHTML = html;
}

// ── Live & Today ─────────────────────────────────────────────────
function renderLiveToday() {
  var picks  = selectedParticipant ? (PICKS[selectedParticipant] || {}) : null;
  var evMap  = buildEvByMatchId();

  var inProgress = [], upNext = [], completedToday = [];

  for (var matchId in evMap) {
    if (!evMap.hasOwnProperty(matchId)) continue;
    var ev    = evMap[matchId];
    var state = ev.status && ev.status.type && ev.status.type.state;
    if      (state === 'in')                         inProgress.push({matchId: matchId, ev: ev});
    else if (state === 'pre'  && isGameToday(ev))    upNext.push({matchId: matchId, ev: ev});
    else if (state === 'post' && isGameToday(ev))    completedToday.push({matchId: matchId, ev: ev});
  }

  // Sort all three buckets chronologically
  function byDate(a, b) { return new Date(a.ev.date || 0) - new Date(b.ev.date || 0); }
  inProgress.sort(byDate);
  upNext.sort(byDate);
  completedToday.sort(byDate);

  var html = '';

  // In Progress — only show LIVE badge when games are actually live
  html += '<div class="section-block">';
  html += '<div class="section-hdr"><h2>In Progress</h2>' +
    (inProgress.length > 0 ? '<span class="live-badge">LIVE</span>' : '') + '</div>';
  if (inProgress.length === 0) {
    html += '<div class="empty-state">No games currently in progress</div>';
  } else {
    html += '<div class="card-grid">';
    for (var li = 0; li < inProgress.length; li++) html += buildLiveCard(inProgress[li].matchId, inProgress[li].ev, picks);
    html += '</div>';
  }
  html += '</div>';

  // Up Next Today
  html += '<div class="section-block">';
  html += '<div class="section-hdr"><h2>Up Next Today</h2></div>';
  if (upNext.length === 0) {
    html += '<div class="empty-state">No more games scheduled today</div>';
  } else {
    html += '<div class="card-grid sm">';
    for (var ui = 0; ui < upNext.length; ui++) html += buildUpcomingCard(upNext[ui].matchId, upNext[ui].ev, picks);
    html += '</div>';
  }
  html += '</div>';

  // Completed Today
  html += '<div class="section-block">';
  html += '<div class="section-hdr"><h2>Completed Today</h2><span class="final-badge">FINAL</span></div>';
  if (completedToday.length === 0) {
    html += '<div class="empty-state">No completed games yet today</div>';
  } else {
    html += '<div class="card-grid">';
    for (var ci = 0; ci < completedToday.length; ci++) html += buildCompletedCard(completedToday[ci].matchId, completedToday[ci].ev, picks);
    html += '</div>';
  }
  html += '</div>';

  document.getElementById('tab-livetoday').innerHTML = html;
}

function buildLiveCard(matchId, ev, picks) {
  var comps   = ev.competitions[0].competitors;
  var period  = (ev.status && ev.status.period) || 1;
  var typeName = ev.status && ev.status.type && ev.status.type.name;
  var clock   = (ev.status && ev.status.displayClock) || '';
  var network = evNetwork(ev);
  var pick    = picks ? picks[matchId] : null;
  var round   = parseInt(matchId[1], 10);
  var weight  = ROUND_WEIGHTS[round];

  var clockDisplay = typeName === 'STATUS_HALFTIME'
    ? 'Halftime'
    : (clock + ' ' + periodLabel(period));

  var scores  = comps.map(function(c){ return parseInt(c.score || 0, 10); });
  var leadIdx = scores[0] >= scores[1] ? 0 : 1;

  var html = '<div class="game-card live-card">';
  html += '<div class="card-top"><span class="card-clock">' + clockDisplay + '</span>' +
          '<span>' + networkBadge(network) + '</span></div>';

  var pickFoundInGame = false;
  for (var i = 0; i < 2 && i < comps.length; i++) {
    var c         = comps[i];
    var slug      = ESPN_TO_SLUG[String(c.team.id)] || null;
    var seed      = slug && TEAM_INFO[slug] ? TEAM_INFO[slug].seed : null;
    var name      = c.team.displayName || c.team.name || (slug ? slugName(slug) : 'TBD');
    var lead      = i === leadIdx;
    var isMyPick  = pick && slug === pick;
    if (isMyPick) pickFoundInGame = true;
    var pickAlive = isMyPick ? isTeamAlive(slug) : false;
    var potPts    = isMyPick && seed && pickAlive ? seed * weight : null;
    var pickTag;
    if (isMyPick) {
      if (!pickAlive) {
        pickTag = ' <span class="pick-tag losing">YOUR PICK \xb7 0pt \u2717 out</span>';
      } else if (lead) {
        pickTag = ' <span class="pick-tag winning">YOUR PICK' + (potPts ? ' \xb7 ' + potPts + 'pt' : '') + '</span>';
      } else {
        pickTag = ' <span class="pick-tag losing">YOUR PICK' + (potPts ? ' \xb7 ' + potPts + 'pt' : '') + '</span>';
      }
    } else {
      pickTag = '';
    }
    // Score flip animation: only animate if score changed since last poll
    var scoreKey     = matchId + ':' + String(c.team.id);
    var scoreChanged = scoreChangedSet.hasOwnProperty(scoreKey) && scoreChangedSet[scoreKey];
    html += '<div class="team-row">';
    html += '<span>' + (slug ? slugLogo(slug, 28) : '') + '</span>';
    if (seed !== null) html += '<span class="seed-chip">' + seed + '</span>';
    html += '<span class="team-name ' + (lead ? 'leading' : 'trailing') + '">' + name + pickTag + '</span>';
    html += '<span class="team-score ' + (lead ? 'leading' : 'trailing') + (scoreChanged ? ' score-changed' : '') + '">' + (c.score || '0') + '</span>';
    html += '</div>';
  }

  // If participant had a pick for this game but their team didn't advance to it
  if (pick && !pickFoundInGame) {
    var pInfo = TEAM_INFO[pick];
    html += '<div class="busted-pick-row">' +
      slugLogo(pick, 18) + ' <span class="seed-chip">' + (pInfo ? pInfo.seed : '?') + '</span>' +
      ' ' + slugName(pick) +
      ' <span class="pick-tag losing">DID NOT ADVANCE</span>' +
      '</div>';
  }

  html += '</div>';
  return html;
}

function buildUpcomingCard(matchId, ev, picks) {
  var comps     = ev.competitions[0].competitors;
  var timeValid = ev.competitions[0].timeValid !== false;
  var dateStr   = ev.date || '';
  var timeStr   = (timeValid && dateStr) ? fmtTime(dateStr, selectedTZ) : 'TBD';
  var network   = evNetwork(ev);
  var pick      = picks ? picks[matchId] : null;
  var round     = parseInt(matchId[1], 10);
  var weight    = ROUND_WEIGHTS[round];

  var html = '<div class="game-card">';
  html += '<div class="card-top">' +
          '<span class="card-clock" style="color:var(--pending)">' + timeStr + '</span>' +
          '<span>' + networkBadge(network) + '</span></div>';

  // Find known slug to determine TBD feeder slots
  var knownSlugU = null;
  for (var cp2 = 0; cp2 < comps.length; cp2++) {
    var ptid2 = String(comps[cp2].team.id);
    if (parseInt(ptid2, 10) > 0) { knownSlugU = ESPN_TO_SLUG[ptid2] || null; break; }
  }
  var tbdCountU = 0;

  var pickFoundInGame = false;
  for (var i = 0; i < 2 && i < comps.length; i++) {
    var c      = comps[i];
    var teamId = String(c.team.id);
    var isTBD  = parseInt(teamId, 10) < 0;
    var slug   = isTBD ? null : (ESPN_TO_SLUG[teamId] || null);
    var seed   = slug && TEAM_INFO[slug] ? TEAM_INFO[slug].seed : null;
    var name;
    if (isTBD) {
      var tbdSlotU = knownSlugU ? getTbdFeederSlot(matchId, knownSlugU) : tbdCountU;
      tbdCountU++;
      name = tbdLabel(matchId, tbdSlotU);
    } else {
      name = c.team.displayName || c.team.name || (slug ? slugName(slug) : '?');
    }
    var isMyPick  = !isTBD && pick && slug === pick;
    if (isMyPick) pickFoundInGame = true;
    var pickAlive = isMyPick ? isTeamAlive(slug) : false;
    var potPts    = isMyPick && seed && pickAlive ? seed * weight : null;
    var pickTag;
    if (isMyPick) {
      if (!pickAlive) {
        pickTag = ' <span class="pick-tag losing">YOUR PICK \xb7 0pt \u2717 out</span>';
      } else {
        pickTag = ' <span class="pick-tag neutral">YOUR PICK' + (potPts ? ' \xb7 ' + potPts + 'pt' : '') + '</span>';
      }
    } else {
      pickTag = '';
    }
    html += '<div class="team-row">';
    html += '<span>' + (slug ? slugLogo(slug, 28) : '') + '</span>';
    if (seed !== null) html += '<span class="seed-chip">' + seed + '</span>';
    html += '<span class="team-name' + (isTBD ? '" style="color:var(--muted);font-style:italic;font-size:13px"' : '"') + '>' + name + '</span>';
    html += pickTag;
    html += '</div>';
  }

  if (pick && !pickFoundInGame) {
    var pInfo = TEAM_INFO[pick];
    html += '<div class="busted-pick-row">' +
      slugLogo(pick, 18) + ' <span class="seed-chip">' + (pInfo ? pInfo.seed : '?') + '</span>' +
      ' ' + slugName(pick) +
      ' <span class="pick-tag losing">DID NOT ADVANCE</span>' +
      '</div>';
  }

  html += '</div>';
  return html;
}

function buildCompletedCard(matchId, ev, picks) {
  var comps  = ev.competitions[0].competitors;
  var pick   = picks ? picks[matchId] : null;
  var round  = parseInt(matchId[1], 10);
  var weight = ROUND_WEIGHTS[round];

  var winnerComp = comps.find(function(c){ return c.winner; });
  if (!winnerComp) {
    winnerComp = comps.reduce(function(a,b){ return parseInt(a.score||0,10) > parseInt(b.score||0,10) ? a : b; });
  }
  var loserComp = comps.find(function(c){ return c !== winnerComp; });

  var html = '<div class="game-card">';
  html += '<div class="card-top"><span>' + getRoundRegionLabel(matchId) + '</span>' +
          '<span style="color:var(--muted);font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em">FINAL</span></div>';

  var ordered = [winnerComp, loserComp].filter(Boolean);
  for (var i = 0; i < ordered.length; i++) {
    var c      = ordered[i];
    var isWin  = i === 0;
    var slug   = ESPN_TO_SLUG[String(c.team.id)] || null;
    var seed   = slug && TEAM_INFO[slug] ? TEAM_INFO[slug].seed : null;
    var name   = c.team.displayName || c.team.name || (slug ? slugName(slug) : 'TBD');
    var pickTag = '';
    if (pick && slug) {
      if (slug === pick && isWin) {
        var pts = seed ? seed * weight : 0;
        pickTag = ' <span class="pick-tag winning">\u2714 YOUR PICK +' + pts + 'pts</span>';
      } else if (slug === pick && !isWin) {
        pickTag = ' <span class="pick-tag losing">\u2718 YOUR PICK</span>';
      }
    }
    html += '<div class="team-row ' + (isWin ? 'winner' : 'loser') + '">';
    html += '<span>' + (slug ? slugLogo(slug, 28) : '') + '</span>';
    if (seed !== null) html += '<span class="seed-chip">' + seed + '</span>';
    html += '<span class="team-name ' + (isWin ? 'leading' : 'trailing') + '">' + name + pickTag + '</span>';
    html += '<span class="team-score ' + (isWin ? 'leading' : 'trailing') + '">' + (c.score || '0') + '</span>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ── Future ───────────────────────────────────────────────────────
function renderFuture() {
  var picks  = selectedParticipant ? (PICKS[selectedParticipant] || {}) : null;
  var evMap  = buildEvByMatchId();
  var future = [];

  for (var matchId in evMap) {
    if (!evMap.hasOwnProperty(matchId)) continue;
    var ev    = evMap[matchId];
    var state = ev.status && ev.status.type && ev.status.type.state;
    if (state === 'pre' && !isGameToday(ev)) {
      future.push({matchId: matchId, ev: ev, dateStr: ev.date || ''});
    }
  }

  if (future.length === 0) {
    document.getElementById('tab-future').innerHTML =
      '<div class="empty-state">No future games scheduled yet \u2014 check back soon</div>';
    return;
  }

  future.sort(function(a, b){ return new Date(a.dateStr) - new Date(b.dateStr); });

  // Group by date. For timeValid=false games use ET for bucketing (placeholder is midnight ET).
  var dateGroups = {}, dateKeys = [];
  for (var fi = 0; fi < future.length; fi++) {
    var item      = future[fi];
    var timeValid = item.ev.competitions[0].timeValid !== false;
    var bucketTZ  = timeValid ? selectedTZ : 'Eastern';
    var dk        = fmtDateKey(item.dateStr, bucketTZ);
    if (!dateGroups[dk]) {
      dateGroups[dk] = {label: fmtDate(item.dateStr, bucketTZ), items: []};
      dateKeys.push(dk);
    }
    dateGroups[dk].items.push(item);
  }
  dateKeys.sort();

  var html = '<div style="overflow-x:auto"><table class="future-table"><thead><tr>' +
    '<th>Date &amp; Time</th><th>Matchup</th><th>Network</th><th>Your Pick</th><th class="right">Pot. Pts</th>' +
    '</tr></thead><tbody>';

  for (var di = 0; di < dateKeys.length; di++) {
    var dk2   = dateKeys[di];
    var group = dateGroups[dk2];
    html += '<tr class="date-hdr"><td colspan="5">' + group.label + '</td></tr>';

    for (var gi = 0; gi < group.items.length; gi++) {
      var gItem     = group.items[gi];
      var comps     = gItem.ev.competitions[0].competitors;
      var timeValidG = gItem.ev.competitions[0].timeValid !== false;
      var timeStr   = (timeValidG && gItem.dateStr) ? fmtTime(gItem.dateStr, selectedTZ) : 'TBD';
      var network   = evNetwork(gItem.ev);
      var pick      = picks ? picks[gItem.matchId] : null;
      var futRound  = parseInt(gItem.matchId[1], 10);
      var futWeight = ROUND_WEIGHTS[futRound];
      var pickSeedF = pick && TEAM_INFO[pick] ? TEAM_INFO[pick].seed : null;
      var pickAlive = pick ? isTeamAlive(pick) : false;
      var potPts;
      if (!pick || pickSeedF === null) {
        potPts = '<span style="color:var(--muted2)">\u2014</span>';
      } else if (!pickAlive) {
        potPts = '<span style="color:var(--loss);font-family:\'DM Mono\',monospace;font-weight:700" title="' + slugName(pick) + ' already eliminated">0 <span style="font-size:10px;font-weight:400">\u2717 out</span></span>';
      } else {
        potPts = '<span style="color:var(--win)">' + (pickSeedF * futWeight) + '</span>';
      }

      html += '<tr class="' + (pick ? 'has-pick' : '') + '">';
      html += '<td><span style="font-family:\'DM Mono\',monospace;font-size:12px">' + timeStr + '</span></td>';

      // Find known slug to determine TBD feeder slot assignment
      var knownSlugF = null;
      for (var cp = 0; cp < comps.length; cp++) {
        var ptid = String(comps[cp].team.id);
        if (parseInt(ptid, 10) > 0) { knownSlugF = ESPN_TO_SLUG[ptid] || null; break; }
      }
      var tbdCountF = 0;
      html += '<td><div class="matchup-stack">';
      for (var ci2 = 0; ci2 < 2 && ci2 < comps.length; ci2++) {
        var c2    = comps[ci2];
        var tid   = String(c2.team.id);
        var isTBD = parseInt(tid, 10) < 0;
        var slug2 = isTBD ? null : (ESPN_TO_SLUG[tid] || null);
        var seed2 = slug2 && TEAM_INFO[slug2] ? TEAM_INFO[slug2].seed : null;
        var rowContent;
        if (isTBD) {
          var tbdSlotF = knownSlugF ? getTbdFeederSlot(gItem.matchId, knownSlugF) : tbdCountF;
          tbdCountF++;
          rowContent = tbdLabel(gItem.matchId, tbdSlotF);
        } else {
          var tName = c2.team.displayName || c2.team.name || (slug2 ? slugName(slug2) : '?');
          rowContent = (slug2 ? slugLogo(slug2, 20) : '') +
            (seed2 !== null ? ' <span class="seed-chip">' + seed2 + '</span>' : '') +
            ' ' + tName;
        }
        html += '<div class="matchup-row' + (ci2 === 1 ? ' matchup-row-2' : '') + '">' + rowContent + '</div>';
      }
      html += '</div></td>';

      html += '<td>' + networkBadge(network) + '</td>';
      html += '<td>' + (pick ? '<span class="future-pick ' + (pickAlive ? '' : 'busted') + '">' + slugName(pick) + '</span>' : '<span style="color:var(--muted2)">\u2014</span>') + '</td>';
      html += '<td class="future-pts">' + potPts + '</td>';
      html += '</tr>';
    }
  }

  html += '</tbody></table></div>';
  document.getElementById('tab-future').innerHTML = html;
}

// ── Points Log ───────────────────────────────────────────────────
function renderPointsLog() {
  var panel = document.getElementById('tab-pointslog');
  if (!selectedParticipant) {
    panel.innerHTML = '<div class="no-participant">Select a participant from the dropdown above to view their points log.</div>';
    return;
  }

  var picks   = PICKS[selectedParticipant] || {};
  var nameMap = buildNameMap();
  var evMap   = buildEvByMatchId();
  var rows    = [];

  for (var mi = 0; mi < ALL_MATCH_IDS.length; mi++) {
    var matchId = ALL_MATCH_IDS[mi];
    var result  = GAME_RESULTS[matchId];
    if (!result || !result.final) continue;
    var pick = picks[matchId];
    if (!pick) continue;
    var round   = parseInt(matchId[1], 10);
    var correct = result.winner === pick;
    var seed    = TEAM_INFO[pick] ? TEAM_INFO[pick].seed : 0;
    var pts     = correct ? seed * ROUND_WEIGHTS[round] : 0;
    var ev      = evMap[matchId];
    rows.push({matchId: matchId, result: result, pick: pick, correct: correct, pts: pts, round: round,
               eventDate: ev ? (ev.date || '') : ''});
  }

  // Sort chronologically (rounds never interleave, so this just orders within each round by tip time)
  rows.sort(function(a, b) {
    if (a.round !== b.round) return a.round - b.round;
    return new Date(a.eventDate) - new Date(b.eventDate);
  });

  // Recompute running total after sort
  var running = 0;
  for (var rr = 0; rr < rows.length; rr++) {
    running += rows[rr].pts;
    rows[rr].running = running;
  }

  var totalPts = running;
  var wins     = rows.filter(function(r){ return r.correct; }).length;
  var losses   = rows.length - wins;

  var html = '<div class="summary-bar">';
  html += '<div><span class="stat-val gold">' + totalPts + '</span><span class="stat-lbl">Total Points</span></div>';
  html += '<div><span class="stat-val green">' + wins + '</span><span class="stat-lbl">Correct Picks</span></div>';
  html += '<div><span class="stat-val red">' + losses + '</span><span class="stat-lbl">Missed Picks</span></div>';
  html += '<div class="summary-note" style="padding-bottom:6px">Points = Seed \xd7 Round Weight</div>';
  html += '</div>';

  if (rows.length === 0) {
    html += '<div class="empty-state">No completed games yet \u2014 check back soon!</div>';
    panel.innerHTML = html;
    return;
  }

  html += '<div style="overflow-x:auto"><table class="plog-table"><thead><tr>' +
    '<th>Round</th><th>Game</th><th>Their Pick</th><th>Result</th><th>Score</th><th>Pts Earned</th><th class="right">Running Total</th>' +
    '</tr></thead><tbody>';

  var lastRound = -1;
  var ROUND_SECTION_NAMES = {1:'Round 1', 2:'Round 2', 3:'Sweet 16', 4:'Elite 8', 5:'Final Four', 6:'Championship'};
  for (var ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    if (row.round !== lastRound) {
      lastRound = row.round;
      html += '<tr class="plog-round-hdr"><td colspan="7">' + (ROUND_SECTION_NAMES[row.round] || ('Round ' + row.round)) + '</td></tr>';
    }
    var roundLbl = getRoundRegionLabel(row.matchId);
    var winSlug  = row.result.winner;
    var teams    = getMatchTeamSlugs(row.matchId) || [];
    var loseSlug = teams.find(function(s){ return s !== winSlug; }) || null;
    var winInfo  = TEAM_INFO[winSlug];
    var loseInfo = loseSlug ? TEAM_INFO[loseSlug] : null;
    var pickInfo = TEAM_INFO[row.pick];
    var winName  = (winInfo  && nameMap[winInfo.espnId])  || slugName(winSlug);
    var loseName = (loseInfo && nameMap[loseInfo.espnId]) || (loseSlug ? slugName(loseSlug) : '?');
    var pickName = (pickInfo && nameMap[pickInfo.espnId]) || slugName(row.pick);
    var winSeed  = winInfo  ? winInfo.seed  : '?';
    var loseSeed = loseInfo ? loseInfo.seed : '?';
    var pickSeed = pickInfo ? pickInfo.seed : '?';
    var weight   = ROUND_WEIGHTS[row.round];
    var ptsStr   = row.correct ? '+' + row.pts + ' pts' : '0';
    var ptsSub   = row.correct ? (pickSeed + ' seed \xd7 ' + weight + ' wt') : '';

    html += '<tr>';
    html += '<td><span class="round-lbl">' + roundLbl + '</span></td>';
    html += '<td>';
    html += '<div style="padding:2px 0">' + slugLogo(winSlug, 18) + ' <span class="seed-chip">' + winSeed + '</span> ' + winName +
            ' <span style="color:var(--muted);font-size:10px;font-family:\'Barlow Condensed\',sans-serif;font-weight:700">W</span></div>';
    if (loseSlug) html += '<div style="opacity:.5;padding:2px 0">' + slugLogo(loseSlug, 18) + ' <span class="seed-chip">' + loseSeed + '</span> ' + loseName + '</div>';
    html += '</td>';
    html += '<td>' + slugLogo(row.pick, 18) + ' <span class="seed-chip">' + pickSeed + '</span> ' + pickName + '</td>';
    html += '<td><span class="result-badge ' + (row.correct ? 'correct' : 'wrong') + '">' + (row.correct ? '\u2714 Correct' : '\u2718 Wrong') + '</span></td>';
    html += '<td><span style="font-family:\'DM Mono\',monospace;font-size:12px">' + row.result.score + '</span></td>';
    html += '<td><span class="pts-earned ' + (row.correct ? 'correct' : 'wrong') + '">' + ptsStr + '</span>';
    if (ptsSub) html += '<br><span class="pts-sub">' + ptsSub + '</span>';
    html += '</td>';
    html += '<td class="right"><span class="running-total">' + row.running + '</span></td>';
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  panel.innerHTML = html;
}

// ── UI Setup ─────────────────────────────────────────────────────
function setupDropdown() {
  var sel    = document.getElementById('participant-select');
  var sorted = PARTICIPANTS.slice().sort();
  for (var i = 0; i < sorted.length; i++) {
    var opt = document.createElement('option');
    opt.value = sorted[i]; opt.textContent = sorted[i];
    sel.appendChild(opt);
  }
  sel.addEventListener('change', function() {
    selectedParticipant = sel.value;
    var url = new URL(window.location.href);
    if (selectedParticipant) url.searchParams.set('p', selectedParticipant.toLowerCase());
    else url.searchParams.delete('p');
    history.replaceState(null, '', url.toString());
    renderAll();
  });
}

function setupTabs() {
  var buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab-' + activeTab).classList.add('active');
      renderAll();
    });
  });
}

function setupShareBtn() {
  var btn = document.getElementById('share-btn');
  btn.addEventListener('click', function() {
    var url = new URL(window.location.href);
    if (selectedParticipant) url.searchParams.set('p', selectedParticipant.toLowerCase());
    navigator.clipboard.writeText(url.toString()).catch(function(){});
    var orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function(){ btn.textContent = orig; }, 2000);
  });
}

function setupTzSelect() {
  var sel = document.getElementById('tz-select');
  sel.addEventListener('change', function() {
    selectedTZ = sel.value;
    var url = new URL(window.location.href);
    url.searchParams.set('tz', selectedTZ);
    history.replaceState(null, '', url.toString());
    renderAll();
  });
}

function setupRefreshSelect() {
  var sel = document.getElementById('refresh-select');
  sel.addEventListener('change', function() {
    refreshInterval = parseInt(sel.value, 10);
    var url = new URL(window.location.href);
    url.searchParams.set('ri', String(refreshInterval));
    history.replaceState(null, '', url.toString());
    startRefreshTimer();
  });
}

function initFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var p  = params.get('p');
  var tz = params.get('tz');
  var ri = params.get('ri');

  if (tz && TIMEZONES[tz]) {
    selectedTZ = tz;
    document.getElementById('tz-select').value = tz;
  } else {
    // Auto-detect from browser locale — only on first visit (no ?tz= param)
    var detected = detectTZ();
    if (detected) {
      selectedTZ = detected;
      document.getElementById('tz-select').value = detected;
    }
  }

  if (ri) {
    var riVal = parseInt(ri, 10);
    if ([15, 30, 60, 300].indexOf(riVal) !== -1) {
      refreshInterval = riVal;
      document.getElementById('refresh-select').value = String(riVal);
    }
  }

  if (p) {
    var match = PARTICIPANTS.find(function(n){ return n.toLowerCase() === p.toLowerCase(); });
    if (match) {
      selectedParticipant = match;
      document.getElementById('participant-select').value = match;
    }
  }
}

// ── Init ─────────────────────────────────────────────────────────
setupDropdown();
setupTabs();
setupShareBtn();
setupTzSelect();
setupRefreshSelect();
initFromUrl();

poll();
startRefreshTimer();
