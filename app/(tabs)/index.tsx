import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useMemoryStore } from '@/stores/memoryStore';
import { useUserStore } from '@/stores/userStore';
import ActivityItem from '@/components/ActivityItem';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Heart, Users, Gift, Trees, Upload, Flame } from 'lucide-react-native'; // He cambiado el icono a Upload para "Subir"
import { useThemeStore } from '@/stores/themeStore';

export default function HomeScreen() {
  const { recentActivities, fetchHomeData } = useMemoryStore();
  const { user } = useUserStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    fetchHomeData();
  }, []);

  const navigateToTree = () => router.push('/tree');
  const navigateToMemory = () => router.push('/add-memory-options');
  const navigateToFamily = () => router.push('/family');
  const navigateToGifts = () => router.push('/gifts');

  // Obtener racha del objeto usuario
  const currentStreak = (user as any)?.current_streak || 0;

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.greeting, isDarkMode && styles.greetingDark]}>
              Hola, {user?.name?.split(' ')[0] || 'Viajero'}
            </Text>
            <Text style={[styles.subGreeting, isDarkMode && styles.subGreetingDark]}>
              Tu historia sigue creciendo.
            </Text>
          </View>

          {/* RACHA */}
          <View style={[styles.streakBadge, isDarkMode && styles.streakBadgeDark]}>
            <Flame size={20} color={colors.warning} fill={currentStreak > 0 ? colors.warning : 'transparent'} />
            <Text style={[styles.streakText, isDarkMode && styles.textWhite]}>{currentStreak}</Text>
          </View>
        </View>
      </View>

      {/* ACCIONES RÁPIDAS */}
      <View style={[styles.quickActions, isDarkMode && styles.quickActionsDark]}>
        <TouchableOpacity style={styles.actionItem} onPress={navigateToTree}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Trees size={24} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Mi Árbol</Text>
        </TouchableOpacity>

        {/* BOTÓN SUBIR MODIFICADO */}
        <TouchableOpacity style={styles.actionItem} onPress={navigateToMemory}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Upload size={24} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Subir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={navigateToFamily}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Users size={24} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Familia</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={navigateToGifts}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Gift size={24} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Regalos</Text>
        </TouchableOpacity>
      </View>

      {/* ACTIVIDAD RECIENTE */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Heart size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Actividad Familiar</Text>
        </View>

        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              userInitial={activity.userInitial}
              userName={activity.userName}
              action={activity.action}
              timeAgo={activity.timeAgo}
              isDarkMode={isDarkMode}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Todo está tranquilo por aquí.</Text>
            <Text style={styles.emptySubText}>Añade familiares para ver su actividad.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#121212' },
  header: { padding: 24, paddingTop: 50 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  greetingDark: { color: colors.white },
  subGreeting: { fontSize: 16, color: colors.textLight },
  subGreetingDark: { color: '#AAA' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
  streakBadgeDark: { backgroundColor: '#333' },
  streakText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  textWhite: { color: '#FFF' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 30 },
  quickActionsDark: {},
  actionItem: { alignItems: 'center', width: 70 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionIconDark: { backgroundColor: '#1E1E1E' },
  actionText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  actionTextDark: { color: colors.white },
  section: { paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 10 },
  sectionTitleDark: { color: colors.white },
  emptyState: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  emptyText: { color: colors.text, fontWeight: '600' },
  emptySubText: { color: colors.textLight, fontSize: 12, marginTop: 4 },
});