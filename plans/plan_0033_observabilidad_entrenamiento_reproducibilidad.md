# Exec Plan: observabilidad entrenamiento y reproducibilidad

## Objetivo

Implementar en el orden recomendado los items `#37`, `#68`, `#10`, `#1`, `#15` y `#6` del backlog.

El resultado esperado es una base observable y reproducible antes de ampliar el juego: las ocho arenas se leen correctamente, el HTML estatico tiene un contrato probado, un overlay de desarrollo expone el estado real de combate, el jugador puede practicar sin duplicar reglas, los primeros usuarios reciben una introduccion descartable y los escenarios de combate se pueden repetir con una semilla conocida.

Quedan fuera del alcance cambiar el balance de ataques, crear nuevas arenas, agregar efectos reactivos (`#36`), variantes visuales, controles remapeables/gamepad (`#4`), trials (`#9`), ayuda visual con diagramas (`#24`), telemetria persistente (`#31`), input replay (`#33`), PWA, dependencias externas, bundler o cambios a las coordenadas logicas `1000x500`.

Este es un plan programa con seis entregables funcionales. No se debe fusionar todo en un unico cambio: cada item debe pasar sus pruebas, smoke test y actualizacion de backlog antes de iniciar el siguiente.

## Contexto Actual

- `src/arena_render.js` dibuja las ocho arenas, incluyendo foreground despues de los luchadores. Las props perifericas ya tienen coordenadas por arena, pero no hay una auditoria formal de contraste, HUD, esquinas, oclusion y movimiento reducido.
- `src/index.html` contiene los IDs que consume `src/game.js`, carga hojas y scripts locales en orden clasico, y enumera las ocho arenas. `tests/game.test.js` verifica partes de esos contratos de forma indirecta, pero no un contrato estatico completo de IDs, recursos, orden y coherencia config/i18n/selectores.
- `Fighter` ya expone hurtboxes, hitboxes, pushboxes, estados, timers y `aiAction`; `src/game.js` mantiene estado global, paso fijo, efectos y draw. No hay overlay que permita observarlos durante una partida.
- El juego solo tiene `menu`, `playing`, `paused`, `roundOver` y `gameOver`. `initGame()` y `startRound()` crean una partida competitiva al mejor de tres, resetean luchadores y aplican el timer. No existe modo de juego ni configuracion de entrenamiento.
- `src/index.html` ya contiene menu, ayuda, pausa, controles tactiles y game-over. `src/i18n.js` almacena ES/EN y persistencia de idioma; hay preferencias versionadas para idioma, movimiento y estadisticas, pero no una marca de onboarding.
- La simulacion usa pasos fijos a 60 Hz. `Fighter.updateAI()` y feedback de combate usan `Math.random()` directamente; `effects.js` tambien lo usa y el render usa aleatoriedad para shake. Esto impide garantizar una secuencia completa repetible sin separar aleatoriedad de simulacion y aleatoriedad visual.
- `tests/game.test.js` usa `node:test` y mocks DOM/canvas/audio. Ya expone helpers internos y puede alimentar el paso fijo, por lo que puede cubrir contratos, escenarios de entrenamiento y snapshots deterministas sin navegador real.

Suposiciones explicitas:

- La auditoria de `#37` no obliga a redisenar una arena que ya sea legible. Solo se modificaran colores, alpha, coordenadas o props de una arena si el checklist identifica un fallo concreto; no se agregaran animaciones, contenido ni efectos reactivos.
- El overlay `#10` sera una herramienta de desarrollo opt-in, no una preferencia persistente ni una pantalla de producto. Se activara con el parametro de URL `?debug=1` y se podra alternar con la tecla `` ` `` sin interceptar controles de combate existentes.
- El entrenamiento sera un modo local de una ronda continua. Reutilizara `Fighter`, `update()`, inputs, efectos, colisiones y HUD; no creara una segunda simulacion ni una variante de ataques. Sus acciones administrativas se limitaran a reset, posiciones, salud/energia, timer y comportamiento de CPU.
- El onboarding se mostrara una sola vez por instalacion/origen, desde el menu, y se podra omitir o cerrar. No se mostrara a usuarios con la marca persistida ni interrumpira una partida ya iniciada.
- La semilla de `#6` es una herramienta de desarrollo: `?seed=<uint32>` inicializa el RNG de simulacion para una nueva partida y las pruebas tendran un helper de escenario fijo. Las partidas normales conservaran entropia de `Math.random()`; no se agrega interfaz de compartir, historial ni replay en este item.

