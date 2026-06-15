# Exec Plan: Visualizacion Movil

## Objetivo

Mejorar la visualizacion de `GLITCH DUEL` en dispositivos moviles, priorizando que el combate sea legible y jugable en pantallas pequenas sin romper la experiencia de escritorio.

La experiencia cambia en que el canvas aprovecha mejor el area visible, los controles tactiles estorban menos la arena, los overlays no se cortan en telefonos y el modo vertical ofrece una experiencia degradada pero usable. Queda fuera del alcance cambiar reglas de combate, hitboxes, IA, balance, assets, dependencias, build tooling o rehacer la UI completa.

## Contexto Actual

- `src/index.html` define viewport fijo sin zoom, canvas `1000x500`, overlays, boton de pausa, aviso de orientacion y controles tactiles.
- `src/styles.css` usa `100vw/100vh`, `overflow: hidden`, canvas con ancho CSS `min(calc(100vw - 24px), 1000px)`, controles tactiles absolutos en la parte inferior y media query principal en `max-width: 760px`.
- `src/game.js` contiene `resizeCanvas()`, que calcula el canvas con `window.innerWidth - 24` y `window.innerHeight * 0.72`, preservando el espacio logico `1000x500` y ajustando backing store por DPR.
- `src/game.js` muestra `#orientation-warning` solo en telefonos tactiles en vertical durante `playing`.
- `src/game.js` muestra controles tactiles solo si `mobileControlsEnabled && gameState === 'playing'`.
- `tests/game.test.js` ya cubre resize responsive, backing store DPR y aviso de orientacion.
- `Readme.md` documenta controles tactiles, canvas proporcional, safe areas y smoke visual movil basico.

Suposiciones explicitas:

- El objetivo principal es mejorar layout y legibilidad, no crear controles nuevos.
- La orientacion horizontal sigue siendo la recomendada para jugar, pero portrait no debe sentirse roto.
- El espacio logico de simulacion `1000x500` no cambia; solo cambia su presentacion CSS/backing store.
- No se agregan dependencias ni deteccion compleja de dispositivos.

## Diseño Propuesto

- Introducir una funcion pequena para obtener dimensiones de viewport (`getViewportSize()` o logica equivalente dentro de `resizeCanvas()`), usando `window.visualViewport` si existe y cayendo a `window.innerWidth/innerHeight`.
- Ajustar `resizeCanvas()` para reservar espacio real para HUD superior, boton de pausa y controles tactiles cuando `gameState === 'playing'` y hay touch.
- Mantener canvas 2:1, pero calcular `maxDisplayHeight` por modo:
  - Escritorio/no touch: comportamiento similar al actual.
  - Movil horizontal: usar mas alto disponible que el `72vh` actual, reservando solo margen inferior para controles.
  - Movil vertical: reducir la arena para que no quede debajo de controles y mantener el aviso visible.
- Usar variables CSS simples en `#game-container`, por ejemplo `--viewport-height`, `--safe-bottom` o `--controls-height`, solo si simplifican el calculo; evitar un sistema responsive nuevo.
- Reposicionar controles tactiles con CSS para que ocupen menos area visual:
  - Mantener zonas izquierda/derecha.
  - Reducir ligeramente diametros en pantallas estrechas.
  - Aumentar contraste o sombra solo si mejora legibilidad sobre el canvas.
  - Respetar `env(safe-area-inset-bottom)`.
- Ajustar overlays moviles (`.menu-card`, `#game-over`, `#pause-screen`) para usar `max-height` y scroll interno consistente en pantallas bajas.
- Revisar `#instructions`, `#pause-button` y `#orientation-warning` para que no se superpongan en telefonos verticales.
- No cambiar `gameState`; solo llamar `resizeCanvas()` cuando cambie estado visible si hace falta para recalcular dimensiones con controles visibles.
- No alterar coordenadas logicas ni `ctx.setTransform(...)`; el canvas sigue mapeando `1000x500` al tamano CSS calculado.

## Archivos A Modificar

- `src/styles.css`: ajustar breakpoints moviles, controles tactiles, overlays, safe area y elementos superiores.
- `src/game.js`: mejorar calculo de viewport/canvas y recalcular al cambiar estado si corresponde.
- `tests/game.test.js`: actualizar/agregar pruebas de resize para movil horizontal, movil vertical y warning de orientacion.
- `Readme.md`: documentar comportamiento movil mejorado y actualizar smoke visual.
- `AGENTS.md`: ajustar checklist manual movil si cambia el smoke esperado.

## Plan De Implementacion

1. Medir el comportamiento actual con los casos objetivo: escritorio `1000x700`, telefono horizontal aproximado `844x390`, telefono vertical `390x844` y pantalla baja `667x375`.
2. Actualizar `resizeCanvas()` con calculo responsive por viewport real, preservando aspecto 2:1 y limitando DPR con `MAX_DEVICE_PIXEL_RATIO`.
3. Asegurar que los cambios de estado que muestran/ocultan controles tactiles ejecutan `resizeCanvas()` o que `resizeCanvas()` se llama despues de `updateControlsVisibility()` donde sea necesario.
4. Ajustar CSS movil para que controles, pausa, instrucciones y warning no se pisen en `max-width: 760px` y pantallas bajas.
5. Ajustar overlays moviles para evitar cortes de menu, ayuda, pausa y game over en telefonos.
6. Agregar o actualizar pruebas unitarias de `resizeCanvas()` para verificar tamanos esperados en escritorio, movil horizontal y movil vertical con touch.
7. Actualizar documentacion y smoke test movil en `Readme.md` y `AGENTS.md`.
8. Ejecutar validacion automatica completa.
9. Hacer smoke manual en navegador con DevTools responsive o registrar que queda pendiente si no se puede abrir navegador.

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

