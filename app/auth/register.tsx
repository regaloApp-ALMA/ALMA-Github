import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, isAuthenticated } = useUserStore();
  const router = useRouter();

  // Redirigir automáticamente si ya está autenticado (después de registro exitoso)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Función de validación de contraseña
  const validatePassword = (pwd: string): { isValid: boolean; message?: string } => {
    if (pwd.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una mayúscula.' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una minúscula.' };
    }
    if (!/[0-9]/.test(pwd)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número.' };
    }
    return { isValid: true };
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Faltan datos', 'Por favor, completa todos los campos.');
      return;
    }

    // Validar contraseña con los nuevos requisitos
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Contraseña inválida', passwordValidation.message || 'La contraseña no cumple los requisitos.');
      return;
    }

    try {
      const result = await register(name, email, password);
      
      // Si el registro fue exitoso y hay sesión (auto-login), redirigir inmediatamente
      if (result.session) {
        // Redirigir primero, luego mostrar mensaje (no bloqueante)
        router.replace('/(tabs)');
        // Mostrar mensaje después de un pequeño delay para no bloquear
        setTimeout(() => {
          Alert.alert(
            '✅ Cuenta creada',
            '¡Bienvenido a ALMA! Tu cuenta ha sido creada exitosamente.'
          );
        }, 300);
      } else {
        // Caso raro: sin verificación de email debería haber sesión, pero por si acaso
        // Esperar un momento y verificar si se actualizó el estado
        setTimeout(() => {
          if (isAuthenticated) {
            router.replace('/(tabs)');
            setTimeout(() => {
              Alert.alert(
                '✅ Cuenta creada',
                '¡Bienvenido a ALMA! Tu cuenta ha sido creada exitosamente.'
              );
            }, 300);
          } else {
            Alert.alert(
              'Cuenta creada',
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
        }, 500);
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
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número"
                placeholderTextColor={colors.gray}
                secureTextEntry
              />
              <Text style={styles.passwordHint}>
                La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.
              </Text>
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
  scrollContainer: { flexGrow: 1, padding: 24, paddingBottom: 100 },
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
  passwordHint: { fontSize: 12, color: colors.textLight, marginTop: 6, lineHeight: 16 },
  registerButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 18, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  registerButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  loginText: { color: colors.textLight, fontSize: 14 },
  loginLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
});
