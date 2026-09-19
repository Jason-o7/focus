# Focus — Flujo de pantallas

> **Lector previsto:** una instancia de Claude sin contexto previo.
> **Alcance:** qué pantallas existen, qué hace cada una y desde dónde se llega a cada una. **No** cubre cómo se ve ni dónde van los botones: eso es diseño, y Jason lo decide al diseñar cada pantalla.
> **Creado:** 2026-09-17. Reglas de producto: `emociones.md`. Funciones y fases: `proyecto.md`.
> Si una instrucción directa de Jason contradice este archivo, gana Jason.

---

## 1. Pantallas

| #   | Pantalla          | Para qué                                                                                                                                                         | Fase                        |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | **Home**          | Temporizador y cronómetro. Punto de entrada siempre, con o sin cuenta. Elegir sonido de fondo (≤1 clic). Mascota de compañía.                                    | 1                           |
| 2   | **Estadísticas**  | Día, semana y mes. **Es también el lugar donde el esfuerzo se plasma visualmente** (temática acumulada, decidido 2026-09-17). Comparación solo contra uno mismo. | 1                           |
| 3   | **Configuración** | Meta diaria y bloques, administración de sonidos, intervalo de los recordatorios 20-20-6, perfil y sesión.                                                       | 1 (perfil y sesión, fase 2) |
| 4   | **Login**         | Entrar con email y contraseña.                                                                                                                                   | 2                           |
| 5   | **Registro**      | Crear cuenta.                                                                                                                                                    | 2                           |

`[C]` Home es `views/home/HomeView.vue`. Renombrada desde `views/timer/TimerView.vue` el 2026-09-17, decidido por Jason: el sidebar dice "Home" y la ruta se llama `home`, así que el archivo también.

---

## 2. Flujo

```
          (abrir la app)
                |
                v
     +---------------------+
     |        HOME         |<---------------+
     +---------------------+                |
   |    |               |                   |
   |    v               v                   |
   | +------------+  +---------------+      |
   | | ESTADÍSTI- |  | CONFIGURACIÓN |------+
   | |    CAS     |  +---------------+
   | +------------+        |  ^
   |       |               |  |   (solo sin sesión, fase 2)
   |       +---------------+  |
   |                       v  |
   |                  +---------+     +-----------+
   +----------------->|  LOGIN  |<--->| REGISTRO  |
    (solo sin sesión, +---------+     +-----------+
         fase 2)           |
                           v
        (¿subir datos locales? -> vuelve a donde estaba)
```

Reglas del flujo:

- **La app siempre abre en Home.** Nunca en login. Vale con cuenta y sin cuenta (`proyecto.md` §7).
- **Desde Home** se llega a Estadísticas, a Configuración y a Login.
- **Desde Estadísticas y Configuración** se vuelve a Home.
- **A Login se entra desde Home y desde Configuración** (corregido por Jason el 2026-09-17: antes decía "solo desde Configuración"). En ambos casos, solo si no hay sesión iniciada: con sesión abierta, ese acceso no se muestra. Login y Registro se alternan entre sí.
- **Al iniciar sesión o registrarse con éxito** se vuelve a la pantalla anterior. Si hay datos en `localStorage`, antes aparece la pregunta de migración (`proyecto.md` §6).
- **Cerrar sesión** se hace desde Configuración y deja al usuario en Configuración, ya sin cuenta.
- `[C]` **Navegar con una sesión en curso no detiene el reloj.** El reloj cuenta marcas de tiempo, no ticks (`frontend-arquitectura.md` §7.4), así que ir a Estadísticas y volver no altera el conteo.

---

## 3. Estados de Home (no son pantallas)

1. **Inactivo:** listo para iniciar en un clic con la última configuración. Sin botón extra de "solo 5 minutos" (`emociones.md` §3.2).
2. **Corriendo:** solo el tiempo y los controles de la sesión. Detalle en §3.1.
3. **Meta del día cumplida:** celebración pequeña.
4. **Meta superada** (meta + deuda + 30 min): celebración grande (`emociones.md` §4.2).
5. **Con deuda:** indicador de deuda y días restantes. **Solo aparece si hay deuda** (`emociones.md` §3.1).
6. **Aviso 20-20-6:** notificación con sonido, el reloj sigue corriendo (`emociones.md` §3.9).

### 3.1 Qué se ve en Inactivo y qué se ve en Corriendo (2026-09-17)

Pedido por Jason: al iniciar la sesión desaparece todo lo que no se va a usar. Queda esto:

| Elemento | Inactivo | Corriendo |
|---|---|---|
| Reloj | Sí | Sí |
| Botón principal | Iniciar | Pausar, y Detener al lado |
| Elegir sonido de fondo | Sí | Sí |
| Mascota | Sí | Sí |
| Selector cronómetro / temporizador | Sí | **No** |
| Indicador de meta del día | Sí | **No** |
| Ir a Estadísticas, Configuración, Login | Sí | **No** |
| Título de la pantalla | Sí | **No** |

