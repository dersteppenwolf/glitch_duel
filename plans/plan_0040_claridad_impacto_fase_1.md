# Exec Plan: fase 1 claridad e impacto

## Objetivo

Implementar la primera fase de la hoja de ruta de producto para que GLITCH DUEL sea mas confiable al controlar, mas claro al leer y mas consistente entre teclado, touch, gamepad, escritorio y movil.

El resultado agrupa solo los trabajos ya priorizados para Fase 1:

- `#72`: preservar atajos del navegador y operacion nativa de controles interactivos.
- `#73`: aceptar de forma determinista el segundo input valido de los combos actuales.
- `#25`: rebaselinar y completar el trabajo residual de foco, foco visible, HUD pequeno y marcadores seguros del plan 0036.
- `#69`: cerrar nombres accesibles y feedback funcional localizado en español e ingles.
- `#75`: mostrar modo/progreso correcto y comunicar carga/disponibilidad del especial tactil.
- `#32`: ampliar el diagnostico local con medidas acotadas y corregir el ciclo de vida confirmado de nodos Web Audio.
- Ejecutar el tramo de primera sesion de `#77` como puerta de salida de la fase.

La experiencia cambia de forma observable:

- Atajos modificados y controles nativos dejan de activar acciones de combate accidentalmente.
- Un segundo golpe o patada pulsado durante la recuperacion valida queda en buffer y sale en el primer tick legal.
- Inicio, reinicio, onboarding y dialogos de baja altura mantienen foco visible y contexto claro.
- El HUD conserva vida, marcador y tiempo legibles en canvas pequeno sin cambiar la simulacion `1000x500`.
- Touch muestra `ESPECIAL` en estado de carga o listo sin depender solo del color.
- Toolbar y pausa identifican Duelo, Entrenamiento o Carrera `n/5`.
- El overlay de debug permite medir frames, pasos descartados, coste update/draw, DPR y audio sin enviar ni persistir datos.

Queda fuera del alcance:

- `#24` onboarding dependiente del dispositivo, `#74` HUD semantico consultable y `#9` combo trials.
- IA `#16-#19`, GLITCH CANCEL `#76`, nuevas arenas, rivales, ataques, combos o modos.
- Fases nuevas de startup/active/recovery, cambios de daño, alcance, cooldown, energia o balance.
- Preferencias configurables de alto contraste, temas de HUD y la revision completa de contraste de `#26`.
- Controles de volumen `#30`, AudioWorklet, musica, voz, vibracion o audio espacial.
- Telemetria remota, identificadores, almacenamiento de metricas, dependencias, bundler o servidor.
- Limpiar CSS legado, modularizar `game.js`, cambiar `touch-action` o resolver pinch zoom.

## Contexto Actual

- `BACKLOG.md` coloca `#72`, `#73`, `#25`, `#69`, `#75` y `#32` dentro de la ruta inmediata. `#77` define el estudio que valida comprension inicial.
- `src/game.js:1656-1708` procesa teclado globalmente. Solo excluye `.btn`; no deja pasar modificadores ni otros controles nativos antes de resolver acciones. Pausa llama `preventDefault()` aun si el estado no puede cambiar.
- `src/input.js:199-210` protege modificadores durante captura de bindings, pero `setupKeyboardControls()` no aplica la misma politica durante juego. `Enter` y `Space` siguen siendo bindings validos y deben conservar su activacion nativa cuando un control tiene foco.
- `src/fighter.js:168-210` retorna si `attackCooldown > 0` antes de registrar el segundo input. Las pruebas de combo actuales fuerzan `attackCooldown = 0`, por lo que no reproducen una doble pulsacion humana.
- La simulacion decrementa cooldown y ventana de combo en `Fighter.update()` y avanza solo dentro del fixed-step de 60 Hz. El buffer nuevo debe vivir en el luchador y no usar timers del navegador.
- `src/game.js:241-248` oculta dialogos y limpia el estado modal sin mover foco. `startRound()` llama esa funcion antes de hacer visible Pausa. Omitir onboarding tambien puede dejar el menu visible sin `activeDialog`.
- `focusDialog()` usa `preventScroll: true`; Ayuda, Controles, Pausa y Game Over enfocan acciones que estan al final de contenido potencialmente desplazable.
- `src/hud_render.js` dibuja fuentes logicas fijas. En portrait probado, 1000 unidades se comprimen en unos 374 px CSS y fuentes de 12-18 unidades se convierten en texto fisicamente diminuto.
- `src/fighter_render.js` limita badges e indicador de especial solo en horizontal. Sus coordenadas verticales pueden entrar en la banda `HUD_SAFE_BOTTOM` durante un salto.
- `src/effects.js` ya limita `FloatingText` a `HUD_SAFE_BOTTOM + 22`; no necesita otra politica salvo que una regresion nueva demuestre lo contrario.
- `src/index.html` mantiene nombres de grupo y selects de entrenamiento fijos en español. Los botones touch mezclan glifos con `JUMP`, `CROUCH` y `BLOCK` escritos directamente.
- `renderInputBindingsDialog()` crea botones cuyo nombre accesible es solo `A`, `LEFT`, `+` o `PULSA UNA TECLA`, sin incluir accion y slot.
- `#instructions` usa un texto generico de modo solo. `renderPauseSummary()` tampoco incluye el modo ni el progreso de Carrera.
- `#btn-special` conserva el mismo aspecto y nombre durante carga y disponibilidad. `Fighter.attack('special')` simplemente retorna si la energia no alcanza.
- El debug actual calcula FPS y ticks por segundo, pero no intervalos RAF, long frames, tiempo de update/draw, pasos descartados, DPR ni recursos de audio.
- `playTone()` crea `OscillatorNode` y `GainNode`, los conecta y detiene el oscilador sin desconectar nodos. La evaluacion preliminar en Chromium observo `AudioHandlers` de 311 a 441 en 30 s y 475 despues de reposo/GC, pero version, herramienta y escenario deben registrarse de nuevo antes de atribuir impacto o memoria.
- `tests/game.test.js` usa Node `vm` con mocks propios. `getBoundingClientRect()` siempre devuelve altura cero, el Canvas no registra coordenadas de texto/rectangulos, `requestAnimationFrame` no tiene reloj y el mock de foco no comprueba visibilidad real.
- La suite tenia 98 pruebas verdes durante la evaluacion, pero la implementacion debe volver a establecer su propia linea base antes de tocar codigo.
- `plans/plan_0036_endurecimiento_interfaz_hud.md` estaba pendiente, referencia una funcion `syncDuelSettingsLayout()` que ya no existe y registra un conteo antiguo de pruebas. Con este rebase queda marcado como sustituido; el plan 0040 absorbe solo su alcance vigente.

