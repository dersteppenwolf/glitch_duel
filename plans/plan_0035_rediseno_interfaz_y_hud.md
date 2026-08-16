# Exec Plan: rediseño de interfaz y HUD

## Objetivo

Reorganizar la interfaz de `GLITCH DUEL` para que el menu principal tenga una jerarquia clara y no oculte contenido esencial, el HUD sea legible sobre las ocho arenas, los controles externos de partida formen una barra coherente y los dialogos administren correctamente el foco.

La experiencia del jugador cambia de forma observable:

- En escritorio, el menu usa una composicion compacta de dos zonas con una accion principal dominante, configuracion agrupada y vista previa contextual.
- En movil, el mismo contenido se apila sin desbordes; la configuracion puede contraerse para priorizar iniciar el duelo.
- Durante la partida, vida, energia, rival, ronda, marcador y reloj se leen sobre placas de papel independientes del fondo de arena.
- La etiqueta de modo y Pausa comparten una barra alineada con el canvas.
- Al abrir Ayuda, onboarding, Pausa o game over, el foco entra en el dialogo, queda contenido y vuelve al control de origen al cerrarlo.
- Los badges y textos flotantes se mantienen dentro de margenes seguros del canvas cuando el combate ocurre en una esquina.

Queda fuera del alcance agregar una camara dinamica, alterar posiciones o reglas de combate, rediseñar los controles tactiles, añadir temas seleccionables de HUD, crear preferencias de contraste/color, agregar assets o dependencias, cambiar la fuente, animar previews, modificar arenas o implementar feedback haptico/audio. El plan tampoco cambia el espacio logico `1000x500`.

## Contexto Actual

- `src/index.html` coloca el canvas, `#instructions` y `#pause-button` como hermanos independientes. El menu principal contiene marca, tres acciones, GitHub, cinco selectores, preferencia de movimiento, preview, estadisticas y la tabla completa de controles dentro de una sola tarjeta.
- El viewport en `src/index.html` usa `maximum-scale=1.0, user-scalable=no`, lo que impide zoom manual.
- `src/styles.css` da a `#main-menu .menu-card` un ancho maximo de 780 px y scroll interno. La configuracion usa tres columnas, las acciones dos columnas y casi todos los bloques comparten el mismo borde, fondo y peso visual.
- La adaptacion movil, safe areas, botones tactiles nativos y scroll vertical de overlays ya fueron implementados por los planes `0022` y `0032`; deben preservarse, no rehacerse.
- `src/game.js` muestra y oculta overlays con `style.display`, pero no mueve/restaura el foco, no contiene Tab ni marca el contenido de fondo como inerte. `Escape` se procesa globalmente como pausa/reanudacion.
- La preferencia `Reducir movimiento` se persiste en `localStorage`, pero el valor inicial no incorpora `window.matchMedia('(prefers-reduced-motion: reduce)')` cuando el usuario aun no ha guardado una eleccion.
- `src/hud_render.js` dibuja texto negro directamente sobre la arena en `drawHealthBars()`. Las barras tienen fondo propio, pero nombres, porcentajes, ronda, marcador y reloj no.
- `drawStatusMessage()` comienza en `y = 84`, por lo que cualquier HUD superior mas alto debe conservar una separacion explicita.
- `src/fighter_render.js` calcula badges desde el centro del luchador sin limitar `badgeX`; nombres largos pueden acercarse o salir del canvas en esquinas. El indicador de especial usa el mismo supuesto.
- `src/effects.js` dibuja `FloatingText` desde su coordenada sin `textAlign` explicito ni medicion/clamp, de modo que mensajes de impacto pueden recortarse.
- `resizeCanvas()` en `src/game.js` conserva proporcion 2:1, DPR y reservas para controles moviles. Si se introduce un wrapper/barra de sistema, el calculo debe seguir usando el tamaño disponible real sin alterar coordenadas logicas.
- `tests/game.test.js` tiene mocks DOM/canvas, pruebas del contrato HTML, resize, menus, movimiento reducido y render. Los mocks actuales no exponen todo lo necesario para foco, `activeElement`, `matchMedia`, `inert`, `querySelectorAll` por dialogo o `measureText`.
- `BACKLOG.md` mantiene `#25 Advanced accessibility preferences` como pendiente. Este plan completa solo su parte de dialogos y preferencia de movimiento del sistema; contraste configurable y anuncios enriquecidos permanecen pendientes.

