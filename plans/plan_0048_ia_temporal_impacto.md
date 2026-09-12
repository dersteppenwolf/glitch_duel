# plan_0048_ia_temporal_impacto - IA alcanzable y lectura del combate

**Fecha:** 2026-09-11
**Ámbito:** IA, configuración, efectos, HUD y pruebas
**Estado:** completado

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Propósito y alcance

Mejorar antiaéreos, castigos durante recuperación, esquinas y lectura visual conservando controles, daño, cadencias y estilo line-art. Sin dependencias, personalidades, memoria entre rondas ni cambios de arquitectura.

## Progreso

- [x] 2026-09-11: inspeccionados contrato, simulación, IA, renderizadores y pruebas existentes.
- [x] 2026-09-11: decisiones temporales, esquinas y pausa tras hit con pruebas focalizadas.
- [x] 2026-09-11: feedback, HUD autoritativo y presentación de resultado implementados.
- [x] 2026-09-11: comprobación de navegador documentada exclusivamente en plan 0043.
- [x] 2026-09-11: Node 24.15.0, sintaxis de todos los scripts y tests, 174/174 pruebas y `git diff --check` correctos; fixtures retirados.

## Contexto actual

`Fighter.attack` resuelve impactos inmediatamente usando hitboxes reales. `updateAI` consume una oportunidad por secuencia de fallo, pero el acercamiento no considera recuperación ni la cadencia siguiente. `chooseAIAction` contiene prioridades protegidas de defensa, patrones y presión tardía. `updateEffects` se ejecuta en pasos fijos; `draw` todavía reduce shake por render. HUD y efectos ya incluyen hitstop, líneas y especial, y se ampliarán sin duplicar reglas de combate.

## Diseño y plan de trabajo

1. Proyectar de forma acotada cajas existentes usando velocidades observadas y gravedad compartida. Un castigo permitido se revalida cada paso hasta alcanzar o perder la ventana; no vuelve a sortearse. Antiaéreos se eligen en la cadencia normal, se cancelan si dejan de ser alcanzables y atacan únicamente con intersección real.
2. Escapar de esquinas saltando hacia el centro cuando no hay ataque activo, conservar defensa/contraataque y añadir presión probabilística. Una pausa breve tras hit-stun deja respirar el combate sin nueva memoria de patrones.
3. Reutilizar partículas para formas distintas de hit/block/whiff, contener shake y flash, añadir señales geométricas de especial y peligro, y pulir resultados sin nuevas pantallas.
4. Añadir pruebas de límites temporales, cancelación, dificultad, esquinas, movimiento reducido y reproducción por seed. Actualizar `Readme.md`.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`:

    node --version
    Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    node --check tests\game.test.js
    node --test tests\game.test.js
    git diff --check
    python -m http.server 8000

Salida exitosa de sintaxis y suite completa con Node 24. Navegador en `http://localhost:8000/src/?seed=48&debug=1`.

## Validación, aceptación y evidencia

Pruebas: ventana suficiente/insuficiente, trayectoria aérea alcanzable/no alcanzable, una oportunidad por fallo, hitbox real al ejecutar, esquinas simétricas, cadencia y pausa tras golpe, feedback bajo movimiento reducido, seed estable. Conservar toda la suite de tácticas e inputs. Checklist y evidencia real de navegador exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`; mocks no certifican dispositivos ni preferencias humanas.

## Riesgos, idempotencia y recuperación

Las proyecciones son estimaciones de velocidad observada, no lecturas de inputs futuros: revalidar antes de atacar. Evitar loops de escape y efectos que oculten el HUD. Pruebas y servidor son repetibles; revertir únicamente este diff si aparece regresión. Sin cambios remotos ni de persistencia.

## Registro de decisiones

- Decisión: mantener ataques instantáneos y comprobar ventanas con las cajas existentes.
  Justificación: respeta el combate actual y evita introducir startup artificial.
  Fecha/autor: 2026-09-11, Codex.
- Decisión: usar acciones transitorias `punish`/`antiAir` y dos contadores de estado local (pausa y dirección de escape), sin extender la memoria de patrones.
  Justificación: revalidar alcance sin sorteos por tick; permitir contra-juego al cambiar la trayectoria y conservar prioridades existentes.
  Fecha/autor: 2026-09-11, Codex.

## Resultados y retrospectiva

Implementación completa; suite ampliada de 163 a 174 pruebas, todas aprobadas con Node 24.15.0. Sintaxis de `src/*.js` y `tests/game.test.js`, más `git diff --check`, correctos. Se conservaron daño, recuperación, hitstop normal/bloqueo y reglas de entrenamiento. Se actualizaron los identificadores de caché de los assets modificados y su contrato HTML de prueba. La revisión final conserva la posibilidad de evadir ataques normales ya decididos por la CPU; una prueba verifica su whiff y recuperación. Evidencia y límites de navegador únicamente en plan 0043. No hay nuevas dependencias, commits ni publicación. No se difirió ningún punto funcional solicitado; el balance con jugadores y validación física/AT siguen pendientes.

Archivos modificados: `src/ai.js`, `src/config.js`, `src/fighter.js`, `src/effects.js`, `src/fighter_render.js`, `src/hud_render.js`, `src/game.js`, `src/styles.css`, `src/index.html`, `tests/game.test.js`, `Readme.md`, el registro de evidencia 0043 y este plan.

## Notas de revisión

- 2026-09-11: plan inicial tras inspección; prioridades y validación acotadas a la solicitud.
- 2026-09-11: escenarios temporales para inspección controlada del Canvas y trazas del navegador; no se incorporan como feature ni dependencia del proyecto.
