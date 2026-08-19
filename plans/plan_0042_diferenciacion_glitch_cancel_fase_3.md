# Exec Plan: fase 3 diferenciacion GLITCH CANCEL

## Objetivo

Validar una unica regla jugable propia de GLITCH DUEL sin alterar silenciosamente el juego publicado: GLITCH CANCEL permite que el jugador humano gaste 25 de energia para abortar la recuperacion de un punch o kick terrestre fallado y volver a neutral una vez por secuencia.

La Fase 3 se ejecuta por gates, no como rollout automatico:

- Gate 0: cerrar el timing fisico residual de `#73`, ejecutar `#77` y entregar/aceptar explicitamente `#9` como infraestructura de trial.
- MVP: habilitar GLITCH CANCEL solo dentro de un trial de Entrenamiento.
- Piloto: validar comprension, inputs, economia y no-dominancia con jugadores recurrentes.
- Expansion 1: habilitar la misma regla para P1 en Versus solo si pasa el MVP.
- Expansion 2: habilitarla en Carrera solo despues de validar Versus y resets de la run.
- CPU, aire, hit/block cancel, combos y progresion quedan fuera salvo un plan posterior basado en evidencia.

La experiencia cambia de forma observable:

- El jugador toma una decision de recurso frecuente: gastar 25 para volver a atacar antes o conservar energia para el Especial de 100.
- La accion sigue siendo Especial en teclado, touch y gamepad; no aparece otro boton ni binding.
- La regla se presenta primero como prueba opcional de Entrenamiento y puede retirarse sin migraciones ni datos persistidos.
- Canvas, touch y estado DOM comunican `CANCEL 25`, `USADO 1/1` o `ESPECIAL LISTO` sin depender solo de color, movimiento o audio.
- La simulacion permanece determinista y equivalente a 30/60/120 FPS.
- Duelo y Carrera mantienen bit a bit las reglas actuales hasta superar sus gates respectivos.

Queda fuera del alcance:

- Activar GLITCH CANCEL por defecto antes del piloto.
- Cancelar despues de hit o blocked, durante combos, Especial, ataques aereos, hit-stun, block, crouch o jump.
- Dar GLITCH CANCEL a la CPU o añadir tuning a `DIFFICULTIES`.
- Startup/active/recovery separados, cancel windows parciales, invulnerabilidad, movement burst, guard cancel o combo routes nuevas.
- Nueva accion remapeable, boton touch, barra, moneda, medalla, logro, mision, historial o persistencia.
- Un nuevo gameMode, pantalla, modal, onboarding inicial o tutorial paralelo.
- Modificar daño, energia ganada, cooldowns actuales, coste/daño del Especial, chip, timer o estilos.
- Integrar automaticamente Versus/Carrera/Help antes de gates.
- Haptics, spatial audio, voice, musica, nuevas dependencias, backend o telemetria remota.
- GLITCH CANCEL para CPU, cancel aereo o cancel de combo; cada uno requeriria evidencia y plan nuevo.

## Contexto Actual

- `BACKLOG.md` mantiene `#76` P3 Blocked por `#73` y `#77`. `#73` tiene buffer fijo probado, pero timing fisico touch/gamepad sigue pendiente; `#77` no tiene cohortes registradas.
- `#9` Combo trials queda Partial: ya existe selector, reducers, eventos y host, pero conserva smoke fisico/comprension pendiente. El MVP de Fase3 debe consumirlo, no crear selector paralelo.
- La baseline actual pasa `118/118` pruebas y sintaxis de todos los JS; `#74` agrego estado semantico y bindings v2 sin completar gates humanos.
- `Fighter.update()` decrementa `attackCooldown` antes de procesar controles. No existen startup/active/recovery; cooldown es la unica recuperacion ofensiva.
- Durante cooldown, el jugador ya puede moverse, bloquear y saltar. El valor real de Cancel es volver a atacar/agacharse antes, no habilitar movimiento/defensa.
- `updatePlayerControls()` procesa postura/movimiento, luego `consumePendingCombo()`, despues edges Special/Punch/Kick. Esta precedencia debe cambiar de forma explicita para el trial.
- `pendingComboInput` solo acepta punch/kick y `clearComboSequence()` limpia pending/buffer/timer/hint. Special no se bufferiza.
- `Fighter.attack()` rechaza cooldown, block/crouch y energia insuficiente; Special neutral cuesta 100, tiene daño base 26 modificado por estilo y registra `playerSpecials`.
- El outcome hit/blocked/whiff y `energyReady` ya son modelados por el host de `#9`; esa API es artefacto obligatorio de Gate0 y Fase3 no crea un fallback paralelo.
- El atacante gana 14 o 18 con Tecnico por cualquier interseccion, incluido golpe bloqueado; dos contactos pueden financiar un cancel de 25. Permitir hit/block cancel en MVP podria crear presion autosostenible.
- Touch actualmente no genera `special` por debajo de 100. Para el MVP, un helper central debe decidir si Special produce cancel, ataque completo o nada.
- Teclado, pointer y gamepad ya convergen en la accion `special`; boton 3/Y es gamepad. No hace falta modificar `INPUT_ACTIONS`.
- `#btn-special` tiene estados charging/ready, texto/ARIA y cache DOM. Debe extenderse con cancel-ready/used sin crear segundo escritor.
- `#combat-status` es DOM no-live y ya expone energia/ultimo evento; puede comunicar estado de cancel y consulta sin live spam.
- `#16` ya aporta whiff punish/consumo de attackSequence. GLITCH CANCEL debe conservar `lastAttackOutcome/attackSequence`; poner cooldown a cero cierra naturalmente la oportunidad de punish sin dar a CPU una reaccion nueva.
- HUD energia esta dividido en cuartos. Un coste de 25 coincide con un segmento existente.
- Reduced motion elimina shake/hit-stop/particulas fuertes, pero FloatingText y aura actual requieren cuidado si se reutilizan.
- La preferencia manual de reduced motion y la del sistema no deben alterar coste, ventana, cuota o resultado.

