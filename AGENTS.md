# 🤖 AGENTS.md - Guía de Buenas Prácticas para Desarrollo

## 📋 Propósito
Este documento establece los estándares y buenas prácticas que TODOS los agentes de IA deben seguir al trabajar en este proyecto. La consistencia es clave.

---

## 🎯 Principios Fundamentales

### 1. **Mobile-First Design**
- **PRIORIDAD ABSOLUTA**: La aplicación se usa principalmente en móvil mientras se sostiene el instrumento
- Diseño responsive con breakpoint principal en 768px
- Touch targets mínimos de 44x44px
- Texto legible a 1 metro de distancia (mínimo 16px base)
- Scroll horizontal solo cuando sea absolutamente necesario
- Layouts que se adapten verticalmente en pantallas pequeñas

### 2. **Consistencia Visual Absoluta**
- **TODAS las vistas deben seguir el mismo patrón de diseño**
- Usa cards con: `bg-white rounded-xl p-6 shadow-sm border-2 border-slate-200`
- Hover states: `hover:border-orange-300 hover:shadow-md transition-all duration-200`
- Títulos de sección: `text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500`
- Grid layouts: `grid grid-cols-1 gap-4` (mobile) → `md:grid-cols-2` o `md:grid-cols-3` (desktop)
- NO uses tablas HTML a menos que sea estrictamente necesario - prefiere cards

### 3. **Sistema de Temas: Modo Claro y Oscuro (OBLIGATORIO)**
- **REGLA DE ORO**: El CSS global (`css/styles.css`) usa **variables CSS** (`var(--card-bg)`, `var(--text-primary)`, etc.) que se adaptan automáticamente al tema activo. Las clases Tailwind hardcodeadas como `bg-white` o `text-slate-800` **rompen** el modo oscuro.
- **✅ CORRECTO — Usar clases CSS del sistema de temas:**
  ```typescript
  // Cards → usa clase 'card' (usa var(--card-bg) automáticamente)
  className: 'card p-6 mb-4'
  
  // Títulos de sección → usa clase 'section-title'
  className: 'section-title'
  
  // Subtítulos → usa clase 'section-subtitle'
  className: 'section-subtitle'
  
  // Texto secundario/muted → usa clase 'text-muted'
  className: 'text-muted italic text-sm'
  
  // Selects → NO añadir bg-white ni colores; el CSS global ya los maneja
  className: 'w-full'
  ```
- **❌ INCORRECTO — Nunca hardcodear colores sin variante dark:**
  ```typescript
  // ❌ Rompe modo oscuro
  className: 'bg-white rounded-xl p-6 border-2 border-slate-200'
  className: 'text-slate-800 font-bold'
  className: 'bg-white' // en un select
  
  // ✅ Si usas Tailwind puro, SIEMPRE añadir variante dark:
  className: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
  ```
- **Clases CSS globales disponibles** (definidas en `css/styles.css`):
  | Clase | Uso |
  |---|---|
  | `.card` | Contenedor principal de sección |
  | `.section-title` | Título h2/h3 de vista |
  | `.section-subtitle` | Subtítulo descriptivo |
  | `.text-muted` | Texto secundario/notas |
  | `.btn-primary` | Botón acción principal (naranja) |
  | `.btn-secondary` | Botón acción secundaria (contorno) |
  | `.bol-cell` | Celda de matra en tabla de Taal |
  | `.taal-row-separator` | Separador de fila de Taal |

### 3. **TypeScript Estricto**
- Todos los archivos deben ser `.ts`
- Usa tipos explícitos, no `any`
- Aprovecha las interfaces y tipos definidos en `src/types.ts`

### 4. **Modularidad**
- Cada archivo tiene UNA responsabilidad
- No mezcles lógica de diferentes dominios
- Usa imports/exports de ES6

---

## 📁 Estructura de Archivos (INMUTABLE)

```
Dholak/
├── src/                    # Código fuente TypeScript
│   ├── types.ts           # TODAS las definiciones de tipos
│   ├── app.ts             # Entry point principal
│   ├── data/              # 📝 SOLO DATOS (editables semanalmente)
│   │   ├── bols.ts
│   │   ├── taals.ts
│   │   ├── kaydas.ts
│   │   └── lehras.ts
│   ├── core/              # Núcleo (NO TOCAR sin razón)
│   │   ├── config.ts
│   │   └── utils.ts
│   ├── components/        # Componentes reutilizables
│   │   ├── metronome.ts
│   │   ├── navigation.ts
│   │   └── viewManager.ts
│   └── views/             # Vistas de la aplicación
│       ├── dashboard.ts
│       ├── glosario.ts
│       ├── taals.ts
│       └── kaydas.ts
├── dist/                   # JavaScript compilado (GENERADO)
├── css/
│   └── styles.css         # Estilos completos
├── index.html             # HTML mínimo
├── tsconfig.json          # Config TypeScript
├── package.json           # Dependencias
└── README.md              # Documentación usuario
```

