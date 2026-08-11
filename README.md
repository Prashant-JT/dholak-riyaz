# Dholak Riyaz - Practice System

Interactive practice system for Dholak with a high-precision metronome, session planner, real statistics, and learning resources.

## 🌐 Live App

**URL:** https://prashant-jt.github.io/dholak-riyaz/

---

## ✨ Features

### 🥁 Metronome
- High-precision metronome using the **Web Audio API**
- Range 60–400 BPM with +/− buttons, slider and 5 quick presets: **Slow (60) / Moderate (80) / Medium (120) / Fast (180) / Drut (240)**
- Start/Reset buttons visible without scrolling on mobile
- Integration with **Lehras** (YouTube practice loops at different tempos)
- Beats-per-bar selector (4, 6, 7, 8, 10, 12, 14, 16)

### 📚 Theory & Bols
- Complete Bol glossary organised by category
- Technique description, strike zone and sound for each bol

### 🎵 Taals (8 active)
| Taal | Beats | Vibhags | Variations |
|---|---|---|---|
| Dadra | 6 | 3+3 | 4 |
| Rupak | 7 | 3+2+2 | 5 |
| Keherwa | 8 | 4+4 | 17 |
| Ektal | 12 | 2+2+2+2+2+2 | 3 |
| Deepchandi | 14 | 3+4+3+4 | 5 |
| Addha | 16 | 4+4+4+4 | 3 |
| Teental | 16 | 4+4+4+4 | 4 |
| Jhaptal | 10 | 2+3+2+3 | 2 |

Each taal includes: matra table with Taali/Khali markers, variations with tutorials/songs, visual vibhag dividers, and 🟡/🔵 Thapki/Ghisa visual indicators.

### 🎼 Kaydas & Fillers
- **8 Kaydas** with variations (Teental, Keherwa, Dadra)
- Pickups, fillers and cuts organised by taal, with search and results counter

### 🎬 Practice Songs
- **70+ songs** (Bollywood + devotional) with taal identified
- Search by title + filter by taal
- Direct YouTube links to practise along with the original artist

### 📅 Riyaz Session Planner
- 3-step wizard: **Configure → Practise → Summary**
- Configurable practice blocks: warm-up (kayda + lehra), taal variation, pickup/filler
- Predefined templates per taal (Keherwa, Dadra, Teental, etc.)
- Draft recovery — interrupted sessions are automatically restored
- Share your session via URL (hash-encoded)
- Per-block timer with free mode and countdown mode

### 📊 Statistics (Supabase)
- Session history saved to a real database (Supabase) — multi-user (Prashant + Meera)
- Weekly practice bar chart with trend line
- **Compare view**: Prashant vs Meera side-by-side with dual trend lines, distribution donuts and medals
- Consecutive-day streak, weekly streak, total minutes, taals practised
- Heatmap of practice days (last 4 months)
- Achievement badges for milestones (first session per taal, polyrhythm, joint sessions, etc.)

### 🌐 English / Spanish (i18n)
- Full UI available in **English and Spanish** — switchable from any view
- Preference persisted in `localStorage`
- All labels, tooltips, chart titles, achievement dates and session content adapt to the active language
- Data stored in the database always uses Spanish as the canonical key (language-independent)

### 🌙 Dark / Light Mode
- Persistent theme toggle (localStorage)
- Full design system built on adaptive CSS variables

### 📱 Mobile-First Design
- Interface optimised for use while holding the instrument
- Touch targets ≥ 44 px, text readable at 1 metre
- Responsive with 768 px breakpoint

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **TypeScript 5.x** | All source code |
| **Web Audio API** | Precision metronome |
| **Supabase** | Session database & statistics |
| **Chart.js** (CDN) | Statistics charts |
| **Tailwind CSS** (CDN) | Layout utilities |
| **CSS Variables** | Light/dark theme system |
| **i18n (es/en)** | Full bilingual UI (ES/EN) |
| **Vitest** | Unit & data integrity tests |
| **GitHub Actions** | Automated CI/CD (build + test) |
| **GitHub Pages** | Hosting |

---

## 📁 Project Structure

