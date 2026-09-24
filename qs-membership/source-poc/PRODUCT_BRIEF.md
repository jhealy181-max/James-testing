# QS Strategic Intelligence — product strategy and web-app build brief

**Version:** Proof of concept brief, 24 September 2026  
**Audience:** Product owner, engineering lead, design, QS data owners, membership and editorial teams.  
**Use:** Give this file and the accompanying runnable app to a coding agent (for example, Claude Code) as the implementation brief. Preserve the working flows before replacing the demo architecture.

## 1. Product proposition

Build a subscription service for university leaders that makes QS evidence useful between major research releases, rankings cycles, conferences and consulting engagements. A member should return because the service helps with an active decision and gives them a credible peer community, not just because another article has been published.

**Core promise:** “Understand what is changing, compare your institution with relevant evidence, learn what peers are doing, and act with a practical framework.”

**Primary users**

| Persona | Decisions to support | Typical return trigger |
| --- | --- | --- |
| Vice-chancellor / provost | Portfolio, reputation, international positioning, partnerships | Monthly executive briefing; peer roundtable |
| Strategy / planning director | Peer benchmarking, institutional priorities, scenarios | QS performance evidence; usable decision framework |
| International / recruitment director | Source-market risk, recruitment, TNE and partner choice | Student-flow update; risk and compliance group |
| Research / reputation leader | Research visibility, collaboration and evidence interpretation | Rankings cycle; reputation working group |
| Employability / careers leader | Employer demand, outcomes and skills partnerships | Skills update; employer collaboration group |
| Digital / academic innovation leader | AI governance, assessment, EdTech and new provision | AI capability tool; practical working group |

**Four durable domains**

1. **Global talent & mobility:** where learners and talent come from and go; student flows, destination markets, recruitment, TNE, risk and compliance.
2. **Institutions & reputation:** ranking indicators, academic and employer reputation, research performance, peer comparison and institutional strategy.
3. **Skills, jobs & outcomes:** labour markets, future skills, graduate outcomes, employers and public/private partnerships; effects of AI on work.
4. **Innovation & new models:** responsible AI and assessment, EdTech providers, digital infrastructure, online and alternative models; distinguish leadership, faculty, student and industry audiences.

Content may carry several domain, geography, audience and use-case tags. The four domains are navigation and editorial ownership structures, not four separate silos.

## 2. Engagement model and strategic themes

### Theme A — turn one-off engagement into sustained membership

**What members do:** Join an enduring group, register for smaller sessions, see a named coordinator, follow an action between meetings, and reconnect at QS events. An institution names a membership lead and members choose personal interests.

**Rankings and reputation hook:** Use QS rankings and performance evidence to frame questions and identify relevant comparison groups. Facilitate voluntary peer exchange on research strategy, international collaboration, student experience and employer links. Focus on genuine institutional improvement and visibility. Group membership, networking or survey discussion must not affect rankings editorial decisions or imply an ability to manipulate academic/employer survey responses.

**Recruitment and TNE hook:** Dedicated groups on student recruitment risk/compliance and cross-border partnerships. Share patterns and operating practices; avoid sharing named prospective-student data or competitively sensitive institution-specific pricing and plans.

**Service operations:** Coordinator recruits delegates, runs cadence, prepares pre-reads, records decisions and follows up. A group has a charter, audience, minimum active members, quarterly output and a clear joining path. An annual forum brings outputs back to the wider QS audience.

**POC now:** Named illustrative groups and coordinators, joining/leaving by demo tier, opt-in institution directory and unsent peer-request drafts.  
**Production next:** real sign-in, invitations, institution verification, coordinator inbox, meeting registration, moderation, group workspace, recordings, opt-in contact and consent records.

### Theme B — make content and frameworks usable

**What members do:** Search by a decision they face, open a framework, see steps and questions, compare cases, download a worksheet and assign an action. Each major research asset should have an executive summary and an application layer.

**Content object:** title, abstract, decision question, domain(s), geography, audience, level, format, source owner, published/updated date, rights, citation, related QS datasets, related working group, related event, next action and review date.

**Initial collections:** (1) rankings-to-strategy interpretation guide; (2) international market prioritisation canvas; (3) recruitment risk and compliance checklist; (4) TNE partner evaluation; (5) skills and employer partnership playbook; (6) AI Capability Framework / Assessments; (7) EdTech pilot evaluation; (8) recorded briefings and prior conference sessions. Link to existing QS products where full material cannot be embedded.

