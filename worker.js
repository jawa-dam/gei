/* ============================================================
   GEI DAM ACADEMY — SECURE ECONOMY BACKEND
   Master Prompt Phase 9 (secure economy backend) + Phase 10
   (real-money XP purchasing), rules from §19–20.

   Trust model (§20 — the frontend is NEVER trusted for
   payment entitlement):
     · XP is credited to a profile ONLY by this server:
         1. server-graded correct answers (+25, idempotent per
            level+mission — a device can earn at most the 36
            canonical answers),
         2. a one-time legacy import at profile creation
            (capped at 900 — the max the game can earn),
         3. Stripe webhooks with VERIFIED SIGNATURES only.
     · No client path can create an entitlement or credit
       purchase XP. If payment providers are not configured,
       the checkout endpoint refuses to do anything.
     · The local game keeps working fully offline; this server
       becomes authoritative once a device profile exists.

   Zero dependencies: Web Crypto + D1 only. Single file so it
   can be pasted into the Cloudflare dashboard unchanged.
   ============================================================ */
'use strict';

/* Canonical 36-question bank (6 levels × 6 missions). Extracted
   from level1–6.html — the single source of truth for grading.
   correctIndex is the index of the correct option. */
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

/* XP packs — real money (Phase 10). PRICING IS A BUSINESS
   DECISION: Wilbert edits the names/cents here and redeploys.
   900 XP = exactly one Vault item, so each pack maps to whole
   items (900 / 1800 / 2700). */
const PACKS = [
  { id: 'pack-900',  name: 'Trail Pass',  xp: 900,  cents: 299, currency: 'usd',
    desc: "One full Vault item's worth of XP." },
  { id: 'pack-1800', name: 'Ridge Pass',  xp: 1800, cents: 499, currency: 'usd',
    desc: 'Two items — better value per XP.' },
  { id: 'pack-2700', name: 'Summit Pass', xp: 2700, cents: 699, currency: 'usd',
    desc: 'Three items — the full Vault in one pass.' }
];

/* Mirrors CATALOG ids in js/gei-vault-economy-engine.js.
   900 XP per item — permanent business rule (§17–18). */
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
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days
const RL_WINDOW_MS = 60000;
const RL_MAX_TOKEN = 120;             // per authenticated profile
const RL_MAX_IP = 120;                // per IP (unauthenticated)
const STRIPE_TOLERANCE_MS = 300000;   // 5 min webhook clock skew

/* ---------------- small helpers (Web Crypto only) ---------------- */
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function randomId(prefix, bytes) {
  const n = bytes || 16;
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  let s = '';
  for (let i = 0; i < n; i++) s += B32[a[i] % 32];
  return prefix + s;
}
const enc = new TextEncoder();
async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

/* ---------------- session tokens (HMAC, 30 days) ---------------- */
async function makeToken(profileId, secret) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = await hmacHex(secret, profileId + '.' + exp);
  return profileId + '.' + exp + '.' + sig;
}
async function checkToken(token, secret) {
  if (typeof token !== 'string') return null;
  const p = token.split('.');
  if (p.length !== 3) return null;
  const id = p[0], exp = p[1], sig = p[2];
  const n = Number(exp);
  if (!Number.isFinite(n) || n < Date.now()) return null;
  const expect = await hmacHex(secret, id + '.' + exp);
  return timingSafeEqual(expect, sig) ? { profileId: id, exp: n } : null;
}

/* ---------------- DB facade: D1 (prod) or sql.js (tests) ---------------- */
function facadeFor(db) {
  if (db && typeof db.prepare === 'function' && typeof db.run !== 'function') {
    return {
      kind: 'd1',
      run: function (sql, p) { const a = p || []; return db.prepare(sql).bind.apply(db.prepare(sql), a).run().then(function (r) { return (r && r.meta && r.meta.changes) || 0; }); },
      get: function (sql, p) { return db.prepare(sql).bind.apply(db.prepare(sql), p || []).first(); },
      all: function (sql, p) { return db.prepare(sql).bind.apply(db.prepare(sql), p || []).all().then(function (r) { return (r && r.results) || []; }); }
    };
  }
  const all = function (sql, p) {
    const res = db.exec(sql, p || []);
    if (!res || !res.length) return [];
    const cols = res[0].columns, vals = res[0].values;
    return vals.map(function (v) {
      const o = {};
      cols.forEach(function (c, i) { o[c] = v[i]; });
      return o;
    });
  };
  return {
    kind: 'sqlite',
    run: function (sql, p) { db.run(sql, p || []); return db.getRowsModified(); },
    get: function (sql, p) { return all(sql, p)[0] || null; },
    all: all
  };
}

