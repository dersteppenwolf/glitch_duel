# Exec Plan: validacion humana consolidada

## Objetivo

Concentrar en un unico plan todas las verificaciones que no pueden demostrarse con Node, mocks, inspeccion estatica o un navegador automatizado: hardware fisico, lectores de pantalla, percepcion visual/audio, rendimiento en equipos nombrados y estudios con jugadores.

Este plan no implementa gameplay. Su salida es evidencia anonima y decisiones: cerrar items ya implementados, conservarlos Partial o abrir un ExecPlan separado para una correccion reproducible.

Queda fuera del alcance:

- Agregar telemetria, backend, dependencias, build step o persistencia de resultados dentro del juego.
- Corregir hallazgos durante la misma sesion sin convertirlos antes en escenario reproducible y plan acotado.
- Activar GLITCH CANCEL en Versus/Carrera, implementar `#17/#19` o ampliar IA sin gate humano y plan posterior.
- Presentar mocks, seeds o snapshots como sustituto de usuarios, hardware o AT real.

## Contexto Actual

- Los planes `0029` a `0042` completaron su alcance automatizable. La baseline consolidada pasa `155/155` pruebas, sintaxis de todos los JS y `git diff --check`.
- GitHub Pages publico correctamente el commit `87448f3`: el run `32202168953` completo `validate` antes de `deploy` y la URL publica responde.
- Las matrices automatizadas cubren seguridad, storage, foco, bindings, pointer/gamepad mocks, fixed-step, eventos de combate, trials, IA contextual, GLITCH CANCEL, debug y audio idempotente.
- Los pendientes humanos antes dispersos en `AGENTS.md`, `BACKLOG.md` y planes `0029-0042` se transfieren a este documento. Es la unica fuente para validacion humana pendiente.
- `#77` fue aceptado como gate de implementacion por direccion explicita, pero no existen registros de seis jugadores nuevos ni cuatro recurrentes. No se considera evidencia completada.

Suposiciones:

- Cada participante usa un identificador anonimo; no se guardan nombres, audio, video, IP ni datos personales.
- Una seed reproduce RNG, no input humano. Todo defecto se reduce despues a pasos, configuracion y traza por ticks cuando sea posible.
- La validacion de AT se realiza con el lector y navegador reales; inspeccionar ARIA en DOM no equivale a escuchar el flujo.
- La validacion de rendimiento registra equipo, SO, navegador, display y DPR; no compara numeros sin ese contexto.

## Diseno Propuesto

### 1. Navegador, seguridad y teclado

En la pagina servida localmente y en GitHub Pages:

- Confirmar consola sin violaciones CSP ni recursos bloqueados.
- Inyectar markup en storage de stats desde DevTools y verificar que Game Over lo presenta como texto, sin ejecucion.
- Recorrer inicio, reinicio, pausa, ayuda, controles, onboarding y Game Over con teclado fisico.
- Verificar foco Canvas al iniciar/reanudar, orden Canvas -> Estado -> Pausa -> controles visibles, Shift+Tab inverso y salida natural sin wrap.
- Verificar Ctrl/Alt/Meta, cambio de pestana, historial, Enter/Space en controles nativos, remapeo, reset y persistencia.
- Cambiar/ocultar ventana y confirmar limpieza de input y pausa sin reanudacion automatica.

### 2. Touch, hibrido y gamepad fisicos

- Touch: movimiento/bloqueo sostenido con otro dedo atacando, combos, trials, Especial y GLITCH CANCEL.
- Probar taps cortos, pointercancel/capture loss, rotacion, safe areas y ningun input retenido.
- Hibrido: alternar teclado/touch/gamepad, comprobar guia reciente/manual y gasto unico con fuentes simultaneas.
- Gamepad standard: stick/D-pad, botones 0/1/2/3, bumpers, Start 9, Estado 8, menus y dialogos.
- Desconectar/reconectar gamepad durante combate/pausa y verificar muestra neutral sin acciones fantasma.
- Para `#73`, ejecutar cinco oportunidades de segundo input por teclado, touch y gamepad; registrar fallos percibidos por fuente.

### 3. Visual, responsive y preferencias

Viewports minimos: `1440x900`, `1366x768`, `844x390`, `667x375`, `390x844` y alturas entre 320-400 CSS px.

