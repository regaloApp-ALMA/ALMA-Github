import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { Trees, MessageSquare, Share2 } from 'lucide-react-native';

export default function RootDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree } = useTreeStore();
  const router = useRouter();

  const root = tree.roots.find(r => r.id === id);

  if (!root) {
    return (
      <View style={styles.container}>
        <Text>Raíz no encontrada</Text>
      </View>
    );
  }

  // Datos de ejemplo para los árboles compartidos
  const sharedTrees = [
    {
      id: 'tree1',
      name: 'Viajes familiares',
      description: 'Recuerdos de viajes en familia desde 1990',
      branchCount: 5,
      fruitCount: 32,
    },
    {
      id: 'tree2',
      name: 'Recetas de familia',
      description: 'Recetas tradicionales transmitidas por generaciones',
      branchCount: 3,
      fruitCount: 18,
    },
  ];

  const handleViewTree = (treeId: string) => {
    router.push({
      pathname: '/shared-tree',
      params: { id: treeId, rootId: id },
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: root.name,
          headerStyle: {
            backgroundColor: colors.family,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{root.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{root.name}</Text>
          <Text style={styles.relation}>{root.relation}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <MessageSquare size={20} color={colors.white} />
              <Text style={styles.actionText}>Mensaje</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={20} color={colors.white} />
              <Text style={styles.actionText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Árboles compartidos contigo</Text>
          
          {sharedTrees.map(sharedTree => (
            <TouchableOpacity
              key={sharedTree.id}
              style={styles.treeCard}
              onPress={() => handleViewTree(sharedTree.id)}
            >
              <View style={styles.treeIconContainer}>
                <Trees size={24} color={colors.primary} />
              </View>
              
              <View style={styles.treeInfo}>
                <Text style={styles.treeName}>{sharedTree.name}</Text>
                <Text style={styles.treeDescription}>{sharedTree.description}</Text>
                <Text style={styles.treeStats}>
                  {sharedTree.branchCount} ramas • {sharedTree.fruitCount} recuerdos
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Sobre las raíces</Text>
          <Text style={styles.infoText}>
            Las raíces representan tus conexiones familiares. Cada familiar que comparte su árbol contigo aparece como una raíz en tu árbol de vida, permitiéndote explorar y preservar la historia familiar compartida.
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
  },
  header: {
    backgroundColor: colors.family,
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.family,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  relation: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  actionText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  treeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  treeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  treeDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  treeStats: {
    fontSize: 12,
    color: colors.primary,
  },
  infoSection: {
    backgroundColor: colors.primaryLight,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});