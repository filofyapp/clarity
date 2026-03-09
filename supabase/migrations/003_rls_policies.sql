-- Casos
CREATE POLICY "visibilidad_casos" ON casos FOR SELECT USING (
  (auth.jwt() ->> 'rol' = 'admin')
  OR (auth.jwt() ->> 'rol' = 'calle' AND perito_calle_id = auth.uid())
  OR (auth.jwt() ->> 'rol' = 'carga' AND perito_carga_id = auth.uid())
);

-- Fotos lectura
CREATE POLICY "fotos_lectura" ON fotos_inspeccion FOR SELECT USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = fotos_inspeccion.caso_id
    AND ((auth.jwt() ->> 'rol' = 'admin') OR (casos.perito_calle_id = auth.uid()) OR (casos.perito_carga_id = auth.uid())))
);

-- Fotos upload
CREATE POLICY "fotos_upload" ON fotos_inspeccion FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = fotos_inspeccion.caso_id
    AND (casos.perito_calle_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')))
);

-- Informes lectura
CREATE POLICY "informes_lectura" ON informes_periciales FOR SELECT USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = informes_periciales.caso_id
    AND ((auth.jwt() ->> 'rol' = 'admin') OR (casos.perito_calle_id = auth.uid()) OR (casos.perito_carga_id = auth.uid())))
);

-- Informes edición
CREATE POLICY "informes_edicion" ON informes_periciales FOR ALL USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = informes_periciales.caso_id
    AND (casos.perito_calle_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')))
);

-- Tareas
CREATE POLICY "tareas_visibilidad" ON tareas FOR SELECT USING (
  asignado_id = auth.uid() OR creador_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')
);

-- Talleres: todos leen, admin+carga editan
CREATE POLICY "talleres_lectura" ON talleres FOR SELECT USING (true);
CREATE POLICY "talleres_edicion" ON talleres FOR ALL USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

-- Gestores: admin+carga leen, admin edita
CREATE POLICY "gestores_lectura" ON gestores FOR SELECT USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));
CREATE POLICY "gestores_edicion" ON gestores FOR ALL USING (auth.jwt() ->> 'rol' = 'admin');

-- Repuesteros: admin+carga
CREATE POLICY "repuesteros_acceso" ON repuesteros FOR ALL USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

-- Precios: solo admin
CREATE POLICY "precios_admin" ON precios FOR ALL USING (auth.jwt() ->> 'rol' = 'admin');