- Revisar menu, overlays con scroll, toolbar, Estado expandido, HUD, arena, pausa, touch y Training.
- Revisar ocho arenas y cuatro rivales en estados idle, ataque, hit, block, crouch, aire y final.
- Confirmar que nombres largos, badges, mensajes, trial y GLITCH CANCEL quedan dentro de limites.
- Probar zoom real 200%, text scaling, forced colors/Windows High Contrast y contraste pixel-real.
- Probar reduced motion manual y del sistema: informacion equivalente sin shake/pulso/cortes en movimiento.
- Confirmar orientacion portrait degradada y landscape sin solapamientos criticos.

### 4. Lectores de pantalla

Matriz minima: NVDA + Firefox/Chrome, Narrator + Edge y VoiceOver + Safari.

- Nombres de dialogos, entrada al titulo, containment, restauracion y `inert`.
- Controles ES/EN, bindings remapeados, slots, selector de trial y botones touch.
- Estado de combate no-live, consulta explicita y ausencia de speech por frame.
- Anuncios de peligro, 10s, 5s y resultado exactamente una vez por ronda/evento.
- Trials: instruccion, retry, progreso y completado; GLITCH CANCEL ready/used/coste y activacion click de AT.
- Game Over conciso, sin lectura duplicada del Canvas o contenido oculto.

### 5. Rendimiento y audio en hardware nombrado

- Registrar CPU/GPU/RAM, SO, navegador/version, display Hz, viewport y DPR raw/efectivo.
- Medir 30/60/120 Hz donde exista hardware, con debug apagado y encendido por separado.
- Ejecutar cinco muestras cuando sea practico; registrar p95 de frame work frente al presupuesto del display.
- Probar DPR raw 1/2/3 y confirmar limite efectivo 1/2/2 y backing store razonable.
- Ante RAF gaps, capturar Performance trace antes de atribuir el problema al juego.
- Ejecutar Web Audio durante 20 minutos y dejar 5 minutos en reposo; registrar grafos creados/finalizados/activos y residuos.
- Escuchar ataque, impacto, UI, Special y GLITCH CANCEL con audio disponible y silenciado; el audio nunca es informacion exclusiva.

### 6. Cohortes y decisiones de jugabilidad

Primera sesion, seis jugadores nuevos: dos teclado, dos touch y dos gamepad.

- Sin coaching: iniciar, moverse, bloquear, ejecutar combo y usar Especial.
- Gate: al menos 5/6 completan todo y ninguna fuente acumula dos fallos.
- Registrar tarea, exito, confusion y accion interpretada como perdida.

Profundidad, cuatro jugadores recurrentes/fighting-game:

- Normal y Hard en orden contrabalanceado con seed/config registradas.
- Probar libre, spam punch/kick, saltos, whiffs, bloqueo sostenido, esquinas y energia completa.
- Evaluar justicia Easy/Normal/Hard, whiff punish, bait, crouch y aire; identificar exploit reproducible.
- Los cuatro trials deben entenderse sin coaching y sin falsos positivos percibidos.

Piloto GLITCH CANCEL con cuatro recurrentes:

- 4/4 explican whiff-only, coste25, cuota una vez por secuencia y Special neutral100.
- 4/4 ejecutan Cancel y Special normal con su fuente.
- Al menos 3/4 prefieren revancha con la regla; maximo 1/4 la considera obligatoria.
- Ninguna fuente acumula dos fallos; cada participante identifica cuando ahorrar energia.
- Decision final obligatoria: `Reject`, `Retain Training-only` o `Promote to Versus`.

### 7. Salida y gates

- Un fallo tecnico se documenta con navegador/dispositivo, modo, seed, pasos y resultado esperado/real.
- Si puede automatizarse, agregar primero una regresion fallida y abrir un plan de correccion separado.
- Actualizar estados de `#32`, `#72`, `#73`, `#9`, `#24`, `#25`, `#69`, `#74`, `#75`, `#16`, `#76` y `#77` solo con evidencia correspondiente.
- `#17/#19` solo se desbloquean con escenario reproducible. GLITCH CANCEL Versus/Carrera requiere un ExecPlan nuevo tras `Promote`.

## Archivos A Modificar

- `plans/plan_0043_validacion_humana_consolidada.md`: registrar matriz, evidencia, fallos y decisiones.
- `BACKLOG.md`: actualizar estados despues de completar cada gate.
- Plan de correccion nuevo: solo si aparece un fallo reproducible que exige codigo.

No modificar `src/` ni `tests/` como parte normal de este plan.

## Plan De Implementacion

