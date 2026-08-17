# Exec Plan: carrera arcade escalonada

## Objetivo

Implementar el roadmap `#8 Arcade ladder run` como una carrera fija de cinco combates completos, cada uno al mejor de tres rondas, con dificultad creciente, derrota definitiva y resumen final de lo disputado.

La experiencia del jugador cambia de forma observable:

- El menu ofrece `CARRERA ARCADE / ARCADE RUN` sin quitar protagonismo a `INICIAR JUEGO`.
- La carrera recorre cinco combinaciones fijas de rival, arena y dificultad.
- Ganar un combate abre una intermision con el progreso y permite iniciar el siguiente.
- Perder cualquier combate termina la carrera.
- Ganar el quinto combate muestra `5/5` y el resumen de los cinco resultados.
- La dificultad conserva ventanas de ataque claras: Facil se retira menos y cada perfil limita su reaccion maxima de bloqueo.

El mismo trabajo resolvera primero la dependencia `#14 Local match history` con un contrato minimo, versionado y acotado que la carrera reutilizara. No se agregara una pantalla para consultar el historial; su reset visible pertenece al item `#22`.

Queda fuera del alcance guardar o reanudar una carrera incompleta, agregar vidas/continues, puntuacion, monedas, mejoras, recompensas persistidas, rankings, nuevos rivales, perfiles de jefe, buffs de vida/dano, una dificultad nueva, personalidades de IA, adaptacion entre rondas, telemetria, event bus, clases de modo de juego o dependencias externas. Tampoco cambian `ROUNDS_TO_WIN`, `ROUND_TIME_SECONDS`, hitboxes, ataques, controles ni coordenadas logicas `1000x500`.

## Contexto Actual

- `BACKLOG.md` marca `#8` como `Blocked` por `#14`. La aceptacion de `#14` pide un registro acotado y versionado con dificultad, arena, estilo, duracion, medalla y eventos notables.
- `src/config.js` define `ROUNDS_TO_WIN = 2`, rondas de 60 segundos, cuatro rivales, ocho arenas y tres perfiles `easy`, `normal`, `hard`.
- `src/game.js` usa `gameMode = 'versus' | 'training'`; `initGame()` reinicia un match y `finishRound()` entra en `gameOver` cuando alguien gana dos rondas.
- `startRound()` crea luchadores nuevos, aplica el estilo humano y el rival CPU, limpia inputs/efectos y reinicia timer, energia y memoria de IA.
- `gameOver` ya detiene simulacion, oculta controles, contiene el foco y muestra `REINICIAR`/`MENU`. `renderGameOverText()` construye el resumen con nodos y `textContent`.
- Las estadisticas persistidas (`wins`, `losses`, rachas) se actualizan una vez por match mediante `recordMatchResult()`; no existe historial de matches.
- `matchStats` ya cuenta combos, bloqueos, especiales y ataques aereos del match actual. Es suficiente para los eventos notables del registro minimo.
- `src/ai.js` recibe un perfil declarativo y un valor aleatorio inyectado. No requiere otro sistema para escalar la carrera.
- `src/fighter.js` consulta `getDifficultyConfig()` en cada decision, por lo que cambiar temporalmente `selectedDifficulty` activa el perfil correcto sin modificar el luchador.
- `src/arena_render.js` y `src/fighter_render.js` leen directamente `selectedArena` y `selectedDifficulty`. Aplicar temporalmente la etapa a las selecciones existentes mantiene arena, IA, intro, pausa y apariencia sincronizadas.
- `initializeMatchSeed()` ya separa RNG de simulacion y cosmetico. Una carrera puede inicializar la semilla una vez y conservar ambos flujos entre combates.
- `src/hud_render.js` muestra ronda, rival, dificultad y arena en la intro VS. Puede mostrar tambien el numero de combate sin redisenar el HUD.
- `tests/game.test.js` ya cubre rondas, dificultad, IA determinista, semilla, estadisticas, foco modal, resumen final e inventarios HTML/config.
- El menu compacto del plan `0038` tiene tres acciones secundarias en desktop. La cuarta accion debe conservar el alto objetivo, zoom al 200% y fallbacks responsive.

