import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Bell, Gift, Users, Clock, MessageSquare, Heart } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [notifications, setNotifications] = useState({
    gifts: true,
    memories: true,
    family: true,
    timeCapsules: true,
    comments: false,
    likes: false,
    push: true,
    email: true,
  });

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const notificationItems = [
    {
      key: 'gifts',
      title: 'Regalos recibidos',
      description: 'Cuando alguien te envía un regalo o cápsula del tiempo',
      icon: Gift,
      color: colors.primary,
    },
    {
      key: 'memories',
      title: 'Nuevos recuerdos',
      description: 'Cuando se añaden recuerdos a árboles compartidos',
      icon: Heart,
      color: colors.secondary,
    },
    {
      key: 'family',
      title: 'Actividad familiar',
      description: 'Cuando familiares interactúan con tu árbol',
      icon: Users,
      color: '#10b981',
    },
    {
      key: 'timeCapsules',
      title: 'Cápsulas del tiempo',
      description: 'Cuando se abren cápsulas del tiempo programadas',
      icon: Clock,
      color: colors.warning,
    },
    {
      key: 'comments',
      title: 'Comentarios',
      description: 'Cuando alguien comenta en tus recuerdos',
      icon: MessageSquare,
      color: '#8b5cf6',
    },
  ];

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Notificaciones',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Bell size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Gestiona tus notificaciones
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Elige qué notificaciones quieres recibir
          </Text>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Tipos de notificaciones
          </Text>
          
          {notificationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.key} style={[styles.notificationItem, isDarkMode && styles.notificationItemDark]}>
                <View style={styles.notificationLeft}>
                  <View style={[styles.notificationIcon, { backgroundColor: item.color + '20' }]}>
                    <IconComponent size={24} color={item.color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, isDarkMode && styles.notificationTitleDark]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.notificationDescription, isDarkMode && styles.notificationDescriptionDark]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications[item.key as keyof typeof notifications]}
                  onValueChange={(value) => updateNotification(item.key, value)}
                  trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                  thumbColor={notifications[item.key as keyof typeof notifications] ? colors.primary : colors.gray}
                />
              </View>
            );
          })}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Métodos de entrega
          </Text>
          
          <View style={[styles.notificationItem, isDarkMode && styles.notificationItemDark]}>
            <View style={styles.notificationLeft}>
              <View style={[styles.notificationIcon, { backgroundColor: colors.primary + '20' }]}>
                <Bell size={24} color={colors.primary} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, isDarkMode && styles.notificationTitleDark]}>
                  Notificaciones push
                </Text>
                <Text style={[styles.notificationDescription, isDarkMode && styles.notificationDescriptionDark]}>
                  Recibe notificaciones en tu dispositivo
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => updateNotification('push', value)}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={notifications.push ? colors.primary : colors.gray}
            />
          </View>

          <View style={[styles.notificationItem, isDarkMode && styles.notificationItemDark]}>
            <View style={styles.notificationLeft}>
              <View style={[styles.notificationIcon, { backgroundColor: colors.secondary + '20' }]}>
                <MessageSquare size={24} color={colors.secondary} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, isDarkMode && styles.notificationTitleDark]}>
                  Notificaciones por email
                </Text>
                <Text style={[styles.notificationDescription, isDarkMode && styles.notificationDescriptionDark]}>
                  Recibe un resumen semanal por correo
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => updateNotification('email', value)}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={notifications.email ? colors.primary : colors.gray}
            />
          </View>
        </View>

        <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
          <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
            💡 Puedes cambiar estas configuraciones en cualquier momento. 
            Las notificaciones te ayudan a mantenerte conectado con tu familia y no perderte momentos importantes.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  headerTitleDark: {
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  headerSubtitleDark: {
    color: '#AAA',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: colors.white,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  notificationItemDark: {
    borderBottomColor: '#333',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  notificationTitleDark: {
    color: colors.white,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 18,
  },
  notificationDescriptionDark: {
    color: '#AAA',
  },
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  infoBoxDark: {
    backgroundColor: colors.primary + '20',
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoTextDark: {
    color: colors.white,
  },
});