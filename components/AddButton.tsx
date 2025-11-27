import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { Plus, Leaf, Apple, Clock, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const AddButton = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const handleNavigation = (path: any) => {
    setShowModal(false);
    router.push(path);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Botón Principal Verde (+) */}
      <TouchableOpacity
        style={styles.mainFab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.9}
      >
        <Plus size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Modal de Opciones */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.menuCard, isDarkMode && styles.menuCardDark]}>
            <Text style={[styles.menuTitle, isDarkMode && styles.textWhite]}>¿Qué quieres añadir?</Text>

            {/* Opción: Rama */}
            <TouchableOpacity style={styles.menuOption} onPress={() => handleNavigation('/add-branch')}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Leaf size={24} color={colors.primary} />
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.optionTitle, isDarkMode && styles.textWhite]}>Nueva Rama</Text>
                <Text style={styles.optionDesc}>Crea una nueva categoría para tus recuerdos</Text>
              </View>
            </TouchableOpacity>

            {/* Opción: Recuerdo */}
            <TouchableOpacity style={styles.menuOption} onPress={() => handleNavigation('/add-memory-options')}>
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Apple size={24} color="#2196F3" />
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.optionTitle, isDarkMode && styles.textWhite]}>Nuevo Recuerdo</Text>
                <Text style={styles.optionDesc}>Añade un recuerdo a una rama existente</Text>
              </View>
            </TouchableOpacity>

            {/* Opción: Cápsula */}
            <TouchableOpacity style={styles.menuOption} onPress={() => handleNavigation('/time-capsule')}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Clock size={24} color="#FF9800" />
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.optionTitle, isDarkMode && styles.textWhite]}>Cápsula del Tiempo</Text>
                <Text style={styles.optionDesc}>Crea recuerdos que se revelarán en el futuro</Text>
              </View>
            </TouchableOpacity>

            {/* Opción: IA */}
            <TouchableOpacity style={styles.menuOption} onPress={() => handleNavigation('/ai-assistant')}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                <Sparkles size={24} color="#9C27B0" />
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.optionTitle, isDarkMode && styles.textWhite]}>Asistente IA</Text>
                <Text style={styles.optionDesc}>Crea recuerdos con ayuda de la inteligencia artificial</Text>
              </View>
            </TouchableOpacity>

            {/* Botón Cancelar */}
            <TouchableOpacity
              style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.cancelText, isDarkMode && styles.textWhite]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  mainFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary, // Verde ALMA
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFF', // Borde blanco como en tu diseño
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  menuCardDark: {
    backgroundColor: '#1E1E1E',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textGroup: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    color: '#888',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#333',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textWhite: {
    color: '#FFF',
  },
});

export default AddButton;