Suposiciones explicitas:

- "Cinco combates" significa cinco matches completos al mejor de tres, no cinco rondas.
- Una derrota termina la carrera; no hay continues.
- El estilo elegido por el jugador se mantiene durante los cinco combates.
- La ruta es fija y no consume RNG. La misma semilla e inputs conservan simulacion reproducible.
- Las estadisticas globales y el historial cuentan cada match disputado, no una victoria adicional por completar la carrera.
- El historial guarda los 25 registros mas recientes y no incluye entrenamiento.
- El historial no necesita fecha, ID o texto localizado para desbloquear `#8`; el orden del array representa cronologia y las claves internas se traducen al renderizar.
- La duracion se guarda como pasos de simulacion activa del match, excluyendo intro VS, pausa e intermisiones y sin depender del reloj del sistema.
- Las selecciones de dificultad, arena y rival del menu se guardan al iniciar la carrera y se restauran al volver al menu.
- El estado `gameOver` sirve tanto para intermision como para cierre final; no se agrega un nuevo `gameState`.
- Si la carrera se abandona al menu o se recarga la pagina, empieza desde cero la proxima vez.

## Diseño Propuesto

### 1. Historial local minimo para desbloquear `#14`

Agregar en `src/game.js`:

```text
MATCH_HISTORY_STORAGE_KEY = glitchDuelMatchHistory
MATCH_HISTORY_VERSION = 1
MATCH_HISTORY_LIMIT = 25
```

Persistir un envelope:

```js
{
    version: 1,
    matches: [/* maximo 25 registros */]
}
```

Cada registro normalizado contiene solo:

```js
{
    mode: 'versus' | 'arcade',
    fight: 0 | 1 | 2 | 3 | 4 | 5,
    result: 'win' | 'loss',
    playerRounds: 0 | 1 | 2,
    cpuRounds: 0 | 1 | 2,
    difficulty: 'easy' | 'normal' | 'hard',
    arena: '<clave ARENAS>',
    style: '<clave FIGHTER_STYLES>',
    rival: '<clave CPU_RIVALS>',
    durationFrames: 0,
    medal: 'bug' | 'firewall' | 'combo' | 'survivor' | 'machine',
    events: {
        combos: 0,
        blocks: 0,
        specials: 0,
        airAttacks: 0
    }
}
```

- `fight` vale `0` en versus y `1..5` en carrera.
- Guardar claves internas, nunca etiquetas traducidas ni HTML.
- `loadMatchHistory()` acepta solo version `1`, arrays y registros validos; descarta registros invalidos, ignora propiedades desconocidas y limita a los 25 ultimos.
- `appendMatchHistory()` mantiene el historial en memoria aunque `localStorage` falle y persiste el envelope cuando esta disponible.
- No agregar migraciones, indice secundario, UI, exportacion ni reset; esos requisitos no existen todavia.
- Extender `getPostMatchMedal()` con un `id` estable para registrar la medalla sin duplicar sus reglas ni guardar texto localizado.
- Agregar `matchElapsedFrames`, reiniciado al comenzar cada match. Incrementarlo una vez por paso fijo durante combate real, despues de la intro VS; pausa, `roundOver`, `gameOver` e intermision no avanzan la duracion.

### 2. Ruta fija de cinco combates

Agregar en `src/config.js` una unica lista declarativa:

```js
const ARCADE_RUN_FIGHTS = [
    { rival: 'nullPointer', arena: 'notebook', difficulty: 'easy' },
    { rival: 'lagSpike', arena: 'cafeteria', difficulty: 'normal' },
    { rival: 'mergeConflict', arena: 'remoteMeeting', difficulty: 'normal' },
    { rival: 'lagSpike', arena: 'serverDown', difficulty: 'hard' },
    { rival: 'boss500', arena: 'geekConvention', difficulty: 'hard' }
];
```

