# Dholak Riyaz - Practice System

Interactive practice system for Dholak with a high-precision metronome, session planner, real statistics, and learning resources.

## 🌐 Live App

**URL:** https://prashant-jt.github.io/dholak-riyaz/

---

## ✨ Features

### 🥁 Metronome
- High-precision metronome using the **Web Audio API**
- Range 60–400 BPM with quick presets
- Integration with **Lehras** (YouTube practice loops at different tempos)

### 📚 Theory & Bols
- Complete Bol glossary organised by category
- Technique description, strike zone and sound for each bol

### 🎵 Taals (7 active)
| Taal | Beats | Vibhags |
|---|---|---|
| Dadra | 6 | 3+3 |
| Rupak | 7 | 3+2+2 |
| Keherwa | 8 | 4+4 |
| Ektal | 12 | 2+2+2+2+2+2 |
| Deepchandi | 14 | 3+4+3+4 |
| Addha | 16 | 4+4+4+4 |
| Teental | 16 | 4+4+4+4 |

Each taal includes: matra table with Taali/Khali markers, variations and visual vibhag dividers.

### 🎼 Kaydas & Fillers
- Kaydas with variations (Teental)
- Pickups, fillers and cuts organised by taal

### 🎬 Practice Songs
- Library of Bollywood and devotional songs with their taal identified
- Direct YouTube links to practise along with the original artist

### 📅 Riyaz Session Planner
- 3-step wizard: **Configure → Practise → Summary**
- Configurable practice blocks: warm-up, taal, kayda, rest
- Predefined templates per taal (Keherwa, Dadra, Teental, etc.)
- Share your session via URL (hash-encoded)
- Per-block timer with free mode and countdown mode

### 📊 Statistics (Supabase)
- Session history saved to a real database (Supabase)
- Weekly/monthly practice charts with Chart.js
- Consecutive-day streak, total minutes, taals practised
- Achievement badges for milestones (first session per taal, polyrhythm, etc.)

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
| **GitHub Actions** | Automated CI/CD |
| **GitHub Pages** | Hosting |

---

## 📁 Project Structure

```
Dholak/
├── src/
│   ├── types.ts                # All type definitions
│   ├── app.ts                  # Entry point
│   ├── data/
│   │   ├── bols.ts             # Bol glossary
│   │   ├── kaydas.ts           # Kaydas and variations
│   │   ├── fillers.ts          # Pickups, fillers and cuts
│   │   ├── lehras.ts           # Practice loops (YouTube)
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
│   │       └── teental.ts
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

# 3. Verify in the browser, then commit
git add .
git commit -m "data: add new content from class"
git push
# GitHub Actions compiles and deploys automatically (~2 min)
```

To add a **brand-new Taal**, follow the 7-step checklist in `AGENTS.md`.

---

## 🚀 Deployment

The project uses GitHub Actions for automated build and deployment:

1. Push to `main` → triggers the workflow
2. GitHub Actions compiles TypeScript
3. Deploys to GitHub Pages
4. Site updated in ~2 minutes

---

## 📖 Developer Documentation

See [`AGENTS.md`](AGENTS.md) for development guides, code conventions, new-taal checklist and project rules.

---

## 📄 License

Personal music practice project — MIT.

---

**Version:** 2.0.0 · **Last updated:** 2025-07-14
