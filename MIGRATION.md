# MIGRATION.md — Netlify → Cloudflare (DNS + hosting) and Google Workspace mail recovery

Written 2026-10-22 from three parallel investigations (live DNS diagnosis, hosting research,
DNS/email recovery research), then revised after an independent review (deploy gating, tooling
pinning, DMARC reporting, trailing-slash links, diagnosis wording). Nothing has been changed yet — every step below is to be done
by the owner (or with Claude for the repo steps in Phase 2).

---

## 1. Diagnosis — what is actually broken

| Fact | Evidence |
|---|---|
| Domain is **not expired**. Registrar = **namespace.ge**, created 2026-07-28, expires 2031-07-29, status `Ok`. | `whois -h whois.nic.ge assa-abloy.ge` |
| The .ge registry still delegates the domain to **Netlify DNS** (`dns1–4.p07.nsone.net`). | `dig NS assa-abloy.ge @ns1.nic.ge +norec` |
| Those nameservers still answer authoritatively, but the zone is **empty** — only SOA (`domains+netlify.netlify.com`) and NS. No A, MX, TXT; `www` = NXDOMAIN. | `dig MX assa-abloy.ge @dns1.p07.nsone.net` → NOERROR, 0 answers |
| Netlify could still write to the zone on **2026-09-26** (it renewed the wildcard cert via a DNS challenge that day). That proves the zone was managed then — **not** that the mail records were still in it. Outage window: some time after the zone stopped being managed, most likely late Sept–Oct 2026. | Certificate Transparency logs |
| **No DNSSEC** (no DS record at the registry) → nameservers can be switched freely, nothing to remove first. | `dig +trace` shows NSEC3, no DS |
| The email provider **is Google Workspace** (Google recognises the domain as a Workspace customer). | `google.com/a/assa-abloy.ge` → AccountChooser |

**Root cause:** the domain still points at a Netlify DNS zone that has been emptied of records.
The zone shell (created 2026-07-28, the day the domain was registered) still exists on Netlify's
nameservers. *How* it got emptied — account lost, team deleted, records removed — can't be seen
from outside, and it doesn't change the fix. Website → "could not resolve host".
Email → no MX and no A record, so most sending servers **bounce** mail to `info@assa-abloy.ge`
straight away; a few treat it as temporary and retry for up to ~5 days. Practically: mail sent
during the outage is lost and senders got bounce notices, though a handful of recent messages may
still trickle in once MX is restored.

(The empty zone may linger in someone's Netlify team. It becomes irrelevant once the nameservers
point to Cloudflare, but if the domain is ever added to Netlify again, Netlify support may need to
release it first.)

**Fix in one sentence:** change the domain's nameservers at namespace.ge to Cloudflare, re-create
the Google mail records there, and host the site on Cloudflare.

The old record values are **not recoverable** (Netlify zone is empty, no public history exists).
That's fine: every value can be obtained fresh from Google Admin, and the website records are
created automatically by Cloudflare.

---

## 2. Decision — why Cloudflare (Workers static assets + Cloudflare DNS, Free plan)

| | Cloudflare Workers | Cloudflare Pages | Vercel Hobby | GitHub Pages |
|---|---|---|---|---|
| Free for a **commercial** site | ✅ | ✅ | ❌ (non-commercial only; Pro = $20/mo) | ⚠️ ToS discourages business use |
| Per-path `Cache-Control` headers | ✅ `_headers` | ✅ `_headers` | ✅ `vercel.json` | ❌ none |
| 404 page | ✅ | ✅ | ✅ | ✅ |
| Free DNS hosting | ✅ | ✅ | — | — |
| Edge server in **Tbilisi** | ✅ | ✅ | ❌ | ❌ |
| Git push → auto-deploy + previews | ✅ | ✅ | ✅ | Actions only |

- DNS has to be rebuilt *somewhere* anyway, and Cloudflare's free DNS + hosting in one account
  is the simplest setup. `.ge` works fine on Cloudflare (myauto.ge, ss.ge, tkt.ge use it).
- **Workers rather than Pages:** Cloudflare's own docs and Astro's deploy guide now say "start
  new projects on Workers". Pages would also work identically for this site.
- ⚠️ **25 MiB per-file limit.** `public/catalogue/assa-abloy-catalogue-2024.pdf` is 23.9 MiB —
  it fits, but a larger future catalogue would fail to deploy (then: compress it, or move
  `/catalogue/` to Cloudflare R2).

