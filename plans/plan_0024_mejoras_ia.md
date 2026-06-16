# Exec Plan: Mejoras IA

## Objetivo

Mejorar el comportamiento de la CPU para que se sienta menos aleatoria, menos injusta y mas legible durante el combate.

La experiencia del jugador cambia en que la IA reaccionara con probabilidad segun dificultad, elegira mejor segun distancia, evitara decisiones torpes contra los bordes y podra usar ofensiva mas variada sin volverse imposible. Queda fuera del alcance reescribir el sistema de combate, introducir machine learning, agregar dependencias externas, cambiar controles o modificar la arquitectura estatica del juego.

## Contexto Actual

- `src/ai.js` contiene `chooseAIAction()`, una funcion pequena que decide entre `block`, `retreat`, `approach`, `jump`, `special`, `punch`, `kick` e `idle` usando distancia, vida, energia, estado en suelo, ataque rival, disponibilidad de golpes, dificultad y un unico `rand`.
- `src/config.js` define `DIFFICULTIES`, con timers de decision, velocidad y umbrales de probabilidad por distancia.
- `src/fighter.js` ejecuta la IA en `Fighter.updateAI(opponent)`, calcula distancia, `opponentAttacking`, `canPunch`, `canKick`, refresca `aiDecisionTimer` y aplica `aiAction` sobre velocidad, salto, bloqueo o ataque.
- `src/game.js` controla los estados globales; la simulacion solo avanza en `playing`, por lo que la IA no debe ejecutar acciones fuera de ese estado.
- `tests/game.test.js` expone `chooseAIAction` y ya incluye pruebas deterministas para decisiones defensivas y ofensivas basicas.
- El juego usa coordenadas logicas fijas `1000x500`; cualquier lectura de posicion o borde debe mantenerse en ese espacio.

Suposiciones explicitas:

- La IA debe seguir siendo determinista en pruebas mediante valores de `rand` inyectados.
- Se prefiere mejorar reglas existentes antes que agregar un subsistema nuevo.
- La dificultad `easy` debe dejar ventanas claras para atacar; `hard` puede reaccionar mejor, pero no debe bloquear siempre.
- Las mejoras deben poder balancearse desde `src/config.js`.

## Diseño Propuesto

- Convertir los umbrales implicitos de `DIFFICULTIES` en parametros mas claros para decisiones de IA sin cambiar la interfaz visual del juego.
- Agregar probabilidad de reaccion defensiva por dificultad, por ejemplo `blockReaction`, para reemplazar el bloqueo perfecto actual cuando el oponente ataca cerca.
- Pasar a `chooseAIAction()` mas contexto minimo desde `Fighter.updateAI()`:
  - `attackCooldown` para evitar elegir ataques que no pueden ejecutarse.
  - `opponentHealth` para permitir cierre agresivo cuando la CPU puede ganar el round.
  - `x` y limites derivados como `nearLeftWall`/`nearRightWall` para evitar retiradas inutiles contra paredes.
- Ajustar la seleccion ofensiva por rango:
  - `punch` cuando el rival esta muy cerca y el puño conecta.
  - `kick` cuando la distancia favorece la patada.
  - `special` cuando hay energia completa y distancia razonable para conectar.
- Mantener acciones existentes (`approach`, `retreat`, `jump`, `block`, `punch`, `kick`, `special`, `idle`) para evitar cambios grandes en `Fighter.updateAI()`.
- Opcionalmente, en una segunda fase dentro del mismo plan, agregar una cola minima de combo para CPU (`aiComboQueue`) solo si los cambios anteriores quedan estables y las pruebas siguen simples.
- No agregar persistencia nueva, textos de UI ni controles nuevos.
- No cambiar `gameState`; la IA seguira ejecutandose solo por el flujo existente de actualizacion de luchadores.
- Mantener todas las distancias y bordes en coordenadas logicas `1000x500`.

## Archivos A Modificar

- `src/config.js`: agregar o ajustar parametros de dificultad para reaccion defensiva, rangos ofensivos y comportamiento cerca de bordes.
- `src/ai.js`: refinar `chooseAIAction()` con defensa probabilistica, decisiones por rango y manejo de bordes/cooldown.
- `src/fighter.js`: pasar contexto adicional minimo a `chooseAIAction()` y, si se implementa, ejecutar una cola simple de combo CPU.
- `tests/game.test.js`: cubrir las reglas nuevas con pruebas deterministas.
- `Readme.md`: documentar la mejora de IA si cambia el comportamiento descrito o el backlog.
- `plans/plan_0024_mejoras_ia.md`: mantener estado de ejecucion si el plan se implementa despues.

## Plan De Implementacion

