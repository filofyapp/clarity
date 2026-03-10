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
| Drag and drop tarjetas | Kanban (@dnd-kit) | Cambia estado tarea al soltar | Participantes + Admin |
| Filtro tareas | Tablero tareas | Todas / Asignadas a mi / Creadas por mi | Todos |
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

FECHA: **10/03/2026 - UX Refactor Radical: Grilla Anatómica del Selector de Daño (Inspección Remota)**
- **QUE SE CAMBIO**: Se eliminó totalmente la silueta SVG del auto vista desde arriba (top-down) en `SelectorZonaDanio.tsx`. Se implementó una "Grilla Anatómica" de 3 columnas (UI Grid) con botones masivos (touch targets > 60px) distribuyendo el auto en Frente, Lateral y Trasera. Se ató el diccionario `ZONAS_MAP` a nuevas claves modulares (incluyendo ópticas independientes).
- **POR QUE**: A pedido del usuario, el mapa SVG requería demasiada abstracción espacial y no era a prueba de fallos para personas mayores o usuarios ajenos a la tecnología (Asegurados standard). La grilla por texto categorizado + botones emula el patrón intuitivo de una calculadora o tablero simple.
- **COMO**: Sustitución total en `SelectorZonaDanio.tsx` usando Tailwind `grid-cols-[1fr_1.8fr_1fr]` para imitar la jerarquía de un coche sin llegar a dibujarlo. Se incorporó feedback visual Magenta para los "active-states".
- **ARCHIVOS AFECTADOS**: `src/components/inspeccion-remota/SelectorZonaDanio.tsx`.
- **EFECTOS COLATERALES**: Ninguno negativo. La data de `zonasDanio` enviada al Wizard (`WizardCaptura.tsx`) sigue siendo el array de strings con IDs, pero ahora mucho más rico e intuitivo gracias a las ópticas desglosadas.
- **TESTEADO**: Se compilaron sin errores las nuevas Props locales.

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

## 10. PROBLEMAS CONOCIDOS Y SOLUCIONES APLICADAS

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

Documento vivo. Ultima actualizacion: Marzo 2026 - v4 (alineado con Supabase real)