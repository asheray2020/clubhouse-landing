/* ============================================================
   Runtime configuration.

   HOW TO TURN ON REAL WAITLIST CAPTURE
   -----------------------------------------------------------
   Fill in the two Supabase values below and the forms start
   writing straight into your database. Until then the forms
   fall back to the existing Tally links, so no lead is lost
   and no one is ever shown a false "you're on the list".

   1. Supabase dashboard -> Project Settings -> API
   2. Copy "Project URL"            -> SUPABASE_URL
   3. Copy the "anon"/"public" key  -> SUPABASE_ANON_KEY

   The anon key is designed to be public and shipped in
   client-side code. It is NOT a secret.

   NEVER put the `service_role` key in this file. It bypasses
   every row-level-security policy and this file is served to
   every visitor.

   Before going live you MUST apply the SQL in CLAUDE.md
   ("Required table and security") — it enables row level
   security with an insert-only policy. Without it, anyone
   could read every signup's name, email, and university.
   ============================================================ */

window.CLUBHOUSE_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Table that waitlist rows are inserted into.
  WAITLIST_TABLE: 'waitlist',

  // Used only when Supabase is not configured above.
  FALLBACK_FORMS: {
    athlete: 'https://tally.so/r/Gx5EKz',
    club: 'https://tally.so/r/q4vQG8'
  }
};
