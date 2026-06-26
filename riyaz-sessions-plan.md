# Plan: Módulo de Sesiones de Riyaz Guiadas e Interactivas

## Visión General

Crear una sección "Sesión" nativa en la app que reemplaza el flujo Google Forms + Excel.
Una sesión es un contenedor de **bloques de práctica** que el usuario va añadiendo
en orden — cada bloque tiene su propio taal/kayda, soporte rítmico y duración.
Al terminar, se muestra un resumen completo con notas libres.

**Fase actual (este plan):** frontend puro, sin backend ni auth.
Todo el estado vive en memoria. El guardado en Supabase y el login son fases futuras.

---

## Flujo de Usuario Completo

```
1. CONFIGURACIÓN DE SESIÓN (Paso 1)
   └─ Opcional: añadir un bloque de Warm Up
      └─ Elige Lehra (selector de las 6 lehras existentes)
      └─ Elige Kayda (selector de las kaydas existentes) — patrón visible en pantalla
      └─ Elige timer: libre o X minutos
   └─ Añadir bloques libres (1..N):
      └─ Elige Taal (dropdown: Keherwa, Dadra, Rupak, Deepchandi)
      └─ Elige Variación (se filtra dinámicamente según taal)
      └─ Elige soporte rítmico:
         ├─ Metrónomo → configura BPM
         ├─ Canción → selector de canciones del taal (con URL YouTube)
         └─ Lehra → selector de las 6 lehras
      └─ Elige timer: libre o X minutos
   └─ Botón "Comenzar sesión" cuando hayas añadido todos los bloques

2. EJECUCIÓN (bloque a bloque — Paso 2)
   └─ Para cada bloque en orden:
      ├─ Muestra: nombre del bloque, taal/kayda, soporte activo
      ├─ Timer visible (cuenta atrás si fijado, o cronómetro libre)
      ├─ Patrón del taal/kayda renderizado (bols con celdas)
      ├─ Soporte rítmico activo:
      │   ├─ Metrónomo: botón Play/Stop + ajuste BPM en tiempo real
      │   └─ Canción/Lehra: iframe YouTube embebido
      └─ Botón "Siguiente bloque" (o se avanza automático si timer fijo)
   └─ Último bloque → botón "Finalizar sesión"

3. RESUMEN FINAL (Paso 3)
   └─ Tiempo total de la sesión
   └─ Tiempo por taal (con nombre y duración de cada bloque)
   └─ BPMs usados (por bloque con metrónomo)
   └─ Canciones / Lehras usadas (por bloque)
   └─ Textarea de notas libres ("qué ha ido bien", "qué mejorar")
   └─ [Fase futura] Botón "Guardar en BD" — desactivado con tooltip "Próximamente"
```

---

## Arquitectura de Datos (frontend only por ahora)

### Estado interno de la sesión (en memoria, no persistido todavía)

```typescript
interface SessionBlock {
    id: string;                        // uuid local
    type: 'warmup' | 'practice';
    // Warm Up
    lehraLabel?: string;               // label de la lehra
    lehraUrl?: string;
    kaydaId?: string;
    kaydaName?: string;
    // Practice
    taalId?: string;
    taalName?: string;
    variationName?: string;
    supportType?: 'metronome' | 'song' | 'lehra';
    supportRef?: string;               // nombre canción o label lehra
    supportUrl?: string;               // URL YouTube
    bpmStart?: number;
    bpmEnd?: number;                   // BPM al finalizar el bloque
    // Timer
    timerMode: 'free' | 'fixed';
    timerMinutes?: number;             // solo si fixed
    // Resultado (se rellena al completar el bloque)
    durationSecs?: number;
    completedAt?: number;              // timestamp
}

interface SessionState {
    userId: string;
    startedAt: number;                 // timestamp Date.now()
    blocks: SessionBlock[];
    currentBlockIndex: number;
    notes: string;
    totalDurationSecs: number;
}
```

---

## Sub-Tareas

---

### Sub-Tarea 1 — Tipos de sesión

**Intent**
Añadir los tipos `SessionBlock` y `SessionState` a `src/types.ts`.
Son la base que comparten las sub-tareas 2 y 3. Sin Supabase ni auth por ahora.

**Expected Outcomes**
- Interfaces `SessionBlock` y `SessionState` añadidas a `src/types.ts`
- El proyecto compila sin errores (`npm run build`)

