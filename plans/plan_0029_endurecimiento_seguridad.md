# Exec Plan: endurecimiento seguridad

## Objetivo

Eliminar la ruta de XSS persistente que parte de las estadisticas en `localStorage`, limitar el impacto de futuras inyecciones con una Content Security Policy compatible con el juego estatico y hacer inmutables las referencias de acciones con permisos de despliegue.

El jugador conserva sus estadisticas validas, el aspecto del panel final y el flujo de juego actual. Los datos corruptos o manipulados se reemplazan por cero de forma segura. Queda fuera del alcance agregar autenticacion, backend, analitica, dependencias, nuevos controles o cambiar de proveedor de hosting.

## Contexto Actual

- `src/game.js` inicializa `stats` con `loadStats()` y lee tanto `glitchDuelStats` como la clave historica `xkcdKombatStats`.
- `loadStats()` mezcla directamente cualquier propiedad obtenida por `JSON.parse()` con los valores por defecto. `renderGameOverText()` concatena el marcador y las estadisticas dentro de `innerHTML`.
- `recordMatchResult()` mantiene `bestStreak` cuando el jugador pierde, por lo que un valor de almacenamiento no confiable alcanza el sumidero HTML al cerrar esa partida.
- `src/index.html` carga solo CSS y scripts clasicos del propio origen, en un orden fijo. No hay scripts inline, peticiones de red, fuentes remotas, formularios ni recursos embebidos que requieran permitir otros origenes.
- `.github/workflows/pages.yml` tiene permisos minimos para Pages, pero usa etiquetas movibles de acciones oficiales.
- `tests/game.test.js` ejecuta los scripts con `vm` y usa un mock DOM simplificado que actualmente solo conserva `innerHTML` y `textContent`.

Suposiciones:

- Las cuatro estadisticas son contadores locales y solo valores enteros no negativos son validos.
- Una cuenta maxima de `1_000_000` es mucho mayor que cualquier uso normal y evita persistir valores desproporcionados; no existe un requisito de conservar contadores arbitrariamente grandes.
- GitHub Pages se mantiene como hosting directo. Una CSP mediante cabecera y `frame-ancestors` requerira configurar un CDN o proxy externo y no puede resolverse solo desde este repositorio.

## Diseño Propuesto

### Persistencia y render seguro

- En `src/game.js`, definir un unico limite para los contadores y un helper pequeno que acepte exclusivamente enteros seguros entre `0` y el limite. Cualquier otro tipo, decimal, negativo, `NaN` o valor fuera del limite se convierte en `0`.
- Hacer que `loadStats()` analice JSON dentro de su `try`, confirme que el resultado es un objeto no nulo ni arreglo y reconstruya un objeto nuevo con solo `wins`, `losses`, `currentStreak` y `bestStreak` normalizados. No copiar propiedades desconocidas.
- Mantener la lectura de las claves historicas para no perder estadisticas validas. No se introducira una migracion adicional: el siguiente `saveStats()` ya escribira el formato canonico con la clave actual.
- Sustituir `renderGameOverText()` por creacion explicita de los mismos elementos visuales (`div`, `span`, `small` y `p`) y asignar cada cadena, incluidos los contadores, con `textContent`. No se usara `innerHTML` en el codigo de produccion. El salto de linea que hoy pertenece a las traducciones de victoria se representara como contenido textual seguro o como un `<br>` creado por codigo, sin interpretar textos de traduccion como HTML.
- No se cambian `gameState`, el orden de `recordMatchResult()` ni las coordenadas logicas del canvas `1000x500`.

### Politica de contenido

- Insertar una meta CSP como primer elemento de `head` en `src/index.html`, antes de hojas de estilo y scripts. Permitira unicamente los recursos de mismo origen que ya usa la aplicacion y bloqueara conexiones, objetos, formularios y bases URL inyectadas.
- Usar una politica equivalente a: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
- Documentar que la meta CSP es defensa en profundidad y que el despliegue debe incorporar una cabecera CSP con `frame-ancestors 'none'` si se coloca tras un CDN/proxy. No se afirmara que GitHub Pages ofrece cabeceras personalizadas desde este repositorio.

### Cadena de despliegue

- Sustituir cada referencia `uses: propietario/accion@vN` por el SHA completo y revisado que corresponda a esa misma release publicada: `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact` y `actions/deploy-pages`.
- Conservar junto a cada SHA un comentario con la version legible. Antes de editar, obtener cada SHA desde la release oficial, verificar que pertenece al repositorio esperado y revisar el diff/release de la accion. No adivinar ni copiar SHAs de fuentes no verificadas.
- Mantener sin cambios los triggers, `concurrency`, permisos y el artefacto `src/`.

