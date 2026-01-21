-- =============================================
-- Aggiorna RLS Policy per Movements
-- =============================================
-- Gli utenti normali vedono solo i propri movimenti
-- I superuser vedono tutti i movimenti

-- Rimuovi la vecchia policy
DROP POLICY IF EXISTS "Authenticated users can view movements" ON movements;

-- Crea nuova policy: utenti vedono solo i propri, superuser vedono tutto
CREATE POLICY "Users view own movements, superusers view all" ON movements
  FOR SELECT USING (
    operator_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Verifica
SELECT
  policyname,
  cmd,
  qual::text as policy_condition
FROM pg_policies
WHERE tablename = 'movements';