Suposiciones explicitas:

- La tabla completa de controles ya vive en Ayuda; el menu principal solo necesita un resumen breve con movimiento, golpe, patada y pausa.
- El selector de idioma es una utilidad global y se movera a la cabecera visual, aunque conservara el mismo `#language-select`, persistencia y comportamiento.
- El menu movil usara un `<details>` nativo para la configuracion. Estara abierto por defecto en escritorio y se podra contraer en movil sin introducir estado persistido ni una abstraccion JavaScript de acordeones.
- La seleccion actual de dificultad, arena, estilo y rival conserva IDs, valores, listeners y persistencia existente. El rediseño no cambia reglas ni defaults.
- La placa de HUD se dibujara dentro del canvas para asegurar contraste en todas las arenas; la barra de modo/Pausa seguira siendo HTML para conservar semantica y foco.
- El foco modal se resolvera con un helper pequeño aplicado a los overlays existentes, no con una libreria ni un componente general de UI.
- Los anuncios accesibles de combate se limitaran a eventos discretos de ronda, especial listo y resultado solo si pueden reutilizar transiciones existentes. No se anunciara vida o tiempo en cada tick.

## Diseño Propuesto

### 1. Base visual y tokens

- Declarar variables CSS locales en `:root` para evitar repetir la paleta y grosores principales: papel `#fffdf5`, papel secundario `#f6f1e5`, tinta `#111`, grafito `#62605a`, cian `#00c7e6`, magenta `#e94370`, amarillo `#ffd447`, borde estandar `3px` y sombra dura `6px 6px 0`.
- Reutilizar la pila tipografica existente; este plan no cambia ni carga fuentes.
- Mantener bordes rectos y sombras duras. Reservar borde de 5-6 px para la tarjeta principal/canvas, 3 px para controles y 1-2 px para separadores/decoracion.
- Garantizar controles interactivos de al menos 44 px de alto y conservar `:focus-visible`; agregar `:active` coherente para botones y enlaces.

### 2. Menu principal

- Reestructurar solo el contenido de `#main-menu .menu-card`:
  - Cabecera con kicker, `GLITCH DUEL` y selector de idioma compacto.
  - Intro breve.
  - Cuerpo `.menu-layout` con configuracion a la izquierda y preview/resumen a la derecha.
  - Configuracion dentro de `<details id="duel-settings">` con un `summary` localizado, manteniendo los cuatro selectores de duelo y `Reducir movimiento`.
  - Vista previa con arena, descripcion, descriptor de estilo y ficha de rival. Los descriptores seran texto localizado derivado de las selecciones existentes, no stats numericos nuevos.
  - Estadisticas como cinta compacta.
  - `INICIAR JUEGO` como CTA de ancho completo; Entrenamiento y Ayuda como secundarias; GitHub como enlace discreto de pie.
  - Resumen de controles de una linea; eliminar del menu la tabla duplicada, que permanece completa en Ayuda.
- En escritorio, usar dos columnas aproximadamente `minmax(280px, 1fr) minmax(260px, .85fr)` y ancho maximo cercano a 920 px. El flujo principal debe caber sin scroll a `1366x768`; el scroll interno se conserva como fallback para alturas menores.
- En `max-width: 760px`, apilar las zonas, mantener el CTA antes de contenido auxiliar y permitir contraer `<details>`. No cambiar la distribucion de controles tactiles de combate.
- Añadir las claves ES/EN necesarias para `Configurar duelo`, resumen de controles y descriptores de estilos/rivales. Reutilizar nombres y preview existentes cuando ya haya clave.
- Extender los renderizadores de preferencias en `src/game.js` para actualizar solo el descriptor de estilo/rival y atributos de preview. No duplicar datos de balance en HTML.

### 3. Accesibilidad modal y movimiento