---

## 3. The plan

Order matters: **email first** (it's the urgent, revenue-affecting part and doesn't depend on
the website), website second. Phases 0–1 can be done in one sitting (~1 hour of work + 1–4 h waiting).

### Phase 0 — Secure access (do this before anything else)

1. **namespace.ge** — log in to the account that holds `assa-abloy.ge`.
   - ⚠️ If the account / reset email is `info@assa-abloy.ge`, password reset **can't arrive**
     (mail is down). In that case contact namespace.ge support directly from a personal address
     or by phone (**support@namespace.ge**, **0322 196 500**) and ask them either to change the
     nameservers on your written request (allowed by .ge rules §5.5.1) or to change the contact
     email. Expect an ID check.
2. **Google Admin** — sign in at <https://admin.google.com> as the super admin.
   Signing in does **not** depend on your DNS, so this works even now.
   - Billing → Subscriptions: confirm Workspace is **active** (not suspended for billing).
     If it was bought via namespace.ge (they resell Workspace), billing is with them.
   - If you can't sign in and no recovery phone/email is set, Google's recovery asks you to add
     a DNS record — so do Phase 1 steps 1.2–1.6 first (skip 1.1 and 1.3's DKIM record for now), then come back.
3. **Create a Cloudflare account** at <https://dash.cloudflare.com/sign-up>
   - Use a **personal email that is NOT `@assa-abloy.ge`** (e.g. a Gmail). Otherwise the next
     DNS problem locks you out of the very account that fixes DNS — the same trap as now.
   - Turn on 2FA immediately and save the backup codes offline.
4. **GitHub** — confirm you have admin on `github.com/ASSA-ABLOY-Georgia/landing`.

### Phase 1 — Move DNS to Cloudflare and restore email

**What this phase does, in plain words.** The internet asks "who answers for `assa-abloy.ge`?" and
the .ge registry currently replies "Netlify's servers" — which are empty. You will:

1. copy the email settings out of Google (they're the source of truth),
2. build a new, complete DNS "phone book" for the domain on Cloudflare,
3. tell the registry (via namespace.ge) "Cloudflare answers for this domain now".

Until step 3 nothing changes for the outside world, so steps 1–2 are safe to do slowly and redo.

**Before you start**
- Open a plain text file (Notes / TextEdit) — the "worksheet" — to paste values into as you go.
- You'll use three browser tabs: **Google Admin**, **Cloudflare**, **namespace.ge**.
- Time: ~45 min of clicking, then 1–4 h of waiting (rarely up to 24 h).
- Menu labels below are from each provider's docs as of Oct 2026. If a label differs slightly,
  look for the closest match — the structure rarely changes.

---

#### Step 1.1 — Copy the email values from Google Admin  *(tab: Google Admin)*

Sign in at <https://admin.google.com> with the super-admin account.

**A. Check the domain (and get the verification value if needed)**
1. Top-left **☰ Menu** → **Account** → **Domains** → **Manage domains**.
2. Find `assa-abloy.ge` in the list. Look at its status:
   - **Domain verified: Verified** → nothing to copy; skip Record 4 in step 1.3. Go to B.
     (Seen 2026-10-22: this is the case for assa-abloy.ge.)
   - **Email setup status: Action needed** → expected while the MX record is missing; it clears by
     itself after step 1.6. Don't click "Activate" before then. Leave the automatic
     `assa-abloy.ge.guest.google` and `assa-abloy.ge.test-google-a.com` rows alone — never
     deactivate the test alias: mail to `info@assa-abloy.ge.test-google-a.com` should still reach
     the `info@` mailbox during the outage, which makes it an emergency address. Confirm with a
     test mail before giving it out.
   - *Verify domain* / *Not verified* → click it, choose the **TXT record** method, and copy the
     value that starts with `google-site-verification=` into your worksheet as **VERIFICATION**.
     Close the dialog without clicking "Verify" — DNS isn't ready yet.

**B. Get the DKIM key** (the digital signature that stops your mail landing in spam)
1. **☰ Menu** → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email**.
2. In **Selected domain**, choose `assa-abloy.ge`.
3. If the page already shows a **DNS Host name (TXT record name)** and a **TXT record value**,
   copy both. Otherwise click **Generate New Record** → **Key bit length: 2048** →
   **Prefix selector: `google`** → **Generate**, then copy both.
4. Worksheet:
   - **DKIM NAME** = the host name, normally `google._domainkey`
   - **DKIM VALUE** = the long text starting `v=DKIM1; k=rsa; p=…` — copy **all** of it (it's ~400 characters)
5. ⚠️ Do **not** click **Start authentication** yet. That's step 1.7.

Your worksheet should now contain: DKIM NAME, DKIM VALUE, and maybe VERIFICATION.

---

#### Step 1.2 — Add the domain to Cloudflare  *(tab: Cloudflare)*

1. Log in at <https://dash.cloudflare.com> (the account from Phase 0).
2. In the left sidebar, click **Domains** → **Onboard a domain**
   (on some accounts the button reads **Add a domain**). If you get an **"Add a site"** page with
   three cards, choose **Connect a domain** — *not* "Transfer a domain" or "Buy a domain".
   ⚠️ Not **Transfer domains** / **Register domains** (under *Domain Registration*) — those move the
   domain's *registration* to Cloudflare, which isn't possible for .ge. If you land there you'll see
   **".ge domains aren't supported yet"** → click **Add site anyway**, which is the right flow. The
   registration stays at namespace.ge; Cloudflare only runs the DNS.
3. Type `assa-abloy.ge` — just the bare domain, no `www`, no `https://`.
4. It asks how to get DNS records — **quick scan** or **enter manually**. Either is fine: the scan
   will find **nothing**, because the old Netlify zone is empty. That is expected, not an error.
   Click **Continue**.
5. Plan selection: scroll down to **Free** ($0) → **Continue**.
   (If it shows a list of scanned records, there will be none — **Continue**.)
6. Cloudflare now shows a page titled something like *"Update your nameservers"*, listing **two
   nameservers**, e.g. `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com` (yours will have
   different names). Copy both into the worksheet as **CF NS 1** and **CF NS 2**.
   - Don't do the registrar part yet — that's step 1.5.
   - You can always find these again: Domains → `assa-abloy.ge` → **Overview**.

The domain now exists on Cloudflare with status **Pending** (often shown as *Pending Nameserver
Update*). That's correct for now.

---

#### Step 1.3 — Create the email DNS records  *(tab: Cloudflare)*

**Where this is:** left sidebar **Domains** → click **`assa-abloy.ge`** (you're now "inside" the
domain; the sidebar changes) → in the sidebar click **DNS** → **Records**. You'll see an empty
record list and probably a yellow/blue banner about pending nameservers — ignore the banner.

**How the "Add record" form works**
- Click **Add record**. A row of fields opens. The first field, **Type**, is a dropdown; the
  other fields change depending on the Type you pick.
- **Name** is the part *before* `assa-abloy.ge`:
  - `@` means "the domain itself" (`assa-abloy.ge`). After saving, Cloudflare displays it as `assa-abloy.ge`.
  - `google._domainkey` becomes `google._domainkey.assa-abloy.ge` automatically.
    Don't type the domain yourself.
- **TTL**: leave on **Auto**.
- **Proxy status** (orange/grey cloud): only appears for A/AAAA/CNAME types. MX and TXT records
  have no cloud — there's nothing to set. (This is what "DNS only" meant in the old version of this plan.)
- Click **Save** after each record. Then **Add record** again for the next.

**Record 1 — MX (where incoming mail is delivered)**

| Field | Enter |
|---|---|
| Type | `MX` |
| Name | `@` |
| Mail server | `smtp.google.com` |
| TTL | Auto |
| Priority | `1` |

**Record 2 — TXT, SPF (which servers may send mail as @assa-abloy.ge)**

| Field | Enter |
|---|---|
| Type | `TXT` |
| Name | `@` |
| TTL | Auto |
| Content | `v=spf1 include:_spf.google.com ~all` |

**Record 3 — TXT, DKIM (the signature key from step 1.1 B)**

| Field | Enter |
|---|---|
| Type | `TXT` |
| Name | DKIM NAME from the worksheet — normally `google._domainkey` |
| TTL | Auto |
| Content | DKIM VALUE from the worksheet — paste the whole thing, starting `v=DKIM1;` |

If Cloudflare complains the value is too long (it normally accepts it as-is), split it into chunks
of ≤255 characters, each in double quotes, separated by a space: `"v=DKIM1; k=rsa; p=MIIB…" "…rest"`.

**Record 4 — TXT, Google verification** *(only if you got a VERIFICATION value in 1.1 A)*

| Field | Enter |
|---|---|
| Type | `TXT` |
| Name | `@` |
| TTL | Auto |
| Content | the whole `google-site-verification=…` value |

**Check: the Records list should now show exactly this** (3 or 4 rows):

| Type | Name (as Cloudflare shows it) | Content | Priority |
|---|---|---|---|
| MX | `assa-abloy.ge` | `smtp.google.com` | 1 |
| TXT | `assa-abloy.ge` | `"v=spf1 include:_spf.google.com ~all"` | — |
| TXT | `google._domainkey` | `"v=DKIM1; k=rsa; p=…"` | — |
| TXT | `assa-abloy.ge` | `"google-site-verification=…"` *(optional)* | — |

- Cloudflare shows TXT content wrapped in quotes — that's normal.
- **Must not exist:** a second MX, a second `v=spf1` record, or anything for `www`. Website records
  are created automatically in Phase 3.
- **Don't enable** Cloudflare **Email Routing** (sidebar → Email → Email Routing) — it would replace your
  MX record and break Gmail.
- DMARC comes later (step 1.8); email works without it.

---

#### Step 1.4 — Test the new records before going live  *(Terminal — optional but recommended)*

Cloudflare's nameservers already answer for your domain even while it's Pending, so you can test
them directly. In Terminal, replacing `ada.ns.cloudflare.com` with **CF NS 1** from your worksheet:

```sh
dig +short MX  assa-abloy.ge                   @ada.ns.cloudflare.com   # expect: 1 smtp.google.com.
dig +short TXT assa-abloy.ge                   @ada.ns.cloudflare.com   # expect: "v=spf1 include:_spf.google.com ~all"
dig +short TXT google._domainkey.assa-abloy.ge @ada.ns.cloudflare.com   # expect: "v=DKIM1; k=rsa; p=…"
```

If a line comes back empty, fix that record in step 1.3 before continuing.

---

#### Step 1.5 — Point the domain at Cloudflare  *(tab: namespace.ge)* — this is the actual switch

1. Log in to namespace.ge → your domains list → **`assa-abloy.ge`**.
2. Find the nameserver setting. It may be called **Nameservers**, **NS**, **DNS servers** or
   **Change DNS**. (Not to be confused with a "DNS records/zone editor" page — you want the
   *nameserver* setting.) If there's a choice like "namespace DNS / default" vs **custom
   nameservers**, choose **custom**.
3. You'll see the four current entries: `dns1.p07.nsone.net`, `dns2.p07.nsone.net`,
   `dns3.p07.nsone.net`, `dns4.p07.nsone.net`.
4. Replace them so that **only two** remain:
   - NS 1 → **CF NS 1** (e.g. `ada.ns.cloudflare.com`)
   - NS 2 → **CF NS 2** (e.g. `bob.ns.cloudflare.com`)
   - NS 3, NS 4 → **empty**. Any leftover `nsone.net` entry keeps Cloudflare stuck on Pending.
   - Type them exactly — no trailing dot, no `https://`.
5. **Save**. Some registrars send a confirmation email or SMS — complete it if asked.
   No DNSSEC step is needed (DNSSEC isn't enabled on this domain).

**If the panel won't let you, or you can't log in**, email **support@namespace.ge** (or call
**0322 196 500**) from the email address registered on the account:

> Hello, please change the nameservers of my domain **assa-abloy.ge** to exactly these two:
> `<CF NS 1>` and `<CF NS 2>`, and remove `dns1–dns4.p07.nsone.net`. Thank you.

---

#### Step 1.6 — Wait for Cloudflare to go Active  *(usually 1–4 h, up to 24 h)*

- In Cloudflare: Domains → `assa-abloy.ge` → **Overview**. There's a button to re-check the
  nameservers (labelled along the lines of **Check nameservers now**). When the switch is seen, the
  status changes from *Pending* to **Active** and Cloudflare emails you.
- Optional — watch it from Terminal:

  ```sh
  dig NS assa-abloy.ge @ns1.nic.ge +norec   # registry: should list your two *.ns.cloudflare.com
  dig +short NS assa-abloy.ge @1.1.1.1      # public resolvers catch up within ~4 h
  dig +short MX assa-abloy.ge @8.8.8.8      # expect: 1 smtp.google.com.
  ```

- To speed up the big public resolvers, clear their cache: <https://dns.google/cache> (enter
  `assa-abloy.ge`, type `MX`, then `NS`) and <https://one.one.one.one/purge-cache/>.
- ⚠️ Cloudflare deletes a zone that stays Pending for 28 days — don't leave step 1.5 half done.

**As soon as MX is visible publicly, mail to info@assa-abloy.ge is being delivered again.**

---

#### Step 1.7 — Turn on DKIM signing  *(tab: Google Admin)*

1. **☰ Menu** → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email** → domain `assa-abloy.ge`.
2. Click **Start authentication**. The status should become *"Authenticating email with DKIM"*.
3. If it says the record isn't found, wait an hour and retry. A banner saying you must update
   DNS records can linger up to 48 h even when the record is correct.
4. If you had a VERIFICATION value: **Account** → **Domains** → **Manage domains** → **Verify** on
   `assa-abloy.ge`.

---

#### Step 1.8 — Add DMARC via Cloudflare  *(tab: Cloudflare — after the zone is Active)*

DMARC tells receivers what to do with mail that fails SPF/DKIM, and sends you reports. Cloudflare's
free **DMARC Management** writes the record and collects the reports into a dashboard, so they
don't flood `info@`.

1. Domains → `assa-abloy.ge` → sidebar **Email** → **DMARC Management** → **Enable DMARC Management**.
2. It finds no existing DMARC record and offers to add one → **Add**.
3. Check DNS → Records: there's now a TXT record named `_dmarc` starting `v=DMARC1;` with a
   `rua=mailto:…` Cloudflare address. Make sure the policy is **`p=none`** (monitor only). If it
   isn't, click **Edit** on that record and change just that part to `p=none`.
4. First reports appear within ~24 h. Phase 4 tightens the policy after a few clean weeks.

---

#### Step 1.9 — Test email end to end

1. <https://toolbox.googleapps.com/apps/checkmx/> → enter `assa-abloy.ge` → **Run checks!** →
   MX, SPF and DKIM should show no errors. (A DMARC warning before step 1.8 is fine.)
2. From a **personal** Gmail, send a message to `info@assa-abloy.ge` → it should arrive.
3. From `info@assa-abloy.ge`, reply to that Gmail. In the personal Gmail, open the message →
   **⋮** (three dots) → **Show original** → the header box at the top should say
   **SPF: PASS**, **DKIM: PASS**, **DMARC: PASS**.
4. Optional: <https://www.mail-tester.com> → send to the address it shows → aim for 10/10.

---

#### Step 1.10 — Tell people

- Let important contacts know mail to `info@assa-abloy.ge` was bouncing (roughly late September –
  today) and ask them to resend anything important.
- Check where Web3Forms contact-form notifications go — if to `info@`, form submissions from that
  period were lost too.

**Phase 1 is done when:** Cloudflare shows `assa-abloy.ge` as **Active**, CheckMX is clean, a test
mail arrives in `info@`, and a reply shows SPF/DKIM PASS. Then go to Phase 3 (Phase 2 is already done).

### Phase 2 — Prepare the repo for Cloudflare (can run in parallel with Phase 1)

> **Status: done 2026-10-22** (uncommitted). Verified with `pnpm check`, `pnpm build` and
> `pnpm exec wrangler dev`: headers, 404, trailing-slash redirects, `aria-current`, form redirect.
> Rationale logged in `DECISIONS.md` D10.1–D10.5.

The repo changes can be made and tested locally at any time. **Deploying** waits for Phase 3,
which needs the zone Active. A handful of small changes, one commit. (Claude can make these on request.)

**a) Pin the tooling** (the old `netlify.toml` kept the build reproducible from the repo; keep that):

```sh
pnpm add -D wrangler          # pins wrangler in package.json + lockfile (no more "latest" via npx)
echo 24 > .node-version       # Node version for Cloudflare's build image, versioned with the code
```

and add `workerd` next to `esbuild` in `package.json`:

```json
"pnpm": { "onlyBuiltDependencies": ["esbuild", "workerd"] }
```

(pnpm 10 skips dependency install scripts unless allow-listed. Tested 2026-10-22: without this,
`pnpm add` warns `Ignored build scripts: workerd@…`. `wrangler dev` still worked on macOS in that
test, but allow-listing it is the supported setup and silences the warning.)

**b) New file `wrangler.jsonc`** (repo root) — static assets only, no adapter or Worker code needed:

```jsonc
{
  "name": "assa-abloy-ge",
  // Must not be newer than the installed workerd supports — "2026-10-22" was rejected as
  // "in the future and unsupported" by wrangler 4.151.3 / workerd 1.20261019 on 2026-10-22.
  "compatibility_date": "2026-10-15",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",        // serve dist/404.html with HTTP 404
    "html_handling": "auto-trailing-slash"   // /about → /about/ (matches Astro's dir output and old Netlify behaviour)
  },
  "routes": [{ "pattern": "assa-abloy.ge", "custom_domain": true }],
  "workers_dev": true,
  "preview_urls": true
}
```

⚠️ The `routes` entry makes `wrangler deploy` create the `assa-abloy.ge` custom domain, which
Cloudflare only allows on an **Active** zone. That's why deploying waits for Phase 3.

**c) New file `public/_headers`** — direct port of the `netlify.toml` `[[headers]]` rules
(Astro copies it into `dist/`; Cloudflare reads it and doesn't serve it):

```
# Rules that match the same path MERGE on Cloudflare and a header set twice is comma-joined,
# so these are kept non-overlapping (same principle as the old netlify.toml).
/_astro/*.css
  Cache-Control: public, max-age=31536000, immutable

/_astro/*.webp
  Cache-Control: public, max-age=31536000, immutable

# Not immutable — font filenames hash the source URL, not the bytes (see old netlify.toml note).
/_astro/fonts/*
  Cache-Control: public, max-age=604800, must-revalidate

/catalogue/*
  Cache-Control: public, max-age=86400, must-revalidate
```

**d) `astro.config.mjs`** — `site` currently reads Netlify-only env vars (`CONTEXT`, `URL`,
`DEPLOY_PRIME_URL`). Cloudflare doesn't set them, so it already falls back to the right value,
but hardcode it so a stray `URL` variable can never hijack canonicals/sitemap/form redirect:

