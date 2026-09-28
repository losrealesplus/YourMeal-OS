-- ============================================================================
-- YOURMEAL OS — FIX STUDY_DECISIONS RLS TENANT ISOLATION
-- Replaces defective es.tenant_id = auth.uid() with canonical tenant_members join
-- ============================================================================

DROP POLICY IF EXISTS study_decisions_tenant_isolation ON public.study_decisions;

CREATE POLICY study_decisions_tenant_isolation ON public.study_decisions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_decisions.version_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_decisions.version_id
        AND tm.user_id = auth.uid()
    )
  );
