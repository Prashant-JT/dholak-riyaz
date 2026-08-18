# 🤖 AGENTS.md - Development Best Practices Guide

## 📋 Purpose
This document establishes the standards and best practices that ALL AI agents must follow when working on this project. Consistency is key.

---

## 🎯 Core Principles

### 1. **Mobile-First Design**
- **ABSOLUTE PRIORITY**: The app is primarily used on mobile while holding the instrument
- Responsive design with main breakpoint at 768px
- Minimum touch targets of 44×44px
- Text readable at 1 metre distance (minimum 16px base)
- Horizontal scroll only when absolutely necessary
- Layouts that adapt vertically on small screens

### 2. **Absolute Visual Consistency**
- **ALL views must follow the same design pattern**
- Use cards with: `bg-white rounded-xl p-6 shadow-sm border-2 border-slate-200`
- Hover states: `hover:border-orange-300 hover:shadow-md transition-all duration-200`
- Section titles: `text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500`
- Grid layouts: `grid grid-cols-1 gap-4` (mobile) → `md:grid-cols-2` or `md:grid-cols-3` (desktop)
- Do NOT use HTML tables unless strictly necessary — prefer cards

### 3. **Theme System: Light and Dark Mode (MANDATORY)**
- **GOLDEN RULE**: The global CSS (`css/styles.css`) uses **CSS variables** (`var(--card-bg)`, `var(--text-primary)`, etc.) that adapt automatically to the active theme. Hardcoded Tailwind classes like `bg-white` or `text-slate-800` **break** dark mode.
- **✅ CORRECT — Use theme system CSS classes:**
  ```typescript
  // Cards → use class 'card' (uses var(--card-bg) automatically)
  className: 'card p-6 mb-4'
  
  // Section titles → use class 'section-title'
  className: 'section-title'
  
  // Subtitles → use class 'section-subtitle'
  className: 'section-subtitle'
  
  // Secondary/muted text → use class 'text-muted'
  className: 'text-muted italic text-sm'
  
  // Selects → do NOT add bg-white or colours; global CSS already handles them
  className: 'w-full'
  ```
- **❌ INCORRECT — Never hardcode colours without a dark variant:**
  ```typescript
  // ❌ Breaks dark mode
  className: 'bg-white rounded-xl p-6 border-2 border-slate-200'
  className: 'text-slate-800 font-bold'
  className: 'bg-white' // on a select
  
  // ✅ If using pure Tailwind, ALWAYS add dark variant:
  className: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
  ```
- **Available global CSS classes** (defined in `css/styles.css`):
  | Class | Usage |
  |---|---|
  | `.card` | Main section container |
  | `.section-title` | View h2/h3 title |
  | `.section-subtitle` | Descriptive subtitle |
  | `.text-muted` | Secondary/note text |
  | `.btn-primary` | Primary action button (orange) |
  | `.btn-secondary` | Secondary action button (outline) |
  | `.bol-cell` | Matra cell in Taal table |
  | `.taal-row-separator` | Taal row separator |

### 4. **Strict TypeScript**
- All files must be `.ts`
- Use explicit types, no `any`
- Leverage the interfaces and types defined in `src/types.ts`

### 5. **Modularity**
- Each file has ONE responsibility
- Do not mix logic from different domains
- Use ES6 imports/exports

---

## 📁 File Structure (IMMUTABLE)