```js
site: "https://assa-abloy.ge",
```

(and replace the Netlify comment above it). Preview deploys will then canonicalise to
production — which is what you want for SEO.

**e) Trailing-slash internal links.** Pages are emitted as `about/index.html`, and canonicals and
the sitemap already use `/about/`. But internal links are slashless, so every click costs a redirect
(307 on Cloudflare; Netlify did the same with a 301). Change them to the slashed form:
- `src/data/site.ts:18-20` — nav: `/about/`, `/products/`, `/contact/`
- `src/pages/index.astro:42,54,55,70,82,128`, `src/pages/about.astro:193`, `src/pages/products.astro:166`

Safe for the active-nav state: `isCurrentPath()` (`src/data/site.ts:60`) already normalises
trailing slashes.

**f) Clean-up of Netlify leftovers:**
- delete `netlify.toml`
- delete the local `.netlify/` folder and the `# Local Netlify folder` / `.netlify` lines in `.gitignore`
- `src/pages/robots.txt.ts:5` — comment says `site` is "environment-dependent on Netlify"; reword
  (the generated-robots approach itself is still right)
- `README.md` deploy section (it also still says the Web3Forms key is a placeholder — it isn't)
- any Netlify mentions in `AGENTS.md` / `PLAN.md` / `PROGRESS.md`

Verify locally: `pnpm build && pnpm exec wrangler dev` → open the printed URL, check pages, `/nope`
(should show 404), `/about` (should redirect to `/about/`), and `curl -sI` a CSS file for the
`Cache-Control` header.

### Phase 3 — Deploy the site and attach the domain

**Start only after Phase 1 step 1.6 shows the zone as Active.** Connecting the repo triggers a
deploy, and a deploy with the `routes` entry fails on a Pending zone.

1. Cloudflare → **Workers & Pages → Create → Import a repository** → connect GitHub →
   `ASSA-ABLOY-Georgia/landing`, branch `main`.
   - Build command: `pnpm build`
   - Deploy command: `pnpm exec wrangler deploy`
   - Non-production branch deploy command: `pnpm exec wrangler versions upload` (gives preview URLs)
   - Node comes from `.node-version`. If the build log shows the wrong pnpm version, add the
     build variable `PNPM_VERSION` = `10.34.5`.
2. **Apex domain:** the first deploy creates the `assa-abloy.ge` custom domain from the `routes`
   entry (DNS record + certificate are created for you). Check Worker → Settings → Domains & Routes;
   if it's missing, add it there (Add → Custom domain → `assa-abloy.ge`) and redeploy.
3. Smoke-test on the `*.workers.dev` URL as well as on `https://assa-abloy.ge` (the certificate
   can take a few minutes on first issue).
4. **www → apex redirect:**
   - DNS → Add record: type `AAAA`, name `www`, content `100::`, **Proxied** (orange cloud).
     (A placeholder — Cloudflare answers the request itself.)
   - Rules → **Redirect Rules** → Create → Single redirect, custom filter:
     - When: `(http.host eq "www.assa-abloy.ge")`
     - Then: Dynamic → `concat("https://assa-abloy.ge", http.request.uri.path)`, status **301**,
       **Preserve query string** on.
5. SSL/TLS → Edge Certificates → **Always Use HTTPS: On**. (HSTS later, once stable.)
6. Verify:

```sh
curl -sI https://assa-abloy.ge/                       # 200
curl -sI https://assa-abloy.ge/about                  # 307/308 → /about/
curl -sI http://www.assa-abloy.ge/products/           # 301 → https://assa-abloy.ge/products/
curl -sI https://assa-abloy.ge/nope                   # 404
curl -sI https://assa-abloy.ge/catalogue/assa-abloy-catalogue-2024.pdf | grep -i cache-control
```

7. Submit the contact form once → you land on `/contact/thanks/` and the notification arrives.
   If the Web3Forms account restricts allowed domains, make sure `assa-abloy.ge` is listed.

### Phase 4 — Hardening (so this never happens again)

- [ ] Cloudflare: 2FA on; add a **second Super Administrator** (Manage account → Members).
- [ ] Cloudflare: DNS → Records → **Export** the zone file; keep a copy outside Cloudflare
      (or commit it to a private place). This alone would have saved you this time.
- [ ] namespace.ge, Google Workspace, Cloudflare, GitHub: set **recovery emails/phones that are not
      on `@assa-abloy.ge`**.
- [ ] Google Workspace: add a second super admin; check the super-admin recovery settings.
- [ ] GitHub org: have at least two owners.
- [ ] Store all logins (registrar is the master key) in a password manager.
- [ ] After ~2–4 weeks of clean reports in Cloudflare DMARC Management (all legitimate mail
      passing SPF/DKIM), tighten DMARC to `p=quarantine`.
- [ ] Google Search Console: if the property was verified via DNS, re-verify; resubmit
      `https://assa-abloy.ge/sitemap-index.xml`.
- [ ] Optional: enable DNSSEC in Cloudflare (needs namespace.ge to accept a DS record) — only
      after everything is stable.

---

## 4. If something goes wrong

| Symptom | Cause / fix |
|---|---|
| Cloudflare zone stays "Pending" | nsone entries still at namespace.ge, or a typo in the Cloudflare nameservers. Compare with `dig NS assa-abloy.ge @ns1.nic.ge +norec`. |
| MX visible but mail still bounces | Resolver caches (up to 1 h for the old "no MX"). Flush caches (Phase 1 step 1.6) and wait. Check CheckMX. |
| Google says DKIM not found | Record name must be `google._domainkey` (Cloudflare appends the domain). Wait up to 48 h. |
| Custom domain fails to attach / deploy fails on the route | Zone not Active yet (wait for Phase 1 step 1.6), or a manual CNAME/A already exists on that name — delete it and retry. |
| `Compatibility date "…" is in the future and unsupported` | `compatibility_date` in `wrangler.jsonc` is newer than the installed workerd supports — set it to an earlier date. |
| Deploy fails "asset too large" | A file in `public/` exceeds 25 MiB — compress the PDF. |
| Wrong cache headers | Check `dist/_headers` exists after build; rules must not overlap. |
| Can't log in to namespace.ge | Support (support@namespace.ge, 0322 196 500); fallback registry contact info@nic.ge. |

## 5. Not verified (check while doing it)

- Exact menu names in the namespace.ge control panel.
- Whether Workers Builds picks up the pnpm version from `packageManager` (hence the `PNPM_VERSION` fallback).
- Whether Google Admin re-displays the existing DKIM key or you must generate a new one (either works).
