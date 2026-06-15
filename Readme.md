# xkcd KOMBAT

Juego web arcade de pelea estilo stickman/xkcd, hecho con HTML, CSS y JavaScript puro sobre Canvas. El jugador humano pelea contra una CPU en rondas al mejor de 3, con combos, bloqueo, ataque especial, arenas tematicas, controles tactiles e interfaz en espanol/ingles.

Jugar en linea: https://dersteppenwolf.github.io/xkcd_kombat/

## Tabla De Contenido

- [Inicio Rapido](#inicio-rapido)
- [Como Jugar](#como-jugar)
- [Controles](#controles)
- [Idiomas](#idiomas)
- [Arenas](#arenas)
- [Funcionalidades](#funcionalidades)
- [Funcionalidades: Combate](#combate)
- [Funcionalidades: UI/UX](#uiux)
- [Funcionalidades: Visual Y Audio](#visual-y-audio)
- [Funcionalidades: Tecnico](#tecnico)
- [Ejecutar](#ejecutar)
- [Ejecutar: Opcion Directa](#opcion-directa)
- [Ejecutar: Opcion Recomendada](#opcion-recomendada)
- [Publicacion En Linea](#publicacion-en-linea)
- [Validacion](#validacion)
- [Validacion: Validacion Automatica](#validacion-automatica)
- [Validacion: Smoke Basico](#smoke-basico)
- [Validacion: Smoke Combate](#smoke-combate)
- [Validacion: Smoke Visual Y Accesibilidad](#smoke-visual-y-accesibilidad)
- [Arquitectura](#arquitectura)
- [Arquitectura: Archivos Principales](#archivos-principales)
- [Arquitectura: Orden De Scripts](#orden-de-scripts)
- [Arquitectura: Estados Del Juego](#estados-del-juego)
- [Pruebas](#pruebas)
- [Decisiones Tecnicas](#decisiones-tecnicas)
- [No Implementado Todavia](#no-implementado-todavia)
- [Sugerencias De Mejora](#sugerencias-de-mejora)
- [Sugerencias: Atractivo Visual Y Arcade](#atractivo-visual-y-arcade)
- [Sugerencias: Backlog General](#backlog-general)
- [Backlog Completado](#backlog-completado)

## Inicio Rapido

Desde `C:\tmp\game`:

```powershell
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000/src/
```

Validar rapido:

```powershell
node --test tests\game.test.js
```

No se requiere `npm install`, `package.json`, bundler ni servidor backend.

## Como Jugar

1. Abrir `src/index.html` directamente o servir el proyecto desde `http://localhost:8000/src/`.
2. Elegir idioma, dificultad y arena desde el menu.
3. Presionar `INICIAR JUEGO` / `START GAME`.
4. Ganar rounds reduciendo la vida de la CPU a `0%` o teniendo mas vida cuando termina el tiempo.
5. Ganar 2 rounds para terminar la partida.

## Controles

| Accion | Teclado | Tactil | Nota |
| --- | --- | --- | --- |
| Mover izquierda | A / flecha izquierda | Izquierda | Movimiento horizontal. |
| Mover derecha | D / flecha derecha | Derecha | Movimiento horizontal. |
| Saltar | W / flecha arriba | JUMP | Solo desde el suelo. |
| Agacharse | C / flecha abajo | CROUCH | Baja la hitbox y evita algunos golpes altos. |
| Bloquear | S / I | BLOCK | Reduce dano, no lo elimina por completo. |
| Punetazo | J | PUNCH | Rapido, menor alcance. |
| Patada | K | KICK | Mas alcance, mas recuperacion. |
| Especial | L | SPECIAL | Requiere energia llena y consume la barra completa. |
| Pausar / reanudar | P / Esc | PAUSA | Muestra resumen de partida. |

Combos disponibles:

| Combo | Resultado |
| --- | --- |
| J, J | Combo rapido de punetazos. |
| J, K | Punetazo encadenado con patada, mas alcance y dano. |
| K, K | Back kick pesado, mas dano y recuperacion lenta. |

La segunda tecla del combo debe pulsarse dentro de la ventana de combo. Si se espera demasiado, sale el ataque normal de la tecla presionada.

La energia se carga al golpear, recibir dano o bloquear. `L` no es un golpe normal: solo activa el especial cuando la barra esta llena.

## Idiomas

La interfaz soporta:

| Codigo | Idioma |
| --- | --- |
| `es` | Espanol |
| `en` | English |

Comportamiento:

- Espanol es el idioma por defecto y fallback.
- Si no hay preferencia guardada, el juego detecta `navigator.languages` / `navigator.language`.
- Si el navegador empieza por `es`, usa espanol.
- Si empieza por `en`, usa ingles.
- Otros idiomas caen a espanol.
- El selector `Idioma / Language` guarda la preferencia en `localStorage` con la clave `xkcdKombatLanguage`.

No todos los textos decorativos de arenas o chistes tecnicos se traducen; algunos se conservan como parte del estilo visual.

## Arenas

| Arena | Tema |
| --- | --- |
| CUADERNO / NOTEBOOK | Bocetos, notas y garabatos. |
| CAFETERIA / CAFETERIA | Cafe, mesa, menu y vapor. |
| LABORATORIO / LAB | Ciencia, formulas y paneles. |
| REUNION PRESENCIAL / IN-PERSON MEETING | Oficina, proyector y post-its. |
| REUNION REMOTA / REMOTE MEETING | Videollamada, chat, mute y lag. |
| TERMINAL / TERMINAL | Consola, procesos y errores. |
| CLASE DE MATEMATICAS / MATH CLASS | Pizarra, formulas y teoremas absurdos. |
| SERVIDOR CAIDO / SERVER DOWN | Rack roto, errores 500 y reintentos. |
| CONVENCION GEEK / GEEK CONVENTION | Stands, stickers y cola infinita. |

Las arenas son visuales. No modifican dano, velocidad, IA, hitboxes ni reglas de victoria.

## Funcionalidades

### Combate

- Combate humano contra CPU.
- Rondas al mejor de 3.
- Timer de 60 segundos por round.
- Dificultad `FACIL`, `NORMAL` y `DIFICIL`.
- Hitboxes logicas para cuerpo, punetazo, patada, combos y especial.
- Bloqueo con dano residual.
- Agacharse con hitbox baja.
- Combos `J,J`, `J,K` y `K,K`.
- Ataque especial con energia llena en `L`.
- IA con bloqueo ante ataques cercanos, retirada con baja vida y ataques condicionados por rango.

### UI/UX

- Menu principal.
- Pantalla de ayuda.
- Selector de idioma con persistencia.
- Selector de dificultad.
- Selector de arena.
- Opcion `Reducir movimiento` persistida en `xkcdKombatReducedMotion`.
- Pausa con resumen de round, marcador, tiempo, dificultad, arena y controles.
- Pantalla de fin de juego con medalla post-partida, `REINICIAR` / `RESTART` y `MENU`.
- Estadisticas locales con victorias, derrotas, racha actual y mejor racha.
- Foco visible y etiquetas ARIA en controles principales.
- Controles tactiles responsivos y aviso de orientacion vertical.

### Visual Y Audio

- Personajes diferenciados: humano con placa azul `P1` y banda; CPU con placa roja `AI`, visor y antena.
- CPU con detalles visuales distintos segun dificultad.
- Barras de vida animadas de alto contraste con colores por umbral de dano.
- Barras de energia de alto contraste con marca visual cuando el especial esta listo.
- HUD e impactos asociados al color del personaje para leer quien ataca.
- Poses de victoria y derrota al cerrar rounds o partidas.
- Medallas post-partida como `Bug Exterminator`, `Firewall Humano`, `Combo Goblin` y `404 Survivor`.
- Mensajes `ROUND`, `FIGHT!`, `TIME!`, `K.O.` y bloqueo con panel estilo comic.
- Feedback de combos con texto, halo/trail y pista de ventana.
- Sacudida, hit-stop estilizado y particulas en impactos.
- Fondos tematicos por arena con animaciones ligeras que respetan `Reducir movimiento`.
- Audio generado con Web Audio API, con sonidos diferenciados por ataque, impacto, bloqueo, combo, especial y UI.

### Tecnico

- Proyecto estatico sin dependencias externas.
- Scripts clasicos, sin modulos ES ni build step.
- Canvas en espacio logico fijo `1000x500`.
- Timer de round basado en delta time de `requestAnimationFrame(timestamp)`.
- Cooldowns, combo window, hit-stun, hit-stop y timers visuales siguen por frames.
- IA separada en `src/ai.js`.
- Render de luchador separado en `src/fighter_render.js`.
- i18n separado en `src/i18n.js`.
- Pruebas unitarias con `node:test` y mocks de DOM/canvas/audio.

## Ejecutar

### Opcion Directa

Abrir en navegador:

```text
C:\tmp\game\src\index.html
```

### Opcion Recomendada

Desde `C:\tmp\game`:

```powershell
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000/src/
```

Alternativa con Node:

```powershell
npx http-server . -p 8000
```

## Publicacion En Linea

El repo incluye GitHub Pages con Actions en `.github/workflows/pages.yml`.

El workflow publica la carpeta `src/` como raiz del sitio, por lo que la URL esperada es:

```text
https://dersteppenwolf.github.io/xkcd_kombat/
```

Configuracion requerida en GitHub:

- Ir al repositorio en GitHub.
- Abrir `Settings > Pages`.
- En `Build and deployment`, configurar `Source: GitHub Actions`.
- No seleccionar `Deploy from a branch`; el sitio se publica con el workflow `.github/workflows/pages.yml`.
- Confirmar que el repositorio tiene habilitadas las Actions en `Settings > Actions > General`.
- Hacer push a `main` o ejecutar manualmente `Deploy GitHub Pages` desde la pestaña `Actions`.
- Esperar a que el workflow termine en verde.
- Abrir la URL publicada por el workflow o la URL esperada indicada arriba.

Permisos usados por el workflow:

- `contents: read` para leer el repositorio.
- `pages: write` para publicar en GitHub Pages.
- `id-token: write` para autenticar el despliegue oficial de Pages.

Verificacion despues del despliegue:

- La URL debe cargar el menu principal sin `/src/` en la ruta.
- Los estilos deben verse aplicados.
- Los selectores de idioma, dificultad y arena deben funcionar.
- Al iniciar partida, el canvas debe cargar y responder a teclado.
- Si la pagina muestra 404, revisar que `Source` sea `GitHub Actions` y que el ultimo workflow haya terminado correctamente.

No hay build step: se suben directamente `src/index.html`, `src/styles.css` y los scripts de `src/`.

## Validacion

### Validacion Automatica

```powershell
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

### Smoke Basico

- Carga el menu principal.
- `INICIAR JUEGO` / `START GAME` inicia partida.
- `AYUDA` / `HELP` abre ayuda.
- `VOLVER` / `BACK` regresa al menu.
- `P` / `Esc` pausa y reanuda.
- `REINICIAR` / `RESTART` reinicia tras game over.
- `MENU` vuelve al menu principal.

### Smoke Combate

- `A/D/W` y flechas mueven/saltan.
- `C` y flecha abajo agachan.
- `S` e `I` bloquean.
- `J`, `K` y `L` funcionan segun energia/cooldown.
- Combos `J,J`, `J,K` y `K,K` muestran feedback distintivo.
- El timer baja en segundos reales durante `playing` y se detiene en pausa.
- Al llegar a `0%`, avanza round o termina la partida.

### Smoke Visual Y Accesibilidad

- `Tab` muestra foco visible.
- El selector de idioma cambia espanol/ingles y persiste al recargar.
- El selector de arena cambia el fondo.
- `Reducir movimiento` persiste y reduce shake/hit-stop/particulas.
- Humano y CPU se distinguen visualmente.
- Las nueve arenas se ven diferentes.
- En telefono vertical aparece la sugerencia de orientacion.
- El canvas mantiene proporcion al redimensionar.

## Arquitectura

### Archivos Principales

| Archivo | Responsabilidad |
| --- | --- |
| `src/index.html` | Estructura HTML, menus, overlays, controles y carga de scripts. |
| `src/styles.css` | Layout, responsive, foco visible, overlays y controles tactiles. |
| `src/i18n.js` | Diccionario `es`/`en`, deteccion de idioma, persistencia y `t(...)`. |
| `src/config.js` | Canvas, dimensiones logicas, ataques, dificultad y arenas. |
| `src/audio.js` | Inicializacion Web Audio y sonidos generados por codigo. |
| `src/effects.js` | Textos flotantes y particulas de impacto. |
| `src/ai.js` | Decision testeable de la CPU. |
| `src/fighter_render.js` | Dibujo del luchador y feedback visual asociado. |
| `src/fighter.js` | Fisica individual, controles, ataques, combos, hitboxes, dano y energia. |
| `src/game.js` | Estado global, flujo de pantallas, rondas, timer, fondos, HUD y eventos. |
| `tests/game.test.js` | Pruebas con mocks de DOM/canvas/audio. |

### Orden De Scripts

`src/index.html` carga scripts clasicos en este orden:

```html
<script src="i18n.js"></script>
<script src="config.js"></script>
<script src="audio.js"></script>
<script src="effects.js"></script>
<script src="ai.js"></script>
<script src="fighter_render.js"></script>
<script src="fighter.js"></script>
<script src="game.js"></script>
```

### Estados Del Juego

| Estado | Comportamiento |
| --- | --- |
| `menu` | Muestra menu principal o ayuda y detiene simulacion. |
| `playing` | Actualiza fisica, controles, IA, golpes, efectos y render. |
| `paused` | Congela simulacion hasta reanudar. |
| `roundOver` | Pausa breve entre rounds. |
| `gameOver` | Detiene simulacion y muestra reinicio/menu. |

Flujo mental:

```text
menu -> playing -> paused -> playing
menu -> playing -> roundOver -> playing
menu -> playing -> gameOver -> menu/restart
```

## Pruebas

Las pruebas cubren, entre otros puntos:

- Resize responsive y backing store DPR.
- Controles de teclado, tactiles y flechas.
- Bloqueo con `S` e `I`.
- Agacharse y precedencia de bloqueo.
- Golpes, combos, especial, energia y cooldowns.
- Hitboxes y dano bloqueado.
- Reduccion de movimiento.
- IA separada y decisiones deterministas.
- Arenas, fallback y render de fondos.
- Idioma detectado, cambio manual y persistencia.
- Pausa, ayuda, stats, rounds, timer y game over.
- Identidad visual de humano/CPU.
- Medallas post-partida, sonidos UI y mensajes estilo comic.

Limitaciones de las pruebas:

- No reemplazan validacion visual real en navegador.
- No verifican pixeles del Canvas.
- No prueban audio real del navegador.

## Decisiones Tecnicas

- Mantener el proyecto como app estatica sin dependencias.
- Usar APIs nativas del navegador y Node.js.
- Mantener coordenadas logicas en `1000x500`.
- Evitar build tooling mientras no haga falta.
- Mantener espanol como idioma fallback.
- Actualizar `Readme.md` cuando cambien comandos, controles, estados, pruebas o funcionalidades.
- Usar ExecPlans en `plans/` para cambios sustanciales.

## No Implementado Todavia

- Modo entrenamiento.
- Preview de arena en menu.
- Reset visible de estadisticas.
- Persistencia de dificultad y arena.
- Resultado detallado con telemetria de combate.
- Personalidades de IA.
- Feedback visual mas fuerte para el especial.
- Modo de depuracion visual de hitboxes/estado IA.

## Sugerencias De Mejora

### Atractivo Visual Y Arcade

Estas ideas buscan que el juego se sienta mas pulido y llamativo sin cambiar necesariamente el balance:

- Intro `VS` antes de cada partida con `P1`, `AI`, dificultad y arena seleccionada.
- Preview de arena en el menu con miniatura, descripcion corta y chiste tecnico por arena.
- Indicador de especial listo sobre el personaje, ademas de la barra de energia.
- Ataque especial mas espectacular con flash, rastro grande, texto `SPECIAL!` y particulas unicas.
- Pantalla final enriquecida con marcador, dificultad, arena, racha y causa humoristica de victoria/derrota.
- Ayuda mas visual con diagrama de teclado, botones moviles y combos con flechas.
- Animaciones de HUD: vida baja parpadeante, marcador de rounds iluminado y energia llena pulsante.

### Backlog General

| Prioridad | Mejora | Motivo |
| --- | --- | --- |
| Alta | Depuracion visual opcional | Acelera ajuste de hitboxes, combos y agacharse. |
| Alta | Feedback visual del especial | Hace que gastar energia llena se sienta importante. |
| Alta | Preview de arena | Permite ver la seleccion antes de iniciar partida. |
| Alta | Intro VS arcade | Da contexto y anticipacion antes de cada combate. |
| Alta | Modo entrenamiento | Facilita practicar rangos, combos y especial. |
| Media | Reset de estadisticas | Da control sobre datos locales. |
| Media | Persistir dificultad/arena | Reduce friccion al volver al juego. |
| Media | Resultado detallado | Da mejor cierre arcade y muestra progreso. |
| Media | Telemetria local de combate | Ayuda a balancear y alimentar resultados. |
| Media | Personalidades de IA | Aumenta variedad sin cambiar controles. |
| Baja | Combos adicionales | Amplia profundidad sin rehacer el sistema. |
| Baja | Balance avanzado | Ajustes finos por dificultad o arena. |
| Baja | Organizacion de fondos | Separar detalles si `drawBackground()` sigue creciendo. |

## Backlog Completado

| Hito | Resultado |
| --- | --- |
| Menu, ayuda y pausa | Flujo completo con overlays y resumen. |
| Combate base | Movimiento, ataques, bloqueo, hitboxes y rondas. |
| Combos y especial | `J,J`, `J,K`, `K,K` y `L` con energia llena. |
| Accesibilidad inicial | Foco visible, ARIA y reducir movimiento. |
| Mobile | Controles tactiles, safe areas y aviso de orientacion. |
| Arenas | Nueve fondos tematicos sin efectos jugables. |
| i18n | Espanol/ingles con autodeteccion y persistencia. |
| Arquitectura tecnica | IA/render/i18n separados y tests con `node:test`. |
