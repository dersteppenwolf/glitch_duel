# Exec Plan: variacion neutral ponderada de la CPU

## Objetivo

Reducir la repeticion inmediata entre nuevas decisiones neutrales de la CPU sin volverla aleatoria, opaca o injusta. La CPU conservara sus reglas tacticas prioritarias y elegira entre acciones neutrales legales mediante pesos deterministas, penalizando de forma acotada la decision inmediatamente anterior.

Este plan propone el item `#78 Variacion neutral ponderada de la CPU`. Su creacion no autoriza codigo por si sola.

Experiencia esperada:

- Entre decisiones neutrales nuevas, la probabilidad matematica de repetir inmediatamente una accion disminuye sin llegar a cero.
- Una accion repetida sigue siendo posible, pero tiene la mitad de su peso en la siguiente decision neutral.
- Una accion ilegal por rango, cooldown o pared nunca aparece y su masa se redistribuye entre las alternativas legales.
- La misma seed, estado e inputs producen la misma traza a 30/60/120 FPS.

Queda fuera del alcance:

- Cambiar whiff punish, crouch defensivo, bait, bloqueo vivo, counter, Especial, low-health, presion tardia, anti-turtle o memoria del jugador.
- Behavior trees, Utility AI, scoring global, lookahead, machine learning o servicios remotos.
- Intenciones de varios pasos, action queues, perfiles por round o personalidades seleccionables (`#23`).
- Adaptacion entre rounds (`#49`), lectura de `styleKey`, reapertura de `#18/#19` o persistencia de IA.
- Nuevos ataques, dano, rangos, cooldowns, economia de energia o cambios de controles.
- Cambiar la posible reejecucion de un ataque almacenado antes de la siguiente decision; se caracterizara, pero cualquier correccion sera otro alcance.
- Afirmar justicia o menor predictibilidad percibida a partir de mocks. Una evaluacion humana futura requiere un plan separado.

## Contexto Actual

- El plan `0044` cerro la hoja de ruta anterior: `#16/#17/#18/#19` tienen decision final y `#23/#49` permanecen diferidos.
- `chooseAIAction()` en `src/ai.js` es una cadena first-match. Las reglas tacticas retornan antes y las decisiones neutrales estan al final: lejos `dist > 250`, medio `110 < dist <= 250` y cerca `dist <= 110`.
- Cada decision nueva consume dos muestras de `randomSimulation()` en `Fighter.updateAI()`: una para `aiDecisionTimer` y una `rand` para la accion. Todas las comparaciones de `chooseAIAction()` reutilizan esa segunda muestra.
- La CPU recuerda ataques, bloqueo, tipo, zona, aire y repeticion del jugador, pero no conserva su propia decision anterior.
- `aiAction` persiste entre decisiones. En Easy, un ataque almacenado puede volver a ejecutarse despues de su cooldown antes de una nueva decision; este plan no cambia esa semantica.
- Construir un `Fighter` nuevo reinicia accion, timer y memoria. Esto ocurre al iniciar round, modo, pelea Arcade y menu. Pausa y retorno de pagina oculta conservan el estado.
- Los resets internos de Training reutilizan Fighters y hoy conservan memoria de IA. La nueva decision anterior seguira esa misma vida util.
- La suite de referencia pasa `162/162` pruebas antes de este plan.

Distribucion neutral efectiva actual cuando todas las opciones son legales, no se activa una regla tactica anterior, no hay pared y close esta dentro de `ATTACKS.punch.range`:

| Zona | Accion | Easy | Normal | Hard |
| --- | --- | ---: | ---: | ---: |
| Lejos | approach | 65% | 85% | 95% |
| Lejos | idle | 35% | 15% | 5% |
| Medio | kick | 12% | 24% | 38% |
| Medio | approach | 33% | 36% | 34% |
| Medio | retreat | 20% | 20% | 14% |
| Medio | jump | 23% | 15% | 7% |
| Medio | block | 12% | 5% | 7% |
| Cerca | punch | 25% | 40% | 52% |
| Cerca | kick | 27% | 35% | 36% |
| Cerca | block | 26% | 15% | 8% |
| Cerca | reposicion | 22% | 10% | 4% |

Estos porcentajes provienen de intervalos acumulados existentes, no de probabilidades independientes. El cambio los conserva como baseline cuando todas las acciones son legales; la diferencia intencional aparece al filtrar acciones y al penalizar una repeticion.