## Archivos A Modificar

- `src/game.js`: normalizar estadisticas persistidas y renderizar el cierre con nodos/texto seguro.
- `src/index.html`: declarar la meta CSP antes de cargar recursos.
- `.github/workflows/pages.yml`: fijar las cuatro acciones de Pages a SHAs inmutables revisados.
- `tests/game.test.js`: ampliar el mock DOM lo minimo necesario para crear/anexar nodos y cubrir la normalizacion y el render seguro.
- `Readme.md`: documentar la postura de seguridad del sitio estatico, la CSP meta y la limitacion de cabeceras de GitHub Pages.

## Plan De Implementacion

1. Agregar en `src/game.js` el limite de contador y el helper de normalizacion; reescribir `loadStats()` para devolver exclusivamente las cuatro claves esperadas y valores normalizados.
   Verificar: una carga valida actual y una carga desde la clave historica conservan sus contadores; JSON invalido, `null`, arrays, campos HTML, decimales, negativos y enteros fuera del limite producen ceros solo en los campos invalidos.

2. Reemplazar el `innerHTML` de `renderGameOverText()` por una construccion DOM equivalente con `document.createElement`, `append` o `replaceChildren`, y `textContent` para cada dato variable.
   Verificar: el panel final conserva medalla, marcador, dificultad, arena, racha y frase; una cadena HTML alojada en las estadisticas se muestra como texto o se descarta durante normalizacion y nunca genera markup ejecutable.

3. Extender el mock DOM de `tests/game.test.js` con las operaciones minimas que use el render nuevo y ajustar el estado expuesto de pruebas para inspeccionar texto y estructura, en lugar de depender de `winnerTextHtml`.
   Verificar: las pruebas existentes de medallas y cierre siguen comprobando el contenido visible sin requerir un parser HTML simulado.

4. Agregar pruebas unitarias enfocadas en seguridad:
   - estadisticas validas y legacy siguen cargando;
   - cada campo invalido se reinicia de manera independiente;
   - campos adicionales no aparecen en el estado;
   - un `bestStreak` con una carga HTML no llega como HTML al panel final de una derrota.
   Verificar: estas pruebas habrian fallado con la implementacion vulnerable y pasan con la normalizada.

5. Agregar la meta CSP en `src/index.html` y revisar que todas las directivas sean compatibles con los enlaces, SVG inline, CSS y scripts locales actuales.
   Verificar: abrir `src/` mediante `python -m http.server 8000`; no hay errores CSP en consola, se aplican estilos y el juego carga todos los scripts.

6. Resolver desde las releases oficiales los cuatro SHAs de Actions, fijarlos en `.github/workflows/pages.yml` con sus comentarios de version y revisar el diff de YAML.
   Verificar: no queda ninguna referencia `uses:` basada solo en `@vN`; la sintaxis YAML sigue correcta y el siguiente workflow de Pages se completa correctamente en GitHub Actions.

7. Actualizar `Readme.md` con una seccion breve de seguridad que explique que las estadisticas locales se validan, que la CSP meta es parcial y que una cabecera CSP/anti-framing requiere infraestructura externa a GitHub Pages.
   Verificar: la documentacion no promete cabeceras que el hosting actual no puede emitir.

8. Ejecutar la validacion automatica y el smoke test de navegador completo.

## Pruebas Y Validacion

Validacion automatica:

```powershell
node --check src\i18n.js
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\arena_render.js
node --check src\hud_render.js
node --check src\game.js
node --test tests\game.test.js
```

Validacion de workflow:

```powershell
git diff --check
```

Smoke test manual:

- Servir `src/` con `python -m http.server 8000` y abrir `http://localhost:8000/src/`.
- Confirmar que consola no informa violaciones CSP ni errores de carga de CSS/scripts.
- Inyectar temporalmente, desde DevTools solo durante la prueba, un JSON con `bestStreak` HTML en `glitchDuelStats`; recargar, perder una partida y confirmar que no se interpreta ni ejecuta HTML.
- Confirmar que estadisticas validas, idioma, arena, estilo y movimiento reducido siguen persistiendo y que una partida completa muestra el panel final con el mismo layout.
- Tras publicar, comprobar en GitHub Actions que el workflow Pages con acciones fijadas termina correctamente y que el sitio publicado carga sin errores CSP.

## Documentacion

- `Readme.md`: agregar una nota de seguridad de despliegue y de validacion de estadisticas; no cambian controles, estados ni comandos de juego.
- `AGENTS.md`: no requiere cambios, porque la arquitectura, el flujo de despliegue y los comandos de validacion no cambian.
- `PLANS.md`: no requiere cambios, porque el estandar de planificacion se mantiene.

