import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Tree from '@/components/Tree';
import { Plus, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

export default function TreeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tree />

      {/* BOTÓN DE AÑADIR FLOTANTE */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-branch-options')}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      {/* BOTÓN IA FLOTANTE */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => router.push('/ai-assistant')}
      >
        <MessageCircle color="#FFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 140, // Encima del panel de raíces
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  aiFab: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
  },
});