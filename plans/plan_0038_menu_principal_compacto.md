# Exec Plan: menu principal compacto

## Objetivo

Compactar el menu principal de `GLITCH DUEL` para que conserve toda su informacion y acciones, pero reduzca su altura visual, mejore la jerarquia y aproveche mejor el espacio horizontal en escritorio y tablet.

La experiencia del jugador cambia de forma observable:

- En escritorio, el panel completo ocupa como objetivo entre 600 y 640 px de alto a `1366x768`, sin scroll interno y sin perder legibilidad.
- El preview de arena es mas bajo y los resúmenes de estilo/rival aparecen en paralelo.
- `ENTRENAMIENTO`, `AYUDA` y `CONTROLES` comparten una sola fila cuando el ancho lo permite.
- El resumen de teclas y GitHub forman un unico pie compacto.
- En pantallas estrechas, el contenido se reorganiza progresivamente sin reducir controles por debajo de un tamaño usable.

Queda fuera del alcance cambiar textos, traducciones, datos de estadisticas, selectores, persistencia, foco modal, logica de `gameState`, gameplay, HUD del combate, controles tactiles, assets, fuente o dependencias. Tampoco se reescribe el CSS legado ni se modifica el espacio logico Canvas `1000x500`.

## Contexto Actual

- `src/index.html` ya organiza `#main-menu` con cabecera, titulo, configuracion, preview, estadisticas, CTA y acciones secundarias. Los IDs funcionales y el orden DOM actual son usados por `src/game.js` y `tests/game.test.js`.
- `src/styles.css` contiene la base historica y, desde la linea de reglas del rediseño actual, overrides especificos bajo `#main-menu`. La tarjeta usa hasta 920 px de ancho, `24px 28px` de padding y scroll como fallback.
- `.menu-layout` ya usa dos columnas en escritorio. El bloque de configuracion usa una reticula `2x2`, pero el preview de arena tiene 104 px de alto y `.selection-summary` apila estilo y rival.
- `.menu-actions--secondary` usa dos columnas y hace que `CONTROLES` ocupe una segunda fila completa.
- `#controls-summary` y `.github-link` son hermanos separados, por lo que consumen dos bandas verticales.
- A `max-width: 760px`, el menu se apila y los cuatro selectores pasan inmediatamente a una sola columna. Esto es seguro, pero desperdicia ancho en tablets y telefonos anchos.
- `renderStats()` en `src/game.js` actualiza `#stats-summary` como una cadena localizada con victorias, derrotas, racha actual y mejor racha. La cinta ya cabe en una linea en escritorio y no necesita una nueva estructura para cumplir el objetivo.
- El plan `0035` implemento la estructura, zoom y accesibilidad modal actuales. El plan `0036` esta pendiente y cubre foco visual, HUD y sincronizacion de `<details>`; este plan no debe duplicar ni bloquear ese trabajo.
- `tests/game.test.js` protege IDs, orden de scripts, inventario de opciones, foco modal y comportamiento de previews. No existe un sistema de snapshots visuales y no se agregara uno para este ajuste.
- `Readme.md` y `AGENTS.md` describen el menu responsive, zoom al 200% y smoke tests de pantallas bajas.

Suposiciones explicitas:

- La captura compartida representa el problema objetivo: el menu es legible, pero ocupa casi toda la altura por acumulacion de filas.
- La compactacion se obtiene reorganizando contenido y espaciado, no reduciendo de forma general la tipografia.
- Se conservan las cuatro estadisticas actuales. El esquema visual sugerido de tres bloques no justifica ocultar la racha actual ni cambiar `renderStats()`.
- Los tres botones secundarios caben en una fila desde aproximadamente 620 px de ancho util; por debajo de ese punto pueden volver a `2 + 1` y despues a una columna.
- Estilo y rival pueden compartir fila mientras cada tarjeta tenga al menos unos 150 px; en anchos menores se vuelven a apilar.
- El menu puede seguir usando scroll interno en viewports bajos y a zoom alto; el criterio es que no haya scroll innecesario a `1366x768`, no eliminar el fallback.
- Si el plan `0036` se implementa antes, sus reglas de foco visible y sincronizacion de `<details>` se preservan y este trabajo se limita al layout.

## Diseño Propuesto

