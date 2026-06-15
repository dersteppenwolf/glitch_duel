# Exec Plan: Bloqueo Teclado

Estado: Cerrado en commit pendiente `Improve block keyboard layout`.

## Objetivo

Mejorar la distribucion de teclado para bloqueo agregando `I` como tecla alternativa de bloqueo, manteniendo `S` como control existente.

Cambio esperado para el jugador:

- Puede bloquear con `S` como antes.
- Puede bloquear con `I`, cerca de los ataques `J`, `K` y `L`, sin mover la mano izquierda de movimiento.

Queda fuera del alcance:

- Quitar `S`.
- Cambiar controles tactiles.
- Cambiar bloqueo, dano residual, energia, IA, hitboxes o balance.

## Contexto Actual

- `src/fighter.js` activa bloqueo con `keys.s` o `keys.block`.
- `src/game.js` normaliza teclas con `e.key.toLowerCase()`.
- `src/index.html`, `Readme.md` y `AGENTS.md` documentan `S` como bloqueo.
- `tests/game.test.js` cubre precedencia de bloqueo sobre agacharse.

## Diseño Propuesto

- Cambiar la condicion de bloqueo a `keys.s || keys.i || keys.block`.
- Actualizar textos visibles para mostrar `S / I` como bloqueo.
- Actualizar resumen de pausa y smoke test para incluir `I`.
- Agregar prueba unitaria que confirme que `I` bloquea.

## Archivos A Modificar

- `src/fighter.js`: aceptar `I` como bloqueo.
- `src/game.js`: actualizar resumen de controles en pausa.
- `src/index.html`: actualizar controles del menu y ayuda.
- `tests/game.test.js`: agregar prueba de bloqueo con `I`.
- `Readme.md`: actualizar controles y smoke test.
- `AGENTS.md`: actualizar smoke test persistente.
- `plans/plan_0008_bloqueo_teclado.md`: registrar resultado.

## Plan De Implementacion

1. Agregar `keys.i` a la condicion de bloqueo.
2. Actualizar UI y documentacion para `S / I`.
3. Agregar prueba focalizada.
4. Ejecutar validacion completa.

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

Smoke manual:

- Iniciar partida.
- Confirmar que `S` bloquea.
- Confirmar que `I` bloquea.
- Confirmar que `C` y flecha abajo siguen agachando.
- Confirmar que `J`, `K` y `L` siguen atacando.

## Documentacion

- `Readme.md`: controles, smoke test y funcionalidades.
- `AGENTS.md`: checklist manual persistente.

## Riesgos Y Mitigaciones

- Riesgo: conflicto con ataques `J/K/L`. Mitigacion: `I` no se usa actualmente y queda separado de `J/K/L`.
- Riesgo: romper usuarios que ya usan `S`. Mitigacion: mantener `S` como bloqueo.
- Riesgo: documentacion incompleta. Mitigacion: actualizar UI, README y AGENTS.

## Validacion Del Plan Con Skill

Revision con `karpathy-guidelines`:

- Simplicidad: una tecla alternativa, sin remapeo configurable.
- Cambios quirurgicos: control, textos y prueba.
- Suposicion explicita: `S` se mantiene por comportamiento existente.
- Verificabilidad: prueba unitaria y smoke manual claro.
- Sin dependencias externas.

## Criterios De Aceptacion

- `S` sigue bloqueando.
- `I` bloquea.
- Bloqueo sigue teniendo precedencia sobre agacharse.
- README, ayuda y pausa mencionan `S / I`.
- Validacion automatica completa pasa.

## Commit Y Push

Commit recomendado: `Improve block keyboard layout`.

Hacer push solo si el usuario lo pide.

## Resultado

- Agregada tecla `I` como alternativa para bloqueo junto a `S`.
- Actualizados menu, ayuda y resumen de pausa para mostrar `S / I`.
- Actualizados `Readme.md` y `AGENTS.md` con el nuevo control.
- Agregada prueba unitaria que confirma que `I` bloquea.
