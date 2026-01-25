import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, Image, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useGiftStore } from '@/stores/giftStore';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Gift, Clock, Send, Heart, Image as ImageIcon, X, Calendar, Mail } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { processMediaAsset } from '@/lib/mediaHelper';

export default function CreateGiftScreen() {
  const [activeStep, setActiveStep] = useState<'selection' | 'form'>('selection');

  // Tipos específicos para la UI (mapeados a 'instant' | 'timeCapsule' internamente)
  const [selectedOption, setSelectedOption] = useState<'message' | 'memory' | 'instant' | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [unlockDate, setUnlockDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { createGift } = useGiftStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const handleSelectOption = (option: 'message' | 'memory' | 'instant') => {
    setSelectedOption(option);
    setActiveStep('form');
  };

  const handlePickImage = async () => {
    try {
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: true,
        allowsMultipleSelection: true,
        quality: 0.6,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType?.Medium || 'medium' as any,
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && user?.id && result.assets) {
        // VALIDACIÓN DE LÍMITES
        const currentImages = mediaUrls.filter(url => !url.match(/\.(mp4|mov|m4v)$/i)).length;
        const currentVideos = mediaUrls.filter(url => url.match(/\.(mp4|mov|m4v)$/i)).length;

        let newImagesCount = 0;
        let newVideosCount = 0;

        // Contar qué intenta subir el usuario
        for (const asset of result.assets) {
          if (asset.type === 'video' || asset.uri.match(/\.(mp4|mov|m4v)$/i)) newVideosCount++;
          else newImagesCount++;
        }

        if (currentImages + newImagesCount > 10) {
          Alert.alert('Límite excedido', 'Solo puedes adjuntar un máximo de 10 fotos.');
          return;
        }
        if (currentVideos + newVideosCount > 3) {
          Alert.alert('Límite excedido', 'Solo puedes adjuntar un máximo de 3 videos.');
          return;
        }

        setIsUploading(true);
        try {
          const processedUris: string[] = [];

          for (const asset of result.assets) {
            try {
              const processedUri = await processMediaAsset({
                uri: asset.uri,
                type: asset.type,
                duration: asset.duration ?? undefined
              }, 'memory');
              if (processedUri) {
                processedUris.push(processedUri);
              }
            } catch (error: any) {
              console.error('Error procesando asset:', error);
            }
          }

          if (processedUris.length > 0) {
            const uploadPromises = processedUris.map(uri =>
              uploadMedia(uri, 'memories')
            );
            const uploadedUrls = await Promise.all(uploadPromises);
            const validUrls = uploadedUrls.filter(url => url !== null) as string[];
            setMediaUrls(prev => [...prev, ...validUrls]);
          }
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo abrir la galería. ' + (error.message || ''));
    }
  };

  const removeImage = (index: number) => {
    const newUrls = [...mediaUrls];
    newUrls.splice(index, 1);
    setMediaUrls(newUrls);
  };

  // Funciones para el selector de fecha y hora
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        const newDate = new Date(selectedDate);
        if (pickerMode === 'date') {
          newDate.setHours(unlockDate.getHours());
          newDate.setMinutes(unlockDate.getMinutes());
          setUnlockDate(newDate);
          setTimeout(() => {
            setPickerMode('time');
            setShowTimePicker(true);
          }, 300);
        } else if (pickerMode === 'time') {
          newDate.setFullYear(unlockDate.getFullYear());
          newDate.setMonth(unlockDate.getMonth());
          newDate.setDate(unlockDate.getDate());
          setUnlockDate(newDate);
        }
      }
    } else {
      const currentDate = selectedDate || unlockDate;
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setUnlockDate(currentDate);
      }
    }
  };

  const showDatepicker = () => {
    if (Platform.OS === 'ios') {
      setPickerMode('datetime');
      setShowDatePicker(true);
    } else {
      setPickerMode('date');
      setShowDatePicker(true);
    }
  };

  const showTimepicker = () => {
    if (Platform.OS === 'ios') {
      setPickerMode('datetime');
      setShowDatePicker(true);
    } else {
      setPickerMode('time');
      setShowTimePicker(true);
    }
  };

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { dateStr, timeStr };
  };

  const handleCreateGift = async () => {
    if (!title.trim() || !description.trim() || !recipientEmail.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Determinar tipo real para backend
    const isInstant = selectedOption === 'instant';
    const isTimeCapsule = selectedOption === 'message' || selectedOption === 'memory';

    if (isTimeCapsule) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 1);
      if (unlockDate <= minDate) {
        Alert.alert('Fecha inválida', 'Para ser una cápsula del tiempo, la fecha de apertura debe ser al menos mañana.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await createGift({
        type: isInstant ? 'fruit' : 'timeCapsule',
        recipientEmail: recipientEmail.trim(),
        message: description.trim(),
        content: {
          title: title,
          description: description,
          mediaUrls: mediaUrls
        },
        unlockDate: isTimeCapsule ? unlockDate.toISOString() : undefined,
      });

      let successTitle = 'Regalo Enviado';
      let successMsg = `Tu regalo ha sido enviado a ${recipientEmail}`;
      if (selectedOption === 'message') {
        successTitle = 'Carta Enviada';
        successMsg = `Tu carta al futuro ha sido programada para ${recipientEmail}`;
      } else if (selectedOption === 'memory') {
        successTitle = 'Cápsula Programada';
        successMsg = `Tu cápsula de recuerdo se abrirá en la fecha elegida.`;
      }

      Alert.alert(
        successTitle,
        successMsg,
        [{ text: 'Entendido', onPress: () => router.navigate('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🖥️ PANTALLA DE SELECCIÓN DE TIPO
  if (activeStep === 'selection') {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Crear Regalo',
            headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
          <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
            ¿Qué deseas regalar hoy?
          </Text>

          <ScrollView style={{ marginTop: 20 }}>
            {/* OPCIÓN 1: CÁPSULA DE MENSAJE */}
            <TouchableOpacity
              style={[styles.giftCard, isDarkMode && styles.giftCardDark]}
              onPress={() => handleSelectOption('message')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Mail size={32} color="#1565C0" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>Cápsula de Mensaje</Text>
                <Text style={[styles.cardDesc, isDarkMode && styles.textLight]}>
                  Escribe una carta emotiva para el futuro.
                </Text>
              </View>
            </TouchableOpacity>

            {/* OPCIÓN 2: CÁPSULA DEL TIEMPO (Antes Recuerdo) */}
            <TouchableOpacity
              style={[styles.giftCard, isDarkMode && styles.giftCardDark]}
              onPress={() => handleSelectOption('memory')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                <Gift size={32} color="#7B1FA2" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>Cápsula del Tiempo</Text>
                <Text style={[styles.cardDesc, isDarkMode && styles.textLight]}>
                  Envía recuerdos (fotos/videos) para abrir en el futuro.
                </Text>
              </View>
            </TouchableOpacity>

            {/* OPCIÓN 3: REGALO INSTANTÁNEO */}
            <TouchableOpacity
              style={[styles.giftCard, isDarkMode && styles.giftCardDark]}
              onPress={() => handleSelectOption('instant')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Send size={32} color="#2E7D32" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>Regalo Instantáneo</Text>
                <Text style={[styles.cardDesc, isDarkMode && styles.textLight]}>
                  Comparte un recuerdo ahora mismo.
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </>
    );
  }

  // 📝 PANTALLA DE FORMULARIO
  const getHeaderTitle = () => {
    switch (selectedOption) {
      case 'message': return 'Escribir Carta';
      case 'memory': return 'Cápsula del Tiempo';
      case 'instant': return 'Regalo Instantáneo';
      default: return 'Nuevo Regalo';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: getHeaderTitle(),
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>

        {/* Input: Título */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Título</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={title}
            onChangeText={setTitle}
            placeholder={selectedOption === 'message' ? "Ej: Para leer en tu boda" : "Ej: Un recuerdo especial"}
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            maxLength={100}
          />
        </View>

        {/* Input: Descripción / Mensaje */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>
            {selectedOption === 'message' ? 'Tu Carta (Solo texto)' : 'Mensaje / Descripción'}
          </Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            value={description}
            onChangeText={setDescription}
            placeholder={selectedOption === 'message' ? "Querido yo del futuro..." : "Escribe aquí..."}
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={5000}
          />
        </View>

        {/* Input: Email */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Enviar a (Email)</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            placeholder="ejemplo@email.com"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />
        </View>

        {/* Selector de Fecha (Solo para Cápsulas) */}
        {(selectedOption === 'message' || selectedOption === 'memory') && (() => {
          const { dateStr, timeStr } = formatDateTime(unlockDate);
          const minDate = new Date();
          minDate.setDate(minDate.getDate() + 1);

          return (
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha de Apertura</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={[styles.dateButton, isDarkMode && styles.dateButtonDark]}
                  onPress={showDatepicker}
                >
                  <Calendar size={20} color={isDarkMode ? '#FFF' : '#555'} />
                  <Text style={[styles.dateButtonText, isDarkMode && styles.textWhite]}>{dateStr}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateButton, isDarkMode && styles.dateButtonDark]}
                  onPress={showTimepicker}
                >
                  <Clock size={20} color={isDarkMode ? '#FFF' : '#555'} />
                  <Text style={[styles.dateButtonText, isDarkMode && styles.textWhite]}>{timeStr}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={unlockDate}
                  mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={minDate}
                />
              )}
              {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={unlockDate}
                  mode="time"
                  onChange={handleDateChange}
                />
              )}
              <Text style={[styles.helperText, isDarkMode && styles.helperTextDark]}>
                Se desbloqueará el {dateStr} a las {timeStr}
              </Text>
            </View>
          );
        })()}

        {/* Selector de Media (ESCONDIDO para Cápsula de Mensaje) */}
        {selectedOption !== 'message' && (
          <View style={styles.formGroup}>
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.label, isDarkMode && styles.labelDark, { marginBottom: 0 }]}>
                Adjuntar Recuerdos
              </Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                Límites: Máx 10 fotos, Máx 3 videos (15s c/u).
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
                {isUploading ? <ActivityIndicator size="small" color={colors.primary} /> : <ImageIcon size={24} color={colors.primary} />}
                <Text style={styles.attachText}>Seleccionar</Text>
              </TouchableOpacity>

              {mediaUrls.map((url, i) => (
                <View key={i} style={{ position: 'relative' }}>
                  <Image source={{ uri: url }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(i)}
                  >
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (!title || !description || !recipientEmail || isSaving) && styles.createButtonDisabled,
            isDarkMode && styles.createButtonDark
          ]}
          onPress={handleCreateGift}
          disabled={!title || !description || !recipientEmail || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>
              {selectedOption === 'message' ? 'Sellar y Enviar' : 'Enviar Regalo'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={{ alignSelf: 'center', marginBottom: 40 }} onPress={() => setActiveStep('selection')}>
          <Text style={{ color: colors.gray }}>Cancelar / Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },

  // Cards
  giftCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  giftCardDark: { backgroundColor: '#1E1E1E' },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18 },

  // Forms
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  labelDark: { color: '#FFF' },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
  textArea: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', minHeight: 120 },

  dateContainer: { flexDirection: 'row', gap: 10 },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', justifyContent: 'center', gap: 8 },
  dateButtonDark: { backgroundColor: '#2C2C2C', borderColor: '#444' },
  dateButtonText: { fontSize: 15, color: '#333' },
  helperText: { fontSize: 12, color: '#888', marginTop: 6 },
  helperTextDark: { color: '#AAA' },

  attachButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10 },
  attachText: { color: '#1565C0', fontWeight: 'bold', marginLeft: 8 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF5350', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },

  createButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 20, shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  createButtonDark: { backgroundColor: colors.primary },
  createButtonDisabled: { backgroundColor: '#CCC', shadowOpacity: 0 },
  createButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
