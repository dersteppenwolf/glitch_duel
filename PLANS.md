# Exec Plans

Este archivo define el estandar para planear cambios no triviales en `xkcd KOMBAT`.

Un exec plan debe ser suficientemente concreto para que otra sesion pueda ejecutarlo sin redescubrir contexto, pero no debe convertirse en una especificacion larga o teorica.

## Cuando Usar Un Exec Plan

Usar exec plan para cambios que cumplan al menos una condicion:

- Tocan mas de un archivo principal.
- Cambian reglas de combate, estados del juego, controles, rondas, temporizador, IA o persistencia.
- Requieren nuevas pruebas unitarias.
- Cambian el flujo documentado en `Readme.md` o instrucciones en `AGENTS.md`.
- Se implementaran en varios commits o pasos secuenciales.

No usar exec plan para cambios pequenos como corregir texto, ajustar un valor visual aislado o actualizar una linea de documentacion.

## Principios

- Mantener el proyecto sin dependencias externas salvo decision explicita de arquitectura.
- Usar APIs nativas de navegador y Node.js.
- Mantener coordenadas de simulacion en el espacio logico `1000x500`.
- Mantener textos de UI en español.
- Preferir cambios pequenos, verificables y faciles de revertir.
- Actualizar `Readme.md` cuando cambien comandos, controles, estados, pruebas o funcionalidades.
- Actualizar `AGENTS.md` cuando cambien instrucciones que futuras sesiones puedan olvidar.

## Ubicacion Y Nombre De Archivos

- Todo archivo de plan o ExecPlan debe generarse y mantenerse dentro de `plans/`.
- Todo nuevo archivo de plan o ExecPlan debe seguir el formato `plans/plan_<nnnn>_<objetivo>.md`.
- `<nnnn>` debe ser un identificador incremental con ceros a la izquierda.
- El primer plan debe usar `0001`, el segundo `0002`, y asi sucesivamente.
- `<objetivo>` debe ser corto, en minusculas y separado por guiones bajos.
- Antes de crear un plan nuevo, revisar los archivos existentes en `plans/` para elegir el siguiente numero disponible.

Ejemplo:

```text
plans/plan_0001_catalogo_busqueda_mvp.md
```

## Formato Requerido

Cada exec plan debe incluir estas secciones:

### 1. Objetivo

Descripcion breve del resultado esperado.

Debe responder:

- Que mejora se implementa.
- Que experiencia del jugador cambia.
- Que queda explicitamente fuera del alcance.

### 2. Contexto Actual

Resumen de los archivos y comportamientos existentes que importan para el cambio.

Incluir referencias como:

- `src/config.js` para constantes, ataques, dificultad y arenas.
- `src/fighter.js` para fisica, IA, ataques, hitboxes y dibujo de luchadores.
- `src/game.js` para estados globales, rondas, temporizador, pausa, render y eventos.
- `src/index.html` para estructura de UI.
- `src/styles.css` para layout, overlays y controles tactiles.
- `tests/game.test.js` para pruebas con mocks.

### 3. Diseño Propuesto

Explicar la solucion concreta.

Debe incluir:

- Nuevos estados, constantes o campos si aplica.
- Cambios de controles si aplica.
- Cambios visuales si aplica.
- Cambios de persistencia si aplica.
- Como interactua con `gameState`.
- Como se mantiene compatible con coordenadas logicas `1000x500`.

### 4. Archivos A Modificar

Lista corta de archivos con intencion por archivo.

Ejemplo:

```text
src/config.js      - agregar configuracion del nuevo ataque
src/fighter.js     - ejecutar el ataque y dibujar estado visual
src/game.js        - actualizar estado global o HUD
tests/game.test.js - cubrir regla nueva
Readme.md          - documentar controles y comportamiento
AGENTS.md          - actualizar smoke test si cambia flujo manual
```

### 5. Plan De Implementacion

Pasos ordenados y concretos.

Cada paso debe ser ejecutable y verificable.

Ejemplo:

```text
1. Agregar constantes del ataque en `src/config.js`.
2. Registrar la entrada en `src/fighter.js`.
3. Agregar prueba de daño/cooldown en `tests/game.test.js`.
4. Actualizar README y smoke test.
5. Ejecutar validacion completa.
```

### 6. Pruebas Y Validacion

Debe indicar comandos exactos.

Validacion minima para cambios de codigo:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Si el cambio es visual o de jugabilidad, agregar checklist manual especifico.

