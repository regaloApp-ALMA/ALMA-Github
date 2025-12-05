-- ==============================================================================
-- SCHEMA PARA HISTORIAL DE CHATS CON IA
-- ==============================================================================
-- Este schema permite guardar conversaciones con el asistente IA
-- para mantener contexto y permitir al usuario revisar historial
-- ==============================================================================

-- Tabla AI_CHATS: Almacena cada sesión de chat
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT, -- Título generado automáticamente o por el usuario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla AI_MESSAGES: Almacena cada mensaje dentro de un chat
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  -- Campos opcionales para futuras mejoras (imágenes, videos)
  media_urls TEXT[], -- Array de URLs de imágenes/videos adjuntos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON public.ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_created_at ON public.ai_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_chat_id ON public.ai_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ai_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_chats
  SET updated_at = timezone('utc'::text, now())
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at cuando se añade un mensaje
CREATE TRIGGER trigger_update_ai_chat_updated_at
AFTER INSERT ON public.ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_ai_chat_updated_at();

-- ==============================================================================
-- RLS (Row Level Security) Policies
-- ==============================================================================

-- Habilitar RLS
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios chats
CREATE POLICY "Users can view their own chats"
ON public.ai_chats
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear sus propios chats
CREATE POLICY "Users can create their own chats"
ON public.ai_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios chats
CREATE POLICY "Users can update their own chats"
ON public.ai_chats
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios chats
CREATE POLICY "Users can delete their own chats"
ON public.ai_chats
FOR DELETE
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden ver mensajes de sus propios chats
CREATE POLICY "Users can view messages from their own chats"
ON public.ai_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE ai_chats.id = ai_messages.chat_id
    AND ai_chats.user_id = auth.uid()
  )
);

-- Política: Los usuarios solo pueden crear mensajes en sus propios chats
CREATE POLICY "Users can create messages in their own chats"
ON public.ai_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE ai_chats.id = ai_messages.chat_id
    AND ai_chats.user_id = auth.uid()
  )
);

-- Política: Los usuarios solo pueden eliminar mensajes de sus propios chats
CREATE POLICY "Users can delete messages from their own chats"
ON public.ai_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE ai_chats.id = ai_messages.chat_id
    AND ai_chats.user_id = auth.uid()
  )
);

-- ==============================================================================
-- NOTAS:
-- - Este schema es ligero y no afecta significativamente el almacenamiento
-- - Los mensajes se pueden limpiar periódicamente si es necesario
-- - El campo media_urls permite añadir imágenes/videos en el futuro
-- ==============================================================================