/* ---------------- env ---------------- */
function buildEnv(env) {
  env = env || {};
  return {
    f: facadeFor(env.DB),
    SESSION_SECRET: env.SESSION_SECRET || 'dev-only-session-secret',
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || '',
    APP_ORIGIN: env.APP_ORIGIN || 'https://jawa-dam.github.io'
  };
}
function paymentsEnabled(E) { return !!(E.STRIPE_SECRET_KEY && E.STRIPE_WEBHOOK_SECRET); }

/* ---------------- http helpers ---------------- */
function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'content-type': 'application/json' }, cors || {})
  });
}
function corsHeaders(E, req) {
  const o = req.headers.get('origin') || '';
  const ok = o === E.APP_ORIGIN ||
    /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(o) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  if (!ok) return {};
  return {
    'access-control-allow-origin': o, 'vary': 'origin',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization'
  };
}
function tokenOf(req, url) {
  const a = req.headers.get('authorization') || '';
  if (/^bearer /i.test(a)) return a.slice(7).trim();
  return url.searchParams.get('token') || '';
}
async function body(req) { try { return await req.json(); } catch (e) { return {}; } }
function ipOf(req) {
  return (req.headers && req.headers.get('cf-connecting-ip')) || 'test-ip';
}

/* ---------------- rate limit (per token / per ip, 1 min) ---------------- */
async function rateLimit(E, key, max) {
  const now = Date.now();
  const row = await E.f.get('SELECT n, win FROM rl WHERE key=?', [key]);
  let n;
  if (!row || row.win < now - RL_WINDOW_MS) n = 1; else n = row.n + 1;
  await E.f.run(
    'INSERT INTO rl (key, n, win) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET n=excluded.n, win=excluded.win',
    [key, n, now]);
  return n <= max;
}

/* ---------------- ledger / snapshot ---------------- */
function earnedSql(pid) { return 'SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE profile_id=?'; }
function spentSql(pid) { return 'SELECT COALESCE(SUM(cost),0) s FROM purchases WHERE profile_id=?'; }
async function balanceOf(E, pid) {
  const g = await E.f.get(earnedSql(pid), [pid]);
  const sp = await E.f.get(spentSql(pid), [pid]);
  return (g ? g.s : 0) - (sp ? sp.s : 0);
}
async function snapshot(E, pid) {
  const earned = (await E.f.get(earnedSql(pid), [pid])).s;
  const spent = (await E.f.get(spentSql(pid), [pid])).s;
  const owned = (await E.f.all('SELECT item_id FROM entitlements WHERE profile_id=? ORDER BY created_at ASC', [pid]))
    .map(function (r) { return r.item_id; });
  const eq = await E.f.get('SELECT skin_id FROM equips WHERE profile_id=?', [pid]);
  const txs = await E.f.all(
    'SELECT type, ref, amount, item, at FROM (' +
    "  SELECT 'grant' AS type, ref_id AS ref, amount AS amount, NULL AS item, created_at AS at FROM xp_ledger WHERE profile_id=?" +
    "  UNION ALL SELECT 'purchase' AS type, id AS ref, -cost AS amount, item_id AS item, created_at AS at FROM purchases WHERE profile_id=?" +
    ') ORDER BY at DESC LIMIT 20', [pid, pid]);
  return { xp: earned - spent, earned: earned, spent: spent, owned: owned,
    equippedSkin: eq ? eq.skin_id : '', transactions: txs };
}

