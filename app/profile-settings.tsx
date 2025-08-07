import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react-native';

export default function ProfileSettingsScreen() {
  const { user, updateUser } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'El nombre y email son obligatorios');
      return;
    }

    updateUser({
      name: name.trim(),
      email: email.trim(),
    });

    Alert.alert(
      'Perfil Actualizado',
      'Tus datos han sido guardados correctamente',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Perfil Personal',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0) || 'U'}</Text>
          </View>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Personaliza tu perfil
          </Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Nombre completo</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre completo"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Mail size={20} color={colors.primary} />
            <Text style={[styles.label, isDarkMode && styles.labelDark]}>Email</Text>
          </View>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
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
            placeholder="+34 123 456 789"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            keyboardType="phone-pad"
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
            placeholder="Madrid, España"
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
            placeholder="DD/MM/YYYY"
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Biografía</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntanos algo sobre ti..."
            placeholderTextColor={isDarkMode ? '#666' : colors.gray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isDarkMode && styles.saveButtonDark]}
          onPress={handleSave}
        >
          <Save size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerTitleDark: {
    color: colors.white,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
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
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDark: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});