## Diseño Propuesto

### 1. Auditoria de legibilidad de arenas para `#37`

- Definir en `Readme.md` una matriz de revision para las ocho arenas: contraste de P1/CPU, texto y barras HUD, lectura en esquinas, props foreground sobre luchadores, y comportamiento con `Reducir movimiento`.
- Crear pruebas de geometria basadas en los datos y draw actuales: foreground debe quedar fuera de la banda central de combate y debajo del HUD; cada arena debe seguir dibujando fondo y foreground con el fallback `notebook` funcional.
- Revisar manualmente cada arena en modo normal y movimiento reducido. Aplicar solo correcciones per-arena justificadas por la revision, por ejemplo reducir alpha, desplazar una prop fuera de la banda de combate, o ajustar un color de fondo/foreground que reduzca contraste de luchador o HUD.
- Mantener las arenas cosmeticas: no se alteran daño, velocidad, colisiones, IA ni reglas de ronda. No se agregan props nuevas salvo que reemplazar una existente sea la correccion minima de legibilidad.

### 2. Contrato de integracion estatica para `#68`

- Añadir pruebas que lean `src/index.html` como texto y comprueben, sin parser ni dependencia, que existen los IDs que `game.js` requiere, que todos los recursos son locales y que el orden de scripts es exactamente `i18n`, `config`, `audio`, `effects`, `ai`, `fighter_render`, `fighter`, `arena_render`, `hud_render`, `game`.
- Extraer en las pruebas los valores de los `<option>` de arena y compararlos con `Object.keys(ARENAS)`; verificar que para cada arena existe una clave `arena<Nombre>` y `arenaPreview<Nombre>` en ambos idiomas. Mantener nombres de claves actuales mediante un mapa de expectativa de prueba cuando camelCase no coincida con el nombre visible.
- Verificar el contrato de touch controls, overlays, canvas, selectores y botones principales. El test debe fallar con un mensaje que identifique el ID, asset, script u arena ausente.
- No convertir el HTML a componentes, no añadir un parser HTML y no generar el HTML desde configuracion. El contrato protege deliberadamente la arquitectura estatica actual.

### 3. Overlay de depuracion para `#10`

- Agregar un estado efimero `debugOverlayEnabled` inicializado por `URLSearchParams(window.location.search).has('debug')` cuando la API exista. La tecla `` ` `` alterna el overlay solo durante `playing` o `paused`; el evento previene su comportamiento predeterminado y no entra en `keys`.
- Implementar `drawDebugOverlay()` al final de `draw()` y antes de restaurar el contexto. Dibujar con contorno y etiquetas compactas:
  - hurtbox, pushbox y hitbox activo de cada luchador, con colores y leyenda fija;
  - estado, `attackCooldown`, `hitStun`, `comboTimer`, `aiDecisionTimer`, `aiAction`, energia y posicion logica;
  - `gameState`, ticks de simulacion acumulados por segundo y FPS de render calculados solo para diagnostico.
- El FPS y el conteo de simulacion usan contadores de render separados de `lastFrameTimestamp` y no influyen en el acumulador, RNG, fisica o IA. El overlay se omite por completo cuando esta apagado.
- Exponer helpers pequenos para las pruebas, por ejemplo un objeto de datos de debug puro y una funcion de alternancia. No se crean controles de menu, almacenamiento local, telemetria ni una UI de tuning.

### 4. Modo entrenamiento para `#1`

