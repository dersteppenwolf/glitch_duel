# Exec Plan: menu de inicio con divulgacion progresiva

## Objetivo

Reducir la carga visual y cognitiva del menu principal de `GLITCH DUEL` para que la primera decision sea jugar, sin eliminar configuracion, modos ni utilidades existentes.

La experiencia esperada cambia de forma observable:

- `JUGAR AHORA / PLAY NOW` es la unica accion primaria y conserva el flujo Versus actual.
- Dificultad, arena, estilo y rival se resumen en una sola linea visible.
- La personalizacion completa queda en un `<details>` cerrado inicialmente.
- `CARRERA ARCADE / ARCADE RUN` y `ENTRENAMIENTO / TRAINING` se presentan como modos secundarios, separados de Ayuda y Controles.
- Idioma, movimiento reducido, Ayuda, Controles, estadisticas, resumen de teclas y GitHub quedan bajo una segunda divulgacion nativa claramente rotulada.
- El menu conserva toda su funcionalidad, pero muestra muchos menos controles al abrirse.

Queda fuera del alcance:

- Agregar persistencia para dificultad, arena, estilo o rival. El item `#21` de `BACKLOG.md` permanece independiente.
- Crear modales o pantallas nuevas para Personalizar, Ajustes, Estadisticas o Acerca de.
- Fusionar las pantallas actuales de Ayuda y Controles.
- Agregar Apply/Cancel a la configuracion; los selects siguen aplicando cambios inmediatamente.
- Cambiar onboarding, modos, reglas de combate, IA, controles, audio, HUD, Canvas o coordenadas logicas `1000x500`.
- Introducir dependencias, componentes, animaciones de acordeon o persistencia del estado abierto/cerrado.

## Contexto Actual

- `src/index.html:41-159` contiene todo el menu dentro de `#main-menu`. El idioma esta en la cabecera; `#duel-settings` inicia abierto; el preview ocupa una segunda columna; estadisticas, CTA, cuatro acciones secundarias, resumen de teclas y GitHub permanecen visibles simultaneamente.
- `#start-button` inicia Versus mediante `requestStartMode('versus')`; `#training-button` y `#arcade-run-button` usan los otros modos existentes. Estos IDs y listeners se conservaran.
- `src/styles.css:1397-1740` implementa el menu compacto actual. La tarjeta mide hasta `820px`, usa dos columnas y conserva scroll interno como fallback en poca altura, movil y zoom.
- `src/game.js` mantiene `selectedDifficulty`, `selectedArena`, `selectedFighterStyle` y `selectedRival`. Los valores sobreviven al volver al menu dentro de la misma carga, pero regresan a sus defaults despues de recargar.
- Los setters no actualizan una salida comun: dificultad solo cambia estado; arena actualiza el preview; estilo y rival actualizan sus descriptores. El nuevo resumen debe cubrir las cuatro rutas.
- `renderLanguage()` vuelve a renderizar textos, stats, preview y preferencias. Tambien debera refrescar el resumen compacto.
- `startArcadeFight()` sustituye dificultad, arena y rival temporalmente. `restoreArcadeMenuSelection()` recupera la seleccion de Versus al volver al menu; el resumen nuevo debe reflejar esa restauracion.
- `getFocusableElements()` excluye descendientes de un `<details>` cerrado y conserva su `<summary>`, por lo que la divulgacion progresiva ya es compatible con teclado y gamepad sin un nuevo gestor de estado.
- Ayuda y Controles son dialogos existentes con foco de retorno a `#help-button` y `#controls-button`. La segunda divulgacion debe permanecer abierta mientras uno de esos dialogos esta activo para que el retorno siga siendo visible.
- `#stats-summary` usa actualmente `role="status"` y `aria-live="polite"`. Esas semanticas no son fiables dentro de un `<details>` cerrado y no son necesarias porque el cierre de combate ya se anuncia por el canal correspondiente.
- `tests/game.test.js` protege el contrato HTML, espera hoy `#duel-settings` abierto, prueba el filtrado de foco en `<details>`, paridad ES/EN, seleccion, previews, onboarding, idioma, movimiento reducido y restauracion de Arcade.
- La suite de referencia pasa `162/162` pruebas antes de implementar este plan.
- `plans/plan_0038_menu_principal_compacto.md` es el antecedente del layout actual. Este plan lo reemplaza funcionalmente solo para la jerarquia inicial; no reabre sus cambios de gameplay ni reescribe sus registros historicos.

Suposiciones explicitas:

- "Jugar ahora" usa la configuracion actual en memoria. En una carga nueva usa Normal, Cuaderno, Balanceado y Null Pointer.
- Las dos divulgaciones empiezan cerradas en cada carga y conservan su propiedad nativa `open` mientras la pagina siga cargada. No se guarda ni se fuerza su estado desde JavaScript.
- Ocultar inicialmente previews, preferencias y utilidades es aceptable porque el resumen de duelo permanece visible y las divulgaciones nombran de forma concreta su contenido.
- La segunda divulgacion se rotula `AJUSTES, AYUDA Y CONTROLES · ES/EN` / `SETTINGS, HELP & CONTROLS · ES/EN`; no se usara un nombre generico como `MAS` o un icono sin texto.
- Las estadisticas pasan a ser contenido estatico consultable, no una region viva.
- El resumen de teclas y GitHub se ocultan deliberadamente para cumplir el objetivo de reducir elementos iniciales; siguen disponibles a una sola divulgacion de distancia.

## Diseño Propuesto

### 1. Jerarquia y orden DOM

El orden visual, de lectura y de foco sera el mismo; no se usaran `order`, grids invertidos ni `tabindex` positivo:

1. Kicker, titulo e introduccion.
2. Resumen visible del duelo actual.
3. `#start-button` como unica accion primaria.
4. `#duel-settings` cerrado inicialmente.
5. Grupo `OTROS MODOS / OTHER MODES` con Arcade y Entrenamiento.
6. Segunda divulgacion de Ajustes, Ayuda y Controles.

El foco inicial seguira entrando en `#start-button`. Con ambas divulgaciones cerradas, la secuencia interactiva esperada sera:

```text
Jugar ahora -> Personalizar partida -> Carrera Arcade -> Entrenamiento -> Ajustes, Ayuda y Controles
```

Al abrir una divulgacion, sus controles nativos se insertan en ese punto del orden sin codigo personalizado.

### 2. Accion primaria y resumen compacto

- Mantener el ID y listener de `#start-button`, cambiar solo su texto localizado de `INICIAR JUEGO / START GAME` a `JUGAR AHORA / PLAY NOW`.
- Agregar `#match-configuration-summary` como texto visible y no vivo con una plantilla localizada:

```text
Dificultad: NORMAL · Arena: CUADERNO · Estilo: BALANCEADO · Rival: NULL POINTER
```

- Asociar `#start-button` con ese resumen mediante `aria-describedby="match-configuration-summary"`.
- Crear un unico `renderMatchConfigurationSummary()` derivado de las cuatro variables `selected*`; no crear estado duplicado ni leer el texto de los `<select>`.
- Invocar ese renderer desde los cuatro setters, `renderLanguage()` y `restoreArcadeMenuSelection()`.
- Mantener `#selection-summary` dentro de Personalizar para los descriptores extensos de estilo y rival. El resumen compacto no reemplaza esos textos ni las asociaciones `aria-describedby` de los selects.

### 3. Personalizacion progresiva

- Retirar `open` de `#duel-settings` y cambiar su etiqueta localizada a `PERSONALIZAR PARTIDA / CUSTOMIZE MATCH`.
- Mover dentro de su contenido las cuatro preferencias de duelo y el bloque completo de preview actual.
- Dificultad, arena, estilo y rival permanecen como selects nativos con los mismos IDs, opciones y comportamiento inmediato.
- El preview de arena y los descriptores de estilo/rival conservan sus IDs para no romper render, accesibilidad ni pruebas.
- Movimiento reducido sale de esta seccion porque es una preferencia global, no una regla del duelo.
- No se agrega boton `Aplicar`; cerrar el `<details>` solo oculta controles y no revierte elecciones.

### 4. Modos secundarios

- Separar Arcade y Entrenamiento de las utilidades en un grupo visual propio.
- Mostrar primero `#arcade-run-button` y despues `#training-button` para presentar el modo de progresion antes de la practica.
- Mantenerlos como botones secundarios iguales, sin competir en color, borde o sombra con `#start-button`.
- Agregar una etiqueta localizada corta `OTROS MODOS / OTHER MODES` para aclarar que no configuran el duelo rapido.
- No cambiar `requestStartMode()`, onboarding ni los valores de `gameMode`.

### 5. Ajustes, Ayuda y Controles

