# Exec Plan: hoja de ruta IA CPU priorizada

## Objetivo

Priorizar las siguientes mejoras de la CPU para aumentar ritmo, credibilidad tactica y rejugabilidad sin abandonar la arquitectura rule-based, determinista y sin dependencias de GLITCH DUEL.

Este plan interpreta "IA" como la IA de combate local. Quedan fuera modelos generativos, servicios remotos, machine learning, behavior trees, utility scoring, lookahead, pathfinding, evolucion persistente y refactors generales.

Resultado esperado:

- La proxima mejora responde a un fallo reproducible, no a una preferencia abstracta.
- Timer, salud, bloqueo y Especial comparten contexto minimo en vez de crear reglas contradictorias.
- La misma seed, estado e inputs conserva decisiones a 30/60/120 FPS.
- Easy mantiene errores legibles; Hard mejora decisiones sin leer inputs futuros ni responder perfectamente.

## Contexto Actual

- `chooseAIAction()` en `src/ai.js` usa una sola muestra `rand` por decision y devuelve acciones existentes.
- `DIFFICULTIES` en `src/config.js` contiene cadencia, movimiento, defensa, contraataque, memoria y tunables contextuales por dificultad.
- `Fighter.updateAI()` calcula hitboxes reales, paredes, memoria corta, whiff nuevo, recovery rival y acciones aereas.
- `#16` ya entrego whiff punish, bait, crouch ante patron punch y ataques aereos legales.
- La CPU ya usa Especial solo con energia, cooldown libre e hitbox real; ademas considera lethal, comeback y probabilidad.
- La memoria actual observa ataque, bloqueo, tipo, zona, aire y repeticion dentro de una ronda; se reinicia al construir el Fighter siguiente.
- La suite actual pasa `155/155` y cubre decisiones puras, memoria acotada, paredes, whiffs y trazas contextuales a 30/60/120.
- La evaluacion humana de justicia/exploits de `#16` sigue centralizada en `plans/plan_0043_validacion_humana_consolidada.md`.

Suposiciones explicitas:

- No se cambia IA hasta tener seed/configuracion, estado inicial, inputs y resultado esperado/real de un fallo.
- Seed reproduce RNG, no input humano; un hallazgo se convierte en escenario determinista antes de codigo.
- Reaccionar a conducta observada es preferible a contrarrestar silenciosamente `styleKey`.
- Un nuevo contexto se expresa primero como boolean/bucket derivado, no como sistema de puntuacion.
- No se agregan acciones, daño, cooldown, guard break, ataques o economia de energia en esta hoja de ruta.

## Priorizacion

| Orden | Item | Decision | Gate |
| --- | --- | --- | --- |
| 0 | `#16` | Validar, sin codigo | Completar matriz recurrente de plan `0043` y obtener fallo reproducible o aceptar baseline. |
| 1 | `#17` | Primera implementacion condicional | CPU perdiendo se retira/espera tarde o bloqueo sostenido produce estrategia dominante. |
| 2 | `#19` residual | Cerrar sin ampliacion | No se demostro Especial desperdiciado o pasivo en hit-stun/esquina despues de estabilizar `#17`. |
| 3 | `#18` | Cerrar y fusionar con `#16` | Ningun estilo concreto demostro derrotar la adaptacion conductual actual con una traza reproducible. |
| 4 | `#49` | Posponer | `#31` telemetry con reset visible y exploit que sobreviva al cambio de ronda. |
| 5 | `#23` | Posponer indefinidamente | Jugadores distinguen y solicitan perfiles seleccionables a igual dificultad. |

El contexto de timer para Especial pertenece a `#17`, no se implementa dos veces en `#19`.

## Diseno Propuesto

### Fase 0. Evidencia de `#16`

Ejecutar la parte recurrente del plan `0043` con Normal/Hard, seed/config registradas y estos escenarios:

- spam punch/kick;
- saltos y ataques aereos;
- whiffs intencionales;
- bloqueo sostenido;
- esquinas;
- energia completa;
- CPU perdiendo/ganando en los ultimos segundos.

Clasificar cada hallazgo como legible/justo, inefectivo, sobrerreactivo, explotable o inconcluso. No cambiar probabilidades por impresion aislada.

Salida:

- Si no existe fallo reproducible, cerrar `#16` cuando la evidencia humana restante pase y detener esta hoja de ruta, salvo autorizacion explicita para una mejora acotada como la Fase 1 ejecutada aqui.
- Si existe fallo, crear primero una caracterizacion Node que falle con estado explicito.

