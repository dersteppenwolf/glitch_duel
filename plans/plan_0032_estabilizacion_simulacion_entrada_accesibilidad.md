# Exec Plan: estabilizacion de simulacion entrada y accesibilidad

## Objetivo

Implementar en orden los items `#62`, `#63`, `#64`, `#65` y `#66` del backlog para que el combate use una simulacion fija a 60 Hz independiente de la frecuencia de render, la separacion entre luchadores use las pushboxes por postura, las entradas no queden retenidas al interrumpir la pagina y los controles tactiles sean botones nativos sin bloquear el desplazamiento de los overlays.

La experiencia del jugador cambia de forma concreta: la misma secuencia de juego conserva movimiento, cooldowns, combos, hit-stun, decisiones de CPU y tiempo de ronda a 30/60/120 FPS; dos personajes no se atraviesan segun su postura; ocultar la pestana pausa la partida y libera controles; y los controles tactiles son operables como botones reales mientras los paneles largos se pueden desplazar verticalmente.

Queda fuera del alcance agregar replay determinista o RNG sembrado (`#6`), una UI de depuracion (`#10`), remapeo/gamepad (`#4`), focus trap o preferencias avanzadas de accesibilidad (`#25`), nuevos ataques, cambios de balance intencionales, animaciones nuevas, dependencias, bundler o un cambio de coordenadas logicas `1000x500`.

## Contexto Actual

- `src/game.js` calcula `deltaMs` en `gameLoop()`, pero llama `update(deltaMs)` una sola vez por render. `update()` descuenta un timer de ronda por milisegundos y llama a `Fighter.update()` una vez, por lo que fisica, cooldowns, combos, hit-stun, IA e intro dependen de FPS.
- `src/fighter.js` expresa fisica y temporizadores en ticks de 60 Hz: velocidad horizontal por update, gravedad `0.9`, `attackCooldown`, `comboTimer`, `hitStun`, `aiDecisionTimer` y `aiCounterTimer`. Ya expone `getHurtBox()`, el alias compatible `getBodyBox()`, `getPushBox()` y `getHitBox()`.
- `checkCollision()` en `src/game.js` ignora esas cajas y separa segun una distancia fija de 65 y una altura fija de 80; no considera crouch, penetracion horizontal real ni distribucion contra paredes.
- `setupKeyboardControls()` solo registra `keydown`/`keyup`. `setupMobileControls()` usa eventos `touchstart`/`touchend` y eventos de raton por separado. No se liberan teclas en `blur`, `visibilitychange`, `pointercancel` o perdida de captura.
- `pauseGame()` ya limpia `keys` y detiene la simulacion al cambiar `gameState` a `paused`; no hay una ruta silenciosa ni listener de pagina oculta. `resumeGame()` es la unica transicion de vuelta a `playing`.
- `src/index.html` usa `div role="button"` para los ocho controles tactiles. `src/styles.css` bloquea toda accion tactil desde `body { touch-action: none; }`; los menus y ayuda ya tienen algunos contenedores con overflow, pero pausa y el game-over no tienen una politica consistente de pan vertical para pantallas bajas.
- `tests/game.test.js` construye mocks DOM y expone funciones del juego. Cubre cajas por postura y el timer por delta, pero no compara la simulacion entre tasas de render, no prueba la resolucion de pushboxes, ni eventos de interrupcion de entrada/puntero/visibilidad.
- `Readme.md` declara actualmente que solo el timer usa delta time y que cooldowns, combos, hit-stun, hit-stop y timers visuales permanecen por frame. `AGENTS.md` conserva el smoke test que debe actualizarse al comportamiento de pestaña oculta y controles tactiles.

Suposiciones explicitas:

- Una simulacion de 60 Hz conserva los valores y el balance actuales porque las constantes existentes ya se calibraron por tick de 60 Hz.
- El loop limitara tanto el delta acumulado como la cantidad de pasos por frame para evitar una espiral de recuperacion tras una pausa. El excedente no se simulara como combate retroactivo; al volver visible o reanudar se reiniciara el reloj de render.
- Los efectos puramente dibujados por render, como el contador de `visualFrame` y el decaimiento de `screenShake` en `draw()`, no son reglas de combate y no forman parte de la equivalencia 30/60/120. Los timers que afectan estados o feedback de simulacion continuaran por tick fijo.
- `#65` se limita a Pointer Events para interaccion de controles tactiles. El teclado principal conserva sus listeners globales actuales; no se crea aun un modelo general de acciones.

