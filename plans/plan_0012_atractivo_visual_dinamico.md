# Exec Plan: Atractivo Visual Dinamico

## Objetivo

Implementar tres mejoras visuales acotadas para que el juego se sienta mas atractivo: personalidad visual de CPU segun dificultad, detalles animados ligeros en arenas y un hit-freeze mas estilizado.

La experiencia cambia en que la dificultad se lee visualmente en la CPU, los fondos se sienten menos estaticos y los impactos fuertes tienen mas presencia grafica. Queda fuera del alcance cambiar dano, hitboxes, IA, cooldowns, controles, rondas, sonidos o persistencia.

## Contexto Actual

- `src/fighter_render.js` ya diferencia humano/CPU con placas `P1`/`AI`, acentos, visor y antena.
- `src/game.js` maneja `selectedDifficulty`, `reducedMotionEnabled`, `screenShake`, `hitStopFrames`, `impactParticles` y `drawBackground()`.
- `triggerImpactFeedback(...)` centraliza shake, hit-stop y particulas; es el punto correcto para registrar un flash visual de impacto.
- Las arenas se dibujan con primitivas canvas en funciones `draw*Details(...)` y no afectan reglas de combate.
- `tests/game.test.js` expone `drawBackground`, `setDifficulty`, `triggerImpactFeedback`, `setReducedMotion` y estado interno suficiente para validar cambios visuales sin navegador real.

## Diseño Propuesto

- Agregar contador visual global `visualFrame` que avance en `draw()` y sirva para detalles animados.
- Respetar `Reducir movimiento`: cuando este activo, las arenas usan fase fija y el hit-freeze estilizado no se activa.
- Agregar `impactFlash` en `triggerImpactFeedback(...)` para recordar posicion, color, direccion y timer del ultimo impacto no reducido.
- Dibujar `drawImpactFlash()` despues de luchadores/particulas con lineas radiales y aro breve; no cambia hit-stop ni shake existentes.
- En `fighter_render.js`, agregar detalles extra solo para CPU segun `selectedDifficulty`:
  - `easy`: visor pequeño/confundido y texto `?`.
  - `normal`: aspecto actual con pequeño led.
  - `hard`: visor mas agresivo, antena doble y aura roja.
- Animar detalles simples en arenas existentes y nuevas con `visualFrame`: cursor de terminal, vapor de cafeteria, indicador `REC`, luz de servidor, etc.
- Mantener todo en coordenadas logicas `1000x500` y sin dependencias.

## Archivos A Modificar

- `src/game.js`: `visualFrame`, `impactFlash`, overlay de hit-freeze y fases animadas de arenas.
- `src/fighter_render.js`: detalles de CPU por dificultad.
- `tests/game.test.js`: exponer nuevo estado y validar CPU por dificultad, impact flash y animacion/reduced motion.
- `Readme.md`: documentar CPU visual por dificultad, fondos animados y hit-freeze estilizado.

## Plan De Implementacion

1. Agregar `visualFrame` e `impactFlash` en `src/game.js`.
2. Actualizar `triggerImpactFeedback(...)`, `updateEffects()` y `draw()` para manejar overlay grafico de impacto.
3. Introducir helper `getArenaMotionFrame()` y usarlo en detalles animados pequenos de arenas seleccionadas.
4. Agregar helpers en `src/fighter_render.js` para personalidad visual de CPU por dificultad.
5. Actualizar tests para validar que hay diferencias por dificultad, que `impactFlash` se crea y que `Reducir movimiento` lo evita.
6. Actualizar `Readme.md`.
7. Ejecutar validacion completa.

## Pruebas Y Validacion

```powershell
git diff --check
node --check src\i18n.js
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Smoke test manual:

- Cambiar dificultad y confirmar que la CPU cambia visualmente sin cambiar controles.
- Probar varias arenas y confirmar detalles animados sutiles.
- Activar `Reducir movimiento` y confirmar que animaciones/flash se reducen.
- Conectar golpes y confirmar lineas/aro de impacto durante el hit-freeze.
- Confirmar que dano, rounds, timer y controles siguen igual.

## Documentacion

- `Readme.md`: actualizar seccion visual/audio.
- `AGENTS.md`: no requiere cambios; no cambian comandos ni arquitectura.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: sobrecargar `drawBackground()` con animaciones. Mitigacion: solo primitivas simples y fase derivada de un contador global.
- Riesgo: mareo o exceso visual. Mitigacion: respetar `reducedMotionEnabled` para usar fase fija y evitar `impactFlash`.
- Riesgo: acoplar render a dificultad global. Mitigacion: lectura directa y defensiva de `selectedDifficulty` solo para decoracion de CPU.
- Riesgo: tests fragiles por animacion. Mitigacion: validar presencia de llamadas/textos/estado, no pixeles exactos.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de finalizar el plan.

Revision aplicada:

- El alcance se mantiene visual y quirurgico.
- No se agregan dependencias externas.
- No se modifica gameplay, IA ni reglas.
- Los criterios de aceptacion son observables y testeables.
- Se descarta implementar sistemas grandes de particulas o animacion por entidad.

## Criterios De Aceptacion

- CPU facil, normal y dificil muestran detalles visuales distintos.
- Arenas tienen detalles animados ligeros y se estabilizan con `Reducir movimiento`.
- Impactos no bloqueados crean `impactFlash` y dibujan overlay de hit-freeze.
- Con `Reducir movimiento`, `impactFlash` no se activa.
- README refleja las mejoras visuales.
- Validacion automatica completa pasa.

## Commit Y Push

- Commit sugerido: `Add dynamic visual polish`.
- Push solo si el usuario lo solicita explicitamente.

## Estado De Ejecucion

- Implementado localmente.
- Validacion automatica ejecutada: `44 passed`, `0 failed`.
- Pendiente de commit/push al momento de esta actualizacion.