Suposiciones explicitas:

- El plan no es ejecutable hasta completar/aceptar Gate 0. Generarlo no autoriza codigo ni cambia el estado Blocked de `#76`.
- El MVP se habilita solo cuando `gameMode === 'training' && activeTrialId === 'glitchCancel'`.
- Fase3 consume obligatoriamente outcome/event/trial host de `#9`. Si su API difiere, detener y rebaselinar; no implementar outcome/event fallback aqui.
- Solo `punch` y `kick` terrestres son elegibles en el MVP.
- Solo outcome `whiff` es elegible. Hit/blocked quedan fuera para evitar presion autosostenible.
- El tick se clasifica despues de decrementar cooldown. Si pasa de 1 a 0, ya es neutral: no hay cancel.
- Con cooldown restante >0 y energia 100, Special produce Cancel y deja 75. En neutral produce Especial y deja 0.
- Pending combo tiene precedencia en el tick 1->0. Mientras cooldown sigue >0, un Cancel valido puede descartar pending como decision pagada.
- Un cancel exitoso consume el procesamiento ofensivo del tick; Punch/Kick/Move simultaneos no se ejecutan por el cancel. Block/Crouch/Jump validos ganan y evitan Cancel.
- No hay invulnerabilidad: fisica, colisiones y CPU siguen actualizando normalmente en el tick.
- El follow-up requiere un edge nuevo en un fixed-step posterior.
- Pausa/hidden limpian input y combo/pending como hoy, pero conservan glitchCancelUsed y no rearman. Hit-stop/VS intro congelan. Hit recibido, transicion real a block/crouch/jump, reset, KO, menu y nueva ronda terminan.
- Coste 25 es independiente de estilo y no usa RNG.
- El MVP no cuenta como Especial, combo, medalla, logro, stats o historial.
- Feedback visual/audio es suplementario; texto, patron y estado DOM son la informacion autoritativa.

## Diseño Propuesto

### 1. Gate 0: prerrequisitos

Antes de codigo:

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

- Confirmar que el trial de Especial de `#9` sigue exigiendo ataque special real y gasto 100->0; GLITCH CANCEL no puede completarlo.
- Reconciliar BACKLOG: `#76` solo pasa de Blocked a Ready si `#73/#77` estan aceptados y existe trial host.

Si Gate 0 falla:

- No implementar GLITCH CANCEL.
- Registrar si se rechaza, se difiere o se replantea la hipotesis.
- No compensar ejecutando mas seeds ni añadiendo contenido cosmetico.

### 2. Contrato jugable del MVP

Invariante:

> Un edge nuevo de Special durante cooldown restante de un punch/kick terrestre que hizo whiff puede gastar exactamente 25 para volver a neutral una vez por secuencia. No causa daño, invulnerabilidad, hit-stop, movimiento ni Special completo.

Elegibilidad:

| Condicion | MVP |
| --- | --- |
| Actor | Solo player1 humano |
| Modo | Training |
| Trial | glitchCancel |
| Ataques | punch, kick |
| Outcome | whiff |
| Grounded | Si |
| Cooldown tras decremento | > 0 |
| Energia | >= 25 |
| Uso en secuencia | 0/1 |
| Hit-stun, block, crouch, jump | No permitido |
| comboPunch/comboKick/backKick | No |
| airPunch/airKick/special | No |
| CPU | No |

No añadir ventana parcial: todos los ticks restantes del cooldown son elegibles. No añadir probabilidades ni RNG.

Resultado valido:

```text
energy -= 25
attackCooldown = 0
state = idle
velX = 0
clearComboSequence()
glitchCancelUsed = true
glitchCancelFeedbackFrames = 10
```

Conservar x/y, facing, salud, velY, outcome/type anterior, rival, CPU, timer, RNG y estado global.

No generar daño, energia, hit-stun, hit-stop, shake, invulnerabilidad ni desplazamiento automatico.

### 3. Orden fijo por tick e input dual

