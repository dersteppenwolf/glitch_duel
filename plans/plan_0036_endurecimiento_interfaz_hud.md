# Exec Plan: endurecimiento de interfaz y HUD

## Objetivo

Corregir los problemas residuales detectados despues del plan 35 para que el foco no se pierda al iniciar o reiniciar una partida, el HUD conserve una señal util en portrait movil, los badges y el indicador de especial no invadan la banda superior durante saltos y `resizeCanvas()` tenga cobertura real para la toolbar visible.

La experiencia del jugador cambia de forma verificable:

- Al iniciar, entrenar o reiniciar, el foco pasa a una superficie visible de la partida y no queda en un modal oculto.
- En canvas pequeno, la informacion textual redundante se simplifica antes de llegar a tamanos ilegibles; el estado de especial conserva una señal visual clara.
- Badges, `ESPECIAL LISTO` y textos flotantes respetan una zona segura vertical ademas de los margenes laterales.
- El layout landscape movil se prueba con la altura real de `#game-toolbar`, no con un mock de altura cero.
- El foco visible de botones, enlaces y `#duel-settings summary` mantiene contraste sobre papel claro.
- Un cambio de viewport no deja la configuracion del menu en un estado incoherente al cruzar el breakpoint.

Queda fuera del alcance limpiar todo el CSS legado, crear un HUD HTML paralelo para lectores de pantalla, agregar un selector de tema, cambiar controles tactiles o resolver definitivamente pinch zoom sobre el canvas. Tampoco se cambian reglas de combate, posiciones fisicas, hitboxes, coordenadas logicas `1000x500`, IA, balance, dependencias ni assets.

## Contexto Actual

- El plan 35 ya reorganizo el menu, agrego `#arena-shell`/`#game-toolbar`, implemento foco modal/inert/Tab, habilito zoom, agrego `prefers-reduced-motion`, rediseño el HUD con placas y aplico clamps horizontales a feedback visual.
- `src/game.js` llama `closeAllModalDialogs()` al entrar en `startRound()`, pero esa funcion limpia el estado modal sin enfocar una superficie visible de la partida. Esto afecta a inicio, entrenamiento, onboarding final y reinicio.
- `#pause-button` ya es un boton visible y enfocable durante `playing`; puede ser el destino minimo de foco despues de iniciar una ronda sin modificar el canvas ni agregar otra abstraccion.
- `src/hud_render.js` define `HUD_SAFE_BOTTOM = 112`, pero los textos se dibujan en coordenadas logicas fijas. En portrait, el canvas puede reducirse a unos 374 px CSS para representar 1000 unidades, haciendo que fuentes de 12-18 px logicos resulten demasiado pequenas fisicamente.
- `drawEnergyBar()` siempre dibuja el texto `SPECIAL` cuando la energia esta llena. La barra, el color amarillo y el estado del boton pueden conservar la informacion si el texto debe ocultarse en escalas pequenas.
- `src/fighter_render.js` limita el centro horizontal de badges e indicador especial, pero `badgeY` y la placa del indicador no consideran `HUD_SAFE_BOTTOM`. En un salto, el HUD puede cubrirlos porque se dibuja despues de los luchadores.
- `src/effects.js` ya centra y limita `FloatingText` horizontalmente y usa `HUD_SAFE_BOTTOM` como fallback global. La nueva zona segura debe reutilizar esa constante sin introducir un segundo sistema de coordenadas de combate.
- `resizeCanvas()` resta la altura real de `#game-toolbar` cuando la barra esta visible, pero `tests/game.test.js` devuelve siempre `{ height: 0 }` desde `getBoundingClientRect()`; las expectativas actuales no representan landscape con toolbar.
- `syncDuelSettingsLayout()` ajusta `#duel-settings.open` solo durante `load`. Si se cruza `760px` despues de cargar, el estado no se sincroniza; el arreglo debe detectar el cruce sin sobreescribir continuamente una eleccion manual.
- El foco visible global usa `outline: 4px solid #ffcc00`, y el CTA cambia a fondo blanco en `:focus-visible`; sobre papel claro el anillo amarillo puede ser dificil de distinguir. `summary` tampoco esta incluido explicitamente en ese sistema.
- `drawFighterIdentityMarker()` mide el label antes de fijar la fuente de 10 px y limita el centro, pero no impone un ancho maximo del badge. Los cuatro rivales actuales no siempre reproducen el fallo, por lo que hace falta un caso sintetico largo en pruebas.
- `tests/game.test.js` registra nombres de texto y llamadas genericas de Canvas, pero no conserva argumentos de `fillText`/`strokeText` ni una altura configurable de toolbar.
- `BACKLOG.md` mantiene `#25` como `Partial`: este plan no completa preferencias configurables de contraste/color ni crea un HUD semantico paralelo.