---

## 🔧 Convenciones de Código TypeScript

### Imports
```typescript
// ✅ CORRECTO - Imports explícitos
import { CONFIG } from '../core/config';
import { createElement } from '../core/utils';
import { BOLS } from '../data/bols';
import type { View, Bol } from '../types';

// ❌ INCORRECTO - Imports genéricos
import * as utils from '../core/utils';
```

### Clases
```typescript
// ✅ CORRECTO - Clase con tipos explícitos
export class DashboardView implements View {
    public render(): HTMLElement {
        // ...
    }
    
    private createCard(): HTMLElement {
        // ...
    }
}

// ❌ INCORRECTO - Sin tipos
export class DashboardView {
    render() {
        // ...
    }
}
```

### Funciones
```typescript
// ✅ CORRECTO - Tipos explícitos en parámetros y retorno
export function createElement(
    tag: string,
    attributes: ElementAttributes = {},
    content: string | HTMLElement | HTMLElement[] | null = null
): HTMLElement {
    // ...
}

// ❌ INCORRECTO - Sin tipos
export function createElement(tag, attributes, content) {
    // ...
}
```

### Constantes y Datos
```typescript
// ✅ CORRECTO - Tipo explícito y export
export const BOLS: Bol[] = [
    {
        name: 'Na / Ta',
        technique: 'Dedo índice...',
        description: 'Sonido seco...',
        badge: 'Kinar - Agudo'
    }
];

// ❌ INCORRECTO - Sin tipo
const BOLS = [
    { name: 'Na / Ta', ... }
];
```

---

## 🎨 Convenciones de CSS

### Estructura
```css
/* ✅ CORRECTO - Secciones claramente delimitadas */
/* ============================================
   SECTION NAME
   ============================================ */

.class-name {
    property: value;
}

/* ❌ INCORRECTO - Sin organización */
.class1 { ... }
.class2 { ... }
```

### Nomenclatura
- **Kebab-case**: `.nav-item`, `.bol-cell`, `.metronome-display`
- **BEM cuando sea necesario**: `.card__header`, `.card__body`
- **Prefijos de estado**: `.is-active`, `.is-hidden`

### Orden de Propiedades
1. Posicionamiento (`position`, `top`, `left`, etc.)
2. Box model (`display`, `width`, `height`, `margin`, `padding`)
3. Tipografía (`font-*`, `text-*`, `line-height`)
4. Visual (`background`, `border`, `box-shadow`)
5. Otros (`cursor`, `transition`, `animation`)

---

## 📝 Convenciones de HTML

### Estructura Mínima
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dholak Riyaz - Sistema de Práctica</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <!-- Contenido semántico -->
    <aside class="sidebar">...</aside>
    <main class="main-content" id="mainContent"></main>
    
    <!-- Scripts al final -->
    <script type="module" src="dist/app.js"></script>
</body>
</html>
```

### Reglas
- ✅ Usa etiquetas semánticas (`<aside>`, `<main>`, `<nav>`, `<section>`)
- ✅ IDs solo para JavaScript hooks
- ✅ Classes para estilos
- ❌ NO inline styles
- ❌ NO scripts inline

---

## 🔄 Flujo de Trabajo

### 1. Antes de Modificar Código
```bash
# Verificar que existe dist/
ls dist/

