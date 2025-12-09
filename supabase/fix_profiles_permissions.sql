-- ==============================================================================
-- SCRIPT DE REPARACIÓN: Políticas RLS de PROFILES
-- ==============================================================================
-- Este script arregla el error 42501 "permission denied for table profiles"
-- Ejecuta este script completo en el Editor SQL de Supabase.
-- ==============================================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DE PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- 2. RECREAR EL TRIGGER CON PERMISOS CORRECTOS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Usuario'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. RECREAR LAS POLÍTICAS RLS (VERSIÓN QUE FUNCIONABA)
-- ==============================================================================

-- ⚠️ CLAVE: Política pública que permite ver TODOS los perfiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. VERIFICAR QUE RLS ESTÉ HABILITADO
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. VERIFICACIÓN (Opcional - puedes ejecutar esto después para confirmar)
-- ==============================================================================
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'profiles';

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
-- 
-- Después de ejecutar este script:
-- 1. Cierra y vuelve a abrir la app
-- 2. Intenta iniciar sesión de nuevo
-- 3. Si aún falla, verifica que el trigger esté activo ejecutando:
--    SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- ==============================================================================

