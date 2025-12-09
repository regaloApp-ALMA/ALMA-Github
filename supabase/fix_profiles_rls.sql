-- ============================================
-- SCRIPT DE REPARACIÓN: RLS de PROFILES y TRIGGER
-- ============================================
-- Este script corrige las políticas de seguridad de la tabla profiles
-- para permitir que los usuarios accedan a su propio perfil.
-- Ejecuta este script completo en el Editor SQL de Supabase.
-- ============================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (para empezar limpio)
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. ASEGURAR QUE EL TRIGGER TENGA SECURITY DEFINER
-- ============================================
-- Esto es CRÍTICO: el trigger debe ejecutarse con permisos de superusuario
-- para poder insertar en profiles sin violar RLS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER -- ⚠️ CRÍTICO: Permite que el trigger tenga permisos elevados
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
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si el perfil ya existe
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. RECREAR EL TRIGGER (por si acaso)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. CREAR POLÍTICAS RLS CORRECTAS PARA PROFILES
-- ============================================

-- Asegurar que RLS esté habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: SELECT - Los usuarios pueden ver su propio perfil
-- ============================================
CREATE POLICY "Users can view own profile"
ON public.profiles 
FOR SELECT
USING (auth.uid() = id);

-- POLÍTICA 2: INSERT - Los usuarios pueden crear su propio perfil
-- ============================================
-- Esto es necesario como fallback si el trigger falla
CREATE POLICY "Users can insert own profile"
ON public.profiles 
FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLÍTICA 3: UPDATE - Los usuarios pueden actualizar su propio perfil
-- ============================================
CREATE POLICY "Users can update own profile"
ON public.profiles 
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- POLÍTICA 4: DELETE - Los usuarios pueden borrar su propio perfil (opcional)
-- ============================================
CREATE POLICY "Users can delete own profile"
ON public.profiles 
FOR DELETE
USING (auth.uid() = id);

-- 5. VERIFICACIÓN Y COMENTARIOS
-- ============================================
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function que crea automáticamente un perfil cuando se registra un nuevo usuario. 
Ejecuta con SECURITY DEFINER para tener permisos elevados y evitar conflictos con RLS.';

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'Permite que los usuarios vean su propio perfil usando auth.uid() = id';

COMMENT ON POLICY "Users can insert own profile" ON public.profiles IS 
'Permite que los usuarios creen su propio perfil como fallback si el trigger falla';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
'Permite que los usuarios actualicen su propio perfil';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Después de ejecutar este script:
-- 1. Intenta iniciar sesión de nuevo
-- 2. Si aún falla, verifica en Supabase Dashboard > Authentication > Policies
-- 3. Asegúrate de que el usuario esté autenticado correctamente

