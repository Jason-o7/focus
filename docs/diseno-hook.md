# Diseño de hábito — framework de Hooked aplicado a la app

Referencia de trabajo para Claude, no resumen del libro. Uso: la sección 12
(protocolo) guía las decisiones; las demás son la regla detrás de cada paso.

Marcas: `[F]` = modelo de Nir Eyal. `[I]` = inferencia/ingeniería propia.

---

## 1. El ciclo

`[F]` Cuatro fases, siempre en orden: disparador → acción → recompensa variable →
inversión. Difiere de un bucle de retroalimentación común en dos cosas: la
recompensa es impredecible (crea deseo, no solo satisface) y la inversión arma el
disparador de la vuelta siguiente.

| Fase       | Qué logra                               | Señal de falla                                                                                    | Decisión que obliga                               |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Disparador | Que el usuario empiece                  | Tiene el producto y no lo abre                                                                    | Qué emoción/momento reclamo y por qué canal aviso |
| Acción     | Conducta mínima hecha esperando premio  | Abre y no hace nada, o abandona a mitad                                                           | Cuántos pasos hay hasta el premio y cuáles saco   |
| Recompensa | Resolver el problema y dejar ganas      | (a) usa una vez y no vuelve = mal encaje; (b) vuelve 2 semanas y se aburre = variabilidad agotada | Tipo de recompensa y dónde está la incertidumbre  |
| Inversión  | Dejar algo que mejora la próxima vuelta | Solo vuelve cuando se le avisa                                                                    | Qué trabajito pido y cuándo                       |

`[F]` Encadenamiento: la vuelta 1 arranca con disparador externo. Con repetición
y alivio real, la emoción pasa a disparar sola. Tarda semanas o meses. Cada vuelta
acumula valor (contenido, datos, red) que hace el disparador más pertinente, la
acción más fácil y la recompensa más rica.

---

## 2. Disparadores

**2.1 Distinción.** `[F]` No es físico. Es dónde está la información de qué hacer:
en el entorno (externo: botón, correo, ícono) o en la memoria del usuario, pegada
a una emoción o rutina (interno).

`[F]` Un externo bien hecho dice qué hacer después, con una sola acción. Más
opciones exigen evaluar; evaluar produce duda y abandono.

**2.2 Tipos de externo.** `[F]`

- Pagado (publicidad): sirve para adquirir. Pagar por cada regreso es insostenible.
- Ganado (prensa, viral, destacada en tienda): gratis en dinero, efímero.
- De relación (recomendación, invitación): el más potente para crecer. Si se
  obtiene con engaño (invitar contactos sin que el usuario lo entienda), da pico y
  destruye confianza.
- Propio (ícono, notificación aceptada, correo suscrito): ocupa espacio del
  entorno con permiso. **Es el único que produce regreso repetido.** Sin él no se
  puede avisar con la frecuencia que forma el hábito.

`[I]` Obtener el permiso de notificar es meta de producto, no configuración. El
momento del pedido importa tanto como el pedido (ver 5.5: después del premio).

**2.3 Mecanismo del traslado externo → interno.** `[F]` Molestia → uso → alivio,
repetido. El cerebro guarda el atajo. Dos condiciones: frecuencia y alivio real.
Sin alivio, la repetición no construye nada.

**2.4 Qué emoción.** `[F]` Las negativas sirven más: son frecuentes y empujan a
actuar sin deliberar. Aburrimiento, soledad, frustración, confusión, indecisión,
miedo a quedar afuera, miedo a perder un momento. Suelen ser molestias pequeñas,
bajo el umbral de conciencia; eso es lo que las vuelve automáticas. Las positivas
suelen ser la cara de una negativa (entretenerse = no tolerar aburrimiento;
compartir = sostener vínculo).

**2.5 Método para encontrar el disparador interno.** `[F]`

- No se pregunta: lo declarado difiere de lo hecho, y el usuario no accede a la
  emoción que lo mueve. Buscar la distancia entre lo que hace y lo que dice querer.
- Escena: persona concreta, lugar, hora, qué acaba de pasar. No perfil demográfico.
- Cadena de porqués (≈5) desde "¿por qué usaría esto?". Criterio de parada: la
  respuesta ya no se puede convertir en una función del producto.
  "Mandar mensajes" = función. "Miedo a quedar fuera" = emoción.