Suposiciones explicitas:

- `input`, `textarea`, `select` y contenido editable conservan todas sus teclas de edicion/navegacion. `button`, `a[href]` y `summary` conservan Enter/Space, pero otros bindings de combate pueden seguir llegando durante `playing`.
- La superficie de juego enfocada al iniciar/reanudar sera `#game`, no Pausa, para que los bindings funcionen sin conflicto con activacion nativa.
- Ctrl, Alt o Meta siempre pasan sin `preventDefault()`. Shift tambien pasa salvo `Shift+Tab`, que sigue siendo navegacion inversa de foco.
- `Escape` sin modificadores conserva la politica actual de cerrar Ayuda/Controles, reanudar Pausa y no cerrar Onboarding/Game Over.
- El buffer admite solo un segundo `punch` o `kick` terrestre y solo mientras existe un primer input en la ventana de combo.
- Recibir un golpe, saltar, bloquear, agacharse, pausar, terminar ronda/partida, resetear entrenamiento o terminar la ventana cancela la secuencia completa: pendiente, buffer, timer y hint.
- El contrato cubre un segundo edge presente al menos en un snapshot de simulacion. Capturar un tap completo entre dos fixed steps requeriria una cola de edges en `input.js` y queda fuera.
- No se bufferizan especial ni ataques aereos en esta fase.
- El modo compacto del HUD es presentacional. No cambia salud, energia, timer, posiciones, hitboxes ni estados.
- `aria-disabled` en el especial tactil comunica indisponibilidad, pero no se usa el atributo `disabled` para que el boton siga siendo enfocable y explicable.
- Los timings y buffers se recogen solo con debug activo y `playing`; los escalares baratos del lifecycle de audio permanecen activos toda la pagina para no perder grafos iniciados antes de abrir debug.
- La correccion de desconexion Web Audio es valida como cleanup de grafo confirmado por codigo; su efecto sobre handlers, memoria o jank debe medirse y no asumirse.

## Diseño Propuesto

### 1. Contratos de prueba antes de comportamiento

- Separar `createMockElement(tagName, id)` de `document.createElement(tagName)` y mantener un inventario minimo de IDs estaticos con su tag real.
- Extender el mock DOM, sin jsdom, solo con parent/children, `classList`, atributos, `closest()` para targets interactivos/contenteditable/details, `querySelectorAll()` para selectores realmente usados, `scrollIntoView()` como registro y rectangulos configurables.
- Permitir configurar ancho CSS del canvas y altura de `#game-toolbar` por caso.
- Registrar operaciones Canvas estructuradas `{ op, args, font, textAlign }` para `fillText`, `strokeText`, `fillRect`, `strokeRect` y `arc`, conservando `calls`/`textCalls` para no romper pruebas existentes.
- Hacer que `measureText()` dependa de forma determinista del tamaño de `ctx.font` y registre la fuente usada.
- Añadir un reloj `performance.now()` inyectable y una cola RAF minima para probar diagnostico sin convertir toda la suite a un navegador simulado.
- Ampliar el mock Web Audio con osciladores retenidos por el test, `fireEnded()` explicito, `disconnect()` y contadores. `stop()` no dispara `onended` automaticamente.
- Mantener la autocreacion de elementos para los tests existentes, pero agregar un contrato estatico separado que siga comprobando IDs reales de `src/index.html`.

### 2. Politica de teclado y captura

- Añadir en `src/game.js` un helper pequeño basado en el target o su ancestro interactivo. Inputs, textareas, selects y contenido editable bloquean bindings globales; botones, links y summary solo reservan Enter/Space.
- Aplicar esta precedencia exacta: Ctrl/Alt/Meta pasan; Shift pasa salvo Shift+Tab; captura resuelve Escape/Tab sin modificadores; dialogos resuelven Tab/Escape sin modificadores; la ruta Tab Canvas/Pausa se resuelve durante `playing`; despues se aplica precedencia nativa; por ultimo pausa/debug/combate.
- `Ctrl+Tab`, `Ctrl+Shift+Tab` y `Shift+Escape` nunca llaman `preventDefault()` ni alteran captura/dialogo.
- Resolver pausa solo cuando `gameState` sea `playing` o `paused`; en menu, Game Over y Onboarding, un binding de pausa no cancela la accion nativa.
- Mantener `keyup` liberando la fuente por codigo aunque cambie el foco o existan modificadores, para no crear inputs retenidos.
- Durante captura, Escape sin modificadores cancela. Tab/Shift+Tab sin Ctrl/Alt/Meta cancelan, rerenderizan y mueven programaticamente el foco al siguiente/anterior elemento equivalente del dialogo.
- Dar a botones generados `data-binding-action` y `data-binding-slot` para restaurar un punto de foco equivalente despues de rerenderizar.
- No reservar globalmente `Enter` o `Space`; su precedencia depende del target del evento.

### 3. Buffer determinista de combo

