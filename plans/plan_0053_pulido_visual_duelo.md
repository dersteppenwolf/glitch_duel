# plan_0053_pulido_visual_duelo - Reforzar la identidad visual del duelo

**Fecha:** 2026-09-23  
**Ámbito:** rivales, arenas, impactos, HUD, menú y tarjeta de resultado  
**Estado:** implementado

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Propósito y alcance

Hacer más atractivos y reconocibles los combates de GLITCH DUEL mediante las seis mejoras solicitadas, **en el orden 2 → 3 → 4 → 5 → 1 → 6**: siluetas de los cuatro rivales, profundidad de las diez arenas, firmas de impacto legibles, jerarquía del HUD, ilustración de duelo en el menú y tarjeta de resultado con composición de póster. Cada hito debe ser comprobable y dejar el juego utilizable.

Se conserva la estética de papel/tinta con acentos cian, magenta y amarillo, la UI española con traducción inglesa, el Canvas lógico `1000x500`, la arquitectura estática y los flujos actuales. Quedan fuera de alcance personajes, arenas, ataques o modos nuevos; assets o dependencias externas; cambios a daño, hitboxes, IA, física, RNG de simulación, controles, estados, almacenamiento, semilla, versión de reglas o mecánica de compartir. No se agregan destellos a pantalla completa ni animaciones obligatorias. Los enlaces de reto siguen siendo configuración versionada, no repeticiones.

## Progreso

- [x] 2026-09-23: revisados código, pruebas, README, contratos y planes previos; identificado que las seis áreas ya tienen infraestructura visual.
- [x] Hito 2: reforzar las siluetas de los cuatro rivales.
- [x] Hito 3: profundizar la composición de las diez arenas.
- [x] Hito 4: mejorar la lectura de las firmas de impacto.
- [x] Hito 5: pulir la jerarquía del HUD a tamaño normal y compacto.
- [x] Hito 1: incorporar una ilustración de duelo al menú sin ocultar la acción principal.
- [x] Hito 6: componer una tarjeta de resultado más expresiva sin cambiar exportación ni enlaces.
- [ ] Validar, documentar el resultado y registrar solo la evidencia real en el plan 0043.

## Contexto actual

- `src/fighter_render.js`: `drawFighter()` dibuja un cuerpo de trazos común y `drawCpuRivalDetail()` diferencia `pointer`, `lag`, `merge` y `boss` principalmente alrededor de la cabeza. La dificultad también cambia visor/antenas; `Fighter.applyRival()` en `src/fighter.js` configura identidad sin tocar balance. `CPU_RIVALS` en `src/config.js` define cuatro colores/rasgos. Los badges, poses finales y estados de combate ya existen.
- `src/arena_render.js`: `drawBackground()` y `drawArenaForeground()` ya implementan diez arenas con detalles por escenario, primer plano periférico y reacción al contacto. `src/game.js:draw()` ordena fondo → luchadores → primer plano → efectos → HUD. La zona del HUD termina alrededor de `HUD_SAFE_BOTTOM = 112`; la línea de suelo está en `GROUND_Y + 35`.
- `src/effects.js`: `drawCombatSignature()` ya tiene ocho patrones para estilos/rivales. `src/game.js:triggerImpactFeedback()` usa una firma en combos y especiales, pero el flash del golpe normal lleva `signature: null`. Los escudos de bloqueo, arcos de fallo, partículas, límites de presupuesto y movimiento reducido están implementados; sus temporizadores avanzan en el paso fijo.
- `src/hud_render.js`: `drawHealthBars()` muestra placas de papel, vida, energía, ronda, marcador y reloj. `resizeCanvas()` en `src/game.js` activa `hudCompactMode` cuando el ancho CSS es menor que 650 px; el modo compacto sustituye el nombre del rival por `CPU`. Existen `getSpecialActionState()`, avisos de peligro, señales no dependientes del color y `#combat-status` consultable, no-live.
- `src/index.html` / `src/styles.css`: el menú tiene CTA visible, resumen de cuatro selecciones y `<details>` cerrados para configuración/utilidades. `#arena-preview` y las descripciones de estilo/rival viven dentro de configuración; falta una imagen protagonista del enfrentamiento en la primera vista. `setArena()`, `setFighterStyle()`, `setRival()`, `renderLanguage()` y `restoreArcadeMenuSelection()` actualizan selecciones en `src/game.js`.
- `src/hud_render.js:drawResultCard()` ya dibuja una PNG `1200x900` con escena, marcador, medalla y metadatos; `getResultCardData()` también ofrece un `stamp` que la tarjeta aún no usa. `src/game.js` conserva previsualización, `toBlob`, descarga, Web Share, generación de resultado y protección de callbacks tardíos. La revisión física pendiente de descarga/Web Share está en `plans/plan_0043_validacion_humana_consolidada.md`.
- `tests/game.test.js` usa `node:test` y mocks DOM/Canvas; comprueba identidad, fondos, firmas, HUD compacto, límites, seed, exportación y share, pero no la apariencia real de los píxeles. Los planes 0030, 0034, 0035, 0049 y 0050 entregaron las bases: este trabajo las pule y no las reimplementa.

## Diseño y plan de trabajo

### Hito 2 — Siluetas de rivales

En `src/fighter_render.js`, ampliar el dibujo CPU en reposo y estados de ataque/bloqueo/agachado mediante rasgos de contorno acotados a cabeza y torso superior, reutilizando `rivalDetail`: NULL POINTER con corte angular/cursor; LAG SPIKE con contorno segmentado y pequeño eco fijo; MERGE CONFLICT con hombros bifurcados/cruces; BOSS 500 con casco y hombros más cuadrados. Mantener explícitos el badge/nombre, el visor por dificultad y los estados de ataque. Limitar extensiones visuales al volumen actual del luchador para no sugerir un alcance de golpe o hurtbox nuevos. Preferir helpers locales de dibujo y reutilizar `ctx.save()/restore()`; no introducir propiedades de simulación ni nuevas animaciones temporizadas. Comprobar cada variante en reposo, bloqueo, agachado, aire y poses finales, incluidos los extremos del escenario.

### Hito 3 — Profundidad de las arenas

Revisar los diez bloques de `drawArenaDetails()` y `drawArenaForeground()` en `src/arena_render.js`: diferenciar las masas lejanas, el plano medio temático y detalles bajos de borde sin añadir capas ni escenario nuevo. Aplicar primero a Cuaderno y Servidor Caído (fondos claro/oscuro), y extender el mismo criterio a las otras ocho arenas. Ejemplos: papel y márgenes a distintas escalas, ventanales y siluetas de mobiliario en Cafetería/Laboratorio/Reuniones, pupitres/público/racks/esquinas de terminal/silueta urbana en los demás. Reducir contraste y grosor de las formas lejanas; preservar contraste de P1/CPU, proyectiles visuales, cartelas y HUD. Conservar movimiento ambiental ligero mediante `getArenaMotionFrame()` y reacciones estacionarias al activar movimiento reducido. Evitar cachés de canvas o parallax salvo medición que lo justifique.

### Hito 4 — Firmas de impacto

Conservar `COMBAT_SIGNATURES` y la diferencia existente entre golpe, combo, especial, bloqueo y fallo. En `src/game.js:triggerImpactFeedback()`, permitir que un golpe normal no bloqueado lleve la firma del atacante en su flash breve. Hoy el golpe normal con movimiento reducido no crea flash: en ese caso crear únicamente la firma estática y temporal mediante el mismo estado acotado, sin añadir sacudida, expansión ni hitstop. `drawCombatSignature()` en `src/effects.js` debe mantener las formas reconocibles a escala pequeña y no competir con la silueta central de contacto. Ajustar espaciado/opacidad y orden de dibujo, no la cantidad de partículas ni las duraciones. Bloqueo sigue siendo escudo y fallo arco roto. El render usa solo `randomCosmetic()` cuando ya corresponde; no consume `randomSimulation()` ni modifica eventos de combate.

### Hito 5 — Jerarquía del HUD

En `src/hud_render.js`, afinar contraste y ritmo visual de las tres placas: vida como lectura principal, tiempo central, energía y marcador secundarios. En `hudCompactMode`, priorizar porcentajes, tiempo y señales de vida peligrosa/especial listo; comunicar identidad del rival por acento **y** distintivo de forma o texto corto cuando el nombre completo no quepa. El nombre completo continúa en `#combat-status`. Mantener valores, placa de fondo, triángulo `!`, rombo del especial, `getSpecialActionState()` y el render exclusivo de disponibilidad táctil en `renderTouchSpecialState()`. No mover las zonas de combate ni aumentar la banda HUD por debajo de su margen seguro. Comprobar texto ES/EN y `MERGE CONFLICT` sobre Cuaderno y Servidor Caído a tamaños de canvas normales y compactos.

### Hito 1 — Imagen protagonista del menú

