# AOMNIS - Hoja de Ruta de la Plataforma
### Sistema de Gestion Logistica - Estudio AOM Siniestros
---

## Vision General

AOMNIS centraliza toda la operacion del Estudio AOM en un solo sistema con roles diferenciados. Reemplaza la planilla Excel, el bloc de notas, los mails manuales, las capturas de WhatsApp y el tablero de Notion. La informacion se carga una sola vez y viaja automaticamente hacia donde corresponda.

---

## Roles del Sistema

| Rol | Que ve | Que puede hacer |
|---|---|---|
| **Coordinador/Admin** | Todo. Dashboard completo, metricas globales y financieras, todos los casos y tareas sin restriccion. | Crear casos, asignar peritos, cambiar cualquier estado, facturar, gestionar incidencias, ABM de peritos/gestores/talleres/repuesteros, crear tareas, configurar honorarios y tarifas, acceder a reportes completos y financieros |
| **Perito de Calle** | Su agenda del dia, detalle de cada caso asignado, tareas donde fue agregado, su panel de inspecciones y ganancias personales | Ver info del siniestro, subir fotos/archivos, cargar acuerdo de valores, marcar inspeccion como realizada, subir presupuestos, comentar en tareas, ver su reporte personal |
| **Perito de Carga** | Casos en Pendiente de Carga y sus casos activos, tareas donde participa o creo, sus metricas de rendimiento y ganancias personales | Ver expediente completo, actualizar estado post-carga, registrar licitaciones, reclamar IP a perito, crear tareas, comentar, ver su panel de metricas y ganancias |

**Nota:** Un mismo perito puede ser asignado como Perito de Calle y Perito de Carga en el mismo caso (ej: inspecciones remotas).

---

## Modulos Administrativos

### ABM de Peritos (Calle y Carga)

Sector de administracion donde el Coordinador puede agregar, modificar o eliminar peritos.
- Los peritos se registran en la plataforma, pero el admin tiene control total para editar su informacion en cualquier momento.
- Informacion del perito: Nombre, Apellido, Telefono, Mail, Tipo (Calle / Carga / Ambos), Estado (Activo / Inactivo).
- Los peritos activos aparecen en los selectores/desplegables al crear o editar un caso.
- Si un perito se desactiva, los casos ya asignados permanecen, pero no aparece para nuevas asignaciones.

### ABM de Gestores de Reclamo

Directorio de gestores de la compania, administrado por el Coordinador.
- Campos: Nombre, Apellido, Mail, Telefono.
- Los gestores aparecen como opciones en el desplegable al cargar un caso.
- Tener sus datos centralizados permite futuras automatizaciones (envio automatico de informes por mail al gestor correspondiente).

### ABM de Talleres

Directorio de talleres, administrado por el Coordinador.
- Campos: Razon Social, CUIT, Telefono/WhatsApp, Mail, Localidad, Direccion, Hace Inspecciones Remotas (check si/no).
- El check de inspecciones remotas permite filtrar talleres que pueden colaborar con IPs remotas (el taller manda las fotos en lugar del perito).
- Futuro: al asignar una IP Remota, el sistema podria sugerir talleres cercanos que hagan remotas.

### ABM de Repuesteros

Directorio de repuesteros, administrado por el Coordinador.
- Campos: Razon Social, CUIT, Telefono/WhatsApp, Mail.
- Sin direccion ni localidad (no se visitan, contacto por mail/telefono para reclamos o consultas de precios).

### Configuracion de Honorarios y Tarifas

Tabla de tarifas configurable por el Coordinador. Define cuanto paga Sancor por cada tipo de inspeccion y cuanto se le paga a cada rol.

Estructura de la tabla:
- Tipo de IP (cada tipo tiene su fila)
- Tarifa Perito de Calle (lo que se le paga al perito de calle)
- Tarifa Perito de Carga (lo que se le paga al perito de carga)
- Tarifa AOM (lo que paga Sancor al estudio)