### 7. Documentacion

Indicar que se actualizara.

Usar esta guia:

- `Readme.md`: cambios de controles, comandos, estados, pruebas, funcionalidades, backlog o flujo.
- `AGENTS.md`: cambios que futuras sesiones podrian olvidar, especialmente smoke test, arquitectura, comandos o restricciones.
- `PLANS.md`: solo si cambia el estandar de planificacion.

### 8. Riesgos Y Mitigaciones

Listar riesgos reales del cambio.

Ejemplos:

- Puede romper controles moviles.
- Puede desbalancear cooldowns.
- Puede interferir con `paused` o `roundOver`.
- Puede requerir actualizar mocks de pruebas.

Cada riesgo debe tener mitigacion concreta.

### 9. Validacion Del Plan Con Skill

Antes de finalizar cualquier ExecPlan, cargar y aplicar la skill `karpathy-guidelines` para revisar el cambio propuesto.

La revision debe confirmar:

- Que el plan no sobrecomplica la solucion.
- Que los cambios son quirurgicos y verificables.
- Que las suposiciones importantes estan explicitas.
- Que los criterios de aceptacion son comprobables.
- Que no se introducen dependencias externas sin decision de arquitectura.

Si la revision detecta sobrealcance, reducir el plan antes de ejecutarlo.

### 10. Criterios De Aceptacion

Checklist final observable.

Ejemplo:

```text
- La nueva accion funciona en teclado.
- Si aplica, la accion funciona en tactil.
- Las pruebas unitarias cubren la regla principal.
- README refleja el comportamiento.
- Validacion automatica pasa completa.
```

### 11. Commit Y Push

Si el usuario pidio commits por paso, el plan debe indicar el limite de cada commit.

Regla recomendada:

- Un commit por mejora funcional completa.
- No mezclar refactors grandes con cambios de gameplay salvo que el usuario lo pida o sea necesario.
- Ejecutar validacion antes de cada commit.
- Hacer push despues de cada commit si el usuario lo pidio.

## Plantilla

```markdown
# Exec Plan: <nombre corto>

## Objetivo

<resultado esperado y fuera de alcance>

## Contexto Actual

<archivos y comportamiento relevante>

## Diseño Propuesto

<solucion concreta>

## Archivos A Modificar

- `<archivo>`: <intencion>

## Plan De Implementacion

1. <paso>
2. <paso>
3. <paso>

## Pruebas Y Validacion

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Smoke test manual:

- <item>

## Documentacion

- `Readme.md`: <cambios>
- `AGENTS.md`: <cambios si aplica>

## Riesgos Y Mitigaciones

- Riesgo: <riesgo>. Mitigacion: <mitigacion>.

## Validacion Del Plan Con Skill

- Cargar `karpathy-guidelines`.
- Revisar alcance, suposiciones, simplicidad y verificabilidad.
- Ajustar el plan si la revision detecta sobrecomplicacion.

## Criterios De Aceptacion

- <criterio>

## Commit Y Push

- Commit: `<mensaje sugerido>`
- Push: <si/no, segun pedido del usuario>
```

## Ejemplo Resumido

```markdown
# Exec Plan: Back Kick

## Objetivo

Agregar combo `K, K` como back kick. No se agregan nuevas teclas ni se rediseña el sistema de combos.

## Contexto Actual

Los combos actuales viven en `src/fighter.js` con `comboBuffer`. Los ataques estan configurados en `src/config.js` dentro de `ATTACKS`.

## Diseño Propuesto

Agregar `backKick` en `ATTACKS`, detectar `kick,kick` en `handleAttackCommand()`, reutilizar animacion de patada inicialmente y agregar prueba unitaria.

## Archivos A Modificar

- `src/config.js`: agregar valores de `backKick`.
- `src/fighter.js`: detectar combo `K, K`.
- `tests/game.test.js`: probar daño y cooldown.
- `Readme.md`: documentar combo.
- `AGENTS.md`: actualizar smoke test si aplica.

## Plan De Implementacion

1. Agregar `backKick` en `ATTACKS`.
2. Agregar deteccion `kick,kick`.
3. Agregar prueba unitaria.
4. Documentar combo.
5. Ejecutar validacion completa.

## Pruebas Y Validacion

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

## Criterios De Aceptacion

- `K, K` ejecuta back kick.
- El ataque aplica daño esperado.
- No rompe `J, J`, `J, K`, `K` ni especial.
- README documenta el nuevo combo.
```
