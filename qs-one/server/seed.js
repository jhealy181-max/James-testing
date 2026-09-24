// Demo data for QS One. Every institution, person and partner here is fictional.
// Dates for sessions and posts are set relative to the day the database is created,
// so the demo always looks current. QS event dates are real calendar entries.

const day = 864e5;
const at = (days, hour = 13) => { const d = new Date(Date.now() + days * day); d.setUTCHours(hour, 0, 0, 0); return d.toISOString(); };

export const DOMAINS = [
  { id: 'mobility', name: 'Global talent & mobility', short: 'Mobility', question: 'Where will students and talent come from, and where will they go?', topics: ['Student flows', 'Recruitment', 'Agents & compliance', 'TNE'] },
  { id: 'institutions', name: 'Institutions & reputation', short: 'Reputation', question: 'How do institutions strengthen performance and global standing?', topics: ['Rankings evidence', 'Reputation', 'Research', 'Strategy'] },
  { id: 'skills', name: 'Skills, jobs & outcomes', short: 'Skills', question: 'What skills do economies need, and how is education delivering them?', topics: ['Employability', 'Employers', 'Future skills', 'AI and work'] },
  { id: 'innovation', name: 'Innovation & new models', short: 'Innovation', question: 'Which new approaches are worth adopting and scaling?', topics: ['Responsible AI', 'Assessment', 'EdTech', 'New provision'] }
];

export const TIERS = {
  Network: { rank: 1, price: 15000, label: 'Network', summary: 'Intelligence, Exchange, Pulse headline results, directory', circles: false, cohortCuts: false, peerCircles: false, roundtables: false, summitPasses: 0, introsPerQuarter: 2 },
  Leadership: { rank: 2, price: 40000, label: 'Leadership', summary: 'Adds Domain Circles, Regional Chapters, Pulse cohort cuts, roundtables', circles: true, cohortCuts: true, peerCircles: false, roundtables: true, summitPasses: 4, introsPerQuarter: 99 },
  Council: { rank: 3, price: 85000, label: 'Council', summary: 'Adds private Peer Circles, Executive Council, bespoke benchmarks', circles: true, cohortCuts: true, peerCircles: true, roundtables: true, summitPasses: 10, introsPerQuarter: 99 }
};

export const PARTNER_TIERS = {
  Insight: { rank: 1, price: 60000, summary: 'Profile, quarterly labelled briefing, 2 hosted roundtables, Challenge Board', insights: false },
  Domain: { rank: 2, price: 175000, summary: 'Named domain partner, co-developed research, aggregated priorities insight', insights: true },
  Principal: { rank: 3, price: 400000, summary: 'All domains, Members’ Forum headline partner, pilot programme', insights: true }
};