- `[I]` La cadena ordena, no valida. Si la persona es inventada, la emoción
  también. Contrastar la escena con 3 personas reales antes de construir encima.

**2.6 Ubicación del externo.** `[F]` Lo más cerca posible del momento en que la
emoción aparece. Pregunta previa: qué hace el usuario justo antes de la conducta.
`[I]` Si no se puede saber ese momento, que el usuario lo cargue en la inversión
(5.4).

---

## 3. Acción

**3.1 Modelo de Fogg.** `[F]` Conducta = motivación + capacidad + disparador,
presentes a la vez y en cantidad suficiente. Uso diagnóstico: cuando algo no
ocurre, identificar cuál de los tres faltó (teléfono que no se atiende: está en el
fondo del bolso / es alguien indeseado / está en silencio → tres arreglos
distintos).

**3.2 Motivadores.** `[F]` Tres pares: placer/dolor, esperanza/miedo,
aceptación/rechazo social.

**3.3 Simplicidad, seis dimensiones.** `[F]` Tiempo, dinero, esfuerzo físico,
ciclos mentales, desviación social (cuán aceptado es), no-rutina (cuánto rompe lo
que ya hace).

**3.4 Regla que decide.** `[F]` La simplicidad se mide contra el recurso más
escaso del usuario **en ese momento**, no en abstracto. Pregunta: "¿qué le falta
ahora para dar el siguiente paso?". Lo que simplifica para uno complica para otro
(login con cuenta de terceros: ahorra tiempo al apurado, gasta ciclos mentales al
desconfiado).

**3.5 Primero capacidad, después motivación.** `[F]` Las tres hacen falta, pero la
inversión rinde más bajando esfuerzo. Subir motivación es caro y poco confiable:
la gente no lee textos explicativos y tiene la atención partida. Método: entender
para qué se usa → listar pasos de intención a resultado → borrar pasos. Meta: que
el usuario ya sepa usarlo.

`[I]` La pantalla que explica la propuesta de valor rara vez es la palanca. La
palanca está en el paso donde la gente abandona. Medir abandono por paso antes de
reescribir textos.

**3.6 Heurísticos.** `[F]`

- Escasez: lo escaso se valora más. Si pasa de escaso a abundante, cae por debajo
  del valor que tendría siendo siempre abundante.
- Encuadre: el contexto cambia la percepción real, no solo el juicio (mismo vino,
  más precio → más placer medido).
- Anclaje: se decide por un solo dato (etiqueta de descuento) sin revisar el resto.
- Progreso dotado: quien siente que ya arrancó completa mucho más (tarjeta de 10
  con 2 sellos regalados ≫ tarjeta de 8 vacía, mismo esfuerzo real).
- `[I]` El progreso dotado es el único de los cuatro honesto por defecto (barra de
  perfil que no arranca en 0). Los otros tres se vuelven engaño rápido: ver 10.3.

---

## 4. Recompensa variable

**4.1 Lo que engancha es la anticipación.** `[F]` La activación asociada al deseo
ocurre al esperar la recompensa, no al recibirla. Lo que mueve es la tensión de
querer. Si el resultado es predecible, no hay espera y no hay pulsión. La novedad
recupera la atención; lo predecible deja de verse.

**4.2 Tres tipos.**

| Tipo     | Qué busca `[F]`                                                                                                          | Señal de que aplica `[I]`                                                                   | Cómo se rompe `[I]`                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Tribu    | Aceptación, ser visto, importar. Se aprende viendo a otros ser recompensados, sobre todo pares o gente un escalón arriba | El valor de lo que el usuario produce depende de que otro lo vea o reaccione                | Falta de gente del otro lado: publicar sin respuesta es recompensa nula. Requiere masa mínima |
| Caza     | Recursos, información, cosas                                                                                             | Flujo de ítems de valor desigual, revisar el siguiente es casi gratis, no se sabe cuál vale | Proporción de ítems valiosos muy baja (deja de buscar) o muy alta (es lista, no caza)         |
| Yo mismo | Dominio, competencia, completar                                                                                          | Hay habilidad mejorable o estado "terminado", con resultado incierto paso a paso            | Progreso lineal y previsible, o "terminado" inalcanzable (se vuelve resignación)              |

