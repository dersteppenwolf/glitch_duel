# Exec Plan: UX Y Accesibilidad

Estado: Implementado localmente, pendiente de commit/push.

## Objetivo

Implementar las mejoras de UX y accesibilidad documentadas en `Readme.md` sin cambiar reglas de combate.

Incluye:

- Navegacion por teclado y foco visible en menus.
- Etiquetas ARIA para controles tactiles e indicadores.
- Pausa mas informativa.
- Ajuste de controles tactiles para pantallas pequenas.
- Opcion persistente de reducir movimiento.

Fuera de alcance:

- Rehacer el diseño visual completo.
- Agregar dependencias o herramientas de auditoria externas.
- Cambiar controles de combate o balance.

## Contexto Actual

- `src/index.html` define overlays, botones, canvas, controles tactiles y pantalla de fin de juego.
- `src/styles.css` define foco hover basico, layout responsive y posiciones absolutas de controles tactiles.
- `src/game.js` maneja pausa, stats, render, shake, hit-stop, particulas y eventos.
- `tests/game.test.js` usa mocks de DOM y puede validar estado de UI generado por JS, pero no parsea HTML real.

## Diseño Propuesto

- Agregar `aria-label`, roles y regiones `aria-live` donde aporten informacion.
- Usar `:focus-visible` para que botones, selects y controles tactiles tengan foco claro.
- Agregar en pausa un resumen con round, marcador, timer, dificultad, arena y controles clave.
- Ajustar controles tactiles con `clamp()`, mejor separacion vertical y safe areas.
- Agregar checkbox `Reducir movimiento` en menu, persistido en `localStorage`, que reduce shake, hit-stop y cantidad de particulas.

## Archivos A Modificar

- `src/index.html`: ARIA, checkbox de movimiento reducido y resumen de pausa.
- `src/styles.css`: foco visible, estilos del toggle, resumen de pausa y controles tactiles.
- `src/game.js`: estado persistente de movimiento reducido y resumen de pausa.
- `tests/game.test.js`: pruebas de preferencia de movimiento reducido y pausa informativa.
- `Readme.md`: documentar UX/accesibilidad implementada.
- `AGENTS.md`: actualizar smoke test si aplica.

## Plan De Implementacion

1. Actualizar HTML con etiquetas ARIA, control de movimiento reducido y resumen de pausa.
2. Actualizar CSS para foco visible, toggle y controles tactiles mas adaptables.
3. Agregar estado `reducedMotionEnabled` en `game.js`, persistencia y aplicacion a feedback de impactos.
4. Renderizar resumen de pausa al pausar.
5. Agregar pruebas unitarias de preferencia reducida y pausa informativa.
6. Actualizar documentacion.
7. Ejecutar validacion completa.

## Pruebas Y Validacion

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

Smoke test manual:

- Navegar menu con Tab y confirmar foco visible.
- Activar `Reducir movimiento`, iniciar partida y confirmar impactos con menos shake.
- Pausar y confirmar resumen de round, marcador, tiempo, dificultad y arena.
- En emulacion movil, confirmar que botones tactiles no se solapan.

## Documentacion

- `Readme.md`: marcar mejoras UX/accesibilidad como implementadas y actualizar smoke test.
- `AGENTS.md`: agregar chequeo manual de foco, pausa informativa y reducir movimiento.

## Riesgos Y Mitigaciones

- Riesgo: cambiar feedback de impacto puede afectar pruebas. Mitigacion: mantener comportamiento por defecto y probar solo con preferencia activada.
- Riesgo: controles tactiles pueden moverse demasiado. Mitigacion: usar ajustes CSS conservadores con `clamp()` y safe areas.
- Riesgo: ARIA excesivo puede ser ruidoso. Mitigacion: etiquetar solo controles e indicadores utiles.

## Validacion Del Plan Con Skill

- Se aplican `karpathy-guidelines`: cambios pequeños, verificables y sin dependencias.
- No se agregan nuevas mecanicas ni refactors no relacionados.
- Criterios son observables por pruebas y smoke manual.

## Criterios De Aceptacion

- Menus y botones muestran foco visible con teclado.
- Controles tactiles tienen etiquetas accesibles.
- La pausa muestra resumen util de partida.
- `Reducir movimiento` persiste y reduce shake/hit-stop/particulas.
- README y AGENTS reflejan el nuevo smoke test.
- Validacion automatica completa pasa.

## Commit Y Push

- Commit sugerido: `Improve UX accessibility controls`.
- Push solo si el usuario lo pide.

## Resultado

- Implementado foco visible para navegacion por teclado.
- Implementadas etiquetas ARIA y roles en canvas, overlays, indicadores y controles tactiles.
- Implementada pausa informativa con round, marcador, tiempo, dificultad, arena y controles clave.
- Ajustados controles tactiles con medidas adaptables y safe areas.
- Implementada opcion persistente `Reducir movimiento` para limitar shake, hit-stop y particulas.
- Agregadas pruebas unitarias para pausa informativa y reduccion de movimiento.
- Actualizados `Readme.md` y `AGENTS.md`.
