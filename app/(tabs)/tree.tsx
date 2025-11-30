import React from 'react';
import { View, StyleSheet } from 'react-native';
import Tree from '@/components/Tree';
import colors from '@/constants/colors';

export default function TreeScreen() {
  return (
    <View style={styles.container}>
      {/* Renderizamos solo el componente Tree. 
          Los botones flotantes (FAB y Asistente) ya están en _layout.tsx, 
          así evitamos que salgan duplicados. */}
      <Tree />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // El color de fondo lo maneja el componente Tree, pero esto asegura consistencia
    backgroundColor: '#ffffff',
  },
});