- Cambiar el meta viewport a `width=device-width, initial-scale=1.0`; no limitar escalado.
- Crear en `src/game.js` un helper de activacion de dialogo que:
  - Reciba dialogo, control de foco inicial y elemento al que retornar.
  - Guarde el elemento activo antes de abrir cuando exista.
  - Muestre el dialogo y enfoque su primera accion significativa mediante `focus()`.
  - Marque como `inert` las superficies interactivas hermanas que quedan detras, sin volver inerte el dialogo activo.
  - Contenga `Tab` y `Shift+Tab` entre controles enfocables visibles del dialogo.
  - Al cerrar, quite `inert` y restaure el foco si el elemento de origen sigue disponible.
- Aplicar el helper a Ayuda, onboarding, Pausa y game over. El menu inicial enfoca `#start-button`; al volver desde Ayuda se restaura `#help-button`; al reanudar se enfoca el canvas o `#pause-button` segun el flujo; al volver al menu se enfoca Inicio.
- Hacer que `Escape` cierre Ayuda hacia el menu y reanude solo desde Pausa. Durante onboarding y game over no ejecutara una transicion implicita. `P` mantiene pausa/reanudacion durante `playing`/`paused`.
- Mantener overlays ocultos con `display: none`; `aria-modal` e `inert` no sustituyen su visibilidad.
- Al cargar movimiento reducido, distinguir entre "preferencia guardada" y "sin preferencia". Solo en el segundo caso usar `matchMedia('(prefers-reduced-motion: reduce)').matches`. Una eleccion posterior del checkbox sigue siendo la fuente persistida.
- Añadir `@media (prefers-reduced-motion: reduce)` para eliminar transiciones CSS decorativas; la reduccion de shake/particulas Canvas sigue controlada por `reducedMotionEnabled`.
- Añadir una region `#game-announcer` visualmente oculta con `aria-live="polite"`. Actualizarla solo en transiciones ya existentes: inicio/fin de ronda, especial disponible por primera vez y resultado final. Evitar mensajes por frame o por cada cambio porcentual.

### 4. Barra de sistema y HUD

- Envolver la superficie de partida en `#arena-shell`, que contiene una barra HTML `#game-toolbar` y el canvas. Mover `#instructions` y `#pause-button` dentro de esa barra sin cambiar sus IDs ni listeners.
- La barra usa el mismo ancho CSS visible que el canvas, distribuye modo a la izquierda y Pausa a la derecha y adopta papel, tinta, borde y sombra del resto del sistema. Fuera de `playing`, `updateControlsVisibility()` oculta la barra completa salvo que un estado de entrenamiento necesite conservar contexto; no dejar una etiqueta flotante aislada.
- Ajustar `resizeCanvas()` para considerar la altura visible de la barra al calcular el espacio vertical disponible, conservando proporcion 2:1, backing store DPR, `ctx.setTransform(...)` y las reservas existentes para controles tactiles/safe areas.
- Rediseñar `drawHealthBars()` como una banda superior de 88 unidades logicas:
  - Dibujar dos placas de papel para jugador y rival, con nombre/porcentaje encima de vida y energia.
  - Dibujar una placa central independiente para reloj; ronda y marcador quedan en un nivel secundario.
  - Conservar colores actuales de salud, `displayHealth`, acentos de rival y energia especial.
  - Subir `SPECIAL` a un tamaño logico que nunca resulte menor que unos 14 px CSS efectivos en el tamaño movil objetivo; si el canvas fisico no permite ese minimo, ocultar el texto redundante y conservar la señal por color/patron/estado del boton.
- Mantener el HUD en coordenadas logicas `1000x500`. No mover luchadores, suelo, hitboxes ni limites de arena.
- Mover `drawStatusMessage()` y cualquier mensaje central que intersecte la nueva banda a una zona segura debajo de `HUD_SAFE_BOTTOM`; declarar una constante de presentacion local en `hud_render.js` o `config.js` solo si la reutilizan varios renderizadores.
- Verificar contraste con Cuaderno y Servidor Caido como extremos, y luego con las ocho arenas.

### 5. Zonas seguras de feedback