# Si no existe, compilar
npm run build
```

### 2. Al Agregar Nuevas Funcionalidades
1. Definir tipos en `src/types.ts`
2. Crear/modificar archivos en `src/`
3. Compilar: `npm run build`
4. Verificar en navegador

### 3. Al Agregar Datos Semanales
- **SOLO** editar archivos en `src/data/`
- Mantener la estructura de tipos existente
- Compilar después de editar

---

## ✅ Checklist: Añadir un Nuevo Taal (OBLIGATORIO)

Cada vez que se añade un nuevo taal al proyecto, se deben tocar **obligatoriamente** estos 4 archivos. Olvidar cualquiera causa que el taal no aparezca o no funcione en alguna parte de la app:

| # | Archivo | Qué añadir |
|---|---|---|
| 1 | `src/data/taals/<nombre>.ts` | Crear el archivo con la definición completa del taal |
| 2 | `src/data/taals/index.ts` | Import + entrada en el objeto `TAALS` |
| 3 | `src/core/config.ts` | Campo en `VIEWS` + item en array `NAVIGATION` |
| 4 | `src/types.ts` | Campo en interfaz `ViewsConfig` |

> ✅ **Automático** — no hay que tocar nada más:
> - `src/components/viewManager.ts`: registra TaalViews dinámicamente desde `CONFIG.NAVIGATION`
> - Bloques de práctica del Riyaz (`wizardStep1.ts`, `wizardStep2.ts`): derivan taals activos de `CONFIG.NAVIGATION`
> - Estadísticas (`stats.ts`): medallas "Primer X", medalla "Polirítmico" y colores de tags se generan dinámicamente desde `ACTIVE_TAAL_IDS`
> - Solo si el taal nuevo necesita color/emoji propio en las stats: añadir entrada en `TAAL_META` al inicio de `stats.ts`

---

## 🥁 Convenciones de Datos: Taal `rows` (vibhags)

### ⚠️ OBLIGATORIO — Dividir los beats en filas según los vibhags

El campo `rows` de un `Taal` es un **array de arrays**. Cada sub-array representa una **fila visual** en la tabla del taal, y la vista genera automáticamente una **línea de color separadora** entre filas (`taal-row-separator`). Si todos los beats van en un único array, **no aparece ningún separador** y el taal se ve como un bloque plano sin estructura.

**Regla:** agrupar los beats en filas que reflejen la estructura de vibhags del taal:

| Taal | Beats | Vibhags | Filas recomendadas |
|---|---|---|---|
| Keherwa | 8 | 2+2+2+2 | 1 fila de 8 (o 2×4) |
| Dadra | 6 | 3+3 | 1 fila de 6 (o 2×3) |
| Rupak | 7 | 3+2+2 | 1 fila de 7 |
| Deepchandi | 14 | 3+4+3+4 | 2 filas de 7 |
| Addha | 16 | 4+4+4+4 | 2 filas de 8 |
| Teental | 16 | 4+4+4+4 | 2 filas de 8 |
| Ektal | 12 | 2+2+2+2+2+2 | 2 filas de 6 |
| Jhaptal | 10 | 2+3+2+3 | 2 filas de 5 |

```typescript
// ❌ INCORRECTO — todos en una fila, sin separadores visuales
rows: [
    [
        { matra: 1, bol: 'Dhin', technique: 'Taali' },
        // ... los 12 beats juntos
        { matra: 12, bol: 'Na', technique: '' }
    ]
]

// ✅ CORRECTO — dividido en 2 filas (ejemplo Ektal)
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

Lo mismo aplica a las `variations[].rows` — cada variación también debe respetar la división por vibhags.

### ⚠️ OBLIGATORIO — Registrar el taal en los dos mecanismos de divisores de `src/views/taals.ts`

Al añadir un taal nuevo hay que actualizar **dos lugares** dentro de [`src/views/taals.ts`](src/views/taals.ts):

#### 1. `VIBHAG_DIVIDERS` (divisor naranja vertical en desktop)
Objeto `Record<number, number[]>` indexado por el número de beats. El array contiene los números de matra **después de los cuales** aparece la línea naranja derecha:

```typescript
const VIBHAG_DIVIDERS: Record<number, number[]> = {
    6:  [3],              // Dadra:      3+3
    7:  [3, 5],           // Rupak:      3+2+2
    8:  [4],              // Keherwa:    4+4
    12: [2, 4, 6, 8, 10], // Ektal:      2+2+2+2+2+2
    14: [3, 7, 10],       // Deepchandi: 3+4+3+4
    16: [4, 8, 12],       // Addha/Teental: 4+4+4+4
};
```

#### 2. `getVibhagStructure()` (división en sub-filas en móvil)
Switch por número de beats que parte cada fila en grupos según los vibhags del taal:

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

> Si no se añade el caso en `getVibhagStructure`, el taal caerá en el `default` (grupos de 4) y los vibhags en móvil no se agruparán correctamente.
> Si no se añade en `VIBHAG_DIVIDERS`, no aparecerán las líneas naranjas verticales en desktop.

---

## 🚫 Errores Comunes a EVITAR

### 1. ❌ Mezclar JavaScript y TypeScript
```typescript
// ❌ INCORRECTO
const data = require('./data.js');

// ✅ CORRECTO
import { data } from './data';
```

### 2. ❌ Usar `any`
```typescript
// ❌ INCORRECTO
function process(data: any): any {
    return data;
}

// ✅ CORRECTO
function process(data: Bol[]): HTMLElement {
    return createElement('div', {}, '...');
}
```

### 3. ❌ Olvidar Compilar
```bash
# ❌ INCORRECTO - Editar .ts y abrir navegador directamente

# ✅ CORRECTO
npm run build  # Primero compilar
# Luego abrir navegador
```