Congelar esta precedencia antes de tests:

1. Si el tick comienza en hit-stun, usar la ruta actual y no evaluar Cancel.
2. Decrementar cooldown/timers como hoy.
3. Resolver block/crouch/jump; cualquiera termina secuencia y gana a Cancel.
4. Detectar edge Special.
5. Si cooldown restante >0, pending puede existir:
   - si Cancel es elegible/pagable, Cancel gana, descarta pending y consume el tick ofensivo;
   - si Cancel falla, pending conserva su comportamiento.
6. Si cooldown llego a 0, consumir pending combo primero.
7. Solo sin pending ejecutado, Special neutral con 100 usa el ataque completo actual.
8. Punch/Kick edges se procesan al final; un Cancel valido los consume sin atacar.

Consecuencias:

- Cooldown previo 2 -> 1: ultimo tick cancelable.
- Cooldown previo 1 -> 0: no Cancel. Pending se resuelve; sin pending, Special de 100 puede salir.
- Con 100 durante cooldown elegible: Cancel 100->75, no Special.
- Special held antes de abrir ventana no autoejecuta; se necesita nuevo edge.
- Special nunca entra en pendingComboInput.
- Cancel+Punch/Kick simultaneo ejecuta solo Cancel; el ataque necesita release y nuevo edge.

### 4. Secuencia y cuota 1/1

Campos minimos en Fighter:

```text
lastAttackOutcome: '' | hit | blocked | whiff
glitchCancelEnabled: boolean
glitchCancelUsed: boolean
glitchCancelFeedbackFrames: entero
```

Funciones:

```text
canGlitchCancel(): boolean
tryGlitchCancel(): boolean
endGlitchCancelSequence(): void
```

`canGlitchCancel()` es pura respecto a estado y config. `tryGlitchCancel()` vuelve a validar y muta solo en exito.

Secuencia:

- Comienza al aceptar punch/kick elegible.
- Si se cancela, glitchCancelUsed queda true.
- Un ataque iniciado inmediatamente en el siguiente tick pertenece a la misma secuencia y no puede cancelarse.
- Si un tick posterior comienza neutral, sin pending y sin edge de ataque, la secuencia termina y se rearma.
- Hit recibido y transicion real a state block/crouch/jump, KO, reset, menu y nueva ronda terminan secuencia. Pulsar crouch durante cooldown sin entrar realmente en crouch no rearma.
- Pausa/hidden limpian input y combo/pending, pero conservan glitchCancelUsed; hit-stop/intro congelan. Ninguno rearma.
- El propio tick del cancel nunca rearma.

No añadir timer de secuencia ni identificador global salvo que tests demuestren ambiguedad. El flag y un tick neutral son suficientes.

### 5. Outcome/event host obligatorio

Gate0 exige que `#9` ya haya entregado `lastAttackOutcome` y un resultado/evento sincrono de combate:

- `attack()` fija outcome exactamente una vez por ataque legal: whiff, blocked o hit.
- Intento rechazado no sobrescribe outcome.
- GLITCH CANCEL emite un resultado distinto de `attackResolved special` y no modifica match history.
- El outcome permanece despues del cancel para debug/IA futura.
- Si `#9` entrega nombres/campos distintos, actualizar este plan y los tests antes de Fase3; no duplicar API ni crear fallback.

### 6. Gate del trial

El MVP solo existe dentro de la opcion experimental `glitchCancel` del selector de `#9`, fuera del inventario/progreso persistible `n/4`.

Preset:

- Training con coordenadas efectivas P1=440, CPU=620, no el preset close 440/560. Asi punch/kick iniciales hacen whiff y el jugador puede acercarse para el follow-up.
- CPU idle.
- Timer off.
- Energia P1 = 100, explicado como preset.
- Fighter normal y mismas reglas/hitboxes.

Pasos:

1. ATACA: iniciar punch o kick terrestre.
2. FALLA: el ataque debe producir outcome whiff; el preset coloca CPU justo fuera de rango o la retira de forma determinista.
3. CORTA: pulsar Special durante cooldown restante; energia 100->75.
4. APROVECHA: conectar un golpe posterior con edge nuevo.

El trial completa solo si existe evento/resultado real de Cancel y el follow-up posterior hit. Special neutral, hit/blocked cancel, input tarde, refill administrativo o feedback visual no progresan.

Errores localizados:

- Neutral: `Eso fue ESPECIAL. Ataca y falla primero.`
- Hit/blocked: `GLITCH CANCEL MVP solo funciona tras fallar.`
- Menos de 25: `Falta energia: necesitas 25.`
- Fuera de cooldown: `Fuera de recuperacion.`
- Segundo uso: `CANCEL YA USADO.`

Reset restaura preset, energia, outcome, combo/pending, cuota y progreso. Salir vuelve a Free Training y restaura trainingConfig sin persistencia.

GLITCH CANCEL no cuenta como quinto trial de Fase2, progreso n/4 ni persistencia. Emite resultado `glitchCancel`, distinto de `attackResolved special`. En `specialSpend` el feature esta deshabilitado: Cancel no gasta25 ni progresa; un Special neutral real 100->0 sigue completando ese trial.

