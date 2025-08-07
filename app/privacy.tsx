import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Lock, Eye, EyeOff, Users, Globe, Shield, Trash2 } from 'lucide-react-native';

export default function PrivacyScreen() {
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    allowFriendRequests: true,
    shareLocation: false,
    dataAnalytics: true,
    marketingEmails: false,
    twoFactorAuth: false,
  });

  const updatePrivacy = (key: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.');
          }
        }
      ]
    );
  };

  const privacyItems = [
    {
      key: 'profileVisible',
      title: 'Perfil público',
      description: 'Permite que otros usuarios vean tu perfil',
      icon: Eye,
      color: colors.primary,
    },
    {
      key: 'allowFriendRequests',
      title: 'Solicitudes de amistad',
      description: 'Permite que otros te envíen solicitudes de conexión',
      icon: Users,
      color: '#10b981',
    },
    {
      key: 'shareLocation',
      title: 'Compartir ubicación',
      description: 'Incluir ubicación en recuerdos y actividades',
      icon: Globe,
      color: colors.warning,
    },
    {
      key: 'dataAnalytics',
      title: 'Análisis de datos',
      description: 'Ayúdanos a mejorar la app con datos anónimos',
      icon: Shield,
      color: '#8b5cf6',
    },
    {
      key: 'marketingEmails',
      title: 'Emails promocionales',
      description: 'Recibir ofertas y novedades por correo',
      icon: EyeOff,
      color: colors.secondary,
    },
    {
      key: 'twoFactorAuth',
      title: 'Autenticación de dos factores',
      description: 'Añade una capa extra de seguridad a tu cuenta',
      icon: Lock,
      color: colors.error,
    },
  ];

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Privacidad',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Lock size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Tu privacidad es importante
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Controla quién puede ver tu información y cómo la usamos
          </Text>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Configuración de privacidad
          </Text>
          
          {privacyItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.key} style={[styles.privacyItem, isDarkMode && styles.privacyItemDark]}>
                <View style={styles.privacyLeft}>
                  <View style={[styles.privacyIcon, { backgroundColor: item.color + '20' }]}>
                    <IconComponent size={24} color={item.color} />
                  </View>
                  <View style={styles.privacyContent}>
                    <Text style={[styles.privacyTitle, isDarkMode && styles.privacyTitleDark]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.privacyDescription, isDarkMode && styles.privacyDescriptionDark]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={privacy[item.key as keyof typeof privacy]}
                  onValueChange={(value) => updatePrivacy(item.key, value)}
                  trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                  thumbColor={privacy[item.key as keyof typeof privacy] ? colors.primary : colors.gray}
                />
              </View>
            );
          })}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Gestión de datos
          </Text>
          
          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <Shield size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Descargar mis datos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <EyeOff size={20} color={colors.warning} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Solicitar eliminación de datos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.dangerSection, isDarkMode && styles.dangerSectionDark]}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>
            Zona de peligro
          </Text>
          
          <TouchableOpacity 
            style={[styles.dangerButton, isDarkMode && styles.dangerButtonDark]}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={20} color={colors.white} />
            <Text style={styles.dangerButtonText}>
              Eliminar cuenta permanentemente
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
          <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
            🔒 Nos tomamos tu privacidad en serio. Nunca vendemos tus datos personales y 
            solo los usamos para mejorar tu experiencia en la aplicación. 
            Puedes revisar nuestra política de privacidad completa en cualquier momento.
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
    lineHeight: 22,
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
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  privacyItemDark: {
    borderBottomColor: '#333',
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  privacyTitleDark: {
    color: colors.white,
  },
  privacyDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 18,
  },
  privacyDescriptionDark: {
    color: '#AAA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    marginBottom: 8,
  },
  actionButtonDark: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  actionButtonTextDark: {
    color: colors.white,
  },
  dangerSection: {
    backgroundColor: colors.error + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  dangerSectionDark: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error + '40',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
  },
  dangerButtonDark: {
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 8,
    fontWeight: 'bold',
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