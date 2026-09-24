# QS One: handover brief for a new Claude chat

**Paste or upload this file at the start of a new chat.** It summarises the work done so far so the next chat can continue without the original conversation. Two companion files carry the full detail:

- `QS_One_Strategy.html`: Stage 1 product strategy (executive document)
- `QS_One_Build_Brief.html`: Stage 2 build brief for the Replit proof of concept
- `qs-one-replit.zip` (supplied separately): Stage 3 working app

Status as of 24 September 2026: all three stages are complete. The names, prices and packages are **illustrative hypotheses** to test in a pilot, not QS offers.

---

## 1. The brief I was working to

Build a proof of concept for a **membership-style offering for QS**, in line with the "shifting value in the media ecosystem" argument. The value should come from:

- **B2B monetisation**: institutional subscriptions plus high-value **corporate partnerships**
- **user connections and bespoke networks**
- content that is both **member-generated** and **centrally produced by QS**, tailored to executives

It should connect to QS's wider strategy and to its **conferences and summits**. It should also scrape relevant public QS content, starting with **Global Student Flows** for the recruitment domain.

Decisions already made:

- **Name:** QS One
- **Tech:** React front end plus Node back end, packaged as a ZIP that runs on Replit with one click
- **QS content:** read public qs.com pages live, show the source and date of each read, and fall back to a labelled saved copy if a page can't be read
- **Corporate partners:** sector-agnostic, meaning anyone aiming to reach senior institutional decision-makers
- **Documents:** HTML, written for an executive audience

## 2. Source material used

1. **QS Authority Strategy** (QS Corporate Development working paper, "Owning the information authority", June 2026):
   - the information-value spectrum (bands 1–5: benchmark, operating data, authority verdict, expert insight, audience and convening), with QS in band 3 and the need to move towards the more valuable bands
   - three horizons: H1 education core (student demand and mobility intelligence, TNE); H2 skills, work and talent; H3 emerging sectors
   - peer cases: Semafor (~60% of revenue from sponsor-funded convening), Politico Pro (~90% renewal), Gartner, Legal Benchmarking Group, Bloomberg, MSCI and others
2. **The Next Disruption of Information** (QS strategy point of view, July 2026, after Doug Shapiro):
   - AI makes analysis close to free; verified numbers, contributed data, provenance, workflow embedding, convening and trust in methodology remain scarce
   - Gartner fell 50% in 2025 because seat-based "insight" is exposed
   - five playbook moves: sell the mirror; build the give-to-get rail; price the flow, not the seat; become the machine's ground truth; claim the next benchmark
   - governance is the licence to operate: when the ranked party pays, the ranking is exposed (Chirikov, 2022)
   - sector shocks: Canadian study permits −48% (2024); US F-1 visas −36% (summer 2025); 45% of English providers in deficit
3. **Earlier "QS Strategic Intelligence" proof of concept** (Python/SQLite) and its `PRODUCT_BRIEF.md`: four domains, personas, working groups, data-rights boundaries and a pilot staffing estimate.

## 3. Stage 1 strategy in brief

**Proposition:** QS One is a verified, year-round network of university decision-makers. It combines QS evidence, peer data and QS convening in one member workspace. Institutions pay because it helps with live decisions; partners pay because it is the most credible way to build relationships with the people who make those decisions. It is a **decision network, not a content subscription**.

**Four domains** (the organising spine):

1. Global talent & mobility
2. Institutions & reputation
3. Skills, jobs & outcomes
4. Innovation & new models

**Target clients:**

| Buyer | Who | Role |
| --- | --- | --- |
| Institutional members | Internationally ambitious universities; fast-growing universities in Asia, the Middle East, Latin America and Africa; specialist and business schools; TNE operators | Core recurring revenue |
| Corporate partners | EdTech/SIS/CRM/LMS, cloud and AI platforms, pathway and recruitment providers, student housing, banks and fintech, employers, consultancies, publishers, testing bodies, destination agencies | High-value B2B revenue; turns one-off summit sponsors into annual partners |
| System & consortium buyers | Ministries and agencies (e.g. with ranking-linked goals such as Saudi Vision 2030), alliances, scholarship bodies | Largest single deals |
| Individual Fellows | Leaders whose institution is not yet a member | Route in towards institutional membership |

Users inside member institutions include vice-chancellors and provosts, and heads of strategy, international recruitment, research, careers and digital.

**Seven modules in three layers:**

