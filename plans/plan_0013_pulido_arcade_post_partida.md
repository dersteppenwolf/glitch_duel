# Exec Plan: Pulido Arcade Post Partida

## Objetivo

Implementar tres mejoras arcade: medallas post-partida, mensajes de round con estilo comic y sonidos de UI para menu/pausa/selectores.

La experiencia cambia en que el cierre de partida tiene una recompensa visual, los mensajes `ROUND`, `FIGHT!`, `TIME!` y `K.O.` se leen con mas fuerza y la interfaz responde con audio. Queda fuera del alcance cambiar balance, hitboxes, IA, controles, persistencia o agregar assets externos.

## Contexto Actual

- `src/game.js` centraliza flujo de pantallas, `renderGameOverText()`, `showStatusMessage(...)`, `drawStatusMessage()` y eventos de UI.
- `src/audio.js` genera sonidos con Web Audio y ya tiene perfiles de ataque/impacto.
- `src/fighter.js` conoce combos, especiales y bloqueos; puede notificar metricas simples sin cambiar reglas.
- `src/styles.css` define `#game-over` y `#winner-text`.
- `tests/game.test.js` ya mockea audio, DOM/canvas y expone estado interno.

## Diseño Propuesto

- Agregar `matchStats` por partida con contadores simples: combos del jugador, bloqueos del jugador y especiales usados por el jugador.
- Calcular una medalla al terminar partida con prioridad clara:
  - `Combo Goblin`: si el jugador gana y ejecuto combos.
  - `Firewall Humano`: si el jugador gana y bloqueo varias veces.
  - `404 Survivor`: si el jugador gana con baja vida.
  - `Bug Exterminator`: victoria de jugador por defecto.
  - `Machine Approved`: derrota de jugador.
- Mostrar la medalla en `winner-text` como bloque HTML adicional, sin crear nuevos nodos obligatorios.
- Cambiar `drawStatusMessage()` para dibujar una placa/panel estilo comic con fondo blanco, sombra negra, borde grueso y acento segun tipo de mensaje.
- Agregar `playUISound(type)` en `src/audio.js` con perfiles nativos: `select`, `start`, `pause`, `resume`, `menu`.
- Llamar sonidos UI desde handlers existentes de botones/selectores; mantener Web Audio lazy tras interaccion.
- Agregar pruebas para medallas, estilo comic y sonidos UI.

## Archivos A Modificar

- `src/audio.js`: perfiles y funcion `playUISound(...)`.
- `src/game.js`: metricas de partida, medallas, render de status comic y sonidos UI en eventos.
- `src/fighter.js`: registrar combos, bloqueos y especiales del jugador.
- `src/styles.css`: estilo de medalla dentro de game over.
- `tests/game.test.js`: exponer API/estado y cubrir medallas/sonidos/status.
- `Readme.md`: documentar funcionalidades y retirar sugerencias completadas.

## Plan De Implementacion

1. Agregar sonidos UI en `audio.js` y pruebas de perfiles.
2. Agregar `matchStats`, helpers de registro y seleccion de medalla en `game.js`.
3. Notificar metricas desde `fighter.js` en combos, especial y bloqueos del jugador.
4. Actualizar `renderGameOverText()` para incluir medalla post-partida.
5. Rediseñar `drawStatusMessage()` como panel comic y mantener texto traducido existente.
6. Conectar sonidos UI en eventos de menu, ayuda, pausa, resume, selectores, restart y menu.
7. Actualizar estilos, README y tests.
8. Ejecutar validacion completa.

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

- Iniciar, pausar, reanudar, cambiar selector y volver a menu para confirmar sonidos UI.
- Ganar partida con combo y confirmar medalla `Combo Goblin`.
- Ganar con baja vida y confirmar `404 Survivor` cuando no aplique combo/bloqueo.
- Confirmar mensajes `ROUND`, `TIME!`, `K.O.` y bloqueo con panel comic.
- Confirmar que controles, dano, rondas y timer no cambian.

## Documentacion

- `Readme.md`: actualizar Visual/Audio, pruebas y backlog/sugerencias.
- `AGENTS.md`: no requiere cambios; no cambian comandos ni arquitectura.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: las medallas parecen telemetria compleja. Mitigacion: usar solo contadores simples en memoria por partida.
- Riesgo: sonidos UI disparan audio sin interaccion. Mitigacion: solo llamarlos desde handlers de eventos de usuario.
- Riesgo: panel comic tapa demasiado combate. Mitigacion: usar el mismo centro/tiempo actual y no cambiar estados.
- Riesgo: tests fragiles por HTML. Mitigacion: validar texto/fragmentos, no layout exacto.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El alcance es visual/audio/UI y no toca reglas de combate.
- La solucion usa helpers pequenos existentes y no introduce dependencias.
- Las metricas son minimas y justificadas por las medallas solicitadas.
- Criterios de aceptacion son verificables con tests y smoke manual.

## Criterios De Aceptacion

- La pantalla final muestra una medalla post-partida.
- Se puede obtener `Bug Exterminator`, `Firewall Humano`, `Combo Goblin` o `404 Survivor` bajo condiciones documentadas.
- Mensajes de estado se dibujan con panel comic.
- Selectores, inicio, pausa, reanudar y volver a menu disparan sonidos UI.
- README refleja las mejoras y limpia sugerencias completadas.
- Validacion automatica completa pasa.

## Commit Y Push

- Commit sugerido: `Add arcade post-match polish`.
- Push solo si el usuario lo solicita explicitamente.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada: `47 passed`, `0 failed`.
- Pendiente de commit/push al momento de esta actualizacion.