Agregar una franja ilustrada compacta `P1 VS rival` dentro de `#main-menu .main-menu-card`, visible con los `<details>` cerrados y cercana al título/resumen, con CTA aún destacado en el primer pantallazo. Reutilizar papel/tinta, acento de `CPU_RIVALS` y los cuatro motivos de contorno del hito 2. Preferir formas decorativas ligeras HTML/CSS y un único `VS` textual; no crear una segunda simulación de luchadores ni duplicar reglas de combate. La ilustración se marca decorativa para tecnología asistiva; el nombre del rival y la configuración siguen en el texto existente. Una pequeña función de presentación en `src/game.js` actualiza clase/acento desde las claves validadas `selectedRival`/`selectedFighterStyle`/`selectedArena`, invocada tras selecciones, cambio de idioma y restauración de Arcade; `#match-configuration-summary` continúa derivándose únicamente de sus cuatro selecciones. Conservar selectores, foco, onboarding y el estado inicialmente cerrado de ambos `<details>`. Ajustar `src/styles.css` para 1366×768, 390×844, 844×390, 200 % de zoom y movimiento reducido, sin provocar overflow horizontal ni desplazar `JUGAR AHORA` detrás de decoración en el tamaño de referencia.

### Hito 6 — Tarjeta tipo póster

En `src/hud_render.js:drawResultCard()`, mantener el mismo canvas `1200x900` y `scene` ya capturada; componer cabecera, escena, sello `data.stamp`, resultado/medalla y franja inferior de rival/configuración/seed con jerarquía de póster. Usar `measureText()`/ancho máximo para ES/EN y cadenas largas, y acentos existentes sin hacer depender la lectura del color. En `src/styles.css`, ajustar solo previsualización/panel si la nueva composición lo requiere. La información accesible de resultado sigue en DOM; el canvas mantiene su nombre localizado. `src/game.js:renderResultCard()`/compartir/descargar y `DUEL_RULES_VERSION` permanecen sin cambio funcional. Confirmar resultado KO y por tiempo, victoria y derrota, Versus/Arcade; reset libera la tarjeta y callbacks viejos no reviven el resultado.

Al implementar cada hito, añadir solamente pruebas focalizadas para contratos que los mocks pueden observar; actualizar `Readme.md` con las mejoras efectivamente entregadas, y versionar los recursos editados en `src/index.html` si hace falta evitar una mezcla de CSS/JS en caché. No declarar validación visual a partir de primitivas de mock.

## Pasos concretos

Desde la raíz del repositorio `C:\opt\personal\glitch_duel`, antes de modificar código ejecutar la línea base; repetirla tras cada hito con cambios JavaScript y al final:

    Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    node --test tests\game.test.js
    git diff --check

Éxito: salida sin fallos ni errores de sintaxis/espacios; cualquier fallo se investiga antes del siguiente hito. Para inspección manual, desde la misma raíz:

    python -m http.server 8000

Abrir `http://localhost:8000/src/` y recorrer menú → Versus/Training/Arcade → pausa → resultado con ES/EN y movimiento reducido activado/desactivado. No se requiere instalación. Actualizar `Progreso` al cerrar cada hito y no declarar el plan completado hasta la validación final.

## Validación, aceptación y evidencia

| Requisito | Comprobación automatizable | Comprobación visual/manual enfocada |
| --- | --- | --- |
| 2, rivales | Cuatro claves producen detalles distintos; dibujar no cambia salud, hitboxes, estados, dificultad ni RNG; badges permanecen dentro de márgenes. | Las cuatro siluetas se distinguen por forma sin leer el nombre, en idle/bloqueo/aire/KO y en ambas esquinas. |
| 3, arenas | Cada una de las diez ramas dibuja capas en el orden esperado; trazas de combate con la misma seed siguen equivalentes entre arenas. | Diez fondos reconocibles; primer plano no oculta pies, golpes, HUD ni efectos en Cuaderno/Servidor Caído y el resto. |
| 4, impactos | Firma correcta en hit/combo/special; bloqueos y whiffs no se confunden; límites, pausa, reset y RNG de simulación intactos. | Contactos normales de cuatro rivales se reconocen sin saturar pantalla; versión sin movimiento conserva formas y texto. |
| 5, HUD | Porcentajes, ronda, marcador, reloj, energía, aviso y especial siguen dibujándose en modo normal/compacto; el estado táctil conserva un único escritor. | Legible en fondos claro/oscuro, escritorio/móvil y 200 % zoom; sin nombres o marcas recortados. |
| 1, menú | Hero refleja selección válida/default, ES/EN y restauración de Arcade; ambos `<details>` siguen cerrados; CTA/IDs/foco intactos. | Título, duelo ilustrado, resumen y `JUGAR AHORA` visibles en escritorio; scroll y lectura funcional en móvil/zoom. |
| 6, tarjeta | `drawResultCard()` usa sello/datos correctos; export/share/cancel y callbacks tardíos mantienen sus regresiones. | PNG y preview contienen escena, resultado y seed sin cortes en ES/EN, KO/tiempo y Arcade/Versus. |

