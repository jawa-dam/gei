/* ============================================================
   GEI DAM ACADEMY — SECURE ECONOMY BACKEND (Google Apps Script)
   ------------------------------------------------------------
   Paste this ENTIRE file into script.google.com (one project,
   one file) — see README-DEPLOY-GOOGLE.md for the 5-minute
   setup. Security model = Master Prompt §19–20: server-graded
   XP, server-verified purchases, Stripe webhooks only.
   ============================================================ */

/* ================= EDIT THESE (only when needed) =================
   SESSION_SECRET        : long random string (any 32+ chars)
   STRIPE_SECRET_KEY     : sk_test_…  (Test Mode) → sk_live_… (Live)
   STRIPE_WEBHOOK_SECRET : whsec_…    (Stripe → Developers → Webhooks)
   Leave the Stripe values empty to run without real money —
   the game then has no "Earn XP" section (never faked).

   SESSION_SECRET is already set for you. You may regenerate it
   (any long random string) — existing profiles on this backend
   will simply get a fresh login token on next visit. */
var SESSION_SECRET = 'aZkghpF2dkO5uAFJ5tQIKpNSPzngRcaXB05zP3wD0GrbyxBbWGUa6h8yRseq';
var STRIPE_SECRET_KEY = '';
var STRIPE_WEBHOOK_SECRET = '';
var APP_ORIGIN = 'https://jawa-dam.github.io';
/* ================================================================== */

/* ---------- spreadsheet storage (auto-created on first use) ---------- */
var SS_NAME = 'GEI DAM ACADEMY — Economy DB';
var SHEET_HEADERS = {
  profiles: ['profile_id', 'device_id', 'name', 'created_at'],
  ledger: ['profile_id', 'kind', 'amount', 'ref_id', 'client_tx', 'created_at'],
  purchases: ['id', 'profile_id', 'item_id', 'cost', 'xp_before', 'xp_after', 'client_tx', 'created_at'],
  entitlements: ['profile_id', 'item_id', 'source', 'purchase_id', 'created_at'],
  equips: ['profile_id', 'skin_id'],
  prices: ['pack_id', 'stripe_price_id']
};

function getSS_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('DB_SS_ID');
  if (!id) {
    var ss = SpreadsheetApp.create(SS_NAME);
    id = ss.getId();
    props.setProperty('DB_SS_ID', id);
  }
  var ss = SpreadsheetApp.openById(id);
  for (var name in SHEET_HEADERS) ensureSheet_(ss, name);
  return ss;
}
function ensureSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() < 1) sh.appendRow(SHEET_HEADERS[name]);
  return sh;
}
function sheetRows_(ss, name) {
  var sh = ss.getSheetByName(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = SHEET_HEADERS[name];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) row[headers[j]] = values[i][j];
    out.push(row);
  }
  return out;
}
function rowValues_(name, row) {
  return SHEET_HEADERS[name].map(function (h) {
    var v = row[h];
    return (v === undefined || v === null) ? '' : v;
  });
}
function sheetAppend_(ss, name, row) {
  ss.getSheetByName(name).appendRow(rowValues_(name, row));
}
function sheetReplace_(ss, name, idField, id, row) {
  var sh = ss.getSheetByName(name);
  var idx = SHEET_HEADERS[name].indexOf(idField);
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idx]) === String(id)) {
      sh.getRange(i + 1, 1, 1, SHEET_HEADERS[name].length).setValues([rowValues_(name, row)]);
      return;
    }
  }
  sh.appendRow(rowValues_(name, row));
}
function cacheGet_(key) {
  return CacheService.getScriptCache().get(key);
}
function cacheSet_(key, val, ttlSec) {
  CacheService.getScriptCache().put(key, val, ttlSec);
}
var sheetStorage_ = {
  lock: function (fn) {
    return LockService.getScriptLock().withLock(fn);
  },
  rows: function (name) { return sheetRows_(getSS_(), name); },
  appendRow: function (name, row) { sheetAppend_(getSS_(), name, row); },
  replaceRow: function (name, idField, id, row) { sheetReplace_(getSS_(), name, idField, id, row); },
  cacheGet: cacheGet_,
  cacheSet: cacheSet_
};

/* ---------- crypto / stripe ---------- */
function hmacHex_(secret, data) {
  var b64 = Utilities.computeHmacSha256Signature(secret, data);
  var bytes = Utilities.base64Decode(b64);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) hex += ('0' + (bytes[i] & 0xff).toString(16)).slice(-2);
  return hex;
}
function randomId_(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}
function stripeFetch_(path, fields) {
  var body = Object.keys(fields).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(fields[k]);
  }).join('&');
  var res = UrlFetchApp.fetch('https://api.stripe.com/v1' + path, {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    payload: body,
    muteHttpExceptions: true
  });
  var data = null;
  try { data = JSON.parse(res.getContentText()); } catch (e) {}
  return Promise.resolve({ status: Number(res.getResponseCode()), data: data });
}
function coreFactory_() {
  return makeCore({
    secrets: { session: SESSION_SECRET, stripeKey: STRIPE_SECRET_KEY, stripeWebhook: STRIPE_WEBHOOK_SECRET },
    origin: APP_ORIGIN,
    hmacHex: hmacHex_,
    randomId: randomId_,
    now: function () { return Date.now(); },
    stripeFetch: stripeFetch_,
    storage: sheetStorage_
  });
}

