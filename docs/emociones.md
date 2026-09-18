# Focus — Emociones y motivación del usuario

> **Lector previsto:** una instancia de Claude sin contexto previo.
> **Alcance:** qué siente Jason (el usuario principal) antes, durante y después de estudiar, y qué pide eso de la app. Es la entrada de producto para decidir temática, flujo y recompensas. El marco teórico está en `diseno-hook.md`; acá no se repite.
> **Creado:** 2026-09-17. Todo sale de lo que Jason dijo en conversación.
> Si una instrucción directa de Jason contradice este archivo, gana Jason.

---

## 0. Cómo se trabaja este archivo

- **Jason pidió discutir cada punto de §3 uno por uno hasta llegar a una conclusión.** No saltear ninguno. No decidir por él.
- El orden de discusión lo elige Jason. No hay orden fijado.
- Al cerrar un punto: pasar su estado a `CERRADO`, escribir la conclusión en una o dos líneas y mover lo que implique para la app a §4.
- Cuando §3 esté completo, Jason espera tener la base para definir el flujo de pantallas (`proyecto.md` §5) y la temática visual. Posiblemente aparezcan piezas que se unen en un diseño.
- `[J]` = dato o preferencia de Jason. `[C]` = observación de Claude, no confirmada.

---

## 1. Emociones principales (elegidas por Jason, 2026-09-17)

| Rol | Emoción | Evidencia |
|---|---|---|
| Principal, positiva | "Quiero plasmar mi esfuerzo en algún lugar." Ver cuánto estudié en el día o la semana, sentir que el esfuerzo se ve y está ahí, sentirme orgulloso. | Declarada `[J]`. |
| Respaldo, negativa | "No quiero perder mi racha." Aparece cuando otros pensamientos están ganando. | **Conducta observada** `[J]`: en su app de gym negociaba consigo mismo si ir o no; desde que usa racha, solo piensa en no perderla y eso alcanza para empezar. |

Pasos 1 y 2 de `diseno-hook.md` §12 incompletos: Jason no dio escena concreta ni frecuencia semanal.

`[C]` Implicaciones ya señaladas:
- "Plasmar el esfuerzo" pide un lugar donde el esfuerzo **se acumule y se vea**, no solo números.
- "No perder la racha" pide que la racha **esté visible al abrir la app**, que es el momento de la duda.

---

## 2. Material secundario de Jason

- **Fricción de buscar sonido.** Le molesta buscar un sonido de ambiente cada vez que va a estudiar. No es disparador interno: es un paso que cuesta. Elegir sonido debe costar ≤1 clic.
- **Poca satisfacción al terminar una sesión.** Quisiera sentirse feliz consigo mismo al terminar.
- **Alegría al pasar la meta.** Estudiar más allá del tiempo fijado debería sentirse aún mejor: "antes no podía y ahora sí". `[C]` Única fuente de incertidumbre real encontrada (al empezar no se sabe si se pasará la meta): candidata a recompensa variable (`diseno-hook.md` §4, §12 paso 6).
- **Soledad al estudiar.** A veces se siente solo. `[C]` Recompensa de tipo tribu sin usuarios reales: **prohibido simular presencia** (`diseno-hook.md` §10.2, §10.3).
- **Sin castigo visual por ausencia.** Nada marchito ni triste al volver tras días sin entrar (decidido `[J]`). La racha sí existe, con amortiguación.

---

## 3. Puntos PENDIENTES de discusión

Estado de todos: **PENDIENTE**.