- **Connect:** ① Leader Profiles & Directory (verified; introductions only with both sides' consent) · ② Circles (Domain Circles, curated Peer Circles of 8–12 institutions, Regional Chapters aligned to summits, private networks for alliances)
- **Know:** ③ Intelligence (QS Signals with a "so what" and a suggested action, executive briefings, data stories, frameworks, summit digests) · ④ Member Exchange (practice notes, questions and answers) · ⑤ Pulse Benchmarks (give to get: see results only after contributing; groups under 5 hidden)
- **Meet & transact:** ⑥ Convene (summit matchmaking, closed roundtables, virtual sessions, Members' Forum) · ⑦ Partner Hub (labelled partner content, partner-hosted roundtables, a Challenge Board where institutions post problems and partners propose pilots)

**Trust labels on every item:** QS Evidence · QS Analysis · Member Practice · Pulse (with n and date) · Partner.

**Summits as the heartbeat of the cycle:**

- Before (6 weeks out): priming and matchmaking
- During: closed roundtables and live Pulse
- After (2 weeks): digest, follow-ups and onboarding of trial users
- Between summits: Circles and virtual roundtables

Delegates convert into members and sponsors into annual partners. Regional Chapters follow the QS calendar: Americas (Guadalajara, 30 Sep–2 Oct 2026), Asia Pacific (Bali, 3–5 Nov 2026), Middle East (Abu Dhabi; **dates conflict across QS pages, so check them**), Reimagine Education (London, 6–8 Dec 2026) and Global Skills Week (Washington, D.C., 23–25 Mar 2027).

**Fit with QS strategy:**

- On the value spectrum, QS One strengthens convening (the least automatable activity) and moves towards operating data (Pulse and decision tools).
- It is the distribution and test bed for H1 (student demand and mobility, TNE) and a bridge to H2 (employers as partners).
- It maps to all five playbook moves.
- HolonIQ is the natural engine for Signals.

**Commercial model (illustrative):**

- Institutions, priced for the whole institution rather than per seat:
  - **Network £15k**: intelligence, Exchange, Pulse headline results, 2 introductions a quarter
  - **Leadership £40k**: the core offer; adds Domain Circles, Chapters, Pulse cohort cuts, roundtables and 4 summit passes
  - **Council £85k**: adds the Executive Council, a private Peer Circle, a bespoke benchmark, 10 passes and 20 analyst hours
- System and consortium buyers: from £150k. Individual Fellows: £1.2k.
- Partners:
  - **Insight £60k+**: profile, 1 labelled briefing a quarter, 2 roundtables, Challenge Board
  - **Domain £175k+**: named domain partner (maximum 2 per domain), co-developed research with QS keeping editorial control, aggregated priorities insight
  - **Principal £400k+**: multi-year, all domains, Members' Forum headline partner, pilot programme
- What partners never get: contact details without opt-in, personal data, influence over editorial or rankings, or content presented as QS's own.
- Illustrative scale in year 3 is about **£8.2m ARR**, a scenario rather than a forecast:
  - 120 institutions: £4.7m (40 Network, 60 Leadership, 20 Council)
  - 19 partners: £2.4m (12 Insight, 5 Domain, 2 Principal)
  - 3 system deals: £0.6m
  - 400 Fellows: £0.5m
- Pilot year: about £0.5–0.8m. For comparison, QS revenue was about £50m in 2023.

**Independence Charter (six rules):**

1. No bearing on rankings
2. Contributed data is ring-fenced
3. Partner content is always labelled
4. Members control who contacts them
5. Every claim shows its source
6. Independent oversight

**Roadmap:**

- Oct 2026: validate the concept at the Americas summit
- Nov 2026: launch a founding group of 15–20 institutions and 3 partners at the Asia Pacific and Middle East summits
- Dec 2026 – Mar 2027: operate
- Go/no-go decision at Global Skills Week, Mar 2027
- Pilot team: 6–8 FTE

**Measures:**

- Institutions:
  - ≥70% activated within 30 days
  - ≥3 active leaders per institution
  - ≥50% of leaders active monthly
  - ≥60% contribute to Pulse
- Partners: renewal and conversion
- Across the loop: delegate → member and sponsor → partner conversion

**Risks and how they're handled:**

- Perceived conflict with the rankings → the Charter
- An empty network at launch → launch at summits
- Partners crowding out members → caps and opt-in
- Cannibalising QS data sales → the membership acts as a shop window for licensed data
- Overlap with the Responsible AI Consortium → it becomes a Circle
- Data protection and competition law → minimum cohort sizes and legal review

**Decisions requested from leadership:** endorse the positioning; approve the pilot; mandate the Charter; name owners for the domains and data; agree the partner rules; confirm fit with the Responsible AI Consortium, HolonIQ, consulting and sponsorship.

## 4. Stage 2 build brief in brief

**What the demo must prove in 10 minutes:**

1. A decision network rather than a list of articles
2. Pulse give-to-get works
3. Live QS evidence for Global Student Flows
4. Two paying sides, with members in control
5. Tiers enforced on the server
6. Summits as the heartbeat of the cycle

**Replit approach:** upload at replit.com/import, choose ZIP and press Run.

- The front end is pre-built into `public/`.
- The server uses only Node's standard library (no runtime dependencies).
- The JSON-file database seeds itself on first run.

**QS content reading:**

- 21 public qs.com pages plus the QS Insights listing.
- Recruitment is covered most deeply: the Global Student Flows report and hub; UK, US, Europe and Australia/New Zealand editions; Student Recruitment Datasets; ISS and ISS China; UK recruitment and US 2026 insights; and a Global Student Flows case study.
- Rules followed: robots.txt checked first; one request at a time; short excerpts plus a link; no licensed data.
- Refreshes every 12 hours and on demand.
- Each item is labelled **Live** / **Last read (refresh failed)** / **Saved copy (24 Sep 2026)**.

**Published figures shown:**

- The three Global Student Flows scenarios: Regulated Regionalism, Hybrid Multiversity and Talent Race Rebound
- About 4% annual growth in demand; about 8.5m internationally mobile students by 2030
- 80+ markets; 15 drivers (push, pull and disruption)
- ISS: 45% of students consider four or more universities; affordability and visas act as filters; social media up 8 points since 2022
- ISS China: employment options up 11 points, post-study work up 14 points; cost cited by 38% (vs 30% in 2022)

**Demo personas** (all fictional):

| Persona | Organisation | Tier |
| --- | --- | --- |
| Jordan Price | University of Northbridge, UK | Council |
| Wei Lin Tan | Lumen University of Technology, Singapore | Leadership |
| Dr Fatima Al Mansoori | Al Noor University, UAE | Council |
| Dr Amara Okafor | Savanna University, Kenya | Network |
| Sam Rivera | Atlas EdTech | Domain Partner |
| Maya Chen | QS One team | Staff |

**Acceptance results** (headless browser, run against the ZIP):

- Passed:
  - fresh start
  - all 20 screens render with no errors or horizontal scrolling on a 390px phone
  - Pulse give-to-get and hiding of small groups
  - tier locks
  - introductions with consent
  - partner boundaries
  - fallback to saved copies
  - page parsing
- **Not yet confirmed:** live reading from qs.com. The build environment's network policy blocked the site, so this needs checking on Replit via the "QS data sources" page.

**Path to production:** QS single sign-on and verified institutions; a managed database; approved QS data feeds with rights, edition and embargo metadata plus an editorial CMS; legal review of Pulse; email and calendar with consent; entitlements from the CRM; a session-level events feed; later, attributed API/MCP access.

## 5. The app (Stage 3) at a glance

- `server/index.js`: API with tier, consent and give-to-get rules, activity log and static file serving
- `server/seed.js`: fictional data
- `server/sources.js`: QS page reader
- `server/snapshot.js`: source list and saved summaries
- `server/store.js`: JSON database
- `client/src`: React source (Vite); `public/`: built output; `.replit`: runs `npm start` on Node 20, port 3000
- Screens: Home · Intelligence and the briefing reader · Domain hubs (Mobility/Global Student Flows is the richest) · Exchange · Pulse · Circles · Network and Introductions · Convene · Partner Hub (Partners, Challenge Board, Leader priorities) · Profile · Institution pages · Membership and the Charter · QS data sources · Team console
- Guardrails for anyone extending it:
  - add no runtime npm dependencies at the root
  - rebuild `public/` after changing the client (`npm run build`)
  - enforce access rules in the server
  - label every item with its source and date
  - keep the demo data fictional

## 6. Open questions and suggested next steps

1. Confirm that live QS reading works on Replit. If qs.com blocks it, agree an approved feed with QS data owners.
2. Confirm the dates of the Middle East summit.
3. Test pricing and packages with 10–15 leaders at the Americas summit.
4. Decide how QS One relates to the Responsible AI Consortium, HolonIQ, consulting and summit sponsorship packages.
5. Name owners for each domain and for the data, plus a membership lead. Draft the Independence Charter with rankings governance.
6. Possible next outputs:
   - a QS-branded board deck
   - a one-page partner prospectus
   - a founding-member invitation
   - a financial model workbook
   - interview guides for pilot research
   - more Pulses (e.g. TNE partner selection)