Ejemplo actual de valores:
- IP con Orden: Perito Calle $9.562 / Perito Carga $8.925 / AOM $34.000
- Posible DT: Perito Calle $9.562 / Perito Carga $8.925 / AOM $41.500
- (etc. para cada tipo de IP)

Adicionalmente:
- Tarifa de Kilometraje para Perito de Calle: valor configurable (actualmente $300 por inspeccion). Este es un monto fijo por inspeccion que se le paga al perito de calle en concepto de km. A futuro, se reemplazara por un calculo automatico basado en el circuito real del dia con Google Maps.
- Tarifa de Kilometraje AOM (lo que paga Sancor por km recorrido): valor configurable (actualmente se calcula sobre el circuito total del dia, ruta mas corta por Google Maps). Para Fase 3, se registra como valor general. En Fase 4, se automatiza con Google Maps.

El admin puede modificar estas tarifas en cualquier momento. Los cambios aplican para casos NUEVOS. Los casos ya cerrados mantienen la tarifa vigente al momento de su cierre.

IMPORTANTE: Guardar historial de cambios de tarifas con fecha efectiva, para que las liquidaciones historicas se calculen con la tarifa correcta de ese momento.

---

## FASE 1 - Carga de Casos (Ingreso desde Sancor a AOMNIS)

### 1.1 Formulario Agregar Siniestro

Campos del formulario:

**Datos obligatorios:**
- Numero de Siniestro (identificador unico, todo gira en torno a esto)
- Tipo de IP (selector: IP con Orden, Posible DT, IP sin Orden, Ampliacion, Ausente, Terceros, IP Camiones, IP Remota, Sin Honorarios, IP Final/Intermedia)
- Perito de Calle (selector de peritos activos)
- Perito de Carga (selector de peritos de carga activos)

**Datos opcionales (no siempre disponibles al momento de la carga):**
- Fecha de Inspeccion (date picker, solo dia sin horario; si no se completa, el estado se setea automaticamente como Pendiente Coordinacion)
- Gestor de Reclamo (selector del directorio de gestores)
- Numero de Servicio (texto libre)
- Patente (texto, formato argentino)
- Vehiculo - Marca/Modelo (texto libre)
- Descripcion (campo de texto largo - reemplazo del bloc de notas, aqui va la info estandarizada del caso)

**Campos automaticos (no los completa el usuario):**
- Fecha de Ingreso: se registra automaticamente con la fecha del dia (solo dia, sin horario)
- Estado: se deduce: con fecha de IP = IP Coordinada / sin fecha = Pendiente Coordinacion
- Historial/Timeline: se inicia automaticamente con Caso creado por [usuario] - [fecha y hora]

**Archivos adjuntos:**
- Zona de drag and drop para multiples archivos (fotos, PDFs, documentos)
- Cada archivo queda vinculado al expediente del siniestro
- Vista previa rapida sin necesidad de descargar
- Posibilidad de agregar mas archivos en cualquier momento del ciclo de vida del caso

### 1.2 Carga Rapida (Modo Secuencial)

Para la carga diaria de 10-15 casos:
- Al guardar un caso, el formulario se limpia automaticamente y queda listo para el siguiente.
- Sin navegacion intermedia.
- Contador visible: Caso N cargados hoy.
- Confirmacion visual breve de que el caso anterior se guardo correctamente.

### 1.3 Vista de Expediente (El Caso como unidad central)

Cada siniestro tiene su ficha completa que incluye:

**Cabecera fija:**
- Numero de siniestro (grande, visible)
- Estado actual (con badge de color)
- Tipo de IP
- Perito de Calle / Perito de Carga asignados
- Patente + Vehiculo

**Secciones del expediente:**
- Informacion general: Todos los datos cargados al crear el caso
- Archivos: Galeria de fotos y documentos adjuntos, con vista previa
- Tareas: Lista de tareas vinculadas al caso (visibles segun permisos del usuario)
- Timeline / Historial: Registro cronologico automatico de todo lo que paso con el caso. Cada evento lleva timestamp (fecha + hora).

