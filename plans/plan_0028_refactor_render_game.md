# Exec Plan: refactor render game

## Objetivo

Reducir el tamano y las responsabilidades de `src/game.js` extrayendo renderizado de arenas y HUD/status a archivos dedicados, sin cambiar gameplay, controles, balance, persistencia ni apariencia intencional.

La experiencia del jugador debe permanecer igual. El beneficio es de mantenimiento: `game.js` queda mas enfocado en estado, loop, rondas, UI y eventos, mientras que el render visual queda separado.

Queda fuera del alcance:

- Cambiar diseno visual, paletas, animaciones o layout.
- Agregar nuevas arenas, HUD themes o opciones.
- Migrar a ES modules o cambiar el modelo de scripts clasicos.
- Refactorizar persistencia, menus, input, audio, IA o `Fighter`.
- Crear abstracciones genericas de render que no sean necesarias.

## Contexto Actual

- `src/game.js` tiene aproximadamente 1350 lineas y mezcla estado global, menu, pausa, rondas, timer, efectos, render de arenas, HUD, status, VS intro, controles y setup.
- `src/fighter_render.js` ya separa el dibujo de luchadores, lo que confirma que separar render visual encaja con la arquitectura actual.
- `src/index.html` carga scripts clasicos en orden: `i18n.js`, `config.js`, `audio.js`, `effects.js`, `ai.js`, `fighter_render.js`, `fighter.js`, `game.js`.
- `tests/game.test.js` concatena una lista fija de archivos fuente en `loadGame()`. Cualquier nuevo `.js` debe agregarse ahi en el orden correcto.
- El render de arenas actual esta en `game.js`: `drawBackground()`, `getArenaMotionFrame()`, `drawArenaDetails()` y funciones `draw*Details()`.
- El render de HUD/status actual esta en `game.js`: `drawHealthBars()`, `drawHealthBar()`, `getHealthBarColor()`, `drawEnergyBar()`, `drawStatusMessage()`, `getStatusAccent()`, `drawVsIntro()`, `drawImpactFlash()`, `drawSpecialFlash()`.

Suposiciones:

- Se mantendra el uso de variables globales compartidas por scripts clasicos, igual que el resto del proyecto.
- Los nuevos archivos no exportaran/importaran modulos; solo definiran funciones globales consumidas por `game.js`.
- Las funciones extraidas pueden recibir parametros cuando eso reduzca acoplamiento, pero no se introducira una capa de renderer compleja.
- `visualFrame`, `statusMessage`, `statusTimer`, `currentRound`, `vsIntroTimer`, `impactFlash`, `specialFlash`, `player1`, `player2` y helpers como `t()`, `getArenaLabel()` o `getDifficultyLabel()` pueden seguir disponibles globalmente por orden de scripts.

## Diseño Propuesto

Implementar el refactor en dos extracciones independientes y verificables.

Primera extraccion: `src/arena_render.js`

- Mover desde `game.js`:
  - `drawBackground()`
  - `getArenaMotionFrame()`
  - `drawArenaDetails()`
  - `drawNotebookDetails()`
  - `drawCafeteriaDetails()`
  - `drawLabDetails()`
  - `drawMeetingDetails()`
  - `drawRemoteMeetingDetails()`
  - `drawMathClassDetails()`
  - `drawServerDownDetails()`
  - `drawGeekConventionDetails()`
- Mantener nombres de funciones para evitar tocar llamadas y tests salvo la lista de carga.
- Agregar `<script src="arena_render.js"></script>` antes de `game.js` en `src/index.html`.
- Agregar `arena_render.js` a `sourceFiles` en `tests/game.test.js` antes de `game.js`.

Segunda extraccion: `src/hud_render.js`

- Mover desde `game.js`:
  - `drawHealthBars()`
  - `drawHealthBar()`
  - `getHealthBarColor()`
  - `drawEnergyBar()`
  - `drawStatusMessage()`
  - `getStatusAccent()`
  - `drawVsIntro()`
  - `drawImpactFlash()`
  - `drawSpecialFlash()`
- Mantener nombres de funciones para que `draw()` siga llamando igual.
- Agregar `<script src="hud_render.js"></script>` despues de `arena_render.js` y antes de `game.js`.
- Agregar `hud_render.js` a `sourceFiles` en `tests/game.test.js` antes de `game.js`.

Interaccion con `gameState`:

- Sin estados nuevos.
- `game.js` sigue decidiendo cuando llamar a render y update.
- Los archivos extraidos solo dibujan con el estado ya existente.

Compatibilidad con coordenadas:

- Todas las funciones extraidas deben seguir usando `WIDTH`, `HEIGHT`, `GROUND_Y` y coordenadas logicas `1000x500`.
- No se debe introducir dependencia en tamano CSS, DPR o viewport dentro de los renderers extraidos.

## Archivos A Modificar

