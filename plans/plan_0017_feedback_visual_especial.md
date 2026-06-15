# Exec Plan: Feedback Visual Especial

## Objetivo

Hacer que el ataque especial se sienta mas espectacular con flash, rastro y texto `SPECIAL!`.

La experiencia cambia en que gastar la barra completa tiene una respuesta visual clara aunque el golpe no conecte. Queda fuera del alcance cambiar dano, cooldown, energia requerida, hitboxes, audio o reglas del especial.

## Contexto Actual

- `Fighter.attack('special', ...)` consume energia y usa la animacion `special`.
- `fighter_render.js` ya dibuja un aro pequeno alrededor del puno especial.
- `game.js` ya tiene overlays temporales como `impactFlash` y textos flotantes.
- `reducedMotionEnabled` reduce efectos intensos.

## Diseño Propuesto

- Agregar `specialFlash` global similar a `impactFlash`.
- Agregar `triggerSpecialFeedback(fighter)` en `game.js`.
- Llamar `triggerSpecialFeedback(this)` desde `Fighter.attack(...)` cuando el tipo sea `special` y la energia ya haya sido consumida.
- Dibujar `drawSpecialFlash()` con pantalla tintada, rastro horizontal y texto flotante `SPECIAL!`.
- En `Reducir movimiento`, usar menor duracion y sin flash de pantalla completo.
- No alterar dano, cooldown, energia, hitbox ni sonidos existentes.

## Archivos A Modificar

- `src/game.js`: estado/render del flash especial.
- `src/fighter.js`: disparar feedback al usar especial.
- `tests/game.test.js`: cubrir que el especial crea flash y texto.
- `Readme.md`: actualizar backlog y funcionalidades.
- `plans/plan_0017_feedback_visual_especial.md`: este plan.

## Plan De Implementacion

1. Agregar `specialFlash` y reset en inicio/menu.
2. Agregar `triggerSpecialFeedback(...)` y `drawSpecialFlash()`.
3. Llamar feedback desde `Fighter.attack('special')`.
4. Exponer estado en tests y cubrir especial.
5. Actualizar README y ejecutar validacion completa.
6. Hacer commit de esta actividad.

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

## Documentacion

- `Readme.md`: marcar especial visual fuerte como completado y actualizar siguiente recomendacion.

## Riesgos Y Mitigaciones

- Riesgo: exceso visual. Mitigacion: respetar `Reducir movimiento` con duracion menor y sin flash completo.
- Riesgo: cambiar balance accidentalmente. Mitigacion: no tocar `ATTACKS`, energia ni hitboxes.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- Cambio visual acotado.
- No agrega dependencias ni reglas nuevas.
- Validacion testeable por estado y textos flotantes.

## Criterios De Aceptacion

- Usar especial crea flash/rastro y texto `SPECIAL!`.
- Dano, energia y cooldown no cambian.
- `Reducir movimiento` reduce intensidad.
- Validacion automatica pasa.

## Commit Y Push

- Commit requerido al terminar esta actividad.
- Commit sugerido: `Improve special attack feedback`.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada: `50 passed`, `0 failed`.
- Pendiente de commit al momento de esta actualizacion.
