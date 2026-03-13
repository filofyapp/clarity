-- Observaciones de la pericia: texto + audio desde inspección remota
ALTER TABLE casos ADD COLUMN IF NOT EXISTS observaciones_pericia TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS audio_pericia_url TEXT;
