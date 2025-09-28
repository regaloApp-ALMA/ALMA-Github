import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Animated } from 'react-native';
import { Plus, Leaf, Apple, Clock, Sparkles, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const AddButton = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const toggleMenu = () => {
    if (!showModal) {
      setShowModal(true);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  };

  const handleAddBranch = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      router.push('/add-branch-options');
    });
  };

  const handleAddMemory = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      router.push('/add-memory-options');
    });
  };

  const handleTimeCapsule = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      router.push('/time-capsule');
    });
  };

  const handleAIAssistant = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      router.push('/ai-assistant');
    });
  };

  const handleCancel = () => {
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
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
        <Animated.View
          style={[styles.iconContainer, {
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '45deg'],
              }),
            }],
          }]}
        >
          <Plus size={28} color={colors.white} />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCancel}
        >
          <TouchableOpacity 
            style={[styles.modalContent, isDarkMode && styles.modalContentDark]} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>¿Qué quieres añadir?</Text>
              <TouchableOpacity 
                style={[styles.closeButton, isDarkMode && styles.closeButtonDark]} 
                onPress={handleCancel}
                testID="close-modal"
              >
                <X size={20} color={isDarkMode ? colors.white : colors.text} />
              </TouchableOpacity>
            </View>
            
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
            
          </TouchableOpacity>
        </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: colors.white,
  },
  primaryButtonDark: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  modalTitleDark: {
    color: colors.white,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalOptionDark: {
    borderBottomColor: '#333',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleDark: {
    color: colors.white,
  },
  optionDescription: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
  },
  optionDescriptionDark: {
    color: '#AAA',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddButton;