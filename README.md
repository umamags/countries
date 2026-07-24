# Countries Explorer

A React app for browsing the world's countries by continent. Pick a continent, browse its countries, and open one to see its profile — languages, population, currency, area, landmarks, cultural events, food, history, key people, current conflicts, and a few suggested videos. A search box (in the header, on every page) jumps straight to a country by name, and any country can be starred as a favorite — favorites show in their own section on the home page and persist in the browser via `localStorage`.

The country data is static JSON generated ahead of time from AI-generated PDF "country profiles" (one PDF per country, produced by a separate Python pipeline). The web app only ever reads that JSON — it has no backend and does not call any API at runtime.

## Project structure

```
.
├── index.html, package.json, vite.config.js   Vite app config
├── src/                                       React app source
│   ├── App.jsx, main.jsx                      routes (HashRouter) + entry point
│   ├── components/
│   │   ├── Layout.jsx                         header (title + search) wrapping every page via <Outlet/>
│   │   └── SearchBox.jsx                      type-ahead country search, navigates on click
│   ├── pages/
│   │   ├── ContinentsPage.jsx                 "/"                                     — continents + Favorites section
│   │   ├── CountryListPage.jsx                "/continent/:continentSlug"              — countries in a continent, each with a favorite star
│   │   └── CountryDetailPage.jsx              "/continent/:continentSlug/country/:countrySlug" — one country's profile + favorite button
│   └── data/
│       ├── IndexContext.jsx                   loads public/json/index.json once, shares it via context
│       ├── useCountry.js                      fetches a single country's JSON on demand
│       └── FavoritesContext.jsx                favorites list, persisted to localStorage
├── public/
│   ├── favicon.svg
│   └── json/                                  generated data — the app's only data source
│       ├── index.json                         continent → country manifest (names + slugs)
│       └── <Continent>/<country-slug>.json    one file per country
├── python/                                     data pipeline (offline, not part of the running app)
│   ├── countries.csv                          master list: flag,continent,country (flag=Y to generate)
│   ├── getCountryData.py                      calls OpenAI to write one PDF per country into ../output/<Continent>/
│   ├── pdf_to_json.py                          parses those PDFs into ../public/json/<Continent>/<slug>.json + index.json
│   ├── getYoutubeLinks.py                      utility: pulls the "Youtube Links" section out of the PDFs into youtube_links.csv
│   ├── youtube_links.csv
│   └── requirements.txt
└── output/                                     generated country-profile PDFs, one subfolder per continent
```

## Running the app

Requires Node.js 18+.

```bash
npm install
npm run dev       # starts the dev server, prints a local URL (default http://localhost:5173)
```

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Deployment (GitHub Pages)

The app is set up to deploy to `https://<user>.github.io/countries/`:

- Routing uses `HashRouter` (URLs like `/#/continent/europe/country/france`) instead of `BrowserRouter`, since GitHub Pages can't be configured to rewrite unknown paths back to `index.html`.
- `vite.config.js` sets `base: '/countries/'` for production builds (the dev server still runs at `/`), so built asset and JSON paths resolve correctly under the project subpath.
- `.github/workflows/deploy.yml` builds the app and publishes `dist/` on every push to `master`. One-time setup: in the repo's Settings → Pages, set the source to "GitHub Actions".

If the repo is ever renamed or moved to a different path (or to a `<user>.github.io` user/org page, which is served from the domain root), update the `base` in `vite.config.js` to match.

## Regenerating the country data (optional)

You only need this if you're adding countries, changing `python/countries.csv`, or want to regenerate the PDFs/JSON from scratch. The repo already ships with `output/` (PDFs) and `public/json/` (parsed data) populated, so most changes to the app itself don't require any of this.

```bash
cd python
pip install -r requirements.txt

# 1. Generate one PDF per country flagged 'Y' in countries.csv (needs an OpenAI API key)
export OPENAI_API_KEY=sk-...
python getCountryData.py        # writes into ../output/<Continent>/<Country>.pdf

# 2. Parse those PDFs into the JSON the app reads
python pdf_to_json.py           # writes ../public/json/<Continent>/<slug>.json + index.json
```

`getYoutubeLinks.py` is a standalone utility (not part of the main pipeline) that scans PDFs under `output/` and dumps their "Youtube Links" sections into `youtube_links.csv`.
