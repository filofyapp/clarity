# CLARITY - Documentacion Tecnica del Proyecto
### Fuente unica de verdad para el desarrollo con Antigravity

---

## SOBRE ESTE ARCHIVO

Este archivo es la FUENTE UNICA DE VERDAD del proyecto CLARITY. Antes de hacer cualquier cambio, correccion o agregado en el codigo, Antigravity DEBE leer este archivo completo y comprenderlo.

Reglas de uso:
1. LEER este archivo completo antes de cualquier accion.
2. NUNCA crear soluciones alternativas a las ya documentadas sin aprobacion explicita.
3. ACTUALIZAR este archivo despues de cada cambio realizado.
4. Si una solucion ya existe documentada, USAR esa solucion, no inventar otra.
5. Ante la duda, PREGUNTAR antes de actuar.

---

## 1. QUE ES CLARITY

CLARITY es un sistema de gestion logistica para el Estudio AOM Siniestros. Centraliza la operacion de gestion de pericias de seguros en una sola plataforma.

El sistema trabaja principalmente con Sancor (pero la DB soporta multi-compania). Los casos se cargan manualmente y se gestionan hasta la facturacion.

---

## 2. STACK TECNOLOGICO

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend/DB: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Storage: Supabase Storage (bucket fotos-inspecciones)
- Realtime: Supabase Realtime (casos, tareas, informes_periciales, notas_caso)

NOTA DE DISENO VISUAL: La UI debe ser moderna, estetica y premium. Inspiracion en dashboards tipo Linear o Notion. Tipografia limpia, sombras sutiles, buen sistema de colores, transiciones suaves, espaciado generoso. NO es una planilla de Excel disfrazada. Es un sistema profesional con personalidad visual. Pero siempre funcional primero, estetico segundo. No es una app de consumo ni un juego.

---

## 3. ARQUITECTURA Y MODULOS

### 3.1 Estructura modular

FASE 1 - Carga de Casos: Formulario de ingreso, expediente del siniestro, estados, timestamps.
FASE 2 - Tareas y Comunicacion: Sistema de tareas multi-participante con chat, tablero kanban, notificaciones, badges de sin leer.
FASE 3 - Panel de Control, Reportes y Finanzas: Dashboard, alertas, agenda diaria, facturacion, metricas, reportes, paneles de peritos.
FASE 4 - Automatizaciones: n8n, WhatsApp API, Google Maps circuitos, RPA. (Por definir)

### 3.2 Base de Datos - Tablas EXISTENTES en Supabase

Estas tablas YA EXISTEN. No recrearlas. Modificar solo lo necesario.

**usuarios:**
- id (UUID PK), email, nombre, apellido, rol (admin/carga/calle), telefono, direccion_base, direccion_base_lat, direccion_base_lng, activo, avatar_url, created_at, updated_at
- NOTAS: La direccion_base y coords del usuario son para el punto de partida del circuito de km (Fase 4).

**companias:**
- id (UUID PK), nombre, codigo (UNIQUE), tipo_trabajo (TEXT[]), activa, config (JSONB), created_at
- NOTAS: Soporta multi-compania. Actualmente solo Sancor (codigo: SANCOR). No asumir una sola compania.

**gestores:**
- id (UUID PK), compania_id (FK companias), nombre, email, telefono, sector, notas, activo, created_at, updated_at
- NOTAS: Vinculados a una compania. El campo sector es adicional a lo que definimos.

**talleres:**
- id (UUID PK), nombre, razon_social, cuit, telefono, telefono_alt, email, direccion, direccion_lat, direccion_lng, localidad, provincia, tipo (general/concesionario/especializado/chapa_pintura/mecanica/electrica), marcas_trabaja (TEXT[]), contacto_nombre, horario, notas, activo, created_at, updated_at
- PENDIENTE AGREGAR: campo hace_remotas (BOOLEAN) para saber si pueden colaborar con IP remotas.

**repuesteros:**
- id (UUID PK), nombre, razon_social, cuit, telefono, telefono_alt, email, whatsapp, direccion, localidad, provincia, contacto_nombre, notas, activo, created_at, updated_at
- Tabla adicional: repuestero_marcas (repuestero_id FK, marca TEXT) para filtrar por marca.

**precios:**
- id (UUID PK), compania_id (FK), concepto, tipo (honorario/kilometraje/mano_obra), valor_estudio, valor_perito, descripcion, activo, updated_at
- UNIQUE(compania_id, concepto)
- PENDIENTE: Agregar historial de versiones de tarifas (fecha_vigencia_desde) para liquidaciones historicas correctas. Actualmente se sobreescriben los valores sin historial.

**casos:**
- id (UUID PK), compania_id (FK), numero_siniestro, numero_servicio, tipo (asegurado/tercero), tipo_inspeccion (enum), gestor_id (FK), nombre_asegurado, dni_asegurado, telefono_asegurado, email_asegurado, dominio, marca, modelo, anio, color, direccion_inspeccion, direccion_lat, direccion_lng, localidad, provincia, taller_id (FK), perito_calle_id (FK usuarios), perito_carga_id (FK usuarios), fecha_derivacion, fecha_inspeccion_programada, hora_inspeccion, fecha_inspeccion_real (TIMESTAMPTZ), fecha_carga_sistema (TIMESTAMPTZ), fecha_cierre (TIMESTAMPTZ), estado (enum), facturado, fecha_facturacion, numero_factura, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, caso_origen_id (FK self), datos_crudos_sancor, prioridad, notas_admin, tags (TEXT[]), created_at, updated_at
- NOTAS: Tiene campos de asegurado, vehiculo detallado, geolocalizacion, y facturacion inline que no estaban en nuestro diseno original pero son utiles.
- El campo datos_crudos_sancor es para guardar la info cruda que viene de Sancor (reemplazo del bloc de notas). Es equivalente a nuestro campo descripcion.
- caso_origen_id permite vincular ampliaciones al caso original.

**informes_periciales:**
- id (UUID PK), caso_id (FK UNIQUE), perito_id (FK), taller_id (FK), taller_nombre_manual, se_acuerda (BOOLEAN nullable), reparar, cambiar, pintar, observaciones, chapa_dias, chapa_valor_dia, chapa_subtotal (GENERATED), pintura_panos, pintura_valor_pano, pintura_subtotal (GENERATED), total_mano_obra (GENERATED), valor_repuestos, valor_extras, valor_total_acordado (GENERATED), completo (BOOLEAN), created_at, updated_at
- NOTAS: Esta tabla no estaba en nuestro diseno original pero ES MUY UTIL. El perito de calle llena esto como parte de la inspeccion. Los campos GENERATED calculan automaticamente los totales.

**fotos_inspeccion:**
- id (UUID PK), caso_id (FK), usuario_id (FK), url, url_thumbnail, tipo (general/frente/lateral_izq/lateral_der/trasera/danio_detalle/kilometraje/motor/interior/documentacion/otro), descripcion, orden, created_at
- Storage: bucket fotos-inspecciones (publico)

**tareas:**
- id (UUID PK), caso_id (FK), creador_id (FK), asignado_id (FK), titulo, descripcion, estado (sin_gestion/realizando/realizado/respondido), prioridad (baja/normal/alta/urgente), fecha_vencimiento, fecha_completado, tags (TEXT[]), created_at, updated_at
- PROBLEMA: Modelo actual es de asignado unico. Nuestro diseno requiere MULTI-PARTICIPANTE.
- CAMBIOS NECESARIOS: ver seccion de migraciones.

**notas_caso:**
- id (UUID PK), caso_id (FK), usuario_id (FK), contenido, tipo (nota/consulta/respuesta/sistema), adjuntos (JSONB), created_at
- NOTAS: Funciona como notas generales del caso. Las conversaciones de tareas seran una tabla separada (comentarios_tarea).

**historial_estados:**
- id (UUID PK), caso_id (FK), usuario_id (FK), estado_anterior, estado_nuevo, motivo, created_at
- NOTAS: Este es nuestro Timeline. Fuente de datos para TODAS las metricas.

**kilometraje_diario:**
- id (UUID PK), perito_id (FK), fecha (DATE), casos_ids (UUID[]), direcciones_ordenadas (JSONB), km_total, duracion_estimada_min, ruta_polyline, ruta_google_maps_url, ruta_waze_url, precio_km_estudio, precio_km_perito, monto_total_estudio, monto_total_perito, facturado_estudio, pagado_perito, punto_partida, created_at, updated_at
- UNIQUE(perito_id, fecha)
- NOTAS: Ya preparada para Google Maps. En Fase 3 se usa con valores manuales. En Fase 4 se automatiza.

**configuracion:**
- clave (TEXT PK), valor (JSONB), descripcion, updated_at
- NOTAS: Tabla clave-valor para configs generales. Usar para umbrales de alerta y otros settings.

**links_inspeccion:**
- id (UUID PK), caso_id (FK), token (TEXT UNIQUE), tipo (asegurado/taller/perito), nombre_destinatario, estado (activo/completado/expirado/revocado), expira_en (TIMESTAMPTZ), fotos_subidas (INTEGER), max_fotos (INTEGER default 50), ip_acceso, user_agent, created_by (FK usuarios), created_at, completed_at
- NOTAS: Links compartibles para carga remota de fotos. Token de 32 chars, expira en 72h. Max 50 fotos por link. RLS permite lectura publica (validacion por token en query). Portal publico en /ip/[token].

### 3.3 Tablas NUEVAS que hay que crear (migraciones)

**tarea_participantes:** (reemplaza el modelo de asignado unico)
- id (UUID PK)
- tarea_id (UUID FK tareas)
- usuario_id (UUID FK usuarios)
- created_at (TIMESTAMPTZ)

**comentarios_tarea:**
- id (UUID PK)
- tarea_id (UUID FK tareas)
- usuario_id (UUID FK usuarios)
- contenido (TEXT)
- adjuntos (JSONB DEFAULT [])
- created_at (TIMESTAMPTZ)

**comentario_lectura:**
- id (UUID PK)
- comentario_id (UUID FK comentarios_tarea)
- usuario_id (UUID FK usuarios)
- leido (BOOLEAN DEFAULT false)
- fecha_lectura (TIMESTAMPTZ nullable)
- UNIQUE(comentario_id, usuario_id)

**notificaciones:**
- id (UUID PK)
- usuario_destino_id (UUID FK usuarios)
- tipo (TEXT: inspeccion_realizada, pendiente_presupuesto, tarea_asignada, mencion, tarea_estado_cambiado)
- caso_id (UUID FK casos, nullable)
- tarea_id (UUID FK tareas, nullable)
- mensaje (TEXT)
- leida (BOOLEAN DEFAULT false)
- created_at (TIMESTAMPTZ)

**precio_historial:** (para versionado de tarifas)
- id (UUID PK)
- precio_id (UUID FK precios)
- valor_estudio_anterior (DECIMAL)
- valor_perito_anterior (DECIMAL)
- valor_estudio_nuevo (DECIMAL)
- valor_perito_nuevo (DECIMAL)
- modificado_por (UUID FK usuarios)
- created_at (TIMESTAMPTZ)

**informes_auditoria:**
- id (UUID PK)
- fecha (DATE NOT NULL)
- contenido_whatsapp (TEXT NOT NULL)
- datos_json (JSONB NOT NULL DEFAULT '{}')
- created_at (TIMESTAMPTZ)
- NOTAS: Almacena informes diarios de auditoría generados manual o automáticamente (cron 18hs). El campo datos_json contiene el desglose completo por perito. RLS: solo admin.

**scores_perito:**
- id (UUID PK)
- perito_id (UUID FK usuarios ON DELETE CASCADE)
- mes (INTEGER CHECK 1-12)
- anio (INTEGER CHECK 2020-2099)
- score (NUMERIC(5,2) DEFAULT 0)
- casos_totales (INTEGER DEFAULT 0)
- casos_cumplidos (INTEGER DEFAULT 0)
- desvios (INTEGER)
- datos_detalle (JSONB)
- updated_at (TIMESTAMPTZ)
- UNIQUE(perito_id, mes, anio)
- NOTAS: Score mensual por perito de calle. Se actualiza con UPSERT cada vez que se genera un informe. Fórmula: TASA_CUMPLIMIENTO - PENALIDAD_SEVERIDAD - PENALIDAD_PRESUPUESTO (piso 0, techo 100). RLS: solo admin.

### 3.4 Modificaciones a tablas existentes

**talleres:** Agregar columna
- hace_remotas BOOLEAN DEFAULT false

**tareas:** Modificar modelo
- Mantener asignado_id por retrocompatibilidad pero agregar sistema de participantes.
- Cambiar estados de sin_gestion/realizando/realizado/respondido a pendiente/en_proceso/resuelta.
- O crear un mapeo: sin_gestion=pendiente, realizando=en_proceso, realizado=resuelta, respondido se elimina (reemplazado por badge de sin leer).
- DECISION TOMADA: No hay datos reales. Se puede DROP y recrear la tabla tareas con el nuevo schema (estados: pendiente/en_proceso/resuelta, sin asignado_id unico, con sistema de participantes).

### 3.5 Triggers existentes - REVISAR

DECISION TOMADA: Eliminar trigger fn_check_transicion_pendiente_carga y fn_check_transicion_por_foto. El boton Inspeccion Realizada pasa directo a pendiente_carga SIN validar fotos ni informe. Si falta algo, se resuelve via tarea o reclamo.

Trigger fn_evaluar_informe_completo: MANTENER como utilidad interna (marca el campo completo en informes_periciales) pero NO afecta el cambio de estado del caso.

---

## 4. ESTADOS DEL CASO

Los estados son EXACTAMENTE estos. No inventar nuevos ni cambiar nombres.

Enum en DB: ip_coordinada, pendiente_coordinacion, contactado, en_consulta_cia, pendiente_carga, pendiente_presupuesto, licitando_repuestos, ip_reclamada_perito, esperando_respuesta_tercero, inspeccion_anulada, ip_cerrada, facturada

DECISION TOMADA: Eliminar el estado inspeccionada del enum. No hay datos reales. El boton Inspeccion Realizada pasa directo a pendiente_carga.

Logica automatica:
- Crear caso CON fecha inspeccion: estado = ip_coordinada
- Crear caso SIN fecha inspeccion: estado = pendiente_coordinacion
- Boton Inspeccion realizada: estado = pendiente_carga + timestamp en historial_estados + notificacion al perito de carga

---

## 5. ROLES Y PERMISOS

Coordinador/Admin (rol: admin):
- Ve todo, edita todo, controla todos los estados
- ABM de peritos, gestores, talleres, repuesteros, honorarios
- Ve TODAS las tareas sin importar participantes
- Dashboard completo, reportes, financiero

Perito de Carga (rol: carga):
- Ve sus casos asignados y casos en pendiente_carga
- Crea tareas en sus casos
- Cambia estados: licitando_repuestos, ip_cerrada, ip_reclamada_perito, esperando_respuesta_tercero, pendiente_presupuesto
- Ve solo tareas donde participa o creo
- Panel personal: metricas + ganancias propias

Perito de Calle (rol: calle):
- Ve su agenda y casos asignados
- Crea y participa en tareas (comunicación directa desde la calle)
- Sube fotos, completa informe pericial, marca Inspeccion realizada
- Panel personal: inspecciones + ganancias

---

## 6. SISTEMA DE NOTIFICACIONES

Se disparan: inspeccion_realizada (a perito carga), pendiente_presupuesto (a perito calle), tarea_asignada, mencion (@), tarea_estado_cambiado.
NO se disparan: comentarios nuevos (badge sin leer), subida archivos, otros cambios estado.

---

## 7. SISTEMA DE MENSAJES SIN LEER

Tabla comentario_lectura. Badge numerico en tarjetas kanban. Filtro Con respuestas nuevas.

---

## 8. FUNCIONES Y BOTONES - REFERENCIA RAPIDA

| Elemento | Donde esta | Que hace | Quien |
|---|---|---|---|
| Agregar Siniestro | Navbar | Abre formulario de carga | Admin |
| Nuevo Caso (sidebar) | Menu lateral | Shortcut a /casos/nuevo | Admin |
| Formulario de carga | Pantalla nuevo caso | Carga caso, modo secuencial | Admin |
| Inspeccion realizada | Vista caso (perito calle) | Estado a pendiente_carga + timestamp + notif | Perito Calle |
| Selector de estado | Vista caso | Cambia estado manual | Segun permisos |
| Nueva tarea | Vista caso / tablero | Crea tarea vinculada | Admin, Perito Carga, Perito Calle |
| Drag and drop tarjetas | Kanban (@dnd-kit) | Cambia estado tarea al soltar | Participantes + Creadores + Admin |
| Cambiar participantes | Tarjeta tarea (card footer + sheet header) | Popover multi-select con checkboxes | Todos (admin/carga/calle) |
| Filtro tareas | Tablero tareas | Todas / Asignadas a mí (multi-participante) / Creadas por mí | Todos |
| Badge sin leer | Tarjeta tarea | Comentarios no leidos | Automatico |
| Chat con @menciones | Tarjeta tarea expandible | Autocomplete @nombre, notifica al mencionado | Todos |
| Campana notificaciones | Navbar (Topbar) | Notificaciones pendientes con realtime | Todos |
| Zona de archivos | Vista caso (expediente) | Drag-drop archivos, Supabase Storage | Todos |
| ABM Peritos | Admin / Config | CRUD usuarios con rol calle/carga | Admin |
| ABM Gestores | Admin / Config | CRUD gestores | Admin |
| ABM Talleres | Admin / Config | CRUD talleres (con tipos y check remotas) | Admin |
| ABM Repuesteros | Admin / Config | CRUD repuesteros + marcas (Solo informativo) | Admin |
| Config Honorarios | Admin / Config | Tabla precios por compania + km | Admin |
| Dashboard Alertas | Dashboard bloque 1 | Casos demorados (umbrales en tabla configuracion) | Admin |
| Dashboard Resumen | Dashboard bloque 2 | Contadores por estado, click filtra | Admin |
| Dashboard Agenda | Dashboard bloque 3 | Inspecciones dia/manana por perito, copiar portapapeles | Admin |
| Dashboard Facturacion | Dashboard bloque 4 | ip_cerrada sin facturar, boton marcar facturado | Admin |
| Dashboard Metricas | Dashboard bloque 5 | Resumen mes + neto estudio | Admin |
| Marcar facturado (dashboard) | Dashboard bloque 4 | ip_cerrada a facturada sin entrar expediente | Admin |
| Copiar agenda portapapeles | Dashboard bloque 3 | Copia agenda formateada para WhatsApp | Admin |
| Reportes detallados | Menu principal | Reportes filtrados por fecha/perito/tipo IP | Admin |
| Reporte financiero | Reportes | Liquidaciones, neto estudio, desglose | Admin |
| Panel metricas Perito Carga | Dashboard (rol carga) | Cola pendiente_carga, KPIs, tareas | Perito Carga |
| Panel metricas Perito Calle | Dashboard (rol calle) | IP proximas, casos activos, KPIs, tareas | Perito Calle |
| Timeline Expediente | Vista caso (expediente) | Histórico de cambios de estado y sub-tareas de manera secuencial | Todos |
| Archivos Inline | Chat de tarea | Subida e incrustado de imágenes/archivos al bucket `fotos-inspecciones` | Todos |
| Directorio Credenciales | Menu lateral (Directorio) | Gestión de Passwords sistemas externos con Copy native | Admin, Carga |
| Directorio Valores | Menu lateral (Directorio) | Consulta de precios convenio Chapa/Pintura | Todos (Admin edita) |
| Theme Switcher | Navbar (Topbar) | Cambia entre Modo Claro, Oscuro y Sistema (`next-themes`) | Todos |

**Menu lateral (Sidebar):** Implementado en Sidebar.tsx (server) + SidebarClient.tsx (client). Usa usePathname() para active state automatico. Secciones: Principal, Gestion, Finanzas (admin), Directorio.

---

## 9. CHANGELOG - REGISTRO DE CAMBIOS

Formato: FECHA / QUE SE CAMBIO / POR QUE / COMO / ARCHIVOS AFECTADOS / EFECTOS COLATERALES / TESTEADO

### Historial:

FECHA: 05/04/2026
QUE SE CAMBIO: BUG-027 — Fix permisos de drag-and-drop y cambio de participantes en Tareas para peritos calle/carga.
POR QUE: (A) Los peritos de calle y carga no podían mover tarjetas entre columnas del Kanban. (B) No podían cambiar los responsables de una tarea desde la barra lateral (sheet). (C) En usuarios con roles duales (calle+carga), el campo legacy `rol` no coincidía con el chequeo de permisos que usaba `=== "admin"` o `=== "carga"`. Este es un bug recurrente (tercera vez).
COMO: (1) `tareas/page.tsx`: se pasa `currentUserRoles` (array) además de `currentUserRol` (string legacy) al KanbanBoard. (2) `KanbanBoard.tsx`: se usa `currentUserRoles.includes("admin")` en vez de `currentUserRol === "admin"`. Se agrega chequeo de `isCreator` para permitir al creador de la tarea moverla. El prop `isAsignee` ahora incluye creadores. (3) `TareaCard.tsx`: `canEditParticipants` ahora usa el array `roles` con `includes()` para admin/carga/calle (antes era solo admin/carga con check de string legacy). Se remueve `overflow-hidden` del SheetContent para que el dropdown del ParticipantesPopover no quede recortado por CSS clipping dentro de la barra lateral.
ARCHIVOS AFECTADOS: tareas/page.tsx, KanbanBoard.tsx, TareaCard.tsx
EFECTOS COLATERALES: (1) Los peritos de calle ahora pueden editar participantes (antes eran read-only). (2) Los creadores de tareas pueden moverlas sin ser participantes. (3) El SheetContent sin `overflow-hidden` depende del div interno `overflow-y-auto` para el scroll.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 25/03/2026 (3)
QUE SE CAMBIO: Refactor profundo del módulo de Tareas (Kanban). (A) Saneamiento RLS, (B) Fix comentarios fantasma, (C) Multi-asignado Notion-style con popover multi-select.
POR QUE: BUG-026. (A) Las políticas RLS de `comentarios_tarea` y `tarea_participantes` usaban `FOR ALL USING (auth.uid() IS NOT NULL)` sin `WITH CHECK`, bloqueando silenciosamente los INSERT. (B) `ComentariosTarea.tsx` no mostraba errores de inserción — el optimistic update se revertía pero el texto se perdía. (C) La asignación de participantes usaba un dropdown single-select legacy que llamaba a `updateTareaAsignado` para cambiar `asignado_id`, en vez de gestionar la tabla relacional `tarea_participantes`.
COMO: (A) Migración `032_tareas_colaborativas_rls.sql`: DROP de todas las políticas `FOR ALL` y creación de políticas separadas por operación (SELECT/INSERT/UPDATE/DELETE) con `WITH CHECK` explícito para INSERT. Cubre `comentarios_tarea`, `tarea_participantes`, `comentario_lectura`, `reacciones_comentario`, `reacciones_tarea`. (B) `ComentariosTarea.tsx`: insert envuelto en try/catch estricto. En fallo: `toast.error()` con mensaje de Supabase, revert del optimistic update, y RESTAURACIÓN del texto y adjuntos al textarea (el usuario no pierde NADA). (C) Nuevo componente `ParticipantesPopover.tsx`: popover multi-select estilo Notion con checkboxes. Al cerrar: diff contra estado inicial, DELETE+INSERT masivo en `tarea_participantes`, actualiza legacy `asignado_id` para retrocompat. Solo abre para roles admin/carga (peritos calle = read-only). Integrado en `TareaCard.tsx` en card footer y sheet header. Eliminado `handleAssigneeChange`, `isChangingAsignado`, e import de `updateTareaAsignado`.
ARCHIVOS AFECTADOS: 032_tareas_colaborativas_rls.sql (NEW), ParticipantesPopover.tsx (NEW), ComentariosTarea.tsx, TareaCard.tsx
EFECTOS COLATERALES: Ninguno destructivo. Legacy `asignado_id` se sigue actualizando automáticamente al primer participante seleccionado.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 25/03/2026 (2)
QUE SE CAMBIO: Fix "Descargar todas" — el ZIP solo incluía fotos reglamentarias + 1 de daño en vez de todas las fotos.
POR QUE: BUG-025. Las fotos de daño (`danio_detalle`) compartían el mismo `tipo` y potencialmente el mismo `orden`, generando nombres de archivo idénticos (`Detalle_Daño_1.jpg`). `JSZip.folder.file()` sobrescribe archivos con el mismo nombre, así que solo sobrevivía la última foto de cada nombre.
COMO: Cambiado el esquema de nombrado de `{tipo}_{orden}.ext` a `{idx_secuencial_padded}_{tipo}.ext` (ej: `01_Frontal.jpg`, `07_Detalle_Daño.jpg`, `08_Detalle_Daño.jpg`). Cada foto tiene un índice único garantizado.
ARCHIVOS AFECTADOS: GaleriaFotosResponsive.tsx
EFECTOS COLATERALES: Ninguno. Solo cambia el nombre de los archivos dentro del ZIP.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 25/03/2026
QUE SE CAMBIO: (A) Multi-asignado visual en Tareas — todas las pastillas de participantes se muestran en la tarjeta Kanban y en el panel lateral. (B) Fix crítico BUG-024: redirect loop ERR_TOO_MANY_REDIRECTS al expirar sesión Supabase.
POR QUE: (A) Al seleccionar múltiples participantes en una tarea, solo se mostraba el primer `asignado_id` como pill de color. Los demás participantes no aparecían en la tarjeta ni en el filtro "Asignadas a mí". La infraestructura de `tarea_participantes` ya existía (insert en API) pero no se traía en el SELECT de la página ni se usaba en el frontend. (B) Cuando el token de sesión de Supabase expiraba, el middleware usaba `getSession()` que lee el JWT localmente sin validar/refrescar contra el server. Si el JWT expiraba, `getSession()` devolvía null, redirigía a `/login`, pero las cookies muertas persistían en el navegador → el middleware las veía de nuevo → loop infinito de redirects.
COMO: (A) `tareas/page.tsx`: agregado `tarea_participantes(usuario_id, usuario:usuarios(nombre, apellido))` al SELECT. `KanbanBoard.tsx`: filtro "Asignadas a mí" ahora chequea `tarea_participantes[]` además de `asignado_id`. `TareaCard.tsx`: nueva propiedad `tarea_participantes` en interface `TareaData`, nueva variable `participantsList` con fallback a `asignado` legacy. Footer de card muestra pills de color para cada participante (mismos colores determinísticos existentes). Sheet header muestra todos los participantes como pills de color en vez de "Responsable: NombreUnico". (B) `lib/supabase/middleware.ts`: restaurado `getUser()` (reemplaza `getSession()`) para que el Supabase SSR client haga refresh automático del token o limpie cookies muertas. Al redirigir a `/login` por falta de usuario, se copian TODAS las cookies del response mutado por Supabase al redirect response, asegurando que las cookies de borrado lleguen al navegador. `config.matcher` en `middleware.ts` ya excluye assets estáticos (solo 1 call a getUser() por navegación real). `getUsuarioActual()` mantiene `React.cache()` para evitar duplicación.
ARCHIVOS AFECTADOS: tareas/page.tsx, KanbanBoard.tsx, TareaCard.tsx, lib/supabase/middleware.ts
EFECTOS COLATERALES: (A) Tareas legacy sin `tarea_participantes` usan fallback al campo `asignado` — sin regresión. (B) Se vuelve a hacer 1 request a Supabase Auth API por navegación en middleware (antes usaba getSession local sin network). La protección via `config.matcher` limita esto a rutas reales (no assets). Los 2 requests totales por pageview (middleware + getUsuarioActual cache) son aceptables.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 24/03/2026 (5)
QUE SE CAMBIO: Reorganización completa del layout del Expediente (CasoDetail) en desktop y mobile.
POR QUE: La vista del expediente era un "Frankenstein" — secciones sueltas (Información General, Información del Gestor, Asignaciones Operativas) agregadas incrementalmente sin coherencia visual. Datos redundantes y desordenados.
COMO: CasoDetail.tsx reescrito. DESKTOP: 3 cards separadas fusionadas en 1 "Datos del Expediente" con: (1) Vehículo+Dominio, (2) Coordinación, (3) Asignaciones (P.Calle/P.Carga/Gestor en grid 3 cols), (4) Fechas Carga/Cierre, (5) Observaciones del Gestor (antes "Información del Gestor"), (6) Observaciones Internas. Nuevo bloque "Inspección" separado con GenerarLinkInspeccion + Comenzar IP. Eliminados: Link de Orion (EditableLinkOrion), Taller de Destino selector. Nuevo componente InspeccionMetodoBadge (Presencial/Remota) visible en header desktop y mobile. MOBILE: Accordions reestructurados con misma lógica — "Datos del Expediente" (merged) + "Inspección". Accordion de datos abre por defecto.
ARCHIVOS AFECTADOS: CasoDetail.tsx (reescrito), EditableLinkOrion.tsx (ya no se usa, import eliminado)
EFECTOS COLATERALES: Link de Orion ya no se muestra en ninguna vista. Taller de destino no aparece (no se estaba usando). La sección "Información del Gestor" ahora se llama "Observaciones del Gestor" y está dentro del bloque principal. Badge Presencial/Remota ahora usa componente extraído InspeccionMetodoBadge.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 24/03/2026 (4)
QUE SE CAMBIO: (A) Ausente: fix REAL de crash — constraint de DB + body size. (B) Agenda: separadores rediseñados sin sticky.
POR QUE: (A) El crash "Application Error: server-side exception" al usar Ausente NO era por falta de try/catch sino por DOS causas reales: (1) fotos_inspeccion.tipo tiene CHECK constraint que solo permite [general, frente, lateral_izq, lateral_der, trasera, danio_detalle, kilometraje, motor, interior, documentacion, otro]. El insert usaba tipo="ausente" que no existe → constraint violation crash. (2) Next.js tiene serverActions.bodySizeLimit default de 1MB, fotos de celular pesan 3-8MB → crash sin error descriptivo. (B) Los separadores de día usaban sticky top-0 z-10 con fondos translúcidos que se superponían con el contenido al scrollear.
COMO: (A1) actions.ts marcarInspeccionAusente: tipo="ausente" → tipo="otro" (la descripcion "Foto de ausencia" da el contexto). (A2) next.config.ts: agregado experimental.serverActions.bodySizeLimit="10mb". (B) DaySeparator: eliminado sticky top-0 z-10, rediseñado con container sólido (rounded-xl, border, bg fuerte), left accent stripe (w-1.5 absoluto), text-lg font-extrabold, badges con shadow-lg.
ARCHIVOS AFECTADOS: next.config.ts, casos/[id]/actions.ts, mi-agenda/page.tsx
EFECTOS COLATERALES: Todos los server actions aceptan ahora hasta 10MB de body. Las fotos de ausente se guardan como tipo="otro" en lugar de "ausente" (el CHECK constraint no permite "ausente").
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

