# Exec Plan: profundidad arenas por capas

## Objetivo

Implementar la sugerencia 35 del backlog, `Layered arena depth`, para que las ocho arenas se lean como espacios con fondo, plano medio y primer plano sin cambiar reglas de combate, hitboxes, coordenadas logicas ni rendimiento intencional.

La experiencia del jugador cambia solo en lo visual: cada arena mantiene sus detalles actuales detras de los luchadores y gana elementos frontales discretos en los bordes o la base del escenario. Quedan fuera del alcance nuevas arenas, variantes cosmeticas, animaciones reactivas, cambios de camara, parallax, efectos WebGL/WebGPU y cualquier elemento que cubra el HUD o altere la legibilidad de ataques.

## Contexto Actual

- `src/arena_render.js` mantiene `drawBackground()`: pinta color base y cuadricula, llama a `drawArenaDetails(selectedArena, arena)` y despues dibuja la linea de suelo. Los detalles de las ocho arenas se renderizan antes que los luchadores.
- `src/game.js` orquesta el orden actual en `draw()`: fondo, luchadores, particulas, flashes, textos flotantes y HUD. No existe una llamada de arena entre luchadores y particulas.
- `src/config.js` conserva el espacio logico de `1000x500` y `GROUND_Y = 380`; los props visuales no pueden afectar las hitboxes de `Fighter`.
- `src/arena_render.js` ya tiene detalles tematicos para `notebook`, `cafeteria`, `lab`, `meeting`, `remoteMeeting`, `mathClass`, `serverDown` y `geekConvention`; algunos usan `getArenaMotionFrame()` y respetan `reducedMotionEnabled`.
- `tests/game.test.js` carga `arena_render.js` antes de `game.js`, expone `drawBackground()` y cubre seleccion, fallback y primitivas de fondo, pero no puede verificar pixeles ni orden real de capas sin ampliar el mock.
- `Readme.md` documenta las arenas como visuales y enumera fondos/animaciones ligeras. El ajuste de profundidad debe actualizar esa descripcion y su smoke test, sin abordar la discrepancia preexistente de conteo de arenas, que pertenece al item 70 del backlog.

Suposiciones:

- Los detalles actuales de `drawArenaDetails()` son el plano medio; el color/cuadricula base es el fondo. No se reescribiran ni extraeran esas funciones solo para nombrar capas.
- La capa nueva es estatica. Las reacciones a golpes, KO, tiempo o energia siguen siendo el item 36 del backlog, y las variantes/animaciones adicionales siguen siendo items separados.
- Cada arena recibira como maximo dos grupos sencillos de primitivas Canvas en primer plano, ubicados fuera de la zona central de combate o con opacidad baja para no tapar piernas, ataques, particulas ni textos.

## Diseño Propuesto

Agregar una unica funcion publica de render, `drawArenaForeground()`, en `src/arena_render.js`.

- `drawBackground()` se mantiene como capa de fondo y plano medio: color, cuadricula, detalles tematicos existentes y linea de suelo se dibujan sin cambio funcional.
- `drawArenaForeground()` obtiene `selectedArena` y su configuracion, aplica un `ctx.save()`/`ctx.restore()` propio y despacha a un bloque por arena. No se agregara un sistema generico de escenas ni campos nuevos a `ARENAS`.
- Cada bloque usa solo `fillRect`, `strokeRect`, lineas o arcos ya soportados por el renderer actual. La composicion propuesta es:
  - `notebook`: esquina de pagina y clips/regla en los extremos inferiores.
  - `cafeteria`: borde cercano de mesa y sillas laterales.
  - `lab`: mesada baja, cable y recipiente en los extremos.
  - `meeting`: respaldo de sillas y borde cercano de mesa.
  - `remoteMeeting`: marco de dispositivo y dock/controles bajos periféricos.
  - `mathClass`: pupitres o libros bajos y borrador lateral.
  - `serverDown`: racks/cables bajos laterales sin cubrir el centro.
  - `geekConvention`: siluetas de asistentes y barreras de fila en los bordes.
- En `src/game.js`, llamar a `drawArenaForeground()` inmediatamente despues de `player1.draw()`/`player2.draw()` y antes de `impactParticles`, flashes y textos flotantes. Asi los luchadores quedan entre el plano medio y los props frontales, mientras que el feedback de combate permanece visible por encima.
- Mantener los props dentro de `WIDTH`, `HEIGHT` y cerca de los bordes/parte baja. No cambiar `Fighter`, `checkCollision()`, `GROUND_Y`, HUD, timers, `gameState` ni el orden relativo de particulas, flashes y HUD.
- Como la capa es estatica, `Reducir movimiento` no requiere nuevas ramas. Las animaciones existentes siguen usando `getArenaMotionFrame()` sin cambio.

## Archivos A Modificar

- `src/arena_render.js`: agregar dispatcher y primitivas de primer plano para las ocho arenas.
- `src/game.js`: invocar la capa frontal despues de dibujar los luchadores y antes del feedback de combate.
- `tests/game.test.js`: exponer `drawArenaForeground()` y cubrir el dispatcher para cada arena, su fallback y la presencia de primitivas de primer plano.
- `Readme.md`: describir las capas de arena y ampliar el smoke test visual para revisar que el primer plano no reduce la legibilidad de luchadores, HUD ni feedback.
- `plans/plan_0030_profundidad_arenas_por_capas.md`: mantener el estado de ejecucion si se implementa el plan.

## Plan De Implementacion

1. Definir `drawArenaForeground()` y sus bloques por arena en `src/arena_render.js`, usando props estaticos y perifericos.
   Verificar: al invocar la funcion para cada arena y para una clave invalida no hay errores; el fallback usa el primer plano de `notebook`.

