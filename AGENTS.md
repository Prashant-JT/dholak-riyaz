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
│   ├── data/              # 📝 DATA ONLY (editable weekly)
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
│   │       └── teental.ts
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
│       ├── stats.ts
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
3. Compile: `npm run build`
4. Verify in browser

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
| 5 | `src/views/taals.ts` → `VIBHAG_DIVIDERS` | Entry `beats: [matraAfterWhichDividerAppears]` for orange vertical lines on desktop |
| 6 | `src/views/taals.ts` → `getVibhagStructure()` | `case beats:` with the correct slices for mobile grouping |
| 7 | `src/views/stats.ts` → `TAAL_META` | Entry with emoji and CSS colour class (`stats-tag--orange/blue/purple/teal/amber`) — **ALWAYS mandatory** |

> ✅ **Automatic** — nothing else needs to be touched:
> - `src/components/viewManager.ts`: registers TaalViews dynamically from `CONFIG.NAVIGATION`
> - Riyaz practice blocks (`wizardStep1.ts`, `wizardStep2.ts`): derive active taals from `CONFIG.NAVIGATION`
> - Statistics (`stats.ts`): "First X" badges and "Polyrhythmic" badge are generated dynamically from `ACTIVE_TAAL_IDS`

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

### ⚠️ MANDATORY — Register the taal in both divider mechanisms in `src/views/taals.ts`

When adding a new taal, **two locations** inside [`src/views/taals.ts`](src/views/taals.ts) must be updated:

#### 1. `VIBHAG_DIVIDERS` (orange vertical divider on desktop)
`Record<number, number[]>` object indexed by beat count. The array contains the matra numbers **after which** the orange right border appears:

```typescript
const VIBHAG_DIVIDERS: Record<number, number[]> = {
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
- **ALL inline comments and JSDoc must be in English** — no exceptions
- This applies to every `.ts` file: `//` comments, `/** */` JSDoc blocks, and section dividers
- ❌ NEVER in Spanish: `// Inicializar navegación`, `// Remover listeners anteriores`
- ✅ CORRECT: `// Initialise navigation`, `// Remove previous listeners`

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
- [ ] ✅ `dist/` folder exists with `.js` files
- [ ] ✅ `index.html` loads `dist/app.js`
- [ ] ✅ CSS has all required classes
- [ ] ✅ App renders correctly in the browser
- [ ] ✅ No errors in the browser console
- [ ] ✅ Navigation works between views
- [ ] ✅ Metronome plays sound
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

---

## 📞 Contact

If you find inconsistencies in this document or in the code, document them here for future reference.

---

**Version**: 1.2.0
**Last updated**: 2025-07-14
**Maintainer**: Bob (AI Assistant)
