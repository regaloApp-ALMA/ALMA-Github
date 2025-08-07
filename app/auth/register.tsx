import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useUserStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    try {
      await register(name, email, password);
      router.replace('/');
    } catch (error) {
      Alert.alert('Error de registro', error instanceof Error ? error.message : 'Ha ocurrido un error');
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Registro', headerShown: false }} />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a ALMA y comienza a crear tu árbol de recuerdos</Text>
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
                placeholder="Crea una contraseña"
                placeholderTextColor={colors.gray}
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.gray}
                secureTextEntry
              />
            </View>
            
            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros <Text style={styles.termsLink}>Términos y Condiciones</Text> y <Text style={styles.termsLink}>Política de Privacidad</Text>.
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
              <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={navigateToLogin}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
  },
  formContainer: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
  termsText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  loginText: {
    color: colors.textLight,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});