import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { Share2, Mail, Copy } from 'lucide-react-native';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';

export default function ShareTreeScreen() {
  const { tree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) {
      Alert.alert('Falta email', 'Por favor escribe el correo de la persona.');
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar si el usuario destino existe en ALMA
      const { data: recipientUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      // 2. Dar permiso de ver mi árbol (siempre, exista o no)
      await supabase.from('tree_permissions').insert({
        tree_id: tree?.id,
        granter_id: user?.id,
        recipient_email: email.toLowerCase().trim(),
        recipient_id: recipientUser?.id || null,
        access_level: 'view'
      });

      // 3. CREAR RAÍZ: Si existe, le insertamos la conexión familiar directamente
      if (recipientUser) {
        await supabase.from('family_connections').insert({
          user_id: recipientUser.id, // En SU árbol
          relative_id: user?.id,     // YO soy la raíz
          relation: 'Familiar'
        });
      }

      Alert.alert('Invitación enviada', `Ahora apareces en las raíces de ${email}.`);
      setEmail('');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo compartir. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Compartir Árbol',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Share2 size={40} color={colors.primary} />
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Invita a familiares</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textLight]}>
            Permite que tus seres queridos vean crecer tu árbol y tú aparecerás en sus raíces.
          </Text>
        </View>

        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Enviar invitación por correo</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={email}
            onChangeText={setEmail}
            placeholder="familiar@ejemplo.com"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.shareButton, loading && styles.disabled]}
            onPress={handleShare}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.shareButtonText}>Enviar Invitación</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 10 },
  subtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center', marginTop: 5 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 20, shadowOpacity: 0.1, elevation: 3 },
  cardDark: { backgroundColor: '#1E1E1E' },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
  shareButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  disabled: { opacity: 0.7 },
  shareButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});