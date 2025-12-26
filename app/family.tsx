import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Share } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import colors from '@/constants/colors';
import { Trees, Users, Share2, Mail, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const { 
    pendingInvitations, 
    fetchPendingInvitations, 
    acceptInvitation,
    rejectInvitation,
    fetchSharedTree, 
    sharedTree, 
    isLoading: treeLoading,
    deletionRequests,
    fetchDeletionRequests,
    requestRemoveRoot,
    confirmRemoveRoot,
    tree
  } = useTreeStore();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(null);
  const [rejectingInvitation, setRejectingInvitation] = useState<string | null>(null);
  const [confirmingDeletion, setConfirmingDeletion] = useState<string | null>(null);
  const [requestingRemoval, setRequestingRemoval] = useState<string | null>(null);

  // Recargar cuando se enfoca la pantalla
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchFamily();
        fetchPendingInvitations();
        fetchDeletionRequests();
      }
    }, [user])
  );

  useEffect(() => {
    if (user) {
      fetchFamily();
      fetchPendingInvitations();
      fetchDeletionRequests();
    }
  }, [user]);

  /**
   * LÓGICA SIMPLIFICADA: Mostrar personas de family_connections
   */
  async function fetchFamily() {
    if (!user) return;
    try {
      setLoading(true);
      // Buscar conexiones familiares - Incluir status y connection_id
      const { data: connections, error } = await supabase
        .from('family_connections')
        .select(`
          id,
          relation,
          created_at,
          status,
          relative:profiles!relative_id (id, name, email, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family connections:', error);
        setFamilyMembers([]);
      } else {
        const formatted = (connections || []).map((conn: any) => ({
          id: conn.relative?.id || conn.id,
          connectionId: conn.id, // ID de la conexión para eliminar
          name: conn.relative?.name || 'Familiar',
          email: conn.relative?.email || '',
          avatarUrl: conn.relative?.avatar_url || null,
          relation: conn.relation || 'Familiar',
          status: conn.status || 'active',
          initial: (conn.relative?.name || 'F').charAt(0).toUpperCase(),
        }));
        setFamilyMembers(formatted);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
      setFamilyMembers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleViewTree = async (member: any) => {
    try {
      setLoading(true);
      await fetchSharedTree(member.id);
      router.push('/shared-tree');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el árbol compartido. ' + (error.message || ''));
      setLoading(false);
    }
  };

  const handleShareTree = () => {
    router.push('/share-tree');
  };

  const handleInviteToApp = async () => {
    try {
      const message = 'Te invito a unirte a ALMA para guardar nuestros recuerdos familiares. Descárgala aquí: https://alma.app';
      
      const result = await Share.share({
        message: message,
        title: 'Invita a ALMA',
      });

      if (result.action === Share.sharedAction) {
        console.log('Compartido exitosamente');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo compartir. ' + error.message);
    }
  };

  const handleAcceptInvitation = async (invitation: any) => {
    try {
      setAcceptingInvitation(invitation.id);
      await acceptInvitation(invitation.id, invitation.granter_id);
      Alert.alert('¡Invitación aceptada!', `Ahora puedes ver el árbol de ${invitation.sender.name} en tus raíces familiares.`);
      // Forzar recarga completa de la lista de familiares
      await fetchFamily(); // Recargar lista de familiares
      await fetchPendingInvitations(); // Recargar invitaciones
      // Recargar también el árbol para actualizar las raíces
      const { fetchMyTree } = useTreeStore.getState();
      await fetchMyTree(true);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo aceptar la invitación. ' + (error.message || ''));
    } finally {
      setAcceptingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitation: any) => {
    Alert.alert(
      'Rechazar Invitación',
      `¿Estás seguro de que quieres rechazar la invitación de ${invitation.sender.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejectingInvitation(invitation.id);
              await rejectInvitation(invitation.id);
              Alert.alert('Invitación rechazada', `Has rechazado la invitación de ${invitation.sender.name}.`);
              await fetchPendingInvitations(); // Recargar invitaciones
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo rechazar la invitación. ' + (error.message || ''));
            } finally {
              setRejectingInvitation(null);
            }
          },
        },
      ]
    );
  };

  const handleRequestRemoveRoot = async (connectionId: string, memberName: string) => {
    Alert.alert(
      'Solicitar Eliminación',
      `¿Estás seguro de que quieres solicitar la eliminación de ${memberName}? El vínculo se eliminará cuando ${memberName} confirme la solicitud.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          style: 'destructive',
          onPress: async () => {
            try {
              setRequestingRemoval(connectionId);
              await requestRemoveRoot(connectionId);
              Alert.alert('Solicitud enviada', `Se ha enviado una solicitud de eliminación a ${memberName}.`);
              await fetchFamily();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo enviar la solicitud. ' + (error.message || ''));
            } finally {
              setRequestingRemoval(null);
            }
          },
        },
      ]
    );
  };

  const handleConfirmRemoveRoot = async (connectionId: string, requesterName: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres confirmar la eliminación del vínculo con ${requesterName}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setConfirmingDeletion(connectionId);
              await confirmRemoveRoot(connectionId);
              Alert.alert('Vínculo eliminado', `El vínculo con ${requesterName} ha sido eliminado.`);
              await fetchFamily();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo confirmar la eliminación. ' + (error.message || ''));
            } finally {
              setConfirmingDeletion(null);
            }
          },
        },
      ]
    );
  };

  // Calcular notificaciones totales
  const notificationCount = pendingInvitations.length + deletionRequests.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Familia',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
          headerRight: () => notificationCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          ) : null,
        }}
      />

      <ScrollView 
        style={[styles.container, isDarkMode && styles.containerDark]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 0. BOTÓN DE INVITAR (Siempre visible arriba) */}
        <View style={styles.topActionsContainer}>
          <TouchableOpacity 
            style={[styles.topActionButton, styles.shareButton, isDarkMode && styles.shareButtonDark]}
            onPress={handleShareTree}
          >
            <Share2 size={20} color={colors.primary} />
            <Text style={[styles.topActionButtonText, isDarkMode && styles.textWhite]}>Compartir mi Árbol</Text>
          </TouchableOpacity>
        </View>

        {/* 1. INVITACIONES PENDIENTES */}
        {pendingInvitations.length > 0 && (
          <View style={styles.invitationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Solicitudes Pendientes</Text>
              {pendingInvitations.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
                </View>
              )}
            </View>
            {pendingInvitations.map((invitation) => (
              <View key={invitation.id} style={[styles.invitationCard, isDarkMode && styles.invitationCardDark]}>
                <View style={styles.invitationHeader}>
                  {invitation.sender.avatar_url ? (
                    <Image source={{ uri: invitation.sender.avatar_url }} style={styles.invitationAvatar} />
                  ) : (
                    <View style={styles.invitationAvatarPlaceholder}>
                      <Text style={styles.invitationAvatarText}>
                        {invitation.sender.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.invitationInfo}>
                    <Text style={[styles.invitationName, isDarkMode && styles.textWhite]}>
                      {invitation.sender.name}
                    </Text>
                    <Text style={[styles.invitationText, isDarkMode && styles.textLight]}>
                      quiere compartir su árbol contigo
                    </Text>
                  </View>
                </View>
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={[styles.rejectButton, rejectingInvitation === invitation.id && styles.acceptButtonLoading]}
                    onPress={() => handleRejectInvitation(invitation)}
                    disabled={rejectingInvitation === invitation.id || acceptingInvitation === invitation.id}
                  >
                    {rejectingInvitation === invitation.id ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <XCircle size={18} color={colors.error} />
                        <Text style={styles.rejectButtonText}>Rechazar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptButton, acceptingInvitation === invitation.id && styles.acceptButtonLoading]}
                    onPress={() => handleAcceptInvitation(invitation)}
                    disabled={acceptingInvitation === invitation.id || rejectingInvitation === invitation.id}
                  >
                    {acceptingInvitation === invitation.id ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <CheckCircle size={18} color={colors.white} />
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 1.5. SOLICITUDES DE DESCONEXIÓN */}
        {deletionRequests.length > 0 && (
          <View style={styles.invitationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Solicitudes de Desconexión</Text>
              {deletionRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{deletionRequests.length}</Text>
                </View>
              )}
            </View>
            {deletionRequests.map((request) => (
              <View key={request.id} style={[styles.invitationCard, styles.deletionCard, isDarkMode && styles.invitationCardDark]}>
                <View style={styles.invitationHeader}>
                  {request.requester.avatar_url ? (
                    <Image source={{ uri: request.requester.avatar_url }} style={styles.invitationAvatar} />
                  ) : (
                    <View style={styles.invitationAvatarPlaceholder}>
                      <Text style={styles.invitationAvatarText}>
                        {request.requester.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.invitationInfo}>
                    <Text style={[styles.invitationName, isDarkMode && styles.textWhite]}>
                      {request.requester.name}
                    </Text>
                    <Text style={[styles.invitationText, isDarkMode && styles.textLight]}>
                      quiere eliminar el vínculo contigo
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.confirmDeletionButton, confirmingDeletion === request.id && styles.acceptButtonLoading]}
                  onPress={() => handleConfirmRemoveRoot(request.id, request.requester.name)}
                  disabled={confirmingDeletion === request.id}
                >
                  {confirmingDeletion === request.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <XCircle size={18} color={colors.white} />
                      <Text style={styles.acceptButtonText}>Aceptar Eliminación</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 2. CABECERA (Texto Informativo) */}
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Raíces Familiares</Text>
          <Text style={[styles.description, isDarkMode && styles.textLight]}>
            Aquí puedes ver los árboles compartidos por tus familiares. Cada familiar que te comparte su árbol aparece como una raíz en tu árbol.
          </Text>
        </View>

        {/* 3. CUERPO (Lista o Estado Vacío) */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : familyMembers.length > 0 ? (
          <View style={styles.listContainer}>
            {familyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.memberCard, isDarkMode && styles.memberCardDark]}
                onPress={() => router.push({ pathname: '/root-details', params: { id: member.connectionId } })}
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
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, isDarkMode && styles.textWhite]}>{member.name}</Text>
                      {member.status === 'pending_deletion' && (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>Pendiente</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.memberRelation, isDarkMode && styles.textLight]}>
                      {member.relation}
                    </Text>
                    {member.email && (
                      <Text style={[styles.memberEmail, isDarkMode && styles.textLight]}>{member.email}</Text>
                    )}
                    {member.status === 'pending_deletion' && (
                      <Text style={[styles.pendingText, isDarkMode && styles.textLight]}>
                        Esperando confirmación de eliminación...
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.memberActions}>
                  <TouchableOpacity 
                    style={[styles.actionButtonSmall, isDarkMode && styles.actionButtonSmallDark]}
                    onPress={() => handleViewTree(member)}
                  >
                    <Trees size={20} color={colors.primary} />
                  </TouchableOpacity>
                  {member.status === 'active' && (
                    <TouchableOpacity 
                      style={[styles.actionButtonSmall, styles.deleteButton, isDarkMode && styles.deleteButtonDark]}
                      onPress={() => handleRequestRemoveRoot(member.connectionId, member.name)}
                      disabled={requestingRemoval === member.connectionId}
                    >
                      {requestingRemoval === member.connectionId ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <XCircle size={18} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, isDarkMode && styles.emptyIconContainerDark]}>
              <Users size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
              Aún no tienes familiares conectados.
            </Text>
          </View>
        )}

        {/* 4. BOTONES DE ACCIÓN ADICIONALES (Pie de página) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, isDarkMode && styles.primaryButtonDark]}
            onPress={handleInviteToApp}
          >
            <Mail size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Invitar a la App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  containerDark: { 
    backgroundColor: '#121212' 
  },
  contentContainer: {
    paddingBottom: 40,
  },
  
  // BOTÓN DE INVITAR ARRIBA
  topActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  shareButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  shareButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: colors.primary,
  },
  topActionButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // INVITACIONES PENDIENTES
  invitationsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  invitationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  invitationCardDark: {
    backgroundColor: '#1E1E1E',
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  invitationAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  invitationText: {
    fontSize: 14,
    color: colors.textLight,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButtonLoading: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    flex: 1,
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  deletionCard: {
    borderLeftColor: colors.error,
  },
  confirmDeletionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  
  // CABECERA
  header: {
    padding: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
  
  // CUERPO - Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  
  // CUERPO - Lista
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardDark: {
    backgroundColor: '#1E1E1E',
  },
  memberInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  pendingBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  memberRelation: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textLight,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  actionButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtonSmallDark: {
    backgroundColor: '#333',
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
  },
  deleteButtonDark: {
    backgroundColor: colors.error + '30',
  },
  
  // CUERPO - Estado Vacío
  emptyState: {
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconContainerDark: {
    backgroundColor: '#333',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  
  // BOTONES DE ACCIÓN (Pie de página)
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonDark: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
