import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useTreeStore } from '@/stores/treeStore';
import { Database, Trash2, Download, Upload, Crown, Zap, Check } from 'lucide-react-native';

export default function StorageScreen() {
  const { theme } = useThemeStore();
  const { tree, fetchMyTree } = useTreeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const [loading, setLoading] = useState(true);

  // Estado para el uso real
  const [stats, setStats] = useState({
    usedGB: 0,
    photoCount: 0,
    percentage: 0
  });

  // Calcular uso real basado en el árbol
  useEffect(() => {
    // Aseguramos tener el árbol cargado para poder contar fotos/vídeos
    if (!tree) {
      fetchMyTree();
      return;
    }

    if (tree) {
      // Filtramos frutos con media
      const fruitsWithMedia = tree.fruits.filter(f => f.mediaUrls && f.mediaUrls.length > 0);
      // Contamos total de fotos (asumiendo array de URLs)
      const totalPhotos = fruitsWithMedia.reduce((acc, f) => acc + (f.mediaUrls?.length || 0), 0);

      // Estimación: 2MB por foto promedio
      const usedMB = totalPhotos * 2;
      const usedGB = usedMB / 1024;
      const totalGB = 1; // Plan gratuito: 1 GB (ajustado a realidad)

      setStats({
        usedGB: Number(usedGB.toFixed(2)),
        photoCount: totalPhotos,
        percentage: (usedGB / totalGB) * 100
      });
      setLoading(false);
    } else {
      // Si no hay árbol aún, asumimos 0
      setLoading(false);
    }
  }, [tree]);

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleCleanup = () => {
    Alert.alert(
      'Limpiar caché',
      'Esto no borrará tus recuerdos, solo archivos temporales de la app para liberar espacio en tu móvil.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', onPress: () => Alert.alert('Listo', 'Cache limpia.') }
      ]
    );
  };

  const plans = [
    {
      id: 'gratuito',
      name: 'Plan Gratuito',
      storage: '1 GB',
      price: 'Gratis',
      features: ['Almacenamiento básico', 'Publicidad'],
      icon: Database,
      color: colors.gray,
      current: true // Por defecto para MVP
    },
    {
      id: 'pro',
      name: 'Plan Pro',
      storage: '100 GB',
      price: '€6,99 / mes',
      features: ['Sin anuncios', 'Más espacio', 'IA avanzada'],
      icon: Zap,
      color: colors.primary,
      current: false
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      storage: '1 TB',
      price: '€14,99 / mes',
      features: ['Todo ilimitado', 'Legado digital completo', 'Soporte prioritario'],
      icon: Crown,
      color: colors.warning,
      current: false
    }
  ];

  if (loading) return <View style={[styles.center, isDarkMode && styles.bgDark]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Almacenamiento',
          headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        {/* CABECERA */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Database size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
            Tu Nube Personal
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.textLight]}>
            Gestiona el espacio de tus recuerdos
          </Text>
        </View>

        {/* TARJETA DE USO */}
        <View style={[styles.usageCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.usageTitle, isDarkMode && styles.textWhite]}>
            Uso actual
          </Text>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, isDarkMode && styles.progressBarDark]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(2, Math.min(stats.percentage, 100))}%`,
                    backgroundColor: stats.percentage > 80 ? colors.error : colors.primary
                  }
                ]}
              />
            </View>
            <Text style={[styles.usageText, isDarkMode && styles.textLight]}>
              {stats.usedGB} GB de 1 GB ({stats.percentage.toFixed(1)}%)
            </Text>
          </View>

          <Text style={[styles.breakdownText, isDarkMode && styles.textLight]}>
            Tienes aproximadamente {stats.photoCount} fotos/videos guardados.
          </Text>
        </View>

        {/* ACCIONES RÁPIDAS */}
        <View style={[styles.actionsCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
            Acciones
          </Text>

          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]} onPress={handleCleanup}>
            <Trash2 size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.textWhite]}>
              Limpiar caché local
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <Download size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.textWhite]}>
              Solicitar copia de seguridad
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE PLANES (Restaurada) */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite, { marginBottom: 15 }]}>
            Planes disponibles
          </Text>

          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isDarkMode && styles.cardDark,
                  plan.current && { borderColor: plan.color, borderWidth: 2 }
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={[styles.iconBox, { backgroundColor: plan.color + '20' }]}>
                    <Icon size={24} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, isDarkMode && styles.textWhite]}>{plan.name}</Text>
                    <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  </View>
                  {plan.current && (
                    <View style={[styles.badge, { backgroundColor: plan.color }]}>
                      <Text style={styles.badgeText}>Actual</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.planStorage, isDarkMode && styles.textLight]}>Capacidad: {plan.storage}</Text>

                <View style={styles.featuresList}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Check size={14} color={plan.color} />
                      <Text style={[styles.featureText, isDarkMode && styles.textLight]}> {f}</Text>
                    </View>
                  ))}
                </View>

                {!plan.current && (
                  <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: plan.color }]}
                    onPress={handleUpgrade}
                  >
                    <Text style={styles.upgradeText}>Mejorar Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  containerDark: { backgroundColor: '#121212' },
  bgDark: { backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 24, backgroundColor: colors.white, borderRadius: 16, marginBottom: 16 },
  headerDark: { backgroundColor: '#1E1E1E' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 10, color: colors.text },
  headerSubtitle: { fontSize: 14, marginTop: 4, color: colors.textLight },

  usageCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardDark: { backgroundColor: '#1E1E1E' },
  usageTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.text },
  progressContainer: { marginBottom: 10 },
  progressBar: { height: 10, backgroundColor: colors.lightGray, borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  progressBarDark: { backgroundColor: '#333' },
  progressFill: { height: '100%', borderRadius: 5 },
  usageText: { textAlign: 'center', fontSize: 12, color: colors.textLight },
  breakdownText: { fontSize: 13, color: colors.textLight, fontStyle: 'italic' },

  actionsCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.lightGray, marginBottom: 8 },
  actionButtonDark: { backgroundColor: '#333' },
  actionButtonText: { marginLeft: 12, fontWeight: '500', color: colors.text },

  plansSection: { marginBottom: 40 },
  planCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  planName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  planPrice: { fontWeight: '600', fontSize: 15 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  planStorage: { fontSize: 16, marginBottom: 10, color: colors.textLight },
  featuresList: { marginBottom: 15 },
  featureText: { fontSize: 13, color: colors.textLight },
  upgradeButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  upgradeText: { color: '#FFF', fontWeight: 'bold' },

  textWhite: { color: '#FFF' },
  textLight: { color: '#CCC' },
});