## Diseño Propuesto

### 1. Simulacion fija para `#62`

- Agregar en `src/config.js` constantes pequenas y explicitas: paso fijo de `1000 / 60`, delta maximo acumulable y maximo de pasos por frame. Mantener `ROUND_TIMER_FRAMES` como representacion derivada de 60 Hz y eliminar el doble origen de verdad del avance de combate.
- Separar el avance de simulacion de la presentacion en `src/game.js`:
  - `gameLoop(timestamp)` mide tiempo de pared, lo acota, lo suma a un acumulador y ejecuta cero o mas pasos fijos.
  - Un helper de un paso, conservando el nombre `update()` si reduce consumidores, ejecuta una sola iteracion de juego de 60 Hz. `Fighter.update()`, colisiones, efectos, intro, hit-stop y timer avanzan solo desde ese helper.
  - `draw()` se mantiene una vez por `requestAnimationFrame`; no ejecuta fisica ni IA.
  - Al pausar, volver visible, empezar ronda o reiniciar, se limpia el acumulador y se reinicia `lastFrameTimestamp` para que una pausa o una pestana suspendida no produzca catch-up.
- Hacer que `roundTimeMs` baje un paso fijo por tick. `roundTimerFrames` seguira reflejando el techo del tiempo restante para HUD y pruebas. No se conservara la API implicita de avanzar combate arbitrariamente con `update(2500)`; las pruebas utilizaran un helper explicito que alimenta el acumulador con timestamps/deltas de render o ejecuta un numero conocido de ticks.
- Mantener los valores actuales por tick de `Fighter`, IA y ataques. No convertir cada propiedad a segundos ni introducir interpolacion, porque eso duplicaria una simulacion que ya esta calibrada a 60 Hz.

### 2. Pushboxes y regresiones para `#63`

- Sustituir la heuristica de distancia fija de `checkCollision()` por una interseccion entre `player1.getPushBox()` y `player2.getPushBox()`.
- Si las cajas no se intersectan vertical u horizontalmente, no aplicar separacion. Si se intersectan, resolver solo la penetracion horizontal por el ancho real de solape.
- Determinar izquierda/derecha por los centros de las pushboxes. Repartir la correccion entre ambos luchadores; cuando uno quede limitado por el clamp de arena, transferir el desplazamiento restante al otro. Reaplicar el clamp horizontal existente para conservar limites de `x` en `[50, WIDTH - 50]`.
- No usar `facingRight` para cambiar la geometria de la pushbox, ya que las cajas actuales son simetricas. Cubrir en pruebas que la orientacion se actualiza correctamente al cruzar/estar enfrentados y que no cambia la resolucion de separacion; una pushbox direccional seria una decision de balance posterior, no parte de este item.
- No cambiar hurtboxes, hitboxes, dano, cooldowns ni comportamiento de ataque. `getBodyBox()` se conserva como alias para pruebas y consumidores existentes.

### 3. Recuperacion de entrada y pagina inactiva para `#64`

- Centralizar la limpieza en `clearActiveInput()`: vacia `keys`, olvida punteros activos, restaura cualquier estado visual de boton presionado y libera captura de puntero cuando exista. Invocarlo desde transiciones existentes que abandonan juego activo y desde todos los eventos de interrupcion.
- Registrar `window.blur` para limpiar entrada. Registrar `document.visibilitychange` para limpiar entrada siempre y, solo si `document.hidden` y `gameState === 'playing'`, pausar mediante una variante silenciosa de `pauseGame()`; no se llamara a `resumeGame()` automaticamente al volver visible.
- Reemplazar los manejadores tactiles/ratón por una unica ruta Pointer Events. En `pointerdown`, registrar `pointerId -> accion`, solicitar captura cuando este disponible, inicializar audio y poner la accion en `keys`. En `pointerup`, `pointercancel` y `lostpointercapture`, retirar solo esa accion. Mantener soporte multitouch independiente por accion.
- Los botones recibirian `keydown`/`keyup` propios solo para activar/liberar mediante Espacio o Enter cuando tengan foco, sin modificar el mapeo global de combate. Ignorar repeticiones de `keydown` y prevenir el `click` sintetico de dejar una entrada retenida. Este manejo queda local a los botones, no es una abstraccion de input compartida.

### 4. Botones nativos y scroll para `#65` y `#66`

