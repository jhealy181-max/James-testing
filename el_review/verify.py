"""Verify the detailed review workbook: financial cells unchanged, formulas recalc without errors, dashboard reconciles."""
import openpyxl, subprocess, os, sys, json, glob, shutil, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "University_learning_comparison (3).xlsx")
OUT = os.path.join(ROOT, "University_experiential_learning_detailed_review.xlsx")
a = openpyxl.load_workbook(SRC); b = openpyxl.load_workbook(OUT)
bad = 0
for name in ["UK providers", "Revenue evidence", "Dashboard"]:
    for row in a[name].iter_rows():
        for c in row:
            if name == "Dashboard" and c.row >= 56: continue
            if b[name][c.coordinate].value != c.value:
                bad += 1; print("CHANGED", name, c.coordinate, repr(c.value)[:60], "->", repr(b[name][c.coordinate].value)[:60])
print("financial cells changed:", bad, "| Dashboard charts:", len(b["Dashboard"]._charts))
# recalc with LibreOffice
tmp = tempfile.mkdtemp()
subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", tmp, OUT], capture_output=True, timeout=300)
rc = openpyxl.load_workbook(os.path.join(tmp, os.path.basename(OUT)), data_only=True)
errs = 0
for ws in rc.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if isinstance(c.value, str) and c.value.startswith("#") and c.value[1:4].isupper():
                errs += 1
                if errs < 15: print("FORMULA ERROR", ws.title, c.coordinate, c.value)
print("formula errors after recalc:", errs)
d = rc["EL dashboard"]
for r in range(6, 45):
    vals = [(d.cell(r, j).value) for j in range(1, 14)]
    if any(v not in (None, "") for v in vals): print(r, [v for v in vals if v not in (None, "")])
print("Dashboard F6 (UK income £m):", rc["Dashboard"]["A6"].value, "| EL block:", rc["Dashboard"]["F57"].value, rc["Dashboard"]["M57"].value, rc["Dashboard"]["F58"].value, rc["Dashboard"]["M58"].value)
# reconcile with python counts
reg = rc["EL scheme register"]
q = sum(1 for r in range(7, reg.max_row + 1) if reg.cell(r, 36).value == "Yes")
print("register AJ=Yes rows:", q)
shutil.rmtree(tmp)
