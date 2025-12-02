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
import { Share2, Mail, Copy, Link2, CheckCircle2, ClipboardCopy, Shield } from 'lucide-react-native';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

type ShareScope = 'all' | 'custom';

export default function ShareTreeScreen() {
  const { tree } = useTreeStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareScope, setShareScope] = useState<ShareScope>('all');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const branches = useMemo(() => tree?.branches || [], [tree?.branches]);
  const allBranchIds = useMemo(() => branches.map((branch) => branch.id), [branches]);

  useEffect(() => {
    setSelectedBranches(branches.map((branch) => branch.id));
    if (!branches.length) {
      setShareScope('all');
    }
  }, [branches]);

  const shareCode = useMemo(() => {
    if (!tree?.id) return 'SIN-COD';
    const segment = tree.id.split('-')[0];
    return segment ? segment.toUpperCase() : tree.id;
  }, [tree?.id]);

  const shareLink = useMemo(() => {
    if (!tree?.id) return 'https://alma.app/share';
    return `https://alma.app/share/tree/${tree.id}`;
  }, [tree?.id]);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert('Enlace copiado', 'El enlace se guardó en tu portapapeles.');
    } catch (copyError) {
      console.error('[ShareTree] copy link error', copyError);
      Alert.alert('Error', 'No pudimos copiar el enlace.');
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(shareCode);
      Alert.alert('Código copiado', 'Comparte este código con tus familiares.');
    } catch (copyError) {
      console.error('[ShareTree] copy code error', copyError);
      Alert.alert('Error', 'No pudimos copiar el código.');
    }
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `${message || 'Te invito a conocer mi árbol familiar.'} ${shareLink}`,
      });
    } catch (shareError) {
      console.error('[ShareTree] native share error', shareError);
      Alert.alert('Error', 'No pudimos abrir el panel para compartir.');
    }
  };

  const handleSelectAllToggle = (value: boolean) => {
    if (value) {
      setShareScope('all');
      setSelectedBranches(allBranchIds);
    } else {
      setShareScope('custom');
      setSelectedBranches([]);
    }
  };

  const toggleBranch = (branchId: string, enabled: boolean) => {
    if (shareScope === 'all' && !enabled) {
      setShareScope('custom');
      setSelectedBranches(allBranchIds.filter((id) => id !== branchId));
      return;
    }

    setShareScope('custom');
    setSelectedBranches((prev) => {
      if (enabled) {
        if (prev.includes(branchId)) return prev;
        return [...prev, branchId];
      }
      return prev.filter((id) => id !== branchId);
    });
  };

  const canSend = shareScope === 'all' || selectedBranches.length > 0;

  const handleEmailInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Falta email', 'Por favor escribe el correo de la persona.');
      return;
    }

    if (!tree?.id || !user?.id) {
      Alert.alert('Espera', 'Necesitamos tu árbol para compartir. Vuelve a intentarlo.');
      return;
    }

    if (!canSend) {
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
        scope: shareScope,
        allowed_branch_ids: shareScope === 'all' ? null : selectedBranches,
        personal_message: message || null,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Compartir Mi Árbol',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer} testID="share-scroll">
        <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.heroCard} testID="share-hero">
          <View style={styles.heroIconWrapper}>
            <Share2 size={32} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Comparte tu árbol con seres queridos</Text>
            <Text style={styles.heroSubtitle}>
              Selecciona qué ramas compartir, invita por email o genera acceso seguro.
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Shield size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Alcance del acceso</Text>
            </View>
            <Text style={[styles.scopeSummary, isDarkMode && styles.textLight]}>
              {shareScope === 'all' ? 'Compartiendo todo el árbol' : `${selectedBranches.length} ramas seleccionadas`}
            </Text>
          </View>

          <View style={styles.scopeCard}>
            <View>
              <Text style={[styles.toggleTitle, isDarkMode && styles.textWhite]}>Seleccionar todo</Text>
              <Text style={[styles.toggleSubtitle, isDarkMode && styles.textLight]}>Incluye todas las ramas actuales y futuras</Text>
            </View>
            <Switch
              value={shareScope === 'all'}
              onValueChange={handleSelectAllToggle}
              thumbColor={shareScope === 'all' ? colors.white : '#FFF'}
              trackColor={{ false: colors.border, true: colors.primary }}
              testID="share-select-all-switch"
            />
          </View>

          {branches.length > 0 && (
            <View style={styles.branchGrid}>
              {branches.map((branch) => {
                const enabled = shareScope === 'all' ? true : selectedBranches.includes(branch.id);
                return (
                  <View
                    key={branch.id}
                    style={[styles.branchCard, isDarkMode && styles.branchCardDark, enabled && styles.branchCardActive]}
                  >
                    <View style={styles.branchInfo}>
                      <View style={[styles.branchDot, { backgroundColor: branch.color || colors.primary }]} />
                      <Text style={[styles.branchName, isDarkMode && styles.textWhite]} numberOfLines={1}>
                        {branch.name}
                      </Text>
                    </View>
                    <View style={styles.branchAction}>
                      <Text style={[styles.branchStatus, enabled ? styles.branchStatusOn : styles.branchStatusOff]}>
                        {enabled ? 'Sí' : 'No'}
                      </Text>
                      <Switch
                        value={enabled}
                        onValueChange={(value) => toggleBranch(branch.id, value)}
                        thumbColor={enabled ? colors.white : '#FFF'}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        disabled={shareScope === 'all'}
                        testID={`branch-switch-${branch.id}`}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {branches.length === 0 && (
            <View style={styles.emptyBranches}>
              <Text style={[styles.emptyBranchesText, isDarkMode && styles.textLight]}>
                Aún no tienes ramas para compartir.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
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
            style={[styles.primaryButton, (loading || !canSend) && styles.disabledButton]}
            onPress={handleEmailInvite}
            disabled={loading || !canSend}
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

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShareLink} testID="share-native-button">
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scopeSummary: {
    fontSize: 13,
    color: colors.textLight,
  },
  scopeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    backgroundColor: colors.background,
    marginBottom: 18,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },
  branchGrid: {
    gap: 12,
  },
  branchCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  branchCardDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  branchCardActive: {
    borderColor: colors.primary,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  branchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  branchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  branchStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  branchStatusOn: {
    color: colors.primary,
  },
  branchStatusOff: {
    color: colors.textLight,
  },
  emptyBranches: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  emptyBranchesText: {
    fontSize: 14,
    color: colors.textLight,
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
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
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
  textWhite: {
    color: colors.white,
  },
  textLight: {
    color: colors.textLight,
  },
});