- Añadir a `Fighter` un unico campo `pendingComboInput`, inicialmente vacio.
- Añadir `clearComboSequence()` para limpiar pendiente, `comboBuffer`, `comboTimer`, hint y timer del hint. Los resets de ronda/entrenamiento limpian tambien `prevPunchPressed`, `prevKickPressed` y `prevSpecialPressed`.
- Separar el procesamiento terrestre en dos operaciones pequeñas: registrar/encolar input y ejecutar la combinacion cuando el cooldown sea cero, sin crear una API publica solo para pruebas.
- Si llega `punch` o `kick` terrestre con cooldown activo, `comboTimer > 0`, un unico primer input en `comboBuffer` y ningun pendiente, guardar el segundo input sin reiniciar la ventana.
- Fijar el orden del tick: resolver hit-stun ya cancelado por `takeHit()`; decrementar cooldown/ventana; expirar secuencia si timer llega a cero; resolver movimiento/postura/salto y sus cancelaciones; consumir un pendiente legal; procesar nuevos edges de ataque.
- Consumir el pendiente en el tick donde `attackCooldown` pasa de 1 a 0 solo si la ventana sigue activa y ese mismo tick no entra block, crouch o jump.
- Usar `clearComboSequence()` en impacto bloqueado/no bloqueado, block, crouch, jump, pausa, fin de ronda/partida, reset de entrenamiento y expiracion.
- Mantener `COMBO_WINDOW_FRAMES`, daños, cooldowns y energia sin cambios.
- Reutilizar el hint actual. Un input encolado puede mantener el hint hasta resolverse, pero no agrega otro flash ni sonido antes de que el combo salga.
- Añadir `pendingComboInput` al overlay debug para diagnosticar la ventana sin mostrarlo en UI normal.
- Distinguir accepted/expired/blocked mediante estado y resultado observable: pending presente, secuencia limpiada y siguiente ataque normal, o ausencia de ataque. No añadir un bus ni enum persistente.

### 4. Foco modal y foco visible

- Hacer `#game` secuencialmente enfocable con `tabindex="0"`, nombre localizado y foco visible. Inicio, reinicio, siguiente combate y reanudacion enfocan Canvas.
- Como Pausa precede al Canvas en el DOM, definir una ruta explicita de gameplay: Tab desde Canvas enfoca Pausa y Shift+Tab desde Pausa vuelve a Canvas. Ctrl/Alt/Meta combinados siguen pasando al navegador.
- Abrir Pausa conserva como retorno el `activeElement` real: Canvas si se abrio por teclado/gamepad y boton Pausa si se abrio desde ese boton.
- Crear un helper de foco que use `scrollIntoView({ block: 'nearest', inline: 'nearest' })` dentro de dialogos. Canvas usa `preventScroll: true` al recuperar combate.
- Mantener `#start-button` como foco inicial del menu y `#onboarding-next-button` en el onboarding corto.
- Añadir `tabindex="-1"` y clase `.dialog-focus-target` a `#help-title`, `#controls-title` y `#pause-title`; pasan a ser foco inicial de dialogos largos y reciben indicador visible.
- Crear en Game Over un encabezado corto independiente con `tabindex="-1"`; `aria-labelledby` apunta solo a el, el resumen deja de ser live y `#game-announcer` emite un unico resultado conciso.
- Si el foco actual no pertenece a la lista secuencial, Tab va al primero y Shift+Tab al ultimo con `preventDefault()`. Gamepad desde un target estatico usa primero/ultimo segun direccion y hace scroll al elemento.
- Al omitir onboarding, volver a registrar `main-menu` como dialogo activo y enfocar Inicio. Al completar onboarding e iniciar, enfocar Canvas despues de hacerlo visible.
- Añadir `summary` al estilo `:focus-visible` y a la navegacion por gamepad. Excluir descendientes de `<details>` cerrado de la lista programatica.
- Sustituir el anillo amarillo unico por tinta oscura adyacente y halo amarillo secundario. Conservar la identidad del CTA y un minimo de 3:1 contra el fondo inmediato.
- Añadir `@media (forced-colors: active)` con `outline` de al menos 2 px y colores de sistema; no depender solo de box-shadow, fondo o trama.

### 5. HUD compacto y marcadores seguros

- Guardar el ancho CSS calculado por `resizeCanvas()` como dato de presentacion. El renderer no consulta layout DOM por frame.
- Activar presentacion compacta cuando la escala CSS `displayWidth / WIDTH` sea menor que `0.65`.
- En modo compacto, usar etiquetas `P1` y `CPU`, porcentaje de vida y timer con tamaño logico calculado para aproximarse a 12 px CSS, limitado a un maximo que siga cabiendo en las placas.
- Conservar marcador, barras de vida y energia. Omitir solo el texto redundante `SPECIAL` dentro de la barra; disponibilidad sigue en color/borde, anuncio y boton tactil.
- No reducir fuentes por debajo de la presentacion actual para hacer entrar mas contenido.
- Extraer en `fighter_render.js` un helper presentacional puro que devuelva bounds de badge, panel de especial y circulo. Si entrarian en `HUD_SAFE_BOTTOM`, colocarlos en dos slots bajo el luchador durante el salto, sin salir del canvas ni superponerse entre si.
- Medir el nombre del rival despues de establecer la fuente correcta, limitar ancho a los margenes `16..984` y reducir solo el dibujo si una etiqueta sintetica excede el ancho disponible. El texto localizado almacenado no se trunca.
- Mantener el clamp actual de `FloatingText`; solo ajustar `effects.js` si una prueba nueva demuestra un fallo real.
- Probar ground/jump, ambas esquinas, energia llena, cuatro rivales y una etiqueta sintetica larga.

### 6. Localizacion funcional y nombres accesibles

- Añadir `data-i18n-aria` y semantica de grupo a `#controls` y `#training-panel`; localizar los tres selects de entrenamiento.
- Separar glifos y texto visible dentro de botones touch mediante spans con IDs/data attributes, para traducir Jump/Crouch/Block/Punch/Kick/Special sin construir HTML desde JavaScript.
- Eliminar las escrituras de `textContent` al boton completo en `renderInputBindings()`; `data-i18n` traduce spans de accion y el renderer del especial modifica solo su span de estado.
- Añadir claves ES/EN para estados `CARGA/LISTO`, modos, progreso, nombres de grupo, selects de entrenamiento y botones de binding.
- Separar el token visual compacto de cada tecla de su nombre accesible localizado. ES usa `Flecha izquierda`, `Espacio`, etc.; EN usa `Left Arrow`, `Space`, etc.
- Dar a cada binding un nombre como `Mover izquierda, binding 1: A` y al boton `+` un nombre como `Agregar segundo binding para Patada` usando templates ES/EN.
- Cerrar el inventario dinamico a estas claves: combo x2, punch+kick, back kick, especial de impacto, texto corto de energia lista, victoria, modos, progreso, estados touch y nombres de binding/tecla. Mantener `404`, nombres de rivales, identificadores P1/CPU, impactos aleatorios y bromas tecnicas deliberadas.
- No traducir retroactivamente un `FloatingText` ya creado; el idioma activo se aplica a feedback nuevo.
- Comparar igualdad exacta de claves ES/EN y de placeholders por clave, ademas de recorrer `data-i18n`, `data-i18n-aria` y el inventario dinamico declarado.

