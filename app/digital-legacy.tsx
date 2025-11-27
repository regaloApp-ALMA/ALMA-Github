import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { FileText, Info, User, Calendar, Mail, Phone, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';

export default function DigitalLegacyScreen() {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [heirName, setHeirName] = useState('');
  const [heirEmail, setHeirEmail] = useState('');
  const [heirPhone, setHeirPhone] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [message, setMessage] = useState('');
  const [shareFullTree, setShareFullTree] = useState(true);
  const [sharePrivateBranches, setSharePrivateBranches] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    async function fetchLegacy() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('digital_legacies')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setHeirName(data.heir_name || '');
          setHeirEmail(data.heir_email || '');
          setHeirPhone(data.heir_phone || '');
          setActivationDate(data.activation_date || '');
          setMessage(data.message || '');
          setShareFullTree(data.share_full_tree);
          setSharePrivateBranches(data.share_private);
        }
      } catch (e) {
        // Si no existe, no pasa nada, es nuevo
      } finally {
        setLoading(false);
      }
    }
    fetchLegacy();
  }, [user]);

  const handleSave = async () => {
    if (!heirName || !heirEmail) {
      Alert.alert('Datos incompletos', 'Por favor indica al menos el nombre y email del heredero.');
      return;
    }

    setSaving(true);
    try {
      const legacyData = {
        user_id: user?.id,
        heir_name: heirName,
        heir_email: heirEmail,
        heir_phone: heirPhone,
        activation_date: activationDate || null, // Debería ser un Date picker real
        message: message,
        share_full_tree: shareFullTree,
        share_private: sharePrivateBranches,
        updated_at: new Date().toISOString()
      };

      // Upsert (Insertar o Actualizar)
      const { error } = await supabase
        .from('digital_legacies')
        .upsert(legacyData, { onConflict: 'user_id' });

      if (error) throw error;

      Alert.alert('Guardado', 'Tu testamento digital ha sido actualizado correctamente.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, isDarkMode && styles.containerDark]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Testamento Digital',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
          <View style={styles.infoHeader}>
            <FileText size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, isDarkMode && styles.textWhite]}>¿Qué es el testamento digital?</Text>
          </View>
          <Text style={[styles.infoText, isDarkMode && styles.textLight]}>
            Designa a una persona de confianza que recibirá acceso a tu árbol en el futuro. ALMA se encargará de contactarle en la fecha que elijas.
          </Text>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Heredero Digital</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.textLight]}>Nombre completo</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={heirName}
              onChangeText={setHeirName}
              placeholder="Nombre del heredero"
              placeholderTextColor={colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.textLight]}>Email de contacto</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={heirEmail}
              onChangeText={setHeirEmail}
              placeholder="email@ejemplo.com"
              keyboardType="email-address"
              placeholderTextColor={colors.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDarkMode && styles.textLight]}>Fecha de activación (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={activationDate}
              onChangeText={setActivationDate}
              placeholder="2050-01-01"
              placeholderTextColor={colors.gray}
            />
          </View>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Tu legado</Text>

          <View style={styles.switchItem}>
            <Text style={[styles.switchLabel, isDarkMode && styles.textWhite]}>Compartir árbol completo</Text>
            <Switch
              value={shareFullTree}
              onValueChange={setShareFullTree}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
            />
          </View>

          <View style={styles.switchItem}>
            <Text style={[styles.switchLabel, isDarkMode && styles.textWhite]}>Incluir ramas privadas</Text>
            <Switch
              value={sharePrivateBranches}
              onValueChange={setSharePrivateBranches}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }, isDarkMode && styles.textLight]}>Mensaje de despedida</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDarkMode && styles.inputDark]}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe unas palabras para cuando reciban el acceso..."
            multiline
            placeholderTextColor={colors.gray}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Save size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Testamento</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  containerDark: { backgroundColor: '#121212' },
  center: { justifyContent: 'center', alignItems: 'center' },
  infoCard: { backgroundColor: colors.primaryLight, padding: 16, borderRadius: 12, marginBottom: 20 },
  infoCardDark: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 8 },
  infoText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#CCC' },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 20, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionDark: { backgroundColor: '#1E1E1E' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: colors.textLight, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.border },
  inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  switchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  switchLabel: { fontSize: 16, color: colors.text },
  saveButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});