/* ---------- web app routing (?api=<endpoint>) ---------- */
function handleReq_(method, e) {
  e = e || {};
  var params = e.parameter || {};
  var api = params.api || '';
  var token = params.token || '';
  var raw = '';
  var body = null;
  if (method === 'POST' && e.postData && e.postData.contents) {
    raw = e.postData.contents;
    try { body = JSON.parse(raw); } catch (err) { body = null; }
  }
  var core = coreFactory_();
  return core.route(api, { method: method, token: token, body: body, raw: raw, headers: e.headers || {} })
    .then(function (res) {
      return ContentService.createTextOutput(JSON.stringify(res.data))
        .setMimeType(ContentService.MimeType.JSON);
    });
}
function doGet(e) { return handleReq_('GET', e); }
function doPost(e) { return handleReq_('POST', e); }

/* ============================================================
   SECURE ECONOMY CORE (do not edit below this line)
   ============================================================ */
/* ============================================================
   GEI DAM ACADEMY — SECURE ECONOMY CORE (storage-agnostic)
   ------------------------------------------------------------
   The security logic shared by every backend deployment
   (Google Apps Script, Cloudflare, tests). Mirrors the
   Cloudflare worker's rules exactly (Master Prompt §19–20):

     · XP is credited ONLY server-side:
         1. server-graded correct answers (+25, at most once per
            level+mission — max 900 for the full 6x6),
         2. a one-time first-snapshot seed at profile creation,
         3. Stripe webhooks with VERIFIED SIGNATURES (packs).
     · No client path can create an entitlement or credit
       purchase XP; checkout is refused when unconfigured.
     · Purchases: balance check + one item per profile +
       purchase ID + entitlement, all inside a storage lock.

   `makeCore(deps)` returns { route(api, req) } where req =
   { token, body, raw, headers }. deps = {
     hmacHex(secret,data), randomId(prefix), now(),
     stripeFetch(url, formFields) -> Promise<{status,data}>,
     storage: {
       lock(fn),                       // serialize critical sections
       rows(sheet) -> [rowObj],        // all rows of a sheet
       appendRow(sheet, rowObj),
       replaceRow(sheet, idField, id, rowObj),
       cacheGet(key), cacheSet(key, val, ttlSec)
     }
   }
   ============================================================ */

const ITEM_CATALOG = {
  video: "A'Dam Video Vault",
  mountain: 'Mountain Skin',
  hotpink: 'Hot Pink Skin',
  babyblue: 'Baby Blue Skin',
  academic: 'Academic Skin',
  blueprint: 'Blueprint Skin',
  obsidian: 'Obsidian Premium'
};
const ITEM_COST = 900;
const XP_PER_ANSWER = 25;
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;
const STRIPE_TOLERANCE_MS = 300000;
const RL_WINDOW_MS = 60000;
const RL_MAX = 120;

/* PRICING IS A BUSINESS DECISION — Wilbert edits here. */
const PACKS = [
  { id: 'pack-900',  name: 'Trail Pass',  xp: 900,  cents: 299, currency: 'usd',
    desc: "One full Vault item's worth of XP." },
  { id: 'pack-1800', name: 'Ridge Pass',  xp: 1800, cents: 499, currency: 'usd',
    desc: 'Two items — better value per XP.' },
  { id: 'pack-2700', name: 'Summit Pass', xp: 2700, cents: 699, currency: 'usd',
    desc: 'Three items — the full Vault in one pass.' }
];

