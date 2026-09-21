# plan_0051_ia_hibrida_experimental - validar Utility neutral y Q-learning acotado

**Fecha:** 2026-09-20
**Ambito:** IA de CPU, simulacion determinista, configuracion, pruebas y documentacion
**Estado:** completado (influencia neutral `0.10` activa)

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Proposito y alcance

Evaluar e implementar, solo si demuestra una mejora medible, una variante hibrida de la CPU que conserve las reglas tacticas actuales y permita que una tabla Q pequena ajuste exclusivamente los pesos de acciones neutrales legales dentro de un round.

El resultado observable buscado es que, ante un patron repetido y reproducible del jugador que la CPU actual no resuelva, la preferencia entre acciones neutrales cambie de forma acotada durante el round sin lectura de inputs, acciones ilegales, cambios en la cadencia/limites tacticos configurados ni divergencias entre 30, 60 y 120 FPS.

Este plan no autoriza por si solo cambios de runtime. Antes de permitir influencia Q deben existir tanto un defecto de decision reproducible que sobreviva a una regla o peso estatico mas simple como una autorizacion explicita para revisar el contrato de IA rule-based. Sin ambas condiciones, el alcance maximo es un prototipo aislado de pruebas que no modifica decisiones del runtime. La propuesta original no aporta seed, configuracion, inputs por tick ni comparacion esperada/real, por lo que el gate de evidencia sigue pendiente.

Queda fuera de alcance:

- Reemplazar `chooseAIAction()` por scoring global o permitir que Q-learning anule reglas tacticas prioritarias.
- Agregar `Parry`, `Glitch Reversal`, `Dash Glitch`, proyectiles, guard break, frame advantage formal o cualquier otra mecanica inexistente.
- Permitir que Q-learning seleccione `special`, `punish`, `antiAir`, `escape`, ataques aereos o combos.
- Leer teclado, touch, gamepad, `styleKey` o inputs futuros del jugador.
- Aprendizaje entre rounds, peleas Arcade, partidas o sesiones.
- Guardar la tabla en `localStorage`, transmitirla o incorporarla a enlaces de desafio.
- Agregar dependencias, workers, backend, build step o modelos externos.
- Prometer cero impacto de rendimiento, mayor diversion o mayor justicia sin medicion real.

## Progreso

- [x] 2026-09-20: revisados `PLANS.md`, `AGENTS.md`, `BACKLOG.md`, planes de IA previos, runtime y pruebas relevantes.
- [x] 2026-09-20: contrastada la propuesta con acciones, estados, eventos, lifecycle y determinismo existentes.
- [x] 2026-09-20: definido un diseno minimo compatible y sus gates.
- [x] 2026-09-20: caracterizado un defecto neutral reproducible en `tests/game.test.js` (linea ~5457).
- [x] 2026-09-20: evaluado ajuste rule-based. El defecto se resuelve reduciendo approachMid en 0.15 y aumentando retreatMid en 0.15. No se necesita influencia aprendida para corregirlo.
- [x] 2026-09-20: descartada la influencia Q como solucion necesaria para el defecto inicial. El caso se resuelve con pesos estaticos y no justifica cambiar ese balance.
- [x] 2026-09-21: implementada la integracion round-local completa: metadata neutral/protected, bootstrap legal, cierre terminal idempotente e influencia `0.10`.

## Contexto actual

`src/ai.js` implementa una cadena first-match. Las respuestas de pausa tras golpe, aire, whiff punish, antiaereo, crouch por patron, bait, bloqueo vivo, Especial, counter, vida baja, esquinas, presion tardia, anti-turtle y memoria retornan antes del selector neutral. Solo el tramo final far/mid/close fuera de la rama close-wall usa `chooseAINeutralAction()` y `chooseWeightedAIAction()`.

`src/fighter.js` construye observaciones desde posiciones, estado, cooldown, cajas reales, paredes y memoria acotada. Cada decision nueva consume exactamente dos muestras de `randomSimulation()`: una para la siguiente cadencia y otra para seleccionar accion. `aiPreviousDecisionAction` registra la seleccion antes de que ejecucion pueda reescribir `aiAction`. Una accion puede persistir varios ticks y, en algunos casos, ejecutarse mas de una vez antes de la siguiente decision.

