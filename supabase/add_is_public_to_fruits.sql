-- ==============================================================================
-- MIGRACIÓN: Añadir campo is_public a la tabla fruits
-- ==============================================================================
-- Este script añade el campo is_public (boolean, default true) a la tabla fruits
-- para permitir privacidad granular en los recuerdos (frutos).
-- ==============================================================================

-- Añadir columna is_public si no existe
ALTER TABLE public.fruits 
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Actualizar registros existentes para que sean públicos por defecto
UPDATE public.fruits 
    SET is_public = true 
    WHERE is_public IS NULL;

-- Asegurar que el campo no sea NULL
ALTER TABLE public.fruits 
    ALTER COLUMN is_public SET DEFAULT true,
    ALTER COLUMN is_public SET NOT NULL;

-- ==============================================================================
-- ACTUALIZAR POLÍTICAS RLS PARA RESPETAR is_public
-- ==============================================================================

-- Eliminar políticas antiguas de fruits
DROP POLICY IF EXISTS "Ver frutos: Acceso a la rama padre" ON public.fruits;
DROP POLICY IF EXISTS "Gestionar frutos: Solo dueño del árbol" ON public.fruits;

-- Nueva política para SELECT: 
-- - Dueño del árbol: Ve todo
-- - Visitante/Familiar: Solo ve frutos donde is_public = true
CREATE POLICY "Ver frutos: Acceso según privacidad" 
ON public.fruits FOR SELECT 
USING (
    -- Si soy el dueño del árbol, veo todo
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE branches.id = fruits.branch_id 
        AND get_tree_owner_id(branches.tree_id) = auth.uid()
    )
    OR
    -- Si no soy el dueño, solo veo frutos públicos
    (
        fruits.is_public = true
        AND EXISTS (
            SELECT 1 FROM public.branches 
            WHERE branches.id = fruits.branch_id
            AND EXISTS (
                SELECT 1 FROM public.trees
                WHERE trees.id = branches.tree_id
                AND (
                    -- Tengo permiso explícito en tree_permissions
                    EXISTS (
                        SELECT 1 FROM public.tree_permissions
                        WHERE tree_permissions.tree_id = trees.id
                        AND (
                            tree_permissions.recipient_id = auth.uid()
                            OR tree_permissions.recipient_email = (auth.jwt() ->> 'email')
                        )
                    )
                    OR
                    -- Soy familiar (tengo conexión familiar)
                    EXISTS (
                        SELECT 1 FROM public.family_connections
                        WHERE family_connections.user_id = auth.uid()
                        AND family_connections.relative_id = trees.owner_id
                        AND family_connections.status = 'active'
                    )
                )
            )
        )
    )
);

-- Política para INSERT/UPDATE/DELETE: Solo dueño del árbol
CREATE POLICY "Gestionar frutos: Solo dueño del árbol" 
ON public.fruits FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.branches 
        WHERE branches.id = fruits.branch_id 
        AND get_tree_owner_id(branches.tree_id) = auth.uid()
    )
);

-- ==============================================================================
-- FIN DE LA MIGRACIÓN
-- ==============================================================================
-- 
-- VERIFICACIÓN POST-EJECUCIÓN:
-- 
-- 1. Verificar que la columna existe:
--    SELECT column_name, data_type, column_default, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name = 'fruits' AND column_name = 'is_public';
--
-- 2. Verificar que las políticas están activas:
--    SELECT policyname, cmd FROM pg_policies 
--    WHERE schemaname = 'public' AND tablename = 'fruits';
--
-- ==============================================================================
