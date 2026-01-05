#!/usr/bin/env python3
"""
Scan PDF files under the `output/` folder, extract rows under the "Youtube Links:" section,
and write them into `youtube_links.csv`.

Usage:
    python getYoutubeLinks.py [output_dir] [csv_path]

If dependencies are missing, install `pypdf` (recommended):
    pip install pypdf

"""
from pathlib import Path
import re
import csv
import sys

try:
    # pypdf is the modern package name; PyPDF2 may also be present
    from pypdf import PdfReader
except Exception:
    try:
        from PyPDF2 import PdfReader
    except Exception:
        PdfReader = None


def extract_text_from_pdf(path: Path) -> str:
    if PdfReader is None:
        raise RuntimeError("No PDF reader available. Install 'pypdf' or 'PyPDF2'.")
    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages:
        try:
            text = page.extract_text()
        except Exception:
            text = None
        if text:
            parts.append(text)
    return "\n".join(parts)


def parse_youtube_links(text: str) -> list:
    """Find sections titled 'Youtube Links:' and return the following non-empty lines
    until the next blank line or a new section header (line ending with ':').
    """
    if not text:
        return []
    lines = text.splitlines()
    links = []
    # find any line that contains 'youtube links:' case-insensitive
    pattern = re.compile(r"^\s*youtube links\s*:\s*$", re.IGNORECASE)
    i = 0
    while i < len(lines):
        if pattern.match(lines[i].strip()):
            j = i + 1
            while j < len(lines):
                line = lines[j].strip()
                if line == "":
                    break
                # treat a new section header like 'Other Section:' as terminator
                if line.endswith(":"):
                    break
                # ignore common bullet markers
                if line.startswith("- ") or line.startswith("• ") or line.startswith("* "):
                    line = line[2:].strip()
                if line:
                    links.append(line)
                j += 1
            i = j
        else:
            i += 1
    return links


def find_pdfs(root: Path):
    for p in root.rglob("*.pdf"):
        yield p


def main():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("output")
    csv_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("youtube_links.csv")

    if not out_dir.exists():
        print(f"Directory not found: {out_dir}")
        sys.exit(2)

    results = []
    for pdf in find_pdfs(out_dir):
        try:
            text = extract_text_from_pdf(pdf)
        except Exception as e:
            print(f"Skipping {pdf} (error reading): {e}")
            continue
        links = parse_youtube_links(text)
        for l in links:
            results.append({"source": str(pdf), "link": l})

    # deduplicate while preserving order
    seen = set()
    unique = []
    for r in results:
        key = (r["source"], r["link"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    with csv_path.open("w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["source", "link"])
        writer.writeheader()
        for r in unique:
            writer.writerow(r)

    print(f"Wrote {len(unique)} rows to {csv_path}")


if __name__ == "__main__":
    main()
