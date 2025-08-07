import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, isLoading } = useUserStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, introduce tu email y contraseña');
      return;
    }
    
    try {
      await login(email, password);
      router.replace('/');
    } catch (error) {
      Alert.alert('Error de inicio de sesión', error instanceof Error ? error.message : 'Ha ocurrido un error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error de inicio de sesión con Google', error instanceof Error ? error.message : 'Ha ocurrido un error');
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Iniciar sesión', headerShown: false }} />
      
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
            <Text style={styles.tagline}>Tu árbol de recuerdos</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Iniciar sesión</Text>
            
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
                placeholder="Tu contraseña"
                placeholderTextColor={colors.gray}
                secureTextEntry
              />
            </View>
            
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Credenciales de prueba:</Text>
              <Text style={styles.demoText}>Email: demo@alma.com</Text>
              <Text style={styles.demoText}>Contraseña: demo123</Text>
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => {
                  setEmail('demo@alma.com');
                  setPassword('demo123');
                }}
              >
                <Text style={styles.demoButtonText}>Usar credenciales demo</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            
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
              <Text style={styles.orText}>O</Text>
              <View style={styles.divider} />
            </View>
            
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  logoContainer: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: colors.white,
  },
  formContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    color: colors.textLight,
    marginHorizontal: 16,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  demoContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  demoButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  demoButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});