- La lista tiene exactamente cinco entradas y todas sus claves deben existir en los mapas actuales.
- `BOSS 500` queda reservado para el quinto combate.
- Se reutiliza `LAG SPIKE` como rematch; no se crea un quinto rival cosmetico solo para llenar la ruta.
- La secuencia no se mezcla, no se deriva de la seleccion del menu y no usa `Math.random()` ni `randomSimulation()`.

### 3. Estado efimero de carrera

Extender `gameMode` con `arcade` y agregar un solo objeto de sesion:

```js
let arcadeRun = null;

// Durante la carrera:
{
    fightIndex: 0,
    results: [],
    awaitingNext: false,
    menuSelection: {
        difficulty: 'normal',
        arena: 'notebook',
        rival: 'nullPointer'
    }
}
```

No crear una clase ni un controlador de modos. Usar funciones pequenas:

- `startArcadeRun()`: guarda selecciones, inicializa semilla una sola vez, crea el objeto y empieza etapa 1.
- `startArcadeFight()`: aplica etapa activa, reinicia ronda/marcador/`matchStats`/duracion y llama `startRound()` sin generar otra semilla.
- `completeArcadeFight(playerWon, record)`: agrega el registro, decide intermision o cierre y renderiza el resumen.
- `continueArcadeRun()`: incrementa `fightIndex` solo despues de una victoria no final y comienza el siguiente match.
- `restoreArcadeMenuSelection()`: restaura dificultad/arena/rival al abandonar y actualiza selects/previews.

Extraer un helper pequeno `resetMatchProgress()` para las cuatro asignaciones repetidas de ronda, marcador, `matchStats` y duracion. Reutilizarlo en versus, entrenamiento y carrera; no refactorizar el resto de `startRound()`.

### 4. Aplicacion temporal de etapa

- Al iniciar una etapa, asignar sus claves a `selectedDifficulty`, `selectedArena` y `selectedRival`.
- No usar los setters de menu para persistir o producir efectos secundarios futuros; aplicar las claves validadas desde `ARCADE_RUN_FIGHTS` directamente.
- `startRound()`, `getDifficultyConfig()`, render de arena, apariencia CPU, intro y resumen siguen leyendo las variables actuales y quedan sincronizados sin getters paralelos.
- Al volver al menu desde intermision, cierre, pausa o cualquier salida de carrera, restaurar `menuSelection`, limpiar `arcadeRun`, volver a `gameMode = 'versus'` y renderizar preferencias/preview.
- No guardar las claves internas de etapa como preferencias cuando se implemente despues el item `#21`.

### 5. Cierre de match, intermision y botones

Mantener `finishRound()` como responsable del marcador de rondas. Cuando detecte dos victorias, delegar el cierre una sola vez a un helper `finishMatch(playerWon)` que:

1. Cambia a `gameOver` y conserva poses/feedback actuales.
2. Calcula medalla y crea un registro antes de reiniciar `matchStats`.
3. Actualiza estadisticas globales y agrega el historial exactamente una vez.
4. En versus, renderiza el resumen actual sin cambios funcionales.
5. En carrera, agrega el registro a `arcadeRun.results` y decide intermision o resumen final.

Reutilizar `#game-over`:

- Victoria en combates 1-4: `awaitingNext = true`; mostrar progreso, resultado y proxima etapa; el boton principal dice `SIGUIENTE COMBATE / NEXT FIGHT`.
- Derrota: mantener `awaitingNext = false`; mostrar `CARRERA TERMINADA / RUN OVER`, combates superados y resultados disputados; el boton dice `REINTENTAR CARRERA / RETRY RUN`.
- Victoria en combate 5: mantener `awaitingNext = false`; mostrar `CARRERA COMPLETADA / RUN COMPLETE`, `5/5` y cinco resultados; el boton dice `REINTENTAR CARRERA / RETRY RUN`.
- Versus: el boton conserva `REINICIAR / RESTART` y ejecuta `initGame()`.
- `MENU` siempre abandona y restaura selecciones si la sesion era arcade.

El listener existente de `restart-button` decide por `gameMode` y `arcadeRun.awaitingNext`; no reemplazar el boton ni registrar listeners por intermision.
Antes de reintentar una carrera finalizada, restaurar `menuSelection` y limpiar la sesion anterior para que la nueva carrera no guarde como preferencias iniciales la etapa en que termino.

### 6. Resumen y progreso visible

- `renderGameOverText()` conserva el resumen versus y delega a `renderArcadeRunSummary()` solo cuando `gameMode === 'arcade'`.
- El resumen arcade se construye con `document.createElement`, `textContent` y `replaceChildren`, nunca `innerHTML`.
- Cada fila muestra combate, rival, dificultad, arena, marcador y victoria/derrota a partir de claves internas.
- La intermision muestra tambien el siguiente rival/dificultad/arena, sin preview nuevo ni animacion.
- Limitar el resumen a los cinco resultados de la sesion; `#game-over` conserva `max-height` y scroll existentes.
- Agregar `getVsIntroTitle()` para que la intro muestre `COMBATE 1/5 · ROUND 1` o `FIGHT 1/5 · ROUND 1`; versus normal conserva `ROUND 1`.
- No redisenar el HUD central ni agregar barras de progreso permanentes.

### 7. Entrada de menu y responsive

- Agregar `#arcade-run-button` a `.menu-actions--secondary` con texto localizado.
- En desktop, las cuatro acciones secundarias comparten una fila si los textos ES/EN caben con objetivos de al menos 44 px.
- En tablet, usar dos columnas; por debajo del breakpoint estrecho, una columna.
- Mantener `INICIAR JUEGO` como unico CTA amarillo dominante.
- El nuevo boton es nativo, entra en el orden de Tab despues de Entrenamiento y antes de Ayuda, y funciona con confirmacion de gamepad mediante el sistema de foco existente.
- No agregar un selector de modo ni una pantalla previa de carrera.

### 8. Mejoras acotadas de dificultad

Agregar `maxBlockReaction` a cada perfil:

```text
easy   0.55
normal 0.80
hard   0.90
```

Cambiar en `chooseAIAction()` el limite fijo `0.96` por `difficulty.maxBlockReaction ?? 0.96`. Esto limita la suma de memoria y reaccion sin eliminar la diferenciacion entre perfiles.

Ajustar solo `easy.retreatMid` de `0.75` a `0.65`. Con el orden actual de umbrales, la franja efectiva de retirada en media distancia baja aproximadamente de 30% a 20%, evitando que Facil resulte mas evasivo que Normal.

No modificar velocidad, vida, dano, energia, cooldowns, `blockClose`, especiales, memoria, acciones ni valores de Normal/Dificil fuera del nuevo limite. El combate final usa `hard` sin buffs ocultos.

## Archivos A Modificar

- `src/config.js`: agregar `ARCADE_RUN_FIGHTS`, `maxBlockReaction` y ajustar `easy.retreatMid`.
- `src/ai.js`: usar el limite reactivo configurable.
- `src/game.js`: historial versionado, duracion, modo/estado arcade, progresion, restauracion, cierre compartido y resumen.
- `src/hud_render.js`: mostrar combate/ronda en la intro VS de carrera.
- `src/index.html`: agregar `#arcade-run-button` y actualizar versiones de assets modificados.
- `src/styles.css`: distribuir cuatro acciones y estilizar filas compactas del resumen arcade.
- `src/i18n.js`: agregar textos ES/EN de menu, progreso, intermision, cierre, acciones y filas.
- `tests/game.test.js`: ampliar mocks/API y cubrir historial, progresion, dificultad, resumen y regresiones.
- `Readme.md`: documentar carrera, historial local interno, curva fija, derrota definitiva y ausencia de reanudacion.
- `AGENTS.md`: agregar smoke durable de cinco combates, restauracion de selecciones, foco y responsive.
- `BACKLOG.md`: al completar, marcar `#14` y `#8` como `Completed`; cambiar `#7` y `#13` a `Ready` porque su dependencia queda resuelta. Mantener `#28` parcial y `#60` bloqueado por `#22`.
- `plans/plan_0039_carrera_arcade_escalonada.md`: registrar decisiones, validacion y estado final.

