# plan_0054_comic_arcade_integral - Pulido visual integral de GLITCH DUEL

**Fecha:** 2026-10-03

**Ámbito:** personajes, HUD, Entrenamiento, menú, diez arenas, intros, resultados y microinteracciones
**Estado:** completado

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Propósito y alcance

Aplicar las ocho mejoras visuales autorizadas con una dirección de cómic arcade de papel/tinta y acentos digitales: figuras legibles sobre fondo oscuro, HUD completo, Entrenamiento integrado, portada ilustrada, identidades corporales/poses, composición propia de las diez arenas, intros/resultados expresivos y microinteracciones. Se conservan dimensiones lógicas, hitboxes, balance, IA, semillas, estados, acciones, compartir y arquitectura sin dependencias. No se añaden mecánicas, persistencia ni assets externos.

## Progreso

- [x] 2026-10-03: inspección de contrato, código, mocks y plan 0053; baseline previa 224 pruebas y sintaxis correctas. Se conserva la evidencia de inspección ya añadida al plan 0043.
- [x] Contraste, HUD simétrico y panel de Entrenamiento integrado; suite completa aprobada tras ajustar Tab al disclosure cerrado.
- [x] Portada SVG ilustrada, accesorios de estilos/rivales y guardia/retroceso/impacto reforzados; revisión visual final pendiente.
- [x] Composición propia de diez arenas y previews ambientales; suite completa aprobada.
- [x] Intros con retratos, resultado/medalla/tarjeta y microinteracciones con movimiento reducido; suite completa aprobada.
- [x] 2026-10-03: siete regresiones nuevas, 231 pruebas aprobadas, sintaxis y diff correctos; revisión acotada de navegador registrada en plan 0043, fixtures retirados y README/backlog actualizados.

## Contexto actual

`src/fighter_render.js` dibuja figuras negras con identidad principalmente alrededor de la cabeza; Servidor Caído necesita un contorno claro. `src/hud_render.js:drawHealthBars()` omite energía CPU; sus tres placas admiten una composición más sencilla. `#training-panel` está posicionado absolutamente fuera de `#arena-shell`, y `resizeCanvas()` solo reserva toolbar/touch. El menú tiene disclosures nativos y un hero pequeño con abreviatura. `drawArenaDetails()` ofrece diez ramas y capas existentes. VS es una placa textual; resultado usa DOM y tarjeta Canvas 1200x900. Tests usan Canvas/DOM simulados; no prueban píxeles.

## Diseño y plan de trabajo

1. Doble trazo claro/oscuro para cuerpo y poses en Servidor; sombras de contacto y accesorios dentro de la figura actual. Dibujar ambas energías, ronda con fichas y reloj central; preservar estados autoritativos y márgenes HUD.
2. Reubicar panel Training dentro de arena-shell bajo Canvas; instrucciones/progreso visibles y administración en details nativo plegable. Reservar su altura medida al redimensionar y recalcular al plegar. Mantener IDs/eventos y reducir tamaño de arena solo cuando sea necesario.
3. Hero SVG decorativo de dos figuras y VS, tematizado por selecciones; no simula combate. Accesorios de cuatro estilos/rivales y poses propias sin cambiar reglas. Retratos geométricos compartidos de presentación para intro/tarjeta.
4. Reutilizar las diez ramas con iluminación, suelo temático y jerarquía de fondo; retirar cuadrícula universal fuera de arenas técnicas. Previews CSS reconocibles con animación ligera y estados sin movimiento.
5. Intros en panel dividido con retratos, resultado con marcador/medalla ilustrada y tarjeta tipo póster. Microinteracciones CSS breves sin retrasar foco ni acciones. Preferencia manual/sistema de movimiento reflejada en raíz para toda la presentación.
6. Añadir pruebas de información HUD, pureza de dibujo, selecciones hero, resize Training, movimiento reducido y datos del resultado. Actualizar README y backlog solo para entregables efectivamente completados.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`:

    Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
    node --check tests\game.test.js
    node --test tests\game.test.js
    git diff --check

Éxito: todos los checks y tests pasan. Para navegador usar el servidor estático existente en puerto 8765 o iniciar `python -m http.server 8765` y abrir `http://localhost:8765/src/`. Versionar CSS/JS editados en HTML para evitar mezcla en caché.