export function buildSeed() {
  const institutions = [
    { id: 'i1', name: 'University of Northbridge', country: 'United Kingdom', region: 'Europe', type: 'Research-intensive university', tier: 'Council', verified: true, visible: true,
      overview: 'Comprehensive research university with a large international postgraduate portfolio and two overseas partnerships.',
      priorities: ['mobility', 'institutions', 'innovation'], challenges: 'Rebalancing postgraduate recruitment away from two dominant source markets; scaling TNE without reputational risk.', openTo: ['Peer benchmarking', 'TNE partnerships', 'Research collaboration'] },
    { id: 'i2', name: 'Lumen University of Technology', country: 'Singapore', region: 'Asia Pacific', type: 'Technology university', tier: 'Leadership', verified: true, visible: true,
      overview: 'Young technology university growing regional recruitment and industry-linked programmes.',
      priorities: ['mobility', 'skills', 'innovation'], challenges: 'Building a regional recruitment hub for South-East Asia; employer co-designed degrees.', openTo: ['Employer partnerships', 'Joint programmes'] },
    { id: 'i3', name: 'Al Noor University', country: 'United Arab Emirates', region: 'Middle East', type: 'Comprehensive university', tier: 'Council', verified: true, visible: true,
      overview: 'Fast-growing comprehensive university with national talent and research ambitions.',
      priorities: ['institutions', 'mobility', 'skills'], challenges: 'Attracting international faculty and students; building research reputation.', openTo: ['Research collaboration', 'Faculty exchange', 'Peer benchmarking'] },
    { id: 'i4', name: 'Savanna University', country: 'Kenya', region: 'Africa', type: 'Public university', tier: 'Network', verified: true, visible: true,
      overview: 'Public university expanding digital provision and international partnerships.',
      priorities: ['innovation', 'skills'], challenges: 'Scaling online provision; finding credible international partners.', openTo: ['TNE partnerships', 'EdTech pilots'] },
    { id: 'i5', name: 'Universidad Altamira', country: 'Mexico', region: 'Americas', type: 'Private university', tier: 'Network', verified: true, visible: true,
      overview: 'Private university with strong business and engineering schools.',
      priorities: ['skills', 'mobility'], challenges: 'Outbound mobility and double degrees; employer outcomes.', openTo: ['Double degrees', 'Employer partnerships'] },
    { id: 'i6', name: 'Harbourview University', country: 'Australia', region: 'Asia Pacific', type: 'Research-intensive university', tier: 'Leadership', verified: true, visible: true,
      overview: 'Research university managing the effects of international student caps.',
      priorities: ['mobility', 'institutions'], challenges: 'Operating under enrolment caps; diversifying revenue.', openTo: ['Peer benchmarking', 'TNE partnerships'] },
    { id: 'i7', name: 'Meridian State University', country: 'United States', region: 'Americas', type: 'Public research university', tier: 'Leadership', verified: true, visible: true,
      overview: 'Large public research university with growing graduate STEM enrolment.',
      priorities: ['mobility', 'skills', 'innovation'], challenges: 'Visa volatility for graduate STEM students; AI in assessment.', openTo: ['Peer benchmarking', 'AI governance'] },
    { id: 'i8', name: 'Deccan Institute of Science', country: 'India', region: 'South Asia', type: 'Science & technology institute', tier: 'Leadership', verified: true, visible: true,
      overview: 'Research institute building global partnerships under new foreign-provider rules.',
      priorities: ['institutions', 'mobility'], challenges: 'Selecting foreign campus partners; research visibility.', openTo: ['Research collaboration', 'Branch campus partnerships'] },
    { id: 'i9', name: 'Kestrel School of Business', country: 'Netherlands', region: 'Europe', type: 'Business school', tier: 'Network', verified: true, visible: true,
      overview: 'Specialist business school with international executive education.',
      priorities: ['skills', 'innovation'], challenges: 'Short credentials for employers; AI in executive education.', openTo: ['Employer partnerships'] },
    { id: 'i10', name: 'Riverside Technical University', country: 'Canada', region: 'Americas', type: 'Technical university', tier: 'Network', verified: true, visible: true,
      overview: 'Technical university adapting to the study-permit cap.',
      priorities: ['mobility', 'skills'], challenges: 'Replacing lost international undergraduate demand.', openTo: ['Peer benchmarking', 'Pathway partnerships'] },
    { id: 'i11', name: 'Oasis University of Science', country: 'Saudi Arabia', region: 'Middle East', type: 'Research university', tier: 'Leadership', verified: true, visible: true,
      overview: 'Research university with national goals for global standing.',
      priorities: ['institutions', 'innovation'], challenges: 'Research partnerships and international faculty recruitment.', openTo: ['Research collaboration', 'Faculty exchange'] },
    { id: 'i12', name: 'Bluewater University', country: 'New Zealand', region: 'Asia Pacific', type: 'Comprehensive university', tier: 'Network', verified: false, visible: false,
      overview: 'Comprehensive university. Profile is private while onboarding.',
      priorities: ['mobility'], challenges: '', openTo: [] }
  ];

  const partners = [
    { id: 'p1', name: 'Atlas EdTech', sector: 'Student systems & CRM', tier: 'Domain', domains: ['mobility'], domainPartnerOf: 'mobility',
      description: 'Admissions CRM and application management used by universities in 30 countries (fictional).', offers: ['Admissions analytics pilots', 'Agent-management tooling'] },
    { id: 'p2', name: 'Cloudpeak AI', sector: 'Cloud & AI platforms', tier: 'Principal', domains: ['innovation', 'skills', 'institutions', 'mobility'],
      description: 'AI and cloud platform provider with an education programme (fictional).', offers: ['AI governance workshops', 'Sandboxed AI pilots'] },
    { id: 'p3', name: 'Pathway Global', sector: 'Pathways & recruitment', tier: 'Insight', domains: ['mobility'],
      description: 'International pathway and recruitment services (fictional).', offers: ['Pathway programmes', 'Market-entry support'] },
    { id: 'p4', name: 'Northstar Student Living', sector: 'Student housing', tier: 'Insight', domains: ['mobility'],
      description: 'Purpose-built student accommodation investor and operator (fictional).', offers: ['Nomination agreements', 'Housing demand studies'] },
    { id: 'p5', name: 'Veritas Engineering Group', sector: 'Employer', tier: 'Insight', domains: ['skills'],
      description: 'Global engineering employer hiring 1,200 graduates a year (fictional).', offers: ['Co-designed modules', 'Graduate placements'] }
  ];

  const people = [
    { id: 'u1', orgType: 'institution', orgId: 'i1', name: 'Jordan Price', title: 'Director of International Recruitment', persona: 'Recruitment', role: 'admin', interests: ['mobility', 'institutions'], regions: ['South Asia', 'Africa', 'Asia Pacific'], partnerContact: true, newsletter: 'weekly', bio: 'Leads international recruitment and agent strategy across 40 markets.' },
    { id: 'u2', orgType: 'institution', orgId: 'i1', name: 'Prof. Helen Mercer', title: 'Vice-Chancellor', persona: 'Executive', role: 'member', interests: ['institutions', 'innovation'], regions: ['Europe'], partnerContact: false, newsletter: 'monthly', bio: '' },
    { id: 'u3', orgType: 'institution', orgId: 'i2', name: 'Wei Lin Tan', title: 'Director of Strategy & Planning', persona: 'Strategy', role: 'admin', interests: ['mobility', 'skills'], regions: ['Asia Pacific'], partnerContact: true, newsletter: 'weekly', bio: 'Runs institutional planning and market analysis.' },
    { id: 'u4', orgType: 'institution', orgId: 'i3', name: 'Dr Fatima Al Mansoori', title: 'Provost', persona: 'Executive', role: 'admin', interests: ['institutions', 'skills'], regions: ['Middle East'], partnerContact: true, newsletter: 'monthly', bio: '' },
    { id: 'u5', orgType: 'institution', orgId: 'i4', name: 'Dr Amara Okafor', title: 'Deputy Vice-Chancellor, Academic', persona: 'Executive', role: 'admin', interests: ['innovation', 'skills'], regions: ['Africa'], partnerContact: true, newsletter: 'weekly', bio: 'Leads digital provision and academic partnerships.' },
    { id: 'u6', orgType: 'institution', orgId: 'i6', name: 'Liam O’Connor', title: 'Pro Vice-Chancellor, Global', persona: 'Recruitment', role: 'admin', interests: ['mobility'], regions: ['Asia Pacific', 'South Asia'], partnerContact: false, newsletter: 'weekly', bio: '' },
    { id: 'u7', orgType: 'institution', orgId: 'i7', name: 'Dr Rosa Delgado', title: 'Dean of Graduate Admissions', persona: 'Recruitment', role: 'admin', interests: ['mobility', 'innovation'], regions: ['Americas', 'South Asia'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u8', orgType: 'institution', orgId: 'i8', name: 'Prof. Arjun Rao', title: 'Dean, International Relations', persona: 'Partnerships', role: 'admin', interests: ['institutions', 'mobility'], regions: ['Europe', 'South Asia'], partnerContact: true, newsletter: 'monthly', bio: '' },
    { id: 'u9', orgType: 'institution', orgId: 'i11', name: 'Dr Khalid Al Harbi', title: 'Vice-President, Research', persona: 'Research', role: 'admin', interests: ['institutions', 'innovation'], regions: ['Middle East', 'Europe'], partnerContact: false, newsletter: 'monthly', bio: '' },
    { id: 'u10', orgType: 'institution', orgId: 'i5', name: 'Mariana Solís', title: 'Director of Internationalisation', persona: 'Partnerships', role: 'admin', interests: ['mobility', 'skills'], regions: ['Americas', 'Europe'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u11', orgType: 'institution', orgId: 'i10', name: 'Ethan Clarke', title: 'AVP Enrolment Management', persona: 'Recruitment', role: 'admin', interests: ['mobility'], regions: ['Americas', 'South Asia', 'Africa'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u12', orgType: 'institution', orgId: 'i9', name: 'Sofie de Vries', title: 'Director, Careers & Employer Relations', persona: 'Careers', role: 'admin', interests: ['skills', 'innovation'], regions: ['Europe'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u20', orgType: 'partner', orgId: 'p1', name: 'Sam Rivera', title: 'Director of University Partnerships', persona: 'Partner', role: 'partner', interests: ['mobility'], regions: ['Europe', 'Asia Pacific'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u21', orgType: 'partner', orgId: 'p2', name: 'Priya Natarajan', title: 'Head of Education, EMEA', persona: 'Partner', role: 'partner', interests: ['innovation', 'skills'], regions: ['Europe', 'Middle East'], partnerContact: true, newsletter: 'weekly', bio: '' },
    { id: 'u30', orgType: 'qs', orgId: 'qs', name: 'Maya Chen', title: 'QS One Membership Lead', persona: 'QS team', role: 'staff', interests: ['mobility', 'institutions', 'skills', 'innovation'], regions: [], partnerContact: false, newsletter: 'weekly', bio: 'Coordinates Circles and the founding cohort.' }
  ];

  const personas = ['u1', 'u3', 'u4', 'u5', 'u20', 'u30'];

  const circles = [
    { id: 'c1', type: 'Domain Circle', domain: 'mobility', region: null, title: 'Recruitment risk & compliance', minTier: 'Leadership', coordinator: 'Maya Chen, QS', cadence: 'Monthly online · 60 min',
      description: 'Source-market shifts, agent quality, visa policy and student protection. Share patterns, not named student data or pricing.', members: ['u1', 'u6', 'u7', 'u11'],
      sessions: [{ id: 's1', at: at(6, 14), title: 'Deposits and visa outcomes: what are you seeing for 2027?', format: 'Online · Chatham House' }, { id: 's2', at: at(34, 14), title: 'Agent performance frameworks that work', format: 'Online' }] },
    { id: 'c2', type: 'Domain Circle', domain: 'mobility', region: null, title: 'TNE & international partnerships', minTier: 'Leadership', coordinator: 'Daniel Okafor, QS', cadence: 'Quarterly online',
      description: 'Partner selection, operating models, quality assurance and exit terms for cross-border delivery.', members: ['u1', 'u8', 'u10'],
      sessions: [{ id: 's3', at: at(19, 9), title: 'Branch campus vs partnership: decision canvas walkthrough', format: 'Online' }] },
    { id: 'c3', type: 'Domain Circle', domain: 'institutions', region: null, title: 'Reputation & research strategy', minTier: 'Leadership', coordinator: 'Sofia Alvarez, QS', cadence: 'Quarterly online',
      description: 'Use evidence to shape credible research and partnership choices. Circle discussions have no bearing on QS rankings.', members: ['u2', 'u4', 'u9'],
      sessions: [{ id: 's4', at: at(12, 10), title: 'Reading indicator change without chasing it', format: 'Online' }] },
    { id: 'c4', type: 'Domain Circle', domain: 'skills', region: null, title: 'Skills & employer partnerships', minTier: 'Leadership', coordinator: 'James Patel, QS', cadence: 'Quarterly online',
      description: 'Turn labour-market signals into provision, placements and employer co-design.', members: ['u3', 'u12'],
      sessions: [{ id: 's5', at: at(26, 15), title: 'Employer co-designed modules: contracts and IP', format: 'Online' }] },
    { id: 'c5', type: 'Domain Circle', domain: 'innovation', region: null, title: 'Responsible AI & assessment', minTier: 'Leadership', coordinator: 'Leila Morgan, QS', cadence: 'Monthly online',
      description: 'Governance, assessment redesign and practical adoption. Linked to the QS Responsible AI Consortium.', members: ['u5', 'u7', 'u2'],
      sessions: [{ id: 's6', at: at(9, 13), title: 'Assessment redesign: what survived a year of GenAI', format: 'Online' }] },
    { id: 'c6', type: 'Regional Chapter', domain: null, region: 'Asia Pacific', title: 'Asia Pacific Chapter', minTier: 'Leadership', coordinator: 'QS APAC team', cadence: 'Meets at QS Higher Ed Summit: Asia Pacific + quarterly online',
      description: 'Regional peers across Australia, New Zealand, South-East and East Asia.', members: ['u3', 'u6'],
      sessions: [{ id: 's7', at: '2026-11-03T08:00:00.000Z', title: 'Chapter breakfast, Bali', format: 'In person at summit' }] },
    { id: 'c7', type: 'Regional Chapter', domain: null, region: 'Middle East', title: 'Middle East Chapter', minTier: 'Leadership', coordinator: 'QS Middle East team', cadence: 'Meets at QS Higher Ed Summit: Middle East + quarterly online',
      description: 'Institutions and system bodies across the Gulf and wider region.', members: ['u4', 'u9'], sessions: [] },
    { id: 'c8', type: 'Peer Circle', domain: 'mobility', region: null, title: 'Diversifying postgraduate demand', minTier: 'Council', coordinator: 'Facilitated by QS', cadence: 'Six sessions over six months', invitationOnly: true,
      description: 'A curated cohort of 8–12 institutions each working to reduce dependence on one or two source markets. Private to members.', members: ['u1', 'u4'],
      sessions: [{ id: 's8', at: at(15, 12), title: 'Session 2: market-prioritisation canvas', format: 'Online · private' }] },
    { id: 'c9', type: 'Executive Council', domain: 'institutions', region: null, title: 'Vice-Chancellors’ Council', minTier: 'Council', coordinator: 'QS One leadership', cadence: 'Twice yearly + Members’ Forum', invitationOnly: true,
      description: 'Heads of institution only. Closed-door discussion on sector direction.', members: ['u2'], sessions: [] }
  ];

  const events = [
    { id: 'e1', title: 'QS Higher Ed Summit: Americas', start: '2026-09-30', label: '30 Sep – 2 Oct 2026', place: 'Guadalajara, Mexico', url: 'https://www.qs.com/conferences/americas', domains: ['mobility', 'institutions', 'skills', 'innovation'], moment: 'Concept testing with 10–15 leaders', attendees: ['u10', 'u7', 'u11'] },
    { id: 'e2', title: 'QS Higher Ed Summit: Asia Pacific', start: '2026-11-03', label: '3–5 Nov 2026', place: 'Bali International Convention Centre, Indonesia', url: 'https://www.qs.com/conferences/asia-pacific', domains: ['mobility', 'institutions', 'innovation'], moment: 'QS One founding-cohort launch', attendees: ['u1', 'u3', 'u6', 'u8', 'u20'] },
    { id: 'e3', title: 'QS Higher Ed Summit: Middle East', start: '2026-11-22', label: 'Nov/Dec 2026 · check date', place: 'Abu Dhabi, UAE (hosted by Khalifa University)', url: 'https://www.qs.com/conferences/middle-east', domains: ['mobility', 'institutions', 'innovation'], moment: 'Founding cohort part 2; system buyers', attendees: ['u4', 'u9', 'u1', 'u21'], dateNote: 'QS pages have shown different dates for this summit. Check the official page before booking.' },
    { id: 'e4', title: 'QS Reimagine Education Awards & Conference', start: '2026-12-06', label: '6–8 Dec 2026', place: 'London, United Kingdom', url: 'https://www.qs.com/conferences/reimagine', domains: ['skills', 'innovation'], moment: 'Partner Hub roundtables; Challenge Board launch', attendees: ['u5', 'u12', 'u21', 'u2'] },
    { id: 'e5', title: 'Global Skills Week', start: '2027-03-23', label: '23–25 Mar 2027', place: 'Washington, D.C., United States', url: 'https://www.qs.com/conferences/conference-calendar', domains: ['skills', 'innovation'], moment: 'Pilot go/no-go review', attendees: ['u3', 'u12'] }
  ];

  const roundtables = [
    { id: 'r1', eventId: 'e2', title: 'Closed roundtable: rebalancing postgraduate source markets', host: 'QS One', hostType: 'qs', capacity: 14, minTier: 'Leadership', rsvps: ['u6', 'u8'], note: 'Chatham House rule. Live Pulse in the room.' },
    { id: 'r2', eventId: 'e2', title: 'Partner roundtable: admissions speed and conversion', host: 'Atlas EdTech', hostType: 'partner', partnerId: 'p1', capacity: 16, minTier: 'Network', rsvps: ['u3'], note: 'Partner-hosted. Members choose whether to share contact details.' },
    { id: 'r3', eventId: 'e3', title: 'System leaders: talent attraction and global standing', host: 'QS One', hostType: 'qs', capacity: 12, minTier: 'Leadership', rsvps: ['u9'], note: 'For institutions and system bodies.' },
    { id: 'r4', eventId: 'e4', title: 'Partner roundtable: sandboxed AI pilots for assessment', host: 'Cloudpeak AI', hostType: 'partner', partnerId: 'p2', capacity: 18, minTier: 'Network', rsvps: ['u5'], note: 'Partner-hosted.' }
  ];

  // QS-produced content. Evidence items link to real public QS pages; analysis items are illustrative editorial for the demo.
  const briefings = [
    { id: 'b1', label: 'QS Analysis', kind: 'Signal', domains: ['mobility'], audiences: ['Recruitment', 'Strategy', 'Executive'], sample: true, published: at(-2),
      title: 'Three scenarios, one planning question: which is your base case?',
      summary: 'QS Global Student Flows sets out three scenarios to 2030. Most recruitment plans implicitly assume one of them. Make that assumption explicit.',
      soWhat: 'If your plan only works under Talent Race Rebound, you are exposed to the more likely regional or hybrid paths.',
      action: 'Test next year’s market plan against all three scenarios in the Recruitment risk Circle.',
      sourceIds: ['gsf-report', 'gsf-hub'],
      body: ['QS Global Student Flows describes three plausible paths for international education to 2030: Regulated Regionalism, Hybrid Multiversity and Talent Race Rebound. Each implies a different mix of destinations, delivery modes and source markets.', 'A practical approach is to name a base case and one stress case, then check which markets and programmes stay viable under both. The QS One Pulse on 2027 deposits gives an early read on what peers are seeing now.', 'This briefing is illustrative editorial for the QS One proof of concept. The scenario descriptions come from QS’s public Global Student Flows pages; follow the source links for the full framework.'] },
    { id: 'b2', label: 'QS Analysis', kind: 'Signal', domains: ['mobility'], audiences: ['Recruitment', 'Executive'], sample: true, published: at(-4),
      title: 'Affordability and visas act as filters, not selling points',
      summary: 'ISS findings suggest students rule destinations out on cost and visa access before comparing institutions. Messaging that leads with value rarely overcomes a failed filter.',
      soWhat: 'Conversion work in markets where your destination fails the filter has low returns.',
      action: 'Review spend in markets where visa or cost filters have tightened this year.',
      sourceIds: ['iss'], body: ['The QS International Student Survey indicates that affordability and visa accessibility work as filters: students accept higher cost or complexity only when they clearly understand the return.', 'For recruitment leaders, the implication is to separate markets where you pass the filter (compete on fit and outcomes) from markets where you fail it (reduce spend or change the offer, e.g. TNE).', 'Illustrative editorial for the proof of concept, based on QS’s public ISS pages.'] },
    { id: 'b3', label: 'QS Analysis', kind: 'Signal', domains: ['mobility', 'skills'], audiences: ['Recruitment', 'Careers', 'Strategy'], sample: true, published: at(-6),
      title: 'Chinese applicants weigh employment outcomes more heavily than in 2022',
      summary: 'ISS China data shows larger shifts towards graduate employment and post-study work than any other factor.',
      soWhat: 'Outcome evidence, not rank alone, now carries more weight in this market.',
      action: 'Bring careers and recruitment teams together on outcome messaging for 2027.',
      sourceIds: ['iss-china'], body: ['According to QS’s public ISS China insight, the importance of graduate employment options has risen 11 percentage points since 2022 and access to post-study work visas by 14 points. Cost was cited by 38% in 2026, up from 30% in 2022.', 'Illustrative editorial for the proof of concept.'] },
    { id: 'b4', label: 'QS Analysis', kind: 'Executive briefing', domains: ['institutions'], audiences: ['Executive', 'Strategy', 'Research'], sample: true, published: at(-9),
      title: 'From rankings data to reputation strategy',
      summary: 'Monthly executive briefing: connect indicator evidence to credible research and partnership choices, without chasing the metric.',
      soWhat: 'Durable reputation gains come from real collaboration and outcomes, which the indicators then reflect.',
      action: 'Use the Reputation & research Circle to compare partnership strategies with peers.',
      sourceIds: ['metrics-to-strategy', 'wur-dataset'], body: ['Illustrative monthly briefing for vice-chancellors and strategy directors.', 'Membership of QS One has no bearing on QS rankings. Rankings evidence is used here to frame questions, not to advise on scores.'] },
    { id: 'b5', label: 'QS Analysis', kind: 'Executive briefing', domains: ['innovation', 'skills'], audiences: ['Executive', 'Digital', 'Strategy'], sample: true, published: at(-12),
      title: 'A practical institutional AI roadmap',
      summary: 'Move from scattered pilots to accountable investment: governance, assessment, operations and evaluation.',
      soWhat: 'Institutions that cannot show AI governance will struggle with partners, regulators and students alike.',
      action: 'Benchmark your stage in the AI adoption Pulse; consider a QS AI Capability Assessment.',
      sourceIds: ['ai-assess', 'rai'], body: ['Illustrative executive briefing for the proof of concept.'] },
    { id: 'b6', label: 'QS Analysis', kind: 'Framework', domains: ['mobility'], audiences: ['Recruitment', 'Strategy', 'Partnerships'], sample: true, published: at(-15),
      title: 'Market-prioritisation canvas',
      summary: 'A one-page canvas to score source markets on demand scenario, visa filter, affordability, competition and your programme fit.',
      soWhat: 'Makes market choices explicit and comparable across the executive team.',
      action: 'Complete it before the next Circle session and compare with peers.',
      sourceIds: ['gsf-hub', 'recruitment-datasets'], body: ['Score each market 1–5 on: scenario resilience (does demand hold under all three Global Student Flows scenarios?), visa filter, affordability filter, competitive intensity, programme fit and conversion history.', 'Markets that score well only on current demand are candidates for a hedge (TNE, online, pathway partner) rather than more spend.', 'Illustrative framework for the proof of concept. Detailed market data is available through QS Student Recruitment Datasets.'] },
    { id: 'b7', label: 'QS Analysis', kind: 'Summit digest', domains: ['mobility', 'institutions'], audiences: ['Executive', 'Recruitment', 'Strategy'], sample: true, published: at(-20),
      title: 'Summit digest: what leaders said about 2027 demand',
      summary: 'Sample format for a post-summit digest: themes from closed roundtables, live Pulse results and agreed follow-ups.',
      soWhat: 'Turns a summit conversation into actions members can track.',
      action: 'Follow up introductions made at the summit.', sourceIds: ['calendar'], body: ['Sample digest format. No real summit content is reproduced.'] }
  ];

  const posts = [
    { id: 'x1', type: 'Practice note', authorId: 'u6', circleId: null, domains: ['mobility'], createdAt: at(-3),
      title: 'Running recruitment under an enrolment cap: what we changed',
      body: 'Three things helped most: we moved to a portfolio view (which programmes use cap allocation best), we tightened agent performance reviews to quarterly, and we built a TNE option for two markets where demand exceeded our allocation. Happy to share the scoring template in the Circle.',
      replies: [{ id: 'y1', authorId: 'u1', body: 'Very useful. How did you handle programmes that were strategically important but scored low on cap efficiency?', createdAt: at(-2) }, { id: 'y2', authorId: 'u6', body: 'We ring-fenced a small allocation for them and reviewed it annually with the deans.', createdAt: at(-2) }], upvotes: ['u1', 'u3', 'u7'] },
    { id: 'x2', type: 'Question', authorId: 'u7', circleId: 'c1', domains: ['mobility'], createdAt: at(-1),
      title: 'Has anyone restructured January intake deadlines because of visa processing times?',
      body: 'We are considering moving our January PGT deadline four weeks earlier. Interested in what happened to conversion if you have done this.',
      replies: [{ id: 'y3', authorId: 'u11', body: 'We did for two markets. Applications dipped slightly but visa refusals and late withdrawals fell. Net effect positive.', createdAt: at(-1) }], upvotes: ['u1'] },
    { id: 'x3', type: 'Practice note', authorId: 'u5', circleId: 'c5', domains: ['innovation'], createdAt: at(-5),
      title: 'Our AI assessment policy, one year on',
      body: 'We replaced a blanket ban with three categories of assessment (AI-free, AI-assisted, AI-integrated) and trained programme leads on each. Academic misconduct cases fell, and staff confidence rose. The hardest part was consistent communication to students.',
      replies: [], upvotes: ['u7', 'u2'] },
    { id: 'x4', type: 'Question', authorId: 'u10', circleId: null, domains: ['skills', 'mobility'], createdAt: at(-7),
      title: 'Employer-sponsored double degrees: who funds the mobility?',
      body: 'We have two employers interested in sponsoring a double-degree track with a European partner. How have others split mobility costs between employer, student and institution?',
      replies: [], upvotes: [] },
    { id: 'x5', type: 'Partner briefing', authorId: 'u20', circleId: null, domains: ['mobility'], createdAt: at(-8), partnerId: 'p1',
      title: 'Admissions speed: what fast-response institutions do differently',
      body: 'Partner content. Institutions that issue decisions within days rather than weeks typically automate document checks and set clear service levels for each stage. We will host a roundtable on this at the Asia Pacific summit.',
      replies: [], upvotes: ['u3'] }
  ];

  // Pulse: give-to-get benchmarks. Responses from fictional institutions are demo data.
  const pulses = [
    { id: 'q1', domain: 'mobility', status: 'open', closesAt: at(12), minCohort: 5, title: '2027 international recruitment outlook', intro: 'Five questions, about 2 minutes. Results are visible once your institution contributes. One response per institution.',
      questions: [
        { id: 'deposits', text: 'International postgraduate deposits for the 2027 intake, compared with the same point last year', type: 'single', options: ['Down more than 20%', 'Down 5–20%', 'Roughly flat (±5%)', 'Up 5–20%', 'Up more than 20%'] },
        { id: 'growth', text: 'Which source markets are you prioritising for growth in 2027? (choose up to three)', type: 'multi', max: 3, options: ['India', 'Nigeria', 'China', 'Vietnam', 'Indonesia', 'Pakistan', 'Saudi Arabia', 'Brazil', 'Kenya', 'Mexico'] },
        { id: 'risk', text: 'Biggest recruitment risk in the next 12 months', type: 'single', options: ['Visa or immigration policy', 'Affordability and currency', 'Agent quality and compliance', 'Competitor destinations', 'Reputation or ranking change'] },
        { id: 'scenario', text: 'Which Global Student Flows scenario is closest to your planning base case?', type: 'single', options: ['Regulated Regionalism', 'Hybrid Multiversity', 'Talent Race Rebound', 'We have not chosen one'] },
        { id: 'tne', text: 'Are you expanding transnational education (TNE) in the next two years?', type: 'single', options: ['Yes, significantly', 'Yes, modestly', 'No change', 'Reducing'] }
      ] },
    { id: 'q2', domain: 'innovation', status: 'open', closesAt: at(20), minCohort: 5, title: 'Institutional AI adoption stage', intro: 'Three questions. Aggregated results only.',
      questions: [
        { id: 'stage', text: 'Which best describes your institution’s AI adoption?', type: 'single', options: ['Isolated pilots', 'Coordinated pilots with governance', 'Institution-wide strategy in delivery', 'Embedded and evaluated'] },
        { id: 'policy', text: 'Your assessment policy on generative AI', type: 'single', options: ['Blanket restriction', 'Case-by-case', 'Categorised by assessment type', 'AI-integrated by default'] },
        { id: 'barrier', text: 'Main barrier to scaling', type: 'single', options: ['Skills and confidence', 'Governance and risk', 'Budget', 'Data and systems', 'Evidence of impact'] }
      ] },
    { id: 'q3', domain: 'skills', status: 'open', closesAt: at(30), minCohort: 5, title: 'Employer partnership models', intro: 'Two questions on how you work with employers.',
      questions: [
        { id: 'model', text: 'Most common employer partnership model at your institution', type: 'single', options: ['Guest input and advisory boards', 'Placements and internships', 'Co-designed modules', 'Employer-sponsored programmes', 'Degree apprenticeships'] },
        { id: 'measure', text: 'How do you measure partnership success?', type: 'single', options: ['Graduate outcomes', 'Number of partners', 'Revenue', 'Student satisfaction', 'We do not measure it consistently'] }
      ] }
  ];
  // Deterministic demo responses from fictional institutions (not u1's institution, so the demo user can contribute).
  const demo = {
    q1: { i2: ['Up 5–20%', ['India', 'Vietnam', 'Indonesia'], 'Competitor destinations', 'Hybrid Multiversity', 'Yes, modestly'],
      i3: ['Up more than 20%', ['India', 'Pakistan', 'Nigeria'], 'Reputation or ranking change', 'Talent Race Rebound', 'Yes, significantly'],
      i6: ['Down 5–20%', ['India', 'Vietnam', 'Indonesia'], 'Visa or immigration policy', 'Regulated Regionalism', 'Yes, significantly'],
      i7: ['Down more than 20%', ['India', 'Nigeria', 'Brazil'], 'Visa or immigration policy', 'Regulated Regionalism', 'Yes, modestly'],
      i8: ['Roughly flat (±5%)', ['Kenya', 'Nigeria', 'Vietnam'], 'Affordability and currency', 'Regulated Regionalism', 'Yes, significantly'],
      i10: ['Down more than 20%', ['India', 'Mexico', 'Brazil'], 'Visa or immigration policy', 'Regulated Regionalism', 'No change'],
      i11: ['Up 5–20%', ['Pakistan', 'Indonesia', 'India'], 'Competitor destinations', 'Talent Race Rebound', 'Yes, modestly'],
      i5: ['Roughly flat (±5%)', ['Brazil', 'Mexico', 'India'], 'Affordability and currency', 'Hybrid Multiversity', 'No change'],
      i9: ['Down 5–20%', ['India', 'China', 'Nigeria'], 'Affordability and currency', 'We have not chosen one', 'No change'] },
    q2: { i2: ['Institution-wide strategy in delivery', 'Categorised by assessment type', 'Evidence of impact'], i4: ['Coordinated pilots with governance', 'Categorised by assessment type', 'Budget'],
      i6: ['Coordinated pilots with governance', 'Case-by-case', 'Governance and risk'], i7: ['Institution-wide strategy in delivery', 'Categorised by assessment type', 'Skills and confidence'],
      i9: ['Isolated pilots', 'Case-by-case', 'Skills and confidence'], i11: ['Coordinated pilots with governance', 'Case-by-case', 'Data and systems'], i3: ['Isolated pilots', 'Blanket restriction', 'Governance and risk'] },
    q3: { i2: ['Co-designed modules', 'Graduate outcomes'], i5: ['Placements and internships', 'Number of partners'], i9: ['Employer-sponsored programmes', 'Revenue'], i10: ['Placements and internships', 'We do not measure it consistently'] }
  };
  const responses = [];
  for (const p of pulses) for (const [inst, ans] of Object.entries(demo[p.id] || {})) {
    const answers = {}; p.questions.forEach((q, n) => { answers[q.id] = ans[n]; });
    responses.push({ id: `pr-${p.id}-${inst}`, pulseId: p.id, institutionId: inst, personId: null, answers, demo: true, createdAt: at(-Math.ceil(Math.random() * 6)) });
  }

  const challenges = [
    { id: 'ch1', institutionId: 'i4', authorId: 'u5', domain: 'innovation', status: 'Open for proposals', createdAt: at(-4),
      title: 'Low-bandwidth online delivery for 8,000 distance learners',
      description: 'We need a delivery approach that works on mobile data in rural areas, with offline access and proctoring that students can afford. Looking for a 6-month pilot with one faculty.',
      responses: [{ id: 'cr1', partnerId: 'p2', personId: 'u21', summary: 'Offline-first learning app on our platform, with sandboxed AI tutoring; 6-month pilot at no licence cost to the faculty.', createdAt: at(-2), status: 'Shortlisted' }] },
    { id: 'ch2', institutionId: 'i1', authorId: 'u1', domain: 'mobility', status: 'Open for proposals', createdAt: at(-6),
      title: 'Faster offer-making for postgraduate applicants in three markets',
      description: 'Median time to decision is 19 working days. We want under 5 for complete applications from India, Nigeria and Vietnam without adding headcount.',
      responses: [] },
    { id: 'ch3', institutionId: 'i2', authorId: 'u3', domain: 'skills', status: 'In pilot', createdAt: at(-30),
      title: 'Co-designed data-engineering module with an employer',
      description: 'A 15-credit module co-designed and co-taught with an employer, with guaranteed interviews for top students.',
      responses: [{ id: 'cr2', partnerId: 'p5', personId: null, summary: 'Co-teaching with two engineers per term and interview guarantee for top 20%.', createdAt: at(-25), status: 'Selected' }] }
  ];

  const intros = [
    { id: 'n1', fromId: 'u8', toId: 'u1', reason: 'Exploring UK partners for a joint master’s in data science; saw your TNE interest.', context: 'Directory', status: 'requested', createdAt: at(-1) },
    { id: 'n2', fromId: 'u1', toId: 'u6', reason: 'Would value 20 minutes on running recruitment under a cap.', context: 'Exchange', status: 'accepted', createdAt: at(-10) }
  ];

  return {
    meta: { createdAt: new Date().toISOString(), version: 3 },
    institutions, partners, people, personas, circles, events, roundtables, briefings, posts, pulses, responses, challenges, intros, audit: []
  };
}