### Fase 1. `#17` tempo tardio y anti-turtle acotado

La Fase 1 requiere el gate de evidencia o una autorizacion explicita de direccion; en esta ejecucion se autorizo de forma proactiva sin reabrir `plan_0043`. Derivar contexto minimo:

```text
timedRound: boolean
lateRound: boolean
cpuBehind: boolean
opponentBlockBias: existente
```

Reglas maximas:

- Si el round tiene timer, esta en ventana tardia y CPU pierde, cancelar/suprimir `retreat` y bait almacenados.
- En rango, usar un ataque existente legal; fuera de rango, `approach`.
- CPU empatando/ganando conserva comportamiento actual.
- Si bloqueo sostenido cruza el umbral validado, aumentar presion con ataques existentes; sin guard break ni lectura perfecta.
- Training sin timer permanece identico.

Implementacion minima:

- Calcular timer/lead en `game.js` o en el bridge existente sin exponer milisegundos de render.
- Pasar booleans a `Fighter.updateAI()`/`chooseAIAction()`.
- Reutilizar el unico `rand` de decision; no consumir RNG extra.
- Agregar solo tunables demostrados por el escenario, con orden Easy < Normal < Hard cuando sean probabilidades.

### Fase 2 cerrada. `#19` uso posicional residual del Especial

Ya estan implementados rango real, energia, cooldown, lethal y comeback. El residuo permitido es:

```text
opponentHitStun: boolean
opponentCornered: boolean
lateRound/cpuBehind: contexto compartido de #17
```

La caracterizacion solo demostro ausencia de contexto, no un defecto jugable. Por decision explicita se acepta el comportamiento existente y se cierra `#19` sin agregar estas senales. Una reapertura futura requiere evidencia nueva y un ExecPlan separado; su alcance maximo seria:

- Bonus probabilistico en hit-stun o esquina, nunca confirmacion perfecta por defecto.
- Fuera de hitbox real no se gasta energia.
- Lethal actual conserva precedencia.
- No agregar reserva de meter, combo plan, variante de Special ni nuevo rango.

### Fase 3 cerrada. Decision sobre `#18`

No se registro un exploit reproducible de Balanced/Fast/Heavy/Technical que la memoria de tipo, zona y repeticion no cubra. Por decision explicita se acepta la adaptacion conductual existente y `#18` se cierra fusionado con `#16`, sin pasar `styleKey` a la CPU.

- La conducta observada sigue prevaleciendo sobre la etiqueta del estilo.
- No se crea una matriz de cuatro estilos por tres dificultades ni counter-picking silencioso.
- Cualquier reapertura requiere un exploit especifico, evidencia nueva y un ExecPlan separado.

### Fases diferidas

`#49` round-to-round:

- Requiere primero `#31` telemetry local con reset visible.
- Si se autoriza despues, conservar solo un resumen acotado de tipo dominante/bucket por una ronda.
- Limpiar en nuevo match, menu, Training y rival Arcade; nunca persistir.

`#23` personalidades:

- Requiere evidencia de que usuarios distinguen y desean perfiles a la misma dificultad.
- No asociar personalidad silenciosamente a los rivales visuales actuales.
- Si se autoriza, comenzar con baseline mas dos perfiles, selector explicito y ajustes sobre tunables existentes.

## Archivos A Modificar

Fase 0:

- `plans/plan_0043_validacion_humana_consolidada.md`: evidencia anonima y decision.
- `tests/game.test.js`: caracterizacion solo despues de un fallo reproducible.

Fases 1-2, si se autorizan:

- `src/config.js`: umbrales/probabilidades minimos.
- `src/ai.js`: reglas puras con acciones existentes.
- `src/fighter.js`: bridge de contexto y cancelacion de accion obsoleta.
- `src/game.js`: contexto de timer/round solo si no puede derivarse sin estado global.
- `tests/game.test.js`: limites, controles y trazas fixed-step.
- `Readme.md`, `AGENTS.md`, `BACKLOG.md`: solo comportamiento realmente entregado.
- Este plan: gates, decisiones y evidencia automatica.

No se preven cambios en input, audio, efectos, renderers, HTML, CSS, persistencia o historial.

## Plan De Implementacion