```
Dholak/
├── src/                    # TypeScript source code
│   ├── types.ts           # ALL type definitions
│   ├── app.ts             # Main entry point
│   ├── i18n/              # 🌐 Internationalisation
│   │   ├── es.ts          # Spanish strings — SOURCE OF TRUTH
│   │   ├── en.ts          # English strings — must mirror es.ts keys
│   │   └── index.ts       # t() / tArray() / setLang() / getLang()
│   ├── data/              # 📝 DATA ONLY (editable weekly) — no UI strings
│   │   ├── bols.ts
│   │   ├── kaydas.ts
│   │   ├── fillers.ts
│   │   ├── lehras.ts
│   │   ├── songs.ts
│   │   ├── defaultTemplates.ts
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
│   ├── core/              # Core (DO NOT TOUCH without reason)
│   │   ├── config.ts
│   │   ├── utils.ts
│   │   └── supabase.ts
│   ├── components/        # Reusable components
│   │   ├── metronome.ts
│   │   ├── navigation.ts
│   │   ├── viewManager.ts
│   │   └── darkModeToggle.ts
│   └── views/             # Application views
│       ├── dashboard.ts
│       ├── glosario.ts
│       ├── taals.ts
│       ├── kaydas.ts
│       ├── fillers.ts
│       ├── songs.ts
│       ├── stats.ts               # Thin orchestrator — imports from stats/
│       ├── stats/
│       │   ├── statsTypes.ts      # SupabaseSession, SupabaseBlock, UserStats, Medal
│       │   ├── statsData.ts       # fetch, transform, timezone helpers
│       │   ├── medals.ts          # computeMedals(), TAAL_META
│       │   └── statsCharts.ts     # Chart.js colour palette + mount functions
│       └── riyaz/
│           ├── sessionWizard.ts
│           ├── wizardDraft.ts
│           ├── wizardStep1.ts
│           ├── wizardStep2.ts
│           └── wizardStep3.ts
├── dist/                   # Compiled JavaScript (GENERATED)
├── css/
│   └── styles.css         # Full styles
├── index.html             # Minimal HTML
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
└── README.md              # User documentation
```

---

## 🔧 TypeScript Code Conventions

### Imports
```typescript
// ✅ CORRECT - Explicit imports
import { CONFIG } from '../core/config';
import { createElement } from '../core/utils';
import { BOLS } from '../data/bols';
import type { View, Bol } from '../types';

// ❌ INCORRECT - Generic imports
import * as utils from '../core/utils';
```

### Classes
```typescript
// ✅ CORRECT - Class with explicit types
export class DashboardView implements View {
    public render(): HTMLElement {
        // ...
    }
    
    private createCard(): HTMLElement {
        // ...
    }
}

// ❌ INCORRECT - No types
export class DashboardView {
    render() {
        // ...
    }
}
```

### Functions
```typescript
// ✅ CORRECT - Explicit types on parameters and return
export function createElement(
    tag: string,
    attributes: ElementAttributes = {},
    content: string | HTMLElement | HTMLElement[] | null = null
): HTMLElement {
    // ...
}

// ❌ INCORRECT - No types
export function createElement(tag, attributes, content) {
    // ...
}
```

### Constants and Data
```typescript
// ✅ CORRECT - Explicit type and export
export const BOLS: Bol[] = [
    {
        name: 'Na / Ta',
        technique: 'Index finger on the kinar...',
        description: 'Dry, bright sound...',
        badge: 'Kinar - Treble'
    }
];

// ❌ INCORRECT - No type
const BOLS = [
    { name: 'Na / Ta', ... }
];
```

---

## 🎨 CSS Conventions

### Structure
```css
/* ✅ CORRECT - Clearly delimited sections */
/* ============================================
   SECTION NAME
   ============================================ */

.class-name {
    property: value;
}

/* ❌ INCORRECT - No organisation */
.class1 { ... }
.class2 { ... }
```

### Naming
- **Kebab-case**: `.nav-item`, `.bol-cell`, `.metronome-display`
- **BEM when necessary**: `.card__header`, `.card__body`
- **State prefixes**: `.is-active`, `.is-hidden`

### Property Order
1. Positioning (`position`, `top`, `left`, etc.)
2. Box model (`display`, `width`, `height`, `margin`, `padding`)
3. Typography (`font-*`, `text-*`, `line-height`)
4. Visual (`background`, `border`, `box-shadow`)
5. Other (`cursor`, `transition`, `animation`)

---

## 📝 HTML Conventions

### Minimal Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dholak Riyaz - Practice System</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <!-- Semantic content -->
    <aside class="sidebar">...</aside>
    <main class="main-content" id="mainContent"></main>
    
    <!-- Scripts at the end -->
    <script type="module" src="dist/app.js"></script>
</body>
</html>
```

### Rules
- ✅ Use semantic tags (`<aside>`, `<main>`, `<nav>`, `<section>`)
- ✅ IDs only for JavaScript hooks
- ✅ Classes for styles
- ❌ NO inline styles
- ❌ NO inline scripts

---

## 🔄 Workflow

### 1. Before Modifying Code
```bash
# Verify dist/ exists
ls dist/

