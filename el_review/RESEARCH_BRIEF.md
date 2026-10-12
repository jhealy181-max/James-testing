# Experiential learning review: research brief (shared by all research agents)

## Research question
Where does the institution provide structured opportunities for students to work **collaboratively** on **substantive projects** connected to **real external employers/organisations**, and how widely is this embedded across the institution?

## Tool constraint (important)
This environment's network policy blocks direct page fetching: **WebFetch fails for every host**. Use **WebSearch** only.
- `mode: "standard"` for discovery (cheap). Use `mode: "extended"` to retrieve detailed verbatim extracts from a specific page you need as evidence (handbook entries, module pages, scheme pages). Extended results quote page text and name the page URL — that quoted text is your evidence.
- Every source you cite must be a URL that appeared in a search result, with a quoted or closely paraphrased extract that the search result attributes to that URL. **Never invent URLs, partner names, numbers or quotes.** If you could not obtain an extract, say so.
- Record `retrieval: "search-index extract"` for each source (pages were not opened directly). Note the handbook/page year shown in the URL or extract (e.g. handbook.unimelb.edu.au/2024/...). An older-year handbook supports design but not current delivery.
- Budget: aim for roughly 12–25 searches per institution. Prefer targeted `site:` queries. Stop following a lead once you have enough to classify it or it is clearly irrelevant.

## Three criteria — assess each separately as "Yes" / "No" / "Unclear"
- **Yes** = explicit supporting evidence. **No** = evidence establishes the criterion is NOT met. **Unclear** = evidence insufficient. Missing evidence is "Unclear", not "No".
- **A. Project-based**: a substantive bounded project with a defined problem/brief/research question and identifiable output (consultancy report, prototype, design, campaign, software, business analysis, client presentation). Lectures/workshops/talks/visits/networking = No. Placement/internship = No unless a project component is evidenced.
- **B. Group working**: students work together as a team on the project/joint output. Same class, employer mentor, supervisor collaboration, or working alongside colleagues on an individual placement do NOT count. If the scheme has both individual and group routes, split into separate route records; if you cannot separate them, mark Unclear and explain.
- **C. Employer/external-organisation connected**: documented participation by a real external organisation — supplies a live brief/problem/data; commissions the work as client; participates in supervision/mentoring/feedback/assessment; or receives the students' outputs/presentation. Record exactly how. Generic "industry relevance", employer-informed curricula, hypothetical clients, teaching cases, guest speakers, logos = not sufficient.
  - `partner_type`: "Business/commercial" | "Public sector" | "Charity/community" | "Mixed" | "Other" | "Unclear" | "None". Public-sector/charity live clients CAN satisfy C, but must be typed separately. Do not call community engagement "business" unless evidenced. Academic research groups/internal university departments as "client" → partner_type "Other" (internal) and say so; internal university clients do not satisfy C (mark C = No or Unclear accordingly, explaining).
- All three must apply to the **same scheme and participation route**. Do not stitch evidence across different modules/pages.
- Simulations, virtual work-experience (e.g. Forage/Bright Network/Practera simulations without a live client), case competitions with only a sponsor-written case and no client engagement → be strict; note what the organisation actually does. A case competition where a real company sets its own live problem and judges solutions can satisfy C; record it as extracurricular/selective.

## What to prioritise
Live-client consultancy modules; employer-sponsored group capstones; industry project units; multidisciplinary employer challenge programmes; student consulting clinics/societies run by the university; applied research/design projects for external organisations; group enterprise projects addressing a real client brief; structured employer-linked projects embedded in degrees; substantive extracurricular employer project programmes.

## Do NOT count automatically (test the underlying activity instead)
Breadth/elective schemes; interdisciplinary curricula; employability awards/skills passports; generic WIL frameworks; internships/placements/volunteering/service-learning; independent dissertations; entrepreneurship centres/incubators; careers services; simulations/virtual work experience. These are leads: find the specific underlying project activity and test it. If nothing qualifies, put them in `exclusions` with the reason.

## Search coverage required for every institution
Document searches in each area (status "Searched", "Not applicable" if the institution has no such faculty, or "Not searched" with reason):
1. `central` — central education/experiential learning/careers/employer-engagement provision
2. `business` — business/management school
3. `engineering_computing`
4. `science`
5. `arts_humanities_social_sciences`
6. `other` — law, health, design, architecture etc. where present
Useful queries: "[Uni] student consultancy live client"; "site:[domain] industry project team"; "site:[domain] capstone external partner"; "site:[domain] group project client brief"; "site:[domain] multidisciplinary employer challenge"; "site:[domain] sponsor student project"; "[Faculty] project module handbook"; "[Scheme] eligibility assessment credits". EU: also local-language terms (e.g. German "Praxisprojekt Unternehmen Studierende Team", Dutch "praktijkopdracht opdrachtgever studenten", French "projet tutoré entreprise étudiants équipe", Swedish "projektkurs företag studenter", Danish "virksomhedsprojekt studerende", Finnish "yritysprojekti opiskelijat", Spanish/Catalan "proyecto empresa estudiantes equipo", Italian "progetto aziendale studenti team"). Keep official names; add English translation.
Do not stop after one scheme. Find all distinct relevant routes discoverable this way — but don't inflate (no splitting annual cohorts, client examples or different webpages of the same scheme). Use parent–child where an umbrella contains distinct modules (`parent_local_id`). Prefer the most widely available routes and those embedded in degrees; for large institutions with dozens of departmental capstones, record the main distinct ones per faculty and note in `gaps` that further departmental instances likely exist.

