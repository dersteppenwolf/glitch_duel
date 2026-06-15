# Exec Plan: Identidad Glitch Duel

## Objetivo

Renombrar la identidad visible del juego de `xkcd KOMBAT` a `GLITCH DUEL` y reemplazar las referencias activas a `xkcd` por una marca propia de duelo arcade line-art contra la maquina.

La experiencia cambia en que menu, titulo del navegador, etiquetas ARIA, README, textos i18n y decoracion de arena dejan de depender de `xkcd` y pasan a comunicar una identidad tecnica, minimalista y arcade. Queda fuera del alcance redisenar gameplay, controles, IA, arenas, hitboxes, layout profundo, pipeline de deploy, dominio publico o repositorio remoto. Si el repositorio se renombra despues, la URL de GitHub Pages se ajustara en un cambio separado.

## Contexto Actual

- `src/index.html` contiene `xkcd KOMBAT` en `<title>`, instrucciones iniciales, `aria-label` del canvas y titulo principal del menu.
- `src/i18n.js` contiene strings visibles en espanol e ingles con `xkcd KOMBAT`, ademas de `LANGUAGE_STORAGE_KEY = 'xkcdKombatLanguage'`.
- `src/game.js` usa claves `xkcdKombatReducedMotion` y `xkcdKombatStats` para persistencia, y dibuja el texto decorativo `xkcd theorem: stickmen win` en la arena de matematicas.
- `Readme.md` describe el juego como `xkcd KOMBAT` y `estilo stickman/xkcd`, y documenta claves de persistencia con prefijo `xkcdKombat`.
- `PLANS.md` define el estandar de planes para `xkcd KOMBAT`.
- `AGENTS.md` menciona el proyecto y smoke test, pero no requiere cambio de arquitectura.
- `tests/game.test.js` valida las claves actuales de localStorage y algunos textos renderizados.
- Los planes historicos en `plans/plan_0001_*` a `plans/plan_0020_*` pueden conservar referencias antiguas porque son registros historicos, no UI activa.

Suposicion explicita: el nuevo nombre de producto sera `GLITCH DUEL`, con subtitulo en espanol `Duelo arcade de trazos contra la maquina` y en ingles `Line-art arcade fighter vs the machine` cuando aplique. No se agregan assets, logos, dependencias, fuentes externas ni nuevas pantallas.

## Diseño Propuesto

- Cambiar la marca visible principal a `GLITCH DUEL`.
- Cambiar descripciones de `stickman/xkcd` a `line-art arcade`, manteniendo el foco en humano contra CPU, bugs, combos y arenas tecnicas.
- Reemplazar el texto decorativo `xkcd theorem: stickmen win` por un chiste propio, por ejemplo `bug theorem: hit first` o `undefined behavior wins`.
- Mantener `gameState` sin cambios; el rebrand no altera estados `menu`, `playing`, `paused`, `roundOver` ni `gameOver`.
- Mantener coordenadas logicas `1000x500`; solo cambia texto dibujado dentro del canvas.
- Cambiar claves activas de persistencia a nombres propios de la nueva marca:
  - `glitchDuelLanguage`
  - `glitchDuelReducedMotion`
  - `glitchDuelStats`
- Agregar migracion quirurgica desde claves legacy `xkcdKombatLanguage`, `xkcdKombatReducedMotion` y `xkcdKombatStats`: al leer preferencias, intentar primero la clave nueva y luego la legacy; al guardar, escribir solo la clave nueva.
- No eliminar datos legacy del navegador para evitar comportamiento destructivo; la nueva clave gana prioridad si existe.
- Conservar `K.O.`, `ROUND`, `FIGHT!`, `CPU`, combos y textos de gameplay sin cambios salvo donde dependan de la marca anterior.

## Archivos A Modificar

- `src/index.html`: cambiar titulo, textos fallback visibles, `aria-label` del canvas y titulo principal.
- `src/i18n.js`: actualizar strings de marca en espanol/ingles y cambiar clave de idioma con lectura legacy.
- `src/game.js`: cambiar claves de reduccion de movimiento/estadisticas con lectura legacy y reemplazar texto decorativo `xkcd`.
- `tests/game.test.js`: actualizar expectativas de claves nuevas y agregar/ajustar pruebas de migracion legacy.
- `Readme.md`: actualizar nombre, descripcion, URL solo si sigue siendo correcta, claves de persistencia y referencias de identidad.
- `PLANS.md`: actualizar nombre del proyecto en el estandar de planificacion.
- `AGENTS.md`: actualizar nombre del proyecto y smoke test si menciona la marca antigua.

## Plan De Implementacion