# If it doesn't exist, compile
npm run build
```

### 2. When Adding New Features
1. Define types in `src/types.ts`
2. Create/modify files in `src/`
3. **Add any new UI strings to `src/i18n/es.ts` first, then mirror in `src/i18n/en.ts`**
4. Compile: `npm run build`
5. Verify in browser

### 3. When Adding Weekly Data
- **ONLY** edit files in `src/data/`
- Keep the existing type structure
- Compile after editing

---

## ✅ Checklist: Adding a New Taal (MANDATORY)

Every time a new taal is added or activated, these **7 files/locations must be touched**. Missing any one of them causes the taal not to appear, have no visual dividers, or not show up correctly in statistics:

| # | File | What to add |
|---|---|---|
| 1 | `src/data/taals/<name>.ts` | Create the file with the full taal definition. **Split `rows` into sub-arrays per vibhag** (see "Data Conventions: Taal `rows`") |
| 2 | `src/data/taals/index.ts` | Import + entry in the `TAALS` object |
| 3 | `src/core/config.ts` | Field in `VIEWS` + item in `NAVIGATION` array (**ordered by beats ascending**) |
| 4 | `src/types.ts` | Field in `ViewsConfig` interface |
| 5 | `src/core/utils.ts` → `VIBHAG_DIVIDERS` | Entry `beats: [matraAfterWhichDividerAppears]` for orange vertical lines on desktop |
| 6 | `src/views/taals.ts` → `getVibhagStructure()` | `case beats:` with the correct slices for mobile grouping |
| 7 | `src/views/stats/medals.ts` → `TAAL_META` | Entry with emoji and CSS colour class (`stats-tag--orange/blue/purple/teal/amber`) — **ALWAYS mandatory** |

> ✅ **Automatic** — nothing else needs to be touched:
> - `src/components/viewManager.ts`: registers TaalViews dynamically from `CONFIG.NAVIGATION`
> - Riyaz practice blocks (`wizardStep1.ts`, `wizardStep2.ts`): derive active taals from `CONFIG.NAVIGATION`
> - Statistics (`stats/medals.ts`): "First X" badges and "Polyrhythmic" badge are generated dynamically from `ACTIVE_TAAL_IDS`

---

## 🥁 Data Conventions: Taal `rows` (vibhags)

### ⚠️ MANDATORY — Split beats into rows according to vibhags

The `rows` field of a `Taal` is an **array of arrays**. Each sub-array represents a **visual row** in the taal table, and the view automatically generates a **coloured separator line** between rows (`taal-row-separator`). If all beats go in a single array, **no separator appears** and the taal looks like a flat, unstructured block.

**Rule:** group beats into rows that reflect the taal's vibhag structure:

| Taal | Beats | Vibhags | Recommended rows |
|---|---|---|---|
| Keherwa | 8 | 2+2+2+2 | 1 row of 8 (or 2×4) |
| Dadra | 6 | 3+3 | 1 row of 6 (or 2×3) |
| Rupak | 7 | 3+2+2 | 1 row of 7 |
| Deepchandi | 14 | 3+4+3+4 | 2 rows of 7 |
| Addha | 16 | 4+4+4+4 | 2 rows of 8 |
| Teental | 16 | 4+4+4+4 | 2 rows of 8 |
| Ektal | 12 | 2+2+2+2+2+2 | 2 rows of 6 |
| Jhaptal | 10 | 2+3+2+3 | 2 rows of 5 |

```typescript
// ❌ INCORRECT — all in one row, no visual separators
rows: [
    [
        { matra: 1, bol: 'Dhin', technique: 'Taali' },
        // ... all 12 beats together
        { matra: 12, bol: 'Na', technique: '' }
    ]
]

// ✅ CORRECT — split into 2 rows (Ektal example)
rows: [
    [
        { matra: 1, bol: 'Dhin',     technique: 'Taali' },
        { matra: 2, bol: 'Dhin',     technique: '' },
        { matra: 3, bol: 'DhaGe',    technique: 'Taali' },
        { matra: 4, bol: 'TireKite', technique: '' },
        { matra: 5, bol: 'Tin',      technique: 'Khali' },
        { matra: 6, bol: 'Na',       technique: '' }
    ],
    [
        { matra: 7,  bol: 'Ke',       technique: 'Taali' },
        { matra: 8,  bol: 'Ta',       technique: '' },
        { matra: 9,  bol: 'DhaGe',    technique: 'Taali' },
        { matra: 10, bol: 'TireKite', technique: '' },
        { matra: 11, bol: 'Dhi',      technique: 'Khali' },
        { matra: 12, bol: 'Na',       technique: '' }
    ]
]
```

The same applies to `variations[].rows` — each variation must also respect the vibhag split.

### ⚠️ MANDATORY — Register the taal in both divider mechanisms

When adding a new taal, **two locations** must be updated:

#### 1. `VIBHAG_DIVIDERS` in `src/core/utils.ts` (orange vertical divider on desktop)
`Record<number, number[]>` exported from **`src/core/utils.ts`**, indexed by beat count. The array contains the matra numbers **after which** the orange right border appears:

```typescript
export const VIBHAG_DIVIDERS: Record<number, number[]> = {
    6:  [3],              // Dadra:          3+3
    7:  [3, 5],           // Rupak:          3+2+2
    8:  [4],              // Keherwa:        4+4
    12: [2, 4, 6, 8, 10], // Ektal:          2+2+2+2+2+2
    14: [3, 7, 10],       // Deepchandi:     3+4+3+4
    16: [4, 8, 12],       // Addha/Teental:  4+4+4+4
};
```

#### 2. `getVibhagStructure()` (sub-row split on mobile)
Switch by beat count that splits each row into groups according to the taal's vibhags:

```typescript
case 12: // Ektal: 2+2+2+2+2+2
    return [
        row.slice(0, 2),
        row.slice(2, 4),
        row.slice(4, 6),
        row.slice(6, 8),
        row.slice(8, 10),
        row.slice(10, 12)
    ];
```

> If the case is not added to `getVibhagStructure`, the taal will fall through to the `default` (groups of 4) and vibhags on mobile will not be grouped correctly.
> If not added to `VIBHAG_DIVIDERS`, the orange vertical lines will not appear on desktop.

---

## 🥁 Data Conventions: Thapki & Ghisa visual indicators

The taal view automatically renders a **coloured dot** inside a bol cell when the `bol` text contains specific keywords in parentheses. This is parsed by [`applyBolIndicators()`](src/core/utils.ts) — no extra code is needed.

### Syntax — embed the keyword inside the bol string

| Indicator | Keyword in `bol` text | Dot colour | Example |
|---|---|---|---|
| Thapki only | `(thapki)` | 🟡 Gold/amber | `'Dhit (thapki)'` |
| Ghisa only | `(ghisa)` or `(ghuisa)` | 🔵 Blue | `'Dhi (ghisa)'` |
| Both (thapki + ghisa) | both keywords | 🟡+🔵 Two dots | `'Dhit (thapki) (ghisa)'` |

### Rules
- The keyword must be **inside parentheses** and **part of the `bol` field** — it is **not** the `technique` field.
- The display name shown in the cell has the `(thapki)`/`(ghisa)` part **stripped automatically** — the user sees only the clean bol name.
- Capitalisation is ignored (`(Thapki)`, `(THAPKI)` all work), but lowercase is the convention.
- The legend (🟡 Thapki / 🔵 Ghisa) is shown automatically below the taal table whenever at least one indicator is present in that variation.

### ✅ Correct examples

```typescript
// Thapki only
{ matra: 1, bol: 'Dhit (thapki)',         technique: '' }
{ matra: 3, bol: 'Tit (thapki)',           technique: '' }

// Ghisa only
{ matra: 1, bol: 'Ghe (ghisa)',            technique: '' }
{ matra: 1, bol: 'Dhi (ghuisa)',           technique: '' }

// Both on the same bol
{ matra: 1, bol: 'Dhit (thapki) (ghisa)', technique: 'Taali' }

// Thapki inside longer bol name is fine too
{ matra: 2, bol: 'Dha (thapki)',           technique: 'Khali' }
```

### ❌ Incorrect — will NOT show the dot

```typescript
// ❌ technique field — ignored by the indicator parser
{ matra: 1, bol: 'Dhit', technique: 'Thapki' }

// ❌ No parentheses
{ matra: 1, bol: 'Dhit thapki', technique: '' }