BUG RESUELTO:
PROBLEMA: Al marcar Ausente y subir foto, la app crasheaba con "Application Error: a server-side exception has occurred".
CAUSA: (1) fotos_inspeccion.tipo CHECK constraint no incluye "ausente" — el INSERT fallaba con constraint violation. (2) serverActions.bodySizeLimit por defecto es 1MB, fotos de celular son 3-8MB.
SOLUCION: (1) Cambiar tipo a "otro" + descripcion="Foto de ausencia". (2) Agregar serverActions.bodySizeLimit="10mb" en next.config.ts.
FECHA: 24/03/2026
NO REPETIR: SIEMPRE verificar los CHECK constraints de la tabla ANTES de insertar valores nuevos. Si necesitas un nuevo tipo, primero ALTER TABLE.

FECHA: 24/03/2026 (3)
QUE SE CAMBIO: (A) Mi Agenda mobile: separadores de día sticky con color. (B) Ausente: try/catch + error guards. (C) PanelPeritoCalle: eliminado bloque duplicado "Requieren Acción".
POR QUE: (A) Los headers "Hoy" y "Mañana" en la agenda eran textos pequeños sin contraste, fácilmente ignorables en mobile. Mañana se ocultaba si Hoy tenía casos (L42: mostrarManana = casosHoy.length === 0). (B) marcarInspeccionAusente podía generar "Application Error: server-side exception" si fotos_inspeccion insert fallaba o si compania_id era null, porque no tenía try/catch. (C) "Requieren Acción" (L168-187) mostraba la misma lista que "Atención Requerida" (L106-150) con menos info, redundante.
COMO: (A) mi-agenda/page.tsx: reescrito completo. Nuevo componente DaySeparator con sticky positioning, color-coded (primary=Hoy, info=Mañana, muted=Próximas). SIEMPRE muestra Mañana (antes se ocultaba). Futuras se agrupan por fecha individual con formatDayLabel. (B) actions.ts marcarInspeccionAusente: envuelto en try/catch, fotos_inspeccion insert ahora captura error, precios query solo ejecuta si compania_id existe. (C) PanelPeritoCalle.tsx: eliminado bloque L168-187 (activos listado duplicado), quitado import formatDistanceToNow.
ARCHIVOS AFECTADOS: mi-agenda/page.tsx, casos/[id]/actions.ts, PanelPeritoCalle.tsx
EFECTOS COLATERALES: Agenda siempre muestra todos los días futuros (antes ocultaba mañana). Si la acción Ausente falla, ahora muestra toast con el error en vez de crashear la app.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 24/03/2026 (2)
QUE SE CAMBIO: updateCasoRapido ahora asigna honorarios automáticamente al editar campos de billing manualmente.
POR QUE: Cuando un admin editaba manualmente estado, fecha_cierre, fecha_inspeccion_real o fecha_carga_sistema via EditableField o CasosTable inline edit, el update era "dumb" ({ [campo]: valor }) y nunca disparaba la lógica de asignación de honorarios. Resultado: casos cerrados manualmente quedaban con $0 en todos los montos.
COMO: updateCasoRapido() en casos/actions.ts ahora tiene bloque POST-UPDATE: si el campo editado es uno de [estado, fecha_cierre, fecha_inspeccion_real, fecha_carga_sistema], refetch el caso, busca en precios, y asigna: (a) monto_pagado_perito_calle si hay fecha_inspeccion_real y monto=0, (b) monto_pagado_perito_carga + monto_facturado_estudio si estado=ip_cerrada/facturada y monto=0. Todo con anti-duplicación. También se añadieron revalidatePath de /casos/{id} y /dashboard.
ARCHIVOS AFECTADOS: casos/actions.ts (updateCasoRapido)
EFECTOS COLATERALES: Ediciones manuales de campos de billing ahora disparan honorarios automáticamente. El retroactivo ya fue cubierto por migración 031 del commit anterior.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 24/03/2026
QUE SE CAMBIO: Fix CRITICO de timing de honorarios + migración retroactiva.
POR QUE: monto_pagado_perito_calle y monto_pagado_perito_carga se asignaban AMBOS solo al llegar a ip_cerrada en cambiarEstadoCaso(). Resultado: perito de calle figuraba con $0 en métricas mientras el caso estaba en pendiente_carga/presupuesto. PanelPeritoCalle contaba "cerrados" por estado ip_cerrada/facturada (un número) pero "facturado este mes" filtraba por monto>0 (otro número), generando inconsistencia total. marcarInspeccionRealizada() nunca asignaba monto. marcarInspeccionAusente() tampoco.
COMO: (1) marcarInspeccionRealizada(): ahora busca en precios por compania_id+tipo_inspeccion y asigna monto_pagado_perito_calle AL MOMENTO de completar la IP (antes de pasar a pendiente_carga). Anti-duplicación: solo si monto actual es 0/null. (2) marcarInspeccionAusente(): ahora asigna TODOS los montos (estudio+calle+carga) porque ausente cierra directo sin pasar por carga. También setea fecha_cierre que faltaba. (3) cambiarEstadoCaso(): SEPARADO en dos bloques: (a) al SALIR de ip_coordinada→pendiente_carga/presupuesto: asigna monto_pagado_perito_calle + fecha_inspeccion_real. (b) al LLEGAR a ip_cerrada: asigna monto_facturado_estudio + monto_pagado_perito_carga. Cada uno con guard individual de anti-duplicación. (4) PanelPeritoCalle: "cerrados" ahora = casos con fecha_inspeccion_real (no anulados), en vez de filtrar por estado ip_cerrada/facturada. totalMesCasos ya no requiere monto>0.
ARCHIVOS AFECTADOS: casos/[id]/actions.ts, PanelPeritoCalle.tsx, 031_backfill_honorarios_timing_fix.sql (NEW)
EFECTOS COLATERALES: Todos los casos NUEVOS asignan monto_pagado_perito_calle inmediatamente al completar IP. Los cerrados asignan carga+estudio como antes. La migración SQL 031 rellena retroactivamente los montos faltantes usando precios actuales. Perito calle verá sus honorarios reflejados sin esperar al cierre.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

BUG RESUELTO:
PROBLEMA: monto_pagado_perito_calle se asignaba únicamente al llegar a ip_cerrada, junto con monto_pagado_perito_carga. Esto generaba: (1) Perito calle con $0 mientras caso en pendiente_carga, (2) Métricas inconsistentes en PanelPeritoCalle, (3) Reportes con cantidades que no cuadran.
CAUSA: cambiarEstadoCaso() L199-223 asignaba los 3 montos (estudio+calle+carga) en un solo bloque al llegar a ip_cerrada. marcarInspeccionRealizada() no asignaba ningún monto.
SOLUCION: Separar timing: P.Calle se asigna al COMPLETAR la inspección (exit ip_coordinada), P.Carga+Estudio al llegar a ip_cerrada. Migración SQL retroactiva 031.
FECHA: 24/03/2026
NO REPETIR: NUNCA asignar honorarios de distintos roles en el mismo momento. Cada rol cobra cuando COMPLETA SU trabajo: perito calle al inspeccionar, perito carga al cerrar.

FECHA: 23/03/2026 (noche 2)
QUE SE CAMBIO: (A) Hamburguesa muerta eliminada de Topbar. (B) Tabla MO responsive en VistaInformeCampo. (C) Galería: tabs y download no se rompen en mobile. (D) Perito calle ya no puede cambiar estado manualmente. (E) Flujo AUSENTE: nuevo botón + photo upload + auto ip_cerrada.
POR QUE: (A) El botón hamburguesa no tenía handler, era UI muerta. (B) La tabla MO de 4 columnas se desbordaba en pantallas <400px. (C) Las pastillas de filtro y el botón descargar se salían del contenedor. (D) El perito calle podía pasar a "contactado" manualmente, sin sentido operacional. (E) No existía flujo para inspecciones ausentes. El perito tenía que pedir al admin que cerrara el caso manualmente.
COMO: (A) Topbar.tsx: eliminado bloque <Menu> L14-22, quitado import Menu. Spacer vacío para mobile. (B) VistaInformeCampo.tsx: table-fixed + overflow-x-auto container + column widths (35/25/15/25%) + headers abreviados (V.Unit, Cant.) + text-xs mobile + Total MO text-base. (C) GaleriaFotosResponsive.tsx: header stacks vertical, tabs en flex-wrap, download button con texto corto "ZIP" en mobile. (D) SelectorEstado.tsx: calle devuelve array vacío → componente retorna null (L43). (E) Nuevo componente BotonAusente.tsx: botón dashed "Marcar Ausente" → expande inline con upload (capture=environment), preview, confirmar. Nueva action marcarInspeccionAusente() en casos/[id]/actions.ts: sube foto a storage, inserta fotos_inspeccion(tipo:"ausente"), update caso estado=ip_cerrada + tipo_inspeccion=ausente + fecha_inspeccion_real=now(), historial_estados. NO pasa por pendiente_carga. Integrado en CasoDetail mobile (bloque CTA) y desktop (hidden md:block).
ARCHIVOS AFECTADOS: Topbar.tsx, VistaInformeCampo.tsx, GaleriaFotosResponsive.tsx, SelectorEstado.tsx, CasoDetail.tsx, BotonAusente.tsx (NEW), casos/[id]/actions.ts
EFECTOS COLATERALES: Perito calle pierde "Cambiar estado" completamente. Los estados solo los cambia admin/carga. Flujo ausente cierra caso sin pasar por perito de carga (no hay nada que cargar). "ausente" ya existía en tipo_inspeccion enum, no requiere migración.
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 23/03/2026 (noche)
QUE SE CAMBIO: Auditoría UX Mobile expediente: 6 fixes + badge Presencial/Remota.
POR QUE: El expediente mobile tenía info duplicada (dirección en header + Info General, fechas en accordion propio + Info General), labels incorrectos ("Fecha Programada" → "Fecha de Inspección"), el badge "Desde inspección remota" aparecía en todas las inspecciones, y ObservacionesPericia se mostraba debajo de la galería incluso cuando VistaInformeCampo ya mostraba sus propias observaciones.
COMO: (1) ObservacionesPericia.tsx: nueva prop esPresencial, si true no renderiza (VistaInformeCampo ya lo cubre). Se eliminó badge hardcoded "Desde inspección remota". (2) EditableCoordinacion.tsx: "Fecha Programada" → "Fecha de Inspección". (3) CasoDetail.tsx mobile: eliminado accordion "Fechas Administrativas" (datos duplicados), eliminada dirección del header mobile (queda solo en Info General accordion), nuevo badge Presencial (verde 📷) / Remota (azul 🔗) en header mobile para estados post-inspección, GenerarLinkInspeccion en desktop solo para admin/carga. (4) esPresencial se pasa a ObservacionesPericia basado en tipo_inspeccion !== ip_remota && estado post-inspección.
ARCHIVOS AFECTADOS: CasoDetail.tsx, ObservacionesPericia.tsx, EditableCoordinacion.tsx
EFECTOS COLATERALES: Desktop: 0 cambios visibles excepto GenerarLinkInspeccion ahora solo visible para admin/carga. ObservacionesPericia desaparece en expedientes con informe presencial (VistaInformeCampo cubre esa info).
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 23/03/2026
QUE SE CAMBIO: Sprint Rediseño UX/UI Mobile-First completo: (1) PanelPeritoCalle radar proactivo, (2) CasoDetail reestructurado con Accordions mobile, (3) Permisos edición perpetua perito calle.
POR QUE: (1) PanelPeritoCalle tenía "Actividad Reciente" pasiva mostrando los últimos 10 casos sin filtro — ruido puro, sin alertas. (2) CasoDetail volcaba toda la info en una sola columna en mobile (Data Dump + Scroll Fatigue): info general, datos sancor, asignaciones, fechas, todo visible y expandido. El CTA "Comenzar Inspección" quedaba enterrado debajo de N scroll. (3) El perito de calle no podía editar datos_crudos_sancor de sus casos.
COMO: (1) Se reescribió PanelPeritoCalle.tsx: eliminada sección "Actividad Reciente" (Clock icon), reemplazada por "🚨 Atención Requerida" que filtra casos demorados (ip_coordinada con fecha_inspeccion_programada < hoy O sin fecha y >3 días estancado) y pendiente_presupuesto. Tarjetas con border-color-danger/warning, patente text-lg font-black. Empty state verde "¡Todo al día!". (2) CasoDetail.tsx: Nuevo header mobile compacto (block md:hidden) con patente text-3xl font-black, estado, dirección, y botón "Comenzar Inspección" (si corresponde) SIN scroll. Header desktop preservado (hidden md:flex). Info General, Fechas, Datos Sancor, Asignaciones envueltas en <Accordion> Shadcn colapsados por defecto en mobile. Cards desktop originales con hidden md:block. Se instaló @radix-ui/react-accordion + componente ui/accordion.tsx vía shadcn. (3) Variable esPeritoCalleDueno = (currentUserId === caso.perito_calle_id). Ahora datos_crudos_sancor es editable para admin O perito dueño, tanto en desktop como en mobile (via EditableField directo, sin restricción de estado).
ARCHIVOS AFECTADOS: PanelPeritoCalle.tsx, CasoDetail.tsx, accordion.tsx (NEW via shadcn)
EFECTOS COLATERALES: Desktop: 0 cambios visibles para admin/carga. La edición de datos_crudos_sancor ahora es accesible también al perito calle dueño (antes solo admin). ZonaArchivos y ObservacionesPericia sin cambios (ya funcionaban sin restricciones).
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 22/03/2026
QUE SE CAMBIO: Sprint UX Mobile + Permisos Perito de Calle (3 pasos: aislamiento de datos, UX mobile-first, edición post-inspección).
POR QUE: (1) El perito de calle podía ver todos los casos del sistema en /casos, sin filtrar por los suyos. (2) La UI estaba pensada 100% desktop, inutilizable en móvil para peritos de calle que trabajan desde el celular. (3) El perito de calle no podía editar observaciones_pericia de sus inspecciones desde CasoDetail.
COMO: (1) En getCasos() de casos/actions.ts se inyecta .eq('perito_calle_id', user.id) si el usuario es perito calle puro (tiene rol 'calle' y NO tiene 'admin' ni 'carga'). (2) Nuevo componente BottomNavMobile.tsx (4 tabs: Agenda/Casos/Tareas/Perfil, min 48×48px touch targets, fixed bottom z-50 md:hidden). layout.tsx agrega pb-24 en mobile. CasosTable.tsx agrega vista de tarjetas touch-friendly (block md:hidden) con patente text-lg, estado badge, botón 48×48 de acceso, mientras la tabla y filtros avanzados usan hidden md:flex/hidden md:block. (3) ObservacionesPericia.tsx recibe props casoId y puedeEditar. Si puedeEditar (currentUserId === perito_calle_id || rol admin), el texto es clickeable para editar, con guardado vía updateCasoRapido.
ARCHIVOS AFECTADOS: casos/actions.ts, layout.tsx, BottomNavMobile.tsx (NEW), CasosTable.tsx, CasoDetail.tsx, ObservacionesPericia.tsx
EFECTOS COLATERALES: Vista desktop intacta (0 cambios visibles). Los filtros avanzados de CasosTable se ocultan en mobile; solo badge counters de estado + search quedan visibles. El view toggle list/grid se oculta en mobile (la vista mobile siempre usa cards).
TESTEADO: TypeScript tsc --noEmit pasa con 0 errores.

FECHA: 11/03/2026
QUE SE CAMBIO: Cambio global de paleta de colores a ámbar/dorado + Rediseño completo del Tablero de Tareas (Kanban).
POR QUE: (1) La paleta anterior (azul/púrpura/cyan) generaba confusión visual con los colores institucionales de Federación Patronal (azul) y Sancor Seguros (magenta/fucsia), los dos clientes principales. CLARITY necesita identidad visual propia y neutral. (2) El tablero de tareas Kanban tenía cards sin jerarquía visual: todas iguales en tamaño y color, sin indicadores de antigüedad ni de urgencia, descripciones largas y sin densidad.
COMO: (1) Se reemplazó la paleta completa en `globals.css` (`:root` y `.dark`) con nuevos valores ámbar (#F59E0B como acento principal). Se añadió override CSS `.ip-magenta-theme` para preservar la paleta magenta en las rutas públicas de inspección remota y seguimiento. Se cambiaron backgrounds dark a neutros puros (#09090B, #0F0F12), bordes a rgba con opacidades bajas, y `--text-on-brand` a negro para contraste con botones ámbar. (2) Se reescribieron completamente `KanbanBoard.tsx` (pills de filtro con "Urgentes", dots de color por columna ámbar/índigo/esmeralda, columnas con rounded-[14px] y bg-bg-secondary, animación de cascada), `TareaCard.tsx` (borde izquierdo por prioridad, siniestro prominente en monospace ámbar, título 13px, 1 línea de descripción, footer compacto con antigüedad/overdue en rojo/comentarios con pulso no-leídos/badge prioridad/avatar square 22px, tratamiento diferenciado de Resuelta con opacity 0.6 y line-through) y `tareas/page.tsx` (ícono KanbanSquare ámbar).
ARCHIVOS AFECTADOS: `globals.css`, `KanbanBoard.tsx`, `TareaCard.tsx`, `tareas/page.tsx`
EFECTOS COLATERALES: Toda la plataforma interna adopta ámbar como color de acento. Las inspecciones remotas y seguimiento público mantienen magenta vía hardcoded colors y override scoped. Los StatusBadge de estados de caso mantienen sus colores semánticos propios sin cambios.
TESTEADO: TypeScript `tsc --noEmit` pasa con 0 errores.

FECHA: 11/03/2026
QUE SE CAMBIO: Fix de Error RLS en mail_queue y Mejora de UX en CasosTable (Excel-like filtering).
POR QUE: (1) Al cambiar estado, si el usuario no era 'admin', fallaba el insert automático de notificación por email en `mail_queue` debido al RLS restrictivo. (2) Al cambiar un estado o dato en la tabla de Casos condensada mediante filtro (Ej: Filtro en 'IP Coordinada', le das a 'Pendiente Carga'), la fila desaparecía instantáneamente de la vista, desorientando al perito o administrador.
COMO: (1) Se importó `createClient` genérico de supabase-js usando `SUPABASE_SERVICE_ROLE_KEY` en `queue.ts` como `supabaseAdmin` para saltar RLS al encolar, ya que `mail_queue` es una entidad interna del backend de comunicaciones. (2) Se creó un state de array `retainedCaseIds` en `CasosTable.tsx`. Se inyecta el ID del caso mutado ahí ante cada inline-edit. Los filtros bypass-ean la exclusión si el ID existe ahí. El array se purga al tocar cualquier componente de filtro de manera explícita (igual que Excel cuando refrescás luego de editar).
ARCHIVOS AFECTADOS: `queue.ts`, `CasosTable.tsx`
EFECTOS COLATERALES: Ahora `mail_queue` no depende de que el emisor de la transición sea admin. Para la tabla de casos, un siniestro modificado se mantendrá dibujado aunque ya no pertenezca al estrato del filtro hasta su próxima recarga explícita.
TESTEADO: API Endpoint test con success. List UI tests re-rendering OK.

FECHA: 03/03/2026
QUE SE CAMBIO: Documento inicial creado, alineado con Supabase existente
POR QUE: Inicio formal con documentacion que refleja el stack real (Next.js + Supabase + TS)
COMO: Mapeo completo de tablas existentes, identificacion de tablas nuevas necesarias, triggers a revisar
ARCHIVOS AFECTADOS: Este archivo
EFECTOS COLATERALES: Ninguno, documento inicial
TESTEADO: N/A

FECHA: 03/03/2026
QUE SE CAMBIO: Fix sidebar navigation — split server/client, active state automatico, menu reestructurado
POR QUE: Botones del menu lateral no mostraban estado activo correctamente. Prop `active` estaba hardcodeado. Sidebar era 100% server component sin acceso a usePathname(). Perito carga no veia Dashboard.
COMO: Split en Sidebar.tsx (server: fetch rol) + SidebarClient.tsx (client: usePathname()). Active state se calcula con match exacto o prefix. Todos los roles ven Dashboard/Mi Agenda/Casos/Tareas. Secciones agrupadas: Principal, Gestion, Finanzas, Directorio.
ARCHIVOS AFECTADOS: src/components/layout/Sidebar.tsx (reescrito), src/components/layout/SidebarClient.tsx (NUEVO)
EFECTOS COLATERALES: Ninguno. Layout no modificado.
TESTEADO: Build limpio (exit code 0, 23 rutas)

FECHA: 03/03/2026
QUE SE CAMBIO: Script SQL para crear usuario admin
POR QUE: No habia forma documentada de crear el primer usuario admin en Supabase
COMO: Script con INSERT INTO usuarios + ON CONFLICT DO UPDATE para hacer admin a un usuario existente en auth.users
ARCHIVOS AFECTADOS: supabase/migrations/004_crear_admin.sql (NUEVO)
EFECTOS COLATERALES: Ninguno
TESTEADO: N/A (script SQL manual)

FECHA: 03/03/2026
QUE SE CAMBIO: Fix SQL migration 002 — CREATE POLICY IF NOT EXISTS + trigger en tabla incorrecta
POR QUE: PostgreSQL no soporta IF NOT EXISTS para CREATE POLICY. Trigger trg_transicion_pendiente_carga vivia en informes_periciales, no en casos.
COMO: Patron DROP POLICY IF EXISTS + CREATE POLICY. DROP FUNCTION con CASCADE. Bucket caso-archivos creado via SQL.
ARCHIVOS AFECTADOS: supabase/migrations/002_tablas_fase2.sql
EFECTOS COLATERALES: Ninguno
TESTEADO: Ejecutado exitosamente en Supabase SQL Editor

FECHA: 03/03/2026
QUE SE CAMBIO: Fix critico de navegacion — redirect infinito /dashboard → /login → /dashboard
POR QUE: Todas las paginas hacian `if (!userData) redirect("/login")` cuando el usuario no existia en tabla `usuarios`. Pero el middleware redirige usuarios autenticados FUERA de /login hacia /dashboard, creando un loop infinito.
COMO: Creado `src/lib/auth.ts` con funcion centralizada `getUsuarioActual()` que: (1) NUNCA redirige a /login si el usuario esta autenticado, (2) auto-crea fila en `usuarios` si no existe (primer user = admin, resto = calle), (3) retorna UsuarioSession tipado. Actualizado en 7 paginas: dashboard, tareas, kilometraje, reportes, facturacion, configuracion, configuracion/precios.
ARCHIVOS AFECTADOS: src/lib/auth.ts (NUEVO), src/app/(dashboard)/dashboard/page.tsx, tareas/page.tsx, kilometraje/page.tsx, reportes/page.tsx, facturacion/page.tsx, configuracion/page.tsx, configuracion/precios/page.tsx
EFECTOS COLATERALES: El primer usuario que se loguea sera auto-creado como admin. Los siguientes como calle (pueden ser promovidos luego).
TESTEADO: Build limpio (exit code 0, 23 rutas)

FECHA: 03/03/2026
QUE SE CAMBIO: Fase 6 - Pulidos Visuales y UX (Formatters a ARS, Componente StatusBadge centralizado, rediseño de UI en Dashboard, alertas con umbrales proporcionales).
POR QUE: Se requerían ajustes de diseño premium "look and feel", cambiar dólares por pesos argentinos, y asegurar consistencia de Badges y Hover states en todas las tablas y sidebar.
COMO: Modificado globals.css con nueva paleta de colores de fondo, borders suaves y hover transitions. Añadidos quick filters con date-fns a reportes, eliminadas columnas de notas de Gestores y Talleres, y refactorizado StatusBadge y componentes UI. 
ARCHIVOS AFECTADOS: src/lib/utils/formatters.ts, src/components/casos/EstadoBadge.tsx, src/app/globals.css, src/app/(dashboard)/dashboard/page.tsx, src/components/reportes/ReportesFiltros.tsx, src/components/casos/CasosTable.tsx, src/components/directorio/TallerFormDialog.tsx, src/components/directorio/GestorFormDialog.tsx
EFECTOS COLATERALES: Ninguno, solo mejoras visuales e iteraciones limpias que respetan la lógica preexistente.
TESTEADO: Confirmado mediante inspección cruzada y tailwind linting.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 7 - Expediente Notion, Colores y Directorios.
POR QUE: Se buscaba aumentar la transparencia del sistema (lectura global) y unificar la bitácora del Siniestro para no perder el contexto al realizar Tareas. Mapeo requerido de directorios externos.
COMO: RLS liberado en `casos`, `fotos`, `informes` para lectura total autenticada. Creado `TimelineExpediente` para mezclar estados (TimelineCaso) y tareas (ListaTareasCaso). Actualizado `ComentariosTarea` para soportar `files` a Supabase Storage y parseo JSONB en tabla. Tablas nuevas `herramientas_usuarios` y `valores_chapa_pintura` con UI en `/directorio`.
ARCHIVOS AFECTADOS: supabase/migrations/006_fase7_transparencia.sql, supabase/migrations/007_fase7_directorios.sql, src/components/casos/TimelineExpediente.tsx, src/components/tareas/ComentariosTarea.tsx, src/app/(dashboard)/directorio/..., src/components/layout/SidebarClient.tsx
EFECTOS COLATERALES: Todos los roles autenticados pueden ver la ruta /casos/[id] completa.
EFECTOS COLATERALES: Todos los roles autenticados pueden ver la ruta /casos/[id] completa.
TESTEADO: Compilado Next.js verificado, Storage Buckets upload testeado.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 8 - Premium UI/UX & Dual Theme System (Light/Dark Mode).
POR QUE: La plataforma tenía un aspecto rústico y plano ("MVP oscuro"), dificultando la legibilidad e impidiendo una buena presentación comercial P2B.
COMO: Instalación de `next-themes` y envoltura de `<ThemeProvider>` en `layout.tsx`. Creación de paleta integral en `globals.css` (Blancos relucientes + modo Slate/Zinc premium oscuro). Reemplazo global en `src` de colores estáticos (ej: `text-white`, `bg-[#0a0a12]`) por variables semánticas (`bg-primary`, `text-text-primary`, `text-on-brand`).
ARCHIVOS AFECTADOS: src/components/theme-provider.tsx, src/components/theme-toggle.tsx, src/app/layout.tsx, src/app/globals.css, src/components/layout/Topbar.tsx y reemplazo masivo de strings de Tailwind en todo `src/components`.
EFECTOS COLATERALES: Ninguno. Todos los componentes reaccionan suavemente a la preferencia del SO o la sobreescritura manual en la barra de navegación.
TESTEADO: `npm run build` exitoso (Exit code 0).

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 9 - "CasosTable" Alto Rendimiento & Estética B2B de Alto Contraste.
POR QUE: Se necesitaba transformar la tabla principal de casos en un "Data Grid" veloz estilo Excel. Reemplazando selectores antiguos por componentes P2B modernos y afinando los colores para lecturas directas en exteriores bajo el sol (Modo Claro) y con tonos premium no aburridos (Modo Oscuro). También se agregó alertas "notification style" al sidebar.
COMO: Refactorización total de `CasosTable` incorporando `DropdownMenu` y `DropdownMenuCheckboxItem` (filtrado multi-select). Transición de inputs "inline" activados por Hover. Integración de motor de búsqueda textual Live al array de variables unificadas. Correcciones semánticas CSS a colores Danger, Warning, Success. Actualización del contador asíncrono en Sidebar (SideBar + SideBarClient).
ARCHIVOS AFECTADOS: src/components/casos/CasosTable.tsx, src/app/(dashboard)/casos/page.tsx, src/components/layout/Sidebar.tsx, src/components/layout/SidebarClient.tsx, src/app/globals.css
EFECTOS COLATERALES: Funcionalidades dependientes de la ruta `/api/casos` fueron reforzadas para PATCH.
TESTEADO: Testing y compilación general en local. CasosTable muestra edición instantánea y filtrado array.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 10 - Resolucion de Bugs Criticos, Correcciones RLS, UI/UX Polish, Rediseño Kanban.
POR QUE: Se acumulaban fricciones de UX menores (Redirect loop al crear casos, error en edición inline, demoras en el Chat, y RLS bloqueando INSERTS).
COMO: 1) Unificación de inputs (Vehículo) en `CasoForm.tsx`. 2) Implementada UI optimista en `ComentariosTarea.tsx`. 3) Solucionado error `RLS for INSERT` añadiendo policy `WITH CHECK` en migracion 008. 4) Se adaptaron colores en tablas y columnas del Kanban según el Estado.
ARCHIVOS AFECTADOS: Modificaciones directas en `CasosTable`, `CasoForm`, `CasoDetail`, `ComentariosTarea`, `KanbanBoard`, y APIs `route.ts`. Migración db `008_fase10_rls_fixes.sql`.
EFECTOS COLATERALES: Ninguno negativo. Se reforzó el PATCH HTTP handler. 
TESTEADO: Testing de todos los formularios de carga (Caso y Peritos/Convenios), flujos del estado, y visual general.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 11.1 - Refinamientos al Kanban (Tareas Libres y Timeline).
POR QUE: Reporte de bugs y solicitudes del usuario post-migración a la vista por Paneles (Shadcn Sheet).
COMO: 1) Reemplazo de la Info Lado A por el Componente `<TimelineExpediente>` en la pestaña de la tarea para poder ver todos los cambios de estado. 2) Se liberó el esquema en `api/tareas/route.ts` y en `TareaForm.tsx` para permitir crear tareas huérfanas o puramente asíncronas con `caso_id` nulo. 3) Se removió el truncado de `line-clamp-2` de la visualización de descripciones extra-largas en la Tarjeta. 4) Se corrigió el bug de doble-renderizado en el Chat Optimista mapeando correctamente la inyección local con la del servidor en el array. 5) Se solucionó la falla de la Request `historial_estados(fecha_cambio)` en supabse corrigiendo el typo por `created_at` (hacía fallar el Link dinámico del Caso al volver del Kanban).
ARCHIVOS AFECTADOS: `src/components/tareas/TareaCard.tsx`, `src/components/tareas/ComentariosTarea.tsx`, `src/app/api/tareas/route.ts`, `src/components/casos/CasoDetail.tsx`.
EFECTOS COLATERALES: Funcionalidades ampliadas sin regresiones.
TESTEADO: `npm run build` TypeScript exitoso.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 11.2 - Mejora de Layout en Detalles del Siniestro y visor de fotos embebido.
POR QUE: Ciertos datos del Asegurado eran redundantes, la grilla del layout quedaba estrecha en PC respecto a la línea de tiempo, las fotos subidas no se podían previsualizar, y la tarjeta de tarea tiraba TypeError por usuarios no cargados.
COMO: 1) Expansión del Container Global en `casos/[id]/page.tsx` para forzar `max-w-[1600px]`. 2) Expansión de grillas a Grid-4/Grid-5 asimétrico en `CasoDetail.tsx`. 3) Eliminación del Bloque Cobertura y depuración de Info Vehículo. 4) Añadido componente Shadcn `Dialog` dentro de `ZonaArchivos.tsx` para hacer de 'Lightbox' e inyectar un Previsualizador in-app de Imágenes. Los PDF se despachan default target `_blank`. 5) Condicional inyectado en TimelineExpediente para atajar arrays de usuarios vacíos desde el parent Kanban.
ARCHIVOS AFECTADOS: `src/components/casos/CasoDetail.tsx`, `src/app/(dashboard)/casos/[id]/page.tsx`, `src/components/casos/ZonaArchivos.tsx`, `src/components/casos/TimelineExpediente.tsx`.
EFECTOS COLATERALES: Mejor aprovechamiento del ViewPort.
TESTEADO: Compilación SSG `npm run build` 100% Ok.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 11.3 - Rediseño estilo Premium Card-based para `CasoDetail` y visor dual (Imagen/PDF) en Lightbox.
POR QUE: El usuario determinó que la vista de expedientes, tras su expansión a 1600px en la fase anterior, quedaba visualmente vacía y estructuralmente pobre comparada con el standard UI del resto de la web. A su vez requería habilitar previsualización de archivos PDF.
COMO: 1) Reestructuración de grilla `CasoDetail.tsx` a formato 3 columnas asimétricas (2/3 Grid para contenido, 1/3 para Timeline). 2) Replanteamiento del diseño envolviendo módulos (Datos, Géstor, Asignaciones, Archivos) dentro del componente Shadcn `<Card>`, inyectando fondos gradientes, iconografía Lucide y layout jerárquico. 3) Modificado handler `handlePreview` en `ZonaArchivos.tsx` detectando metadata `.pdf` y despachando renderizado por `<iframe src="#view=FixH">` dentro del propio `<Dialog>` Modal.
ARCHIVOS AFECTADOS: `src/components/casos/CasoDetail.tsx`, `src/components/casos/ZonaArchivos.tsx`.
EFECTOS COLATERALES: Mejora sustancial en UX y asimilación visual.
TESTEADO: `npm run build` exitoso sin errores en empaquetado.

