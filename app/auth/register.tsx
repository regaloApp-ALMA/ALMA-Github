import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useUserStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Faltan datos', 'Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const result = await register(name, email, password);
      
      // Si el registro fue exitoso y hay sesión (auto-login), redirigir a la app
      if (result.session) {
        Alert.alert(
          '¡Cuenta creada!',
          'Bienvenido a ALMA. Tu cuenta ha sido creada exitosamente.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                router.replace('/(tabs)');
              }
            }
          ]
        );
      } else {
        // Esto no debería pasar si la confirmación de email está desactivada,
        // pero por si acaso mostramos un mensaje
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada. Por favor, inicia sesión.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/auth/login');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      // Manejar errores específicos de manera amigable
      let errorMessage = error.message || 'Error al crear la cuenta';
      
      if (error.message?.includes('already registered') || 
          error.message?.includes('already exists') ||
          error.message?.includes('User already registered')) {
        errorMessage = 'Este email ya está registrado. Por favor, inicia sesión o usa otro email.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Por favor, introduce un email válido.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      }
      
      Alert.alert('Error de registro', errorMessage);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Empieza a construir tu legado digital hoy mismo.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={colors.gray}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.gray}
                secureTextEntry
              />
            </View>

            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros <Text style={styles.termsLink}>Términos</Text> y <Text style={styles.termsLink}>Política de Privacidad</Text>.
            </Text>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, padding: 24 },
  backButton: { marginTop: 40, marginBottom: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.textLight, lineHeight: 24 },
  formContainer: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.textLight, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  termsText: { fontSize: 13, color: colors.textLight, marginBottom: 24, lineHeight: 20, textAlign: 'center' },
  termsLink: { color: colors.primary, fontWeight: 'bold' },
  registerButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 18, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  registerButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  loginText: { color: colors.textLight, fontSize: 14 },
  loginLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
});
