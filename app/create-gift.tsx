import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useGiftStore } from '@/stores/giftStore';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Gift, Clock, Send, Heart, Users } from 'lucide-react-native';

export default function CreateGiftScreen() {
  const [giftType, setGiftType] = useState<'instant' | 'timeCapsule' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const { createGift } = useGiftStore();
  const { tree } = useTreeStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const handleCreateGift = () => {
    if (!title.trim() || !description.trim() || !recipientEmail.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (giftType === 'timeCapsule' && !openDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha para abrir la cápsula del tiempo');
      return;
    }

    const gift = {
      title: title.trim(),
      description: description.trim(),
      recipientEmail: recipientEmail.trim(),
      type: giftType!,
      openDate: giftType === 'timeCapsule' ? openDate : undefined,
      branchId: selectedBranch || undefined,
    };

    createGift(gift);

    Alert.alert(
      'Regalo Creado',
      `Tu ${giftType === 'timeCapsule' ? 'cápsula del tiempo' : 'regalo'} ha sido enviado a ${recipientEmail}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        }
      ]
    );
  };

  if (!giftType) {
    return (
      <>
        <Stack.Screen 
          options={{
            title: 'Crear Regalo',
            headerStyle: {
              backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
            },
            headerTintColor: colors.white,
          }}
        />
        
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
          <View style={[styles.header, isDarkMode && styles.headerDark]}>
            <Gift size={48} color={colors.primary} />
            <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
              ¿Qué tipo de regalo quieres crear?
            </Text>
            <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
              Elige entre un regalo instantáneo o una cápsula del tiempo
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.giftTypeOption, isDarkMode && styles.giftTypeOptionDark]}
            onPress={() => setGiftType('instant')}
          >
            <View style={[styles.giftTypeIcon, { backgroundColor: colors.primary + '20' }]}>
              <Send size={32} color={colors.primary} />
            </View>
            <View style={styles.giftTypeContent}>
              <Text style={[styles.giftTypeTitle, isDarkMode && styles.giftTypeTitleDark]}>
                Regalo Instantáneo
              </Text>
              <Text style={[styles.giftTypeDescription, isDarkMode && styles.giftTypeDescriptionDark]}>
                El destinatario podrá abrir y ver tu regalo inmediatamente
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.giftTypeOption, isDarkMode && styles.giftTypeOptionDark]}
            onPress={() => setGiftType('timeCapsule')}
          >
            <View style={[styles.giftTypeIcon, { backgroundColor: colors.warning + '20' }]}>
              <Clock size={32} color={colors.warning} />
            </View>
            <View style={styles.giftTypeContent}>
              <Text style={[styles.giftTypeTitle, isDarkMode && styles.giftTypeTitleDark]}>
                Cápsula del Tiempo
              </Text>
              <Text style={[styles.giftTypeDescription, isDarkMode && styles.giftTypeDescriptionDark]}>
                El regalo se abrirá automáticamente en una fecha específica que elijas
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: giftType === 'timeCapsule' ? 'Cápsula del Tiempo' : 'Regalo Instantáneo',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.formHeader, isDarkMode && styles.formHeaderDark]}>
          {giftType === 'timeCapsule' ? (
            <Clock size={32} color={colors.warning} />
          ) : (
            <Heart size={32} color={colors.primary} />
          )}
          <Text style={[styles.formTitle, isDarkMode && styles.formTitleDark]}>
            {giftType === 'timeCapsule' ? 'Crear Cápsula del Tiempo' : 'Crear Regalo Especial'}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Título del regalo</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Para mi querida hermana"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Mensaje</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder="Escribe un mensaje especial..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email del destinatario</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            placeholder="ejemplo@email.com"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {giftType === 'timeCapsule' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha de apertura</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={openDate}
              onChangeText={setOpenDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            />
            <Text style={[styles.helpText, isDarkMode && styles.helpTextDark]}>
              La cápsula se abrirá automáticamente en esta fecha
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Incluir rama del árbol (opcional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchSelector}>
            <TouchableOpacity
              style={[
                styles.branchOption,
                !selectedBranch && styles.branchOptionSelected,
                isDarkMode && styles.branchOptionDark
              ]}
              onPress={() => setSelectedBranch('')}
            >
              <Text style={[
                styles.branchOptionText,
                !selectedBranch && styles.branchOptionTextSelected,
                isDarkMode && styles.branchOptionTextDark
              ]}>
                Ninguna
              </Text>
            </TouchableOpacity>
            
            {tree.branches.map(branch => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchOption,
                  selectedBranch === branch.id && styles.branchOptionSelected,
                  selectedBranch === branch.id && { backgroundColor: branch.color },
                  isDarkMode && styles.branchOptionDark
                ]}
                onPress={() => setSelectedBranch(branch.id)}
              >
                <Text style={[
                  styles.branchOptionText,
                  selectedBranch === branch.id && styles.branchOptionTextSelected,
                  isDarkMode && styles.branchOptionTextDark
                ]}>
                  {branch.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            (!title.trim() || !description.trim() || !recipientEmail.trim()) && styles.createButtonDisabled,
            isDarkMode && styles.createButtonDark
          ]}
          onPress={handleCreateGift}
          disabled={!title.trim() || !description.trim() || !recipientEmail.trim()}
        >
          <Text style={styles.createButtonText}>
            {giftType === 'timeCapsule' ? 'Crear Cápsula del Tiempo' : 'Enviar Regalo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 32,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerTitleDark: {
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  headerSubtitleDark: {
    color: '#AAA',
  },
  giftTypeOption: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  giftTypeOptionDark: {
    backgroundColor: '#1E1E1E',
  },
  giftTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  giftTypeContent: {
    flex: 1,
  },
  giftTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  giftTypeTitleDark: {
    color: colors.white,
  },
  giftTypeDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  giftTypeDescriptionDark: {
    color: '#AAA',
  },
  formHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
  },
  formHeaderDark: {
    backgroundColor: '#1E1E1E',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  formTitleDark: {
    color: colors.white,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  labelDark: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    color: colors.white,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  helpText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  helpTextDark: {
    color: '#AAA',
  },
  branchSelector: {
    flexDirection: 'row',
  },
  branchOption: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  branchOptionDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
  },
  branchOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  branchOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  branchOptionTextDark: {
    color: colors.white,
  },
  branchOptionTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  createButtonDark: {
    backgroundColor: colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});