### 1.4 Estados del Caso

| Estado | Significado | Quien lo activa | Como |
|---|---|---|---|
| **IP Coordinada** | Inspeccion con fecha asignada | Sistema | Automatico al cargar con fecha de IP |
| **Pendiente Coordinacion** | Caso sin fecha, hay que contactar al socio | Sistema | Automatico al cargar sin fecha de IP |
| **Contactado** | Se contacto al socio, esperando respuesta | Coordinador | Manual |
| **En Consulta con Cia** | Problema, se consulto a la compania | Coordinador | Manual |
| **Pendiente de Carga** | Perito de calle finalizo, esperando que el perito de carga lo procese | Perito de Calle | Boton Inspeccion realizada |
| **Pendiente Presupuesto** | IP realizada pero falta presupuesto del concesionario | Perito de Calle / Perito de Carga | Manual |
| **Licitando Repuestos** | Perito de carga esperando precios de proveedores (~24hs) | Perito de Carga | Manual |
| **IP Reclamada a Perito** | Perito demorado en enviar la inspeccion | Coordinador / Perito de Carga | Manual |
| **Esperando Respuesta 3ro** | Esperando firma de ofrecimiento del tercero | Perito de Carga | Manual |
| **Inspeccion Anulada** | Se cancelo la inspeccion | Coordinador | Manual |
| **IP Cerrada** | Inspeccion finalizada y cargada en Sancor | Perito de Carga | Manual |
| **Facturado** | Caso cerrado y facturado | Coordinador | Manual |

### 1.5 Flujo Principal de Estados

```
CASO NUEVO
    |-- Con fecha de IP --> [IP Coordinada]
    |       |
    |       v
    |   Perito realiza inspeccion
    |       |
    |       |-- Caso normal --> [Pendiente de Carga] --> Perito de Carga toma el caso
    |       |                                               |
    |       |                                               |-- [Licitando Repuestos] --> [IP Cerrada] --> [Facturado]
    |       |                                               +-- [IP Cerrada] --> [Facturado]
    |       |
    |       +-- Caso concesionario --> [Pendiente Presupuesto]
    |                                       |
    |                                       v (se sube presupuesto)
    |                                  [Pendiente de Carga] --> (sigue flujo normal)
    |
    +-- Sin fecha de IP --> [Pendiente Coordinacion]
            |
            |-- [Contactado] --> se coordina --> [IP Coordinada] --> (sigue flujo normal)
            +-- [Inspeccion Anulada]

RAMIFICACIONES (pueden ocurrir en cualquier punto):
    --> [En Consulta con Cia]
    --> [IP Reclamada a Perito]
    --> [Esperando Respuesta 3ro]
    --> [Inspeccion Anulada]
```

### 1.6 Timestamps y Metricas

Cada cambio de estado registra automaticamente fecha y hora. Esto permite calcular:
- Tiempo desde asignacion hasta inspeccion
- Tiempo desde inspeccion (Pendiente de Carga) hasta carga efectiva
- Tiempo desde carga hasta cierre
- Tiempo desde cierre hasta facturacion
- Tiempo total del caso (ingreso a facturacion)
- Deteccion de cuellos de botella por fase y por perito

---

## Tipos de Inspeccion

| Tipo | Descripcion |
|---|---|
| IP con Orden | Inspeccion normal |
| Posible DT | Inspeccion por posible destruccion total |
| IP sin Orden | Inspeccion normal sin orden de trabajo emitida |
| Ampliacion | Re-inspeccion de un caso previo, falto algo |
| Ausente | Unidad no se presento a la inspeccion |
| Terceros | Inspeccion por fotografias + envio de ofrecimiento |
| IP Camiones | Inspeccion de camiones |
| IP Remota | Inspeccion remota (fotos del asegurado/taller, sin perito presencial) |
| Sin Honorarios | Gestion sin cobro |
| IP Final/Intermedia | Verificar que se hizo la reparacion |