### 7. Contexto de modo y estado tactil

- Mantener superficies separadas para evitar caches incompletas: `renderModeContext()` actualiza toolbar; `renderTouchSpecialState()` actualiza el boton; `renderPauseSummary()` sigue construyendo el resumen completo.
- Mostrar `DUELO`, `ENTRENAMIENTO` o `CARRERA n/5`; Carrera usa `getArcadeFightNumber()` y el total configurado, no un numero hardcodeado fuera de i18n.
- Incluir el mismo modo/progreso al inicio de `pauseSummary` sin eliminar round, score, tiempo, dificultad, arena, rival o controles.
- El boton especial conserva `ESPECIAL/SPECIAL` como accion y añade estado corto `CARGA/CHARGING` o `LISTO/READY`.
- `renderTouchSpecialState()` es el unico escritor de su span de estado, `data-state`, `aria-disabled` y `aria-label`; se elimina el `data-i18n-aria` estatico del boton para evitar sobrescrituras.
- Aplicar `data-state="charging|ready"`, `aria-disabled="true|false"` y un nombre accesible como `Especial, cargando, energia 40 de 100`. No usar `disabled` ni live region para energia parcial.
- Mientras `aria-disabled` sea verdadero, el handler tactil/teclado del boton no crea una fuente `special`; teclado fisico y gamepad siguen pasando por la regla de energia normal del luchador.
- Añadir patron o trama para carga y forma/borde reforzado para listo. Movimiento reducido no altera la semantica.
- Cachear referencias DOM y firmas primitivas por superficie. Invocar los coordinadores una vez por RAF despues de `advanceSimulation()` y en transiciones sin frame; el criterio es cero mutaciones redundantes, no cero llamadas.
- La firma de toolbar incluye idioma, modo, fight y total. La del especial incluye idioma, energia, readiness y visibilidad. Pausa incluye gameState, idioma, round, score, segundos, dificultad, arena, rival y texto de controles.
- Cambiar idioma invalida las caches y ejecuta estos renderers al final de `renderLanguage()`.

### 8. Diagnostico local y ciclo de vida de audio

- No llamar `performance.now()`, escribir buffers ni resumir con debug apagado. Con debug activo, recoger solo en `playing`, congelar en menu/pausa y omitir el primer RAF despues de activar, resetear o reanudar.
- Mantener anillos por indice de maximo 1200 muestras para una ventana movil de al menos 10 s a 120 Hz. Mostrar numero de muestras y duracion cubierta; no usar `shift()`.
- Definir percentil nearest-rank: `sorted[Math.ceil(0.95 * n) - 1]`; con cero muestras mostrar `n/a`, con una usar esa muestra y redondear solo al presentar.
- Medir `rafDeltaMs`, `updateStepMs`, `simulationFrameMs`, `sceneDrawMs` y `frameWorkMs` directo. `frameWorkMs` cubre polling/input, batch de simulacion y escena, pero excluye el propio overlay debug.
- Conservar `rawDelta` en `gameLoop()` y pasarla a `advanceSimulation()`, que mantiene exactamente el cap actual. Contar por separado `frameClampDiscardMs`, `accumulatorCapDiscardMs` y residuo real `stepCapDiscardMs`.
- Exponer `stepsPerFrame`, `multiStepFrames` y `maxStepsPerFrame`; no llamar incidente a dos pasos normales de 30 Hz.
- Mostrar DPR reportado, DPR efectivo, tamaño CSS, backing store y megapixeles. La matriz raw 1/2/3 espera effective 1/2/2 por `MAX_DEVICE_PIXEL_RATIO`.
- Añadir en `audio.js` escalares siempre activos por grafo de tono: created, ended, active, oscillators/gains creados y desconectados, mas estado del `AudioContext` sin inicializarlo desde debug.
- Instalar `onended` antes de `start()`. El cleanup idempotente pone `o.onended = null`, desconecta oscilador/gain una vez y actualiza invariantes sin retener nodos.
- Proteger estos invariantes: `createdGraphs - endedGraphs === activeGraphs`, `oscillatorsCreated - oscillatorsDisconnected === activeGraphs` y `gainsCreated - gainsDisconnected === activeGraphs`.
- Mostrar solo un resumen compacto adicional en `drawDebugOverlay()`; no crear un panel DOM, descarga, localStorage o endpoint.
- Probar anillos acotados, gating, reset, percentil, descartes separados, DPR efectivo e invariantes de audio.
- Si `performance.now()` no existe, mostrar timings `n/a`; no usar `Date.now()` para costes submilisegundo.
- La equivalencia 30/60/120 usa una traza canonica inyectada por tiempo de simulacion en Node. Las ejecuciones reales registran navegador/dispositivo/Hz/DPR y no se presentan como la misma traza manual.
- Esta fase registra la dependencia visual de `visualFrame`; no cambia su reloj sin una tarea posterior basada en el resultado.

### 9. Validacion de primera sesion

- Ejecutar despues de pasar automatizacion y smoke, no antes de estabilizar el build.
- Reclutar al menos seis jugadores nuevos: dos teclado, dos touch y dos gamepad.
- Pedir sin coaching: iniciar, moverse, bloquear, ejecutar un combo y usar el especial.
- Registrar exito/fallo, input utilizado, punto de confusion y si el participante interpreta algun input como perdido.
- La puerta de salida es al menos cinco de seis completando todas las tareas y ninguna ruta con dos fallos.
- Si falla la puerta, corregir solo copy, foco, estado o buffer directamente relacionados y repetir el caso fallido. No introducir tutorial jugable ni ampliar a `#24` dentro de este plan.
- Mantener `#77` parcial: el estudio de profundidad con jugadores recurrentes pertenece a Fase 2/3.

## Archivos A Modificar

- `src/input.js`: politica de captura Tab/Escape y utilidades minimas de binding si hacen falta para nombres/slots.
- `src/fighter.js`: segundo input pendiente, orden de consumo y cancelacion atomica de la secuencia.
- `src/game.js`: politica global de teclado, foco/transiciones, modo/progreso, estado tactil, ancho CSS del HUD y metricas debug.
- `src/index.html`: spans localizables en touch, nombres de grupo/selects y destinos estaticos de foco.
- `src/styles.css`: foco de Canvas/dialogos, doble anillo, forced-colors y estados tactiles charging/ready.
- `src/i18n.js`: claves ES/EN de modo, estado tactil, nombres accesibles y feedback funcional.
- `src/hud_render.js`: presentacion compacta y texto de energia localizado.
- `src/fighter_render.js`: layout vertical seguro, medicion correcta y feedback funcional localizado.
- `src/audio.js`: contadores debug y desconexion de nodos al terminar.
- `tests/game.test.js`: mocks y regresiones de teclado, combos, foco, HUD, i18n, modo, touch, rendimiento y audio.
- `Readme.md`: comportamiento de combo, teclado nativo, modos visibles, touch especial y diagnostico debug.
- `AGENTS.md`: smoke durable de Fase 1 y contratos nuevos que futuras sesiones deben preservar.
- `BACKLOG.md`: actualizar solo estados y orden realmente entregados despues de validar.
- `plans/plan_0036_endurecimiento_interfaz_hud.md`: marcarlo sustituido por este rebase, sin afirmar implementacion.
- `plans/plan_0040_claridad_impacto_fase_1.md`: registrar resultados, validacion humana y riesgos residuales al ejecutar.

No se prevé modificar `src/config.js`, `src/ai.js`, `src/arena_render.js` ni `src/effects.js`. Si una implementacion descubre que necesita cambiar reglas o esos modulos, debe pausar y actualizar este plan antes de ampliar alcance.

## Plan De Implementacion

1. Establecer linea base y ampliar los mocks antes de cambiar comportamiento.
   Verificar: toda la suite actual pasa; el mock representa targets nativos, foco/scroll, toolbar, coordenadas Canvas, reloj y audio sin romper contratos existentes.

2. Escribir regresiones fallidas para `#72` y aplicar la politica de teclado.
   Verificar: Ctrl/Alt/Meta y Shift salvo Shift+Tab no crean acciones ni cancelan atajos; Ctrl+Tab/Ctrl+Shift+Tab/Shift+Escape pasan; selects/editor conservan teclas; Enter/Space respetan button/link/summary; pausa no previene en estados inactivos; keyup neutraliza; Tab sale de captura con foco valido.

3. Escribir regresiones de cadencia real para `#73` e implementar un unico pending input.
   Verificar: J-J, J-K y K-K aceptan el segundo input durante cooldown, salen en el primer tick legal y mantienen daño/cooldown actuales; no se fuerza cooldown a cero en las nuevas pruebas.

4. Cubrir cancelaciones e independencia de frame rate del buffer.
   Verificar: hit bloqueado/no bloqueado, block, crouch, jump, timeout, pausa, fin de ronda/partida y reset limpian toda la secuencia; el siguiente ataque es normal; mantener la tecla no duplica; una traza por tiempo de simulacion produce el mismo snapshot a 30/60/120 FPS.

5. Cerrar el inventario funcional ES/EN de `#69`.
   Verificar: grupos/selects touch-training, labels visibles, binding por accion/slot y feedback Canvas seleccionado existen en ambos idiomas; bromas tecnicas excluidas permanecen deliberadamente iguales.

6. Implementar modo/progreso y estado tactil de `#75` sobre esas claves.
   Verificar: Duelo, Entrenamiento y Carrera `1/5..5/5` aparecen correctamente en toolbar/pausa; especial cambia charging/ready, ARIA, patron y bloqueo tactil sin escrituras DOM redundantes.

7. Rebaselinar foco y dialogos del plan 0036.
   Verificar: menu, Ayuda, Controles, Onboarding, Pausa y Game Over reciben, contienen y restauran foco; Game Over tiene nombre/anuncio conciso; objetivos iniciales son visibles en baja altura; omitir onboarding restaura `main-menu`; iniciar/reiniciar/reanudar enfocan Canvas.

8. Implementar foco de alto contraste y navegacion de `summary`.
   Verificar: anillo oscuro mas halo amarillo supera 3:1 sobre papel; Tab y gamepad alcanzan `summary`; descendientes de details cerrado no reciben foco programatico; forced-colors conserva un indicador visible.

9. Implementar presentacion compacta del HUD y layout de marcadores.
   Verificar: portrait `390x844`, landscape `844x390`, baja altura `667x375` y desktop conservan 2:1; P1/CPU, vida, score y timer siguen distinguibles; badge/especial no invaden HUD ni canvas en salto/esquinas.

10. Completar diagnostico `#32` y lifecycle de audio.
    Verificar: debug apagado no toma timings; overlay reinicia muestra, anillos quedan en 1200, metricas se resumen una vez por segundo, descartes conservan limites, DPR raw/efectivo es correcto y residuos de grafos de audio vuelven a cero despues de `onended`.

11. Ejecutar validacion automatica y smoke multidispositivo completo.
    Verificar: no hay regresiones en Versus, Entrenamiento, Carrera, teclado, touch, gamepad, ES/EN, reduced motion, zoom, pausa, persistencia ni fixed-step.

12. Ejecutar la validacion de seis primeras sesiones y resolver solo fallos dentro de alcance.
    Verificar: se registra matriz anonima de resultados en el plan o documentacion de evaluacion, sin telemetria dentro del juego; se cumple la puerta o se declara Fase 1 incompleta.

13. Actualizar documentacion, backlog y estados de planes al final.
    Verificar: `#72`, `#73`, `#69`, `#75` y `#32` solo se marcan completados si pasan sus criterios; `#25` permanece Partial por preferencias/HUD semantico; `#77` permanece Partial por profundidad recurrente; plan 0036 figura sustituido y plan 0040 registra evidencia real.