```
Dholak/
├── src/
│   ├── types.ts                # All type definitions
│   ├── app.ts                  # Entry point
│   ├── i18n/
│   │   ├── es.ts               # Spanish strings (source of truth)
│   │   ├── en.ts               # English strings (must mirror es.ts keys)
│   │   └── index.ts            # t() / tArray() / setLang() / getLang()
│   ├── data/
│   │   ├── bols.ts             # Bol glossary
│   │   ├── kaydas.ts           # Kaydas and variations
│   │   ├── fillers.ts          # Pickups, fillers and cuts
│   │   ├── lehras.ts           # Practice loops (YouTube) — no UI strings
│   │   ├── songs.ts            # Songs with identified taal
│   │   ├── defaultTemplates.ts # Predefined session templates
│   │   └── taals/
│   │       ├── index.ts
│   │       ├── dadra.ts
│   │       ├── rupak.ts
│   │       ├── keherwa.ts
│   │       ├── ektal.ts
│   │       ├── deepchandi.ts
│   │       ├── addha.ts
│   │       ├── teental.ts
│   │       └── jhaptal.ts
│   ├── core/
│   │   ├── config.ts           # Global config and navigation
│   │   ├── utils.ts            # Reusable helpers
│   │   └── supabase.ts         # Supabase client (not in git)
│   ├── components/
│   │   ├── metronome.ts
│   │   ├── navigation.ts
│   │   ├── viewManager.ts
│   │   └── darkModeToggle.ts
│   └── views/
│       ├── dashboard.ts        # Metronome view
│       ├── glosario.ts         # Theory & bols
│       ├── taals.ts            # Generic taal view
│       ├── kaydas.ts
│       ├── fillers.ts
│       ├── songs.ts
│       ├── stats.ts            # Statistics (Supabase)
│       └── riyaz/
│           ├── sessionWizard.ts
│           ├── wizardDraft.ts
│           ├── wizardStep1.ts  # Session configuration
│           ├── wizardStep2.ts  # Block-by-block practice
│           └── wizardStep3.ts  # Summary & save
├── dist/                       # Compiled JavaScript (generated)
├── css/
│   └── styles.css              # Theme system and global styles
├── index.html
├── tsconfig.json
├── package.json
└── .github/workflows/          # GitHub Actions
```

---

## 📝 Local Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run tests
npm test

# Watch mode for tests (runs on every file change)
npm run test:watch

# Watch mode (development)
npm run watch

# Start local server
npm start

# Alternatively, use the start script (builds + serves in one step)
./start.sh
```

---

## 🔄 Weekly Content Updates

After each class, edit the relevant file in `src/data/` and recompile:

```bash
# 1. Edit the relevant data file:
#    src/data/bols.ts         → new bols
#    src/data/taals/<x>.ts    → taal variations
#    src/data/kaydas.ts       → new kaydas
#    src/data/fillers.ts      → new fillers / pickups
#    src/data/songs.ts        → new songs

# 2. Compile
npm run build

# 3. Run tests (catches structural errors in your data)
npm test

# 4. Verify in the browser, then commit
git add .
git commit -m "data: add new content from class"
git push
# GitHub Actions runs tests + compiles + deploys automatically (~2 min)
```

To add a **brand-new Taal**, follow the 7-step checklist in `AGENTS.md`.

---

## 🌐 Adding / Editing Translations

All UI strings live in `src/i18n/`:

| File | Role |
|---|---|
| `src/i18n/es.ts` | **Source of truth** — Spanish strings. Add new keys here first. |
| `src/i18n/en.ts` | English translation — must always mirror the keys in `es.ts`. |
| `src/i18n/index.ts` | `t(key)` for plain strings, `tArray(key)` for string arrays. |

Rules:
- **Never** put UI strings directly in view files — always go through `t()`.
- **Never** put UI strings in `src/data/` files — data files must contain data only.
- Keys that store arrays (month names, day names, tooltips) must be retrieved with `tArray()`, not `t()`.
- Strings saved to the database (e.g. variation names) stay in Spanish regardless of the active language — translate them at render time with `t()`.

---

## 🚀 Deployment

The project uses GitHub Actions for automated build and deployment:

1. Push to `main` → triggers the workflow
2. GitHub Actions compiles TypeScript
3. Deploys to GitHub Pages
4. Site updated in ~2 minutes

---

## 📖 Developer Documentation

See [`AGENTS.md`](AGENTS.md) for development guides, code conventions, new-taal checklist, i18n rules and project rules.

---

## 📄 License

Personal music practice project — MIT.

---

**Version:** 2.3.0 · **Last updated:** 2026-08-11
