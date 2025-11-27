import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Send, Image as ImageIcon } from 'lucide-react-native';
import colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
import categories from '@/constants/categories';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string; };

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Hola. Soy ALMA, estoy aquí para escuchar tus historias y ayudarte a guardarlas. ¿Qué recuerdo te gustaría conservar hoy?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useThemeStore();
  const { addBranch, addFruit, tree } = useTreeStore();
  const isDarkMode = theme === 'dark';

  const executeAICommand = async (command: any) => {
    try {
      if (command.action === 'create_branch') {
        const catObj = categories.find(c => c.id === command.data.category) || categories[0];
        await addBranch({
          name: command.data.name,
          categoryId: command.data.category || 'hobbies',
          color: catObj.color,
          isShared: false,
          position: { x: 0, y: 0 }
        });
        return null; // La acción fue exitosa, no necesitamos devolver texto extra, la IA ya lo dijo.
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

        await addFruit({
          title: command.data.title,
          description: command.data.description,
          branchId: targetBranchId,
          mediaUrls: [],
          isShared: false,
          location: { name: '' },
          position: { x: 0, y: 0 }
        } as any);
        return null;
      }
    } catch (e) {
      console.error(e);
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
              1. SÉ AMABLE: Responde siempre con calidez, comentando lo que te cuentan. No seas un robot.
              2. DETECTA INTENCIONES: Si el usuario te cuenta un recuerdo o quiere crear una rama, añade al FINAL de tu respuesta un bloque JSON (oculto para el usuario) para ejecutar la acción.
              3. USA LAS RAMAS REALES: Si te piden guardar un recuerdo, intenta asignarlo a una de las "RAMAS EXISTENTES" que mejor encaje. Si no encaja ninguna, usa la más lógica o sugiere crear una nueva.

              FORMATO JSON (Ponlo SOLO si hay que guardar algo, al final del texto):
              
              Para RAMAS:
              @@JSON@@{"action": "create_branch", "data": { "name": "Nombre", "category": "family"|"travel"|"work"|"hobbies" }}@@ENDJSON@@
              
              Para RECUERDOS (Frutos):
              @@JSON@@{"action": "create_fruit", "data": { "title": "Título Poético", "description": "Resumen emotivo", "branchName": "Nombre EXACTO de una rama existente o la más parecida" }}@@ENDJSON@@
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
          const command = JSON.parse(jsonMatch[1]);
          const executionResult = await executeAICommand(command);

          // Si hubo un error o aviso, lo añadimos a la respuesta visible
          if (executionResult) {
            visibleReply += `\n\n(Nota: ${executionResult})`;
          }
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
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble, isDarkMode && msg.role === 'assistant' && styles.botBubbleDark]}>
            <Text style={[styles.text, msg.role === 'user' ? styles.textWhite : isDarkMode ? styles.textWhite : styles.textBlack]}>{msg.content}</Text>
          </View>
        ))}
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
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Send size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
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
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', alignItems: 'center' },
  inputContainerDark: { backgroundColor: '#1E1E1E' },
  input: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, fontSize: 16, marginRight: 10, maxHeight: 100 },
  inputDark: { backgroundColor: '#333', color: '#FFF' },
  sendBtn: { backgroundColor: colors.primary, width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' }
});