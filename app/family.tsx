import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Share } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Trees, Users, Share2, Mail } from 'lucide-react-native';
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
   * LÓGICA SIMPLIFICADA: Mostrar personas de family_connections
   * Esta pantalla es solo de visualización
   */
  async function fetchFamily() {
    if (!user) return;
    try {
      // Buscar conexiones familiares
      const { data: connections, error } = await supabase
        .from('family_connections')
        .select(`
          id,
          relation,
          created_at,
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
          name: conn.relative?.name || 'Familiar',
          email: conn.relative?.email || '',
          avatarUrl: conn.relative?.avatar_url || null,
          relation: conn.relation || 'Familiar',
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
    // Por ahora mostramos un mensaje informativo
    Alert.alert(
      'Información',
      `Para ver el árbol de ${member.name}, necesitas que comparta su árbol contigo desde "Compartir Árbol" en su perfil.`
    );
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Familia',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView 
        style={[styles.container, isDarkMode && styles.containerDark]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 1. CABECERA (Texto Informativo) */}
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Raíces Familiares</Text>
          <Text style={[styles.description, isDarkMode && styles.textLight]}>
            Aquí puedes ver los árboles compartidos por tus familiares. Cada familiar que te comparte su árbol aparece como una raíz en tu árbol.
          </Text>
        </View>

        {/* 2. CUERPO (Lista o Estado Vacío) */}
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
                      {member.relation}
                    </Text>
                    {member.email && (
                      <Text style={[styles.memberEmail, isDarkMode && styles.textLight]}>{member.email}</Text>
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

        {/* 3. BOTONES DE ACCIÓN (Pie de página) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton, isDarkMode && styles.primaryButtonDark]}
            onPress={handleInviteToApp}
          >
            <Mail size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Invitar a la App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
            onPress={handleShareTree}
          >
            <Share2 size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, isDarkMode && styles.textWhite]}>Compartir mi Árbol</Text>
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
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
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
});