- Cambiar cada control `div.btn[role=button]` por `<button type="button" class="btn">`. Conservar IDs, etiquetas `data-i18n-aria`, texto y agrupacion actual para no romper i18n ni `setupMobileControls()`.
- Ajustar CSS para resetear el estilo nativo de los botones y conservar las dimensiones, contraste, estados `:active` y `:focus-visible` actuales. `disabled` no se agrega: el estado de juego ya oculta el grupo fuera de `playing`.
- Quitar `touch-action: none` de `body`. Aplicarlo solamente a `canvas`, `#controls` y `.btn`, donde el gesto controla combate. Dar `touch-action: pan-y` a `.panel-overlay`, sus cards desplazables y `#game-over`.
- Generalizar el limite de altura y `overflow: auto` de los paneles para menu, ayuda y pausa en viewport bajo, preservando safe areas. Mantener el game-over desplazable y con pan vertical. No permitir scroll del documento de fondo mientras un overlay este abierto.

## Archivos A Modificar

- `src/config.js`: declarar constantes de paso fijo y limites de acumulacion de simulacion.
- `src/game.js`: desacoplar loop de render/simulacion, resolver pushboxes, centralizar limpieza de input, manejar visibilidad/blur y migrar controles a Pointer Events.
- `src/fighter.js`: solo ajustar si la resolucion necesita un helper minimo de clamp/pushbox; preservar la geometria y reglas existentes.
- `src/index.html`: sustituir controles tactiles por botones semanticos sin cambiar IDs ni etiquetas localizadas.
- `src/styles.css`: limitar `touch-action: none` a superficies de juego, mantener el aspecto de botones y habilitar pan/scroll vertical en overlays.
- `tests/game.test.js`: ampliar mocks y API de prueba; cubrir equivalencia de simulacion, pushboxes, interrupciones y eventos de puntero.
- `Readme.md`: actualizar arquitectura tecnica, comportamiento de pausa por pestana oculta, controles tactiles y estado de los cinco items.
- `AGENTS.md`: actualizar smoke test para pausa por pestaña oculta, cancelacion de puntero y scroll de overlays, si el flujo manual cambia de forma durable.
- `BACKLOG.md`: mover `#62` a `#66` a completados solo al terminar los criterios de este plan y desbloquear dependencias directas.
- `plans/plan_0032_estabilizacion_simulacion_entrada_accesibilidad.md`: registrar el estado y resultados de implementacion cuando se ejecute.

## Plan De Implementacion

1. Crear primero helpers de prueba para conducir el loop con una secuencia de deltas/timestamps y capturar un snapshot de combate estable.
   Verificar: el fixture puede iniciar una ronda sin intro, ejecutar una secuencia fija de entradas y comparar posicion, salud, energia, estados, cooldowns, timers de combo/hit-stun/IA y tiempo restante sin depender de `draw()`.

2. Introducir constantes de paso fijo y transformar `gameLoop()` en acumulador acotado con un helper de paso de 60 Hz.
   Verificar: una misma ventana de tiempo con renders a 30, 60 y 120 FPS ejecuta exactamente 60 ticks por segundo y produce el mismo snapshot de combate con aleatoriedad controlada por la prueba.

3. Migrar timer de ronda, intro, hit-stop y efectos de simulacion al paso fijo, y limpiar reloj/acumulador al iniciar, pausar, reanudar, terminar ronda y retornar de visibilidad.
   Verificar: cooldown, ventana de combo, hit-stun, decision de IA, distancia recorrida y timer coinciden entre 30/60/120; una pausa larga no descuenta tiempo ni genera movimiento retroactivo al reanudar; el limite de pasos evita una espiral tras un frame largo.

4. Añadir regresiones de pushboxes antes de cambiar `checkCollision()`.
   Verificar: standing-standing se separa por el solape real; crouch usa su ancho/altura menor; luchadores a distinta altura no reciben empuje; casos enfrentados/cambiando orientacion conservan una separacion estable; y un luchador en cada esquina no cruza el limite ni deja solape evitable.

5. Implementar la resolucion horizontal mediante `getPushBox()` con reparto de penetracion y transferencia al rival bloqueado por pared.
   Verificar: las pruebas del paso anterior pasan sin modificar hitboxes/hurtboxes, y `getBodyBox()` conserva el comportamiento cubierto hoy.

6. Exponer `clearActiveInput()` y conectar `blur`, `visibilitychange`, `pointercancel` y perdida de captura; introducir pausa silenciosa para ocultacion de pagina.
   Verificar: una tecla de movimiento/bloqueo se libera tras blur; una partida activa se pausa, limpia input y muestra el overlay al ocultar la pagina; volver visible no reanuda; los estados menu, paused, roundOver y gameOver no se alteran indebidamente.

