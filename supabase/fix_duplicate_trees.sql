-- ==============================================================================
-- SCRIPT PARA ARREGLAR ÁRBOLES DUPLICADOS Y AGREGAR RESTRICCIÓN UNIQUE
-- ==============================================================================
-- ⚠️ IMPORTANTE: Ejecutar este script en el Editor SQL de Supabase
-- Este script:
-- 1. Elimina árboles duplicados (mantiene solo el más antiguo por usuario)
-- 2. Mueve todas las ramas y frutos al árbol que se mantiene
-- 3. Agrega una restricción UNIQUE en owner_id para prevenir duplicados futuros
-- ==============================================================================

-- PASO 1: Identificar y eliminar árboles duplicados
-- Mantener solo el árbol más antiguo de cada usuario
DO $$
DECLARE
    user_record RECORD;
    oldest_tree_id UUID;
    duplicate_tree_ids UUID[];
BEGIN
    -- Iterar sobre cada usuario que tiene múltiples árboles
    FOR user_record IN 
        SELECT owner_id, COUNT(*) as tree_count
        FROM public.trees
        GROUP BY owner_id
        HAVING COUNT(*) > 1
    LOOP
        -- Obtener el ID del árbol más antiguo (el que se mantendrá)
        SELECT id INTO oldest_tree_id
        FROM public.trees
        WHERE owner_id = user_record.owner_id
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Obtener IDs de árboles duplicados (todos excepto el más antiguo)
        SELECT ARRAY_AGG(id) INTO duplicate_tree_ids
        FROM public.trees
        WHERE owner_id = user_record.owner_id
        AND id != oldest_tree_id;
        
        -- Mover todas las ramas de árboles duplicados al árbol principal
        UPDATE public.branches
        SET tree_id = oldest_tree_id
        WHERE tree_id = ANY(duplicate_tree_ids);
        
        -- Mover todos los permisos de árboles duplicados al árbol principal
        UPDATE public.tree_permissions
        SET tree_id = oldest_tree_id
        WHERE tree_id = ANY(duplicate_tree_ids);
        
        -- Eliminar árboles duplicados
        DELETE FROM public.trees
        WHERE id = ANY(duplicate_tree_ids);
        
        RAISE NOTICE 'Usuario %: Mantenido árbol %, eliminados % árboles duplicados', 
            user_record.owner_id, oldest_tree_id, array_length(duplicate_tree_ids, 1);
    END LOOP;
END $$;

-- PASO 2: Agregar restricción UNIQUE en owner_id para prevenir duplicados futuros
-- Primero verificar si ya existe la restricción
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'trees_owner_id_unique'
    ) THEN
        ALTER TABLE public.trees
        ADD CONSTRAINT trees_owner_id_unique UNIQUE (owner_id);
        
        RAISE NOTICE 'Restricción UNIQUE agregada en owner_id';
    ELSE
        RAISE NOTICE 'La restricción UNIQUE ya existe';
    END IF;
END $$;

-- PASO 3: Verificar que no queden duplicados
SELECT 
    owner_id,
    COUNT(*) as tree_count,
    ARRAY_AGG(id ORDER BY created_at) as tree_ids
FROM public.trees
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- Si esta query no devuelve resultados, significa que no hay duplicados
-- Si devuelve resultados, ejecutar el script nuevamente