FECHA: 04/03/2026
QUE SE CAMBIO: Rediseño Moderno UI/UX de Kanban y Soporte Nativo de Adjuntos en Tareas.
POR QUE: Se reportó "Card Bloat" (sobrecarga visual) en Tareas, falta de jerarquía (fechas por sobre títulos) y necesidad operativa de proveer evidencia y archivos al momento de "Crear" una tarea.
COMO: 1) Ajuste estético a Linear-style en KanbanBoard.tsx eliminando bordes rígidos y reduciendo opacidad/padding. 2) Reestructuración íntegra de TareaCard.tsx, haciendo su contenedor clickeable globalmente para abrir el Sheet y ocultando acciones de transición a hover. 3) Migración SQL 011_fase14_tareas_adjuntos para insertar columna jsonb `adjuntos`. 4) Integración Storage de Cliente en TareaForm.tsx con Dropzone apalancando el bucket 'fotos-inspecciones'. Mapeo de subidas post/put en `api/tareas`.
ARCHIVOS AFECTADOS: `src/components/tareas/TareaCard.tsx`, `src/components/tareas/KanbanBoard.tsx`, `src/components/tareas/TareaForm.tsx`, `src/app/api/tareas/route.ts`, `011_fase14_tareas_adjuntos.sql`.
TESTEADO: Sí, el renderizado condicional sube los archivos temporalmente al CDN y adjunta el URI de referencia en el row final bajo DB constraints.

---

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 14 Iteración 4 - Bug Fixes & Features de UI y Estructura.
POR QUE: Diversos ajustes solicitados por el usuario para refinar la carga de datos masivos y optimizar la UX. Faltaban campos requeridos en la Base y UI para expedientes y reportes.
COMO: 1) Refinamiento Tareas: Actualizada animación `animate-pulse-border` nativa en `globals.css` para el estado ALFREDO. Avatares apilados para mostrar múltiples Participantes en Tareas. 2) Mejoras Directorio & Config: Campo CUIT y Checkbox 'hace_remotas' añadidos a formularios de Talleres. Agregador persistente `GastoFijoEditor` global en Configuración para restar honorarios base del KPI Breakeven en Reportes. 3) Expedientes y Grilla Casos: Botón Descarga Batch ZIP con JSZip en `ZonaArchivos`. Separación de Perito (Calle/Carga) en Filtros y Header. Campo Géstor insertado en la UI (Lista y Grilla) con opción One-Click Copy Clipboard. Link de Orion embutido de forma segura como URL validable en CasoForm y CasoDetail. Fijación de bug temporal TZ1 (Timezone bias en inputs de fecha) apendizando el offset exacto antes del Guardado.
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `CasoForm.tsx`, `CasoDetail.tsx`, `ZonaArchivos.tsx`, `TareaCard.tsx`, `TallerFormDialog.tsx`, `crud-actions.ts`, `globals.css`, `ReportesFiltros.tsx`, `GastoFijoEditor.tsx`.
EFECTOS COLATERALES: Ninguno perjudicial. Resoluciones estéticas que incrementan Feature Parity en todo el Dashboard.
TESTEADO: Funciones NextServerActions para ORION, Gestores y Configs auditadas con build sin type errors.

---

FECHA: 04/03/2026
QUE SE CAMBIO: Rediseño completo de la Tabla de Casos (CasosTable) a estilo Data Grid de Alta Densidad.
POR QUE: La plataforma gestionará aproximadamente 5000 casos al año. El usuario solicitó reemplazar su planilla de Excel con una vista superior en UI/UX, incluyendo virtualización de scroll, edición rápida inline (popovers compactos), barra de resumen interactiva y nuevos filtros.
COMO: 1) Se actualizó `casos/actions.ts` y `casos/page.tsx` para incluir `updated_at`, `notas_admin` y la relación pre-cargada con `gestores`. 2) Se reescribió `CasosTable.tsx` integrando `@tanstack/react-virtual` para soportar eficientemente miles de filas en el DOM. 3) Se construyeron Dropdowns compactos para editar el Estado y el Tipo de IP al instante, así como un componente de Barra de Resumen horizontal con contadores y filtrado clickeable. 4) Se añadió un icono de "Lupa" conectado a un Popover con Textarea para persistir observaciones rápidas (`notas_admin`).
ARCHIVOS AFECTADOS: `src/components/casos/CasosTable.tsx`, `src/app/(dashboard)/casos/actions.ts`, `src/app/(dashboard)/casos/page.tsx`, `src/components/casos/EstadoBadge.tsx`, `src/components/casos/TipoIPBadge.tsx`.
EFECTOS COLATERALES: Migración hacia `@tanstack/react-virtual` que limitará la vista grid a favor de la vista de lista de alto rendimiento.
TESTEADO: Testing de TypeScript (`npx tsc`) exitoso sin errores. Testing de RLS subyacentes cubiertos.

---

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 12 - Reparación TypeError en `EstadoBadge` e Inclusión de Smart Parser Widget en Carga de Siniestros.
POR QUE: Se reportó fallo de runtime "Cannot read properties of undefined (reading 'split')" al intentar acceder a la línea de tiempo de Casos desde la vista Tareas (estado venía asíncronamente nulo). En paralelo, se requería automatizar la conversión textual desde los e-mails de Sancor a inputs rellenados.
COMO: 1) Guarda temprana `if(!estado) return <Badge>Desconocido</Badge>` en `EstadoBadge.tsx`. 2) Creación módulo UI "Widget Parser" interactivo en `CasoForm.tsx` apalancándose de ruta API Next.js `/api/parsear-caso`. 3) RegEx extendida en `sancor.ts` para extraer campo "Gestor del reclamo" y enlazarlo con el `gestor_id` correspondiente en base de datos.
ARCHIVOS AFECTADOS: `src/components/casos/EstadoBadge.tsx`, `src/components/casos/CasoForm.tsx`, `src/lib/parser/sancor.ts`.
EFECTOS COLATERALES: Ninguno negativo. Acelera alta masiva de siniestros.
TESTEADO: `npm run build` Ok sin errores de Transpilación ni Linting.

FECHA: 04/03/2026
QUE SE CAMBIO: Fase 13 - Rebranding Maestro: "AOMNIS" hacia "CLARITY" y Uniformidad de Columnas en Cola de Carga.
POR QUE: Cambio estratégico en el nombre comercial del producto de gestión (de AOMNIS a CLARITY). Así también, la vista "Cola de Carga" no poseía la columna del Perito de Carga, diferenciándola de la vista de "Casos" e interrumpiendo el Feature Parity entre tablas.
COMO: 1) Ejecución de script de Reemplazo Profundo (RegEx Búsqueda e Intercambio) sobre `manifest.json`, metadatos en pages/layouts, textos quemados en Componentes UI, variables en DOM/localstorage y archivos base de configuración npm. 2) Renombramiento físico de la Documentación Técnica a `CLARITY_DOC_TECNICA.md` y `CLARITY_Hoja_de_Ruta.md`. 3) Se removió el constraint de ocultamiento explícito `hiddenColumns={["perito_carga"]}` dentro del Server Page de `carga/page.tsx`, liberando a `CasosTable` para renderizar el 100% de los campos nativos.
ARCHIVOS AFECTADOS: Todos los `page.tsx` con dependencias Metadatos, `package.json`, `manifest.json`, `SidebarClient.tsx`, `Topbar.tsx`, `auth.ts`, `CLARITY_DOC_TECNICA.md`, `src/app/(dashboard)/carga/page.tsx`.
EFECTOS COLATERALES: Se modificó la URL por defecto para ingresos Admin transitorios a `@clarity.com`. Las variables `localStorage` sufrieron deprecación de `aomnis_*` frente a `clarity_*` lo que requiere reseteo de preferencias UI para usuarios activos actuales.
TESTEADO: Grep search arrojó 0 instancias del nombre previo en el repositorio. `tsc` completado íntegramente.

FECHA: 05/03/2026
QUE SE CAMBIO: Corrección Endpoints de Listado de Peritos y Reestructuración de Reportes (Filtros por defecto y Métricas de Rendimiento Financiero).
POR QUE: El listado de Peritos aparecía vacío impidiendo altas por validación de mail, causado por una migración de SQL desajustada en el array JSON `roles`. De igual forma, el Perfil Reportes requería el despliegue automático del mes vigente, desagrupando los rendimientos monetarios por `tipo_inspeccion` y unificando el plano estético con los estándares Premium de CLARITY (Linear/Notion vibes).
COMO: 1) Ajustado `getPeritosData` en `actions.ts` para tolerar un PostgREST `OR` simultaneo interpolando JSON `roles.cs` contra la columna str legacy `rol.eq`. 2) Reescritos `useState` dates en `ReportesFiltros.tsx` inyectando funciones Date-Fns para seteo dinámico por defecto. 3) Creados los bucles de iteración financiera `desgloseTipoIP` aislados a nivel global, e internamente aplicados sobre la mapeo de Tablas de Perito de manera responsiva. 4) Añadido estilo de Tarjetas UI en Headers con layout flex, badge limits & pseudo-gradientes shadow.
ARCHIVOS AFECTADOS: `src/app/(dashboard)/directorio/peritos/actions.ts`, `src/components/reportes/ReportesFiltros.tsx`.
EFECTOS COLATERALES: Funcionalidades financieras completadas (Gross & Net per Inspección). Resuelto Bug críitico listado Usuarios Operativos.

---

FECHA: 05/03/2026
QUE SE CAMBIO: Rediseño Robusto de Lógica de Facturación y Reportes — Anti-Duplicación de Honorarios.
POR QUE: La lógica de billing tenía 6 fallas críticas: (1) sin protección anti-duplicación al re-cerrar, (2) timing incorrecto de honorarios calle vs carga, (3) campo `valor_perito` inexistente, (4) `monto_pagado_perito_carga` nunca se populaba, (5) tabla `caso_historial_estados` inexistente, (6) query peritos con sintaxis legacy.
COMO: 1) `actions.ts`: Guard anti-duplicación via `monto_facturado_estudio > 0`. Fix `valor_perito` → `valor_perito_calle`/`valor_perito_carga`. 2) `reportes/page.tsx`: fix tabla → `historial_estados`, fix query peritos OR legacy+array, agregar `fecha_inspeccion_real`. 3) Reescritura `ReportesFiltros.tsx` con timing diferenciado calle(`fecha_inspeccion_real`) vs carga(`fecha_cierre`). Nuevos KPIs. Columnas separadas. Fila totales. 4) Backfill 115 casos históricos.
ARCHIVOS AFECTADOS: `actions.ts`, `reportes/page.tsx`, `ReportesFiltros.tsx`, `tmp/fix_perito_carga_billing.js`.
EFECTOS COLATERALES: Requiere cargar `valor_perito_carga` en Configuración > Honorarios.
TESTEADO: `npx tsc --noEmit` 0 errores. Backfill 115/115 ok.

---

FECHA: 06/03/2026
QUE SE CAMBIO: (1) Limpieza de Peritos Fantasma — eliminados 6 usuarios migrados falsos, reasignados 218 casos a los 5 peritos reales, creado Emiliano De Lia, corregidos roles multi-role. (2) Sistema de Ampliaciones — `caso_origen_id` ahora funcional: CasoForm detecta siniestros duplicados y ofrece vincular como ampliación, CasoDetail muestra historial del siniestro con todos los casos relacionados. (3) Fix trigger `fn_precio_historial` que referenciaba columna renombrada `valor_perito`. (4) Fix filtro de peritos en CasoForm para soportar multi-role (roles array). (5) Precios actualizados desde Excel + tipo "ausente" creado.
POR QUE: Peritos fantasma impedían la gestión correcta. Siniestros con ampliaciones necesitaban aparecer como filas independientes sin perder la trazabilidad. Trigger roto impedía guardar precios.
COMO: Script `cleanup_peritos.js` para remap y limpieza. API endpoint `/api/casos/check-siniestro`. `crearCaso` acepta `caso_origen_id`. `CasoDetail` busca todos los casos con mismo `numero_siniestro` y muestra panel de historial. 9 duplicados existentes vinculados retroactivamente.
ARCHIVOS AFECTADOS: `casos/actions.ts`, `CasoForm.tsx`, `CasoDetail.tsx`, `api/casos/check-siniestro/route.ts`, `015_fix_precio_historial_trigger.sql`.
EFECTOS COLATERALES: Los peritos ahora se filtran por `roles` array en vez de `rol` string — cualquier componente que use `p.rol` directo puede necesitar actualización.
TESTEADO: `npx tsc --noEmit` 0 errores. Verificación post-cleanup: 5 usuarios activos, 0 refs huérfanas, 218 casos ok. 9 duplicados vinculados.

---

FECHA: 06/03/2026
QUE SE CAMBIO: (1) Migración completa desde DatosMigracion.xlsx — 488 filas importadas, datos anteriores eliminados. (2) Tiempos Medios de Gestión corregidos — ahora usa fechas directas de los casos (`fecha_derivacion`→`fecha_inspeccion_real` para Asig→IP, `fecha_inspeccion_real`→`fecha_carga_sistema` para IP→Carga). Carga→Licitando y Licitando→Cerrado quedan como "Sin datos" hasta que haya datos del sistema nuevo. (3) Gestor en CasosTable cambiado: clic copia email, lápiz edita asignación.
POR QUE: Datos anteriores (218 casos) eran parciales/inconsistentes. Tiempos Medios usaban historial_estados que solo tenía un registro "Migrado" por caso. UX del gestor requería acceso rápido al email.
COMO: Script `tmp/migrate_datos.js` con mapeo completo de encabezados Excel→DB. `ReportesFiltros.tsx` reescrito sección 7. `CasosTable.tsx` gestor column refactored.
ARCHIVOS AFECTADOS: `ReportesFiltros.tsx`, `CasosTable.tsx`, `tmp/migrate_datos.js`.
EFECTOS COLATERALES: Carga→Licitando y Licitando→Cerrado mostrarán "Sin datos" hasta que se acumulen cambios de estado desde la app.
TESTEADO: `npx tsc --noEmit` 0 errores. 488/488 filas importadas, 0 errores.

---

FECHA: **10/03/2026 - Hotfix: Terminología, Validación de Fotos y Reportes**
- **QUE SE CAMBIO**: En `SelectorZonaDanio.tsx`, se corrigió la nomenclatura de las luces traseras de "Ópticas" a "Faros traseros" (Izq/Der) y se exportó el diccionario `ZONAS_MAP`. En `WizardCaptura.tsx`, se forzó la validación del botón Continuar para requerir un mínimo de 2 fotos por cada zona de daño seleccionada (`fotosDanios.length >= zonasDanio.length * 2`). Además, la `descripcion` de las tareas subidas al backend ahora mapea los IDs brutos a nombres legibles por humanos usando `ZONAS_MAP`.
- **POR QUE**: Pedido del usuario para evitar que se avance sin cargar pruebas de daños reales. Las ópticas son delanteras, los traseros son faros. Los peritos necesitan entender a qué se refería el usuario leyendo el informe de archivos (`Daños reportados: Faro Tra. Izq., Baúl`).
- **COMO**: Manipulación de arrays, `.map()`, validaciones condicionales en React.
- **ARCHIVOS AFECTADOS**: `SelectorZonaDanio.tsx`, `WizardCaptura.tsx`.
- **TESTEADO**: Compilado mediante `npx tsc` satisfactorio.

---
- **QUE SE CAMBIO**: Se eliminó totalmente la silueta SVG del auto vista desde arriba (top-down) en `SelectorZonaDanio.tsx`. Se implementó una "Grilla Anatómica" de 3 columnas (UI Grid) con botones masivos (touch targets > 60px) distribuyendo el auto en Frente, Lateral y Trasera. Se ató el diccionario `ZONAS_MAP` a nuevas claves modulares (incluyendo ópticas independientes).
- **POR QUE**: A pedido del usuario, el mapa SVG requería demasiada abstracción espacial y no era a prueba de fallos para personas mayores o usuarios ajenos a la tecnología (Asegurados standard). La grilla por texto categorizado + botones emula el patrón intuitivo de una calculadora o tablero simple.
- **COMO**: Sustitución total en `SelectorZonaDanio.tsx` usando Tailwind `grid-cols-[1fr_1.8fr_1fr]` para imitar la jerarquía de un coche sin llegar a dibujarlo. Se incorporó feedback visual Magenta para los "active-states".
- **ARCHIVOS AFECTADOS**: `src/components/inspeccion-remota/SelectorZonaDanio.tsx`.
- **EFECTOS COLATERALES**: Ninguno negativo. La data de `zonasDanio` enviada al Wizard (`WizardCaptura.tsx`) sigue siendo el array de strings con IDs, pero ahora mucho más rico e intuitivo gracias a las ópticas desglosadas.
- **TESTEADO**: Se compilaron sin errores las nuevas Props locales.

---
- **QUE SE CAMBIO**: Se añadió un Resumen Visual de Zonas Dañadas Reportadas en la galería del panel de administración (`GaleriaFotosResponsive.tsx`).
- **POR QUE**: Para proveer de contexto visual inmediato al perito experto sobre las partes seleccionadas por el asegurado, sin requerirle inspeccionar cada thumbnail.
- **COMO**: Extrayendo dinámicamente un `Set` de zonas únicas desde las descripciones inyectadas (`Daños reportados: ...`) de las fotos `danio_detalle` subidas. Renderizadas como `Badges` prominentes en el tope de la grilla fotográfica.
- **ARCHIVOS AFECTADOS**: `src/components/inspeccion/GaleriaFotosResponsive.tsx`.
- **EFECTOS COLATERALES**: Ninguno negativo. Despliegue condicional seguro para evitar visualizaciones en blanco.
- **TESTEADO**: Compilado mediante `npx tsc` satisfactorio y reescritura de hooks de array validadas.

