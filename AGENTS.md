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

---

## 📞 Contacto

Si encuentras inconsistencias en este documento o en el código, documéntalas aquí para futuras referencias.

---

**Versión**: 1.0.0  
**Última actualización**: 2026-06-23  
**Mantenedor**: Bob (AI Assistant)