## Pruebas Y Validacion

Validacion automatica obligatoria:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
git diff --check
```

Cobertura nueva de teclado:

- `Ctrl+P`, `Ctrl+L`, `Alt+ArrowLeft`, `Meta+Key`, Shift combinado, Ctrl+Tab, Ctrl+Shift+Tab y Shift+Escape no activan acciones ni llaman `preventDefault()`.
- Automatizado: flechas sobre selects/editor no crean fuentes de combate ni llaman `preventDefault()`; el cambio nativo real del select queda en smoke de navegador.
- Targets directos y descendientes de botones, enlaces, inputs, summary y contenido editable aplican la politica definida mediante `closest()`.
- Automatizado: Enter/Space sobre button/link/summary no crean combate ni se previenen; el click nativo real queda en smoke. Fuera de controles siguen siendo bindings durante `playing`.
- Pausa solo consume su binding en `playing/paused`; Escape conserva la matriz modal actual.
- Tab durante captura cancela y avanza/retrocede foco sin quedar atrapado.
- Keyup limpia una fuente aunque foco o modificadores hayan cambiado.

Cobertura nueva de combos:

- Cada combo se prueba con segundo input activo al menos un fixed-step al principio, mitad y ultimo tick legal de la recuperacion.
- Un input despues de la ventana ejecuta ataque normal, no combo.
- Solo se conserva un pending input; spam o tecla sostenida no duplica ataques.
- Hit bloqueado/no bloqueado, block, crouch, jump, pause, round over, game over y reset llaman la cancelacion atomica; el siguiente ataque sale normal.
- Casos de frontera: cooldown `2->1` encola; `1->0` ejecuta; comboTimer `1->0` expira; block/crouch/jump simultaneo con `1->0` cancela.
- Daño, cooldown, energia, feedback y estadisticas de combos existentes no cambian.
- Una traza canonica programada por tiempo de simulacion coincide a 30/60/120 FPS e incluye salud, energia, cooldown, comboTimer, pending, `lastAttackType` y combos registrados.
- Pruebas separadas confirman que teclado, pointer y gamepad producen la misma accion canonica; no se cruza toda la matriz fuente x combo x FPS.

Cobertura nueva de foco, responsive e i18n:

- Foco inicial y retorno para los seis dialogos, Canvas, inicio/reinicio/reanudacion y omision de onboarding.
- Tab desde Canvas enfoca Pausa; Shift+Tab desde Pausa enfoca Canvas; Ctrl+Tab no se captura.
- Tab/Shift+Tab ejercitan realmente `getFocusableElements()` con lista no vacia.
- Si el foco inicial estatico no esta en la lista, Tab va al primero y Shift+Tab al ultimo; gamepad hace lo equivalente y llama scroll nearest.
- Unitario: objetivo, orden, retorno y llamada a scroll son correctos. Visibilidad geometrica real a baja altura queda en smoke de navegador.
- `summary` entra en foco; hijos de details cerrado quedan fuera.
- Toolbar con altura 0 y 42 px, canvas CSS configurable y DPR raw/efectivo `1/1`, `2/2`, `3/2`.
- Umbral compacto: escala `0.649` activa y `0.65` no activa.
- HUD normal/compacto conserva coordenadas finitas y prioridades de informacion.
- El helper puro de markers prueba bounds de badge/panel/circulo: `left>=16`, `right<=984`, `top>=HUD_SAFE_BOTTOM` al recolocar, `bottom<=HEIGHT`, sin solape y finitos.
- Paridad ES/EN exige mismas claves y mismos placeholders; el inventario dinamico exacto produce feedback en el idioma seleccionado.
- Binding buttons incluyen accion, slot y nombre accesible localizado de `KeyA`, `ArrowLeft`, `Space` y `Enter`.
- Un ciclo ES->EN->ES conserva spans/glifos y actualiza texto/ARIA sin idioma anterior.
- Estados 0/99/100/0 de energia mutan DOM solo al cambiar valor; `aria-disabled`, nombre y bloqueo del boton coinciden. Teclado fisico/gamepad siguen usando la regla del Fighter.

Cobertura nueva de diagnostico/audio:

- Percentiles y contadores aceptan cero, una y multiples muestras.
- Anillos por indice no superan 1200 entradas y reportan `n`/duracion.
- Debug apagado no llama `performance.now()` ni toma muestras; off->on/reset/resume omite primer delta y reinicia de forma determinista.
- `advanceSimulation(1000)` conserva seis pasos y reporta 900 ms de frame clamp, mas caps separados, sin alterar estado esperado.
- `frameWorkMs` se mide directo y no se calcula sumando percentiles.
- Cada tono deja created=1 y active=1 antes de `fireEnded()`; despues desconecta oscilador/gain una vez, active=0, limpia handler y un segundo ended es no-op.
- Audio no disponible sigue siendo un no-op sin excepcion.

Smoke manual de escritorio:

- Probar menu, onboarding, ayuda, controles, inicio, pausa, ronda, Game Over, reinicio, Entrenamiento y cinco combates de Carrera.
- Usar Tab/Shift+Tab, Escape, Enter/Space, remapeos y atajos Ctrl/Alt/Meta; confirmar click nativo, cambio real de selects y cambio de pestaña/historial del navegador.
- Confirmar que Canvas recibe foco al iniciar/reanudar, los bindings funcionan desde el y Tab alcanza Pausa; abrir Pausa desde Canvas y boton restaura el origen correcto.
- Confirmar que un combo pulsado rapido ya no pierde el segundo input y que fuera de ventana sale el ataque normal.
- Cambiar ES/EN durante menu, pausa y despues de remapear; no quedan etiquetas funcionales en el idioma anterior.
- Activar debug con query y backtick; revisar metricas acotadas y que desactivarlo no cambia simulacion.

Smoke manual responsive/accesible:

- Viewports `390x844`, `844x390`, `667x375`, `1366x768` y `1440x900`.
- Zoom real de navegador 200% en escritorio y altura 320-400 CSS px: overlays sin overflow horizontal, acciones alcanzables, indicador de foco completo visible y scroll vertical usable.
- Cuatro rivales en suelo, salto y ambas esquinas; energia vacia/llena; reduced motion on/off.
- Touch simultaneo real, cancelacion de pointer y boton especial charging/ready.
- Gamepad estandar para combate, pausa, summary y dialogos.
- Windows High Contrast/forced-colors para foco y controles DOM; la auditoria completa del Canvas queda en `#26`.
- Pinch zoom movil iniciado sobre Canvas/controles permanece fuera de alcance y no se presenta como verificado.
- NVDA/Narrator/VoiceOver: Game Over recibe un nombre corto y un unico anuncio de resultado, no el resumen completo repetido.

