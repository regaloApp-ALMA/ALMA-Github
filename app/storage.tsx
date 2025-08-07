import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Database, Trash2, Download, Upload, Crown, Zap, Star } from 'lucide-react-native';

export default function StorageScreen() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  // Datos simulados de almacenamiento
  const storageData = {
    used: 2.3, // GB
    total: 10, // GB
    plan: 'gratuito', // gratuito, pro, premium
    breakdown: {
      photos: 1.2,
      videos: 0.8,
      documents: 0.2,
      other: 0.1,
    }
  };

  const usagePercentage = (storageData.used / storageData.total) * 100;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleCleanup = () => {
    Alert.alert(
      'Limpiar almacenamiento',
      'Esta función eliminará archivos temporales y optimizará tu almacenamiento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          onPress: () => {
            Alert.alert('Limpieza completada', 'Se han liberado 150 MB de espacio.');
          }
        }
      ]
    );
  };

  const plans = [
    {
      id: 'gratuito',
      name: 'Plan Gratuito',
      storage: '10 GB',
      price: 'Gratis',
      features: ['Anuncios', 'Almacenamiento hasta 10 GB', 'Generación IA limitada'],
      icon: Database,
      color: colors.gray,
      current: storageData.plan === 'gratuito'
    },
    {
      id: 'pro',
      name: 'Plan Pro',
      storage: '100 GB',
      price: '€6,99 - €14,99 / mes',
      features: ['Todo lo incluido del plan gratuito', 'Sin anuncios', 'Almacenamiento ampliado hasta 100 GB', 'Generación IA moderada'],
      icon: Zap,
      color: colors.primary,
      current: storageData.plan === 'pro'
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      storage: '1 TB',
      price: '€14,99 - €24,99 / mes',
      features: ['Todo lo incluido del plan Pro', 'Almacenamiento ampliado hasta 1 TB', 'Generación IA ampliada', 'Avatares personalizados'],
      icon: Crown,
      color: colors.warning,
      current: storageData.plan === 'premium'
    }
  ];

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Almacenamiento',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Database size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Gestión de almacenamiento
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Controla el espacio que usas en tu árbol de vida
          </Text>
        </View>

        <View style={[styles.usageCard, isDarkMode && styles.usageCardDark]}>
          <Text style={[styles.usageTitle, isDarkMode && styles.usageTitleDark]}>
            Uso actual
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, isDarkMode && styles.progressBarDark]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(usagePercentage, 100)}%`,
                    backgroundColor: usagePercentage > 80 ? colors.error : colors.primary
                  }
                ]} 
              />
            </View>
            <Text style={[styles.usageText, isDarkMode && styles.usageTextDark]}>
              {storageData.used} GB de {storageData.total} GB ({usagePercentage.toFixed(1)}%)
            </Text>
          </View>

          <View style={styles.breakdown}>
            <Text style={[styles.breakdownTitle, isDarkMode && styles.breakdownTitleDark]}>
              Desglose por tipo:
            </Text>
            <View style={styles.breakdownItems}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.breakdownText, isDarkMode && styles.breakdownTextDark]}>
                  Fotos: {storageData.breakdown.photos} GB
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.breakdownText, isDarkMode && styles.breakdownTextDark]}>
                  Videos: {storageData.breakdown.videos} GB
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.breakdownText, isDarkMode && styles.breakdownTextDark]}>
                  Documentos: {storageData.breakdown.documents} GB
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.gray }]} />
                <Text style={[styles.breakdownText, isDarkMode && styles.breakdownTextDark]}>
                  Otros: {storageData.breakdown.other} GB
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.actionsCard, isDarkMode && styles.actionsCardDark]}>
          <Text style={[styles.actionsTitle, isDarkMode && styles.actionsTitleDark]}>
            Acciones rápidas
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
            onPress={handleCleanup}
          >
            <Trash2 size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Limpiar archivos temporales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <Download size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Descargar copia de seguridad
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}>
            <Upload size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, isDarkMode && styles.actionButtonTextDark]}>
              Sincronizar con la nube
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.plansSection, isDarkMode && styles.plansSectionDark]}>
          <Text style={[styles.plansTitle, isDarkMode && styles.plansTitleDark]}>
            Planes de almacenamiento
          </Text>
          
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <View 
                key={plan.id} 
                style={[
                  styles.planCard, 
                  isDarkMode && styles.planCardDark,
                  plan.current && styles.planCardCurrent,
                  plan.current && { borderColor: plan.color }
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                    <IconComponent size={24} color={plan.color} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, isDarkMode && styles.planNameDark]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planPrice, { color: plan.color }]}>
                      {plan.price}
                    </Text>
                  </View>
                  {plan.current && (
                    <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.currentBadgeText}>Actual</Text>
                    </View>
                  )}
                </View>
                
                <Text style={[styles.planStorage, isDarkMode && styles.planStorageDark]}>
                  Almacenamiento: {plan.storage}
                </Text>
                
                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.planFeature}>
                      <Text style={[styles.planFeatureText, isDarkMode && styles.planFeatureTextDark]}>
                        • {feature}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {!plan.current && (
                  <TouchableOpacity 
                    style={[styles.upgradeButton, { backgroundColor: plan.color }]}
                    onPress={handleUpgrade}
                  >
                    <Text style={styles.upgradeButtonText}>
                      {plan.id === 'gratuito' ? 'Cambiar a gratuito' : 'Actualizar'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {usagePercentage > 80 && (
          <View style={[styles.warningBox, isDarkMode && styles.warningBoxDark]}>
            <Text style={[styles.warningText, isDarkMode && styles.warningTextDark]}>
              ⚠️ Te estás quedando sin espacio. Considera actualizar tu plan o limpiar archivos innecesarios.
            </Text>
          </View>
        )}
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
  usageCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  usageCardDark: {
    backgroundColor: '#1E1E1E',
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  usageTitleDark: {
    color: colors.white,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  usageTextDark: {
    color: '#AAA',
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  breakdownTitleDark: {
    color: colors.white,
  },
  breakdownItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: colors.textLight,
  },
  breakdownTextDark: {
    color: '#AAA',
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  actionsCardDark: {
    backgroundColor: '#1E1E1E',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionsTitleDark: {
    color: colors.white,
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
  plansSection: {
    marginBottom: 32,
  },
  plansSectionDark: {
    backgroundColor: 'transparent',
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  plansTitleDark: {
    color: colors.white,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardDark: {
    backgroundColor: '#1E1E1E',
  },
  planCardCurrent: {
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  planNameDark: {
    color: colors.white,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  currentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planStorage: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 12,
  },
  planStorageDark: {
    color: '#AAA',
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeature: {
    marginBottom: 4,
  },
  planFeatureText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  planFeatureTextDark: {
    color: '#AAA',
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningBoxDark: {
    backgroundColor: colors.warning + '30',
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  warningTextDark: {
    color: colors.white,
  },
});