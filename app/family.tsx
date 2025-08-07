import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { MessageSquare, Trees, Plus } from 'lucide-react-native';

// Datos de ejemplo para la familia
const familyMembers = [
  {
    id: 'member1',
    name: 'Mamá',
    relation: 'Madre',
    initial: 'M',
    sharedTrees: ['Viajes familiares', 'Recetas de familia'],
  },
  {
    id: 'member2',
    name: 'Papá',
    relation: 'Padre',
    initial: 'P',
    sharedTrees: ['Viajes familiares', 'Recetas de familia'],
  },
  {
    id: 'member3',
    name: 'Laura',
    relation: 'Hermana',
    initial: 'L',
    sharedTrees: ['Viajes familiares', 'Recetas de familia'],
  },
  {
    id: 'member4',
    name: 'Abuela Carmen',
    relation: 'Abuela materna',
    initial: 'C',
    sharedTrees: ['Viajes familiares', 'Recetas de familia'],
  },
];

export default function FamilyScreen() {
  const router = useRouter();

  const handleMemberPress = (memberId: string) => {
    router.push({
      pathname: '/family-member',
      params: { id: memberId },
    });
  };

  const handleConnectMore = () => {
    // Navegar a la pantalla para conectar con más familiares
    router.push('/connect-family');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Familia',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Raíces de tu árbol</Text>
          <Text style={styles.subtitle}>
            Aquí puedes ver los árboles compartidos por tus familiares. Cada familiar que te comparte su árbol aparece como una raíz en tu árbol.
          </Text>
        </View>
        
        {familyMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() => handleMemberPress(member.id)}
          >
            <View style={styles.memberInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.initial}</Text>
              </View>
              
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRelation}>{member.relation}</Text>
                <Text style={styles.sharedTrees}>
                  Árboles compartidos: {member.sharedTrees.join(', ')}
                </Text>
              </View>
            </View>
            
            <View style={styles.memberActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MessageSquare size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Trees size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.connectButton} onPress={handleConnectMore}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.connectButtonText}>Conectar con más familiares</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  sharedTrees: {
    fontSize: 14,
    color: colors.text,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 30,
    marginTop: 10,
  },
  connectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});