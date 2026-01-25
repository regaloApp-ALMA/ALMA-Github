import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useMemoryStore } from '@/stores/memoryStore';
import { useUserStore } from '@/stores/userStore';
import { useTreeStore } from '@/stores/treeStore';
import ActivityItem from '@/components/ActivityItem';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Heart, Users, Gift, Trees, Upload, Flame, Calendar, Lightbulb, RefreshCw, Sparkles, Plus } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import StreakModal from '@/components/StreakModal';
import { useFocusEffect } from 'expo-router';
import SafeImage from '@/components/SafeImage';

// --- BANCO DE IDEAS (Frontend estático para inspiración) ---
const MEMORY_PROMPTS = [
  { id: 1, category: 'Mascotas', text: '¿Cómo llegó tu primera mascota a casa?', icon: 'paw' },
  { id: 2, category: 'Viajes', text: 'Ese viaje donde todo salió mal pero te reíste mucho.', icon: 'map' },
  { id: 3, category: 'Infancia', text: '¿Cuál era tu juguete favorito de niño?', icon: 'gamepad' },
  { id: 4, category: 'Cocina', text: 'La receta secreta de la abuela que no quieres olvidar.', icon: 'utensils' },
  { id: 5, category: 'Amistad', text: 'El día que conociste a tu mejor amigo/a.', icon: 'users' },
  { id: 6, category: 'Logros', text: 'El día que recibiste tu primer sueldo.', icon: 'briefcase' },
  { id: 7, category: 'Amor', text: 'Tu primera cita con tu pareja actual.', icon: 'heart' },
  { id: 8, category: 'Música', text: 'El primer concierto al que fuiste.', icon: 'music' },
  { id: 9, category: 'Vida', text: 'Línea de vida en 10 fotos: Describe tu vida solo con imágenes.', icon: 'image' },
  { id: 10, category: 'Reflexión', text: 'Entrevista al pasado: ¿Qué le preguntarías a tu yo de hace 10 años?', icon: 'clock' },
  { id: 11, category: 'Cocina', text: 'Capsula culinaria: La receta que quieres que hereden tus nietos.', icon: 'utensils' },
  { id: 12, category: 'Música', text: 'Soundtrack vital: 3 canciones que definen tu adolescencia.', icon: 'music' },
  { id: 13, category: 'Familia', text: 'El momento más divertido en una reunión familiar.', icon: 'users' },
  { id: 14, category: 'Aprendizaje', text: 'La lección más importante que aprendiste de un error.', icon: 'book' },
  { id: 15, category: 'Aventura', text: 'Esa vez que hiciste algo que nunca pensaste que harías.', icon: 'map' },
];

