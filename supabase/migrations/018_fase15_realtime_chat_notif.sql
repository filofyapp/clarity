-- ==============================================================================
-- 018_fase15_realtime_chat_notif.sql
-- Fase 15: Fix de Retrasos Visuales en Notificaciones y Chat (Realtime)
-- ==============================================================================
-- Esta migración agrega las tablas faltantes al canal "supabase_realtime"
-- para que los eventos INSERT, UPDATE y DELETE disparen notificaciones
-- en vivo hacia el frontend sin necesidad de recargar la página.

BEGIN;

-- Agregamos las tablas a la publicación de realtime si no estaban.
-- En PostgreSQL 10+, ALTER PUBLICATION ignora las tablas que ya están en la publicación 
-- pero da error si no existe la tabla o si falla la sintaxis combinada. 
-- Para ser seguros, en Supabase usualmente agregamos así:

ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE comentarios_tarea;
ALTER PUBLICATION supabase_realtime ADD TABLE fotos_inspeccion;

COMMIT;