Suposiciones explicitas:

- "Menos predecible" significa aqui mayor variedad determinista entre alternativas legales, no aleatoriedad por frame ni una afirmacion de percepcion humana.
- No existe contrato de compatibilidad para reproducir exactamente las trazas historicas de una seed despues de cambiar la seleccion; si existe contrato de reproducibilidad para la nueva version.
- Las prioridades y fronteras actuales de source/tests son autoritativas. En particular, anti-turtle se activa con `opponentBlockBias >= antiTurtleBlockThreshold`.
- Una sola decision anterior basta para probar el beneficio inicial. No se agrega un ring buffer sin evidencia de que la repeticion de secuencias mas largas siga siendo un problema.

## Diseno Propuesto

### 0. Gate de evidencia o autorizacion

Antes de escribir codigo debe existir una de estas dos salidas:

- Caracterizacion reproducible con dificultad, seed, posiciones, estado, inputs y secuencia de decisiones neutrales nuevas que muestre repeticion excesiva; o
- Autorizacion explicita del usuario para ejecutar este experimento acotado aun sin un defecto demostrado.

La solicitud de generar este plan no cuenta como autorizacion de implementacion. Si no aparece caracterizacion ni autorizacion, `#78` permanece propuesto y el plan se cierra sin codigo.

### 1. Preservar prioridades tacticas

La seleccion ponderada solo reemplaza el tramo neutral final de `chooseAIAction()`. Se conserva este orden sin introducir pesos:

1. Ataque aereo legal.
2. Whiff punish de una oportunidad.
3. Crouch ante patron punch dominante.
4. Bait de rango medio.
5. Bloqueo ante ataque vivo cercano.
6. Especial lethal/comeback/probabilistico.
7. Counter tras bloqueo.
8. Defensa con vida baja.
9. Presion tardia perdiendo.
10. Presion anti-turtle.
11. Reacciones por memoria agregada, aire y repeticion.

La decision anterior nunca reduce ni bloquea esas respuestas.

### 2. Selector ponderado puro

Agregar en `src/ai.js` un helper pequeno que reciba candidatos ordenados con accion y peso, la muestra `rand`, la decision anterior y `neutralRepeatWeight`.

Contrato:

- Recibir solo candidatos legales con peso positivo y finito construido desde configuracion validada.
- Multiplicar por `neutralRepeatWeight` cada candidato cuya accion coincida con la decision anterior.
- Sumar pesos efectivos, convertir `rand` en una posicion acumulada y devolver exactamente una accion existente.
- No llamar `randomSimulation()` ni depender de DOM, Fighter o estado global.
- Mantener orden fijo de candidatos para que las fronteras sean comprobables.
- Cada zona incluye al menos una salida segura; no se agrega fallback especulativo para pools imposibles.

### 3. Pesos desde tunables existentes

No agregar una segunda matriz de probabilidades. Derivar pesos de los cutoffs acumulados actuales:

```text
far.approach = approachLong
far.idle = 1 - approachLong

mid.kick = kickMid
mid.approach = approachMid - kickMid
mid.retreat = retreatMid - approachMid
mid.jump = jumpMid - retreatMid
mid.block = 1 - jumpMid

close.punch = punchClose
close.kick = kickClose - punchClose
close.block = blockClose - kickClose
close.reposition = 1 - blockClose
```

Reglas de candidatos:

- Lejos: `approach` e `idle` siempre son legales.
- Medio: incluir `kick` solo con hitbox/cooldown legal; incluir `retreat` solo si no entra en pared; `approach`, `jump` y `block` conservan su disponibilidad actual.
- Cerca: incluir `punch`/`kick` solo con hitbox/cooldown legal; `block` permanece disponible.
- Cerca interior, `dist <= ATTACKS.punch.range`: usar los pesos punch/kick/block/reposicion documentados.
- Cerca exterior, `ATTACKS.punch.range < dist <= 110`, con kick legal: omitir punch aunque su hitbox geometrico alcance y asignar a kick todo `kickClose`, preservando la prioridad actual por rango nominal.
- Cerca exterior sin kick pero con punch legal: usar punch `punchClose`, block `blockClose - punchClose` y reposicion `1 - blockClose`.
- Cerca, reposicion: usar `retreat` cuando hay ataque disponible o `opponentBlockBias > 0.5`, siempre que no haya pared; usar `approach` cuando no se cumple esa condicion.
- Cerca, pared: conservar la rama first-match actual completa y no aplicar selector ni penalizacion ponderada en este plan.
- Eliminar una accion ilegal y normalizar implicitamente sobre la suma restante; no transferir su intervalo a una accion fija por orden de `if`.