**Todo List**
1. Añadir las interfaces `SessionBlock` y `SessionState` a `src/types.ts`
   (ver definiciones en la sección "Arquitectura de Datos" de este plan)
2. Ejecutar `npm run build` y verificar compilación limpia

**Relevant Context**
- `src/types.ts` — añadir al final, antes del comentario `// Made with Bob`
- Sin dependencias externas nuevas — no instalar nada

**Status** `[ ] pending`

---

### Sub-Tarea 2 — Configurador de sesión (Paso 1)

**Intent**
Vista donde el usuario construye su sesión añadiendo bloques uno a uno antes de empezar.
Es un formulario dinámico que va acumulando bloques en una lista.

**Expected Outcomes**
- Sección superior: botón opcional "Añadir Warm Up"
  - Al pulsar: formulario inline con selector Lehra + selector Kayda + timer
- Sección central: lista de bloques añadidos (orden visual con número)
- Botón "+ Añadir bloque de práctica":
  - Formulario inline: selector Taal → selector Variación (dinámico) →
    selector Soporte (Metrónomo/Canción/Lehra, con sub-selector según elección) →
    timer (libre o X minutos)
- Cada bloque añadido muestra un resumen en una card con botón de eliminar
- Botón "Comenzar sesión" (activo solo si hay ≥1 bloque) → avanza a ejecución
- Vista registrada en `ViewManager` y visible en el menú lateral

**Todo List**
1. Crear `src/views/riyaz/sessionWizard.ts` con clase `SessionWizardView`
2. Implementar `renderStep1()` — el configurador descrito
3. Lógica de selector dinámico de variaciones:
   - Al cambiar taal en el dropdown → regenerar opciones de variación
     iterando `TAALS[taalId].variations` de `src/data/taals/index.ts`
   - Primera opción siempre: "Patrón Principal"
4. Lógica de selector dinámico de canciones:
   - Al elegir soporte "Canción" → filtrar `SONGS` de `src/data/songs.ts`
     por campo `taal` que coincida con el taal seleccionado
5. Lista de bloques: array `SessionBlock[]` en estado interno del wizard,
   re-renderizar la lista cada vez que se añade/elimina un bloque
6. Al pulsar "Comenzar sesión": inicializar `SessionState` con `startedAt = Date.now()`
   y navegar a `renderStep2()`
7. Registrar en `ViewManager`: añadir `this.views.set('riyaz', new SessionWizardView())`
8. Añadir a `CONFIG.NAVIGATION`: `{ id: 'riyaz', label: '🎯 Sesión Riyaz', separator: true }`

**Relevant Context**
- `src/data/taals/index.ts` — `TAALS` para variaciones dinámicas
- `src/data/songs.ts` — `SONGS[]` con campo `taal`
- `src/data/lehras.ts` — `LEHRAS[]` para selector de lehras
- `src/data/kaydas.ts` — `KAYDAS` para selector de kaydas en warm up
- `src/components/viewManager.ts` — añadir registro de la nueva vista
- `src/core/config.ts` — añadir a NAVIGATION y VIEWS

**Status** `[ ] pending`

---

### Sub-Tarea 4 — Ejecución bloque a bloque (Paso 2)

**Intent**
La pantalla de práctica activa. Muestra un bloque a la vez con todo lo necesario
para practicar: patrón visual, soporte rítmico y timer. Al terminar un bloque
se registra su duración real y se pasa al siguiente.

**Expected Outcomes**
- Header del bloque: "Bloque X de N — nombre taal/kayda"
- Timer prominente:
  - Modo libre: cronómetro MM:SS contando hacia arriba
  - Modo fijo: cuenta regresiva MM:SS, al llegar a 0 suena un beep y avanza automático
- Patrón del taal/kayda renderizado con las celdas bol-cell existentes
- Soporte rítmico según tipo del bloque:
  - Metrónomo: display BPM + botón Play/Stop + botones +/- BPM
  - Canción/Lehra: iframe YouTube con controles nativos
- Botón "Siguiente bloque" / "Finalizar sesión" (en el último bloque)
- Al terminar bloque: guarda `durationSecs` y `bpmEnd` en el `SessionBlock`

**Todo List**
1. Método `renderStep2()` en `SessionWizardView`
2. Lógica de timer:
   - `setInterval` cada 1000ms actualiza el display
   - Modo fixed: cuando `remaining === 0` → llamar `completeCurrentBlock()`
   - Usar `audioContext` existente o `new AudioContext()` para el beep de fin de timer
