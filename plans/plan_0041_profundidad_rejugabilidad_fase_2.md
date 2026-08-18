# Exec Plan: fase 2 profundidad y rejugabilidad

## Objetivo

Implementar la segunda fase de la hoja de ruta para que repetir GLITCH DUEL produzca aprendizaje, objetivos de dominio y rivales menos explotables, sin convertir el juego en un sistema de progresion artificial ni abandonar su arquitectura ligera.

El alcance ejecutable se divide en entregables con gates:

- `#77`: completar primero la validacion de primera sesion y profundidad recurrente sobre la baseline actual.
- `#9`: cuatro trials dentro del Entrenamiento existente, sin crear otro modo ni otra simulacion.
- `#24`: Ayuda y onboarding conscientes del input reciente, conservando teclado, touch y gamepad visibles.
- `#74`: estado de combate DOM visible/no-live y consulta explicita remapeable.
- `#16`: tacticas contextuales rule-based solo si `#77` identifica un fallo reproducible de profundidad.
- `#17` y `#19`: permanecen bloqueados hasta que el estudio y un escenario determinista justifiquen tempo/anti-turtle o uso posicional del especial.

La experiencia cambia de forma observable:

- Un jugador nuevo puede iniciar Duelo, Entrenamiento o Carrera, recorrer onboarding y continuar exactamente al modo solicitado.
- Ayuda explica bindings reales de teclado, controles touch y mapping estandar de gamepad sin ocultar alternativas en equipos hibridos.
- Entrenamiento ofrece cuatro objetivos guiados que validan reglas reales de combate: combos, crouch-punish, block-counter y carga/gasto del especial.
- Vida, energia, ronda, marcador, tiempo, direccion y distancia del rival se pueden consultar desde DOM ampliable y bajo demanda sin speech continuo.
- Si la evidencia autoriza `#16`, la CPU puede reconocer whiffs, usar crouch de forma arriesgada, elegir un ataque aereo legal y realizar un bait corto sin arboles, scoring o lookahead.
- La misma seed, estado inicial y traza de acciones conserva resultado de combate, progreso de trial y decisiones de IA a 30/60/120 FPS.

Queda fuera del alcance:

- Nuevos ataques, combos, estilos, rivales, arenas, hazards, guard break, throws o GLITCH CANCEL.
- Startup/active/recovery, cancel windows, frame data, input history, ghosts o replay `#33`.
- Un `gameMode = 'trials'`, una segunda fisica, hitboxes paralelas o deteccion de objetivos desde textos/pixeles.
- Logros, misiones, monedas, recompensas diarias, ranking, mejor tiempo o persistencia de trials antes de `#22` reset visible.
- Personalidades `#23`, adaptacion entre rondas `#49`, IA por scoring/FSM/utility, machine learning o cambios de arquitectura.
- Implementar `#17` o `#19` sin actualizar este plan con la evidencia concreta que activa su gate.
- Cambiar daño, cooldown, chip, energia, timer de ronda, hit-stop o balance general `#48`.
- Completar preferencias de contraste `#25/#26`, audio `#30`, rendimiento restante `#32`, PWA o distribucion.
- Telemetria remota, backend, dependencias, build step, framework o almacenamiento de investigacion dentro del juego.

## Contexto Actual

- La baseline despues del plan 0040 pasa `115/115` pruebas, sintaxis de todos los JS y el gate sin build de GitHub Pages.
- `#72`, `#73`, `#25`, `#69`, `#75` y `#32` tienen implementacion automatizada, pero conservan smoke fisico/AT/rendimiento pendiente. El plan 0040 registra Fase 1 como Partial.
- `#77` figura correctamente `Ready`: su alcance esta definido, pero todavia no se ejecutaron las cohortes. Pasa a Partial al registrar una y a Completed solo al registrar ambas con decisiones.
- Entrenamiento ya usa `gameMode = 'training'`, `Fighter`, `update()`, fixed-step, colisiones y HUD normales. Tiene posicion, CPU idle/block/normal, timer, reset, vida y energia.
- En entrenamiento, KO/timeout resetean sin score, stats, historial ni Game Over. Esta exclusion debe conservarse para trials.
- Los eventos existentes son contadores agregados: combos, bloqueos, especiales y ataques aereos. No contienen tipo de combo, actor, outcome hit/block/whiff, daño real, postura o tick.
- `Fighter.attack()` resuelve el ataque una sola vez al iniciarse. Esto permite definir whiff como ataque legal sin interseccion, sin inventar fases temporales.
- `Fighter.takeHit()` distingue bloqueo/impacto, aplica daño real y energia, pero no devuelve un resultado estructurado al atacante.
- `Fighter.getHurtBox()` ya tiene geometria de pie, crouch y aire. Puede delegar en un helper por postura para detectar un crouch evade sin duplicar tablas.
- La IA actual recibe distancia, salud, energia, rango real, cooldown, paredes, counter window y memoria por tipo/zona/aire. No recibe timer, outcome del ataque rival ni recovery; no tiene accion crouch ni ataques aereos propios.
- `chooseAIAction()` es puro, rule-based y sembrable. La mejora debe conservar una sola llamada `rand` por decision y tuning en `DIFFICULTIES`.
- Ayuda usa `[data-input-binding]` para teclado. Touch y gamepad existen y estan localizados/implementados, pero no se enseñan dentro de Ayuda/onboarding.
- `showMainMenu()` abre onboarding antes de que el usuario elija modo; completar inicia siempre `initGame()` y omitir vuelve al menu. No existe `pendingStartMode`.
- El estado esencial continua en Canvas. `#game-announcer` anuncia ronda, especial listo y resultado, pero no existe una representacion DOM consultable de vida/energia/tiempo.
- La capa de input persistida usa `INPUT_BINDINGS_VERSION = 1` y exige al menos un binding para cada accion. Agregar `status` sin migracion invalidaria todos los remapeos v1 validos.
- Canvas y Pausa tienen un puente Tab de dos elementos. Fase 2 añade Estado y debe extender la secuencia sin encerrar touch/training visibles.
- `plans/plan_0025_mejoras_ia_avanzadas.md` ya entrego contraataque, especial tactico y memoria corta. No se deben proponer de nuevo.