Suposiciones explicitas:

- En `playing`, enfocar `#pause-button` despues de `startRound()` es suficiente para devolver contexto al usuario de teclado; no se hace enfocable el canvas ni se agrega otro control.
- La regla de HUD pequeno sera de presentacion: ocultar texto redundante o cambiar una etiqueta por una señal visual, nunca cambiar la simulacion ni las coordenadas logicas.
- `HUD_SAFE_BOTTOM` sera la frontera vertical comun para mensajes que no deben aparecer sobre las placas. La zona de badges puede usar un margen adicional para evitar el borde de la placa.
- El ajuste automatico de `<details>` solo ocurrira cuando cambie el modo desktop/movil; una apertura o cierre manual dentro del mismo modo se respeta.
- El pinch zoom se documentara como validacion pendiente fuera de este plan; no se cambiara `touch-action` porque los controles Pointer Events ya dependen de su comportamiento actual.
- La matriz completa de ocho arenas y cuatro rivales se validara visualmente despues de los cambios, pero no se agregara un nuevo renderer ni una infraestructura de screenshots.

## Diseño Propuesto

### 1. Foco al entrar en la partida

- Extraer o reutilizar un helper pequeno en `src/game.js` para enfocar un elemento solo si esta visible y es enfocable.
- En `startRound()`, despues de `gameState = 'playing'`, `updateControlsVisibility()` y la actualizacion de toolbar, enfocar `#pause-button`. El orden debe evitar enfocar un boton con `display: none`.
- Mantener `openModalDialog()` como responsable de foco de overlays. `closeAllModalDialogs()` seguira limpiando inert y ocultando capas, pero no asumira por si sola un destino de foco de gameplay.
- Cubrir `initGame()`, `startTraining()`, reinicio y el ultimo paso de onboarding. La ruta de menu desde pausa seguira enfocando `#start-button`; reanudar seguira devolviendo foco a `#pause-button`.
- No anunciar una frase adicional solo por mover el foco; el anuncio de ronda existente es suficiente.

### 2. Presentacion del HUD pequeno

- Introducir una funcion de presentacion pequena en `src/hud_render.js` que determine si el canvas CSS es menor que un umbral de legibilidad, usando el ancho CSS disponible sin alterar `WIDTH`, `HEIGHT` ni el estado de combate.
- Exponer el ancho CSS actual desde `resizeCanvas()` o leerlo desde `canvas.getBoundingClientRect().width` con fallback a `canvas.style.width`; mantener un fallback seguro para mocks.
- En la escala pequena:
  - conservar nombres, porcentajes, reloj y marcador si todavia caben con una fuente legible dentro de las placas;
  - ocultar solo el texto `SPECIAL` dentro de `drawEnergyBar()` y conservar relleno amarillo, borde de acento y la señal accesible del boton/estado cuando el texto fisico sea demasiado pequeno;
  - no reducir mas las fuentes para forzar todo el contenido a entrar;
  - si se necesita simplificar, priorizar reloj, porcentaje y nombre sobre etiquetas auxiliares.
- No cambiar `drawHealthBar()` ni la semantica de energia; la decision se limita a Canvas presentation.
- Probar portrait `390x844`, landscape `844x390`, landscape bajo `667x375` y desktop para evitar que la simplificacion se active demasiado pronto.

### 3. Zona segura vertical para feedback

- Definir en `src/fighter_render.js` una funcion de posicionamiento visual que reciba el `baseY` del luchador y calcule una coordenada segura para badge/indicador.
- Para badges:
  - mantener clamp horizontal dentro de 16 unidades;
  - evitar que la parte superior del badge entre en `HUD_SAFE_BOTTOM`;
  - cuando el personaje este demasiado alto, dibujar el badge debajo de la franja HUD o en la primera posicion vertical disponible sin tocar al luchador.