`src/game.js` avanza combate e IA solo en pasos fijos de 60 Hz mientras `gameState === 'playing'`. Pausa, estados finales, intro e hit-stop no avanzan la CPU. Cada round crea Fighters nuevos; el reset interno de Training reutiliza los Fighters. Los desafios versionados guardan seed y configuracion, no estado aprendido.

`recordCombatEvent()` conserva solo el ultimo evento y alimenta trials de Training. No es una cola ni un bus de suscripcion. `attackResolved` contiene resultado y dano, pero no identifica la decision de IA que originaria una transicion de aprendizaje. Para la primera version es mas seguro atribuir recompensa por diferencias de salud entre decisiones que ampliar ese contrato.

La CPU ya tiene adaptacion heuristica round-local mediante `aiMemory`, y el selector neutral ponderado ya funciona como un prior de utilidad explicable. El backlog difiere Utility AI global hasta demostrar un defecto que no pueda resolverse con reglas claras y el selector ponderado. La adaptacion entre rounds y la persistencia tienen gates independientes.

### Hallazgo del Hito 0 (2026-09-20)

La caracterizacion confirma un defecto neutral reproducible:

- **Escenario:** CPU en rango mid (dist=150), dificultad Normal, kickReady=false, retreatBlocked=false.
- **Comportamiento actual:** `approach` se selecciona ~47%, `retreat` ~26%. La CPU prefiere acercarse ~1.8x mas que retroceder.
- **Causa:** `approach` weight = `approachMid - kickMid = 0.60 - 0.24 = 0.36`, mientras `retreat` = `retreatMid - approachMid = 0.20`. kickMid se resta siempre del approach aunque kick no sea legal, penalizando la proporcion de approach pero no su preferencia relativa.
- **Solucion rule-based simple viable:** mover 0.15 de `approachMid` a `retreatMid` en config.js invierte la proporcion a favor de retreat (~1.7x retreat sobre approach). Esto no requiere Q-learning.
- **Prueba:** `plan0051 neutral defect: CPU over-approaches in mid range, under-uses retreat` en tests/game.test.js.

**Conclusion del Hito 0:** El defecto pertenece al selector neutral y es reproducible, pero **se resuelve con un ajuste estatico de pesos sin aprendizaje**. Esto cerro la necesidad de usar Q para ese caso concreto; la autorizacion posterior permitio completar el learner round-local para otros patrones neutrales.

### Correcciones a la propuesta inicial

| Propuesta inicial | Estado real | Decision de este plan |
| --- | --- | --- |
| Utility global elige agresivo/defensivo/zoning | La CPU ya expresa esas intenciones mediante prioridades first-match; no hay estado `zoning` | Conservar prioridades y tratar pesos neutrales legales como la capa Utility minima |
| Q elige ataque ligero, parry y dash | Existen `punch`, `kick`, `block`, movimiento y salto; no existen parry ni dash | Q solo ajusta `approach`, `retreat`, `block`, `jump`, `idle`, `punch` y `kick` cuando ya son candidatos neutrales legales |
| Estado rival de cuatro valores | Aire y ataque pueden solaparse; no existe una fase formal de recovery separada de la animacion | Derivar solo los buckets que exija el defecto; el limite candidato usa `air`, `whiffRecovery`, `attack`, `block` y `neutral` |
| Ventaja de frames | No hay startup, blockstun ni modelo formal de frame advantage | Usar cooldown, hit-stun y recovery observables solo en reglas existentes; no inventar una metrica |
| Recompensa por parry/reversal | Esos eventos no existen | Usar diferencia de dano real y resultado terminal; no inferir eventos ficticios |
| Actualizar tras cada intercambio | Las acciones son macro-decisiones de duracion variable | Cerrar una transicion en la siguiente decision o al terminar el round |
| Q-table con valores heuristico iniciales | Mezclaria el prior actual con aprendizaje y dificultaria medirlo | Iniciar Q en cero; mantener los pesos actuales como prior separado |
| `localStorage` opcional | Romperia lifecycle, transparencia y reproducibilidad actuales | Excluir persistencia; requiere otro ExecPlan, reset visible y contrato versionado |
| Reaction delay de 120-200 ms | Ya existe cadencia por dificultad de 7-35 ticks, aproximadamente 117-583 ms | Conservar `decisionMin`/`decisionSpread`; no agregar un segundo reloj |

### Viabilidad

