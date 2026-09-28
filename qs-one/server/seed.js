// QS One v2 demo data. Every institution, person and partner is fictional.
// Session, post and login dates are relative to when the database is created,
// so the demo always looks current. QS event dates are real calendar entries.

const DAY = 864e5;
const at = (days, hour = 13) => { const d = new Date(Date.now() + days * DAY); d.setUTCHours(hour, 0, 0, 0); return d.toISOString(); };

export const DOMAINS = [
  { id: 'mobility', name: 'Global talent & mobility', short: 'Mobility', question: 'Where will students and talent come from, and where will they go?', launch: true },
  { id: 'institutions', name: 'Institutions & reputation', short: 'Reputation', question: 'How do institutions strengthen performance and global standing?' },
  { id: 'skills', name: 'Skills, jobs & outcomes', short: 'Skills', question: 'What skills do economies need, and how is education delivering them?' },
  { id: 'innovation', name: 'Innovation & new models', short: 'Innovation', question: 'Which new approaches are worth adopting and scaling?' }
];

// Tier ladder from the updated strategy. USD list prices; GBP used in the ARR walk at $1.33/£.
export const TIERS = {
  Free: {
    rank: 0, usd: 0, gbp: 0, label: 'Network (free)',
    intel: 'Weekly Signal newsletter; partial library of case studies and frameworks',
    communities: 'Open quarterly sessions', pulse: 'Contribute; see headline results',
    connect: 'Verified profile; receive introductions', analytics: [], recognition: [],
    domainCommunities: 0, chapters: false, execCouncil: false, cohortCuts: false, bespokeCohort: false,
    introsPerQuarter: 0, summitMatching: 'none', summitPasses: 0, concierge: false, stand: false
  },
  Member: {
    rank: 1, usd: 20000, gbp: 15000, label: 'Member',
    intel: '+ Monthly domain briefings; closed-door expert webinars',
    communities: 'Membership of one domain community', pulse: '+ Results by region and institution type',
    connect: '+ 2 introductions a quarter; 5 passes for one summit', analytics: [], recognition: ['Badge', 'Certificate'],
    domainCommunities: 1, chapters: true, execCouncil: false, cohortCuts: true, bespokeCohort: false,
    introsPerQuarter: 2, summitMatching: 'one', summitPasses: 5, concierge: false, stand: false
  },
  'Member Plus': {
    rank: 2, usd: 60000, gbp: 45000, label: 'Member Plus',
    intel: '+ Quarterly executive-team briefing; QS Market Insights subscription',
    communities: 'All domain communities', pulse: '+ Results by region and institution type',
    connect: '+ Matching at every summit; 8 summit passes', analytics: ['Market Expert'], recognition: ['Badge', 'Certificate', 'Interview', 'Exhibition outside home region'],
    domainCommunities: 4, chapters: true, execCouncil: false, cohortCuts: true, bespokeCohort: false,
    introsPerQuarter: 6, summitMatching: 'all', summitPasses: 8, concierge: false, stand: false
  },
  Council: {
    rank: 3, usd: 110000, gbp: 85000, label: 'Council', cap: 25,
    intel: '+ Private executive briefings; 20 analyst hours',
    communities: 'Executive Council seats; consulted on community themes', pulse: '+ Bespoke benchmark cohort',
    connect: '+ Concierge introductions; stand at a summit', analytics: ['WUR Rankings', 'Student Insight', 'Market Expert'], recognition: ['Badge', 'Certificate', 'Interview', 'Exhibition outside home region'],
    domainCommunities: 4, chapters: true, execCouncil: true, cohortCuts: true, bespokeCohort: true,
    introsPerQuarter: 99, summitMatching: 'all', summitPasses: 8, concierge: true, stand: true
  }
};
export const ACCESS_RANK = { free: 0, member: 1, plus: 2, council: 3 };
export const ACCESS_LABEL = { free: 'Free', member: 'Member', plus: 'Member Plus', council: 'Council' };

