import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { Eye, Users, Globe, Shield, Trash2 } from 'lucide-react-native';

export default function PrivacyScreen() {
  const { theme } = useThemeStore();
  const { user, initialize, logout } = useUserStore();
  const isDarkMode = theme === 'dark';

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    allowFriendRequests: true,
    shareLocation: false,
    dataAnalytics: true,
  });

  useEffect(() => {
    if (user?.settings?.privacy) {
      setPrivacy(prev => ({ ...prev, ...user.settings?.privacy }));
    }
  }, [user]);

  const updatePrivacy = async (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);

    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        privacy: newPrivacy
      };

      const { error } = await supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', user?.id);

      if (error) throw error;
      await initialize();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro? Perderás tu árbol y todos tus recuerdos. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Cuenta eliminada', 'Lamentamos verte partir.');
          }
        }
      ]
    );
  };

  const renderItem = (key: string, title: string, description: string, Icon: any) => (
    <View style={styles.item} key={key}>
      <View style={styles.left}>
        <Icon size={22} color={colors.textLight} style={{ marginRight: 12 }} />
        <View style={styles.texts}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>{title}</Text>
          <Text style={[styles.desc, isDarkMode && styles.textLight]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={privacy[key as keyof typeof privacy]}
        onValueChange={(val) => updatePrivacy(key, val)}
        trackColor={{ false: colors.lightGray, true: colors.primary }}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacidad',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Visibilidad</Text>
          {renderItem('profileVisible', 'Perfil público', 'Otros pueden encontrarte por email', Eye)}
          {renderItem('allowFriendRequests', 'Solicitudes de conexión', 'Permitir que familiares te añadan', Users)}
          {renderItem('shareLocation', 'Ubicación en recuerdos', 'Guardar coordenadas GPS', Globe)}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Datos</Text>
          {renderItem('dataAnalytics', 'Mejorar ALMA', 'Compartir datos de uso anónimos', Shield)}
        </View>

        <TouchableOpacity
          style={[styles.dangerButton, isDarkMode && styles.dangerButtonDark]}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.dangerText}>Eliminar mi cuenta</Text>
        </TouchableOpacity>
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
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  desc: { fontSize: 12, color: colors.textLight },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#FEE2E2', marginTop: 20 },
  dangerButtonDark: { backgroundColor: '#3B1010' },
  dangerText: { color: colors.error, fontWeight: 'bold', fontSize: 16 },
});