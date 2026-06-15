# Exec Plan: GitHub Pages Con Actions

## Objetivo

Publicar el juego en GitHub Pages usando GitHub Actions, sirviendo el contenido de `src/` como raiz del sitio.

La experiencia cambia en que el juego puede probarse en linea con una URL limpia como `https://dersteppenwolf.github.io/xkcd_kombat/`. Queda fuera del alcance mover archivos, agregar build tooling, agregar dependencias, cambiar el entrypoint local o configurar manualmente el repositorio desde la interfaz web de GitHub.

## Contexto Actual

- El proyecto es estatico, sin `package.json`, bundler ni build step.
- El entrypoint local es `src/index.html`.
- Los assets/scripts referenciados desde `src/index.html` son relativos y viven en la misma carpeta `src/`.
- No existe `.github/workflows/` actualmente.
- La alternativa sin cambios seria usar `https://dersteppenwolf.github.io/xkcd_kombat/src/`, pero la opcion elegida busca servir `src/` como raiz.
- Hay cambios locales previos no commiteados de pulido arcade; esta configuracion debe convivir con ellos sin revertirlos.

## Diseño Propuesto

- Crear `.github/workflows/pages.yml`.
- Usar acciones oficiales:
  - `actions/checkout@v4`
  - `actions/configure-pages@v5`
  - `actions/upload-pages-artifact@v3` con `path: src`
  - `actions/deploy-pages@v4`
- Ejecutar el workflow en `push` a `main` y manualmente con `workflow_dispatch`.
- Conceder permisos minimos: `contents: read`, `pages: write`, `id-token: write`.
- Documentar en `Readme.md` la URL esperada y que GitHub Pages debe tener source `GitHub Actions`.
- Documentar en `AGENTS.md` que el workflow publica `src/` y que no debe introducirse build step.

## Archivos A Modificar

- `.github/workflows/pages.yml`: workflow de despliegue a Pages.
- `Readme.md`: seccion de publicacion en linea.
- `AGENTS.md`: nota operativa para futuras sesiones.
- `plans/plan_0014_github_pages_actions.md`: este plan.

## Plan De Implementacion

1. Crear workflow `pages.yml` con acciones oficiales de Pages.
2. Actualizar README con URL esperada, source requerido y comportamiento de despliegue.
3. Actualizar AGENTS con la nota de despliegue.
4. Validar sintaxis basica y ejecutar validacion automatica existente.

## Pruebas Y Validacion

```powershell
git diff --check
node --check src\i18n.js
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Validacion manual despues de push:

- En GitHub, confirmar que `Settings > Pages > Build and deployment > Source` usa `GitHub Actions`.
- Confirmar que el workflow `Deploy GitHub Pages` termina exitosamente.
- Abrir `https://dersteppenwolf.github.io/xkcd_kombat/`.
- Confirmar que carga el menu, los scripts, estilos, audio tras interaccion y canvas.

## Documentacion

- `Readme.md`: agregar seccion de GitHub Pages.
- `AGENTS.md`: agregar nota de runtime/deploy.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: GitHub Pages no queda habilitado con source `GitHub Actions`. Mitigacion: documentar el paso manual en README.
- Riesgo: publicar carpeta equivocada. Mitigacion: `upload-pages-artifact` usa `path: src` explicitamente.
- Riesgo: rutas rotas por cambiar raiz. Mitigacion: el HTML usa rutas relativas dentro de `src/`, compatibles al publicarse como raiz.
- Riesgo: mezclar con cambios locales previos. Mitigacion: tocar solo workflow, README, AGENTS y este plan para Pages.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- La solucion es la minima para publicar `src/` como raiz.
- No agrega dependencias ni build step.
- No mueve el entrypoint ni cambia ejecucion local.
- Los criterios de validacion son verificables localmente y luego en GitHub tras push.

## Criterios De Aceptacion

- Existe workflow `.github/workflows/pages.yml`.
- El workflow publica `src/` con acciones oficiales de GitHub Pages.
- README indica URL esperada y configuracion `GitHub Actions`.
- AGENTS documenta que Pages publica `src/`.
- Validacion automatica local pasa.

## Commit Y Push

- Commit sugerido: `Add GitHub Pages deployment`.
- Push solo si el usuario lo solicita explicitamente.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada junto con cambios locales existentes: `47 passed`, `0 failed`.
- Pendiente de commit/push al momento de esta actualizacion.