3. Renderizado del patrón:
   - Para bloques de práctica: extraer `rows` de `TAALS[taalId].rows` o de la variación
   - Para warm up: extraer `rows` de `KAYDAS[kaydaId].rows` (estructura diferente: `KaydaRow[]`)
   - Reutilizar la lógica de creación de celdas de `src/views/taals.ts` y `src/views/kaydas.ts`
4. Rama Metrónomo: instanciar `new MetronomeEngine()` local (no el del dashboard)
   - Destruir la instancia al salir del bloque (`stop()`)
5. Rama Canción/Lehra: `createElement('iframe', { src: url, ... })`
6. `completeCurrentBlock()`:
   - Registra `durationSecs` y `bpmEnd` en el bloque actual
   - Si hay siguiente bloque: `currentBlockIndex++` y re-renderizar
   - Si era el último: llamar `renderStep3()`

**Relevant Context**
- `src/components/metronome.ts` — `MetronomeEngine` clase, métodos `start()`, `stop()`, `setBPM()`
- `src/views/taals.ts` línea ~185: lógica de creación de celdas (`.bol-cell`, `.matra-number`, `.bol-text`)
- `src/views/kaydas.ts` línea ~100: lógica de renderizado de kayda rows
- `src/core/utils.ts` — `applyBolIndicators`, `createElement`

**Status** `[ ] pending`

---

### Sub-Tarea 5 — Resumen de sesión (Paso 3)

**Intent**
Pantalla final que muestra el resumen completo de lo practicado y permite
añadir notas libres. No guarda en BD todavía — solo display en pantalla.

**Expected Outcomes**
- Card de resumen con:
  - Tiempo total de la sesión (suma de duraciones de todos los bloques)
  - Lista de bloques completados con: nombre, duración, BPM (si metrónomo),
    canción/lehra usada (si aplica)
  - Breakdown de tiempo por taal (agrupado, en barras de progreso CSS)
- Textarea de notas libres (etiqueta: "¿Qué ha ido bien? ¿Qué mejorar?")
- Botón "Nueva sesión" → vuelve al Paso 1 con estado limpio
- [Placeholder] Botón "Guardar" desactivado con tooltip "Próximamente"
  para cuando se implemente el backend en fase futura

**Todo List**
1. Método `renderStep3()` en `SessionWizardView`
2. Calcular `totalDurationSecs` sumando todos los `block.durationSecs`
3. Agrupar bloques por `taalId` para el breakdown de tiempo por taal:
   - Calcular % de cada taal sobre el total
   - Renderizar barras de progreso CSS (`width: X%`, color `var(--orange-500)`)
4. Renderizar lista de bloques completados como cards pequeñas
5. Añadir `<textarea>` para notas con placeholder sugerido
6. Botón "Nueva sesión": resetea `SessionState` y llama `renderStep1()`
7. Botón "Guardar" (desactivado, con `title="Próximamente — guardado en BD"`)

**Relevant Context**
- Las barras de progreso CSS ya se usan en otros contextos del proyecto
- Usar `.card`, `.resource-box`, `.info-box` existentes para el layout del resumen
- El estado completo está en `this.sessionState: SessionState` del wizard

**Status** `[ ] pending`

## Archivos Nuevos

```
src/
└── views/
    └── riyaz/
        └── sessionWizard.ts     (contiene los 3 pasos)
```

## Archivos Modificados

```
src/types.ts                     → SessionBlock, SessionState
src/core/config.ts               → añadir 'riyaz' a VIEWS y NAVIGATION
src/components/viewManager.ts    → registrar SessionWizardView
css/styles.css                   → estilos timer display
```

## Fases Futuras (fuera de este plan)

- **Auth:** pantalla de login con username "prashant" / "meera" validado contra Supabase
- **Persistencia:** guardar sesión en tabla `sessions` de Supabase
- **Estadísticas:** dashboard con gráficas, rachas y comparativa metrónomo vs canción

---

## Orden de Implementación

```
1 → Sub-Tarea 1: tipos SessionBlock + SessionState
2 → Sub-Tarea 2: configurador de sesión (Paso 1)
3 → Sub-Tarea 3: ejecución bloque a bloque (Paso 2)
4 → Sub-Tarea 4: resumen final (Paso 3)
```

Las sub-tareas 2-4 comparten `SessionWizardView` y su estado interno —
implementarlas en secuencia dentro del mismo archivo.

---

*Made with Bob*
