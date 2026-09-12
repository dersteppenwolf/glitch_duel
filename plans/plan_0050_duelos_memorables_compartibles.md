# plan_0050_duelos_memorables_compartibles — Viñetas, retos y variedad táctica

**Fecha:** 2026-09-12
**Estado:** implementación entregada; validación de descarga física y Web Share pendiente

Este ExecPlan sigue `PLANS.md`. La instrucción «ejecute lo sugerido» autoriza las seis mejoras propuestas y tarjeta/retos, incluido el experimento neutral de plan 0045.

## Propósito y alcance

Crear finales reconocibles, humor ligado a eventos reales, poses legibles, variedad neutral y señuelos/esquinas con contrajuego. Exportar una tarjeta PNG local y compartir un enlace que reproduce configuración y seed, no una repetición de inputs. Preservar daño, hitboxes, cooldowns, controles, fixed-step, accesibilidad y prioridad táctica. Sin dependencias, ML, personalidades, memoria entre rondas, telemetría, publicación ni envío automático.

## Progreso

- [x] 2026-09-12: inspección de contrato, plan 0045, implementación y tests; árbol inicial limpio.
- [x] Viñeta KO, cartelas semánticas y poses.
- [x] Tarjeta exportable, compartir y retos versionados.
- [x] Selector neutral acotado y ajuste de distancia/esquina.
- [x] Tests enfocados, documentación y revisión final; comprobaciones de navegador registradas solo en plan 0043.
- [ ] Confirmar descarga física de PNG y diálogo nativo Web Share en navegador convencional (plan 0043).

## Contexto actual

`Fighter.attack` resuelve contacto de inmediato con cajas reales y emite `attackResolved`. `finishRound` asigna poses y detiene simulación; la transición de presentación entre rondas ya usa un timeout. `drawFighter` consume propiedades de presentación y no muta el Fighter. `game.js` mantiene semilla, configuración, resultados y eventos. `chooseAIAction` tiene tácticas first-match y un tramo neutral final. Cada decisión consume dos muestras RNG (cadencia/acción). Efectos y temporizadores avanzan en pasos fijos. El resultado es un diálogo nativo con medalla y resumen.

## Diseño y plan de trabajo

1. Capturar únicamente propiedades primitivas de luchadores al KO antes de poses de cierre; el render reutiliza `drawFighter` y dibuja borde/sello estático. Un resultado por tiempo no finge KO. Cartelas anti-air/whiff derivan de contacto real y estado del defensor capturado antes del hit; cooldown cosmético acotado dentro de fixed-step. Poses de guardia, extensión y retroceso solo gráficas.
2. Renderizar una tarjeta de Canvas con escena congelada, marca, marcador, rival, medalla y configuración. Previsualización y descarga PNG; Web Share con archivo si está soportado, texto/enlace como alternativa. Cancelar no provoca otro envío; fallback de copia manual y mensajes locales. Retos validan versión, seed uint32 y enumeraciones; abren menú sin iniciar automáticamente. Arcade enlaza la carrera completa desde su semilla inicial, no una pelea intermedia.
3. Seguir plan 0045 para pesos derivados de cutoffs, multiplicador 0.5, una decisión previa y dos draws RNG. Preservar close-wall y tácticas; temporalidad de señuelos y freno de acercamiento usan el timer actual, sin colas ni nuevo estado de IA. Acotar retirada de cebo a una distancia configurada; detener acercamiento al entrar en rango para no empujar sin control hacia esquina, sin fabricar golpes adicionales.
4. Tests de eventos/KO/reset, enlace válido/inválido, export/share/cancel/fallback, fronteras de pesos, legalidad, prioridades, lifecycle, RNG y trazas FPS. Evidencia de navegador exclusivamente en plan 0043.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`:

    Get-ChildItem -LiteralPath src -Filter '*.js' | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    node --check tests/game.test.js
    node --test tests/game.test.js
    git diff --check
    python -m http.server 8000

## Validación, aceptación y evidencia

Suite completa debe aprobar y nuevas pruebas deben demostrar legalidad, prioridad táctica, número RNG estable, igualdad 30/60/120 y ausencia de avance de combate en resultado/render. URL inválida no cambia selecciones ni inicia combate. Tarjetas usan solo datos del juego. Prueba breve de navegador: finales KO/tiempo, movimiento reducido, menú de reto, descarga/copia locales y CPU de tres dificultades; no enviar a contactos ni publicar. Fixtures temporales se eliminan. No afirmar viralidad, justicia percibida ni validación de hardware por tests.

## Riesgos, idempotencia y recuperación

Snapshot y archivo acotados a un resultado, liberados en reset. Compartir depende de gesto y capacidades; no forzar permisos. La semilla reproduce esta versión, no trazas históricas; enlace incluye versión. La preferencia de movimiento reducido sigue siendo del usuario y puede alterar hitstop. Revisar pools sin opciones y fronteras, conservar garantías de tácticas antes de neutral. Repetir tests es seguro; revertir solo diff propio ante regresión. El mensaje posterior «commit push» autoriza commit y envío al remoto del repositorio.

## Registro de decisiones

- Decisión: ejecutar selector de plan 0045 y acotar ajustes de distancia en ejecución, sin nuevas tácticas ni memoria adicional.
  Justificación: autorización explícita y reutilización de estados/timers existentes.
  Fecha/autor: 2026-09-12, Codex.
- Decisión: tarjeta PNG local y retos de configuración versionados; Arcade reinicia carrera completa.
  Justificación: funciona sin backend ni recorder, no promete replay exacto.
  Fecha/autor: 2026-09-12, Codex.

## Resultados y retrospectiva

Implementados selector neutral, distancia acotada, poses, viñeta, cartelas de contacto, tarjeta y retos sin dependencias ni cambios a controles, daño o hitboxes. Node 24.15.0: sintaxis de todos los scripts y tests aprobada; suite completa 195/195, sin fallos. Los tests agregados cubren pools/prioridades, dos muestras RNG, lifecycle y equivalencia FPS; contactos/snapshots; validación de enlaces; exportación, cancelación, fallback y callbacks tardíos. La revisión de código confirma presentación separada del combate. La comprobación de compatibilidad pendiente queda en plan 0043 y no se declara completado el plan mientras falte. No se afirma viralidad ni balance validado por jugadores.

## Notas de revisión

- 2026-09-12: plan tras inspección; plan 0045 aporta los contratos del selector, los demás cambios tienen alcance autorizado separado aquí.
- 2026-09-12: implementación y revisión; protección de callbacks tardíos y cartelas que excluyen rivales ya aturdidos. Commit/push autorizado posteriormente por el usuario. Compatibilidad nativa pendiente explícita.
