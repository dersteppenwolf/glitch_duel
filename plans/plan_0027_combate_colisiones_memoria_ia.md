# Exec Plan: combate colisiones memoria IA

## Objetivo

Implementar una mejora integrada para los items `3`, `4` y `5` del backlog: refinar hitboxes/hurtboxes/pushboxes, mejorar la memoria de ataques de la CPU y extender esa memoria por zona de distancia y estado del jugador.

La experiencia esperada es que el combate se sienta mas justo y legible, y que la IA en dificultades altas responda mejor a patrones repetidos como `punch`, `kick`, `special` o ataques aereos usados siempre desde la misma distancia.

Queda fuera del alcance:

- Redisenar visualmente los luchadores.
- Agregar nuevos ataques o controles.
- Introducir FSM, Utility AI, lookahead o simulacion predictiva.
- Cambiar las reglas de rondas, timer, energia o victoria.
- Agregar dependencias externas.

## Contexto Actual

- `src/config.js` define `ATTACKS`, `DIFFICULTIES`, dimensiones logicas `1000x500`, energia, cooldowns y constantes de combate.
- `src/fighter.js` concentra fisica, controles, ataques, `getBodyBox()`, `getAttackBox()`, intersecciones, `updateAIMemory()` y `updateAI()`.
- `src/ai.js` contiene `chooseAIAction()`, que decide acciones por distancia, cooldown, salud, energia, counter window, pared y sesgos simples `opponentAttackBias`/`opponentBlockBias`.
- `src/game.js` administra estado global, loop, rondas, render y acceso a dificultad con `getDifficultyConfig()`.
- `tests/game.test.js` ya cubre casos de hitboxes, bloqueo, helper de IA, memoria corta de CPU y counter timer.
- La memoria actual de IA es simple: `this.aiMemory = { attack: 0, block: 0 }`, con decay/gain por dificultad.
- La colision actual usa `getAttackBox(type)` contra `opponent.getBodyBox()`. No hay pushbox explicita ni fases de ataque separadas.

Suposiciones:

- El proyecto debe seguir siendo vanilla JS sin build step.
- Las coordenadas y cajas deben seguir usando el espacio logico `1000x500`.
- La primera version puede mantener dano/cooldowns actuales salvo ajustes pequenos necesarios por cambios de caja.
- La visualizacion de debug puede quedar como API/test helper o modo dev minimo si no existe todavia una UI de debug completa.

## Diseño Propuesto

Refinar colisiones con cambios pequenos y verificables:

- Mantener `ATTACKS` como fuente de datos, pero agregar campos opcionales de caja si hacen falta, por ejemplo `activeStart`, `activeEnd`, `hitbox`, `hurtboxProfile` o equivalentes simples.
- Separar semanticamente las cajas aunque la implementacion inicial siga siendo compacta:
  - `getHitBox(type)` o `getAttackBox(type)` para zona ofensiva.
  - `getHurtBox()` como reemplazo gradual de `getBodyBox()` para zona vulnerable.
  - `getPushBox()` para evitar solapamientos excesivos si se puede agregar sin romper fisica.
- Ajustar hurtbox por postura: `idle`/`walk`, `crouch`, `jump`/aire y `hit` deben tener cajas previsibles.
- Mantener `getBodyBox()` como wrapper si reduce el alcance del cambio y evita tocar demasiados tests de golpe.
- Evitar cambios grandes de animacion. Las fases activas pueden basarse en cooldown/frame existente solo si se puede hacer de forma simple; si no, dejar las cajas por ataque como mejora principal y documentar la limitacion.

Mejorar memoria de IA sin cambiar la arquitectura:

- Cambiar `aiMemory` a una estructura pequena que preserve compatibilidad conceptual con `attack` y `block`, por ejemplo:

```js
{
    attack: 0,
    block: 0,
    attacks: { punch: 0, kick: 0, special: 0, air: 0 },
    zones: {
        close: { ground: 0, air: 0 },
        mid: { ground: 0, air: 0 },
        far: { ground: 0, air: 0 }
    },
    repeatedType: '',
    repeatedCount: 0
}
```