- Agregar un segundo `<details id="menu-utilities">` cerrado inicialmente.
- Su `<summary>` debe nombrar Ajustes, Ayuda, Controles y mostrar la pista `ES/EN`; no se usara `role="menu"`, `menuitem` ni `aria-expanded` manual.
- Dentro, mantener en este orden:
  1. `#language-select`.
  2. `#reduce-motion-toggle` con toda la fila activable.
  3. `#help-button` y `#controls-button`.
  4. `#stats-summary` como texto estatico, sin `role="status"` ni `aria-live`.
  5. `#controls-summary` y el enlace GitHub existentes.
- Mantener las pantallas de Ayuda y Controles sin fusionarlas. Al regresar, `#menu-utilities` debe conservarse abierto y el foco volver al boton visible que abrio el dialogo.
- Marcar los nombres de idioma con lenguaje de parte: `<option value="es" lang="es">Español</option>` y `<option value="en" lang="en">English</option>`.

### 6. Tratamiento visual y responsive

- Mantener la identidad de papel, tinta, bordes duros y acento amarillo. Evitar tarjetas genericas tipo dashboard.
- El resumen compacto se tratara como una ficha tecnica de combate de una sola banda, con wrapping y sin cuatro contenedores competidores.
- El CTA sera el unico bloque amarillo de ancho completo. Su estado `:focus-visible` conservara el amarillo y agregara el indicador de foco; no debe volverse blanco al recibir el foco inicial.
- Los dos `<summary>`, botones, selects, checkbox y enlace mantendran un objetivo interactivo de al menos `44px` segun la convencion del proyecto.
- Los estados cerrado, abierto, hover y foco se distinguiran por texto, borde, marcador y forma, no solo por color.
- No animar altura ni apertura de los `<details>`.
- Reorganizar el bloque efectivo de CSS del menu en `src/styles.css:1397-1740` en vez de agregar una tercera capa de overrides.
- Mantener altura automatica, `max-height`, `overflow: auto`, safe areas y `touch-action: pan-y` para contenido expandido, viewports bajos y zoom.
- En escritorio, Personalizar puede conservar la reticula settings/preview de dos columnas cuando esta abierto. En movil se apila en una columna.
- Arcade y Entrenamiento usan dos columnas cuando hay espacio y una columna antes de que sus textos se recorten.
- El resumen permite wrap de valores largos como `REUNION PRESENCIAL`, `CLASE DE MATEMATICAS`, `IN-PERSON MEETING` y `MERGE CONFLICT`; no usa ellipsis ni altura fija.

### 7. Estado, persistencia y Canvas

- `gameState` permanece `menu`; abrir o cerrar divulgaciones no crea un estado de juego nuevo.
- `gameMode` y `pendingStartMode` no cambian.
- Idioma, movimiento reducido, stats y bindings conservan sus claves y semantica de persistencia actuales.
- Las cuatro selecciones de duelo conservan su comportamiento de sesion y defaults actuales. No se crea una nueva clave de `localStorage`.
- Las asignaciones temporales de Arcade siguen directas y no usan setters. Solo la restauracion de menu vuelve a renderizar el resumen compacto.
- Canvas, renderers, espacio logico `1000x500`, input de combate y simulacion no se modifican.

## Archivos A Modificar

- `src/index.html`: reordenar el menu, cerrar Personalizar por defecto, agregar resumen compacto y segunda divulgacion, mover preferencias/utilidades y conservar IDs.
- `src/styles.css`: implementar la nueva jerarquia, estados de divulgacion, CTA, grupos y responsive sin afectar otros dialogos.
- `src/i18n.js`: actualizar el CTA y agregar claves ES/EN para resumen, Personalizar, Otros modos y Ajustes/Ayuda/Controles.
- `src/game.js`: renderizar el resumen compacto desde las cuatro selecciones y refrescarlo en setters, idioma y restauracion de Arcade.
- `tests/game.test.js`: actualizar mocks/contrato HTML y cubrir resumen, divulgaciones, foco, i18n y restauracion.
- `Readme.md`: documentar Jugar ahora, Personalizar y la nueva jerarquia del menu.
- `AGENTS.md`: registrar el contrato durable de las dos divulgaciones, el resumen autoritativo y el comportamiento de foco.
- `plans/plan_0046_menu_inicio_divulgacion_progresiva.md`: mantener estado, resultados y desviaciones durante la implementacion.

No se esperan cambios en `src/config.js`, `src/input.js`, `src/audio.js`, renderers, gameplay, workflow de Pages ni `BACKLOG.md`.

## Plan De Implementacion

1. Congelar baseline de tests, sintaxis y estructura del menu actual.
   Verificar: registrar total de pruebas, confirmar worktree y medir altura/scroll del menu colapsado y actual en viewports objetivo sin modificar archivos ajenos.

2. Agregar pruebas fallidas del resumen y del nuevo contrato de divulgacion.
   Verificar: las pruebas exigen CTA nuevo, `aria-describedby` valido, ambos `<details>` sin `open`, contenido correctamente anidado, stats no vivas y IDs unicos.

3. Agregar claves localizadas y `renderMatchConfigurationSummary()`.
   Verificar: defaults y cada setter producen dificultad, arena, estilo y rival correctos en ES/EN; valores invalidos muestran los fallbacks existentes.

4. Reestructurar `#main-menu` en orden semantico sin cambiar IDs funcionales.
   Verificar: Jugar ahora queda primero entre los controles; Personalizar contiene los cuatro selects y previews; Arcade/Entrenamiento estan fuera de utilidades; idioma, movimiento, Ayuda, Controles, stats, teclas y GitHub estan dentro de `#menu-utilities`.

5. Ajustar la sincronizacion de menu y Arcade.
   Verificar: cambios de los cuatro selects y de idioma refrescan el resumen; volver desde una carrera restaura el resumen de Versus y no deja visible la configuracion temporal de una etapa.

6. Rehacer solo las reglas efectivas del menu en `src/styles.css`.
   Verificar: CTA amarillo dominante incluso con foco inicial; divulgaciones y modos tienen jerarquia secundaria; otros dialogos no cambian; no aparecen alturas fijas ni overflow horizontal.

7. Cubrir foco, teclado, gamepad simulado y retorno desde dialogos.
   Verificar: descendientes cerrados no entran al foco; al abrir cada divulgacion aparecen en orden DOM; Ayuda/Controles vuelven a su boton dentro de `#menu-utilities` abierto; Escape y cancel de gamepad conservan el comportamiento existente.

8. Validar responsive, textos largos, zoom y preferencias.
   Verificar: layout colapsado y ambas divulgaciones abiertas son alcanzables por scroll; movimiento reducido conserva precedencia sistema/manual; ES/EN no recorta labels ni valores.

9. Actualizar cache busting del CSS, contrato estatico y documentacion.
   Verificar: el query de `styles.css` y su assertion coinciden; README y AGENTS describen solo el comportamiento entregado; `BACKLOG.md` conserva el item `#21` pendiente.

10. Ejecutar validacion completa y revisar el diff.
    Verificar: sintaxis, suite y `git diff --check` pasan; no hay cambios de gameplay, persistencia nueva, dependencias ni refactors no requeridos.

## Pruebas Y Validacion

Validacion automatica completa desde la raiz:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check tests\game.test.js
node --test tests\game.test.js
git diff --check
```

Contratos automaticos nuevos o ajustados:

- `#start-button` muestra `JUGAR AHORA` y `PLAY NOW`, conserva su listener Versus y referencia `#match-configuration-summary`.
- El resumen contiene las cuatro selecciones actuales, no es una region viva y se actualiza con cada setter, idioma y restauracion de Arcade.
- `#duel-settings` y `#menu-utilities` no tienen atributo `open` en HTML.
- Los cuatro selects y previews son descendientes de Personalizar.
- Idioma, movimiento reducido, Ayuda, Controles, stats, teclas y GitHub son descendientes de Utilidades.
- `#stats-summary` conserva contenido localizado pero ya no tiene `role="status"` ni `aria-live`.
- Cerradas, ambas divulgaciones excluyen sus descendientes del orden de foco; abiertas, incluyen controles en orden DOM.
- El orden interactivo colapsado coincide con el orden visual definido y no usa `tabindex` positivo.
- Abrir y cerrar Ayuda/Controles por boton, Escape y cancel simulado conserva abierta la divulgacion y restaura foco visible.
- El onboarding conserva el modo solicitado para Jugar ahora, Arcade y Entrenamiento.
- Idioma, movimiento reducido, bindings y stats conservan sus pruebas de persistencia actuales.
- Arcade conserva asignaciones temporales y restaura dificultad, arena, rival y resumen de menu.
- Los diccionarios ES/EN conservan las mismas claves y placeholders.
- El contrato HTML conserva CSP, assets locales, orden de scripts, zoom habilitado, IDs unicos y query de CSS actualizado.

Smoke browser de implementacion:

- Servir con `python -m http.server 8000` y abrir `http://localhost:8000/src/`.
- Revisar menu colapsado y ambas divulgaciones abiertas en `1440x900`, `1366x768`, `1024x768`, `844x390`, `760x800`, `390x844`, ancho CSS de `320px`, alturas de `320-400px` y zoom de navegador al `200%`.
- En el estado colapsado, titulo, resumen, Jugar ahora, Personalizar y ambos modos deben verse sin overflow horizontal; en poca altura puede usarse scroll vertical.
- Con ambas divulgaciones abiertas, todos los controles, stats y GitHub deben seguir alcanzables por scroll y los focos no deben recortarse.
- Probar ES/EN y todos los valores largos de arena/rival sin truncamiento ni ellipsis.
- Recorrer con Tab/Shift+Tab; activar summaries con Enter/Espacio; verificar selects con flechas; abrir/cerrar Ayuda y Controles y confirmar foco de retorno.
- Confirmar que el foco inicial de Jugar ahora mantiene fondo amarillo e indicador de foco visible.
- Confirmar que el cambio de idioma y movimiento reducido sigue persistiendo tras recarga, mientras la configuracion de duelo vuelve a defaults como esta documentado.

Las pruebas Node y un smoke browser no constituyen evidencia de lector de pantalla, hardware, rendimiento o validacion humana. Cualquier evidencia formal de esas categorias se registra exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`.

## Documentacion

- `Readme.md`: actualizar `How To Play`, UI/UX y smoke checks para explicar Jugar ahora, resumen actual, Personalizar, modos secundarios y utilidades divulgables.
- `AGENTS.md`: registrar que el menu usa dos `<details>` cerrados inicialmente, que `#match-configuration-summary` deriva de las cuatro variables y que Ayuda/Controles deben restaurar foco dentro de Utilidades abierta.
- `BACKLOG.md`: no cambiar; este plan no implementa persistencia y no completa `#21`.
- `PLANS.md`: no cambiar; el estandar actual es suficiente.
- Planes historicos: no reescribir `0035`, `0038` ni `0039`; solo referenciarlos cuando sea necesario.

## Riesgos Y Mitigaciones

- Riesgo: ocultar idioma, movimiento reducido, Ayuda y Controles reduce descubribilidad. Mitigacion: usar un summary textual explicito con `AJUSTES, AYUDA Y CONTROLES · ES/EN`, objetivo de 44px y posicion previa a cualquier salida del dialogo.
- Riesgo: el resumen de Jugar ahora queda desactualizado. Mitigacion: un renderer derivado del estado existente, invocado desde los cuatro setters, idioma y restauracion de Arcade, con pruebas por cada ruta.
- Riesgo: Ayuda o Controles devuelve foco a un boton oculto. Mitigacion: no cerrar `#menu-utilities` al abrir/cerrar dialogos, probar todos los cierres y agregar un fallback al summary solo si una prueba demuestra que el navegador/mocks no preservan `open`.
- Riesgo: una region viva dentro de contenido cerrado anuncia de forma inconsistente. Mitigacion: convertir stats en texto estatico y conservar el anunciador de cierre de combate existente.
- Riesgo: el CTA pierde jerarquia al recibir foco programatico. Mitigacion: separar foco de color de relleno; preservar amarillo y agregar outline/box-shadow no recortado.
- Riesgo: previews y selectores quedan fuera de Personalizar por una reordenacion incompleta. Mitigacion: proteger parentesco e IDs en el contrato HTML y verificar los `aria-describedby` existentes.
- Riesgo: Arcade deja en el resumen la etapa temporal. Mitigacion: actualizar el resumen en `restoreArcadeMenuSelection()` y ampliar la regresion actual de restauracion.
- Riesgo: abrir ambas divulgaciones desborda movil o zoom. Mitigacion: altura automatica, una sola columna, scroll vertical, safe areas, targets de 44px y pruebas con viewports bajos/estrechos.
- Riesgo: textos ES/EN largos fuerzan overflow. Mitigacion: `minmax(0, 1fr)`, `min-width: 0`, wrapping permitido, sin ellipsis y breakpoints por legibilidad.
- Riesgo: el orden visual difiere del foco. Mitigacion: reordenar HTML, no CSS; no introducir `order` ni `tabindex` positivo.
- Riesgo: una nueva capa CSS contradice los overrides existentes. Mitigacion: reemplazar el bloque scoped efectivo del menu en lugar de anexar reglas generales.
- Riesgo: el cambio crece hacia persistencia, nuevas pantallas o fusion de dialogos. Mitigacion: mantener esos puntos explicitamente fuera de alcance y detener para actualizar el plan si se vuelven necesarios.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar este ExecPlan.

