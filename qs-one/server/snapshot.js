// Saved fallback copies of public QS pages.
// Used whenever a live fetch fails (no network, page moved, blocked by robots.txt).
// Summaries were prepared on 24 Sep 2026 from QS's public pages via search. They
// describe the pages; they are not copies of licensed data. The live fetcher
// replaces them with text read directly from qs.com when it can.

export const SNAPSHOT_DATE = '2026-09-24';

export const SOURCES = [
  // ---- Global talent & mobility (recruitment) ----
  {
    id: 'gsf-report', domain: 'mobility', kind: 'Research report', priority: 1,
    url: 'https://www.qs.com/insights/global-student-flows-report',
    title: 'QS Global Student Flows',
    summary: 'An evidence-based framework setting out three scenarios for international education to 2030: Regulated Regionalism, Hybrid Multiversity and Talent Race Rebound.',
    excerpts: [
      'Regulated Regionalism: stricter national frameworks concentrate student mobility regionally. Traditional anglophone destinations (US, UK, Canada, Australia) may face tighter enrolment restrictions while emerging hubs in Asia and the Middle East expand their share.',
      'Hybrid Multiversity: digitally enabled, hybrid models combine local, remote and short international study phases, reflecting student demand for flexible, cost-effective pathways.',
      'Talent Race Rebound: a high-growth, globally competitive environment in which nations actively seek international students as future citizens and workers through structured immigration pathways.',
      'QS estimates global demand for international education continues to grow at roughly 4% a year this decade, reaching approximately 8.5 million internationally mobile students by 2030.'
    ]
  },
  {
    id: 'gsf-hub', domain: 'mobility', kind: 'Framework', priority: 2,
    url: 'https://www.qs.com/global-student-flows',
    title: 'Global Student Flows | QS',
    summary: 'Global Student Flows sets out 3 future scenarios and 15 key drivers shaping student mobility to 2030, combining student voices with macro-economic data to show where students are going and why.',
    excerpts: [
      'The framework groups drivers into push factors (conditions in home countries), pull factors (attractions of destinations) and disruption factors (external risks affecting source and destination countries).',
      'The approach combines an open-source framework, proprietary flow-mapping technology and scenario-based forecasting that simulates more than 4,000 source-to-destination flows.'
    ]
  },
  {
    id: 'recruitment-datasets', domain: 'mobility', kind: 'Data product', priority: 1,
    url: 'https://www.qs.com/solutions/student-recruitment-datasets',
    title: 'QS Student Recruitment Datasets',
    summary: 'Combines Global Student Flows forecasts across 80+ sending and receiving markets to 2030 with the QS International Student Survey of 100,000 prospective students’ goals, values and decision drivers.',
    excerpts: [
      'Use it to find new markets, understand student motivations and optimise recruitment campaigns.',
      'Licensed product: detailed market cuts are available through QS, not in QS One.'
    ]
  },
  {
    id: 'iss', domain: 'mobility', kind: 'Survey', priority: 2,
    url: 'https://www.qs.com/international-student-survey',
    title: 'QS International Student Survey',
    summary: 'The world’s largest survey of prospective international students, tracking what shapes their choice of destination and institution.',
    excerpts: [
      '45% of prospective international students consider four or more universities before deciding.',
      'Affordability and visa accessibility act as filters rather than selling points; students accept higher cost or complexity when the return on investment is clear.',
      'Social media has risen eight percentage points in importance since 2022, the largest increase of any information source.'
    ]
  },
  {
    id: 'iss-china', domain: 'mobility', kind: 'Market insight', priority: 3,
    url: 'https://www.qs.com/insights/international-student-survey-china',
    title: 'Student mobility and motivation: China',
    summary: 'How Chinese prospective students’ priorities have shifted since 2022, from ISS data.',
    excerpts: [
      'The importance of graduate employment options has risen 11 percentage points since 2022, and access to post-study work visas by 14 points.',
      '38% of students identified cost as important in 2026, compared with 30% in 2022.'
    ]
  },
  {
    id: 'uk-recruitment', domain: 'mobility', kind: 'Market insight', priority: 3,
    url: 'https://www.qs.com/insights/uk-international-student-recruitment-navigating-a-less-predictable-market',
    title: 'UK international student recruitment: navigating a less predictable market',
    summary: 'QS analysis of the UK recruitment environment and what institutions can do as demand becomes harder to forecast.',
    excerpts: []
  },
  {
    id: 'us-landscape', domain: 'mobility', kind: 'Market insight', priority: 3,
    url: 'https://www.qs.com/insights/the-us-higher-education-market-landscape-in-2026',
    title: 'The US higher education market landscape in 2026',
    summary: 'QS view of the US market in 2026, including international demand and policy conditions.',
    excerpts: []
  },
  {
    id: 'gsf-uk', domain: 'mobility', kind: 'Market report', priority: 4,
    url: 'https://www.qs.com/insights/global-student-flows-uk',
    title: 'Global Student Flows | UK',
    summary: 'The Global Student Flows lens applied to the United Kingdom as a destination.', excerpts: []
  },
  {
    id: 'gsf-us', domain: 'mobility', kind: 'Market report', priority: 4,
    url: 'https://www.qs.com/insights/global-student-flows-united-states',
    title: 'Global Student Flows | United States',
    summary: 'The Global Student Flows lens applied to the United States (January 2026 edition).', excerpts: []
  },
  {
    id: 'gsf-europe', domain: 'mobility', kind: 'Market report', priority: 4,
    url: 'https://www.qs.com/insights/global-student-flows-europe',
    title: 'Global Student Flows | Europe',
    summary: 'The Global Student Flows lens applied to European destinations.', excerpts: []
  },
  {
    id: 'gsf-anz', domain: 'mobility', kind: 'Market report', priority: 4,
    url: 'https://www.qs.com/en-us/insights/global-student-flows-australia-new-zealand',
    title: 'Global Student Flows | Australia and New Zealand',
    summary: 'The Global Student Flows lens applied to Australia and New Zealand.', excerpts: []
  },
  {
    id: 'gsf-case', domain: 'mobility', kind: 'Case study', priority: 3,
    url: 'https://www.qs.com/case-studies/global-student-flows-international-recruitment-strategy',
    title: 'How QS used Global Student Flows to prioritise recruitment markets',
    summary: 'Case example of Global Student Flows used to test market priorities for a UK university.', excerpts: []
  },
  // ---- Institutions & reputation ----
  {
    id: 'wur-dataset', domain: 'institutions', kind: 'Data product', priority: 2,
    url: 'https://www.qs.com/solutions/world-university-rankings-dataset',
    title: 'QS World University Rankings Dataset',
    summary: 'Benchmark institutional performance and explore the indicators behind the rankings. Licensed product.', excerpts: []
  },
  {
    id: 'metrics-to-strategy', domain: 'institutions', kind: 'Guide', priority: 3,
    url: 'https://www.qs.com/insights/from-metrics-to-strategy-how-to-use-qs-world-university-rankings-data-effectively',
    title: 'From metrics to strategy: using QS World University Rankings data effectively',
    summary: 'Guidance on using rankings evidence responsibly in institutional strategy.', excerpts: []
  },
  // ---- Skills, jobs & outcomes ----
  {
    id: 'future-skills', domain: 'skills', kind: 'Index', priority: 2,
    url: 'https://www.qs.com/insights/world-future-skills-index',
    title: 'QS World Future Skills Index',
    summary: 'Compares how well national education systems are aligned with future workforce needs.', excerpts: []
  },
  // ---- Innovation & new models ----
  {
    id: 'ai-assess', domain: 'innovation', kind: 'Assessment', priority: 2,
    url: 'https://www.qs.com/en-us/solutions/ai-capability-assessments',
    title: 'QS AI Capability Assessments',
    summary: 'Assess, benchmark and strengthen responsible institutional AI capability.', excerpts: []
  },
  {
    id: 'rai', domain: 'innovation', kind: 'Consortium', priority: 3,
    url: 'https://www.qs.com/solutions/responsible-ai-consortium',
    title: 'QS Responsible AI Consortium',
    summary: 'A QS network for AI capability, shared guidance and peer learning.', excerpts: []
  },
  // ---- Events ----
  {
    id: 'calendar', domain: 'events', kind: 'Event calendar', priority: 2,
    url: 'https://www.qs.com/conferences/conference-calendar',
    title: 'QS conference calendar',
    summary: 'Official dates, locations and booking links for QS summits and conferences.', excerpts: []
  },
  {
    id: 'apac', domain: 'events', kind: 'Summit', priority: 3,
    url: 'https://www.qs.com/conferences/asia-pacific',
    title: 'QS Higher Ed Summit: Asia Pacific 2026',
    summary: '3–5 November 2026, Bali International Convention Centre, Indonesia.', excerpts: []
  },
  {
    id: 'middle-east', domain: 'events', kind: 'Summit', priority: 3,
    url: 'https://www.qs.com/conferences/middle-east',
    title: 'QS Higher Ed Summit: Middle East 2026',
    summary: 'Abu Dhabi, hosted by Khalifa University. QS pages have shown different dates for this summit; check the official page.', excerpts: []
  },
  {
    id: 'reimagine', domain: 'events', kind: 'Conference', priority: 3,
    url: 'https://www.qs.com/conferences/reimagine',
    title: 'QS Reimagine Education Awards & Conference 2026',
    summary: '6–8 December 2026, London, United Kingdom.', excerpts: []
  }
];

// Listing page scanned for new article links (live only; no snapshot items).
export const LISTINGS = [
  { id: 'qs-insights', url: 'https://www.qs.com/insights', title: 'QS Insights' }
];