- Agregar `gameMode` con valores `versus` y `training`; el modo por defecto sigue siendo `versus`. El menu incorpora un boton localizado `ENTRENAMIENTO` / `TRAINING` junto al inicio normal.
- Introducir una configuracion local y acotada de entrenamiento:
  - posicion: `mid`, `close`, `corner`;
  - CPU: `idle`, `block`, `normal`;
  - timer: `off` o `on`;
  - acciones de panel: reset de posiciones/estado, rellenar salud y rellenar energia.
- Mostrar durante `playing` y solo en entrenamiento un panel compacto accesible con selects y botones nativos. Debe respetar `touch-action`, viewport bajo y `updateControlsVisibility()`. El panel no se muestra en partidas normales, pausa, menu o game-over.
- Refactorizar solo los puntos necesarios para que `startRound()` reciba o lea el modo y aplique posiciones/configuracion mediante un helper reutilizable. `update()` conserva el mismo paso fijo y llama a `updateRoundTimer()` solo si el timer de entrenamiento esta activo.
- En `Fighter.updateAI()`, resolver `idle` y `block` de entrenamiento antes de la decision de IA normal; `normal` conserva `chooseAIAction()`. No duplicar `Fighter`, ataques, daño, efectos, colisiones ni input.
- En entrenamiento, al llegar a `0%` o vencer el timer, restaurar luchadores y posiciones configuradas sin sumar rondas, registrar estadisticas ni mostrar game-over. La salida hacia menu, pausa y reinicio conserva transiciones existentes.

### 5. Onboarding de primera ejecucion para `#15`

- Crear la clave versionada `glitchDuelOnboardingSeen` con lectura segura de `localStorage`. Ausencia, valor invalido o version anterior significa que la introduccion puede mostrarse; marcar vista solo al finalizar o elegir omitir.
- Agregar un dialog dentro del menu con tres pasos cortos y localizados: movimiento/salto/agacharse, bloqueo/ataques/combos, y energia/especial. Incluir `SIGUIENTE` / `NEXT`, `EMPEZAR` / `START`, e `OMITIR` / `SKIP`.
- El dialog aparece sobre el menu antes de la primera partida y usa botones semanticos, foco visible, scroll vertical y el mismo tratamiento tactil de overlays existente. No hace focus trap ni inert, que siguen siendo `#25`.
- `EMPEZAR` inicia una partida normal despues de guardar la marca; `OMITIR` cierra el dialog y deja el menu utilizable; los usuarios recurrentes ven directamente el menu. No se agrega un boton de repetir onboarding en este item.

### 6. Partidas deterministas para `#6`

- Crear en `src/config.js` un RNG pseudoaleatorio pequeno y sin dependencia que acepte una semilla `uint32`, y dos accesos separados: uno para simulacion y otro cosmetico. La simulacion determinista no debe consumir valores desde draw/FPS/shake.
- Sustituir usos de `Math.random()` que influyen en AI, tiempos de decision, textos de golpe, particulas y otros eventos de simulacion por el acceso correspondiente. Mantener el shake de render en una fuente visual aislada para que el ritmo de dibujado no altere combate.
- Parsear de forma segura `?seed=<entero uint32>` al comenzar una partida y conservar el valor como `matchSeed`. Sin parametro, generar un seed inicial una sola vez desde `Math.random()` y usarlo durante la partida para que una ejecucion concreta tenga una fuente consistente, sin prometer reproducibilidad entre sesiones sin URL.
- Añadir un helper de escenario para pruebas que fija seed, dificultad, arena, estilo, posiciones, salud, energia, timer y una secuencia de inputs por ticks. No exponer una pantalla de escenarios al jugador; la proxima mejora `#33` consumira esta base para grabar/reproducir input.
- Incluir la seed activa en el overlay de debug de `#10`, solo cuando este habilitado, para que un fallo pueda reproducirse con `?seed=<valor>`.

## Archivos A Modificar