// ❌ Wrong spelling
{ matra: 1, bol: 'Dhit (tapki)', technique: '' }
```

---

## 🧩 Modularisation Guidelines (MANDATORY)

### When to split a file
A source file **must be split** when it meets both of these criteria:
- **> ~400–500 lines of code**, AND
- **> 2 distinct responsibilities** (e.g. types + data + business logic + UI all in one file)

If a file is large but cohesive (only one responsibility), splitting is optional.

### Module boundary rules
| Responsibility | Where it lives |
|---|---|
| Type / interface definitions | Separate `*Types.ts` module |
| Database / API fetch + data transformation | Separate `*Data.ts` module |
| Business logic / computation (medals, scores) | Separate named module |
| Chart / visualisation logic | Separate `*Charts.ts` module |
| UI rendering (view class) | The view file itself — thin orchestrator |

### Canonical example — `src/views/stats/`
The `StatsView` (originally 1 887 lines) was split into:
```
src/views/stats/
├── statsTypes.ts    ← SupabaseSession, SupabaseBlock, UserStats, Medal
├── statsData.ts     ← fetch, transform, timezone helpers, emptyStats()
├── medals.ts        ← computeMedals(), TAAL_META, DEFAULT_TAAL_META
└── statsCharts.ts   ← C palette, mountWeeklyChart(), mountCharts(), mountCompareCharts()
```
`src/views/stats.ts` remains as the **thin orchestrator**: imports from all 4 sub-modules,
holds only UI state and DOM building methods (~550 lines).

### Re-exporting public types from the entry point
When a sub-module is introduced and other files already import types from the original file,
**re-export** those types from the original so existing import paths keep working:
```typescript
// stats.ts — keep backward compatibility for consumers of SupabaseSession / SupabaseBlock
export type { SupabaseSession, SupabaseBlock } from './stats/statsTypes.js';
```

### File size budget
| File type | Soft limit | Hard limit |
|---|---|---|
| View orchestrator | 600 lines | 800 lines |
| Data / logic module | 300 lines | 500 lines |
| Type definition module | 80 lines | 150 lines |

If a file exceeds its hard limit, open a refactoring task immediately.

---

## 🚫 Common Mistakes to AVOID

### 1. ❌ Mixing JavaScript and TypeScript
```typescript
// ❌ INCORRECT
const data = require('./data.js');

// ✅ CORRECT
import { data } from './data';
```

### 2. ❌ Using `any`
```typescript
// ❌ INCORRECT
function process(data: any): any {
    return data;
}

// ✅ CORRECT
function process(data: Bol[]): HTMLElement {
    return createElement('div', {}, '...');
}
```

### 3. ❌ Forgetting to Compile
```bash
# ❌ INCORRECT - Edit .ts and open the browser directly

# ✅ CORRECT
npm run build  # Compile first
# Then open the browser
```

### 4. ❌ Duplicating Logic
```typescript
// ❌ INCORRECT - Duplicated logic in each view
class View1 {
    createButton() { /* code */ }
}
class View2 {
    createButton() { /* same code */ }
}

// ✅ CORRECT - Reusable function in utils
// src/core/utils.ts
export function createButton(text: string): HTMLElement {
    return createElement('button', { className: 'btn' }, text);
}
```

---

## ⚙️ GitHub Actions — Critical Rules

- **`environment: github-pages` on the `build` job is MANDATORY** — this is what grants access to repository secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Removing it causes secrets to arrive empty and the app to break at runtime.
- **Never touch the workflow to fix transient GitHub Pages errors** (`Deployment failed, try again`) — these are server-side and resolve on their own. Re-running the workflow is the correct response, not editing the file.
- **Before editing any workflow file**, check `git log` to understand what was working and why. If the same line has been stable for many commits, it is correct — do not change it.

---

## 📝 Git Conventions

### Commits
- **ALWAYS in English** — no exceptions
- Format: `type: short description in English`
- Types: `feat`, `fix`, `data`, `style`, `refactor`, `docs`, `chore`
- Correct examples:
  ```
  feat: add thapki/ghuisa visual indicators on bol cells
  data: add Aaye Ho Meri Zindagi Mein song (Dadra)
  fix: remove trailing space in song URL
  style: improve legend layout for dark mode
  ```
- ❌ NEVER in Spanish: `"añade canción"`, `"corrige error"`, `"mejora diseño"`

### Code Comments
- **ALL comments and output strings must be in English across every file type** — no exceptions
- This applies to: `.ts`, `.css`, `.yml`, `.sh`, `.md` — every file in the repo
- Includes: `//` comments, `/** */` JSDoc, `/* */` CSS comments, `#` shell/YAML comments, `echo` strings in shell scripts
- ❌ NEVER in Spanish: `// Inicializar navegación`, `/* Estilos principales */`, `# Cargar nvm`, `echo "Compilando..."`
- ✅ CORRECT: `// Initialise navigation`, `/* Main styles */`, `# Load nvm`, `echo "Compiling..."`