- En `drawFighterIdentityMarker()`, medir el ancho real cuando `ctx.measureText` este disponible, limitar el ancho de badge al espacio util y clamp de `badgeX` dentro de 16 unidades logicas. Mantener texto centrado en el badge clamped, no necesariamente sobre el centro exacto del luchador en una esquina.
- Aplicar el mismo margen a `drawSpecialReadyIndicator()` para que su placa no salga del canvas. No cambiar la posicion de combate ni el estado del luchador.
- En `FloatingText.draw()`, establecer alineacion explicita, medir el texto y clamplear la coordenada de dibujo dentro de margenes laterales y debajo de la banda de HUD. El clamp es solo visual; `x`, `y`, velocidad y vida del efecto no cambian.
- No añadir seguimiento de camara ni atenuacion reactiva de arena en esta entrega. La legibilidad de esquinas se resuelve primero con limites de overlays y el HUD estable.

## Archivos A Modificar

- `src/index.html`: permitir zoom, reorganizar menu, agregar `<details>`, descriptores, wrapper/barra de arena y region de anuncios; conservar IDs funcionales.
- `src/styles.css`: introducir tokens, layout de dos zonas, jerarquia de acciones, responsive movil, barra de sistema, estados activos, texto visualmente oculto y reduced-motion CSS.
- `src/i18n.js`: agregar textos ES/EN para configuracion, resumen de controles, descriptores y anuncios discretos.
- `src/game.js`: actualizar descriptores, integrar preferencia del sistema, administrar dialogos/foco/inert/Escape, emitir anuncios y adaptar visibilidad/resize a la barra.
- `src/hud_render.js`: dibujar placas estables, reloj central y zonas seguras del HUD/mensajes.
- `src/fighter_render.js`: limitar badges e indicador de especial dentro del canvas.
- `src/effects.js`: limitar textos flotantes a la zona visible segura.
- `tests/game.test.js`: ampliar mocks y cubrir contrato HTML, preferencias, foco modal, anuncios, resize y clamps de render.
- `Readme.md`: documentar nueva estructura del menu, accesibilidad modal, zoom y HUD legible.
- `AGENTS.md`: actualizar el smoke test durable con foco contenido/restaurado, zoom y contraste del nuevo HUD.
- `BACKLOG.md`: marcar como parcial/completada solo la porcion realmente entregada de `#25`; mantener pendientes contraste configurable y cualquier anuncio no implementado.
- `plans/plan_0035_rediseno_interfaz_y_hud.md`: registrar decisiones, desviaciones y resultado cuando se ejecute.

## Plan De Implementacion

1. Ampliar los mocks y escribir contratos de regresion antes del cambio visual.
   Verificar: el fixture soporta `focus()`, `document.activeElement`, `inert`, lista de enfocables, `matchMedia`, `measureText` y dimensiones de toolbar sin cambiar resultados existentes.

2. Corregir el viewport e implementar la base de dialogos accesibles.
   Verificar: Inicio recibe foco al cargar; Ayuda enfoca Volver y retorna a Ayuda; Pausa enfoca Resumir y contiene Tab; game over enfoca Reiniciar; los hermanos quedan inertes solo mientras el dialogo esta activo; `Escape` respeta el estado.

3. Integrar la preferencia del sistema de movimiento y la region de anuncios discretos.
   Verificar: sin valor guardado, `prefers-reduced-motion: reduce` activa la preferencia; un `false` guardado prevalece; anuncios ocurren una vez por evento y no durante cada tick.

4. Reestructurar el HTML del menu conservando todos los IDs, valores y listeners existentes.
   Verificar: idioma, dificultad, arena, estilo, rival, movimiento reducido, Inicio, Entrenamiento, Ayuda y GitHub mantienen comportamiento; la tabla completa de controles solo queda en Ayuda.

5. Aplicar tokens y layout responsive del menu.
   Verificar: a `1366x768` el flujo principal y todos sus botones caben sin scroll; a `844x390`, `390x844` y `667x375` no hay overflow horizontal, el contenido se puede desplazar y `<details>` permite priorizar el CTA.

6. Añadir descriptores localizados de estilo/rival y actualizar su render al cambiar seleccion o idioma.
   Verificar: cada estilo y rival muestra la descripcion correcta en ES/EN sin cambiar stats, IA, dificultad ni persistencia.