Suposiciones explicitas:

- Capturar la baseline humana ocurre antes de cambios que alteren comprension/profundidad. `#74` puede proceder despues de capturarla por su barrera P1 confirmada; el tramo recurrente bloquea especificamente `#16`.
- Una observacion recurrente habilita trabajo de IA solo si aparece en dos de cuatro sesiones o es un fallo critico unico, y ademas se reproduce en Node con estado/inputs explicitos.
- Una seed reproduce RNG, no el input humano; cada hallazgo se convierte en una traza por ticks antes de implementar.
- Trials son un subestado de Entrenamiento y permanecen en memoria durante la sesion. No se guardan completados hasta que exista reset visible `#22`.
- El resultado de combate se registra sin un event bus, listeners genericos, cola creciente o persistencia.
- Cada ataque legal produce exactamente un resultado `hit`, `blocked` o `whiff`; un intento rechazado produce cero.
- Los contadores actuales conservan su semantica para stats/historial. Trials usan el resultado nuevo y pueden exigir contacto real.
- La Ayuda siempre muestra las tres alternativas. `recentInputMethod` solo registra uso real y `guidanceInputMethod` representa seleccion manual; ninguno oculta contenido.
- Ambos metodos empiezan null y son efimeros. Capacidad touch, gamepad conectado, click/mouse o boton ya sostenido al conectar no bastan; debe existir una accion real posterior a muestra neutral.
- La franja semantica no es live. Solo la consulta explicita y umbrales deduplicados escriben en `#game-announcer`.
- La accion `status` es un comando por edge activo solo con foco de gameplay como pausa, no una accion sostenida que llegue a `Fighter`; puede quedar explicitamente sin tecla.
- La migracion de bindings v1 debe preservar todos los codigos y slots del usuario; nunca roba una tecla para status.
- `#16` no autoriza `#17/#19`; cada extension requiere decision documentada posterior al gate.

## Diseño Propuesto

### 1. Gate de usuarios `#77`

Ejecutar sobre el commit/baseline actual antes de modificar onboarding, trials o IA.

Primera sesion:

- Seis jugadores nuevos: dos teclado, dos touch y dos gamepad.
- Sin coaching: iniciar, moverse, bloquear, ejecutar combo y usar especial.
- Registrar anonimamente commit, navegador/dispositivo, input, exito por tarea, punto de confusion e input interpretado como perdido.
- Gate: cinco de seis completan todo y ninguna ruta acumula dos fallos.
- Si falla por input/foco/timing, detener y corregir Fase 1. Si falla solo por comprension, usar el hallazgo para `#24/#9` y repetir con participantes nuevos.

Profundidad recurrente:

- Cuatro jugadores recurrentes o con experiencia en fighting games.
- Cada uno juega Normal y Hard en orden contrabalanceado con seed/configuracion registradas.
- Probar partida libre, spam de punch/kick, saltos, whiffs, bloqueo sostenido, esquinas y energia completa.
- Registrar ranking de dificultad, patron explotable, recuperacion/especial torpe y que regla se siente especificamente glitch.
- No agregar telemetria ni grabar datos personales dentro del juego.

Decisiones del gate:

- Si primera sesion falla por perdida de input, foco o timing, detener y corregir Fase 1 antes de continuar.
- Si falla solo por comprension, la evidencia autoriza correcciones acotadas de `#24/#9`; repetir despues las tareas fallidas en una cohorte nueva.
- `#9` procede si se acepta/cierra el timing fisico residual de `#73`; un fallo de comprension define sus objetivos, no lo bloquea circularmente.
- `#24` usa la evidencia para orden/copy; no crece hacia otro tutorial.
- `#74` procede independientemente una vez capturada la baseline por la barrera confirmada; queda Partial hasta validar AT.
- `#16` procede solo con predictibilidad/pasividad reproducible en al menos dos sesiones o un fallo critico.
- `#17` se habilita solo por timeout, retirada tardia o turtle reproducible.
- `#19` se habilita solo por especial inseguro/desperdiciado reproducible; preferencia subjetiva aislada no basta.

Los umbrales son gates cualitativos, no evidencia estadistica. `#77` pasa a Partial al completar la primera cohorte y a Completed al registrar ambas.

### 2. Resultado de combate compartido

No crear un bus. Añadir una llamada sincrona `recordCombatEvent(event)` en `game.js`; actualiza solo `lastCombatEvent` y el reducer del trial activo. Los `recordPlayerCombo/Block/Special/AirAttack()` existentes siguen siendo los unicos escritores de matchStats/historial; `#16` lee outcome/sequence directamente del Fighter. No conserva una lista ilimitada.

Evento `attackResolved`:

```text
type: attackResolved
frame: matchElapsedFrames
actor: player | cpu
target: player | cpu
attackType: clave real de ATTACKS
outcome: hit | blocked | whiff
damageApplied: entero real incluido chip
defenderState: standing | crouch | air | block
evadedByCrouch: boolean
energyBefore: entero
energyAfter: entero
sequence: entero del atacante
```

Reglas:

- Se emite una vez por ataque legal despues de fijar estado/cooldown/energia.
- Cooldown, block/crouch, energia insuficiente o ataque desconocido no emiten.
- `Fighter.attack()` incrementa `attackSequence`, conserva `lastAttackOutcome` y registra hit/block/whiff.
- `attack()` captura estado/hurtbox/health del defensor y energia del actor inmediatamente antes de `takeHit()`, y emite despues de resolver.
- `takeHit()` devuelve `{ blocked, damageApplied }` sin cambiar daño, efectos, energia o hit-stun; `damageApplied = healthBefore - healthAfter`, incluido clamp a cero.
- `energyBefore/energyAfter` siempre corresponden al actor del ataque.
- `defenderState` se normaliza antes de `takeHit()` con precedencia block, crouch, air, standing.
- `getHurtBoxForPosture(posture)` contiene la geometria hoy embebida en `getHurtBox()`; `getHurtBox()` delega usando estado real.
- `evadedByCrouch` solo es true si el ataque hizo whiff, el defensor estaba crouch y la misma attack box habria intersectado la hurtbox standing.
- No hardcodear que punch siempre es alto ni crear otra tabla de hitboxes.

