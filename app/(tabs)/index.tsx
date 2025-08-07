import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useMemoryStore } from '@/stores/memoryStore';
import MemoryCard from '@/components/MemoryCard';
import ActivityItem from '@/components/ActivityItem';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { Calendar, Heart, BookOpen, Users, Gift, Trees } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { todayMemories, recentActivities, fetchTodayMemories, fetchRecentActivities } = useMemoryStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    fetchTodayMemories();
    fetchRecentActivities();
  }, []);

  const handleAddMemory = () => {
    router.push('/add-memory-options');
  };

  const navigateToTree = () => {
    router.push('/tree');
  };

  const navigateToMemory = () => {
    router.push('/add-memory-options');
  };

  const navigateToFamily = () => {
    router.push('/family');
  };

  const navigateToGifts = () => {
    router.push('/gifts');
  };

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.containerDark]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, isDarkMode && styles.greetingDark]}>Hola, Ana</Text>
        <Text style={[styles.subGreeting, isDarkMode && styles.subGreetingDark]}>Añade nuevos recuerdos hoy</Text>
      </View>

      <View style={[styles.quickActions, isDarkMode && styles.quickActionsDark]}>
        <TouchableOpacity style={styles.actionItem} onPress={navigateToTree}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Trees size={26} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Mi Árbol</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={navigateToMemory}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <BookOpen size={26} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Recuerdo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={navigateToFamily}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Users size={26} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Familia</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={navigateToGifts}>
          <View style={[styles.actionIcon, isDarkMode && styles.actionIconDark]}>
            <Gift size={26} color={colors.primary} />
          </View>
          <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Regalos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Recuerdos de hoy</Text>
        </View>
        
        {todayMemories.map((memory) => (
          <MemoryCard
            key={memory.id}
            title={memory.title}
            description={memory.description}
            onPress={handleAddMemory}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Heart size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Actividad reciente</Text>
        </View>
        
        {recentActivities.map((activity) => (
          <ActivityItem
            key={activity.id}
            userInitial={activity.userInitial}
            userName={activity.userName}
            action={activity.action}
            timeAgo={activity.timeAgo}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  greetingDark: {
    color: colors.white,
  },
  subGreeting: {
    fontSize: 17,
    color: colors.textLight,
  },
  subGreetingDark: {
    color: '#AAA',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconDark: {
    backgroundColor: colors.primary + '40',
  },
  actionText: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionTextDark: {
    color: colors.white,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  sectionTitleDark: {
    color: colors.white,
  },
});