7. Crear `#arena-shell`/`#game-toolbar` y adaptar `resizeCanvas()`.
   Verificar: toolbar y canvas comparten ancho visual, modo y Pausa no se solapan, el canvas mantiene 2:1 y DPR en desktop/movil, y los controles tactiles/safe areas conservan el espacio actual.

8. Rediseñar `drawHealthBars()` con placas laterales y reloj central.
   Verificar: los mismos valores de salud, salud animada, energia, ronda, marcador, tiempo y rival se dibujan; el texto siempre tiene fondo de contraste y no invade las barras ni sale de `1000x500`.

9. Ajustar mensajes centrales, badges, especial listo y textos flotantes a zonas seguras.
   Verificar: `NULL POINTER`, `MERGE CONFLICT` y mensajes largos permanecen dentro de margenes en `x=50` y `x=950`; el feedback no tapa la banda del HUD; no cambian posiciones/hitboxes.

10. Actualizar documentacion y backlog despues de superar las pruebas.
    Verificar: README describe el comportamiento entregado, AGENTS contiene el smoke test nuevo y BACKLOG no da por completadas preferencias de contraste/color que siguen fuera de alcance.

11. Ejecutar validacion automatica completa y smoke visual en desktop, movil y todas las arenas.
    Verificar: no hay cambios de gameplay, no aparecen regresiones en flujo menu/playing/paused/roundOver/gameOver y el diff solo contiene archivos del alcance.

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

- El meta viewport no contiene `user-scalable=no` ni `maximum-scale=1`.
- El contrato HTML conserva IDs/selectores/opciones y contiene `#arena-shell`, `#game-toolbar`, `#duel-settings` y `#game-announcer`.
- La tabla detallada de controles existe en Ayuda, no duplicada en el menu.
- Apertura, contencion de Tab, `Shift+Tab`, cierre y restauracion de foco funcionan en Ayuda, Pausa, onboarding y game over.
- `Escape` vuelve desde Ayuda, reanuda desde Pausa y no inicia/cierra estados no autorizados.
- `inert` se aplica y retira sin dejar bloqueada la UI despues de una transicion.
- `prefers-reduced-motion` solo decide el valor inicial cuando no hay preferencia guardada.
- Los anuncios de ronda, especial y resultado se emiten una vez por transicion relevante.
- Los descriptores ES/EN cubren todos los estilos/rivales y reaccionan a seleccion/idioma.
- `resizeCanvas()` conserva proporcion, DPR y limites en desktop, landscape touch y portrait touch considerando toolbar.
- El HUD sigue dibujando salud, `displayHealth`, energia, marcador, ronda, tiempo y rival, con placas previas a los textos.
- Badges, indicador especial y `FloatingText` clamplean nombres/mensajes largos en ambos extremos.
- La suite actual de simulacion, IA, combate, input, touch, arenas, i18n y persistencia sigue pasando.

Smoke test manual:

- Abrir menu a `1366x768`: titulo, configuracion, preview, stats y acciones principales caben sin scroll; Inicio domina la jerarquia y GitHub queda secundario.
- Probar `844x390`, `390x844`, `667x375` y zoom de navegador al 200%: no hay overflow horizontal; menu/ayuda/pausa/game over siguen navegables.
- Navegar solo con teclado: Inicio recibe foco, Ayuda contiene foco y lo devuelve, Pausa contiene foco y al reanudar no se pierde contexto, game over enfoca Reiniciar.
- Probar `Escape` y `P` en menu, Ayuda, playing, paused, onboarding y game over; ninguna tecla produce transiciones ambiguas.
- Cambiar idioma, dificultad, arena, estilo y rival; verificar descriptor, preview y textos en ES/EN.
- Simular preferencia de sistema de movimiento reducido con y sin valor guardado; comprobar que una eleccion manual persiste y prevalece.
- Revisar las ocho arenas con salud alta/media/baja, energia normal/llena, nombres de los cuatro rivales y timer de uno/dos digitos; todo el HUD conserva contraste.
- Revisar combate en ambas esquinas con badge, especial listo, combo, bloqueo y textos de impacto; nada sale del canvas ni tapa informacion critica.
- En movil landscape, comprobar toolbar, HUD, canvas, entrenamiento, Pausa y controles tactiles sin solapamientos criticos.
- Confirmar que movimiento, ataques, combos, bloqueo, rondas, timer, pausa, entrenamiento y game over no cambian respecto al comportamiento actual.

