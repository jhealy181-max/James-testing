# Handoff: continue the experiential-learning review in a new session

Repo: `jhealy181-max/James-testing`, branch `claude/blissful-goldberg-mo317f` (everything is committed and pushed).
Last build: 44 institutions with result files, 21 complete, 464 scheme records, 144 current qualifying schemes.

## Key files
| File | Purpose |
|---|---|
| `University_experiential_learning_detailed_review.xlsx` | Current deliverable workbook (rebuilt from the JSON results) |
| `University_experiential_learning_institution_profiles.md` | Current institution profiles |
| `University_learning_comparison (3).xlsx` | Original workbook, never edit |
| `el_review/RESEARCH_BRIEF.md` | Definitions, rulings, schema, search-limit rules, reduced-depth mode (last section) |
| `el_review/AGENT_PROMPT.md` | Per-institution agent instructions |
| `el_review/results/<ID>.json` | One research result per institution (the source of truth) |
| `el_review/institutions.json`, `el_review/legacy/<ID>.json` | Sample list and legacy rows to reassess |
| `el_review/build.py`, `el_review/verify.py` | Rebuild workbook, profiles, checkpoint; verify financial cells and formulas |
| `el_review/CHECKPOINT.md` | Generated status: complete, partial, not started |

## Status (from the result files)
- Complete (21): RG02, RG03, RG06, RG09, RG11, RG12, RG13, RG15, RG16, RG18, RG19, RG21, RG22, RG24, AU02, UK03, UK04, UK06, UK07, UK09, UK10
- Partial, resume from their file (21): RG01 Birmingham, RG04 Cardiff, RG05 Durham, RG07 Exeter, RG08 Glasgow, RG10 King’s College London, RG14 Manchester, RG17 Oxford, RG20 Sheffield, RG23 Warwick, AU03 Sydney, AU06 Queensland, AU09 University of Technology Sydney, UK02 St Andrews, UK05 Aberdeen, UK08 Sussex, UK11 Heriot-Watt, UK12 East Anglia, UK14 Swansea, UK15 Essex, UK17 Brunel
- Not started or stub only (82): AU01 UNSW Sydney, AU04 Australian National University, AU05 Monash, AU10 RMIT, UK01 Bath, UK13 Dundee, UK16 Kent, UK18 Aston, UK19 Stirling, UK20 SOAS, UK21 Birkbeck, UK22 Royal Holloway, UK23 City St George’s, UK24 Oxford Brookes, UK25 Northumbria, UK26 Portsmouth, UK27 Coventry, UK28 Nottingham Trent, UK29 Manchester Metropolitan, UK30 Plymouth, US01 Massachusetts Institute of Technology, US02 Harvard, US03 Stanford, US04 California Institute of Technology, US05 California Berkeley, US06 Chicago, US07 Pennsylvania, US08 Cornell, US09 Yale, US10 Princeton, US11 Columbia, US12 Johns Hopkins, US13 Michigan Ann Arbor, US14 California Los Angeles, US15 Duke, US16 New York University, US17 Northwestern, US18 Carnegie Mellon, US19 Southern California, US20 Texas Austin, US21 California San Diego, US22 Brown, US23 Illinois Urbana-Champaign, US24 Georgia Institute of Technology, US25 Purdue, US26 Wisconsin Madison, US27 Washington, US28 Boston University, US29 Pennsylvania State, US30 Ohio State, EU01 PSL, EU02 Paris-Saclay, EU03 Sorbonne University, EU04 Institut Polytechnique de Paris, EU05 Sciences Po, EU06 Technical University of Munich, EU07 LMU Munich, EU08 Heidelberg, EU09 RWTH Aachen, EU10 Karlsruhe Institute of Technology, EU11 Humboldt Berlin, EU12 Delft University of Technology, EU13 Amsterdam, EU14 Utrecht, EU15 Leiden, EU16 Wageningen, EU17 KU Leuven, EU18 Ghent, EU19 Trinity College Dublin, EU20 University College Dublin, EU21 Copenhagen, EU22 Aarhus, EU23 Lund, EU24 KTH Royal Institute of Technology, EU25 Uppsala, EU26 Aalto, EU27 Helsinki, EU28 Barcelona, EU29 Pompeu Fabra, EU30 Politecnico di Milano, AU07 Western Australia, AU08 Adelaide University
- Stubs (AU07, AU08) hold only legacy rows, no research. The builder treats them as not started.

## Decisions already made
- Do NOT re-verify the 44 existing institutions. Only finish partial ones and run the remaining ones.
- Reduced depth for everything remaining: about 15 searches each (see "Reduced-depth mode" in the brief).
- Direct page access was blocked by the network policy. If the new session has it (test: WebFetch on a university page), use it and quote page text. Otherwise use WebSearch extracts and label them as such.
- Web search is capped at 200 per turn across all agents, so run about 8–10 institutions at a time, not 5 at 40 searches.
- Use `model: "sonnet"` for research agents. One institution per agent.
- Partial files are resumed (merged), never restarted. If a search is refused, an agent saves Partial and stops. It never writes an empty file.

## Remaining work
1. Research the not-started and partial institutions above.
2. Run `python3 -I el_review/build.py` then `python3 -I el_review/verify.py`.
3. Consolidation pass: resolve the QC warnings in `el_review/qc_report.txt` (mostly unclear partner types), duplicates (`likely_duplicate_of`), and cross-check "Yes" ratings for consistent application of the rulings.
4. Fix the Melbourne items: ENGR90039 has conflicting 2026 status; the Business and Economics "Industry Projects" page (S7) probably duplicates S6/S10.
5. Add the findings summary, a corrections log against the legacy research, and a QS-discrepancy note.
6. Commit and push after each batch.

## Prompt to paste into the new session
```
Continue the university experiential-learning review in this repository (branch claude/blissful-goldberg-mo317f). Read el_review/HANDOFF.md first, then el_review/RESEARCH_BRIEF.md and el_review/CHECKPOINT.md.

Decisions already made: do not re-verify the 44 institutions already researched; finish the partial ones and research every not-started institution in reduced-depth mode (about 15 searches each). Use Sonnet research agents, one institution per agent, about 8-10 at a time, following el_review/AGENT_PROMPT.md. Test first whether WebFetch can open a university page; if it can, have agents read and quote key pages directly, otherwise use search extracts and label them as such.

After each batch of results: commit and push, rebuild with python3 -I el_review/build.py, and update the checkpoint. When all 124 institutions have a Complete or explicit Partial status, run the consolidation pass in HANDOFF.md, rebuild, run el_review/verify.py, and give me the workbook, institution profiles and a brief findings summary with the main corrections to the previous research and any unfinished coverage. Claim completion only for work actually done. Do not fabricate sources, partners or numbers.
```