**POC now:** searchable public QS resources, case-study and video links, sample executive briefs.  
**Production next:** structured framework pages with downloadable templates and editorial review, permission-aware recording and document library, citation and version history.

### Theme C — role-relevant, current market intelligence

**What members do:** Set role, interests, geographies, peer sets and frequency. The same editorial object powers an in-app feed, weekly/monthly newsletter and monthly executive briefing. Show source, as-of date, analyst interpretation, why it matters, suggested action and confidence/limitations where appropriate.

**Signal-to-action flow:** source published or QS dataset refreshed → ingestion and rights check → tagging → analyst review → role/interest matching → app feed → digest/briefing → engagement signals → editorial feedback. News alone is a weak product; each item should answer “what should I investigate or decide?”

**POC now:** feed ordered by matching role and chosen domains, source/date labels and sample badges; newsletter preference is saved. Feed is a static curated snapshot.  
**Production next:** ingestion pipeline, QA queue, human editorial sign-off, configurable email service, triggers on dataset changes and embargo controls.

### Theme D — institution and individual account spaces

**Institution page:** public-to-members name, country, description, strategic priorities, ranking/reputation questions, collaboration interests, opt-in peer visibility, verified QS identity, institutional delegates, entitlements, event-ticket balance and group participation. Owner/admin edits with audit trail in production.

**Individual page:** job role, functional persona, domain/geographic interests, newsletter choice, saved resources, groups, roundtables, event bookings, institutional entitlement and account role. The institution can set named seats and revoke a delegate.

**POC now:** add/edit institution pages without approval, add example delegates, switch demo user, update profile and interests, see tier and group rights.  
**Production next:** identity, verified institutions, delegated access, seat management, seat cap enforcement, account provisioning and audit logs.

## 3. QS data integration — specific opportunities

| QS asset | Member use case | POC status | Production integration requirement |
| --- | --- | --- | --- |
| World University Rankings Dataset / Performance Datasets | Institution and peer trend views, indicators, strategic discussion prompts | Public product-page links only | Approved dataset/API/export, identity mapping, licences, version/embargo, rights per institution |
| QS ranking cycle and public methodologies | Explain indicator changes, timeline and relevant guidance | Public links or editorial guidance | Structured updates; methodology version visible alongside data |
| Global Student Flows and recruitment datasets | Source-to-destination trends, scenario and market prioritisation | Public reports and product links | Approved access to licensed cuts, geography/country definitions, scenario date and caveats |
| International Student Survey | Student motivations and destination choices | Descriptive public links | Aggregation thresholds, field definitions and permitted segmentation |
| World Future Skills Index and labour-market products | Skills and employer priorities | Public index link | Approved aggregate feeds and dimensional mapping to jobs, skills, regions |
| AI Capability Framework, Assessments, Responsible AI Consortium | Institutional assessment and peer learning | Public pages linked | Consent-based institution assessment results; strict separation of private responses from peer view |
| QS events, case studies and conference recordings | Connected event discovery and reuse | Public event/video links | Agenda/session topic ingestion, rights to stream recordings, RSVP/ticket integration |

**Recommended data design:** `SourceRegistry` (owner, licence, refresh, embargo); `InstitutionIdentity` (QS ID, domain-specific IDs, canonical name); `DatasetRelease` (edition, methodology, as-of); `Metric` (value, unit, cohort, missingness, allowed audience); `Insight` (analyst interpretation and source lineage); `Entitlement` (org, user, product, expiry); `AuditEvent`. All displays must state edition and source; never show a licensed indicator merely because a member has general portal access.

**Editorial boundary:** Membership activities, peer introductions, events and consultancy are operationally separate from QS ranking calculations and survey administration. Do not let institution administrators edit QS metrics; do not imply that participation improves rank.

**Data rights boundary:** QS’s public analytics terms describe ownership and licence limits for dataset use. Confirm internal QS rights and contracts before exposing subscribed or pre-release data in this portal. The initial build must retain source links and avoid copying full licensed datasets into a demonstrator.

## 4. Functional scope by release