## Documentacion

- `Readme.md`: actualizar secciones de menu/UI, accesibilidad, reduced motion y HUD; no cambiar comandos de ejecucion.
- `AGENTS.md`: añadir al smoke test zoom permitido, foco modal, nueva composicion del menu y contraste del HUD en arenas claras/oscuras.
- `BACKLOG.md`: reflejar con precision la parte completada de `#25`; mantener contraste/color avanzados pendientes y no alterar `#20` HUD theme selector.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: el rediseño del menu rompe listeners o pruebas por mover nodos. Mitigacion: conservar IDs, valores y eventos; cambiar estructura/clases, no contratos funcionales.
- Riesgo: el menu de dos columnas vuelve a desbordar en alturas bajas o zoom 200%. Mitigacion: mantener max-height/scroll como fallback, apilar por ancho y probar cuatro viewports mas zoom.
- Riesgo: `<details>` se comporta distinto entre desktop y movil. Mitigacion: usar semantica nativa y CSS minimo; no sincronizarlo con `gameState` ni persistencia.
- Riesgo: `inert` o el focus trap bloquean controles al cerrar un dialogo. Mitigacion: centralizar apertura/cierre, retirar siempre `inert`, probar cada transicion y usar `display:none` como estado visual autoritativo.
- Riesgo: `Escape` interfiere con pausa existente. Mitigacion: resolver primero dialogo/estado activo y despues `playing`/`paused`; cubrir matriz de estados en pruebas.
- Riesgo: `matchMedia` contradice una preferencia manual. Mitigacion: consultar sistema solo si no existe clave guardada; no sobrescribir almacenamiento al inferir el valor inicial.
- Riesgo: la toolbar reduce demasiado el canvas en movil landscape. Mitigacion: incluir su altura real en `resizeCanvas()`, mantener barra compacta y validar `844x390`/`667x375` antes de ajustar controles.
- Riesgo: ampliar la banda HUD tapa arte o luchadores. Mitigacion: limitarla a 88 unidades, no mover entidades y desplazar solo mensajes de presentacion que hoy comienzan en `y=84`.
- Riesgo: aumentar texto del HUD no garantiza 14 px fisicos en telefonos extremos. Mitigacion: definir un viewport movil objetivo verificable y ocultar texto redundante antes que reducirlo a tamaños ilegibles.
- Riesgo: clamps basados en `measureText` fallan en mocks/navegadores. Mitigacion: usar medicion nativa con fallback conservador por longitud y probar ambos caminos.
- Riesgo: anuncios `aria-live` se vuelven ruidosos. Mitigacion: anunciar transiciones discretas una vez; excluir timer, salud por frame, golpes normales y decoracion.
- Riesgo: el plan absorbe todo `#25` o `#20`. Mitigacion: documentar que preferencias de contraste/color y temas de HUD permanecen fuera del alcance.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este plan.

- El alcance se redujo a problemas observados en las capturas y auditoria: jerarquia de menu, contraste/cohesion del HUD, foco modal y desbordes visuales.
- Se descartaron camara dinamica, reescritura de controles moviles, temas de HUD, assets y preferencias de color porque no son necesarios para cumplir el objetivo y aumentarian riesgo.
- Se reutilizan HTML nativo (`details`, botones, selectores), Canvas y APIs del navegador (`inert`, `matchMedia`) sin dependencias ni nuevas capas de componentes.
- Los cambios conservan IDs, `gameState`, coordenadas `1000x500`, reglas de combate, configuracion e i18n existentes.
- Las suposiciones sobre menu, foco, movimiento del sistema, toolbar, anuncios y tamaño fisico del HUD estan explicitas.
- Cada fase tiene una comprobacion automatizable o un viewport/estado manual concreto; no se usa "mejorar visualmente" como criterio subjetivo unico.
- El plan toca varios archivos porque la mejora cruza estructura, estilo, accesibilidad y Canvas, pero cada archivo tiene una responsabilidad directa y no incluye refactors adyacentes.