## Academic reach (controlled)
"University-wide" (explicitly open across the institution, subject to stated restrictions) | "Cross-faculty" (multiple specified faculties, no evidence of institution-wide access) | "Faculty/school" | "Programme/course" (named degrees/courses/modules) | "Unclear".
Central careers hosting ≠ university-wide. Faculty hosting ≠ faculty-only (check eligibility). University-wide access ≠ universal participation. A compulsory module in one degree is "Compulsory within specified programmes", not university-wide compulsion.

## Operating status (controlled)
"Current delivery confirmed" (evidence of delivery/enrolment/handbook for 2025/26 or 2026/27, or dated recent cohort) | "Announced/forthcoming" | "Historical delivery only" | "Paused/discontinued" | "Current status unclear" (e.g. undated page). Record `latest_evidenced_year` separately (e.g. "2025/26", "2026"). A live page ≠ current delivery.

## Participation data
Only if published: give number, unit (places / participants / teams / projects / cumulative), and year. Never infer.

## Legacy rows
You are given the institution's rows from the previous research (`legacy_rows`). For each, either (a) reassess it as a scheme record (set `legacy_ref` to its legacy name), or (b) put it in `exclusions` with `legacy: true` and the reason. Every legacy row must be traceable in your output.

## Output — write ONE JSON file per institution to `/home/user/James-testing/el_review/results/<INST_ID>.json`
Write it as soon as that institution is done (before starting the next). Valid JSON, UTF-8. Schema:
```json
{
  "inst_id": "AU02",
  "institution": "Melbourne",
  "review_status": "Complete | Partial",
  "partial_remaining": "what remains if Partial, else ''",
  "research_date": "2026-10-12",
  "search_log": {
    "central": {"status": "Searched", "queries": ["..."], "key_sources": ["url", "..."], "finding": "one or two sentences"},
    "business": {...}, "engineering_computing": {...}, "science": {...}, "arts_humanities_social_sciences": {...}, "other": {...}
  },
  "schemes": [
    {
      "local_id": "S1",
      "parent_local_id": null,
      "is_umbrella": false,
      "official_name": "", "english_name": "", "module_code": "",
      "description": "Specific: what students actually do, with whom, producing what.",
      "academic_reach": "University-wide | Cross-faculty | Faculty/school | Programme/course | Unclear",
      "admin_host": "", "eligible_faculties_programmes": "",
      "faculty_areas": ["central|business|engineering_computing|science|arts_humanities_social_sciences|other"],
      "student_level": "Undergraduate | Postgraduate taught | Postgraduate research | Mixed | Unclear",
      "year_of_study": "", "eligibility_restrictions": "",
      "participation_requirement": "Compulsory for all students | Compulsory within specified programmes | Optional/elective | Selective/competitive | Unclear",
      "curricular_status": "Curricular | Extracurricular | Mixed | Unclear",
      "credit_assessment": "", "duration": "", "delivery_format": "",
      "project_based": "Yes|No|Unclear", "project_evidence": "brief, cite source no.",
      "group_working": "Yes|No|Unclear", "group_evidence": "",
      "employer_connected": "Yes|No|Unclear", "employer_evidence": "exactly how the organisation participates",
      "partner_type": "Business/commercial | Public sector | Charity/community | Mixed | Other | Unclear | None",
      "partner_role": "", "named_partners": "only if evidenced, with year",
      "deliverable": "",
      "operating_status": "Current delivery confirmed | Announced/forthcoming | Historical delivery only | Paused/discontinued | Current status unclear",
      "latest_evidenced_year": "",
      "participation_data": "",
      "unresolved": "",
      "legacy_ref": "legacy scheme name if this reassesses a legacy row, else ''",
      "sources": [
        {"n": 1, "url": "", "title": "", "section": "page section / subpage / PDF page", "pub_year": "handbook or publication year if shown, else 'undated'", "accessed": "2026-10-12", "retrieval": "search-index extract", "extract": "short quote or precise paraphrase", "supports": ["project","group","employer","reach","eligibility","participation","status","credit"]}
      ]
    }
  ],
  "exclusions": [
    {"name": "", "legacy": true, "category": "Breadth/interdisciplinary curriculum | Employability award | WIL framework | Placement/internship | Volunteering/service-learning | Dissertation/research | Entrepreneurship/incubator | Careers service | Simulation/virtual | Event/competition without live client | Near-miss: not group | Near-miss: no external org | Near-miss: not project | Evidence gap | Other",
     "reason": "specific reason against criteria A/B/C, or what evidence is missing", "source_url": "", "status_note": ""}
  ],
  "embeddedness": "Institution-wide approach | Several distributed routes | Isolated departmental provision | No qualifying scheme verified | Unclear",
  "profile_md": "Concise Markdown profile (120–300 words): what relevant provision was found; how the important schemes operate; who can participate / compulsory?; how employers/clients contribute; isolated vs distributed vs institution-wide; what remains uncertain. Specific, no generic employability language. Write 'No qualifying scheme verified through the documented search' rather than 'has no schemes'.",
  "gaps": "material gaps / unresolved questions"
}
```
Put schemes that fail a criterion (a "No") either in `schemes` (if a near-miss worth showing with full assessment) or in `exclusions`. Schemes with Unclear values belong in `schemes` (they will be classified "evidence incomplete").

## Quality checks before writing each file
- Every "Yes" has an explicit source extract supporting it (cite source n in the evidence text).
- The three criteria refer to the same route. Individual projects are not marked as group. Simulations are not marked as live employer projects.
- University-wide reach is supported by eligibility evidence; compulsory participation is scoped accurately.
- Umbrella and child routes are linked via parent_local_id and the umbrella marked `is_umbrella: true` (umbrellas are not counted separately when children exist).
- Current-delivery claims are supported by dated evidence.
- No fabricated URLs, partners, numbers or quotes.
