# Exec Plan: Mejoras Tecnicas

Estado: Propuesto.

## Objetivo

Implementar todas las mejoras tecnicas documentadas en `Readme.md` sin cambiar la experiencia jugable intencionalmente.

Mejoras incluidas:

- Separar dibujo del luchador.
- Separar IA.
- Migrar el temporizador principal a tiempo real basado en delta time.
- Crear fixtures/helpers de pruebas.
- Documentar una prueba smoke ligera en navegador.

Queda fuera del alcance:

- Nuevas mecanicas de combate.
- Nuevas dependencias, bundler, `package.json` o servidor backend.
- Cambios de balance salvo los estrictamente necesarios para preservar duraciones al migrar el temporizador.
- Automatizacion con herramientas externas de navegador.

## Contexto Actual

- `src/config.js` contiene dimensiones logicas, constantes de rondas, energia, ataques, dificultad y arenas.
- `src/fighter.js` concentra fisica individual, controles, IA, combos, hitboxes, daño, energia, estado visual y dibujo del luchador.
- `src/game.js` concentra estado global, flujo de pantallas, rounds, temporizador, render principal, HUD, efectos y eventos de entrada.
- `src/index.html` carga scripts clasicos en orden fijo y no usa modulos ES.
- `src/styles.css` define menus, overlays, canvas y controles tactiles.
- `tests/game.test.js` carga todos los scripts con `vm`, crea mocks de DOM/canvas/audio y contiene pruebas de combate, estados, rondas, IA, arenas, stats y feedback.

Limitaciones actuales relevantes:

- `Fighter.draw()` es largo y mezcla poses base, estados especiales, combo hints y efectos propios del luchador.
- `Fighter.updateAI()` mezcla seleccion de accion, lectura de dificultad, movimiento y ejecucion de ataques.
- `roundTimerFrames`, `COMBO_WINDOW_FRAMES`, cooldowns, hit-stun y timers visuales asumen una cadencia efectiva de 60 FPS.
- Las pruebas tienen helpers basicos, pero todavia repiten preparacion de jugadores, energia, inputs y avance de frames.
- El smoke test manual existe en README y AGENTS, pero no esta organizado como recorrido corto por escenarios tecnicos.

## Diseño Propuesto

### Enfoque General

Implementar en fases pequeñas y verificables. Las primeras fases no deben cambiar comportamiento jugable; solo reorganizan o documentan. La migracion a delta time se deja para el final porque es la fase con mayor riesgo de cambiar duraciones.

### Fixtures De Pruebas

Agregar helpers dentro de `tests/game.test.js` antes de refactorizar codigo productivo.

Helpers propuestos:

- `startPlayingGame(api)`: inicia partida y devuelve estado util.
- `placeFighters(api, playerX, cpuX)`: posiciona jugadores para pruebas de rango.
- `giveEnergy(fighter, amount = 100)`: prepara especial sin repetir asignaciones.
- `tapKey(api, key, frames = 1)`: simula presionar y soltar una tecla.
- `advanceFrames(api, frames)`: avanza `update()` varias veces.

No crear framework de pruebas propio. Mantener los helpers locales al archivo de test.

### Separar Dibujo Del Luchador

Extraer solo funciones de render, sin mover reglas de combate.

Opcion minima recomendada:

- Crear `src/fighter_render.js` con funciones globales clasicas cargadas antes de `fighter.js`.
- Mantener `Fighter.draw()` como metodo publico, pero delegar a `drawFighter(this)`.
- Mover helpers visuales internos a funciones como `drawFighterBody(fighter, baseX, baseY)`, `drawFighterAttackPose(...)`, `drawFighterComboFeedback(...)` y `drawFighterComboHint(...)` solo si reducen complejidad real.

No introducir clases nuevas ni modulos ES. Mantener `ctx`, `WIDTH`, `HEIGHT` y coordenadas logicas como hoy.

### Separar IA

Extraer decision pura de IA sin cambiar probabilidades ni acciones existentes.

Opcion minima recomendada:

- Crear `src/ai.js` con `chooseAIAction(fighter, opponent, difficulty, rand)`.
- La funcion debe devolver una de las acciones actuales: `idle`, `approach`, `retreat`, `jump`, `block`, `punch`, `kick`, `special`.
- `Fighter.updateAI()` conserva aplicacion de movimiento y ataques, pero delega la seleccion cuando `aiDecisionTimer <= 0`.
- Mantener `canHitOpponent()` en `Fighter`; la funcion puede recibir booleans derivados (`canPunch`, `canKick`, `opponentAttacking`, `dist`) si eso evita acoplarla demasiado a la clase.