### 1. Tarjeta y cabecera mas compactas

- Ajustar solo las reglas especificas de `.main-menu-card`; no limpiar ni reformatear las reglas generales de otros dialogos.
- Usar un ancho maximo cercano a `820px`, con `16-20px` de padding vertical y `20-24px` horizontal. Si las pruebas con valores largos en español requieren mas ancho, priorizar que los `<select>` no recorten texto antes que imponer exactamente 820 px.
- Mantener borde exterior de 6 px y sombra dura, reduciendo la sombra visual a unos 8 px si es necesario para que no aumente el footprint.
- Reducir el margen superior del titulo y fijar su maximo alrededor de `48-52px`; mantener el subtitulo en una sola linea cuando haya espacio y con margen inferior de `10-12px`.
- Mantener kicker e idioma en la misma cabecera. El selector de idioma debe conservar una altura usable y no convertirse en icono ni control oculto.

### 2. Cuerpo en dos columnas equilibradas

- Conservar `.menu-layout` y su orden DOM: configuracion a la izquierda, preview a la derecha.
- Ajustar las columnas a una proporcion cercana a `1fr 0.95fr`, con gap de `12px`, para que ambas zonas terminen con alturas similares.
- Mantener la configuracion en `2x2` y la preferencia de movimiento a todo el ancho.
- Reducir espaciados internos, no el area interactiva: los selects tendran al menos 38 px en desktop y 44 px bajo puntero grueso o layout movil; `Reducir movimiento` mantendra una fila activable de al menos 44 px.
- Jerarquizar bordes: 6 px para la tarjeta, 3 px para contenedores principales y 2 px para campos/tarjetas internas. No eliminar los bordes que sostienen la identidad arcade.

### 3. Preview y resumen de seleccion

- Reducir `.arena-preview-stage` desde 104 px a aproximadamente `76-80px` en escritorio.
- Mantener nombre y descripcion de arena; limitar la descripcion a un bloque corto con `line-height` compacto, sin truncar el texto localizado.
- Cambiar `.selection-summary` a dos columnas iguales para mostrar Estilo y Rival en paralelo.
- Mantener cada tarjeta como una unidad de lectura con etiqueta, nombre y descriptor. Usar `min-width: 0` y wrapping controlado para nombres como `MERGE CONFLICT` y traducciones largas.
- Eliminar `aria-live` de `#arena-preview` y `#selection-summary` para evitar anuncios duplicados al cambiar selects. Asociar `#arena-select`, `#style-select` y `#rival-select` con sus descripciones mediante `aria-describedby` apuntando respectivamente a `#arena-preview-text`, `#style-preview-text` y `#rival-preview-text`. Los selects nativos siguen comunicando el valor elegido y la descripcion queda disponible sin regiones vivas competidoras.

### 4. Estadisticas y acciones

- Conservar `#stats-summary`, su `role="status"`, las cuatro metricas y `renderStats()` sin cambios.
- Reducir la cinta a una altura visual cercana a `32-36px` mediante padding y margen, permitiendo wrap solo en anchos estrechos.
- Mantener `INICIAR JUEGO` como CTA amarillo de ancho completo y al menos 52 px de alto.
- Cambiar `.menu-actions--secondary` a tres columnas iguales en escritorio, con botones de al menos 44 px de alto.
- En un breakpoint intermedio, usar dos columnas con `CONTROLES` a todo el ancho; en el breakpoint estrecho, usar una columna. No cambiar el orden DOM ni el orden de tabulacion: Inicio, Entrenamiento, Ayuda, Controles.

### 5. Pie unificado

- En `src/index.html`, envolver `#controls-summary` y `.github-link` en un contenedor `.menu-footer`.
- En escritorio, usar una fila `minmax(0, 1fr) auto`: atajos alineados a la izquierda y GitHub a la derecha.
- El pie tendra un unico separador superior y gap de `12px`; se eliminan los margenes superiores independientes de sus hijos.
- Mantener GitHub como enlace textual con icono, destino, `rel` y etiqueta accesible actuales. Su area interactiva conservara al menos 44 px aunque el tratamiento visual sea discreto.
- En pantallas estrechas, permitir que el resumen haga wrap y que GitHub pase debajo si no cabe, sin overflow horizontal.