### 7. Feedback Canvas/DOM/touch/audio

Crear un helper autoritativo de presentacion:

```text
getSpecialActionState(player): charging | cancel-ready | cancel-used | special-ready
```

El helper proyecta el proximo fixed-step, no consulta solo `attackCooldown > 0` del frame renderizado:

- `projectedCooldown = max(0, attackCooldown - 1)`.
- Si projectedCooldown0 y pending ejecutable, Special no tendra accion ese tick.
- Si projectedCooldown0 sin pending y energia100, special-ready.
- cancel-ready solo si projectedCooldown>0 y canGlitchCancel seguira siendo true.
- cancel-used solo bloquea durante recovery restante; nunca oculta un Special neutral legal.

Orden:

- cancel-ready si canGlitchCancel true, incluso con energia 100.
- cancel-used durante recovery restante si la cuota ya fue usada.
- special-ready si neutral con 100.
- charging en los demas casos.

Touch:

- Reutilizar #btn-special; no disabled nativo ni segundo boton.
- charging: `CARGA`, aria-disabled true.
- cancel-ready: `CANCEL 25`, aria-disabled false.
- cancel-used: `USADO 1/1`, aria-disabled true durante la misma secuencia.
- special-ready: `LISTO`, aria-disabled false.
- El handler no decide energia por su cuenta; pregunta al helper si Special tendria resultado.
- Unico escritor sigue siendo `renderTouchSpecialState()` con firma que incluye estado contextual, energia y cuota.

Canvas:

- Reutilizar slot del indicador sobre P1: CANCEL 25, CANCEL USADO o ESPECIAL LISTO, nunca apilados.
- En barra energia, tramar un segmento de 25 cuando cancel-ready; conservar segmentos/borde/texto.
- Exito: `GLITCH CANCEL · -25` dibujado desde glitchCancelFeedbackFrames y tres cortes/offset cian-magenta de silueta durante 10 ticks; no usar FloatingText si exige movimiento.
- Sin flash completo, shake, hit-stop ni trail.
- Reduced motion: silueta/cortes/texto estaticos; misma duracion logica e informacion.

DOM status:

- Mantener summary cerrado sin texto dinamico adicional.
- En `ENERGIA P1` o `ULTIMO EVENTO`, mostrar estado: no disponible, listo 25, usado 1/1 o Special 100.
- Consulta explicita incluye proxima accion de Special, coste y cuota.
- No live por disponibilidad. Exito/fallo por edge explicito se anuncia una vez.

Audio suplementario:

- Añadir perfil corto `glitchCancel` al canal existente, no nueva arquitectura.
- Tono cuadrado 820->260, 55 ms, gain 0.10; segundo triangular 260->620 a 25 ms, total <110 ms.
- No sonido de error; texto/estado son suficientes.
- Si #30 sigue pendiente, el audio no es criterio de comprension ni gate del MVP.

Contraste:

- Texto #111 sobre amarillo/white; minimo 4.5:1 para texto pequeño.
- Bordes/patrones minimo 3:1.
- Forced colors conserva texto, borde, X/check; ningun literal ES/EN en CSS.

### 8. Integracion de input

No modificar `INPUT_ACTIONS`, bindings version2 ni remapeo:

- Keyboard, pointer y gamepad ya producen special.
- `prevSpecialPressed` mantiene edge por fixed-step.
- No añadir cancel action, hold, double tap o gesto.
- Touch cambia su gate actual de energia >=100 por `getSpecialActionState() !== charging/cancel-used`.
- Dos fuentes simultaneas siguen agregadas; no duplican edge/coste.
- Pointercancel/lostcapture, blur, hidden, pause y gamepad disconnect limpian fuentes como hoy.
- Tap completo entre fixed ticks sigue no encolado; Gate 0 debe aceptar esta limitacion fisicamente.

### 9. Economia y ausencia de doble beneficio

Invariantes:

- Coste exacto: final = inicial - 25 en exito; no negativo.
- Coste igual para Balanced/Fast/Heavy/Technical; energyModifier solo afecta ganancias.
- Con 100 sin ganancias, cuatro ciclos completos whiff->Cancel->tick neutral dejan 75/50/25/0; quinto falla. Esto prueba aritmetica, no balance.
- Contactos hit/blocked conservan la ganancia actual del atacante; una traza contable puede financiar un whiff Cancel posterior, pero el MVP no cambia esa economia.
- Cancel no concede energia, daño, hit-stun, hit-stop, invulnerabilidad, combo, Special count ni evento persistido.
- Neutral 100 conserva Special 100->0/daño base26 con modificador de estilo actual; recovery 100 usa Cancel 100->75/cero daño Special.
- Pending combo y Cancel nunca producen ambos beneficios.
- Cancel+ataque simultaneo no daña en ese tick.
- Un ataque inmediato tras Cancel no puede cancelarse otra vez hasta tick neutral.
- Probar mutacion atomica en el tick exacto del Cancel, sin direccion ni follow-up: solo energia, cooldown, state/velX, combo/pending, cuota y feedback pueden cambiar; salud, x/y, rival, timer y score permanecen iguales.
- No usar win rates, 100 seeds o AI autoplay para declarar balance.

