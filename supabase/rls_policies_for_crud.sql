-- ============================================
-- POLÍTICAS RLS (Row Level Security) PARA CRUD
-- ============================================
-- Este archivo contiene las políticas necesarias para que los usuarios
-- puedan crear, leer, actualizar y borrar sus propias ramas y frutos.
--
-- EJECUTAR EN SUPABASE SQL EDITOR:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este contenido
-- 3. Ejecuta el script completo
-- ============================================

-- ============================================
-- 1. POLÍTICAS PARA TABLA 'branches'
-- ============================================

-- Habilitar RLS en branches (si no está habilitado)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias ramas
DROP POLICY IF EXISTS "Users can view their own branches" ON branches;
CREATE POLICY "Users can view their own branches"
ON branches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- Política: Los usuarios pueden crear ramas en sus propios árboles
DROP POLICY IF EXISTS "Users can create branches in their own trees" ON branches;
CREATE POLICY "Users can create branches in their own trees"
ON branches
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- Política: Los usuarios pueden actualizar sus propias ramas
DROP POLICY IF EXISTS "Users can update their own branches" ON branches;
CREATE POLICY "Users can update their own branches"
ON branches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- Política: Los usuarios pueden borrar sus propias ramas
DROP POLICY IF EXISTS "Users can delete their own branches" ON branches;
CREATE POLICY "Users can delete their own branches"
ON branches
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM trees
    WHERE trees.id = branches.tree_id
    AND trees.owner_id = auth.uid()
  )
);

-- ============================================
-- 2. POLÍTICAS PARA TABLA 'fruits'
-- ============================================

-- Habilitar RLS en fruits (si no está habilitado)
ALTER TABLE fruits ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver frutos de sus propias ramas
-- Y también frutos públicos de ramas compartidas
DROP POLICY IF EXISTS "Users can view fruits from their own branches or public fruits" ON fruits;
CREATE POLICY "Users can view fruits from their own branches or public fruits"
ON fruits
FOR SELECT
USING (
  -- El usuario es dueño de la rama
  EXISTS (
    SELECT 1 FROM branches
    INNER JOIN trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
  OR
  -- El fruto es público (is_public = true)
  (fruits.is_public = true)
);

-- Política: Los usuarios pueden crear frutos en sus propias ramas
DROP POLICY IF EXISTS "Users can create fruits in their own branches" ON fruits;
CREATE POLICY "Users can create fruits in their own branches"
ON fruits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM branches
    INNER JOIN trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- Política: Los usuarios pueden actualizar sus propios frutos
DROP POLICY IF EXISTS "Users can update their own fruits" ON fruits;
CREATE POLICY "Users can update their own fruits"
ON fruits
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM branches
    INNER JOIN trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM branches
    INNER JOIN trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- Política: Los usuarios pueden borrar sus propios frutos
DROP POLICY IF EXISTS "Users can delete their own fruits" ON fruits;
CREATE POLICY "Users can delete their own fruits"
ON fruits
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM branches
    INNER JOIN trees ON trees.id = branches.tree_id
    WHERE branches.id = fruits.branch_id
    AND trees.owner_id = auth.uid()
  )
);

-- ============================================
-- 3. VERIFICACIÓN DE POLÍTICAS
-- ============================================

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('branches', 'fruits');

-- Ver todas las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('branches', 'fruits')
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Estas políticas asumen que:
--    - La tabla 'trees' tiene una columna 'owner_id' que referencia a auth.uid()
--    - La tabla 'branches' tiene una columna 'tree_id' que referencia a 'trees.id'
--    - La tabla 'fruits' tiene una columna 'branch_id' que referencia a 'branches.id'
--    - La tabla 'fruits' tiene una columna 'is_public' (boolean)
--
-- 2. Si tus tablas tienen nombres diferentes o estructuras diferentes,
--    ajusta las políticas según corresponda.
--
-- 3. Después de ejecutar este script, prueba las operaciones CRUD desde la app
--    y verifica en los logs de Supabase que las políticas funcionan correctamente.
--
-- 4. Si sigues teniendo problemas de permisos, verifica:
--    - Que el usuario esté autenticado (auth.uid() no es null)
--    - Que las relaciones entre tablas sean correctas
--    - Que los nombres de las columnas coincidan con tu esquema
-- ============================================