### 6. Responsive y zoom

- Mantener dos columnas del cuerpo por encima de 760 px y una columna por debajo, salvo que una medicion real muestre un punto de quiebre mas seguro.
- Entre aproximadamente 560 y 760 px, conservar los selectores en `2x2`, el resumen Estilo/Rival en dos columnas y las acciones secundarias en `2 + 1` o tres columnas si caben.
- Por debajo de aproximadamente 560 px, apilar selectores y tarjetas de resumen; usar acciones secundarias en una columna o `2 + 1` solo si los textos ES/EN conservan espacio suficiente.
- En viewports de poca altura y zoom al 200%, mantener `max-height`, `overflow: auto`, `touch-action: pan-y` y safe areas existentes.
- No definir una altura fija para la tarjeta. La meta `600-640px` es una medicion de aceptacion para desktop, no una restriccion CSS que pueda cortar contenido.

## Archivos A Modificar

- `src/index.html`: agregar `.menu-footer`, asociar selects con descripciones y retirar regiones vivas duplicadas; conservar IDs, opciones, orden y textos.
- `src/styles.css`: compactar solo el menu principal, poner resumen/acciones en paralelo, unificar el pie y agregar breakpoints progresivos.
- `tests/game.test.js`: ampliar el contrato HTML para proteger el pie, asociaciones accesibles e IDs/orden funcionales; no probar pixeles exactos con regex fragiles.
- `Readme.md`: describir el menu principal compacto y su reorganizacion responsive.
- `AGENTS.md`: concretar el smoke test durable para altura desktop, acciones, descriptores, zoom y viewports estrechos.
- `plans/plan_0038_menu_principal_compacto.md`: registrar resultado, validaciones y desviaciones cuando se implemente.

No se esperan cambios en `src/game.js`, `src/i18n.js`, gameplay, Canvas ni persistencia. Si durante la implementacion aparece una necesidad real en esos archivos, detenerse y actualizar este plan antes de ampliar el alcance.

## Plan De Implementacion

1. Medir el menu actual antes de editar.
   Verificar: registrar `getBoundingClientRect()` de `.main-menu-card`, presencia de scroll interno y wrapping a `1366x768`, `1024x768`, `760x800`, `600x800`, `390x844` y zoom 200%, en español e ingles.

2. Agregar el contenedor de pie y las asociaciones accesibles en `src/index.html`.
   Verificar: se conservan todos los IDs, href/rel de GitHub, opciones y orden de foco; los tres selects de preview tienen `aria-describedby` valido y solo `#stats-summary` conserva la region viva dentro de esta zona del menu.

3. Compactar tarjeta, cabecera y espaciado del cuerpo con reglas acotadas a `#main-menu`.
   Verificar: otros dialogos (`help`, `controls`, onboarding, pausa y game over) no cambian de tamaño ni layout; titulo, subtitulo e idioma siguen legibles en ES/EN.

4. Reducir el preview y poner Estilo/Rival en paralelo.
   Verificar: las ocho arenas, cuatro estilos y cuatro rivales muestran nombre y descripcion completos; ninguna tarjeta desborda y las dos columnas tienen altura equilibrada.

5. Poner las tres acciones secundarias en una fila y unificar el pie.
   Verificar: a `1366x768` y `1024x768`, Inicio domina y las tres acciones quedan en una sola fila; el pie ocupa una sola banda cuando el texto cabe; el orden de Tab no cambia.

6. Implementar los breakpoints progresivos sin alterar la logica de `<details>`.
   Verificar: a 760, 600, 560, 390 px y zoom 200% no hay overflow horizontal; controles y descripciones se apilan antes de quedar ilegibles; el scroll vertical sigue disponible.

7. Ajustar el contrato HTML y ejecutar regresiones automatizadas.
   Verificar: las pruebas protegen la nueva estructura semantica sin fijar dimensiones visuales; menu, i18n, previews, foco, selects y acciones existentes siguen pasando.

8. Actualizar documentacion y registrar resultados en el plan.
   Verificar: README y AGENTS describen solo el comportamiento entregado; el plan anota dimensiones reales, viewports probados y cualquier desviacion de los rangos propuestos.

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

Pruebas unitarias/estaticas nuevas o ajustadas:

- El contrato HTML conserva `#main-menu`, `#duel-settings`, los cinco controles de preferencias, preview, resumen, estadisticas y los cuatro botones de accion.
- `.menu-footer` contiene `#controls-summary` y `.github-link` sin duplicarlos.
- `#arena-select`, `#style-select` y `#rival-select` referencian IDs descriptivos existentes mediante `aria-describedby`.
- `#arena-preview` y `#selection-summary` no compiten como regiones `aria-live`; `#stats-summary` mantiene su anuncio localizado.
- El orden DOM de botones sigue siendo Inicio, Entrenamiento, Ayuda y Controles.
- Las pruebas existentes de idioma, preview de arena, preferencias, foco modal, zoom/viewport y acciones siguen pasando.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: actualizar la descripcion UI/UX para indicar preview mas bajo, resumen Estilo/Rival paralelo, fila unica de acciones en desktop y pie compacto responsive.
- `AGENTS.md`: añadir al smoke test que el menu cabe sin scroll a `1366x768`, mantiene las acciones secundarias en una fila cuando hay ancho, se apila sin overflow en movil/zoom y conserva textos ES/EN.
- `PLANS.md`: no requiere cambios.
- `BACKLOG.md`: no requiere cambios; esta mejora no completa un item funcional nuevo.

## Riesgos Y Mitigaciones

- Riesgo: reducir el ancho o padding fuerza wrapping y aumenta la altura. Mitigacion: medir antes/despues, permitir ajustar el ancho dentro del rango propuesto y priorizar valores largos en español.
- Riesgo: `REUNION PRESENCIAL`, `CLASE DE MATEMATICAS` o `MERGE CONFLICT` se recortan. Mitigacion: usar `min-width: 0`, selects al 100%, font-size existente y pruebas con todos los valores antes de reducir mas el ancho.
- Riesgo: tres botones en una fila quedan demasiado estrechos en traducciones largas. Mitigacion: aplicar `2 + 1` antes del breakpoint de apilado y conservar altura minima de 44 px.
- Riesgo: compactar mediante tipografia pequena degrada accesibilidad. Mitigacion: limitar cambios de fuente al titulo y texto decorativo; mantener texto funcional en al menos 12-13 px y controles tactiles usables.
- Riesgo: retirar `aria-live` oculta las descripciones a lectores de pantalla. Mitigacion: enlazar cada select con su descripcion dinamica mediante `aria-describedby` y conservar el valor nativo del control.
- Riesgo: reglas generales cambian otros overlays. Mitigacion: acotar nuevos estilos a `#main-menu`/`.main-menu-card` y revisar todos los dialogos en smoke test.
- Riesgo: el breakpoint nuevo entra en conflicto con la sincronizacion pendiente de `<details>` del plan `0036`. Mitigacion: conservar 760 px como frontera principal del cuerpo o coordinar ambos planes antes de cambiarla; este plan no modifica JavaScript de sincronizacion.
- Riesgo: un objetivo rigido de 640 px corta contenido en configuraciones reales. Mitigacion: usarlo solo como medicion en desktop; conservar altura automatica y scroll como fallback.
- Riesgo: el cache del navegador conserva CSS anterior. Mitigacion: actualizar el query de version de `styles.css` en `src/index.html` al implementar y ajustar el contrato estatico correspondiente.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este plan.

- El alcance se redujo al menu principal y a tres cambios de alto impacto: resumen paralelo, acciones en una fila y pie unificado.
- Se descartaron reestructurar estadisticas, cambiar descriptores, introducir nuevos componentes, snapshots visuales, dependencias o logica JavaScript porque no son necesarios para reducir la altura.
- Los cambios previstos son quirurgicos: estructura HTML minima, CSS acotado, contrato estatico y documentacion.
- Se preservan IDs, textos, i18n, persistencia, orden de foco, `gameState`, Canvas `1000x500` y gameplay.
- Las suposiciones sobre ancho minimo, breakpoints, altura objetivo y relacion con el plan `0036` estan explicitas.
- Cada paso incluye una comprobacion concreta y los criterios visuales usan viewports y medidas observables, no solo apreciaciones subjetivas.
- No se introducen dependencias ni abstracciones nuevas.

