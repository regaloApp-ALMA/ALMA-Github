import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { Plus, Share2, Lock } from 'lucide-react-native';

export default function BranchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree } = useTreeStore();
  const router = useRouter();

  const branch = tree.branches.find(b => b.id === id);
  const branchFruits = tree.fruits.filter(f => f.branchId === id);

  if (!branch) {
    return (
      <View style={styles.container}>
        <Text>Rama no encontrada</Text>
      </View>
    );
  }

  const handleAddFruit = () => {
    // Show options for AI or Manual memory creation
    router.push('/add-memory-options?branchId=' + id);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: branch.name,
          headerStyle: {
            backgroundColor: branch.color,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: branch.color }]}>
          <View style={styles.headerContent}>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchInfo}>
              {branchFruits.length} recuerdos • Creada el {new Date(branch.createdAt).toLocaleDateString()}
            </Text>
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={20} color={colors.white} />
                <Text style={styles.actionText}>Compartir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Lock size={20} color={colors.white} />
                <Text style={styles.actionText}>
                  {branch.isShared ? 'Compartida' : 'Privada'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          {branchFruits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No hay recuerdos en esta rama</Text>
              <Text style={styles.emptyStateText}>
                Añade tu primer recuerdo para que tu rama empiece a crecer.
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddFruit}>
                <Plus size={20} color={colors.white} />
                <Text style={styles.addButtonText}>Añadir fruto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fruitsContainer}>
              {branchFruits.map(fruit => (
                <TouchableOpacity 
                  key={fruit.id} 
                  style={styles.fruitCard}
                  onPress={() => router.push({
                    pathname: '/fruit-details',
                    params: { id: fruit.id },
                  })}
                >
                  {fruit.mediaUrls && fruit.mediaUrls.length > 0 && (
                    <Image 
                      source={{ uri: fruit.mediaUrls[0] }} 
                      style={styles.fruitImage}
                    />
                  )}
                  
                  <View style={styles.fruitContent}>
                    <Text style={styles.fruitTitle}>{fruit.title}</Text>
                    <Text style={styles.fruitDate}>
                      {new Date(fruit.createdAt).toLocaleDateString()}
                    </Text>
                    <Text 
                      style={styles.fruitDescription}
                      numberOfLines={2}
                    >
                      {fruit.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={[styles.addFruitButton, { backgroundColor: branch.color }]}
                onPress={handleAddFruit}
              >
                <Plus size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  branchName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  branchInfo: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  actionText: {
    color: colors.white,
    marginLeft: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fruitsContainer: {
    position: 'relative',
  },
  fruitCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fruitImage: {
    width: '100%',
    height: 160,
  },
  fruitContent: {
    padding: 16,
  },
  fruitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  fruitDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  fruitDescription: {
    fontSize: 14,
    color: colors.text,
  },
  addFruitButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});