// One-time import: pushes your markdown notes (public/notes.json) into your
// Supabase account as books. Run LOCALLY only — uses the service-role key,
// which must NEVER be committed or shipped to the browser.
//
// Prereqs:
//   1. node build.mjs                       # generate public/notes.json
//   2. Sign in once on the live site        # creates your auth.users row
//   3. Run:
//      SUPABASE_URL="https://xxxx.supabase.co" \
//      SUPABASE_SERVICE_ROLE_KEY="eyJ...service_role..." \
//      SEED_EMAIL="you@example.com" \
//      node seed.mjs
import { readFile } from "node:fs/promises";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SEED_EMAIL;

if (!URL_ || !KEY || !EMAIL) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_EMAIL env vars.");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// 1. find the user id for SEED_EMAIL
const ures = await fetch(`${URL_}/auth/v1/admin/users?per_page=200`, { headers });
if (!ures.ok) { console.error("admin users fetch failed:", await ures.text()); process.exit(1); }
const { users } = await ures.json();
const user = users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
if (!user) { console.error(`No user found for ${EMAIL}. Sign in on the site once first.`); process.exit(1); }

// 2. map notes.json → book rows
const { notes } = JSON.parse(await readFile("public/notes.json", "utf8"));
const VALID = new Set(["to_read", "reading", "finished"]);
const rows = notes.map((n) => ({
  user_id: user.id,
  title: n.title,
  subtitle: n.subtitle || null,
  author: n.author || null,
  category: n.category || null,
  cover_url: n.coverUrl || null,
  status: VALID.has(n.status) ? n.status : null,
  body: n.body || null,
}));

// 3. insert
const ins = await fetch(`${URL_}/rest/v1/books`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify(rows),
});
if (!ins.ok) { console.error("insert failed:", await ins.text()); process.exit(1); }
console.log(`Seeded ${rows.length} books into ${EMAIL}'s library.`);
