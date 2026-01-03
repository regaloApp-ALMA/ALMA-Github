import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Send } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import categories from '@/constants/categories';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string; };

type PendingCommand =
  | { action: 'create_branch'; data: { name: string; category?: string } }
  | { action: 'create_fruit'; data: { title: string; description: string; branchName?: string } };

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Hola. Soy ALMA, estoy aquí para escuchar tus historias y ayudarte a guardarlas. ¿Qué recuerdo te gustaría conservar hoy?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { addBranch, addFruit, tree, fetchMyTree } = useTreeStore();
  const isDarkMode = theme === 'dark';

  // CONSTRUCCIÓN DE CONTEXTO INTELIGENTE: Recuerdos propios y de familiares
  const buildContext = async (): Promise<string> => {
    if (!user?.id) return '';

    try {
      // 1. Obtener mis recuerdos (fruits del árbol propio)
      const { data: myTree } = await supabase
        .from('trees')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      let myContext = '';
      if (myTree) {
        const { data: myBranches } = await supabase
          .from('branches')
          .select('id')
          .eq('tree_id', myTree.id);

        const branchIds = myBranches?.map(b => b.id) || [];

        if (branchIds.length > 0) {
          const { data: myFruits } = await supabase
            .from('fruits')
            .select('title, description, date, branch:branches(name)')
            .in('branch_id', branchIds)
            .order('created_at', { ascending: false })
            .limit(15);

          if (myFruits && myFruits.length > 0) {
            myContext = 'MIS RECUERDOS:\n' + myFruits.map((f: any) => 
              `- "${f.title}": ${f.description || 'Sin descripción'} (en la rama "${f.branch?.name || 'Sin rama'}")`
            ).join('\n');
          }
        }
      }

      // 2. Obtener recuerdos de familiares conectados
      const { data: connections } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', user.id);

      let familyContext = '';
      if (connections && connections.length > 0) {
        const familyIds = connections.map(c => c.relative_id);

        // Buscar árboles de esos familiares
        const { data: familyTrees } = await supabase
          .from('trees')
          .select('id, owner_id, owner:profiles!owner_id(name)')
          .in('owner_id', familyIds);

        if (familyTrees && familyTrees.length > 0) {
          const treeIds = familyTrees.map(t => t.id);

          // Buscar ramas de esos árboles
          const { data: familyBranches } = await supabase
            .from('branches')
            .select('id, tree_id')
            .in('tree_id', treeIds);

          const branchIds = familyBranches?.map(b => b.id) || [];

          if (branchIds.length > 0) {
            // Buscar frutos de esos árboles
            const { data: familyFruits } = await supabase
              .from('fruits')
              .select(`
                title, description, date,
                branch:branches(
                  name,
                  tree:trees(
                    owner:profiles(name)
                  )
                )
              `)
              .in('branch_id', branchIds)
              .order('created_at', { ascending: false })
              .limit(20);

            if (familyFruits && familyFruits.length > 0) {
              const familyMap = new Map();
              familyTrees.forEach((t: any) => {
                familyMap.set(t.owner_id, t.owner?.name || 'Familiar');
              });

              familyContext = '\n\nRECUERDOS DE MI FAMILIA:\n' + familyFruits.map((f: any) => {
                const ownerName = f.branch?.tree?.owner?.name || 'Un familiar';
                return `- ${ownerName} tiene un recuerdo sobre "${f.title}": ${f.description || 'Sin descripción'} (en la rama "${f.branch?.name || 'Sin rama'}")`;
              }).join('\n');
            }
          }
        }
      }

      return myContext + familyContext;
    } catch (error) {
      console.error('Error building context:', error);
      return '';
    }
  };

  // Ejecuta realmente la acción pendiente (solo cuando el usuario confirma)
  const executeAICommand = async (command: PendingCommand): Promise<string | null> => {
    console.log('🔵 [AI] Ejecutando comando:', command.action);
    
    try {
      if (command.action === 'create_branch') {
        console.log('🔵 [AI] Creando rama:', command.data);
        
        // VALIDACIÓN: Verificar que la categoría existe
        const validCategoryIds = categories.map(c => c.id);
        const categoryId = command.data.category && validCategoryIds.includes(command.data.category)
          ? command.data.category
          : 'hobbies'; // Fallback seguro
        
        const catObj = categories.find(c => c.id === categoryId) || categories[0];
        
        console.log('🔵 [AI] Categoría validada:', categoryId, 'Color:', catObj.color);
        
        await addBranch({
          name: command.data.name.trim(),
          categoryId: categoryId,
          color: catObj.color,
          position: { x: 0, y: 0 },
          isShared: false,
        } as any);
        
        console.log('✅ [AI] Rama creada exitosamente');
        await fetchMyTree(true); // Refrescar el árbol con refresh
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          Alert.alert(
            '✅ Rama Creada',
            `Se ha añadido "${command.data.name.trim()}" a tu árbol.`,
            [{ text: 'OK' }]
          );
        }, 300);
        
        return null;
      }

      else if (command.action === 'create_fruit') {
        console.log('🔵 [AI] Creando fruto:', command.data);
        
        // Búsqueda inteligente de rama
        let targetBranchId = tree?.branches[0]?.id;

        if (command.data.branchName) {
          const targetName = command.data.branchName.toLowerCase().trim();
          const match = tree?.branches.find(b => 
            b.name.toLowerCase().includes(targetName) || 
            targetName.includes(b.name.toLowerCase())
          );

          if (match) {
            targetBranchId = match.id;
            console.log('🔵 [AI] Rama encontrada:', match.name);
          } else {
            console.log('⚠️ [AI] Rama no encontrada:', command.data.branchName);
            return `He intentado guardar el recuerdo en "${command.data.branchName}", pero no he encontrado esa rama. ¿Quieres que cree la rama primero?`;
          }
        }

        if (!targetBranchId) {
          console.log('⚠️ [AI] No hay ramas disponibles');
          return "Necesito que crees una rama primero para poder guardar este recuerdo.";
        }

        // VALIDACIÓN: Asegurar todos los campos requeridos
        const fruitData = {
          title: command.data.title?.trim() || 'Recuerdo sin título',
          description: command.data.description?.trim() || '',
          branchId: targetBranchId,
          mediaUrls: [] as string[],
          isShared: false,
          location: { name: '' },
          position: { x: 0, y: 0 }
        };

        console.log('🔵 [AI] Datos del fruto validados:', fruitData);

        const fruitId = await addFruit(fruitData as any);
        
        console.log('✅ [AI] Fruto creado exitosamente, ID:', fruitId);
        await fetchMyTree(true); // Refrescar el árbol con refresh
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          Alert.alert(
            '✅ Recuerdo Guardado',
            `"${command.data.title}" se ha añadido a tu árbol.`,
            [{ text: 'OK' }]
          );
        }, 300);
        
        return null;
      }
    } catch (e: any) {
      console.error('❌ [AI] Error ejecutando comando:', e);
      console.error('❌ [AI] Stack:', e.stack);
      Alert.alert('Error al guardar', e.message || 'Hubo un problema técnico. Por favor, inténtalo de nuevo.');
      return "Tuve un pequeño problema técnico al guardar eso. ¿Podemos intentarlo de nuevo?";
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input 
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Construir contexto inteligente (recuerdos propios y de familiares)
      const context = await buildContext();

      // Obtener últimos 8 mensajes para contexto conversacional (excluyendo system)
      const recentMessages = messages
        .filter(m => m.role !== 'system')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      // 1. CONTEXTO VITAL: Le pasamos las ramas existentes para que no alucine
      const existingBranches = tree?.branches.map(b => `"${b.name}" (${b.categoryId})`).join(', ') || "Ninguna rama creada aún";

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres ALMA, un asistente biográfico cálido, empático y profundo. Tu misión es escuchar al usuario, hacerle preguntas para profundizar en sus sentimientos y ayudarle a organizar su vida.

              ${context ? `\n${context}\n` : ''}
              
              RAMAS EXISTENTES DEL USUARIO: ${existingBranches}
              
              INSTRUCCIONES CLAVE:
              1. SÉ AMABLE Y PROFUNDO: Responde siempre con calidez, comentando lo que te cuentan. No seas un robot. Haz preguntas que inviten a la reflexión.
              
              2. USA EL CONTEXTO: Si el usuario pregunta sobre recuerdos (propios o de familiares), usa la información del contexto proporcionado arriba para responder de manera precisa. Por ejemplo, si pregunta "¿Qué cocinó mi abuela en Navidad?", busca en los recuerdos de familiares.
              
              3. DETECTA INTENCIONES: Si el usuario te cuenta un recuerdo o quiere crear una rama, SOLO CUANDO HAYAS REUNIDO SUFICIENTE CONTEXTO (después de varias interacciones) propón UN ÚNICO resumen elaborado (rama o recuerdo) para guardar.
              
              4. DESCRIPCIONES HUMANAS Y AUTÉNTICAS (MÍMESIS OBLIGATORIA): Cuando generes un recuerdo (fruto), NO hagas resúmenes de una línea. Desarrolla la historia con al menos 3-4 frases completas, PERO:
                 
                 REGLAS DE ESTILO:
                 - MÍMESIS TOTAL: NO escribas como una IA ni como un poeta genérico. CLONA EXACTAMENTE el estilo de habla del usuario. Analiza su tono, vocabulario, longitud de frases y nivel de formalidad.
                 - Si el usuario escribe corto y directo → el recuerdo debe ser directo y conciso
                 - Si es emotivo y detallado → sé emotivo y detallado
                 - Si usa lenguaje coloquial/slang → usa lenguaje coloquial
                 - Si es formal → mantén formalidad
                 - Si escribe con errores o informal → refleja ese estilo natural
                 
                 - PRIMERA PERSONA OBLIGATORIA: Usa estrictamente la PRIMERA PERSONA DEL SINGULAR ('Yo fui', 'Nosotros comimos', 'Me sentí', 'Estaba'). NUNCA uses tercera persona.
                 
                 - PROHIBIDO: Evita COMPLETAMENTE frases cliché como 'un tapiz de recuerdos', 'ecos del pasado', 'tejiendo memorias', 'hilos dorados', 'canto eterno'. Usa lenguaje natural, cotidiano y directo.
                 
                 - FIDELIDAD: Describe SOLO sensaciones, emociones, ambiente y detalles específicos que el usuario mencionó. NO inventes cosas que no dijo.
                 
              Ejemplo BUENO (natural, primera persona, tono del usuario): "Era una tarde de verano cuando todo cambió. El sol se filtraba entre las hojas mientras caminábamos por ese sendero que solo conocíamos nosotros. Recuerdo cómo tu risa resonaba en el aire, mezclándose con el canto de los pájaros. En ese momento, supe que había encontrado algo especial, algo que quería conservar para siempre."
              
              Ejemplo MALO (demasiado poético/artificial): "En el tapiz de la memoria, ese día quedó tejido con hilos dorados de felicidad. Los ecos del pasado resuenan aún en mi corazón."
              
              5. BLOQUE JSON: al FINAL de tu respuesta genera como mucho UN SOLO bloque JSON con la propuesta (no uno por mensaje). No guardes nada directamente, solo propones.
              
              6. USA LAS RAMAS REALES: Si te piden guardar un recuerdo, intenta asignarlo a una de las "RAMAS EXISTENTES" que mejor encaje. Si no encaja ninguna, usa la más lógica o sugiere crear una nueva.
              
              7. CATEGORÍAS VÁLIDAS: Solo puedes usar estas categorías: "family", "travel", "work", "education", "friends", "pets", "hobbies". Si no estás seguro, usa "hobbies".

              FORMATO JSON (Ponlo SOLO si hay que guardar algo, al final del texto):
              
              Para RAMAS:
              @@JSON@@{"action": "create_branch", "data": { "name": "Nombre", "category": "family"|"travel"|"work"|"education"|"friends"|"pets"|"hobbies" }}@@ENDJSON@@
              
              Para RECUERDOS (Frutos):
              @@JSON@@{"action": "create_fruit", "data": { "title": "Título Directo y Emotivo (sin exagerar)", "description": "Descripción EXTENSA de 3-4 frases en primera persona, con el mismo tono que el usuario, usando lenguaje natural y cotidiano", "branchName": "Nombre EXACTO de una rama existente o la más parecida" }}@@ENDJSON@@
              `
            },
            ...recentMessages,
            { role: 'user', content: currentInput }
          ]
        })
      });

      const data = await response.json();
      let aiFullReply = data.completion;
      let visibleReply = aiFullReply;

      // Detectar y extraer el bloque JSON oculto
      const jsonMatch = aiFullReply.match(/@@JSON@@(.*?)@@ENDJSON@@/s);

      if (jsonMatch) {
        // Limpiamos el mensaje para el usuario (quitamos el JSON)
        visibleReply = aiFullReply.replace(jsonMatch[0], '').trim();

        try {
          const command = JSON.parse(jsonMatch[1]) as PendingCommand;
          // En lugar de ejecutar directamente, guardamos la acción propuesta para que el usuario la confirme.
          setPendingCommand(command);
        } catch (e) {
          console.error("Error parsing command:", e);
        }
      }

      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: visibleReply 
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error en handleSend:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: 'Lo siento, mi conexión con la memoria falló un momento. ¿Me lo puedes repetir?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Asistente ALMA',
        }}
      />
      
      <KeyboardAvoidingView
        style={[styles.container, isDarkMode && styles.containerDark]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.botBubble,
                isDarkMode && msg.role === 'assistant' && styles.botBubbleDark,
              ]}
            >
              <Text
                style={[
                  styles.text,
                  msg.role === 'user' ? styles.textWhite : isDarkMode ? styles.textWhite : styles.textBlack,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Tarjeta de confirmación cuando la IA propone guardar algo */}
          {pendingCommand && (
            <View style={[styles.summaryCard, isDarkMode && styles.summaryCardDark]}>
              <Text style={[styles.summaryTitle, isDarkMode && styles.textWhite]}>
                {pendingCommand.action === 'create_fruit'
                  ? '¿Guardamos este recuerdo en tu árbol?'
                  : '¿Creamos esta nueva rama en tu árbol?'}
              </Text>

              {pendingCommand.action === 'create_fruit' ? (
                <>
                  <Text style={[styles.summaryLabel, isDarkMode && styles.textLight]}>Título</Text>
                  <Text style={[styles.summaryValue, isDarkMode && styles.textWhite]}>
                    {pendingCommand.data.title}
                  </Text>
                  <Text style={[styles.summaryLabel, isDarkMode && styles.textLight]}>Descripción</Text>
                  <Text style={[styles.summaryValue, isDarkMode && styles.textWhite]}>
                    {pendingCommand.data.description}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.summaryLabel, isDarkMode && styles.textLight]}>Nombre de la rama</Text>
                  <Text style={[styles.summaryValue, isDarkMode && styles.textWhite]}>
                    {pendingCommand.data.name}
                  </Text>
                  {pendingCommand.data.category && (
                    <>
                      <Text style={[styles.summaryLabel, isDarkMode && styles.textLight]}>Categoría</Text>
                      <Text style={[styles.summaryValue, isDarkMode && styles.textWhite]}>
                        {pendingCommand.data.category}
                      </Text>
                    </>
                  )}
                </>
              )}

              <View style={styles.summaryActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, isDarkMode && styles.cancelBtnDark]}
                  onPress={() => setPendingCommand(null)}
                >
                  <Text style={[styles.cancelText, isDarkMode && styles.textWhite]}>Más tarde</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={async () => {
                    if (!pendingCommand) return;
                    const cmd = pendingCommand;
                    setPendingCommand(null);
                    
                    try {
                      const note = await executeAICommand(cmd);
                      // Las notificaciones ya se muestran dentro de executeAICommand
                      // Solo mostrar aquí si hay un mensaje de error o aviso
                      if (note) {
                        setTimeout(() => {
                          Alert.alert('Aviso', note);
                        }, 100);
                      }
                    } catch (error: any) {
                      setTimeout(() => {
                        Alert.alert('Error', error.message || 'No se pudo guardar. Inténtalo de nuevo.');
                      }, 100);
                    }
                  }}
                >
                  <Text style={styles.confirmText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isLoading && <ActivityIndicator color={colors.primary} style={{ margin: 10 }} />}
        </ScrollView>

        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={input}
            onChangeText={setInput}
            placeholder="Cuéntame un recuerdo..."
            placeholderTextColor={isDarkMode ? '#777' : '#999'}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={isLoading}>
            <Send size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  containerDark: { backgroundColor: '#121212' },
  messagesContainer: { flex: 1, padding: 15 },
  bubble: { padding: 15, borderRadius: 20, marginBottom: 10, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 2, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  botBubbleDark: { backgroundColor: '#1E1E1E' },
  text: { fontSize: 16, lineHeight: 22 },
  textWhite: { color: '#FFF' },
  textBlack: { color: '#333' },
  textLight: { color: '#AAA' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', alignItems: 'center' },
  inputContainerDark: { backgroundColor: '#1E1E1E' },
  input: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, fontSize: 16, marginRight: 10, maxHeight: 100 },
  inputDark: { backgroundColor: '#333', color: '#FFF' },
  sendBtn: { backgroundColor: colors.primary, width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },

  // Tarjeta de confirmación
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'stretch',
  },
  summaryCardDark: {
    backgroundColor: '#1E1E1E',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 14,
    marginTop: 2,
    color: colors.text,
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnDark: {
    borderColor: '#444',
  },
  cancelText: {
    color: colors.text,
    fontSize: 13,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
