import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions } from 'react-native';
import { Plus, Leaf, Apple, Clock, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

const AddButton = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const toggleMenu = () => {
    setShowModal(!showModal);
  };

  const handleAddBranch = () => {
    setShowModal(false);
    router.push('/add-branch-options');
  };

  const handleAddMemory = () => {
    setShowModal(false);
    router.push('/add-memory-options');
  };

  const handleTimeCapsule = () => {
    setShowModal(false);
    router.push('/time-capsule');
  };

  const handleAIAssistant = () => {
    setShowModal(false);
    router.push('/ai-assistant');
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity 
        style={[styles.primaryButton, isDarkMode && styles.primaryButtonDark]} 
        onPress={toggleMenu}
        activeOpacity={0.8}
        testID="add-fab"
        accessibilityRole="button"
        accessibilityLabel="Abrir menú de añadir"
      >
        <Plus size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>¿Qué quieres añadir?</Text>
            
            <TouchableOpacity style={[styles.modalOption, isDarkMode && styles.modalOptionDark]} onPress={handleAddBranch} testID="add-branch">
              <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? colors.primary + '40' : colors.primaryLight }]}>
                <Leaf size={24} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Nueva Rama</Text>
                <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>Añade una nueva categoría a tu árbol</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.modalOption, isDarkMode && styles.modalOptionDark]} onPress={handleAddMemory} testID="add-fruit">
              <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? '#10b98140' : '#10b98120' }]}>
                <Apple size={24} color="#10b981" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Nuevo Fruto</Text>
                <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>Añade un recuerdo a tu árbol</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.modalOption, isDarkMode && styles.modalOptionDark]} onPress={handleTimeCapsule} testID="add-capsule">
              <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? colors.warning + '40' : colors.warning + '20' }]}>
                <Clock size={24} color={colors.warning} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Cápsula del Tiempo</Text>
                <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>Crea recuerdos que se revelarán en el futuro</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.modalOption, isDarkMode && styles.modalOptionDark]} onPress={handleAIAssistant} testID="add-ai">
              <View style={[styles.optionIcon, { backgroundColor: isDarkMode ? colors.secondary + '40' : colors.secondary + '20' }]}>
                <Sparkles size={24} color={colors.secondary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>Asistente AI</Text>
                <Text style={[styles.optionDescription, isDarkMode && styles.optionDescriptionDark]}>Deja que la IA te ayude a crear</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]} 
              onPress={() => setShowModal(false)}
              testID="add-cancel"
            >
              <Text style={[styles.cancelButtonText, isDarkMode && styles.cancelButtonTextDark]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    bottom: 0,
    zIndex: 100,
  },
  primaryButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#F9F6E8',
  },
  primaryButtonDark: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: colors.white,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalOptionDark: {
    borderBottomColor: '#333',
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleDark: {
    color: colors.white,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  optionDescriptionDark: {
    color: '#AAA',
  },
  aiIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  cancelButtonDark: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  cancelButtonTextDark: {
    color: colors.white,
  },
});

export default AddButton;