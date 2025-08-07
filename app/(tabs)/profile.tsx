import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useUserStore } from '@/stores/userStore';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { ChevronRight, Share2, FileText, MessageSquare, HelpCircle, Settings, Bell, Lock, Database, LogOut, Moon, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

export default function ProfileScreen() {
  const { user, logout } = useUserStore();
  const { tree } = useTreeStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  const handleAIAssistant = () => {
    router.push('/ai-assistant');
  };

  const handleShareTree = () => {
    router.push('/share-tree');
  };

  const handleDigitalLegacy = () => {
    router.push('/digital-legacy');
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={[styles.name, isDarkMode && styles.textWhite]}>{user.name}</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Mi árbol desde {new Date(user.createdAt).getFullYear()}</Text>
      </View>
      
      <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>{tree.fruits.length}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Recuerdos</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>{tree.branches.length}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Ramas</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>{user.connections.length}</Text>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Conexiones</Text>
        </View>
      </View>
      
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Mi árbol</Text>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={handleShareTree}>
          <View style={styles.menuItemLeft}>
            <Share2 size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Compartir mi árbol</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={handleDigitalLegacy}>
          <View style={styles.menuItemLeft}>
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Testamento digital</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Mi cuenta</Text>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/profile-settings')}>
          <View style={styles.menuItemLeft}>
            <Settings size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Perfil personal</Text>
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
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={() => router.push('/privacy')}>
          <View style={styles.menuItemLeft}>
            <Lock size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Privacidad</Text>
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
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]} onPress={handleAIAssistant}>
          <View style={styles.menuItemLeft}>
            <MessageSquare size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Asistente IA</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
        
        <View style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
          <View style={styles.menuItemLeft}>
            {isDarkMode ? (
              <Moon size={20} color={colors.white} />
            ) : (
              <Sun size={20} color={colors.gray} />
            )}
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
      
      <View style={[styles.section, isDarkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Ayuda</Text>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
          <View style={styles.menuItemLeft}>
            <HelpCircle size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Centro de ayuda</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
          <View style={styles.menuItemLeft}>
            <MessageSquare size={20} color={isDarkMode ? colors.white : colors.gray} />
            <Text style={[styles.menuItemText, isDarkMode && styles.textWhite]}>Contacto</Text>
          </View>
          <ChevronRight size={20} color={isDarkMode ? colors.white : colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  subtitleDark: {
    color: '#AAAAAA',
  },
  textWhite: {
    color: colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statsContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  statLabelDark: {
    color: '#AAAAAA',
  },
  section: {
    backgroundColor: colors.white,
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionDark: {
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  menuItemDark: {
    borderBottomColor: '#333333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});