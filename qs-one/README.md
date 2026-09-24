# QS One: proof of concept

A working demo of **QS One**, the QS membership network for university leaders and the partners who work with them. It has a React front end and a Node back end, with no sign-in and fictional demo data.

## Run it on Replit (about 2 minutes, no coding)

1. Open <https://replit.com/import>, choose **ZIP file**, and upload `qs-one-replit.zip`. The files should appear at the top level of the project, with `package.json` and `.replit` side by side.
2. When the project opens, press **Run** at the top.
3. The app appears in the **Webview** panel. Click the "open in new tab" icon for a full-size window.

That is all. There is nothing to install and no API keys. The front end is already built (`public/`), and the server uses only Node's standard library.

> If Replit asks which language or template to use, choose **Node.js**. If the Run button does nothing, type `npm start` in the Shell tab and press Enter.

## What to try

Use **View as** in the top bar to switch between demo people:

| Person | Organisation | What they show |
| --- | --- | --- |
| Jordan Price | University of Northbridge (Council member) | The full member experience: Pulse, Circles, introductions |
| Wei Lin Tan | Lumen University of Technology (Leadership) | Cohort cuts, regional chapter |
| Dr Fatima Al Mansoori | Al Noor University (Council) | Executive and system view |
| Dr Amara Okafor | Savanna University (Network tier) | What is locked at the entry tier |
| Sam Rivera | Atlas EdTech (Domain Partner) | Partner Hub, Challenge Board, leader priorities |
| Maya Chen | QS One team | Team console, activity log, data reset |

Suggested walkthrough, about 10 minutes:
1. **Home → Mobility hub**: the Global Student Flows scenarios, key figures and QS pages read live from qs.com.
2. **Pulse → 2027 international recruitment outlook**: answer, then see peer results unlock (give to get). Try a region filter to see small groups hidden.
3. **Circles**: join a Circle, then switch to Dr Amara Okafor (Network tier) and see it locked.
4. **Network → Request introduction**, then switch person and accept it under **Introductions**.
5. **Convene**: mark "I'm attending" for the Asia Pacific summit, see suggested meetings, and reserve a roundtable.
6. Switch to **Sam Rivera** (partner): **Partner Hub → Challenge Board → Propose a pilot**, and **Leader priorities**.
7. Switch back to Jordan Price: **Partner Hub → Challenge Board**, then shortlist or select the proposal.
8. **QS data sources**: see which pages were read live, and press **Refresh from qs.com**.

## Live QS content

When the server starts, and every 12 hours after that, it reads about 20 public qs.com pages (Global Student Flows, the International Student Survey, recruitment datasets, events and others). It keeps short excerpts with a link back and records the time of each read. It checks robots.txt and sends one request at a time. If a page can't be read, the app shows a **saved copy** dated 24 Sep 2026 and labels it that way. Nothing is ever presented as live when it isn't.

Settings (Replit → Secrets, or the `[env]` section in `.replit`):
- `QS_LIVE_FETCH=0` turns live fetching off (saved copies only).
- `QS_REFRESH_HOURS=6` changes how often pages are refreshed.

## Resetting demo data

Switch to **Maya Chen → Team console → Reset demo data**. Alternatively, stop the app, delete `data/db.json` and press Run again.

## Changing the front end (optional)

The React source is in `client/src`. After editing it, run `npm run build` in the Shell. This installs React and Vite into `client/` and rebuilds `public/`. Then press Run.

## Files

| Path | What it is |
| --- | --- |
| `server/index.js` | API, tier and consent rules, static file server |
| `server/seed.js` | Fictional institutions, people, partners, Circles, Pulses, events, content |
| `server/sources.js` | QS page reader: robots.txt check, parsing, cache, fallback |
| `server/snapshot.js` | List of QS sources and their saved summaries |
| `server/store.js` | JSON-file database (`data/db.json`) |
| `client/` | React source (Vite) |
| `public/` | Built front end served by the server |

## Limits of this proof of concept

- **No authentication.** Anyone with the link can switch people and change demo data. Don't enter real personal or confidential information.
- No emails, calendar invites or payments are sent or taken.
- All institutions, people and partners are fictional. The QS content is public and linked to its source. No licensed QS data is included.
- The JSON-file database is fine for a demo. Production would need a managed database, single sign-on, verified institutions and approved QS data feeds (see the Stage 2 build brief).