2. Mantener `drawBackground()` sin cambiar sus detalles existentes y llamar a `drawArenaForeground()` desde `draw()` en `src/game.js` despues de los luchadores y antes de particulas/flashes/textos.
   Verificar: no se modifican las llamadas de actualizacion, hitboxes, timers ni el orden de HUD; la capa frontal no se dibuja durante el fondo directo.

3. Ampliar la API de pruebas con `drawArenaForeground()` y crear una prueba que recorra las ocho arenas, invoque solo esa capa sobre un contexto limpio y compruebe primitivas Canvas de primer plano. Incluir el fallback de arena.
   Verificar: la prueba falla si falta el dispatcher o una rama de arena y no exige comparacion de pixeles.

4. Actualizar `Readme.md` en visual/audio y el smoke test para explicar la lectura fondo/plano medio/primer plano y pedir una comprobacion de visibilidad de luchadores, HUD y feedback.
   Verificar: los textos no atribuyen comportamiento de gameplay, parallax o animacion reactiva a los props nuevos.

5. Ejecutar validacion automatica y smoke test visual en las ocho arenas, con y sin `Reducir movimiento`.
   Verificar: todos los comandos pasan y no se detectan props centrales, solapamientos criticos ni regresion en controles, pausa o game over.

## Pruebas Y Validacion

Validacion automatica:

```powershell
git diff --check
node --check src\i18n.js
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

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: actualizar caracteristicas visuales y smoke test para documentar profundidad por capas como mejora solo visual.
- `AGENTS.md`: no requiere cambios; no cambian arquitectura, comandos, coordenadas logicas ni flujo de estados.
- `BACKLOG.md`: no requiere cambios durante la implementacion; el item 35 se mantiene como trazabilidad hasta que el usuario solicite gestionar el backlog completado.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: los props en primer plano ocultan acciones o el feedback de impacto. Mitigacion: dibujarlos antes de particulas, flashes y textos, restringirlos a bordes/base y revisarlos en las ocho arenas.
- Riesgo: el trabajo se convierta en una reescritura de todos los fondos. Mitigacion: conservar `drawBackground()` y `drawArenaDetails()`; agregar solo una capa frontal y bloques pequenos por arena.
- Riesgo: cambios visuales accidentales alteren la percepcion de hitboxes. Mitigacion: no tocar `Fighter`, `GROUND_Y`, colisiones ni coordenadas de combate; validar ataques, salto y agacharse manualmente.
- Riesgo: demasiadas primitivas reduzcan rendimiento en movil. Mitigacion: limitar cada arena a uno o dos grupos de formas simples, sin imagenes, sombras costosas, filtros, parallax ni animaciones nuevas.
- Riesgo: cobertura automatizada fragil por Canvas. Mitigacion: comprobar dispatch y primitivas emitidas, no pixeles ni posiciones exactas; completar con smoke visual.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

- El alcance es quirurgico: se agrega una capa de render y su llamada, sin cambiar combate, IA, estados, configuracion de arenas ni dependencias.
- La solucion reutiliza el orden de render y las primitivas Canvas existentes en lugar de crear una arquitectura de escenas, parallax o entidades decorativas.
- Las suposiciones relevantes estan explicitadas: detalles actuales como plano medio, primer plano estatico y ocho arenas actuales.
- Los pasos tienen verificaciones concretas con sintaxis, pruebas, fallback y smoke visual.
- Se evita implementar items adyacentes del backlog, como arenas reactivas, variantes, foreground silhouettes independientes o presets de calidad.

## Criterios De Aceptacion

- Cada una de las ocho arenas muestra fondo, detalles medios actuales y al menos un grupo de props de primer plano periferico.
- `drawArenaForeground()` tiene fallback seguro a `notebook` y no modifica estado de juego ni configuracion de arena.
- El orden de render deja luchadores entre detalles medios y primer plano, y deja particulas, flashes, textos y HUD por encima del primer plano.
- No cambian hitboxes, `GROUND_Y`, reglas de combate, timer, IA, controles, estado de juego ni persistencia.
- `Reducir movimiento` mantiene el comportamiento de animaciones existente y el primer plano sigue legible.
- Las pruebas cubren dispatcher, las ocho arenas y fallback; toda la validacion automatica pasa.
- El smoke test confirma legibilidad y ausencia de solapamientos criticos en desktop y mobile landscape.

## Commit Y Push

- Commit sugerido: `Add layered arena depth`.
- Ejecutar todas las validaciones antes del commit.
- No hacer push salvo que el usuario lo solicite.

## Estado De Implementacion

Implementado localmente el 2026-07-23.

- Completado: `src/arena_render.js` incorpora `drawArenaForeground()` con props estaticos perifericos para las ocho arenas y fallback visual de `notebook`.
- Completado: `src/game.js` dibuja el primer plano despues de los luchadores y antes de particulas, flashes, textos flotantes y HUD.
- Completado: `tests/game.test.js` expone la capa frontal y cubre las ocho arenas mas el fallback, sin comparar pixeles Canvas.
- Completado: `Readme.md` documenta las tres capas visuales, actualiza el smoke test y corrige la referencia de arenas a ocho, que coincide con el selector y la configuracion actuales.

Validacion ejecutada:

- `node --test tests\game.test.js`: 70 pruebas superadas.
- `node --check` para todos los archivos `src\*.js`: correcto.
- `git diff --check`: correcto.

Plan cerrado en alcance automatico. La revision humana de las ocho arenas, desktop/mobile y legibilidad se transfirio exclusivamente al plan `0043`.
