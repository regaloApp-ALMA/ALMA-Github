import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Share,
} from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { Share2, Mail, Copy, Link2, CheckCircle2, Check, ClipboardCopy } from 'lucide-react-native';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

export default function ShareTreeScreen() {
  const { tree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareEntireTree, setShareEntireTree] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  useEffect(() => {
    if (tree?.branches?.length) {
      setSelectedBranches(tree.branches.map(branch => branch.id));
    }
  }, [tree?.branches]);

  const shareCode = useMemo(() => {
    if (!tree?.id) return 'SIN-COD';
    const segment = tree.id.split('-')[0];
    return segment ? segment.toUpperCase() : tree.id;
  }, [tree?.id]);

  const shareLink = useMemo(() => {
    if (!tree?.id) return 'https://alma.app/share';
    return `https://alma.app/share/tree/${tree.id}`;
  }, [tree?.id]);

  const toggleBranch = (branchId: string) => {
    if (shareEntireTree) return;
    setSelectedBranches(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleShareEntireTreeToggle = (value: boolean) => {
    setShareEntireTree(value);
    if (value && tree?.branches?.length) {
      setSelectedBranches(tree.branches.map(branch => branch.id));
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert('Enlace copiado', 'El enlace se guardó en tu portapapeles.');
    } catch (copyError) {
      console.error('[ShareTree] Clipboard link error', copyError);
      Alert.alert('Error', 'No pudimos copiar el enlace.');
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(shareCode);
      Alert.alert('Código copiado', 'Comparte este código con tus familiares.');
    } catch (copyError) {
      console.error('[ShareTree] Clipboard code error', copyError);
      Alert.alert('Error', 'No pudimos copiar el código.');
    }
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `${message || 'Te invito a conocer mi árbol familiar.'} ${shareLink}`,
      });
    } catch (shareError) {
      console.error('[ShareTree] Native share error', shareError);
      Alert.alert('Error', 'No pudimos abrir el panel para compartir.');
    }
  };

  const handleEmailInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Falta email', 'Por favor escribe el correo de la persona.');
      return;
    }

    if (!tree?.id || !user?.id) {
      Alert.alert('Espera', 'Necesitamos tu árbol para compartir. Vuelve a intentarlo.');
      return;
    }

    if (!shareEntireTree && selectedBranches.length === 0) {
      Alert.alert('Selecciona ramas', 'Elige al menos una rama para compartir.');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: recipientUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      await supabase.from('tree_permissions').insert({
        tree_id: tree.id,
        granter_id: user.id,
        recipient_email: normalizedEmail,
        recipient_id: recipientUser?.id || null,
        access_level: 'view',
      });

      Alert.alert('Invitación enviada', `Compartiste tu árbol con ${normalizedEmail}.`);
      setEmail('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo compartir.');
    } finally {
      setLoading(false);
    }
  };

  const branchList = tree?.branches || [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Compartir Mi Árbol',
          headerShown: false,
        }}
      />

      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.heroCard}>
          <View style={styles.heroIconWrapper}>
            <Share2 size={32} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Comparte tu árbol con seres queridos</Text>
            <Text style={styles.heroSubtitle}>
              Envía invitaciones, comparte un enlace o facilita tu código único.
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Mail size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Invitar por correo electrónico</Text>
            </View>
          </View>

          <Text style={[styles.label, isDarkMode && styles.textLight]}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={email}
            onChangeText={setEmail}
            placeholder="Introduce el email de la persona"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="share-email-input"
          />

          <Text style={[styles.label, isDarkMode && styles.textLight]}>Mensaje personal (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDarkMode && styles.inputDark]}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje personal..."
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={4}
            testID="share-message-input"
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleEmailInvite}
            disabled={loading}
            testID="share-send-button"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar invitación</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>¿Qué quieres compartir?</Text>

          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.toggleTitle, isDarkMode && styles.textWhite]}>Árbol completo</Text>
              <Text style={[styles.toggleSubtitle, isDarkMode && styles.textLight]}>Incluye todas las ramas y frutos</Text>
            </View>
            <Switch
              value={shareEntireTree}
              onValueChange={handleShareEntireTreeToggle}
              thumbColor={shareEntireTree ? colors.white : '#FFF'}
              trackColor={{ false: colors.border, true: colors.primary }}
              testID="share-full-switch"
            />
          </View>

          {!shareEntireTree && (
            <View style={styles.branchesList}>
              {branchList.length === 0 ? (
                <Text style={[styles.emptyBranchesText, isDarkMode && styles.textLight]}>
                  Aún no tienes ramas para compartir.
                </Text>
              ) : (
                branchList.map((branch) => {
                  const checked = selectedBranches.includes(branch.id);
                  return (
                    <TouchableOpacity
                      key={branch.id}
                      style={styles.branchRow}
                      onPress={() => toggleBranch(branch.id)}
                      activeOpacity={0.8}
                      testID={`branch-checkbox-${branch.id}`}
                    >
                      <View style={[styles.branchColorDot, { backgroundColor: branch.color || colors.primary }]} />
                      <Text style={[styles.branchLabel, isDarkMode && styles.textWhite]}>{branch.name}</Text>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Check size={14} color={colors.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Enlace para compartir</Text>
          <View style={[styles.linkRow, isDarkMode && styles.linkRowDark]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkLabel, isDarkMode && styles.textLight]}>Comparte este enlace</Text>
              <Text style={[styles.linkValue, isDarkMode && styles.textWhite]} numberOfLines={2}>{shareLink}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleCopyLink} testID="share-copy-link">
              <Copy size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.secondaryButton]} onPress={handleShareLink} testID="share-native-button">
            <Link2 size={18} color={colors.white} />
            <Text style={styles.secondaryButtonText}>Compartir enlace</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Código de invitación</Text>
          <View style={styles.codeRow}>
            <View>
              <Text style={[styles.codeLabel, isDarkMode && styles.textLight]}>Comparte este código único</Text>
              <Text style={[styles.codeValue, isDarkMode && styles.textWhite]}>{shareCode}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleCopyCode} testID="share-copy-code">
              <ClipboardCopy size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.codeHint}>
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={[styles.codeHintText, isDarkMode && styles.textLight]}>
              Tus familiares podrán conectarse usando este código desde Conectar mis raíces.
            </Text>
          </View>
        </View>

        <Text style={styles.privacyNote}>
          Tus datos personales nunca se compartirán sin tu consentimiento explícito. Puedes revocar el acceso en cualquier momento.
        </Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  heroSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionCardDark: {
    backgroundColor: '#1E1E1E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  inputDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#444',
    color: colors.white,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  branchesList: {
    marginTop: 16,
    gap: 12,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  branchColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  branchLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.background,
    gap: 12,
  },
  linkRowDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#444',
  },
  linkLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  linkValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.text,
  },
  codeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  codeHintText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  privacyNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  emptyBranchesText: {
    fontSize: 14,
    color: colors.textLight,
  },
  textWhite: {
    color: colors.white,
  },
  textLight: {
    color: colors.textLight,
  },
});
