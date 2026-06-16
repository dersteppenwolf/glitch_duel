# Exec Plan: Mejoras IA Avanzadas

## Objetivo

Agregar una segunda capa de inteligencia a la CPU sin reescribir el sistema actual de IA.

La experiencia del jugador cambia en que la CPU parecera mas tactica: podra contraatacar despues de bloquear, usar el especial con mas intencion, reaccionar a patrones recientes del jugador y, opcionalmente, variar su estilo con perfiles simples. Queda fuera del alcance introducir machine learning, pathfinding complejo, nuevos controles, dependencias externas, UI obligatoria nueva o una reestructuracion completa de `chooseAIAction()`.

## Contexto Actual

- `src/config.js` contiene `DIFFICULTIES`, ataques y valores de tuning. Despues del plan `0024`, la dificultad incluye parametros como `blockReaction`, `kickMid`, `specialChance`, `lowHealthRetreat` y `cornerJump`.
- `src/ai.js` contiene `chooseAIAction()`, que decide acciones con contexto de distancia, vida, energia, cooldown, rango de ataques, vida rival, posicion y paredes.
- `src/fighter.js` ejecuta `Fighter.updateAI(opponent)`, aplica la accion elegida y contiene `attack()`, `takeHit()`, combos, cooldowns, hit-stun y fisica.
- `src/game.js` controla `gameState`; solo `playing` avanza simulacion, por lo que cualquier memoria o timer de IA debe avanzar dentro del flujo actual de `Fighter.update()`.
- `tests/game.test.js` expone `chooseAIAction` y ya cubre decisiones deterministas de IA, rango, cooldown, pared y bloqueo cercano.
- `Readme.md` ya documenta que la IA usa reacciones por dificultad, ataques por rango, retiradas con poca vida y defensa consciente de paredes.

Suposiciones explicitas:

- El objetivo es mejorar sensacion tactica, no hacer la CPU perfecta.
- Las pruebas deben seguir siendo deterministas mediante valores inyectados o estado controlado.
- La mejora debe poder implementarse por fases; cada fase debe poder quedar completa aunque las fases opcionales no se hagan.
- La CPU debe conservar ventanas claras para el jugador en `easy` y `normal`.
- No se agregara persistencia nueva salvo que una fase futura lo justifique explicitamente.

## Diseño Propuesto

- Fase base obligatoria: contraataque y especial tactico.
- Agregar un timer pequeno en `Fighter`, por ejemplo `aiCounterTimer`, que se active cuando la CPU bloquea o recibe chip damage de un ataque rival.
- Pasar `counterTimer` a `chooseAIAction()` para aumentar la probabilidad de `punch` o `kick` si el rival sigue en rango.
- Refinar el uso de `special` con reglas simples:
  - usarlo si puede cerrar el round;
  - usarlo si la CPU esta perdiendo y el rival esta en rango;
  - evitarlo si `canSpecial` es falso o hay cooldown;
  - mantener probabilidad mas baja en `easy`.
- Fase secundaria: memoria corta del jugador.
- Agregar un objeto pequeno de memoria por CPU, por ejemplo `aiMemory`, con contadores acotados o timers para patrones recientes: ataques, bloqueos, saltos y retiradas del jugador.
- Actualizar esa memoria desde `Fighter.updateAI(opponent)` leyendo estado del rival, sin tocar controles ni persistencia.
- Pasar senales simples a `chooseAIAction()`, por ejemplo `opponentAttackBias`, `opponentBlockBias` y `opponentJumpBias`, para ajustar decisiones sin crear un arbol complejo.
- Fase opcional: perfiles de personalidad.
- Definir perfiles simples en `src/config.js`, por ejemplo `balanced`, `aggressive`, `defensive` y `tricky`, como multiplicadores o pequenos ajustes sobre dificultad.
- Asignar un perfil fijo por round o por CPU al iniciar la partida solo si puede hacerse sin UI nueva.
- Fase opcional: debug visual de IA.
- Agregar modo debug solo si ya existe una ruta clara para activarlo sin impactar al jugador normal; si no, dejarlo como plan separado.
- Fase opcional: combos CPU limitados.
- Implementar una cola maxima de dos acciones (`aiComboQueue`) solo despues de estabilizar contraataque y memoria, y con probabilidad baja por dificultad.
- Mantener coordenadas y rangos en el espacio logico `1000x500`.
- No cambiar `gameState`; los timers nuevos se pausaran naturalmente porque `Fighter.update()` no avanza fuera de `playing`.

## Archivos A Modificar

- `src/config.js`: agregar parametros de contraataque, especial tactico, memoria y opcionalmente perfiles.
- `src/ai.js`: usar `counterTimer` y senales de memoria para decidir acciones sin aumentar mucho la complejidad.
- `src/fighter.js`: mantener timers/memoria de IA, detectar ventanas de contraataque y pasar contexto adicional.
- `src/game.js`: solo si hace falta resetear perfil/memoria al iniciar round; evitar cambios si `Fighter` puede encargarse.
- `tests/game.test.js`: cubrir contraataque, especial tactico y memoria corta con casos deterministas.
- `Readme.md`: documentar cambios de IA y mover/completar backlog si corresponde.
- `plans/plan_0025_mejoras_ia_avanzadas.md`: mantener estado de ejecucion si se implementa.

## Plan De Implementacion