### ⚠️ Mandatory flow before commit/push
- **NEVER run `git commit` or `git push` automatically.**
- **ALWAYS ask the user** before committing: _"Did you test it locally? Shall I commit and push?"_
- The user must explicitly confirm that the feature was tested in the browser.
- Only then run `git add`, `git commit` and `git push`.

---

## 🎯 Pre-Commit Checklist

Before considering a task complete, verify:

- [ ] ✅ All `.ts` files compile without errors
- [ ] ✅ `npm run build` runs successfully
- [ ] ✅ `npm test` passes — all 337+ tests green
- [ ] ✅ `dist/` folder exists with `.js` files
- [ ] ✅ `index.html` loads `dist/app.js`
- [ ] ✅ CSS has all required classes
- [ ] ✅ App renders correctly in the browser in **both ES and EN**
- [ ] ✅ No errors in the browser console
- [ ] ✅ Navigation works between views
- [ ] ✅ Metronome plays sound
- [ ] ✅ All new UI strings added to both `es.ts` and `en.ts`
- [ ] ✅ README.md is up to date

---

## 🐛 Debugging

### If nothing appears in the browser:

1. **Check the browser console** (F12)
   - Any module errors?
   - Any 404 errors?

2. **Verify dist/ exists**
   ```bash
   ls -la dist/
   ```

3. **Verify app.js exists**
   ```bash
   ls -la dist/app.js
   ```

4. **Rebuild from scratch**
   ```bash
   npm run clean
   npm run build
   ```

5. **Check index.html**
   - Does it load `dist/app.js`?
   - Does it have `type="module"`?

6. **Check CSS**
   - Is it linked correctly?
   - Does it have the required classes?

---