---

## FASE 2 - Tareas, Comunicacion y Notificaciones

### 2.1 Concepto General

Las tareas reemplazan al tablero de Notion. Una tarea es una incidencia, consulta o problema vinculado a un siniestro que requiere atencion y comunicacion entre los involucrados.

Al abrir una tarea, el usuario tiene acceso inmediato al expediente completo del siniestro.

### 2.2 Quien Puede Crear Tareas

- Coordinador/Admin: Puede crear tareas en cualquier caso.
- Perito de Carga: Puede crear tareas en los casos donde esta asignado.
- Perito de Calle: NO puede crear tareas. Solo participa cuando lo agregan.

### 2.3 Estructura de una Tarea

- Titulo (texto breve)
- Siniestro vinculado (obligatorio)
- Estado: Pendiente / En Proceso / Resuelta
- Prioridad: Normal / Urgente
- Creada por (automatico)
- Fecha de creacion (automatico, timestamp)
- Participantes (quienes pueden ver y comentar)

**Visibilidad:** Solo los participantes ven la tarea. Admin ve TODAS siempre.

### 2.4 Conversacion dentro de la Tarea

- Hilo tipo chat, orden cronologico
- Adjuntar archivos en comentarios (tambien quedan en el expediente del caso)
- Menciones (@) a participantes
- Timestamp en cada comentario

### 2.5 Vista de la Tarea

Dos zonas: contexto del caso (expediente) arriba/lateral + conversacion abajo/principal.

### 2.6 Tablero de Tareas (Vista Kanban)

3 columnas: Pendiente | En Proceso | Resuelta

- Drag and drop para cambiar estado
- Tarjetas con: titulo, siniestro, prioridad, participantes, preview ultimo comentario
- Badge numerico de mensajes sin leer (personal por usuario)
- Filtro Con respuestas nuevas: solo tareas con comentarios no leidos
- Filtros: por siniestro, participante, prioridad, fecha

### 2.7 Sistema de Notificaciones

**Se disparan:**
- Inspeccion realizada: notifica a Perito de Carga
- Pendiente Presupuesto: notifica a Perito de Calle
- Asignado como participante de tarea: notifica al agregado
- Mencion (@) en comentario: notifica al mencionado
- Tarea cambia de estado: notifica a todos los participantes

**NO se disparan:** comentarios nuevos en tareas, subida de archivos al expediente, otros cambios de estado.

Implementacion: campana con contador, leida/no leida, centro de notificaciones.

### 2.8 Boton Inspeccion Realizada

- Cambia estado a Pendiente de Carga
- Registra timestamp
- Notifica al Perito de Carga
- Sin validacion de archivos

---

## FASE 3 - Panel de Control, Reportes y Finanzas

### 3.1 Concepto General

El Panel de Control es el centro de comando del Coordinador. Permite detectar problemas a tiempo, tener una foto completa del estado del estudio y tomar decisiones basadas en datos reales, incluyendo datos financieros.

### 3.2 Dashboard del Coordinador

Pantalla principal al ingresar a AOMNIS. Organizado por prioridad:

**BLOQUE 1 - Alertas de Casos Demorados (prioridad maxima):**

Casos que llevan demasiado tiempo en un estado sin avanzar. Tarjetas de alerta con indicador visual (rojo/amarillo).

Umbrales configurables. Valores iniciales:
- Pendiente Coordinacion: 48hs
- Contactado: 72hs
- Pendiente de Carga: 24hs
- Pendiente Presupuesto: 5 dias
- Licitando Repuestos: 48hs
- IP Reclamada a Perito: 24hs
- Esperando Respuesta 3ro: 7 dias
- IP Cerrada sin facturar: 5 dias

Cada alerta: numero siniestro, estado, dias en ese estado, perito, tipo IP. Click lleva al expediente.

**BLOQUE 2 - Resumen de Casos por Estado:**

Contadores numericos grandes por cada estado activo. Click en contador filtra la lista de casos.
Mini resumen: total activos, cerrados este mes, facturados este mes.

**BLOQUE 3 - Agenda del Dia y Manana:**

Inspecciones de HOY y MANANA agrupadas por perito de calle.
Por perito: nombre, lista de inspecciones (siniestro, patente, vehiculo, tipo IP), cantidad total.
Boton Copiar al portapapeles (formateado para pegar en WhatsApp). En Fase 4: envio directo por WhatsApp.

**BLOQUE 4 - Facturacion Pendiente:**

Casos en IP Cerrada sin facturar, ordenados por antiguedad.
Muestra: siniestro, fecha cierre, dias sin facturar, perito de carga.
Total acumulado de casos pendientes.
Boton Marcar como facturado directamente desde el dashboard.

**BLOQUE 5 - Metricas Resumen:**

Tarjetas con metricas clave del mes:
- Tiempo promedio de caso completo
- Tiempo promedio de inspeccion a carga
- Casos ingresados vs cerrados vs facturados
- Neto del estudio en el periodo (facturado a Sancor - honorarios peritos)
- Link a Reportes detallados

### 3.3 Seccion de Reportes Detallados (Solo Coordinador)

**Filtros globales:**
- Rango de fechas (desde/hasta)
- Filtro por semana o por mes (fundamental para liquidaciones)
- Por perito (calle y/o carga)
- Por tipo de IP
- Por estado actual
- Por gestor de reclamo

**Reporte 1 - Rendimiento por Perito:**

Perito de calle: inspecciones realizadas, tiempo promedio hasta inspeccion, IPs reclamadas, inspecciones por dia.
Perito de carga: casos cargados, tiempo promedio hasta cierre, casos en licitacion, demoras.

**Reporte 2 - Tiempos por Fase:**

Desglose del tiempo promedio en cada etapa. Graficos de tendencia mensual.

**Reporte 3 - Volumen de Casos:**

Casos ingresados, cerrados, facturados por mes. Distribucion por tipo de IP y por perito.

**Reporte 4 - Incidencias y Tareas:**

Tareas creadas por periodo, tiempo de resolucion, urgentes vs normales, casos con mas incidencias.

**Reporte 5 - Financiero (Solo Admin):**

Este reporte reemplaza la planilla de Excel con formulas cruzadas.

Liquidacion por perito (filtrable por semana/mes):
- Perito de Calle: lista de inspecciones realizadas en el periodo, con tipo de IP y tarifa correspondiente. Total a pagar. Mas kilometraje (cantidad de inspecciones x tarifa km). Gran total.
- Perito de Carga: lista de casos cargados/cerrados en el periodo, con tipo de IP y tarifa correspondiente. Total a pagar.

REGLA CRITICA DE IMPUTACION POR FECHA:
- Al perito de calle se le imputa el trabajo segun la fecha del timestamp de Inspeccion Realizada.
- Al perito de carga se le imputa el trabajo segun la fecha del timestamp del cambio a IP Cerrada.
- Si el perito de calle inspecciono el 31/03 y el perito de carga cerro el 02/04, el perito de calle cobra en marzo y el perito de carga cobra en abril. Cada uno en el mes en que hizo SU parte.

Resumen financiero del estudio:
- Total facturado a Sancor en el periodo (suma de tarifas AOM por tipo de IP de casos facturados + kilometraje AOM)
- Total honorarios pagados a peritos en el periodo (calle + carga + km)
- Neto del estudio (facturado - honorarios)
- Desglose por tipo de IP: cantidad, ingreso bruto, costo peritos, neto
- Total potencial (casos pendientes + licitando + para facturar + cerrados, como en la planilla actual)

**Reporte 6 - Facturacion:**

Casos facturados por mes, tiempo promedio cierre a facturacion, pendientes acumulados.

### 3.4 Panel del Perito de Carga (Metricas Personales)