7. Cambiar HTML y JavaScript de los controles a botones y Pointer Events con seguimiento por `pointerId` y captura defensiva.
   Verificar: dos controles simultaneos mantienen dos acciones; terminar o cancelar un puntero libera solo su accion; `lostpointercapture` no deja movimientos retenidos; pulsar Espacio/Enter sobre un boton no deja una accion activa; los IDs e i18n existentes permanecen validos.

8. Ajustar CSS para controles nativos y scroll vertical limitado a overlays.
   Verificar: canvas y botones no hacen pan/zoom durante combate; menu, ayuda, pausa y game-over se desplazan verticalmente en una pantalla tactil de poca altura; el cuerpo de fondo no se desplaza; foco visible de botones sigue siendo perceptible.

9. Actualizar documentacion y backlog una vez superada la validacion.
   Verificar: `Readme.md` deja de afirmar que el combate depende de frames, documenta pausa por pestana oculta y controles tactiles nativos; `AGENTS.md` incluye las comprobaciones manuales persistentes; `BACKLOG.md` marca `#62`-`#66` completados, elimina sus dependencias satisfechas y promueve el siguiente item recomendado real.

10. Ejecutar validacion automatica, revisar diff y hacer smoke test en escritorio y movil.
   Verificar: no hay cambios fuera del alcance, todos los scripts pasan sintaxis y la suite cubre los cinco items.

## Pruebas Y Validacion

Validacion automatica:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
```

Pruebas unitarias nuevas o ajustadas:

- La misma secuencia controlada de inputs y aleatoriedad produce el mismo snapshot tras un segundo a 30, 60 y 120 FPS.
- Movimiento, cooldown, combo window, hit-stun, hit-stop, decision de IA y reloj de ronda consumen 60 ticks por segundo, no renders.
- Un frame largo esta limitado; pausar/reanudar y visibilidad no consumen backlog temporal.
- Pushboxes de pie, crouch, aire, orientacion y esquinas no dejan superposicion horizontal resoluble ni rompen los clamps.
- `blur` y `visibilitychange` limpian entrada; pagina oculta pausa solo una partida activa y nunca reanuda por si sola.
- Pointer Events soportan down/up/cancel/lost capture y multitouch; los mocks incluyen `document.hidden`, eventos de `document`, captura de puntero y opciones de listener necesarias.
- El contrato HTML confirma que los controles tactiles son ocho `button[type=button]`, no `div[role=button]`, conservan IDs y etiquetas accesibles.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: sustituir la descripcion de timer por simulacion fija de 60 Hz, documentar pausa cuando la pagina deja de estar visible y actualizar controles tactiles/estado del backlog.
- `AGENTS.md`: ampliar el smoke test con interrupcion de ventana/pestana, cancelacion de puntero y scroll de overlays; conservar los comandos de validacion si no cambian.
- `BACKLOG.md`: cerrar `#62`, `#63`, `#64`, `#65` y `#66`, ajustar la secuencia recomendada y eliminar bloqueos ya satisfechos de items dependientes.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: acumular demasiado tiempo tras throttling provoca una espiral de actualizaciones o un combate acelerado. Mitigacion: acotar delta y pasos por frame, descartar excedente y reiniciar reloj/acumulador al pausar, reanudar o retornar visible.
- Riesgo: cambiar de `update(deltaMs)` a ticks rompe pruebas o consumidores internos. Mitigacion: crear helpers de prueba explicitos, migrar todos los tests afectados en el mismo cambio y no conservar una API ambigua de dos semanticas.
- Riesgo: la equivalencia 30/60/120 quede afectada por `Math.random`. Mitigacion: en pruebas controlar/restaurar `Math.random` con una secuencia reproducible; el item `#6` sigue siendo el lugar para RNG sembrado de producto.
- Riesgo: pushbox resuelta contra una pared produce jitter o desplaza al luchador equivocado. Mitigacion: usar penetracion real, centro de caja para orden estable, clamp y transferencia del sobrante; cubrir esquinas y postura antes de implementar.
- Riesgo: dos punteros o cancelaciones dejan `keys` en estado incorrecto. Mitigacion: mapear cada `pointerId` a su accion, limpiar globalmente ante interrupciones y probar `pointercancel`/`lostpointercapture`.
- Riesgo: usar botones nativos modifica dimensiones o comportamiento tactil. Mitigacion: reset CSS limitado a `.btn`, conservar IDs/clases/dimensiones y probar foco, pointer y multitouch en movil.
- Riesgo: permitir `pan-y` reintroduce scroll accidental durante combate. Mitigacion: mantener `touch-action: none` solo en canvas, grupo de controles y botones; permitirlo exclusivamente en overlays desplazables.
- Riesgo: ampliar accesibilidad hacia dialogs completos aumenta el alcance. Mitigacion: limitar este plan a semantica de boton, foco visible existente y scroll; dejar focus entry/restore, containment e inert para `#25`.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