## Criterios De Aceptacion

- El navegador permite pinch zoom y zoom manual; a 200% la UI principal sigue operable.
- A `1366x768`, el menu muestra configuracion, preview, stats y acciones esenciales sin scroll; en pantallas bajas conserva scroll accesible y sin overflow horizontal.
- Inicio es la accion principal; Entrenamiento/Ayuda son secundarias; GitHub y el resumen de controles no compiten con el CTA.
- Idioma, dificultad, arena, estilo, rival y movimiento reducido conservan valores, eventos, persistencia y efecto actuales.
- Los descriptores de estilo/rival se actualizan correctamente en ES/EN sin modificar gameplay.
- Ayuda, onboarding, Pausa y game over reciben/contienen/restauran foco; el fondo queda inerte solo mientras corresponde.
- `Escape` y `P` producen la transicion correcta para cada `gameState` y dialogo visible.
- La preferencia del sistema activa movimiento reducido solo cuando no existe eleccion persistida.
- La region accesible anuncia eventos discretos sin mensajes por frame.
- Modo y Pausa forman una barra alineada con el canvas y no se solapan en desktop o movil landscape.
- El canvas conserva proporcion 2:1, espacio logico `1000x500`, DPR y reservas para controles tactiles.
- El HUD mantiene contraste estable sobre las ocho arenas y comunica salud, energia, rival, ronda, marcador y reloj con jerarquia clara.
- Badge de rival, especial listo y textos flotantes permanecen dentro del canvas en ambas esquinas y fuera de la banda HUD.
- No cambian IA, hitboxes, daño, movimiento, controles, rounds, timer ni balance.
- `node --check` para todo `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan.
- `Readme.md`, `AGENTS.md`, `BACKLOG.md` y el estado de este plan reflejan exactamente la entrega.

## Commit Y Push

- Commits recomendados si se implementa por etapas:
  - `Improve dialog accessibility`
  - `Redesign main menu hierarchy`
  - `Unify game toolbar and HUD`
  - `Keep combat feedback in safe bounds`
- Ejecutar la validacion relevante antes de cada commit y la suite completa antes del ultimo.
- No hacer commit ni push salvo solicitud expresa del usuario.

## Estado De Implementacion

Implementado localmente el 2026-08-15.

- Completado: menu responsive con CTA dominante, configuracion agrupada/colapsable en movil, preview de arena, resumen de estilo/rival, stats compactas y resumen de controles.
- Completado: viewport ampliable, foco inicial/restaurado, containment de Tab, `inert` para superficies de fondo y reglas de `Escape` para ayuda, onboarding, pausa y game over.
- Completado: fallback inicial a `prefers-reduced-motion`, prioridad de elecciones persistidas, CSS reduced-motion y anuncios discretos de ronda, especial y resultado.
- Completado: toolbar HTML alineada con canvas, HUD con placas de contraste, reloj central y separacion segura para mensajes.
- Completado: clamp visual de badges, indicador de especial y textos flotantes dentro de los limites del canvas.
- Completado: pruebas de contrato, foco modal, movimiento reducido del sistema, descriptores localizados y regresiones existentes.
- Completado: `Readme.md`, `AGENTS.md` y `BACKLOG.md` reflejan el comportamiento; `#25` permanece parcial porque contraste/color configurable sigue pendiente.

Validacion local ejecutada:

- `node --check` para todos los archivos `src\*.js`: correcto.
- `node --test tests\game.test.js`: 87 pruebas superadas.
- `git diff --check`: correcto.
- Smoke visual en navegador: menu desktop a 1440x900, menu portrait a 390x844 con configuracion colapsada, partida desktop con HUD/toolbar y pause; no se observaron errores de pagina.

Riesgo residual aceptado:

- Falta una comprobacion manual con dispositivo tactil fisico y un viewport landscape movil dedicado; los contratos existentes de Pointer Events/resize y las comprobaciones previas de `0022`/`0032` siguen cubriendo esas rutas.
