import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { MapPin, Trash2 } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';

export default function FruitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree, fetchMyTree } = useTreeStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (!tree) fetchMyTree();
  }, [tree]);

  const handleDelete = () => {
    Alert.alert(
      "Borrar Recuerdo",
      "¿Quieres eliminar este fruto de tu árbol? No podrás recuperarlo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('fruits').delete().eq('id', id);
              if (error) throw error;
              await fetchMyTree();
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
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
            <TouchableOpacity onPress={handleDelete} style={{ marginRight: 10, marginTop: 10 }}>
              <View style={styles.iconBg}>
                <Trash2 size={20} color={colors.error} />
              </View>
            </TouchableOpacity>
          )
        }}
      />
      {/* ... Resto del renderizado del fruto igual que antes ... */}
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
  iconBg: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 }
});