Preferencia: usar entrada tipo objeto simple para facilitar pruebas:

```js
chooseAIAction({ dist, health, energy, onGround, opponentAttacking, canPunch, canKick, difficulty, rand })
```

### Temporizador Basado En Delta Time

Migrar primero el timer de round, no todos los cooldowns.

Motivo: el README propone delta time para el round timer y, si aplica, cooldowns. Cambiar cooldowns, combos, hit-stun y efectos a segundos aumentaria el alcance y el riesgo. Para este plan, el criterio minimo es hacer estable la duracion del round real manteniendo cooldowns por frames.

Cambios propuestos:

- Agregar `ROUND_TIME_MS = ROUND_TIME_SECONDS * 1000` en `src/config.js`.
- Reemplazar o complementar `roundTimerFrames` por `roundTimeMs` en `src/game.js`.
- Cambiar `gameLoop(timestamp)` para calcular `deltaMs` con limite maximo, por ejemplo `MAX_DELTA_MS = 100`, y llamar `update(deltaMs)`.
- `updateRoundTimer(deltaMs)` resta milisegundos solo en `playing` y no durante `paused`, `roundOver`, `gameOver` o `menu`.
- `drawHealthBars()` muestra `Math.ceil(roundTimeMs / 1000)`.
- Mantener helpers de pruebas para setear tiempo restante, por ejemplo `setRoundTimeMs(value)` o adaptar `setRoundTimerFrames(value)` con compatibilidad interna solo si las pruebas existentes lo necesitan.

No migrar en esta fase:

- `COMBO_WINDOW_FRAMES`.
- `attackCooldown`.
- `hitStun`.
- `hitStopFrames`.
- Timers visuales de textos, combo hints o status.

### Prueba Smoke Ligera En Navegador

Documentar un recorrido corto y repetible, no automatizado, en `Readme.md`.

Debe cubrir:

- Carga desde `http://localhost:8000/src/`.
- Inicio de partida.
- Timer baja aproximadamente en segundos reales.
- Pausa congela timer.
- Combos siguen respondiendo.
- Resize mantiene proporcion.
- No hay errores visibles en consola.

Actualizar `AGENTS.md` solo si el smoke test recomendado para futuras sesiones cambia de forma sustancial.

## Archivos A Modificar

- `src/index.html`: cargar nuevos scripts clasicos si se crean `ai.js` y `fighter_render.js`.
- `src/config.js`: agregar constantes de tiempo real si aplica.
- `src/ai.js`: nueva funcion pura para decision de IA.
- `src/fighter_render.js`: nuevas funciones de dibujo del luchador.
- `src/fighter.js`: delegar render y decision de IA, preservando API publica y reglas.
- `src/game.js`: aceptar `deltaMs` en update y migrar round timer a milisegundos.
- `tests/game.test.js`: agregar fixtures y pruebas focalizadas para IA/render/timer.
- `Readme.md`: documentar estado tecnico actualizado y smoke test ligero.
- `AGENTS.md`: actualizar solo si cambia el smoke test o instrucciones persistentes.

## Plan De Implementacion

1. Agregar fixtures locales en `tests/game.test.js` y refactorizar unas pocas pruebas existentes para usarlos.
2. Ejecutar validacion completa para confirmar que los fixtures no cambiaron comportamiento.
3. Crear `src/fighter_render.js`, mover dibujo desde `Fighter.draw()` a funciones de render y cargar el script en `src/index.html` antes de `fighter.js`.
4. Agregar prueba minima que confirme que `player.draw()` sigue invocando primitivas canvas para estados relevantes como `idle`, `punch`, `kick`, `block` y combo feedback.
5. Ejecutar validacion completa.
6. Crear `src/ai.js` con `chooseAIAction(...)` y pruebas unitarias directas de decisiones clave: bloquear ataque cercano, retirarse con baja vida, acercarse a distancia larga, atacar solo si hay hitbox y usar especial con energia.
7. Delegar la decision desde `Fighter.updateAI()` sin cambiar probabilidades ni acciones.
8. Ejecutar validacion completa y hacer smoke manual corto contra CPU.
9. Migrar round timer de frames a milisegundos con `gameLoop(timestamp)`, `update(deltaMs)` y `updateRoundTimer(deltaMs)`.
10. Actualizar pruebas de temporizador para validar decremento por `deltaMs`, pausa sin decremento y resolucion de round al llegar a cero.
11. Documentar el smoke test ligero en `Readme.md` y actualizar `AGENTS.md` si el checklist recomendado cambia.
12. Ejecutar validacion automatica completa y smoke manual final.

