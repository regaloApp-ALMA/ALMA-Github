-- ==============================================================================
-- SCRIPT: Añadir columna STATUS a family_connections
-- ==============================================================================
-- Este script añade la columna 'status' a la tabla family_connections
-- para implementar el sistema de eliminación segura de raíces.
-- ==============================================================================

-- Añadir columna status si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'family_connections' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.family_connections
        ADD COLUMN status TEXT DEFAULT 'active' NOT NULL;
        
        -- Añadir constraint para validar valores permitidos
        ALTER TABLE public.family_connections
        ADD CONSTRAINT family_connections_status_check 
        CHECK (status IN ('active', 'pending_deletion'));
        
        -- Crear índice para mejorar consultas por status
        CREATE INDEX IF NOT EXISTS idx_family_connections_status 
        ON public.family_connections(status);
        
        -- Crear índice compuesto para consultas de solicitudes de eliminación
        CREATE INDEX IF NOT EXISTS idx_family_connections_relative_status 
        ON public.family_connections(relative_id, status) 
        WHERE status = 'pending_deletion';
        
        RAISE NOTICE '✅ Columna status añadida exitosamente a family_connections';
    ELSE
        RAISE NOTICE 'ℹ️ La columna status ya existe en family_connections';
    END IF;
END $$;

-- Comentario en la columna para documentación
COMMENT ON COLUMN public.family_connections.status IS 
'Estado de la conexión familiar: active (activa) o pending_deletion (pendiente de eliminación)';