- `src/arena_render.js`: ajustar solo propiedades visuales de arenas que fallen la auditoria y, si simplifica las pruebas, exponer limites de foreground seguros como datos compactos.
- `src/config.js`: constantes de zonas legibles si hacen falta, configuracion de entrenamiento minima y RNG sembrado.
- `src/game.js`: contrato de debug, modo entrenamiento, onboarding, parseo de seed, ciclo de entrenamiento y separacion de RNG de simulacion/visual.
- `src/fighter.js`: soportar comportamientos de CPU de entrenamiento y sustituir aleatoriedad de simulacion por la fuente inyectada.
- `src/effects.js`: usar fuente cosmetica/injectada donde corresponda sin afectar la simulacion.
- `src/hud_render.js`: dibujar overlay de depuracion si se decide que sus datos HUD quedan mejor junto al canvas; no redisenar el HUD normal.
- `src/index.html`: boton de entrenamiento, panel de entrenamiento y dialog de onboarding con IDs estables y botones semanticos.
- `src/styles.css`: layout acotado para paneles de entrenamiento/onboarding/debug, foco y viewport movil sin cambiar la identidad visual.
- `src/i18n.js`: textos ES/EN para entrenamiento, onboarding, debug y etiquetas asociadas.
- `tests/game.test.js`: contratos estaticos, auditoria de foreground, overlay, entrenamiento, onboarding, RNG y escenarios deterministas.
- `Readme.md`: matriz de arenas, modo entrenamiento, onboarding, semilla de debug y smoke tests nuevos.
- `AGENTS.md`: ampliar el smoke test y runtime notes para entrenamiento, onboarding, debug y seed si quedan como flujos persistentes.
- `BACKLOG.md`: cerrar cada item solo tras su entregable, eliminar dependencias satisfechas y promover el siguiente item real.
- `plans/plan_0033_observabilidad_entrenamiento_reproducibilidad.md`: registrar resultados y estado de cada fase.

## Plan De Implementacion

1. Establecer pruebas de referencia para las ocho arenas y realizar la matriz manual de `#37` antes de tocar colores o props.
   Verificar: cada arena conserva HUD legible, luchadores distinguibles, props fuera de la zona critica o con alpha suficiente, corners utilizables y movimiento reducido sin animacion innecesaria.

2. Aplicar solo las correcciones visuales detectadas y documentar los resultados de lectura por arena.
   Verificar: no cambian coordenadas de combate, ataques, IA ni rendimiento intencional; las pruebas de render existentes siguen pasando.

3. Agregar el contrato estatico de `#68` en `tests/game.test.js` para HTML, recursos locales, IDs, orden de scripts, selectores, config e i18n de arenas.
   Verificar: eliminar temporalmente un ID, alterar el orden de un script o desalinear una arena hace fallar el test con diagnostico concreto; restaurar deja la suite verde.

4. Crear los datos puros y el dibujo opt-in del overlay `#10`, seguido por activacion URL/tecla y medicion separada de FPS/ticks.
   Verificar: apagado no modifica draw ni simulacion; encendido muestra cajas, estado, timers, accion IA, seed cuando exista y metricas sin cambiar fisica; las pruebas validan toggle y llamadas canvas esperadas.

5. Introducir `gameMode`, configuracion de entrenamiento y helpers de reset/posicion antes de crear el panel visual.
   Verificar: `versus` conserva rondas, score, timer y game-over actuales; entrenamiento aplica presets sin duplicar luchadores y restablece un KO o fin de timer sin estadisticas.

6. Agregar el panel localizado de entrenamiento y conectar sus controles a la configuracion ya probada.
   Verificar: reset, posicion, CPU idle/block/normal, timer, salud y energia funcionan con teclado/touch; el panel desaparece fuera de entrenamiento y no tapa canvas/HUD en movil landscape.

7. Agregar almacenamiento seguro y el dialog localizado de onboarding de `#15`.
   Verificar: primer arranque muestra los tres pasos; siguiente, empezar y omitir persisten la marca; una recarga no vuelve a mostrarlo; el flujo normal no cambia para usuarios existentes.