Medicion tecnica:

- Antes de medir, registrar navegador/version, OS, CPU/GPU, alimentacion, viewport CSS, zoom, Hz real/emulado, DPR raw/efectivo, arena, reduced motion y estado del AudioContext.
- Escenario: `?debug=1&seed=42`, Entrenamiento, posicion close, CPU normal, timer off, arena serverDown, 10 s de calentamiento, reset de muestra y 60 s de captura. Indicar si las cinco corridas son por cada celda disponible.
- Medir raw DPR 1/2/3 como effective 1/2/2; DPR 3 valida el cap y no se presenta como coste de backing DPR 3.
- En Node, objetivo de simulacion: misma traza por tiempo de simulacion produce estado final identico a 30/60/120 y el tiempo aceptado concuerda con ticks, acumulador y `FIXED_STEP_MS`.
- En navegador, reportar `p95 frameWorkMs / (1000 / targetHz)`; debe ser menor que 1 en el equipo nombrado. Margenes adicionales se deciden despues de la baseline, no se presuponen.
- Reportar gaps RAF >25/50 ms como intervalos absolutos. Solo atribuirlos al juego si una traza de Performance muestra script/draw del juego como causa; a 30 Hz, >25 ms no es por si mismo fallo.
- Comparar debug off/on con profiler para cuantificar overhead de instrumentacion; no convertirlo en assert portable de CI.
- Objetivo de audio: despues de recibir todos los `ended` con pagina visible y contexto running, `activeGraphs`, osciladores pendientes y gains pendientes vuelven a cero. Un contexto suspended se registra y no cuenta como exito/fallo.
- Repetir el escenario de audio 20 min + 5 min de reposo y registrar created/ended/residuos. Los totales created/ended pueden crecer; los residuos activos no.
- Registrar resultados en el plan. No introducir quality preset, containment o workers si los umbrales se cumplen.

Validacion con usuarios:

- Dos nuevos con teclado, dos con touch y dos con gamepad.
- Tareas sin coaching: iniciar, mover, bloquear, combo, especial.
- Exito: cinco de seis completan todo y ningun dispositivo acumula dos fallos.
- Fracaso: input interpretado como perdido, imposibilidad de identificar especial listo, foco/contexto perdido o label incomprensible.
- Un fracaso mantiene Fase 1 abierta y solo habilita correcciones dentro del alcance definido.

## Documentacion

- `Readme.md`: documentar buffering de segundo input, prioridad de controles nativos, modo/progreso visible, estados touch del especial y campos nuevos de debug.
- `Readme.md`: actualizar limitaciones de tests y smoke para foco visible, toolbar real, HUD compacto y audio lifecycle.
- `AGENTS.md`: documentar la precedencia exacta de modificadores/targets nativos, que pending combo es parte de simulacion fija, que DOM touch evita mutaciones redundantes y que debug no persiste datos.
- `AGENTS.md`: ampliar smoke con remapeo Enter/Space, Tab en captura, dialogos bajos, modos, especial charging/ready y metricas.
- `BACKLOG.md`: actualizar estados y orden solo despues de completar automatizacion, smoke, mediciones y puerta de usuarios.
- `plans/plan_0036_endurecimiento_interfaz_hud.md`: ya queda marcado `Sustituido por plan 0040`; conservarlo como historial y no ejecutarlo en paralelo.
- `plans/plan_0040_claridad_impacto_fase_1.md`: registrar commits, comandos, conteo final de pruebas, mediciones, muestra de usuarios y cualquier desviacion.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: una precedencia nativa demasiado amplia bloquea combate. Mitigacion: Canvas es foco de juego; inputs/selects/editor reservan todo, button/link/summary solo Enter/Space, y otros bindings siguen llegando durante `playing`.
- Riesgo: Tab durante captura pierde el punto de navegacion al rerenderizar. Mitigacion: identificar botones por accion/slot, reconstruir y mover foco explicitamente en la lista nueva.
- Riesgo: el buffer convierte inputs accidentales en combos. Mitigacion: un solo pending, solo con primer input y ventana vivos, sin reiniciar timer y con cancelacion agresiva por defensa/hit/salto.
- Riesgo: cambiar el orden de update altera frame exacto del combo. Mitigacion: escribir limites por tick antes de implementar y comparar 30/60/120 con daño/cooldown sin cambios.
- Riesgo: feedback adicional satura combate. Mitigacion: reutilizar hint existente y no emitir flash/sonido hasta ejecutar el combo.
- Riesgo: Canvas enfocable se anuncia como imagen interactiva confusa. Mitigacion: conservar nombre localizado descriptivo, no usar `role="application"`, mostrar foco visible y validar lectura con AT.
- Riesgo: enfocar titulos cambia expectativas de usuarios recurrentes. Mitigacion: limitarlo a dialogos largos y mantener retorno al control de origen.
- Riesgo: scrollIntoView causa saltos. Mitigacion: usar `nearest`, no `start`, y recuperar Canvas con `preventScroll` al volver al combate.
- Riesgo: HUD compacto oculta identidad. Mitigacion: omitir solo texto redundante y usar P1/CPU; conservar porcentajes, barras, marcador, timer y badges seguros.
- Riesgo: mover badges debajo de un luchador aereo tapa accion. Mitigacion: usar dos slots definidos, probar sprites/ataques y no tocar posiciones de simulacion.
- Riesgo: `aria-disabled` no coincide con comportamiento. Mitigacion: impedir que el boton tactil cree la fuente especial mientras carga y mantenerlo enfocable.
- Riesgo: localizacion crece hacia todos los textos decorativos. Mitigacion: inventario cerrado de feedback funcional; `404`, P1/CPU, nombres y bromas quedan fuera.
- Riesgo: instrumentacion degrada FPS. Mitigacion: recoger solo con debug, buffers fijos y resumen una vez por segundo.
- Riesgo: `performance.now()` no existe. Mitigacion: mostrar timings `n/a`; no usar un reloj de baja resolucion ni polyfills.
- Riesgo: desconectar audio cambia el timbre o contadores quedan negativos tras reset. Mitigacion: cleanup idempotente solo en `onended`, escalares de pagina no reseteables, handler nulo y comparacion de perfiles existentes.
- Riesgo: el estudio de seis usuarios se interpreta como evidencia estadistica. Mitigacion: usarlo como puerta de usabilidad cualitativa, registrar limitaciones y dejar balance/profundidad a `#77` posterior.
- Riesgo: el plan agrupa demasiados cambios para un commit seguro. Mitigacion: limites de commit por item funcional, pruebas focales antes de cada commit y suite completa al integrar.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` durante la redaccion.

- El alcance se limita a los seis items de Fase 1 y al piloto de primera sesion necesario para cerrarla.
- Se elimino del rebase la referencia obsoleta a `syncDuelSettingsLayout()` y no se traslado la sincronizacion responsive de `<details>` porque no forma parte del backlog actual de Fase 1.
- `#24`, `#74`, `#26` completo, IA, trials y GLITCH CANCEL quedan explicitamente fuera.
- El buffer usa un campo y una ruta de consumo; no crea una cola generica, command bus ni sistema de cancelaciones.
- La politica de teclado usa un helper de precedencia y enfoca Canvas; no cambia toda la arquitectura de entrada ni intenta capturar taps entre ticks.
- El HUD compacto reutiliza `resizeCanvas()`, placas y `HUD_SAFE_BOTTOM`; no añade un segundo renderer ni HUD DOM.
- La UI conserva tres renderers pequeños con firmas completas; no introduce un store reactivo ni efectos DOM dentro de `Fighter`.
- El diagnostico extiende el overlay existente, permanece local, acotado y apagado por defecto.
- Cada cambio comienza por una regresion que falla y termina con criterio automatizado/manual concreto.
- Las suposiciones discutibles, especialmente precedencia nativa, alcance de edges observables, cancelacion atomica y umbral compacto, quedan explicitas y medibles.
- Rendimiento real, acciones nativas, foco visible, forced colors, AT, touch, gamepad y usuarios se marcan manuales; Node no pretende simular resultados de navegador/hardware.
- No se añaden dependencias, persistencia nueva, backend ni compatibilidad especulativa.