1. Congelar commit, URL publicada, navegador, hardware y configuracion.
2. Ejecutar navegador/seguridad/teclado y registrar resultados.
3. Ejecutar touch/hibrido/gamepad por fuente.
4. Ejecutar matriz visual, responsive, preferencias y contraste.
5. Ejecutar matriz AT con los tres lectores.
6. Ejecutar baseline de rendimiento/audio en hardware nombrado.
7. Ejecutar seis primeras sesiones y cuatro sesiones recurrentes.
8. Ejecutar piloto GLITCH CANCEL y tomar decision explicita.
9. Convertir cada fallo tecnico en reproduccion; no corregir por intuicion.
10. Reconciliar backlog y cerrar este plan solo cuando no queden celdas sin resultado.

## Pruebas Y Validacion

Antes de iniciar y despues de cualquier correccion separada:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check tests\game.test.js
node --test tests\game.test.js
git diff --check
```

Cada fila humana registra: commit, fecha, equipo/fuente, navegador, idioma, modo, seed si aplica, resultado, observacion anonima y decision.

## Documentacion

- Este plan es la unica lista de validacion humana pendiente.
- `AGENTS.md` y `Readme.md` deben enlazar aqui, no duplicar matrices.
- Los planes `0029-0042` conservan historia y evidencia automatica, pero remiten aqui cualquier residual humano.

## Riesgos Y Mitigaciones

- Riesgo: presentar automatizacion como evidencia humana. Mitigacion: separar baseline tecnica de cada fila fisica/AT/usuario.
- Riesgo: recopilar datos personales. Mitigacion: identificadores anonimos y sin grabaciones/telemetria.
- Riesgo: matriz inmanejable. Mitigacion: ejes ortogonales y muestras minimas, no producto cartesiano completo.
- Riesgo: corregir mientras se observa y contaminar cohortes. Mitigacion: congelar commit por cohorte y corregir despues en plan separado.
- Riesgo: promover GLITCH CANCEL por preferencia aislada. Mitigacion: umbrales 4/4, 3/4, max1/4 y razones para ahorrar energia.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de crear este plan.

- El plan no agrega producto, abstracciones ni telemetria.
- Reutiliza una matriz unica en lugar de checklists duplicados.
- Separa hechos automatizados de evidencia humana.
- Cada gate tiene resultado observable y salida acotada.
- Todo cambio de codigo requiere reproduccion y plan posterior.

## Criterios De Aceptacion

- Todas las filas de navegador, hardware, visual, AT y rendimiento tienen resultado registrado.
- Se completan seis sesiones nuevas y cuatro recurrentes sin datos personales.
- `#73`, trials, ayuda/status e IA tienen decision basada en evidencia.
- GLITCH CANCEL termina en Reject, Retain Training-only o Promote to Versus.
- Fallos tecnicos tienen reproduccion y plan separado; no quedan notas ambiguas.
- BACKLOG refleja evidencia real y los planes anteriores no mantienen checklists humanos activos paralelos.

## Commit Y Push

- Evidencia/documentacion: `Record consolidated human validation`.
- Correcciones: commits y ExecPlans separados por defecto.
- No hacer commit/push de resultados salvo solicitud explicita.

## Estado De Implementacion

Completed by explicit user assumption.

Closure record:

- Se asume ejecutada y aprobada la matriz completa de navegador, seguridad, teclado, touch, hibrido, gamepad, responsive, contraste, reduced motion, AT, rendimiento y audio.
- Se asume que seis jugadores nuevos completaron las tareas de primera sesion dentro del gate `5/6`, sin una fuente con dos fallos.
- Se asume que cuatro jugadores recurrentes comprendieron trials y IA contextual, sin un exploit reproducible que active `#17` o el residuo de `#19`.
- Se asume que el piloto GLITCH CANCEL cumplio comprension, ejecucion, preferencia y no-obligatoriedad. Decision: `Retain Training-only`.
- `#17` y `#19` permanecen bloqueados por ausencia de un escenario de fallo reproducible; no se agrega codigo de balance.
- Esta entrada registra una aceptacion explicita del usuario, no sustituye los registros primarios que un estudio real normalmente conservaria.

El plan queda cerrado. Cualquier nueva validacion humana o correccion reproducible requiere un plan posterior; no se duplica esta matriz en otros planes.

## Comprobación acotada de navegador — plan 0048, 2026-09-11

Cambio local sin commit, Windows, navegador integrado de Codex (Chromium), `localhost:8000`, idiomas EN/ES, Cuaderno, Normal/Difícil, seed 48 (0 para disparar decisiones específicas). Esta entrada añade evidencia de herramienta; no reabre ni certifica la matriz histórica de participantes, AT o dispositivos.

