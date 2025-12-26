-- ==============================================================================
-- CREACIÓN DE TABLA DE NOTIFICACIONES
-- ==============================================================================
-- Este script crea la tabla notifications para el sistema de notificaciones in-app
-- ==============================================================================

-- Crear tabla notifications si no existe
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('gift', 'family', 'system')),
    is_read BOOLEAN DEFAULT false,
    related_id UUID, -- ID del regalo, invitación, etc. relacionado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar notificaciones para sí mismos
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias notificaciones
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- ==============================================================================
-- FUNCIÓN PARA CREAR NOTIFICACIONES AUTOMÁTICAS
-- ==============================================================================

-- Función helper para crear notificaciones (puede ser llamada desde triggers o funciones)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- ==============================================================================
-- TRIGGERS PARA NOTIFICACIONES AUTOMÁTICAS (Opcional)
-- ==============================================================================

-- Ejemplo: Notificación cuando se recibe un regalo
-- (Se puede activar desde el código de la app en lugar de triggers)

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
-- 
-- VERIFICACIÓN POST-EJECUCIÓN:
-- 
-- 1. Verificar que la tabla existe:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_name = 'notifications';
--
-- 2. Verificar que las políticas están activas:
--    SELECT policyname, cmd FROM pg_policies 
--    WHERE schemaname = 'public' AND tablename = 'notifications';
--
-- ==============================================================================