FECHA: 07/03/2026
QUE SE CAMBIO: Portal de Inspección Remota — Sistema de links compartibles para carga guiada de fotos.
POR QUE: Los peritos necesitan que asegurados/talleres suban fotos remotamente para poder hacer pericias sin ir al lugar. Sistema guiado paso a paso para garantizar calidad fotográfica.
COMO: (1) Migración `016_links_inspeccion.sql` con tabla de tokens, RLS, función de auto-expiración. (2) Middleware excluye `/ip/` de auth redirect. (3) API endpoints `/api/inspeccion-remota/upload` (validación token + upload a Storage + registro en fotos_inspeccion) y `/api/inspeccion-remota/complete` (marking + historial + notas_caso). (4) Portal público `/ip/[token]`: layout dark mobile-first, página con validación de token y pantallas de error amigables. (5) WizardCaptura: wizard 5 pasos (bienvenida → 6 fotos reglamentarias → selector zona daños → fotos daños → resumen + upload con progress bar → completado). (6) CameraCapture: getUserMedia API con overlays SVG guía por tipo de foto (siluetas de vehículo, odómetro, VIN). Switch front/back cámara, capture/retake/accept. (7) SelectorZonaDanio: diagrama SVG interactivo top-down con 15 zonas tocables. (8) GenerarLinkInspeccion: componente dashboard para generar/copiar/revocar/regenerar links, integrado en Asignaciones Operativas de CasoDetail.
ARCHIVOS AFECTADOS: `middleware.ts`, `016_links_inspeccion.sql`, `ip/[token]/layout.tsx`, `ip/[token]/page.tsx`, `api/inspeccion-remota/upload/route.ts`, `api/inspeccion-remota/complete/route.ts`, `WizardCaptura.tsx`, `CameraCapture.tsx`, `SelectorZonaDanio.tsx`, `GenerarLinkInspeccion.tsx`, `CasoDetail.tsx`.
EFECTOS COLATERALES: Tabla `fotos_inspeccion.usuario_id` recibe NULL para fotos subidas por terceros (no autenticados). Requiere ejecutar migración 016 en Supabase.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 08/03/2026
QUE SE CAMBIO: Fix upload + galería de fotos + transición automática a pendiente_carga.
POR QUE: (1) Las fotos subidas por link remoto no se podían ver en el expediente. (2) El caso no cambiaba automáticamente a pendiente_carga. (3) El historial no registraba la transición. (4) El upload fallaba porque el middleware redirigía /api/inspeccion-remota/ a /login.
COMO: (1) Middleware: agregado `/api/inspeccion-remota/` a rutas públicas en `middleware.ts`. (2) complete/route.ts: ahora actualiza caso.estado → pendiente_carga, registra historial con estado_anterior/estado_nuevo correctos, crea nota sistema, envía notificación a perito_carga. (3) GenerarLinkInspeccion.tsx: galería de thumbnails con lightbox fullscreen (navegación prev/next, strip de miniaturas). (4) WizardCaptura: error handling mejorado — muestra el error real de la API. (5) CameraCapture: rediseño premium sin SVGs. (6) upload/route.ts: usa createAdminClient() dentro del handler. (7) CasoDetail.tsx: removido `"use server"` incorrecto.
ARCHIVOS AFECTADOS: `middleware.ts`, `complete/route.ts`, `GenerarLinkInspeccion.tsx`, `WizardCaptura.tsx`, `CameraCapture.tsx`, `SelectorZonaDanio.tsx`, `upload/route.ts`, `CasoDetail.tsx`, `page.tsx`, `next.config.ts`.
EFECTOS COLATERALES: Ninguno negativo. El estado del caso avanza automáticamente.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 08/03/2026
QUE SE CAMBIO: Unificación de galerías fotográficas en el expediente.
POR QUE: Había 3 lugares mostrando fotos (galería de inspección, galería del link remoto, archivos). Las fotos remotas se duplicaban en 2 galerías.
COMO: (1) `GenerarLinkInspeccion.tsx` ahora es SOLO gestor de links (generar/copiar/revocar/estado). Sin galería. (2) `GaleriaFotosResponsive.tsx` reescrito como galería UNIFICADA con: tabs Todas/Reglamentarias/Daños con contadores, lightbox con zoom+pan+filtros de análisis de daños (contraste, saturación, bordes, invertido, calor). (3) `CasoDetail.tsx` muestra galería en todos los estados (no solo post-ip_coordinada). (4) `ZonaArchivos` se mantiene para documentación PDF/Word.
ARCHIVOS AFECTADOS: `GenerarLinkInspeccion.tsx`, `GaleriaFotosResponsive.tsx`, `CasoDetail.tsx`.
EFECTOS COLATERALES: Ninguno negativo.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 08/03/2026
QUE SE CAMBIO: Descarga de fotos en galería unificada.
POR QUE: Se necesitaba poder guardar las fotos en crudo en la PC, ya sea de a una o todo el paquete de la inspección.
COMO: (1) Agregado botón de "Descargar esta foto" en el lightbox (usa `fetch` + `blob` para forzar la descarga sin abrirla en nueva pestaña). (2) Botón "Descargar todas" en la cabecera de la galería que usa la librería `jszip` (instalada en package.json) para generar un archivo ZIP empaquetando todas las fotos mostradas con labels correspondientes. (3) Notificaciones toast de progreso al empaquetar grandes volumenes.
ARCHIVOS AFECTADOS: `GaleriaFotosResponsive.tsx`, `package.json`.
EFECTOS COLATERALES: Ninguno negativo.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 09/03/2026
QUE SE CAMBIO: Fix de redirección al cerrar sesión en entorno VPS (EasyPanel).
POR QUE: Al usar `output: standalone` detrás de un proxy (Traefik), `request.url` devuelve la IP interna del contenedor Docker, lo que enviaba al usuario a una IP privada al cerrar sesión.
COMO: Modificado `src/app/auth/signout/route.ts` para leer la cabecera `x-forwarded-host` provista por el proxy y reconstituir la URL base correcta (ej. `https://panel.aomsiniestros.com/login`) en lugar de usar la URL interna del request.
ARCHIVOS AFECTADOS: `src/app/auth/signout/route.ts`.
EFECTOS COLATERALES: Funciona tanto en local como en producción detrás de proxy.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 09/03/2026
QUE SE CAMBIO: Corrección en reglas de negocio y roles (Perito Calle y Repuesteros).
POR QUE: El perito de calle sí necesita crear tareas, y el sistema de repuesteros es meramente informativo, no se hacen licitaciones en el sistema.
COMO: (1) Se eliminó `WidgetRepuesterosMarca.tsx` y su llamada en `CasoDetail.tsx`. (2) Se actualizó `CLARITY_DOC_TECNICA.md` y la auditoría de roles para permitir que el perito de calle cree tareas y para remover las funcionalidades de recarga/licitación del perito de carga respecto a repuestos.
ARCHIVOS AFECTADOS: `CasoDetail.tsx`, `WidgetRepuesterosMarca.tsx` (eliminado), `CLARITY_DOC_TECNICA.md`, `AUDITORIA_ROLES.md`.
EFECTOS COLATERALES: Roles más apegados a la realidad operativa del estudio.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 09/03/2026
QUE SE CAMBIO: Fix de parseo JSON y error "Database error loading user" al editar peritos.
POR QUE: Al editar un perito, el campo `roles` a veces llegaba como un string simple (ej: "calle") en lugar de un JSON array, provocando un error fatal al intentar parsearlo en Next.js. Si se pasaba este punto, al intentar editar un perito migrado del Excel (que existe en `public.usuarios` pero no en `auth.users`), Supabase tiraba el "Database error".
COMO: En `src/app/(dashboard)/directorio/peritos/actions.ts`:
1. Se hizo más robusto el try/catch de roles, aplicando split por comas si falla el `JSON.parse`.
2. Se introdujo una lógica de "fallback": si `getUserById` arroja error de usuario no encontrado (significa que es un usuario migrado), el sistema automáticamente llama a `createUser` con las mismas credenciales y fuerza que el ID local de `usuarios` se alinee al nuevo ID de `auth.users`, "dándole vida" en Auth sin romper nada interno.
ARCHIVOS AFECTADOS: `src/app/(dashboard)/directorio/peritos/actions.ts`.
EFECTOS COLATERALES: Ahora los usuarios "fantasma"/migrados pueden ser resucitados en Auth en el momento que un admin decide editarlos e ingresarles una contraseña nueva de 6 caracteres.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 09/03/2026
QUE SE CAMBIO: Fix para la creación de peritos con múltiples roles y fix para la eliminación de peritos migrados.
POR QUE: Cuando se creaba un nuevo usuario y se asignaban varios roles a la vez (ej: calle y carga), `react-select` enviaba en el FormData múltiples campos nativos llamados `roles`. El backend de Next.js al hacer `formData.get("roles")` tomaba solo el primero, ignorando el resto e ignorando el JSON strigificado manual. Adicionalmente, si el admin intentaba eliminar un perito legado (migrado, no existente en Auth), el sistema arrojaba el mismo 'Database error'.
COMO: 1) En el frontend (`PeritoFormDialog.tsx`) se renombró el input nativo de react-select a `rolesInput` para que no colisione con el campo enviado manualmente vía `formData.append("roles", ...)` con todo el array de roles. 2) En el backend (`deletePerito`), si el error de Supabase al intentar borrar el Auth es que "no existe", se procede igual a forzar el borrado manual de `public.usuarios`. 3) Para el error de validación de email falso: se atrapa `"Database error checking email"`, se busca con listUsers() el usuario huérfano y se usa ese `id` en lugar de fallar, permitiendo que la actualización proceda. Además, se creó la migración `017_fase15_usuarios_cascade.sql` para aplicar `ON UPDATE CASCADE` al esquema de FKs de Postgres.
ARCHIVOS AFECTADOS: `PeritoFormDialog.tsx`, `actions.ts`, `017_fase15_usuarios_cascade.sql`.
EFECTOS COLATERALES: Ninguno, solo que ahora se guardan múltiples roles perfectamente y se purgan/actualizan los usuarios migrados resolviendo conflictos de Foreign Keys.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 09/03/2026
QUE SE CAMBIO: Integración de Supabase Realtime para notificaciones y chat, fix de Sidebar roles y rediseño total de UX en Cámara de Inspección.
POR QUE: (1) Las notificaciones y comentarios del chat requerían recargar la página para verse (retraso severo de realtime). (2) El Perito de Carga con multi-rol (carga + calle) no veía la "Cola de Carga" porque consumía `rol` estático. (3) La cámara de inspección abría la cámara frontal, crasheaba abriendo la galería accidentalmente, y el flujo para tomar daños múltiples era excesivamente lento al cerrar y abrir por cada foto.
COMO: 1) Creación de `018_fase15_realtime_chat_notif.sql` para inyectar `notificaciones`, `comentarios_tarea` y `fotos_inspeccion` en la policy de `supabase_realtime`. 2) Re-estructuración del `useEffect` en `ComentariosTarea.tsx` con un canal dedicado `chat_tarea_[id]`. 3) Fix `userRoles.includes("carga")` en `SidebarClient.tsx`. 4) Reescritura completa de `CameraCapture.tsx` con prop `allowMultiple`, reel miniatura en la parte inferior, y partición estricta de `<input type="file">` HTML5 para matar la mezcla de galería app-vs-web en Android.
ARCHIVOS AFECTADOS: `CameraCapture.tsx`, `WizardCaptura.tsx`, `ComentariosTarea.tsx`, `SidebarClient.tsx`, `Sidebar.tsx`, `018..._realtime_chat_notif.sql`.
EFECTOS COLATERALES: Inspección por daños soporta toma continua como "carrete", el chat es 100% instántaneo sin F5.
EFECTOS COLATERALES: Inspección por daños soporta toma continua como "carrete", el chat es 100% instántaneo sin F5.
TESTEADO: `npx tsc --noEmit` 0 errores.

---

FECHA: 10/03/2026
QUE SE CAMBIO: Integración total del Branding "Sancor Seguros" y Rediseño Gráfico de la aplicación Cliente (Inspección Remota).
POR QUE: Se necesitaba transmitir seguridad corporativa al asegurado final, eliminando diseños genéricos en favor del look "Premium Magenta" y la psicología de validación (Íconos de Escudos, Logotipos Verificados). Asimismo, la vieja interfaz de Daños y de Cámara resultaban ortopédicas y carentes de feedback UX.
COMO: 1) Refactorizado `WizardCaptura.tsx` integrando el logo corporativo de Sancor Gris (#logo-al-servicio-de-SS), escudos de confianza, y gradientes Magenta nativas. 2) Reescrito desde cero el motor del `SelectorZonaDanio.tsx` transformándolo en un renderizado Top-Down vectorial interactivo sin componentes ajenos, manejado 100% por paths de SVG con opacidad dinâmica y micro-animaciones CSS `.vector-scale-up`. 3) Modernizada la retícula y botonera de `CameraCapture.tsx` transparentando el "Obturador" del sistema de la cámara y empleando el verde menta (#2DD4A0) para los Call to Action finales (checkmarks, alertas de success y envíos confirmados). 4) Unificación total de la paleta Dark-Purala para la ruta pública (Background #0C0A0F, Surfaces #16131B, Textos Primarios #F5F0F7 y Soft #9B8FA6).
ARCHIVOS AFECTADOS: `WizardCaptura.tsx`, `CameraCapture.tsx`, `SelectorZonaDanio.tsx`, `ip/[token]/layout.tsx`.
EFECTOS COLATERALES: Funcionalidades nativas preservadas e intactas (WebRTC/Inputs Files) ahora dotadas de estilo 100% Nativo Sancor. 
TESTEADO: Todos los flujos de "Pasos" mapeados con hot-reloading exitoso. Transpilación validada.

---

FECHA: 10/03/2026
QUE SE CAMBIO: Fase 16 - Notificaciones Automáticas Sancor, Tracking Link Público y Detector de "Gestor Replies".
POR QUE: Sancor requiere un aviso automático en cada paso del proceso (Contacto, Coord, Visita, Cierre) respetando sus flujos, hilos de conversación, casillas, etc. En paralelo precisan proveer al asegurado de un enlace para ver "su trámite".
COMO: (1) Se creó migración `019_fase16_...sql` para las tablas `mail_queue` (buffers 3-minutos antivampiro), `mail_templates` (Editor visual), `respuestas_gestor`, y `seguimiento_tokens`. (2) Hooks en `acciones.ts` (`crearCaso`, `cambiarEstadoCaso`) que evalúan e inyectan templates encolados, interrumpiendo redundancias. (3) Creación de Cron endpoints `/api/cron/` procesando mediante REST API calls a `gmail.googleapis.com` simulando el envío via Threading asíncrono. (4) Rediseñado Settings de "Notificaciones" en UI para soportar variables (`{{siniestro}}`, etc.). (5) Nueva ruta `/seguimiento/[token]` pública, read-only y mobile-first con Timeline interactivo. (6) Banner UI de Respuestas de Gestores incrustado encima de la data del Vehículo en el Detalle del Siniestro y Tabla principal.
ARCHIVOS AFECTADOS: `mail_queue.ts`, `gmail.ts`, `templates.ts`, varios actions, `GestorRepliesBanner.tsx`, `MailTemplatesEditor.tsx`, `019_fase16_notificaciones_email.sql`.
EFECTOS COLATERALES: Ninguno perjudicial. Permite alta configurabilidad pero depende de configuraciones OAuth externas de Google (Secret/Refresh keys provistas por ENV).
FECHA: 10/03/2026
QUE SE CAMBIO: Bugfixing general pre-pull request (Notas Badge, Data Migration facturación, Filtros de Fecha avanzados, Roles Peritos).
POR QUE: Los siniestros facturados de la migración no reflejaban el estado correcto ("facturada" o "ip_cerrada"), los usuarios tenían problemas notando si un caso tenía notas ocultas en la lupa, ciertos peritos de carga con multi-rol ("Jairo") no listaban en el dropdown, y la tabla de Casos requería que la columna principal de fecha sea dinámica frente al dropdown de filtrado elegido.
COMO: 
1. Ejecución de script `tmp/fix_estados.js` actualizando map DB ("IP CERRADA"->"facturada", "PARA FACTURAR"->"ip_cerrada").
2. Modificado `CasosTable.tsx`: Se añadió borde de lectura visual rápida (`border-l-[3px] border-l-brand-primary`) en filas con `notas_admin`.
3. Modificado `CasosTable.tsx`: El primer Th "Ingreso" muta su Value nativo por (`fecha_carga_sistema`|`fecha_cierre`|etc) en función del select nativo `filterDateType`, mostrándose automáticamente la fecha extraída y formateada en esa columna sin que el usuario deba adivinar de qué fecha se trata la renderizada.
4. Extendido `getPeritos()` (en `actions.ts`) integrando el selector del column JSON `roles` a la par del viejo column text `rol`.
5. Patcheados TS Errors residuales huérfanos preexistentes (`deleteTarea` no implementada, y condicionales opcionales de render de la tabla Peritos).
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `actions.ts` (casos, tareas), `page.tsx` (directorio), `tmp/fix_estados.js`.
EFECTOS COLATERALES: Ninguno perjudicial. Resuelve bloqueos de la UI en tareas y mejora el filtrado general multi-date.
TESTEADO: `npx tsc --noEmit` local arrojando Exit Code 0. Queries hot-swap en DB ejecutadas ok.


---

FECHA: 10/03/2026
QUE SE CAMBIO: Editar Ubicación y Fecha de Siniestros (Fase 17).
POR QUE: Los casos "En Coordinación" o "Contactados" no permitían modificar la fecha ni el lugar de inspección previamente pactados/acordados.
COMO: 1) Creado componente `<EditableCoordinacion />` cliente con formulario integrado. 2) Añadida server action `actualizarDatosCoordinacion`. 3) Inyectada en `CasoDetail.tsx`. 4) Cada edición escribe un motivo estandarizado directo al `historial_estados` del caso.
ARCHIVOS AFECTADOS: `actions.ts`, `EditableCoordinacion.tsx`, `CasoDetail.tsx`.
EFECTOS COLATERALES: Ninguno perjudicial. Interfaz más interactiva para los roles Carga y Admin.
TESTEADO: `npm run build` Ok sin errores TS.

---

FECHA: 10/03/2026
QUE SE CAMBIO: Filtros Persistentes en Tabla de Casos (Fase 18).
POR QUE: Al navegar hacia el Detalle de un Caso y clickear en "Atrás", Next.js recargaba el componente haciendo que todos los filtros de estado/búsqueda/peritos vigentes se borraran, lo que frustra la usabilidad. Se pidió que la persistencia sea exclusiva por cuenta/computadora.
COMO: Se programó el Hook `useLocalStorageState.ts` que intercepta las escrituras de estados (useState) y las clona/recupera de `window.localStorage`. Se conectó a todos los `useState` de la cabecera en `CasosTable.tsx`. Se inyectó además un botón de `Limpiar Filtros` bajo demanda.
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `useLocalStorageState.ts`.
EFECTOS COLATERALES: Ninguno perjudicial. Alta Resiliencia al recargar F5.
TESTEADO: `npm run build` Ok sin errores TS. NextJS Virtualizer mantiene compatibilidad con LocalStorage.

---

FECHA: 10/03/2026
QUE SE CAMBIO: Migración Final de Datos e Integridad de Borrado de Usuarios (Fase 19).
POR QUE: Se necesitaba volcar el excel final "DatosMigracion" sin desencadenar los ~1000 correos automáticos programados recientemente. A su vez, el panel de administración fallaba al intentar borrar un Perito producto de restricciones en la base de datos (Violación de Foreign Keys en la tabla Notificaciones).
COMO: 1) Se generó la migración `020_fase19_usuarios_on_delete.sql` transformando todas las restricciones foreáneas dependientes del ID de usuario a políticas `ON DELETE SET NULL` (preservando historial de casos/comentarios) o `ON DELETE CASCADE` (borrando notificaciones y lecturas irrelevantes). 2) Se elaboró el motor `scripts/migrarFinal.ts` que se conecta por Supabase-JS e inserta 471 registros de forma nativa (bypass de NextJS), evitando despertar el Cron de Mails.
ARCHIVOS AFECTADOS: `020_fase19_usuarios_on_delete.sql`, `scripts/migrarFinal.ts`.
EFECTOS COLATERALES: Ninguno. Usuarios borrados ahora dejarán rastro de "Siniestro asignado a: Desconocido/Nulo" protegiendo la auditoría de tabla.
TESTEADO: Se procesaron (Upsert) los datos correctamente. Script de base de datos entregado.

---

FECHA: 11/03/2026
QUE SE CAMBIO: Timezone Fix en date-fns (Filtros Hoy) y Styling Oscuro Facturadas (Fase 20).
POR QUE: Al filtrar por "Hoy", `date-fns` evaluaba la fecha UTC nativa desfasando el caso al día anterior en Argentina. Además, se pidió restar atención visual a los casos en estado Facturado.
COMO: 1) Creado parser local y anclado a `T12:00:00` previo a la inyección en `date-fns`. 2) Aplicada opacidad condicional (opacity-75 grayscale) y mutación de paleta dinámica para el estado "facturada".
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `EstadoBadge.tsx`.
EFECTOS COLATERALES: Contraste visual fuertemente alterado para casos Facturados.
TESTEADO: `npm run build` Ok sin errores TS.

---

FECHA: 11/03/2026
QUE SE CAMBIO: Fix de Multi-Rol y Filtro de Fecha Exacta (Fase 21).
POR QUE: Los peritos "mutantes" (como Jairo Ferlanti) que abarcaban más de un tipo de trabajo desaparecían de los selectores porque el código exigía validaciones estrictas (`rol === "carga"`). Por otro lado, la vista de Casos carecía de un picker puntual ("fecha X") para navegar la agenda histórica.
COMO: 1) Ejecuté un script sobre la BDD mudando a los usuarios afectados a `roles: ["calle", "carga"]`. 2) Relajé >6 validadores `===` a lo largo del frontend (ej: `dashboard`, `EditableCoordinacion`, `CasoDetail`) para que verifiquen vía `roles.includes()`. 3) Añadí un `<input type="date">` nativo html5 sincronizado por Local Storage.
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `actions.ts`, `CasoForm.tsx`, `dashboard/page.tsx`, `EditableCoordinacion.tsx`.
EFECTOS COLATERALES: Arquitectura flexibilizada. Personal puede abarcar operaciones mixtas de auditoría e inspección en la calle al mismo tiempo.
TESTEADO: `npm run build` Ok sin errores TS de linter post-flexibilización.

---

FECHA: 11/03/2026
QUE SE CAMBIO: Filtro de Fecha Multi-Campo Dinámico (Fase 22).
POR QUE: Los filtros de fecha ("Hoy", "Semana", "Exacta") aplicaban exclusiva y rígidamente a la fecha de "Ingreso" (`fecha_derivacion`). Negocio requería pivotar estos filtros para buscar por Ingreso, Inspección, Carga o Cierre dinámicamente.
COMO: 1) Inyecté el estado `filterDateType` en `CasosTable.tsx`. 2) Agregué un `<select>` nativo previo al input exacto para determinar la columna temporal objetivo (Ingreso | Inspección | Carga | Cierre). 3) Modifiqué el `useMemo` de `procesados` para evaluar `c[filterDateType]` en lugar del objeto estático.
ARCHIVOS AFECTADOS: `CasosTable.tsx`.
EFECTOS COLATERALES: Ninguno. El botón Limpiar resetea el select a `fecha_derivacion` por default para evitar confusiones de sesión.
TESTEADO: Compilación Next/Turbopack superada sin errores.

FECHA: 20/03/2026
QUE SE CAMBIO: BUG-022 — Optimización de rendimiento DB: 14 índices B-Tree + selects explícitos en Cola de Carga.
POR QUE: Supabase reportaba Disk IO Budget Throttling al 82%+. Los filtros múltiples en CasosTable, los JOINs del módulo Kilometraje v2, y las consultas de reportes provocaban Sequential Scans masivos porque las columnas críticas de filtrado/JOIN no estaban indexadas. Además, `getCasosParaCarga()` usaba `select('*')` trayendo campos pesados (datos_crudos_sancor, campos financieros, tags, etc.) que la Cola de Carga no renderiza.
COMO: (1) Migración SQL `030_optimizacion_indices_db.sql` con 14 índices B-Tree: 8 en `casos` (estado, fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre, perito_calle_id, perito_carga_id, gestor_id), 3 en `historial_estados` (caso_id, estado_nuevo, created_at — ultra críticos para JOINs de km y reportes), 3 en `tareas` (caso_id, estado, asignado_id). (2) `carga/actions.ts`: reemplazado `select('*')` por 16 columnas explícitas + 4 JOINs nominales, eliminando datos_crudos_sancor, tags, campos financieros, y datos detallados del asegurado del payload. (3) `carga/page.tsx`: cast de tipo para compatibilidad con Supabase TS types en FK 1:1.
ARCHIVOS AFECTADOS: `supabase/migrations/030_optimizacion_indices_db.sql` (NUEVO), `src/app/(dashboard)/carga/actions.ts`, `src/app/(dashboard)/carga/page.tsx`.
EFECTOS COLATERALES: Ninguno. Los índices son aditivos (IF NOT EXISTS). La Cola de Carga sigue renderizando exactamente los mismos datos. getCasos() (tabla principal) ya tenía selects explícitos — no requirió cambios.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores. Migración SQL debe ejecutarse en Supabase SQL Editor.

FECHA: 20/03/2026
QUE SE CAMBIO: BUG-023 — Semántica de `fecha_carga_sistema`: ahora registra SALIDA de PTE CARGA.
POR QUE: `fecha_carga_sistema` se grababa al ENTRAR a `pendiente_carga` (cuando la inspección se completaba). El usuario necesita que registre cuándo el perito de CARGA procesó el caso (cuando SALE de `pendiente_carga`), para medir tiempos de gestión del perito de carga.
COMO: (1) `casos/[id]/actions.ts` — `marcarInspeccionRealizada`: eliminada escritura de `fecha_carga_sistema` al pasar a pendiente_carga. `cambiarEstadoCaso`: cambiada condición de `nuevoEstado === 'pendiente_carga'` a `caso.estado === 'pendiente_carga' && nuevoEstado !== 'pendiente_carga'` — graba la fecha cuando el caso SALE de pte carga. (2) `inspeccion-remota/complete/route.ts` — eliminada escritura de `fecha_carga_sistema` en completar inspección remota. (3) `ReportesFiltros.tsx` — eliminado fallback `fecha_carga_sistema` en filtro de IPs realizadas y billing de perito calle, ahora usa solo `fecha_inspeccion_real`. (4) `PanelPeritoCarga.tsx` — billing date de perito calle cambiado a usar solo `fecha_inspeccion_real`.
ARCHIVOS AFECTADOS: `src/app/(dashboard)/casos/[id]/actions.ts`, `src/app/api/inspeccion-remota/complete/route.ts`, `src/components/reportes/ReportesFiltros.tsx`, `src/components/dashboard/PanelPeritoCarga.tsx`.
EFECTOS COLATERALES: Casos futuros en cola de carga tendrán `fecha_carga_sistema` NULL hasta que el perito de carga los procese. La Cola de Carga ya usaba fallback `updated_at` así que sigue funcionando. Datos históricos no se modifican retroactivamente. Si `pte_carga → ip_cerrada` directo, graba AMBAS fechas simultáneamente.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

## 10. PROBLEMAS CONOCIDOS Y SOLUCIONES APLICADAS

### BUG-027: Peritos calle/carga no pueden mover tarjetas ni cambiar participantes en Tareas (RESUELTO — RECURRENTE x3)
- PROBLEMA: (A) Los peritos de calle y carga no podían arrastrar tarjetas entre columnas del Kanban. (B) En la barra lateral (Sheet) del detalle de tarea, el popover de participantes no se desplegaba — no aparecía la lista de usuarios para cambiar responsables. El botón de editar en la card SÍ funcionaba.
- CAUSA: (A) La validación de drag-and-drop en `KanbanBoard.tsx` usaba `currentUserRol !== "admin"` (string legacy) para el bypass. Para usuarios con `roles: ["calle", "carga"]`, el campo legacy `rol` podía ser `"calle"`, y el check `=== "admin"` siempre fallaba. Además, faltaba permitir al CREADOR de la tarea moverla (solo se chequeaba participante y asignado). (B) El `canEditParticipants` en `TareaCard.tsx` usaba `currentUserRol === "admin" || currentUserRol === "carga"`, ignorando el array `roles[]` — para usuarios duales con `rol: "calle"`, ambos checks fallaban y `canEdit=false` impedía abrir el popover. Además, el SheetContent tenía `overflow-hidden` que recortaba el dropdown absoluto del ParticipantesPopover cuando se abría con `openDirection="down"` desde el header del sheet.
- SOLUCION: (1) Se pasa `currentUserRoles` (array) desde `page.tsx` → `KanbanBoard` → `TareaCard`. (2) Drag-and-drop ahora usa `currentUserRoles.includes("admin")` y agrega check de `isCreator`. (3) `canEditParticipants` usa `roles.includes()` con fallback al string legacy. Se habilitó para los 3 roles (admin/carga/calle). (4) Removido `overflow-hidden` del SheetContent para que el dropdown no sea clipeado por CSS.
- FECHA: 05/04/2026
- NO REPETIR: (A) NUNCA usar el campo legacy `rol` (string) para checks de permisos. SIEMPRE usar `roles` (array) con `.includes()`. El campo `rol` puede no reflejar todos los roles del usuario. (B) NUNCA poner `overflow-hidden` en un contenedor que tiene descendientes con posicionamiento absoluto que necesitan sobresalir (como popovers/dropdowns). Usar `overflow-y-auto` solo en el div scrollable interno. (C) Para la edición de participantes, la regla definitiva es: TODOS los roles autenticados pueden editar participantes en tareas donde participan o crean.


### BUG-026: Comentarios fantasma + asignaciones single-select rotas (RESUELTO)
- PROBLEMA: (A) Los comentarios en el chat de tareas desaparecían silenciosamente al dar Enter — el usuario perdía lo que escribió sin recibir ningún error visible. (B) La UI de asignación de tareas usaba un dropdown single-select legacy que solo cambiaba `asignado_id`, ignorando la tabla relacional `tarea_participantes`.
- CAUSA: (A) Las políticas RLS de `comentarios_tarea` usaban `FOR ALL USING (auth.uid() IS NOT NULL)` SIN `WITH CHECK`. PostgreSQL usa `USING` para SELECT/UPDATE/DELETE pero REQUIERE `WITH CHECK` para INSERT. El INSERT fallaba silenciosamente devolviendo null. El frontend hacía un optimistic update, recibía el error, revertía el update PERO no mostraba toast de error y limpiaba el textarea → el usuario perdía su texto. (B) `handleAssigneeChange()` llamaba a `updateTareaAsignado()` que solo actualizaba la columna legacy `asignado_id` en la tabla `tareas`, sin tocar `tarea_participantes`.
- SOLUCION: (A) Migración `032_tareas_colaborativas_rls.sql`: políticas explícitas por operación con `WITH CHECK` para INSERT en todas las tablas del ecosistema de tareas. Frontend: try/catch estricto en `handleEnviar()`, `toast.error()` con mensaje de Supabase, y restauración del texto en caso de fallo. (B) Nuevo componente `ParticipantesPopover.tsx`: multi-select con checkboxes, gestiona directamente la tabla `tarea_participantes` (DELETE+INSERT masivo), y actualiza `asignado_id` para retrocompat. Permission-gated: solo admin/carga pueden editar.
- FECHA: 25/03/2026
- NO REPETIR: (A) NUNCA usar `FOR ALL USING` sin `WITH CHECK` en RLS. Siempre crear políticas separadas por operación para evitar bloqueos silenciosos de INSERT. Todo fallo de DB debe resultar en un toast.error visible. (B) NO gestionar asignaciones via columna legacy `asignado_id`. Siempre usar la tabla relacional `tarea_participantes`.

### BUG-025: "Descargar todas" solo descargaba reglamentarias + 1 foto de daño (RESUELTO)
- PROBLEMA: Al presionar "Descargar todas" en la galería de fotos de un caso, el ZIP solo contenía las fotos reglamentarias y 1 foto de daño, aunque el informe tenía 27+ fotos.
- CAUSA: El nombre del archivo en el ZIP se generaba como `${TIPO_LABEL}_${foto.orden}.ext`. Todas las fotos de daño tienen `tipo = 'danio_detalle'` (mismo label "Detalle_Daño") y pueden compartir el mismo valor de `orden`. `JSZip.folder.file(name, blob)` sobrescribe silenciosamente si el nombre ya existe → solo la última foto de cada nombre sobrevivía.
- SOLUCION: Usar índice secuencial único como prefijo: `${String(idx+1).padStart(2,'0')}_${tipo_label}.ext`. Ejemplo: `01_Frontal.jpg`, `07_Detalle_Daño.jpg`, `08_Detalle_Daño.jpg`. Cada archivo tiene nombre garantizado único.
- FECHA: 25/03/2026
- NO REPETIR: Al generar archivos en un ZIP con JSZip, NUNCA usar campos de la DB como nombre de archivo sin garantizar unicidad. Siempre usar un índice secuencial o el ID del registro.

### BUG-024: Redirect loop ERR_TOO_MANY_REDIRECTS al expirar sesión Supabase (RESUELTO)
- PROBLEMA: Un perito se loguea correctamente pero después de navegar un rato, la plataforma entra en un loop de redirects (ERR_TOO_MANY_REDIRECTS / HTTP 429). El navegador muestra "Demasiadas redirecciones" y la app queda inaccesible.
- CAUSA: El middleware usaba `supabase.auth.getSession()` que lee el JWT de las cookies LOCALMENTE, sin hacer refresh. Cuando el access_token expiraba: (1) `getSession()` devolvía null porque el JWT era inválido. (2) El middleware redirigía a `/login`. (3) Pero las cookies muertas (con JWT expirado) NO se limpiaban porque el redirect response no propagaba las cookies del Supabase SSR client. (4) En `/login`, el middleware volvía a leer las cookies muertas → loop. La asimetría entre la validación local (`getSession`) y la validación server-side (`getUser` en pages) también contribuía — el middleware dejaba pasar tokens que luego fallaban en las páginas.
- SOLUCION: (1) Restaurado `supabase.auth.getUser()` en middleware (hace refresh automático del token O limpia las cookies si el refresh falla). (2) Al redirigir a `/login`, se copian TODAS las cookies del response mutado por Supabase (incluidas las de borrado) al redirect response. (3) `config.matcher` ya excluye static assets, así que `getUser()` solo se ejecuta 1 vez por navegación real.
- FECHA: 25/03/2026
- NO REPETIR: NUNCA usar `getSession()` en middleware de Supabase SSR. Siempre usar `getUser()` que es el único que hace refresh del token y limpia cookies muertas. Al crear un `NextResponse.redirect()`, SIEMPRE copiar las cookies del response original de Supabase (`response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value, ...c))`), o las limpiezas de sesión nunca llegarán al navegador.

### BUG-023: fecha_carga_sistema registraba ENTRADA a PTE CARGA en vez de SALIDA (RESUELTO)
- PROBLEMA: `fecha_carga_sistema` se grababa cuando el caso entraba a `pendiente_carga` (al completar la inspección). Esto hacía imposible medir cuánto tiempo tardaba el perito de carga en gestionar cada pericia. Además, si un caso pasaba directo de `pendiente_carga` a `ip_cerrada`, solo se grababa `fecha_cierre` sin `fecha_carga_sistema`.
- CAUSA: La lógica original en `cambiarEstadoCaso` condicionaba la escritura a `nuevoEstado === 'pendiente_carga'` (ENTRADA). Las funciones `marcarInspeccionRealizada` e `inspeccion-remota/complete` también grababan la fecha prematuramente al transicionar a `pendiente_carga`.
- SOLUCION: Cambiada la condición a `caso.estado === 'pendiente_carga' && nuevoEstado !== 'pendiente_carga'` (SALIDA). Eliminada la escritura prematura en los otros 2 puntos de entrada. Los reportes y billing del perito calle ahora usan `fecha_inspeccion_real` en vez de `fecha_carga_sistema` como fallback.
- FECHA: 20/03/2026
- NO REPETIR: `fecha_carga_sistema` mide el PROCESAMIENTO del perito de carga, no la entrada al estado. Si se necesita registrar cuándo un caso entró a `pendiente_carga`, usar `historial_estados` con `estado_nuevo = 'pendiente_carga'`.

### BUG-022: Throttling de Disk IO por Sequential Scans y Payload pesado (RESUELTO)
- PROBLEMA: Supabase reportaba Disk IO Budget Throttling al 82%+. Las queries principales del sistema (filtros en CasosTable, JOINs de Kilometraje v2, reportes, timeline) provocaban Sequential Scans completos en disco porque ninguna columna de filtrado/JOIN tenía índice.
- CAUSA: Las tablas `casos`, `historial_estados` y `tareas` carecían de índices en las columnas usadas en WHERE, JOIN, ORDER BY e IN(). Cada query escaneaba la tabla completa. Agravado por `getCasosParaCarga()` usando `select('*')` que traía campos pesados innecesarios (datos_crudos_sancor, campos financieros).
- SOLUCION: (1) 14 índices B-Tree distribuidos en 3 tablas (casos: 8, historial_estados: 3, tareas: 3). (2) `select('*')` reemplazado por 16 columnas explícitas en la Cola de Carga.
- FECHA: 20/03/2026
- NO REPETIR: Toda columna que se use en WHERE, JOIN ON, ORDER BY, o filtros `.in()` de PostgREST DEBE tener un índice B-Tree. Toda query que alimente grillas o listas DEBE usar selects explícitos — nunca `select('*')` si la tabla tiene campos de texto largo o JSONB.

### BUG-020: Notificaciones por correo violan RLS de mail_queue para No-Admins (RESUELTO)
- PROBLEMA: Al cambiar el estado de un siniestro a uno disparador de mail preconfigurado (ej: Contactado), los usuarios sin rol 'admin' recibían un error `new row violates row-level security policy for table "mail queue"` en la consola del server y el mail no se encolaba.
- CAUSA: La migración `019_fase16` creó `mail_queue` indicando que sólo los admins pueden insertar ahí, olvidándose de que cualquier operario de calle o carga debe poder accionar un disparo de correo automático mediante su gestión regular (cambio de estado vía table).
- SOLUCION: En lugar de relajar las políticas de la DB haciéndolas públicas, se migró el constructor del cliente de base de datos dentro de `queue.ts` para que opere con la `SUPABASE_SERVICE_ROLE_KEY` como superusuario para aislar ese proceso de back-end autónomo.
- FECHA: 11/03/2026
- NO REPETIR: Siempre utilizar Service Key (o bypass equivalents) en funciones Server-Actions que operen silenciosamente sobre tablas instrumentales internas (como colas de emails, historiales de métricas o logs de auditoría) si el RLS primario restringe al usuario ejecutor normal.

### BUG-019: Filtro de fechas "Hoy" fallando por Timezone de JavaScript (RESUELTO)
- PROBLEMA: El filtro rápido "Hoy" no mostraba los casos ingresados en la fecha temporal coherente. Al igual que el BUG-018, los casos quedaban ocultos por pertenecer, técnicamente para JS, al día de "ayer".
- CAUSA: Al instanciar `new Date("YYYY-MM-DD")`, se asume horario UTC 00:00. Al comparar usando `isToday` de `date-fns` bajo el huso horario local argentino (-03:00), reculaba 3 horas cayendo a las 21:00 hs del día anterior.
- SOLUCION: Se introdujo internamente en `CasosTable.tsx` la función `parseLocal` que inyecta programáticamente la hora `T12:00:00` a las fechas crudas de Supabase antes de entregarlas a los validadores `date-fns`.
- FECHA: 11/03/2026
- NO REPETIR: Siempre aplicar curación de franja horaria a las strings directas "YYYY-MM-DD" en cliente web al proveer a utilidades de `date-fns`.

### BUG-018: Fechas de Siniestros desfasadas un día hacia atrás en la UI (RESUELTO)
- PROBLEMA: Fechas puras "YYYY-MM-DD" como "2026-03-10" se renderizaban visualmente en la tabla como "09/03/2026".
- CAUSA: El constructor `new Date('YYYY-MM-DD')` de JS interpreta la fecha asumiendo la medianoche en formato _UTC_ (Tiempo Universal Coordinado, Inglaterra). Al aplicarle el formato local para renderizar (ej: `-03:00` en Argentina), la fecha "retrocedía" 3 horas artificialmente cayendo en las 21:00 del día anterior.
- SOLUCION: Se modificó el parseador `formatDateVal` en `CasosTable.tsx` inyectando artificialmente la hora local del mediodía (`T12:00:00`) a las fechas puras para anclar el día al calendario geográfico correcto antes de invocar a `new Date()`.
- FECHA: 10/03/2026
- NO REPETIR: Siempre usar variables DateJS relativas en Next.js, recordando que ISO en UTC causará desfases horarios visuales.

### BUG-017: Error al eliminar perfil de peritos (Constraint Violation) (RESUELTO)
- PROBLEMA: Al presionar "Eliminar" sobre un Perito, Supabase abortaba con _"update or delete on table usuarios violates foreign key constraint notificaciones_usuario_destino_id_fkey"_.
- CAUSA: La arquitectura primigenia de PostgreSQL bloquea automáticamente los DELETE (modo `RESTRICT`) si la clave primaria del registro figura como clave foránea limitante en otras tablas (ej: Notificaciones, Casos Asignados, Tareas).
- SOLUCION: Se aplicaron sentencias `ALTER TABLE` sobre más de 12 tablas para inyectar condiciones `ON DELETE CASCADE` en tablas epímeras y `ON DELETE SET NULL` en tablas documentales.
- FECHA: 10/03/2026
- NO REPETIR: Siempre plantear una topología de borrado al enlazar catálogos centrales (como Usuarios o Talleres).


### BUG-016: Buscador de Casos fallando por espacios en blanco (RESUELTO)
- PROBLEMA: Al buscar un siniestro o dominio en la tabla principal, si el usuario ingresaba un espacio al principio o al final (por accidente o al pegar texto copiado), la tabla se quedaba vacía sin encontrar resultados.
- CAUSA: La función de filtrado en memoria (`CasosTable.tsx`) comparaba el input literal (`searchQuery.toLowerCase()`) contra las propiedades del caso sin limpiarle previamente los caracteres invisibles inútiles.
- SOLUCION: Se introdujo un método de limpieza `const lowerQuery = searchQuery.trim().toLowerCase();` justo antes del mapeo de los casos cargados.
- FECHA: 10/03/2026
- NO REPETIR: Siempre utilizar `.trim()` al manipular cadenas de texto provenientes de un `<input>` de búsqueda humana.

### BUG-015: Enlace de Seguimiento tirando Error 404 (RESUELTO)
- PROBLEMA: Al cliquear el enlace de seguimiento (`/seguimiento/[token]`), el navegador reportaba un NotFound o Error 404 nativo de Next.js.
- CAUSA: 1) En Next.js 15+ (Turbopack), el objeto `params` en las rutas dinámicas como `[token]` pasó a ser una Promesa asíncrona por defecto. Al intentar leer el token destruyendolo síncronamente u omitiendo el tipado de Promise, el Router fallaba silenciosamente y descartaba la vista, redirigiendo a la pantalla negra `404 This page could not be found`. 2) El middleware de autenticación también tenía la ruta bloqueada accidentalmente.
- SOLUCION: Se cambió la firma a `export default async function SeguimientoCasoPage({ params }: { params: Promise<{ token: string }> })` y se hizo un `await params`. En simultaneo, se whitelistó la ruta en `middleware.ts`.
- FECHA: 10/03/2026
- NO REPETIR: Durante migraciones o nuevo código en Next.js 15, recordar que todos los objetos `params` dinámicos desde la URL DEBEN ser designados como Promesas y aguardados asincrónicamente (`await params`).


### BUG-014: Asunto de Emails con caracteres extraños y Link de tracking apuntando a localhost (RESUELTO)
- PROBLEMA: Al recibir el correo, el Asunto (Subject) mostraba caracteres UTF-8 rotos (ej: Siniestro Ã‚Â· OOZ) y el botón "Ver estado del caso" apuntaba a `localhost:3000` en lugar de `panel.aomsiniestros.com`.
- CAUSA: 1) Los headers RFC 2822 de email (como el Subject y From) requieren usar la codificación especial `MIME Encoded-Word (RFC 1342)` para soportar UTF-8, de lo contrario Gmail/Outlook los malinterpretan. 2) La variable de entorno para el tracking link usaba un fallback a localhost directamente en el código base, omitiendo probar la variable `NEXT_PUBLIC_SITE_URL` que Vercel / VPS de prod a menudo inyectan.
- SOLUCION: Se creó la función utilitaria `encodeMimeHeader` en `gmail.ts` que inyecta `(?utf-8?B?...)` sobre el asunto. Se añadió el fallback `process.env.NEXT_PUBLIC_SITE_URL || "https://panel.aomsiniestros.com"` en `templates.ts`.
- FECHA: 10/03/2026
- NO REPETIR: Siempre usar Base64 MIME Encoded-Word para enviar emails RFC manuales a la API de Gmail (en los campos `Subject` o nombres legibles de `From`/`To`).

### BUG-013: Mails automáticos no se encolaban al pasar a "Contactado" (RESUELTO)
- PROBLEMA: El cambio de estado de Pendiente Coordinación a Contactado (o IP Coordinada) no enviaba el email pre-configurado, aunque estuviera mapeado en `queue.ts`.
- CAUSA: La transición sí encolaba los correos en `mail_queue`, pero como el sistema es asíncrono, se depende de un CRON JOB `/api/cron/procesar-mails` para despacharlos en diferido. No era un fallo de código, sino de que la tarea cronométrica no estaba siendo invocada en el entorno local (y el retraso introducido de 3 minutos daba la ilusión de rotura en testing rápido).
- SOLUCION: Se ajustó el retraso a 0 minutos temporalmente y se documentó que la cola asíncrona depende del endpoint activo. No hubo rotura del script en sí.
- FECHA: 10/03/2026
- NO REPETIR: Recordar que los email automáticos no son despachados asíncronamente en Vercel a no ser que se configure su `vercel.json` o se acierte manualmente al endpoint `/api/cron/`.

### BUG-001: Sidebar active state hardcodeado (RESUELTO)
- PROBLEMA: El prop `active` en SidebarItem estaba hardcodeado en `true` solo para el primer item de cada rol. Ningun otro item mostraba estado activo al navegar.
- CAUSA: Sidebar era Server Component sin acceso a usePathname() de Next.js.
- SOLUCION: Split en server (Sidebar.tsx fetch rol) + client (SidebarClient.tsx con usePathname()). isActive se calcula con pathname === href || pathname.startsWith(href + "/").
- NO REPETIR: Nunca usar active={true} hardcodeado. Siempre derivar de la ruta actual via usePathname().

### BUG-012: Upload de fotos falla con "Error de conexión" + "Failed to find Server Action" en login (RESUELTO)
- PROBLEMA: Al intentar subir fotos desde el portal de inspección remota (/ip/[token]), todas fallaban con "Error de conexión". En la consola aparecía "Failed to find Server Action" en /login.
- CAUSA: El middleware de auth (`src/lib/supabase/middleware.ts`) excluía `/ip/` de la redirección a login, pero NO excluía `/api/inspeccion-remota/`. El wizard llamaba a `fetch('/api/inspeccion-remota/upload')` → middleware veía no hay usuario → redirigía a /login → POST caía en login como si fuera un Server Action → error.
- SOLUCION: Agregar `const isPublicAPI = request.nextUrl.pathname.startsWith('/api/inspeccion-remota/')` al middleware y incluirlo en la condición de exclusión.
- FECHA: 08/03/2026
- NO REPETIR: Cuando una ruta pública tiene API endpoints asociados, AMBOS deben excluirse del middleware de auth. Siempre verificar que las rutas de fetch del frontend público estén en la whitelist del middleware.
### BUG-002: CREATE POLICY IF NOT EXISTS no existe en PostgreSQL (RESUELTO)
- PROBLEMA: SQL migration fallaba con syntax error en CREATE POLICY.
- CAUSA: PostgreSQL no soporta IF NOT EXISTS para CREATE POLICY (solo para tables/indexes).
- SOLUCION: Patron DROP POLICY IF EXISTS + CREATE POLICY.
- NO REPETIR: Para policies, siempre DROP primero. Solo tables/indexes/functions soportan IF NOT EXISTS.

### BUG-003: DROP TRIGGER en tabla incorrecta (RESUELTO)
- PROBLEMA: DROP TRIGGER check_transicion_pendiente_carga ON casos fallaba con error de dependencia.
- CAUSA: El trigger trg_transicion_pendiente_carga vivia en informes_periciales, no en casos.
- SOLUCION: DROP del trigger en la tabla correcta (informes_periciales) + CASCADE en DROP FUNCTION.
- NO REPETIR: Verificar tabla del trigger antes de dropear. Usar CASCADE en DROP FUNCTION cuando hay dependencias.

### BUG-004: Redirect infinito /dashboard → /login → /dashboard (RESUELTO)
- PROBLEMA: Dashboard y otras paginas entraban en redirect infinito. El usuario veia la pantalla cargando infinitamente.
- CAUSA: Las paginas hacian `if (!userData) redirect("/login")` cuando la fila del usuario no existia en tabla `usuarios`. Pero el middleware de Supabase redirige usuarios autenticados FUERA de /login hacia /dashboard, creando loop: /dashboard → /login → /dashboard → ...
- SOLUCION: Creado helper centralizado `getUsuarioActual()` en `src/lib/auth.ts`. Si el usuario esta autenticado pero no tiene fila en `usuarios`, la crea automaticamente (primer user = admin). NUNCA redirige a /login si hay sesion activa. Actualizado en 7 paginas.
- NO REPETIR: NUNCA hacer `redirect("/login")` basado en la tabla `usuarios`. El middleware ya maneja la auth. Las paginas solo deben verificar ROL, no existencia del user.

### BUG-005: Error de RLS en Directorio FOR INSERT (RESUELTO)
- PROBLEMA: Supabase lanzaba `Row Level Security Error` al insertar credenciales o valores referenciales.
- CAUSA: Migración 007 declaraba `FOR ALL USING (rol='admin')` pero omitía el modificador `WITH CHECK (...)` necesario para autorizar INSERTS y UPDATES en Postgres 15+ bajo este patrón.
- SOLUCION: Se redactó el archivo `008_fase10_rls_fixes.sql` que recrea las policies utilizando `USING` y también `WITH CHECK`.
- NO REPETIR: Tratar siempre de definir `WITH CHECK` cuando se habilitan directivas mutativas exclusivas para `INSERT`.

### BUG-006: Redirección post-creación muestra data vacía (RESUELTO)
- PROBLEMA: Pantalla transitoria mostrando "No se encontró información" al redirigir instantáneamente tras crear un Caso.
- CAUSA: La base de datos resolvía la inserción pero el frontend no daba tiempo a la replicación de caché en el enrutamiento. 
- SOLUCION: En `CasoForm.tsx` se integró limpieza forzada con `router.refresh()` y un micro de-bounce (`setTimeout` de 500ms) previo al push de URL.
- NO REPETIR: En SPA frameworks como NextJS, recordar el pipeline asincrónico con los Server Components.

### BUG-007: Fallo al cambiar perito inline (RESUELTO)
- PROBLEMA: Alert de "Error al cambiar de perito" al usar los selectores de la `CasosTable`.
- CAUSA: El endpoint `/api/casos/route.ts` carecía del handler HTTP `PATCH` para ejecutar el update parcial sobre la base de datos de casos.
- SOLUCION: Construcción del handler con recolección de payload dinámica usando `supabase.from("casos").update(updates)`.
- NO REPETIR: Evitar mutaciones asincrónicas a `/api` route sin el método correcto interceptado.

### BUG-008: Re-cierre de caso duplica billing (RESUELTO)
- PROBLEMA: Si un caso cerrado se reabría (ej: ip_cerrada → licitando_repuestos) y se volvía a cerrar, `fecha_cierre` se sobreescribía y los montos de facturación se re-asignaban, provocando doble conteo.
- CAUSA: `cambiarEstadoCaso()` no verificaba si el caso ya había sido cerrado previamente antes de asignar montos.
- SOLUCION: Guard anti-duplicación: si `monto_facturado_estudio > 0`, NO re-asignar montos al re-cerrar. `fecha_cierre` se actualiza siempre (para tracking), pero los honorarios se graban una sola vez.
- NO REPETIR: Siempre verificar estado previo antes de asignar valores financieros. Los montos de billing son "write-once".

### BUG-009: Campo `valor_perito` inexistente en query de precios (RESUELTO)
- PROBLEMA: Al cerrar un caso, `monto_pagado_perito_calle` quedaba vacío/null y `monto_pagado_perito_carga` nunca se populaba.
- CAUSA: El código en `actions.ts` consultaba `precios.valor_perito` que NO EXISTE. Los campos reales son `valor_perito_calle` y `valor_perito_carga`.
- SOLUCION: Corregido a `.select('valor_estudio, valor_perito_calle, valor_perito_carga')` y asignación de ambos montos. Backfill de 115 casos históricos ejecutado.
- NO REPETIR: Siempre validar los nombres de columnas reales de la DB antes de escribir queries. Usar la Sección 3.2 como referencia.

### BUG-010: Tabla `caso_historial_estados` inexistente en reportes (RESUELTO)
- PROBLEMA: La página de Reportes no cargaba datos de historial de estados.
- CAUSA: La query referenciaba `caso_historial_estados` pero la tabla real se llama `historial_estados`.
- SOLUCION: Corregido a `.from("historial_estados")`.
- NO REPETIR: Verificar nombres de tablas contra la Sección 3.2 de este documento.

### BUG-011: Peritos fantasma de migración impiden gestión correcta (RESUELTO)
- PROBLEMA: "Gestión de Peritos" mostraba usuarios migrados desde Excel (ej: `amio_migracion@aomnis.local`) que no existían como personas reales. Al intentar eliminarlos, fallaba por FK constraints con casos asignados.
- CAUSA: La migración desde Excel creó usuarios dummy para mapear nombres de peritos, pero no los vinculó a cuentas reales.
- SOLUCION: Script de limpieza: (1) Crear Emiliano De Lia como usuario real. (2) Reasignar 218 casos de fantasmas a los 5 peritos reales. (3) Actualizar roles multi-role. (4) Eliminar 6 fantasmas, desactivar 1 (Admin test con FK en tareas).
- NO REPETIR: Al migrar datos, siempre crear las cuentas reales primero y mapear a IDs existentes. NUNCA crear usuarios dummy con emails falsos.

### BUG-012: Trigger fn_precio_historial referencia columna renombrada (RESUELTO)
- PROBLEMA: Error "record old has no field valor_perito" al guardar precios desde la UI.
- CAUSA: El trigger `fn_precio_historial` (migration 003) referenciaba `OLD.valor_perito` y `NEW.valor_perito`, pero la columna fue renombrada a `valor_perito_calle` en migration 005.
- SOLUCION: `CREATE OR REPLACE FUNCTION fn_precio_historial()` con campos correctos: `valor_perito_calle`, `valor_perito_carga`. Migración `015_fix_precio_historial_trigger.sql`.
- NO REPETIR: Al renombrar columnas, SIEMPRE buscar y actualizar triggers, vistas y funciones que las referencien.

### BUG-013: Notificaciones y Chat carecen de Realtime (RESUELTO)
- PROBLEMA: El usuario notifica grandes "delays" para ver un nuevo mensaje o notificación, viéndose forzado a dar F5.
- CAUSA: Aunque el código TS se suscribía a `.channel()`, la base de datos de PostgreSQL jamás tuvo configurado `ALTER PUBLICATION supabase_realtime ADD TABLE...` para esas entidades orgánicamente reactivas.
- SOLUCION: Script `018_fase15_realtime_chat_notif.sql` y actualización en `ComentariosTarea.tsx` para interceptar el payload `INSERT` por el `tarea_id` directo y re-fetchear/inyectar en el estado optimista.
- NO REPETIR: Toda tabla que requiere presencia Web Socket debe registrarse en la publicación lógica de la Base de Datos.