## 📚 Reference Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### ES Modules
- [MDN ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🔐 Golden Rules

1. **NEVER** change the folder structure without documenting it
2. **ALWAYS** use TypeScript, never plain JavaScript
3. **ALWAYS** compile before testing in the browser
4. **ALWAYS** keep explicit types
5. **ALWAYS** follow the conventions in this document
6. **NEVER** use `any` without extreme justification
7. **ALWAYS** verify the app works before finishing
8. **ALWAYS** update this document if you change conventions
9. **NEVER hardcode data in views** — Data lives in `src/data/`. Views must iterate over it dynamically. If you add a new kayda, taal, song or filler to the data files, it must appear automatically in the UI without touching any view file.
   ```typescript
   // ❌ INCORRECT — hardcoded
   const kayda = KAYDAS.fundamental;
   renderKayda(kayda);

   // ✅ CORRECT — dynamic
   Object.values(KAYDAS).forEach(kayda => renderKayda(kayda));
   ```
10. **When adding a new Taal, update ALL 7 files in the checklist** — See the "✅ Checklist: Adding a New Taal" section. In particular, do not forget `viewManager.ts` (without this the view won't load) and both `wizardStep*.ts` files (without this the taal won't appear in Riyaz practice blocks).
11. **NEVER hardcode UI strings** — Every user-visible string must go through `t()` or `tArray()`. No string literals in view files. See the i18n section below.

---

## 🌐 i18n — Internationalisation (MANDATORY)

The app is fully bilingual (Spanish / English). Every new feature **must** follow these rules or strings will appear in Spanish even when the user has selected English.

### Architecture

| File | Role |
|---|---|
| `src/i18n/es.ts` | Source of truth — all strings in Spanish. `export const es = { ... }` |
| `src/i18n/en.ts` | English translation. `export const en: Strings = { ... }` — **must mirror every key in `es.ts`** |
| `src/i18n/index.ts` | Exports `t()`, `tArray()`, `setLang()`, `getLang()`, `lang` |

### Using strings in views

```typescript
import { t, tArray } from '../i18n/index.js';

// Plain string
const label = t('metronome.start');           // 'Start' | 'Iniciar'

// String with dynamic argument (function key)
const counter = t('songs.counter', 42);       // '42 songs' | '42 canciones'

// Array value (month names, day names, tooltip arrays)
// ⚠️ NEVER use t() for arrays — it returns a comma-joined string
const months = tArray('stats.monthsShort');   // ['Jan','Feb',...] | ['Ene','Feb',...]
```

### Adding a new string — step by step

1. Add the key to `src/i18n/es.ts` first (Spanish value):
   ```typescript
   mySection: {
       myLabel: 'Mi etiqueta',
   }
   ```
2. Add the **same key** to `src/i18n/en.ts` (English value):
   ```typescript
   mySection: {
       myLabel: 'My label',
   }
   ```
3. Use `t('mySection.myLabel')` in the view — never the raw string.

### Critical rules

- **`t()` for strings, `tArray()` for arrays.** Using `t()` on an array key calls `String(array)` and returns `"Ene,Feb,..."` — individual characters when indexed. This is a silent bug.
- **Data files (`src/data/`) must never contain UI strings.** If a data file needs a display label (e.g. a dropdown placeholder), it must come from the view via `t()`.
- **Database values stay in Spanish** (canonical storage key). Translate them at render time:
  ```typescript
  // block.variationName is stored as 'Patrón Principal' in the DB — always Spanish
  const display = block.variationName === 'Patrón Principal'
      ? t('step1.blockPatternMain')   // 'Main Pattern' | 'Patrón Principal'
      : block.variationName;
  ```
- **`toLocaleDateString()` must use the active language**, not a hardcoded locale like `'es-ES'`. Use `tArray('stats.monthsFull')` or `getLang()`:
  ```typescript
  // ❌ hardcoded locale
  date.toLocaleDateString('es-ES', { month: 'long' })

  // ✅ use the i18n array
  const MONTH_FULL = tArray('stats.monthsFull');
  label = MONTH_FULL[date.getUTCMonth()];
  ```
- **Function keys** (keys whose value is `(n: number) => string`) are called automatically by `t()`:
  ```typescript
  // es.ts:  counter: (n: number) => `${n} canciones`
  // en.ts:  counter: (n: number) => `${n} songs`
  t('songs.counter', 42)  // → '42 songs' in EN
  ```

---

## 🚀 Release Management (Bob's responsibility)

Bob (AI assistant) is responsible for tracking releases and deciding when to propose a new one. The user must **never** be asked to manage versions manually.

### Current release
| Tag | Date | Summary |
|---|---|---|
| `v2.0.0` | 2026-07-05 | Full practice system — 7 taals, Riyaz planner, Stats, dark mode |
| `v2.2.0` | 2026-07-27 | Tirekite section, tutorial video in practice blocks, cycle counter fix, new data |
| `v2.3.0` | 2026-08-11 | Full ES/EN i18n — all views, stats, session wizard; 80 BPM preset; bug fixes |

### When to propose a new release
Bob must propose a new GitHub release when **any of these thresholds are reached**:
- A new Taal is activated
- 3 or more songs/kaydas/fillers added in a single session
- A significant new feature is implemented (new view, new wizard step, etc.)
- A major bug fix that affected production

### Release workflow (Bob's steps)
1. Propose the release to the user: _"I think we're ready for vX.Y.Z — shall I create the tag and prepare the release notes?"_
2. Wait for user confirmation that it was tested in the browser
3. Run: `git tag -a vX.Y.Z -m "..."` and `git push origin vX.Y.Z`
4. Provide the release notes text for the user to paste into GitHub UI
5. Update the **Current release** table above

### Versioning rules (Semantic Versioning)
- **MAJOR** (`v3.0.0`): Complete redesign or architectural overhaul
- **MINOR** (`v2.1.0`): New taal, new feature, new view
- **PATCH** (`v2.0.1`): Bug fixes, data additions, style tweaks

---

## 📞 Contact

If you find inconsistencies in this document or in the code, document them here for future reference.

---

**Version**: 1.3.0
**Last updated**: 2026-08-11
**Maintainer**: Bob (AI Assistant)