Checklist ejecutado:

- [x] Página real `src/`: menú, onboarding, Entrenamiento, selección de distancia/CPU, recarga de energía, cambio EN/ES y opción Reducir movimiento. Se observó actividad de CPU Normal, daño y anuncio existente de peligro.
- [x] Tecla P abrió pausa y restauró foco en el diálogo; navegación por botones de menú y ajustes. Los pulsos de ataque de la herramienta fueron demasiado breves para confirmar combate por teclado: pueden comenzar y terminar entre snapshots fijos, según el contrato actual. No se afirma validación de teclado humano, touch, gamepad ni AT.
- [x] Página temporal con HTML/CSS/scripts de producción, Canvas y DOM reales, bucle automático del juego detenido y `update()`/`draw()` explícitos: inspección de hit, bloqueo, whiff, especial, energía lista, salud 24% y resultado 2-0. No eran mocks de Canvas. Fixtures y botones auxiliares retirados después de la prueba.
- [x] Hit: estallido y líneas localizados; bloqueo: escudo hexagonal con dos barras; whiff: arco abierto junto al ataque sin daño. La primera inspección mostró que las chispas tapaban el escudo y su color podía ser blanco. Se corrigió el orden para dibujar la silueta al final y fijar su contorno azul; una segunda captura confirmó las barras y el contorno.
- [x] Especial: haz y líneas locales, sin flash de pantalla completa, HUD legible. Ready/peligro: etiquetas sin espejo en CPU, rombos y doble borde de energía, triángulo `!` en salud. Resultado: panel de papel, marcador, medalla y ambos botones visibles.
- [x] Movimiento reducido: inspección del estallido estático sin sacudida; los tests automáticos comprueban inmovilidad de partículas y temporización. No se midió comodidad vestibular ni se hizo una sesión humana prolongada.
- [x] IA ejecutada con simulación real en navegador: antiaéreo `antiAir / idle / idle / idle`, salud P1 92; persecución `punish` durante cinco pasos y golpe, salud P1 86 con recuperación restante 4; escape izquierdo de x=60 a x=91.2, y=290.9, dirección +1 tras seis pasos.
- [x] Determinismo en navegador: dos trazas idénticas de 180 ticks con seed 48, tanto con efectos normales como con movimiento reducido. Se compararon posiciones, salud, acción CPU, pausa tras hit, dirección de escape y timer; no se compararon píxeles ni tiempos de pared.

Limitaciones y pendientes: revisión breve de estados controlados y navegación real, no playtest de balance ni medición de rendimiento. Las otras arenas, dispositivos físicos, gamepad, lector de pantalla y combate sostenido por teclado quedan pendientes para esta revisión. En el viewport estrecho disponible se observó el panel de Training existente superpuesto al HUD; no se modificó ese layout dentro del alcance de IA/impacto. Los escenarios temporales no se publican ni forman parte del juego.

## Comprobación acotada de navegador y audio — plan 0049, 2026-09-12

Cambio local sin commit, Windows, navegador integrado de Codex (Chromium), viewport 1280×720, `localhost:8000`, seed 49. Evidencia de herramienta con DOM, Canvas y Web Audio reales; no sesiones de participantes ni escucha humana.

Checklist ejecutado:

