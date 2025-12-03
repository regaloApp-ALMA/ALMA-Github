import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { Share2, Mail, Copy } from 'lucide-react-native';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';

export default function ShareTreeScreen() {
  const { tree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [shareAll, setShareAll] = useState(true);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const shareLink = useMemo(
    () => (tree ? `https://alma.app/share/tree/${tree.id}` : ''),
    [tree]
  );

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await Clipboard.setStringAsync(shareLink);
    Alert.alert('Enlace copiado', 'El enlace para compartir tu árbol se ha copiado al portapapeles.');
  };

  const handleShare = async () => {
    if (!email.trim()) {
      Alert.alert('Falta email', 'Por favor escribe el correo de la persona.');
      return;
    }

    if (!tree) {
      Alert.alert('Sin árbol', 'Aún no hemos podido cargar tu árbol.');
      return;
    }

    // Si no se comparte el árbol completo, debe haber al menos una rama seleccionada
    if (!shareAll && selectedBranchIds.length === 0) {
      Alert.alert('Selecciona ramas', 'Elige al menos una rama para compartir.');
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

      // 2. Dar permiso de ver mi árbol (según lo que elija el usuario)
      await supabase.from('tree_permissions').insert({
        tree_id: tree.id,
        recipient_email: email.toLowerCase().trim(),
        recipient_id: recipientUser?.id || null,
        scope: shareAll ? 'all' : 'custom',
        allowed_branch_ids: shareAll ? null : selectedBranchIds,
        access_level: 'view',
        granter_id: user?.id || null,
      });

      // 3. CREAR CONEXIÓN FAMILIAR: si ya tiene cuenta, lo añadimos como raíz en MI árbol
      if (recipientUser) {
        await supabase.from('family_connections').insert({
          user_id: user?.id,          // En MI árbol
          relative_id: recipientUser.id, // Ellos son la raíz
          relation: 'Familiar'
        });
      }

      Alert.alert('Invitación enviada', `Has invitado a ${email} a compartir su historia contigo.`);
      setEmail('');
      setPersonalMessage('');
      setSelectedBranchIds([]);
      setShareAll(true);
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
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Compartir Mi Árbol</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textLight]}>
            Comparte tu árbol con tus seres queridos y elige qué partes de tu historia quieres que vean.
          </Text>
        </View>

        {/* Invitar por correo */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Invitar por correo electrónico</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={email}
            onChangeText={setEmail}
            placeholder="Introduce el email de la persona"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark, { height: 80 }]}
            value={personalMessage}
            onChangeText={setPersonalMessage}
            placeholder="Mensaje personal (opcional)"
            placeholderTextColor={colors.gray}
            multiline
          />
        </View>

        {/* Qué quieres compartir */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>¿Qué quieres compartir?</Text>

          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.optionTitle, isDarkMode && styles.textWhite]}>Árbol completo</Text>
              <Text style={[styles.optionSubtitle, isDarkMode && styles.textLight]}>
                Incluye todas las ramas y frutos
              </Text>
            </View>
            <Switch
              value={shareAll}
              onValueChange={setShareAll}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={shareAll ? colors.primary : colors.gray}
            />
          </View>

          {!shareAll && (
            <>
              <Text style={[styles.branchesTitle, isDarkMode && styles.textWhite]}>
                Selecciona las ramas a compartir:
              </Text>
              {tree?.branches.map((branch) => {
                const selected = selectedBranchIds.includes(branch.id);
                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={styles.branchRow}
                    onPress={() => toggleBranch(branch.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.branchDot, { backgroundColor: branch.color || colors.primary }]} />
                    <Text style={[styles.branchName, isDarkMode && styles.textWhite]}>{branch.name}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxChecked]} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        {/* Enlace para compartir */}
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.label, isDarkMode && styles.textWhite]}>Enlace para compartir</Text>
          <View style={styles.linkRow}>
            <TextInput
              style={[styles.linkInput, isDarkMode && styles.inputDark]}
              value={shareLink}
              editable={false}
            />
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Copy size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.linkHelp, isDarkMode && styles.textLight]}>
            Este enlace permite a quien lo reciba ver solo las partes de tu árbol que has compartido.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, loading && styles.disabled]}
          onPress={handleShare}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.shareButtonText}>Compartir árbol</Text>
          )}
        </TouchableOpacity>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionSubtitle: { fontSize: 12, color: colors.textLight },
  branchesTitle: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.text },
  branchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  branchDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  branchName: { flex: 1, fontSize: 14, color: colors.text },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  linkInput: { flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  copyButton: { marginLeft: 8, backgroundColor: colors.primary, padding: 10, borderRadius: 8 },
  linkHelp: { fontSize: 12, color: colors.textLight, marginTop: 6 },
  shareButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4, marginBottom: 24 },
  disabled: { opacity: 0.7 },
  shareButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});