1. Agregar parametros claros de IA en `src/config.js` para cada dificultad: probabilidad de bloqueo reactivo, agresividad con vida baja del rival y tolerancia a retirarse cerca de paredes.
2. Actualizar `chooseAIAction()` para que el bloqueo contra ataques cercanos use `difficulty.blockReaction` en vez de ser automatico.
3. Modificar `Fighter.updateAI()` para pasar `attackCooldown`, `opponentHealth`, `x`, `opponentX` y banderas de borde calculadas con `WIDTH`.
4. Ajustar `chooseAIAction()` para no elegir `retreat` si la CPU ya esta acorralada hacia ese lado; en ese caso preferir `block`, `jump`, `attack` si conecta o `approach` segun dificultad.
5. Ajustar la ofensiva cercana para priorizar `punch`, `kick` o `special` segun rango real y cooldown, manteniendo el mismo set de acciones.
6. Agregar pruebas unitarias para bloqueo no perfecto, seleccion de ataque por rango, no-retirada contra pared y no elegir ataques durante cooldown.
7. Ejecutar validacion automatica completa.
8. Evaluar una segunda fase de combos CPU solo si el cambio base queda pequeno y estable; si se implementa, agregar `aiComboQueue` en `Fighter` con una secuencia maxima de dos acciones y pruebas especificas.
9. Actualizar `Readme.md` si el backlog o descripcion de dificultad/CPU debe reflejar la mejora.
10. Actualizar el estado de este plan con decisiones finales, pruebas ejecutadas y cualquier ajuste de balance.

## Pruebas Y Validacion

Validacion automatica:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Validacion manual:

- En `easy`, acercarse atacando y confirmar que la CPU no bloquea todos los golpes.
- En `normal`, confirmar que la CPU alterna entre acercarse, cubrirse y atacar sin quedarse congelada.
- En `hard`, confirmar que la CPU reacciona mejor, pero aun deja ventanas despues de ataques, saltos o bloqueos fallidos.
- Empujar o perseguir a la CPU contra ambos bordes y confirmar que no intenta retroceder indefinidamente contra la pared.
- Confirmar que la CPU usa puño/patada/especial en rangos razonables.
- Confirmar que pausa, game over, round over y menu siguen deteniendo la simulacion como antes.
- Confirmar que controles moviles y teclado no cambian.

## Documentacion

- `Readme.md`: actualizar si se menciona el backlog de IA, dificultad o comportamiento de CPU.
- `AGENTS.md`: sin cambio esperado; solo actualizar si se agrega un smoke test manual nuevo que futuras sesiones deban conservar.
- `PLANS.md`: sin cambios esperados.

## Riesgos Y Mitigaciones

- Riesgo: la CPU queda demasiado fuerte por combinar defensa reactiva y ataques mejor elegidos. Mitigacion: bajar `blockReaction` y agresividad en `easy`/`normal`; validar manualmente cada dificultad.
- Riesgo: las probabilidades se vuelven dificiles de testear. Mitigacion: mantener `rand` inyectado y agregar pruebas con valores limite.
- Riesgo: agregar combos CPU aumenta mucho el alcance. Mitigacion: dejar combos como fase opcional y solo implementarlos si no requiere refactor grande.
- Riesgo: la IA elige acciones que no puede ejecutar por cooldown. Mitigacion: pasar `attackCooldown` y cubrirlo con pruebas.
- Riesgo: cambios de borde rompen movimiento normal. Mitigacion: calcular paredes con `WIDTH` y margenes existentes, sin cambiar fisica ni hitboxes.
- Riesgo: balance subjetivo. Mitigacion: validar con pruebas automatizadas para reglas y smoke manual para sensacion de combate.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El plan evita una reescritura de IA y conserva el set actual de acciones.
- Los cambios son quirurgicos: `config`, `ai`, `fighter`, pruebas y documentacion si aplica.
- Las suposiciones principales estan explicitas: sin dependencias, sin ML, sin cambios de controles y con pruebas deterministas.
- Los criterios de aceptacion son comprobables mediante tests y smoke manual.
- La parte de combos queda marcada como fase opcional para evitar sobrealcance si el cambio base ya resuelve el problema.

## Criterios De Aceptacion

- La CPU ya no bloquea automaticamente todos los ataques cercanos; la reaccion depende de la dificultad.
- La CPU evita retirarse indefinidamente contra los bordes del escenario.
- La CPU elige puño, patada o especial con mejor relacion al rango real y a su cooldown.
- Las dificultades se sienten distintas sin hacer imposible `hard` ni trivial `easy`.
- Las pruebas unitarias cubren las reglas principales de decision.
- No se agregan dependencias externas ni build step.
- La validacion automatica completa pasa.
- Si se implementa la fase opcional de combos, queda cubierta con pruebas y puede desactivarse ajustando configuracion sin tocar controles.

## Commit Y Push

- Commit sugerido si se implementa completo: `Improve CPU AI decisions`.
- Si se divide en commits, usar uno para la mejora base de decision/rango/bordes y otro separado para combos CPU si se implementan.
- Hacer commit solo si el usuario lo pide explicitamente.
- No hacer push salvo pedido explicito del usuario.

## Estado De Ejecucion

- Plan creado.
- Implementacion pendiente.