/* Canonical 36-question bank (injected at build time). */
const BANK = {
 "version": 1,
 "xpPerCorrect": 25,
 "levels": {
  "1": [
   {
    "title": "Darkness & the Deep",
    "lesson": "The first scene in the GEI model is deep, dark water waiting for control.",
    "question": "In GEI, what does the darkness over the deep represent?",
    "options": [
     "Deep, unmanaged water",
     "Dry, empty land",
     "The mill wheel"
    ],
    "correctIndex": 0,
    "explanation": "Darkness is the deep water waiting for control."
   },
   {
    "title": "Face of the Deep",
    "lesson": "The face of the deep is the water side of the system.",
    "question": "Where does the face of the deep point?",
    "options": [
     "The reservoir side",
     "Downstream fields",
     "The mountain peak"
    ],
    "correctIndex": 0,
    "explanation": "The deep faces the reservoir side."
   },
   {
    "title": "Let There Be Light",
    "lesson": "In the engineering reading, light represents controlled release.",
    "question": "In GEI, let there be light represents…",
    "options": [
     "Water released under control",
     "A stone wall forming",
     "A wheel stopping"
    ],
    "correctIndex": 0,
    "explanation": "Light is the first controlled release."
   },
   {
    "title": "God Said",
    "lesson": "The command comes before the movement of water.",
    "question": "God said signals…",
    "options": [
     "Command flow — the plan directs water",
     "A census of the people",
     "A harvest"
    ],
    "correctIndex": 0,
    "explanation": "The word comes first; the water follows."
   },
   {
    "title": "Evening & Morning",
    "lesson": "The first day is a fill-and-release cycle.",
    "question": "Which GEI pattern marks the first day?",
    "options": [
     "Fill and release — a full and empty cycle",
     "Winter and summer",
     "Sunrise and sunset only"
    ],
    "correctIndex": 0,
    "explanation": "Evening fills, morning releases."
   },
   {
    "title": "Separate",
    "lesson": "The first step establishes a separation.",
    "question": "What is the result of the first GEI step?",
    "options": [
     "Water is separated under control",
     "The mill begins turning",
     "The wall is removed"
    ],
    "correctIndex": 0,
    "explanation": "The first step establishes controlled separation."
   }
  ],
  "2": [
   {
    "title": "The Firmament",
    "lesson": "The firmament is the separating structure.",
    "question": "In GEI, the firmament is best represented by…",
    "options": [
     "A dam — a retaining structure",
     "A fish in the water",
     "A field of grain"
    ],
    "correctIndex": 0,
    "explanation": "The firmament is the dam."
   },
   {
    "title": "Holding Water",
    "lesson": "A dam holds and controls water.",
    "question": "What is the engineering job of the dam?",
    "options": [
     "Hold and control the water",
     "Create darkness on the land",
     "Turn the mill directly"
    ],
    "correctIndex": 0,
    "explanation": "Hold and control — storage plus command."
   },
   {
    "title": "Upstream",
    "lesson": "Water behind the dam is upstream reservoir water.",
    "question": "Water held behind the dam is…",
    "options": [
     "Upstream reservoir water",
     "Downstream dry land",
     "The gate handle"
    ],
    "correctIndex": 0,
    "explanation": "Behind the wall means upstream."
   },
   {
    "title": "Wall",
    "lesson": "The wall creates wet and dry sides.",
    "question": "What does a dam wall create?",
    "options": [
     "A clear separation between two sides",
     "A new mountain",
     "A new river bed"
    ],
    "correctIndex": 0,
    "explanation": "The wall separates the two sides."
   },
   {
    "title": "Pressure",
    "lesson": "Rising water increases hydraulic pressure on the barrier.",
    "question": "As water rises against a barrier, what increases?",
    "options": [
     "Hydraulic pressure",
     "The weight of the wall itself",
     "The wall turning to water"
    ],
    "correctIndex": 0,
    "explanation": "Higher water means higher pressure."
   },
   {
    "title": "Foundation",
    "lesson": "A stable barrier must be verified before proceeding.",
    "question": "What must a builder verify before moving on?",
    "options": [
     "A stable water-control barrier",
     "A gate that is broken",
     "An empty reservoir"
    ],
    "correctIndex": 0,
    "explanation": "Foundation first — stability before release."
   }
  ],
  "3": [
   {
    "title": "The Basin",
    "lesson": "The reservoir is the basin where water waits.",
    "question": "What is the reservoir in the GEI system?",
    "options": [
     "The storage basin that holds water",
     "A field of crops",
     "The control room"
    ],
    "correctIndex": 0,
    "explanation": "The reservoir is the storage basin."
   },
   {
    "title": "Capacity",
    "lesson": "Every basin has a maximum safe capacity.",
    "question": "Reservoir capacity is…",
    "options": [
     "The maximum water the basin can hold",
     "The height of the mill wheel",
     "The number of gates"
    ],
    "correctIndex": 0,
    "explanation": "Capacity is the maximum safe storage."
   },
   {
    "title": "The Banks",
    "lesson": "Banks and a sound base keep water inside.",
    "question": "What keeps water inside the reservoir?",
    "options": [
     "Banks and a sealed base",
     "Open channels in the ground",
     "The mill wheel"
    ],
    "correctIndex": 0,
    "explanation": "Banks and a sealed base hold the store."
   },
   {
    "title": "Filling",
    "lesson": "During filling, storage is built before release.",
    "question": "While the reservoir is filling, the gates should…",
    "options": [
     "Stay closed so water is stored",
     "Open wide to release everything",
     "Be removed"
    ],
    "correctIndex": 0,
    "explanation": "Close the gates to fill the store."
   },
   {
    "title": "Stored Power",
    "lesson": "Stored water holds potential energy.",
    "question": "Water stored in the reservoir is…",
    "options": [
     "Stored potential energy",
     "Noise in the basin",
     "Darkness in the deep"
    ],
    "correctIndex": 0,
    "explanation": "A full reservoir is stored energy."
   },
   {
    "title": "Overflow",
    "lesson": "A spillway safely carries surplus water away.",
    "question": "What protects the reservoir from overfilling?",
    "options": [
     "A spillway for surplus water",
     "A second mill",
     "A fence around the wall"
    ],
    "correctIndex": 0,
    "explanation": "The spillway carries surplus water safely."
   }
  ],
  "4": [
   {
    "title": "The Gate",
    "lesson": "The gate is the operator's control point.",
    "question": "What is the job of the gate?",
    "options": [
     "Release water under control",
     "Hold water forever",
     "Spin by itself"
    ],
    "correctIndex": 0,
    "explanation": "The gate controls release."
   },
   {
    "title": "Opening",
    "lesson": "Opening the gate turns stored water into controlled flow.",
    "question": "What happens when the operator opens a gate?",
    "options": [
     "Water releases in a controlled flow",
     "The reservoir refills faster",
     "The wall slides sideways"
    ],
    "correctIndex": 0,
    "explanation": "Open gate means controlled release."
   },
   {
    "title": "Downstream",
    "lesson": "Released water has a planned destination.",
    "question": "Where does released water travel?",
    "options": [
     "Downstream, where it is needed",
     "Back into the mountain",
     "Into the sky"
    ],
    "correctIndex": 0,
    "explanation": "Released water goes downstream."
   },
   {
    "title": "Closing",
    "lesson": "Closing ends the release.",
    "question": "How does an operator stop a release?",
    "options": [
     "Close the gate",
     "Open it wider",
     "Remove the wall"
    ],
    "correctIndex": 0,
    "explanation": "Close the gate and the release stops."
   },
   {
    "title": "Schedule",
    "lesson": "Good operations follow a planned schedule.",
    "question": "What makes operations run well?",
    "options": [
     "A planned release schedule",
     "Releasing at random times",
     "Never releasing"
    ],
    "correctIndex": 0,
    "explanation": "Plan the releases."
   },
   {
    "title": "Safety First",
    "lesson": "Operators inspect the works before release.",
    "question": "Before opening a gate, operators…",
    "options": [
     "Inspect the works and clear downstream",
     "Open instantly",
     "Ignore warning signs"
    ],
    "correctIndex": 0,
    "explanation": "Inspect first, then release."
   }
  ],
  "5": [
   {
    "title": "Waterpower",
    "lesson": "Moving water carries usable energy.",
    "question": "What does moving water provide the mill?",
    "options": [
     "Energy to do work",
     "Light for the valley",
     "Noise only"
    ],
    "correctIndex": 0,
    "explanation": "Moving water is energy."
   },
   {
    "title": "The Wheel",
    "lesson": "The wheel catches the flow and turns.",
    "question": "What does the mill wheel do?",
    "options": [
     "Catches the flow and turns",
     "Stores the water",
     "Blocks the river"
    ],
    "correctIndex": 0,
    "explanation": "The wheel turns with the flow."
   },
   {
    "title": "The Race",
    "lesson": "A millrace guides flow to the wheel.",
    "question": "What guides water to the wheel?",
    "options": [
     "A millrace channel",
     "A fence",
     "A roof"
    ],
    "correctIndex": 0,
    "explanation": "The race carries flow to the wheel."
   },
   {
    "title": "The Transfer",
    "lesson": "Shafts and gears carry rotation to machinery.",
    "question": "How does the wheel’s motion reach machinery?",
    "options": [
     "Through shafts and gears",
     "By magic",
     "On the wind"
    ],
    "correctIndex": 0,
    "explanation": "Shafts and gears transfer the turning."
   },
   {
    "title": "Controlled Power",
    "lesson": "The gate controls how much water reaches the mill.",
    "question": "What controls how much power the mill receives?",
    "options": [
     "The upstream gate",
     "The weather",
     "The crop fields"
    ],
    "correctIndex": 0,
    "explanation": "The gate throttles the mill."
   },
   {
    "title": "Useful Work",
    "lesson": "Water power becomes productive work.",
    "question": "The GEI mill uses water power to…",
    "options": [
     "Do useful work for the community",
     "Empty the reservoir",
     "Stop the dam"
    ],
    "correctIndex": 0,
    "explanation": "Water power becomes useful work."
   }
  ],
  "6": [
   {
    "title": "System Order",
    "lesson": "The six levels form one controlled sequence.",
    "question": "Which order matches the GEI build?",
    "options": [
     "Separate → Dam → Reservoir → Operations → Mill → System",
     "Mill → Reservoir → Dam → Separate → System → Operations",
     "Reservoir → Mill → Dam → Operations → Separate → System"
    ],
    "correctIndex": 0,
    "explanation": "The levels build from separation to the complete system."
   },
   {
    "title": "Source",
    "lesson": "The system begins at the source.",
    "question": "In the GEI model, the source of the water is represented by…",
    "options": [
     "The mountain",
     "The mill wheel",
     "The downstream field"
    ],
    "correctIndex": 0,
    "explanation": "The mountain is the water source."
   },
   {
    "title": "Control",
    "lesson": "The dam and gates regulate movement.",
    "question": "What provides the main control points?",
    "options": [
     "The dam and its gates",
     "The crops",
     "The valley floor"
    ],
    "correctIndex": 0,
    "explanation": "Dam plus gates provide control."
   },
   {
    "title": "Flow",
    "lesson": "Controlled release moves water downstream.",
    "question": "What should controlled flow do?",
    "options": [
     "Move where and when the system requires",
     "Always overflow",
     "Stop permanently"
    ],
    "correctIndex": 0,
    "explanation": "Controlled flow follows the plan."
   },
   {
    "title": "Work",
    "lesson": "The mill converts flow into work.",
    "question": "What is the final productive purpose of the mill?",
    "options": [
     "Turn water energy into useful work",
     "Store water forever",
     "Remove the dam"
    ],
    "correctIndex": 0,
    "explanation": "The mill makes the stored flow productive."
   },
   {
    "title": "Completion",
    "lesson": "The complete system links every stage.",
    "question": "What does completing Level 6 represent?",
    "options": [
     "The GEI water-control system working as one",
     "The reservoir disappearing",
     "The gates becoming unnecessary"
    ],
    "correctIndex": 0,
    "explanation": "The complete build now works as one system."
   }
  ]
 }
};