### 10. Piloto y gates de expansion

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

Si falla:

- Mantener Training-only, ajustar solo un tuning (coste o elegibilidad) y repetir, o retirar.
- No ampliar feedback/contenido para ocultar una regla confusa.
- No habilitar Versus/Carrera.

Expansion Versus:

- Mismo Fighter/helper, solo player1.
- Una linea en Ayuda existente; no nuevo onboarding.
- Mismos estados Canvas/touch/status/audio.
- CPU sin Cancel, sin cambios de IA/dificultad.
- Repetir los mismos umbrales 4/4 comprension, 3/4 preferencia y max1/4 obligatoriedad antes de Carrera.
- Exigir cero fugas a CPU/Carrera, cuota limpia por ronda y Special neutral intacto.

Expansion Carrera:

- Solo despues de Versus validado.
- Reset de cuota/outcome por ronda/combate; energia sigue reglas actuales.
- Intermision, retry, menu e historial v1 sin cambios.
- No recompensa, medalla, condicion ni progression asociada.
- Validar cinco combates; no usar tasa de victoria automatica como balance.

## Archivos A Modificar

MVP Training-only:

- `src/config.js`: `GLITCH_CANCEL_ENERGY_COST = 25` y flags `glitchCancelable` solo en punch/kick.
- `src/fighter.js`: consumir outcome de `#9`, campos de secuencia/feedback, can/try/end y precedencia de controles.
- `src/game.js`: habilitacion por trial, estado touch/status, feedback, anuncio/evento directo, reset y debug.
- `src/fighter_render.js`: indicador contextual y cortes estaticos de silueta.
- `src/hud_render.js`: trama de un segmento de 25 cuando cancel-ready.
- `src/audio.js`: perfil suplementario glitchCancel dentro del sistema existente.
- `src/i18n.js`: paridad ES/EN de trial, estados, errores, status y anuncios.
- `src/styles.css`: estados touch cancel-ready/used y forced-colors.
- `src/index.html`: solo si el selector/brief de `#9` requiere una opcion/estado adicional; no nuevas superficies.
- `tests/game.test.js`: reglas, limites, economia, inputs, reduced motion, Training y 30/60/120.
- `Readme.md`: prototipo Training-only y, tras rollout, regla publica realmente activa.
- `AGENTS.md`: contrato dual Special/Cancel, reset y smoke si el codigo se entrega.
- `BACKLOG.md`: estados de `#76` y dependencias solo con evidencia.
- `plans/plan_0041_profundidad_rejugabilidad_fase_2.md`: registrar gates `#9/#77` que habilitan Fase 3.
- `plans/plan_0042_diferenciacion_glitch_cancel_fase_3.md`: resultados, cohortes, gates y desviaciones.

No se prevén cambios en `src/input.js`, `src/ai.js`, `src/effects.js`, `src/arena_render.js` ni esquema de historial. Si fueran necesarios, detener y actualizar el plan.

## Plan De Implementacion

1. Completar Gate 0 sin codigo de Fase 3.
   Verificar: `#73` fisico, `#77` cohortes y trial host `#9` tienen evidencia/decision registrada; `#76` pasa a Ready solo entonces.

2. Rebaselinar contra `#9/#24/#16` realmente entregados.
   Verificar: reutilizar outcome/event/trial/help si existen; no duplicar. Actualizar archivos/criterios si difieren.

3. Congelar contrato por tick con regresiones fallidas antes de Fighter.
   Verificar: whiff-only, punch/kick, 25, 2->1, 1->0, 100 recovery/neutral, pending y simultaneos.

4. Implementar can/try/end en Fighter usando outcome de `#9`, sin UI.
   Verificar: neutral Special intacto, invalidos no mutan, una vez por secuencia y economia exacta.

5. Integrar opcion glitchCancel en trial host y resets.
   Verificar: solo Training/trial, preset 100, cuatro pasos, errores/retry, Free Training intacto, stats/historial excluidos.

6. Adaptar accion Special comun y touch contextual.
   Verificar: keyboard/pointer/gamepad misma accion; charging/cancel-ready/used/special-ready coherentes; no doble gasto.

7. Añadir feedback Canvas/DOM/reduced motion y audio suplementario.
   Verificar: texto/patron/borde siempre; sin flash/shake/hit-stop; status consulta coste/cuota; audio no esencial.

8. Ejecutar matrices Node y traza 30/60/120.
   Verificar: reglas/economia/secuencia/inputs/Training/reduced motion y suite completa verde.

9. Ejecutar browser/hardware/AT.
   Verificar: viewports, 200%, ES/EN, forced colors, touch/gamepad/teclado fisicos y screen readers; registrar no verificado si falta.