### 3.2 Qué se mueve entre los dos estados y qué no (corregido 2026-09-17)

Jason quiere una transición agradable entre Inactivo y Corriendo. La regla original decía que **nada** se movía. Jason la cambió el mismo día: el reloj se centra respecto al **área de contenido**, no respecto a la pantalla entera.

**Lo único que se mueve es la columna central** (reloj, selector de modo, duraciones, botón principal). Con el sidebar abierto su centro está en x = 840; con el sidebar plegado, en x = 720. Son 120 px de desplazamiento horizontal.

**Todo lo demás que existe en los dos estados conserva posición y tamaño exactos.** El panel de ajustes, la mascota y el avatar no cambian de lugar ni de medida.

Por qué se acepta el movimiento: es una traslación en un solo eje, de un solo grupo. Eso se anima con `transform` y se ve bien a mitad de camino. Lo caro, y lo que sigue prohibido, es que varios elementos cambien de posición **y** de tamaño a la vez.

**El botón principal guarda su lugar.** En Corriendo desaparecen el selector de modo y las duraciones, pero su espacio se conserva. Si no, Pausar y Detener subirían 116 px y el botón saltaría justo cuando se lo aprieta.

### 3.3 El sidebar se pliega

- Lleva un botón para plegarlo y desplegarlo, arriba a la izquierda.
- **Ese botón no se tapa nunca.** Con el sidebar plegado, el panel de ajustes se corre a la izquierda pero lo esquiva.
- Al iniciar la sesión el sidebar se va solo, y con él el botón: en Corriendo no hay navegación.

### 3.4 Modo por defecto y duraciones (2026-09-17)

- Home arranca en **Timer**, no en cronómetro.
- El selector Timer / Stopwatch va **arriba** del reloj. Las duraciones van **abajo**.
- El reloj queda **siempre centrado vertical**. Por eso cada pieza de la columna central tiene su altura fija: quitar el selector o las duraciones no mueve el reloj.
- Con cronómetro elegido, las duraciones no tienen sentido y se ocultan.

**Cómo se fija la duración.** Descartado menos y más: molesta para saltos grandes. Decidido por Jason:

- Un **solo overlay para Focus y Break**, no uno por cada uno. Se abre tocando cualquiera de los dos.
- Dentro: chips con los tiempos frecuentes primero, y debajo un **dial que se arrastra** para el ajuste fino.
- **Sin aceptar ni cancelar.** Cada cambio se aplica en el momento.

Lo que Jason no definió y se decidió al maquetar:

- **Cómo se cierra:** X arriba a la derecha, clic afuera, o Esc. Sin la X, quien no conoce Esc queda encerrado. La X cierra, no confirma: no hay nada que confirmar.
- **Teclado:** el dial responde a las flechas cuando tiene el foco. Sin eso, arrastrar deja fuera a quien no usa mouse.
- **Rangos asumidos**, porque un dial necesita tope: Focus de 5 a 120 minutos, Break de 1 a 30, de a 1 minuto. Sin confirmar.

### 3.5 Dónde va cada cosa en Home

Medidas de la maqueta `mockups/home.html`, sobre 1440 × 900:

| Elemento | Posición |
|---|---|
| Sidebar | 240 px de ancho, altura completa, plegable |
| Botón de plegado | Arriba a la izquierda, fuera del sidebar |
| Racha y meta | Arriba al centro del área de contenido |
| Avatar | Arriba a la derecha, fijo |
| Sonido y fondo | **Abajo a la izquierda**, fuera del sidebar |
| Reloj | Centro del área de contenido, centrado vertical |
| Mascota | Abajo a la derecha, 180 × 200 |

### 3.6 El aviso 20-20-6 vive dentro de la card de opciones (2026-09-17)

Decidido por Jason. No abre una ventana aparte: aparece como una fila arriba de "Something to hear", dentro de la misma card de abajo a la izquierda.

- **Por qué ahí:** el reloj no se detiene (`emociones.md` §3.9), así que el aviso no puede tapar la pantalla ni pedir una respuesta. Una card que ya está siempre visible es el lugar más barato.
- Usa el token celeste (`advertencia`, `diseno-visual.md` §1.2). **Este es su primer uso real, y es informativo.** Refuerza renombrar ese token a `info`.
- Se cierra con su X. Cerrarlo no toca el reloj.
- Texto actual: "Give your eyes a break. Look 6 m away for 20 seconds. The clock keeps running."


**Cómo se configura (2026-09-17).** En Inactivo, la card de opciones lleva una tercera fila, "A break for your eyes":

- Un **interruptor** que lo habilita o lo deshabilita. Apagado no llega ningún aviso.
- **Cada cuánto**, en chips: 15, 20, 30 o 45 minutos.
- Con el interruptor apagado los chips quedan a la vista pero muertos, no escondidos. Esconderlos movería la card entera cada vez que se toca el switch.
- Esta fila **no aparece en Corriendo**: durante la sesión no se reconfigura, solo llega el aviso.