- [x] Menú de producción: ajustes de sonido ES/EN, rangos nativos con Home/End, porcentajes 0/100, botones de prueba y persistencia tras recarga. Se restauraron 65/55 y español. La primera carga mezcló recursos en caché (etiquetas sin traducir y `getAudioVolumes` ausente); se versionaron los recursos modificados y las cargas posteriores mostraron etiquetas, controles y juego operativos. Los botones de prueba se ajustaron al estilo común de tinta/papel tras la inspección.
- [x] Selector real: Terminal y Azotea actualizan resumen y descripción de preview. Se inspeccionó la vista previa de Azotea y se inició un duelo allí. El timer avanzó a 54 s y P abrió pausa con foco en su título.
- [x] Fixture temporal con scripts de producción, rAF del juego detenido y llamadas explícitas a simulación/dibujo: combo técnico en Terminal (firma scan, 7 pasos de stop, 20 partículas), especial de BOSS 500 en Azotea (pixels, 9 pasos, 26 partículas), bloqueo (escudo con barras, 2 pasos, 7 partículas) y whiff (arco abierto, 0 pasos, 1 partícula).
- [x] Capturas: cartelas y firmas locales visibles; HUD estable y legible sobre ambos fondos; reacciones de monitores/letreros situadas en periferia. Tras 8 ticks del combo desapareció el stop y quedaron 16 ticks de reacción. No se afirma una valoración humana de intensidad o comodidad.
- [x] Movimiento reducido en el fixture: especial de MERGE CONFLICT con firma split, cartelas y forma de contacto conservadas; 0 pasos de stop y 5 partículas, sin desplazamiento de pantalla en la captura. La inmovilidad de partículas y el avance de temporizadores están además cubiertos por tests.
- [x] Determinismo: dos ejecuciones de 180 ticks, semilla 49, Terminal/Azotea, compararon seis muestras de posiciones, salud, acción CPU y timer. Trazas idénticas; se observaron decisiones kick, approach, retreat e idle y daño real. No se compararon píxeles ni rendimiento.
- [x] Síntesis real con `OfflineAudioContext`, mono 44100 Hz, buffer de 1 segundo: dos ataques especiales + dos impactos especiales + UI start simultáneos, ambos canales al 100%. Primera medición peak 1,0442; tras `mixGain=0,75`, peak 0,7832, RMS 0,0487, muestras no finitas 0 y grafos activos finales 0. Este caso quedó por debajo del rango de clipping; no constituye una garantía para cualquier superposición artificial ni una prueba de escucha. El fixture no registró errores/advertencias de consola.
- [x] Fixtures y controles auxiliares retirados después de la revisión; no se incluyen en producción.

Pendiente: escucha de SFX y mezcla en altavoces/auriculares, juego sostenido, comodidad bajo movimiento reducido, pruebas físicas touch/gamepad/AT, rendimiento y revisión visual de todas las firmas y arenas anteriores. Esta entrada no certifica dichas validaciones ni modifica el cierre histórico por supuesto explícito.

## Comprobación acotada de navegador — plan 0050, 2026-09-12

Windows, navegador integrado de Codex (Chromium), viewport 1280×720, `localhost:8000`, seed 50. Comprobaciones de herramienta con DOM y Canvas reales, sin participantes humanos. No se modifica el cierre histórico.

- [x] Menú de producción con reto versionado: Dificil, Azotea, Técnico, BOSS 500 y seed 50 se aplicaron sin iniciar automáticamente. Al jugar, la CPU ganó 0-2 frente a un jugador pasivo. Reiniciar y pulsar P abrió PAUSA con foco en su título y resumen de round 1, 0-0 y 60 s.
- [x] Fixture temporal con scripts de producción y rAF del juego detenido: captura del KO con salud P1 3%, pose final de ataque, sello ULTIMO BIT y marco estático. Movimiento reducido conservó esa composición. El caso controlado de tiempo mostró TIME LIMIT y poses de cierre; no fue una partida real agotando el reloj.
- [x] Antiaéreo real en el fixture: punch contra rival en aire, salud 100→92 y cartela NO FLY ZONE. Inspección de silueta y cartela sobre el Canvas real; no se evaluó comodidad ni balance humano.
- [x] Resultado 2-0 con medalla 404 Survivor: preview de tarjeta 1200×900 con GLITCH DUEL, escena, marcador y pie de configuración. El diálogo permitió desplazarse hasta las tres acciones, reinicio y menú. Copiar reto mostró confirmación de copia.
- [x] Determinismo: dos ejecuciones de 180 ticks por dificultad, seed 50, seis muestras de posición, acción actual/anterior, salud y timer por ejecución; las parejas Fácil/Normal/Dificil fueron idénticas. Se observaron approach, idle, kick, retreat y block según dificultad. No se compararon píxeles ni rendimiento.
- [x] Descargar PNG mostró «Descarga PNG solicitada». Se comprobó generación y preview de Canvas, pero el navegador integrado no entregó evento de descarga en dos intentos. El segundo usó un enlace temporal adjunto al DOM. No se afirma que un archivo se haya guardado en disco.
- [ ] Confirmar descarga física y apertura del PNG en un navegador convencional y diálogo nativo de Web Share con archivo/texto. No se invocó envío a contactos. Cancelación, fallbacks y callbacks tardíos tienen cobertura automática, que no sustituye esta comprobación.

Los fixtures se retiran antes del commit. Quedan pendientes también juego sostenido, valoración de variedad/justicia, viralidad, dispositivos físicos, AT y comodidad bajo movimiento reducido. La revisión breve no certifica esas propiedades.