`cornerJump` permanece caracterizado como inalcanzable con los cutoffs actuales. Activarlo seria un segundo cambio de balance en esquina y requiere evidencia/plan separado.

### 4. Memoria propia minima

Agregar `aiPreviousDecisionAction` al Fighter:

- Inicia vacio en el constructor.
- Se pasa a `chooseAIAction()` solo como contexto del selector neutral.
- Se actualiza una vez por decision con el valor retornado por `chooseAIAction()`, inmediatamente antes de cualquier mutacion de ejecucion sobre `aiAction`.
- Registra la accion seleccionada, sea tactica o neutral; solo el selector neutral consulta el valor.
- Un jump seleccionado permanece registrado como jump aunque `aiAction` pase a idle al ejecutarlo.
- Rewrites de retreat por pared o late pressure sin una decision nueva no cambian el valor.
- Se reemplaza, no se acumula. No hay array, contador, storage ni memoria entre Fighters.
- Pausa y hidden-page la conservan, igual que `aiMemory`.
- Nuevo round, modo, pelea Arcade o menu la limpian al construir otro Fighter.
- Training reset la conserva porque hoy conserva `aiMemory`; cambiar ambos resets queda fuera del alcance.

Agregar `neutralRepeatWeight: 0.5` a Easy, Normal y Hard. El valor reduce, pero no prohibe, una repeticion inmediata. No se diferencia por dificultad hasta tener evidencia de balance.

### 5. Presupuesto RNG y fixed-step

- Mantener exactamente dos muestras de simulacion por decision nueva: cadencia y accion.
- El selector ponderado reutiliza la muestra de accion existente.
- Un tick con `aiDecisionTimer > 0` no consume RNG.
- Training `idle`/`block` no consume RNG de decisiones normales.
- No agregar draws por candidato ni por rama para evitar trazas dependientes del camino.
- Actualizar las trazas sembradas esperadas porque cambia el mapeo de la muestra, no el numero de draws.

### 6. Extensiones pospuestas

No implementar en este plan:

- Historial de tres/cuatro acciones o penalizacion de secuencias.
- Intenciones `approach -> attack`, bait encadenado o commitment windows.
- Sesgo agresivo/cauto/movil por round.
- Respuestas especiales despues de hit, block o whiff propio.
- Personalidades, UI o selector.

Reevaluar una extension solo si la seleccion ponderada y la decision anterior pasan pruebas pero una traza o sesion posterior demuestra un patron repetitivo concreto.

## Archivos A Modificar

- `src/config.js`: agregar `neutralRepeatWeight` y conservar/validar cutoffs acumulados.
- `src/ai.js`: construir candidatos neutrales y seleccionar por peso sin tocar prioridades tacticas.
- `src/fighter.js`: guardar/pasar una sola decision anterior por Fighter.
- `tests/game.test.js`: caracterizacion, exposicion test-only del helper/RNG, fronteras ponderadas, legalidad, repeticion, lifecycle y trazas 30/60/120.
- `Readme.md`: documentar variedad neutral ponderada y reproducibilidad.
- `AGENTS.md`: registrar prioridad tactica, presupuesto RNG y vida util de la decision anterior.
- `BACKLOG.md`: agregar `#78` a Measured AI Roadmap como `Ready` solo despues de cumplir el gate; marcarlo `Completed` solo al cumplir criterios.
- `plans/plan_0045_variacion_neutral_cpu_ponderada.md`: registrar ejecucion, resultados y cualquier reduccion de alcance.

No se preven cambios en `src/game.js`, HTML, CSS, i18n, input, audio, efectos, renderers, persistencia, stats o historial. `src/game.js` solo se modificara si una prueba demuestra que el lifecycle no puede validarse mediante la construccion existente de Fighters.

## Plan De Implementacion