`[F]` Se combinan. El correo usa los tres: quién escribió (tribu), qué información
trae (caza), vaciar la bandeja (yo mismo).

**4.3 Variabilidad finita vs infinita.** `[F]`

- Finita: se vuelve predecible con el uso (serie, juego de un jugador, contenido
  que produce la empresa). Obliga a producir novedad continuamente (modelo de
  estudio/cartera de apuestas).
- Infinita: la generan otras personas (contenido de usuarios, juego con otros
  humanos). Consumir es finito; crear es infinito.
- Quitar la variabilidad apaga el producto rápido (juego exitoso clonado con otra
  piel: abandono masivo en meses).

**4.4 Autonomía.** `[F]` Ante la percepción de imposición hay reacción refleja en
contra (reactancia). Dos formas de provocarla:

- Activar algo sin consentimiento, sobre todo si expone lo que era privado (caso:
  función de "quién vio qué" activada para todos → rebelión → pasó a opcional).
- Exigir una conducta nueva y ajena (caso: app que obliga a registrar cada comida
  → obligación → abandono al primer olvido; la competidora arrancó por lo que la
  gente ya hacía, charlar sobre entrenar, y sumó lo nuevo después).

Regla: ofrecer una forma más cómoda de algo que ya se hace, no una conducta nueva.
Reafirmar la libertad de elegir aumenta la aceptación (efecto medido: "pero sos
libre de aceptar o no" ≈ duplica el sí).

**4.5 Encaje con el motivo.** `[F]` La recompensa tiene que corresponder al
motivo real de uso. Caso: sitio de preguntas que pagaba dinero perdió contra otro
que solo daba reconocimiento de pares. Nadie iba a ganar plata; para eso trabajaba
por hora. Puntos/medallas/rankings funcionan solo si rascan esa picazón. Sobre una
tarea que nadie quiere hacer, o sin molestia recurrente, no hacen nada.

---

## 5. Inversión

**5.1 Qué cuenta.** `[F]` Trabajo del usuario que mejora el servicio para la
próxima vuelta: invitar, declarar preferencias, construir algo, aprender una
función. No cuenta: pagar y seguir; molestias que no devuelven valor. A diferencia
de la acción, apuesta a beneficio futuro (seguir a alguien no da nada hoy).

**5.2 Por qué funciona.** `[F]` Tres sesgos que producen racionalización:

- Se sobrevalora lo hecho por uno (efecto IKEA: origami propio valuado ~5× más que
  por observadores).
- Consistencia con conducta previa (pedido chico previo: 17% → 76% de aceptación
  del pedido grande).
- Evitar disonancia: tras invertir, se ajusta la opinión para no sentirse tonto.

**5.3 Valor acumulado, cinco tipos.** `[F]`

- Contenido: lo que guarda o crea; irrecuperable fuera.
- Datos: preferencias, historial, cuentas vinculadas; personalizan el servicio.
- Red: a quién sigue y quién lo sigue; lo que hace inútil clonar la tecnología.
- Reputación: puntajes, valoraciones; valor económico, intransferible.
- Habilidad: aprendizaje del producto; baja el esfuerzo futuro y no se traslada.

`[I]` Contenido y datos funcionan desde el día 1 con un solo usuario. Red y
reputación necesitan masa previa. Arrancar por los dos primeros.

**5.4 Disparador cargado.** `[F]` Durante la inversión el usuario deja programado
el aviso que lo traerá de vuelta. Mecanismos:

- Conceder acceso a un contexto: conectar calendario → aviso al terminar cada
  reunión, cuando aparece la ansiedad de olvidar tareas.
- Enviar algo que espera respuesta: cada mensaje implica un pedido de contestar,
  y contestar es trivial.
- Sumarse a un hilo vivo: guardar/comentar/seguir autoriza avisar cuando otro
  aporta ahí. El aviso es sobre algo que el usuario eligió.

**5.5 Orden.** `[F]` Inversión **después** de la recompensa, nunca antes. Motivo:
reciprocidad (medido incluso con computadoras: quien recibió ayuda útil trabajó
casi el doble para la máquina). Es la única fase donde subir fricción es correcto.

**5.6 Escalera.** `[F]` La inversión también requiere motivación y capacidad. Si
no se hace, probablemente se pidió demasiado. Pedidos chicos primero, pesados en
vueltas posteriores.

---

## 6. Viabilidad

**6.1 Ejes.** `[F]` Frecuencia × utilidad percibida (frente a alternativas).
Sobre el umbral, zona de hábito. Muy frecuente con poca ventaja entra (buscador);
poco frecuente con mucha utilidad entra (tienda "de todo").

**6.2 Límite duro.** `[F]` La curva nunca toca el eje de utilidad: bajo cierta
frecuencia no hay hábito posible, por útil que sea; queda como decisión
consciente. Al revés sí: poca utilidad con mucha frecuencia puede ser hábito.
`[I]` Es lo primero a verificar. Única pregunta capaz de cancelar el proyecto.

**6.3 Plazo.** `[F]` Sin número universal: de semanas a más de cinco meses según
complejidad de la conducta e importancia para la persona. Más frecuencia, más
rápido.

**6.4 Vitamina vs analgésico.** `[F]` Distinción engañosa. Muchos productos
empiezan como "bueno tenerlo" y, formado el hábito, no usarlos genera una
incomodidad leve ("picazón"). Pregunta útil: ¿hay una molestia recurrente que el
producto calma más rápido que ignorarla?

**6.5 Cuándo no aplica.** `[F]` Uso/compra naturalmente infrecuente (seguro);
negocios que obtienen la acción por venta, contrato u obligación.

**6.6 Desplazar un hábito existente.** `[F]` Ser algo mejor no alcanza: el usuario
sobrevalora lo viejo y el creador lo nuevo (estimación del libro: ~9× mejor).
Cuanto más cambio de conducta exige, más probable el fracaso aunque el beneficio
sea claro (teclado QWERTY). `[I]` Contar cuántas cosas nuevas aprende el usuario
antes del primer beneficio; más de una es señal de problema.

---

## 7. Preguntas de diseño

`[F]` Las cinco del libro, parafraseadas, más una previa `[I]`. Son una cadena: si
la 4 no responde a la 1, el producto falla aunque el resto esté bien.

0. `[I]` ¿Ocurre lo bastante seguido? → seguir o parar.
1. ¿Qué molestia calma? (interno) → condiciona todo lo demás.
2. ¿Qué lo trae? (externo) → canal, momento, estrategia de permisos.
3. ¿Acción más simple esperando premio, y cómo simplificarla más? → pantallas y
   recorte de pasos.
4. ¿El premio satisface y deja ganas? → tipo de recompensa e incertidumbre.
5. ¿Qué trabajito invierte? ¿Carga disparador y guarda valor? → modelo de datos y
   lógica de notificaciones.

---

## 8. Medición

**8.1 Umbral previo.** `[F]` Antes de mirar datos: cuántas veces por semana
"debería" usarse si el hábito existe. Realista, del usuario típico, no del
extremo. Fuente: productos comparables o frecuencia natural de la molestia.

**8.2 Usuario con hábito.** `[I]` Alcanza el umbral **y** una parte relevante de
sus sesiones empieza sin disparador externo. Si todo regreso viene de
notificación, hay recordatorios, no hábito; muere al revocarse el permiso.

**8.3 Piso.** `[F]` Si menos del 5% alcanza la frecuencia prevista: usuario mal
identificado o producto que no resuelve. Es piso para seguir analizando, no meta.

**8.4 Método en tres pasos.** `[F]`

- Identificar: quiénes cumplen el umbral (análisis por cohortes).
- Codificar: qué hicieron en común (origen, decisiones en el alta, conocidos ya
  dentro). Eso es el camino del hábito. Caso: seguir cierta cantidad de cuentas
  marcaba el punto de permanencia.
- Modificar: llevar a los nuevos por ese camino (alta, contenido, quitar o
  destacar funciones). Repetir con cada función nueva.

**8.5 Eventos.** `[I]` Instrumentar antes del primer usuario; lo no capturado no
se recupera.

| Evento                  | Campos                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `usuario`               | `user_id`, `ts_registro` (cohorte), `origen_adquisicion`                                                |
| `sesion_iniciada`       | `user_id`, `ts`, `origen` (notificacion/email/enlace/directo), `disparador_id?`, `dispositivo`          |
| `accion_nucleo`         | `user_id`, `ts`, `tipo`, `pasos_hasta_completar`, `ms_desde_inicio_sesion`, `completada`                |
| `recompensa_entregada`  | `user_id`, `ts`, `tipo` (tribu/caza/yo), `cantidad`, `habia_novedad`                                    |
| `inversion_realizada`   | `user_id`, `ts`, `tipo` (contenido/dato/red/reputacion/habilidad), `cargo_disparador`, `disparador_id?` |
| `disparador_programado` | `disparador_id`, `user_id`, `ts_creacion`, `ts_previsto`, `origen_inversion`                            |
| `disparador_entregado`  | `disparador_id`, `ts_envio`, `canal`, `abierto`, `ts_apertura`                                          |

**8.6 Métricas.** `[I]`

- Frecuencia semanal por usuario.
- % sesiones espontáneas: sin `disparador_id` ni disparador entregado en la última
  hora. **Métrica principal del hábito.** Debe subir con la antigüedad de la
  cohorte; si no sube, el traslado externo→interno no ocurre.
- Retención por cohorte a 1, 7 y 30 días.
- Tiempo de ciclo: de disparador cargado a regreso. Más corto = más vueltas.
- Conversión de inversión: invierten / recibieron recompensa. Baja = se pide
  demasiado (5.6).
- Mediana de pasos hasta recompensa (3.5).
- Correlación entre acciones de la semana 1 y permanencia a 30 días → camino del
  hábito.

---

## 9. Traducción a construcción

`[I]`

| Concepto           | Decisión en pantalla                                  | Sostén en base de datos                                 | Medición                                               |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Disparador interno | Primera pantalla habla de la emoción, no de funciones | Nada directo; orienta el modelo                         | % sesiones espontáneas por cohorte                     |
| Externo propio     | Pedir permiso de notificar después del primer premio  | `usuario.permiso_notif`, `canal_preferido`              | Aceptación del permiso; apertura                       |
| Acción núcleo      | Un solo botón principal en la vista central           | Tabla de la entidad que crea                            | Pasos hasta completar; abandono por paso               |
| Simplicidad        | Qué campos elimino o difiero                          | Campos anulables; defaults sensatos                     | Mediana de pasos hasta recompensa                      |
| Tribu              | Dónde y con qué demora se ven reacciones ajenas       | `reacciones(origen_id, autor_id, tipo, ts)`             | Regreso tras primera reacción recibida                 |
| Caza               | Lista con carga continua y corte visual abajo         | Paginación por cursor; índice por relevancia            | Profundidad de scroll; ítems por sesión                |
| Yo mismo           | Progreso, estado completo, racha                      | `progreso(user_id, dimension, valor, ts)`               | % que completa; regreso al día siguiente               |
| Variabilidad       | Proporción impredecible de lo mostrado                | Mezcla controlada en consulta; `habia_novedad`          | Caída de frecuencia semanas 2–6                        |
| Inversión          | Qué se pide justo tras el premio                      | Tabla del tipo de valor guardado                        | Conversión de inversión                                |
| Disparador cargado | Qué acción programa un aviso futuro                   | `disparadores(id, user_id, ts_previsto, origen)` + cola | Tiempo de ciclo; % de vueltas desde disparador cargado |
| Progreso dotado    | Barra de perfil arranca sobre cero                    | Valor derivado, no campo                                | Completado de perfil                                   |
| Autonomía          | Toda función nueva nace apagada y es reversible       | `preferencias(user_id, clave, valor)`                   | Bajas tras cada lanzamiento                            |
| Camino del hábito  | Qué empuja el alta en los primeros minutos            | Cohorte por `ts_registro`                               | Retención 30 días antes/después del cambio             |

---

## 10. Líneas rojas

**10.1 Matriz de manipulación.** `[F]` Dos preguntas antes de escribir código:
¿lo usaría yo? ¿mejora de forma concreta la vida del usuario?

- Sí/sí — facilitador. Mayor probabilidad de acierto (conoce al usuario). Si la
  respuesta requiere justificación o matiz, es no.
- No lo usa / mejora — vendedor. No inmoral, pero baja probabilidad de acierto;
  aquí cae la gamificación de tareas que nadie quiere.
- Lo usa / no mejora — entretenedor. Legítimo, efímero, exige novedad constante.
- No/no — explotador.

Excepción `[F]`: cuenta como usuario propio quien habría usado el producto en una
etapa reciente de su vida; cuanto más lejana, peor la apuesta.

**10.2 Prueba para decisiones puntuales.** `[I]` Si el usuario supiera exactamente
por qué se le muestra esto ahora, ¿lo seguiría usando igual? Si depende de que no
lo sepa, es línea roja.

**10.3 No implementar.**

- `[F]` Engañar para invitar contactos o publicar en nombre del usuario.
- `[F]` Activar sin aviso funciones que exponen lo privado.
- `[F]` Dirigirse a quien no puede autorregularse.
- `[I]` Escasez falsa (existencias o plazos inventados).
- `[I]` Progreso que no conduce a una meta alcanzable.
- `[I]` Dificultar la salida o la exportación de lo acumulado.
- `[I]` Tiempo en pantalla como métrica principal.

**10.4 Uso dañino.** `[F]` La proporción de dependencia patológica es baja (~1%
incluso en tragamonedas), pero quien construye ahora tiene datos para detectarla,
y eso crea obligación de actuar. `[I]` Definir desde el inicio qué patrón se
considera excesivo, dejar la consulta que lo detecta y decidir la respuesta del
producto (mínimo, un aviso).

---

## 11. Fronteras

**No aplica.** `[F]` Uso naturalmente infrecuente; acción obtenida por venta,
contrato u obligación.

**No alcanza.** `[F]` No cubre modelo de negocio ni adquisición rentable. No
garantiza permanencia: siempre llega algo mejor; el valor acumulado encarece irse,
no lo impide.

**Errores frecuentes.**

- `[F]` Confundir pico de atención (prensa, destacada) con retención.
- `[F]` Copiar mecánicas sin la necesidad que cubren.
- `[F]` Pedir inversión antes de dar valor.
- `[F]` Suponer que el dinero motiva sin verificar para qué vino el usuario.
- `[I]` Depender solo de notificaciones: el producto vive de un permiso prestado.

**Sin arreglo de diseño.** `[I]` Producto que no resuelve nada, conducta
demasiado infrecuente, recompensa ajena al motivo real. Son fallas de diagnóstico;
ningún ajuste al ciclo las corrige.

---

## 12. Protocolo

`[I]` Orden de decisión. Cada paso produce una salida; sin ella no se avanza.

1. **Frecuencia.** Salida: "cada vez que [situación], el usuario siente
   [molestia]" + veces por semana. Menos de ~3/semana: cambiar de conducta
   objetivo o aceptar que el producto no se sostiene por hábito.
2. **Disparador interno.** Salida: emoción nombrada + escena (lugar, hora, qué
   acaba de pasar). Si la respuesta se puede convertir en ítem de menú, no es
   emoción.
3. **Conducta objetivo, una.** Salida: un verbo, la acción mínima que ya entrega
   valor. Dos verbos = no se decidió.
4. **Pasos.** Listar todo entre la emoción y el premio; borrar. Salida: cantidad
   antes y después.
5. **Recurso escaso.** Uno de los seis, en el momento de actuar. Salida: cuál y qué
   cambio evita gastarlo. Si no se puede nombrar, la escena del paso 2 es débil.
6. **Tipo de recompensa.** Coherente con el motivo del paso 2. Salida: tipo + dónde
   exactamente está la incertidumbre. Sin incertidumbre señalable, no es variable.
7. **Régimen de variabilidad.** Salida: fuente de novedad; si es finita, plan de
   producción. Finita sin plan = se apaga en semanas.
8. **Inversión mínima**, ubicada tras el premio. Salida: qué se guarda, de qué
   tipo, cómo mejora la próxima vuelta. Si no la mejora, es molestia.
9. **Cerrar el ciclo.** Salida: disparador que esa inversión programa, canal y
   demora estimada. Sin esto hay bucle de tres fases empujado desde afuera.
10. **Matriz.** Salida: cuadrante + líneas rojas específicas del producto. Si hubo
    que justificar, la respuesta es no.
11. **Instrumentar** eventos de 8.5 antes del primer usuario.
12. **Medir → camino del hábito → modificar.** Salida: camino en una frase y cambio
    concreto en el alta. Se repite con cada función nueva.
