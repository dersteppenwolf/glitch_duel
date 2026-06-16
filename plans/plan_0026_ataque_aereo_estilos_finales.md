# Exec Plan: Ataque Aereo, Estilos Y Finales

## Objetivo

Implementar tres mejoras de jugabilidad seleccionadas: ataque aereo simple, estilos de personaje y frases/finales por estilo de victoria.

La experiencia del jugador cambia en que saltar tendra una opcion ofensiva clara, el jugador podra elegir un estilo con pequenas ventajas/desventajas antes de jugar, y la pantalla final comunicara mejor como se gano la partida. Queda fuera del alcance agregar personajes completos con sprites nuevos, crear un sistema de perks complejo, cambiar el formato best-of-3, introducir dependencias externas, reescribir el combate o agregar multijugador.

## Contexto Actual

- `src/config.js` define `ATTACKS`, `DIFFICULTIES`, arenas y constantes de combate. Los ataques actuales son `punch`, `kick`, `comboPunch`, `comboKick`, `backKick` y `special`.
- `src/fighter.js` contiene controles, fisica, `handleAttackCommand()`, `attack()`, hitboxes, cooldowns, bloqueo, combos y la IA.
- `src/fighter_render.js` dibuja al luchador segun `state`, identidad visual y efectos existentes.
- `src/game.js` controla menu, estado global, rounds, pausa, resumen final, `matchStats`, medallas y frases post-partida.
- `src/index.html` ya tiene selectores de idioma, dificultad y arena; no existe selector de estilo.
- `src/i18n.js` contiene textos ES/EN para controles, ayuda, medallas y frases finales.
- `src/styles.css` define menu, overlays, controles tactiles y layout responsive.
- `tests/game.test.js` usa mocks DOM/canvas/audio y ya cubre ataques, combos, bloqueo, especial, IA, estados, i18n y pantalla final.

Suposiciones explicitas:

- El ataque aereo debe reutilizar los botones existentes `J` y/o `K`; no se agregara una tecla nueva.
- El selector de estilo aplica al jugador humano; la CPU puede permanecer con estadisticas base para reducir balance inicial.
- Los estilos deben ser ajustes pequenos y legibles, no clases radicalmente distintas.
- Las frases finales deben basarse en `matchStats` existentes o en contadores nuevos pequenos.
- La implementacion debe poder hacerse por fases independientes; si estilos complica demasiado UI/balance, ataque aereo y finales pueden quedar completos por separado.

## Diseño Propuesto

- Fase 1: ataque aereo simple.
- Agregar uno o dos ataques nuevos en `ATTACKS`, preferiblemente `airPunch` y `airKick`, con dano moderado, rango claro y cooldown al aterrizar o inmediato.
- En `Fighter.updatePlayerControls()`, si el jugador presiona `J` o `K` en el aire, ejecutar el ataque aereo correspondiente en vez de combo terrestre.
- Evitar combos aereos al inicio; un ataque por salto es suficiente. Agregar campo como `airAttackUsed` y reiniciarlo al tocar suelo en `applyPhysics()`.
- Definir estados visuales simples como `airPunch`/`airKick` o reutilizar animacion `punch`/`kick` si render soporta suficiente feedback.
- Para CPU, dejar ataques aereos fuera del primer alcance salvo que sea trivial usar la misma accion; no se debe volver impredecible la IA.

- Fase 2: estilos de personaje.
- Agregar estilos pequenos en `src/config.js`, por ejemplo:
  - `balanced`: sin cambios.
  - `fast`: mas velocidad, menos dano.
  - `heavy`: mas dano, menos velocidad.
  - `technical`: mas ganancia de energia, menos vida inicial o menos dano.
- Agregar `selectedFighterStyle` en `src/game.js` y un selector en el menu junto a dificultad/arena.
- Aplicar el estilo al crear `player1`, preferiblemente como multiplicadores en la instancia (`moveSpeedModifier`, `damageModifier`, `energyModifier`, `maxHealthModifier`) sin alterar constantes globales.
- Mantener la CPU en `balanced` inicialmente para evitar multiplicar balance por dificultad.
- Guardar persistencia solo si se decide explicitamente; por defecto no persistir para mantener el cambio simple.