1. Registrar caracterizacion reproducible o autorizacion explicita; detener sin codigo si el gate no se cumple.
2. Congelar baseline `162/162`, sintaxis y diff-check; registrar cualquier cambio ajeno ya presente sin modificarlo.
3. Agregar caracterizaciones de fronteras neutrales, rango nominal de punch, block-bias cercano, `cornerJump` inalcanzable y posible reejecucion de ataque almacenado.
4. Validar cutoffs acumulados y corregir fixtures parciales para que hereden una dificultad real antes de sobrescribir el campo bajo prueba.
5. Agregar pruebas fallidas del selector ponderado puro, filtrado legal y penalizacion exacta `0.5`.
6. Implementar el helper ponderado y reemplazar solo los retornos neutrales far/mid y close fuera de pared.
7. Agregar `aiPreviousDecisionAction`, actualizarla una vez por decision antes de ejecutar la accion y cubrir su lifecycle.
8. Confirmar con pruebas que las prioridades tacticas no cambian y que la reejecucion almacenada conserva su baseline.
9. Verificar presupuesto RNG, repetibilidad por seed, divergencia neutral controlada y equivalencia 30/60/120.
10. Ejecutar smoke browser sembrado en Easy/Normal/Hard sin usarlo como evidencia humana de justicia.
11. Actualizar README, AGENTS, BACKLOG y el estado de este plan con comportamiento realmente entregado.
12. Ejecutar validacion completa y revisar el diff para excluir refactors o tuning no requeridos.

## Pruebas Y Validacion

