import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { Chrome, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useUserStore();
  const router = useRouter();

  // Redirigir automáticamente si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor, introduce tu email y contraseña');
      return;
    }

    try {
      await login(email, password);
      // Redirigir inmediatamente, luego mostrar mensaje (no bloqueante)
      router.replace('/(tabs)');
      // Mostrar mensaje después de un pequeño delay para no bloquear
      setTimeout(() => {
        Alert.alert(
          '✅ Inicio de sesión exitoso',
          '¡Bienvenido de nuevo a ALMA!'
        );
      }, 300);
    } catch (error: any) {
      let errorMessage = error.message || 'Credenciales incorrectas';

      if (error.message?.includes('Invalid login credentials') ||
        error.message?.includes('Invalid credentials')) {
        errorMessage = '❌ Email o contraseña incorrectos. Por favor, verifica tus credenciales.';
      } else if (error.message?.includes('User not found') ||
        error.message?.includes('does not exist')) {
        errorMessage = '❌ Esta cuenta no existe. Por favor, regístrate primero.';
      }

      Alert.alert('Error de inicio de sesión', errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('🔵 [Login] Iniciando login con Google...');
      await loginWithGoogle();
      // El listener del store manejará la actualización del estado
      // y el useEffect redirigirá cuando isAuthenticated cambie
      // No redirigir aquí manualmente, dejar que el callback y el listener lo manejen
    } catch (error: any) {
      console.error('❌ [Login] Error en Google login:', error);
      const errorMessage = error.message || 'No se pudo iniciar sesión con Google';
      Alert.alert('Error de autenticación', errorMessage);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
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
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
              style={styles.logoBackground}
            />
            <View style={styles.overlay} />
            <Text style={styles.logoText}>ALMA</Text>
            <Text style={styles.tagline}>Donde los recuerdos se convierten en raíces</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>

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
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.gray} />
                  ) : (
                    <Eye size={20} color={colors.gray} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>O continúa con</Text>
              <View style={styles.divider} />
            </View>

            {/* Aviso sobre Google Auth temporalmente deshabilitado */}
            <View style={styles.googleWarningContainer}>
              <Text style={styles.googleWarningText}>
                🚧 Estamos trabajando para habilitar el inicio con Google. Por favor, usa tu email y contraseña mientras tanto.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.googleButton, styles.googleButtonDisabled]}
              onPress={() => {
                Alert.alert(
                  'Google Auth temporalmente deshabilitado',
                  'Estamos trabajando para habilitar el inicio con Google. Por favor, usa tu email y contraseña mientras tanto.'
                );
              }}
              disabled={true}
            >
              <Chrome size={20} color={colors.textLight} style={{ marginRight: 10, opacity: 0.5 }} />
              <Text style={[styles.googleButtonText, styles.googleButtonTextDisabled]}>Google</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>¿Aún no tienes cuenta?</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>

            {/* Espaciador adicional para asegurar que haya espacio suficiente al final */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, paddingBottom: 200, paddingTop: 0 }, // Aumentado significativamente para dar mucho margen final
  logoContainer: { height: '35%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  logoBackground: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  logoText: { fontSize: 56, fontWeight: '900', color: colors.white, marginBottom: 8, letterSpacing: 2 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  formContainer: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: colors.textLight, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: colors.white, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  passwordContainer: { position: 'relative', width: '100%' },
  passwordInput: { backgroundColor: colors.white, borderRadius: 12, padding: 16, paddingRight: 50, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  eyeIcon: { position: 'absolute', right: 16, top: 16, zIndex: 10 },
  loginButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  orContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.textLight, marginHorizontal: 16, fontSize: 14 },
  googleWarningContainer: { marginBottom: 12, paddingHorizontal: 8 },
  googleWarningText: { fontSize: 12, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
  googleButton: { backgroundColor: colors.white, borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'center' },
  googleButtonDisabled: { opacity: 0.5, backgroundColor: colors.background },
  googleButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  googleButtonTextDisabled: { color: colors.textLight },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 40, flexWrap: 'wrap' },
  footerText: { color: colors.textLight, fontSize: 14 },
  registerLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  bottomSpacer: { height: 60 }, // Espaciador adicional para asegurar espacio al final
});