- Fase 3: frases/finales por estilo de victoria.
- Extender `matchStats` con contadores de ataques aereos, estilo elegido y, si hace falta, dano o usos de estilo.
- Agregar funciones pequenas `recordPlayerAirAttack()` o `recordPlayerStyleUse()` solo si se necesitan para frases.
- Ampliar `getPostMatchPhrase()` con prioridades claras:
  - victoria con ataques aereos: frase de movilidad.
  - victoria con estilo `heavy`: frase de impacto.
  - victoria con estilo `fast`: frase de velocidad.
  - victoria con estilo `technical`: frase de optimizacion/energia.
  - mantener frases existentes para especial, firewall, victoria normal y derrota.
- Agregar textos ES/EN en `src/i18n.js`.

- Mantener `gameState` sin cambios; los nuevos controles solo funcionan en `playing` porque pasan por `Fighter.update()`.
- Mantener coordenadas y hitboxes en el espacio logico `1000x500`.
- Mantener controles tactiles existentes: botones `PUNCH` y `KICK` deben disparar ataques aereos si se pulsan durante salto.

## Archivos A Modificar

- `src/config.js`: agregar ataques aereos y configuracion de estilos.
- `src/fighter.js`: ejecutar ataques aereos, aplicar multiplicadores de estilo y registrar contadores.
- `src/fighter_render.js`: ajustar visual si los nuevos estados necesitan feedback distinto.
- `src/game.js`: estado de estilo seleccionado, selector, aplicacion al iniciar partida y frases finales.
- `src/index.html`: agregar selector de estilo en el menu y ayuda si corresponde.
- `src/styles.css`: ajustar layout del menu si el nuevo selector rompe en movil o bajo alto.
- `src/i18n.js`: textos ES/EN para estilo, opciones, ayuda y frases finales.
- `tests/game.test.js`: pruebas de ataque aereo, estilos, selector, resumen final y i18n.
- `Readme.md`: documentar controles, estilos y finales nuevos.
- `AGENTS.md`: actualizar smoke test manual si cambian controles/flujo de menu.
- `plans/plan_0026_ataque_aereo_estilos_finales.md`: mantener estado de ejecucion.

## Plan De Implementacion