| Area | Runnable POC in this ZIP | Pilot release after build | Scaled release |
| --- | --- | --- | --- |
| Identity | Demo switcher, no password | SSO, verified institution and delegated admin | Provisioning and renewals via CRM |
| Institution pages | Create/edit with SQLite; opt-in directory | Verification, ownership, audit, permissions | Federation and institutional analytics |
| Member profiles | Save role, interests and newsletter preference | Entitlements, seat caps, consent | Personal relevance learned from usage |
| Peers | View opt-in profiles; unsent request drafts | Moderated introductions and messaging | Recommended peer cohorts and projects |
| Groups | Join/leave; coordinator names | Real coordinator workflow, RSVP, actions | Annual outputs and member impact |
| Intelligence | Role/domain sorting of seeded material | Curated feeds, newsletter and editorial CMS | Data-change triggers and recommendations |
| QS data | Public page links, no licensed metrics | One approved data slice, release controls | Multi-product insight layer and benchmarking |
| Events | Official QS links and indicative topic tags | Session-level calendar and member bookings | Ticket pool, check-in and recordings |
| Commercial | Illustrative Bronze/Silver/Gold | Contract-backed entitlements and usage | Renewal recommendations and CRM reporting |

**Explicit POC boundaries:** no authentication, no approval on creating organisations, no real sending, no real subscription payments, no QS data warehouse connection, no automatic newsletter dispatch. SQLite persists while the same Replit filesystem persists; production must use a managed durable database. Avoid entering real personal or commercially confidential information.

## 5. User journeys and acceptance criteria

1. **Create institution:** From Institution pages, a user creates a name, country, priorities, ranking questions, collaboration text, visibility and demo tier. The new page immediately appears, can be edited, and survives a server restart using the same database path.
2. **Add delegate:** From the institution page, create a delegate; switch demo identity; profile and tier reflect the correct institution.
3. **Tailor feed:** Select role and interests; feed prioritises matching source items; search and domain filters work; sample items are marked and outbound links open a source page.
4. **Join group:** Silver/Gold delegate joins/leaves a group and sees membership on the individual page; Bronze receives a server-side 403 for joining.
5. **Find peers:** Only institutions with peer visibility enabled show in the network; requesting an introduction creates a draft, never a sent message.
6. **Follow evidence:** A QS data asset links to its public page, with no fabricated ranking figures or unpublished student-flow values.
7. **Events:** List has QS calendar links; topic matches clearly say “illustrative” until agendas are mapped.

## 6. Technical implementation brief for the next coding pass

This ZIP is a working Python-standard-library POC (`main.py`, `static/`, `.replit`). Use it to validate the flow. Then evolve without breaking the above journeys:

1. Replace the monolithic demo server with a maintainable web framework and typed services. A reasonable Replit implementation is React/TypeScript frontend + Node API + managed PostgreSQL, or Django with templates. Keep project importable and provide migrations, environment samples and a single Run command. Do not put QS licensed data or secrets in the repository.
2. Add institutional and personal identity: QS SSO/IdP integration design, org admin and member roles, verified institution mapping, permission checks on every API route, invitation expiry, audit logs and session security. Never ship demo identity switching in a public production app.
3. Move domain, group, content and events data from code seeds into admin-editable tables. Build an editorial CMS with drafts, review, publication, expiry, provenance and rights metadata. Provide a moderator console for peer requests and group messages.
4. Build source adapters behind interfaces: QS rankings/performance, student flows/recruitment, skills, AI assessments, public QS content and conference programme. Confirm each source owner, lawful use, refresh cadence, edition, licence, institution mapping and permitted audience before ingestion. A failed feed retains a visible last-updated date; it never silently masquerades as live.
5. Add a recommendation layer with explicit, explainable inputs (role, chosen domains, geography, institution priorities, entitlements). Start rules-based; log why an item is shown. Add email distribution only after consent, deliverability and unsubscribe flows are defined.
6. Implement contracts and entitlements separately from dataset licences. Bronze/Silver/Gold in this concept are hypotheses to test; confirm actual pricing, seats, event pool rules, consortium overlap and whether QS already sells overlapping content.
7. Preserve responsive design, keyboard navigation, accessible labels and safe rendering. Add integration tests for identity boundaries, group entitlements, institution visibility, content rights and draft-vs-sent state.

**Current API:** `GET /api/bootstrap`, `GET /api/health`; `POST /api/organizations`; `PATCH /api/organizations/:id`; `POST /api/people`; `PATCH /api/people/:id`; `POST|DELETE /api/groups/:groupId/members/:personId`; `POST /api/peer-requests`. All data mutations are POC-only. Code and schema are in `main.py`.

## 7. Operating model and resource estimate

The point of this product is a repeatable service, not a static portal. Indicative staffing below assumes a modest pilot across 10–20 founding institutions, four domains and 6–8 working groups. These are planning assumptions, not approved headcount.