- Casos cargados este mes
- Tiempo promedio de carga
- Casos pendientes actualmente
- Casos en licitacion
- Rendimiento vs benchmark anonimo
- Ganancias del periodo: lista de sus casos cerrados con tarifa por tipo, total acumulado

### 3.5 Panel del Perito de Calle (Metricas Personales)

- Inspecciones realizadas este mes
- Ganancias del periodo: lista de sus inspecciones con tarifa por tipo + km, total acumulado
- Vista simple, sin metricas de rendimiento comparativas

### 3.6 Configuracion de Alertas

Coordinador puede ajustar umbrales de horas/dias por estado. Activar/desactivar alertas.

---

## FASE 4 - Automatizaciones e Integraciones (Futura)

*Por definir. Incluira:*
- Integracion con n8n para flujos automatizados
- Notificaciones por WhatsApp via API (Twilio o similar)
- Push notifications moviles
- Posible scraping o RPA para Sancor (si es viable)
- Envio automatico de mails a peritos al crear caso
- Envio automatico de informes a gestores por mail
- Boton Enviar agenda por WhatsApp (upgrade del copiar al portapapeles)
- Integracion con Google Maps para calculo automatico de circuitos diarios por perito de calle
- Calculo automatico de kilometraje real por circuito (ruta mas corta)
- Mapa con recorrido del dia para cada perito de calle
- Preparacion: cada perito de calle tiene sub-zonas. El circuito se calcula con las inspecciones de ESE perito en ESE dia. Los datos necesarios ya existen (perito asignado + fecha inspeccion + direccion del caso si se agrega).

---

## Notas Tecnicas para Antigravity

- La carga desde Sancor es y sera manual en la Fase 1. No intentar automatizar esto.
- El numero de siniestro es el identificador unico universal del sistema.
- UI/UX es prioridad: los peritos de calle van a usar esto desde el celular, debe ser responsive y rapido.
- El campo Descripcion es el reemplazo del bloc de notas. Debe poder contener texto largo y formateado.
- Todos los estados son los que el estudio ya usa. No inventar estados nuevos ni cambiar nombres.
- Los archivos adjuntos son criticos: fotos, PDFs, documentos. El sistema de archivos debe ser robusto.
- Cada cambio de estado debe registrar timestamp automatico (fecha + hora) para metricas.
- La transicion de Pendiente de Carga a otros estados es siempre manual (sin vinculo con Sancor).
- Un mismo perito puede ocupar ambos roles (calle y carga) en el mismo caso.
- El admin/coordinador tiene control total: puede ver todo, editar todo, cambiar cualquier estado.
- Las tareas tienen visibilidad controlada por participantes. El admin ve todo siempre.
- Los archivos adjuntados en comentarios de tareas deben quedar tambien accesibles desde el expediente.
- Las notificaciones deben ser accionables.
- Los comentarios nuevos en tareas NO generan notificacion push. Se gestionan con badge de sin leer.
- El boton Inspeccion realizada no tiene validaciones.
- El dashboard del Coordinador es la pantalla principal de AOMNIS para el rol admin.
- Los umbrales de alerta deben ser configurables, no hardcodeados.
- Las metricas se calculan a partir de los timestamps de la tabla Timeline/Historial.
- El Perito de Carga solo ve SUS metricas. Nunca datos de otros peritos.
- Las tarifas de honorarios tienen historial. Guardar fecha efectiva de cada cambio.
- La imputacion de trabajo por mes se hace segun el timestamp de LA ACCION DE ESE PERITO, no segun el cierre general del caso.
- Los reportes financieros son SOLO para el admin. Ningun perito ve datos financieros del estudio.
- Los peritos ven sus propias ganancias, no las del estudio ni las de otros peritos.
- Preparar la estructura para futura integracion con Google Maps (campo de direccion en el caso, relacion perito-zona).

---

*Documento vivo - se ira actualizando a medida que definamos cada fase.*
*Ultima actualizacion: Marzo 2026 - v6 (Fases 1-3 completas + ABM talleres/repuesteros + honorarios + financiero)*