- Para `drawSpecialReadyIndicator()` aplicar el mismo criterio a la placa y al aura; el texto no debe quedar detras de las placas del HUD.
- Ajustar `FloatingText` solo si las pruebas demuestran que su clamp actual no conserva la separacion vertical en todos los casos; evitar duplicar logica si ya cumple.
- Fijar la fuente del label antes de llamar a `measureText()`. Limitar el ancho maximo del badge a la zona util; para un label mas largo usar una reduccion visual/truncamiento controlado, sin modificar la etiqueta localizada almacenada en el luchador.
- Registrar coordenadas de texto y rectangulos relevantes en el mock Canvas para poder probar que no se dibujan fuera de `16..984` ni dentro de la banda HUD cuando corresponda.

### 4. Toolbar y responsive real

- Hacer que el mock de `tests/game.test.js` devuelva una altura configurable para `#game-toolbar` y que `getBoundingClientRect()` refleje el valor solo cuando la barra esta visible.
- Agregar casos de `resizeCanvas()` para toolbar oculta y visible, con desktop, `844x390`, `667x375` y portrait. Verificar proporcion 2:1, `marginBottom`, backing store DPR y que el canvas no invade toolbar ni controles tactiles.
- Mantener el calculo existente de `availableHeight`; no introducir un segundo calculador responsive ni cambiar las reservas ya cubiertas por los planes 0022/0032.
- Registrar en el smoke test que la toolbar real debe probarse en landscape y que la altura usada por el navegador coincide con la reserva del canvas.

### 5. Foco visual y `<details>`

- Añadir `summary:focus-visible` al sistema de focus visible y usar un doble anillo o una combinacion tinta/cian con contraste suficiente sobre `#fffdf5`, sin cambiar la identidad amarilla del CTA.
- Mantener los estados `:active` y `:focus-visible` distinguibles; comprobar que el CTA no pierde contraste al cambiar a fondo blanco.
- Actualizar `syncDuelSettingsLayout()` para recordar solo el ultimo modo responsive (`desktop`/`compact`) en memoria. Al cruzar `760px`, aplicar el default del nuevo modo; dentro del mismo modo, no modificar `details.open` manual.
- Conectar la sincronizacion al listener `resize` existente con una funcion barata y sin persistencia nueva.

## Archivos A Modificar

- `src/game.js`: enfocar la partida al iniciar, sincronizar el modo responsive de `<details>` al cruzar breakpoint y exponer, si hace falta, el ancho CSS de canvas para presentation HUD.
- `src/hud_render.js`: decidir presentacion de HUD pequeno y ocultar texto redundante de especial sin cambiar datos de combate.
- `src/fighter_render.js`: aplicar zona segura vertical, fuente correcta antes de medir y ancho maximo de badges/indicador.
- `src/effects.js`: ajustar solo si se necesita compartir la zona segura vertical con textos flotantes.
- `src/styles.css`: mejorar focus-visible global y de `summary`, conservando tokens y layout actual.
- `tests/game.test.js`: hacer configurable la altura de toolbar, registrar argumentos Canvas y agregar regresiones de foco, HUD pequeno, geometria segura, badges largos y cambio de breakpoint.
- `Readme.md`: actualizar smoke tests de foco al iniciar/reiniciar, HUD pequeno y toolbar real en landscape.
- `AGENTS.md`: añadir verificacion manual de foco despues de iniciar/reiniciar, legibilidad portrait, saltos con badges y toolbar visible.
- `BACKLOG.md`: mantener `#25` como `Partial` y no cerrar `#20`, `#26` ni `#69` por error; solo actualizar si el estado documentado necesita aclaracion.
- `plans/plan_0036_endurecimiento_interfaz_hud.md`: registrar implementacion, pruebas y riesgo residual.

## Plan De Implementacion

1. Ampliar el fixture de Canvas/DOM antes de cambiar comportamiento.
   Verificar: el mock registra argumentos de `fillText`/`strokeText`/`fillRect`, permite configurar el ancho CSS del canvas y la altura visible de toolbar sin romper las 87 pruebas existentes.

2. Escribir regresiones para foco de gameplay y cambiar `startRound()`.
   Verificar: `initGame()`, `startTraining()`, reinicio y onboarding final terminan en `playing` con `#pause-button` enfocado; menu, ayuda y pausa conservan sus destinos actuales; no queda foco en un modal oculto.

3. Implementar la politica de HUD pequeno.
   Verificar: en portrait el texto `SPECIAL` redundante no se dibuja cuando cae bajo el umbral; reloj/nombre/porcentaje conservan la prioridad definida; desktop y landscape mantienen toda la informacion actual; no cambian salud, energia, timer ni coordenadas logicas.

