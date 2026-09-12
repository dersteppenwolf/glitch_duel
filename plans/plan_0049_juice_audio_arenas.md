# plan_0049_juice_audio_arenas — Impacto, sonido y escenarios reactivos

**Fecha:** 2026-09-12
**Estado:** implementado y validado dentro del alcance

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Propósito y alcance

Reforzar la sensación de contacto con feedback proporcional, firmas visuales de estilos/rivales, SFX por capas, volumen separado combate/menús y dos arenas cosméticas (Terminal y Azotea). Mantener line-art, controles, IA, hitboxes, daño, recuperación y simulación fija. El aumento moderado de hitstop para combos/especiales está autorizado por esta solicitud. Sin música, dependencias, cambios de Arcade ni filtros costosos de lectura de píxeles.

## Progreso

- [x] Inspeccionados contrato, efectos, audio, renderizadores, menú, backlog y tests; árbol inicial limpio.
- [x] Implementar feedback y firmas con temporizadores acotados.
- [x] Añadir audio por capas y volúmenes persistentes accesibles.
- [x] Integrar dos arenas y reacciones cosméticas.
- [x] Tests focalizados, validación completa, documentación y comprobación de navegador.

## Contexto actual

`Fighter.takeHit` dispara `triggerImpactFeedback` y SFX; `attack` conoce el tipo antes del contacto. `game.js` mantiene hitstop, partículas, flashes y actualiza sus tiempos dentro de `updateEffects`. Los efectos usan RNG cosmético separado. `audio.js` sintetiza osciladores y desconecta grafos idempotentemente, pero usa temporizadores de pared para barrer frecuencia. El menú agrupa preferencias en `menu-utilities`. `arena_render.js` dibuja fondo y foreground de ocho escenarios puramente visuales. El backlog pide volúmenes de combate/UI (#30), reactividad (#36) y más arenas (#42).

## Diseño y plan de trabajo

1. Configurar escalas hit/combo/special/block, límites de partículas/textos y firmas decorativas; reutilizar flashes/partículas. El pixel-sort será un motivo de bandas geométricas local, sin modificar framebuffer o cajas. Textos temáticos en cartelas con tamaño adaptado y sin invadir HUD.
2. Programar envolventes y barridos con el reloj de Web Audio, conservar limpieza idempotente y limitar voces. Añadir capas de barrido, cuerpo y chirrido digital. Dos preferencias 0–100%, persistidas con validación y fallback, sin crear AudioContext al cargar el menú.
3. Reacción única por contacto, decae en pasos fijos y se borra en resets. Dibujarla detrás de luchadores y en periferia, estática bajo movimiento reducido. Integrar Terminal/Azotea en config, selector, traducciones y previews CSS.
4. Tests de intensidad, firmas, acotación, determinismo, pausa/reset, audio/mute/persistencia/limpieza y nuevas arenas. Actualizar README y estados precisos del backlog.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`, Node 24:

    Get-ChildItem -LiteralPath src -Filter '*.js' | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    node --check tests/game.test.js
    node --test tests/game.test.js
    git diff --check
    python -m http.server 8000

## Validación, aceptación y evidencia

Suite completa aprobada con tests focalizados que demuestren efectos proporcionales sin cambios de daño, aislamiento de RNG, expiración/pausa/reset, almacenamiento inválido y silencio por canal, grafos liberados y render de todas las arenas. Comprobar controles nativos, visuales y movimiento reducido en navegador local. Evidencia real, checklist y limitaciones de audio/escucha exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`; no certificar escucha ni dispositivos a partir de mocks.

## Riesgos, idempotencia y recuperación

Evitar saturación visual/sonora mediante límites y envolventes; conservar siluetas legibles y HUD estable. No cambiar cadencias salvo hitstop solicitado. Prever almacenamiento bloqueado y Web Audio ausente/suspendido. Repetir tests/servidor es seguro; retirar fixtures temporales y revertir solo este diff si hay regresión. Sin commit ni publicación.

## Registro de decisiones

- Decisión: dos canales existentes (combate/UI), dos escenarios nuevos y bandas geométricas en lugar de procesamiento de imagen.
  Justificación: alcance concreto y sin dependencias, coste de render acotado y juego legible.
  Fecha/autor: 2026-09-12, Codex.

## Resultados y retrospectiva

Entregadas ocho firmas cosméticas, impacto escalado (5/7/9 pasos para hit/combo/special y 2 para bloqueo), cartelas temáticas acotadas, SFX por capas, volumen combate/UI y dos arenas con reactividad. Sin cambios a IA, daño, hitboxes, recuperación, controles, ruta Arcade o dependencias. Efectos y hitstop mantienen el paso fijo existente.

Validación automatizada: Node 24.15.0, sintaxis de todos los scripts y tests, 185/185 tests aprobados. Se cubren aislamiento de volumen, almacenamiento, envolventes, límite/limpieza de voces, daño intacto, pausas/reset/expiración, movimiento reducido y equivalencia de combate entre arenas. README y backlog actualizados; #30, #36 y #42 implementados, #41 parcial porque quedan medallas.

Archivos modificados: `src/config.js`, `src/audio.js`, `src/effects.js`, `src/fighter.js`, `src/game.js`, `src/hud_render.js`, `src/arena_render.js`, `src/index.html`, `src/styles.css`, `src/i18n.js`, `tests/game.test.js`, `Readme.md`, `BACKLOG.md`, `plans/plan_0043_validacion_humana_consolidada.md` y este plan. `git diff --check` aprobado; fixtures temporales retirados.

Evidencia y límites de la comprobación de navegador/audio exclusivamente en la entrada de plan 0049 de `plan_0043_validacion_humana_consolidada.md`. La revisión motivó versionar los recursos y reservar margen de mezcla. Quedan fuera procesamiento real de píxeles, música, audio espacial y nuevas medallas. Sin commit ni publicación.

## Notas de revisión

- 2026-09-12: plan inicial tras inspección.
- 2026-09-12: implementación, tests y documentación completos; revisión final centrada en invariantes, límites de recursos y separación de audio/cosmética respecto de la simulación.