1. Reemplazar textos visibles de marca en `src/index.html` por `GLITCH DUEL` y el nuevo subtitulo donde aplique.
2. Actualizar `src/i18n.js` para `instructions`, `canvasLabel`, `menuIntro` y cualquier texto activo que dependa de `xkcd` o `stickman/xkcd`.
3. Cambiar `LANGUAGE_STORAGE_KEY` a `glitchDuelLanguage` y agregar una constante legacy `LEGACY_LANGUAGE_STORAGE_KEY = 'xkcdKombatLanguage'` para lectura de preferencias antiguas.
4. En `src/game.js`, cambiar reduccion de movimiento y estadisticas a `glitchDuelReducedMotion` y `glitchDuelStats`, manteniendo lectura fallback desde las claves legacy.
5. Reemplazar el texto decorativo `xkcd theorem: stickmen win` por un texto propio de la nueva identidad.
6. Actualizar `tests/game.test.js` para validar que las preferencias se guardan con claves nuevas y que valores legacy todavia se leen cuando no existe clave nueva.
7. Actualizar `Readme.md`, `PLANS.md` y `AGENTS.md` para reflejar `GLITCH DUEL` sin cambiar instrucciones de ejecucion ni deploy.
8. Buscar referencias activas a `xkcd`, `xkcd KOMBAT`, `xkcdKombat` y `stickman/xkcd`; dejar solo referencias historicas en planes antiguos o menciones de claves legacy necesarias.
9. Ejecutar validacion automatica completa.
10. Hacer smoke visual rapido en navegador o dejar registrado que queda pendiente si no se abre navegador en la sesion.

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
node --check src\game.js
node --test tests\game.test.js
```

Busquedas esperadas despues del cambio:

```powershell
rg "xkcd KOMBAT|stickman/xkcd" src Readme.md PLANS.md AGENTS.md
rg "xkcdKombat" src tests Readme.md AGENTS.md PLANS.md
```

Resultado esperado de busquedas:

- No deben quedar referencias visibles activas a `xkcd KOMBAT` ni `stickman/xkcd`.
- `xkcdKombat*` solo puede quedar como constante legacy, prueba de migracion o documentacion de migracion.
- Los planes historicos pueden conservar referencias antiguas fuera del alcance de busqueda activa.

Checklist manual:

- El navegador muestra `GLITCH DUEL` en el titulo.
- El menu inicial muestra `GLITCH DUEL` y el texto introductorio propio.
- El canvas conserva layout, HUD, intro VS y game over sin textos cortados.
- La arena de matematicas ya no dibuja `xkcd theorem`.
- Cambiar idioma persiste con `glitchDuelLanguage` y respeta una preferencia legacy si solo existe `xkcdKombatLanguage`.
- Activar `Reducir movimiento` persiste con `glitchDuelReducedMotion` y respeta una preferencia legacy si solo existe `xkcdKombatReducedMotion`.
- Estadisticas existentes se cargan desde `xkcdKombatStats` si aun no existe `glitchDuelStats`, y nuevas partidas guardan en `glitchDuelStats`.

## Documentacion

- `Readme.md`: actualizar nombre, descripcion, identidad visual y claves de persistencia; mantener instrucciones locales y de GitHub Pages salvo que el repositorio se renombre.
- `AGENTS.md`: actualizar nombre del proyecto y smoke test si aparece la marca antigua.
- `PLANS.md`: actualizar el nombre del proyecto en la descripcion del estandar.

## Riesgos Y Mitigaciones

- Riesgo: perder idioma, reducir movimiento o estadisticas de jugadores existentes al cambiar claves de `localStorage`. Mitigacion: leer primero claves nuevas y luego claves legacy, y guardar solo en claves nuevas.
- Riesgo: referencias antiguas quedan mezcladas en UI activa. Mitigacion: buscar `xkcd`, `xkcd KOMBAT`, `stickman/xkcd` y revisar manualmente resultados.
- Riesgo: cambiar URL del README a una ruta que no existe si el repositorio remoto no se renombra. Mitigacion: no cambiar URL publica ni repo remoto en esta fase salvo confirmacion externa.
- Riesgo: sobrealcance visual al intentar crear logo o redisenar layout. Mitigacion: limitarse a textos, identidad escrita y un texto decorativo de canvas.
- Riesgo: tests de persistencia quedan acoplados a claves antiguas. Mitigacion: actualizar expectativas a claves nuevas y agregar cobertura de lectura legacy.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El plan usa un nombre concreto (`GLITCH DUEL`) y evita decidir silenciosamente sobre URL/repositorio remoto.
- La solucion es quirurgica: textos, documentacion y claves de persistencia con migracion minima.
- Las suposiciones importantes estan explicitas, especialmente que no se agregan assets ni dependencias.
- Los criterios de aceptacion son comprobables por busqueda, tests y smoke visual.
- No se introducen dependencias externas ni cambios de gameplay.

## Criterios De Aceptacion

- `src/index.html` y `src/i18n.js` muestran `GLITCH DUEL` como marca principal.
- `Readme.md`, `PLANS.md` y `AGENTS.md` ya no describen el proyecto como `xkcd KOMBAT`.
- No quedan referencias visibles activas a `xkcd KOMBAT` ni `stickman/xkcd` en `src/` o documentacion principal.
- Las claves nuevas `glitchDuelLanguage`, `glitchDuelReducedMotion` y `glitchDuelStats` se usan al guardar preferencias/estadisticas.
- Las claves legacy `xkcdKombatLanguage`, `xkcdKombatReducedMotion` y `xkcdKombatStats` todavia se leen como fallback cuando no existe clave nueva.
- La validacion automatica completa pasa.
- El smoke visual no muestra textos criticos cortados en menu, HUD, intro VS ni game over.

## Commit Y Push

- Commit sugerido: `Rebrand game as Glitch Duel`.
- Hacer commit solo si el usuario lo pide explicitamente.
- No hacer push salvo pedido explicito del usuario.

## Estado De Ejecucion

- Plan creado.
- Implementacion pendiente.
- Validacion automatica pendiente.
- Smoke visual pendiente.
- Commit pendiente de pedido explicito.
