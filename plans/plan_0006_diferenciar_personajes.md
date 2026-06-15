# Exec Plan: Diferenciar Personajes

Estado: Cerrado en `5e6ca3f Differentiate player and CPU visuals`.

## Objetivo

Diferenciar visualmente al luchador humano y a la CPU sin cambiar reglas de combate, controles, hitboxes, IA, daño, energia ni balance.

La experiencia buscada es que el jugador identifique rapidamente quien es humano y quien es CPU en movimiento, en desktop y movil.

Queda fuera del alcance:

- Nuevos personajes seleccionables.
- Nuevas animaciones complejas.
- Cambios de gameplay, estadisticas, IA, dificultad o persistencia.
- Assets externos, dependencias, modulos ES o build step.

## Contexto Actual

- `src/fighter.js` crea luchadores con `new Fighter(x, isPlayer1)` y mantiene estado de combate.
- `src/fighter_render.js` dibuja ambos luchadores con la misma silueta base.
- `src/game.js` crea `player1` y `player2` en `startRound()` y `showMainMenu()`.
- `tests/game.test.js` ya valida que `Fighter.draw()` delega render y registra llamadas canvas.
- `Readme.md` documenta funcionalidades implementadas, smoke test y backlog.

## Diseño Propuesto

Usar el booleano existente `isPlayer1` para asignar identidad visual por defecto en el constructor:

- Humano: etiqueta `HUMANO`, acento azul, detalle tipo banda/cinta.
- CPU: etiqueta `CPU`, acento rojo, detalle tipo visor y antena.

Cambios visuales concretos:

- Etiqueta pequeña sobre cada luchador.
- Sombra/acento bajo los pies con color de personaje.
- Puños y pies con acento de personaje.
- CPU con visor rectangular y antena simple.
- Humano con banda corta sobre la cabeza.
- Especial y bloqueos pueden reutilizar el color de acento del luchador donde sea seguro.

No se agrega configuracion nueva si no es necesaria; los campos viven en `Fighter` como propiedades simples usadas por el render.

## Archivos A Modificar

- `src/fighter.js`: agregar propiedades visuales por personaje en el constructor.
- `src/fighter_render.js`: dibujar etiquetas, acentos y detalles de identidad.
- `tests/game.test.js`: cubrir que los luchadores tienen identidad visual y que el render escribe etiquetas.
- `Readme.md`: documentar diferenciacion visual de humano/CPU y actualizar backlog.
- `plans/plan_0006_diferenciar_personajes.md`: registrar resultado final.

## Plan De Implementacion

1. Agregar propiedades `label`, `accentColor` y `visualRole` al constructor de `Fighter` segun `isPlayer1`.
2. Actualizar `drawFighter(...)` para dibujar etiqueta, sombra/acento, puños/pies acentuados y detalles humano/CPU.
3. Agregar pruebas unitarias focalizadas para identidad visual y etiquetas renderizadas.
4. Actualizar `Readme.md` con la mejora implementada.
5. Ejecutar validacion automatica completa.

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

Smoke manual recomendado:

- Abrir `http://localhost:8000/src/`.
- Confirmar que en menu y partida el humano muestra acentos azules y etiqueta `HUMANO`.
- Confirmar que la CPU muestra acentos rojos, visor/antena y etiqueta `CPU`.
- Confirmar que golpes, combos, bloqueo, especial y pausa siguen funcionando igual.
- Confirmar que las etiquetas no tapan barras, timer ni mensajes centrales.

## Documentacion

- `Readme.md`: actualizar estado del proyecto, funcionalidades implementadas, smoke test y backlog.
- `AGENTS.md`: no requiere cambios porque no cambian comandos, arquitectura persistente ni flujo de validacion.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: ensuciar visualmente el canvas. Mitigacion: etiquetas pequenas y acentos debajo/sobre el luchador, lejos del HUD.
- Riesgo: romper render al reflejar luchadores con `ctx.scale(-1, 1)`. Mitigacion: dibujar detalles dentro del transform existente y validar con pruebas de llamadas canvas.
- Riesgo: introducir cambios de gameplay accidentalmente. Mitigacion: tocar solo propiedades visuales y render; no modificar hitboxes, ataques ni IA.
- Riesgo: sobrecomplicar con configuracion prematura. Mitigacion: usar propiedades simples derivadas de `isPlayer1`.

## Validacion Del Plan Con Skill

Revision con `karpathy-guidelines`:

- Simplicidad: la solucion usa campos simples en `Fighter` y no agrega sistemas de seleccion ni configuracion externa.
- Cambios quirurgicos: solo constructor, render, pruebas, README y este plan.
- Suposiciones explicitas: diferenciacion visual fija para humano/CPU; no cambia gameplay.
- Verificabilidad: pruebas unitarias revisan identidad/etiquetas y validacion completa debe pasar.
- Sin dependencias externas: se mantiene HTML/CSS/JS puro sin build step.

## Criterios De Aceptacion

- El humano y la CPU tienen etiquetas visibles y colores de acento distintos.
- La CPU tiene al menos un detalle visual propio tipo visor/antena.
- El humano tiene al menos un detalle visual propio tipo banda/cinta.
- El cambio no modifica ataques, hitboxes, IA, controles ni reglas de victoria.
- `Readme.md` refleja la mejora.
- La validacion automatica completa pasa.

## Commit Y Push

Un solo commit recomendado: `Differentiate player and CPU visuals`.

Hacer push solo si el usuario lo pide.

## Resultado

- Agregadas propiedades visuales por luchador: `label`, `accentColor` y `visualRole`.
- El humano renderiza etiqueta `HUMANO`, acento azul y banda/cinta en la cabeza.
- La CPU renderiza etiqueta `CPU`, acento rojo, visor y antena.
- Puños, pies, sombra bajo los pies y especial reutilizan el acento del personaje.
- Agregadas pruebas para identidad visual y etiquetas renderizadas.
- Actualizado `Readme.md` con la mejora y el smoke manual.