Evento `energyReady`:

```text
type: energyReady
frame
actor
source: hit | block | damage
energyBefore
energyAfter
```

- `gainEnergy(amount, source)` emite solo al cruzar de menos de MAX_ENERGY a MAX_ENERGY.
- Refill administrativo de entrenamiento asigna energia directamente y no completa el objetivo.
- El especial se observa mediante `attackResolved` y `energyBefore/After`; no necesita otro evento.

`lastCombatEvent` conserva solo un texto/estructura corta para la franja semantica. El historial persistido sigue version 1 y con los mismos agregados.

### 3. Combo trials `#9`

Mantener `gameMode = 'training'`. Añadir:

```text
activeTrialId: free | combos | crouchPunish | blockCounter | specialSpend
trialState: objeto efimero por objetivo
trialTick: entero fixed-step
```

Interfaz dentro de `#training-panel`:

- `#training-trial-select`: Practica libre y cuatro objetivos.
- `#training-trial-brief`: objetivo, instruccion siguiente y reintento.
- `#training-trial-progress`: checklist textual `vacio/completo`, no solo color.
- `#training-trial-next`: aparece tras exito; nunca autoavanza.
- Agrupar controles actuales en `#training-free-options`; disponibles en free, fijados/disabled durante trial.
- Toolbar muestra `ENTRENAMIENTO · LIBRE`, `TRIAL n/4 · progreso` o `TRIAL n/4 · COMPLETO`.
- No añadir boton de menu, overlay modal ni elementos dentro de Canvas/touch controls.
- Los presets de trial son una configuracion efectiva derivada de activeTrialId; no mutan `trainingConfig`. Volver a free restaura posicion/CPU/timer elegidos previamente.

El estado de exito usa texto, check, borde/patron y anuncio unico. Reduced motion elimina desplazamientos/parpadeos; no cambia la informacion.

Trial 1: tres combos

- Posicion close, CPU idle, timer off.
- Completar una vez cada `attackResolved` player con outcome hit y attackType `comboPunch`, `comboKick`, `backKick`.
- Repetir un tipo ya completado no concede otro.
- No analizar J/K, comboBuffer, FloatingText ni contador agregado.

Trial 2: agacharse y castigar

- CPU idle administrada por controlador de trial.
- Cue de 60 ticks; CPU ejecuta `attack('punch')` por ruta normal.
- Paso 1 exige `evadedByCrouch` con player como target.
- Paso 2 exige attackResolved player outcome hit dentro de 45 ticks.
- Solo whiff+evadedByCrouch abre la ventana. Hit, blocked o whiff por distancia pasan a retry de 120 ticks.
- Recibir golpe, golpear CPU antes del cue o expirar reinicia el intento, no todo Entrenamiento.

Trial 3: bloquear y contraatacar

- Cue de 60 ticks; CPU ejecuta una patada normal.
- Paso 1 exige attackResolved cpu outcome blocked con player target.
- Paso 2 exige attackResolved player outcome hit dentro de 45 ticks.
- Hit/whiff de CPU, golpear CPU antes del cue, mantener bloqueo sin impacto o responder tarde pasan a retry.

Trial 4: cargar y gastar especial

- Posicion close, CPU idle, timer off, energia inicial 80.
- Paso 1 exige energyReady con source de combate.
- Paso 2 exige attackResolved player attackType special con energyBefore 100 y energyAfter 0; no exige hit.
- Refill no concede progreso.

Cues, ventanas y retries avanzan solo en `update()` fixed-step y se congelan con pausa, hidden, VS intro e hit-stop. Antes del cue, CPU solo ataca si grounded, hitStun/cooldown cero y fuera de block/crouch; en otro caso pasa a retry. Toda resolucion termina en advance o retry, nunca espera sin deadline. No usar `setTimeout`.

No crear DSL de objetivos. Cuatro reducers explicitos son mas pequeños y auditables. Reset, KO, cambio de trial y menu limpian fases; completados solo viven durante la sesion y no afectan stats/historial.

### 4. Ayuda y onboarding input-aware `#24`

Estado efimero:

```text
recentInputMethod: null | keyboard | touch | gamepad
guidanceInputMethod: null | keyboard | touch | gamepad
pendingStartMode: null | versus | training | arcade
```

Actualizar `recentInputMethod` solo por accion real:

- keyboard: accion/navegacion realmente resuelta despues de politica de targets/modificadores; no cualquier keydown.
- touch: pointerdown con `pointerType === 'touch'` sobre modo/control.
- gamepad: edge real de combate, navegacion o confirmacion en pad standard despues de observar al menos una muestra neutral; conectar con boton sostenido no cuenta.
- maxTouchPoints, conexion neutral, hover, mouse o click sintetizado no cambian recent.
- El selector manual modifica guidanceInputMethod, no recentInputMethod.
- Con ambos null se muestran las tres guias sin marcador ni prioridad falsa.
- El estado no se persiste.

Ayuda:

- Mantener las tres secciones visibles y en orden DOM estable: Teclado, Touch, Gamepad.
- Marcar la reciente con texto `USADO RECIENTEMENTE` y la manual con `SELECCIONADO`, no solo color.
- Teclado usa bindings actuales, incluido status.
- Touch explica mantener movimiento/bloqueo mientras otro dedo ataca, Pointer cancel y especial charging/ready.
- Gamepad documenta stick/D-pad, botones 0/1/2/3, bumpers, Start 9 y Status 8 con nombres posicionales y ejemplos A/B/X/Y.
- Añadir selector manual de metodo para hibridos; cambia guidance durante la sesion, no el historial observado, disponibilidad ni persistencia.

Onboarding:

