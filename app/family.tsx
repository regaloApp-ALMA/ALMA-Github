import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { MessageSquare, Trees, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFamily() {
      if (!user) return;
      try {
        // Buscar conexiones y unir con la tabla de perfiles para obtener nombres
        const { data, error } = await supabase
          .from('family_connections')
          .select(`
            id,
            relation,
            relative:profiles!relative_id (id, name, email)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const formatted = data.map((item: any) => ({
          id: item.relative.id, // ID del perfil del familiar
          name: item.relative.name || 'Familiar',
          relation: item.relation || 'Conexión',
          initial: (item.relative.name || 'F').charAt(0).toUpperCase(),
          // Aquí podríamos buscar cuántos árboles ha compartido realmente
          sharedTrees: ['Árbol compartido']
        }));

        setFamilyMembers(formatted);
      } catch (error) {
        console.error('Error fetching family:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFamily();
  }, [user]);

  const handleConnectMore = () => {
    router.push('/share-tree'); // Reutilizamos compartir para invitar
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Familia',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Raíces de tu árbol</Text>
          <Text style={styles.subtitle}>
            Aquí están tus conexiones. Estas personas aparecen como raíces en tu árbol de vida.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aún no tienes familiares conectados.</Text>
            <Text style={styles.emptySubText}>Invita a alguien para empezar.</Text>
          </View>
        ) : (
          familyMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCard}
            // onPress={() => handleMemberPress(member.id)} // Futura feature
            >
              <View style={styles.memberInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.initial}</Text>
                </View>

                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRelation}>{member.relation}</Text>
                  <Text style={styles.sharedTrees}>
                    Conectado
                  </Text>
                </View>
              </View>

              <View style={styles.memberActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageSquare size={20} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Trees size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.connectButton} onPress={handleConnectMore}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.connectButtonText}>Conectar con más familiares</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  memberCard: { backgroundColor: colors.white, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16, shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  memberInfo: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  memberRelation: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  sharedTrees: { fontSize: 14, color: colors.text },
  memberActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: 12 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  connectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 16, marginBottom: 30, marginTop: 10 },
  connectButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: colors.gray, fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: colors.gray },
});