- El plan reduce el cambio a cuatro entregables necesarios y respeta el orden de dependencias del backlog.
- No convierte el motor completo a unidades en segundos: conserva el tick de 60 Hz que ya define el balance y agrega solo un acumulador acotado.
- No modifica cajas ofensivas ni balance para resolver `#63`; usa la API de pushbox ya existente y protege el comportamiento con regresiones concretas.
- Las suposiciones relevantes sobre frames de render, aleatoriedad de pruebas, limites de catch-up, orientacion y alcance de accesibilidad estan explicitadas.
- Cada fase tiene pruebas automatizables y una comprobacion manual observable.
- No incorpora dependencias, build steps ni abstracciones de input o IA que pertenecen a items futuros.

## Criterios De Aceptacion

- Una secuencia de combate equivalente a 30, 60 y 120 FPS conserva movimiento, cooldowns, combos, hit-stun, hit-stop, decisiones de IA y tiempo de ronda dentro del mismo snapshot de ticks.
- El loop tiene acumulador, limites de catch-up y no avanza combate retroactivamente despues de pausa o pagina oculta.
- `checkCollision()` usa `getPushBox()` y las regresiones cubren pie, crouch, aire, orientacion y esquinas.
- Blur, pagina oculta, cancelacion y perdida de captura liberan entradas; ocultar una partida la pausa y nunca la reanuda automaticamente.
- Los ocho controles tactiles son botones nativos con IDs, texto y etiquetas accesibles conservados; Pointer Events permiten acciones simultaneas y no dejan estados retenidos.
- Solo canvas y controles de combate bloquean gestos tactiles; menu, ayuda, pausa y game-over se pueden desplazar verticalmente en viewport bajo.
- `Readme.md`, `AGENTS.md` y `BACKLOG.md` reflejan exactamente el comportamiento entregado.
- La comprobacion de sintaxis de todos los `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan.

## Commit Y Push

- Commits recomendados, cada uno tras validacion relevante:
  - `Stabilize fixed-step combat simulation`
  - `Resolve posture-aware pushbox collisions`
  - `Recover interrupted game input`
  - `Make touch controls accessible`
- Si se prioriza una unica entrega, usar un solo commit funcional despues de completar los cinco criterios: `Stabilize combat and touch controls`.
- No hacer push salvo solicitud expresa del usuario.

## Estado De Implementacion

Implementado localmente el 2026-07-31.

- Completado `#62`: `gameLoop()` acumula tiempo y ejecuta pasos fijos de 60 Hz, con delta y cantidad de pasos acotados. La simulacion reinicia su reloj al iniciar ronda, pausar, reanudar, terminar ronda y volver visible.
- Completado `#63`: `checkCollision()` resuelve el solape horizontal de `getPushBox()` y transfiere el desplazamiento al rival cuando una pared limita al otro luchador.
- Completado `#64`: blur, visibilidad, cancelacion y perdida de captura limpian input; ocultar una partida activa abre pausa silenciosamente y no la reanuda al volver.
- Completado `#65`: los ocho controles tactiles son botones nativos y usan Pointer Events con captura, multitouch y activacion por foco.
- Completado `#66`: solo canvas y controles de combate bloquean gestos; los overlays y game-over permiten pan vertical y scroll interno.
- Completado: `Readme.md`, `AGENTS.md` y `BACKLOG.md` reflejan el comportamiento, los criterios completados y las dependencias desbloqueadas.

Validacion local ejecutada:

- `node --check` para todos los archivos `src\*.js`: correcto.
- `node --test tests\game.test.js`: 77 pruebas superadas.
- `git diff --check`: correcto.

Plan cerrado el 2026-07-31 con validacion automatizada completa por solicitud del usuario.

La validacion humana residual de escritorio, movil, gestos y hardware se transfirio exclusivamente al plan `0043`.