No se esperan cambios en `src/fighter.js`, `src/fighter_render.js`, `src/arena_render.js`, `src/input.js` ni reglas de combate. Si aparece una necesidad real en esos archivos, actualizar este plan antes de ampliar el alcance.

## Plan De Implementacion

1. Ampliar el fixture de pruebas y escribir contratos fallidos para historial y ruta fija.
   Verificar: se exponen `ARCADE_RUN_FIGHTS`, historial y estado arcade; las cinco etapas usan claves validas y la etapa final es `BOSS 500` en `hard`.

2. Implementar el envelope versionado, normalizacion, limite y persistencia del historial.
   Verificar: versus agrega un registro seguro; entrenamiento no agrega; datos corruptos/version desconocida producen historial vacio; mas de 25 resultados conserva solo los ultimos 25.

3. Registrar duracion, medalla estable y eventos notables al terminar un match.
   Verificar: la duracion solo avanza durante pasos de combate posteriores a la intro; pausa/intermision no avanzan; medalla y contadores coinciden con `matchStats`; el registro ocurre una sola vez.

4. Agregar y probar los ajustes de dificultad antes de integrar la carrera.
   Verificar: cada perfil limita bloqueo en 0.55/0.80/0.90; valores por debajo del limite conservan la formula; Facil se acerca o elige otra accion en la franja donde antes se retiraba; Normal/Dificil mantienen sus decisiones cubiertas.

5. Agregar el boton de carrera, textos y responsive del menu.
   Verificar: Inicio sigue dominante; cuatro secundarias caben en desktop, pasan a dos columnas y luego una; Tab/gamepad pueden activar Carrera; zoom 200% no produce overflow horizontal.

6. Implementar `arcadeRun`, guardado/restauracion de selecciones y arranque de etapa.
   Verificar: iniciar fija etapa 1, conserva estilo, inicializa una semilla, reinicia match y no modifica permanentemente dificultad/arena/rival del menu.

7. Extraer el cierre compartido de match y conectar historial/estadisticas una sola vez.
   Verificar: versus normal conserva resumen y reinicio; una victoria arcade agrega un resultado; empate de ronda no agrega ni avanza; no hay doble conteo de stats/historial.

8. Implementar intermision y avance de combates 1-4 reutilizando `gameOver`.
   Verificar: simulacion/controles quedan detenidos; foco entra al boton principal; `SIGUIENTE COMBATE` incrementa una etapa, reinicia rondas/`matchStats`/duracion y no reinicializa la semilla.

9. Implementar derrota y final de cinco victorias.
   Verificar: perder termina de inmediato y resume solo lo disputado; ganar el quinto produce cinco registros y `5/5`; `REINTENTAR CARRERA` crea una sesion nueva desde etapa 1.

10. Integrar resumen localizado, intro de progreso y restauracion al menu.
    Verificar: filas ES/EN muestran rival/dificultad/arena/marcador/resultado con `textContent`; intro muestra combate/ronda; salir desde game over o pausa restaura selecciones y preview.

11. Actualizar README, AGENTS, BACKLOG y estado del ExecPlan.
    Verificar: documentacion no promete guardado parcial, recompensas, nuevo jefe o historial visible; dependencias del backlog quedan coherentes.

12. Ejecutar validacion automatica completa y smoke manual de carrera/versus/training.
    Verificar: no cambian combate, timer fijo, controles, pausa, foco, mobile, estadisticas existentes ni coordenadas `1000x500`.

## Pruebas Y Validacion