### BUG-014: Input <file capture> colisionando con Galería en webviews (RESUELTO)
- PROBLEMA: Tocar "Abrir Cámara" a veces lanzaba el picker de galería en Android nativo.
- CAUSA: Modificar dinámicamente el property `capture` de un mismo DOM node causa race conditions en la invocación onClick.
- SOLUCION: Separación absoluta arquitectónica en WebKit: Dos `<input>` gemelos paralelos, uno hardcodeado con `capture="environment"` (Cámara Nativa) y otro con `multiple={true}` descartando el capture (Galería Pura).
- NO REPETIR: Jamás togglear atributos nativos de sensores sobre la misma referencia HTMLNode. Clocar y bifurcar.

---

## 11. REGLAS DE DESARROLLO PARA ANTIGRAVITY

1. LEER ESTE ARCHIVO COMPLETO antes de hacer cualquier cosa.
2. Documentar cada cambio en seccion 9 ANTES de considerar la tarea terminada.
3. Si un problema ya tiene solucion en seccion 10, USAR esa solucion.
4. NO crear funciones, endpoints o componentes duplicados.
5. NO cambiar nombres de estados, campos o entidades sin aprobacion.
6. NO inventar nuevos estados de caso ni de tarea.
7. Cada elemento debe rastrearse a una definicion en este documento.
8. Si algo no esta definido, PREGUNTAR antes de implementar.
9. Desarrollo modular: cada fase se integra SIN romper lo anterior.
10. Si al arreglar algo se afecta otra cosa, documentar.
11. Metricas se calculan SIEMPRE desde historial_estados.
12. Umbrales de alerta se almacenan en tabla configuracion.
13. Perito solo ve SUS metricas. Nunca datos de otros.
14. Tarifas deben tener historial (precio_historial).
15. Imputacion por mes: cada perito se liquida segun el timestamp de SU accion.
16. Datos financieros del estudio SOLO visibles para admin.
17. NO eliminar tablas existentes sin aprobacion. Migrar datos si es necesario.
18. UI moderna y estetica: inspiracion en Linear/Notion. No planilla de Excel. Tailwind CSS.
19. Respetar las RLS policies existentes y agregar las nuevas para tablas creadas.
20. Supabase Realtime esta configurado. Usarlo para actualizaciones en tiempo real.

---

FECHA: 18/03/2026 (Landing page de presentación para Sancor Seguros)
QUE SE CAMBIO: Nueva landing page en `/landing` (ruta pública, sin autenticación) diseñada para presentar CLARITY a ejecutivos de Sancor Seguros.
POR QUE: Herramienta de negociación para reuniones presenciales y compartir por link. Diseño premium tipo linear.app / vercel.com.
COMO: 8 secciones: Hero con partículas interactivas (tsParticles), Pain Points con counters animados, Inspección Remota con mockup de celular, Inspección Presencial con mockup de firma digital, Visibilidad con mockup de dashboard, Mapa de Argentina SVG con puntos pulsantes, Métricas de impacto, y CTA. Toggle dark/light mode, scroll animations con Framer Motion, cursor glow en desktop, tipografía Outfit + DM Sans. Datos editables en objeto `LANDING_DATA`.
ARCHIVOS AFECTADOS: `landing/page.tsx` (nuevo), `landing/layout.tsx` (nuevo), `landing/landing.css` (nuevo), `LandingPage.tsx` (nuevo), `ParticlesBackground.tsx` (nuevo), `ArgentinaMap.tsx` (nuevo)
EFECTOS COLATERALES: Ninguno. Ruta completamente independiente del sistema.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Fix Kilometraje — Fuente de datos y agrupación)
QUE SE CAMBIO: Corregida la lógica de generación de días en el módulo Kilometraje. Antes consultaba `historial_estados` (estado_nuevo=pendiente_carga) y agrupaba por fecha+perito. Ahora consulta `casos.fecha_inspeccion_programada` directamente y genera UNA card por día con TODOS los siniestros de esa fecha.
POR QUE: El kilometraje es un circuito diario del estudio, no por perito. Todos los siniestros con fecha de inspección del día deben aparecer en la misma card, sin importar qué perito los hizo ni si ya pasaron a pendiente_carga.
COMO: (1) `actions.ts`: `getDiasKilometraje` ahora hace `SELECT FROM casos WHERE fecha_inspeccion_programada IN mes`, agrupa por fecha. La dirección de cada caso se construye como `direccion_inspeccion + ", " + localidad` (si localidad existe). (2) `KilometrajeBoard.tsx`: diaKey es solo la fecha. El dropdown de perito filtra siniestros DENTRO de cada día (no crea cards separadas). Default punto de partida hardcodeado: "9 de Julio 62, Bernal". Table agrega columna "Perito". (3) `guardarKilometraje` auto-detecta el admin autenticado como perito_id para la constraint UNIQUE.
ARCHIVOS AFECTADOS: `kilometraje/actions.ts`, `KilometrajeBoard.tsx`, `kilometraje/page.tsx`
EFECTOS COLATERALES: Ninguno. La UI, mapas y exportaciones no cambiaron.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Módulo Kilometraje v2 — Rewrite completo)
QUE SE CAMBIO: Reemplazo completo de la sección Kilometraje. Antes era una tabla estática con registro manual. Ahora es un módulo que auto-genera los días de trabajo de cada perito de calle desde `historial_estados`, calcula rutas óptimas con Google Maps Directions API, renderiza mapas interactivos, y exporta a Excel/PNG.
POR QUE: La herramienta anterior requería ingreso manual de datos. El sistema ya tenía toda la información necesaria: inspecciones realizadas, direcciones, peritos asignados, y bases de los peritos. Ahora todo es automático.
COMO: (1) `page.tsx` reescrita: guard admin-only, data fetching desde `historial_estados` vía server actions. (2) `actions.ts` reescrita: `getDiasKilometraje` consulta `historial_estados.estado_nuevo='pendiente_carga'` en el mes, JOIN con `casos` y `usuarios`, agrupa por fecha+perito. (3) `calcular-ruta/route.ts` modificado: ida+vuelta (destination=origin), `avoid=highways`, retorna `legs` detallados. (4) `KilometrajeBoard.tsx` (nuevo): header con filtros (perito, mes, precio/km), KPI cards, lista de días colapsables, checkboxes por siniestro (remotas destildadas por defecto), cálculo de ruta, copiar resumen, exportar Excel (SheetJS), exportar PNG (Canvas API + Static Maps). (5) `KilometrajeMapa.tsx` (nuevo): mapa interactivo Google Maps JS API con estilo oscuro, polyline ámbar, marcadores numerados. (6) Sidebar restringida a admin-only. (7) Migración SQL `028_kilometraje_v2.sql` con 5 columnas adicionales: `siniestro_asociado`, `casos_incluidos`, `casos_excluidos`, `ruta_orden`, `legs`.
ARCHIVOS AFECTADOS: `SidebarClient.tsx`, `kilometraje/page.tsx`, `kilometraje/actions.ts`, `api/kilometraje/calcular-ruta/route.ts`, `KilometrajeBoard.tsx` (nuevo), `KilometrajeMapa.tsx` (nuevo), `028_kilometraje_v2.sql` (nuevo)
EFECTOS COLATERALES: Peritos de calle ya no ven la sección Kilometraje en el sidebar (solo admin). La tabla `kilometraje_diario` conserva los datos existentes; se agregan 5 columnas nuevas.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Fix audio inspección remota — iOS Safari / Chrome)
QUE SE CAMBIO: Botón "Grabar audio" en el resumen de inspección remota ahora funciona correctamente en iOS Safari y Chrome.
POR QUE: En iPhone 13 (Chrome for iOS), el botón de grabar audio no respondía al tap normal, y al mantener presionado se abría Google Lens. Esto ocurría porque: (1) el `<button>` no tenía `type="button"` explícito, (2) no se prevenía el context menu nativo del long-press, (3) no había `-webkit-touch-callout: none` ni `touch-action: manipulation`, (4) si `getUserMedia` fallaba (permisos denegados), el error no se mostraba al usuario porque el display de errores dependía de `audioBlob` (que no existía antes de grabar).
COMO: (1) `WizardCaptura.tsx`: botón de audio ahora tiene `type="button"`, `onContextMenu={(e) => e.preventDefault()}`, `select-none`, `style={{ WebkitTouchCallout: 'none', touchAction: 'manipulation' }}`. (2) Error de micrófono ahora se muestra debajo del botón incluso antes de la primera grabación (fragment `<>` con error card). (3) `startRecording` ahora detecta `getUserMedia` no disponible, y da mensajes específicos para `NotAllowedError` (permisos) y `NotFoundError` (sin micrófono). (4) MIME type priority cambiado a `audio/mp4` primero (iOS Safari solo soporta MP4/AAC, no WebM).
ARCHIVOS AFECTADOS: `WizardCaptura.tsx`
EFECTOS COLATERALES: Ninguno. En navegadores que soportan WebM, `audio/mp4` se intentará primero pero si no está soportado, se cae a `audio/webm` normalmente. El fallback sigue funcionando.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Fix Cola de Carga — Timer muestra antigüedad en pendiente_carga)
QUE SE CAMBIO: El badge de antigüedad en la Cola de Carga ahora muestra el tiempo desde que el caso entró a `pendiente_carga` (`fecha_carga_sistema`) en vez del timestamp genérico `updated_at`.
POR QUE: Un caso que acababa de ser completado por inspección remota mostraba "Hace 3d 6hs" porque `updated_at` reflejaba la última actualización del caso (posiblemente la creación o una edición anterior), no el momento en que entró a la cola de carga.
COMO: (1) `ColaDeCargaBoard.tsx`: se agregó `fecha_carga_sistema` a la interface `CasoCarga`, se usa como fuente primaria para `getAntiguedad()` con fallback a `updated_at`. (2) `carga/actions.ts`: `order()` cambiado de `updated_at DESC` a `fecha_carga_sistema ASC` (más viejo primero, consistente con el propósito de la cola).
ARCHIVOS AFECTADOS: `ColaDeCargaBoard.tsx`, `carga/actions.ts`
EFECTOS COLATERALES: Ninguno. Casos sin `fecha_carga_sistema` (legacy) usan `updated_at` como fallback.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Fix inspección remota — Retry Supabase transiente)
QUE SE CAMBIO: Resiliencia ante errores transitorios de Supabase (502/503/504 Bad Gateway) en los 2 endpoints de inspección remota: upload y complete.
POR QUE: El servidor devolvía 502 Bad Gateway desde Supabase (Cloudflare) al intentar insertar fotos en `fotos_inspeccion` y al completar la inspección. El error venía como página HTML en vez de JSON, causando que el endpoint devolviera "Error al registrar foto" sin recuperación. NO fue una regresión del sprint de inspección presencial — los componentes compartidos (`CameraCapture`, `SelectorZonaDanio`, `WizardCaptura`) están intactos. `InspeccionCampoWizard` importa pero no modifica componentes compartidos y usa pipeline de upload independiente.
COMO: (1) Función `withRetry<T>()` con `PromiseLike<T>` (compatible con PostgREST builders): reintenta hasta 3 veces con espera exponencial (1s, 2s, 4s) cuando detecta errores transitorios (HTML `<!DOCTYPE`, "Bad gateway", 502/503/504). (2) `upload/route.ts`: 4 operaciones con retry (validación token, upload storage, insert `fotos_inspeccion`, update counter). (3) `complete/route.ts`: 7 operaciones con retry (validación token, update link, get caso, update caso, insert historial, insert nota, insert notificación).
ARCHIVOS AFECTADOS: `api/inspeccion-remota/upload/route.ts`, `api/inspeccion-remota/complete/route.ts`
EFECTOS COLATERALES: Ninguno. Retry solo agrega latencia cuando hay error transitorio (máx ~7s). Si Supabase sigue caído después de 3 reintentos, el error se devuelve normalmente.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Sprint 10.3)
QUE SE CAMBIO: 7 correcciones plataforma.
POR QUE: (1) Highlight del buscador GoTo se perdía al hacer hover, poco visible. (2) Timer de cola de carga solo mostraba horas, sin color por antigüedad. (3) No se podía cambiar responsable de tarea desde barra lateral. (4) Dashboards de peritos no priorizaban datos del mes. (5) Texto de derivación del gestor no era editable. (6) Valores unitarios de MO no se mostraban en informe campo. (7) Admin no veía informe de campo en algunos estados.
COMO: (1) `CasosTable.tsx`: reemplazado `ring-2` por CSS pulse animation `animate-highlight-pulse` con auto-clear 8s vía `setTimeout`. Keyframe en `globals.css`. (2) `ColaDeCargaBoard.tsx`: `getAntiguedad` mejorado con min/hs/días + color: gris <12h, ámbar 12-24h, rojo >24h. (3) `TareaCard.tsx`: header del sheet muestra nombre asignado clickable con dropdown de usuarios; reusa `handleAssigneeChange` existente. (4) `PanelPeritoCalle.tsx` + `PanelPeritoCarga.tsx`: reestructurados con Bloque 1 = KPIs del mes, Bloque 2 = actividad reciente (10 casos), Bloque 3 = datos históricos. (5) `CasoDetail.tsx`: `datos_crudos_sancor` usa `EditableField` para admin, read-only para otros. (6) `VistaInformeCampo.tsx`: MO cambiado de flex list a table con 4 columnas (Concepto, Valor Unit., Cantidad, Total) + tfoot con Total MO. (7) `CasoDetail.tsx`: `VistaInformeCampo` ahora se muestra en `pendiente_presupuesto` y `contactado` además de los estados originales.
ARCHIVOS AFECTADOS: `CasosTable.tsx`, `globals.css`, `ColaDeCargaBoard.tsx`, `TareaCard.tsx`, `PanelPeritoCalle.tsx`, `PanelPeritoCarga.tsx`, `CasoDetail.tsx`, `VistaInformeCampo.tsx`
EFECTOS COLATERALES: Ninguno.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Sprint 10.2)
QUE SE CAMBIO: 4 correcciones UX al módulo de inspección presencial.
POR QUE: (1) Inputs decimales no aceptaban punto ni coma en iOS Safari. (2) Texto "Firmar aquí" en fullscreen no se adaptaba a orientación. (3) Conformidad del Taller colapsable no mostraba contenido al expandir. (4) Badge "FIRMADO ✓" tenía texto e ícono desalineados.
COMO: (1) `InspeccionCampoWizard.tsx`: inputs Valor y Cantidad usan `type="text"` con `inputMode="decimal"`, estado `editingText` para guardar texto raw durante edición, solo parsea a número con `parseFloat(val.replace(",","."))` en `onBlur`. Elimina el problema de iOS que no permite escribir punto/coma en `type="number"`. (2) Texto placeholder de firma fullscreen rotado con `portrait:rotate-[-90deg] landscape:rotate-0`; preview firma compacta `max-h-[80px]` centrada. (3) `VistaInformeCampo.tsx`: reemplazada transición `max-h-0/max-h-[900px]` (no funcionaba) por render condicional simple `{conformidadOpen && (...)}`. Añadido fallback de imagen de firma cuando no hay resumen firmado y "GPS no disponible" cuando no hay coordenadas. (4) Badge cambiado de `rounded-full` con ✓ unicode a `inline-flex items-center gap-1 rounded-md` con SVG check para alineación perfecta.
ARCHIVOS AFECTADOS: `InspeccionCampoWizard.tsx`, `VistaInformeCampo.tsx`
EFECTOS COLATERALES: Ninguno.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 18/03/2026 (Sprint 10.1)
QUE SE CAMBIO: 7 fixes UX al módulo de inspección presencial.
POR QUE: Ajustes reportados post-implementación: (1) pantalla intermedia innecesaria entre fotos y zona daños, (2) fotos de daños debían ser continuas como en IR, (3) scroll no llegaba al final en varias pantallas, (4) observaciones internas visibles al taller en pantalla firma, (5) canvas de firma muy chico en mobile, (6) bloque viejo "informe no redactado" visible, (7) conformidad del taller gigante rompía armonía visual.
COMO: (1) `InspeccionCampoWizard.tsx`: al aceptar última foto reglamentaria, `setStep("zona_danio")` automático. (2) Fotos daños ya soportaban multi-file; se mantiene el comportamiento. (3) `pb-[120px]` en todos los contenedores scrolleables (fotos_reg, zona_danio, fotos_danios, informe, resumen). (4) Sección observaciones eliminada del render de firma/kiosko. (5) Nuevo modo fullscreen para canvas firma: `Maximize2` abre overlay `z-[10001]`, canvas 100vw×100vh con fondo blanco, hint "Girá el celular para más espacio", botones flotantes "Limpiar" y "Listo" que transfiere firma al canvas principal. (6) `CasoDetail.tsx`: eliminado import y render de `VistaInforme`, casos post-inspección solo muestran `VistaInformeCampo`. (7) `VistaInformeCampo.tsx`: conformidad del taller convertida en sección colapsable (cerrada por defecto) con badge FIRMADO ✓, fecha, "Ver detalle ▼", imagen max-w-[400px], transición suave.
ARCHIVOS AFECTADOS: `InspeccionCampoWizard.tsx`, `CasoDetail.tsx`, `VistaInformeCampo.tsx`
EFECTOS COLATERALES: `VistaInforme.tsx` ya no se importa ni renderiza en CasoDetail (eliminado completamente). Casos legacy que usaban `informes_periciales` no verán su informe viejo en el expediente.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 17/03/2026 (Sprint 10)
QUE SE CAMBIO: Módulo completo de inspección presencial para perito de calle.
POR QUE: El perito de calle necesita un flujo digital (antes era manual/papel) para capturar fotos, redactar informe técnico con mano de obra y piezas, obtener firma del taller, y que todo quede documentado en el expediente.
COMO: (1) Migración `027_inspeccion_campo.sql`: tabla `informe_inspeccion_campo` (MO JSONB, piezas, observaciones, audio, firma, GPS), seeds de 3 `mano_obra` precios Sancor. (2) `ValoresSancorEditor.tsx` (NUEVO): sección en Valores de Referencia para editar Día de Chapa, Paño de Pintura, Hora de Mecánica con formato moneda y fecha de actualización. (3) Ruta `/inspeccion-campo/[casoId]/page.tsx` (NUEVA): server component que valida perito, estado ip_coordinada, fetch precios MO. (4) `InspeccionCampoWizard.tsx` (NUEVO, 800+ líneas): wizard completo con pasos: fotos reglamentarias guiadas → selector zona de daño (reutiliza `SelectorZonaDanio` con paleta ámbar override) → fotos de daños → informe técnico (MO tabla con precarga + filas custom, piezas por cambiar/reparar/pintar, observaciones + audio) → resumen → firma modo kiosko (canvas touch, html2canvas, GPS, prevención navegación). Reutiliza pipeline HEIC/compresión/upload de WizardCaptura. (5) `actions.ts` (NUEVA): guarda en DB, cambia estado a pendiente_carga, registra historial. (6) Botón "Comenzar Inspección" en `AgendaCard.tsx` y `CasoDetail.tsx`. (7) `VistaInformeCampo.tsx` (NUEVO): visualización en expediente con tabla MO, listas piezas color-coded, observaciones+audio, imagen resumen firmado (link lightbox), GPS link Google Maps, badge "Firmado ✓". (8) `CasoDetail.tsx`: reemplaza viejo `InformePericial` con botón de inspección, añade `VistaInformeCampo` para estados post-inspección.
ARCHIVOS AFECTADOS: `027_inspeccion_campo.sql` (NUEVO), `ValoresSancorEditor.tsx` (NUEVO), `precios/page.tsx`, `inspeccion-campo/[casoId]/page.tsx` (NUEVO), `inspeccion-campo/[casoId]/actions.ts` (NUEVO), `InspeccionCampoWizard.tsx` (NUEVO), `VistaInformeCampo.tsx` (NUEVO), `AgendaCard.tsx`, `CasoDetail.tsx`
EFECTOS COLATERALES: `InformePericial.tsx` ya no se usa (import removido de CasoDetail). `VistaInforme.tsx` se mantiene como fallback para casos legacy con informes_periciales. Dependencia nueva: `html2canvas`.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 16/03/2026 (Sprint 9)
QUE SE CAMBIO: (1) Fix mail gestor vacío en derivación. (2) Mi Agenda: agrupación Hoy/Mañana con ocultamiento de Mañana. (3) Buscador en Tareas. (4) Dashboard perito carga: facturado mensual con filtro de mes.
POR QUE: (1) `gestor_email` se enviaba vacío porque el select de `gestores` no incluía `email`. (2) Los peritos se confundían viendo tareas de mañana mezcladas con las de hoy. (3) No había forma de buscar tareas específicas entre muchas. (4) El perito de carga no podía comparar su facturación entre meses.
COMO: (1) `templates.ts`: agregado `email` al select `gestor:gestores(nombre, email)`. (2) `mi-agenda/actions.ts`: cálculo de `hoy` y `manana`; `mi-agenda/page.tsx`: agrupación en secciones Hoy/Mañana/Próximas, Mañana solo visible si Hoy está vacío, badge discreto cuando Mañana está oculto. (3) `KanbanBoard.tsx`: estado `searchTerm`, input con ícono Search, filtro por `titulo` y `caso.numero_siniestro` case-insensitive, aplica a las 3 columnas. (4) `PanelPeritoCarga.tsx`: calcula billing mes actual + anterior server-side; `FacturacionMensualCarga.tsx` (NUEVO): componente client con toggle ◁/▷ entre meses, muestra total + count + desglose por tipo on hover. Usa `monto_pagado_perito_carga`.
ARCHIVOS AFECTADOS: `templates.ts`, `mi-agenda/actions.ts`, `mi-agenda/page.tsx`, `KanbanBoard.tsx`, `PanelPeritoCarga.tsx`, `FacturacionMensualCarga.tsx` (NUEVO)
EFECTOS COLATERALES: Ninguno. Mi Agenda ahora muestra sección "Próximas" para IPs con fecha >mañana (antes se mostraban igual que las de hoy). Búsqueda en Tareas funciona sobre las 3 columnas del kanban simultáneamente.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 15/03/2026 (Sprint 8.6)
QUE SE CAMBIO: Reescritura completa de Tiempos Medios de Gestión en Reportes.
POR QUE: La sección anterior tenía 2 de 5 intervalos hardcodeados a "Sin datos" (Carga→Licitación y Licitación→Cierre), no filtraba por rango de fechas y no mostraba desglose por perito.
COMO: (1) 6 intervalos: Asig→IP, IP→Carga, Carga→Licitación, Licitación→Cierre, IP→Cierre (neto estudio), Ciclo Completo. (2) `fecha_licitacion` se deriva de `historial_estados` (primer registro con `estado_nuevo='licitando_repuestos'`). (3) Todos los intervalos se calculan sobre casos cerrados en el rango seleccionado. (4) Pipeline visual: barra horizontal proporcional de 4 etapas con colores diferenciados. (5) Tabla "Velocidad por Perito de Calle": avg de cada intervalo por perito, coloreado verde/ámbar/rojo vs promedio general. (6) Cuello de botella: el intervalo más lento del pipeline se resalta con borde rojo + etiqueta ⚠.
ARCHIVOS AFECTADOS: `ReportesFiltros.tsx`
EFECTOS COLATERALES: Eliminado componente `TimeBlock` y helpers `getAvgTimeDirect`, `tAsigToIp`, `tIpToCarga`, `tCargaToLicitando`, `tLicitandoToCerrado`, `tiempoPromedioDias` — todo reemplazado por IIFE inline con `calcInterval`.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 15/03/2026 (Sprint 8.5)
QUE SE CAMBIO: (1) Badge contador en Facturación en el sidebar. (2) Combobox con búsqueda para gestores y talleres al crear caso. (3) Fix file upload en creación de caso.
POR QUE: (1) El usuario necesita ver cuántos casos están pendientes de facturar sin entrar a la página. (2) Los desplegables de gestores/talleres eran muy lentos de navegar con muchas opciones. (3) El file input estaba dentro del div clickeable, causando un loop de apertura.
COMO: (1) `Sidebar.tsx`: query `casos WHERE estado=cerrado AND facturado=false`, pasa `pendingFacturacionCount` a `SidebarClient.tsx` → badge amber en Facturación. (2) Componente `SearchableSelect.tsx` reutilizable con input text + dropdown filtrado + click outside + clear. Reemplaza `<select>` de gestor (línea 398) y taller (línea 461) en `CasoForm.tsx`. (3) `CasoForm.tsx`: movido `<input type=file>` fuera del div con onClick para evitar re-apertura.
ARCHIVOS AFECTADOS: `Sidebar.tsx`, `SidebarClient.tsx`, `SearchableSelect.tsx` (NUEVO), `CasoForm.tsx`
EFECTOS COLATERALES: Ninguno. El parser auto-populate sigue funcionando con `setGestorId()` ya que SearchableSelect acepta value programáticamente.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 15/03/2026 (Sprint 8.4)
QUE SE CAMBIO: (1) Reescritura completa del parser de auto-completado Sancor. (2) Mail de derivación a perito de calle desde el expediente.
POR QUE: (1) El parser anterior usaba regex frágiles que no extraían correctamente vehículo, instrucciones ni gestor del formato de ficha de Sancor. (2) El coordinador necesita enviar la derivación al perito de calle desde CLARITY en vez de hacerlo manualmente.
COMO: (1) `sancor.ts` reescrito con lógica label-based (busca "Vehículo" → siguiente línea, "Instrucciones" → texto hasta "Denuncia", "Gestor del reclamo" → siguiente línea). Extrae 6 campos: siniestro, OS, patente, vehículo, instrucciones, gestor. Devuelve `campos_encontrados`/`campos_no_encontrados` para checklist. (2) `CasoForm.tsx`: mapea `vehiculo→marca`, `dominio`, mejora matching de gestor (fullname exacto → apellido → helper text), checklist visual post-parseo con ✓/✗ por campo + warning amber si gestor no encontrado. (3) `026_derivacion_perito.sql`: columna `derivacion_enviada_at` en `casos`, template `derivacion_perito` en `mail_templates`. (4) `templates.ts`: variables `perito_nombre`, `descripcion`, `gestor_email` agregadas + query actualizada con `perito_calle(email)`. (5) API `/api/derivacion/enviar`: usa `renderTemplate` → `sendEmail` inmediato → audit en `mail_queue` → historial. (6) `DerivacionPeritoBanner.tsx`: banner post-creación (`?nuevo=1`), botón permanente en expediente, preview dialog con datos reales, validación (perito+email, fecha, dirección), warning de reenvío con fecha. (7) `CasoDetail.tsx`: integra banner, fetch `perito_calle.email`. (8) `page.tsx [id]`: acepta `searchParams` para `?nuevo=1`. (9) `CasoForm.tsx`: navega con `?nuevo=1` post-creación.
ARCHIVOS AFECTADOS: `sancor.ts`, `CasoForm.tsx`, `026_derivacion_perito.sql` (NUEVO), `templates.ts`, `derivacion/enviar/route.ts` (NUEVO), `DerivacionPeritoBanner.tsx` (NUEVO), `CasoDetail.tsx`, `[id]/page.tsx`
EFECTOS COLATERALES: Parser ya no extrae `direccion_inspeccion` ni `link_orion` (esos campos siempre se completaron manualmente). `renderTemplate` ahora trae `perito_calle` y `datos_crudos_sancor` en su query (backwards compatible). La migración SQL debe ejecutarse en Supabase.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

---