1. Ejecutar Fase 0 y congelar el escenario exacto antes de codigo, o registrar una autorizacion explicita si se decide avanzar sin exploit humano.
2. Escribir tabla de caracterizacion con el comportamiento defectuoso actual.
3. Si el fallo es tempo/turtle o existe autorizacion explicita, implementar solo Fase 1.
4. Ejecutar suite, sintaxis, diff-check y traza 30/60/120.
5. Repetir el escenario humano; si no mejora o crea frustracion, revertir tuning en plan separado.
6. Revaluar Especial; cerrarlo sin codigo si no existe un escenario reproducible, como ocurrio con `#19`.
7. Evaluar estilos y cerrar/fusionar `#18` si no existe un defecto concreto, como ocurrio en esta ejecucion.
8. Mantener `#23/#49` bloqueados hasta sus dependencias/evidencia.
9. Reconciliar backlog con lo ejecutado; no marcar fases opcionales como completadas.

## Pruebas Y Validacion

Baseline y validacion final por fase:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check tests\game.test.js
node --test tests\game.test.js
git diff --check
```

Contratos Fase 1:

- Mismo estado late, CPU perdiendo vs ganando: solo perdiendo suprime retreat.
- Tick anterior/al umbral tardio tiene limite exacto.
- Round temprano y Training timer-off no cambian.
- Accion `retreat` ya almacenada se cancela al cruzar el umbral.
- Block bias debajo/en umbral tiene resultado definido.
- Whiff punish, defensa viva y paredes conservan precedencia.
- Traza de acciones/posicion/vida/energia/timer coincide a 30/60/120.

Contratos Fase 2:

- Full meter fuera de hitbox nunca gasta.
- Neutral/block/hit-stun y centro/esquina forman tabla minima.
- Lethal y comeback existentes no regresan.
- Bonus contextual es probabilistico por dificultad salvo lethal.
- Exactamente 100 energia por Special, una sola vez.
- No Special en cooldown o aire.
- Comparte timer/lead con Fase 1.

Contratos `#18` si se reabre:

- Solo cambia la regla del estilo defectuoso demostrado.
- Los otros estilos conservan baseline.
- Conducta observada sigue prevaleciendo sobre etiqueta cuando corresponda.
- Fallback de estilo desconocido es Balanced.

Toda validacion humana permanece en plan `0043`; Node no demuestra justicia, legibilidad o preferencia.

## Documentacion

- `BACKLOG.md`: enlazar este plan y cerrar `#18/#19` con el comportamiento existente aceptado.
- `plans/plan_0043_validacion_humana_consolidada.md`: registrar evidencia humana, no duplicarla aqui.
- `Readme.md`/`AGENTS.md`: actualizar solo despues de implementar comportamiento.

## Riesgos Y Mitigaciones

- Riesgo: Hard se vuelve perfecto. Mitigacion: probabilidades acotadas y Easy con errores visibles.
- Riesgo: anti-turtle se convierte en lectura de input. Mitigacion: usar memoria acumulada, no el boton actual como counter perfecto.
- Riesgo: reglas de timer contradicen Special. Mitigacion: un solo contexto compartido en Fase 1.
- Riesgo: RNG cambia todas las seeds. Mitigacion: conservar una muestra por decision y no agregar draws ambientales.
- Riesgo: estilo-aware castiga la eleccion del jugador. Mitigacion: preferir conducta observada y un signal solo con exploit probado.
- Riesgo: memoria entre rondas parece cheating. Mitigacion: diferir hasta telemetry y limitar a resumen efimero de una ronda.
- Riesgo: personalidades multiplican balance/UI. Mitigacion: diferir y empezar con dos perfiles mas baseline solo si hay demanda.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar.

- La ruta principal es evidencia -> un defecto -> una regla, no una reescritura.
- `#17` centraliza el contexto de timer; el cierre de `#19` evita duplicar timer o prioridades sin evidencia.
- El cierre de `#18` evita leer `styleKey` sin un exploit demostrado; `#23/#49` permanecen pospuestos.
- Cada fase tiene limites y controles deterministas.
- No se introducen dependencias, persistencia, nuevas acciones ni arquitectura especulativa.

## Criterios De Aceptacion

- Ninguna fase de codigo empieza sin caracterizacion reproducible o autorizacion explicita registrada.
- `#17`, si se ejecuta, evita pasividad tardia solo cuando CPU pierde y no altera Training sin timer.
- `#19` queda cerrado sin senales posicionales porque no se demostro desperdicio o pasividad reproducible; cualquier reapertura exige evidencia y plan nuevos.
- `#18` queda cerrado y fusionado con `#16` porque no se demostro un exploit por estilo; cualquier reapertura exige evidencia y plan nuevos.
- `#23/#49` permanecen bloqueados hasta cumplir dependencias.
- IA sigue rule-based, acotada, sembrable y equivalente a 30/60/120.
- Suite, sintaxis y `git diff --check` pasan.
- Documentacion refleja solo fases realmente ejecutadas.

