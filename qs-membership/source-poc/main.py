"""QS Strategic Intelligence proof of concept. Python standard library only.

Demo data, demo identity switching, and no authentication. Do not enter sensitive data.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB = Path(os.environ.get("QS_DB_PATH", str(ROOT / "data" / "portal.sqlite3")))
STATIC = ROOT / "static"
PORT = int(os.environ.get("PORT", "3000"))
DB_LOCK = threading.RLock()
DOMAINS = [
    {"id": "mobility", "name": "Global talent & mobility", "question": "Where will learners and talent come from, and where will they go?", "topics": ["International education", "Student flows", "Recruitment", "Transnational education"]},
    {"id": "institutions", "name": "Institutions & reputation", "question": "How do institutions strengthen performance and global standing?", "topics": ["Rankings", "Reputation", "Research", "Institutional strategy"]},
    {"id": "skills", "name": "Skills, jobs & outcomes", "question": "What skills do economies need, and how is education delivering them?", "topics": ["Labour market demand", "Employability", "Employer partnerships", "AI and work"]},
    {"id": "innovation", "name": "Innovation & new models", "question": "Which new approaches are worth adopting and scaling?", "topics": ["Responsible AI", "Assessment", "EdTech", "New models"]},
]
TIERS = {
    "Bronze": {"content": True, "working_groups": False, "roundtables": False, "event_tickets": 0, "demo_price_gbp": 18000},
    "Silver": {"content": True, "working_groups": True, "roundtables": True, "event_tickets": 0, "demo_price_gbp": 42000},
    "Gold": {"content": True, "working_groups": True, "roundtables": True, "event_tickets": 10, "demo_price_gbp": 78000},
}
SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '', institution_type TEXT NOT NULL DEFAULT 'University',
  overview TEXT NOT NULL DEFAULT '', priorities TEXT NOT NULL DEFAULT '[]',
  ranking_priorities TEXT NOT NULL DEFAULT '', collaboration TEXT NOT NULL DEFAULT '',
  peer_visible INTEGER NOT NULL DEFAULT 1, tier TEXT NOT NULL DEFAULT 'Bronze',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', job_family TEXT NOT NULL DEFAULT 'Leadership',
  email TEXT NOT NULL DEFAULT '', interests TEXT NOT NULL DEFAULT '[]',
  newsletter INTEGER NOT NULL DEFAULT 1, account_role TEXT NOT NULL DEFAULT 'member'
);
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY, domain TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
  coordinator TEXT NOT NULL, cadence TEXT NOT NULL DEFAULT 'Quarterly online'
);
CREATE TABLE IF NOT EXISTS group_members (
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY(person_id,group_id)
);
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, kind TEXT NOT NULL,
  domains TEXT NOT NULL, audiences TEXT NOT NULL DEFAULT '[]', source TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '', published TEXT NOT NULL, is_sample INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, date_label TEXT NOT NULL, place TEXT NOT NULL,
  domains TEXT NOT NULL, url TEXT NOT NULL, format TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS peer_requests (
  id INTEGER PRIMARY KEY, from_organization_id INTEGER NOT NULL REFERENCES organizations(id),
  to_organization_id INTEGER NOT NULL REFERENCES organizations(id),
  person_id INTEGER NOT NULL REFERENCES people(id), message TEXT NOT NULL,
  created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft'
);
"""


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB, timeout=20)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    return c


@contextmanager
def database():
    c = connect()
    try:
        with c:
            yield c
    finally:
        c.close()


