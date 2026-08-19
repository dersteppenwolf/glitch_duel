# Exec Plan: rivales con identidad visual

## Objetivo

Agregar un roster pequeño de rivales CPU visualmente reconocibles para que cada combate comunique un oponente concreto, no solo una dificultad genérica.

El jugador podrá elegir un rival desde el menú. El rival seleccionado conservará nombre, badge, paleta secundaria, rasgos de cabeza/cuerpo y frase de presentación durante la introducción `VS`, el HUD y el resultado. La dificultad seguirá siendo el único factor que modifica comportamiento y reglas de IA.

Quedan fuera de alcance añadir tácticas, stats, ataques, progresión, desbloqueos, bosses con reglas especiales, ladder arcade, selección aleatoria, persistencia del rival, voces, assets externos, nuevas teclas o cambios de balance. La personalidad de IA seleccionable sigue siendo el item `#23`, y las tácticas contextuales siguen siendo `#16`.

## Contexto Actual

- `src/fighter.js` crea la CPU con identidad genérica: `label = 'CPU'`, `labelKey = 'cpu'`, acento rojo y `visualRole = 'cpu'`. La IA depende exclusivamente de `selectedDifficulty` y `DIFFICULTIES`.
- `src/fighter_render.js` ya separa `drawFighterIdentityMarker()` y `drawFighterFaceAndDetail()`. El CPU cambia visor, antenas y detalle facial según `getCpuVisualMode()`, que lee la dificultad. Esto corresponde al item completado `#56 Difficulty personality visuals`.
- `src/game.js` conserva selección de dificultad, arena y estilo; `startRound()` instancia `player2`, aplica estilo balanceado y muestra el intro con `getDifficultyLabel()` y `getArenaLabel()`. El HUD muestra la etiqueta localizada `CPU (IA)`.
- `src/index.html` contiene los selectores de idioma, dificultad, arena y estilo. El contrato estático de `tests/game.test.js` valida IDs principales y coherencia de arenas, por lo que un selector nuevo debe añadirse de forma deliberada a esa prueba.
- `src/i18n.js` centraliza ES/EN. `Readme.md`, `AGENTS.md` y `BACKLOG.md` se actualizan cuando un flujo o backlog cambia.
- El modo entrenamiento reutiliza `player2`; sus modos `idle`, `block` y `normal` son comportamiento temporal y no deben ser reemplazados por el rival visual.

Suposiciones explícitas:

- La primera entrega ofrece cuatro rivales fijos y no un rival aleatorio: `NULL_POINTER`, `LAG_SPIKE`, `MERGE_CONFLICT` y `BOSS_500`.
- La selección por defecto es `NULL_POINTER`, manteniendo un oponente estable y evitando introducir RNG o persistencia en un cambio visual.
- Cada rival usa Canvas y CSS existentes, sin imágenes, fuentes, audio ni dependencias externas.
- La dificultad continúa definiendo las variaciones visuales ya existentes de capacidad CPU. La identidad de rival se dibuja encima o junto a esos detalles, sin deshabilitarlos.

## Diseño Propuesto

### Datos de rival

Agregar `CPU_RIVALS` en `src/config.js`, con una estructura pequeña por clave:

```js
{
    nullPointer: {
        labelKey: 'rivalNullPointer',
        introKey: 'rivalNullPointerIntro',
        accentColor: '#7c3aed',
        detail: 'pointer'
    }
}
```

- Las cuatro claves son internas, estables y validadas contra `CPU_RIVALS`.
- `labelKey` e `introKey` se resuelven mediante `t(...)`; los colores y `detail` no dependen del idioma.
- No incluir multiplicadores de daño, velocidad, energía, salud ni probabilidades IA en este objeto.

### Selección y ciclo de vida

- Agregar `selectedRival = 'nullPointer'` y `setRival(value)` en `src/game.js`, con fallback seguro al rival por defecto.
- Insertar `#rival-select` en los ajustes de menú, con una opción por entrada de `CPU_RIVALS`. No se guarda en `localStorage` durante este item.
- En `startRound()`, después de crear `player2`, llamar `player2.applyRival(selectedRival)`. Ese método actualiza sólo `rivalKey`, `labelKey`, `label`, `accentColor` y `rivalDetail`; nunca toca propiedades de estilo/combate ni `trainingBehavior`.
- El mismo rival se mantiene entre rondas de una partida, reinicio y entrenamiento iniciado desde el menú hasta que el selector cambie. `showMainMenu()` no debe resetear la selección.

### Render y comunicación

- Reutilizar `drawFighterIdentityMarker()` para mostrar el badge `AI` y debajo el nombre localizado del rival, ajustando el ancho del badge con una caja de texto compacta para no recortar `MERGE_CONFLICT` ni traducciones.
- Extender `drawFighterFaceAndDetail()` con cuatro rasgos ligeros, aplicados sólo a CPU según `rivalDetail`:
  - `pointer`: monocle/cursor angular violeta.
  - `lag`: visor segmentado cian con dos marcas desplazadas.
  - `merge`: dos antenas cruzadas y una banda ámbar.
  - `boss`: visor ancho rojo, dos nodos y contorno de advertencia.