FECHA: 13/03/2026 (Sprint 8.3)
QUE SE CAMBIO: Acción "Pedir Migración" en la Cola de Carga. Al ejecutarla, envía un mail automático vía Gmail API pidiendo la migración del siniestro, transiciona el caso a `en_consulta_cia`, y cuando responden el mail detectado por el cron `leer-respuestas`, el caso vuelve automáticamente a `pendiente_carga` con notificación.
POR QUE: El estudio necesita solicitar la migración de siniestros al usuario de Alfredo Miño en Sancor, con tracking automático de la respuesta.
COMO: (1) Migración SQL `025_migracion_feature.sql`: columnas `gmail_migracion_thread_id` y `gmail_migracion_message_id` en `casos`, 3 rows en `configuracion` con destinatarios editables. (2) `gmail.ts`: soporte de CC (`ccEmails?: string[]` en `SendEmailParams`, header `Cc:` en RFC 2822). (3) API `/api/migracion/enviar/route.ts`: envía el mail inmediatamente (no vía cola), guarda threadId, transiciona estado, crea historial + nota + notificación. (4) `ColaDeCargaBoard.tsx`: 4ª opción "Pedir Migración" con ícono índigo (`ArrowRightLeft`), separador visual, diálogo de preview que muestra Para/CC/Asunto/Cuerpo con datos reales + nota de estado automático. (5) `leer-respuestas/route.ts`: reescrito con 2 bloques try/catch independientes al nivel de función: Bloque 1 (gestores, existente) y Bloque 2 (migración, nuevo). Error en uno no afecta al otro. Cada caso de migración tiene su propio try/catch interno. Respuesta → `pendiente_carga` + historial + nota con contenido de respuesta + notificación a admins y perito_carga. (6) `MigracionConfigEditor.tsx`: editor de destinatarios en Configuración (3 campos, upsert a `configuracion`). (7) Integrado en `configuracion/page.tsx`.
ARCHIVOS AFECTADOS: `025_migracion_feature.sql` (NUEVO), `gmail.ts`, `migracion/enviar/route.ts` (NUEVO), `ColaDeCargaBoard.tsx`, `leer-respuestas/route.ts`, `MigracionConfigEditor.tsx` (NUEVO), `configuracion/page.tsx`
EFECTOS COLATERALES: `sendEmail` ahora acepta `ccEmails` opcional (backwards compatible). El cron `leer-respuestas` ahora revisa tanto hilos de gestores como de migración. La migración SQL debe ejecutarse en Supabase.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores. Bloques try/catch independientes verificados en código.

FECHA: 13/03/2026 (Sprint 8.2)
QUE SE CAMBIO: Nueva sección "Observaciones de la Pericia" en inspección remota + expediente del caso. Permite al usuario agregar texto y/o audio desde el resumen pre-envío. Las observaciones se visualizan en el expediente con reproductor de audio custom y controles de velocidad.
POR QUE: El perito/taller necesita poder comunicar daños que no se ven en las fotos, detalles mecánicos, o cualquier dato relevante que no se puede capturar fotográficamente.
COMO: (1) Migración SQL `024_observaciones_pericia.sql`: 2 columnas nuevas `observaciones_pericia TEXT` y `audio_pericia_url TEXT` en `casos`. (2) API `/api/inspeccion-remota/upload-audio/route.ts`: sube audio al storage inmediatamente al grabar. (3) API `/api/inspeccion-remota/complete/route.ts`: acepta `observaciones_pericia` y `audio_pericia_url`, los guarda en `casos`. (4) `WizardCaptura.tsx`: sección colapsable en paso "resumen" con textarea (2000 chars, auto-resize), grabador de audio (MediaRecorder, 120s máx, WebM/MP4 según navegador), mini reproductor con play/pause/delete, upload inmediato con spinner/✓/error+reintentar. Botón enviar muestra "Subiendo audio..." si el audio está subiendo. (5) `ObservacionesPericia.tsx`: componente cliente para el expediente con texto (white-space: pre-wrap), reproductor de audio custom (play/pause, barra seekable, tiempo, 4 botones de velocidad 1x/1.25x/1.5x/2x, descarga). Solo se renderiza si hay datos. Badge "Desde inspección remota". (6) `CasoDetail.tsx`: integra `ObservacionesPericia` después de la galería de fotos.
ARCHIVOS AFECTADOS: `024_observaciones_pericia.sql`, `upload-audio/route.ts` (NUEVO), `complete/route.ts`, `WizardCaptura.tsx`, `ObservacionesPericia.tsx` (NUEVO), `CasoDetail.tsx`
EFECTOS COLATERALES: Ninguno. El flujo de fotos no se modifica. Si la sección está vacía, no se envía nada extra ni se muestra en el expediente. La migración SQL debe ejecutarse en Supabase.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 13/03/2026 (Sprint 8.1)
QUE SE CAMBIO: Conversión automática HEIC → JPEG en el módulo de inspección remota. iPhones que entregan fotos en formato HEIC (especialmente desde la galería) ahora se convierten a JPEG antes de comprimir y subir.
POR QUE: Fotos HEIC de iPhone no se podían procesar ni subir correctamente. El canvas de compresión no soporta HEIC nativo.
COMO: (1) Se instaló `heic2any` (~400KB, cargada con dynamic import solo cuando se necesita). (2) `WizardCaptura.tsx`: nueva función `convertirSiEsHeic()` con detección por MIME type, extensión, y MIME vacío (caso iOS). Wrapper `procesarImagen()` con timeout de 30s que ejecuta conversión + compresión. Se reemplazó `compressImage(blob)` por `procesarImagen(blob)` en `uploadFotoInmediata`. (3) `CameraCapture.tsx`: `handleFileSelect` ahora convierte HEIC a JPEG antes de pasar al wizard. Inputs de cámara usan `accept="image/jpeg,image/png"`, galería acepta también `image/heic,image/heif`. (4) `CamaraCaptura.tsx` (admin): `accept` actualizado a `image/jpeg,image/png`.
ARCHIVOS AFECTADOS: `WizardCaptura.tsx`, `CameraCapture.tsx`, `CamaraCaptura.tsx`, `package.json`
EFECTOS COLATERALES: Ninguno. Archivos JPEG pasan de largo sin conversión. La falla de conversión devuelve el archivo original (fallback seguro). La carga parcial detectada sigue funcionando igual.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores. Import dinámico verificado.

FECHA: 13/03/2026 (Sprint 8)
QUE SE CAMBIO: (1) Tablero de Tareas visible para todos los usuarios autenticados. (2) Detección de rol multi-role en CasoDetail. (3) DateFilter con formato DD/MM/AA. (4) Perito de carga con acceso completo a estados y tipo IP. (5) Buscador no auto-filtra, Enter hace GoTo. (6) Highlight persistente hasta hover.
POR QUE: (1) Admin y carga veían tareas diferentes — carga solo veía tareas donde era creador o asignado. (2) `CasoDetail.tsx` usaba solo `usuario.rol` (legacy), ignorando `roles[]`. (3) `type="date"` del navegador se bugueaba al 3er dígito del año. (4) Carga estaba limitado a 5 estados en el expediente. (5) El buscador filtraba server-side mientras escribías. (6) El highlight se desvanecía en 2.5s, el usuario lo quiere persistente.
COMO: (1) Migración SQL `023_tareas_visibilidad_total.sql`: `DROP POLICY tareas_visibilidad` + nueva con `auth.role() = 'authenticated'`. Removido filtro `or(creador_id/asignado_id)` en `tareas/page.tsx`. (2) CasoDetail ahora lee `roles[]` con prioridad admin>carga>calle. (3) Inputs `type="text"` con máscara DD/MM/AA, auto-formato, internamente sigue YYYY-MM-DD. (4) SelectorEstado: `carga` obtiene todos los estados. CasoDetail: TipoIP editable para carga/admin. (5) Removido debounce de búsqueda, Enter ejecuta `handleGoTo()`. (6) `onMouseEnter` limpia highlight en vez de timer.
ARCHIVOS AFECTADOS: `023_tareas_visibilidad_total.sql`, `tareas/page.tsx`, `CasoDetail.tsx`, `SelectorEstado.tsx`, `FilterDropdown.tsx`, `CasosTable.tsx`
EFECTOS COLATERALES: La migración SQL debe ejecutarse en Supabase para que surta efecto.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 13/03/2026 (Sprint 7)
QUE SE CAMBIO: Filtros de fecha rediseñados — ahora hay 4 filtros de fecha independientes (Ingreso, Fecha IP, F. Carga, F. Cierre), cada uno con su propio rango Desde/Hasta. Reemplaza el selector único que no permitía filtrar por dos fechas al mismo tiempo.
POR QUE: El selector anterior (un dropdown que elegía "qué fecha filtrar") solo permitía filtrar por UNA fecha a la vez. El usuario necesita cruzar filtros, ej: "Ingreso = 12/3 Y Carga = 13/3".
COMO: `CasosFilters` ahora tiene 8 campos independientes: `ingreso_desde/hasta`, `ip_desde/hasta`, `carga_desde/hasta`, `cierre_desde/hasta`. `getCasos()` aplica cada rango como filtro AND independiente. `CasosTable.tsx` muestra 4 componentes `DateFilter` separados en la barra de filtros. URL params persisten cada filtro individualmente.
ARCHIVOS AFECTADOS: `actions.ts`, `page.tsx`, `CasosTable.tsx`
EFECTOS COLATERALES: Ninguno. Los demás filtros (Estado, Tipo IP, Peritos, Gestor, Buscador) no cambiaron.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 12/03/2026 (Sprint 6)
QUE SE CAMBIO: (1) Fix de archivos no guardados al crear caso — los File objects se perdían dentro de `startTransition()` porque `resetForm()` limpiaba el state `archivos` antes de que los uploads terminaran. (2) Nuevo botón "Ir a" en el buscador de casos — permite hacer scroll hasta un caso específico sin filtrar la tabla, resaltando la fila con un flash ámbar.
POR QUE: (1) Los archivos seleccionados en el formulario de creación de caso nunca llegaban a Supabase Storage porque la referencia a los `File` objects se invalidaba al limpiar el state. (2) Los usuarios necesitan encontrar un caso concreto rápidamente sin perder la vista completa de la planilla, como Ctrl+F de Excel.
COMO: (1) En `CasoForm.tsx`, se guarda `const filesToUpload = [...archivos]` ANTES de `startTransition()`. Dentro del transition se usa `filesToUpload` en vez de `archivos`. Se agregó toast de error si algún upload falla. (2) En `CasosTable.tsx`: nuevo icon `Crosshair` de lucide, state `highlightCasoId`, función `handleGoTo()` que busca en `procesados` por siniestro/dominio/servicio y usa `rowVirtualizer.scrollToIndex()`. La fila encontrada se resalta con `ring-amber-400` + animación `highlight-flash` (definida en `globals.css`) que se desvanece en 2.5s. Ctrl+Enter en el buscador activa GoTo directamente.
ARCHIVOS AFECTADOS: `CasoForm.tsx`, `CasosTable.tsx`, `globals.css`
EFECTOS COLATERALES: Ninguno. El buscador existente (filtrado por URL) sigue igual.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 12/03/2026 (Sprint 5)
QUE SE CAMBIO: (1) Filtros de fecha: nuevo selector de tipo de fecha (Ingreso, Fecha IP, Carga, Cierre) que permite filtrar por cualquiera de los 4 campos de fecha del caso. (2) Bug crítico de comentarios de tareas: el contenido del comentario se insertaba vacío/incorrecto en la BD por una referencia a estado React ya limpiado.
POR QUE: (1) Solo se podía filtrar por fecha_derivacion. Los usuarios necesitan filtrar por fecha_inspeccion_programada, fecha_carga_sistema y fecha_cierre. (2) `handleEnviar` en `ComentariosTarea.tsx` hacía `setNuevoComentario("")` en línea 222, y luego en línea 298 usaba `contenido: nuevoComentario.trim()`. Después de awaits intermedios (subida de archivos), React puede re-renderizar y el closure captura el estado vacío. El contenido se guardaba vacío o con el valor de otro comentario, dando la impresión de que el comentario aparecía en la tarea equivocada.
COMO: (1) Nuevo param `fecha_campo` en `CasosFilters`, procesado en `getCasos()` con validación de campos permitidos. Para `fecha_carga_sistema` y `fecha_cierre` se excluyen registros con valor null. Selector `<select>` en `CasosTable.tsx` junto al DateFilter existente. URL param `fecha_campo` persistido en searchParams. (2) Cambiado `contenido: nuevoComentario.trim()` → `contenido: textoOriginal.trim()` (variable salvada antes del setState en línea 216).
ARCHIVOS AFECTADOS: `actions.ts`, `page.tsx`, `CasosTable.tsx`, `ComentariosTarea.tsx`
EFECTOS COLATERALES: Ninguno. Los filtros existentes siguen funcionando igual (fecha_derivacion es el default).
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 12/03/2026 (Sprint 4)
QUE SE CAMBIO: (1) Lightbox de fotos de inspección: click en costados izq/der ahora cierra el lightbox. (2) Subida de fotos por link de inspección remota: refactor completo a upload progresivo inmediato con compresión y semáforo de 3 concurrentes.
POR QUE: (1) El contenedor de la imagen tenía `w-full` + `stopPropagation`, los clicks en los costados vacíos no llegaban al overlay de cierre. (2) Con 30-40 fotos de cámara (3-5MB c/u), los 90-200MB de blobs en estado React causan que el navegador mate el tab en celulares con poca RAM. El proceso se reiniciaba perdiendo todo.
COMO: (1) Reestructurado lightbox en `GaleriaFotosResponsive.tsx`: el wrapper de la imagen ahora es `relative` sin `w-full`, se dimensiona al tamaño de la foto. Solo el wrapper de la imagen tiene `stopPropagation`. Los flechas de navegación son botones absolutos con su propio `stopPropagation`. (2) Refactor completo de `WizardCaptura.tsx`: nueva función `compressImage()` comprime vía Canvas API a 1920px/Q80 (~300-500KB). `FotoCapturada` ya no almacena `Blob`, solo `id, url, uploading, uploaded, error`. `uploadFotoInmediata()` sube cada foto al capturarla con semáforo de max 3 uploads concurrentes via ref-based queue. `handleFinalize()` ahora es liviano: solo verifica que todas las fotos estén uploaded y llama a `/complete`. UI de Resumen muestra spinner/✓/error por foto con botón "Reintentar".
ARCHIVOS AFECTADOS: `GaleriaFotosResponsive.tsx`, `WizardCaptura.tsx`
EFECTOS COLATERALES: Ninguno negativo. Las fotos se comprimen antes de subir (reducción ~80% de tamaño), se suben inmediatamente al capturarlas (no se acumulan en RAM), los blobs se liberan tras upload exitoso. La experiencia de usuario no cambia visualmente (el usuario sigue sacando fotos normalmente, los thumbnails pasan de spinner a ✓).
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 12/03/2026 (Sprint 3 bis — Fixes verificados)
QUE SE CAMBIO: (1) Lightbox de fotos de inspección en expediente: agregada navegación con teclado ←/→ y cierre con Escape. (2) "Invalid Date" en fecha_carga_sistema y fecha_cierre: corregido formateo de fechas TIMESTAMPTZ.
POR QUE: (1) `GaleriaFotosResponsive.tsx` tiene su propio lightbox inline (diferente de `ImageLightbox.tsx` de tareas/comentarios). Este lightbox NO tenía `useEffect` para eventos de teclado — solo botones on-screen. El backdrop-close YA funcionaba (onClick en div exterior + stopPropagation en área de imagen). (2) `EditableField.tsx` hacía `new Date(valorActual + "T12:00:00")` pero cuando `valorActual` ya era un TIMESTAMPTZ completo como `"2026-03-12T17:44:18.123Z"`, se concatenaba a `"2026-03-12T17:44:18.123ZT12:00:00"` = `Invalid Date`.
COMO: (1) Agregado `useEffect` en `GaleriaFotosResponsive.tsx` que escucha `keydown` cuando `showLightbox=true`, maneja ArrowLeft, ArrowRight y Escape. Se limpia con cleanup function. (2) Reescrita lógica de display en `EditableField.tsx`: nueva función `formatDateDisplay()` extrae la parte `YYYY-MM-DD` del string (sea `2026-03-12` o `2026-03-12T17:44:18Z`), construye Date manualmente vía `new Date(year, month-1, day)` para evitar issues de timezone. Incluye guard contra valores null, undefined o mal formados.
ARCHIVOS AFECTADOS: `GaleriaFotosResponsive.tsx`, `EditableField.tsx`
EFECTOS COLATERALES: Ninguno. Los cambios son aditivos (keyboard handler) o reemplazo de lógica de display (formateo de fecha).
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores. Lógica de `cambiarEstadoCaso` verificada: guarda `new Date().toISOString()` correctamente en campos `fecha_carga_sistema` y `fecha_cierre`. `ImageLightbox.tsx` (tareas/comentarios) ya tenía keyboard nav, backdrop close y image-stopPropagation — no requirió cambios.

FECHA: 12/03/2026 (Sprint 3)
QUE SE CAMBIO: (1) Check "Contactado" visible en TODOS los tipos de inspección, (2) Filtros de Casos reconstruidos 100% — server-side Supabase, URL params, nuevo componente FilterDropdown.
POR QUE: (1) El check de "Link enviado" solo aparecía para `ip_remota`, pero el perito lo necesita para cualquier tipo de caso como ayuda visual de gestión. (2) Los filtros existentes no funcionaban correctamente, usaban localStorage (no compartible entre pestañas), filtraban en memoria (no escala), y la fecha solo tenía presets predefinidos.
COMO: (1) Eliminada la condición `caso.tipo_inspeccion === "ip_remota"` en `AgendaCard.tsx`. Label cambiado a "CONTACTADO ✓" / "CONTACTAR". (2) Nuevo `FilterDropdown.tsx` con dos componentes: `FilterDropdown` (multi-select checkboxes con búsqueda, seleccionar/deseleccionar todo, click-fuera cierra) y `DateFilter` (inputs Desde/Hasta + presets rápidos: Hoy, Esta semana, Este mes, Mes anterior, Últimos 3 meses). Modificado `getCasos()` en `actions.ts` para aceptar `CasosFilters` interface y construir query Supabase dinámica con `.in()`, `.gte()`, `.lte()`, `.or()`. `page.tsx` actualizado para leer `searchParams` de Next.js y pasarlos. `CasosTable.tsx` reescrito: eliminado `useLocalStorageState` y filtrado client-side, reemplazado por `useSearchParams` + `router.push` para persistencia vía URL. Debounce de 400ms en búsqueda. Pastillas de estado siguen funcionando e interactúan con el filtro de estado del dropdown.
ARCHIVOS AFECTADOS: `AgendaCard.tsx`, `FilterDropdown.tsx` (NUEVO), `casos/actions.ts`, `casos/page.tsx`, `CasosTable.tsx`
EFECTOS COLATERALES: Los filtros ahora se persisten en la URL (no localStorage): abrir en nueva pestaña empieza limpio. La columna dinámica de fecha en la tabla fue reemplazada por "Ingreso" hardcodeado (fecha_derivacion). Las columnas F. Carga y F. Cierre siguen visibles en la tabla.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

FECHA: 12/03/2026 (Sprint 2)
QUE SE CAMBIO: Sprint de correcciones UI/UX — 7 ítems independientes resueltos.
POR QUE: Bugs reportados en uso diario: imagen rota en pantalla final de inspección remota, saltos de línea no visibles en observaciones internas, lightbox sin click-fuera y sin teclado, fechas de carga y cierre no se grababan automáticamente, falta de indicador "Link Enviado" en Mi Agenda, y modo claro con colores ilegibles.
COMO: (1) Imagen rota WizardCaptura — ya corregido previamente en esta sesión (path `/logo-al-servicio-de-SS-negro.png`). (2) Saltos de línea — `whitespace-pre-wrap break-words` en `EditableField.tsx` (spans de textarea) y `TareaCard.tsx` (descripción). (3) Lightbox — `ImageLightbox.tsx` actualizado para cerrar con click en backdrop (`onClick={onClose}` en wrapper + `stopPropagation` en img). Teclado ←/→/Esc ya existía. (4) Fechas automáticas — `fecha_carga_sistema` y `fecha_cierre` (que ya existían en la DB) ahora se setean automáticamente en `cambiarEstadoCaso()` y `marcarInspeccionRealizada()` al transicionar a `pendiente_carga` / `ip_cerrada` / `inspeccion_anulada`. Se preservan si el caso se reabre. Nuevos campos `EditableField tipo="date"` en `CasoDetail.tsx` para edición manual admin. (5) Link Enviado — nueva columna `link_enviado BOOLEAN` en `casos` (migración `022`). Server action `toggleLinkEnviado()` en `mi-agenda/actions.ts`. Botón toggle visible solo para `ip_remota` en `AgendaCard.tsx`. (6) Filtros avanzados — ya existían (multi-select con localStorage persistence). No se requirieron cambios. (7) Modo claro — Paleta `:root` actualizada: backgrounds a `#FAFAF9`/`#F5F5F2`, text hierarchy `#1A1A1A`/`#6B6B6B`/`#9B9B9B`, colores funcionales a versiones WCAG AA (`#059669` success, `#D97706` warning, `#DC2626` danger, `#4F46E5` info, `#9333EA` critical). `EstadoBadge.tsx` actualizado con `dark:` variants en todos los estados para que los badges usen text-*-700 en light y text-*-400 en dark. Row style de `facturada` también corregido con `dark:` variants.
ARCHIVOS AFECTADOS: `globals.css`, `EstadoBadge.tsx`, `EditableField.tsx`, `TareaCard.tsx`, `ImageLightbox.tsx`, `CasoDetail.tsx`, `WizardCaptura.tsx`, `casos/[id]/actions.ts`, `casos/actions.ts`, `mi-agenda/actions.ts`, `AgendaCard.tsx`, `api/inspeccion-remota/complete/route.ts`, `022_fechas_automaticas.sql`
EFECTOS COLATERALES: El modo claro ahora tiene una apariencia sustancialmente diferente (backgrounds más cálidos, textos más oscuros). Los badges de estados críticos en light mode usan text-*-700/800 en vez de text-*-300/400.
TESTEADO: TypeScript `npx tsc --noEmit` 0 errores.

Documento vivo. Ultima actualizacion: Marzo 2026 - v5

FECHA: 11/03/2026
QUE SE CAMBIO: Dashboard Perito Carga — desglose por estado, nuevo favicon, modo claro mejorado, cron auth, UI cleanup
POR QUE: (1) Dashboard de carga mostraba "Pdte. Carga" duplicado y no discriminaba estados individuales. (2) Favicon era stock "CL" poco estético. (3) Modo claro tenía textos y colores ilegibles. (4) Endpoints de cron devolvían 307 por middleware de sesión. (5) Header mostraba nombre redundante con sidebar.
COMO: (1) Reemplazado KPI duplicado por "Total Asignados", agregada sección "Distribución por Estado" con EstadoChip (Pdte. Carga, Pdte. Presupuesto, Licitando, En Consulta, Cerrados). (2) Favicon cambiado a SVG: fondo blanco, "C" negra. (3) Variables CSS :root mejoradas: text-secondary a slate-800, text-muted a slate-600, colores funcionales a *-700, borders más fuertes. (4) Middleware excluye /api/cron/, cada endpoint valida CRON_SECRET via Bearer token. (5) Nombre de usuario eliminado del header, sidebar ya lo muestra. Logo actualizado a texto CLARITY + POWERED BY AOM SINIESTROS. Theme toggle cambiado a switch.
ARCHIVOS AFECTADOS: PanelPeritoCarga.tsx, PanelPeritoCalle.tsx, globals.css, icon.svg, middleware.ts, procesar-mails/route.ts, leer-respuestas/route.ts, Topbar.tsx, SidebarClient.tsx, login/page.tsx, theme-toggle.tsx, layout.tsx, facturacion/page.tsx
EFECTOS COLATERALES: Modo claro ahora tiene colores más profundos (green-700, orange-700, etc.) lo cual puede cambiar ligeramente tonos en badges y estados para usuarios de modo claro.
TESTEADO: TypeScript --noEmit OK, next build OK.

FECHA: 11/03/2026
QUE SE CAMBIO: Reestructuración visual de la tabla de Casos — filtros unificados, siniestro protagonista, estados críticos saturados
POR QUE: La tabla de Casos tenía filtros duplicados e ineficientes (pills de estado + dropdown de estado), todas las columnas competían visualmente sin jerarquía, y el número de siniestro no se distinguía del resto. Estados urgentes no se diferenciaban de los normales.
COMO: (1) Filtros consolidados en 3 filas: barra de búsqueda + layout toggle, quick-click estados con conteo, dropdowns avanzados compactos. Quitado dropdown duplicado "Estado". (2) Columna Servicio oculta para ganar espacio. (3) Siniestro en 15px font-black monospace con ancho 140px. (4) Estados críticos (en_consulta_cia, pendiente_carga, pendiente_presupuesto, ip_reclamada_perito) con badges saturados + font-bold + borde lateral inset de color en la fila. Estados normales con opacidad reducida y fondos de fila neutros. (5) BadgeCounter recibe prop critical para resaltar botones de estados urgentes con fondo rojizo. (6) Anchos de columna body alineados a header.
ARCHIVOS AFECTADOS: CasosTable.tsx, EstadoBadge.tsx
EFECTOS COLATERALES: Las filas ya no tienen fondos de color intenso para todos los estados (solo los 4 críticos). Los badges de estados normales son más sutiles. La barra de quick-click ahora diferencia visualmente los estados urgentes.
TESTEADO: TypeScript --noEmit OK.

FECHA: 11/03/2026
QUE SE CAMBIO: Fase 2.3 — Mejoras Panel de Tareas, Emojis, Comentarios, Notificaciones, Sidebar Badge, Rediseño Cola de Carga
POR QUE: (1) Panel lateral de tareas no scrolleaba correctamente. (2) Notificaciones no abrían la tarea referenciada. (3) Comentarios carecían de Shift+Enter, paste imágenes, reacciones emoji. (4) Sidebar no indicaba tareas pendientes. (5) Cola de Carga usaba tabla genérica sin acciones claras. (6) Siniestro no era prominente en tarjetas Kanban.
COMO: (1) SheetContent con h-[100dvh] overflow-hidden, header fijo, contenido flex-1 overflow-y-auto. (2) NotificationBell enlaza a /tareas?tareaId=X, TareaCard auto-abre via useSearchParams. (3) Input→textarea auto-resize, onPaste para imágenes, drag-and-drop. (4) Tablas reacciones_comentario/reacciones_tarea con RLS+Realtime. Hover→SmilePlus→popover 8 emojis→pills toggle. (5) Sidebar cuenta comentarios no leídos, badge amber. (6) ColaDeCargaBoard: cards con siniestro prominente, antigüedad, dropdown Procesar 3 acciones + confirmación modal.
ARCHIVOS AFECTADOS: TareaCard.tsx, ComentariosTarea.tsx, NotificationBell.tsx, tareas/page.tsx, Sidebar.tsx, SidebarClient.tsx, carga/page.tsx, ColaDeCargaBoard.tsx (nuevo), 021_fase23_mejoras_tareas.sql (nueva migración)
EFECTOS COLATERALES: Suspense wrapper en tareas/page.tsx. Input de comentarios ahora es textarea multilínea. Cola de Carga ya no usa CasosTable. Tablas de reacciones requieren migración SQL.
TESTEADO: TypeScript --noEmit OK.