Validacion automatica completa:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check tests\game.test.js
node --test tests\game.test.js
git diff --check
```

Contratos del selector puro:

- Exponer el helper y `nextSimulationRandomForTest: () => randomSimulation()` solo dentro del objeto `__gameTest` construido por `tests/game.test.js`; no crear API de produccion.
- Pool sintetico `approach:2`, `retreat:1`, `block:1`: `rand 0` y `0.499999` eligen approach; `0.5` y `0.749999` retreat; `0.75` y `0.999999` block.
- Al retirar retreat, approach ocupa `2/3` y block `1/3`; nunca se devuelve retreat.
- Con decision anterior approach y multiplicador `0.5`, el pool queda `1:1:1`: una muestra que antes repetia puede elegir otra accion, pero una muestra baja aun puede repetir approach.
- Una decision anterior que no exista en el pool no cambia las fronteras.
- Para cada pool no degenerado, verificar exhaustivamente con muestras uniformes acotadas que la masa de la accion anterior con `0.5` es menor que con `1`, permanece mayor que cero y todas las acciones legales siguen alcanzables.

Contratos de configuracion:

- Para cada dificultad, todos los cutoffs son finitos y cumplen `0 <= approachLong <= 1`.
- Cumplir `0 <= kickMid <= approachMid <= retreatMid <= jumpMid <= 1`.
- Cumplir `0 <= punchClose <= kickClose <= blockClose <= 1`, `0 <= cornerJump <= 1` y `neutralRepeatWeight === 0.5`.
- Congelar los pesos all-legal derivados de Easy/Normal/Hard documentados en este plan.
- Los fixtures tacticos parciales parten de una dificultad real y sobrescriben solo el campo relevante; no inventan cutoffs acumulados invalidos.

Contratos de zonas y legalidad:

- `dist = 110` es close; `110.0001` es mid; `250` es mid; `250.0001` es far.
- Con punch/kick geometricamente legales, `dist = ATTACKS.punch.range` usa el pool interior y `ATTACKS.punch.range + 0.0001` usa el pool exterior con prioridad completa de kick.
- `attackCooldown > 0`, `canPunch = false` o `canKick = false` eliminan el ataque correspondiente.
- Retreat hacia pared nunca se selecciona.
- Con `opponentBlockBias > 0.5`, anti-turtle fallido y sin ataques listos, la reposicion cercana conserva retreat fuera de pared y block en pared.
- La rama cercana en pared conserva sus fronteras actuales y `cornerJump` permanece inalcanzable; este plan no lo activa.
- Ningun estado aereo llega al selector neutral terrestre.
- Especial fuera de hitbox real sigue sin ejecutarse.

Contratos de prioridad:

- La penalizacion neutral no cambia whiff punish, crouch dominante, bait, bloqueo vivo, lethal Special, counter, low-health, late pressure, anti-turtle, memoria repetida ni ataque aereo.
- La igualdad `opponentBlockBias === antiTurtleBlockThreshold` conserva activacion inclusiva.
- Pared, cooldown y hitboxes conservan precedencia sobre variedad.

Contratos de memoria propia:

- Un Fighter CPU nuevo inicia con decision anterior vacia.
- Una decision vencida la registra exactamente una vez.
- Ticks de ejecucion con timer positivo no la cambian.
- La siguiente decision reemplaza el valor anterior.
- Un jump seleccionado registra jump aunque la ejecucion cambie `aiAction` a idle.
- Un rewrite de retreat a block por pared o late pressure con timer positivo no cambia la decision anterior.
- La reejecucion de un ataque almacenado no cambia la decision anterior.
- Pausa, resume y hidden-page conservan identidad del Fighter y valor.
- Nuevo round, modo, pelea Arcade y menu la limpian mediante Fighter nuevo.
- Training reset la conserva junto con `aiMemory`; comprobar inmediatamente despues del reset, antes del siguiente tick.
- Training `idle`/`block` no fabrica historial de decisiones normales.

Contratos RNG:

- Cada decision nueva consume exactamente una muestra para cadencia y una para accion.
- En contextos VM frescos, el siguiente valor de `randomSimulation()` coincide con el primer valor del oracle sin decision y con el tercero despues de una decision.
- Un tick sin decision y Training `idle`/`block` dejan el siguiente valor en el primero del oracle.
- Mismo seed/estado/inputs producen traza identica.
- Dos seeds caracterizadas usan segundos valores PRNG a lados opuestos de una frontera far; con estado fijo y pasivo producen acciones neutrales exactas distintas en la primera decision.

Caracterizacion fuera de alcance:

- Una accion ofensiva almacenada en Easy puede volver a ejecutarse tras cooldown antes de una nueva decision.
- La prueba congela este comportamiento para impedir que el selector lo cambie accidentalmente.
- Si invalida el objetivo en una sesion posterior, se abre un plan separado para consumo one-shot de acciones ofensivas.

Traza fixed-step:

- Ejecutar 180 ticks equivalentes con contextos frescos: 90/180/360 avances render a 30/60/120 FPS y checkpoints cada 3/6/12 avances.
- Comparar `matchElapsedFrames`, timer, posicion/estado CPU, `aiAction`, `aiDecisionTimer`, `aiPreviousDecisionAction`, cooldown, ataque/secuencia, vida, energia y memoria relevante.
- Congelar una secuencia exacta para una seed; no basta que tres trazas equivocadas coincidan entre si.
- Evitar KO con vida suficiente y comprobar `matchElapsedFrames === 180`, round 1 y `gameState === 'playing'`.
- Repetir la seed para igualdad exacta; la divergencia neutral entre seeds se prueba por separado en una sola decision controlada.

Smoke browser local:

- Abrir `http://localhost:8000/src/?debug=1&seed=17`.
- Ejecutar Duelo en Easy, Normal y Hard con periodos pasivos, bloqueo sostenido y movimiento hacia esquinas.
- Confirmar consola limpia, acciones legales, pausa/reanudacion estable y ausencia de cambios en Training timer-off.
- Dejar reproducibilidad y secuencias exactas a las pruebas de reloj fijo; el input humano del smoke no es repetible.
- Registrar el smoke como pendiente hasta ejecutarlo y solo como funcionamiento tecnico. No concluir justicia, diversion o predictibilidad humana.

## Documentacion

- `Readme.md`: ampliar la descripcion de IA con seleccion neutral ponderada, penalizacion inmediata y reproducibilidad sembrada.
- `AGENTS.md`: indicar que solo el tramo neutral fuera de la rama close-wall es ponderado, que las prioridades tacticas permanecen first-match, que se mantienen dos draws por decision y que la decision anterior vive con el Fighter.
- `BACKLOG.md`: crear `#78` dentro de Measured AI Roadmap como `Ready` solo despues de evidencia/autorizacion; cerrarlo solo despues de pruebas, trazas y smoke tecnico.
- `plans/plan_0044_hoja_ruta_ia_cpu_priorizada.md`: no reabrir ni modificar; conserva historia cerrada.
- `plans/plan_0043_validacion_humana_consolidada.md`: no agregar resultados de mocks o smoke como evidencia humana.
- `PLANS.md`: sin cambios.

## Riesgos Y Mitigaciones