Casos unitarios recomendados:

- `resizeCanvas()` mantiene aspecto 2:1 y backing store DPR en escritorio.
- En telefono horizontal touch, el canvas usa mas espacio vertical disponible sin exceder el viewport reservado para controles.
- En telefono vertical touch, el canvas no queda oculto por controles y `orientation-warning` aparece durante `playing`.
- Al volver a menu o pausa, controles tactiles se ocultan y el layout recalcula si aplica.

Checklist manual especifico:

- En desktop, el canvas conserva tamano y proporcion similares al estado actual.
- En movil horizontal, HUD, luchadores, controles tactiles y boton de pausa son visibles sin solapamientos criticos.
- En movil vertical, aparece el aviso de orientacion y el juego sigue mostrando arena, HUD y controles sin cortes grandes.
- En telefonos con notch/home indicator, los controles respetan `safe-area-inset-bottom`.
- Menu, ayuda, pausa y game over permiten ver todos los botones en pantallas bajas.
- `Reducir movimiento` y selector de idioma siguen funcionando igual.

## Documentacion

- `Readme.md`: actualizar seccion de UI/UX, smoke visual y solucion de problemas si cambia la recomendacion movil.
- `AGENTS.md`: actualizar smoke test manual para incluir movil horizontal, portrait degradado y overlays en pantallas bajas.
- `PLANS.md`: sin cambios esperados.

## Riesgos Y Mitigaciones

- Riesgo: mejorar portrait puede degradar landscape, que es el modo principal de combate movil. Mitigacion: probar ambos y priorizar landscape si hay conflicto.
- Riesgo: cambios de `resizeCanvas()` pueden romper pruebas DPR o dibujo escalado. Mitigacion: conservar `ctx.setTransform(backingWidth / WIDTH, 0, 0, backingHeight / HEIGHT, 0, 0)` y cubrirlo con tests.
- Riesgo: controles tactiles pueden quedar demasiado pequenos. Mitigacion: mantener tamano minimo tactil cercano a 48px y validar en viewport estrecho.
- Riesgo: overlays con scroll pueden afectar foco o accesibilidad. Mitigacion: no cambiar roles/ARIA y mantener `focus-visible` existente.
- Riesgo: usar `visualViewport` puede no existir en mocks o navegadores antiguos. Mitigacion: fallback directo a `window.innerWidth/innerHeight`.
- Riesgo: recalcular canvas al cambiar estado puede introducir saltos visuales. Mitigacion: limitar recalculo a transiciones donde aparecen/desaparecen controles y mantener el canvas centrado.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El plan evita sobrealcance: no propone nuevos controles, gameplay, assets ni dependencias.
- Los cambios son quirurgicos: `styles.css`, `game.js`, pruebas y documentacion.
- Las suposiciones importantes estan explicitas, especialmente mantener `1000x500` como espacio logico.
- Los criterios de aceptacion son comprobables con pruebas unitarias y smoke manual movil.
- La propuesta prioriza casos concretos de viewport en vez de una reescritura responsive general.

## Criterios De Aceptacion

- El canvas mantiene proporcion 2:1 y coordenadas logicas `1000x500` en todos los modos.
- Desktop conserva una visualizacion equivalente a la actual.
- Movil horizontal muestra arena, HUD, pausa y controles sin solapamientos criticos.
- Movil vertical muestra warning de orientacion y una vista usable, no un layout cortado.
- Overlays de menu, ayuda, pausa y game over son navegables en pantallas bajas.
- Controles tactiles mantienen tamano minimo usable y respetan safe area inferior.
- Las pruebas unitarias pasan y cubren al menos un caso movil horizontal y uno vertical.
- `Readme.md` y `AGENTS.md` reflejan el nuevo smoke test movil.

## Commit Y Push

- Commit sugerido: `Improve mobile layout`.
- Hacer commit solo si el usuario lo pide explicitamente.
- No hacer push salvo pedido explicito del usuario.

## Estado De Ejecucion

- Plan cerrado.
- Implementacion completada en `src/game.js`, `src/styles.css`, `tests/game.test.js`, `Readme.md` y `AGENTS.md`.
- Validacion automatica completada:
  - `git diff --check`
  - `node --check src\i18n.js`
  - `node --check src\config.js`
  - `node --check src\audio.js`
  - `node --check src\effects.js`
  - `node --check src\ai.js`
  - `node --check src\fighter_render.js`
  - `node --check src\fighter.js`
  - `node --check src\game.js`
  - `node --test tests\game.test.js` (`55` tests passing)
- Smoke movil simulado completado con Chrome headless via DevTools Protocol:
  - movil horizontal `844x390`: canvas dentro del viewport, controles tactiles visibles, pausa visible, sin warning de orientacion, sin solape pausa/instrucciones.
  - movil vertical `390x844`: canvas dentro del viewport, controles tactiles visibles, pausa visible, warning de orientacion visible, menu con scroll interno.
  - landscape bajo `667x375`: canvas dentro del viewport, controles tactiles visibles, pausa visible, menu con scroll interno.
- Smoke manual visual en navegador/DevTools responsive sigue recomendado antes de publicar, especialmente para confirmar sensacion tactil real y safe areas fisicas.