- Conservar los detalles por dificultad actuales como capa secundaria: el rival comunica identidad y la dificultad comunica intensidad. Ninguna variante debe ocultar cabeza, estado de bloqueo, indicador de especial, hit feedback ni hitboxes.
- Actualizar `drawVsIntro()` para mostrar `P1 VS <RIVAL>` y una frase corta localizada debajo de dificultad/arena. Reducir tipografía o usar `fit` sencillo basado en longitud para que nombres largos no salgan del panel lógico `1000x500`.
- Actualizar `drawHealthBars()` para usar `player2.labelKey` en vez de `cpuAI`, conservando el porcentaje y el color de acento del rival. El resultado final puede reutilizar el nombre de rival en vez de una nueva pantalla o medalla.

### Compatibilidad

- `getCpuVisualMode()` sigue leyendo dificultad y no se renombra innecesariamente.
- Debug overlay continúa mostrando `aiAction`, cooldowns y seed. Puede añadir `rivalKey` como texto si cabe, sin cambiar su modelo de datos de combate.
- Entrenamiento con CPU `idle` o `block` conserva esa conducta tras aplicar el rival; `normal` vuelve a la IA de dificultad actual.
- Los textos de accesibilidad del selector y sus opciones se localizan en ES/EN. El selector conserva foco visible y layout responsive de los settings existentes.

## Archivos A Modificar

- `src/config.js`: definir `CPU_RIVALS` sin propiedades de balance.
- `src/fighter.js`: añadir `applyRival()` y campos visuales mínimos de CPU.
- `src/fighter_render.js`: dibujar badge/nombre y rasgos de rival sobre las variaciones de dificultad existentes.
- `src/hud_render.js`: presentar nombre/acento del rival en HUD e intro `VS`.
- `src/game.js`: mantener selección validada, aplicarla por ronda y conectar el selector del menú.
- `src/index.html`: agregar selector semántico `#rival-select` y opciones de roster.
- `src/styles.css`: ajustar la cuadrícula de settings y badge/nombre de rival si hace falta en desktop/móvil.
- `src/i18n.js`: etiquetas ES/EN del selector, nombres y frases de los cuatro rivales.
- `tests/game.test.js`: cubrir fallback, aplicación sin cambios de combate, HUD/intro, render de cada rasgo y contrato HTML/i18n/config.
- `Readme.md`: documentar roster y aclarar que rival visual y dificultad son independientes.
- `AGENTS.md`: añadir la comprobación de selector/intro de rival al smoke test si el flujo se vuelve estable.
- `BACKLOG.md`: añadir un item trazable de roster visual de rivales y moverlo a completados sólo tras validar la entrega; no modificar `#16`, `#23` ni `#56`.
- `plans/plan_0034_rivales_identidad_visual.md`: mantener estado y resultados de ejecución.

## Plan De Implementación

1. Definir pruebas que expresen el contrato de rival antes del render.
   Verificar: las cuatro claves config/i18n/HTML coinciden, una clave inválida cae en `nullPointer`, y el rival no altera daño, velocidad, energía, vida, dificultad ni modos de entrenamiento.

2. Agregar `CPU_RIVALS`, `selectedRival`, `setRival()` y `Fighter.applyRival()`.
   Verificar: comenzar partida, siguiente ronda, reinicio y entrenamiento aplican el rival seleccionado; un CPU `idle`/`block` mantiene su comportamiento.

3. Agregar el selector localizado al menú y conectarlo a `setRival()`.
   Verificar: todas las opciones son accesibles mediante teclado, se adaptan a la cuadrícula actual en móvil, y una opción inválida recupera el fallback visual sin error.

4. Actualizar badge, HUD e introducción VS con nombre, color y frase de rival.
   Verificar: los nombres largos caben en el canvas lógico; cambiar idioma actualiza nombre/frase; HUD, intro, pausa y resultado no muestran `CPU` genérico cuando hay rival.

5. Implementar los cuatro rasgos Canvas como detalles compactos superpuestos a la cabeza CPU actual.
   Verificar: cada rival produce primitivas distinguibles; dificultad easy/normal/hard aún cambia visor/antenas; bloqueo, crouch, aire, especial, victoria y derrota siguen renderizando correctamente.

6. Actualizar documentación, backlog y plan con resultados reales.
   Verificar: README distingue rival visual de dificultad/IA; el backlog no cierra ni reabre `#16`, `#23` o `#56` indebidamente.

7. Ejecutar validación completa y smoke test de escritorio/móvil.
   Verificar: sintaxis, suite, `git diff --check` y comprobaciones manuales pasan antes de commit.