- El alcance se limito al problema observado: demasiados elementos visibles al inicio.
- Se eligieron dos `<details>` nativos en lugar de nuevos modales, estados, controladores o componentes.
- Se descarto persistir la configuracion porque no es necesario para mejorar la jerarquia y ya existe como item `#21` independiente.
- Se descartaron una pantalla de Estadisticas, un modal de Ajustes, una pantalla Acerca de y fusionar Ayuda/Controles por no ser necesarios para el objetivo.
- Se conserva una sola fuente de verdad: las variables `selected*`; el resumen solo las representa.
- Los cambios son quirurgicos y se concentran en menu, traducciones, un renderer pequeno, pruebas y documentacion.
- Las suposiciones sobre defaults, aplicacion inmediata, estado de los `<details>`, foco y stats estaticas estan explicitas.
- Cada paso tiene una verificacion observable y la aceptacion separa mocks de validacion humana real.
- No se agregan dependencias, persistencia, estado de juego, animaciones ni cambios de Canvas.

## Criterios De Aceptacion

- Al cargar, solo estan visibles titulo/intro, resumen de duelo, Jugar ahora, Personalizar, Arcade, Entrenamiento y el summary de Ajustes/Ayuda/Controles; los controles detallados no saturan la vista inicial.
- `JUGAR AHORA / PLAY NOW` es el unico CTA amarillo y sigue iniciando Versus con onboarding cuando corresponde.
- El resumen visible y no vivo muestra dificultad, arena, estilo y rival actuales en ES/EN y describe el CTA mediante `aria-describedby`.
- Cambiar cualquiera de los cuatro selects actualiza inmediatamente el resumen y los previews detallados correspondientes.
- Personalizar inicia cerrado, contiene toda la configuracion de duelo y no revierte cambios al cerrarse.
- Arcade y Entrenamiento permanecen visibles, separados de Ayuda/Controles y conservan sus flujos.
- Ajustes/Ayuda/Controles inicia cerrado y contiene idioma, movimiento reducido, Ayuda, Controles, stats, resumen de teclas y GitHub.
- Stats son legibles al abrir la divulgacion y ya no dependen de una region viva oculta.
- La configuracion de duelo conserva defaults tras recarga; no aparece una nueva clave de storage ni se completa el backlog `#21`.
- Al volver de Arcade, el resumen muestra la seleccion Versus restaurada, no la ultima etapa temporal.
- El foco inicial entra en Jugar ahora; Tab/Shift+Tab omite contenidos cerrados y sigue el orden visual; Enter/Espacio opera summaries y botones nativos.
- Ayuda y Controles conservan foco modal, Escape/gamepad cancel y retorno al boton visible dentro de la divulgacion abierta.
- Todos los objetivos interactivos del menu alcanzan al menos 44px y el foco visible no se recorta ni depende solo del color.
- A `1366x768` y `390x844`, el menu colapsado no tiene overflow horizontal y presenta el CTA y los modos sin abrir configuracion.
- A `844x390`, anchos CSS de `320px`, alturas de `320-400px` y zoom `200%`, todo permanece alcanzable mediante scroll vertical sin scroll horizontal.
- Con ambas divulgaciones abiertas, preview, utilidades y GitHub siguen alcanzables; otros dialogos no cambian de layout.
- ES/EN y valores largos no se truncan, superponen ni usan ellipsis.
- Idioma, movimiento reducido, bindings, datos/persistencia de stats, onboarding, modos, gameplay y coordenadas `1000x500` conservan su comportamiento previo; solo se retira el anuncio vivo de stats dentro del contenido cerrado.
- `node --check` para `src/*.js` y tests, `node --test tests\game.test.js` y `git diff --check` pasan.
- README, AGENTS y el estado de este plan reflejan exactamente lo implementado.

## Commit Y Push

- Commit recomendado: `Simplify main menu hierarchy`.
- La mejora debe caber en un unico commit funcional; no mezclar con persistencia del backlog `#21`, gameplay ni limpieza general de CSS.
- Ejecutar la validacion completa antes del commit.
- No hacer commit ni push salvo solicitud expresa del usuario.

## Estado De Implementacion

Plan propuesto el 2026-08-19. No implementado.

Baseline verificado al crear el plan:

- `node --test tests\game.test.js`: `162/162` pruebas superadas.
- `git diff --check`: correcto.