## Criterios De Aceptacion

- A `1366x768`, el menu completo cabe sin scroll interno y mide como objetivo entre 600 y 640 px de alto en español e ingles.
- A `1024x768`, configuracion y preview permanecen equilibrados y sin overflow horizontal.
- El preview de arena mide aproximadamente 76-80 px de alto en desktop y conserva nombre/descripcion completos.
- Estilo y Rival aparecen en paralelo cuando cada tarjeta conserva ancho legible; se apilan antes de desbordar.
- Entrenamiento, Ayuda y Controles aparecen en una fila en desktop, mantienen al menos 44 px de alto y conservan su orden de foco.
- Resumen de teclas y GitHub comparten una banda en desktop y se reorganizan sin overflow en movil.
- Idioma, dificultad, arena, estilo, rival, movimiento reducido, stats y acciones mantienen su comportamiento, valores y persistencia actuales.
- Los selects exponen sus descripciones con `aria-describedby` sin regiones vivas duplicadas.
- A `760x800`, `600x800`, `560x800`, `390x844` y zoom 200%, todo el contenido sigue visible o alcanzable por scroll vertical, sin scroll horizontal.
- Ayuda, Controles, onboarding, Pausa, game over, HUD, canvas y controles tactiles no cambian de layout o comportamiento.
- No se modifican `src/game.js`, `src/i18n.js`, reglas de combate, `gameState` ni coordenadas `1000x500` salvo que el plan se actualice primero con una justificacion concreta.
- `node --check` para todo `src/*.js`, `node --test tests\game.test.js` y `git diff --check` pasan.
- `Readme.md`, `AGENTS.md` y el estado de este plan reflejan exactamente lo implementado.

## Commit Y Push

- Commit recomendado: `Compact main menu layout`.
- La mejora debe caber en un unico commit funcional; no mezclarla con el plan `0036` ni con limpieza general de CSS.
- Ejecutar validacion completa antes del commit.
- No hacer commit ni push salvo solicitud expresa del usuario.

## Estado De Implementacion

Implementado localmente el 2026-08-17.

- Completado: menu principal de ancho maximo `820px`, padding vertical reducido y sombra compacta sin alterar los otros overlays.
- Completado: preview de arena reducido, resumen de Estilo/Rival en paralelo y wrapping seguro para nombres/descripciones largos.
- Completado: acciones Entrenamiento/Ayuda/Controles en una fila cuando el ancho lo permite, con fallback `2 + 1` y columna unica en pantallas estrechas.
- Completado: resumen de controles y GitHub agrupados en `#menu-footer`, con layout horizontal desktop y apilado responsive.
- Completado: `aria-describedby` para las descripciones dinamicas de Arena, Estilo y Rival; se retiraron regiones `aria-live` duplicadas del preview.
- Completado: contrato HTML, README y smoke test durable actualizados; no hubo cambios en `src/game.js`, `src/i18n.js`, gameplay, persistencia ni Canvas.

Validacion local ejecutada:

- `node --check` para todos los archivos `src\*.js`: correcto.
- `node --test tests\game.test.js`: 93 pruebas superadas.
- `git diff --check`: correcto; solo se reportaron advertencias de normalizacion LF/CRLF de Git.
- Smoke Chrome headless con onboarding omitido:
  - `1366x768`: tarjeta `820x639.8px`, sin scroll interno ni overflow horizontal; acciones secundarias en tres columnas.
  - `1024x768`: tarjeta `820x639.8px`, dos columnas y acciones secundarias en una fila.
  - `760x800`: layout responsive, scroll vertical disponible, sin overflow horizontal.
  - `600x800` y `560x800`: fallback `2 + 1` para acciones y resumen de seleccion aun legible, sin overflow horizontal.
  - `390x844`: selectores, resumen, acciones y pie apilados con scroll vertical, sin overflow horizontal.
  - Viewport equivalente a zoom 200% (`683x768` CSS): contenido alcanzable por scroll vertical, sin overflow horizontal.
- Smoke visual Chrome: captura desktop limpia revisada; se conservaron CTA amarillo, bordes arcade, foco visible, textos ES/EN y GitHub.

Plan cerrado. El zoom interactivo y la revision humana responsive se transfirieron exclusivamente al plan `0043`.