- `src/arena_render.js`: nuevo archivo con render de fondos y detalles de arenas.
- `src/hud_render.js`: nuevo archivo con HUD, status, VS intro y flashes de pantalla.
- `src/game.js`: eliminar funciones movidas y conservar llamadas existentes en `draw()`.
- `src/index.html`: cargar los nuevos scripts antes de `game.js`.
- `tests/game.test.js`: agregar nuevos scripts a `sourceFiles`.
- `Readme.md`: actualizar arquitectura/main files si corresponde.
- `AGENTS.md`: actualizar Project Shape si corresponde para futuras sesiones.

## Plan De Implementacion

1. Crear `src/arena_render.js` moviendo solo funciones de arena desde `game.js`.
   Verificar: `drawBackground()` sigue existiendo globalmente y tests de arenas siguen pasando.

2. Actualizar `src/index.html` y `tests/game.test.js` para cargar `arena_render.js` antes de `game.js`.
   Verificar: `node --test tests\game.test.js` no falla por referencias faltantes.

3. Ejecutar validacion parcial.
   Verificar: `node --check src\arena_render.js`, `node --check src\game.js`, `node --test tests\game.test.js`.

4. Crear `src/hud_render.js` moviendo solo funciones de HUD/status/VS/flashes desde `game.js`.
   Verificar: `draw()` en `game.js` conserva las mismas llamadas y orden de dibujo.

5. Actualizar `src/index.html` y `tests/game.test.js` para cargar `hud_render.js` antes de `game.js`.
   Verificar: tests de status, VS intro, health bars, reduced motion y flashes siguen pasando.

6. Actualizar documentacion minima.
   Verificar: `Readme.md` y `AGENTS.md` mencionan los nuevos archivos si listan la arquitectura.

7. Ejecutar validacion completa.
   Verificar: todos los comandos de la seccion de pruebas pasan.

## Pruebas Y Validacion

Validacion automatica:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\arena_render.js
node --check src\hud_render.js
node --check src\game.js
node --test tests\game.test.js
```

Smoke test manual:

- El menu carga sin errores de consola.
- El selector de arena muestra preview, nombre y descripcion como antes.
- Cada arena se dibuja igual que antes durante partida.
- Los textos `ROUND`, `FIGHT`, `TIME`, `K.O.`, `ROUND HUMANO` y `ROUND CPU` se ven igual que antes del refactor.
- Barras de vida y energia se dibujan igual.
- VS intro muestra round, dificultad y arena.
- Impact flash, special flash, floating texts y reduced motion mantienen comportamiento.
- Pausa, game over y retorno al menu funcionan.

## Documentacion

- `Readme.md`: actualizar lista de archivos principales y orden de scripts si aparece documentado.
- `AGENTS.md`: actualizar Project Shape y notas de arquitectura si listan los archivos principales.
- `BACKLOG.md`: no requiere cambios salvo que exista un item de mantenimiento directamente completado.
- `PLANS.md`: sin cambios.

## Riesgos Y Mitigaciones

- Riesgo: errores por orden de carga de scripts clasicos.
  Mitigacion: cargar `arena_render.js` y `hud_render.js` antes de `game.js` en HTML y tests.

- Riesgo: funciones extraidas dependen de variables locales de `game.js` no globales.
  Mitigacion: mover solo funciones que usen variables globales existentes o pasar parametros minimos; verificar con `node --test`.

- Riesgo: cambios visuales accidentales al mover codigo.
  Mitigacion: no editar logica interna durante el movimiento; comparar diff para asegurar que es traslado, no rediseño.

- Riesgo: tests no cubren una arena o efecto visual especifico.
  Mitigacion: mantener smoke manual de arenas, HUD, VS intro y flashes.

- Riesgo: el refactor se vuelve demasiado grande.
  Mitigacion: hacer primero arenas; si esa extraccion no queda limpia, detener antes de HUD.

## Validacion Del Plan Con Skill

Se cargo la skill `karpathy-guidelines` antes de finalizar este plan.

Revision aplicada:

- El plan es quirurgico: solo mueve render de arenas y HUD fuera de `game.js`.
- No agrega features, estados, controles, dependencias ni build step.
- Las suposiciones sobre scripts clasicos y variables globales estan explicitas.
- Los criterios de exito son verificables con `node --check`, `node --test` y smoke manual.
- El plan evita una re-arquitectura amplia; si la primera extraccion no queda limpia, se detiene antes de la segunda.

## Criterios De Aceptacion

- `src/game.js` queda reducido y ya no contiene las funciones de render de arenas.
- `src/game.js` queda reducido y ya no contiene las funciones de render de HUD/status/VS/flashes si se completa la segunda extraccion.
- `src/arena_render.js` y `src/hud_render.js` cargan correctamente en navegador y tests.
- El orden de dibujo en `draw()` no cambia.
- No hay cambios intencionales de gameplay, controles, balance, persistencia ni UI.
- La validacion automatica completa pasa.
- El smoke test manual no detecta regresiones visuales principales.

## Commit Y Push

- Recomendado: dos commits si se ejecuta en pasos separados:
  - `Extract arena rendering from game`
  - `Extract HUD rendering from game`
- Alternativa aceptable: un commit unico si ambas extracciones se hacen y validan en una sesion:
  - `Split game rendering helpers`
- Ejecutar validacion antes de cada commit.
- Hacer push solo si el usuario lo pide.
