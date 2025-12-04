import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Share, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Trees, Info, Share2, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamily();
  }, [user]);

  /**
   * NUEVA LÓGICA: Solo mostrar personas que han compartido su árbol contigo
   * Esto se basa en:
   * 1. tree_permissions donde eres el recipient
   * 2. gifts aceptados donde el sender te ha compartido algo
   */
  async function fetchFamily() {
    if (!user) return;
    try {
      // 1. Buscar permisos de árbol donde YO soy el receptor (me han compartido su árbol)
      const { data: permissions, error: permError } = await supabase
        .from('tree_permissions')
        .select(`
          id,
          tree_id,
          scope,
          granter:profiles!granter_id (id, name, email, avatar_url),
          tree:trees!tree_id (id, name, owner_id)
        `)
        .or(`recipient_id.eq.${user.id},recipient_email.eq.${user.email}`)
        .eq('access_level', 'view');

      if (permError) {
        console.error('Error fetching permissions:', permError);
      }

      // 2. Buscar regalos aceptados donde el sender me ha compartido algo
      const { data: acceptedGifts, error: giftsError } = await supabase
        .from('gifts')
        .select(`
          id,
          sender:profiles!sender_id (id, name, email, avatar_url),
          status
        `)
        .or(`recipient_id.eq.${user.id},recipient_email.eq.${user.email}`)
        .eq('status', 'accepted');

      if (giftsError) {
        console.error('Error fetching gifts:', giftsError);
      }

      // 3. Combinar y formatear los resultados
      const membersMap = new Map<string, any>();

      // Añadir desde tree_permissions
      if (permissions) {
        permissions.forEach((perm: any) => {
          if (perm.granter && perm.granter.id) {
            const granterId = perm.granter.id;
            if (!membersMap.has(granterId)) {
              membersMap.set(granterId, {
                id: granterId,
                name: perm.granter.name || 'Familiar',
                email: perm.granter.email || '',
                avatarUrl: perm.granter.avatar_url || null,
                relation: 'Familiar', // Por defecto, podría mejorarse con family_connections
                initial: (perm.granter.name || 'F').charAt(0).toUpperCase(),
                treeId: perm.tree?.id || null,
                sharedVia: 'tree_permission'
              });
            }
          }
        });
      }

      // Añadir desde gifts aceptados
      if (acceptedGifts) {
        acceptedGifts.forEach((gift: any) => {
          if (gift.sender && gift.sender.id) {
            const senderId = gift.sender.id;
            if (!membersMap.has(senderId)) {
              membersMap.set(senderId, {
                id: senderId,
                name: gift.sender.name || 'Familiar',
                email: gift.sender.email || '',
                avatarUrl: gift.sender.avatar_url || null,
                relation: 'Familiar',
                initial: (gift.sender.name || 'F').charAt(0).toUpperCase(),
                sharedVia: 'gift'
              });
            }
          }
        });
      }

      // Convertir map a array
      const formatted = Array.from(membersMap.values());
      setFamilyMembers(formatted);
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleViewTree = async (member: any) => {
    if (member.treeId) {
      // Navegar a ver el árbol compartido
      // Por ahora mostramos un mensaje, pero podrías navegar a una pantalla de árbol compartido
      Alert.alert(
        'Árbol compartido',
        `Verás el árbol de ${member.name} aquí. (Funcionalidad en desarrollo)`
      );
    } else {
      Alert.alert(
        'Información',
        `${member.name} ha compartido contenido contigo, pero aún no tiene un árbol completo compartido.`
      );
    }
  };

  const handleRequestConnection = () => {
    // Redirigir a compartir árbol para que el usuario pueda solicitar conexiones
    router.push('/share-tree');
  };

  const handleInviteToALMA = async () => {
    try {
      const message = Platform.OS === 'ios' 
        ? '¡Únete a ALMA y comparte tu historia conmigo! Descarga la app aquí: https://alma.app'
        : '¡Únete a ALMA y comparte tu historia conmigo! Descarga la app aquí: https://alma.app';
      
      const result = await Share.share({
        message: message,
        title: 'Invita a ALMA',
      });

      if (result.action === Share.sharedAction) {
        // El usuario compartió exitosamente
        console.log('Compartido exitosamente');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo compartir. ' + error.message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Familia',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Raíces de tu árbol</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textLight]}>
            Estas son las personas que han compartido su historia contigo. Solo aparecen aquí quienes te han dado permiso explícito.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, isDarkMode && styles.emptyIconContainerDark]}>
              <Info size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
              Aún no tienes raíces familiares
            </Text>
            <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>
              Para ver las raíces de tu familia aquí, pídeles que te compartan su árbol desde su perfil.
            </Text>
            <Text style={[styles.emptySubText, isDarkMode && styles.textLight]}>
              Cuando alguien comparta su árbol contigo o te envíe un regalo y lo aceptes, aparecerá aquí como una raíz de tu árbol.
            </Text>
            
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                style={styles.requestButton} 
                onPress={handleRequestConnection}
              >
                <Share2 size={20} color={colors.white} />
                <Text style={styles.requestButtonText}>Solicitar Conexión</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.inviteButton, isDarkMode && styles.inviteButtonDark]} 
                onPress={handleInviteToALMA}
              >
                <Users size={20} color={colors.primary} />
                <Text style={[styles.inviteButtonText, isDarkMode && styles.textWhite]}>Invitar a ALMA</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {familyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, isDarkMode && styles.memberCardDark]}
                onPress={() => handleViewTree(member)}
              >
                <View style={styles.memberInfo}>
                  {member.avatarUrl ? (
                    <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.initial}</Text>
                    </View>
                  )}

                  <View style={styles.memberDetails}>
                    <Text style={[styles.memberName, isDarkMode && styles.textWhite]}>{member.name}</Text>
                    <Text style={[styles.memberRelation, isDarkMode && styles.textLight]}>
                      {member.relation} • Compartido vía {member.sharedVia === 'tree_permission' ? 'Árbol' : 'Regalo'}
                    </Text>
                    {member.email && (
                      <Text style={[styles.memberEmail, isDarkMode && styles.textLight]}>{member.email}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.memberActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
                    onPress={() => handleViewTree(member)}
                  >
                    <Trees size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.infoCard}>
              <Info size={20} color={colors.primary} />
              <Text style={[styles.infoText, isDarkMode && styles.textLight]}>
                Para añadir más familiares, pídeles que compartan su árbol contigo desde "Compartir Árbol" en su perfil.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#121212' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
  memberCard: { 
    backgroundColor: colors.white, 
    borderRadius: 12, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    shadowColor: colors.text, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  memberCardDark: { backgroundColor: '#1E1E1E' },
  memberInfo: { flexDirection: 'row', marginBottom: 12 },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  memberRelation: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  memberEmail: { fontSize: 12, color: colors.textLight },
  memberActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    borderTopWidth: 1, 
    borderTopColor: colors.lightGray, 
    paddingTop: 12 
  },
  actionButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 8 
  },
  actionButtonDark: { backgroundColor: '#333' },
  emptyState: { 
    alignItems: 'center', 
    padding: 40,
    marginTop: 20
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  emptyIconContainerDark: {
    backgroundColor: '#333'
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.text, 
    marginBottom: 12,
    textAlign: 'center'
  },
  emptyText: { 
    fontSize: 16, 
    color: colors.text, 
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24
  },
  emptySubText: { 
    fontSize: 14, 
    color: colors.textLight, 
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 8
  },
  requestButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  emptyActions: {
    width: '100%',
    gap: 12,
    marginTop: 8
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8
  },
  inviteButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: colors.primary
  },
  inviteButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
    marginTop: 10,
    gap: 12,
    alignItems: 'flex-start'
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20
  }
});
