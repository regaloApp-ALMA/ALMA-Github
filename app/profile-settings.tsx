import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadMedia } from '@/lib/storageHelper';

export default function ProfileSettingsScreen() {
  const { user, initialize } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  // Estados locales para el formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // CARGAR DATOS AL ENTRAR
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      // Casteamos a 'any' porque UserType base a veces no tiene estos campos extendidos aún
      const u = user as any;
      setPhone(u.phone || '');
      setLocation(u.location || '');
      setBirthDate(u.birth_date || '');
      setBio(u.bio || '');
      setAvatarUrl(u.avatar_url || '');
    }
  }, [user]);

  // FUNCIÓN PARA CAMBIAR FOTO
  const handlePickImage = async () => {
    try {
      // SOLUCIÓN: Usar MediaTypeOptions con fallback seguro
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'Images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const uri = result.assets[0].uri;

        if (user?.id) {
          const publicUrl = await uploadMedia(uri, user.id, 'avatars');
          if (publicUrl) {
            setAvatarUrl(publicUrl);
          } else {
            Alert.alert("Error", "No se pudo subir la imagen");
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Error al seleccionar imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Guardar en Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          birth_date: birthDate.trim() || null,
          bio: bio.trim(),
          avatar_url: avatarUrl, // Guardamos la URL nueva
          // No es necesario tocar created_at; updated_at se actualiza en SQL con DEFAULT/trigger si lo usas
        })
        .eq('id', user?.id);

      if (error) throw error;

      // 2. IMPORTANTE: Recargar el estado global
      await initialize();

      Alert.alert('Perfil Actualizado', 'Tus datos se han guardado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Perfil',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>

        {/* SECCIÓN DE AVATAR */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{(name.charAt(0) || 'U').toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Camera size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, isDarkMode && styles.textLight]}>Cambiar foto</Text>
        </View>

        {/* FORMULARIO */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Nombre completo</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Mail size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark, { opacity: 0.6 }]}
            value={email}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Phone size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Teléfono</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+34..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Ubicación</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={location}
            onChangeText={setLocation}
            placeholder="Ciudad, País"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Fecha de nacimiento</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Biografía</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            placeholder="Sobre mí..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  containerDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  headerDark: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12 },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#333', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
  changePhotoText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  textLight: { color: '#CCC' },
  formGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginLeft: 8 },
  labelDark: { color: '#FFF' },
  input: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  inputDark: { backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF' },
  textArea: { backgroundColor: colors.white, borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border, minHeight: 100 },
  saveButton: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 10, marginBottom: 40 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
