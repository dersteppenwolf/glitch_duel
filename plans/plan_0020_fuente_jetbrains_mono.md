# Exec Plan: Fuente JetBrains Mono

## Objetivo

Sustituir la tipografia visible del juego por una pila basada en `JetBrains Mono`.

La experiencia cambia en que menus, botones, overlays, HUD dibujado en canvas, textos flotantes, etiquetas de personajes y detalles decorativos de arenas adoptan una apariencia monoespaciada mas tecnica. Queda fuera del alcance agregar dependencias externas, cargar fuentes desde CDN, incluir archivos `.woff2` nuevos o cambiar layout, reglas de combate, controles, estados, i18n o persistencia.

## Contexto Actual

- `src/styles.css` define `Comic Sans MS` para `body`, botones, pausa y selects.
- `src/game.js` usa `ctx.font` con `"Comic Sans MS"` para HUD, arenas, mensajes de estado e intro VS.
- `src/fighter_render.js` usa `ctx.font` con `"Comic Sans MS"` para etiquetas, combos, especial listo y poses.
- `src/effects.js` usa `ctx.font` con `"Comic Sans MS"` para textos flotantes.
- `src/config.js` carga antes de `effects.js`, `fighter_render.js` y `game.js`, por lo que puede alojar una constante global reutilizable para fuentes de canvas.
- El proyecto no tiene `package.json`, build step ni gestion de assets de fuentes.

Suposicion explicita: `JetBrains Mono` se usara como primera opcion de una pila local. Si no esta instalada en el sistema del jugador, el navegador usara fallbacks monoespaciados como `Cascadia Mono`, `Consolas` y `monospace`. Garantizar la fuente mediante archivos embebidos queda fuera de este plan salvo decision posterior.

## Diseño Propuesto

- Agregar en `src/config.js` una constante global, por ejemplo `GAME_FONT_FAMILY = '"JetBrains Mono", "Cascadia Mono", Consolas, monospace'`.
- Reemplazar en `src/styles.css` las declaraciones `font-family` actuales por la misma pila tipografica.
- Reemplazar en canvas los literales `"Comic Sans MS"` por interpolaciones con `GAME_FONT_FAMILY`, manteniendo pesos y tamanos existentes.
- No modificar dimensiones, posiciones ni colores inicialmente; solo revisar si algun texto queda demasiado ancho por la fuente monoespaciada.
- No agregar `@import`, Google Fonts, npm, bundler ni assets nuevos.
- Mantener compatibilidad con las coordenadas logicas `1000x500`; el cambio es solo de render tipografico.

## Archivos A Modificar

- `src/config.js`: agregar constante global de familia tipografica.
- `src/styles.css`: aplicar la pila `JetBrains Mono` a UI HTML.
- `src/effects.js`: usar la constante en textos flotantes de canvas.
- `src/fighter_render.js`: usar la constante en textos de luchadores.
- `src/game.js`: usar la constante en HUD, overlays y decoracion de arenas.
- `Readme.md`: documentar el cambio visual si se considera parte de funcionalidades/estilo.

## Plan De Implementacion

1. Agregar `GAME_FONT_FAMILY` en `src/config.js` junto a constantes visuales existentes.
2. Actualizar `src/styles.css` para que `body`, botones, pausa y selects usen `"JetBrains Mono", "Cascadia Mono", Consolas, monospace`.
3. Actualizar `ctx.font` en `src/effects.js`, `src/fighter_render.js` y `src/game.js` para usar `GAME_FONT_FAMILY` sin cambiar tamanos ni pesos.
4. Buscar referencias activas a `Comic Sans MS` y confirmar que no queden en `src/`.
5. Ejecutar validacion automatica completa.
6. Hacer smoke visual rapido en navegador o, si no se abre navegador en esta sesion, dejar registrado que la validacion visual queda pendiente.
7. Actualizar este plan con resultado de validacion y commit.

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

Busqueda esperada despues del cambio:

```powershell
rg "Comic Sans MS" src
```

Checklist manual:

- El menu inicial conserva layout balanceado en desktop y mobile.
- El selector de idioma, dificultad y arena mantiene texto legible.
- Intro VS, mensajes de estado, HUD, textos flotantes y pantalla final no se cortan visualmente.
- Canvas sigue proporcional tras resize.
- La fuente aparece como `JetBrains Mono` cuando esta instalada; si no, cae a fuente monoespaciada local.

## Documentacion

- `Readme.md`: mencionar la tipografia `JetBrains Mono` en la descripcion visual si se implementa.
- `AGENTS.md`: no requiere cambio, salvo que se decida agregar assets de fuente o una nueva instruccion persistente.
- `PLANS.md`: no requiere cambio.

## Riesgos Y Mitigaciones

- Riesgo: `JetBrains Mono` no esta instalada en el equipo del jugador. Mitigacion: usar pila local con fallbacks monoespaciados y no depender de red.
- Riesgo: la fuente monoespaciada cambia anchos y puede cortar textos en canvas. Mitigacion: mantener tamanos primero, ejecutar smoke visual y ajustar solo textos que se corten.
- Riesgo: duplicar el literal de la pila tipografica entre CSS y canvas. Mitigacion: centralizar canvas en `GAME_FONT_FAMILY`; en CSS mantener una unica pila repetida solo donde ya existe `font-family` explicito.
- Riesgo: sobrealcance al introducir assets o CDN. Mitigacion: excluirlo explicitamente de esta fase.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El cambio es visual y quirurgico.
- No introduce dependencias externas ni pipeline nuevo.
- Las suposiciones sobre disponibilidad de la fuente estan explicitas.
- Los criterios de aceptacion son verificables por busqueda, tests y smoke visual.
- Se evita redisenar layout o refactorizar codigo no relacionado.

## Criterios De Aceptacion

- `src/styles.css` usa `JetBrains Mono` como primera opcion tipografica.
- Los textos de canvas usan una constante compartida con `JetBrains Mono` como primera opcion.
- No quedan referencias activas a `Comic Sans MS` en `src/`.
- La validacion automatica completa pasa.
- El smoke visual no muestra textos criticos cortados en menu, HUD, intro VS ni game over.

## Commit Y Push

- Commit requerido al terminar la implementacion.
- Commit sugerido: `Use JetBrains Mono font`.
- No hacer push salvo pedido explicito del usuario.

## Estado De Ejecucion

- Plan creado.
- Implementacion completada: `GAME_FONT_FAMILY` agregado, UI HTML y textos de canvas migrados a `JetBrains Mono` con fallbacks locales.
- Documentacion completada: `Readme.md` menciona la tipografia monoespaciada.
- Validacion automatica completada: `git diff --check`, `node --check` para scripts de `src` y `node --test tests\game.test.js` pasaron.
- Busqueda completada: no quedan referencias activas a `Comic Sans MS` en `src/`.
- Smoke visual manual pendiente: no se abrio navegador en esta sesion.
- Commit solicitado por el usuario al cierre de la implementacion.
