# Moving the product app off Bolt

## Scope

This is about the **product app** at `app.clubhouseplacement.com`, which is a
separate Bolt-built project. It is **not** about this repo — the landing page has
never touched Bolt.

Hand the prompt in the appendix to whoever maintains the app.

## The reframe

The complaint that started this was reasonable: *"I don't see a reason for him
having to tell Claude to tell Bolt to tell Supabase and Vercel to connect the app
together."*

But that chain isn't four services doing one job:

| Service | Job | Verdict |
|---|---|---|
| **Bolt** | AI codegen + in-browser preview | **removable** |
| **Supabase** | Postgres database, auth, storage | **keep** — load-bearing |
| **Vercel** | Hosting, CDN, TLS, preview deploys | **keep** — load-bearing |

Supabase and Vercel are real infrastructure and are not coupled to Bolt in any
meaningful way. **Only Bolt is removable — and removing it costs almost nothing,
because the code is already a portable Vite/React repo.**

His Claude reaches Bolt through a **Bolt connector**, which is exactly the extra
hop:

```
before:   Claude → connector → Bolt workspace → Supabase / Vercel
after:    Claude → GitHub repo → Vercel
                        ↘ Supabase
```

## Why GitHub as the source of truth

Beyond removing a hop, this is what makes **collaboration** possible. You cannot
review, branch, diff, or contribute to a Bolt workspace. You can do all of that
to a repo. Once the app lives in GitHub with you as a collaborator, you can
actually help — review changes, push fixes, run the app locally.

It also gets him: real version history, rollback, PR review, CI if he ever wants
it, and no lock-in.

## The path

1. **Inventory** the app before changing anything — framework, dependencies, env
   vars, external services, current deploy target.
2. **Export** from Bolt (it has *Push to GitHub*; otherwise download the project).
3. **Make it a real repo** — `git init`, a correct `.gitignore`, push to a
   private GitHub repo. Grep for committed secrets *before* the first commit.
4. **Prove it runs outside Bolt** — `npm install && npm run dev`. Fix anything
   that assumed the Bolt WebContainer environment.
5. **Move env vars** into `.env.local` (gitignored) plus a committed
   `.env.example`.
6. **Verify Supabase ownership and RLS** (see the warning below).
7. **Point Vercel at the GitHub repo** so pushes to `main` deploy. Keep the old
   deployment alive until the new one is proven.
8. **Add you as a collaborator.**
9. **Disconnect the Bolt connector.** Work in the repo from then on.
10. **Write a `CLAUDE.md`** so the repo explains itself to a collaborator.

## Three things that commonly bite

### Supabase project ownership

**Bolt can provision the Supabase project.** If it did, the project may sit in an
organization he does not fully control, which is a problem the day he wants to
leave or add a teammate. Step 6 exists to find this out early — transferring a
project later is more painful than checking now.

### Row Level Security

AI-generated Supabase schemas frequently ship with RLS disabled or with a
permissive `using (true)` select policy for `anon`. On a table holding user data
that is a **live data leak**, not a style issue. It should be audited table by
table, and reported rather than silently "fixed" — changing a policy without
understanding the read paths can break the app.

The same concern applies to this landing page's waitlist table; the correct
insert-only policy is in [../CLAUDE.md](../CLAUDE.md).

### DNS

If Bolt deployed through its own Netlify integration, DNS for
`app.clubhouseplacement.com` points there. Repointing DNS is the last step, after
the Vercel deploy is verified — not the first.

## What not to do

- **Don't refactor during the migration.** The only goal is moving hosting and
  source control with **zero behaviour change**. Mixing a refactor into this
  makes it impossible to tell whether a break came from the move or the edit.
- **Don't delete the Bolt project** until every checkpoint passes. It is the
  rollback.
- **Don't commit `.env`.** Ever.

---

## Appendix — the prompt to hand over

Fill in `<GITHUB_USERNAME>` first.

> Migrate this Bolt project to GitHub as the single source of truth, then remove
> Bolt from the loop. Work in order and stop to confirm with me at each numbered
> checkpoint.
>
> 1. **Inventory first, change nothing.** Report the framework and version, the
>    full dependency list, every environment variable the app reads, which
>    external services it calls (Supabase, Vercel, anything else), and where it
>    is currently deployed. Do not modify files yet.
> 2. **Get the code out of Bolt.** Use Bolt's "Push to GitHub" if available;
>    otherwise export/download the project. The goal is a complete working tree
>    on disk, outside Bolt.
> 3. **Make it a real repo.** `git init`, add a proper `.gitignore` for this
>    framework (must include `.env*`, `node_modules`, build output), commit, and
>    push to a new **private** GitHub repo. Before the first commit, grep the
>    tree for committed secrets — API keys, tokens, service-role keys, connection
>    strings. If any exist, tell me and do not commit them.
> 4. **Prove it runs outside Bolt.** `npm install && npm run dev`. Fix whatever
>    breaks — Bolt-generated projects sometimes assume the WebContainer
>    environment. Confirm the app boots and the main flows work locally before
>    continuing.
> 5. **Handle environment variables properly.** Create `.env.local` (gitignored)
>    for local dev and a committed `.env.example` documenting the names with
>    placeholder values. Confirm the Supabase **anon/publishable** key is the
>    only Supabase key in client-side code. If a **service-role** key appears
>    anywhere client-side, flag it immediately as a security problem and stop.
> 6. **Verify Supabase ownership and security.** Tell me which Supabase
>    organization and project this app uses, and whether it was provisioned by
>    Bolt or created by me — if Bolt owns it, I need to transfer it. Then audit
>    Row Level Security on every table: report which tables have RLS enabled and
>    list the policies. Any table holding user data that `anon` can `select` is a
>    data leak — report it, don't silently change it.
> 7. **Move deploys onto Git.** Connect the GitHub repo directly to Vercel so
>    pushes to `main` deploy automatically, and set the environment variables in
>    the Vercel project settings. Confirm a deploy triggered by a git push
>    succeeds and the deployed app works. Do not delete the old Bolt-managed
>    deployment until this is verified.
> 8. **Add my collaborator.** Add GitHub user `<GITHUB_USERNAME>` as a
>    collaborator with write access.
> 9. **Cut Bolt out.** Once 4 and 7 both pass, disconnect the Bolt connector from
>    Claude. From here on, work in this repo directly — read files, edit, commit,
>    push — never through Bolt.
> 10. **Write it down.** Create `CLAUDE.md` in the repo covering: what the app
>     does, the stack, the file layout, how to run it locally, the env vars
>     needed, the Supabase schema and RLS posture, and how deploys work. This is
>     what makes the repo self-explanatory to a collaborator.
>
> Constraints: don't refactor, restyle, or "improve" application code during this
> migration — the only goal is moving hosting and source control without
> behavior changes. Keep the Bolt project intact until every checkpoint passes,
> as a rollback. Ask before anything destructive.