FECHA: 11/03/2026
QUE SE CAMBIO: Lightbox unificado para imágenes + Reacciones emoji en descripción de tarea
POR QUE: (1) Imágenes adjuntas se abrían en nueva pestaña, sin modal de visualización ni navegación. (2) Las reacciones emoji solo funcionaban en comentarios, no en la descripción de la tarea.
COMO: (1) Componente ImageLightbox.tsx reutilizable: Dialog fullscreen, navegación con flechas y teclado (← → Escape), botón Descargar, strip de miniaturas. Integrado en ComentariosTarea (reemplazó ~100 líneas de Dialog inline) y en TareaCard (adjuntos clickeables abren lightbox). (2) Descripción de tarea: hover muestra SmilePlus, popover con 8 emojis, pills de conteo debajo, toggle propio, usa tabla reacciones_tarea existente.
ARCHIVOS AFECTADOS: ImageLightbox.tsx (nuevo), ComentariosTarea.tsx (refactor lightbox), TareaCard.tsx (lightbox + emoji)
EFECTOS COLATERALES: ComentariosTarea ya no importa Dialog/ChevronLeft/ChevronRight. TareaCard ahora importa createClient para interactuar con reacciones_tarea.

FECHA: 11/03/2026
QUE SE CAMBIO: Sprint Fixes Críticos de Expediente y Fotos Remotas
POR QUE: (1) El Gestor asignado al crear el caso no se guardaba en la BD. (2) Faltaba la posibilidad de adjuntar archivos (carátula, denuncia) al crear el caso directamente. (3) Los datos del expediente en CasoDetail eran estáticos obligando a flujos largos para editar. (4) Subidas parciales de fotos remotas o fallos de red causaban desinformación y redirecciones sin feedback claro.
COMO: (1) Fix `CasoForm.tsx` agregando `gestor_id: gestorId` al payload e integrando sección en `CasoDetail` Asignaciones. (2) UI drag-drop agregada al formulario de creación para PDF/imágenes, que auto-sube al bucket `caso-archivos` al finalizar alta. (3) Nuevo componente `EditableField.tsx` genérico para edición inline; implementado en vehículo, perito calle/carga, taller, gestor y observaciones. (4) Mejorado error logging en `WizardCaptura.tsx` para mostrar qué fotos fallan y añadido banner en `ip/[token]/page.tsx` si link tiene fotos pre-subidas.
ARCHIVOS AFECTADOS: CasoForm.tsx, CasoDetail.tsx, EditableField.tsx (nuevo), WizardCaptura.tsx, ip/[token]/page.tsx
EFECTOS COLATERALES: Al crear caso sube directo al storage `caso-archivos` existente eliminando necesidad de nuevas columnas BD.
TESTEADO: TypeScript --noEmit OK.

FECHA: 11/03/2026
QUE SE CAMBIO: Sprint Fixes de Fechas y UX de Tareas/Cola de Carga
POR QUE: (1) Las fechas programadas en CasoDetail aparecían un día desfasado por conflictos entre UTC y Local Time al parsear strings `YYYY-MM-DD` con `new Date()`. (2) El punto de mensajes no leídos en el Kanban titilaba indefinidamente sin mecanismo de "visto". (3) El avatar del Gestor/Asignado era muy pequeño usando solo iniciales. (4) Detalles menores de UI en la Cola de Carga (fondo transparente en dropdown y texto del subtítulo).
COMO: (1) Se agregó un offset local seguro `T12:00:00` a `fechaProgramadaInicial` en `EditableCoordinacion.tsx` antes de parsear. (2) Se implementó un hook con `localStorage` en `TareaCard.tsx` que guarda el timestamp de la última lectura (`ultimo_leido_at`) y compara con `created_at` del comentario más reciente. (3) Se rediseñó el área del asignado en el TareaCard para mostrar el Avatar y debajo el `Nombre Completo`. (4) Se añadió `bg-bg-elevated` al menú de la cola de carga y se ajustó el subtítulo en `page.tsx`.
ARCHIVOS AFECTADOS: EditableCoordinacion.tsx, TareaCard.tsx, tareas/page.tsx, carga/page.tsx, ColaDeCargaBoard.tsx
EFECTOS COLATERALES: Ninguno severo. El estado de "leído" de las tareas depende del caché local (localStorage) por dispositivo/usuario; asume la consulta de "comentarios" completa la fecha de creación en la tabla.
TESTEADO: TypeScript --noEmit OK.

FECHA: 12/03/2026
QUE SE CAMBIO: Fix de fotos duplicadas y reload forzado (Out Of Memory) en Inspección Remota (WizardCaptura).
POR QUE: (1) Si el envío de fotos fallaba por un microcorte de internet, al reintentar, se volvían a subir TODAS las fotos desde 0 generando duplicados que agotaban el límite de 50 (max_fotos). (2) En la app nativa de la cámara y en ciertos dispositivos iOS/Safari, al llegar a tener ~50 fotos base64 o Blobs en memoria, el navegador mataba la pestaña por exceso de RAM ("Out Of Memory"), recargando la página hacia el inicio ("bienvenida") sin dar feedback, justo antes o durante el aviso final.
COMO: (1) Para los duplicados: Se implementó un "Smart Retry" añadiendo la flag `uploaded: true` a los elementos de los arrays de estado (fotosReglamentarias y fotosDanios) a medida que dan HTTP 200 OK. El loop `handleFinalize` ahora hace `if(foto.uploaded) continue;`. También el botón avisa "Reintentar X fotos pendientes". (2) Para los reseteos de página (OOM Crash): Ahora, apenas una foto se sube a Supabase con éxito o se remueve desde la UI, se aplica un `URL.revokeObjectURL(foto.preview)` forzado para limpiar la RAM ("Garbage Collection" inmediato de la imagen cacheada en el navegador).
ARCHIVOS AFECTADOS: WizardCaptura.tsx, CameraCapture.tsx
EFECTOS COLATERALES: Las fotos que ya fueron exitosamente subidas no se vuelven a mandar, ahorrando tiempo, ancho de banda y espacio en Bucket/DB. Evita que el cliente agote la subida permitida inútilmente.
TESTEADO: TypeScript --noEmit OK.

FECHA: 19/03/2026
QUE SE CAMBIO: Backfill de honorarios para casos migrados sin montos de facturación.
POR QUE: Los casos que fueron migrados directamente a estado "facturada" nunca pasaron por la lógica de cambiarEstadoCaso que asigna los montos de honorarios desde la tabla precios. Como resultado, monto_facturado_estudio, monto_pagado_perito_calle y monto_pagado_perito_carga estaban en 0/NULL para esos casos, impactando los reportes financieros y la liquidación de honorarios de peritos.
COMO: Migración SQL (029_backfill_billing_migrated_cases.sql) que hace UPDATE ... FROM precios WHERE compania_id + tipo_inspeccion coinciden. Solo afecta casos en ip_cerrada/facturada con fecha_cierre pero monto_facturado_estudio = 0 o NULL. No modifica código de la aplicación — el código actual ya preserva fechas manuales (guard !caso.fecha_cierre en cambiarEstadoCaso).
ARCHIVOS AFECTADOS: supabase/migrations/029_backfill_billing_migrated_cases.sql (nuevo)
EFECTOS COLATERALES: Ninguno. Los nuevos casos siguen la lógica normal de asignación al cambiar estado. Solo retroactivo para migración.
TESTEADO: SQL revisado. Debe ejecutarse en Supabase SQL Editor directamente.

FECHA: 19/03/2026
QUE SE CAMBIO: Corrección de cálculos de honorarios en PanelPeritoCarga y ReportesFiltros.
POR QUE: El panel del perito mostraba números incorrectos: (1) "Cargados este mes" filtraba por fecha_cierre en vez de fecha de carga. (2) No mostraba honorarios de calle para peritos con doble rol. (3) Los montos no coincidían entre la vista del perito y los reportes del admin. (4) Las anuladas se incluían en métricas de tiempo y billing.
COMO: (1) Reescritura de PanelPeritoCarga.tsx: consulta tanto perito_carga_id como perito_calle_id, muestra KPIs separados para cada rol, excluye anuladas del billing. Hon. calle se reconoce en fecha_inspeccion_real o fecha_carga_sistema (cuando entra a pendiente_carga). Hon. carga se reconoce en fecha_cierre (cuando se cierra la IP). (2) ReportesFiltros.tsx: corregido fallback de fecha para perito calle de fecha_cierre a fecha_carga_sistema. Excluidas anuladas de casosIPRealizadaRango, casosCerradosRango y totalPagadoPeritoCalle. (3) FacturacionMensualCarga.tsx: agregada prop label para distinguir "Hon. Calle" de "Hon. Carga".
ARCHIVOS AFECTADOS: PanelPeritoCarga.tsx (reescrito), ReportesFiltros.tsx (fix billing dates), FacturacionMensualCarga.tsx (label prop)
EFECTOS COLATERALES: Si un perito es dual (calle+carga), en su dashboard ahora ve dos filas de KPIs separadas y un total combinado. Los reportes del admin pueden mostrar valores ligeramente distintos a los anteriores por la nueva exclusión de anuladas.
TESTEADO: TypeScript --noEmit OK.

FECHA: 19/03/2026
QUE SE CAMBIO: Fix de performance — 884 auth requests por landing page.
POR QUE: La landing page en /landing pasaba por el middleware de Supabase Auth que llama a getUser() en cada request. Esto generaba ~884 auth requests por hora innecesariamente. Además, framer-motion (~40KB) y @tsparticles (~100KB+) se importaban directo en el bundle principal de la app.
COMO: (1) middleware.ts: Agregado array PUBLIC_PREFIXES con /landing, /ip/, /seguimiento/, /api/inspeccion-remota/, /api/cron/. El middleware hace NextResponse.next() inmediatamente para estas rutas ANTES de llamar a updateSession(), evitando por completo la llamada a supabase.auth.getUser(). (2) lib/supabase/middleware.ts: Limpiada la lógica redundante de isPublicInspeccion/isPublicAPI/etc. ya que el short-circuit ocurre antes. (3) landing/page.tsx: LandingPage importado con next/dynamic + ssr:false para que framer-motion y @tsparticles no se incluyan en el bundle principal.
ARCHIVOS AFECTADOS: middleware.ts, lib/supabase/middleware.ts, app/landing/page.tsx
EFECTOS COLATERALES: Las rutas públicas (/ip/, /seguimiento/, /api/cron/, /landing) ya no pasan por updateSession, lo cual significa que no refrescan cookies de sesión. Esto es correcto porque son rutas públicas sin usuario autenticado.
TESTEADO: TypeScript --noEmit OK.

FECHA: 19/03/2026
QUE SE CAMBIO: Deduplicación de llamadas a Supabase Auth — fix de "context deadline exceeded".
POR QUE: Supabase Auth devolvía 504 timeout ("context deadline exceeded" en GET /user) por exceso de llamadas concurrentes a getUser(). Cada page load generaba 3-5+ llamadas a getUser(): middleware + Topbar + getUsuarioActual() en la página + server actions. Cada una es un HTTP request al Auth API de Supabase, saturando el connection pool.
COMO: (1) lib/supabase/middleware.ts: Reemplazado getUser() por getSession(). getSession() lee el JWT de la cookie localmente (0 network calls), mientras que getUser() hace un HTTP request al Auth API. El middleware solo necesita saber si hay sesión para decidir redirect, no validar contra el server. (2) lib/auth.ts: getUsuarioActual envuelto con React cache(). Múltiples server components (Topbar, Sidebar, Page) que llaman getUsuarioActual() ahora comparten UNA sola llamada a getUser() por request lifecycle. (3) Topbar.tsx: Reemplazado supabase.auth.getUser() directo por getUsuarioActual() cacheado. Resultado: de ~5 HTTP calls al Auth API por pageview a exactamente 1.
ARCHIVOS AFECTADOS: lib/supabase/middleware.ts, lib/auth.ts, components/layout/Topbar.tsx
EFECTOS COLATERALES: El middleware ya no valida el JWT contra el Auth API en cada request (usa getSession local). La validación real ocurre una vez por request en getUsuarioActual(). Si el JWT está expirado/revocado, la detección ocurre al llegar al primer server component, no en el middleware.
TESTEADO: TypeScript --noEmit OK.

FECHA: 26/03/2026
QUE SE CAMBIO: Sprint de Resiliencia en Campo — 4 Pasos + 5 Guardrails
POR QUE: (1) En iOS/Android el input con capture="environment" bloqueaba el acceso a la galería de fotos en InspeccionCampoWizard. (2) No existía protección contra envío con fotos pendientes de upload ni mecanismo de recuperación ante recargas accidentales. (3) El flujo "Ausente" usaba useTransition sin redirect forzado ni manejo de errores de red. (4) No existía modo edición post-envío del informe técnico presencial.
COMO: Paso 1: Dual input (camera+gallery) con inputs HTML separados en fotos_reg — mismos pattern de BUG-014. Paso 2A: Upload Blocker ESTRICTO — pendingUploads cuenta fotos no-uploaded (incluyendo errored), bloquea botón de firma con texto "⏳ Esperando red..." y double-check en handleConfirm. Paso 2B: localStorage draft auto-save (debounce 2s, key draft_inspeccion_{casoId}) con DESACTIVACIÓN TOTAL en edit mode (prevención de colisión Guardrail 2). Paso 3: BotonAusente reescrito con async/await secuencial + try/catch + toast + router.push('/mi-agenda') + dual input. Paso 4: actualizarInspeccionCampo server action con STRICT PATCH (Guardrail 3: nunca toca firma/GPS/photos), validación server-side (Guardrail 4: perito owner o admin), cache purge (Guardrail 5: revalidatePath en todas las rutas). VistaInformeCampo muestra botón "✏️ Editar Informe" y audit trail "Editado el [Fecha]". page.tsx acepta ?editar=1 con auth check server-side. InspeccionCampoWizard acepta isEditMode+editData, empieza en step "informe", skip firma, llama actualizarInspeccionCampo.
ARCHIVOS AFECTADOS: InspeccionCampoWizard.tsx (pasos 1,2,4), BotonAusente.tsx (paso 3 rewrite), inspeccion-campo/[casoId]/actions.ts (actualizarInspeccionCampo nuevo), inspeccion-campo/[casoId]/page.tsx (edit mode), VistaInformeCampo.tsx (edit button + audit trail), CasoDetail.tsx (prop wiring), 033_informe_campo_editado.sql (migración: columna editado_el)
EFECTOS COLATERALES: InspeccionCampoWizard ahora importa actualizarInspeccionCampo e ImagePlus. BotonAusente ya no usa useTransition — usa async/await directo. VistaInformeCampo requiere props opcionales userId/peritoCalleId/isAdmin. Migración SQL debe ejecutarse en Supabase antes del deploy.
TESTEADO: TypeScript --noEmit OK.

FECHA: 27/03/2026
QUE SE CAMBIO: Fix Upload Blocker (falso positivo) + Auto-fill Ampliación
POR QUE: (1) El Upload Blocker mostraba "⏳ Esperando red... Subiendo 11 fotos" incluso con WiFi estable. El mensaje era genérico para fotos con errores de subida vs fotos que realmente estaban en carga activa, sin forma de reintentar o eliminar las fallidas desde el paso de firma. (2) Al vincular un caso como Ampliación, el formulario no copiaba los datos del caso original (patente, vehículo, taller, dirección, peritos), obligando a reingresarlos manualmente.
COMO: (1) Se separaron los contadores: `uploadingCount` (cargando activamente) y `failedCount` (errored). El botón de firma ahora muestra "Subiendo X fotos..." o "X fotos con error — Volvé para reintentar" según el caso. Se agregaron funciones `retryPhoto()` y `removePhoto()` con un banner de errores en el paso de firma que muestra miniatura, error, y botones Reintentar/Eliminar por foto. (2) Se expandió el API `/api/casos/check-siniestro` para devolver `taller_id, direccion_inspeccion, localidad, perito_calle_id, perito_carga_id, gestor_id`. Al hacer clic en "Vincular como Ampliación", se auto-rellenan todos los campos (solo si están vacíos, para no pisar ediciones manuales) y se setea tipo_inspeccion a "ampliacion".
ARCHIVOS AFECTADOS: InspeccionCampoWizard.tsx (upload blocker split + retry/remove), CasoForm.tsx (auto-fill ampliación), check-siniestro/route.ts (expanded query)
EFECTOS COLATERALES: Ninguno. Los campos auto-llenados son editables. El retry usa el preview URL (blob:) todavía en memoria.
TESTEADO: TypeScript --noEmit OK.

FECHA: 27/03/2026
QUE SE CAMBIO: Fix Completo de Honorarios — Corrección de lógica de facturación + backfill retroactivo.
POR QUE: (1) El anti-duplication guard trataba $0 (intencional, ej: ausente perito_carga) igual que NULL (nunca asignado), permitiendo re-asignación incorrecta. (2) Las migraciones retroactivas 029/031 asignaron montos usando precios que luego cambiaron. (3) guardarInspeccionCampo y complete/route.ts (inspección remota) no asignaban honorario de perito de calle al completar la inspección, dependiendo del safety net de ip_cerrada. (4) Cambiar a inspeccion_anulada no zeroeaba los montos ya asignados.
COMO: (A) Migración SQL 034_fix_honorarios_completo.sql: actualiza tabla precios con valores definitivos proporcionados por usuario, luego hace backfill completo de TODOS los casos — perito_calle basado en fecha_inspeccion_real, perito_carga+estudio basado en estado cerrado, anuladas en $0 y no-cerrados en NULL. (B) Guard anti-duplicación cambiado de `!monto || Number(monto) === 0` a `monto == null` en TODOS los puntos de asignación (marcarInspeccionRealizada, cambiarEstadoCaso, updateCasoRapido). Esto distingue $0 intencional de NULL nunca-asignado. (C) Agregada asignación de honorario perito calle en guardarInspeccionCampo (inspección presencial) y complete/route.ts (inspección remota) para que el billing se asigne en el MOMENTO correcto. (D) Agregado zeroing de los 3 montos al transicionar a inspeccion_anulada.
ARCHIVOS AFECTADOS: src/app/(dashboard)/casos/[id]/actions.ts (guards + anulada), src/app/(dashboard)/casos/actions.ts (updateCasoRapido guards + anulada), src/app/(dashboard)/inspeccion-campo/[casoId]/actions.ts (billing perito calle), src/app/api/inspeccion-remota/complete/route.ts (billing perito calle), supabase/migrations/034_fix_honorarios_completo.sql (nueva migración)
EFECTOS COLATERALES: (1) La migración RESETEA todos los montos de billing retroactivamente basándose en los valores actuales de precios. Casos no-cerrados tendrán perito_carga y estudio en NULL hasta que se cierren. (2) El guard null-only significa que si un monto fue asignado como $0 (ej: ausente perito_carga), ya NO se re-asignará automáticamente. Si se necesita cambiar, debe editarse manualmente. (3) IMPORTANTE: La migración 034 debe ejecutarse en Supabase SQL Editor ANTES del deploy.
TESTEADO: TypeScript --noEmit OK.

--- REGLAS DE NEGOCIO DEFINITIVAS DE HONORARIOS ---

PERITO DE CALLE — Se paga cuando la IP sale de ip_coordinada (inspección completada):
- AMPLIACION: $4.250
- AUSENTE: $2.550
- IP CAMIONES: $9.562
- IP CON ORDEN: $9.562
- IP FINAL INTERMEDIA: $4.250
- IP REMOTA: $8.000
- IP SIN ORDEN: $9.562
- POSIBLE DT: $9.562
- TERCEROS: $9.562

PERITO DE CARGA — Se paga cuando la IP llega a ip_cerrada:
- AMPLIACION: $2.000
- AUSENTE: $0
- IP CAMIONES: $8.925
- IP CON ORDEN: $8.925
- IP FINAL INTERMEDIA: $2.000
- IP REMOTA: $8.000
- IP SIN ORDEN: $8.925
- POSIBLE DT: $8.925
- TERCEROS: $8.925

EXCEPCION: inspeccion_anulada = nadie cobra ($0 para todos).
REGLA WRITE-ONCE: El monto se asigna UNA sola vez por siniestro (guard: monto == null).
AMPLIACIONES: Son casos independientes. Se pagan según su tipo_inspeccion (ampliacion).
DUAL ROLE: Un perito puede ser calle Y carga. Cada rol cobra por separado según la fecha de acción correspondiente.
TIMING: P.Calle se reconoce por fecha_inspeccion_real. P.Carga se reconoce por fecha_cierre.

FECHA: 15/04/2026
QUE SE CAMBIO: Sprint de Correcciones Operativas — 5 fixes + 1 migración SQL.
POR QUE: (1) Peritos de calle no podían crear tareas — el endpoint POST /api/tareas restringía a admin+carga, contradiciendo la DOC_TECNICA §5 y §8 que define que calle puede crear tareas. (2) El tablero Kanban de tareas no se actualizaba en tiempo real — requería F5 para ver cambios de otros usuarios. (3) Credenciales: peritos de carga recibían error RLS "new row violates row-level security policy for table herramientas_usuarios" al intentar crear credenciales. (4) Valores Ref: solo admin podía crear valores, carga debía poder también. (5) Parser Sancor: al ingresar patentes formato viejo (AAA000), la regex capturaba letras de la línea siguiente (ej: "ABC123FIA" en vez de "ABC123"). (6) El formulario "Nuevo caso" tenía "Modo secuencial" activado por defecto.
COMO: (1) api/tareas/route.ts: Agregado rol "calle" al check de permisos de creación de tareas. Se normalizó la lógica para usar roles[] array en vez de comparaciones individuales. (2) Creado TareasRealtimeWrapper.tsx: componente client que envuelve KanbanBoard y se suscribe a postgres_changes en tabla tareas. Al recibir un evento (INSERT/UPDATE/DELETE), llama router.refresh() para re-fetch server-side con los JOINs complejos intactos. tareas/page.tsx actualizado para usar el wrapper. Migración SQL 035: ALTER PUBLICATION supabase_realtime ADD TABLE tareas. (3) Migración SQL 035: DROP de políticas RLS existentes en herramientas_usuarios + creación de 4 políticas granulares (SELECT/INSERT/UPDATE/DELETE) que permiten admin Y carga, usando tanto rol (string legacy) como roles (array). (4) valores/page.tsx: Cambiado query de .select("rol") a .select("rol, roles"), canEdit = admin || carga. ValorFormDialog.tsx: Cambiado prop de userRole:string a canEdit:boolean, guard de userRole!=="admin" a !canEdit. (5) sancor.ts: Regex de patente cambiada de /[A-Z]{2,3}\s?[0-9]{3}\s?[A-Z]{0,3}/ (greedy) a dos alternativas explícitas con \b word boundary: formato nuevo /[A-Z]{2}\s?[0-9]{3}\s?[A-Z]{2}\b/ y formato viejo /[A-Z]{3}\s?[0-9]{3}\b/. (6) CasoForm.tsx: useState(true) → useState(false) para modoSecuencial.
ARCHIVOS AFECTADOS: src/app/api/tareas/route.ts, src/components/tareas/TareasRealtimeWrapper.tsx (NUEVO), src/app/(dashboard)/tareas/page.tsx, supabase/migrations/035_realtime_tareas_rls_credenciales.sql (NUEVO), src/app/(dashboard)/directorio/valores/page.tsx, src/components/directorio/ValorFormDialog.tsx, src/lib/parser/sancor.ts, src/components/casos/CasoForm.tsx
EFECTOS COLATERALES: (1) Peritos de calle ahora pueden crear tareas — las RLS de la tabla tareas ya permiten INSERT para usuarios autenticados (el guard estaba solo en la API route). (2) La suscripción realtime genera un router.refresh() por cada cambio en la tabla tareas de CUALQUIER usuario. En equipos grandes (>20 personas editando simultáneamente) esto podría generar re-renders frecuentes, pero para equipos pequeños es óptimo. (3) La migración 035 BORRA las políticas RLS existentes de herramientas_usuarios y las reemplaza. Debe ejecutarse en Supabase SQL Editor ANTES del deploy. (4) El regex de patente ahora es más estricto: solo acepta exactamente 6 chars (viejo: AAA000) o 7 chars (nuevo: AA000BB). Formatos irregulares o con espacios internos se normalizan.
TESTEADO: Pendiente TypeScript --noEmit.

FECHA: 17/04/2026
QUE SE CAMBIO: Módulo de Auditoría — Control de Rendimiento de Peritos
POR QUE: Se necesitaba un sistema de auditoría interna para monitorear el rendimiento de los peritos de calle, detectar desvíos (casos coordinados no inspeccionados), alertar sobre pendientes de presupuesto >24hs, calcular un score de efectividad mensual, generar informes diarios formateados para WhatsApp, y exportar reportes a PDF. El módulo es visible solo para admin/coordinador.
COMO: (1) Migración SQL 036_auditoria_modulo.sql: crea tablas informes_auditoria y scores_perito con RLS admin-only e índices. (2) Motor de cálculos compartido (auditoria-engine.ts): funciones puras para detección de desvíos, pendientes presupuesto, score de efectividad (fórmula: TASA - PEN_DESVIOS - PEN_PRESUPUESTO), generación de texto WhatsApp con emojis. (3) Server actions (auditoria/actions.ts): getDatosAuditoria(mes,anio), generarInformeDelDia(), getInformesHistoricos(), getScoresHistoricosPerito(). Usa verificarAdmin() guard. (4) AuditoriaPanel.tsx: componente client con vista general (cards por perito ordenadas por score con semáforo, tabla detallada con filtros y sort) y vista individual (score prominente, gráfico SVG de evolución, desglose detallado, listas de desvíos y pendientes, historial de scores). (5) InformeWhatsAppModal.tsx: modal oscuro con texto monospace y botón copiar al portapapeles. (6) HistorialInformes.tsx: lista de informes pasados con ver/copiar. (7) auditoria-pdf.ts: generación PDF client-side con jspdf + jspdf-autotable, página 1 resumen general + páginas por perito. (8) Cron endpoint /api/cron/informe-auditoria: protegido con CRON_SECRET, usa createAdminClient(), evalúa casos del día, guarda informe + upsert scores mensuales. (9) SidebarClient.tsx: agregado item "Auditoría" con icono ShieldCheck en sección Gestión, solo admin.
ARCHIVOS AFECTADOS: supabase/migrations/036_auditoria_modulo.sql (NUEVO), src/lib/auditoria-engine.ts (NUEVO), src/lib/auditoria-pdf.ts (NUEVO), src/app/(dashboard)/auditoria/actions.ts (NUEVO), src/app/(dashboard)/auditoria/page.tsx (NUEVO), src/components/auditoria/AuditoriaPanel.tsx (NUEVO), src/components/auditoria/InformeWhatsAppModal.tsx (NUEVO), src/components/auditoria/HistorialInformes.tsx (NUEVO), src/app/api/cron/informe-auditoria/route.ts (NUEVO), src/components/layout/SidebarClient.tsx (MODIFICADO: +ShieldCheck import, +SidebarItem Auditoría admin-only), package.json (MODIFICADO: +jspdf, +jspdf-autotable)
EFECTOS COLATERALES: (1) La migración 036 debe ejecutarse en Supabase SQL Editor antes del deploy. (2) El cron debe configurarse externamente (ej: cron-job.org) con URL /api/cron/informe-auditoria, header Authorization: Bearer {CRON_SECRET}, schedule 21:00 UTC lunes a viernes. (3) Dependencias nuevas: jspdf y jspdf-autotable. (4) El módulo NO afecta ningún flujo operativo existente — es lectura pura de datos + escritura a sus propias tablas.
TESTEADO: TypeScript --noEmit OK (0 errores).