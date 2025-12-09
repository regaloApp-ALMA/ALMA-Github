-- ==============================================================================
-- SCRIPT SQL COMPLETO Y ÚNICO PARA ALMA APP
-- ==============================================================================
-- Este script crea y configura TODA la estructura de la base de datos
-- Basado en la versión que funcionaba perfectamente
-- Ejecuta este script completo en el Editor SQL de Supabase.
-- ==============================================================================

-- ==============================================================================
-- 1. CREACIÓN DE TABLAS (Si no existen)
-- ==============================================================================

-- TABLA PROFILES (Perfiles de usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    birth_date DATE,
    tree_id UUID,
    connections TEXT[] DEFAULT '{}',
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_interaction_date DATE,
    ai_usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    settings JSONB
);

-- TABLA TREES (Árboles genealógicos)
CREATE TABLE IF NOT EXISTS public.trees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT DEFAULT 'Mi Árbol',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA TREE_PERMISSIONS (Permisos de árboles compartidos)
CREATE TABLE IF NOT EXISTS public.tree_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_email TEXT,
    granter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scope TEXT DEFAULT 'all',
    allowed_branch_ids TEXT[],
    access_level TEXT DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA BRANCHES (Ramas/Categorías del árbol)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    is_shared BOOLEAN DEFAULT false,
    position JSONB DEFAULT '{"x": 0, "y": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA FRUITS (Recuerdos/Frutos)
CREATE TABLE IF NOT EXISTS public.fruits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    media_urls TEXT[],
    date TIMESTAMP WITH TIME ZONE,
    is_shared BOOLEAN DEFAULT false,
    position JSONB DEFAULT '{"x": 0, "y": 0}',
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA FAMILY_CONNECTIONS (Conexiones familiares)
CREATE TABLE IF NOT EXISTS public.family_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    relative_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLA GIFTS (Regalos/Cápsulas del tiempo)
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_email TEXT,
    type TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    content_data JSONB,
    unlock_date TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. AÑADIR COLUMNAS FALTANTES (Si no existen)
-- ==============================================================================

-- PROFILES
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_interaction_date DATE,
    ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tree_id UUID,
    ADD COLUMN IF NOT EXISTS connections TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS settings JSONB,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- BRANCHES