10. Ejecutar piloto recurrente y decidir.
    Verificar: comprension/preferencia/no-obligatoriedad/fallos por fuente; decision Reject/Retain Training/Promote Versus.

11. Si Promove Versus, habilitar en commit separado y actualizar Help.
    Verificar: regla compartida, CPU sin cancel, no onboarding, smoke/balance humano.

12. Solo tras Versus validado, habilitar Carrera en commit separado.
    Verificar: resets, cinco combates, intermisiones, retry, menu, historial y no progression.

13. Actualizar documentacion/backlog/planes segun gates reales.
    Verificar: `#76` nunca se marca Completed solo con Node; rollout/pendientes exactos.

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

Matriz de core:

- Recovery whiff punch/kick con 24: no cancel, no gasto.
- Con 25/26/99/100: cancel exacto y cooldown0; 100 deja75/no daño Special.
- Cooldown2->1 cancel; cooldown1->0 no cancel.
- Neutral25/99 no-op; neutral100 Special actual 100->0/daño base26 modificado por estilo/cooldown45.
- Hit/blocked, combo finishers, air, special, hit-stun, block/crouch/jump no cancelan.
- Intento invalido no sobrescribe outcome ni muta energia/cooldown/estado.

Pending/simultaneos:

- Pending+cancel valido: pending/combo/hint descartados, solo cancel.
- Pending+energia24: pending se ejecuta normal.
- En 1->0 pending precede Special.
- Special nunca entra pending.
- Cancel+Punch/Kick/Move simultaneo: solo cancel ofensivo y velX0; CPU/fisica avanzan.
- Recovery>0 + Block/transition real a Crouch/Jump + Special: postura gana, no cancel/coste y los latches se actualizan para exigir release.
- Cooldown0 + Jump/aire + Special conserva el Special aereo actual; eliminarlo queda fuera.
- Follow-up requiere edge nuevo; held no autoataca.

Secuencia:

- Primer cancel gasta25; segundo edge en follow-up misma secuencia no gasta.
- Tick neutral posterior rearma; nueva secuencia puede cancelar.
- Hit y transition real a block/crouch/jump/reset/KO/menu/round end terminan. Crouch pulsado sin entrar en state crouch no rearma.
- Pausa/hidden limpian input y combo/pending pero conservan cuota; hit-stop/intro congelan. Ninguno rearma ni ejecuta input retrasado.
- ClearAllInput/gamepad neutral evita cancel fantasma al reanudar.

Economia:

- Cuatro estilos pagan25; Tecnico solo altera ganancias.
- Cuatro ciclos completos whiff/cancel/tick neutral producen 75/50/25/0; quinto falla. Probar aparte cuota con energia suficiente en una misma secuencia.
- Contacto bloqueado conserva la ganancia actual del atacante y puede financiar un whiff posterior; no cambiar esa formula.
- Cancel no incrementa combo/Special/stats/medalla/historial.
- Mutacion atomica del tick Cancel sin direccion/follow-up conserva salud/x/y/rival/timer/score; solo energia/cooldown/state-velX/combo-cuota/feedback cambian.
- No automatizar win rate o preferencia.

Input:

- Keyboard default/remapped entra por keydown/keyup real del mock; pointer por down/up/cancel/lostcapture; gamepad standard por muestra neutral, boton3/release/disconnect. Cada adaptador demuestra un caso recovery+25 positivo, no solo mapas internos.
- Space/Enter del boton touch nativo usa el mismo gate contextual; Gamepad/Web Audio ausentes son no-op seguros.
- Dos fuentes simultaneas gastan una vez. Soltar/reprensar A mientras B sigue down no crea edge; soltar ambas, observar un fixed-step false y pulsar una crea edge segun cuota.
- Repeat/held no duplica; disconnect de una fuente no borra otra ni crea edge fantasma.
- Pointercancel/lostcapture, blur, hidden, disconnect y neutralizacion limpian.
- Touch tabla contextual energia 24/25/99/100 y recovery/neutral.

Presentacion/accesibilidad:

- getSpecialActionState cubre cuatro estados y firma DOM contextual.
- aria-disabled false solo si pulsar Special tendria resultado.
- Paridad de claves/placeholders ES/EN; ningun literal visible en CSS.
- Combat-status sigue no-live y consulta incluye coste/cuota/proxima accion.
- Exito/fallo por edge se anuncia una vez; disponibilidad no habla por frame.
- Reduced motion compara solo el tick de Cancel: energia/cooldown/cuota/salud/posicion/outcome/evento iguales; follow-up se valida por resultado eventual porque hit-stop ya difiere por diseño.
- Contraste de combinaciones conocidas calculado; pixel/forced-colors manual.

Fixed-step/modos:

- Una traza con seed/reloj reiniciado programa inputs por tiempo de simulacion en instantes comunes y los mantiene hasta observarse; tras igual numero de fixed-steps coincide a 30/60/120 en energia/salud/cooldown/outcome/cuota/posicion/timer/trialState/gameState.
- Frame1000ms sigue cap6 y no multiplica cancel.
- MVP positivo solo Training/trial; Versus/Arcade negativos hasta gates.
- Trial Especial 100->0 no se completa con Cancel 25.
- En specialSpend, feature deshabilitada: recovery+Special no gasta25; Special neutral real 100->0 completa.
- Reset Training limpia outcome/cuota/feedback/progreso.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: prototipo Training-only, regla dual Special/Cancel, coste/cuota y rollout real; no venderlo como publico antes de gate.
- `AGENTS.md`: orden por tick, elegibilidad, secuencia, resets, touch state, reduced motion y smoke durable.
- `BACKLOG.md`: `#76` Blocked->Ready->Partial/Completed solo por gates; `#73/#77/#9` actualizados con evidencia real.
- `plans/plan_0041_profundidad_rejugabilidad_fase_2.md`: registrar que #9/#77 habilitan Fase3 y cualquier API outcome/trial reutilizada.
- `plans/plan_0042_diferenciacion_glitch_cancel_fase_3.md`: registrar matrices, pruebas, hardware, cohortes, decision y alcance final.
- `PLANS.md`: sin cambios.

## Riesgos Y Mitigaciones

- Riesgo: ejecutar sin #9/#77. Mitigacion: Gate0 bloqueante y sin infraestructura paralela.
- Riesgo: dual Special confunde. Mitigacion: contexto/copy/estado autoritativo, trial, neutral100 intacto y piloto4/4 explica.
- Riesgo: hit/block cancel autosostiene presion. Mitigacion: MVP whiff-only punch/kick.
- Riesgo: pending y cancel dan ambos beneficios. Mitigacion: precedencia congelada, cancel paga/limpia pending y consume tick.
- Riesgo: cooldown1 cambia entre cancel/Special. Mitigacion: autoridad post-decremento y tests 2->1/1->0.
- Riesgo: cancel+ataque macro. Mitigacion: consume edges ofensivos, follow-up nuevo.
- Riesgo: loop de cancels. Mitigacion: cuota1/1, tick neutral para rearme y economia finita.
- Riesgo: Tecnico domina. Mitigacion: coste fijo; medir preferencia y ahorro Special, no cambiar estilo en MVP.
- Riesgo: touch no llega con25. Mitigacion: gate central getSpecialActionState, no chequeo energia duplicado.
- Riesgo: feedback satura HUD. Mitigacion: slot unico, segmento existente, 10 ticks y status no-live.
- Riesgo: movimiento/flash. Mitigacion: sin screen flash/shake/hit-stop; reduced motion estatico.
- Riesgo: audio esencial sin controles. Mitigacion: suplementario y no gate; puede omitirse si #30 bloquea.
- Riesgo: CPU no responde. Mitigacion: piloto Training; CPU sin cancel; #16 separado.
- Riesgo: rollout accidental. Mitigacion: elegibilidad mode+trial y tests negativos Versus/Arcade.
- Riesgo: estadisticas/esquema. Mitigacion: no match history/stats/medallas/persistencia.
- Riesgo: balance automatizado falso. Mitigacion: invariantes no-loop y usuarios; no win rates/seeds masivos.
- Riesgo: matriz explosiva. Mitigacion: core por accion canonica, una traza FPS y un caso por adaptador.
- Riesgo: cache assets. Mitigacion: bump de version solo cuando MVP aterriza y contrato estatico actualizado.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar.

Resultado de la revision:

- Gate0 bloquea implementacion y evita construir infraestructura paralela a `#9/#77`.
- Outcome/event host de `#9` es obligatorio; Fase3 no ofrece fallback ni duplica eventos.
- El MVP usa un trial Training existente; no query flag de Versus, menu, nuevo modo o rollout oculto.
- Elegibilidad se reduce a player1, whiff, punch/kick grounded, cooldown restante y coste25.
- Una accion existente, un coste, una cuota y un helper autoritativo; no nueva accion/input.
- No se añaden fases, cancel window parcial, cola, timer, event bus, persistencia o RNG.
- Pending, tick 2->1/1->0 y simultaneos quedan definidos; Block/Crouch/Jump ganan y Punch/Kick/Move se consumen por cancel valido.
- Estado touch/Canvas proyecta el proximo fixed-step, por lo que cooldown1 no anuncia cancel falso ni oculta un Special neutral legal.
- Feedback usa slots/sistemas existentes y reduced motion no cambia gameplay.
- Automatizacion protege economia/ausencia de doble beneficio; balance/preferencia queda en hardware/usuarios.
- La revision renombra no-loop/no-dominancia automatica a economia/ausencia de doble beneficio; dominancia se decide solo en piloto.
- Versus y Carrera son commits posteriores con gates; CPU/aire/hit/block cancel permanecen fuera.
- Los cambios previstos trazan directamente a `#76`; no hay backend, dependencia, refactor preventivo o progresion.

## Criterios De Aceptacion