4. Añadir regresiones geometricas para la banda HUD y labels largos.
   Verificar: badges, `ESPECIAL LISTO` y textos flotantes quedan dentro de margenes laterales; durante un salto no invaden la banda `HUD_SAFE_BOTTOM`; el badge mas ancho queda completamente dentro del canvas y la etiqueta usa la fuente medida correcta.

5. Implementar clamps verticales y ancho maximo en los renderizadores.
   Verificar: casos en `x=50`, `x=950`, `baseY` de suelo y `baseY` de salto se dibujan sin recorte; no se modifica `fighter.x`, `fighter.y`, hitbox, pushbox, daño o estado.

6. Hacer que resize y toolbar tengan cobertura real.
   Verificar: con toolbar de 0 px y de 42 px, desktop y landscape conservan la proporcion; el canvas se reduce solo dentro del espacio disponible y no se solapa con toolbar, orientacion o controles.

7. Mejorar foco visual y sincronizacion de `<details>`.
   Verificar: Tab muestra anillo contrastado en botones, selects, enlace, botones tactiles y `summary`; al cruzar 760 px el default cambia una sola vez y una eleccion manual dentro del mismo modo se conserva.

8. Ejecutar smoke visual focalizado en viewports y estados residuales.
   Verificar: `390x844`, `844x390`, `667x375`, `1366x768` y `1440x900`; menu, ayuda, pausa, onboarding, game over, inicio/reinicio, salto, especial listo, ambas esquinas y toolbar visible.

9. Actualizar documentacion y el estado del plan despues de pasar validaciones.
   Verificar: README/AGENTS reflejan los nuevos criterios, BACKLOG conserva estados correctos y el plan registra pruebas reales y cualquier riesgo pendiente.

## Pruebas Y Validacion

Validacion automatica:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
git diff --check
```

Pruebas unitarias nuevas o ajustadas:

- Iniciar versus, entrenamiento, reinicio y onboarding final enfoca `#pause-button` despues de hacer visible la partida.
- Ayuda, pausa, game over y menu conservan foco inicial, restauracion, containment e inert sin regresion.
- El HUD pequeno aplica la politica de simplificacion solo por debajo del umbral y no cambia informacion de simulacion.
- El mock registra coordenadas Canvas y prueba que nombres, porcentajes, reloj, badges, especial y textos flotantes quedan en zonas seguras.
- Un luchador en suelo y salto, en ambos extremos, no deja badge ni especial dentro de la banda HUD.
- Un label sinteticamente largo se mide con la fuente correcta y el rectangulo final queda dentro de `x=16..984`.
- Toolbar oculta y visible con altura configurable producen resize correcto en desktop, landscape normal, landscape bajo y portrait.
- El canvas conserva proporcion 2:1, DPR y reservas de touch; no se modifica la API logica `1000x500`.
- `summary:focus-visible` y el foco global tienen contrato estatico o prueba de CSS suficiente para evitar regresion accidental.
- `<details>` solo cambia por cruce de breakpoint y conserva una apertura/cierre manual dentro del mismo modo.
- La suite actual de combate, IA, rondas, input, touch, i18n, arenas, persistencia y reduced motion continua pasando.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: ampliar smoke test con foco post-inicio/reinicio, HUD portrait, toolbar real en landscape y badges durante saltos.
- `AGENTS.md`: actualizar la lista manual durable con los casos de legibilidad y foco corregidos.
- `BACKLOG.md`: mantener `#25` en `Partial`; no cerrar preferencias de contraste/color, temas HUD, colorblind feedback ni labels restantes.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: enfocar Pausa durante `startRound()` interfiere con intro VS o controles tactiles. Mitigacion: enfocar solo despues de `updateControlsVisibility()`, mantener `gameState` y probar intro/playing en desktop y touch.
- Riesgo: ocultar `SPECIAL` elimina una señal importante. Mitigacion: conservar relleno amarillo, borde de energia llena, estado del boton y anuncio accesible; solo ocultar texto redundante en escala pequena.
- Riesgo: mover badges verticalmente hace que desaparezcan detras del personaje. Mitigacion: definir limites de zona y probar suelo/salto; cambiar solo coordenadas de presentacion, no el dibujo del luchador.
- Riesgo: un clamp vertical basado en HUD tapa feedback legitimo. Mitigacion: mantener `HUD_SAFE_BOTTOM` como frontera unica y desplazar debajo de la banda, no suprimir mensajes salvo la etiqueta redundante de especial.
- Riesgo: el mock de toolbar diverge del navegador. Mitigacion: probar una altura representativa y validar manualmente en landscape; no usar el mock como sustituto de smoke visual.
- Riesgo: sincronizar `<details>` sobrescribe una eleccion manual. Mitigacion: detectar solo la transicion desktop/compact y guardar el modo anterior en memoria, sin persistencia nueva.
- Riesgo: reducir/truncar badges rompe nombres localizados. Mitigacion: conservar `labelKey` y texto semantico; limitar solo el dibujo Canvas con una estrategia visible y testeada.
- Riesgo: cambiar focus ring degrada la identidad visual. Mitigacion: mantener amarillo en CTA como acento interno y añadir tinta/cian solo como anillo de contraste.
- Riesgo: ampliar el plan hacia HUD accesible completo o limpieza CSS. Mitigacion: dejar ambos como trabajo futuro y no cambiar `#25` mas alla de lo entregado.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este plan.