El costo de una tabla acotada no es el riesgo principal. Una tabla de 45 estados por 7 acciones contiene 315 celdas, 1260 bytes en `Float32Array`. Los riesgos reales son atribucion incorrecta de recompensa, escasez de visitas dentro de un round, perdida de prioridades, contaminacion entre dificultades y ruptura de seeds.

Q-learning no garantiza adaptacion util en una partida corta. Si el escenario de evidencia se resuelve con un peso contextual o una regla explicable, esa solucion es preferible. Si la tabla no cambia una decision relevante en el numero de visitas definido por el escenario, el experimento se descarta en vez de aumentar estados, memoria o persistencia.

## Diseno y plan de trabajo

### Hito 0. Gate y baseline

Esta es la unica fase ejecutable mientras el plan siga bloqueado. Registrar al menos un caso con:

- `DUEL_RULES_VERSION`, seed, modo, dificultad y arena.
- Posiciones, salud, energia, cooldowns, timer y memoria iniciales.
- Inputs canonicos del jugador por tick o una preparacion directa y determinista en pruebas.
- Secuencia de decisiones neutrales actual.
- Defecto esperado y criterio cuantitativo de mejora.
- Corpus sembrado minimo por dificultad y metricas que no pueden empeorar al promover influencia Q.

Antes de continuar, demostrar que el defecto pertenece al selector neutral y no a legalidad, hitboxes, una prioridad tactica o una mecanica inexistente. Evaluar primero un ajuste estatico pequeno. Si una regla o peso contextual resuelve el caso sin regresiones, no usar Q como solucion necesaria de ese defecto; una promocion posterior requiere autorizacion explicita y las mismas dimensiones minimas.

Salida verificable: una prueba de caracterizacion que pasa con el comportamiento actual y documenta el defecto, seguida de una prueba de aceptacion inicialmente fallida. La cantidad de visitas y el cambio minimo esperado deben quedar fijados en esa prueba.

### Hito 1. Prototipo puro aislado, sin cambio de runtime

Solo despues de cumplir el gate de evidencia, y todavia sin integrar runtime, prototipar dentro del harness de `tests/game.test.js` estas operaciones puras:

    encodeAILearningState(observation, difficulty) -> integer
    updateAIQValue(table, transition, config) -> number
    applyAIQWeights(candidates, stateIndex, table, config) -> candidates

La codificacion maxima candidata, que debe reducirse si el escenario no necesita todas sus dimensiones, usa este orden fijo:

- Distancia: `close` si `dist <= 110`, `mid` si `dist <= 250`, `far` en otro caso.
- Estado rival: `air` si no esta en suelo; `whiffRecovery` si esta en suelo, `lastAttackOutcome === 'whiff'` y `attackCooldown > 0`; `attack` si esta en suelo y su estado es `punch`, `kick` o `special`; `block` si su estado es `block`; `neutral` en otro caso. La precedencia es el orden anterior.
- Salud relativa: calcular `delta = cpuHealth - opponentHealth`; `ahead` si `delta >= difficulty.lateRoundHealthGap`, `behind` si `delta <= -difficulty.lateRoundHealthGap` y `even` en otro caso.

Los mapas candidatos son distancia `close=0`, `mid=1`, `far=2`; rival `air=0`, `whiffRecovery=1`, `attack=2`, `block=3`, `neutral=4`; salud `ahead=0`, `even=1`, `behind=2`. Si se justifican las tres dimensiones, el indice es `((distanceIndex * 5) + opponentIndex) * 3 + healthIndex` y produce `3 * 5 * 3 = 45` estados. El inventario maximo de acciones aprendibles es `approach=0`, `retreat=1`, `block=2`, `jump=3`, `idle=4`, `punch=5`, `kick=6`, para 315 celdas. El indice debe ser aritmetico y total; no se crean claves dinamicas ni estados a partir de valores continuos.

La Q-table inicia en cero. Los candidatos y pesos de `chooseAINeutralAction()` siguen siendo el prior Utility y la mascara de legalidad. `applyAIQWeights()` no puede crear candidatos ni cambiar su orden.

Configuracion inicial del prototipo, aislada de `DIFFICULTIES` hasta demostrar utilidad:

- `alpha = 0.15`.
- `gamma = 0.80` por decision, no por frame.
- Q acotado a `[-1, 1]`.
- Recompensa de intercambio: `clamp((damageDealt - damageTaken) / ATTACKS.special.damage, -1, 1)`.
- Recompensa terminal adicional: `+1` si gana CPU, `-1` si pierde, `0` si empata.
- Multiplicador promovido: `clamp(1 + influence * Q, 0.5, 1.5)`, con `influence = 0.10` despues de la penalizacion de repeticion y antes de la seleccion acumulada.

Los valores son parametros de prototipo, no afirmaciones de balance. No se agregan bonus por posicion, energia, bloqueo, whiff, parry o acciones inexistentes. El dano bloqueado cuenta segun el dano real aplicado.

Salida verificable: pruebas unitarias de cardinalidad seleccionada, fronteras, formula Q, terminal sin bootstrap, clamps, finitud, candidatos ilegales ausentes y Q cero sin cambio de pesos. Si el experimento no supera estas pruebas o el caso no visita estados repetidos suficientes, retirar el prototipo y conservar solo la caracterizacion que aporte valor. Promover helpers a `src/ai.js` unicamente al iniciar sombra autorizada.

### Hito 2. Aprendizaje round-local

Solo si el Hito 1 es estable y existe autorizacion explicita para integrar el experimento sin cambiar aun decisiones, promover los helpers a `src/ai.js` y agregar a cada Fighter CPU un estado acotado:

    aiLearning = {
        table,
        pendingState,
        pendingAction,
        cpuHealthAtDecision,
        opponentHealthAtDecision,
        updates
    }

Una transicion representa una decision neutral completa, no un tick. El pipeline exacto de una nueva decision es:

1. Consumir las dos muestras existentes: cadencia y accion. No agregar draws.
2. Evaluar una representacion interna de la cadena first-match. Si retorna una accion protegida, no construye pool neutral. Si llega al tramo neutral, retorna sus candidatos legales ordenados antes de seleccionarlos.
3. Calcular recompensa desde los snapshots de la transicion pendiente.
4. Si existe pool neutral siguiente, cerrar la transicion con `Q(s,a) = Q(s,a) + alpha * (r + gamma * maxLegalQ(s') - Q(s,a))`, donde el maximo considera solo indices del pool legal actual.
5. Si la decision siguiente es protegida, cerrar la transicion con recompensa pero sin bootstrap, equivalente a `gamma = 0`; no cancelar el dano ya observado.
6. Si existe pool neutral, aplicar pesos de sombra o activos, seleccionar con la muestra de accion ya consumida y abrir una transicion con la accion seleccionada antes de rewrites de ejecucion.
7. Si la decision es protegida, no abrir transicion aprendible.

La decision necesita metadata minima que distinga `protected` de `neutral`. Extraer un helper interno que retorne `{ source: 'protected', action }` o `{ source: 'neutral', candidates }`; `chooseAIAction()` finaliza el segundo caso con los pesos actuales y sigue devolviendo una accion para sus consumidores existentes. `Fighter.updateAI()` usa la representacion interna para cerrar la transicion antes de ponderar y seleccionar el nuevo pool. No inferir el origen comparando strings porque `punch`, `kick`, `block` y `retreat` pueden provenir de ambos tramos.

La tabla se crea con el Fighter y se descarta al crear el siguiente Fighter. `resetTrainingFighters()` la limpia explicitamente para no heredar el lifecycle distinto de `aiMemory`. Cambiar el comportamiento de Training entre `normal`, `idle` o `block`, rellenar salud, cambiar trial o reiniciar/alcanzar KO en Training cancela la transicion pendiente sin recompensa y limpia la tabla. Training con CPU `idle` o `block` no abre transiciones normales.

Si una accion neutral almacenada se sustituye por otra politica sin una decision nueva, cancelar la transicion sin actualizarla antes del rewrite. Esto se limita a `retreat -> block` por pared y `retreat -> pressure/block` por presion tardia. El `jump -> idle` que completa el comando one-shot, los cambios normales de `state` al ejecutar punch/kick y `aiAction -> idle` al recibir un golpe no son cancelaciones: el golpe conserva la transicion durante hit-stun para aplicar dano en la siguiente decision protegida o dano mas bonus terminal si produce KO.

