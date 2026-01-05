"""Generate country PDFs from `countries.csv`.

This script reads `countries.csv`, queries the OpenAI API for factual
information about each country marked with a flag of 'Y', and generates a
PDF for each country containing sections such as continent, languages,
population, landmarks, history, important people, current conflicts, and
five YouTube links. Generated PDFs are saved under `output/<Continent>/`.

Requirements:
- Set the environment variable `OPENAI_API_KEY` with a valid API key.
- Install dependencies: `pandas`, `pypdf`/`openai` client as used, and
  `reportlab` (for PDF creation).

Usage:
    python getCountryData.py
"""

import os
import json
import pandas as pd
from openai import OpenAI
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# -----------------------------
# CONFIG
# -----------------------------
OUTPUT_DIR = "output"
MODEL = "gpt-4.1-mini"

os.makedirs(OUTPUT_DIR, exist_ok=True)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# -----------------------------
# OPENAI QUERY
# -----------------------------
def get_country_details(country: str) -> dict:
    prompt = f"""
Provide factual information for the country "{country}" strictly in JSON format with these fields:

country
continent
languages
population
currency
area
landmarks with small writeup for each landmark
head_of_state
cultural_events with small writeup for each event
food_writeup
brief_history
important_people
current_conflicts
5 youtube links that describe the country (field name: five_youtube_video_titles)

Area should be in square kilometers. 
Population and area should be comma separated. 
Keep responses concise, accurate, and neutral.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a factual geography, culture, and world affairs expert."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )
    raw_text = response.choices[0].message.content
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        raw_text = raw_text.replace("json", "", 1).strip()
    return json.loads(raw_text)

    #return json.loads(response.choices[0].message.content)

# Add helper to sanitize filenames
def safe_filename(name: str) -> str:
    return "".join(c if c.isalnum() or c in " -_." else "_" for c in str(name)).strip() or "unnamed"

# -----------------------------
# PDF GENERATION
# -----------------------------
def create_country_pdf(data: dict, output_dir: str):
    # ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # build safe filepath using returned country name (fallback to 'country')
    filename = safe_filename(data.get("country", "country")) + ".pdf"
    file_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    content = []

    def add(text):
        content.append(Paragraph(text, styles["Normal"]))
        content.append(Spacer(1, 12))

    # Title
    content.append(Paragraph(
        f"<b><font size=16>{data.get('country','')}</font></b>",
        styles["Title"]
    ))
    content.append(Spacer(1, 20))

    add(f"<b>Continent:</b> {data.get('continent','')}")
    add(f"<b>Languages Spoken:</b> {', '.join(data.get('languages', []))}")
    add(f"<b>Population:</b> {data.get('population','')}")
    add(f"<b>Currency:</b> {data.get('currency','')}")
    add(f"<b>Area:</b> {data.get('area','')}")

    add("<b>Main Landmarks:</b>")
    for lm in data.get("landmarks", []):
        add(f"- {lm}")

    add(f"<b>Head of State / Government:</b><br/>{data.get('head_of_state','')}")

    add("<b>Main Cultural Events:</b>")
    for ev in data.get("cultural_events", []):
        add(f"- {ev}")

    add("<b>Food & Cuisine:</b>")
    add(data.get("food_writeup",""))

    add("<b>Brief History:</b>")
    add(data.get("brief_history",""))
    
    add("<b>Important People:</b>")
    for lm in data.get("important_people", []):
        add(f"- {lm}")
    
    add("<b>Current Conflicts:</b>")
    add(data.get("current_conflicts",""))
  
    add("<b>Youtube Links:</b>")
    for lm in data.get("five_youtube_video_titles", []):
        add(f"- {lm}")
  

    doc.build(content)

    print(f"Created PDF: {file_path}")

# -----------------------------
# MAIN
# -----------------------------
def main():
    df = pd.read_csv("countries.csv")

    for _, row in df.iterrows():
        # read flag (default to 'N' if missing) and only process when 'Y'
        flag = str(row.get("flag", "N")).strip().upper() if hasattr(row, "get") else str(row["flag"]).strip().upper()
        country = str(row.get("country", "")).strip() if hasattr(row, "get") else row["country"]

        if flag != "Y":
            print(f"Skipping {country} (flag={flag})")
            continue

        continent = str(row.get("continent", "Unknown")).strip() or "Unknown"
        print(f"Processing {country} ({continent})...")

        # ensure continent subfolder under OUTPUT_DIR
        continent_dir = os.path.join(OUTPUT_DIR, safe_filename(continent))
        os.makedirs(continent_dir, exist_ok=True)

        data = get_country_details(country)
        # ensure returned data contains continent (use CSV value as authoritative)
        data["continent"] = continent
        create_country_pdf(data, continent_dir)

if __name__ == "__main__":
    main()
