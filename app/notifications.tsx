import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { Bell, Gift, Users, Clock, MessageSquare, Heart } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { theme } = useThemeStore();
  const { user, initialize } = useUserStore();
  const isDarkMode = theme === 'dark';
  const [updating, setUpdating] = useState(false);

  // Estado inicial por defecto
  const [notifications, setNotifications] = useState({
    gifts: true,
    memories: true,
    family: true,
    timeCapsules: true,
    comments: false,
    push: true,
    email: true,
  });

  // Cargar configuración guardada
  useEffect(() => {
    if (user?.settings?.notifications) {
      setNotifications(prev => ({ ...prev, ...user.settings?.notifications }));
    }
  }, [user]);

  // Guardar en Supabase cada vez que se cambia un switch
  const updateNotification = async (key: string, value: boolean) => {
    // 1. Actualizar UI inmediatamente
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    setUpdating(true);

    try {
      // 2. Preparar el nuevo objeto settings completo
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        notifications: newNotifications
      };

      // 3. Guardar en DB
      const { error } = await supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', user?.id);

      if (error) throw error;

      // 4. Sincronizar store local
      await initialize();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const renderSwitch = (key: string, title: string, description: string, Icon: any, color: string) => (
    <View style={[styles.item, isDarkMode && styles.itemDark]} key={key}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Icon size={22} color={color} />
        </View>
        <View style={styles.texts}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>{title}</Text>
          <Text style={[styles.desc, isDarkMode && styles.textLight]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={notifications[key as keyof typeof notifications]}
        onValueChange={(val) => updateNotification(key, val)}
        trackColor={{ false: colors.lightGray, true: colors.primary }}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notificaciones',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Actividad</Text>
          {renderSwitch('gifts', 'Regalos recibidos', 'Nuevos regalos y cápsulas', Gift, colors.primary)}
          {renderSwitch('memories', 'Nuevos recuerdos', 'Actividad en árboles compartidos', Heart, colors.secondary)}
          {renderSwitch('family', 'Familia', 'Interacciones de familiares', Users, '#10b981')}
          {renderSwitch('timeCapsules', 'Cápsulas del tiempo', 'Cuando se desbloquea un recuerdo', Clock, colors.warning)}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Canales</Text>
          {renderSwitch('push', 'Notificaciones Push', 'En tu dispositivo', Bell, colors.primary)}
          {renderSwitch('email', 'Email', 'Resumen semanal y alertas importantes', MessageSquare, colors.accent)}
        </View>

        {updating && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  containerDark: { backgroundColor: '#121212' },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionDark: { backgroundColor: '#1E1E1E' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  textWhite: { color: '#FFF' },
  textLight: { color: '#AAA' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  itemDark: {},
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  desc: { fontSize: 12, color: colors.textLight },
});