1. Agregar `airPunch` y `airKick` en `ATTACKS` con dano/rango/cooldown conservadores.
2. Agregar `airAttackUsed` al `Fighter` y reiniciarlo cuando `onGround` vuelve a `true` en `applyPhysics()`.
3. Modificar controles para que `J`/`K` durante salto ejecuten ataque aereo una sola vez por salto, sin usar combo terrestre.
4. Agregar pruebas unitarias de ataque aereo: solo en aire, consume cooldown, golpea con hitbox esperada y no permite repetir en el mismo salto.
5. Agregar `FIGHTER_STYLES` en `src/config.js` con ajustes pequenos y una opcion `balanced` por defecto.
6. Agregar selector de estilo en `src/index.html`, textos en `src/i18n.js`, estado `selectedFighterStyle` en `src/game.js` y aplicacion al crear `player1`.
7. Aplicar multiplicadores de estilo en `Fighter` de forma local: velocidad del jugador, dano saliente, energia ganada o vida inicial segun estilo.
8. Agregar pruebas para seleccionar estilo, fallback a `balanced` si el valor es invalido y efectos principales de cada estilo.
9. Extender `matchStats` con `playerAirAttacks` y el estilo usado en la partida.
10. Agregar frases finales por estilo/ataque aereo en `getPostMatchPhrase()` y textos ES/EN.
11. Agregar pruebas de prioridad de frases finales para ataques aereos y estilos, asegurando que frases existentes de especial/bloqueo no se rompen.
12. Actualizar `Readme.md` y `AGENTS.md` con controles, selector de estilo y smoke manual.
13. Ejecutar validacion completa y actualizar el estado del plan con fases realizadas y comandos corridos.

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
git diff --check
```

Smoke test manual:

- Saltar con `W`/flecha arriba y pulsar `J`; confirmar ataque aereo visible y una sola vez por salto.
- Saltar con `W`/flecha arriba y pulsar `K`; confirmar patada aerea con rango distinto.
- Confirmar que `J,J`, `J,K` y `K,K` siguen funcionando en tierra.
- Confirmar que botones tactiles `PUNCH` y `KICK` ejecutan ataque aereo si el jugador esta saltando.
- Elegir cada estilo en menu y confirmar que el round inicia sin errores.
- Confirmar que `fast`, `heavy`, `technical` y `balanced` se sienten distintos sin romper dificultad normal.
- Confirmar que idioma ES/EN traduce el selector y frases nuevas.
- Ganar usando ataque aereo y confirmar frase final correspondiente.
- Ganar con cada estilo y confirmar que aparece una frase coherente cuando no hay una prioridad mayor.
- Confirmar que pausa, reinicio, menu, game over, arenas, dificultad y reduced motion siguen funcionando.

## Documentacion

- `Readme.md`: actualizar controles, funcionalidades completadas, backlog si aplica y descripcion de estilos/finales.
- `AGENTS.md`: actualizar smoke test manual porque cambian controles/selector de menu y comportamiento post-partida.
- `PLANS.md`: sin cambios esperados.

## Riesgos Y Mitigaciones

- Riesgo: el ataque aereo vuelve demasiado fuerte saltar. Mitigacion: un ataque por salto, dano moderado, cooldown claro y pruebas de no repeticion.
- Riesgo: estilos desbalancean dificultad. Mitigacion: mantener multiplicadores pequenos y CPU en `balanced` inicialmente.
- Riesgo: selector de estilo rompe menu movil o bajo alto. Mitigacion: reutilizar estructura `difficulty-picker` y validar overlays scrollables.
- Riesgo: multiplicadores globales afectan CPU o tests existentes. Mitigacion: aplicar estilo en instancia de `player1`, no modificar `ATTACKS` global.
- Riesgo: frases finales compiten con medallas/frases existentes. Mitigacion: definir prioridad explicita y cubrir con pruebas.
- Riesgo: i18n incompleto. Mitigacion: agregar claves ES/EN juntas y probar cambio de idioma.
- Riesgo: tocar `AGENTS.md` innecesariamente. Mitigacion: actualizar solo el smoke test, no instrucciones no relacionadas.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El plan separa las tres mejoras en fases verificables y evita convertir estilos en un sistema complejo de personajes.
- El ataque aereo usa controles existentes y limita repeticion para reducir riesgo de balance.
- Los estilos se plantean como multiplicadores pequenos locales al jugador, no como cambios globales.
- Las frases finales se basan en `matchStats` y textos i18n existentes, sin nueva persistencia.
- Las suposiciones importantes estan explicitas y los criterios de aceptacion son comprobables.
- No se agregan dependencias externas ni build step.

## Criterios De Aceptacion

- `J` y `K` en el aire ejecutan ataques aereos distintos y no repiten mas de una vez por salto.
- Los combos terrestres existentes siguen funcionando.
- El menu permite elegir estilo de personaje y usa `balanced` como fallback seguro.
- Al menos cuatro estilos existen y aplican diferencias pequenas al jugador humano.
- La pantalla final puede mostrar frases por ataque aereo o estilo de victoria sin romper las frases existentes.
- Los textos nuevos existen en espanol e ingles.
- README y smoke test reflejan los nuevos controles/selector/finales.
- La validacion automatica completa pasa.

## Commit Y Push

- Commit sugerido para el plan: `Plan air attacks styles and endings`.
- Si se implementa, usar commits separados si las fases se completan en momentos distintos:
  - `Add air attacks`.
  - `Add fighter styles`.
  - `Add style-based victory phrases`.
- Ejecutar validacion antes de cada commit.
- Hacer commit y push solo si el usuario lo pide explicitamente.

## Estado De Ejecucion

- Plan ejecutado.
- Fase 1 completada: `airPunch` y `airKick` con `J`/`K` en salto, una accion aerea por salto y feedback visual/sound profile.
- Fase 2 completada: selector de estilo con `balanced`, `fast`, `heavy` y `technical`; estilos aplicados solo al jugador humano.
- Fase 3 completada: frases finales por ataque aereo y estilo de victoria, respetando prioridad de especial y bloqueo existente.
- Cambios realizados en `src/config.js`, `src/audio.js`, `src/fighter.js`, `src/fighter_render.js`, `src/game.js`, `src/index.html`, `src/i18n.js`, `tests/game.test.js`, `Readme.md`, `AGENTS.md` y este plan.
- Validacion completa completada:
  - `node --check src\config.js`
  - `node --check src\audio.js`
  - `node --check src\effects.js`
  - `node --check src\ai.js`
  - `node --check src\fighter_render.js`
  - `node --check src\fighter.js`
  - `node --check src\game.js`
  - `node --test tests\game.test.js` (`64` tests passing)
  - `git diff --check`
