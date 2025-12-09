import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image, Alert } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { ChevronRight, Share2, FileText, MessageSquare, HelpCircle, Settings, Bell, Lock, Database, LogOut, Moon, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

export default function ProfileScreen() {
  const { user, logout } = useUserStore();
  const { tree, fetchMyTree } = useTreeStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    fetchMyTree();
  }, []);

  // 🔄 ACTUALIZAR CONTADORES: Re-cargar cuando el componente se enfoque (usuario vuelve a la pantalla)
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      fetchMyTree(true); // Refresh cuando se enfoca la pantalla
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const handleComingSoon = () => {
    Alert.alert("Próximamente", "Estamos redactando los términos legales para proteger tu legado.");
  };

  if (!user) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.center]}>
        <Text style={isDarkMode ? styles.textWhite : undefined}>Cargando perfil...</Text>
      </View>
    );
  }

  const avatarUrl = (user as any)?.avatar_url;

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.name, isDarkMode && styles.textWhite]}>{user.name || 'Usuario'}</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Miembro desde {new Date(user.createdAt || Date.now()).getFullYear()}
        </Text>
      </View>

      <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>
            {tree?.fruits?.length || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Recuerdos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>
            {tree?.branches?.length || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Ramas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>
            {tree?.roots?.length || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Raíces</Text>
        </View>
      </View>

      {/* SECCIÓN: MI ÁRBOL */}
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Mi Legado</Text>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/share-tree')}>
          <View style={styles.menuItemLeft}>
            <Share2 size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Compartir árbol</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/digital-legacy')}>
          <View style={styles.menuItemLeft}>
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Testamento digital</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
      </View>

      {/* SECCIÓN: CUENTA (Con Almacenamiento restaurado) */}
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Configuración</Text>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/profile-settings')}>
          <View style={styles.menuItemLeft}>
            <Settings size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Datos personales</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/notifications')}>
          <View style={styles.menuItemLeft}>
            <Bell size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Notificaciones</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/storage')}>
          <View style={styles.menuItemLeft}>
            <Database size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Almacenamiento</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/privacy')}>
          <View style={styles.menuItemLeft}>
            <Lock size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Privacidad y seguridad</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <View style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
          <View style={styles.menuItemLeft}>
            {isDarkMode ? <Moon size={20} color={colors.white} /> : <Sun size={20} color={colors.gray} />}
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Modo oscuro</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
            thumbColor={isDarkMode ? colors.primary : colors.gray}
          />
        </View>
      </View>

      {/* SECCIÓN: SOPORTE Y LEGAL (Restaurada) */}
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Ayuda</Text>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={handleComingSoon}>
          <View style={styles.menuItemLeft}>
            <HelpCircle size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Centro de ayuda</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={handleComingSoon}>
          <View style={styles.menuItemLeft}>
            <FileText size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Términos y condiciones</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={colors.white} />
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.white, marginBottom: 16 },
  headerDark: { backgroundColor: '#1E1E1E' },
  avatarContainer: { marginBottom: 12 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.white },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: colors.white },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textLight },
  subtitleDark: { color: '#AAAAAA' },
  textWhite: { color: colors.white },
  statsContainer: { flexDirection: 'row', backgroundColor: colors.white, paddingVertical: 20, marginBottom: 16, borderRadius: 12, marginHorizontal: 16, elevation: 2, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } },
  statsContainerDark: { backgroundColor: '#1E1E1E' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  statLabelDark: { color: '#AAAAAA' },
  section: { backgroundColor: colors.white, marginBottom: 16, paddingVertical: 8, paddingHorizontal: 16 },
  sectionDark: { backgroundColor: '#1E1E1E' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, paddingVertical: 12, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  menuItemDark: { borderBottomColor: '#333333' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 16, color: colors.text, marginLeft: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEBEE', marginHorizontal: 16, marginVertical: 30, paddingVertical: 16, borderRadius: 12 },
  logoutButtonText: { color: colors.error, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});