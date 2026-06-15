# Exec Plan: Distincion Visual Humano CPU

## Objetivo

Mejorar la lectura inmediata de quien es el humano y quien es la CPU durante el combate.

La experiencia del jugador cambia en tres puntos: placas sobre los luchadores mas claras, HUD asociado al color del personaje e impactos tintados por atacante. Queda fuera del alcance cambiar reglas de combate, controles, IA, hitboxes, dano, energia, audio o animaciones complejas nuevas.

## Contexto Actual

- `src/fighter_render.js` dibuja cada luchador, su detalle de identidad y el marcador actual con texto traducido `HUMANO`/`CPU`.
- `src/fighter.js` guarda `accentColor`, `visualRole`, `label` y `labelKey`, y dispara `triggerImpactFeedback(...)` al recibir golpes o bloqueos.
- `src/game.js` dibuja el HUD de vida/energia e implementa `triggerImpactFeedback(...)` con colores fijos por bloqueo o impacto normal.
- `tests/game.test.js` ya cubre identidades visuales, render de labels, particulas de impacto y HUD basico con mocks de canvas.
- `Readme.md` documenta funcionalidades visuales relevantes.

## Diseño Propuesto

- Mantener `accentColor` como fuente de verdad para distinguir humano (`#1f6feb`) y CPU (`#d22`).
- Cambiar el marcador sobre la cabeza para mostrar una placa rellena `P1` o `AI`, con fondo del color del personaje y texto blanco con borde negro.
- Dibujar el HUD de vida y energia con borde/acento del color del personaje, sin modificar valores ni posicion general.
- Extender `triggerImpactFeedback(...)` para aceptar un color de atacante opcional y usarlo en particulas de impactos normales; bloqueos conservan paleta azul de bloqueo.
- Pasar `attacker.accentColor` desde `takeHit(...)` cuando el golpe no es bloqueado.
- Mantener coordenadas logicas `1000x500`; todos los cambios son render-only.

## Archivos A Modificar

- `src/fighter_render.js`: mejorar placa de identidad `P1`/`AI` y mantener detalles actuales.
- `src/fighter.js`: pasar color del atacante a feedback de impacto normal.
- `src/game.js`: aceptar color opcional en impactos y aplicar acento al HUD.
- `tests/game.test.js`: cubrir placas `P1`/`AI` y color de particulas por atacante.
- `Readme.md`: documentar mayor diferenciacion visual humano/CPU.

## Plan De Implementacion

1. Actualizar `drawFighterIdentityMarker(...)` para recibir el luchador o rol y renderizar placa `P1`/`AI` con alto contraste.
2. Ajustar `drawHealthBar(...)` y `drawEnergyBar(...)` para recibir color de acento y usarlo en borde/lineas sin tocar fill de vida/energia.
3. Extender `triggerImpactFeedback(x, y, direction, blocked = false, accentColor = null)` y usar `attacker.accentColor` en impactos normales.
4. Actualizar pruebas existentes y agregar asercion de color de particula.
5. Actualizar `Readme.md`.
6. Ejecutar validacion completa.

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

- Iniciar partida y confirmar que humano tiene placa azul `P1`.
- Confirmar que CPU tiene placa roja `AI`.
- Confirmar que barras de HUD mantienen contraste y se asocian visualmente al color del personaje.
- Confirmar que impactos del humano tienden a azul y los de CPU a rojo sin cambiar dano ni knockback.
- Confirmar que bloqueo sigue usando feedback azul de bloqueo.

## Documentacion

- `Readme.md`: actualizar descripcion de personajes/HUD/impactos.
- `AGENTS.md`: no requiere cambios; no cambia comandos, arquitectura ni smoke test obligatorio.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: la placa nueva puede tapar pistas de combo sobre la cabeza. Mitigacion: mantenerla arriba de la cabeza y compacta.
- Riesgo: el HUD puede perder contraste si el borde coloreado sustituye demasiado negro. Mitigacion: conservar borde negro y usar acento como linea interior.
- Riesgo: tests de particulas pueden volverse fragiles por color aleatorio. Mitigacion: verificar que la paleta contiene el color de acento, no un orden exacto.
- Riesgo: sobrealcance visual. Mitigacion: no cambiar siluetas, hitboxes, estados ni animaciones base.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

Revision aplicada:

- La solucion es quirurgica: solo render de identidad, HUD e impactos.
- No agrega dependencias ni configuracion nueva.
- Las suposiciones estan explicitas: `accentColor` sigue siendo la fuente de verdad.
- Los criterios son verificables con pruebas unitarias y smoke test manual.
- Se reduce el alcance descartando cambios a controles, IA, reglas, hitboxes y animaciones complejas.

## Criterios De Aceptacion

- Humano muestra placa `P1` con identidad azul.
- CPU muestra placa `AI` con identidad roja.
- HUD de vida/energia conserva alto contraste y agrega asociacion visual por color de personaje.
- Impactos normales usan el color del atacante como parte de la paleta de particulas.
- Bloqueos conservan feedback defensivo azul.
- `Readme.md` refleja la mejora visual.
- Validacion automatica completa pasa.

## Commit Y Push

- Un commit sugerido: `Improve human CPU visual distinction`.
- Push solo si el usuario lo solicita explicitamente despues de revisar o al pedir commit/push.