## Commit Y Push

- Fase 0: `Record CPU AI validation evidence`.
- Fase 1: `Improve late-round CPU pressure`.
- Reapertura futura de `#19`: `Refine contextual CPU special use`.
- Reapertura futura de `#18`: `Refine style-aware CPU adaptation`.
- No mezclar estilos, personalidades o memoria entre rondas en esos commits.
- No hacer commit/push salvo solicitud explicita durante la implementacion.

## Estado De Implementacion

Fase 0 cerrada por la aceptacion explicita de `plan_0043`; no se activo una fase de codigo.

Baseline congelada:

- Commit: `a077b86 Plan prioritized CPU AI roadmap`.
- Suite inicial: `155/155` pruebas; sintaxis completa; working tree limpio.

Caracterizacion automatizada ejecutada:

- `#17`: con el mismo estado tardio (`300` frames), una CPU perdiendo y una CPU ganando conservan el `retreat` almacenado y se alejan. Esto confirma que la decision actual no recibe timer, marcador ni lead y no autoriza por si solo un cambio de balance.
- `#19`: la decision de Special devuelve el mismo resultado en la tabla conceptual neutral/bloqueo/hit-stun/esquina porque esos contextos aun no forman parte del contrato de `chooseAIAction()`. Esto demuestra una ausencia de contexto, no un desperdicio jugable probado.
- Suite despues de las caracterizaciones: `157/157` pruebas aprobadas.

Decision actual:

- La direccion autorizo explicitamente implementar de forma proactiva la Fase 1 de `#17`, aun sin un exploit humano reproducible adicional; el gate de evidencia de `#16` no se reabre ni se modifica.
- La direccion cerro explicitamente `#19` por ausencia de un problema reproducible: Especial conserva su regla actual y no recibe contexto posicional nuevo.
- La direccion cerro explicitamente `#18` por ausencia de un exploit reproducible por estilo: la CPU conserva adaptacion conductual y no recibe `styleKey`.
- `#23` y `#49` permanecen pospuestos según la priorización.

Resultado de ejecucion:

- Fase 0 completada; `#16` queda validado sin tuning adicional.
- Fase 1 de codigo completada en `src/config.js`, `src/ai.js`, `src/fighter.js` y `src/game.js`, con regresiones enfocadas en `tests/game.test.js`.
- El puente compacto entrega `timedRound`, `lateRound` y `cpuBehind` al CPU desde `roundTimerFrames`, el timer efectivo de Training y la brecha de salud; la frontera tardia es inclusiva (`roundTimerFrames <= lateRoundThresholdFrames`).
- Tuning inicial por dificultad: `lateRoundThresholdFrames` Easy/Normal/Hard `600/720/900`; `lateRoundHealthGap` `24/18/12`; `antiTurtleBlockThreshold` `0.80/0.72/0.64`; `antiTurtleChance` `0.10/0.18/0.28`. Todas las probabilidades estan acotadas y `antiTurtleChance` conserva Easy < Normal < Hard.
- La presion tardia cancela retreat/bait almacenado solo cuando el round tiene timer, la CPU esta en la ventana tardia y pierde por la brecha configurada; usa punch/kick legal en rango o approach fuera de rango. Whiff punish y defensa viva conservan precedencia.
- Anti-turtle observa `opponentBlockBias` acumulado y usa la unica muestra `rand` de decision; por debajo o en la frontera de umbral conserva las reglas previas, y no lee un input sostenido directamente.
- La suite automatizada pasa `162/162` pruebas despues de esta fase; el resultado de validacion humana de justicia/legibilidad sigue siendo exclusivamente el de `plan_0043`.
- La revision posterior preservo la precedencia de crouch, counter y Especial lethal frente a la presion tardia.
- `#19` queda `Completed` con el alcance actual aceptado; no se modificaron `src/` ni `tests/` para cerrarlo.
- `#18` queda `Completed`, fusionado funcionalmente con `#16`; no se modificaron `src/` ni `tests/` para cerrarlo.
- Smoke browser local con seed `17`: Training conserva `ESTADO · SIN TIEMPO`, trials y pausa/menú; Duelo conserva `ESTADO · 60s`; no se observaron errores de pagina.
