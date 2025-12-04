import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import { useGiftStore } from '@/stores/giftStore';
import colors from '@/constants/colors';
import { MapPin, Trash2, Share2, Send } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

export default function FruitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, fetchMyTree, deleteFruit } = useTreeStore();
  const { createGift } = useGiftStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const [showShareModal, setShowShareModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!tree) fetchMyTree();
  }, [tree]);

  // --- LÓGICA DE DOBLE CONFIRMACIÓN ---
  const handleDelete = () => {
    // PRIMERA ALERTA
    Alert.alert(
      "Eliminar Recuerdo",
      "¿Estás seguro de que quieres borrar este recuerdo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => {
            // SEGUNDA ALERTA (CONFIRMACIÓN FINAL)
            setTimeout(() => { // Pequeño delay para que no se solapen en iOS
              Alert.alert(
                "¿Estás absolutamente seguro?",
                "Esta acción no se puede deshacer y perderás este recuerdo para siempre.",
                [
                  { text: "No, espera", style: "cancel" },
                  {
                    text: "Sí, bórralo definitivamente",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await deleteFruit(id);
                        router.back();
                      } catch (e: any) {
                        Alert.alert("Error", e.message);
                      }
                    }
                  }
                ]
              );
            }, 200);
          }
        }
      ]
    );
  };

  // --- FUNCIONALIDAD DE COMPARTIR FRUTO ---
  const handleShare = async () => {
    if (!recipientEmail.trim()) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (!fruit) {
      Alert.alert('Error', 'No se pudo cargar el recuerdo');
      return;
    }

    setIsSharing(true);
    try {
      // Crear un regalo con el contenido del fruto
      await createGift({
        type: 'fruit',
        recipientEmail: recipientEmail.trim(),
        message: `Te comparto este recuerdo: "${fruit.title}"`,
        content: {
          title: fruit.title,
          description: fruit.description,
          mediaUrls: fruit.mediaUrls || [],
          branchId: fruit.branchId,
          location: fruit.location,
          position: fruit.position
        }
      });

      Alert.alert(
        '¡Compartido!',
        `Has compartido "${fruit.title}" con ${recipientEmail}. Cuando lo acepte, aparecerá en su árbol.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setShowShareModal(false);
              setRecipientEmail('');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo compartir el recuerdo');
    } finally {
      setIsSharing(false);
    }
  };

  if (!tree) return <View style={[styles.center, isDarkMode && styles.bgDark]}><ActivityIndicator /></View>;

  const fruit = tree.fruits.find(f => f.id === id);
  const branch = fruit ? tree.branches.find(b => b.id === fruit.branchId) : null;

  if (!fruit || !branch) return <View style={[styles.center, isDarkMode && styles.bgDark]}><Text style={isDarkMode && styles.textWhite}>Recuerdo no encontrado</Text></View>;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: branch.color },
          headerTintColor: colors.white,
          headerTransparent: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => setShowShareModal(true)} 
                style={{ marginRight: 10, marginTop: 10 }}
              >
                <View style={styles.iconBg}>
                  <Share2 size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={{ marginRight: 10, marginTop: 10 }}>
                <View style={styles.iconBg}>
                  <Trash2 size={20} color={colors.error} />
                </View>
              </TouchableOpacity>
            </View>
          )
        }}
      />
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        {fruit.mediaUrls && fruit.mediaUrls.length > 0 ? (
          <Image source={{ uri: fruit.mediaUrls[0] }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: branch.color }]} />
        )}

        <View style={[styles.content, isDarkMode && styles.contentDark]}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>{fruit.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{new Date(fruit.createdAt).toLocaleDateString()}</Text>
            <View style={[styles.badge, { backgroundColor: branch.color + '20' }]}>
              <Text style={[styles.badgeText, { color: branch.color }]}>{branch.name}</Text>
            </View>
          </View>

          <Text style={[styles.description, isDarkMode && styles.textLight]}>{fruit.description}</Text>

          {fruit.location && (
            <View style={styles.infoItem}>
              <MapPin size={18} color={colors.textLight} />
              <Text style={[styles.infoText, isDarkMode && styles.textLight]}>{fruit.location.name}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Compartir */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
              Compartir Recuerdo
            </Text>
            <Text style={[styles.modalSubtitle, isDarkMode && styles.textLight]}>
              Envía este recuerdo a un amigo o familiar. Cuando lo acepte, aparecerá en su árbol.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={[styles.modalLabel, isDarkMode && styles.textWhite]}>Email del destinatario</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="ejemplo@email.com"
                placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, isDarkMode && styles.modalCancelButtonDark]}
                onPress={() => {
                  setShowShareModal(false);
                  setRecipientEmail('');
                }}
              >
                <Text style={[styles.modalCancelText, isDarkMode && styles.textWhite]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalShareButton, isSharing && styles.modalShareButtonDisabled]}
                onPress={handleShare}
                disabled={isSharing || !recipientEmail.trim()}
              >
                {isSharing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Send size={18} color="#FFF" />
                    <Text style={styles.modalShareText}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#000' },
  bgDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: 300 },
  coverPlaceholder: { width: '100%', height: 100 },
  content: { flex: 1, backgroundColor: colors.white, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 500 },
  contentDark: { backgroundColor: '#121212' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  date: { fontSize: 14, color: colors.textLight, marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  description: { fontSize: 16, lineHeight: 26, color: colors.text, marginBottom: 24 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  infoText: { fontSize: 15, color: colors.text },
  textWhite: { color: '#FFF' },
  textLight: { color: '#CCC' },
  iconBg: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  headerActions: { flexDirection: 'row' },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%'
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
    lineHeight: 20
  },
  modalInputContainer: {
    marginBottom: 24
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalInputDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#444',
    color: '#FFF'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelButtonDark: {
    borderColor: '#444'
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  modalShareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  modalShareButtonDisabled: {
    opacity: 0.7
  },
  modalShareText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
