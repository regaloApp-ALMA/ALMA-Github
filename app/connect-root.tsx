import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, MailSearch, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useTreeStore } from '@/stores/treeStore';

export default function ConnectRootScreen() {
  const { user } = useUserStore();
  const fetchMyTree = useTreeStore((state) => state.fetchMyTree);

  const [identifier, setIdentifier] = useState('');
  const [relation, setRelation] = useState('Ascendiente');
  const [loading, setLoading] = useState(false);

  const parseCode = (value: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.includes('/share/')) {
      const parts = trimmed.split('/');
      return parts.filter(Boolean).pop() || '';
    }
    return trimmed.replace(/\s+/g, '').toLowerCase();
  };

  const resolveRelativeProfile = async () => {
    const cleaned = identifier.trim();
    if (!cleaned) {
      throw new Error('Necesitas ingresar un código o correo.');
    }

    const isEmail = cleaned.includes('@');

    if (isEmail) {
      const normalized = cleaned.toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', normalized)
        .maybeSingle();
      if (error || !data) {
        throw new Error('No encontramos un perfil con ese correo.');
      }
      return data;
    }

    const normalizedCode = parseCode(cleaned);
    if (!normalizedCode) {
      throw new Error('El código no es válido.');
    }

    const { data: treeMatch, error: treeError } = await supabase
      .from('trees')
      .select('id, owner_id')
      .ilike('id', `${normalizedCode}%`)
      .limit(1)
      .maybeSingle();

    if (treeError || !treeMatch) {
      throw new Error('No encontramos un árbol con ese código.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', treeMatch.owner_id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('No pudimos recuperar el perfil del familiar.');
    }

    return profile;
  };

  const handleConnect = async () => {
    if (!user?.id) {
      Alert.alert('Sesión requerida', 'Inicia sesión para conectar una raíz.');
      return;
    }

    setLoading(true);
    try {
      console.log('[ConnectRoot] Resolviendo perfil para', identifier);
      const relativeProfile = await resolveRelativeProfile();

      const { data: existingConnection } = await supabase
        .from('family_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('relative_id', relativeProfile.id)
        .maybeSingle();

      if (existingConnection) {
        Alert.alert('Ya conectado', 'Este familiar ya forma parte de tus raíces.');
        setLoading(false);
        return;
      }

      await supabase.from('family_connections').insert({
        user_id: user.id,
        relative_id: relativeProfile.id,
        relation: relation.trim() || 'Ascendiente',
      });

      Alert.alert('Conexión creada', `${relativeProfile.name || 'Familiar'} se añadió a tus raíces.`);
      setIdentifier('');
      setRelation('Ascendiente');
      await fetchMyTree(true);
    } catch (error: any) {
      console.error('[ConnectRoot] Error conectando raíz', error);
      Alert.alert('Error', error.message || 'No pudimos conectar a tu familiar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Conectar mis raíces', headerShown: false }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <LinearGradient colors={['#0BAB64', '#3BB78F']} style={styles.heroCard}>
          <View style={styles.heroIconWrapper}>
            <Users size={30} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Conecta tus orígenes</Text>
            <Text style={styles.heroSubtitle}>
              Usa un código de invitación o el correo de un familiar para añadir raíces ascendentes.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>Código o correo del familiar</Text>
          <View style={styles.inputRow}>
            <MailSearch size={18} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="ABC123 o familiar@ejemplo.com"
              placeholderTextColor={colors.gray}
              autoCapitalize="none"
              testID="connect-identifier-input"
            />
          </View>
          <Text style={styles.helperText}>Aceptamos códigos recortados, enlaces completos o emails.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>¿Quién es esta raíz?</Text>
          <View style={styles.inputRow}>
            <MapPin size={18} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={relation}
              onChangeText={setRelation}
              placeholder="Madre, Abuelo, Bisabuela..."
              placeholderTextColor={colors.gray}
              autoCapitalize="sentences"
              testID="connect-relation-input"
            />
          </View>
          <Text style={styles.helperText}>Esto te ayudará a identificar cada conexión dentro del panel de raíces.</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleConnect}
          disabled={loading}
          testID="connect-submit-button"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Conectar raíz</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  heroSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textLight,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