1. Agregar parametros base a `DIFFICULTIES` en `src/config.js`: probabilidad de contraataque, duracion de ventana de contraataque, umbral de especial defensivo/ofensivo y sensibilidad a patrones del jugador.
2. Agregar en `Fighter` campos iniciales minimos: `aiCounterTimer` y, si se implementa memoria en la misma fase, `aiMemory` con contadores acotados.
3. Activar `aiCounterTimer` cuando la CPU bloquee un golpe o reciba chip damage por bloqueo, evitando tocar las reglas de daño existentes.
4. Pasar `counterTimer` a `chooseAIAction()` y priorizar `punch`/`kick` en rango durante esa ventana segun dificultad.
5. Ajustar el uso de `special` para considerar si cierra el round, si la CPU esta perdiendo por suficiente vida y si el rival esta realmente en rango.
6. Agregar pruebas unitarias para contraataque tras bloqueo y especial tactico.
7. Implementar memoria corta solo si los pasos 1-6 quedan pequenos y estables: actualizar contadores de acciones recientes del rival, decaerlos por frame y pasarlos a `chooseAIAction()`.
8. Agregar pruebas para memoria corta: jugador que ataca repetidamente aumenta probabilidad de bloqueo/contraataque; jugador que bloquea repetidamente cambia la eleccion ofensiva o espera.
9. Evaluar perfiles de personalidad como fase separada dentro del plan; si se implementan, usar configuracion simple y pruebas de seleccion/tuning, sin UI nueva.
10. Dejar debug visual y combos CPU como opcionales; implementarlos solo si no requieren refactor grande. Si requieren mas alcance, crear planes separados.
11. Actualizar `Readme.md` con la mejora completada y ajustar backlog si se implementan perfiles, debug o combos.
12. Ejecutar validacion completa y actualizar el estado del plan con fases realizadas, fases no ejecutadas y comandos corridos.

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

- En `easy`, confirmar que la CPU contraataca raramente y sigue dejando ventanas claras.
- En `normal`, confirmar que despues de bloquear a veces responde con un golpe si el jugador queda en rango.
- En `hard`, confirmar que el contraataque es mas consistente pero no instantaneo ni perfecto.
- Cargar energia de CPU y confirmar que el especial se usa para cerrar round o remontar, no al azar fuera de rango.
- Repetir ataques como jugador y confirmar que la CPU empieza a cubrirse o castigar mas sin volverse invulnerable.
- Repetir bloqueos como jugador y confirmar que la CPU no queda bloqueada en una sola respuesta.
- Confirmar que menu, pausa, `roundOver`, `gameOver`, timer y controles moviles no cambian.
- Confirmar que no hay regresion en combos del jugador, bloqueo, especial y movimiento.

## Documentacion

- `Readme.md`: actualizar descripcion de IA, backlog completado y backlog pendiente segun las fases realmente implementadas.
- `AGENTS.md`: sin cambio esperado; actualizar solo si se agrega una nueva comprobacion obligatoria al smoke manual.
- `PLANS.md`: sin cambios esperados.

## Riesgos Y Mitigaciones

- Riesgo: la CPU queda demasiado castigadora despues de bloquear. Mitigacion: limitar `aiCounterTimer`, bajar probabilidad en `easy`/`normal` y cubrir con smoke manual por dificultad.
- Riesgo: la memoria corta crea comportamiento opaco o frustrante. Mitigacion: usar contadores pequenos con decaimiento rapido y no bloquear siempre una accion del jugador.
- Riesgo: el especial tactico vuelve injustos los cierres de round. Mitigacion: exigir `canSpecial`, cooldown libre y probabilidad por dificultad, salvo cierre claro con vida rival baja.
- Riesgo: perfiles de personalidad aumentan mucho el balance pendiente. Mitigacion: dejarlos opcionales y mantener `balanced` como comportamiento base.
- Riesgo: debug visual o combos CPU expanden demasiado el alcance. Mitigacion: separarlos en plan nuevo si requieren UI, input nuevo o cola compleja.
- Riesgo: cambios en `takeHit()` afectan dano, energia o efectos. Mitigacion: tocar solo lo necesario para detectar bloqueo/contraataque y mantener pruebas existentes.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El plan evita una reescritura de IA y prioriza una fase base pequena: contraataque y especial tactico.
- Las mejoras mas riesgosas quedan explicitamente opcionales o candidatas a planes separados.
- Las suposiciones importantes estan explicitas: sin dependencias, sin ML, sin UI obligatoria y con pruebas deterministas.
- Cada fase tiene criterios verificables por tests y smoke manual.
- El plan mantiene los cambios cerca de `config`, `ai`, `fighter` y pruebas, sin tocar arquitectura salvo necesidad concreta.

## Criterios De Aceptacion

- La CPU puede contraatacar despues de bloquear dentro de una ventana corta y balanceada por dificultad.
- La CPU usa el especial de forma mas tactica: cierre de round, remontada o rango real, no solo probabilidad plana.
- Si se implementa memoria corta, los patrones repetidos del jugador afectan la decision sin crear respuestas perfectas.
- Las dificultades siguen diferenciadas y `easy` conserva errores/ventanas claras.
- No se agregan dependencias externas, build step ni persistencia nueva.
- Las pruebas unitarias cubren las reglas principales implementadas.
- La validacion automatica completa pasa.
- `Readme.md` refleja solo las fases realmente implementadas.

## Commit Y Push

- Commit sugerido para la fase base: `Add tactical CPU AI responses`.
- Si se implementan memoria, perfiles, debug o combos, usar commits separados por mejora funcional completa.
- Ejecutar validacion antes de cada commit.
- Hacer commit y push solo si el usuario lo pide explicitamente.

## Estado De Ejecucion

- Plan creado.
- Implementacion pendiente.