## Pruebas Y Validacion

Validacion automatica completa despues de cada fase importante:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Si `src\ai.js` o `src\fighter_render.js` aun no existen en una fase intermedia, omitir esos `node --check` hasta crearlos.

Smoke test manual tecnico:

- Servir con `python -m http.server 8000` desde `C:\tmp\game`.
- Abrir `http://localhost:8000/src/`.
- Iniciar partida en dificultad `NORMAL` y arena `CUADERNO`.
- Confirmar que el timer baja aproximadamente una unidad por segundo real.
- Pausar con `P` y confirmar que timer, luchadores y CPU se congelan.
- Reanudar con `P` o `RESUMIR` y confirmar que el timer continua.
- Ejecutar `J,J`, `J,K` y `K,K` y confirmar que el feedback visual sigue apareciendo.
- Cambiar tamaño de ventana y confirmar que canvas mantiene proporcion.
- Confirmar que no hay errores visibles en consola del navegador.

## Documentacion

- `Readme.md`: actualizar seccion de arquitectura, pruebas y smoke test ligero cuando se implemente.
- `AGENTS.md`: actualizar si se agregan nuevos scripts a validar o si cambia el smoke test persistente.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: separar dibujo puede romper poses o feedback de combos. Mitigacion: mover codigo de forma mecanica, mantener `Fighter.draw()` como fachada y validar estados visuales con pruebas y smoke manual.
- Riesgo: separar IA puede alterar probabilidades por cambios en orden de condiciones. Mitigacion: copiar condiciones actuales, inyectar `rand` y cubrir decisiones principales con pruebas deterministas.
- Riesgo: delta time puede romper pruebas existentes que usan frames. Mitigacion: migrar solo round timer, mantener cooldowns por frame y adaptar helpers de prueba para pasar `deltaMs` explicito.
- Riesgo: nuevos archivos clasicos pueden cargarse en orden incorrecto. Mitigacion: cargar `ai.js` y `fighter_render.js` antes de `fighter.js` y agregar `node --check` para cada archivo nuevo.
- Riesgo: sobre-refactorizar `Fighter`. Mitigacion: no mover fisica, daño, hitboxes ni controles en este plan.
- Riesgo: smoke test documentado se vuelva demasiado largo. Mitigacion: mantenerlo como recorrido tecnico corto y dejar el smoke completo existente para validacion general.

## Validacion Del Plan Con Skill

Revision con `karpathy-guidelines`:

- Alcance reducido: aunque cubre todas las mejoras tecnicas, se divide en fases pequeñas y evita nuevas mecanicas.
- Simplicidad: no agrega dependencias, modulos ES, clases nuevas ni automatizacion externa de navegador.
- Cambios quirurgicos: dibujo, IA, timer, tests y documentacion se tocan por razones directas del objetivo.
- Suposiciones explicitas: solo el round timer migra a delta time; cooldowns y timers visuales quedan por frames para evitar sobrealcance.
- Verificabilidad: cada fase tiene pruebas y validacion automatica; el timer tiene smoke manual especifico.

## Criterios De Aceptacion

- `src/fighter.js` ya no contiene el cuerpo completo de render del luchador; `Fighter.draw()` delega en helpers de render.
- La seleccion de accion de la CPU esta en una funcion testeable separada y `Fighter.updateAI()` conserva la ejecucion de movimiento/ataques.
- El round timer usa milisegundos derivados de `requestAnimationFrame(timestamp)` y se detiene correctamente fuera de `playing`.
- Las pruebas usan fixtures/helpers locales para reducir preparacion repetida.
- El README documenta el smoke test tecnico ligero.
- No se agregaron dependencias externas ni paso de build.
- La validacion automatica completa pasa.
- El smoke test manual tecnico pasa en navegador.

## Commit Y Push

Recomendacion de commits:

- Commit 1: `Add test fixtures for gameplay specs`.
- Commit 2: `Extract fighter rendering helpers`.
- Commit 3: `Extract CPU decision logic`.
- Commit 4: `Use delta time for round timer`.
- Commit 5: `Document technical smoke test`.

Ejecutar validacion antes de cada commit. Hacer push solo si el usuario lo pide.
