# Exec Plan: Animaciones De Cierre Y Arenas

## Objetivo

Implementar dos mejoras visuales: poses breves de victoria/derrota al cerrar rounds o partidas y nuevas arenas con identidad grafica propia.

La experiencia del jugador cambia en que el ganador/perdedor se leen mejor al finalizar una ronda y hay mas variedad visual en el selector de arena. Queda fuera del alcance cambiar dano, hitboxes, IA, controles, cooldowns, temporizador, rondas o persistencia.

## Contexto Actual

- `src/fighter_render.js` dibuja estados visuales existentes como `idle`, `walk`, `punch`, `kick`, `special`, `block`, `crouch` y `hit`.
- `src/game.js` cambia a `roundOver` o `gameOver` en `finishRound(...)`; durante esos estados ya no avanza simulacion, pero el canvas sigue dibujando el ultimo estado.
- `src/config.js` define `ARENAS` con colores y `labelKey`.
- `src/game.js` usa `drawArenaDetails(...)` para enrutar detalles visuales por arena.
- `src/index.html` contiene las opciones del selector de arena.
- `src/i18n.js` contiene labels `es`/`en` de arena.
- `tests/game.test.js` cubre seleccion de arenas, fondos tematicos y rondas.

## Diseño Propuesto

- Agregar estados visuales `victory` y `defeat` solo para render.
- En `finishRound(playerWon)`, cuando hay ganador, asignar `winner.state = 'victory'` y `loser.state = 'defeat'` antes de mostrar `roundOver` o `gameOver`.
- Para empate por tiempo, no forzar pose de victoria ni derrota.
- Renderizar `victory` como pose erguida con brazo levantado y pequeño texto de celebracion visual.
- Renderizar `defeat` como pose caida/encogida con ojos `X`, manteniendo coordenadas de dibujo solamente.
- Agregar cuatro arenas visuales nuevas: `terminal`, `mathClass`, `serverDown`, `geekConvention`.
- Cada arena tendra colores en `ARENAS`, opcion en `index.html`, labels en `i18n.js` y detalles dibujados en `game.js`.
- Mantener todas las arenas como cambios visuales; no alteran reglas ni fisica.

## Archivos A Modificar

- `src/fighter_render.js`: dibujar poses `victory` y `defeat`.
- `src/game.js`: asignar poses al finalizar rounds y dibujar detalles de nuevas arenas.
- `src/config.js`: agregar configuracion de nuevas arenas.
- `src/index.html`: agregar opciones al selector de arena.
- `src/i18n.js`: agregar labels bilingues.
- `tests/game.test.js`: cubrir nuevas arenas y poses de cierre.
- `Readme.md`: documentar nuevas arenas y animaciones de cierre.

## Plan De Implementacion

1. Agregar arenas nuevas a `ARENAS`, labels i18n y opciones HTML.
2. Extender `drawArenaDetails(...)` con funciones visuales compactas para las nuevas arenas.
3. Agregar helper de pose de cierre en `game.js` y llamarlo desde `finishRound(...)`.
4. Agregar render de `victory` y `defeat` en `fighter_render.js` con salida temprana para no mezclar con animaciones de combate.
5. Actualizar pruebas de arena y fin de partida.
6. Actualizar README.
7. Ejecutar validacion completa.

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

Smoke test manual:

- Ganar un round y confirmar pose de victoria para humano y derrota para CPU antes del siguiente round.
- Perder un round y confirmar pose inversa.
- Ganar/perder partida y confirmar poses visibles detras del overlay final.
- Probar arenas `TERMINAL`, `CLASE DE MATEMATICAS`, `SERVIDOR CAIDO` y `CONVENCION GEEK` desde menu.
- Confirmar que dano, movimiento, timer, rondas, controles y dificultad no cambian.

## Documentacion

- `Readme.md`: actualizar lista de arenas y funcionalidad visual de cierre de round/partida.
- `AGENTS.md`: no requiere cambios; no cambian comandos ni arquitectura.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: las poses pueden interferir con estados de combate si se asignan durante `playing`. Mitigacion: solo asignarlas dentro de `finishRound(...)` despues de detectar cierre.
- Riesgo: los tests con `setTimeout` inmediato pueden no observar poses de round intermedio. Mitigacion: cubrir poses en fin de partida, donde no se reinicia round.
- Riesgo: nuevas arenas pueden sobrecargar `drawBackground`. Mitigacion: usar detalles simples con primitivas ya mockeadas.
- Riesgo: labels nuevas pueden quedar sin traducir. Mitigacion: agregar claves en ambos idiomas y probar `getArenaLabel()`.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El alcance es quirurgico y visual.
- No hay dependencias externas.
- No se agregan nuevos sistemas ni configuracion persistida.
- Las suposiciones estan explicitas: nuevas poses son estados render-only y arenas son visuales.
- Los criterios de aceptacion se pueden validar con pruebas unitarias y smoke test manual.

## Criterios De Aceptacion

- El ganador entra en estado visual `victory` al cerrar una ronda con ganador.
- El perdedor entra en estado visual `defeat` al cerrar una ronda con ganador.
- Los empates no fuerzan victoria/derrota.
- Las cuatro arenas nuevas aparecen en el selector y tienen labels bilingues.
- Las cuatro arenas nuevas dibujan detalles distintivos.
- README refleja animaciones de cierre y nuevas arenas.
- Validacion automatica completa pasa.

## Commit Y Push

- Commit sugerido: `Add finish poses and arenas`.
- Push solo si el usuario lo solicita explicitamente.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada: `41 passed`, `0 failed`.
- Pendiente de commit/push al momento de esta actualizacion.
