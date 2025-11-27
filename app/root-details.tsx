import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

export default function RootDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [relative, setRelative] = useState<any>(null);
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    async function fetchRelative() {
      // Buscar en family_connections el familiar con este ID de conexión
      const { data } = await supabase
        .from('family_connections')
        .select('relation, relative:profiles!relative_id(*)')
        .eq('id', id)
        .single();

      if (data) {
        setRelative({
          ...data.relative,
          relation: data.relation
        });
      }
    }
    fetchRelative();
  }, [id]);

  if (!relative) return <View style={[styles.container, isDarkMode && styles.bgDark]}><Text>Cargando...</Text></View>;

  return (
    <>
      <Stack.Screen options={{ title: relative.name || 'Familiar', headerStyle: { backgroundColor: colors.family } }} />
      <ScrollView style={[styles.container, isDarkMode && styles.bgDark]}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{relative.name?.charAt(0)}</Text>
          </View>
          <Text style={[styles.name, isDarkMode && styles.textWhite]}>{relative.name}</Text>
          <Text style={styles.relation}>{relative.relation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, isDarkMode && styles.textLight]}>Email</Text>
          <Text style={[styles.value, isDarkMode && styles.textWhite]}>{relative.email}</Text>
        </View>

        {/* Aquí podrías mostrar los árboles que te ha compartido buscando en tree_permissions */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  bgDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', padding: 30, backgroundColor: colors.family + '20' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.family, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 30, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  relation: { fontSize: 16, color: colors.family, fontWeight: '600' },
  section: { padding: 20 },
  label: { fontSize: 14, color: '#888', marginBottom: 5 },
  value: { fontSize: 16, color: '#333', marginBottom: 20 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#CCC' }
});