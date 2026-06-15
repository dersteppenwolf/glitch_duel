# Exec Plan: Interfaz Multidioma

Estado: Cerrado en commit pendiente `Add bilingual interface`.

## Objetivo

Agregar interfaz multidioma inicial en espanol e ingles, con deteccion automatica del idioma del navegador y selector manual persistido.

Cambios esperados para el jugador:

- El juego abre en espanol o ingles segun preferencia guardada o idioma del navegador.
- El menu permite cambiar idioma manualmente.
- La eleccion se guarda en `localStorage`.
- UI principal, ayuda, pausa, HUD y mensajes principales cambian de idioma.

Queda fuera del alcance:

- Traducir textos decorativos de arenas.
- Traducir todos los textos flotantes humoristicos.
- Agregar librerias i18n, build step, modulos ES o backend.
- Cambiar gameplay, controles, IA, hitboxes, balance o persistencia existente.

## Contexto Actual

- `src/index.html` contiene texto estatico de menu, ayuda, controles, pausa y botones.
- `src/game.js` genera textos dinamicos de stats, pausa, HUD, rondas, tiempo, game over y mensajes centrales.
- `src/fighter.js` asigna labels visuales `HUMANO` y `CPU`.
- `src/fighter_render.js` dibuja esos labels sobre los luchadores.
- `src/config.js` contiene labels de arenas.
- `tests/game.test.js` carga scripts clasicos en orden fijo con `vm` y mocks.

## Diseño Propuesto

Crear `src/i18n.js` con:

- `LANGUAGES` para `es` y `en`.
- `DEFAULT_LANGUAGE = 'es'`.
- `LANGUAGE_STORAGE_KEY = 'xkcdKombatLanguage'`.
- `detectBrowserLanguage()` usando `navigator.languages` y `navigator.language`.
- `loadLanguagePreference()` priorizando `localStorage` y luego navegador.
- `setLanguage(value)`, `getLanguage()` y `t(key)`.

Regla de idioma:

1. Si `localStorage` tiene `es` o `en`, usarlo.
2. Si no, si el navegador empieza por `es`, usar `es`.
3. Si empieza por `en`, usar `en`.
4. Si no coincide, usar `es`.

Para HTML estatico, usar atributos `data-i18n` y `data-i18n-aria` y una funcion `renderLanguage()` en `game.js` que actualice textos y atributos.

Para Canvas/dinamico, usar `t(...)` directamente en `game.js` y `fighter_render.js`.

Para arenas y dificultad, mantener valores internos estables y traducir solo labels visibles con helpers.

## Archivos A Modificar

- `src/i18n.js`: nuevo diccionario y helpers.
- `src/index.html`: selector de idioma, atributos `data-i18n`, carga del script.
- `src/config.js`: agregar `labelKey` a arenas.
- `src/fighter.js`: agregar `labelKey` a luchadores.
- `src/fighter_render.js`: resolver label visual con `t(...)`.
- `src/game.js`: render de idioma y textos dinamicos traducibles.
- `tests/game.test.js`: cargar `i18n.js` y cubrir autodeteccion, selector y cambio a ingles.
- `Readme.md`: documentar idiomas, autodeteccion y validacion.
- `AGENTS.md`: actualizar smoke test.
- `plans/plan_0009_interfaz_multidioma.md`: registrar resultado.

## Plan De Implementacion

1. Crear `src/i18n.js` con diccionario ES/EN, autodeteccion, persistencia y `t(...)`.
2. Cargar `i18n.js` antes del resto de scripts.
3. Agregar selector `Idioma / Language` en el menu.
4. Marcar textos HTML principales con `data-i18n` y `data-i18n-aria`.
5. Traducir stats, pausa, HUD, status, game over, labels de arena/dificultad y labels de luchadores.
6. Actualizar pruebas.
7. Actualizar README y AGENTS.
8. Ejecutar validacion completa.

## Pruebas Y Validacion

```powershell
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

Pruebas esperadas:

- Idioma por defecto/detectado se carga sin romper espanol.
- `setLanguage('en')` cambia textos visibles principales.
- La preferencia se guarda en `xkcdKombatLanguage`.
- Pausa y HUD usan labels traducidos.
- Fallback invalido vuelve a `es`.

Smoke manual:

- Abrir el juego con navegador en espanol y confirmar idioma espanol.
- Cambiar a `English` desde menu y confirmar menu, ayuda, pausa, HUD y game over.
- Recargar y confirmar que el idioma elegido persiste.
- Confirmar que controles, combos, pausa, arena y especial siguen funcionando.

## Documentacion

- `Readme.md`: documentar selector, autodeteccion, persistencia y comandos de validacion.
- `AGENTS.md`: agregar idioma al smoke test manual y `node --check src\i18n.js`.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: sobretraducir y tocar demasiados textos. Mitigacion: primer corte solo UI funcional y mensajes principales.
- Riesgo: tests fragiles por textos. Mitigacion: mantener espanol por defecto y agregar pruebas especificas de ingles.
- Riesgo: idioma cambia a mitad de pausa y queda texto viejo. Mitigacion: `renderLanguage()` refresca stats, pausa y controles visibles.
- Riesgo: romper orden de scripts. Mitigacion: cargar `i18n.js` primero y agregar `node --check`.
- Riesgo: labels de personajes no actualizan durante partida. Mitigacion: usar `labelKey` en render.

## Validacion Del Plan Con Skill

Revision con `karpathy-guidelines`:

- Simplicidad: i18n propio pequeno, sin dependencias ni framework.
- Cambios quirurgicos: solo textos, selector, helpers y pruebas; no cambia gameplay.
- Suposiciones explicitas: textos decorativos/humoristicos quedan fuera del primer corte.
- Verificabilidad: pruebas para autodeteccion, cambio a ingles y persistencia.
- Sin dependencias externas.

## Criterios De Aceptacion

- Si no hay preferencia guardada, se detecta `es` o `en` desde navegador.
- El selector permite cambiar entre `Español` y `English`.
- La preferencia se guarda en `xkcdKombatLanguage`.
- Menu, ayuda, pausa, HUD, game over, arenas, dificultad y labels humano/CPU se traducen.
- Espanol sigue siendo fallback.
- Validacion automatica completa pasa.

## Commit Y Push

Commit recomendado: `Add bilingual interface`.

Hacer push solo si el usuario lo pide.

## Resultado

- Creado `src/i18n.js` con diccionario `es`/`en`, autodeteccion de navegador y persistencia en `xkcdKombatLanguage`.
- Agregado selector `Idioma / Language` en el menu principal.
- Traducidos menu, ayuda, controles, pausa, game over, stats, HUD, labels de dificultad, arenas y personajes.
- `L` y `S/I` mantienen explicaciones traducibles en UI principal.
- `Fighter` usa `labelKey` para que los labels del canvas cambien con el idioma.
- Agregadas pruebas para deteccion de idioma, preferencia guardada y cambio manual.
- Actualizados `Readme.md` y `AGENTS.md`.
