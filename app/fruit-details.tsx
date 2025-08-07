import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { MapPin, Users, Heart, Share2, Edit2 } from 'lucide-react-native';

export default function FruitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tree } = useTreeStore();
  const router = useRouter();

  const fruit = tree.fruits.find(f => f.id === id);
  const branch = fruit ? tree.branches.find(b => b.id === fruit.branchId) : null;

  if (!fruit || !branch) {
    return (
      <View style={styles.container}>
        <Text>Recuerdo no encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: fruit.title,
          headerStyle: {
            backgroundColor: branch.color,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={styles.container}>
        {fruit.mediaUrls && fruit.mediaUrls.length > 0 && (
          <Image 
            source={{ uri: fruit.mediaUrls[0] }} 
            style={styles.coverImage}
          />
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{fruit.title}</Text>
            <Text style={styles.date}>
              {new Date(fruit.createdAt).toLocaleDateString()}
            </Text>
            
            <View style={styles.branchTag}>
              <View 
                style={[styles.branchDot, { backgroundColor: branch.color }]} 
              />
              <Text style={styles.branchName}>{branch.name}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{fruit.description}</Text>
          
          {fruit.location && (
            <View style={styles.infoItem}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.infoText}>{fruit.location.name}</Text>
            </View>
          )}
          
          {fruit.people && fruit.people.length > 0 && (
            <View style={styles.infoItem}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Con {fruit.people.join(', ')}
              </Text>
            </View>
          )}
          
          {fruit.emotions && fruit.emotions.length > 0 && (
            <View style={styles.infoItem}>
              <Heart size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {fruit.emotions.join(', ')}
              </Text>
            </View>
          )}
          
          {fruit.tags && fruit.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {fruit.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={20} color={colors.primary} />
              <Text style={styles.actionText}>Compartir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Edit2 size={20} color={colors.primary} />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
          </View>
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
  coverImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  branchTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  branchName: {
    fontSize: 14,
    color: colors.textLight,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    color: colors.primary,
    marginLeft: 8,
    fontSize: 16,
  },
});