function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
function hasItem(id) { return Object.prototype.hasOwnProperty.call(ITEM_CATALOG, id); }

/* ---------- tokens (same format as the Cloudflare worker) ---------- */
async function makeToken(deps, profileId) {
  const exp = deps.now() + TOKEN_TTL_MS;
  const sig = await deps.hmacHex(deps.secrets.session, profileId + '.' + exp);
  return profileId + '.' + exp + '.' + sig;
}
async function checkToken(deps, token) {
  if (typeof token !== 'string') return null;
  const p = token.split('.');
  if (p.length !== 3) return null;
  const n = Number(p[1]);
  if (!Number.isFinite(n) || n < deps.now()) return null;
  const expect = await deps.hmacHex(deps.secrets.session, p[0] + '.' + p[1]);
  if (expect.length !== p[2].length) return null;
  let r = 0;
  for (let i = 0; i < expect.length; i++) r |= expect.charCodeAt(i) ^ p[2].charCodeAt(i);
  return r === 0 ? { profileId: p[0], exp: n } : null;
}

/* ---------- ledger helpers (all reads are fresh under lock when it matters) ---------- */
function ledgerRows(storage, pid) {
  return storage.rows('ledger').filter(r => r.profile_id === pid);
}
function purchaseRows(storage, pid) {
  return storage.rows('purchases').filter(r => r.profile_id === pid);
}
function earnedOf(storage, pid) {
  return ledgerRows(storage, pid).reduce((s, r) => s + Number(r.amount || 0), 0);
}
function spentOf(storage, pid) {
  return purchaseRows(storage, pid).reduce((s, r) => s + Number(r.cost || 0), 0);
}
function balanceOf(storage, pid) { return earnedOf(storage, pid) - spentOf(storage, pid); }