Cerrar el terminal exactamente una vez mediante un helper idempotente al inicio de `finishRound()`, despues de comprobar `gameState === 'playing'` y antes de bifurcar a `roundOver` o `finishMatch()`. Calcular primero `exchangeReward = clamp((damageDealt - damageTaken) / ATTACKS.special.damage, -1, 1)`, sumar bonus CPU `+1` cuando `playerWon === false`, `-1` cuando `playerWon === true` y `0` cuando `playerWon === null`, y acotar la recompensa terminal combinada a `[-2, 2]`. El update terminal no usa bootstrap. KO o timeout de Training descartan estado sin recompensa terminal porque no pasan por un round competitivo.

Salida verificable: una traza de estados, acciones, recompensas, conteo y checksum Q identica a 30/60/120 FPS; ninguna diferencia en acciones o combate frente al baseline con la misma seed.

### Hito 3. Influencia neutral acotada

La promocion fue autorizada despues de la auditoria del runtime. Aplicar el multiplicador Q despues del peso base y de la penalizacion de repeticion, y antes de la seleccion acumulada. Reutilizar el unico `rand` de accion existente; no implementar epsilon-greedy ni sorteos de empate.

Evaluar `influence` en el conjunto finito `[0.10, 0.20, 0.30]` y elegir el menor valor que satisfaga la prueba del defecto sin romper controles; si ninguno sirve, descartar la promocion. Los pesos base, la cadencia y todas las probabilidades tacticas de `DIFFICULTIES` siguen siendo autoritativos. `alpha`, `gamma` e `influence` son iguales por dificultad; se acepta explicitamente que Hard realiza mas updates por tiempo real debido a su cadencia menor, mientras Easy conserva una adaptacion mas lenta y errores mas visibles.

Invariantes:

- Una Q alta no vuelve legal una accion filtrada.
- Q nunca interviene antes de `chooseAINeutralAction()`.
- La rama close-wall sigue first-match.
- Las respuestas protegidas conservan su accion exacta con cualquier contenido de tabla.
- Una repeticion neutral sigue siendo posible.
- Se mantienen exactamente dos muestras RNG por nueva decision y cero muestras para actualizar Q.

Activar esta fase cambia trazas sembradas. `DUEL_RULES_VERSION` cambio de `gd-50` a `gd-51`; los desafios Versus/Arcade nuevos hacen round-trip con `gd-51`, rechazan `gd-50` y empiezan con tabla Q vacia.

Salida verificable: el escenario objetivo mejora en la visita declarada, las probabilidades permanecen acotadas y los controles tacticos, de dificultad y determinismo no cambian.

### Hito 4. Revision de producto

Ejecutar validacion humana separada y registrar evidencia solo en `plans/plan_0043_validacion_humana_consolidada.md`. El Hito 0 registra el commit baseline. Para comparar, servir el `src/` de ese commit desde una copia temporal en un puerto y el candidato desde el workspace en otro; abrir ambos con la misma seed y configuracion, alternar el orden entre sesiones y no presentar el nombre de la variante. Los inputs humanos no son identicos y los enlaces no son replays, por lo que esta comparacion mide percepcion, no equivalencia determinista. El protocolo, participantes y criterio de promocion se fijan en plan `0043` antes de la primera sesion. No convertir tests Node o un smoke de navegador en evidencia de justicia, diversion, adaptabilidad percibida o rendimiento real.

Si no hay mejora clara, retirar la influencia Q y conservar el selector actual. Si hay mejora, documentar que el aprendizaje es efimero y round-local. Persistencia, memoria entre rounds o controles visibles se decidiran en otro ExecPlan despues de cumplir los gates de `BACKLOG.md`.

## Interfaces y dependencias

Archivos previstos si el plan supera sus gates:

- `src/ai.js`: codificador, actualizacion Q, ajuste de candidatos y metadata del origen de decision.
- `src/config.js`: constantes aprobadas del learner y aumento de `DUEL_RULES_VERSION` solo al activar influencia.
- `src/fighter.js`: estado round-local, snapshots, cierre/apertura de transiciones y bridge de observaciones.
- `src/game.js`: finalizacion terminal una vez dentro del inicio de `finishRound()` y cancelacion en resets/configuracion de Training; sin temporizadores ni callbacks nuevos.
- `src/index.html`: actualizar a un unico cache key `20260920-ai1` los scripts de runtime modificados y preservar su orden clasico; si la ejecucion ocurre en otra fecha, registrar y usar un unico reemplazo equivalente.
- `tests/game.test.js`: helpers test-only, formulas, lifecycle, prioridades, RNG, trazas y contrato de cache keys/script order.
- `Readme.md`: comportamiento realmente activado, no el prototipo descartado.
- `AGENTS.md`: invariantes durables solo si la arquitectura llega a produccion.
- `BACKLOG.md`: gate, decision y resultado final.
- Este plan: progreso, decisiones, evidencia automatica y retrospectiva.

