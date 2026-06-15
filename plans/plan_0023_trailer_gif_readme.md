# Exec Plan: Trailer GIF README

## Objetivo

Agregar al `Readme.md` una captura animada breve que comunique rapidamente el atractivo de `GLITCH DUEL` antes de que el usuario abra el juego.

La experiencia cambia en que la pagina del repositorio mostrara, cerca del inicio, una vista dinamica del menu y/o combate con identidad visual, arenas, HUD y efectos. Queda fuera del alcance cambiar gameplay, reglas de combate, UI runtime, build tooling, GitHub Pages o agregar dependencias al proyecto para jugar/testear.

## Contexto Actual

- `Readme.md` esta en ingles y menciona `Trailer GIF or animated screenshot in README` como siguiente mejora recomendada y backlog de alta prioridad.
- No existen assets de imagen/video versionados en el repositorio.
- La app es estatica y sin dependencias; se sirve desde `src/index.html`.
- El flujo visual fuerte ya existe: menu, preview de arena, intro `VS`, HUD, combos, especial, particulas y arenas tematicas.
- `AGENTS.md` y `Readme.md` preservan la decision de no requerir `npm install` ni build step.
- Para validacion visual ya se puede usar navegador real o headless, pero no hay tooling de captura versionado.

Suposiciones explicitas:

- El objetivo principal es marketing/documentacion, no automatizar una pipeline permanente de video.
- El asset final debe estar versionado para que GitHub lo renderice en el README sin depender de servicios externos.
- Si generar un GIF optimizado requiere tooling externo disponible localmente, ese tooling se usa solo como herramienta de autor, no como dependencia del proyecto.
- Se prefiere un archivo corto y liviano sobre una captura larga de alta resolucion.

## Diseño Propuesto

- Crear una carpeta de documentacion para assets, por ejemplo `docs/assets/`.
- Generar un asset principal `docs/assets/glitch-duel-trailer.gif` o, si el peso/calidad del GIF es malo, `docs/assets/glitch-duel-trailer.webp` con fallback/nota en el README.
- Insertar el asset cerca del inicio de `Readme.md`, despues de la descripcion inicial y antes de `Summary`, usando Markdown simple:

```markdown
![GLITCH DUEL gameplay trailer](docs/assets/glitch-duel-trailer.gif)
```

- Capturar una secuencia de 5 a 8 segundos en viewport desktop aproximado `1000x700` o `1100x700`, priorizando legibilidad en GitHub.
- Contenido recomendado del trailer:
  - primer segundo: menu con identidad `GLITCH DUEL` y preview de arena;
  - segundo 2-3: inicio de round con intro `VS`;
  - segundo 3-6: combate con movimiento, combo visible, impacto y HUD;
  - cierre: especial listo/efecto o pausa visual fuerte si es facil de capturar.
- Mantener el asset pequeno:
  - ancho aproximado `720px` a `900px`;
  - duracion `5-8s`;
  - FPS moderado `10-15`;
  - objetivo de peso recomendado: menos de `5 MB`, maximo aceptable `10 MB`.
- No agregar scripts de captura al repo salvo que sea estrictamente necesario para reproducibilidad; si se usa un script temporal, dejar documentado el metodo en el plan o en notas del commit, no en runtime.
- Actualizar `Readme.md` para quitar o mover la mejora desde `Prioritized Backlog` a `Completed Backlog` cuando el asset este agregado.

## Archivos A Modificar

- `Readme.md`: insertar la captura animada y actualizar backlog.
- `docs/assets/glitch-duel-trailer.gif`: nuevo asset principal, o `.webp` si se decide por mejor peso/calidad.
- `plans/plan_0023_trailer_gif_readme.md`: mantener el estado de ejecucion del plan.
- `AGENTS.md`: sin cambio esperado, salvo que se decida documentar un smoke visual adicional para assets del README.

## Plan De Implementacion

1. Confirmar formato objetivo del asset:
   - preferido: GIF por compatibilidad y expectativa del backlog;
   - alternativo: animated WebP si el GIF queda demasiado pesado o con mala calidad.
2. Crear `docs/assets/`.
3. Generar la captura animada con una de estas rutas, en orden de preferencia pragmatica:
   - usar navegador/headless para grabar frames y una herramienta local disponible (`ffmpeg`, `magick`, ScreenToGif u otra) para ensamblar/optimizar;
   - si no hay herramienta de GIF, generar una captura estatica atractiva como fallback temporal y dejar el GIF pendiente;
   - si se usa Playwright/Chrome DevTools Protocol, mantener scripts temporales fuera del repo salvo que el usuario pida reproducibilidad versionada.