function snapshot(storage, pid) {
  const earned = earnedOf(storage, pid);
  const spent = spentOf(storage, pid);
  const owned = storage.rows('entitlements').filter(r => r.profile_id === pid)
    .sort((a, b) => Number(a.created_at) - Number(b.created_at))
    .map(r => r.item_id);
  const eq = storage.rows('equips').filter(r => r.profile_id === pid)[0];
  const txs = []
    .concat(ledgerRows(storage, pid).map(r => ({
      type: 'grant', ref: r.ref_id, amount: Number(r.amount), item: null, at: Number(r.created_at)
    })))
    .concat(purchaseRows(storage, pid).map(r => ({
      type: 'purchase', ref: r.id, amount: -Number(r.cost), item: r.item_id, at: Number(r.created_at)
    })))
    .sort((a, b) => b.at - a.at).slice(0, 20);
  return { xp: earned - spent, earned: earned, spent: spent, owned: owned,
    equippedSkin: eq ? eq.skin_id : '', transactions: txs };
}

/* ---------- routes ---------- */
function routeHealth() {
  return { status: 200, data: { ok: true, service: 'gei-economy', ts: Date.now() } };
}

function paymentsEnabled(deps) {
  return !!(deps.secrets.stripeKey && deps.secrets.stripeWebhook);
}
function routeCatalog(deps) {
  const on = paymentsEnabled(deps);
  return { status: 200, data: {
    ok: true, itemCost: ITEM_COST, payments: on,
    packs: on ? PACKS.map(k => ({ id: k.id, name: k.name, xp: k.xp, cents: k.cents, currency: k.currency, desc: k.desc })) : []
  } };
}