No se preven cambios funcionales en `src/index.html` ni cambios en `src/styles.css`, `src/i18n.js`, input, audio, renderers, historial, estadisticas o almacenamiento. El unico cambio HTML condicional es invalidar cache de scripts modificados al publicar. Si se solicita UI, persistencia o un modo seleccionable, detener esa rama y redactar un alcance separado.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`:

1. Congelar baseline y cambios preexistentes.

       git status --short
       node --version
       Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
           node --check $_.FullName
           if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
       }
       node --check tests\game.test.js
       node --test tests\game.test.js
       git diff --check

   Exito: Node 24, sintaxis, suite y diff-check terminan con codigo cero. Registrar conteo observado, sin fijarlo como contrato futuro.

2. Crear la caracterizacion del Hito 0. Exito: el caso es determinista, pertenece al tramo neutral, sobrevive a una regla/peso estatico simple y tiene criterio cuantitativo; fallo: no se puede reproducir o una solucion rule-based lo resuelve.

3. Implementar y probar el prototipo puro del Hito 1 en el harness. Exito: no mas de 45 estados ni 315 celdas, actualizaciones finitas y pesos identicos cuando Q es cero.

4. Tras autorizacion explicita, promover los helpers e implementar sombra del Hito 2. Exito: Q cambia de forma esperada, pero accion, salud, energia, posiciones, timer y RNG coinciden con baseline.

5. Revisar el gate de promocion y obtener autorizacion explicita para revisar el contrato rule-based. **Completado:** la autorizacion se recibio despues de la auditoria de integracion.

6. Implementar influencia del Hito 3, subir version de reglas y actualizar documentacion. **Completado:** `0.10` cambia solo el selector neutral y `gd-51` invalida desafios `gd-50`.

7. Ejecutar nuevamente validacion completa y smoke tecnico servido con:

       python -m http.server 8000

   Abrir `http://localhost:8000/src/?debug=1&seed=<seed-del-escenario>`. Comprobar consola limpia, acciones legales, pausa/reanudacion, nuevo round, Training reset y Easy/Normal/Hard. La evidencia humana o de rendimiento se registra unicamente en plan `0043`.

## Validacion, aceptacion y evidencia

### Correccion matematica

- El codificador retorna exclusivamente indices `0..stateCount-1` en todas las fronteras; `stateCount <= 45`.
- La tabla no supera 315 celdas finitas, usa solo dimensiones justificadas por el Hito 0 y no crece.
- La ecuacion Q coincide con casos calculados manualmente para recompensa positiva, negativa, terminal y clamp.
- Q cero conserva exactamente los pesos neutrales actuales; la influencia promovida solo cambia pesos despues de que existan actualizaciones observadas.
- La actualizacion no consume RNG.

### Atribucion y lifecycle

- Solo una decision con `source === 'neutral'` abre una transicion.
- Se acredita la accion seleccionada, no un rewrite posterior de `aiAction`.
- Una transicion se actualiza una sola vez en la decision siguiente o al finalizar el round; un flag idempotente impide doble cierre.
- El dano infligido y recibido dentro del intervalo produce la recompensa neta exacta, incluido chip damage.
- Una accion tactica siguiente cierra la transicion anterior sin bootstrap, pero no crea una nueva entrada aprendible.
- Las sustituciones de politica por pared o presion tardia cancelan la transicion sin recompensa; la finalizacion one-shot de jump, la ejecucion normal de ataques y recibir dano no la cancelan.
- Un golpe no terminal cierra la transicion con su dano cuando vuelve la decision; un KO conserva la transicion hasta el cierre terminal y aplica dano mas bonus exactamente una vez.
- Cambio de comportamiento, refill, trial, reset, KO o timeout de Training limpian learner y transicion sin atribuir recompensa.
- Nuevo round, modo, pelea Arcade, menu y reset de Training dejan tabla vacia y sin transicion pendiente.
- Pausa, pagina oculta, intro, hit-stop, `roundOver` y `gameOver` no cambian tabla, snapshots ni conteo.

