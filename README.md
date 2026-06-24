# 🥁 Dholak Riyaz

Sistema de práctica interactivo para Dholak (percusión india) construido con **TypeScript**, **Web Audio API** y arquitectura modular profesional.

## 🎯 Características

- ✅ **Metrónomo de alta precisión** usando Web Audio API
- ✅ **Glosario completo de Bols** (sonidos fundamentales)
- ✅ **Taals principales**: Keherwa (8B), Dadra (6B), Rupak (7B)
- ✅ **Kaydas** (composiciones avanzadas)
- ✅ **Integración de Lehras** (loops de YouTube)
- ✅ **Diseño responsivo** y accesible
- ✅ **Arquitectura TypeScript modular**

---

## 📁 Estructura del Proyecto

```
Dholak/
├── src/                          # Código fuente TypeScript
│   ├── types.ts                  # Definiciones de tipos globales
│   ├── app.ts                    # Controlador principal
│   ├── data/                     # 📝 ARCHIVOS EDITABLES SEMANALMENTE
│   │   ├── bols.ts              # Glosario de bols
│   │   ├── taals.ts             # Definiciones de taals
│   │   ├── kaydas.ts            # Composiciones de kaydas
│   │   └── lehras.ts            # URLs de lehras de YouTube
│   ├── core/                     # Núcleo de la aplicación
│   │   ├── config.ts            # Configuración global
│   │   └── utils.ts             # Utilidades reutilizables
│   ├── components/               # Componentes reutilizables
│   │   ├── metronome.ts         # Motor del metrónomo
│   │   ├── navigation.ts        # Controlador de navegación
│   │   └── viewManager.ts       # Gestor de vistas
│   └── views/                    # Vistas de la aplicación
│       ├── dashboard.ts         # Vista principal
│       ├── glosario.ts          # Vista del glosario
│       ├── taals.ts             # Vista de taals
│       └── kaydas.ts            # Vista de kaydas
├── dist/                         # JavaScript compilado (generado)
├── css/                          # Estilos CSS
│   └── styles.css
├── index.html                    # Punto de entrada HTML
├── tsconfig.json                 # Configuración de TypeScript
├── package.json                  # Dependencias y scripts
└── .nvmrc                        # Versión de Node.js requerida
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js**: v20.17.0 o superior
- **npm**: v10.8.2 o superior
- **nvm** (recomendado para gestión de versiones de Node)

### 🎯 Inicio Rápido (UN SOLO COMANDO)

```bash
# Ejecuta el script de desarrollo
./dev.sh
```

Este script automáticamente:
- ✅ Verifica Node.js
- ✅ Instala dependencias si es necesario
- ✅ Compila TypeScript
- ✅ Inicia el servidor
- ✅ Abre en http://localhost:3000

### Instalación Manual (Alternativa)

1. **Clonar o descargar el proyecto**

2. **Instalar la versión correcta de Node.js** (si usas nvm):
   ```bash
   nvm install
   nvm use
   ```

3. **Instalar dependencias**:
   ```bash
   npm install
   ```

4. **Compilar TypeScript a JavaScript**:
   ```bash
   npm run build
   ```

5. **Iniciar servidor de desarrollo**:
   ```bash
   npm run serve
   ```

6. **Abrir navegador**: http://localhost:3000

---

## 🛠️ Scripts Disponibles

```bash
# Compilar TypeScript una vez
npm run build

# Compilar en modo watch (recompila automáticamente al guardar)
npm run watch
# o
npm run dev

# Limpiar archivos compilados
npm run clean

