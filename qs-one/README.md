# QS One: proof of concept (v2.1, real QS content)

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
| Dr Amara Okafor | Savanna University | Network (free) | Free library, a 3-item preview of the curated feed, open sessions, onboarding to become an active institution |
| Sam Rivera | Atlas EdTech | Commercial partner | Partner board and leader priorities; no Pulse results |
| Maya Chen | QS | Community coordinator | Pin and hide stories, banner messages, add videos, content sources; Team view |

## Ten-minute walkthrough

1. **Jordan → Pulse → Recruitment Pulse (October).** Answer the survey. Your deposits by market then appear against the peer median (amber vs grey), with the four status cards: strongest, weakest, most improved and largest decline since September.
2. Change **Select cohort** to a region. Small groups are hidden below five institutions.
3. **Communities → Student Recruitment & International Office.** Read the discussion, then post a use case.
4. **Wei Lin (Member)** → All communities: a second domain community is locked.
5. **Amara (free)** → Intelligence: every story is free to read, but **For you** shows only the top three. Register for an open session; see that introductions need Member; then **Membership → Invite colleague** to become an active institution.
6. **Fatima (Council)** → Pulse → Select cohort → Bespoke peer cohort. Then request a concierge introduction.
7. **Sam (partner)** → Partner board → Propose a pilot. Pulse results stay locked.
8. **Membership → Plans & benefits → Switch** tier to watch access change.
9. **Maya (QS team)** → Intelligence → Latest: **Pin** a story and **Hide** another. Media library → **Add a video**. Team view → **Banner messages** → post one; everyone sees it at the top.

## Real QS content: newsletters and magazine

Intelligence has no made-up articles. It shows real stories read from **QS Newsletters** (newsletters.qs.com) and **QS Insights Magazine** (magazine.qs.com):

- **Newsletters** are read from the public RSS feed (full text, images and embedded video). Each issue is split at its headings into separate stories: a Mid Week Brief becomes several articles. Promotional blocks (register, book now, use code) are skipped. Chart of the Day and Power Moves stay whole.
- **Magazine**: the latest 3 editions are found from the magazine home page. Each article listed on an edition's Cover page becomes one story, with its images and videos.
- Every story is **tagged** by theme (17 themes in the four QS One domains), region and format, using keyword rules. Claude tagging is the next step (see the requirements document).
- The first read starts about 3 seconds after you press Run and takes a few minutes. After that it checks every 6 hours. The QS team can also press **Content sources → Check for new content**.
- The **library is free** for everyone. **For you** (the feed curated by your interests, regions and recency) is included from Member.
- Articles show in full in the app, with a link back to the original and the date it was published. If an article can't be read fully, the app says so and links to it.

The app also still reads about 20 qs.com data pages (Global Student Flows, the International Student Survey and others) for Pulse and evidence, with a saved copy if a page can't be read.

**If no stories appear after five minutes**, open **Content sources** as Maya Chen. It shows what each source returned and any errors. These sites may change their layout or block automated reading; the parser rules live in `server/ingest.js`.

Settings (Replit **Secrets**, all optional):

| Setting | Default | What it does |
| --- | --- | --- |
| `INGEST_HOURS` | 6 | How often to check for new content |
| `MAGAZINE_EDITION_COUNT` | 3 | How many recent magazine editions to read |
| `MAGAZINE_EDITIONS` | (auto) | Read exact editions instead, e.g. `46,40` |
| `NEWSLETTER_RSS_PAGES` | 3 | Pages of the newsletter feed to read (about 15 posts each) |
| `DIGEST_SIGNUP_URL` | newsletters.qs.com sign-up | Where "Sign up for the weekly digest" goes |
| `NEWSLETTER_BASE`, `MAGAZINE_BASE` | the QS sites | Point at a different site, e.g. for testing |
| `QS_LIVE_FETCH` | 1 | `0` turns all live reading off |
| `QS_REFRESH_HOURS` | 12 | How often qs.com data pages are refreshed |

Content is stored in `data/content.json`. Delete it and press Run to read everything again from scratch.

## Reset demo data

Switch to **Maya Chen → Team view → Reset demo data**, or delete `data/db.json` and press Run. This resets the fictional members and Pulse data; it doesn't touch the QS content.

## Changing the front end (optional)

Edit `client/src`, then run `npm run build` in the Shell and press Run.

## Limits

No sign-in (the person selector stands in for MyQS single sign-on). No emails, invitations or payments are sent. All institutions, people and partners are fictional. Articles are QS's own public newsletter and magazine content, shown with attribution and a link back; check rights before any external use. Videos are added by link (file upload needs storage and is a later phase). Prices are indicative.