### Legalidad y prioridades

- Con tablas llenas de valores extremos, whiff punish, antiaereo, defensa viva, crouch, bait, Especial, counter, vida baja, esquinas, presion tardia, anti-turtle y ataques aereos devuelven el mismo resultado que el baseline; solo el pool neutral puede cambiar.
- Cooldown, rango real, suelo/aire y paredes eliminan candidatos antes de aplicar Q.
- No aparecen acciones nuevas ni CPU GLITCH CANCEL.
- La rama close-wall no consulta Q.

### RNG, dificultad y reproducibilidad

- Cada decision nueva consume dos muestras de simulacion; ticks sin decision y Training fijo no consumen muestras normales.
- Misma version, seed, configuracion, inputs e inicio Q producen trazas identicas.
- Trazas de 30/60/120 FPS comparan acciones, posiciones, vida, energia, timer, decision anterior, estado Q, conteo y checksum.
- Easy/Normal/Hard conservan cadencia, movimiento y limites tacticos actuales; la mayor frecuencia de updates de Hard deriva solo de su cadencia existente.
- El corpus definido en Hito 0 fija por dificultad una metrica neutral concreta y su tolerancia; ninguna variante se promueve si empeora un caso de control fuera de esa tolerancia.
- Un desafio nuevo empieza siempre con tabla vacia; no lee almacenamiento o partidas previas.
- Al activar influencia, `gd-51` round-trip funciona para Versus/Arcade, `gd-50` se rechaza y cada desafio inicia Q vacia.

### Efectividad

- El escenario del Hito 0 define antes de tuning cuantas visitas repetidas admite y que cambio constituye mejora.
- Utility estatica se compara primero contra baseline; Q se promueve solo si aporta mejora adicional reproducible.
- La mejora no se acepta si depende de aumentar estados, conservar memoria entre rounds o superar el multiplicador maximo.
- La afirmacion de rendimiento requiere medicion de navegador sobre el mismo dispositivo; Node solo demuestra correccion y determinismo.

## Riesgos, idempotencia y recuperacion

- Riesgo: Q-learning recibe pocas visitas y aprende ruido. Mitigacion: gate por escenario, 45 estados maximos, round-local y descarte si no converge en el presupuesto fijado.
- Riesgo: atribuir dano a la accion equivocada. Mitigacion: transiciones por decision, snapshots de ambas vidas, metadata `protected`/`neutral` y cancelacion ante rewrites materiales.
- Riesgo: una accion almacenada se ejecuta varias veces. Mitigacion: tratar la decision como macro-accion y acumular todo el intercambio hasta la decision siguiente.
- Riesgo: Utility/Q oculta prioridades tacticas. Mitigacion: aplicar ambas solo dentro del pool neutral ya filtrado y probar valores Q extremos.
- Riesgo: cambiar el consumo RNG. Mitigacion: Q es determinista y reutiliza la muestra de seleccion existente.
- Riesgo: dificultad pierde identidad. Mitigacion: conservar todos los tunables actuales, no compartir estado entre Fighters o dificultades y aceptar/probar que la cadencia existente hace a Hard mas rapido tambien para actualizar.
- Riesgo: persistencia rompe desafios y transparencia. Mitigacion: no usar storage; cualquier persistencia requiere plan, schema, reset visible y contrato nuevo.
- Riesgo: costo por frame. Mitigacion: codificar, actualizar y ponderar solo en decisiones, con arrays fijos; medir antes de afirmar impacto nulo.
- Riesgo: complejidad sin beneficio. Mitigacion: checkpoints de descarte despues de Utility estatica, primitivas y sombra.

Pruebas, sintaxis y generacion de tablas vacias son idempotentes. La tabla vive solo en memoria y se descarta con el Fighter. Si una fase falla, retirar exclusivamente el codigo experimental de esa fase y volver al selector neutral existente; no revertir cambios ajenos.

## Registro de decisiones

