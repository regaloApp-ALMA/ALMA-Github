import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Crown, Zap, Database, Check, Star } from 'lucide-react-native';

export default function PricingScreen() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  const handleSelectPlan = (planName: string) => {
    Alert.alert(
      "Suscripción",
      `Has seleccionado ${planName}. En una app real, aquí se abriría la pasarela de pago de Apple/Google.`,
      [{ text: "Entendido", onPress: () => router.back() }]
    );
  };

  const PlanCard = ({ name, price, features, icon: Icon, color, popular }: any) => (
    <TouchableOpacity
      style={[
        styles.card,
        isDarkMode && styles.cardDark,
        popular && { borderColor: color, borderWidth: 2 }
      ]}
      onPress={() => handleSelectPlan(name)}
    >
      {popular && <View style={[styles.popTag, { backgroundColor: color }]}><Text style={styles.popText}>POPULAR</Text></View>}
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Icon size={32} color={color} />
      </View>
      <Text style={[styles.planName, isDarkMode && styles.textWhite]}>{name}</Text>
      <Text style={[styles.planPrice, { color: color }]}>{price}</Text>
      <View style={styles.featList}>
        {features.map((f: string, i: number) => (
          <View key={i} style={styles.featRow}>
            <Check size={16} color={color} />
            <Text style={[styles.featText, isDarkMode && styles.textLight]}> {f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Suscripciones', headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary }, headerTintColor: '#FFF' }} />
      <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Star size={40} color={colors.warning} fill={colors.warning} />
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Invierte en tus recuerdos</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textLight]}>Planes flexibles para cada etapa de tu vida.</Text>
        </View>

        <PlanCard
          name="Plan Pro"
          price="6,99€ / mes"
          color={colors.primary}
          icon={Zap}
          popular={true}
          features={['100 GB de espacio', 'Sin anuncios', 'IA Ilimitada']}
        />

        <PlanCard
          name="Plan Premium"
          price="14,99€ / mes"
          color={colors.warning}
          icon={Crown}
          features={['1 TB de espacio', 'Soporte Prioritario', 'Legado Digital Avanzado']}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  containerDark: { backgroundColor: '#121212' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 5 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1 },
  cardDark: { backgroundColor: '#1E1E1E' },
  iconBox: { alignSelf: 'center', padding: 15, borderRadius: 50, marginBottom: 15 },
  planName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  planPrice: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  featList: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 },
  featRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featText: { fontSize: 14, color: '#555', marginLeft: 8 },
  popTag: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  popText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  textWhite: { color: '#FFF' },
  textLight: { color: '#CCC' },
});