export function buildSeed() {
  const inst = (id, name, country, region, type, tier, extra = {}) => ({ id, name, country, region, type, tier, verified: true, visible: true, joinedAt: at(-200), overview: '', priorities: [], challenges: '', openTo: [], leadId: null, foundingMember: false, domainChoice: null, ...extra });
  const institutions = [
    inst('i1', 'University of Northbridge', 'United Kingdom', 'Europe', 'Research-intensive', 'Member Plus', { foundingMember: true, joinedAt: at(-290), leadId: 'u1', overview: 'Comprehensive research university with a large international postgraduate portfolio and two overseas partnerships.', priorities: ['mobility', 'institutions', 'innovation'], challenges: 'Rebalancing postgraduate recruitment away from two dominant source markets; scaling TNE without reputational risk.', openTo: ['Peer benchmarking', 'TNE partnerships', 'Research collaboration'] }),
    inst('i2', 'Lumen University of Technology', 'Singapore', 'Asia Pacific', 'Technology', 'Member', { domainChoice: 'mobility', leadId: 'u3', overview: 'Young technology university growing regional recruitment and industry-linked programmes.', priorities: ['mobility', 'skills'], challenges: 'Building a South-East Asia recruitment hub; employer co-designed degrees.', openTo: ['Employer partnerships', 'Joint programmes'] }),
    inst('i3', 'Al Noor University', 'United Arab Emirates', 'Middle East', 'Comprehensive', 'Council', { leadId: 'u4', overview: 'Fast-growing comprehensive university with national talent and research ambitions.', priorities: ['institutions', 'mobility', 'skills'], challenges: 'Attracting international faculty and students; research reputation.', openTo: ['Research collaboration', 'Faculty exchange', 'Peer benchmarking'] }),
    inst('i4', 'Savanna University', 'Kenya', 'Africa', 'Public', 'Free', { joinedAt: at(-40), leadId: 'u5', overview: 'Public university expanding digital provision and international partnerships.', priorities: ['innovation', 'mobility'], challenges: 'Scaling online provision; finding credible international partners.', openTo: ['TNE partnerships', 'EdTech pilots'] }),
    inst('i5', 'Universidad Altamira', 'Mexico', 'Americas', 'Private', 'Member', { domainChoice: 'skills', leadId: 'u10', overview: 'Private university with strong business and engineering schools.', priorities: ['skills', 'mobility'], challenges: 'Outbound mobility and double degrees; employer outcomes.', openTo: ['Double degrees', 'Employer partnerships'] }),
    inst('i6', 'Harbourview University', 'Australia', 'Asia Pacific', 'Research-intensive', 'Member Plus', { foundingMember: true, leadId: 'u6', overview: 'Research university managing international student caps.', priorities: ['mobility', 'institutions'], challenges: 'Operating under enrolment caps; diversifying revenue.', openTo: ['Peer benchmarking', 'TNE partnerships'] }),
    inst('i7', 'Meridian State University', 'United States', 'Americas', 'Research-intensive', 'Member', { domainChoice: 'mobility', leadId: 'u7', overview: 'Large public research university with graduate STEM growth.', priorities: ['mobility', 'innovation'], challenges: 'Visa volatility for graduate STEM students.', openTo: ['Peer benchmarking', 'AI governance'] }),
    inst('i8', 'Deccan Institute of Science', 'India', 'South Asia', 'Technology', 'Member', { domainChoice: 'institutions', leadId: 'u8', overview: 'Research institute building global partnerships under new foreign-provider rules.', priorities: ['institutions', 'mobility'], challenges: 'Selecting foreign campus partners; research visibility.', openTo: ['Research collaboration', 'Branch campus partnerships'] }),
    inst('i9', 'Kestrel School of Business', 'Netherlands', 'Europe', 'Specialist', 'Free', { joinedAt: at(-20), leadId: 'u12', overview: 'Specialist business school with international executive education.', priorities: ['skills', 'innovation'], challenges: 'Short credentials for employers.', openTo: ['Employer partnerships'] }),
    inst('i10', 'Riverside Technical University', 'Canada', 'Americas', 'Technology', 'Member', { domainChoice: 'mobility', leadId: 'u11', overview: 'Technical university adapting to the study-permit cap.', priorities: ['mobility', 'skills'], challenges: 'Replacing lost international undergraduate demand.', openTo: ['Peer benchmarking', 'Pathway partnerships'] }),
    inst('i11', 'Oasis University of Science', 'Saudi Arabia', 'Middle East', 'Research-intensive', 'Member Plus', { leadId: 'u9', overview: 'Research university with national goals for global standing.', priorities: ['institutions', 'innovation'], challenges: 'Research partnerships and international faculty recruitment.', openTo: ['Research collaboration'] }),
    inst('i12', 'Bluewater University', 'New Zealand', 'Asia Pacific', 'Comprehensive', 'Free', { joinedAt: at(-6), visible: false, overview: 'Onboarding. Profile private.', priorities: ['mobility'] }),
    inst('i13', 'Rhine Valley University', 'Germany', 'Europe', 'Public', 'Free', { joinedAt: at(-12), overview: 'Public university growing English-taught master’s programmes.', priorities: ['mobility'], challenges: 'Recruiting outside the EU for English-taught master’s.', openTo: ['Peer benchmarking'] }),
    inst('i14', 'Nile Delta University', 'Egypt', 'Middle East', 'Public', 'Free', { joinedAt: at(-30), overview: 'Public university exploring TNE partnerships.', priorities: ['mobility', 'institutions'], challenges: 'Hosting foreign branch campuses.', openTo: ['TNE partnerships'] })
  ];

  const partners = [
    { id: 'p1', name: 'Atlas EdTech', sector: 'Admissions CRM', offer: 'Admissions analytics pilots', domains: ['mobility'], description: 'Admissions CRM used in 30 countries (fictional).' },
    { id: 'p2', name: 'Cloudpeak AI', sector: 'Cloud & AI platforms', offer: 'Sandboxed AI pilots', domains: ['innovation', 'skills'], description: 'AI and cloud provider with an education programme (fictional).' },
    { id: 'p3', name: 'Pathway Global', sector: 'Pathways & recruitment', offer: 'Pathway programmes', domains: ['mobility'], description: 'International pathway provider (fictional).' }
  ];

  const P = (id, orgId, name, title, persona, interests, regions, extra = {}) => ({ id, orgType: 'institution', orgId, name, title, persona, interests, regions, role: 'member', partnerContact: true, newsletter: 'weekly', bio: '', lastLogin: at(-3), status: 'active', ...extra });
  const people = [
    P('u1', 'i1', 'Jordan Price', 'Director of International Recruitment', 'Recruitment', ['mobility', 'institutions'], ['South Asia', 'Africa', 'Asia Pacific'], { role: 'lead', bio: 'Leads international recruitment and agent strategy across 40 markets.', lastLogin: at(0) }),
    P('u2', 'i1', 'Prof. Helen Mercer', 'Vice-Chancellor', 'Executive', ['institutions', 'innovation'], ['Europe'], { partnerContact: false, newsletter: 'monthly', lastLogin: at(-21) }),
    P('u2b', 'i1', 'Tom Adeyemi', 'Head of TNE Partnerships', 'Partnerships', ['mobility'], ['Africa', 'South Asia'], { lastLogin: at(-5) }),
    P('u3', 'i2', 'Wei Lin Tan', 'Director of Strategy & Planning', 'Strategy', ['mobility', 'skills'], ['Asia Pacific'], { role: 'lead', lastLogin: at(-1) }),
    P('u3b', 'i2', 'Nurul Aziz', 'International Office Manager', 'Recruitment', ['mobility'], ['Asia Pacific'], { lastLogin: at(-14) }),
    P('u4', 'i3', 'Dr Fatima Al Mansoori', 'Provost', 'Executive', ['institutions', 'skills'], ['Middle East'], { role: 'lead', newsletter: 'monthly', lastLogin: at(-2) }),
    P('u4b', 'i3', 'Omar Haddad', 'Director of Admissions', 'Recruitment', ['mobility'], ['Middle East', 'South Asia'], { lastLogin: at(-9) }),
    P('u5', 'i4', 'Dr Amara Okafor', 'Deputy Vice-Chancellor, Academic', 'Executive', ['innovation', 'mobility'], ['Africa'], { role: 'lead', bio: 'Leads digital provision and academic partnerships.', lastLogin: at(-1) }),
    P('u6', 'i6', 'Liam O’Connor', 'Pro Vice-Chancellor, Global', 'Recruitment', ['mobility'], ['Asia Pacific', 'South Asia'], { role: 'lead', partnerContact: false, lastLogin: at(-4) }),
    P('u6b', 'i6', 'Grace Liu', 'Director, Market Intelligence', 'Strategy', ['mobility', 'institutions'], ['Asia Pacific'], { lastLogin: at(-11) }),
    P('u7', 'i7', 'Dr Rosa Delgado', 'Dean of Graduate Admissions', 'Recruitment', ['mobility', 'innovation'], ['Americas', 'South Asia'], { role: 'lead', lastLogin: at(-6) }),
    P('u7b', 'i7', 'Marcus Bell', 'Director, International Enrolment', 'Recruitment', ['mobility'], ['Americas'], { lastLogin: at(-40) }),
    P('u8', 'i8', 'Prof. Arjun Rao', 'Dean, International Relations', 'Partnerships', ['institutions', 'mobility'], ['Europe', 'South Asia'], { role: 'lead', lastLogin: at(-8) }),
    P('u9', 'i11', 'Dr Khalid Al Harbi', 'Vice-President, Research', 'Research', ['institutions', 'innovation'], ['Middle East', 'Europe'], { role: 'lead', partnerContact: false, lastLogin: at(-12) }),
    P('u9b', 'i11', 'Sara Al Qahtani', 'Director of Global Engagement', 'Partnerships', ['mobility', 'institutions'], ['Middle East'], { lastLogin: at(-15) }),
    P('u10', 'i5', 'Mariana Solís', 'Director of Internationalisation', 'Partnerships', ['mobility', 'skills'], ['Americas', 'Europe'], { role: 'lead', lastLogin: at(-10) }),
    P('u10b', 'i5', 'Diego Paredes', 'Head of Careers', 'Careers', ['skills'], ['Americas'], { lastLogin: at(-75) }),
    P('u11', 'i10', 'Ethan Clarke', 'AVP Enrolment Management', 'Recruitment', ['mobility'], ['Americas', 'South Asia', 'Africa'], { role: 'lead', lastLogin: at(-2) }),
    P('u11b', 'i10', 'Priya Sandhu', 'International Recruitment Manager', 'Recruitment', ['mobility'], ['South Asia'], { lastLogin: at(-18) }),
    P('u12', 'i9', 'Sofie de Vries', 'Director, Careers & Employer Relations', 'Careers', ['skills', 'innovation'], ['Europe'], { role: 'lead', lastLogin: at(-20) }),
    P('u13', 'i13', 'Jonas Weber', 'Head of International Office', 'Recruitment', ['mobility'], ['Europe', 'South Asia'], { role: 'lead', lastLogin: at(-12) }),
    P('u14', 'i14', 'Dr Layla Mansour', 'Vice-President, International', 'Executive', ['mobility', 'institutions'], ['Middle East', 'Africa'], { role: 'lead', lastLogin: at(-30) }),
    P('u14b', 'i14', 'Karim Fathy', 'Partnerships Manager', 'Partnerships', ['mobility'], ['Middle East'], { lastLogin: at(-31) }),
    { id: 'u20', orgType: 'partner', orgId: 'p1', name: 'Sam Rivera', title: 'Director of University Partnerships', persona: 'Partner', interests: ['mobility'], regions: ['Europe', 'Asia Pacific'], role: 'partner', partnerContact: true, newsletter: 'weekly', bio: '', lastLogin: at(-1), status: 'active' },
    { id: 'u30', orgType: 'qs', orgId: 'qs', name: 'Maya Chen', title: 'QS One Community Coordinator', persona: 'QS team', interests: ['mobility', 'institutions', 'skills', 'innovation'], regions: [], role: 'staff', partnerContact: false, newsletter: 'weekly', bio: 'Facilitates the Student Recruitment & International Office community.', lastLogin: at(0), status: 'active' }
  ];
  const personas = ['u1', 'u3', 'u4', 'u5', 'u20', 'u30'];

  // Communities: standing groups with a facilitator, a charter and outputs.
  const C = (id, kind, domain, region, title, extra) => ({ id, kind, domain, region, title, members: [], sessions: [], outputs: [], ...extra });
  const communities = [
    C('c1', 'Domain community', 'mobility', null, 'Student Recruitment & International Office', {
      flagship: true, facilitator: 'Maya Chen, QS', cadence: 'Monthly · 60 min online + meet-ups at QS summits',
      charter: 'Share early signals and practice on source markets, agents, visas and conversion, so members can adjust recruitment plans before official data arrives.',
      commitments: ['Contribute to the monthly Recruitment Pulse', 'Bring one live decision to each session', 'Share practice, not named student data or pricing'],
      members: ['u1', 'u2b', 'u3', 'u3b', 'u6', 'u7', 'u11', 'u11b', 'u4b', 'u13'],
      sessions: [
        { id: 's1', at: at(4, 14), title: 'October Pulse read-out: deposits and visa outcomes by market', format: 'Online · Chatham House', open: false },
        { id: 's2', at: at(33, 14), title: 'Agent performance frameworks that work', format: 'Online', open: false },
        { id: 's2b', at: '2026-11-04T07:30:00.000Z', title: 'Community breakfast at QS Higher Ed Summit: Asia Pacific', format: 'In person · Bali', open: false }
      ],
      outputs: [
        { title: 'Source-market early-warning checklist', type: 'Framework', status: 'Published', date: at(-20) },
        { title: 'Use case: moving January deadlines to cut visa withdrawals', type: 'Use case', status: 'Published', date: at(-9) },
        { title: 'Joint project: shared agent due-diligence questions', type: 'Joint project', status: 'In progress', date: at(-2) }
      ] }),
    C('c2', 'Domain community', 'institutions', null, 'Reputation & Research Strategy', {
      facilitator: 'Sofia Alvarez, QS', cadence: 'Monthly online',
      charter: 'Use evidence to shape credible research and partnership choices. Discussions have no bearing on QS rankings.',
      commitments: ['Share one practice note a quarter'], members: ['u2', 'u4', 'u8', 'u9'],
      sessions: [{ id: 's3', at: at(12, 10), title: 'Reading indicator change without chasing it', format: 'Online' }],
      outputs: [{ title: 'Use case: building a research partnership portfolio', type: 'Use case', status: 'Published', date: at(-25) }] }),
    C('c3', 'Domain community', 'skills', null, 'Skills & Employer Partnerships', {
      facilitator: 'James Patel, QS', cadence: 'Monthly online',
      charter: 'Turn labour-market evidence into programmes, placements and employer co-design.',
      commitments: ['Contribute to the Employer Partnerships Pulse'], members: ['u3', 'u10', 'u10b'],
      sessions: [{ id: 's4', at: at(19, 15), title: 'Employer co-designed modules: contracts and IP', format: 'Online' }],
      outputs: [{ title: 'Template: employer co-design agreement', type: 'Framework', status: 'In progress', date: at(-4) }] }),
    C('c4', 'Domain community', 'innovation', null, 'Responsible AI & New Models', {
      facilitator: 'Leila Morgan, QS', cadence: 'Monthly online · builds on Reimagine Education',
      charter: 'Governance, assessment redesign and practical adoption of AI and new provision.',
      commitments: ['Share one pilot result a term'], members: ['u2', 'u7'],
      sessions: [{ id: 's5', at: at(8, 13), title: 'Assessment redesign: what survived a year of GenAI', format: 'Online' }],
      outputs: [{ title: 'AI roadmap framework (member edition)', type: 'Framework', status: 'Published', date: at(-40) }] }),
    C('c5', 'Regional chapter', null, 'Asia Pacific', 'Asia Pacific Chapter', { facilitator: 'QS APAC team', cadence: 'Quarterly online + QS Higher Ed Summit: Asia Pacific', charter: 'Regional peers across Australia, New Zealand, South-East and East Asia.', commitments: [], members: ['u3', 'u6', 'u6b'], sessions: [{ id: 's6', at: '2026-11-03T08:00:00.000Z', title: 'Chapter meet-up, Bali', format: 'In person' }] }),
    C('c6', 'Regional chapter', null, 'Middle East', 'Middle East Chapter', { facilitator: 'QS Middle East team', cadence: 'Quarterly online + QS Higher Ed Summit: Middle East', charter: 'Institutions across the Gulf and wider region.', commitments: [], members: ['u4', 'u9', 'u9b'], sessions: [] }),
    C('c7', 'Executive Council', 'institutions', null, 'QS One Executive Council', { facilitator: 'QS One leadership', cadence: 'Twice a year + Members’ Forum', charter: 'Heads of Council institutions. Consulted on community themes and the QS One agenda.', commitments: ['Attend two Council meetings a year'], members: ['u4'], sessions: [{ id: 's7', at: at(45, 12), title: 'Council meeting: 2027 community themes', format: 'Online · private' }] })
  ];
  // Open quarterly sessions available to every tier, including Free.
  const openSessions = [
    { id: 'o1', at: at(10, 14), title: 'Open session: what the October Recruitment Pulse tells us', domain: 'mobility', host: 'QS One', registrations: ['u13'] },
    { id: 'o2', at: at(38, 15), title: 'Open session: employability evidence for 2027 planning', domain: 'skills', host: 'QS One', registrations: [] },
    { id: 'o3', at: at(24, 13), title: 'Partner-hosted open session: faster offer-making', domain: 'mobility', host: 'Atlas EdTech', partnerId: 'p1', registrations: ['u3b'] }
  ];

  // Intelligence items, each with an access level (free, member, plus, council).
  const intel = [
    { id: 'n1', kind: 'Signal', access: 'free', domains: ['mobility'], published: at(-1), title: 'This week: deposits split by market as visa timelines lengthen', summary: 'Early Pulse returns show deposit changes diverging sharply by source market. Official statistics will not show this until 2027.', soWhat: 'Market-level averages hide the risk. Check your two largest markets separately.', action: 'Answer the October Recruitment Pulse to see your position against peers.', sourceIds: ['gsf-report', 'iss'], label: 'QS Analysis' },
    { id: 'n2', kind: 'Signal', access: 'free', domains: ['mobility'], published: at(-8), title: 'Affordability and visas act as filters, not selling points', summary: 'ISS findings suggest students rule destinations out on cost and visa access before comparing institutions.', soWhat: 'Conversion spend in markets where you fail the filter has low returns.', action: 'Review spend in markets where visa or cost filters tightened this year.', sourceIds: ['iss'], label: 'QS Analysis' },
    { id: 'n3', kind: 'Signal', access: 'free', domains: ['mobility', 'skills'], published: at(-15), title: 'Chinese applicants weigh employment outcomes more heavily than in 2022', summary: 'ISS China shows the importance of employment options up 11 points and post-study work up 14 points since 2022.', soWhat: 'Outcome evidence carries more weight than rank alone in this market.', action: 'Bring careers and recruitment teams together on outcome messaging.', sourceIds: ['iss-china'], label: 'QS Analysis' },
    { id: 'n4', kind: 'Monthly briefing', access: 'member', domains: ['mobility'], published: at(-5), title: 'October mobility briefing: planning for a regional, hybrid 2027', summary: 'The three Global Student Flows scenarios applied to 2027 intake planning, with September Pulse results.', soWhat: 'Most members plan for one scenario. Few have a stress case.', action: 'Use the market-prioritisation canvas before the November community session.', sourceIds: ['gsf-report', 'gsf-hub', 'recruitment-datasets'], label: 'QS Analysis', body: ['QS Global Student Flows describes three paths to 2030: Regulated Regionalism, Hybrid Multiversity and Talent Race Rebound. September Pulse results show 40% of respondents plan for Regulated Regionalism, but only a minority have tested a second scenario.', 'For recruitment leaders, the practical step is to name a base case and a stress case, and check which markets and programmes remain viable under both.', 'Illustrative editorial for the proof of concept. Scenario descriptions come from QS’s public Global Student Flows pages.'] },
    { id: 'n5', kind: 'Monthly briefing', access: 'member', domains: ['institutions'], published: at(-12), title: 'Reputation briefing: from rankings data to strategy', summary: 'Connecting indicator evidence to credible research and partnership choices, without chasing the metric.', soWhat: 'Durable gains come from real collaboration and outcomes.', action: 'Compare partnership strategies in the Reputation community.', sourceIds: ['metrics-to-strategy', 'wur-dataset'], label: 'QS Analysis' },
    { id: 'n6', kind: 'Monthly briefing', access: 'member', domains: ['innovation'], published: at(-18), title: 'AI briefing: from pilots to an accountable roadmap', summary: 'Governance, assessment, operations and evaluation.', soWhat: 'Institutions without AI governance will struggle with partners and regulators.', action: 'Benchmark your stage in the AI Adoption Pulse.', sourceIds: ['ai-assess', 'rai'], label: 'QS Analysis' },
    { id: 'n7', kind: 'Executive-team briefing', access: 'plus', domains: ['mobility', 'institutions'], published: at(-20), title: 'Q4 executive briefing: revenue resilience in a capped market', summary: 'For vice-chancellors and executive teams: scenarios, peer moves and three decisions to take before January.', soWhat: 'International revenue risk is now a board-level question.', action: 'Schedule a 30-minute executive walkthrough with your QS analyst.', sourceIds: ['gsf-report', 'uk-recruitment', 'us-landscape'], label: 'QS Analysis' },
    { id: 'n8', kind: 'Private executive briefing', access: 'council', domains: ['institutions'], published: at(-7), title: 'Council briefing: your position against a bespoke peer cohort', summary: 'Prepared for each Council institution using its bespoke Pulse cohort and QS data.', soWhat: 'Tailored to your institution.', action: 'Book analyst hours to go deeper.', sourceIds: ['wur-dataset'], label: 'QS Analysis' }
  ];
  const library = [
    { id: 'l1', kind: 'Framework', access: 'free', domains: ['mobility'], title: 'Market-prioritisation canvas', summary: 'Score source markets on scenario resilience, visa filter, affordability, competition and programme fit.' },
    { id: 'l2', kind: 'Case study', access: 'free', domains: ['mobility'], title: 'Using Global Student Flows to prioritise recruitment markets', summary: 'How a UK university tested market priorities with QS consulting.', url: 'https://www.qs.com/case-studies/global-student-flows-international-recruitment-strategy' },
    { id: 'l3', kind: 'Framework', access: 'member', domains: ['mobility'], title: 'TNE partner evaluation framework', summary: 'Partner selection, operating models, quality assurance and exit terms.' },
    { id: 'l4', kind: 'Case study', access: 'member', domains: ['mobility'], title: 'Recruiting under an enrolment cap', summary: 'A member’s portfolio approach to cap allocation (member practice).', member: true },
    { id: 'l5', kind: 'Framework', access: 'member', domains: ['innovation'], title: 'AI roadmap framework', summary: 'From isolated pilots to an accountable institutional roadmap.' },
    { id: 'l6', kind: 'Case study', access: 'free', domains: ['innovation'], title: 'Our AI assessment policy, one year on', summary: 'Three assessment categories replaced a blanket ban (member practice).', member: true },
    { id: 'l7', kind: 'Framework', access: 'plus', domains: ['institutions'], title: 'Revenue diversification options appraisal', summary: 'A board-ready template for comparing TNE, online, pathway and research revenue options.' },
    { id: 'l8', kind: 'Case study', access: 'member', domains: ['skills'], title: 'Co-designing a data-engineering module with an employer', summary: 'Contracts, teaching model and interview guarantee (member practice).', member: true }
  ];
  const webinars = [
    { id: 'w1', access: 'member', domains: ['mobility'], at: at(7, 15), title: 'Closed-door: what visa officers are seeing this autumn', speaker: 'Former immigration official (off the record)', registrations: ['u1', 'u7'], sponsor: null },
    { id: 'w2', access: 'member', domains: ['institutions'], at: at(21, 14), title: 'Closed-door: reading the 2027 rankings cycle', speaker: 'QS research team', registrations: ['u8'], sponsor: null },
    { id: 'w3', access: 'member', domains: ['innovation'], at: at(28, 16), title: 'AI in admissions: governance lessons', speaker: 'Panel of three members', registrations: [], sponsor: 'Cloudpeak AI' }
  ];

  // Recruitment Pulse: monthly waves with numeric answers by market.
  const MARKETS = ['India', 'Nigeria', 'China', 'Pakistan', 'Vietnam', 'United States'];
  const pulses = [
    { id: 'rp-oct', series: 'recruitment', wave: 'October 2026', status: 'open', closesAt: at(14), minCohort: 5, domain: 'mobility', roles: ['Recruitment', 'Executive', 'Strategy', 'Partnerships'],
      title: 'Recruitment Pulse · October 2026', intro: 'Six numbers and two choices, about 3 minutes. One response per institution. Only contributors see results.',
      markets: MARKETS,
      questions: [
        { id: 'deposits', type: 'numberByMarket', text: 'Change in international deposits vs same point last year (%)', unit: '%' },
        { id: 'visa', type: 'number', text: 'Change in visa refusal rate vs last year (percentage points)', unit: 'pp' },
        { id: 'risk', type: 'single', text: 'Biggest recruitment risk in the next 12 months', options: ['Visa or immigration policy', 'Affordability and currency', 'Agent quality and compliance', 'Competitor destinations', 'Reputation or ranking change'] },
        { id: 'tne', type: 'single', text: 'Are you expanding transnational education (TNE) in the next two years?', options: ['Yes, significantly', 'Yes, modestly', 'No change', 'Reducing'] }
      ] },
    { id: 'rp-sep', series: 'recruitment', wave: 'September 2026', status: 'closed', closesAt: at(-16), minCohort: 5, domain: 'mobility', roles: ['Recruitment', 'Executive', 'Strategy', 'Partnerships'],
      title: 'Recruitment Pulse · September 2026', intro: 'Closed.', markets: MARKETS,
      questions: [
        { id: 'deposits', type: 'numberByMarket', text: 'Change in international deposits vs same point last year (%)', unit: '%' },
        { id: 'visa', type: 'number', text: 'Change in visa refusal rate vs last year (percentage points)', unit: 'pp' },
        { id: 'risk', type: 'single', text: 'Biggest recruitment risk in the next 12 months', options: ['Visa or immigration policy', 'Affordability and currency', 'Agent quality and compliance', 'Competitor destinations', 'Reputation or ranking change'] },
        { id: 'tne', type: 'single', text: 'Are you expanding transnational education (TNE) in the next two years?', options: ['Yes, significantly', 'Yes, modestly', 'No change', 'Reducing'] }
      ] },
    { id: 'ai-oct', series: 'ai', wave: 'October 2026', status: 'open', closesAt: at(21), minCohort: 5, domain: 'innovation', roles: ['Digital', 'Executive', 'Strategy'],
      title: 'AI Adoption Pulse · Q4 2026', intro: 'Three questions for digital and academic leaders.',
      questions: [
        { id: 'stage', type: 'single', text: 'Which best describes your institution’s AI adoption?', options: ['Isolated pilots', 'Coordinated pilots with governance', 'Institution-wide strategy in delivery', 'Embedded and evaluated'] },
        { id: 'policy', type: 'single', text: 'Your assessment policy on generative AI', options: ['Blanket restriction', 'Case-by-case', 'Categorised by assessment type', 'AI-integrated by default'] },
        { id: 'barrier', type: 'single', text: 'Main barrier to scaling', options: ['Skills and confidence', 'Governance and risk', 'Budget', 'Data and systems', 'Evidence of impact'] }
      ] },
    { id: 'fin-q4', series: 'finance', wave: 'Q4 2026', status: 'open', closesAt: at(30), minCohort: 5, domain: 'institutions', roles: ['Executive', 'Strategy'],
      title: 'Financial Resilience Pulse · Q4 2026', intro: 'For executive teams. Two questions on revenue diversification.',
      questions: [
        { id: 'share', type: 'single', text: 'Share of income from international tuition fees', options: ['Under 10%', '10–20%', '20–30%', '30–40%', 'Over 40%'] },
        { id: 'lever', type: 'single', text: 'Main diversification lever for 2027', options: ['TNE and overseas delivery', 'Online and short courses', 'Research and enterprise', 'Domestic growth', 'Cost reduction'] }
      ] }
  ];
  // Deterministic demo responses (fictional institutions). i1 has answered September but not October.
  const dep = {
    // [India, Nigeria, China, Pakistan, Vietnam, US], visa, risk, tne
    'rp-sep': {
      i1: [[-18, -30, 4, -10, 8, 2], 3, 'Visa or immigration policy', 'Yes, modestly'], i2: [[6, -5, 10, 2, 14, 0], 1, 'Competitor destinations', 'Yes, modestly'],
      i3: [[12, 4, 2, 18, 3, 1], -1, 'Reputation or ranking change', 'Yes, significantly'], i6: [[-22, -12, -8, -15, 5, -2], 5, 'Visa or immigration policy', 'Yes, significantly'],
      i7: [[-28, -35, -10, -20, -4, 0], 6, 'Visa or immigration policy', 'Yes, modestly'], i8: [[2, 8, -3, 5, 9, 4], 0, 'Affordability and currency', 'Yes, significantly'],
      i10: [[-40, -25, -12, -30, -8, 3], 7, 'Visa or immigration policy', 'No change'], i11: [[10, 6, 1, 15, 4, 2], -1, 'Competitor destinations', 'Yes, modestly'],
      i5: [[-5, -8, 0, -2, 2, 6], 1, 'Affordability and currency', 'No change'], i13: [[-4, -9, 6, -6, 7, 1], 1, 'Affordability and currency', 'Yes, modestly'] },
    'rp-oct': {
      i2: [[8, -3, 9, 4, 16, 1], 1, 'Competitor destinations', 'Yes, modestly'], i3: [[14, 6, 3, 20, 4, 2], -1, 'Reputation or ranking change', 'Yes, significantly'],
      i6: [[-19, -10, -6, -12, 6, -1], 4, 'Visa or immigration policy', 'Yes, significantly'], i7: [[-31, -38, -12, -22, -6, 0], 7, 'Visa or immigration policy', 'Yes, modestly'],
      i8: [[3, 9, -2, 6, 10, 5], 0, 'Affordability and currency', 'Yes, significantly'], i10: [[-36, -22, -10, -28, -6, 4], 6, 'Visa or immigration policy', 'No change'],
      i11: [[11, 7, 2, 16, 5, 3], -1, 'Competitor destinations', 'Yes, modestly'], i13: [[-2, -7, 7, -5, 9, 2], 1, 'Affordability and currency', 'Yes, modestly'],
      i14: [[5, 12, 1, 9, 3, 0], 0, 'Affordability and currency', 'Yes, significantly'] }
  };
  const responses = [];
  for (const [pid, rows] of Object.entries(dep)) for (const [iid, r] of Object.entries(rows)) {
    const deposits = Object.fromEntries(MARKETS.map((m, n) => [m, r[0][n]]));
    responses.push({ id: `pr-${pid}-${iid}`, pulseId: pid, institutionId: iid, personId: null, demo: true, createdAt: at(pid === 'rp-sep' ? -20 : -3), answers: { deposits, visa: r[1], risk: r[2], tne: r[3] } });
  }
  const ai = { i2: ['Institution-wide strategy in delivery', 'Categorised by assessment type', 'Evidence of impact'], i4: ['Coordinated pilots with governance', 'Categorised by assessment type', 'Budget'], i6: ['Coordinated pilots with governance', 'Case-by-case', 'Governance and risk'], i7: ['Institution-wide strategy in delivery', 'Categorised by assessment type', 'Skills and confidence'], i9: ['Isolated pilots', 'Case-by-case', 'Skills and confidence'], i11: ['Coordinated pilots with governance', 'Case-by-case', 'Data and systems'] };
  for (const [iid, a] of Object.entries(ai)) responses.push({ id: `pr-ai-${iid}`, pulseId: 'ai-oct', institutionId: iid, demo: true, createdAt: at(-4), answers: { stage: a[0], policy: a[1], barrier: a[2] } });
  const fin = { i3: ['10–20%', 'Research and enterprise'], i6: ['30–40%', 'TNE and overseas delivery'], i7: ['10–20%', 'Online and short courses'], i10: ['Over 40%', 'TNE and overseas delivery'], i11: ['Under 10%', 'Research and enterprise'] };
  for (const [iid, a] of Object.entries(fin)) responses.push({ id: `pr-fin-${iid}`, pulseId: 'fin-q4', institutionId: iid, demo: true, createdAt: at(-2), answers: { share: a[0], lever: a[1] } });

  const events = [
    { id: 'e1', title: 'QS Higher Ed Summit: Americas', short: 'Americas', start: '2026-09-30', label: '30 Sep – 2 Oct 2026', place: 'Guadalajara, Mexico', url: 'https://www.qs.com/conferences/americas', attendees: ['u10', 'u7', 'u11'] },
    { id: 'e2', title: 'QS Higher Ed Summit: Asia Pacific', short: 'Asia Pacific', start: '2026-11-03', label: '3–5 Nov 2026', place: 'Bali, Indonesia', url: 'https://www.qs.com/conferences/asia-pacific', attendees: ['u3', 'u6', 'u6b', 'u8', 'u20', 'u13'] },
    { id: 'e3', title: 'QS Higher Ed Summit: Middle East', short: 'Middle East', start: '2026-11-22', label: 'Nov/Dec 2026 · check date', place: 'Abu Dhabi, UAE', url: 'https://www.qs.com/conferences/middle-east', attendees: ['u4', 'u9', 'u14'], dateNote: 'QS pages have shown different dates for this summit. Check the official page.' },
    { id: 'e4', title: 'QS Reimagine Education', short: 'Reimagine', start: '2026-12-06', label: '6–8 Dec 2026', place: 'London, United Kingdom', url: 'https://www.qs.com/conferences/reimagine', attendees: ['u5', 'u12', 'u2'] },
    { id: 'e5', title: 'Global Skills Week', short: 'Skills Week', start: '2027-03-23', label: '23–25 Mar 2027', place: 'Washington, D.C.', url: 'https://www.qs.com/conferences/conference-calendar', attendees: ['u3', 'u12'] }
  ];

  const intros = [
    { id: 'n1', fromId: 'u8', toId: 'u1', reason: 'Exploring UK partners for a joint master’s in data science; saw your TNE interest.', context: 'Directory', status: 'requested', createdAt: at(-1), concierge: false },
    { id: 'n2', fromId: 'u1', toId: 'u6', reason: 'Would value 20 minutes on recruiting under an enrolment cap.', context: 'Community', status: 'accepted', createdAt: at(-40), concierge: false }
  ];

  const board = [
    { id: 'b1', institutionId: 'i4', authorId: 'u5', domain: 'innovation', status: 'Open', createdAt: at(-4), title: 'Low-bandwidth online delivery for 8,000 distance learners', description: 'We need a delivery approach that works on mobile data, with offline access and affordable proctoring. Looking for a 6-month pilot with one faculty.', responses: [{ id: 'br1', partnerId: 'p2', summary: 'Offline-first learning app with sandboxed AI tutoring; 6-month pilot at no licence cost.', createdAt: at(-2), status: 'Shortlisted' }] },
    { id: 'b2', institutionId: 'i1', authorId: 'u1', domain: 'mobility', status: 'Open', createdAt: at(-6), title: 'Faster offer-making in three markets', description: 'Median time to decision is 19 working days. We want under 5 for complete applications from India, Nigeria and Vietnam without adding headcount.', responses: [] }
  ];

  // Paid signings history (demo only).
  const signings = [
    { institutionId: 'i1', tier: 'Member Plus', at: at(-290), founding: true }, { institutionId: 'i6', tier: 'Member Plus', at: at(-285), founding: true },
    { institutionId: 'i3', tier: 'Council', at: at(-60) }, { institutionId: 'i11', tier: 'Member Plus', at: at(-50) },
    { institutionId: 'i2', tier: 'Member', at: at(-45) }, { institutionId: 'i7', tier: 'Member', at: at(-33) },
    { institutionId: 'i8', tier: 'Member', at: at(-25) }, { institutionId: 'i5', tier: 'Member', at: at(-18) }, { institutionId: 'i10', tier: 'Member', at: at(-9) }
  ];

  const posts = [
    { id: 'x1', communityId: 'c1', type: 'Use case', authorId: 'u6', createdAt: at(-9), status: 'Published', title: 'Recruiting under an enrolment cap: what we changed', body: 'We moved to a portfolio view of which programmes use cap allocation best, tightened agent reviews to quarterly, and built a TNE option for two markets where demand exceeded our allocation. Happy to share the scoring template.', replies: [{ id: 'y1', authorId: 'u1', body: 'Very useful. How did you handle programmes that were strategic but scored low?', createdAt: at(-8) }, { id: 'y2', authorId: 'u6', body: 'We ring-fenced a small allocation and review it annually with deans.', createdAt: at(-8) }], useful: ['u1', 'u3', 'u7'] },
    { id: 'x2', communityId: 'c1', type: 'Question', authorId: 'u7', createdAt: at(-2), status: null, title: 'Has anyone moved January deadlines because of visa processing times?', body: 'We are considering moving our January postgraduate deadline four weeks earlier. What happened to conversion if you did this?', replies: [{ id: 'y3', authorId: 'u11', body: 'We did for two markets. Applications dipped slightly but late withdrawals fell. Net positive.', createdAt: at(-1) }], useful: ['u1'] },
    { id: 'x3', communityId: 'c4', type: 'Practice note', authorId: 'u7', createdAt: at(-6), status: null, title: 'Our AI assessment policy, one year on', body: 'We replaced a blanket ban with three categories: AI-free, AI-assisted and AI-integrated. Misconduct cases fell and staff confidence rose.', replies: [], useful: ['u2'] }
  ];

  return { meta: { createdAt: new Date().toISOString(), version: 4 }, institutions, partners, people, personas, communities, openSessions, intel, library, webinars, pulses, responses, events, intros, board, signings, posts, audit: [] };
}
