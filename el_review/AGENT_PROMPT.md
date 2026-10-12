# Per-institution research agent instructions
1. Read /home/user/James-testing/el_review/RESEARCH_BRIEF.md in full (all Rulings sections and the Search-limit section) and follow it exactly.
2. Skim /home/user/James-testing/el_review/results/RG13.json for format/depth (do not copy content).
3. Load WebSearch via ToolSearch ("select:WebSearch"). WebFetch does not work. Use allowed_domains for site searches.
4. Legacy rows: /home/user/James-testing/el_review/legacy/<ID>.json. If results/<ID>.json exists as Partial, RESUME it (merge) per the brief.
5. Write /home/user/James-testing/el_review/results/<ID>.json (validate with python3 -c "import json;json.load(open(path))"). Edit no other file; do not run build.py.
6. If a search is refused for a limit: write the file as Partial immediately (only if you have at least one searched area or a resumed file) and stop. Never write an empty placeholder.
7. Final reply under 120 words: records, number meeting all three with current delivery, review status, searches used, definitional problems.