Validacion automatica:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
git diff --check
```

Pruebas nuevas o ajustadas:

- `ARCADE_RUN_FIGHTS` contiene exactamente cinco etapas y todas las claves existen en `DIFFICULTIES`, `ARENAS` y `CPU_RIVALS`.
- La secuencia es fija y no consume RNG; `BOSS 500` aparece solo como etapa final.
- El historial acepta solo envelope version `1`, descarta registros invalidos/propiedades desconocidas y conserva 25 resultados.
- Un match versus registra modo, resultado, score, claves, duracion, medalla y eventos una sola vez.
- Entrenamiento y empates de ronda no registran resultados.
- La duracion excluye intro, pausa, `roundOver` y `gameOver`.
- Iniciar carrera aplica etapa 1, conserva estilo y guarda selecciones del menu.
- Ganar dos rondas agrega un resultado y abre intermision sin avanzar automaticamente.
- `SIGUIENTE COMBATE` avanza una etapa, reinicia estado de match y conserva historial/resultados/semilla.
- Una derrota termina la carrera y no permite continuar a la etapa siguiente.
- Cinco victorias terminan en `5/5` con cinco filas ordenadas.
- Stats e historial cuentan cinco matches, no una sexta victoria de carrera.
- `REINTENTAR CARRERA` limpia resultados anteriores e inicia etapa 1.
- El reintento conserva el snapshot original del menu, no las selecciones temporales de la ultima etapa.
- Volver al menu restaura dificultad, arena y rival previos; versus posterior usa esas selecciones.
- Cambiar idioma durante intermision/cierre vuelve a renderizar resumen y etiqueta del boton.
- El resumen usa nodos/texto seguro y no introduce contenido HTML desde almacenamiento.
- El foco entra y queda contenido en game over durante intermision/final; `Escape` conserva la politica actual.
- `maxBlockReaction` limita cada perfil y el fallback `0.96` mantiene compatibilidad con fixtures parciales.
- `easy.retreatMid = 0.65` corrige la franja evasiva sin alterar decisiones Normal/Dificil.
- Duelo normal sigue terminando al ganar dos rondas y `REINICIAR` sigue creando versus.
- La suite actual de IA, semilla, 30/60/120 FPS, combate, input, touch, gamepad, foco, i18n y persistencia sigue pasando.

Smoke test manual:

- Iniciar Carrera desde menu ES y EN; confirmar `COMBATE 1/5`, rival, Facil y arena correctos.
- Ganar combates 1-4; cada intermision muestra resultado/proximo rival, detiene simulacion y enfoca `SIGUIENTE COMBATE`.
- Confirmar secuencia exacta: Null Pointer, Lag Spike, Merge Conflict, rematch Lag Spike y Boss 500.
- Perder en combate 1 y en combate 3; la carrera termina, lista solo lo disputado y ofrece reintento/menu.
- Ganar los cinco; resumen final muestra `5/5`, cinco scores y Boss 500 final.
- Reintentar despues de ganar/perder; vuelve a etapa 1 sin resultados anteriores.
- Volver al menu desde intermision, final y pausa; dificultad/arena/rival originales reaparecen y un duelo rapido los usa.
- Comparar Facil/Normal/Dificil: Facil deja ventanas amplias y retrocede menos; Normal escala; Dificil reacciona mejor sin bloqueo perfecto.
- Confirmar que Boss 500 no tiene vida, dano, energia o cooldown extra.
- Probar menu y resumen a `1366x768`, `760x800`, `390x844`, landscape bajo y zoom 200%; no hay overflow horizontal y el resumen permite scroll.
- Navegar Carrera, intermision, final y menu con teclado/gamepad; foco y cancelacion respetan dialogos actuales.
- Ejecutar versus normal y entrenamiento despues de una carrera; ambos conservan comportamiento previo.

## Documentacion

- `Readme.md`: describir Carrera Arcade como cinco matches al mejor de tres, ruta fija, derrota final, resumen, stats por match, historial local acotado y sin reanudacion.
- `AGENTS.md`: incorporar secuencia, intermision, final, restauracion de menu, dificultad y smoke responsive/foco.
- `BACKLOG.md`: reflejar `#14` y `#8` completados solo despues de pasar validacion; desbloquear dependientes directos coherentes.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: implementar `#8` sin `#14` crea dos esquemas de resultados. Mitigacion: entregar primero el envelope minimo y usar el mismo registro en historial y `arcadeRun.results`.
- Riesgo: el historial crece o acepta datos corruptos. Mitigacion: version exacta, normalizacion por enums/enteros, limite 25 y fallback a array vacio.
- Riesgo: registrar una carrera y sus matches infla stats. Mitigacion: registrar exclusivamente cada match terminado; no existe resultado persistido adicional de carrera.
- Riesgo: un match se registra dos veces por renders/clicks. Mitigacion: crear el registro solo en la transicion autoritativa de `finishMatch()` y cubrir conteo exacto.
- Riesgo: las etapas contaminan preferencias de menu. Mitigacion: snapshot al iniciar, asignacion temporal y restauracion centralizada en toda salida al menu.
- Riesgo: una semilla nueva por combate rompe continuidad reproducible. Mitigacion: llamar `initializeMatchSeed()` solo en `startArcadeRun()`, nunca en `startArcadeFight()`.
- Riesgo: reutilizar `gameOver` confunde intermision y final. Mitigacion: `awaitingNext` solo es `true` tras victorias 1-4; en cualquier otro cierre el boton principal reinicia la carrera.
- Riesgo: el timeout de `roundOver` avanza despues de abandonar. Mitigacion: la carrera solo cambia etapa al final de match; revisar que callbacks de ronda respeten el estado/sesion actual antes de `startRound()` si una salida puede ocurrir durante los 1.4 segundos.
- Riesgo: cuatro acciones rompen el menu compacto. Mitigacion: breakpoints 4/2/1, controles de 44 px y smoke en ES/EN/zoom.
- Riesgo: cinco filas desbordan game over. Mitigacion: filas compactas, `max-height`/scroll existentes y sin tarjetas decorativas por combate.
- Riesgo: limitar bloqueo vuelve Dificil demasiado debil. Mitigacion: conservar 0.90, velocidad, cadencia, contraataque y memoria; probar limites y sensacion manual.
- Riesgo: ajustes de dificultad se expanden a balance avanzado. Mitigacion: cambiar solo `maxBlockReaction` y `easy.retreatMid`; `#16`, `#17`, `#19` y `#48` permanecen fuera.
- Riesgo: restaurar variables directas no actualiza UI. Mitigacion: llamar renderizadores existentes de preferencias, preview y resumen al volver al menu.
- Riesgo: el plan deriva hacia event bus, repositorio o clases. Mitigacion: historial y carrera viven en `game.js` con funciones pequenas y un objeto; no crear archivos de arquitectura nuevos.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este plan.

