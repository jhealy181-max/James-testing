# QS Strategic Intelligence — Replit proof of concept

This ZIP contains a runnable multi-institution web app plus a detailed strategy and development brief (`PRODUCT_BRIEF.md`). It is an editable POC rather than the earlier single-file HTML mock-up; that mock-up is retained under `reference/`.

## Run on Replit

1. Open [replit.com/import](https://replit.com/import), choose **ZIP file**, and upload this archive. The files should appear at the project root, with `main.py` and `.replit` together.
2. Press **Run**. The command is `python3 main.py`; the app binds to `0.0.0.0` and the port from `PORT` (default `3000`). The Python standard library is sufficient; there is no package installation or API key.
3. Open the app preview. The SQLite database is created at `data/portal.sqlite3` on first run and seeded with two illustrative institutions.

You can also run locally with `python3 main.py` and open `http://localhost:3000`.

## Try these workflows

- **Create an institution page:** Institution pages → Create institution page. Fill priorities, ranking questions and collaboration interests; click Save. No approval step.
- **Add a delegate:** Open that institution → Add member. Switch to that demo person with the **View as** menu.
- **Manage a personal profile:** Save role, interests and newsletter preference; inspect institutional entitlements.
- **Join a working group:** Silver/Gold members can join; Bronze users are blocked by the server. The seeded Imperial College London account is Gold.
- **Discover peers:** Show or hide an institution in the peer directory. An introduction request is saved as an **unsent draft**.
- **Explore QS material:** Intelligence feed is matched to interests and job family; the library and events view link to public QS material.

## POC boundaries

**There is no authentication or organisation verification.** The user switcher is for demonstration, and anyone with access to this POC can edit sample pages. Avoid real contact details, personal data and commercially sensitive content. No email or peer request is actually delivered. Tier prices, group coordinators and member profiles are illustrative. The app does not import licensed rankings values or private QS datasets.

For production, follow the safeguards and requirements in `PRODUCT_BRIEF.md`: identity, delegated admin, rights-aware QS integrations, CMS, consent, durable managed database, audit and membership operations.

## Files

| File | Purpose |
| --- | --- |
| `main.py` | Standard-library HTTP server, SQLite schema, seed records, API and entitlement check |
| `static/index.html`, `styles.css`, `app.js` | Responsive client UI |
| `PRODUCT_BRIEF.md` | Product strategy, staffing, QS integration plan, journeys and engineering brief |
| `.replit` | Replit Run command and web port |
| `reference/Original_HTML_Concept.html` | Earlier single-file concept for visual reference |

To reset example data, stop the app and delete `data/portal.sqlite3`; the next run recreates it. Keep a copy if you want to preserve pages you created. Replit ZIP import does not transfer a live database from another project unless you deliberately include it; this ZIP contains no database.
