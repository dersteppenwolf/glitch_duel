# Exec Plan: Mejoras Arenas

Estado: Cerrado en commit pendiente `Improve arena themes`.

## Objetivo

Actualizar y ampliar las arenas para que tengan mas identidad visual y variedad tematica, manteniendo el juego como experiencia arcade simple sin cambiar reglas de combate.

Set final de arenas:

- `CUADERNO`
- `CAFETERIA`
- `LABORATORIO`
- `REUNION PRESENCIAL`
- `REUNION REMOTA`

Cambios esperados para el jugador:

- El selector de arena ofrece cinco escenarios visualmente distintos.
- `TERMINAL` se reemplaza por `CAFETERIA`.
- Se agregan `REUNION PRESENCIAL` y `REUNION REMOTA`.
- Cada arena muestra detalles propios sin afectar daño, velocidad, IA, controles, hitboxes, timer ni victoria.

Queda fuera del alcance:

- Efectos jugables por arena.
- Persistir arena seleccionada en `localStorage`.
- Preview de arena en el menu.
- Assets externos, imagenes, dependencias, modulos ES o build step.
- Nuevos sonidos o musica por arena.

## Contexto Actual

- `src/config.js` define `ARENAS`, `selectedArena`, `setArena(...)` y `getArenaConfig()`.
- `src/index.html` contiene el selector de arena con opciones actuales.
- `src/game.js` usa `getArenaConfig()` en `drawBackground()` y muestra la arena en pausa.
- `tests/game.test.js` cubre seleccion de arena y fallback seguro.
- `Readme.md` documenta arenas, smoke test y backlog.
- El proyecto no persiste actualmente la arena seleccionada; por eso reemplazar `terminal` por `cafeteria` no requiere migracion de datos guardados.

## Diseño Propuesto

### Configuracion De Arenas

Actualizar `ARENAS` en `src/config.js` para contener:

```js
notebook: {
    label: 'CUADERNO',
    background: '#f7f3e8',
    ground: '#222',
    accent: 'rgba(0, 0, 255, 0.10)'
},
cafeteria: {
    label: 'CAFETERIA',
    background: '#f2dfc2',
    ground: '#7c4f2c',
    accent: 'rgba(124, 79, 44, 0.24)'
},
lab: {
    label: 'LABORATORIO',
    background: '#eef7f8',
    ground: '#264653',
    accent: 'rgba(42, 157, 143, 0.18)'
},
meeting: {
    label: 'REUNION PRESENCIAL',
    background: '#f4efe6',
    ground: '#5b4636',
    accent: 'rgba(91, 70, 54, 0.22)'
},
remoteMeeting: {
    label: 'REUNION REMOTA',
    background: '#101827',
    ground: '#7dd3fc',
    accent: 'rgba(125, 211, 252, 0.24)'
}
```

Nota: mantener labels sin tilde en configuracion si el archivo sigue ASCII. El texto visible puede seguir siendo claro como `REUNION PRESENCIAL` y `REUNION REMOTA`.

### Detalles Visuales Por Arena

Extender `drawBackground()` en `src/game.js` con funciones pequenas o bloques cercanos para cada arena.

Detalles propuestos:

- `notebook`: lineas de cuaderno, margen rojo, garabatos, formulas simples.
- `cafeteria`: barra o mesa de fondo, tazas, vapor, menu con `COFFEE`, `404 CAFFEINE`, `MEETING FUEL`.
- `lab`: paneles, formulas, tubos, advertencias simples, cuadrilla tecnica tenue.
- `meeting`: mesa larga, sillas, proyector, post-its, texto `THIS COULD BE AN EMAIL` o `ACTION ITEMS?`.
- `remoteMeeting`: ventanas de videollamada, chat, iconos simples de micro/camara, textos `YOU'RE MUTED`, `LAG...`, `RECONNECTING`.

Los detalles deben mantenerse detras de los luchadores, con bajo contraste suficiente para no competir con HUD, personajes ni mensajes centrales.

### Selector De Arena

Actualizar `src/index.html`:

- Cambiar opcion `TERMINAL` por `CAFETERIA`.
- Agregar `REUNION PRESENCIAL`.
- Agregar `REUNION REMOTA`.

Mantener `notebook` como valor por defecto para conservar fallback y primer arranque estable.

## Archivos A Modificar

- `src/config.js`: actualizar `ARENAS` con `cafeteria`, `meeting` y `remoteMeeting`; remover `terminal` si ya no se usa.
- `src/index.html`: actualizar opciones del selector de arena.
- `src/game.js`: agregar detalles visuales por arena en `drawBackground()`.
- `tests/game.test.js`: actualizar pruebas para nuevas arenas y fallback seguro.
- `Readme.md`: documentar set de arenas, smoke test y backlog completado.
- `plans/plan_0007_mejoras_arenas.md`: actualizar estado y resultado al terminar.

