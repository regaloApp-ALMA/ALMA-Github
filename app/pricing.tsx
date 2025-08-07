import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Crown, Zap, Database, Check, Star } from 'lucide-react-native';

export default function PricingScreen() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'gratuito',
      name: 'PLAN GRATUITO',
      subtitle: 'EMPIEZA A ORGANIZAR TU VIDA Y CREA LA BASE DE TU ÁRBOL',
      price: 'Gratis',
      icon: Database,
      color: colors.gray,
      features: [
        'ANUNCIOS',
        'ALMACENAMIENTO HASTA 10 GB',
        'GENERACIÓN IA LIMITADA'
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'PLAN PRO',
      subtitle: 'HAZ CRECER TU ÁRBOL, AÑADE HISTORIA, EMOCIONES Y LEGADO',
      price: '€6,99 - €14,99 / MES',
      icon: Zap,
      color: colors.primary,
      features: [
        'TODO LO INCLUIDO DEL PLAN GRATUITO',
        'SIN ANUNCIOS',
        'ALMACENAMIENTO AMPLIADO HASTA 100 GB',
        'GENERACIÓN IA MODERADA'
      ],
      description: 'IDEAL PARA CONSTRUIR Y COMPARTIR EN FAMILIA',
      popular: true,
    },
    {
      id: 'premium',
      name: 'PLAN PREMIUM',
      subtitle: 'PRESERVA LA HISTORIA COMPLETA DE TU FAMILIA CON TODO EL PODER DE ALMA',
      price: '€14,99 - €24,99 / MES',
      icon: Crown,
      color: colors.warning,
      features: [
        'TODO LO INCLUIDO DEL PLAN PRO',
        'ALMACENAMIENTO AMPLIADO HASTA 1 TB',
        'GENERACIÓN IA AMPLIADA',
        'AVATARES PERSONALIZADOS'
      ],
      description: 'PERFECTO PARA CONSERVAR TODOS TUS RECUERDOS DE MANERA SENCILLA Y AUTOMÁTICA',
      popular: false,
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    if (planId === 'gratuito') {
      Alert.alert(
        'Plan Gratuito',
        'Ya tienes acceso al plan gratuito. ¡Empieza a crear tu árbol de vida!',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Suscripción',
      `¿Quieres suscribirte al ${plans.find(p => p.id === planId)?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Suscribirse', 
          onPress: () => {
            Alert.alert('¡Bienvenido!', 'Tu suscripción ha sido activada correctamente.');
            router.back();
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Planes y Precios',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Star size={32} color={colors.warning} />
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Elige tu plan perfecto
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Desbloquea todo el potencial de tu árbol de vida
          </Text>
        </View>

        {plans.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <View 
              key={plan.id} 
              style={[
                styles.planCard, 
                isDarkMode && styles.planCardDark,
                plan.popular && styles.planCardPopular,
                plan.popular && { borderColor: plan.color }
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                  <IconComponent size={32} color={plan.color} />
                </View>
                <View style={styles.planTitleContainer}>
                  <Text style={[styles.planName, isDarkMode && styles.planNameDark]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planPrice, { color: plan.color }]}>
                    {plan.price}
                  </Text>
                </View>
              </View>

              <Text style={[styles.planSubtitle, isDarkMode && styles.planSubtitleDark]}>
                {plan.subtitle}
              </Text>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.planFeature}>
                    <Check size={16} color={plan.color} />
                    <Text style={[styles.planFeatureText, isDarkMode && styles.planFeatureTextDark]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {plan.description && (
                <Text style={[styles.planDescription, isDarkMode && styles.planDescriptionDark]}>
                  {plan.description}
                </Text>
              )}

              <TouchableOpacity 
                style={[
                  styles.selectButton, 
                  { backgroundColor: plan.color },
                  selectedPlan === plan.id && styles.selectedButton
                ]}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <Text style={styles.selectButtonText}>
                  {plan.id === 'gratuito' ? 'PLAN ACTUAL' : 'SELECCIONAR PLAN'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={[styles.infoSection, isDarkMode && styles.infoSectionDark]}>
          <Text style={[styles.infoTitle, isDarkMode && styles.infoTitleDark]}>
            ¿Por qué elegir un plan premium?
          </Text>
          
          <View style={styles.infoItems}>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🚀</Text>
              <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                Más espacio para guardar todos tus recuerdos sin límites
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🤖</Text>
              <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                IA avanzada que te ayuda a crear recuerdos más ricos y detallados
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                Funciones familiares para compartir y colaborar en tiempo real
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🎨</Text>
              <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                Personalización completa con avatares y temas únicos
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.guaranteeBox, isDarkMode && styles.guaranteeBoxDark]}>
          <Text style={[styles.guaranteeText, isDarkMode && styles.guaranteeTextDark]}>
            💝 Garantía de satisfacción de 30 días. Si no estás completamente satisfecho, 
            te devolvemos tu dinero sin preguntas.
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
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardDark: {
    backgroundColor: '#1E1E1E',
  },
  planCardPopular: {
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    right: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  planIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
  },
  planNameDark: {
    color: colors.white,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '500',
  },
  planSubtitleDark: {
    color: '#AAA',
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planFeatureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  planFeatureTextDark: {
    color: colors.white,
  },
  planDescription: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  planDescriptionDark: {
    color: '#AAA',
  },
  selectButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedButton: {
    opacity: 0.8,
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoSectionDark: {
    backgroundColor: '#1E1E1E',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoTitleDark: {
    color: colors.white,
  },
  infoItems: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    flex: 1,
  },
  infoTextDark: {
    color: '#AAA',
  },
  guaranteeBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  guaranteeBoxDark: {
    backgroundColor: colors.primary + '20',
  },
  guaranteeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  guaranteeTextDark: {
    color: colors.white,
  },
});