## Criterios De Aceptacion

- Ctrl/Alt/Meta, Shift salvo Shift+Tab, flechas en selects/editor y Enter/Space en button/link/summary no producen acciones de combate ni se cancelan incorrectamente.
- Escape, pausa, remapeo, keyboard, touch y gamepad conservan su politica documentada.
- Tab cancela captura de binding y continua navegacion con foco visible.
- J-J, J-K y K-K aceptan un segundo input temprano, lo ejecutan en el primer tick legal y conservan balance actual.
- La secuencia completa de combo se limpia en todas las interrupciones definidas; una traza fija es equivalente a 30/60/120 FPS.
- Inicio, reinicio, siguiente combate, onboarding final y reanudacion enfocan Canvas; omitir onboarding restaura el menu modal.
- Tab desde Canvas llega a Pausa y Shift+Tab desde Pausa vuelve a Canvas sin capturar Ctrl+Tab.
- Dialogos largos enfocan contexto superior visible y contienen/restauran foco en baja altura y zoom 200%.
- Foco DOM tiene outline verificable de al menos 3:1, regla forced-colors y `summary` funciona con teclado/gamepad.
- Game Over usa encabezado corto, resumen no-live y un unico anuncio conciso.
- HUD compacto conserva P1/CPU, vida, score y timer distinguibles; barras y especial mantienen señal redundante.
- Badges, especial listo y textos flotantes no invaden HUD ni salen del canvas en suelo/salto/esquinas.
- Grupos touch/training, selects, botones/nombres de tecla y el inventario cerrado de feedback estan localizados con claves/placeholders pares en ES/EN.
- Toolbar y pausa muestran modo/progreso correcto; especial tactil diferencia carga/listo con texto, patron y ARIA.
- El boton tactil de especial no dispara mientras carga y vuelve a operar al alcanzar energia completa.
- Debug reporta ventanas acotadas, delta bruto/caps, frameWork y DPR raw/efectivo sin persistencia/red ni cambio de simulacion.
- Grafos Web Audio terminados se desconectan una vez y los tres residuos activos vuelven a cero.
- Los umbrales tecnicos se miden y registran; optimizaciones no justificadas no se implementan.
- Cinco de seis usuarios nuevos completan las tareas y ninguna entrada acumula dos fallos.
- `#72`, `#73`, `#69`, `#75` y `#32` se cierran solo con evidencia; `#25` y `#77` conservan el resto pendiente.
- Toda la sintaxis, `node --test tests\game.test.js` y `git diff --check` pasan.
- README, AGENTS, BACKLOG y estados de planes reflejan exactamente lo entregado.

## Commit Y Push

Si la ejecucion se divide en commits, usar limites funcionales:

1. `Preserve native keyboard behavior`
   Incluye `#72`, sus tests y documentacion directa.
2. `Buffer valid combo follow-ups`
   Incluye `#73`, pruebas por tick y documentacion de combos.
3. `Harden phase-one combat clarity`
   Incluye foco/HUD rebaselinado de `#25`, `#69` y `#75` con tests visuales/DOM.
4. `Add bounded performance diagnostics`
   Incluye `#32`, lifecycle de audio y mediciones automaticas.
5. `Complete phase-one validation docs`
   Incluye resultados de smoke/usuarios y actualizacion final de README, AGENTS, BACKLOG y planes.

Ejecutar pruebas focales antes de cada commit y la validacion completa antes del ultimo. No hacer commit ni push salvo solicitud explicita durante la implementacion.

## Estado De Implementacion

Pendiente.
