-- ==============================================================================
-- MASTER RESET & SETUP SCRIPT FOR ALMA APP (CORREGIDO - ORDEN DE CREACIÓN)
-- ==============================================================================
-- ⚠️ ADVERTENCIA: ESTE SCRIPT BORRARÁ TODOS LOS DATOS DE LA APP
-- Ejecutar todo el contenido en el Editor SQL de Supabase.
-- ==============================================================================

-- 1. LIMPIEZA (DROP TABLES & FUNCTIONS)
-- ==============================================================================
DROP TABLE IF EXISTS public.gifts CASCADE;
DROP TABLE IF EXISTS public.fruits CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.tree_permissions CASCADE;
DROP TABLE IF EXISTS public.family_connections CASCADE;
DROP TABLE IF EXISTS public.trees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.get_tree_owner_id CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. CREACIÓN DE TABLAS (Sin RLS ni Policies todavía)
-- ==============================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  birth_date DATE,
  current_streak INTEGER DEFAULT 0,
  last_interaction_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Configuración avanzada (notificaciones, privacidad, etc.) almacenada como JSON
  settings JSONB,
  -- Marca de última actualización del perfil
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla TREES
CREATE TABLE public.trees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Mi Árbol',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla TREE_PERMISSIONS
CREATE TABLE public.tree_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email TEXT, 
  -- Quién concede el permiso (dueño del árbol). Redundante pero útil para consultas rápidas
  granter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Alcance del permiso: all (todo el árbol) o custom (ramas seleccionadas)
  scope TEXT DEFAULT 'all', 
  -- Lista de IDs de ramas permitidas cuando scope = 'custom'
  allowed_branch_ids TEXT[], 
  -- Nivel de acceso: view (solo lectura), contribute (puede añadir recuerdos)
  access_level TEXT DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla BRANCHES
CREATE TABLE public.branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla FRUITS
CREATE TABLE public.fruits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_urls TEXT[], 
  date TIMESTAMP WITH TIME ZONE, 
  is_shared BOOLEAN DEFAULT false,
  position JSONB DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla FAMILY_CONNECTIONS
CREATE TABLE public.family_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  relative_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  relation TEXT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla GIFTS
CREATE TABLE public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Permite enviar regalos a gente que aún no tiene cuenta (se identifica por email)
  recipient_email TEXT,
  type TEXT NOT NULL, 
  message TEXT,
  status TEXT DEFAULT 'pending', 
  content_data JSONB, 
  unlock_date TIMESTAMP WITH TIME ZONE,
  -- Indicador de si el regalo ya fue leído en la app
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREACIÓN DE FUNCIONES HELPER
-- ==============================================================================

-- Función para evitar recursión en RLS de trees/permissions
CREATE OR REPLACE FUNCTION public.get_tree_owner_id(t_id UUID)
RETURNS UUID AS $$
  SELECT owner_id FROM public.trees WHERE id = t_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. HABILITAR RLS Y CREAR POLÍTICAS
-- ==============================================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TREES
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver árboles: Dueño o Permiso Explícito" 
ON public.trees FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.tree_permissions 
    WHERE tree_permissions.tree_id = trees.id 
    AND (
      tree_permissions.recipient_id = auth.uid() 
      OR 
      tree_permissions.recipient_email = (auth.jwt() ->> 'email')
    )
  )
);

CREATE POLICY "Crear árboles: Solo dueños" 
ON public.trees FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Actualizar árboles: Solo dueños" 
ON public.trees FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Borrar árboles: Solo dueños" 
ON public.trees FOR DELETE USING (auth.uid() = owner_id);

-- TREE_PERMISSIONS
ALTER TABLE public.tree_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver permisos: Dueño del árbol o Receptor" 
ON public.tree_permissions FOR SELECT 
USING (
  get_tree_owner_id(tree_id) = auth.uid()
  OR 
  recipient_id = auth.uid()
);

CREATE POLICY "Gestionar permisos: Solo dueño del árbol" 
ON public.tree_permissions FOR ALL 
USING (
  get_tree_owner_id(tree_id) = auth.uid()
);

-- BRANCHES
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver ramas: Acceso al árbol padre" 
ON public.branches FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.trees WHERE trees.id = branches.tree_id)
);

CREATE POLICY "Gestionar ramas: Solo dueño del árbol" 
ON public.branches FOR ALL 
USING (
  get_tree_owner_id(tree_id) = auth.uid()
);

-- FRUITS
ALTER TABLE public.fruits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver frutos: Acceso a la rama padre" 
ON public.fruits FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.branches WHERE branches.id = fruits.branch_id)
);

CREATE POLICY "Gestionar frutos: Solo dueño del árbol" 
ON public.fruits FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.branches 
    WHERE branches.id = fruits.branch_id 
    AND get_tree_owner_id(branches.tree_id) = auth.uid()
  )
);

-- FAMILY_CONNECTIONS
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver conexiones: Usuario propio" 
ON public.family_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gestionar conexiones: Usuario propio" 
ON public.family_connections FOR ALL USING (auth.uid() = user_id);

-- GIFTS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver regalos: Enviados o Recibidos" 
ON public.gifts FOR SELECT USING (
  auth.uid() = sender_id
  OR auth.uid() = recipient_id
  OR recipient_email = (auth.jwt() ->> 'email')
);

CREATE POLICY "Crear regalos: Usuario autenticado" 
ON public.gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Actualizar regalos: Receptor (aceptar/rechazar)" 
ON public.gifts FOR UPDATE USING (auth.uid() = recipient_id);

-- 5. TRIGGERS
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para 'memories'
DROP POLICY IF EXISTS "Memories Images Public View" ON storage.objects;
CREATE POLICY "Memories Images Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'memories' );

DROP POLICY IF EXISTS "Memories Images Upload" ON storage.objects;
CREATE POLICY "Memories Images Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'memories' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Memories Images Update" ON storage.objects;
CREATE POLICY "Memories Images Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'memories' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Memories Images Delete" ON storage.objects;
CREATE POLICY "Memories Images Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'memories' AND auth.uid() = owner );

-- Políticas de Storage para 'avatars'
DROP POLICY IF EXISTS "Avatars Public View" ON storage.objects;
CREATE POLICY "Avatars Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Avatars Upload" ON storage.objects;
CREATE POLICY "Avatars Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Avatars Update" ON storage.objects;
CREATE POLICY "Avatars Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- FIN DEL SCRIPT
