import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Switch, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Clock, Calendar, Lock, MessageSquare, Image as ImageIcon, Users, Gift } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '@/stores/themeStore';

export default function TimeCapsuleScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recipients, setRecipients] = useState('');
  const [includeMedia, setIncludeMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifyRecipients, setNotifyRecipients] = useState(true);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || unlockDate;
    setShowDatePicker(Platform.OS === 'ios');
    setUnlockDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleAddMedia = () => {
    // In a real app, this would open the image picker
    setMediaUrl('https://images.unsplash.com/photo-1522165078649-823cf4dbaf46?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
    setIncludeMedia(true);
  };

  const handleCreateCapsule = () => {
    // Here we would save the time capsule
    // For now, just navigate back
    router.back();
  };

  // Calculate minimum date (today + 1 day)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Cápsula del Tiempo',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.warning,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Clock size={32} color={colors.warning} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Crea una cápsula del tiempo</Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Guarda recuerdos que se revelarán en una fecha futura específica
          </Text>
        </View>
        
        <View style={[styles.formSection, isDarkMode && styles.formSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Detalles de la cápsula</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Título</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Mi cumpleaños 30, Aniversario..."
              placeholderTextColor={isDarkMode ? '#777' : colors.gray}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Mensaje</Text>
            <TextInput
              style={[styles.textArea, isDarkMode && styles.textAreaDark]}
              value={message}
              onChangeText={setMessage}
              placeholder="Escribe un mensaje para el futuro..."
              placeholderTextColor={isDarkMode ? '#777' : colors.gray}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha de apertura</Text>
            <TouchableOpacity 
              style={[styles.datePickerButton, isDarkMode && styles.datePickerButtonDark]} 
              onPress={showDatepicker}
            >
              <Calendar size={20} color={isDarkMode ? colors.white : colors.text} />
              <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                {unlockDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={unlockDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={minDate}
                themeVariant={isDarkMode ? 'dark' : 'light'}
              />
            )}
            
            <Text style={[styles.helperText, isDarkMode && styles.helperTextDark]}>
              La cápsula se abrirá automáticamente en esta fecha
            </Text>
          </View>
        </View>
        
        <View style={[styles.formSection, isDarkMode && styles.formSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Contenido multimedia</Text>
          
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, isDarkMode && styles.switchLabelDark]}>Incluir imagen o video</Text>
            <Switch
              value={includeMedia}
              onValueChange={setIncludeMedia}
              trackColor={{ false: colors.lightGray, true: colors.warning + '50' }}
              thumbColor={includeMedia ? colors.warning : isDarkMode ? '#555' : '#f4f3f4'}
            />
          </View>
          
          {includeMedia && (
            <View style={styles.mediaSection}>
              {mediaUrl ? (
                <Image source={{ uri: mediaUrl }} style={styles.mediaPreview} />
              ) : (
                <TouchableOpacity style={styles.addMediaButton} onPress={handleAddMedia}>
                  <ImageIcon size={24} color={isDarkMode ? colors.white : colors.text} />
                  <Text style={[styles.addMediaText, isDarkMode && styles.addMediaTextDark]}>Añadir imagen o video</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        <View style={[styles.formSection, isDarkMode && styles.formSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Destinatarios</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Compartir con (opcional)</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={recipients}
              onChangeText={setRecipients}
              placeholder="Emails separados por comas"
              placeholderTextColor={isDarkMode ? '#777' : colors.gray}
            />
            <Text style={[styles.helperText, isDarkMode && styles.helperTextDark]}>
              Deja en blanco para mantenerlo solo para ti
            </Text>
          </View>
          
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, isDarkMode && styles.switchLabelDark]}>Notificar a destinatarios</Text>
              <Text style={[styles.switchDescription, isDarkMode && styles.switchDescriptionDark]}>
                Enviar email cuando la cápsula esté lista
              </Text>
            </View>
            <Switch
              value={notifyRecipients}
              onValueChange={setNotifyRecipients}
              trackColor={{ false: colors.lightGray, true: colors.warning + '50' }}
              thumbColor={notifyRecipients ? colors.warning : isDarkMode ? '#555' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, isDarkMode && styles.switchLabelDark]}>Cápsula privada</Text>
              <Text style={[styles.switchDescription, isDarkMode && styles.switchDescriptionDark]}>
                Solo tú podrás verla cuando se abra
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.lightGray, true: colors.warning + '50' }}
              thumbColor={isPrivate ? colors.warning : isDarkMode ? '#555' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.capsuleTypes}>
          <Text style={[styles.capsuleTypesTitle, isDarkMode && styles.capsuleTypesTitleDark]}>Tipos de cápsulas</Text>
          
          <TouchableOpacity style={[styles.capsuleTypeCard, isDarkMode && styles.capsuleTypeCardDark]}>
            <View style={[styles.capsuleTypeIcon, { backgroundColor: colors.warning + '30' }]}>
              <MessageSquare size={24} color={colors.warning} />
            </View>
            <View style={styles.capsuleTypeContent}>
              <Text style={[styles.capsuleTypeName, isDarkMode && styles.capsuleTypeNameDark]}>Mensaje</Text>
              <Text style={[styles.capsuleTypeDescription, isDarkMode && styles.capsuleTypeDescriptionDark]}>
                Texto que se revelará en el futuro
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.capsuleTypeCard, isDarkMode && styles.capsuleTypeCardDark]}>
            <View style={[styles.capsuleTypeIcon, { backgroundColor: colors.primary + '30' }]}>
              <Gift size={24} color={colors.primary} />
            </View>
            <View style={styles.capsuleTypeContent}>
              <Text style={[styles.capsuleTypeName, isDarkMode && styles.capsuleTypeNameDark]}>Regalo</Text>
              <Text style={[styles.capsuleTypeDescription, isDarkMode && styles.capsuleTypeDescriptionDark]}>
                Envía un regalo digital que se abrirá en una fecha especial
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.capsuleTypeCard, isDarkMode && styles.capsuleTypeCardDark]}>
            <View style={[styles.capsuleTypeIcon, { backgroundColor: colors.secondary + '30' }]}>
              <Users size={24} color={colors.secondary} />
            </View>
            <View style={styles.capsuleTypeContent}>
              <Text style={[styles.capsuleTypeName, isDarkMode && styles.capsuleTypeNameDark]}>Grupal</Text>
              <Text style={[styles.capsuleTypeDescription, isDarkMode && styles.capsuleTypeDescriptionDark]}>
                Crea una cápsula colaborativa con amigos o familia
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.capsuleTypeCard, isDarkMode && styles.capsuleTypeCardDark]}>
            <View style={[styles.capsuleTypeIcon, { backgroundColor: colors.error + '30' }]}>
              <Lock size={24} color={colors.error} />
            </View>
            <View style={styles.capsuleTypeContent}>
              <Text style={[styles.capsuleTypeName, isDarkMode && styles.capsuleTypeNameDark]}>Legado</Text>
              <Text style={[styles.capsuleTypeDescription, isDarkMode && styles.capsuleTypeDescriptionDark]}>
                Mensaje que se entregará a tus seres queridos en caso de fallecimiento
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.createButton, 
            (!title || !message) && styles.createButtonDisabled
          ]} 
          onPress={handleCreateCapsule}
          disabled={!title || !message}
        >
          <Text style={styles.createButtonText}>Crear cápsula del tiempo</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
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
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
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
    maxWidth: '80%',
  },
  headerSubtitleDark: {
    color: '#AAA',
  },
  formSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formSectionDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  labelDark: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDark: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: colors.white,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  textAreaDark: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: colors.white,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  dateTextDark: {
    color: colors.white,
  },
  helperText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  helperTextDark: {
    color: '#888',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  switchLabelDark: {
    color: colors.white,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  switchDescriptionDark: {
    color: '#888',
  },
  mediaSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  addMediaButton: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  addMediaTextDark: {
    color: colors.white,
  },
  capsuleTypes: {
    padding: 16,
    marginBottom: 16,
  },
  capsuleTypesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  capsuleTypesTitleDark: {
    color: colors.white,
  },
  capsuleTypeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  capsuleTypeCardDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  capsuleTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  capsuleTypeContent: {
    flex: 1,
  },
  capsuleTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  capsuleTypeNameDark: {
    color: colors.white,
  },
  capsuleTypeDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  capsuleTypeDescriptionDark: {
    color: '#888',
  },
  createButton: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 30,
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