export default function HomeScreen() {
  const { recentActivities, todayMemories, fetchHomeData, isLoading } = useMemoryStore();
  const { user } = useUserStore();
  const { fetchMyTree, tree } = useTreeStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [showStreak, setShowStreak] = useState(false);
  const [currentIdeas, setCurrentIdeas] = useState<typeof MEMORY_PROMPTS>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Asegurar que el árbol se cargue al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const refreshData = async () => {
        try {
          await fetchHomeData();
          if (!tree && isActive) {
            await fetchMyTree();
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };

      refreshData();

      return () => {
        isActive = false; // ✅ Cleanup on unfocus
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        await fetchHomeData();
        await fetchMyTree();
        if (isMounted) {
          refreshIdeas();
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false; // ✅ Prevent state updates after unmount
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchHomeData(), fetchMyTree()]);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshIdeas = () => {
    const shuffled = [...MEMORY_PROMPTS].sort(() => 0.5 - Math.random());
    setCurrentIdeas(shuffled.slice(0, 2));
  };

  // Navegación
  const navigateToTree = () => router.push('/tree');
  const navigateToMemory = () => router.push('/add-memory-options');
  const navigateToFamily = () => router.push('/family');
  const navigateToGifts = () => router.push('/gifts');

  const currentStreak = (user as any)?.current_streak || 0;

  return (
    <>
      <ScrollView
        style={[styles.container, isDarkMode && styles.containerDark]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* HEADER */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.greeting, isDarkMode && styles.greetingDark]}>
                Hola, {user?.name?.split(' ')[0] || 'Viajero'}
              </Text>
              <Text style={[styles.subGreeting, isDarkMode && styles.subGreetingDark]}>
                Tu historia sigue creciendo.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.streakBadge, isDarkMode && styles.streakBadgeDark]}
              onPress={() => setShowStreak(true)}
              activeOpacity={0.7}
            >
              <Flame size={20} color={colors.warning} fill={currentStreak > 0 ? colors.warning : 'transparent'} />
              <Text style={[styles.streakText, isDarkMode && styles.textWhite]}>{currentStreak}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCIONES RÁPIDAS (MEJORADAS CON TARJETA) */}
        <View style={[styles.quickActionsCard, isDarkMode && styles.quickActionsCardDark]}>
          <TouchableOpacity style={styles.actionItem} onPress={navigateToTree}>
            <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
              <Trees size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Mi Árbol</Text>
          </TouchableOpacity>

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

        {/* SECCIÓN 1: RECUERDOS (DATOS REALES) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Recuerdos</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
          ) : todayMemories && todayMemories.length > 0 ? (
            todayMemories.map((memory: any) => {
              if (!memory || !memory.id) return null;

              const hasImage = memory.mediaUrls && memory.mediaUrls.length > 0;
              const imageUrl = hasImage ? memory.mediaUrls[0] : null;

              return (
                <View key={memory.id} style={[styles.card, isDarkMode && styles.cardDark]}>
                  {/* Borde izquierdo (si no hay imagen) o Imagen (si la hay) */}
                  {hasImage ? (
                    <SafeImage
                      source={{ uri: imageUrl }}
                      style={styles.cardImage}
                      containerStyle={styles.cardImageContainer}
                    />
                  ) : (
                    <View style={[styles.cardLeftBorder, { backgroundColor: memory.type === 'birthday' ? colors.warning : colors.primary }]} />
                  )}

                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>{memory.title}</Text>
                    <Text style={[styles.cardSubtitle, isDarkMode && styles.textLight]} numberOfLines={2}>
                      {memory.description}
                    </Text>

                    <TouchableOpacity
                      style={[styles.actionButtonSmall, { backgroundColor: memory.type === 'birthday' ? colors.warning : colors.primary }]}
                      onPress={() => memory.type === 'memory' ? router.push({ pathname: '/fruit-details', params: { id: memory.id } }) : navigateToMemory()}
                    >
                      <Text style={styles.actionButtonText}>
                        {memory.type === 'birthday' ? 'Preparar regalo' : 'Ver recuerdo'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardIcon}>
                    {memory.type === 'birthday' ? (
                      <Gift size={24} color={colors.warning} />
                    ) : (
                      <Calendar size={24} color={colors.primary} />
                    )}
                  </View>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={[styles.emptyStateText, isDarkMode && styles.textLight]}>
                No hay eventos hoy. ¡Es un buen día para crear un nuevo recuerdo!
              </Text>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={navigateToMemory}>
                <Text style={styles.actionButtonText}>Crear ahora</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECCIÓN 2: INSPIRACIÓN (IDEAS) */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Lightbulb size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Ideas para tu árbol</Text>
            </View>
            <TouchableOpacity onPress={refreshIdeas} style={styles.refreshButton}>
              <RefreshCw size={16} color={colors.textLight} />
              <Text style={styles.refreshText}>Otras ideas</Text>
            </TouchableOpacity>
          </View>

          {currentIdeas.map((idea) => (
            <TouchableOpacity
              key={idea.id}
              style={[styles.ideaCard, isDarkMode && styles.cardDark]}
              onPress={navigateToMemory}
            >
              <View style={[styles.ideaIconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Sparkles size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ideaCategory, { color: colors.warning }]}>{idea.category.toUpperCase()}</Text>
                <Text style={[styles.ideaText, isDarkMode && styles.textWhite]}>{idea.text}</Text>
              </View>
              <Plus size={20} color={colors.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SECCIÓN 2.5: FAMILIA (Sincronizado con Tree) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Familia</Text>
          </View>

          {tree?.roots && tree.roots.length > 0 ? (
            tree.roots
              .filter((root) => root.status === 'active' || !root.status) // Filtrar solo activos
              .map((root) => (
                <TouchableOpacity
                  key={root.id}
                  style={[styles.familyCard, isDarkMode && styles.familyCardDark]}
                  onPress={() => router.push({ pathname: '/root-details', params: { id: root.id } })}
                >
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>{root.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.familyInfo}>
                    <Text style={[styles.familyName, isDarkMode && styles.textWhite]}>{root.name}</Text>
                    <Text style={[styles.familyRelation, isDarkMode && styles.textLight]}>{root.relation}</Text>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>Aún no tienes familiares conectados.</Text>
              <Text style={[styles.emptySubText, isDarkMode && styles.textLight]}>Invita a tus familiares para ver sus árboles.</Text>
            </View>
          )}
        </View>

        {/* SECCIÓN 3: ACTIVIDAD FAMILIAR */}
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
              <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>Todo está tranquilo por aquí.</Text>
              <Text style={[styles.emptySubText, isDarkMode && styles.textLight]}>Añade familiares para ver su actividad.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <StreakModal
        visible={showStreak}
        onClose={() => setShowStreak(false)}
        currentStreak={currentStreak}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  containerDark: { backgroundColor: '#121212' },
  headerDark: { backgroundColor: '#121212' },

  header: { padding: 24, paddingTop: 50, backgroundColor: '#F5F7FA', paddingBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  greetingDark: { color: colors.white },
  subGreeting: { fontSize: 15, color: colors.textLight },
  subGreetingDark: { color: '#AAA' },

  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
  streakBadgeDark: { backgroundColor: '#333' },
  streakText: { fontSize: 16, fontWeight: 'bold', color: colors.text },

  // ACCIONES RÁPIDAS (MEJORADAS)
  quickActionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsCardDark: {
    backgroundColor: '#1E1E1E',
  },
  actionItem: { alignItems: 'center', width: 70 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionIconDark: { backgroundColor: '#1E1E1E' },
  actionText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  actionTextDark: { color: colors.white },

  // SECCIONES
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  sectionTitleDark: { color: colors.white },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },

  // TARJETAS DE RECUERDOS
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    overflow: 'hidden',
    position: 'relative'
  },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardLeftBorder: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: colors.primary
  },
  cardContent: { flex: 1, paddingLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  cardIcon: { justifyContent: 'flex-start', paddingTop: 4 },

  cardImageContainer: {
    width: 80,
    height: '100%',
    marginRight: 0,
    backgroundColor: '#f0f0f0', // Placeholder bg
  },
  cardImage: {
    width: 80,
    height: '100%',
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  actionButtonSmall: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  actionButtonText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

  emptyStateCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#DDD'
  },
  emptyStateText: { textAlign: 'center', color: '#666', marginBottom: 12 },

  // TARJETAS DE IDEAS
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { color: colors.textLight, fontSize: 12 },

  ideaCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  ideaIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  ideaCategory: { fontSize: 10, fontWeight: 'bold', marginBottom: 2, letterSpacing: 1 },
  ideaText: { fontSize: 14, color: '#444', fontWeight: '500' },

  // TARJETAS DE FAMILIA
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  familyCardDark: {
    backgroundColor: '#1E1E1E',
  },
  familyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  familyRelation: {
    fontSize: 13,
    color: colors.textLight,
  },
  // ESTADO VACÍO (ACTIVIDAD)
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD' },
  emptyText: { color: colors.text, fontWeight: '600' },
  emptySubText: { color: colors.textLight, fontSize: 12, marginTop: 4 },
});