## Riesgos Y Mitigaciones

- Riesgo: descartar una estadistica valida al imponer el limite. Mitigacion: usar un limite alto, documentarlo en el helper y cubrir sus bordes exactos en pruebas.
- Riesgo: el nuevo render DOM altere el estilo del cierre. Mitigacion: conservar las clases `post-match-medal` y `post-match-summary`, la jerarquia actual y validar visualmente el panel.
- Riesgo: el mock de pruebas crezca hasta intentar emular un navegador. Mitigacion: implementar solo `createElement`, anexado de hijos, reemplazo de hijos y texto que el render necesite.
- Riesgo: una CSP demasiado estricta bloquee recursos existentes. Mitigacion: situarla antes de recursos, limitarla a directivas respaldadas por el uso real y hacer smoke test con consola abierta antes de publicar.
- Riesgo: una CSP meta no impide framing ni protege las primeras directivas HTTP. Mitigacion: dejar esa limitacion expresa y tratar una cabecera CSP con `frame-ancestors 'none'` como tarea de infraestructura separada.
- Riesgo: SHA incorrecto o de una release no revisada rompa Pages. Mitigacion: resolverlo desde las releases oficiales, conservar el comentario de version y validar el workflow publicado antes de considerarlo terminado.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

- El plan es quirurgico: modifica un flujo de persistencia, un render, una meta de documento, cuatro referencias de Actions, sus pruebas y documentacion asociada.
- No agrega dependencias, backend, build step ni abstracciones generales de seguridad.
- Las suposiciones relevantes se explicitan, incluido el limite de contadores y la imposibilidad de entregar ciertas cabeceras desde GitHub Pages sin infraestructura adicional.
- Cada paso tiene una verificacion concreta mediante pruebas unitarias, comprobacion de sintaxis, smoke test y ejecucion del workflow.
- Los criterios de aceptacion permiten comprobar que se elimina el sumidero y que el juego conserva su comportamiento visible.

## Criterios De Aceptacion

- `loadStats()` devuelve solo las cuatro estadisticas conocidas como enteros entre `0` y `1_000_000`.
- Datos invalidos o manipulados de ambas claves de almacenamiento no llegan al render HTML.
- `src/game.js` no usa `innerHTML` para el panel final ni para otro dato persistido.
- El panel final conserva toda su informacion y estilos visuales.
- La CSP bloquea scripts, estilos y conexiones de origenes no permitidos sin impedir la carga normal del juego.
- Las cuatro acciones del workflow estan fijadas a SHAs completos revisados y conservan sus permisos actuales.
- Las pruebas nuevas y existentes pasan; la comprobacion de sintaxis y `git diff --check` pasan.
- El workflow Pages y el smoke test del sitio publicado terminan sin regresiones.

## Commit Y Push

- Commit recomendado: `Harden client-side security`.
- Ejecutar todas las validaciones antes del commit.
- No hacer push salvo que el usuario lo solicite.

## Estado De Implementacion

Implementado el 2026-07-23.

- Completado: `src/game.js` normaliza las cuatro estadisticas permitidas como enteros entre `0` y `1_000_000`, rechaza JSON no objeto, arreglos, valores invalidos y propiedades desconocidas.
- Completado: `renderGameOverText()` ya no usa `innerHTML`; construye el panel final con nodos DOM y `textContent`. Los mensajes de victoria en `src/i18n.js` tampoco contienen markup HTML.
- Completado: `src/index.html` incluye una CSP meta de mismo origen que bloquea conexiones, objetos, formularios y bases URL no permitidas.
- Completado: `.github/workflows/pages.yml` fija las cuatro Actions de Pages a SHAs oficiales revisados, conservando los comentarios de version.
- Completado: `tests/game.test.js` cubre campos de estadisticas invalidos, markup malicioso, arreglos y JSON malformado; el mock DOM soporta el render seguro necesario.
- Completado: `Readme.md` documenta la validacion de estadisticas, la CSP y la limitacion de cabeceras en GitHub Pages.

Validacion ejecutada:

- `node --test tests\game.test.js`: 69 pruebas superadas.
- `node --check` para todos los archivos `src\*.js`: correcto.
- `git diff --check`: correcto.
- Revision estatica: no quedan usos de `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` o `Function` en `src`; las referencias `uses:` del workflow no usan etiquetas movibles.

Pendiente de validacion operativa:

- Smoke test en navegador servido localmente para confirmar que no hay violaciones CSP y que el panel final conserva su apariencia.
- Ejecucion publicada del workflow de GitHub Pages para confirmar el despliegue con las acciones fijadas.