def seed():
    with DB_LOCK, database() as c:
        c.executescript(SCHEMA)
        if c.execute("SELECT 1 FROM organizations LIMIT 1").fetchone():
            return
        c.executemany("INSERT INTO organizations (slug,name,country,institution_type,overview,priorities,ranking_priorities,collaboration,peer_visible,tier,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
            ("imperial-college-london", "Imperial College London", "United Kingdom", "University", "Example institutional member page for a university focused on research, international collaboration and talent.", json.dumps(["institutions", "innovation", "skills"]), "Research visibility; international collaboration; understanding reputation signals.", "Exchange practice on responsible AI, research strategy and skills partnerships.", 1, "Gold", now()),
            ("sample-global-university", "Sample Global University", "Singapore", "University", "Illustrative peer profile for cross-border collaboration.", json.dumps(["mobility", "innovation"]), "Regional visibility and international engagement.", "Compare transnational education and AI assessment approaches.", 1, "Silver", now()),
        ])
        c.executemany("INSERT INTO people (organization_id,name,role,job_family,email,interests,newsletter,account_role) VALUES (?,?,?,?,?,?,?,?)", [
            (1, "Alex Taylor", "Director of Strategy", "Strategy", "alex@example.invalid", json.dumps(["institutions", "innovation"]), 1, "owner"),
            (1, "Jordan Price", "International Director", "Recruitment", "jordan@example.invalid", json.dumps(["mobility", "institutions"]), 1, "member"),
            (1, "Samira Khan", "Director of Research Strategy", "Research", "samira@example.invalid", json.dumps(["institutions", "skills"]), 0, "member"),
            (2, "Mika Tan", "Director of Global Partnerships", "Partnerships", "mika@example.invalid", json.dumps(["mobility", "innovation"]), 1, "owner"),
        ])
        c.executemany("INSERT INTO groups (domain,title,description,coordinator,cadence) VALUES (?,?,?,?,?)", [
            ("institutions", "Ranking, reputation & institutional strategy", "Compare evidence, attribution, research strengths and ethical approaches to building visibility. Peer exchange does not influence QS editorial rankings decisions.", "Sofia Alvarez · illustrative", "Quarterly online + annual workshop"),
            ("mobility", "Student recruitment risk & compliance", "Share approaches to source-market change, ethical recruitment, policy monitoring and student protection.", "Maya Chen · illustrative", "Monthly online"),
            ("mobility", "Transnational education & partnerships", "Explore partner selection, operating models, quality assurance and cross-border delivery.", "Daniel Okafor · illustrative", "Quarterly online"),
            ("skills", "Skills & employer partnerships", "Apply labour market evidence to programmes, placements and graduate outcomes.", "James Patel · illustrative", "Quarterly online"),
            ("innovation", "Responsible AI & assessment", "Compare governance, institutional capability and assessment redesign with other universities.", "Leila Morgan · illustrative", "Quarterly online"),
            ("innovation", "EdTech & emerging models", "Share vendor evaluation methods and evidence from pilots across learning and student services.", "Oliver Brooks · illustrative", "Quarterly online"),
        ])
        c.execute("INSERT INTO group_members (person_id,group_id) VALUES (1,5)")
        c.executemany("INSERT INTO content (title,summary,kind,domains,audiences,source,url,published,is_sample) VALUES (?,?,?,?,?,?,?,?,?)", [
            ("QS World University Rankings Dataset", "Benchmark institutional performance and explore the indicators behind rankings.", "Data product", '["institutions"]', '["Strategy","Research"]', "QS public product page", "https://www.qs.com/solutions/world-university-rankings-dataset", "2026-09-20", 0),
            ("QS Student Recruitment Datasets", "Recruitment intelligence built on Global Student Flows and QS student-perception evidence.", "Data product", '["mobility"]', '["Recruitment","Partnerships"]', "QS public product page", "https://www.qs.com/solutions/student-recruitment-datasets", "2026-09-19", 0),
            ("QS Global Student Flows", "Scenarios and drivers to inform future student recruitment and TNE choices.", "Framework", '["mobility","institutions"]', '["Recruitment","Strategy","Partnerships"]', "QS public research", "https://www.qs.com/insights/global-student-flows-report", "2025-10-28", 0),
            ("QS AI Capability Assessments", "Assess, benchmark and strengthen responsible institutional AI capability.", "Assessment", '["innovation","institutions"]', '["Strategy","Research","Leadership"]', "QS public product page", "https://www.qs.com/en-us/solutions/ai-capability-assessments", "2026-08-28", 0),
            ("QS Responsible AI Consortium", "A network for AI capability, shared guidance and peer learning.", "Consortium", '["innovation","skills"]', '["Strategy","Leadership"]', "QS public product page", "https://www.qs.com/solutions/responsible-ai-consortium", "2026-08-28", 0),
            ("QS World Future Skills Index", "Compare national alignment of education systems and future workforce needs.", "Index", '["skills"]', '["Strategy","Research","Partnerships"]', "QS public research", "https://www.qs.com/insights/world-future-skills-index", "2026-09-18", 0),
            ("How QS consultancy used student flows to prioritise recruitment markets", "Case example using QS Global Student Flows to test market priorities for a UK university.", "Case study", '["mobility"]', '["Recruitment","Strategy"]', "QS public case study", "https://www.qs.com/case-studies/global-student-flows-international-recruitment-strategy", "2026-08-31", 0),
            ("The next map of global student demand", "Sample executive briefing: test demand shifts alongside policy, affordability and programme fit.", "Executive briefing", '["mobility","institutions"]', '["Recruitment","Strategy"]', "Illustrative portal editorial", "", "2026-09-24", 1),
            ("From rankings data to reputation strategy", "Sample executive briefing: connect indicator evidence to credible research and partnership choices.", "Executive briefing", '["institutions"]', '["Strategy","Research","Leadership"]', "Illustrative portal editorial", "", "2026-09-23", 1),
            ("A practical institutional AI adoption roadmap", "Sample member newsletter: move from isolated pilots to accountable investment.", "Newsletter", '["innovation","skills"]', '["Strategy","Leadership","Research"]', "Illustrative portal editorial", "", "2026-09-22", 1),
            ("Reimagine Education 2025 video highlights", "Past conference highlights linked by QS from the 2026 event page.", "Video", '["innovation","skills"]', '["Leadership","Strategy"]', "QS conference video", "https://www.youtube.com/watch?v=q9ubR4TnjI8", "2025-12-10", 0),
        ])
        c.executemany("INSERT INTO events (title,date_label,place,domains,url,format) VALUES (?,?,?,?,?,?)", [
            ("QS Higher Ed Summit: Americas", "30 Sep – 2 Oct 2026", "Guadalajara", '["mobility","institutions","skills","innovation"]', "https://www.qs.com/conferences/americas", "Summit"),
            ("QS Higher Ed Summit: Asia Pacific", "3–5 Nov 2026", "Bali", '["mobility","institutions","innovation"]', "https://www.qs.com/conferences/asia-pacific", "Summit"),
            ("QS Higher Ed Summit: Middle East", "22–24 Nov 2026", "Abu Dhabi", '["mobility","institutions","innovation"]', "https://www.qs.com/conferences/middle-east", "Summit"),
            ("QS Reimagine Education", "6–8 Dec 2026", "London", '["skills","innovation"]', "https://www.qs.com/conferences/reimagine", "Conference"),
            ("Global Skills Week", "23–25 Mar 2027", "Washington, D.C.", '["skills","innovation"]', "https://www.qs.com/conferences/conference-calendar", "Summit"),
        ])