Los tests con DOM/Canvas simulado no verifican píxeles, percepción ni rendimiento. Definir y ejecutar la revisión de navegador para la entrega; registrar **resultados reales** de navegador, dispositivo, rendimiento o participantes exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`, con contexto de viewport/navegador y pendientes explícitos. La descarga física y Web Share allí pendientes no se dan por validados por estos mocks.

## Riesgos, idempotencia y recuperación

- Formas que prometen otro alcance/hurtbox: limitar contornos a la figura actual y contrastarlos con el overlay de hitboxes en `?debug=1`; revertir el hito 2 si resulta engañoso.
- Saturación, bajo contraste o superposiciones: comprobar claro/oscuro, esquinas, efectos y tamaños compactos tras cada hito, y preferir retirar detalle antes de ampliar área de HUD.
- Coste de Canvas: comparar tiempo de dibujo con el diagnóstico local `?debug=1` antes/después en equipo/navegador identificados; reducir primitivas si aparece regresión; no introducir cachés prematuras.
- Foco/scroll y cambios de idioma/Arcade: actualizar la decoración solo en los setters y renderizadores de presentación existentes, sin cambiar `gameState`, nodos interactivos o persistencia.
- Efectos cosméticos que alteran seeds: conservar la separación `randomSimulation()`/`randomCosmetic()` y las trazas 30/60/120 FPS; no variar temporizadores ni frecuencia de decisiones.
- Cada hito es reversible y puede repetirse tras corregir un fallo; no borrar trabajo preexistente. Un fallo en tarjeta o menú permite revertir ese hito sin modificar combate. Ningún paso requiere migración, publicación, commit ni push.

## Registro de decisiones

- Decisión: conservar el orden 2 → 3 → 4 → 5 → 1 → 6 indicado por el usuario y entregar hitos visuales independientes.
  Justificación: el menú y el póster pueden reutilizar la identidad refinada en combate; cada hito permite evaluar legibilidad antes de sumar otro.
  Fecha/autor: 2026-09-23, asistente.
- Decisión: pulir Canvas/CSS y contratos existentes; usar una ilustración de menú decorativa, no una segunda instancia de combate.
  Justificación: evita divergir reglas y preserva la arquitectura estática y los accesos existentes.
  Fecha/autor: 2026-09-23, asistente.

## Resultados y retrospectiva

Implementados los seis hitos. Validación automatizada: 224 tests, 0 fallos, sintaxis correcta. Las mejoras son:
- **Hito 2**: `src/fighter_render.js` — cada rival ahora dibuja marcas de contorno corporal (corte/cursor para NULL POINTER, segmentos/eco para LAG SPIKE, cruces/hombros bifurcados para MERGE CONFLICT, casco/cuadrados para BOSS 500) además de los detalles de cabeza existentes.
- **Hito 3**: `src/arena_render.js` — nueva `drawArenaFarLayer()` con siluetas lejanas para cada arena; capas medias adicionales en las diez funciones de detalle; primer plano reforzado en todas las arenas.
- **Hito 4**: `src/game.js` — `triggerImpactFeedback()` ahora incluye la firma del atacante en todos los impactos no bloqueados (antes solo en combo/special). Con movimiento reducido, se dibuja la firma estática sin expansión.
- **Hito 5**: `src/hud_render.js` — barras con acento decorativo en nombres; en modo compacto, un pequeño marcador de silueta del rival (puntero/segmentos/cruz/círculo) junto a CPU.
- **Hito 1**: `src/index.html`, `src/styles.css`, `src/game.js` — franja decorativa `P1 VS R` con acento del rival, motivos CSS según `data-rival`, y `renderMenuDuelHero()` que actualiza desde selecciones.
- **Hito 6**: `src/hud_render.js` — `drawResultCard()` rediseñada con jerarquía de póster: cabecera, escena, separadores, resultado/medalla a la izquierda, marcador a la derecha, y pie con rival/dificultad/arena/seed.

Pendiente: validación visual real en navegador, dispositivos y condiciones de accesibilidad, que debe registrarse en `plan_0043_validacion_humana_consolidada.md`.

## Notas de revisión

- 2026-09-23: borrador inicial tras comparar las seis propuestas con la implementación y los planes ya entregados; se centra en diferencias observables, no en repetir funciones existentes.
