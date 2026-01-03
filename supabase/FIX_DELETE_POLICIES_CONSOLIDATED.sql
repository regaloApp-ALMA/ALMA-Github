-- ==============================================================================
-- SCRIPT CONSOLIDADO: ARREGLAR POLÍTICAS RLS PARA BORRADO Y CRUD COMPLETO
-- ==============================================================================
-- ⚠️ IMPORTANTE: Este script elimina TODAS las políticas existentes y crea
-- políticas limpias y consistentes para branches y fruits.
-- Ejecuta este script COMPLETO en el Editor SQL de Supabase.
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: LIMPIAR TODAS LAS POLÍTICAS EXISTENTES
-- ==============================================================================

-- Eliminar TODAS las políticas de BRANCHES
DROP POLICY IF EXISTS "Ver ramas: Acceso al árbol padre" ON public.branches;
DROP POLICY IF EXISTS "Gestionar ramas: Solo dueño del árbol" ON public.branches;
DROP POLICY IF EXISTS "Users can view their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can create branches in their own trees" ON public.branches;
DROP POLICY IF EXISTS "Users can update their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can delete their own branches" ON public.branches;
DROP POLICY IF EXISTS "Owner can delete branches" ON public.branches;
DROP POLICY IF EXISTS "Owner can update branches" ON public.branches;
DROP POLICY IF EXISTS "Nuclear delete branches" ON public.branches;

-- Eliminar TODAS las políticas de FRUITS
DROP POLICY IF EXISTS "Ver frutos: Acceso a la rama padre" ON public.fruits;
DROP POLICY IF EXISTS "Ver frutos: Acceso según privacidad" ON public.fruits;
DROP POLICY IF EXISTS "Gestionar frutos: Solo dueño del árbol" ON public.fruits;
DROP POLICY IF EXISTS "Users can view fruits from their own branches or public fruits" ON public.fruits;
DROP POLICY IF EXISTS "Users can create fruits in their own branches" ON public.fruits;
DROP POLICY IF EXISTS "Users can update their own fruits" ON public.fruits;
DROP POLICY IF EXISTS "Users can delete their own fruits" ON public.fruits;
DROP POLICY IF EXISTS "Owner can delete fruits" ON public.fruits;
DROP POLICY IF EXISTS "Owner can update fruits" ON public.fruits;
DROP POLICY IF EXISTS "Nuclear delete fruits" ON public.fruits;

-- ==============================================================================
-- PARTE 2: VERIFICAR QUE RLS ESTÉ HABILITADO
-- ==============================================================================

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fruits ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PARTE 3: CREAR POLÍTICAS LIMPIAS PARA BRANCHES
-- ==============================================================================

-- SELECT: Ver ramas si tengo acceso al árbol (dueño o con permiso)
CREATE POLICY "branches_select"
ON public.branches FOR SELECT
USING (
  -- Soy dueño del árbol
  EXISTS (
    SELECT 1 FROM public.trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
  OR
  -- Tengo permiso explícito en tree_permissions
  EXISTS (
    SELECT 1 FROM public.tree_permissions
    WHERE tree_permissions.tree_id = branches.tree_id
    AND (
      tree_permissions.recipient_id = auth.uid()
      OR tree_permissions.recipient_email = (auth.jwt() ->> 'email')
    )
  )
);

-- INSERT: Crear ramas solo si soy dueño del árbol
CREATE POLICY "branches_insert"
ON public.branches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- UPDATE: Actualizar ramas solo si soy dueño del árbol
CREATE POLICY "branches_update"
ON public.branches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- DELETE: Borrar ramas solo si soy dueño del árbol
CREATE POLICY "branches_delete"
ON public.branches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- ==============================================================================
-- PARTE 4: CREAR POLÍTICAS LIMPIAS PARA FRUITS
-- ==============================================================================

-- SELECT: Ver frutos según privacidad y permisos
CREATE POLICY "fruits_select"
ON public.fruits FOR SELECT
USING (
  -- Si soy el dueño del árbol, veo todo
  EXISTS (
    SELECT 1 FROM public.branches
    INNER JOIN public.trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
  OR
  -- Si no soy el dueño, solo veo frutos públicos Y tengo acceso al árbol
  (
    fruits.is_public = true
    AND EXISTS (
      SELECT 1 FROM public.branches
      INNER JOIN public.trees ON trees.id = branches.tree_id
      WHERE branches.id = fruits.branch_id
      AND (
        -- Tengo permiso explícito
        EXISTS (
          SELECT 1 FROM public.tree_permissions
          WHERE tree_permissions.tree_id = trees.id
          AND (
            tree_permissions.recipient_id = auth.uid()
            OR tree_permissions.recipient_email = (auth.jwt() ->> 'email')
          )
        )
        OR
        -- Soy familiar
        EXISTS (
          SELECT 1 FROM public.family_connections
          WHERE family_connections.user_id = auth.uid()
          AND family_connections.relative_id = trees.owner_id
          AND family_connections.status = 'active'
        )
      )
    )
  )
);

-- INSERT: Crear frutos solo si soy dueño del árbol
CREATE POLICY "fruits_insert"
ON public.fruits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.branches
    INNER JOIN public.trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- UPDATE: Actualizar frutos solo si soy dueño del árbol
CREATE POLICY "fruits_update"
ON public.fruits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.branches
    INNER JOIN public.trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.branches
    INNER JOIN public.trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- DELETE: Borrar frutos solo si soy dueño del árbol
-- ⚠️ ESTA ES LA POLÍTICA CRÍTICA PARA EL BORRADO
CREATE POLICY "fruits_delete"
ON public.fruits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.branches
    INNER JOIN public.trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- ==============================================================================
-- PARTE 5: VERIFICACIÓN
-- ==============================================================================

-- Verificar que RLS está habilitado
SELECT 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as estado
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'fruits');

-- Ver todas las políticas creadas
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 Ver'
    WHEN cmd = 'INSERT' THEN '➕ Crear'
    WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
    WHEN cmd = 'DELETE' THEN '🗑️ Borrar'
    WHEN cmd = 'ALL' THEN '🔧 Todas'
    ELSE cmd
  END as operacion
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'fruits')
ORDER BY tablename, 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END;

-- ==============================================================================
-- PARTE 6: TEST DE PERMISOS (Opcional - ejecutar después de probar)
-- ==============================================================================
-- 
-- Para probar que las políticas funcionan, ejecuta estas queries como usuario autenticado:
--
-- 1. Verificar que puedes ver tus propias ramas:
--    SELECT id, name FROM branches LIMIT 5;
--
-- 2. Verificar que puedes ver tus propios frutos:
--    SELECT id, title FROM fruits LIMIT 5;
--
-- 3. Intentar borrar una rama (debe funcionar si eres dueño):
--    DELETE FROM branches WHERE id = 'TU_BRANCH_ID';
--
-- 4. Intentar borrar un fruto (debe funcionar si eres dueño):
--    DELETE FROM fruits WHERE id = 'TU_FRUIT_ID';
--
-- Si alguna de estas operaciones falla con error 42501, verifica:
-- - Que estés autenticado (SELECT auth.uid(); debe devolver tu UUID)
-- - Que el árbol pertenezca a tu usuario
-- - Que las políticas estén activas (ver query de verificación arriba)
--
-- ==============================================================================

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
-- 
-- DESPUÉS DE EJECUTAR:
-- 1. Verifica que no hay errores en la ejecución
-- 2. Revisa los resultados de las queries de verificación
-- 3. Prueba el borrado desde la app
-- 4. Si aún falla, revisa los logs de Supabase para ver el error exacto
--
-- ==============================================================================

