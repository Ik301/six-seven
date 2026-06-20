// Supabase project config. These two values are PUBLIC-safe — the anon key is
// designed to be exposed in the browser; Row Level Security (schema.sql) is what
// protects the data. Replace the placeholders with your project's values:
//   Supabase dashboard → Project Settings → API
//     - Project URL      → SUPABASE_URL
//     - anon public key  → SUPABASE_ANON_KEY
window.SUPABASE_CONFIG = {
  SUPABASE_URL: "YOUR_PROJECT_URL",       // e.g. https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY",     // the long anon public key
};
