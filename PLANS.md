# Planes de Ejecución (ExecPlans)

Este documento define cómo redactar y mantener un ExecPlan: una especificación ejecutable que permite a otra persona o agente completar un cambio sin depender de memoria conversacional ni contexto oculto. Un buen plan explica el propósito, el estado actual, las decisiones, los pasos, la validación y el resultado esperado con suficiente precisión para reanudar el trabajo desde el árbol del repositorio y el propio plan.

Estas reglas se aplican a los ExecPlans nuevos. Un plan histórico no necesita migrarse de forma retroactiva; si se reanuda, debe actualizarse solo en lo necesario para cumplir este estándar y continuar con seguridad.

Las instrucciones específicas que gobiernan el repositorio o la tarea complementan este estándar y prevalecen cuando son más concretas o restrictivas. Si existe un conflicto que no puede resolverse sin cambiar materialmente el alcance o el resultado, solicita dirección antes de continuar.

## Cuándo usar un ExecPlan

Usa un ExecPlan cuando se cumpla al menos una de estas condiciones:

- El cambio coordina varios componentes, capas o contratos cuyo comportamiento debe mantenerse coherente.
- Modifica una interfaz pública, un formato de datos, persistencia, seguridad, concurrencia, rendimiento, disponibilidad o compatibilidad.
- Requiere migración, despliegue gradual, recuperación, varios hitos o trabajo distribuido entre sesiones.
- Existe una incógnita técnica importante que debe resolverse mediante investigación o prototipado verificable.
- Un fallo tendría impacto relevante y exige una estrategia explícita de pruebas, mitigación o reversión.

No uses un ExecPlan para una corrección aislada de texto o formato, una consulta de solo lectura, ni un cambio pequeño cuya ubicación, solución y validación sean evidentes. La complejidad no se determina únicamente por el número de archivos.

## Autoridad y seguridad

Un ExecPlan organiza trabajo autorizado; no amplía su alcance. Durante la ejecución:

- Avanza de forma autónoma en pasos rutinarios, reversibles y claramente incluidos en el objetivo.
- Expón los supuestos importantes y registra las decisiones que cambien el diseño.
- Solicita dirección cuando falte una elección que altere materialmente el resultado, el alcance o el riesgo.
- No ejecutes acciones destructivas, irreversibles o externas sin la autorización correspondiente.
- No crees confirmaciones (`commits`), etiquetas (`tags`) o publicaciones (`releases`), ni hagas envíos remotos (`push`), salvo solicitud explícita del usuario o una instrucción gobernante igualmente explícita.
- Conserva cambios preexistentes que no pertenezcan al plan y evita refactorizaciones incidentales.

## Ubicación y nombre

- Guarda cada ExecPlan en `plans/` salvo que el repositorio establezca otra ubicación.
- Usa `plan_<nnnn>_<objetivo>.md`, con un identificador incremental de cuatro dígitos y un objetivo corto en minúsculas separado por guiones bajos.
- Antes de crear un archivo, revisa los nombres existentes para elegir el siguiente identificador disponible.

Ejemplo: `plans/plan_0001_catalogo_busqueda_mvp.md`.

## Requisitos esenciales

Todo ExecPlan debe ser:

- **Autocontenido:** incluye el conocimiento necesario para ejecutar el cambio. Puede citar archivos o planes versionados como evidencia complementaria, pero no delega en ellos una explicación imprescindible.
- **Vivo:** refleja el progreso, las decisiones, los descubrimientos y el resultado real durante toda la ejecución.
- **Comprensible:** define términos no obvios y orienta a una persona que desconoce esa zona del repositorio.
- **Mínimo:** propone la solución más pequeña que satisface el objetivo y declara explícitamente lo que queda fuera de alcance.
- **Ejecutable:** identifica rutas, ubicaciones, comandos, dependencias entre pasos y resultados esperados.
- **Verificable:** formula la aceptación mediante comportamiento observable, pruebas o evidencia concreta.
- **Seguro:** explica supuestos, riesgos relevantes, idempotencia y recuperación cuando correspondan.

No inventes rutas, APIs, comandos ni resultados. Investiga primero el estado actual y distingue hechos confirmados de supuestos pendientes.

## Ciclo de vida

### Al redactar

Lee el código, las pruebas, la documentación y las instrucciones aplicables antes de decidir el diseño. Empieza por el propósito y el alcance; después completa el contexto, los pasos y la validación. Si hay alternativas razonables, registra la elegida y su justificación.

### Al ejecutar

No preguntes de manera rutinaria por el “siguiente paso”: continúa con el próximo paso seguro del plan. Actualiza `Progreso` en puntos de pausa significativos y mantén sincronizadas las secciones afectadas cuando cambie el enfoque. Si surge una decisión material no autorizada, detén esa rama del trabajo y solicita dirección.

### Al completar

Ejecuta la validación acordada, registra el resultado real, actualiza `Resultados y retrospectiva` y deja claros los pendientes. No marques el plan como completado si queda trabajo requerido o la validación necesaria no se ejecutó.

## Formato

Un archivo `.md` cuyo contenido sea el ExecPlan no lleva una cerca externa de tres comillas invertidas. Si el plan se presenta dentro de otro documento o conversación, puede envolverse en un único bloque `md`; en ese caso, representa comandos y ejemplos mediante sangría para evitar cercas anidadas.

Usa Markdown legible. Prefiere prosa para explicar contexto y razonamiento, y utiliza listas, tablas o listas de verificación cuando hagan la información más clara. Mantén rutas relativas a la raíz del repositorio y muestra el directorio de trabajo para los comandos cuando no sea evidente.

## Secciones obligatorias

### Propósito y alcance

Explica qué resultado obtiene el usuario o el sistema, cómo se observará y qué queda fuera de alcance.

### Progreso

Usa una lista de verificación breve que represente el estado real. Añade marcas de tiempo a hitos o pausas significativas, no a cada acción mecánica. Divide una entrada parcialmente completada en una parte terminada y otra pendiente.

### Contexto actual

Describe la arquitectura relevante, las rutas, los símbolos y el comportamiento existente. Define los términos especializados y documenta los supuestos confirmados.

### Diseño y plan de trabajo

Explica la solución elegida, las alternativas descartadas cuando importen y la secuencia mínima de cambios. Cada paso debe indicar qué modifica y cómo se verificará.

### Pasos concretos

Indica los comandos exactos y el directorio desde el cual se ejecutan. Describe brevemente la salida o señal que distingue éxito de fallo. No fijes un número de pruebas que pueda quedar obsoleto; exige salida exitosa y registra después el conteo observado cuando aporte valor.

### Validación, aceptación y evidencia

Relaciona cada requisito con una comprobación observable. Incluye pruebas automatizadas, escenarios manuales o verificaciones operativas en proporción al riesgo. Para cambios internos, demuestra el efecto mediante una prueba que falle antes y pase después, una comparación reproducible o una evidencia equivalente.

Descubre y usa las herramientas reales del repositorio; no inventes comandos genéricos. Indica el resultado esperado y el criterio de fallo, valida comportamiento útil además de compilación o sintaxis, y declara las limitaciones de la evidencia. Las simulaciones y mocks no sustituyen validaciones humanas, visuales, físicas u operativas cuando estas sean necesarias. Conserva únicamente resultados representativos que mejoren la verificabilidad.

### Riesgos, idempotencia y recuperación

Enumera riesgos reales y sus mitigaciones. Indica qué pasos pueden repetirse de forma segura y cómo reintentar o revertir los que puedan dejar estado parcial. Si no existen riesgos adicionales a los controles rutinarios, dilo brevemente.

### Registro de decisiones

Registra únicamente decisiones materiales con este formato:

- Decisión: qué se eligió.
- Justificación: por qué se eligió.
- Fecha/autor: cuándo y quién la tomó.

### Resultados y retrospectiva

Al finalizar, compara el resultado con el propósito, resume la validación ejecutada y declara pendientes o desviaciones. Mientras el plan esté activo, esta sección puede indicar “Pendiente”.

### Notas de revisión

Registra cambios significativos al propio plan y su motivo. No anotes correcciones ortográficas o ajustes mecánicos sin impacto.

## Secciones condicionales

Incluye estas secciones solo cuando aporten información útil:

- **Hitos:** para trabajo multietapa. Cada hito debe producir un resultado verificable y dejar el sistema en un estado coherente.
- **Sorpresas y descubrimientos:** para comportamientos inesperados que cambien el enfoque; adjunta evidencia breve.
- **Interfaces y dependencias:** cuando deban crearse o modificarse contratos, tipos, interfaces de programación (APIs), bibliotecas o servicios.
- **Migración, despliegue gradual y reversión:** cuando exista transición de datos, compatibilidad temporal o publicación por fases.
- **Artefactos y evidencia:** para extractos concisos de registros, diferencias, métricas o transcripciones que demuestren un resultado.

## Investigación y prototipos

Usa un prototipo solo para resolver una incógnita nombrada que bloquee el diseño. Antes de implementarlo, define:

- La pregunta que debe responder.
- La forma de ejecutarlo y observarlo.
- El criterio para promoverlo, revisarlo o descartarlo.
- Qué código o artefactos temporales se eliminarán si no se adopta.

Un prototipo no autoriza dependencias, infraestructura ni cambios externos fuera del alcance acordado. Prefiere experimentos pequeños, aislados y reversibles.

## Revisión antes de finalizar

Comprueba que:

- El objetivo y los límites están claros.
- La solución es la mínima suficiente y no introduce trabajo especulativo.
- Los supuestos importantes son explícitos.
- Cada paso conduce a una verificación concreta.
- Las rutas, símbolos y comandos fueron comprobados.
- Los riesgos y las decisiones materiales están registrados.
- El plan no amplía la autoridad concedida.
- `Progreso`, `Registro de decisiones`, `Resultados y retrospectiva` y `Notas de revisión` reflejan el estado real.

## Plantilla

    # plan_<nnnn>_<objetivo> - <descripción corta orientada a la acción>

    **Fecha:** <AAAA-MM-DD>
    **Ámbito:** <componentes o capacidades afectadas>
    **Estado:** borrador | activo | bloqueado | completado

    Este ExecPlan se mantiene conforme a `PLANS.md`.

    ## Propósito y alcance

    <Resultado observable, motivación y exclusiones explícitas.>

    ## Progreso

    - [ ] <Paso verificable pendiente.>

    ## Contexto actual

    <Estado relevante, rutas, símbolos, términos y supuestos.>

    ## Diseño y plan de trabajo

    <Solución mínima, decisiones y secuencia de cambios.>

    ## Pasos concretos

    Desde `<directorio de trabajo>`:

        <comando exacto>

    <Resultado esperado y señal de fallo.>

    ## Validación, aceptación y evidencia

    <Comprobaciones observables vinculadas a los requisitos.>

    ## Riesgos, idempotencia y recuperación

    <Riesgos, mitigaciones, repetición segura y reversión.>

    ## Registro de decisiones

    - Decisión: <decisión material o “Ninguna todavía”.>
      Justificación: <motivo.>
      Fecha/autor: <AAAA-MM-DD, identidad o rol.>

    ## Resultados y retrospectiva

    <Pendiente mientras esté activo; resultados y validación al completar.>

    ## Notas de revisión

    - <AAAA-MM-DD>: <cambio significativo y motivo.>

Añade las secciones condicionales únicamente cuando correspondan. Un ExecPlan terminado debe permitir reconstruir qué se intentó, qué se decidió, qué se cambió y cómo se comprobó, sin obligar a adivinar información esencial.
