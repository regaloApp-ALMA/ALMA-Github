import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, Image, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useGiftStore } from '@/stores/giftStore';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Gift, Clock, Send, Heart, Image as ImageIcon, X, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { processMediaAsset } from '@/lib/mediaHelper';

export default function CreateGiftScreen() {
  const [giftType, setGiftType] = useState<'instant' | 'timeCapsule' | null>(null);
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

  const handlePickImage = async () => {
    try {
      // Configuración optimizada: videoQuality para reducir peso de videos
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions?.All || 'All' as any,
        allowsEditing: true,
        allowsMultipleSelection: true, // Permitir múltiples selecciones
        quality: 0.6,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType?.Medium || 'medium' as any,
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && user?.id && result.assets) {
        setIsUploading(true);
        try {
          // 📸 OPTIMIZACIÓN: Procesar y validar cada asset antes de subir
          const processedUris: string[] = [];
          
          for (const asset of result.assets) {
            try {
              const processedUri = await processMediaAsset(asset, 'memory');
              if (processedUri) {
                processedUris.push(processedUri);
              }
            } catch (error: any) {
              console.error('Error procesando asset:', error);
              // Continuar con el siguiente asset si uno falla
            }
          }
          
          // Subir todos los archivos procesados
          if (processedUris.length > 0) {
            const uploadPromises = processedUris.map(uri => 
              uploadMedia(uri, user.id, 'memories')
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

  // Formatear fecha y hora para mostrar
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

    if (giftType === 'timeCapsule') {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 1);
      if (unlockDate <= minDate) {
        Alert.alert('Error', 'La fecha de apertura debe ser al menos mañana');
        return;
      }
    }

    setIsSaving(true);
    try {
      await createGift({
        type: giftType === 'timeCapsule' ? 'timeCapsule' : 'fruit',
        recipientEmail: recipientEmail.trim(),
        message: description.trim(),
        content: {
          title: title,
          description: description,
          mediaUrls: mediaUrls
        },
        unlockDate: giftType === 'timeCapsule' ? unlockDate.toISOString() : undefined,
      });

      Alert.alert(
        'Regalo Enviado',
        `Tu ${giftType === 'timeCapsule' ? 'cápsula del tiempo' : 'regalo'} ha sido enviado a ${recipientEmail}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!giftType) {
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
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
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
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Mensaje / Recuerdo</Text>
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

        {giftType === 'timeCapsule' && (() => {
          const { dateStr, timeStr } = formatDateTime(unlockDate);
          const minDate = new Date();
          minDate.setDate(minDate.getDate() + 1);
          
          return (
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha y hora de apertura</Text>
              
              {Platform.OS === 'android' ? (
                <View style={styles.dateTimeButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, isDarkMode && styles.datePickerButtonDark]}
                    onPress={showDatepicker}
                  >
                    <Calendar size={20} color={isDarkMode ? colors.white : colors.text} />
                    <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                      📅 Fecha: {dateStr}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.datePickerButton, isDarkMode && styles.datePickerButtonDark]}
                    onPress={showTimepicker}
                  >
                    <Clock size={20} color={isDarkMode ? colors.white : colors.text} />
                    <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                      ⏰ Hora: {timeStr}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.datePickerButton, isDarkMode && styles.datePickerButtonDark]}
                  onPress={showDatepicker}
                >
                  <Calendar size={20} color={isDarkMode ? colors.white : colors.text} />
                  <Text style={[styles.dateText, isDarkMode && styles.dateTextDark]}>
                    {dateStr} a las {timeStr}
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={unlockDate}
                  mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={minDate}
                  themeVariant={isDarkMode ? 'dark' : 'light'}
                />
              )}

              {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={unlockDate}
                  mode="time"
                  display="default"
                  onChange={handleDateChange}
                  themeVariant={isDarkMode ? 'dark' : 'light'}
                />
              )}

              <Text style={[styles.helperText, isDarkMode && styles.helperTextDark]}>
                La cápsula se abrirá automáticamente el {dateStr} a las {timeStr}
              </Text>
            </View>
          );
        })()}

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Adjuntar recuerdos (Fotos/Videos)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
              {isUploading ? <ActivityIndicator size="small" color={colors.primary} /> : <ImageIcon size={24} color={colors.primary} />}
              <Text style={styles.attachText}>Añadir</Text>
            </TouchableOpacity>

            <ScrollView horizontal style={{ marginLeft: 10 }}>
              {mediaUrls.map((url, i) => (
                <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                  <Image source={{ uri: url }} style={{ width: 50, height: 50, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(i)}
                  >
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

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
              {giftType === 'timeCapsule' ? 'Sellar Cápsula' : 'Enviar Regalo'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  containerDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', padding: 32, backgroundColor: colors.white, borderRadius: 16, marginBottom: 32 },
  headerDark: { backgroundColor: '#1E1E1E' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  headerTitleDark: { color: colors.white },
  headerSubtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center', lineHeight: 22 },
  headerSubtitleDark: { color: '#AAA' },
  giftTypeOption: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  giftTypeOptionDark: { backgroundColor: '#1E1E1E' },
  giftTypeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  giftTypeContent: { flex: 1 },
  giftTypeTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  giftTypeTitleDark: { color: colors.white },
  giftTypeDescription: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  giftTypeDescriptionDark: { color: '#AAA' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  labelDark: { color: colors.white },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  inputDark: { backgroundColor: '#1E1E1E', borderColor: '#333', color: colors.white },
  textArea: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, minHeight: 120 },
  createButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 32 },
  createButtonDark: { backgroundColor: colors.primary },
  createButtonDisabled: { backgroundColor: colors.gray },
  createButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  attachButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', padding: 10, borderRadius: 10 },
  attachText: { color: colors.primary, fontWeight: 'bold', marginLeft: 6 },
  removeImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dateTimeButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 8 },
  datePickerButtonDark: { backgroundColor: '#1E1E1E', borderColor: '#333' },
  dateText: { fontSize: 16, color: colors.text },
  dateTextDark: { color: colors.white },
  helperText: { fontSize: 12, color: colors.textLight, marginTop: 8 },
  helperTextDark: { color: '#AAA' }
});