function routeProfile(deps, b) {
  const deviceId = String(b.deviceId || '').slice(0, 64);
  if (!/^[a-z0-9_]{8,64}$/i.test(deviceId)) return { status: 400, data: { ok: false, error: 'bad_device_id' } };
  const name = (String(b.name || 'Explorer').trim() || 'Explorer').slice(0, 40);
  return Promise.resolve().then(() => deps.storage.lock(() => {
    let prof = deps.storage.rows('profiles').filter(r => r.device_id === deviceId)[0];
    if (!prof) {
      const id = deps.randomId('prf_');
      const now = deps.now();
      prof = { profile_id: id, device_id: deviceId, name: name, created_at: now };
      deps.storage.appendRow('profiles', prof);
      /* SEED: pre-backend progress — one credit per completed mission,
         same idempotency key as live reports (no double count, ever). */
      const completed = Array.isArray(b.completed) ? b.completed : [];
      for (const c of completed) {
        const lvl = Number(c && c.level), mis = Number(c && c.mission);
        if (Number.isInteger(lvl) && lvl >= 1 && lvl <= 6 && Number.isInteger(mis) && mis >= 0 && mis <= 5) {
          const ref = 'a:' + lvl + ':' + mis;
          if (!ledgerRows(deps.storage, id).some(r => r.ref_id === ref)) {
            deps.storage.appendRow('ledger', { profile_id: id, kind: 'answer', amount: XP_PER_ANSWER, ref_id: ref, client_tx: 'seed', created_at: now });
          }
        }
      }
      /* SEED: pre-existing ownership = legacy purchase (cost deducted) + entitlement */
      const owned = Array.isArray(b.owned) ? b.owned : [];
      for (const o of owned) {
        if (hasItem(o)) {
          deps.storage.appendRow('purchases', { id: deps.randomId('pur_'), profile_id: id, item_id: o, cost: ITEM_COST, xp_before: 0, xp_after: 0, client_tx: 'legacy', created_at: now });
          deps.storage.appendRow('entitlements', { profile_id: id, item_id: o, source: 'legacy', purchase_id: null, created_at: now });
        }
      }
      const skin = (typeof b.equippedSkin === 'string') ? b.equippedSkin : '';
      if (skin === '' || hasItem(skin)) {
        deps.storage.replaceRow('equips', 'profile_id', id, { profile_id: id, skin_id: skin });
      }
    } else if (prof.name !== name) {
      deps.storage.replaceRow('profiles', 'profile_id', prof.profile_id, Object.assign({}, prof, { name: name }));
    }
    const pid = prof.profile_id;
    return makeToken(deps, pid).then(token => ({
      status: 200, data: { ok: true, profileId: pid, token: token, state: snapshot(deps.storage, pid) }
    }));
  }));
}

function routeGrant(deps, pid, b) {
  const level = Number(b.level), mission = Number(b.mission);
  if (!Number.isInteger(level) || level < 1 || level > 6 ||
      !Number.isInteger(mission) || mission < 0 || mission > 5) {
    return Promise.resolve({ status: 400, data: { ok: false, error: 'bad_grant' } });
  }
  const lvl = BANK.levels[String(level)];
  const m = lvl && lvl[mission];
  if (!m) return Promise.resolve({ status: 400, data: { ok: false, error: 'unknown_question' } });
  if (norm(b.option) !== norm(m.options[m.correctIndex])) {
    return Promise.resolve({ status: 200, data: { ok: true, correct: false, granted: false, xp: balanceOf(deps.storage, pid) } });
  }
  return Promise.resolve().then(() => deps.storage.lock(() => {
    const ref = 'a:' + level + ':' + mission;
    const already = ledgerRows(deps.storage, pid).some(r => r.ref_id === ref);
    if (!already) {
      deps.storage.appendRow('ledger', { profile_id: pid, kind: 'answer', amount: XP_PER_ANSWER, ref_id: ref, client_tx: String(b.clientTxId || '').slice(0, 64), created_at: deps.now() });
    }
    return { status: 200, data: { ok: true, correct: true, granted: !already, xp: balanceOf(deps.storage, pid) } };
  }));
}

function routeGrantBulk(deps, pid, b) {
  const list = Array.isArray(b.answers) ? b.answers : [];
  let granted = 0, checked = 0;
  return Promise.resolve().then(() => deps.storage.lock(() => {
    for (const a of list) {
      const level = Number(a && a.level), mission = Number(a && a.mission);
      if (!Number.isInteger(level) || level < 1 || level > 6 ||
          !Number.isInteger(mission) || mission < 0 || mission > 5) continue;
      const lvl = BANK.levels[String(level)];
      const m = lvl && lvl[mission];
      if (!m) continue;
      checked++;
      if (norm(a.option) !== norm(m.options[m.correctIndex])) continue;
      const ref = 'a:' + level + ':' + mission;
      if (!ledgerRows(deps.storage, pid).some(r => r.ref_id === ref)) {
        deps.storage.appendRow('ledger', { profile_id: pid, kind: 'answer', amount: XP_PER_ANSWER, ref_id: ref, client_tx: String(a.clientTxId || '').slice(0, 64), created_at: deps.now() });
        granted++;
      }
    }
    const refs = ledgerRows(deps.storage, pid).filter(r => r.kind === 'answer').map(r => r.ref_id);
    return { status: 200, data: { ok: true, checked: checked, granted: granted, refs: refs, xp: balanceOf(deps.storage, pid) } };
  }));
}