### 3.1 Amortiguar el corte de racha — CERRADO (2026-09-17)
- La amortiguación es la cubeta de §4.3.
- `[J]` **El indicador de deuda aparece solo cuando hay deuda** (días que quedan y cuánto falta). Home queda limpio los días normales.
- `[C]` Contrapeso necesario: así el usuario no sabe que la red existe hasta fallar, que es justo lo que a Jason le molestaba. Explicarlo en la configuración de la meta o la primera vez que se usa.
- `[J]` Un corte no debe hacer sentir mal ni borrar el esfuerzo: "estudió 2 meses seguidos y tuvo un tropiezo".
- `[J]` Problema detectado por Jason: si la protección solo aparece al romperse la racha, el usuario no sabe que existe hasta entonces.
- `[C]` Opciones conocidas, sin verificar hoy: comodín ganado por adelantado (Duolingo "streak freeze"); reparación tras el corte con condición; racha semanal en vez de diaria; no borrar nunca el historial (racha actual + mejor racha + días totales). No excluyentes.

### 3.2 Costo de arranque — CERRADO (2026-09-17)
- `[J]` ~10% de las veces. **La app no hace nada extra**: alcanza con que Home arranque en un clic con la última configuración. Nada de botón "solo 5 minutos": rompería la vista de una sola acción.

### 3.3 Distracción por el celular — CERRADO (2026-09-17)
- `[J]` ~10% de las veces, ya tiene las distracciones bloqueadas. **La app no vigila nada:** no cuenta salidas de pestaña y no pausa el reloj si el usuario se va.

### 3.4 Presión de un plazo — CERRADO (2026-09-17)
- `[J]` **Fuera de la app.** Nada de exámenes, fechas límite ni cuenta regresiva. Planificar contenido no es conveniente, y una meta por fecha competiría con la meta diaria.

### 3.5 Meta y horas programadas — CERRADO (2026-09-17). Ver §4.1.

### 3.6 Cerrar el día — CERRADO (2026-09-17)
- Umbral y deuda: §4.2 y §4.3.
- `[J]` **Al cumplir la meta sin pasarse también hay una pequeña celebración**, y al pasarse una mayor. Dos niveles.
- `[C]` Riesgo asumido: algo que ocurre todos los días pierde valor (`diseno-hook.md` §3.6). Mantener la chica claramente por debajo de la grande.

### 3.7 Competir con uno mismo — CERRADO (2026-09-17)
- `[J]` Comparación **solo contra uno mismo** (esta semana vs. la anterior, mejor racha, mejor día). **Nunca contra otros usuarios:** uno se compara con gente mejor y se siente peor. Esto cierra también rankings y tablas de posiciones: no van.

### 3.8 Identidad — CERRADO (2026-09-17)
- `[J]` **Comentarios sobre lo que se logró, para reforzar quién es.** No elogio vacío: frases construidas con sus datos reales ("llevás 42 días estudiando", "90 h este año").
- `[C]` Línea roja: si la frase no sale de un dato verdadero, no va. Un elogio inventado se nota y quema la confianza (`diseno-hook.md` §10.2).
- `[C]` Pendiente al diseñar: dónde aparecen (al abrir, al cerrar la sesión, en estadísticas) y cada cuánto, para que no se vuelvan ruido.

### 3.9 Cansancio de la vista — CERRADO (2026-09-17)
- `[J]` Punto clave para Jason.
- **El aviso 20-20-6 es solo un aviso:** notificación con sonido, y **el reloj sigue corriendo**. Al volver del descanso el reloj marca 20 min 20 s. Nada se pausa.
- **El intervalo lo configura el usuario** (cada cuánto quiere el aviso).
- `[C]` Consecuencia: los 20 s de descanso cuentan como tiempo estudiado. Es el precio de no interrumpir.

### 3.10 Ruido del entorno — CERRADO (2026-09-17)
- `[J]` Ya lo cubre el sonido de fondo. No hace falta nada nuevo.

### 3.11 Soledad: mascota — CERRADO (2026-09-17)
- `[J]` **Mascota de compañía durante la sesión, sin progreso acumulado.** Está ahí mientras estudiás y reacciona en vivo. No crece con las horas, no decae por ausencia, no hay que cuidarla.
- `[C]` Consecuencia: la mascota **no** es el lugar donde se plasma el esfuerzo (§1). Ese lugar sigue sin definir; candidato natural, la pantalla de estadísticas o la temática visual.
- `[C]` Pendiente al diseñarla: a qué reacciona (inicio, pausa, cumplir la meta, aviso 20-20-6) y qué ocurre con ella al cerrar la sesión.