4. Revisar visualmente el asset:
   - que el titulo y HUD sean legibles;
   - que muestre combate real, no solo menu;
   - que no incluya barras del navegador, rutas locales ni informacion del sistema.
5. Insertar el asset cerca del inicio de `Readme.md` con alt text claro.
6. Actualizar el backlog del README:
   - remover o reemplazar la recomendacion `Trailer GIF or animated screenshot in README` como siguiente mejora;
   - mover el hito a `Completed Backlog`.
7. Ejecutar validacion automatica y revisar peso del asset.
8. Actualizar el estado de este plan con formato elegido, peso final, validacion y cualquier limitacion.

## Pruebas Y Validacion

Validacion automatica:

```powershell
git diff --check
node --test tests\game.test.js
```

Validacion especifica del asset:

```powershell
git status --short
```

- Confirmar que `Readme.md` referencia una ruta existente bajo `docs/assets/`.
- Confirmar que el asset no supera el umbral de peso acordado, idealmente `< 5 MB`.
- Confirmar que GitHub puede renderizar el formato elegido (`.gif` recomendado; `.webp` solo si se acepta esa decision).

Checklist manual:

- Abrir `Readme.md` renderizado localmente o en GitHub y confirmar que la animacion se muestra cerca del inicio.
- Confirmar que el primer frame comunica `GLITCH DUEL` aunque la animacion no haya arrancado.
- Confirmar que la animacion no distrae por peso excesivo, parpadeo o movimiento demasiado rapido.
- Confirmar que el README sigue siendo legible en desktop y movil.

## Documentacion

- `Readme.md`: agregar el asset animado, actualizar `Prioritized Backlog` y `Completed Backlog`.
- `AGENTS.md`: sin cambio esperado; no cambia comandos, controles, arquitectura ni smoke obligatorio del juego.
- `PLANS.md`: sin cambios esperados.

## Riesgos Y Mitigaciones

- Riesgo: GIF demasiado pesado para el README. Mitigacion: limitar duracion/FPS/resolucion y optimizar paleta; considerar WebP si el usuario acepta.
- Riesgo: tooling externo introduce confusion sobre dependencias. Mitigacion: no agregarlo al proyecto; documentarlo solo como herramienta de generacion del asset.
- Riesgo: captura no representa bien el juego. Mitigacion: incluir menu, intro y combate con impacto/efecto en una secuencia corta.
- Riesgo: asset queda desactualizado si cambia mucho la UI. Mitigacion: ubicarlo como material promocional y actualizarlo solo en cambios visuales grandes.
- Riesgo: GitHub no renderiza correctamente un formato alternativo. Mitigacion: preferir GIF salvo problema claro de peso/calidad.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El alcance se mantiene en documentacion/marketing y no toca gameplay ni runtime.
- La solucion evita agregar dependencias permanentes al proyecto.
- El plan define una ruta preferida simple (`docs/assets/glitch-duel-trailer.gif`) y un fallback explicito si el GIF no es viable.
- Los criterios son verificables: asset existe, README lo referencia, peso razonable, tests pasan y render visual confirmado.
- La implementacion se puede hacer con cambios quirurgicos: un asset nuevo, README y estado del plan.

## Criterios De Aceptacion

- `Readme.md` muestra una captura animada cerca del inicio.
- El asset esta versionado bajo `docs/assets/` y la ruta del README es relativa y valida.
- La animacion muestra identidad del juego y combate, no solo una pantalla estatica de menu.
- El archivo tiene peso razonable para GitHub, idealmente `< 5 MB` y no mas de `10 MB` salvo aprobacion explicita.
- El backlog del README ya no lista el trailer como siguiente mejora pendiente y lo refleja como completado.
- `git diff --check` y `node --test tests\game.test.js` pasan.

## Commit Y Push

- Commit sugerido: `Add README gameplay trailer`.
- Hacer commit solo si el usuario lo pide explicitamente.
- No hacer push salvo pedido explicito del usuario.

## Estado De Ejecucion

- Plan cerrado.
- Implementacion completada en `Readme.md` y `docs/assets/glitch-duel-trailer.gif`.
- Formato elegido: GIF, por compatibilidad directa con GitHub README.
- Asset final: `docs/assets/glitch-duel-trailer.gif`.
- Peso final: `2,286,612` bytes (`~2.29 MB`), bajo el objetivo de `5 MB`.
- Captura generada con Chrome headless y encoder GIF temporal fuera del repositorio; no se agregaron dependencias ni tooling al proyecto.
- El README muestra el trailer cerca del inicio, reemplaza la siguiente recomendacion por `Training mode` y mueve el trailer a `Completed Backlog`.
- Validacion completada:
  - `git diff --check`
  - `node --test tests\game.test.js` (`55` tests passing)
  - verificacion de peso del asset: `2,286,612` bytes.