- Dejar de abrirlo automaticamente desde `showMainMenu()`.
- Los tres botones llaman `requestStartMode(mode)`.
- Si seen, despachar inmediatamente `startRequestedMode(mode)`.
- Si no, guardar pending y abrir onboarding.
- Conservar tres pasos; copy/tokens responden al metodo elegido y ofrecen selector manual.
- Finalizar y `OMITIR Y EMPEZAR` guardan seen, limpian pending e inician el mismo modo.
- Usuarios existentes con seen no vuelven a verlo automaticamente; Ayuda contiene el contenido ampliado.
- Añadir `class="dialog-focus-target" tabindex="-1"` al h1 de onboarding; recibe foco al abrir y despues de cada paso. No convertir pasos en live region.
- D-pad/gamepad desde el h1 llega al primer boton y puede completar/omitir. Canvas recibe foco al iniciar.

No crear tutorial jugable paralelo: trials son la practica posterior.

### 5. Estado semantico consultable `#74`

Agregar dentro de `#game-toolbar`:

```html
<details id="combat-status">
  <summary id="combat-status-summary" aria-label="Estado del combate">
    <span id="combat-status-compact" aria-hidden="true"></span>
  </summary>
  <dl id="combat-status-details">...</dl>
</details>
```

Estado cerrado:

- Desktop: `ESTADO · P1 100 · CPU 100 · 60s`.
- Compacto: `ESTADO · 60s`. El nombre accesible del summary permanece estatico mientras cambian valores, para no hablar cada segundo con foco.

Abierto:

- Vida P1 y CPU.
- Energia P1 y CPU.
- Ronda, marcador y tiempo (`SIN TIEMPO` en training off).
- Rival, direccion relativa y distancia `cerca/media/lejos`.
- Ultimo evento de combate como texto no-live.

`renderCombatStatus()` usa firma cacheada con idioma, valores enteros, segundo, round, score, bucket espacial y ultimo evento. Puede llamarse por RAF, pero no muta si la firma no cambia. No usa role status ni atributo aria-live y no modifica `hud_render.js`. El span compacto es aria-hidden; el dl accesible se consulta al expandir.

Consulta explicita:

- Añadir accion remapeable `status` con default `Digit0` para instalaciones nuevas.
- Keyboard: keydown edge no-repeat llama `announceCombatStatus()` solo con foco en Canvas; no crea fuente held.
- Gamepad standard: edge del boton 8 produce `events.status`.
- Touch/pointer inspecciona el details/summary; no se añade noveno boton de combate.
- Resumen incluye salud/energia, rival izquierda/derecha, bucket de distancia, round/score y segundos finales.
- Mantener tecla no repite; nueva activacion puede consultar otra vez.

Migracion de bindings:

- Subir `INPUT_BINDINGS_VERSION` a 2.
- Declarar inventario fijo de nueve acciones v1.
- Validar registro v1 con ese inventario y copiar bindings/slots exactamente.
- Para status probar una lista determinista iniciada por `Digit0`; usar primer codigo libre.
- La lista cerrada es `Digit0`, `KeyO`, `Semicolon`, en ese orden; no asignar Slash ni otros atajos de navegador automaticamente.
- Si todos los candidatos estan ocupados, status queda sin binding de teclado y conserva summary/gamepad; v2 permite vacio solo para status.
- La UI de remapeo ofrece `SIN TECLA/UNASSIGNED` solo para status y persiste `[]` por decision del usuario. Ayuda muestra ese fallback localizado.
- Persistir v2 despues de migrar; version futura o v1 invalida sigue fallback seguro.
- Reset usa defaults v2; nunca desalojar un binding del usuario.

Anuncios automaticos nuevos, deduplicados por ronda:

- Vida P1 cruza a 30%: peligro una vez.
- Timer cruza 10 y 5 segundos: una vez cada umbral.
- Mantener anuncios actuales de ronda, especial listo y resultado.
- Trial anuncia solo paso importante/completado.
- Golpes, energia parcial, direccion y distancia no se anuncian automaticamente.

Coordinar escrituras en `#game-announcer` con un helper acotado, no un bus:

- Maximo un mensaje pendiente y un token que invalida tareas obsoletas.
- Prioridad: resultado > peligro/tiempo > trial/especial > consulta.
- Eventos esenciales simultaneos se combinan en un texto localizado o conservan un solo slot diferido.
- Repetir consulta sin cambios se reemite en una tarea posterior de presentacion; nunca modifica simulacion/timers.

Orden de foco gameplay sin wrap forzado:

- Mantener DOM/visual actual y construir `getGameplayFocusableElements()` con Canvas, summary Estado, Pausa y touch/training realmente visibles.
- Interceptar Tab/Shift+Tab solo mientras el foco pertenece a esa lista; avanzar/retroceder sin wrap. En primero/ultimo dejar continuar al flujo normal del documento.
- Shift+Tab recorre inverso.
- Ctrl+Tab y atajos siguen pasando al navegador.
- Regiones de gameplay quedan inert durante dialogos.

La altura real del toolbar/status/training se incorpora al calculo responsive ya existente; Canvas conserva coordenadas logicas `1000x500`.

- `#game-container` permite scroll vertical cuando contenido DOM excede altura; no se mantiene overflow oculto como unica salida.
- Details expandido tiene max-height/overflow auto si es necesario y no tapa touch/foco.
- `resizeCanvas()` se llama en details toggle, cambio de idioma y cambios de trial/training; el minimo de Canvas no puede volver inalcanzables Estado/Pausa/controles.

### 6. IA contextual `#16`, condicionada

Esta seccion solo se ejecuta si el gate recurrente documenta el problema y existe un escenario Node reproducible.

Estado minimo en Fighter:

- `attackSequence`: incrementa por ataque legal.
- `lastAttackOutcome`: hit/blocked/whiff.
- En memoria CPU, `lastObservedAttackSequence` para reaccionar una vez.

Contexto nuevo de `chooseAIAction()`:

- `opponentWhiffed`: nueva secuencia rival con outcome whiff y cooldown activo.
- `opponentRecovery`: attackCooldown rival.
- `canAirPunch`, `canAirKick`, `airAttackUsed`.
- Estado crouch rival ya se deriva de Fighter/memoria; no añadir otra representacion.

Reglas:

- Whiff punish: una decision nueva por whiff; atacar solo si canPunch/canKick real, aproximarse desde mid, nunca despues de hit/block/cooldown cero.
- Bait: con sesgo de ataque alto, zona mid y espacio detras, usar retreat existente con probabilidad; sin secuencia FSM.
- Crouch defense: ante patron dominante de punch y no kick/special, devolver crouch. No crouch-block; kick sigue castigando.
- Aire: si CPU no esta grounded, solo airPunch/airKick/idle; usar hitboxes reales y airAttackUsed, maximo uno por salto.

Precedencia obligatoria para que las reglas sean alcanzables con un solo rand:

1. Si no grounded, resolver solo aire antes de special/reglas terrestres.
2. Resolver una nueva secuencia opponentWhiffed antes del bloqueo generico; consumirla tras esa decision aunque no castigue.
3. Evaluar crouch defense contra patron punch antes de blockReaction generico.
4. Evaluar bait solo con `!opponentAttacking` antes de bloqueos por attack/repeated bias.
5. Continuar con special/counter/low-health/distancia y reglas existentes sin duplicarlas.

Tunables unicos nuevos en cada dificultad:

| Campo | Easy | Normal | Hard |
| --- | ---: | ---: | ---: |
| `baitChance` | 0.06 | 0.14 | 0.24 |
| `crouchDefenseChance` | 0.08 | 0.18 | 0.30 |
| `whiffPunishChance` | 0.18 | 0.42 | 0.68 |
| `airAttackChance` | 0.20 | 0.40 | 0.60 |

Son valores iniciales para prueba, no balance aprobado. Reutilizar close/mid/far, paredes y un solo rand por decision. No añadir rangos por dificultad ni persistencia entre rondas.

### 7. Extensiones bloqueadas `#17/#19`

No implementar durante la ruta normal de este plan. Para habilitar una, actualizar Diseño, Pruebas, Riesgos y estado del gate antes de tocar codigo.

`#17` se habilita solo si:

- CPU perdiendo se retira/espera en final de ronda de forma reproducible, o bloqueo sostenido produce estrategia dominante.
- `#16` ya pasa tests y smoke.
- El escenario usa roundTimerFrames, no Date.now.

Diseño maximo permitido:

- Derivar `retreatAllowed` desde roundTimerFrames, vida/marcador y evidencia. Aplicarlo al elegir y al ejecutar un retreat ya almacenado; al cruzar umbral, cancelar/forzar decision determinista.
- Si CPU pierde dentro de ventana tardia, no devolver/continuar retreat; atacar en rango o approach.
- Bloqueo rival sostenido aumenta presion con ataques existentes, sin guard break.
- CPU ganando no recibe agresion forzada por timer; anti-turtle solo bajo la condicion de score/evidencia definida al abrir gate.
- Tunables declarativos acotados por dificultad.

`#19` se habilita solo si:

- Se reproduce especial inseguro/desperdiciado despues de conservar lethal/comeback/rango actual.
- `#16` ya esta estable.

Diseño maximo permitido:

- Exigir grounded, cooldown libre, energia completa y canSpecial.
- Aumentar probabilidad en hit-stun rival, esquina o final de ronda segun evidencia.
- No añadir variante, combo queue ni rango paralelo.

## Archivos A Modificar

- `src/config.js`: constantes/cadencias de trials y cuatro probabilidades de `#16`; campos `#17/#19` solo si se abre el gate.
- `src/fighter.js`: resultado de ataque, hurtbox por postura, energia ready, outcome/sequence y acciones crouch/aereas CPU si se autoriza IA.
- `src/ai.js`: reglas puras de bait, crouch, whiff y aire; timer/especial solo tras gate actualizado.
- `src/input.js`: metodo reciente, accion status, boton 8 y migracion bindings v1 a v2.
- `src/game.js`: gates registrados, reducer de eventos, trials/cues, pending mode, Ayuda/onboarding, status DOM, consulta y umbrales.
- `src/index.html`: trial controls dentro de training, tarjetas/selector de input, status details.
- `src/styles.css`: panel trial, cards de ayuda, status toolbar, low-height/safe-area/forced-colors.
- `src/i18n.js`: textos ES/EN con paridad de placeholders para trials, inputs, status, eventos y IA visible si aplica.
- `tests/game.test.js`: eventos, trials, onboarding, migracion, status, IA, fixed-step y contratos estaticos.
- `Readme.md`: comportamiento visible, status binding v2, trials y cambios de IA realmente entregados.
- `AGENTS.md`: contratos de eventos/trials/status, migracion y smoke durable.
- `BACKLOG.md`: reconciliar `#77`, actualizar estados solo con evidencia y reordenar siguiente trabajo real.
- `plans/plan_0040_claridad_impacto_fase_1.md`: registrar cierre/aceptacion residual de Fase 1 solo si el gate lo demuestra.
- `plans/plan_0041_profundidad_rejugabilidad_fase_2.md`: registrar cohortes, decisiones, comandos, mediciones y desviaciones.

No se prevén cambios en `src/audio.js`, `src/effects.js`, `src/arena_render.js`, `src/hud_render.js` ni historial persistido. Si el resultado de combate exige tocar esos modulos, detener y actualizar el plan.

## Plan De Implementacion

1. Congelar baseline y ejecutar `#77` antes de codigo.
   Verificar: se registran dos cohortes, commit/configuraciones, matriz de resultados y decisiones. Fallo input/foco/timing vuelve a Fase 1; fallo solo de comprension autoriza `#24/#9`; `#74` puede continuar tras capturar baseline.

2. Reconciliar backlog/plan 0040 con evidencia del gate.
   Verificar: `#77` Ready pasa a Partial/Completed segun una/ambas cohortes; `#73/#69/#72` solo cierran si smoke fisico/AT correspondiente pasa; no se cambia codigo funcional en este paso.

3. Escribir regresiones para ataque legal/rechazado y añadir `attackResolved`/`energyReady` sin trials.
   Verificar: un ataque produce un evento, intento invalido cero, daño/chip/energia actuales no cambian, crouch evade usa geometria standing real y stats/historial siguen iguales.

4. Añadir estado/control de trial en memoria y selector Free/4 trials.
   Verificar: Free Training conserva posicion/CPU/timer/refills actuales; cambiar trial aplica preset, limpia fases y no crea gameMode/historial.

5. Implementar trial de combos y especial sobre eventos.
   Verificar: exige tipos/contacto/cruce/gasto correctos; whiff/repeticion/refill no conceden progreso; success persiste solo en sesion.

6. Implementar cues fixed-step para crouch-punish y block-counter.
   Verificar: orden, ultimos/primeros ticks, retry, pausa/hidden/hit-stop y reset; CPU usa Fighter.attack normal.

7. Implementar input reciente y requestStartMode sin cambiar aun copy.
   Verificar: tres modos x completar/omitir conservan intencion; seen inicia directo; recent/guidance/null se distinguen; mouse, capacidad neutral y pad inicialmente sostenido no cambian recent.

8. Ampliar Ayuda/onboarding ES/EN con tres alternativas y selector manual.
   Verificar: bindings remapeados, touch y mapping gamepad; recientes marcados con texto; cambio idioma conserva pending mode/step.

9. Escribir migracion v1->v2 y añadir comando status antes de la franja visual.
   Verificar: remapeos/slots se preservan, conflicto Digit0 usa fallback/vacio, v2 recarga, corrupto/futuro/storage error son seguros, button 8 produce edge.

10. Añadir combat-status no-live, consulta y umbrales deduplicados.
    Verificar: summary mantiene nombre accesible estatico; valores/buckets correctos, cero speech por frame, prioridad/colisiones de anuncios, consulta repetible por edge, thresholds una vez por round, training no-timer y Game Over conciso.

11. Rehacer la ruta Tab gameplay sin wrap forzado y ajustar responsive.
    Verificar: Canvas, Status, Pausa, touch/training visibles son alcanzables sin ciclo; toolbar/training heights y details toggle reducen solo CSS canvas; scroll vertical permite alcanzar controles a 200%; 1000x500 logico intacto.

12. Si el gate recurrente autoriza `#16`, escribir tabla pura/escenario antes de IA y aplicar las cuatro reglas/tunables.
    Verificar: whiff una vez, bait sin pared, crouch no contra kick dominante, aire una vez por salto, misma seed/traza a 30/60/120.

13. Detener y reevaluar. No implementar `#17/#19` salvo actualizacion explicita del gate.
    Verificar: decision documentada con escenario; ausencia de evidencia mantiene ambos bloqueados.

14. Ejecutar automatizacion, browser/hardware/AT y validacion de usuarios de trials/status.
    Verificar: ningun item se marca completado solo por Node; pendientes quedan Partial con evidencia faltante exacta.

15. Actualizar README, AGENTS, BACKLOG y estados de planes al final.
    Verificar: documentacion refleja solo entregables y gates realmente ejecutados; orden recomendado apunta al siguiente trabajo real.

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

Contratos de resultado de combate:

- Cada ATTACKS legal emite exactamente un outcome; cooldown/block/crouch/energia insuficiente emiten cero.
- Hit, blocked y whiff contienen daño/energia reales y actor/target correctos.
- Crouch evade exige que standing habria intersectado; alejarse no cuenta.
- Energy ready cruza una vez por hit/block/damage; refill no emite.
- Render adicional e idioma no alteran eventos ni RNG.

Contratos de trials:

- Cada objetivo: success, accion parecida invalida, ultimo tick valido y primer tick fuera.
- Combo exige tres tipos hit; repetir/whiff no sustituye.
- Crouch requiere evade y castigo posterior; block requiere blocked y counter posterior.
- Special requiere energyReady de combate y gasto 100->0.
- Reset, KO, cambio de trial, menu y ronda limpian fases; completados de sesion no entran en stats/historial.
- Pausa, hidden, VS intro e hit-stop congelan cues/ventanas.
- Una traza de trial representativa coincide a 30/60/120.
- Una prueba canonica demuestra equivalencia teclado/pointer/gamepad; no cruzar toda la matriz.

Contratos de Ayuda/onboarding:

- Tabla de capacidades: keyboard, touch, gamepad standard, hibrido y pad no standard fallback.
- Solo accion real posterior a politica/muestra neutral cambia recentInputMethod; selector manual cambia guidanceInputMethod durante sesion.
- Mouse/click sintetizado, null inicial, pad inicialmente sostenido y cambio real entre fuentes tienen casos explicitos.
- Tres tarjetas siguen visibles ES/EN y reflejan bindings actuales.
- Tabla 3 modos x terminar/omitir produce modo observable correcto.
- seen no abre onboarding; storage unavailable mantiene flujo seguro.
- Foco entra al h1, sale a Canvas y pending mode se limpia una vez.

Contratos de bindings/status:

- v1 custom valido conserva nueve acciones/slots y agrega status sin conflicto.
- Digit0 ocupado usa KeyO/Semicolon o vacio; nunca Slash ni desaloja usuario.
- Status puede desasignarse/reload como `[]`; otras acciones siguen requiriendo binding.
- v2 valido recarga; parcial, corrupto, futuro, get/set throw tienen fallback definido.
- Status es edge: repeat/held no anuncia; key nueva, gamepad 8 y consulta pointer funcionan.
- Combat-status no tiene role status/live; summary tiene nombre estatico y span visual aria-hidden; firma evita mutaciones repetidas.
- Salud/energia/round/score/time/event/direction/distance son correctos en Versus, Training, Arcade y Trial.
- 30 s de simulacion sin eventos no escribe announcer por frame; eventos simultaneos respetan prioridad/coalescing.
- Dos consultas iguales por edges separados producen dos escrituras presentacionales sin dejar tarea obsoleta.
- Peligro 30, 10 s y 5 s se anuncian una vez y resetean por round.
- getGameplayFocusableElements alcanza solo controles visibles, no wrap en extremos y Ctrl+Tab sigue libre.

Contratos de IA `#16`, solo si autorizada:

- Tabla pura con rand a ambos lados para whiff, bait, crouch y aire.
- Tunables existen y son finitos [0,1] en las tres dificultades; orden solo donde diseño lo exige.
- Whiff punish no ocurre despues de hit/block/cooldown 0 ni fuera de rango.
- Bait no ocurre contra pared.
- Crouch no responde a patron dominante kick/special y sigue vulnerable a kick.
- CPU ataca una vez por salto con hitbox aereo real.
- Memoria permanece acotada; misma seed reproduce; seed distinta no se exige que diverja.
- Traza contextual a 30/60/120 compara acciones, posiciones, vida/energia/estado, no particulas/draw.

Control de matrices:

- ES/EN: paridad total y un flujo integrado por idioma.
- Dispositivo: tabla de #24 y smoke fisico, no multiplicada por trial/locale/FPS.
- Modos: una tabla de transiciones/persistencia.
- FPS: una traza trial y una IA.
- Dificultad: tabla pura con config real.
- Storage: tabla comun valido/parcial/corrupto/futuro/no disponible.

Smoke browser obligatorio:

- Menu sin rediseño; primera activacion de Duelo/Training/Arcade conserva intencion al completar/omitir.
- Ayuda completa a 100/200% zoom, ES/EN, remapeos y viewport bajo.
- Free Training intacto y cuatro trials: objetivo, progreso, retry, success, siguiente, pausa/reset/menu.
- Toolbar/status/training en `1440x900`, `1366x768`, `844x390`, `667x375`, `390x844` y altura 320-400.
- Reduced motion: success inmediato y comprensible sin shake/pulso.
- Easy/Normal/Hard con seed del exploit documentado si se ejecuta `#16`.

Hardware/AT/usuarios, no automatizable:

- Teclado fisico: bindings/remapeo/status y atajos navegador.
- Touch: multitouch, status details y combo/special trials sin soltar otra fuente.
- Gamepad standard: mapping ayuda, trials, boton 8 status y Start pausa.
- Hibrido: selector de metodo corrige prioridad de forma comprensible.
- Forced colors, zoom real 200%, contraste y safe areas.
- NVDA, Narrator y VoiceOver: franja navegable, consulta unica, cero speech continuo, thresholds no repetidos y final conciso.
- Nuevos: entienden cada trial sin coaching; recurrentes confirman que el exploit objetivo disminuye sin CPU perfecta.

Ninguna de estas verificaciones se declara aprobada con mocks Node.

## Documentacion

- `Readme.md`: trials, flujo pending mode, tres guias de input, status action/binding v2, estado semantico y cambios de IA realmente implementados.
- `AGENTS.md`: contrato de recordCombatEvent, trials en training, cues fixed-step, recent input efimero, status no-live/migracion y smoke durable.
- `BACKLOG.md`: reconciliar estados Fase 1/#77; cerrar `#9/#24/#74/#16` solo con automatizacion y evidencia manual; mantener `#17/#19` bloqueados salvo gate.
- `plans/plan_0040_claridad_impacto_fase_1.md`: registrar resultados manuales que cierren o mantengan Fase 1 Partial.
- `plans/plan_0041_profundidad_rejugabilidad_fase_2.md`: registrar matrices anonimas, decisiones, pruebas, hardware/AT y cualquier extension autorizada.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: implementar antes de usuarios contamina baseline. Mitigacion: capturar primera cohorte antes; fallo tecnico vuelve a Fase 1, fallo de comprension autoriza correccion acotada, #74 sigue por barrera confirmada.
- Riesgo: event bus/DSL sobrediseñados. Mitigacion: dos tipos de evento, una llamada sincrona y cuatro reducers explicitos.
- Riesgo: falsos positivos de trial. Mitigacion: outcome tipado/orden/tick, no inputs/textos/polling decorativo.
- Riesgo: CPU scripted duplica combate. Mitigacion: cues llaman Fighter.attack normal y usan sus hitboxes/daño.
- Riesgo: persistencia sin reset. Mitigacion: completados solo en sesion hasta `#22`.
- Riesgo: onboarding oculta/confunde alternativas en hibridos. Mitigacion: Help muestra las tres; recent observado y guidance manual son estados distintos con null neutral.
- Riesgo: perder modo solicitado. Mitigacion: un requestStartMode, tabla 3x2 y limpieza unica de pending.
- Riesgo: agregar status borra remapeos. Mitigacion: migracion v1 explicita, slot/codigo preservado, fallback libre/vacio.
- Riesgo: status intercepta AT/Quick Find. Mitigacion: solo con foco Canvas, details/gamepad como alternativas, unassign visible y sin Slash automatico.
- Riesgo: speech spam/colision. Mitigacion: summary estatico, estado no-live, coordinator de un slot/prioridad/token, thresholds deduplicados y consulta por edge.
- Riesgo: status/trial reducen arena movil. Mitigacion: scroll vertical, panel acotado, toggle/language/trial recalculan altura y solo CSS canvas cambia.
- Riesgo: Tab vuelve a ser trap. Mitigacion: lista de visibles, intercepcion solo dentro, sin wrap en extremos y pruebas por desktop/touch/training.
- Riesgo: IA perfecta/frustrante. Mitigacion: probabilidades bajas por dificultad, rangos reales, un rand y smoke del exploit/Easy.
- Riesgo: whiff punish requiere fases inexistentes. Mitigacion: outcome inmediato + attackCooldown actual; no startup/active/recovery.
- Riesgo: crouch defense evita todo. Mitigacion: solo patron punch, no crouch-block y kick real lo castiga.
- Riesgo: #17/#19 se implementan por inercia. Mitigacion: seccion bloqueada y actualizacion del plan obligatoria.
- Riesgo: seed confundida con replay. Mitigacion: convertir hallazgo a traza explicita; no reproducir input humano por seed.
- Riesgo: matriz de tests explota. Mitigacion: tabla por eje y dos trazas fixed-step, no producto cartesiano.
- Riesgo: mocks ocultan IDs/AT. Mitigacion: ampliar contrato HTML estatico; browser/hardware/AT quedan manuales.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este documento.

Resultado de la revision:

- El gate humano ocurre antes de codigo que altere la baseline; un fallo tecnico detiene el programa en vez de adivinar soluciones.
- La revision final elimina el bloqueo circular: fallo tecnico detiene, fallo de comprension habilita #24/#9 y #74 procede por barrera P1 tras capturar baseline.
- El resultado de combate usa dos tipos y una llamada sincrona; no introduce event bus, listeners, cola, log ni persistencia.
- Trials son un subestado de Training con cuatro reducers explicitos; no aparece nuevo modo, DSL o segunda simulacion.
- Los completados permanecen en sesion hasta que `#22` ofrezca reset visible; no se agrega migracion/persistencia especulativa.
- recent input es un enum efimero, requiere accion real y todas las alternativas permanecen visibles.
- recent observado, guidance manual y estado null permanecen separados; un pad debe pasar muestra neutral.
- La migracion v1->v2 declara inventario historico, lista cerrada de candidatos y posibilidad de status sin tecla antes que perder datos.
- Combat-status reutiliza details, toolbar, cache y announcer; no crea segundo HUD ni habla por frame.
- Summary conserva nombre estatico; status permite unassign y el coordinador de anuncios tiene un solo slot/prioridad, no cola generica.
- `#16` agrega cuatro tunables y cuatro reglas sobre contexto existente; no usa FSM, scoring, lookahead o nuevos rangos.
- `#17/#19` estan fuera de los pasos ejecutables y requieren editar este plan con evidencia antes de codigo.
- Automatizacion, browser, hardware, AT y usuarios estan separados; los mocks no se presentan como prueba de experiencia real.
- Los archivos previstos trazan directamente a `#9/#24/#74/#16`; no hay dependencias, backend, telemetria o refactor preventivo.

## Criterios De Aceptacion

- `#77` registra seis nuevos y cuatro recurrentes con decisiones: fallo tecnico vuelve a Fase 1, fallo de comprension autoriza #24/#9, y #74 no depende de aprobar el gate.
- Cada ataque legal emite un unico outcome correcto; invalidos cero; daño/energia/stats/historial no regresan.
- Los cuatro trials reutilizan Training y reglas normales, no escriben stats/historial ni persisten sin reset.
- Progreso exige secuencias/outcomes reales y es equivalente a 30/60/120.
- Free Training, Versus y Arcade conservan comportamiento actual.
- El modo solicitado sobrevive a onboarding/omision; seen inicia directo; h1 enfocable se anuncia en cada paso sin live region.
- Help muestra keyboard/touch/gamepad; recent y guidance se marcan con textos distintos y no se persisten.
- Combat-status expone valores exactos sin live region; summary mantiene nombre estatico y no produce speech por segundo.
- Status se consulta por binding remapeable, gamepad 8 y details touch; held/repeat no spamea.
- Bindings v1 validos migran a v2 sin perder codigos/slots ni crear conflictos; status admite SIN TECLA y no toma Slash.
- Peligro/10s/5s se anuncian una vez por round; resultado final sigue conciso.
- Focus alcanza Canvas, Status, Pausa y controles visibles sin wrap/trap ni atajos navegador; zoom/low height conserva scroll y acceso.
- Si `#16` se autoriza: whiff/bait/crouch/aire cumplen tablas, mismas hitboxes y seed/fixed-step.
- `#17/#19` permanecen sin codigo salvo gate actualizado y evidencia reproducible.
- ES/EN mantienen claves/placeholders; reduced motion, low height, zoom y forced colors conservan usabilidad.
- Sintaxis de todos los JS, suite Node y `git diff --check` pasan.
- README, AGENTS, BACKLOG, plan 0040 y este plan reflejan solo evidencia real.

## Commit Y Push

Si se ejecuta, usar limites funcionales:

1. `Record phase-two user validation`
   Solo matrices/decision/documentacion; sin codigo de producto.
2. `Add deterministic training trials`
   Resultado de combate + cuatro trials + tests/documentacion directa.
3. `Add input-aware onboarding and help`
   Pending mode, recent input, tres guias y validacion.
4. `Expose semantic combat status`
   Binding v2 migration, status DOM/query/thresholds/focus.
5. `Add validated contextual AI tactics`
   Solo si gate autoriza `#16`; no incluir `#17/#19`.
6. `Complete phase-two validation docs`
   Browser/hardware/AT/usuarios y estados finales.

Ejecutar pruebas focales antes de cada commit y suite completa antes del ultimo. No hacer commit ni push salvo solicitud explicita durante la implementacion.

## Estado De Implementacion

Parcial.

Implementado en esta ejecucion:

- `#74`: `<details>`/`<dl>` no-live, render cacheado de salud/energia/ronda/score/tiempo/rival, consulta por status key/gamepad 8/details, migracion de bindings v1 a v2 sin robar teclas, status sin tecla y thresholds deduplicados.
- Cache-busting de recursos en `src/index.html` para que el navegador no reutilice la version anterior de Fase 1.

Validacion ejecutada:

- Baseline antes del cambio: `115/115` pruebas y sintaxis completa.
- Despues del cambio: `118/118` pruebas aprobadas, sintaxis completa y `git diff --check` correcto.
- Smoke navegador con cache-buster: estado cerrado `ESTADO · 60s`; al expandir se leen modo, vida, energia, ronda, marcador, tiempo, rival, direccion, distancia y ultimo evento.

Pendiente:

- `#77`: seis jugadores nuevos y cuatro recurrentes; no se realizaron sesiones humanas.
- `#9`, `#24` y `#16`: no implementados por depender de gates de usuarios/profundidad.
- `#17/#19`: permanecen bloqueados y sin codigo.
- Validacion real de zoom 200%, low-height, touch/gamepad fisico, forced-colors y NVDA/Narrator/VoiceOver.

Un fallo tecnico en primera sesion sigue bloqueando `#9/#24/#16` hasta corregir Fase 1; un fallo solo de comprension habilita `#24/#9`. `#74` queda Partial hasta completar validacion manual/AT. `#16` queda bloqueado por el gate recurrente.