- Derivar zonas con umbrales simples basados en distancias ya usadas por `chooseAIAction()`, por ejemplo `close <= 110`, `mid <= 250`, `far > 250`.
- Clasificar el estado del jugador como `ground` o `air`; incluir `crouch`/`block` solo si no aumenta mucho el alcance.
- Registrar tipos de ataque desde `opponent.lastAttackType` cuando sea confiable, o desde `opponent.state` como fallback.
- Pasar a `chooseAIAction()` sesgos concretos y acotados, como `opponentPunchBias`, `opponentKickBias`, `opponentSpecialBias`, `opponentAirBias`, `zoneAttackBias` y `repeatedAttackBias`.
- Usar esos sesgos solo para modificar decisiones existentes: mayor probabilidad de `block`, `retreat`, `kick` o counter segun el caso. No crear acciones nuevas.

Interaccion con `gameState`:

- No se agregan estados globales nuevos.
- La memoria de IA se actualiza solo durante `playing`, como ahora, porque `gameState` ya detiene updates fuera de juego activo.

Compatibilidad:

- Todo debe seguir funcionando con teclado, touch y controles existentes.
- No se deben cambiar inputs ni layout.
- Los calculos deben mantenerse en coordenadas logicas, no en pixeles CSS o DPR.

## Archivos A Modificar

- `src/config.js`: agregar datos opcionales de cajas o parametros de memoria por dificultad si son necesarios.
- `src/fighter.js`: refinar cajas de combate, agregar helpers de zona/estado, actualizar `updateAIMemory()` y pasar nuevos sesgos a `chooseAIAction()`.
- `src/ai.js`: consumir sesgos nuevos manteniendo decisiones rule-based y sin agregar arquitectura pesada.
- `tests/game.test.js`: agregar o ajustar pruebas de colision, crouch/jump/corner, spam por tipo y memoria por zona.
- `Readme.md`: documentar cambios visibles si el comportamiento de combate o IA cambia de forma observable.
- `BACKLOG.md`: marcar o ajustar items si se completa el alcance.

## Plan De Implementacion

1. Agregar pruebas iniciales de colision para definir el comportamiento esperado.
   Verificar: casos de punch/kick/special conectan o fallan por rango/altura; crouch reduce hurtbox; air attack conserva alcance esperado.

2. Refactorizar cajas con el menor cambio posible.
   Verificar: `getAttackBox()` o el nuevo helper devuelve cajas compatibles; `getBodyBox()` sigue disponible si tests existentes lo usan.

3. Agregar una pushbox minima solo si se puede hacer sin reescribir fisica.
   Verificar: los luchadores no se solapan de forma excesiva y no se rompen corner/wall clamp. Si esto requiere rework, posponer pushbox y mantener el resto.

4. Actualizar datos de `ATTACKS` solo donde sea necesario.
   Verificar: danos, cooldowns, energia y combos existentes siguen pasando tests.

5. Extender `aiMemory` por tipo de ataque.
   Verificar: repetir `punch`, `kick`, `special` o ataque aereo aumenta el sesgo correspondiente y decae al volver a idle.

6. Agregar deteccion simple de spam.
   Verificar: tres o mas repeticiones del mismo tipo elevan `repeatedAttackBias` y Hard reacciona con mas bloqueo/counter sin afectar demasiado Easy.

7. Extender memoria por zona y estado.
   Verificar: ataques repetidos en `close`, `mid` o `far` y `ground`/`air` actualizan la celda correcta.

8. Integrar nuevos sesgos en `chooseAIAction()`.
   Verificar: decisiones existentes siguen pasando; nuevos tests prueban respuestas defensivas ante spam, ataques aereos desde lejos y patrones por zona.

9. Ajustar parametros en `DIFFICULTIES` si hace falta.
   Verificar: Easy sigue cometiendo errores, Normal se mantiene razonable y Hard se siente mas reactiva sin ser perfecta.

10. Actualizar documentacion y backlog.
    Verificar: `Readme.md` solo cambia si hay comportamiento visible que el jugador deba conocer; `BACKLOG.md` refleja items completados o ajustados.

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