## Pruebas Y Validación

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
```

Pruebas unitarias nuevas o ajustadas:

- `CPU_RIVALS` contiene las cuatro claves esperadas con color, detalle y claves de texto válidas en ES/EN.
- `setRival()` y `applyRival()` aceptan claves válidas y aplican fallback seguro a `nullPointer`.
- Aplicar un rival no cambia `health`, `energy`, `moveSpeedModifier`, `damageModifier`, `energyModifier`, dificultad ni acciones AI.
- Los modos de entrenamiento `idle`, `block` y `normal` siguen funcionando con cada rival.
- El contrato HTML valida `#rival-select` y sus options contra `CPU_RIVALS`; la prueba estática detecta una opción o clave localizada ausente.
- HUD/VS usan el nombre localizado del rival y la introducción contiene una frase localizada.
- El render invoca primitivas para cada detalle y conserva los rasgos de dificultad CPU existentes.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentación

- `Readme.md`: roster de cuatro rivales y separación explícita entre identidad visual y dificultad de IA.
- `AGENTS.md`: añadir selector/intro de rival al smoke test si se implementa.
- `BACKLOG.md`: añadir y cerrar el item de roster visual sólo tras implementación comprobada; preservar las dependencias de tácticas y personalidades IA.
- `PLANS.md`: sin cambios.

## Riesgos Y Mitigaciones

- Riesgo: los rivales se perciben como dificultad o balance distinto. Mitigación: no incluir tuning en `CPU_RIVALS`, mostrar dificultad separada en intro/HUD y documentar la independencia.
- Riesgo: nombres largos desbordan badge, HUD o intro. Mitigación: usar claves cortas en HUD, badge con ancho ajustado y prueba para el rival con nombre más largo.
- Riesgo: los nuevos detalles ocultan señales de combate. Mitigación: limitar dibujos a cabeza/badge y probar estados de bloqueo, especial, aire, hit y post-ronda.
- Riesgo: seleccionar rival rompe el CPU de entrenamiento. Mitigación: `applyRival()` no toca `trainingBehavior`; pruebas cruzan rival con idle/block/normal.
- Riesgo: incorporar tácticas por rival amplía demasiado el cambio. Mitigación: bloquear explícitamente todo parámetro AI/combate en datos de rival y dejar `#16`/`#23` intactos.
- Riesgo: añadir persistencia crea preferencias sin controles de reset. Mitigación: no persistir selección en esta entrega.

## Validación Del Plan Con Skill

Se cargó `karpathy-guidelines` antes de finalizar este plan.

- El alcance es visual y de comunicación: se reutilizan CPU, dificultad, IA, render Canvas y controles existentes.
- No se crea una arquitectura de personajes, FSM, sistema de desbloqueos, progreso ni perfiles tácticos.
- La selección es determinista, limitada a cuatro entradas y no se persiste, reduciendo estado y casos de migración.
- Las suposiciones de independencia entre rival/dificultad y entrenamiento quedan explícitas y son comprobables con pruebas.
- Cada fase tiene una verificación concreta; no se introducen dependencias externas.

## Criterios De Aceptación

- El menú permite elegir cuatro rivales CPU visuales y un valor inválido usa un fallback seguro.
- Cada rival tiene nombre, frase de VS, badge, color y rasgo de Canvas distinguible en ES/EN.
- Dificultad e identidad visual son independientes: el rival no modifica comportamiento, stats, ataques ni balance.
- HUD e intro muestran el rival sin desbordar el canvas ni ocultar información de combate.
- Entrenamiento mantiene sus modos CPU y reset con todos los rivales.
- Las variaciones de dificultad CPU existentes siguen visibles y compatibles con los detalles de rival.
- Las pruebas de contrato, aplicación, localización, render y entrenamiento pasan junto con la suite completa.
- README, AGENTS, BACKLOG y este plan reflejan la entrega sin cerrar los items de tácticas/personas IA.

## Commit Y Push

- Commit sugerido: `Add visual CPU rival roster`.
- Ejecutar validación completa antes del commit.
- No hacer push salvo solicitud expresa del usuario.

## Estado De Implementación

Implementado localmente el 2026-07-31.

- Completado: `CPU_RIVALS` define `NULL POINTER`, `LAG SPIKE`, `MERGE CONFLICT` y `BOSS 500` sin parámetros de combate.
- Completado: selector localizado aplica rival por ronda, reinicio y entrenamiento con fallback seguro a `nullPointer`.
- Completado: badge, HUD, intro VS y detalles Canvas comunican nombre, color y frase del rival junto a las variaciones existentes por dificultad.
- Completado: las pruebas verifican contrato HTML/i18n/config, fallback, invariantes de combate y render de detalles.
- Completado: `Readme.md`, `AGENTS.md` y `BACKLOG.md` documentan el roster sin modificar los items de tácticas o personalidades IA.

Plan cerrado el 2026-07-31 con validación automatizada completa por solicitud del usuario.

La validacion humana residual de los cuatro rivales, dispositivos y estados se transfirio exclusivamente al plan `0043`.