| Theme | Pilot roles / indicative capacity | Ongoing responsibility |
| --- | --- | --- |
| Product & commercial | Product lead **1.0 FTE**; commercial/pricing **0.25–0.5** | Proposition, tier tests, sales feedback, product KPIs, renewal offer |
| Community & working groups | Membership operations lead **1.0**; two coordinators **2.0**; QS experts **0.5–1.0 shared** | Onboarding, agenda, moderation, follow-up, peer introductions, group outputs |
| Content & frameworks | Managing editor **1.0**; analyst/subject editors **2.0**; multimedia/design **0.25–0.5** | Editorial calendar, source interpretation, reusable decision tools, quality review |
| Data & intelligence | Data product owner **0.5–1.0**; data engineer **1.0**; analysts **1.0–2.0 shared** | Approved feeds, source lineage, tagging, freshness, methodology and rights |
| Platform & experience | Full-stack engineer **2.0**; product designer **0.5–1.0**; QA/security **0.25–0.5 shared** | App, identity, CMS, entitlements, integrations, security and uptime |
| Customer success / GTM | Account/membership manager **1.0**; marketing ops **0.25–0.5** | Institution adoption, seats, newsletter and event activation, renewals |

**Indicative pilot total:** around **14–18 FTE-equivalents** if all listed activities operate concurrently, including shared specialist time; avoid treating every shared role as a new dedicated hire. A narrower **6–8 FTE-equivalent** pilot is possible by limiting integrations to one approved dataset, using existing QS editorial and events functions, and running four rather than eight groups. Confirm overlap with QS consulting, rankings data sales, events and the Responsible AI Consortium before final staffing.

**Accountabilities:** Product owns prioritisation and value; QS data owners approve use and methodology; editorial owns interpretation; membership owns facilitation and coordination; technology owns identity, access and reliability; commercial owns packaging; QS rankings governance retains independent control of methodology and results.

## 8. Sequence and learning plan

| Period | Deliverable | Evidence / decision gate |
| --- | --- | --- |
| Weeks 1–2 | Validate 10–15 leader journeys; map QS data owners and existing member programmes; agree four domain leads | Prioritised problems, 10 founding-institution candidates, data-rights inventory |
| Weeks 3–6 | Pilot app: accounts, institution pages, curated feed, 4 working groups, 20 usable assets, one QS data slice if approved | Five institutions onboarded and using the same repeatable workflows |
| Weeks 7–10 | Coordinator cadence, newsletter, peer introductions, QS event mapping, framework downloads | Repeat monthly active usage; group participation and return visits |
| Weeks 11–12 | Test willingness to pay, tier boundaries, renewal story and costs per institution | Go/no-go on wider build and pricing experiment |

**Pilot measures:** 30-day institution activation; percentage with two or more active delegates; repeat monthly active delegates; briefing open-to-action rate; working group join and attendance; follow-up completed; framework use; requested peer introductions; event crossover; role relevance feedback; renewals or explicit willingness to pay. Track dataset rights and content freshness as quality measures, not only clicks.

## 9. Design principles and known decisions still needed

- Show the member’s active work on the first screen; make resource discovery, group joining and institution editing obvious.
- Every claim carries a source and as-of date. Distinguish published QS evidence from examples, inferences and forecasts.
- Prioritise usable frameworks, peer action and evidence; do not fill the site with generic news.
- Allow multiple people per institution with separately managed role, interests and access; the institution owns membership.
- Make consent and visibility explicit for peer pages, coordinator contact and introductions.
- Clarify whether the Responsible AI Consortium remains its own membership or is cross-entitled; avoid accidental double selling.
- Confirm pricing, seat limits, geographic scope, editorial cadence, QS dataset rights, event-ticket accounting and existing platform integrations with named QS owners before production.

## Sources checked for this brief

Public QS: [World University Rankings Dataset](https://www.qs.com/solutions/world-university-rankings-dataset), [Performance Datasets](https://www.qs.com/solutions/performance-datasets), [Student Recruitment Datasets](https://www.qs.com/solutions/student-recruitment-datasets), [Global Student Flows](https://www.qs.com/insights/global-student-flows-report), [AI Capability Assessments](https://www.qs.com/en-us/solutions/ai-capability-assessments), [Responsible AI Consortium](https://www.qs.com/solutions/responsible-ai-consortium), [conference calendar](https://www.qs.com/conferences/conference-calendar), and [QS Analytics and Datasets Terms](https://www.qs.com/terms-and-conditions/qs-analytics-terms). The [Digital Education Council working groups](https://www.digitaleducationcouncil.com/thematic-working-group) informed the group format; the proposed QS groups are original concepts. [Replit's ZIP import guide](https://docs.replit.com/getting-started/quickstarts/import-to-replit) supports this packaging.