**La card se pliega en burbuja (2026-09-17).** Jason: ocupa mucho espacio.

- En **Inactivo** arranca desplegada, con un botón para plegarla.
- En **Corriendo** arranca como burbuja de 56 px. Se toca y se despliega.
- Ancla siempre en la misma esquina de abajo a la izquierda, así que al abrirse crece hacia arriba y a la derecha y no tapa nada nuevo.
- **Cuando el 20-20-6 dispara, la card se abre sola.** Si el usuario la vuelve a plegar con el aviso sin leer, queda un punto celeste sobre la burbuja. El punto se va al cerrar el aviso.
- Intervalos ofrecidos: 10, 15 y 20 minutos, más un chip `+` para que el usuario agregue el suyo.

### 3.6.1 Decidido al implementar la card en Vue (2026-09-19)

- **Los intervalos del 20-20-6 son dato del usuario, no una constante.** El chip `+` deja agregar los propios, así que la lista no es fija: viajan en `Settings`. **Criterio general: si el usuario lo puede tocar, es dato.**
- **Rango 1 a 60 minutos**, en `utils/eyeBreak.ts`, aplicado en el store (lo que elige el usuario) y en el dto (`localStorage` se edita desde DevTools, y mañana eso llega del backend).
- **No se puede borrar el último intervalo.** Si se borra el seleccionado, `eyeBreakMinutes` salta al primero que queda: el valor guardado siempre coincide con un chip en pantalla.
- **Icono de información** al lado de "A break for your eyes": se abre por hover **y** por click, y el click decide qué pasa cuando el mouse se va. Flota anclado al icono, no empuja la card; un click afuera lo cierra.
- **La elección de sonido vive en `settings`, no en `sounds`.** `sounds` es el catálogo (qué existe), `settings` es cuál elegiste.
- **El plegado de la card es estado de interfaz**, en `useHomeStore`. Sobrevive a navegar y volver, no a recargar. Guardarlo en `Settings` abriría una decisión sin tomar: qué gana al entrar con una sesión corriendo, lo guardado o el plegado automático.
- **La animación de plegar no anima el tamaño**, cruza dos elementos con opacidad y escala. Animar el ancho reflowea el contenido: al expandir, el cuerpo aparecía a 56 px y el texto se envolvía en una columna altísima.
- **Falta:** avisar cuando se rechaza un intervalo inválido, reintentar sin recargar, y un punto de aviso sobre la burbuja (plegada, los errores no se ven).

### 3.7 Estados de Home que faltan diseñar

Decidido por Jason el 2026-09-17: **se resuelven después de la implementación inicial en Vue**, no antes. Motivo: casi todos son la misma pantalla con una condición distinta. En HTML suelto cada uno es un marco duplicado que se desactualiza; en Vue es una bandera.

Los cuatro que ya estaban en §3:

1. **Meta del día cumplida** — celebración pequeña.
2. **Meta superada** — meta más deuda más 30 min; celebración grande (`emociones.md` §4.2).
3. **Con deuda** — indicador de deuda y días restantes, solo si hay deuda (`emociones.md` §3.1).
4. ~~**Aviso 20-20-6**~~ — resuelto, §3.6.

Tres que no estaban escritos en ningún lado:

5. **Pausado.** El estado Corriendo tiene botón de Pausar y no hay diseño de lo que pasa al apretarlo. Es el más urgente: ya está dibujado a medias.
6. **Primera vez.** Sin racha, sin meta fijada, sin historial. La maqueta actual asume 12 días de uso, así que es lo primero que ve cualquiera y hoy no existe.
7. **Sin sesión.** El avatar hoy muestra una foto, o sea asume sesión abierta. Sin cuenta, ese círculo es el acceso a Login (§2).

**Advertencia para cuando se retomen:** las dos celebraciones no son una condición, son invención visual. Conviene decidirlas antes de escribir el componente, no mientras se lo escribe.


---

## 4. Avisos y diálogos sueltos

| Momento                              | Qué pasa                                                   | Estado                                       |
| ------------------------------------ | ---------------------------------------------------------- | -------------------------------------------- |
| Primer clic en Iniciar               | Pedir permiso de notificaciones                            | Contradicción sin resolver: `proyecto.md` §8 |
| Iniciar sesión con datos locales     | Preguntar si se suben; limpiar local recién tras confirmar | Decidido, `proyecto.md` §6                   |
| Sesión en curso al cerrar la pestaña | Sin definir; Jason lo discute más adelante                 | `frontend-arquitectura.md` §6.5              |
| Hora de un bloque (modo bloques)     | Aviso de que toca estudiar                                 | Necesita la app abierta, o push              |

---

## 5. Sin decidir

- Cómo se navega visualmente (barra fija, header, otra cosa): se decide al diseñar las pantallas `[J]`.
- Si el editor de bloques cabe dentro de Configuración o necesita su propio espacio dentro de esa pantalla.
- Dónde aparecen las frases de identidad (`emociones.md` §3.8).
- A qué reacciona la mascota (`emociones.md` §3.11).
