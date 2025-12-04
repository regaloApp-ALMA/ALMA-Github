import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
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
  const { addBranch, addFruit, tree } = useTreeStore();
  const isDarkMode = theme === 'dark';

  // Ejecuta realmente la acción pendiente (solo cuando el usuario confirma)
  const executeAICommand = async (command: PendingCommand) => {
    try {
      if (command.action === 'create_branch') {
        const catObj = categories.find(c => c.id === command.data.category) || categories[0];
        await addBranch({
          name: command.data.name,
          categoryId: command.data.category || 'hobbies',
          color: catObj.color,
          position: { x: 0, y: 0 }, // Campo requerido
        } as any);
        return null;
      }

      else if (command.action === 'create_fruit') {
        // Búsqueda inteligente de rama
        let targetBranchId = tree?.branches[0]?.id;

        if (command.data.branchName) {
          // Buscamos coincidencia aproximada en las ramas reales
          const targetName = command.data.branchName.toLowerCase();
          const match = tree?.branches.find(b => b.name.toLowerCase().includes(targetName));

          if (match) {
            targetBranchId = match.id;
          } else {
            // Si no encuentra la rama exacta, buscamos por categoría o creamos una nueva si fuera necesario (aquí simplificamos usando la primera o avisando)
            return `He intentado guardar el recuerdo en "${command.data.branchName}", pero no he encontrado esa rama. ¿Quieres que cree la rama primero?`;
          }
        }

        if (!targetBranchId) return "Necesito que crees una rama primero para poder guardar este recuerdo.";

        // CORRECCIÓN CRÍTICA: Asegurar TODOS los campos requeridos
        await addFruit({
          title: command.data.title,
          description: command.data.description,
          branchId: targetBranchId,
          mediaUrls: [], // Array vacío por defecto
          isShared: false,
          location: { name: '' }, // Objeto location requerido
          position: { x: 0, y: 0 } // Objeto position requerido
        } as any);
        return null;
      }
    } catch (e: any) {
      console.error('Error executing AI command:', e);
      return "Tuve un pequeño problema técnico al guardar eso. ¿Podemos intentarlo de nuevo?";
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
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
              
              RAMAS EXISTENTES DEL USUARIO: ${existingBranches}
              
              INSTRUCCIONES CLAVE:
              1. SÉ AMABLE Y PROFUNDO: Responde siempre con calidez, comentando lo que te cuentan. No seas un robot. Haz preguntas que inviten a la reflexión.
              
              2. DETECTA INTENCIONES: Si el usuario te cuenta un recuerdo o quiere crear una rama, SOLO CUANDO HAYAS REUNIDO SUFICIENTE CONTEXTO (después de varias interacciones) propón UN ÚNICO resumen elaborado (rama o recuerdo) para guardar.
              
              3. DESCRIPCIONES EXTENSAS Y RICAS: Cuando generes un recuerdo (fruto), NO hagas resúmenes de una línea. Desarrolla la historia con al menos 3-4 frases completas, describiendo:
                 - Sensaciones y emociones que sintió el usuario
                 - El ambiente y contexto del momento
                 - Detalles específicos que mencionó
                 - El significado emocional del recuerdo
              Ejemplo de descripción rica: "Era una tarde de verano cuando todo cambió. El sol se filtraba entre las hojas mientras caminábamos por ese sendero que solo conocíamos nosotros. Recuerdo cómo tu risa resonaba en el aire, mezclándose con el canto de los pájaros. En ese momento, supe que había encontrado algo especial, algo que quería conservar para siempre. La sensación de paz y conexión que sentí entonces sigue viva en mi memoria, como un tesoro que guardo con cuidado."
              
              4. BLOQUE JSON: al FINAL de tu respuesta genera como mucho UN SOLO bloque JSON con la propuesta (no uno por mensaje). No guardes nada directamente, solo propones.
              
              5. USA LAS RAMAS REALES: Si te piden guardar un recuerdo, intenta asignarlo a una de las "RAMAS EXISTENTES" que mejor encaje. Si no encaja ninguna, usa la más lógica o sugiere crear una nueva.

              FORMATO JSON (Ponlo SOLO si hay que guardar algo, al final del texto):
              
              Para RAMAS:
              @@JSON@@{"action": "create_branch", "data": { "name": "Nombre", "category": "family"|"travel"|"work"|"hobbies" }}@@ENDJSON@@
              
              Para RECUERDOS (Frutos):
              @@JSON@@{"action": "create_fruit", "data": { "title": "Título Poético y Emotivo", "description": "Descripción EXTENSA de 3-4 frases con detalles, sensaciones y emociones", "branchName": "Nombre EXACTO de una rama existente o la más parecida" }}@@ENDJSON@@
              `
            },
            ...messages.filter(m => m.role !== 'system').slice(-8),
            { role: 'user', content: input }
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

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: visibleReply }]);

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Lo siento, mi conexión con la memoria falló un momento. ¿Me lo puedes repetir?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                  const note = await executeAICommand(cmd);
                  if (note) {
                    Alert.alert('Aviso', note);
                  } else {
                    Alert.alert(
                      'Guardado',
                      cmd.action === 'create_fruit'
                        ? 'Tu recuerdo se ha añadido a tu árbol.'
                        : 'Hemos creado una nueva rama en tu árbol.'
                    );
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
