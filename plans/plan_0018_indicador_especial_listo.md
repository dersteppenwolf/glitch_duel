# Exec Plan: Indicador Especial Listo

## Objetivo

Mostrar sobre el personaje un indicador cuando su energia esta llena y puede usar el especial.

La experiencia cambia en que el jugador no depende solo del HUD para notar que `L` esta disponible. Queda fuera del alcance cambiar energia, costo, dano, cooldown, hitboxes o controles.

## Contexto Actual

- `Fighter.energy` llega hasta `MAX_ENERGY`.
- El HUD ya muestra `SPECIAL` en la barra de energia llena.
- `fighter_render.js` dibuja al luchador y tiene acceso a `fighter.energy`.
- `i18n.js` ya centraliza textos de UI.

## Diseño Propuesto

- Agregar clave `specialReady` en `es`/`en`.
- En `drawFighter(...)`, si `fighter.energy >= MAX_ENERGY` y no esta en `special`, `victory` o `defeat`, dibujar aura compacta y texto traducido sobre el personaje.
- Usar `accentColor` para asociarlo con humano/CPU.
- Mantenerlo render-only.

## Archivos A Modificar

- `src/fighter_render.js`: dibujar indicador.
- `src/i18n.js`: texto traducido.
- `tests/game.test.js`: cubrir indicador.
- `Readme.md`: actualizar backlog y completados.
- `plans/plan_0018_indicador_especial_listo.md`: este plan.

## Plan De Implementacion

1. Agregar texto `specialReady`.
2. Agregar helper de render para indicador listo.
3. Agregar prueba de dibujo.
4. Actualizar README.
5. Ejecutar validacion completa.
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

- `Readme.md`: marcar indicador como completado y actualizar siguiente recomendacion.

## Riesgos Y Mitigaciones

- Riesgo: saturar visualmente el combate. Mitigacion: indicador pequeno y solo cuando energia esta llena.
- Riesgo: mostrarlo durante la animacion especial. Mitigacion: ocultarlo si `state === 'special'`.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- Cambio minimo y render-only.
- Sin dependencias ni gameplay nuevo.
- Criterio verificable por test de canvas text calls.

## Criterios De Aceptacion

- Energia llena muestra indicador sobre personaje.
- El indicador usa texto traducible.
- No aparece durante `special`, `victory` o `defeat`.
- Validacion automatica pasa.

## Commit Y Push

- Commit requerido al terminar esta actividad.
- Commit sugerido: `Add special ready indicator`.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada: `51 passed`, `0 failed`.
- Pendiente de commit al momento de esta actualizacion.