### 4. ❌ Duplicar Lógica
```typescript
// ❌ INCORRECTO - Lógica duplicada en cada vista
class View1 {
    createButton() { /* código */ }
}
class View2 {
    createButton() { /* mismo código */ }
}

// ✅ CORRECTO - Función reutilizable en utils
// src/core/utils.ts
export function createButton(text: string): HTMLElement {
    return createElement('button', { className: 'btn' }, text);
}
```

---

## 📝 Convenciones de Git

### Commits
- **SIEMPRE en inglés** — sin excepción
- Formato: `type: short description in English`
- Tipos: `feat`, `fix`, `data`, `style`, `refactor`, `docs`, `chore`
- Ejemplos correctos:
  ```
  feat: add thapki/ghuisa visual indicators on bol cells
  data: add Aaye Ho Meri Zindagi Mein song (Dadra)
  fix: remove trailing space in song URL
  style: improve legend layout for dark mode
  ```
- ❌ NUNCA en español: `"añade canción"`, `"corrige error"`, `"mejora diseño"`

### ⚠️ Flujo obligatorio antes de commit/push
- **NUNCA hacer `git commit` ni `git push` de forma automática.**
- **SIEMPRE preguntar al usuario** antes de commitear: _"¿Probaste en local? ¿Hago commit y push?"_
- El usuario debe confirmar explícitamente que la funcionalidad fue probada en el navegador.
- Solo entonces ejecutar `git add`, `git commit` y `git push`.

---

## 🎯 Checklist Pre-Commit

Antes de considerar una tarea completa, verificar:

- [ ] ✅ Todos los archivos `.ts` compilan sin errores
- [ ] ✅ `npm run build` ejecuta exitosamente
- [ ] ✅ Existe carpeta `dist/` con archivos `.js`
- [ ] ✅ `index.html` carga `dist/app.js`
- [ ] ✅ CSS tiene todas las clases necesarias
- [ ] ✅ La aplicación se ve correctamente en el navegador
- [ ] ✅ No hay errores en la consola del navegador
- [ ] ✅ Navegación funciona entre vistas
- [ ] ✅ Metrónomo reproduce sonido
- [ ] ✅ README.md está actualizado

---

## 🐛 Debugging

### Si no se ve nada en el navegador:

1. **Verificar consola del navegador** (F12)
   - ¿Hay errores de módulos?
   - ¿Hay errores 404?

2. **Verificar que dist/ existe**
   ```bash
   ls -la dist/
   ```

3. **Verificar que app.js existe**
   ```bash
   ls -la dist/app.js
   ```

4. **Recompilar desde cero**
   ```bash
   npm run clean
   npm run build
   ```

5. **Verificar index.html**
   - ¿Carga `dist/app.js`?
   - ¿Tiene `type="module"`?

6. **Verificar CSS**
   - ¿Está linkeado correctamente?
   - ¿Tiene las clases necesarias?

---

## 📚 Recursos de Referencia

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### ES Modules
- [MDN ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🔐 Reglas de Oro

1. **NUNCA** cambiar la estructura de carpetas sin documentar
2. **SIEMPRE** usar TypeScript, nunca JavaScript puro
3. **SIEMPRE** compilar antes de probar en navegador
4. **SIEMPRE** mantener tipos explícitos
5. **SIEMPRE** seguir las convenciones de este documento
6. **NUNCA** usar `any` sin justificación extrema
7. **SIEMPRE** verificar que la app funciona antes de terminar
8. **SIEMPRE** actualizar este documento si cambias convenciones
9. **NUNCA hardcodear datos en las vistas** — Los datos viven en `src/data/`. Las vistas deben iterar sobre ellos dinámicamente. Si añades un nuevo kayda, taal, canción o filler a los archivos de datos, debe aparecer automáticamente en la UI sin tocar ningún archivo de vista.
   ```typescript
   // ❌ INCORRECTO — hardcodeado
   const kayda = KAYDAS.fundamental;
   renderKayda(kayda);

   // ✅ CORRECTO — dinámico
   Object.values(KAYDAS).forEach(kayda => renderKayda(kayda));
   ```
10. **Al añadir un nuevo Taal, actualizar TODOS los 7 archivos del checklist** — Ver sección "✅ Checklist: Añadir un Nuevo Taal". En especial no olvidar `viewManager.ts` (sin esto la vista no carga) y los dos archivos de `wizardStep*.ts` (sin esto el taal no aparece en los bloques de práctica del Riyaz).

---

## 📞 Contacto

Si encuentras inconsistencias en este documento o en el código, documéntalas aquí para futuras referencias.

---

**Versión**: 1.1.0
**Última actualización**: 2026-06-24
**Mantenedor**: Bob (AI Assistant)