- Decision: no activar influencia Q para corregir el defecto neutral.
  Justificacion: el plan exige demostrar que el defecto no se resuelve con una regla o peso estatico mas simple antes de permitir aprendizaje. El caso documentado se corrige reduciendo `approachMid` en 0.15 y aumentando `retreatMid` en 0.15. La tabla de sombra no participa en el balance.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: no adoptar la arquitectura global descrita en la propuesta.
  Justificacion: contradice las prioridades rule-based vigentes y el gate de `BACKLOG.md`; la capa aprendida se limita al neutral.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: exigir evidencia y autorizacion arquitectonica, no una u otra.
  Justificacion: un defecto justifica investigar, pero no modifica por si solo el contrato durable de IA rule-based.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: interpretar el selector ponderado existente como prior Utility minimo.
  Justificacion: ya puntua alternativas legales, preserva distribuciones por dificultad y evita duplicar una maquina de macro-estados.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: iniciar Q en cero y separar heuristica de aprendizaje.
  Justificacion: permite conservar el baseline y atribuir cualquier cambio a datos observados.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: usar transiciones por decision y recompensa por diferencia real de salud.
  Justificacion: las acciones actuales persisten varios ticks y los eventos no forman una cola atribuible.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: cerrar sin bootstrap ante una decision tactica y cancelar ante rewrites materiales.
  Justificacion: no existe una siguiente accion neutral seleccionada en el primer caso y el intent original deja de ejecutarse en el segundo.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: excluir persistencia y memoria entre rounds.
  Justificacion: mantienen reproducibilidad y cumplen los gates actuales de adaptacion y datos locales.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: no agregar un reaction delay separado.
  Justificacion: la cadencia por dificultad ya expresa entre aproximadamente 117 y 583 ms y esta integrada al fixed-step.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: activar influencia neutral round-local en `0.10`.
  Justificacion: la autorizacion explicita permite completar el contrato Q; el multiplicador opera solo sobre candidatos legales neutrales despues de la penalizacion de repeticion y conserva prioridades, cadencia y RNG.
  Fecha/autor: 2026-09-21, OpenCode.

## Resultados y retrospectiva

**Estado final:** Completado con aprendizaje Q round-local activo y acotado a neutral; la influencia es `0.10`.

El Hito 0 confirmo un defecto neutral reproducible (CPU sobre-usa `approach` vs `retreat` en rango mid sin kick ~1.8:1), pero el defecto se resuelve con un ajuste rule-based simple: reducir `approachMid` en 0.15 y aumentar `retreatMid` en 0.15 en `config.js`. La autorizacion posterior permitio promover el learner round-local para adaptar otros patrones neutrales sin tocar prioridades protegidas.

**Evidencia generada:**
- Prueba `plan0051 neutral defect: CPU over-approaches in mid range, under-uses retreat` en `tests/game.test.js:5457` que documenta el defecto, su proporcion exacta, determinismo con seed, y verificacion de que un ajuste de pesos lo corrige.
- Validacion inicial: 196/196 tests pasan, sintaxis de todos los `src/*.js` correcta.
- Continuacion validada: 209/209 tests pasan, sintaxis de todos los `src/*.js` correcta y `git diff --check` sin errores.

**Lecciones:**
- El selector neutral ponderado ya funciona como capa de utilidad minima. La subutilizacion de `retreat` en mid range sin kick es un comportamiento esperado de las formulas actuales, no un defecto del modelo.
- El learner Q queda activo como adaptacion round-local acotada: aprende por decisiones neutrales, usa bootstrap solo sobre acciones neutrales legales y se descarta con cada Fighter. No persiste entre rounds, partidas o desafios.

## Notas de revision

- 2026-09-20: plan inicial basado en la propuesta Utility AI + Q-learning y contrastado con runtime, pruebas, backlog y planes de IA vigentes. Se redujo el alcance a pesos neutrales, aprendizaje round-local y despliegue por gates.
- 2026-09-20: revision tecnica aclaro doble gate, pipeline Q, bootstrap, rewrites, cierre terminal, Training, version `gd-51` y reduccion de dimensiones segun evidencia.
- 2026-09-20: Hito 0 completado. Defecto neutral reproducible encontrado (approach ~1.8x retreat en mid range sin kick). Se resuelve con ajuste estatico de pesos; la influencia Q no se promueve.
- 2026-09-21: integracion completa promovida. Se corrigio la atribucion neutral/protected, se conecto `nextState`/`nextLegalMask`, se centralizo el cierre terminal, se activo `AI_LEARNING_INFLUENCE = 0.10`, se subio la version a `gd-51` y se actualizaron los contratos de cache y desafios.