/* ---------------- Stripe (REST, no SDK) ---------------- */
async function stripeCall(E, path, fields) {
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: 'POST',
    headers: {
      'authorization': 'Bearer ' + E.STRIPE_SECRET_KEY,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(fields).toString()
  });
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    const msg = (data.error && data.error.message) || ('stripe ' + res.status);
    const err = new Error(msg);
    err.stripeStatus = res.status;
    throw err;
  }
  return data;
}
async function ensurePrice(E, pack) {
  const row = await E.f.get('SELECT stripe_price_id FROM prices WHERE pack_id=?', [pack.id]);
  if (row && row.stripe_price_id) return row.stripe_price_id;
  const price = await stripeCall(E, '/prices', {
    'unit_amount': String(pack.cents),
    'currency': pack.currency,
    'product_data[0][name]': pack.name,
    'product_data[0][description]': pack.desc
  });
  await E.f.run('INSERT OR REPLACE INTO prices (pack_id, stripe_price_id) VALUES (?,?)', [pack.id, price.id]);
  return price.id;
}
async function createCheckout(E, pid, pack, clientRefId) {
  const price = await ensurePrice(E, pack);
  const session = await stripeCall(E, '/checkout/sessions', {
    'mode': 'payment',
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    'metadata[profileId]': pid,
    'metadata[packId]': pack.id,
    'metadata[clientRefId]': clientRefId || '',
    'success_url': E.APP_ORIGIN + '/vault.html?checkout=success',
    'cancel_url': E.APP_ORIGIN + '/vault.html?checkout=cancel',
    'client_reference_id': clientRefId || ''
  });
  return session.url;
}
/* Stripe webhook signature: t=<ts>,v1=hex(HMAC_SHA256(secret, t + "." + rawBody)) */
async function verifyStripeSignature(E, raw, header) {
  if (!E.STRIPE_WEBHOOK_SECRET) return false;
  if (typeof header !== 'string') return false;
  const parts = {};
  header.split(',').forEach(function (kv) {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  const t = parts['t'], v1 = parts['v1'];
  if (!t || !v1 || !/^\d+$/.test(t)) return false;
  if (Math.abs(Date.now() - Number(t)) > STRIPE_TOLERANCE_MS) return false;
  const expect = await hmacHex(E.STRIPE_WEBHOOK_SECRET, t + '.' + raw);
  return timingSafeEqual(expect, v1);
}

/* ---------------- routes ---------------- */
function hasItem(id) { return Object.prototype.hasOwnProperty.call(ITEM_CATALOG, id); }

async function routeProfile(E, b, cors) {
  const deviceId = String(b.deviceId || '').slice(0, 64);
  if (!/^[a-z0-9_]{8,64}$/i.test(deviceId)) return json({ ok: false, error: 'bad_device_id' }, 400, cors);
  const name = (String(b.name || 'Explorer').trim() || 'Explorer').slice(0, 40);
  let prof = await E.f.get('SELECT id, device_id, name FROM profiles WHERE device_id=?', [deviceId]);
  if (!prof) {
    const id = randomId('prf_');
    const now = Date.now();
    await E.f.run('INSERT INTO profiles (id, device_id, name, created_at) VALUES (?,?,?,?)', [id, deviceId, name, now]);
    prof = { id: id, device_id: deviceId, name: name };

    /* SEED: credit each already-completed mission using the SAME idempotency
       key as live answer reports ('a:<level>:<mission>'). This is what makes
       "pre-backend progress" and "post-backend progress" never double-count:
       a mission is credited at most once per profile, whether it was seeded
       here or reported live later. */
    const completed = Array.isArray(b.completed) ? b.completed : [];
    for (let i = 0; i < completed.length; i++) {
      const c = completed[i] || {};
      const lvl = Number(c.level), mis = Number(c.mission);
      if (Number.isInteger(lvl) && lvl >= 1 && lvl <= 6 && Number.isInteger(mis) && mis >= 0 && mis <= 5) {
        await E.f.run('INSERT OR IGNORE INTO xp_ledger (profile_id, kind, amount, ref_id, client_tx, created_at) VALUES (?,?,?,?,?,?)',
          [id, 'answer', XP_PER_ANSWER, 'a:' + lvl + ':' + mis, 'seed', now]);
      }
    }

    /* SEED: pre-existing local ownership becomes a LEGACY purchase (cost is
       deducted from the balance) + a 'legacy' entitlement, so the server
       balance matches the player's local balance and re-syncing the same
       item is a safe no-op (already_owned). */
    const owned = Array.isArray(b.owned) ? b.owned : [];
    for (let i = 0; i < owned.length; i++) {
      if (hasItem(owned[i])) {
        await E.f.run('INSERT OR IGNORE INTO purchases (id, profile_id, item_id, cost, xp_before, xp_after, client_tx, created_at) VALUES (?,?,?,?,?,?,?,?)',
          [randomId('pur_'), id, owned[i], ITEM_COST, 0, 0, 'legacy', now]);
        await E.f.run('INSERT OR IGNORE INTO entitlements (profile_id, item_id, source, purchase_id, created_at) VALUES (?,?,?,?,?)',
          [id, owned[i], 'legacy', null, now]);
      }
    }
    const skin = (typeof b.equippedSkin === 'string') ? b.equippedSkin : '';
    if (skin === '' || hasItem(skin)) {
      await E.f.run('INSERT OR REPLACE INTO equips (profile_id, skin_id) VALUES (?,?)', [id, skin]);
    }
  } else if (prof.name !== name) {
    await E.f.run('UPDATE profiles SET name=? WHERE id=?', [name, prof.id]);
  }
  const token = await makeToken(prof.id, E.SESSION_SECRET);
  return json({ ok: true, profileId: prof.id, token: token, state: await snapshot(E, prof.id) }, 200, cors);
}

async function routeGrant(E, pid, b, cors) {
  const level = Number(b.level), mission = Number(b.mission);
  if (!Number.isInteger(level) || level < 1 || level > 6 ||
      !Number.isInteger(mission) || mission < 0 || mission > 5) {
    return json({ ok: false, error: 'bad_grant' }, 400, cors);
  }
  const lvl = BANK.levels[String(level)]; /* array of 6 missions */
  const m = lvl && lvl[mission];
  if (!m) return json({ ok: false, error: 'unknown_question' }, 400, cors);
  const isCorrect = norm(b.option) === norm(m.options[m.correctIndex]);
  if (!isCorrect) return json({ ok: true, correct: false, granted: false, xp: await balanceOf(E, pid) }, 200, cors);
  const ch = await E.f.run(
    'INSERT OR IGNORE INTO xp_ledger (profile_id, kind, amount, ref_id, client_tx, created_at) VALUES (?,?,?,?,?,?)',
    [pid, 'answer', XP_PER_ANSWER, 'a:' + level + ':' + mission, String(b.clientTxId || '').slice(0, 64), Date.now()]);
  return json({ ok: true, correct: true, granted: ch > 0, xp: await balanceOf(E, pid) }, 200, cors);
}

/* Bulk answer sync: the client reports graded answers (level, mission,
   selected option); the server checks each against the canonical bank and
   credits at most once per (profile, level, mission). Max possible credit
   for a full 6x6 is exactly 900 — the legit max. Returns the profile's
   complete set of credited refs so the client can prune its queue. */
async function routeGrantBulk(E, pid, b, cors) {
  const list = Array.isArray(b.answers) ? b.answers : [];
  let granted = 0, checked = 0;
  for (let i = 0; i < list.length; i++) {
    const a = list[i] || {};
    const level = Number(a.level), mission = Number(a.mission);
    if (!Number.isInteger(level) || level < 1 || level > 6 ||
        !Number.isInteger(mission) || mission < 0 || mission > 5) continue;
    const lvl = BANK.levels[String(level)];
    const m = lvl && lvl[mission];
    if (!m) continue;
    checked++;
    if (norm(a.option) !== norm(m.options[m.correctIndex])) continue;
    const ch = await E.f.run(
      'INSERT OR IGNORE INTO xp_ledger (profile_id, kind, amount, ref_id, client_tx, created_at) VALUES (?,?,?,?,?,?)',
      [pid, 'answer', XP_PER_ANSWER, 'a:' + level + ':' + mission, String(a.clientTxId || '').slice(0, 64), Date.now()]);
    if (ch > 0) granted++;
  }
  const refs = (await E.f.all("SELECT ref_id FROM xp_ledger WHERE profile_id=? AND kind='answer'", [pid]))
    .map(function (r) { return r.ref_id; });
  return json({ ok: true, checked: checked, granted: granted, refs: refs, xp: await balanceOf(E, pid) }, 200, cors);
}

async function routePurchase(E, pid, b, cors) {
  const itemId = String(b.itemId || '');
  if (!hasItem(itemId)) return json({ ok: false, error: 'unknown_item' }, 400, cors);
  const ownedRow = await E.f.get('SELECT purchase_id FROM entitlements WHERE profile_id=? AND item_id=?', [pid, itemId]);
  if (ownedRow) {
    return json({ ok: false, error: 'already_owned', purchaseId: ownedRow.purchase_id || null, xp: await balanceOf(E, pid) }, 200, cors);
  }
  const purchaseId = randomId('pur_');
  const ctx = String(b.clientTxId || '').slice(0, 64);
  const at = Date.now();
  /* Single atomic statement: deduct only if the live balance covers it,
     so concurrent confirmations cannot overspend. */
  const ch = await E.f.run(
    'INSERT INTO purchases (id, profile_id, item_id, cost, xp_before, xp_after, client_tx, created_at) ' +
    'SELECT ?, ?, ?, ?, ' +
    '(SELECT COALESCE(SUM(amount),0) FROM xp_ledger WHERE profile_id=?), ' +
    '(SELECT COALESCE(SUM(amount),0) FROM xp_ledger WHERE profile_id=?) - ?, ' +
    '?, ? ' +
    'WHERE (SELECT COALESCE(SUM(amount),0) FROM xp_ledger WHERE profile_id=?) - ' +
    '(SELECT COALESCE(SUM(cost),0) FROM purchases WHERE profile_id=?) >= ?',
    [purchaseId, pid, itemId, ITEM_COST, pid, pid, ITEM_COST, ctx, at, pid, pid, ITEM_COST]);
  if (ch === 0) return json({ ok: false, error: 'insufficient', xp: await balanceOf(E, pid) }, 200, cors);
  await E.f.run('INSERT OR IGNORE INTO entitlements (profile_id, item_id, source, purchase_id, created_at) VALUES (?,?,?,?,?)',
    [pid, itemId, 'purchase', purchaseId, at]);
  const before = await balanceOf(E, pid) + ITEM_COST;
  return json({
    ok: true,
    transaction: { purchaseId: purchaseId, itemId: itemId, cost: ITEM_COST, xpBefore: before, xpAfter: before - ITEM_COST, at: new Date(at).toISOString() },
    xp: before - ITEM_COST
  }, 200, cors);
}

async function routeEquip(E, pid, b, cors) {
  const skinId = (b.skinId === undefined || b.skinId === null) ? '' : String(b.skinId);
  if (skinId !== '') {
    if (!hasItem(skinId)) return json({ ok: false, error: 'unknown_skin' }, 400, cors);
    const own = await E.f.get('SELECT 1 AS x FROM entitlements WHERE profile_id=? AND item_id=?', [pid, skinId]);
    if (!own) return json({ ok: false, error: 'not_owned' }, 200, cors);
  }
  await E.f.run('INSERT OR REPLACE INTO equips (profile_id, skin_id) VALUES (?,?)', [pid, skinId]);
  return json({ ok: true }, 200, cors);
}

async function routeCheckout(E, pid, b, cors) {
  if (!paymentsEnabled(E)) return json({ ok: false, error: 'payments_not_enabled' }, 503, cors);
  const pack = PACKS.filter(function (p) { return p.id === b.packId; })[0];
  if (!pack) return json({ ok: false, error: 'unknown_pack' }, 400, cors);
  try {
    const url = await createCheckout(E, pid, pack, String(b.clientRefId || '').slice(0, 64));
    return json({ ok: true, url: url }, 200, cors);
  } catch (err) {
    return json({ ok: false, error: 'checkout_failed', message: String(err && err.message || err) }, 502, cors);
  }
}

async function routeWebhook(E, request, cors) {
  const raw = await request.text();
  if (!(await verifyStripeSignature(E, raw, request.headers.get('stripe-signature')))) {
    return json({ received: false, error: 'bad_signature' }, 400, cors);
  }
  let ev;
  try { ev = JSON.parse(raw); } catch (e) { return json({ received: false, error: 'bad_json' }, 400, cors); }
  if (ev.type === 'checkout.session.completed') {
    const sess = (ev.data && ev.data.object) || {};
    const meta = sess.metadata || {};
    const pack = PACKS.filter(function (p) { return p.id === meta.packId; })[0];
    if (pack && meta.profileId) {
      await E.f.run('INSERT OR IGNORE INTO xp_ledger (profile_id, kind, amount, ref_id, client_tx, created_at) VALUES (?,?,?,?,?,?)',
        [meta.profileId, 'xp_pack', pack.xp, 'stripe:' + sess.id, String(sess.client_reference_id || '').slice(0, 64), Date.now()]);
    }
  }
  return json({ received: true }, 200, cors);
}

async function handle(request, E) {
  const url = new URL(request.url);
  const p = url.pathname;
  const cors = corsHeaders(E, request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (p.indexOf('/api/v1/') !== 0) return json({ error: 'not_found' }, 404, cors);
  try {
    if (request.method === 'GET' && p === '/api/v1/health') {
      return json({ ok: true, service: 'gei-economy', ts: Date.now() }, 200, cors);
    }
    if (request.method === 'GET' && p === '/api/v1/catalog') {
      if (!(await rateLimit(E, 'ip:' + ipOf(request), RL_MAX_IP))) return json({ error: 'rate_limited' }, 429, cors);
      return json({
        ok: true,
        itemCost: ITEM_COST,
        payments: paymentsEnabled(E),
        packs: paymentsEnabled(E) ? PACKS.map(function (k) {
          return { id: k.id, name: k.name, xp: k.xp, cents: k.cents, currency: k.currency, desc: k.desc };
        }) : []
      }, 200, cors);
    }
    if (request.method === 'POST' && p === '/api/v1/profile') {
      const b = await body(request);
      if (!(await rateLimit(E, 'dev:' + String(b.deviceId || ipOf(request)), RL_MAX_TOKEN))) return json({ error: 'rate_limited' }, 429, cors);
      return await routeProfile(E, b, cors);
    }
    if (request.method === 'POST' && p === '/api/v1/webhooks/stripe') {
      return await routeWebhook(E, request, cors);
    }
    /* authenticated routes (token required, profile must exist) */
    const AUTHED = {
      '/api/v1/state': 'GET', '/api/v1/xp-grant': 'POST', '/api/v1/xp-grant/bulk': 'POST',
      '/api/v1/purchase': 'POST', '/api/v1/equip': 'POST',
      '/api/v1/xp-pack/checkout': 'POST'
    };
    const need = AUTHED[p];
    if (need) {
      if (request.method !== need) return json({ error: 'method_not_allowed' }, 405, cors);
      const authed = await checkToken(tokenOf(request, url), E.SESSION_SECRET);
      const profRow = authed ? await E.f.get('SELECT id FROM profiles WHERE id=?', [authed.profileId]) : null;
      if (!authed || !profRow) return json({ error: 'unauthorized' }, 401, cors);
      if (!(await rateLimit(E, 'tok:' + authed.profileId, RL_MAX_TOKEN))) return json({ error: 'rate_limited' }, 429, cors);
      if (p === '/api/v1/state') return json({ ok: true, state: await snapshot(E, authed.profileId) }, 200, cors);
      const b = await body(request);
      if (p === '/api/v1/xp-grant') return await routeGrant(E, authed.profileId, b, cors);
      if (p === '/api/v1/xp-grant/bulk') return await routeGrantBulk(E, authed.profileId, b, cors);
      if (p === '/api/v1/purchase') return await routePurchase(E, authed.profileId, b, cors);
      if (p === '/api/v1/equip') return await routeEquip(E, authed.profileId, b, cors);
      if (p === '/api/v1/xp-pack/checkout') return await routeCheckout(E, authed.profileId, b, cors);
    }
    return json({ error: 'not_found' }, 404, cors);
  } catch (err) {
    return json({ error: 'server_error', message: String(err && err.message || err) }, 500, cors);
  }
}

export default {
  fetch: function (request, env) { return handle(request, buildEnv(env)); }
};
export { handle, buildEnv, facadeFor, verifyStripeSignature, makeToken, checkToken, snapshot, PACKS, ITEM_CATALOG, ITEM_COST, XP_PER_ANSWER };
