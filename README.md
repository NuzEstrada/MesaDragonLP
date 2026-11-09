# Sitio web móvil para café

Este proyecto es una landing page o sitio web móvil para una cafetería, desarrollado con React + Vite + Tailwind CSS.

## Requisitos

Antes de correr el proyecto asegúrate de tener instalado:

- Node.js 20 o superior
- npm o pnpm

> El repositorio incluye `pnpm-lock.yaml`, por lo que se recomienda usar `pnpm`.

## Instalación

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
pnpm install
```

Si prefieres usar npm:

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
pnpm dev
```

O con npm:

```bash
npm run dev
```

Por defecto, Vite normalmente abre la app en:

```text
http://localhost:5173
```

Si necesitas que el servidor sea accesible desde la red local o desde un entorno como un contenedor/preview, puedes usar:

```bash
pnpm dev --host
```

## Compilar para producción

```bash
pnpm build
```

Con npm:

```bash
npm run build
```

La salida generada quedará en la carpeta `dist/`.

## Vista previa de la build

```bash
pnpm preview --host
```

O:

```bash
npm run preview -- --host
```

## Scripts disponibles

- `pnpm dev` / `npm run dev`: ejecuta el servidor de desarrollo
- `pnpm build` / `npm run build`: genera una versión de producción
- `pnpm preview` / `npm run preview`: sirve la build localmente
- `pnpm format` / `npm run format`: formatea con oxfmt

## Publicar en GitHub Pages

No uses **Add file > Upload files** para cargar toda la carpeta: esa herramienta no aplica las reglas de `.gitignore` y puede intentar subir `node_modules/`. El workflow de GitHub Actions instala las dependencias, compila el sitio y publica `dist/` automáticamente cada vez que haces push a `main`.

1. Crea un repositorio vacío en GitHub.
2. Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
git init
git add .
git commit -m "Subir proyecto inicial"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```

Reemplaza `USUARIO/REPOSITORIO` por los datos de tu repositorio. Antes del primer push, abre **Settings > Pages** y elige **GitHub Actions** como fuente de publicación. Cuando termine el workflow, encontrarás el enlace en **Actions** o en **Settings > Pages**. `.gitignore` excluye dependencias, compilaciones y archivos locales; no subas `node_modules/` ni `dist/`.

## Estructura principal

```text
.
├── public/
├── src/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Si quieres, también puedo dejarte un README más visual con imágenes, badges y una descripción más comercial del proyecto.