## Plan De Implementacion

1. Actualizar `ARENAS` en `src/config.js` con el set final y validar que `notebook` sigue siendo fallback.
2. Actualizar el selector en `src/index.html` con `CAFETERIA`, `REUNION PRESENCIAL` y `REUNION REMOTA`.
3. Extender `drawBackground()` en `src/game.js` con detalles visuales por arena, sin tocar loop, HUD ni gameplay.
4. Actualizar `tests/game.test.js` para validar nuevas arenas y fallback.
5. Actualizar `Readme.md` con arenas disponibles y smoke manual.
6. Ejecutar validacion automatica completa.
7. Hacer smoke manual visual si se va a cerrar el plan.

## Pruebas Y Validacion

Validacion automatica completa:

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

Pruebas unitarias esperadas:

- `setArena('cafeteria')` cambia la arena a `CAFETERIA`.
- `setArena('meeting')` cambia la arena a `REUNION PRESENCIAL`.
- `setArena('remoteMeeting')` cambia la arena a `REUNION REMOTA`.
- Un valor invalido sigue cayendo a `notebook`.
- Renderizar el fondo de las nuevas arenas no lanza errores y emite primitivas canvas.

Smoke manual:

- Servir con `python -m http.server 8000` desde `C:\tmp\game`.
- Abrir `http://localhost:8000/src/`.
- Cambiar entre las cinco arenas desde el menu.
- Iniciar partida en cada arena y confirmar que el fondo cambia claramente.
- Confirmar que humano/CPU, HUD, timer, barras y mensajes siguen legibles.
- Confirmar que golpes, combos, especial, pausa y fin de partida siguen funcionando igual.
- Confirmar que no hay errores visibles en consola.

## Documentacion

- `Readme.md`: actualizar estado del proyecto, lista de arenas, smoke test, funcionalidades implementadas y backlog.
- `AGENTS.md`: no requiere cambios salvo que el smoke test recomendado general cambie de forma sustancial.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: detalles de fondo reducen legibilidad. Mitigacion: usar opacidad baja, colores de acento y ubicarlos lejos del HUD.
- Riesgo: reemplazar `terminal` rompe pruebas o referencias. Mitigacion: actualizar selector, pruebas y documentacion; no hay persistencia de arena actual.
- Riesgo: `drawBackground()` crece demasiado. Mitigacion: mantener bloques simples o helpers pequenos en `game.js`, sin crear abstracciones innecesarias.
- Riesgo: cambio visual accidentalmente altera gameplay. Mitigacion: no tocar `Fighter`, ataques, hitboxes, IA, controles, timer ni reglas de rounds.
- Riesgo: textos largos de fondo compiten con indicadores. Mitigacion: usar frases cortas y baja opacidad.

## Validacion Del Plan Con Skill

Revision con `karpathy-guidelines`:

- Simplicidad: cambio limitado a configuracion, selector, render de fondo, pruebas y README.
- Cambios quirurgicos: no toca gameplay ni crea sistemas nuevos como preview o persistencia.
- Suposiciones explicitas: `terminal` puede reemplazarse porque no hay arena persistida en datos guardados.
- Verificabilidad: nuevas arenas tienen pruebas de seleccion/fallback y smoke manual visual.
- Sin dependencias externas: se mantiene Canvas con JS puro.

## Criterios De Aceptacion

- El selector muestra `CUADERNO`, `CAFETERIA`, `LABORATORIO`, `REUNION PRESENCIAL` y `REUNION REMOTA`.
- `TERMINAL` ya no aparece en el selector ni en README como arena disponible.
- Cada arena tiene detalles visuales propios en el fondo.
- Cambiar de arena no modifica daño, hitboxes, IA, controles, timer ni reglas de victoria.
- El fallback de arena invalida sigue usando `CUADERNO`.
- `Readme.md` refleja las cinco arenas.
- Validacion automatica completa pasa.

## Commit Y Push

Un solo commit recomendado al implementar: `Improve arena themes`.

Hacer push solo si el usuario lo pide.

## Resultado

- `TERMINAL` fue reemplazada por `CAFETERIA`.
- Agregadas arenas `REUNION PRESENCIAL` y `REUNION REMOTA`.
- El selector ahora muestra cinco arenas: `CUADERNO`, `CAFETERIA`, `LABORATORIO`, `REUNION PRESENCIAL` y `REUNION REMOTA`.
- `drawBackground()` renderiza detalles tematicos por arena sin tocar gameplay.
- Agregadas pruebas de seleccion, fallback y render de fondos tematicos.
- Actualizado `Readme.md` con el set final de arenas y el backlog completado.
