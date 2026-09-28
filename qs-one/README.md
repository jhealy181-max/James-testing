# QS One: proof of concept (v2)

A working demo of **QS One**, relaunched as a decision network for university leaders, not a recognition badge. It has four components: **Intelligence** (informs), **Communities** (solve), **Pulse** (measures) and **Connect** (introduces). They sit on one tier ladder: Network (free), Member, Member Plus and Council. The design follows QS Rankings Preview (MyQS).

## Run it on Replit (about 2 minutes, no coding)

1. Open <https://replit.com/import>, choose **ZIP file**, and upload `qs-one-replit.zip`. The files should appear at the top level of the project, with `package.json` and `.replit` side by side.
2. Press **Run**.
3. The app opens in the **Webview**. Use the "open in new tab" icon for a full-size window.

There is nothing to install and no API keys. The front end is pre-built (`public/`), and the server uses only Node's standard library.

> If the Run button does nothing, type `npm start` in the Shell tab and press Enter.

## Who to try (the selector in the top bar)

| Person | Institution | Plan | What it shows |
| --- | --- | --- | --- |
| Jordan Price | University of Northbridge (UK) | Member Plus (founding member) | The launch buyer: international recruitment. Pulse, the recruitment community, introductions |
| Wei Lin Tan | Lumen University of Technology | Member | One domain community; results by region and institution type |
| Dr Fatima Al Mansoori | Al Noor University | Council | Bespoke Pulse cohort, concierge introductions, Executive Council |
| Dr Amara Okafor | Savanna University | Network (free) | Locked briefings, open sessions, onboarding to become an active institution |
| Sam Rivera | Atlas EdTech | Commercial partner | Partner board and leader priorities; no Pulse results |
| Maya Chen | QS | Community coordinator | Team view: activation, contribution, activity log, reset |

## Ten-minute walkthrough

1. **Jordan → Pulse → Recruitment Pulse (October).** Answer the survey. Your deposits by market then appear against the peer median (amber vs grey), with the four status cards: strongest, weakest, most improved and largest decline since September.
2. Change **Select cohort** to a region. Small groups are hidden below five institutions.
3. **Communities → Student Recruitment & International Office.** Read the discussion, then post a use case.
4. **Wei Lin (Member)** → All communities: a second domain community is locked.
5. **Amara (free)** → Intelligence shows locked briefings. Register for an open session; see that introductions need Member; then **Membership → Invite colleague** to become an active institution.
6. **Fatima (Council)** → Pulse → Select cohort → Bespoke peer cohort. Then request a concierge introduction.
7. **Sam (partner)** → Partner board → Propose a pilot. Pulse results stay locked.
8. **Membership → Plans & benefits → Switch** tier to watch access change.

## Live QS content

The server reads about 20 public qs.com pages (Global Student Flows, the International Student Survey, recruitment datasets, events and others). It checks robots.txt, sends one request at a time, keeps short excerpts with a link back, and records when each page was read. If a page can't be read, the app shows a saved copy (24 Sep 2026) and labels it as such. See **Intelligence → QS data sources**.

Settings (Replit Secrets or `.replit` `[env]`): `QS_LIVE_FETCH=0` turns live reading off; `QS_REFRESH_HOURS` sets how often pages are refreshed (default 12).

## Reset demo data

Switch to **Maya Chen → Team view → Reset demo data**, or delete `data/db.json` and press Run.

## Changing the front end (optional)

Edit `client/src`, then run `npm run build` in the Shell and press Run.

## Limits

No sign-in (the person selector stands in for MyQS single sign-on). No emails, invitations or payments are sent. All institutions, people and partners are fictional. No licensed QS data is included. Prices are indicative.