8. Crear RNG sembrado separado por dominio y reemplazar usos de aleatoriedad de simulacion para `#6`.
   Verificar: dos escenarios con misma seed, estado inicial e inputs producen snapshots identicos tras N ticks; una seed distinta puede divergir; draws adicionales no cambian el snapshot de simulacion.

9. Implementar helper de escenario fijo y mostrar seed solo en debug; cubrir recuperacion de query invalida y ausencia de URL API.
   Verificar: `?seed=0`, maximo `uint32`, valores invalidos y falta de parametro tienen fallback seguro; un escenario reproduce AI, daño, posiciones, cooldowns, timers y resultado de ronda.

10. Actualizar documentacion y backlog por entregable, ejecutar validacion completa y hacer smoke test final en escritorio y movil.
    Verificar: no se marca un item completado sin sus criterios; `#26`, `#36`, `#33` y `#9` permanecen pendientes con sus dependencias actualizadas; la secuencia recomendada apunta al siguiente item real.

## Pruebas Y Validacion

Validacion automatica despues de cada fase:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
```

Pruebas unitarias nuevas o ajustadas:

- Las ocho arenas tienen config, selector, i18n ES/EN, background y foreground; sus props no invaden la banda definida de HUD o la zona central segura sin una excepcion documentada.
- El contrato HTML detecta IDs requeridos, assets no locales, orden incorrecto de scripts y desalineacion de inventario de arenas.
- El overlay de debug se activa por URL/tecla, produce datos de ambos luchadores y no altera el resultado de una simulacion con la misma seed.
- Entrenamiento aplica presets, CPU idle/block/normal, timer opcional, restauracion de KO/time y acciones de salud/energia; versus conserva su flujo de rondas y estadisticas.
- Onboarding persiste una vez, omite correctamente, localiza ES/EN y no reaparece para usuarios marcados.
- Mismo escenario + misma seed + mismos inputs => snapshot identico; diferente seed puede diferir; render adicional no consume RNG de simulacion.
- Seeds invalidas, mayores que `uint32`, negativas, texto y APIs de URL ausentes no rompen inicio y caen en una fuente segura.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: documentar auditoria de arenas, activacion de debug, entrenamiento, onboarding y uso de `?seed=` exclusivamente para reproducir partidas de desarrollo.
- `AGENTS.md`: registrar smoke tests de arenas, debug, entrenamiento, onboarding y seed si su comportamiento debe preservarse en sesiones futuras.
- `BACKLOG.md`: mover `#37`, `#68`, `#10`, `#1`, `#15` y `#6` a completados solo al pasar sus fases; actualizar dependencias de `#26`, `#36`, `#42`, `#43`, `#44`, `#33`, `#9`, `#24`, `#47` y otros afectados.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: una auditoria visual se convierta en rediseño de ocho arenas. Mitigacion: registrar hallazgos por arena y modificar solo contraste, alpha o coordenadas que fallen un criterio observable.
- Riesgo: pruebas estaticas fragiles bloqueen cambios HTML legitimos. Mitigacion: comprobar un contrato pequeno y estable de IDs/script order/inventario, con mensajes de fallo especificos; actualizarlo solo si cambia intencionalmente el contrato.
- Riesgo: el overlay consume tiempo o cambia aleatoriedad de combate. Mitigacion: dejarlo opt-in, separar sus contadores del loop y no llamar RNG de simulacion desde draw/debug.
- Riesgo: entrenamiento duplica el flujo de combate o altera partidas normales. Mitigacion: un unico `update()`/`Fighter`/sistema de ataques; limitar las diferencias a configuracion, comportamiento CPU y resolucion de KO/timer segun `gameMode`.
- Riesgo: el panel de entrenamiento interfiera con touch controls. Mitigacion: hacerlo compacto, visible solo en entrenamiento, probar landscape/portrait y no cubrir HUD/canvas critico.
- Riesgo: onboarding se vuelva molesto o reaparezca por datos corruptos. Mitigacion: una marca versionada, omision inmediata, guardado solo al decidir y fallback seguro de lectura.
- Riesgo: reemplazar todos los `Math.random()` rompe feedback o acopla render con simulacion. Mitigacion: inventariar cada uso, crear fuentes separadas de simulacion/cosmetica/render y probar que draws extras no cambian snapshots.
- Riesgo: una seed URL se interprete de forma insegura o se vuelva una API de usuario sin soporte. Mitigacion: validar estrictamente `uint32`, tratarla como herramienta de desarrollo documentada y no persistirla ni crear UI de compartir.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

