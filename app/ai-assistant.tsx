import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import categories from '@/constants/categories';
import SuccessNotification from '@/components/SuccessNotification';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string; };

type PendingCommand =
  | { action: 'create_branch'; data: { name: string; category?: string } }
  | { action: 'create_fruit'; data: { title: string; description: string; branchName?: string } };

export default function AIAssistant() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Hola. Soy ALMA, estoy aquí para escuchar tus historias y ayudarte a guardarlas. ¿Qué recuerdo te gustaría conservar hoy?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { addBranch, addFruit, tree, fetchMyTree } = useTreeStore();
  const isDarkMode = theme === 'dark';

  // CONSTRUCCIÓN DE CONTEXTO INTELIGENTE: Recuerdos propios y de familiares
  // Combinados y ordenados cronológicamente (newest first) con etiquetas de fecha
  const buildContext = async (): Promise<string> => {
    if (!user?.id) return '';

    try {
      // 1. Obtener mis recuerdos (fruits del árbol propio)
      const { data: myTree } = await supabase
        .from('trees')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      const allMemories: Array<{
        title: string;
        description: string;
        date: string;
        created_at: string;
        branchName: string;
        owner: string;
        isOwn: boolean;
      }> = [];

      if (myTree) {
        const { data: myBranches } = await supabase
          .from('branches')
          .select('id, name')
          .eq('tree_id', myTree.id);

        const branchIds = myBranches?.map(b => b.id) || [];
        const branchMap = new Map(myBranches?.map(b => [b.id, b.name]) || []);

        if (branchIds.length > 0) {
          const { data: myFruits } = await supabase
            .from('fruits')
            .select('title, description, date, created_at, branch_id')
            .in('branch_id', branchIds)
            .limit(20); // Aumentar límite para mejor ordenamiento

          if (myFruits && myFruits.length > 0) {
            myFruits.forEach((f: any) => {
              allMemories.push({
                title: f.title,
                description: f.description || 'Sin descripción',
                date: f.date || f.created_at,
                created_at: f.created_at,
                branchName: branchMap.get(f.branch_id) || 'Sin rama',
                owner: 'Yo',
                isOwn: true,
              });
            });
          }
        }
      }

      // 2. Obtener recuerdos de familiares conectados (solo activos)
      const { data: connections } = await supabase
        .from('family_connections')
        .select('relative_id')
        .eq('user_id', user.id)
        .eq('status', 'active'); // Solo conexiones activas

      if (connections && connections.length > 0) {
        const familyIds = connections.map(c => c.relative_id);

        // Buscar árboles de esos familiares
        const { data: familyTrees } = await supabase
          .from('trees')
          .select('id, owner_id, owner:profiles!owner_id(name)')
          .in('owner_id', familyIds);

        if (familyTrees && familyTrees.length > 0) {
          const treeIds = familyTrees.map(t => t.id);
          const ownerMap = new Map(familyTrees.map((t: any) => [t.id, t.owner?.name || 'Familiar']));

          // Buscar ramas de esos árboles
          const { data: familyBranches } = await supabase
            .from('branches')
            .select('id, tree_id, name')
            .in('tree_id', treeIds);

          const branchIds = familyBranches?.map(b => b.id) || [];
          const familyBranchMap = new Map(familyBranches?.map(b => [b.id, { name: b.name, treeId: b.tree_id }]) || []);

          if (branchIds.length > 0) {
            // Buscar frutos de esos árboles
            const { data: familyFruits } = await supabase
              .from('fruits')
              .select('title, description, date, created_at, branch_id')
              .in('branch_id', branchIds)
              .limit(30); // Aumentar límite para mejor ordenamiento

            if (familyFruits && familyFruits.length > 0) {
              familyFruits.forEach((f: any) => {
                const branchInfo = familyBranchMap.get(f.branch_id);
                const treeId = branchInfo?.treeId;
                const ownerName = treeId ? ownerMap.get(treeId) || 'Familiar' : 'Familiar';

                allMemories.push({
                  title: f.title,
                  description: f.description || 'Sin descripción',
                  date: f.date || f.created_at,
                  created_at: f.created_at,
                  branchName: branchInfo?.name || 'Sin rama',
                  owner: ownerName,
                  isOwn: false,
                });
              });
            }
          }
        }
      }

      // 3. ORDENAR CRONOLÓGICAMENTE (Newest First) por created_at
      allMemories.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descendente = más recientes primero
      });

      // 4. Formatear con etiquetas de fecha y límite a los más relevantes
      const limitedMemories = allMemories.slice(0, 25); // Limitar a 25 recuerdos más recientes

      if (limitedMemories.length === 0) {
        return '';
      }

      // Separar en propios y de familia
      const ownMemories = limitedMemories.filter(m => m.isOwn);
      const familyMemories = limitedMemories.filter(m => !m.isOwn);

      let contextText = '';

      // Formatear recuerdos propios
      if (ownMemories.length > 0) {
        contextText += 'MIS RECUERDOS (ordenados del más reciente al más antiguo):\n';
        ownMemories.forEach((mem) => {
          const dateLabel = mem.date ? new Date(mem.date).toISOString().split('T')[0] : new Date(mem.created_at).toISOString().split('T')[0];
          contextText += `[Fecha: ${dateLabel}] Título: "${mem.title}" - ${mem.description} (en la rama "${mem.branchName}")\n`;
        });
      }

      // Formatear recuerdos de familia
      if (familyMemories.length > 0) {
        if (contextText) contextText += '\n';
        contextText += 'RECUERDOS DE MI FAMILIA (ordenados del más reciente al más antiguo):\n';
        familyMemories.forEach((mem) => {
          const dateLabel = mem.date ? new Date(mem.date).toISOString().split('T')[0] : new Date(mem.created_at).toISOString().split('T')[0];
          contextText += `[Fecha: ${dateLabel}] ${mem.owner} - Título: "${mem.title}" - ${mem.description} (en la rama "${mem.branchName}")\n`;
        });
      }

      return contextText;
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
        // ... (lógica anterior igual)
        // VALIDACIÓN: Verificar que la categoría existe
        const validCategoryIds = categories.map(c => c.id);
        const categoryId = command.data.category && validCategoryIds.includes(command.data.category)
          ? command.data.category
          : 'hobbies';

        const catObj = categories.find(c => c.id === categoryId) || categories[0];

        await addBranch({
          name: command.data.name.trim(),
          categoryId: categoryId,
          color: catObj.color,
          position: { x: 0, y: 0 },
          isShared: false,
        } as any);

        await fetchMyTree(true);

        // 🚀 REDIRECCIÓN AUTOMÁTICA
        setSuccessMessage('Rama creada correctamente. Vamos al árbol.');
        setShowSuccessNotification(true);

        setTimeout(() => {
          Alert.alert(
            '¡Hecho!',
            'Tu nueva rama ha sido creada. Vamos a verla.',
            [{
              text: 'Vamos',
              onPress: () => router.push('/(tabs)/tree')
            }]
          );
        }, 500);

        return null;
      }

      else if (command.action === 'create_fruit') {
        // ... (Búsqueda de rama igual)
        let targetBranchId = tree?.branches[0]?.id;

        if (command.data.branchName) {
          const targetName = command.data.branchName.toLowerCase().trim();
          const match = tree?.branches.find(b =>
            b.name.toLowerCase().includes(targetName) ||
            targetName.includes(b.name.toLowerCase())
          );

          if (match) {
            targetBranchId = match.id;
          } else {
            // ...
            return `He intentado guardar el recuerdo en "${command.data.branchName}", pero no he encontrado esa rama. ¿Quieres que cree la rama primero?`;
          }
        }

        if (!targetBranchId) {
          return "Necesito que crees una rama primero para poder guardar este recuerdo.";
        }

        const fruitData = {
          title: command.data.title?.trim() || 'Recuerdo sin título',
          description: command.data.description?.trim() || '',
          branchId: targetBranchId,
          mediaUrls: [] as string[],
          isShared: false,
          location: { name: '' },
          position: { x: 0, y: 0 }
        };

        await addFruit(fruitData as any);
        await fetchMyTree(true);

        // 🚀 REDIRECCIÓN AUTOMÁTICA
        setSuccessMessage('Recuerdo guardado correctamente.');
        setShowSuccessNotification(true);

        setTimeout(() => {
          Alert.alert(
            '¡Hecho!',
            'Tu recuerdo ha sido guardado. Vamos a verlo.',
            [{
              text: 'Vamos',
              onPress: () => router.push('/(tabs)/tree')
            }]
          );
        }, 500);

        return null;
      }
    } catch (e: any) {
      console.error('❌ [AI] Error ejecutando comando:', e);
      Alert.alert('Error al guardar', e.message || 'Hubo un problema técnico.');
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

    // ⏱️ TIMEOUT CONTROLLER
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos exactos

    try {
      const context = await buildContext();

      const recentMessages = messages
        .filter(m => m.role !== 'system')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const existingBranches = tree?.branches.map(b => `"${b.name}" (${b.categoryId})`).join(', ') || "Ninguna rama creada aún";

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal, // Vinculamos el timeout
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres ALMA, el guardián digital del legado familiar. Tu personalidad es empática, paciente y reflexiva.
              
              VERDAD FUNDAMENTAL:
              En ALMA, las 'Raíces' NO son solo metáforas; son literalmente los Familiares Conectados (usuarios reales) con los que compartes árbol.
              La visión de ALMA es crear un Árbol Genealógico Gigante e Infinito: si mi padre me comparte su árbol y él tiene un hermano (mi tío) que yo no tenía, yo debo poder ver y acceder a ese contenido.
              Los árboles se fusionan para conectar generaciones pasadas y futuras. Tu objetivo es ayudar al usuario a construir este legado interconectado.
              
              TU OBJETIVO:
              Ayudar al usuario a documentar su vida en el árbol, creando "Ramas" (categorías) y "Frutos" (recuerdos).
              
              ACCIÓN - DETECCIÓN DE INTENCIÓN:
              Si el usuario quiere GUARDAR un recuerdo o CREAR una rama, DEBES generar un JSON al final de tu respuesta (oculto en el bloque correspondiente).
              
              CONTEXTO ACTUAL DEL USUARIO:
              ${context ? `\n${context}\n` : ''}
              
              RAMAS EXISTENTES (Úsalas para sugerir dónde guardar): ${existingBranches}
              
              SI EL USUARIO QUIERE GUARDAR ALGO (Recuerdo o Rama), responde como siempre (texto amable) Y LUEGO añade el JSON.
              
              FORMATO JSON (Ponlo SOLO si hay que guardar algo):
              CSS
              @@JSON@@{"action": "create_branch", "data": { "name": "NombreRama", "category": "id_categoria" }}@@ENDJSON@@
              @@JSON@@{"action": "create_fruit", "data": { "title": "Título corto", "description": "Historia completa", "branchName": "NombreRama" }}@@ENDJSON@@
              `
            },
            ...recentMessages,
            { role: 'user', content: currentInput }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      let aiFullReply = data.completion;
      let visibleReply = aiFullReply;

      const jsonMatch = aiFullReply.match(/@@JSON@@(.*?)@@ENDJSON@@/s);

      if (jsonMatch) {
        visibleReply = aiFullReply.replace(jsonMatch[0], '').trim();
        try {
          const command = JSON.parse(jsonMatch[1]) as PendingCommand;
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

    } catch (error: any) {
      console.error('Error en handleSend:', error);

      let errorMessage = 'Lo siento, he tenido un problema técnico. ¿Podrías repetirlo?';

      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        errorMessage = 'Lo siento, ha habido un error de conexión (timeout). Por favor, inténtalo de nuevo.';
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      clearTimeout(timeoutId); // Limpiar timer
      setIsLoading(false); // SIEMPRE apagar loader
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

        {/* Notificación de éxito */}
        <SuccessNotification
          visible={showSuccessNotification}
          message={successMessage}
          onClose={() => setShowSuccessNotification(false)}
          duration={2500}
        />

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