# Limpiar y recompilar
npm run rebuild
```

---

## 📝 Actualización Semanal de Contenido

### ¿Qué archivos editar?

**SOLO edita los archivos en `src/data/`:**

#### 1. **Agregar nuevos Bols** (`src/data/bols.ts`)

```typescript
export const BOLS: Bol[] = [
    // ... bols existentes
    {
        name: 'Nuevo Bol',
        technique: 'Descripción de la técnica',
        description: 'Descripción del sonido',
        badge: 'Categoría'
    }
];
```

#### 2. **Agregar nuevos Taals** (`src/data/taals.ts`)

```typescript
export const TAALS: TaalsData = {
    // ... taals existentes
    nuevoTaal: {
        name: 'Nombre del Taal',
        beats: 10,
        description: 'Descripción',
        subtitle: 'Subtítulo',
        rows: [
            [
                { matra: 1, bol: 'Dha', technique: 'Bhari' },
                // ... más matras
            ]
        ],
        tip: {
            title: 'Consejo',
            text: 'Texto del consejo',
            color: 'emerald' // emerald, purple, amber, blue, indigo
        }
    }
};
```

#### 3. **Agregar nuevas Kaydas** (`src/data/kaydas.ts`)

```typescript
export const KAYDAS: KaydasData = {
    // ... kaydas existentes
    nuevaKayda: {
        name: 'Nombre de la Kayda',
        taal: 'Teental',
        beats: 16,
        description: 'Descripción',
        rows: [
            {
                label: 'Parte 1',
                matras: [
                    { matra: 1, bol: 'Dha', technique: 'Sam' },
                    // ... más matras
                ]
            }
        ]
    }
};
```

#### 4. **Agregar nuevas Lehras** (`src/data/lehras.ts`)

```typescript
export const LEHRAS: Lehra[] = [
    // ... lehras existentes
    { 
        label: 'Teental 150 BPM - Tempo Avanzado', 
        url: 'https://www.youtube.com/embed/VIDEO_ID' 
    }
];
```

### Flujo de Trabajo Semanal

1. **Editar archivos en `src/data/`**
2. **Compilar**:
   ```bash
   npm run build
   ```
3. **Verificar en el navegador**
4. **Commit y push** (si usas Git)

---

## 🎨 Personalización de Estilos

Los estilos están en `css/styles.css`. Características clave:

- **Líneas azules de separación** (3px) en todas las tablas de taals
- **Tipografía**: Plus Jakarta Sans / Inter
- **Diseño responsivo** con CSS Grid
- **Contraste alto** para legibilidad a distancia

---

## 🏗️ Arquitectura Técnica

### Patrón de Diseño

- **MVC modificado**: Separación clara entre datos, lógica y presentación
- **Componentes reutilizables**: Metronome, Navigation, ViewManager
- **Vistas modulares**: Cada vista es una clase independiente
- **Type Safety**: TypeScript garantiza tipos seguros en toda la aplicación

### Tecnologías

- **TypeScript 5.3+**: Tipado estático y características modernas
- **Web Audio API**: Metrónomo de alta precisión
- **ES Modules**: Sistema de módulos nativo del navegador
- **CSS Grid**: Layouts responsivos y flexibles
- **Tailwind CSS** (vía CDN): Utilidades de estilo

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

```bash
npm run rebuild
```

### El metrónomo no suena

- Verifica que el navegador permita audio
- Algunos navegadores requieren interacción del usuario antes de reproducir audio

### Los cambios no se reflejan

1. Asegúrate de compilar después de editar:
   ```bash
   npm run build
   ```
2. Recarga el navegador (Ctrl+Shift+R / Cmd+Shift+R)

### Versión de Node incorrecta

```bash
nvm use
```

---

## 📚 Recursos Adicionales

### Aprender TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Web Audio API

- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Teoría Musical India

- [Taal System](https://en.wikipedia.org/wiki/Tala_(music))
- [Dholak Techniques](https://en.wikipedia.org/wiki/Dholak)

---

## 📄 Licencia

MIT License - Libre para uso personal y educativo

---

## 👨‍💻 Autor

**Prashant**  
Sistema desarrollado con TypeScript y buenas prácticas de ingeniería de software

---

## 🎵 Nota Especial

Este sistema está configurado para **orientación invertida**: la mano izquierda ejecuta el parche agudo principal (Dayan). Considera esto al practicar los patrones.

---

**¡Feliz práctica! 🥁**