## Validación, aceptación y evidencia

- Pruebas: ambas barras con disponibilidad correcta, render no cambia combat state/RNG, cuatro selecciones hero, reserva Training al plegar/abrir, información completa intro/resultados ES/EN, y suite de seeds/fixed-step existente.
- Checklist navegador: menú con disclosures cerrados y CTA visible; Cuaderno/Servidor/Azotea y otras arenas por selector; Training plegado/abierto sin overlap; HUD CPU/P1; pausa/onboarding; resultados y preview; ES/EN; movimiento reducido manual; móvil/altura corta cuando la herramienta lo permita.
- Evidencia de navegador exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`. Indicar tamaños efectivos y distinguir capturas reales de presets anunciados. No afirmar AT, hardware, playtest ni rendimiento medido sin evidencia.

## Riesgos, idempotencia y recuperación

Accesorios podrían sugerir hitboxes mayores: conservar volumen corporal y coordenadas de golpes. Training puede reducir demasiado Canvas: panel acotado/plegable, altura reservada y pruebas de tamaños. Decoración puede saturar: contraste secundario, centro despejado y presupuesto geométrico limitado. CSS animado respeta manual y sistema. No consumir RNG de simulación al dibujar. Cambios reversibles por archivo/hito; preservar la modificación previa al plan 0043. No requiere migración, commit, push ni despliegue.

## Registro de decisiones

- Decisión: SVG decorativo local para portada y retratos geométricos Canvas para intro/tarjeta.
  Justificación: ilustración real sin segunda simulación, dependencias ni duplicación de combate.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: Training como pie del arena-shell con administración plegable y reserva medida.
  Justificación: corrige superposición de manera estructural y conserva controles/trials.
  Fecha/autor: 2026-10-03, asistente.

## Resultados y retrospectiva

Aplicadas las ocho mejoras: contorno claro/cuerpo y sombras; HUD simétrico con fichas y reloj; footer Training con administración plegable; portada SVG; accesorios y poses de estilos/rivales; iluminación/suelo en diez arenas y previews; intros con retratos, medalla/marcador/tarjeta; microinteracciones y movimiento reducido manual/sistema. Sin dependencias ni cambios de combat rules.

Node.js 24.19.0: sintaxis de todos los scripts y tests correcta; 231 pruebas aprobadas, cero fallos; `git diff --check` aprobado. Las regresiones cubren energía CPU/recovery, selección/restauración/idioma del hero, reserva Training y focus del disclosure, pureza de cuerpos/arenas/RNG, preferencia CSS y datos de resultado, cartela durante VS y reserva touch bajo footer. El contrato HTML valida versiones de recursos sin fijar una fecha que obligue a cambiar el test con cada bust de caché.

Revisión de herramienta con producción y estados controlados: menú/Training/Servidor, atlas de diez arenas, intro y resultado/PNG ES/EN/reduced, viewport efectivo integrado y narrow iframe. Hallazgos y límites exclusivamente en plan 0043. Se corrigieron margen Canvas innecesario, fuente de nombre CPU después de energía, cartela superpuesta a intro y sello sobre escena de tarjeta. No se afirma playtest humano, AT, dispositivos físicos ni rendimiento medido; siguen pendientes las matrices indicadas allí. Los archivos temporales `visual-review*` fueron retirados.

## Notas de revisión

- 2026-10-03: plan inicial para las ocho mejoras autorizadas tras la revisión visual.
- 2026-10-03: implementación y validación terminadas; Training touch mueve la reserva inferior al shell para que el footer permanezca unido al Canvas. Transiciones CSS nativas son suficientes para la entrada de papel sin incorporar API o flujo de estados adicional.
