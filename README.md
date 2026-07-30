# The Club House — landing page

The Club House connects college athletes with elite summer employment at clubs,
camps, academies, and resorts through intelligent matching, reputation tracking,
and logistics management.

This repo is the **marketing landing page and waitlist**. The product app lives
separately at `app.clubhouseplacement.com`.

## Run locally

```bash
python3 -m http.server 8765
```

Open <http://localhost:8765>. Serve it over HTTP — opening `index.html` as a
`file://` URL breaks the CSS mask and the form.

## Stack

Static HTML, CSS, and vanilla JS. **No build step, no dependencies, no
framework.** Deploy by dropping the directory on any static host.

## Waitlist

The forms write to Supabase once you add your project URL and anon key to
`assets/js/config.js`. Until then they fall back to the existing Tally forms, so
no signup is lost and no one is shown a false confirmation.

**Before going live**, apply the `waitlist` table SQL in
[CLAUDE.md](CLAUDE.md#required-table-and-security) — it sets an insert-only RLS
policy. Without it the waitlist is world-readable.

## Docs

| | |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Architecture, constraints, the waitlist schema, and a "never reintroduce" list from the crash post-mortem |
| [docs/DESIGN.md](docs/DESIGN.md) | Design tokens with measured contrast ratios, type and space scales, performance budget |
| [docs/MIGRATING-OFF-BOLT.md](docs/MIGRATING-OFF-BOLT.md) | Handoff for moving the product app to GitHub |