- La dependencia `#14` se redujo a su contrato de aceptacion: envelope versionado, validacion, limite y persistencia. Se excluyeron pantalla, bus de eventos, exportacion y reset.
- La carrera reutiliza `gameOver`, `startRound()`, perfiles de dificultad, selecciones globales, i18n y mocks actuales; no introduce una maquina de estados paralela.
- Se eligio asignacion temporal/restauracion en vez de crear getters activos y modificar arena/render/IA en varios archivos.
- Solo se agrega un modo (`arcade`) y un objeto efimero con cuatro campos funcionales; no hay clases o abstracciones de un solo uso.
- La ruta fija, derrota final, stats por match, semilla unica y ausencia de reanudacion estan explicitas.
- Las mejoras de dificultad se limitan a un cap de reaccion y un umbral de Facil, ambos verificables con `rand` inyectado.
- Cada paso tiene una comprobacion automatizable o un smoke concreto; no se usa "se siente mejor" como unico criterio.
- No se introducen dependencias, cambios de combate, coordenadas nuevas, buffs ocultos ni funcionalidades futuras especulativas.

## Criterios De Aceptacion

- `#14` dispone de historial local version `1`, validado, seguro y limitado a 25 matches; entrenamiento queda excluido.
- El menu ofrece Carrera Arcade sin degradar el CTA principal, responsive, zoom, foco o gamepad.
- Carrera Arcade contiene exactamente cinco matches al mejor de tres en una secuencia fija y visible.
- Ganar combates 1-4 abre intermision y solo el boton principal inicia el siguiente.
- Perder cualquier combate termina la carrera sin continue.
- Ganar el quinto muestra `5/5` y cinco resultados ordenados.
- Cada match actualiza stats e historial exactamente una vez; completar la carrera no agrega una victoria extra.
- El estilo humano se conserva durante la carrera y las selecciones de dificultad/arena/rival se restauran al menu.
- La semilla se inicializa una vez por carrera y no se consume RNG para elegir etapas.
- El resumen final muestra rival, dificultad, arena, score y resultado en ES/EN usando DOM seguro.
- La intro VS comunica combate `N/5` y ronda; el HUD/combate restante no se redisena.
- Facil usa `maxBlockReaction 0.55` y `retreatMid 0.65`; Normal usa cap `0.80`; Dificil usa cap `0.90`.
- Boss 500 usa `hard` sin vida, dano, energia, cooldown o reglas especiales.
- Versus, entrenamiento, rondas, empates, pausa, game over, input, touch y gamepad conservan comportamiento actual.
- No se agregan guardado parcial, recompensas, nuevos rivales, nueva dificultad, personalidades, adaptacion o dependencias.
- `node --check` para todo `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan.
- `Readme.md`, `AGENTS.md`, `BACKLOG.md` y este plan reflejan exactamente la entrega.

## Commit Y Push

- Commit 1 recomendado: `Add bounded local match history`.
- Commit 2 recomendado: `Add deterministic arcade run`.
- Incluir los dos ajustes de dificultad en el segundo commit porque forman parte de la curva y no justifican un tercer cambio aislado.
- Ejecutar pruebas focalizadas antes del primer commit y validacion completa antes del segundo.
- No hacer commit ni push salvo solicitud expresa del usuario durante la implementacion.

## Estado De Implementacion

Implementado localmente el 2026-08-17.

- Completado: historial local version `1` bajo `glitchDuelMatchHistory`, validacion defensiva, limite de 25 registros y exclusion de entrenamiento.
- Completado: registros por match con modo, combate, resultado, score, dificultad, arena, estilo, rival, duracion, medalla y eventos notables.
- Completado: ruta fija de cinco combates `easy -> normal -> normal -> hard -> hard`, con `BOSS 500` como etapa final y sin RNG para elegir etapas.
- Completado: modo `arcade`, una semilla por carrera, intermisiones reutilizando `gameOver`, avance manual, derrota definitiva, reintento y resumen `N/5`.
- Completado: restauracion de dificultad, arena y rival seleccionados al volver al menu o reintentar.
- Completado: intro VS muestra `COMBATE N/5` en carrera y el menu responsive incorpora `CARRERA ARCADE`.
- Completado: limites `maxBlockReaction` para Easy/Normal/Hard y reduccion de `easy.retreatMid` a `0.65`.
- Completado: textos ES/EN, filas compactas de resultados, contratos HTML y documentacion de README/AGENTS/BACKLOG.
- No implementado deliberadamente: pantalla de historial, reset visible, guardado parcial/reanudacion, recompensas, nuevos rivales, buffs de jefe, nueva dificultad, adaptacion de IA y telemetria.

Validacion local ejecutada:

- `node --check` para todos los archivos `src\*.js`: correcto.
- `node --test tests\game.test.js`: 98 pruebas superadas.
- `git diff --check`: correcto; solo se reportaron advertencias de normalizacion LF/CRLF de Git.
- Smoke navegador: `CARRERA ARCADE` aparece y comienza el combate; pausa muestra resumen de la etapa; `MENU` restaura selecciones; menu movil a `390x844` conserva scroll vertical y no muestra overflow horizontal en el snapshot.
- Pruebas automatizadas de flujo: versus normal, entrenamiento, derrota arcade, avance entre etapas y cinco victorias con `5/5` e historial de cinco matches.

Riesgo residual aceptado:

- El recorrido completo se cubre con pruebas de estado; la comprobacion visual del navegador cubre entrada, pausa, salida al menu y responsive. El combate manual prolongado queda fuera del smoke automatizado porque requiere jugar cada match.
