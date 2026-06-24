# Dholak Riyaz - Sistema de Práctica

Sistema interactivo de práctica para Dholak con metrónomo de alta precisión, patrones rítmicos y recursos de aprendizaje.

## 🌐 Aplicación en Vivo

**URL:** https://prashant-jt.github.io/dholak-riyaz/

## ✨ Características

- 🥁 Metrónomo de alta precisión con Web Audio API
- 📚 Glosario completo de Bols (golpes)
- 🎵 Múltiples Taals: Keherwa, Dadra, Rupak, Deepchandi, Teental
- 🎼 Kaydas y variaciones
- 🎯 Pickups, Fillers y Cuts
- 📱 Diseño responsive para móvil y desktop
- 🔊 Integración con Lehras (loops de práctica)

## 🛠️ Tecnologías

- TypeScript
- Web Audio API
- Tailwind CSS (CDN)
- GitHub Actions (CI/CD)
- GitHub Pages (Hosting)

## 📝 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Iniciar servidor local
npm start
```

## 🔄 Actualizar Contenido

Después de tus clases semanales:

```bash
# 1. Editar archivos de datos
# src/data/bols.ts
# src/data/taals.ts
# src/data/kaydas.ts
# src/data/fillers.ts

# 2. Subir cambios
git add .
git commit -m "Week X: New content from class"
git push

# GitHub Actions compila y despliega automáticamente
```

## 📂 Estructura del Proyecto

```
Dholak/
├── src/                    # Código fuente TypeScript
│   ├── types.ts           # Definiciones de tipos
│   ├── app.ts             # Entry point
│   ├── data/              # Datos editables
│   ├── core/              # Utilidades
│   ├── components/        # Componentes reutilizables
│   └── views/             # Vistas de la aplicación
├── dist/                   # JavaScript compilado (generado)
├── css/                    # Estilos
├── index.html             # HTML principal
└── .github/workflows/     # GitHub Actions
```

## 🚀 Despliegue

El proyecto usa GitHub Actions para compilación y despliegue automático:

1. Push a `main` → Trigger workflow
2. GitHub Actions compila TypeScript
3. GitHub Actions despliega a Pages
4. Sitio actualizado en ~2 minutos

## 📖 Documentación

Ver `AGENTS.md` para guías de desarrollo y convenciones de código.

## 📄 Licencia

Proyecto personal de práctica musical.

---

**Última actualización:** 2026-06-24