Smoke test manual:

- `J`, `K`, `L`, `J,J`, `J,K`, `K,K`, `air J` y `air K` conectan y fallan de forma esperable segun distancia.
- Agacharse reduce la vulnerabilidad vertical sin volver invulnerable al jugador.
- Bloquear sigue aplicando chip damage, energia y counter window de CPU.
- La CPU en Easy no bloquea todo el spam.
- La CPU en Hard responde mejor si el jugador repite el mismo ataque varias veces.
- Repetir ataques aereos desde lejos provoca respuestas mas defensivas o anti-rango de la CPU.
- Los corners no generan solapamientos graves ni golpes imposibles.
- El juego sigue funcionando en menu, pausa, game over y mobile touch.

## Documentacion

- `Readme.md`: actualizar si cambia la descripcion de combate, dificultad o smoke test manual.
- `BACKLOG.md`: mover o ajustar items `3`, `4` y `5` si la implementacion se completa.
- `AGENTS.md`: actualizar solo si cambian comandos, arquitectura importante o smoke test que futuras sesiones deban recordar.
- `PLANS.md`: sin cambios previstos.

## Riesgos Y Mitigaciones

- Riesgo: los nuevos hitboxes desbalancean combos existentes.
  Mitigacion: mantener danos/cooldowns iniciales, agregar tests por combo y hacer ajustes pequenos.

- Riesgo: la IA Hard se vuelve demasiado perfecta contra spam.
  Mitigacion: aplicar bonuses por dificultad, conservar randomness y limitar topes de sesgo.

- Riesgo: la memoria por zona complica demasiado `chooseAIAction()`.
  Mitigacion: pasar solo 2 o 3 sesgos agregados y no exponer toda la estructura interna al helper.

- Riesgo: pushbox requiere reescribir fisica o rompe paredes.
  Mitigacion: tratar pushbox como opcional dentro del cambio; posponerla si no es quirurgica.

- Riesgo: tests existentes dependen de valores exactos de cajas.
  Mitigacion: actualizar tests solo cuando el nuevo comportamiento este definido y sea intencional.

- Riesgo: debug visual crece fuera del alcance.
  Mitigacion: limitarse a helpers o pruebas; dejar una UI completa de overlay para el item separado del backlog si no es imprescindible.

## Validacion Del Plan Con Skill

Se cargo la skill `karpathy-guidelines` antes de finalizar este plan.

Revision aplicada:

- El plan evita sobrecomplicar la solucion: no incluye FSM, Utility AI, lookahead ni nuevos controles.
- Los cambios son quirurgicos: se concentran en `config.js`, `fighter.js`, `ai.js` y tests.
- Las suposiciones importantes quedan explicitas: vanilla JS, coordenadas `1000x500`, sin dependencias, pushbox opcional.
- Los criterios de aceptacion son comprobables con tests automatizados y smoke manual.
- No se introducen dependencias externas ni build step.

## Criterios De Aceptacion

- `Hitbox and hurtbox refinement` queda implementado con cajas mas claras por ataque y postura.
- La compatibilidad de `getBodyBox()` o sus tests queda resuelta sin consumidores rotos.
- La CPU registra memoria por tipo de ataque y detecta repeticiones.
- La CPU registra memoria por zona de distancia y estado `ground`/`air`.
- `chooseAIAction()` usa los nuevos sesgos para mejorar defensa/counter sin acciones nuevas.
- Easy, Normal y Hard mantienen diferencias visibles de dificultad.
- Las pruebas unitarias cubren colisiones principales y memoria de IA.
- La validacion automatica completa pasa.
- El smoke test manual de combate no detecta regresiones en controles, combos, bloqueo, specials, pausa o mobile.

## Commit Y Push

- Recomendado: un commit funcional unico para el cambio completo si se implementa en una sesion.
- Si el trabajo se divide, usar commits separados por entregable verificable:
  - `Refine combat hitboxes`
  - `Add AI attack pattern memory`
  - `Add zone-aware AI memory tests`
- Ejecutar validacion automatica antes de cada commit.
- Hacer push solo si el usuario lo pide.