- Gate0 registra #73 fisico, #77 y #9/trial host; el host esta presente, pero sin smoke/comprension aceptados no hay codigo Fase3.
- MVP existe solo en Training trial y solo para player1.
- Solo whiff punch/kick grounded con cooldown post-decremento >0, energia>=25 y cuota0/1 es elegible.
- Coste exacto25 independiente de estilo; no daño/energia/hit-stun/hit-stop/invulnerabilidad.
- Neutral100 conserva Special actual; recovery100 cancela a75.
- Tick2->1 cancela;1->0 no; pending/simultaneos cumplen precedencia.
- Recovery Block/Crouch/Jump gana sin coste; cooldown0 conserva Special aereo existente.
- Un cancel por secuencia; rearme solo tras tick neutral o transicion/interrupcion definida; pausa limpia pending pero conserva cuota.
- Keyboard/touch/gamepad comparten special y no duplican gasto.
- Touch/Canvas/status comunican charging/cancel-ready/used/special-ready ES/EN con texto/patron/ARIA.
- Reduced motion conserva informacion sin animacion fuerte y el tick atomico de Cancel mantiene gameplay igual; follow-up se compara por resultado eventual.
- Trial valida whiff, cancel100->75 y follow-up hit; errores no progresan.
- No cambia Free Training, Versus, Arcade, CPU, stats, historial, medallas o Fase2 trials.
- Regresiones core/economia sin doble beneficio/input/FPS pasan; browser/hardware/AT registrados.
- Piloto cumple4/4 comprension,3/4 preferencia,max1/4 obligatoriedad y limites por fuente.
- Versus solo tras piloto; Carrera solo tras Versus; CPU/aire/hit/block cancel fuera.
- Sintaxis de todos los JS, suite Node y git diff --check pasan.
- README/AGENTS/BACKLOG/planes reflejan alcance real y pendientes.

## Commit Y Push

Limites si se ejecuta:

1. `Record glitch cancel prerequisites`
   Gate0 y decisiones, sin codigo.
2. `Add training glitch cancel MVP`
   Core Fighter + trial + tests, Training-only.
3. `Add accessible glitch cancel feedback`
   Touch/Canvas/status/i18n/reduced motion/audio suplementario.
4. `Validate glitch cancel MVP`
   Browser/hardware/AT/usuarios y decision.
5. `Enable glitch cancel in versus`
   Solo tras gate, Help y tests negativos CPU/Carrera.
6. `Enable glitch cancel in arcade`
   Solo tras Versus, resets/run/historial.
7. `Complete phase-three docs`
   Estado final y pendientes.

Ejecutar pruebas focales antes de cada commit y suite completa antes del ultimo. No hacer commit ni push salvo solicitud explicita.

## Estado De Implementacion

Cerrado en alcance automatico: MVP Training-only implementado; expansiones bloqueadas.

La direccion explicita del usuario se tomo como aceptacion de Gate0 para ejecutar codigo, sin inventar evidencia humana. El repositorio sigue sin registros de las seis sesiones nuevas, cuatro recurrentes, timing fisico `#73`, hardware o lectores de pantalla.

Implementado:

- Opcion experimental `glitchCancel` dentro del selector de Training y fuera del progreso `n/4`.
- Solo P1 humano, punch/kick terrestre con outcome whiff, cooldown post-decremento mayor que cero, coste exacto25 y cuota una vez por secuencia.
- Special neutral100, trials Fase2, Free Training, CPU, Versus, Carrera, aire, hit/block, combos, stats e historial permanecen sin Cancel.
- Precedencia de pending/simultaneos, reset/interrupcion, estado touch/Canvas/HUD/status, anuncios discretos, reduced motion, forced-colors y audio suplementario.
- Paridad automatizada por teclado default/remapeado, pointer/cancel/lost-capture, gamepad standard boton3, fuentes simultaneas y activacion click de AT.

Desviacion documentada:

- El preset usa P1=440/CPU=660 en vez de 440/620. Con las hitboxes reales, kick desde 440 intersecta al rival en 620; 660 garantiza que punch y kick iniciales hagan whiff sin modificar rangos globales.

Validacion ejecutada:

- `155/155` pruebas Node aprobadas. GLITCH CANCEL cubre estilos, stats/historial/medallas, specialSpend, long-frame, fuentes, economia y traza 30/60/120.
- Todos los `src/*.js` pasan `node --check`; `git diff --check` correcto salvo avisos LF/CRLF de Windows.
- Smoke servido por HTTP en `1440x900` y `390x844`: menu/Training cargan sin errores y el experimento aparece en el selector.
- Revision estatica de accesibilidad corrigio activacion click de AT, nombre localizado del selector, anuncios discretos de fase, contraste/patron y proyeccion de pending.

Toda validacion humana de hardware, AT y el piloto Retain/Promote/Reject se transfirio exclusivamente al plan `0043`. Versus y Carrera permanecen deshabilitados; CPU/aire/hit/block/combos permanecen fuera de alcance y requieren un plan posterior si el gate promueve la regla.