---

## 4. Conclusiones

### 4.1 Meta: diaria, configurable, con dos formas de escribirla (de 3.5)

Decidido por Jason el 2026-09-17:

- **Meta diaria, no semanal.** Una cantidad por defecto para todos los días, modificable día por día de la semana.
- **Dos modos de configurar, se elige uno, nunca los dos a la vez:**
  1. **Numérico:** horas o minutos por día de la semana.
  2. **Bloques:** se pintan bloques horarios de la semana, tipo Google Calendar. Distintos en cada día.
- **Una sola regla de cumplido para los dos modos:** minutos estudiados en el día ≥ meta de ese día. En modo bloques, la meta del día es la suma de sus bloques.
- **Estudiar fuera del horario del bloque cuenta igual** y compensa las horas del bloque que no se estudiaron. Motivo: si no contara, la app castigaría estudiar (`diseno-hook.md` §4.4). Así tampoco se duplica la lógica de racha ni de estadísticas.
- **Lo que el modo bloques agrega** sobre el numérico: editor visual y **hora de aviso**. Ese aviso necesita la app abierta, o push (Service Worker + VAPID, `proyecto.md` §4).
- **Pasarse de la meta da una recompensa especial** (`[J]`): tiene que hacer sentir muy bien y sentirse especial, solo en esas ocasiones.
- `[C]` **Día con meta en cero = descanso:** cumple sin estudiar y no rompe la racha. Sale de la regla anterior. Sin esto, quien deja el domingo libre pierde la racha cada domingo.

### 4.2 Umbral de la recompensa especial y compensación (de 3.6)

Decidido por Jason el 2026-09-17:

- **La recompensa especial salta en:** meta del día + deuda pendiente + 30 min.
- **Deuda:** los minutos que faltaron los días no cumplidos. Cómo se acumula y caduca: §4.3 (cubeta de 3 h con reloj de 7 días). Esa versión manda sobre cualquier redacción anterior por día suelto.
- Ejemplo: ayer meta 2 h y estudió 1 h → deuda 1 h. Hoy meta 2 h → la recompensa salta a las 3 h 30.

### 4.3 Deuda como cubeta y cuándo se pierde la racha (de 3.6 y 3.1)

Decidido por Jason el 2026-09-17. **Reemplaza** "la racha se rompe al no cumplir un día": un día no cumplido no rompe nada mientras la deuda entre en la cubeta.

- **Cubeta de deuda: capacidad 3 h.** Empieza vacía.
- **Día no cumplido** → entran los minutos que faltaron.
- **Si al entrar pasa de 3 h → racha perdida y cubeta a cero.** Confirmado con ejemplo: faltar 4 h en un día rompe la racha en el acto.
- **Reloj de 7 días** desde que la cubeta empieza a llenarse estando vacía. Si a los 7 días no está vacía → racha perdida y cubeta a cero.
- **No se lleva cuenta por día:** es una sola cubeta con un solo reloj (`[J]`).
- **Los minutos por encima de la meta del día vacían la cubeta.**
- **Recompensa especial** al llegar a: meta del día + deuda actual + 30 min.

**Pendiente de esta conclusión:**
- `[C]` Qué se ve mientras hay deuda. La cubeta tiene que ser visible **antes** de romperse, no recién al romperse (problema que planteó Jason en 3.1).
- `[C]` Si perder la racha es el único castigo, revisar que no choque con "sin castigo visual por ausencia" (§2).
- Si cumplir la meta sin pasarse también da algo, y qué. Jason dijo que le gusta cerrar el día, y hoy la recompensa solo está definida para pasarse.
- Modelo de datos: meta por día de la semana y bloques. Todavía no está en `proyecto.md` §6.
- Qué se ve en Home y en estadísticas con este esquema.