function routePurchase(deps, pid, b) {
  const itemId = String(b.itemId || '');
  if (!hasItem(itemId)) return Promise.resolve({ status: 400, data: { ok: false, error: 'unknown_item' } });
  return Promise.resolve().then(() => deps.storage.lock(() => {
    const own = deps.storage.rows('entitlements').filter(r => r.profile_id === pid && r.item_id === itemId)[0];
    if (own) {
      return { status: 200, data: { ok: false, error: 'already_owned', purchaseId: own.purchase_id || null, xp: balanceOf(deps.storage, pid) } };
    }
    const bal = balanceOf(deps.storage, pid);
    if (bal < ITEM_COST) {
      return { status: 200, data: { ok: false, error: 'insufficient', xp: bal } };
    }
    const purchaseId = deps.randomId('pur_');
    const at = deps.now();
    deps.storage.appendRow('purchases', { id: purchaseId, profile_id: pid, item_id: itemId, cost: ITEM_COST, xp_before: bal, xp_after: bal - ITEM_COST, client_tx: String(b.clientTxId || '').slice(0, 64), created_at: at });
    deps.storage.appendRow('entitlements', { profile_id: pid, item_id: itemId, source: 'purchase', purchase_id: purchaseId, created_at: at });
    return { status: 200, data: {
      ok: true,
      transaction: { purchaseId: purchaseId, itemId: itemId, cost: ITEM_COST, xpBefore: bal, xpAfter: bal - ITEM_COST, at: new Date(at).toISOString() },
      xp: bal - ITEM_COST
    } };
  }));
}

function routeEquip(deps, pid, b) {
  const skinId = (b.skinId === undefined || b.skinId === null) ? '' : String(b.skinId);
  return Promise.resolve().then(() => deps.storage.lock(() => {
    if (skinId !== '') {
      if (!hasItem(skinId)) return { status: 400, data: { ok: false, error: 'unknown_skin' } };
      const own = deps.storage.rows('entitlements').filter(r => r.profile_id === pid && r.item_id === skinId)[0];
      if (!own) return { status: 200, data: { ok: false, error: 'not_owned' } };
    }
    deps.storage.replaceRow('equips', 'profile_id', pid, { profile_id: pid, skin_id: skinId });
    return { status: 200, data: { ok: true } };
  }));
}

async function ensurePrice(deps, pack) {
  let row = deps.storage.rows('prices').filter(r => r.pack_id === pack.id)[0];
  if (row && row.stripe_price_id) return row.stripe_price_id;
  const res = await deps.stripeFetch('/prices', {
    'unit_amount': String(pack.cents),
    'currency': pack.currency,
    'product_data[0][name]': pack.name,
    'product_data[0][description]': pack.desc
  });
  if (res.status !== 200 || !res.data || !res.data.id) throw new Error('stripe price failed: ' + res.status);
  deps.storage.replaceRow('prices', 'pack_id', pack.id, { pack_id: pack.id, stripe_price_id: res.data.id });
  return res.data.id;
}

function routeCheckout(deps, pid, b) {
  if (!paymentsEnabled(deps)) return Promise.resolve({ status: 503, data: { ok: false, error: 'payments_not_enabled' } });
  const pack = PACKS.filter(p => p.id === b.packId)[0];
  if (!pack) return Promise.resolve({ status: 400, data: { ok: false, error: 'unknown_pack' } });
  return ensurePrice(deps, pack).then(price =>
    deps.stripeFetch('/checkout/sessions', {
      'mode': 'payment',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      'metadata[profileId]': pid,
      'metadata[packId]': pack.id,
      'metadata[clientRefId]': String(b.clientRefId || '').slice(0, 64),
      'success_url': deps.origin + '/vault.html?checkout=success',
      'cancel_url': deps.origin + '/vault.html?checkout=cancel',
      'client_reference_id': String(b.clientRefId || '').slice(0, 64)
    })).then(res => {
      if (res.status !== 200 || !res.data || !res.data.url) {
        throw new Error('stripe checkout failed: ' + res.status);
      }
      return { status: 200, data: { ok: true, url: res.data.url } };
    }).catch(err => ({ status: 502, data: { ok: false, error: 'checkout_failed', message: String((err && err.message) || err) } }));
}