def row(r, fields=()):
    o = dict(r)
    for f in fields:
        o[f] = json.loads(o[f])
    return o


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:65] or "institution"


def valid_domains(v):
    if not isinstance(v, list) or any(x not in {d["id"] for d in DOMAINS} for x in v):
        raise ValueError("Choose valid domains.")
    return list(dict.fromkeys(v))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("%s %s" % (self.address_string(), fmt % args), flush=True)

    def send_json(self, data, status=200):
        b = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def send_file(self, name, mime):
        b = (STATIC / name).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def data(self):
        n = int(self.headers.get("Content-Length", "0"))
        if n > 100_000:
            raise ValueError("Request too large.")
        obj = json.loads(self.rfile.read(n) or b"{}")
        if not isinstance(obj, dict):
            raise ValueError("Expected a JSON object.")
        return obj

    def do_GET(self):
        try:
            p = urlparse(self.path)
            if p.path in ("/", "/index.html"):
                return self.send_file("index.html", "text/html; charset=utf-8")
            if p.path == "/styles.css":
                return self.send_file("styles.css", "text/css; charset=utf-8")
            if p.path == "/app.js":
                return self.send_file("app.js", "text/javascript; charset=utf-8")
            if p.path == "/api/health":
                return self.send_json({"ok": True, "mode": "demo"})
            if p.path == "/api/bootstrap":
                with database() as c:
                    orgs = [row(x, ("priorities",)) for x in c.execute("SELECT * FROM organizations ORDER BY id")]
                    people = [row(x, ("interests",)) for x in c.execute("SELECT * FROM people ORDER BY id")]
                    groups = [dict(x) for x in c.execute("SELECT * FROM groups ORDER BY id")]
                    members = [dict(x) for x in c.execute("SELECT * FROM group_members")]
                    content = [row(x, ("domains", "audiences")) for x in c.execute("SELECT * FROM content ORDER BY published DESC, id DESC")]
                    events = [row(x, ("domains",)) for x in c.execute("SELECT * FROM events ORDER BY id")]
                    requests = [dict(x) for x in c.execute("SELECT * FROM peer_requests ORDER BY id DESC")]
                return self.send_json({"domains": DOMAINS, "tiers": TIERS, "organizations": orgs, "people": people, "groups": groups, "group_members": members, "content": content, "events": events, "peer_requests": requests})
            self.send_json({"error": "Not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def do_POST(self):
        self.mutate("POST")

    def do_PATCH(self):
        self.mutate("PATCH")

    def do_DELETE(self):
        self.mutate("DELETE")

    def mutate(self, method):
        try:
            p = urlparse(self.path).path
            d = self.data() if method in ("POST", "PATCH") else {}
            with DB_LOCK, database() as c:
                if method == "POST" and p == "/api/organizations":
                    name = str(d.get("name", "")).strip()[:120]
                    if len(name) < 3:
                        raise ValueError("Enter an institution name of at least three characters.")
                    slug = slugify(name)
                    base, i = slug, 2
                    while c.execute("SELECT 1 FROM organizations WHERE slug=?", (slug,)).fetchone():
                        slug = f"{base[:56]}-{i}"; i += 1
                    tier = d.get("tier", "Bronze")
                    if tier not in TIERS:
                        raise ValueError("Invalid membership tier.")
                    cur = c.execute("INSERT INTO organizations (slug,name,country,institution_type,overview,priorities,ranking_priorities,collaboration,peer_visible,tier,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", (slug, name, str(d.get("country", ""))[:80], str(d.get("institution_type", "University"))[:80], str(d.get("overview", ""))[:1500], json.dumps(valid_domains(d.get("priorities", []))), str(d.get("ranking_priorities", ""))[:1000], str(d.get("collaboration", ""))[:1000], int(bool(d.get("peer_visible", True))), tier, now()))
                    return self.send_json({"id": cur.lastrowid, "slug": slug}, 201)
                m = re.fullmatch(r"/api/organizations/(\d+)", p)
                if method == "PATCH" and m:
                    oid = int(m.group(1)); old = c.execute("SELECT * FROM organizations WHERE id=?", (oid,)).fetchone()
                    if not old: return self.send_json({"error": "Institution not found"}, 404)
                    name = str(d.get("name", old["name"])).strip()[:120]
                    if len(name) < 3: raise ValueError("Enter an institution name.")
                    tier = d.get("tier", old["tier"])
                    if tier not in TIERS: raise ValueError("Invalid tier.")
                    fields = {"name": name, "country": str(d.get("country", old["country"]))[:80], "institution_type": str(d.get("institution_type", old["institution_type"]))[:80], "overview": str(d.get("overview", old["overview"]))[:1500], "priorities": json.dumps(valid_domains(d.get("priorities", json.loads(old["priorities"])))), "ranking_priorities": str(d.get("ranking_priorities", old["ranking_priorities"]))[:1000], "collaboration": str(d.get("collaboration", old["collaboration"]))[:1000], "peer_visible": int(bool(d.get("peer_visible", old["peer_visible"]))), "tier": tier}
                    c.execute("UPDATE organizations SET " + ",".join(f"{x}=?" for x in fields) + " WHERE id=?", (*fields.values(), oid))
                    return self.send_json({"id": oid})
                if method == "POST" and p == "/api/people":
                    org_id = int(d.get("organization_id", 0))
                    if not c.execute("SELECT 1 FROM organizations WHERE id=?", (org_id,)).fetchone(): raise ValueError("Choose an existing institution.")
                    name = str(d.get("name", "")).strip()[:100]
                    if len(name) < 2: raise ValueError("Enter a member name.")
                    cur = c.execute("INSERT INTO people (organization_id,name,role,job_family,email,interests,newsletter,account_role) VALUES (?,?,?,?,?,?,?,?)", (org_id, name, str(d.get("role", ""))[:100], str(d.get("job_family", "Leadership"))[:80], str(d.get("email", ""))[:160], json.dumps(valid_domains(d.get("interests", []))), int(bool(d.get("newsletter", True))), "member"))
                    return self.send_json({"id": cur.lastrowid}, 201)
                m = re.fullmatch(r"/api/people/(\d+)", p)
                if method == "PATCH" and m:
                    pid = int(m.group(1)); old = c.execute("SELECT * FROM people WHERE id=?", (pid,)).fetchone()
                    if not old: return self.send_json({"error": "Member not found"}, 404)
                    name = str(d.get("name", old["name"])).strip()[:100]
                    if len(name) < 2: raise ValueError("Enter a member name.")
                    fields = {"name": name, "role": str(d.get("role", old["role"]))[:100], "job_family": str(d.get("job_family", old["job_family"]))[:80], "email": str(d.get("email", old["email"]))[:160], "interests": json.dumps(valid_domains(d.get("interests", json.loads(old["interests"])))), "newsletter": int(bool(d.get("newsletter", old["newsletter"])))}
                    c.execute("UPDATE people SET " + ",".join(f"{x}=?" for x in fields) + " WHERE id=?", (*fields.values(), pid))
                    return self.send_json({"id": pid})
                m = re.fullmatch(r"/api/groups/(\d+)/members/(\d+)", p)
                if m and method in ("POST", "DELETE"):
                    gid, pid = map(int, m.groups())
                    person = c.execute("SELECT organization_id FROM people WHERE id=?", (pid,)).fetchone()
                    group = c.execute("SELECT id FROM groups WHERE id=?", (gid,)).fetchone()
                    if not person or not group: raise ValueError("Choose a valid group and member.")
                    org = c.execute("SELECT tier FROM organizations WHERE id=?", (person["organization_id"],)).fetchone()
                    if method == "POST" and not TIERS[org["tier"]]["working_groups"]: return self.send_json({"error": "Working groups require Silver or Gold access in this demo."}, 403)
                    if method == "POST": c.execute("INSERT OR IGNORE INTO group_members (person_id,group_id) VALUES (?,?)", (pid, gid))
                    else: c.execute("DELETE FROM group_members WHERE person_id=? AND group_id=?", (pid, gid))
                    return self.send_json({"joined": method == "POST"})
                if method == "POST" and p == "/api/peer-requests":
                    pid, dest = int(d.get("person_id", 0)), int(d.get("to_organization_id", 0))
                    person = c.execute("SELECT organization_id FROM people WHERE id=?", (pid,)).fetchone()
                    peer = c.execute("SELECT peer_visible FROM organizations WHERE id=?", (dest,)).fetchone()
                    msg = str(d.get("message", "")).strip()[:1000]
                    if not person or not peer or not peer["peer_visible"] or dest == person["organization_id"] or len(msg) < 5:
                        raise ValueError("Choose a visible peer and add a message (at least five characters).")
                    cur = c.execute("INSERT INTO peer_requests (from_organization_id,to_organization_id,person_id,message,created_at,status) VALUES (?,?,?,?,?,?)", (person["organization_id"], dest, pid, msg, now(), "draft"))
                    return self.send_json({"id": cur.lastrowid, "status": "draft", "sent": False}, 201)
            self.send_json({"error": "Not found"}, 404)
        except ValueError as e:
            self.send_json({"error": str(e)}, 400)
        except sqlite3.Error as e:
            self.send_json({"error": f"Database error: {e}"}, 500)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)


if __name__ == "__main__":
    seed()
    print(f"QS portal POC running on 0.0.0.0:{PORT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
