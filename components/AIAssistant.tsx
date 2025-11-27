import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Animated } from 'react-native';
import { Send, Mic, MicOff, Leaf, Apple } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Platform } from 'react-native';
import { useTreeStore } from '@/stores/treeStore';
import { supabase } from '@/lib/supabase';
import { useThemeStore } from '@/stores/themeStore';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy el guardián de tus recuerdos. Puedo ayudarte a recordar momentos de tu vida o contarte cosas sobre los árboles que tus familiares han compartido contigo. ¿Qué te gustaría saber hoy?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  // --- CEREBRO DE LA IA: CONSTRUCCIÓN DE CONTEXTO ---
  const buildContext = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return "";

      // 1. Obtener MIS recuerdos recientes
      const { data: myFruits } = await supabase
        .from('fruits')
        .select(`
          title, description, date,
          branch:branches(name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      // 2. Obtener recuerdos de FAMILIARES (Árboles compartidos)
      // Primero buscamos mis conexiones
      const { data: connections } = await supabase
        .from('family_connections')
        .select('relative_id, relation, relative:profiles!relative_id(name)');

      let familyContext = "";

      if (connections && connections.length > 0) {
        const familyIds = connections.map(c => c.relative_id);

        // Buscamos árboles de esos familiares
        const { data: familyTrees } = await supabase
          .from('trees')
          .select('id, owner_id')
          .in('owner_id', familyIds);

        const treeIds = familyTrees?.map(t => t.id) || [];

        if (treeIds.length > 0) {
          // Buscamos ramas de esos árboles
          const { data: branches } = await supabase.from('branches').select('id').in('tree_id', treeIds);
          const branchIds = branches?.map(b => b.id) || [];

          if (branchIds.length > 0) {
            // Buscamos frutos de esos árboles
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
              .limit(20); // Límite para no saturar el prompt

            // Formatear recuerdos familiares
            familyContext = (familyFruits || []).map((f: any) => {
              const ownerName = f.branch?.tree?.owner?.name || "Un familiar";
              return `- ${ownerName} tiene un recuerdo sobre "${f.title}": ${f.description} (en la rama ${f.branch?.name}).`;
            }).join('\n');
          }
        }
      }

      // 3. Construir el texto final para la IA
      const myContext = (myFruits || []).map((f: any) =>
        `- Yo tengo un recuerdo sobre "${f.title}": ${f.description} (en mi rama ${f.branch?.name}).`
      ).join('\n');

      return `
        CONTEXTO DE LA VIDA DEL USUARIO:
        
        MIS RECUERDOS:
        ${myContext}
        
        RECUERDOS DE MI FAMILIA (ÁRBOLES COMPARTIDOS):
        ${familyContext}
        
        INSTRUCCIONES:
        Usa esta información para responder preguntas. Si te preguntan por un familiar, busca en la sección de familia. 
        Si la respuesta no está en este contexto, di amablemente que no tienes ese recuerdo guardado todavía.
      `;

    } catch (error) {
      console.error("Error construyendo contexto:", error);
      return "";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Construir el contexto fresco desde Supabase
      const contextSystemMessage = await buildContext();

      // 2. Enviar a la IA (incluyendo el contexto como mensaje de sistema oculto)
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres un asistente biográfico cálido y empático. ${contextSystemMessage}`
            },
            ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ]
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.completion,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, tuve un problema conectando con tus recuerdos. Inténtalo de nuevo.',
      };
      setMessages(prev => [...prev, errorMessage]);
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
        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              message.role === 'assistant' && isDarkMode && styles.assistantMessageDark,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              message.role === 'assistant' && isDarkMode && styles.assistantMessageTextDark
            ]}>
              {message.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Buscando en tus recuerdos...</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta sobre tus recuerdos o familia..."
          placeholderTextColor={isDarkMode ? '#777' : colors.gray}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assistantMessageDark: {
    backgroundColor: '#1E1E1E',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  assistantMessageTextDark: {
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  loadingTextDark: {
    color: '#AAA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  inputContainerDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
  },
  inputDark: {
    backgroundColor: '#333',
    color: colors.white,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray,
  },
});