/* Stripe signature: t=<ts>,v1=hex(HMAC_SHA256(secret, t + "." + rawBody)) */
async function verifyStripeSignature(deps, raw, header) {
  if (!deps.secrets.stripeWebhook) return false;
  if (typeof header !== 'string') return false;
  const parts = {};
  header.split(',').forEach(kv => {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  const t = parts['t'], v1 = parts['v1'];
  if (!t || !v1 || !/^\d+$/.test(t)) return false;
  if (Math.abs(deps.now() - Number(t)) > STRIPE_TOLERANCE_MS) return false;
  const expect = await deps.hmacHex(deps.secrets.stripeWebhook, t + '.' + raw);
  if (expect.length !== v1.length) return false;
  let r = 0;
  for (let i = 0; i < expect.length; i++) r |= expect.charCodeAt(i) ^ v1.charCodeAt(i);
  return r === 0;
}

function routeWebhook(deps, raw, headers) {
  const header = headers ? (headers['stripe-signature'] || headers['Stripe-Signature'] || '') : '';
  return verifyStripeSignature(deps, raw, header).then(valid => {
    if (!valid) return { status: 400, data: { received: false, error: 'bad_signature' } };
    let ev;
    try { ev = JSON.parse(raw); } catch (e) { return { status: 400, data: { received: false, error: 'bad_json' } }; }
    if (ev.type === 'checkout.session.completed') {
      const sess = (ev.data && ev.data.object) || {};
      const meta = sess.metadata || {};
      const pack = PACKS.filter(p => p.id === meta.packId)[0];
      if (pack && meta.profileId) {
        return Promise.resolve().then(() => deps.storage.lock(() => {
          const ref = 'stripe:' + sess.id;
          if (!ledgerRows(deps.storage, meta.profileId).some(r => r.ref_id === ref)) {
            deps.storage.appendRow('ledger', { profile_id: meta.profileId, kind: 'xp_pack', amount: pack.xp, ref_id: ref, client_tx: String(sess.client_reference_id || '').slice(0, 64), created_at: deps.now() });
          }
          return { status: 200, data: { received: true } };
        }));
      }
    }
    return { status: 200, data: { received: true } };
  });
}

/* ---------- dispatcher ---------- */
function makeCore(deps) {
  deps.storage = deps.storage;
  const AUTHED = {
    'state': 'GET', 'xp-grant': 'POST', 'xp-grant/bulk': 'POST',
    'purchase': 'POST', 'equip': 'POST', 'xp-pack/checkout': 'POST'
  };
  async function rateLimitOk(key) {
    const now = deps.now();
    let rec;
    try {
      rec = deps.storage.cacheGet(key);
      rec = rec ? JSON.parse(rec) : null;
    } catch (e) { rec = null; }
    const n = (!rec || rec.win < now - RL_WINDOW_MS) ? 1 : rec.n + 1;
    try { deps.storage.cacheSet(key, JSON.stringify({ n: n, win: now }), RL_WINDOW_MS / 1000 + 1); } catch (e) {}
    return n <= RL_MAX;
  }
  return {
    async route(api, r) {
      r = r || {};
      if (api === 'health') return routeHealth();
      if (api === 'catalog') {
        if (!(await rateLimitOk('ip:anon'))) return { status: 429, data: { error: 'rate_limited' } };
        return routeCatalog(deps);
      }
      if (api === 'profile' && r.method === 'POST') {
        const b = r.body || {};
        if (!(await rateLimitOk('dev:' + String(b.deviceId || 'anon')))) return { status: 429, data: { error: 'rate_limited' } };
        return routeProfile(deps, b);
      }
      if (api === 'webhooks/stripe' && r.method === 'POST') {
        return routeWebhook(deps, String(r.raw == null ? '' : r.raw), r.headers || {});
      }
      if (AUTHED[api]) {
        const authed = await checkToken(deps, r.token);
        const prof = authed ? deps.storage.rows('profiles').filter(x => x.profile_id === authed.profileId)[0] : null;
        if (!authed || !prof) return { status: 401, data: { error: 'unauthorized' } };
        if (!(await rateLimitOk('tok:' + authed.profileId))) return { status: 429, data: { error: 'rate_limited' } };
        const pid = authed.profileId;
        const b = r.body || {};
        if (api === 'state') return { status: 200, data: { ok: true, state: snapshot(deps.storage, pid) } };
        if (api === 'xp-grant') return routeGrant(deps, pid, b);
        if (api === 'xp-grant/bulk') return routeGrantBulk(deps, pid, b);
        if (api === 'purchase') return routePurchase(deps, pid, b);
        if (api === 'equip') return routeEquip(deps, pid, b);
        if (api === 'xp-pack/checkout') return routeCheckout(deps, pid, b);
      }
      return { status: 404, data: { error: 'not_found' } };
    },
    PACKS: PACKS, ITEM_CATALOG: ITEM_CATALOG, ITEM_COST: ITEM_COST, XP_PER_ANSWER: XP_PER_ANSWER
  };
}

/* For modules (node tests / build): */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeCore, PACKS, ITEM_CATALOG, ITEM_COST, XP_PER_ANSWER };
}