- El plan se limita a tres problemas P1 concretos y a la cobertura de pruebas que los hace observables: foco post-transicion, HUD pequeno y seguridad vertical/toolbar.
- Se incluyen solo mejoras P2 directamente necesarias para robustez de esos problemas: foco de `summary`, cruce de breakpoint y medicion de badges.
- Se excluyen explicitamente la limpieza CSS completa, el HUD semantico paralelo, cambios de `touch-action`, temas, dependencias y gameplay.
- La solucion reutiliza `#pause-button`, `HUD_SAFE_BOTTOM`, `resizeCanvas()`, `openModalDialog()` y la arquitectura de mocks existente en lugar de introducir sistemas nuevos.
- Las suposiciones sobre el umbral de HUD, el destino de foco, el cruce de breakpoint y la frontera vertical estan explicitadas y son comprobables.
- Cada paso tiene una verificacion automatizable o un caso manual con viewport/estado concreto.
- Los criterios de aceptacion protegen coordenadas logicas, reglas de combate, input tactil, IA y balance.

## Criterios De Aceptacion

- Iniciar versus, entrenamiento, reinicio y onboarding final enfocan una superficie visible de la partida; ningun modal oculto conserva el foco.
- Ayuda, pausa, game over y menu mantienen el comportamiento actual de foco, restauracion, containment, inert y `Escape`.
- Portrait movil conserva una señal clara de vida, reloj, rival y especial sin depender de texto fisicamente ilegible.
- Desktop y landscape conservan la informacion completa del HUD y el mismo estado de combate.
- Badges, `ESPECIAL LISTO` y textos flotantes permanecen dentro de los margenes laterales y no invaden `HUD_SAFE_BOTTOM` durante suelo o salto.
- Labels largos se miden con la fuente de dibujo y el badge final no sale del canvas.
- Toolbar visible y oculta estan cubiertas por tests de resize con altura configurable; el canvas conserva 2:1, DPR y reservas tactiles.
- El foco visible de botones, selects, enlaces, botones tactiles y `summary` tiene contraste claro sobre papel y fondos oscuros.
- `<details>` cambia su default solo al cruzar el breakpoint y no sobrescribe una eleccion manual dentro del mismo modo.
- No cambian IA, hitboxes, daño, movimiento, controles, rounds, timer, coordenadas `1000x500` ni balance.
- `node --check` para todo `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan.
- `Readme.md`, `AGENTS.md`, `BACKLOG.md` y este plan reflejan exactamente el resultado; `#25` permanece parcial.

## Commit Y Push

- Commits recomendados si se implementa por etapas:
  - `Preserve focus after starting matches`
  - `Harden mobile HUD presentation`
  - `Keep combat feedback below HUD`
  - `Cover toolbar responsive geometry`
- Ejecutar la validacion relevante antes de cada commit y la suite completa antes del ultimo.
- No hacer commit ni push salvo solicitud expresa del usuario.

## Estado De Implementacion

Sustituido por `plans/plan_0040_claridad_impacto_fase_1.md`.

El plan 0040 rebaselina el alcance vigente de foco, HUD pequeno, marcadores y toolbar, elimina la referencia obsoleta a `syncDuelSettingsLayout()` y lo integra con los items de Fase 1. No ejecutar este plan 0036 de forma independiente.