ALTER TABLE public.branches 
    ADD COLUMN IF NOT EXISTS position JSONB DEFAULT '{"x": 0, "y": 0}',
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- FRUITS
ALTER TABLE public.fruits 
    ADD COLUMN IF NOT EXISTS position JSONB DEFAULT '{"x": 0, "y": 0}',
    ADD COLUMN IF NOT EXISTS location JSONB,
    ADD COLUMN IF NOT EXISTS media_urls TEXT[],
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- TREES
ALTER TABLE public.trees 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- ==============================================================================
-- 3. CREACIÓN DE ÍNDICES (Para rendimiento)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_branches_tree_id ON public.branches(tree_id);
CREATE INDEX IF NOT EXISTS idx_fruits_branch_id ON public.fruits(branch_id);
CREATE INDEX IF NOT EXISTS idx_fruits_date ON public.fruits(date DESC);
CREATE INDEX IF NOT EXISTS idx_trees_owner_id ON public.trees(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_user_id ON public.family_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_relative_id ON public.family_connections(relative_id);
CREATE INDEX IF NOT EXISTS idx_tree_permissions_tree_id ON public.tree_permissions(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_permissions_recipient ON public.tree_permissions(recipient_id, recipient_email);
CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON public.gifts(recipient_id, recipient_email);

-- ==============================================================================
-- 4. FUNCIONES HELPER
-- ==============================================================================

-- Función para evitar recursión en RLS de trees/permissions
CREATE OR REPLACE FUNCTION public.get_tree_owner_id(t_id UUID)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.trees WHERE id = t_id;
$$ LANGUAGE sql;

-- Función para crear perfil automáticamente (VERSIÓN QUE FUNCIONABA)
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
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 5. TRIGGERS
-- ==============================================================================

-- Trigger para crear perfil automáticamente al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers para updated_at automático
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trees_updated_at ON public.trees;
CREATE TRIGGER update_trees_updated_at
    BEFORE UPDATE ON public.trees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fruits_updated_at ON public.fruits;
CREATE TRIGGER update_fruits_updated_at
    BEFORE UPDATE ON public.fruits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURIDAD
-- ==============================================================================

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fruits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS PARA PROFILES (VERSIÓN QUE FUNCIONABA)
-- ==============================================================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- ⚠️ CLAVE: Política que permite ver todos los perfiles (como funcionaba antes)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==============================================================================
-- POLÍTICAS PARA TREES
-- ==============================================================================

DROP POLICY IF EXISTS "Ver árboles: Dueño o Permiso Explícito" ON public.trees;
DROP POLICY IF EXISTS "Users can view own trees" ON public.trees;
DROP POLICY IF EXISTS "Crear árboles: Solo dueños" ON public.trees;
DROP POLICY IF EXISTS "Users can create own trees" ON public.trees;
DROP POLICY IF EXISTS "Actualizar árboles: Solo dueños" ON public.trees;
DROP POLICY IF EXISTS "Users can update own trees" ON public.trees;
DROP POLICY IF EXISTS "Borrar árboles: Solo dueños" ON public.trees;
DROP POLICY IF EXISTS "Users can delete own trees" ON public.trees;

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

-- ==============================================================================
-- POLÍTICAS PARA TREE_PERMISSIONS
-- ==============================================================================

DROP POLICY IF EXISTS "Ver permisos: Dueño del árbol o Receptor" ON public.tree_permissions;
DROP POLICY IF EXISTS "Gestionar permisos: Solo dueño del árbol" ON public.tree_permissions;
DROP POLICY IF EXISTS "Users can view tree permissions" ON public.tree_permissions;
DROP POLICY IF EXISTS "Tree owners can manage permissions" ON public.tree_permissions;

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

-- ==============================================================================
-- POLÍTICAS PARA BRANCHES
-- ==============================================================================

DROP POLICY IF EXISTS "Ver ramas: Acceso al árbol padre" ON public.branches;
DROP POLICY IF EXISTS "Gestionar ramas: Solo dueño del árbol" ON public.branches;
DROP POLICY IF EXISTS "Users can view branches of own trees" ON public.branches;
DROP POLICY IF EXISTS "Users can create branches in own trees" ON public.branches;
DROP POLICY IF EXISTS "Users can update branches in own trees" ON public.branches;
DROP POLICY IF EXISTS "Users can delete branches in own trees" ON public.branches;

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

-- ==============================================================================
-- POLÍTICAS PARA FRUITS
-- ==============================================================================

DROP POLICY IF EXISTS "Ver frutos: Acceso a la rama padre" ON public.fruits;
DROP POLICY IF EXISTS "Gestionar frutos: Solo dueño del árbol" ON public.fruits;
DROP POLICY IF EXISTS "Users can view fruits of own trees" ON public.fruits;
DROP POLICY IF EXISTS "Users can create fruits in own trees" ON public.fruits;
DROP POLICY IF EXISTS "Users can update fruits in own trees" ON public.fruits;
DROP POLICY IF EXISTS "Users can delete fruits in own trees" ON public.fruits;

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

-- ==============================================================================
-- POLÍTICAS PARA FAMILY_CONNECTIONS
-- ==============================================================================

DROP POLICY IF EXISTS "Ver conexiones: Usuario propio" ON public.family_connections;
DROP POLICY IF EXISTS "Gestionar conexiones: Usuario propio" ON public.family_connections;
DROP POLICY IF EXISTS "Users can view own family connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can create own family connections" ON public.family_connections;
DROP POLICY IF EXISTS "Users can delete own family connections" ON public.family_connections;

CREATE POLICY "Ver conexiones: Usuario propio" 
ON public.family_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gestionar conexiones: Usuario propio" 
ON public.family_connections FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- POLÍTICAS PARA GIFTS
-- ==============================================================================

DROP POLICY IF EXISTS "Ver regalos: Enviados o Recibidos" ON public.gifts;
DROP POLICY IF EXISTS "Crear regalos: Usuario autenticado" ON public.gifts;
DROP POLICY IF EXISTS "Actualizar regalos: Receptor (aceptar/rechazar)" ON public.gifts;
DROP POLICY IF EXISTS "Users can view own gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can create gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can update own gifts" ON public.gifts;

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

-- ==============================================================================
-- 7. STORAGE BUCKETS Y POLÍTICAS
-- ==============================================================================

-- Crear buckets si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- POLÍTICAS DE STORAGE PARA 'memories'
-- ==============================================================================

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

-- ==============================================================================
-- POLÍTICAS DE STORAGE PARA 'avatars'
-- ==============================================================================

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

DROP POLICY IF EXISTS "Avatars Delete" ON storage.objects;
CREATE POLICY "Avatars Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
-- 
-- Este script restaura la configuración que funcionaba perfectamente.
-- La clave es la política "Public profiles are viewable by everyone" que permite
-- que todos puedan ver los perfiles, evitando errores de permisos.
--
-- VERIFICACIÓN POST-EJECUCIÓN:
-- 
-- 1. Verifica que la política de profiles permite SELECT público:
--    SELECT policyname, cmd FROM pg_policies 
--    WHERE schemaname = 'public' AND tablename = 'profiles';
--
-- 2. Verifica que el trigger está activo:
--    SELECT tgname, tgenabled FROM pg_trigger 
--    WHERE tgname = 'on_auth_user_created';
--
-- ==============================================================================