- El programa respeta el orden del backlog y divide seis items en entregables comprobables, en vez de proponer un refactor grande.
- La auditoria de arenas es guiada por evidencia y no presupone cambios cosmeticos.
- El contrato HTML evita dependencias o generacion de markup; protege la arquitectura estatica actual con pruebas directas.
- El modo entrenamiento reutiliza el motor actual y limita configuracion/CPU a lo pedido, sin añadir trials, progreso ni controles remapeables.
- Onboarding y seed tienen alcance minimo, persistencia/versionado seguro y criterios observables.
- La separacion de RNG evita que render o debug contaminen reproducibilidad de simulacion, sin introducir una arquitectura de replay antes de `#33`.
- No se agregan dependencias, build step, framework, telemetria ni sistemas de IA nuevos.

## Criterios De Aceptacion

- Las ocho arenas pasan una matriz documentada de contraste, HUD, esquinas, foreground y movimiento reducido; cualquier correccion es visual y localizada.
- Un test estatico protege IDs, recursos locales, orden de scripts y el inventario de arenas entre HTML, config e i18n.
- `?debug=1` y `` ` `` habilitan un overlay que muestra cajas, estados, cooldowns, IA, FPS/ticks y seed sin alterar combate cuando esta apagado.
- Entrenamiento permite reset, posiciones, timer opcional, salud, energia y CPU idle/block/normal sin duplicar simulacion ni afectar rondas/estadisticas de versus.
- El onboarding localizado se muestra solo en primera ejecucion, cubre movimiento, defensa, ataques, combos y especial, y permite omitirlo.
- Un escenario fijo con misma seed, estado e inputs reproduce el mismo snapshot de combate; render adicional y FPS no cambian la secuencia de simulacion.
- Seeds invalidas y APIs web no disponibles usan fallback seguro.
- README, AGENTS, BACKLOG y este plan reflejan cada entrega terminada; los items bloqueados se actualizan sin cerrar trabajo fuera de alcance.
- La sintaxis de todos los `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan antes de cada commit.

## Commit Y Push

- Un commit por item terminado, despues de su validacion:
  - `Improve arena readability`
  - `Add static HTML integration contract`
  - `Add combat debug overlay`
  - `Add training mode`
  - `Add first-run onboarding`
  - `Add deterministic match scenarios`
- No mezclar correcciones de contraste, contrato, herramientas de debug, entrenamiento, onboarding y RNG en el mismo commit.
- Hacer push despues de cada commit solo si el usuario lo solicita expresamente.

## Estado De Implementacion

Implementado localmente el 2026-07-31.

- Completado: contrato estatico para IDs, recursos locales, script order e inventario de arenas; las ocho arenas conservan sus capas de foreground perifericas y reduccion de movimiento.
- Completado: overlay opt-in por `?debug=1` o backtick con cajas, estado, timers, IA y seed.
- Completado: entrenamiento reutiliza luchadores y simulacion con posicion, CPU, timer, reset, vida y energia.
- Completado: onboarding localizado de tres pasos con inicio y omision persistente.
- Completado: RNG sembrado por `?seed=<uint32>` separa simulacion de feedback/render cosmetico.

Plan cerrado el 2026-07-31 con validacion automatizada completa por solicitud del usuario.

La validacion humana residual de arenas, Training, onboarding y percepcion visual se transfirio exclusivamente al plan `0043`.