- Riesgo: weighted selection se convierte en Utility AI. Mitigacion: limitarla al tramo neutral final y conservar reglas tacticas first-match.
- Riesgo: al filtrar una accion cambia demasiado el balance. Mitigacion: preservar la distribucion all-legal actual, congelar fronteras y probar pools con opciones retiradas.
- Riesgo: penalizar repeticion crea alternancia mecanica. Mitigacion: multiplicador `0.5`, nunca cero; repetir sigue siendo legal.
- Riesgo: una decision tactica anterior reduce luego una opcion neutral razonable. Mitigacion: el efecto dura una sola decision y solo altera peso neutral, no legalidad ni prioridad.
- Riesgo: ampliar el cambio hacia esquina altera otro eje de balance. Mitigacion: preservar la rama cercana de pared y mantener `cornerJump` fuera hasta evidencia separada.
- Riesgo: reejecucion de `aiAction` oculta el beneficio. Mitigacion: caracterizarla y no mezclar semantica de consumo de ataques en este cambio.
- Riesgo: nuevas llamadas RNG rompen reproducibilidad. Mitigacion: mantener dos draws fijos por decision y prohibir draws dentro del helper.
- Riesgo: tests de secuencia quedan fragiles. Mitigacion: separar contratos puros de una unica traza integrada congelada.
- Riesgo: declarar exito perceptivo sin jugadores. Mitigacion: aceptar solo variedad matematica y funcionamiento tecnico; la percepcion requiere otro gate.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este ExecPlan.

- El alcance se redujo desde seis ideas a un paquete minimo: selector neutral, una decision anterior y penalizacion acotada.
- Se descartan por ahora ring buffer, intenciones, perfiles por round, respuestas encadenadas, scoring y personalidades.
- El codigo queda bloqueado hasta registrar una caracterizacion reproducible o autorizacion explicita; crear el plan no satisface el gate.
- El cambio toca solo el tramo que causa repeticion neutral; no refactoriza prioridades tacticas ni lifecycle global.
- La frontera nominal de punch, block-bias cercano y pared se preservan para evitar tuning encubierto.
- Las suposiciones sobre predictibilidad tecnica, seeds historicas, Training reset y acciones almacenadas son explicitas.
- Los criterios comprueban fronteras, legalidad, prioridad, RNG, lifecycle y 30/60/120 sin depender de impresiones.
- No se agregan dependencias, persistencia, acciones, UI ni arquitectura especulativa.

## Criterios De Aceptacion

- Existe caracterizacion reproducible o autorizacion explicita antes del primer cambio de codigo.
- `#78` aparece como `Ready` solo despues del gate y como `Completed` solo despues de implementar y validar el alcance.
- Solo las decisiones neutrales far/mid y close fuera de pared usan seleccion ponderada.
- Las distribuciones con todas las acciones legales conservan los porcentajes baseline documentados dentro de sus fronteras de distancia.
- El close exterior conserva prioridad de kick y la rama de pared no activa `cornerJump`.
- Una accion ilegal se elimina y las restantes reciben toda la masa normalizada.
- La decision anterior tiene multiplicador exacto `0.5`, puede repetirse y no afecta reglas tacticas.
- CPU nueva limpia `aiPreviousDecisionAction`; pausa y Training reset siguen el lifecycle documentado.
- Se mantienen exactamente dos muestras RNG por decision nueva.
- Misma seed produce la misma traza y dos seeds caracterizadas producen acciones distintas en una primera decision neutral controlada.
- Las trazas son equivalentes a 30/60/120 FPS.
- Prioridades de whiff, defensa, Special, counter, late pressure y anti-turtle no regresan.
- La reejecucion de acciones almacenadas queda caracterizada y sin cambios.
- README, AGENTS, BACKLOG y este plan reflejan solo el comportamiento entregado.
- Sintaxis, suite completa y `git diff --check` pasan.
- Smoke browser sembrado no muestra errores ni acciones ilegales.

## Commit Y Push

- Plan: `Plan weighted neutral CPU variation`.
- Implementacion: `Vary weighted neutral CPU decisions`.
- Mantener selector, pruebas y documentacion de la mejora en un commit funcional salvo que el usuario pida commits por fase.
- No hacer commit ni push salvo solicitud explicita.

## Estado De Implementacion

Propuesto. No ejecutado ni autorizado para codigo. El siguiente paso es registrar el gate de evidencia o una autorizacion explicita.
