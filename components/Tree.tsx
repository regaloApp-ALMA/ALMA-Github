import React, { useState, useEffect } from 'react';
import { View, Dimensions, TouchableOpacity, Text, Animated, ScrollView } from 'react-native';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { BranchType, FruitType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { styles } from './_Tree.styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TREE_WIDTH = screenWidth;
const TREE_HEIGHT = screenHeight * 0.8;

// Branch colors based on categories - exactly matching the image
const BRANCH_COLORS: Record<string, string> = {
  family: '#FF6B35',    // Orange - Familia
  travel: '#4A90E2',    // Blue - Viajes
  work: '#E91E63',      // Pink - Profesión
  education: '#F39C12', // Yellow/Orange
  friends: '#2ECC71',   // Green - Amistad
  pets: '#17A2B8',      // Teal - Mascotas
  hobbies: '#2ECC71',   // Green - Hobbies
  vida: '#8E44AD'       // Purple for central node - Vida
};

type TreeProps = {
  onBranchPress?: (branch: BranchType) => void;
  onFruitPress?: (fruit: FruitType) => void;
  onRootPress?: (root: RootType) => void;
};

const Tree = ({ onBranchPress, onFruitPress, onRootPress }: TreeProps) => {
  const { tree, newlyAddedBranchId, clearNewlyAddedBranch } = useTreeStore();
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [treeOpacity] = useState(new Animated.Value(0));
  const [branchesOpacity] = useState(new Animated.Value(0));
  const [fruitsOpacity] = useState(new Animated.Value(0));
  const [rootsOpacity] = useState(new Animated.Value(0));
  const [newBranchAnimations] = useState(new Map<string, Animated.Value>());
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    // Animate tree elements sequentially
    Animated.sequence([
      Animated.timing(treeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(branchesOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fruitsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rootsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate newly added branches
  useEffect(() => {
    if (newlyAddedBranchId) {
      const animValue = new Animated.Value(0);
      newBranchAnimations.set(newlyAddedBranchId, animValue);
      
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Clear the animation after it's done
        setTimeout(() => {
          newBranchAnimations.delete(newlyAddedBranchId);
          clearNewlyAddedBranch();
        }, 1000);
      });
    }
  }, [newlyAddedBranchId]);

  const handleBranchPress = (branch: BranchType) => {
    if (onBranchPress) {
      onBranchPress(branch);
    } else {
      router.push({
        pathname: '/branch-details',
        params: { id: branch.id },
      });
    }
  };

  const handleFruitPress = (fruit: FruitType) => {
    if (onFruitPress) {
      onFruitPress(fruit);
    } else {
      router.push({
        pathname: '/fruit-details',
        params: { id: fruit.id },
      });
    }
  };

  const handleRootPress = (root: RootType) => {
    if (onRootPress) {
      onRootPress(root);
    } else {
      router.push({
        pathname: '/root-details',
        params: { id: root.id },
      });
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Tree structure positions based on the exact image layout
  const getTreePositions = () => {
    const centerX = TREE_WIDTH * 0.5;
    const centerY = TREE_HEIGHT * 0.45; // Center position
    
    return {
      // Central trunk position
      trunk: { x: centerX, y: centerY + 80 },
      
      // Central node "Vida" - positioned like in the image
      vida: { x: centerX, y: centerY },
    };
  };

  const positions = getTreePositions();

  // Define specific branch positions exactly as shown in the image
  const getBranchPositions = () => {
    const centerX = positions.vida.x;
    const centerY = positions.vida.y;
    
    return {
      // Exact positions from the image - organized in a clean tree structure
      'family': { x: centerX - 140, y: centerY - 100 },   // Familia (orange) - top left
      'travel': { x: centerX - 140, y: centerY + 100 },   // Viajes (blue) - bottom left  
      'work': { x: centerX + 140, y: centerY - 100 },     // Profesión (pink) - top right
      'friends': { x: centerX + 140, y: centerY + 100 },  // Amistad (green) - bottom right
      'pets': { x: centerX - 80, y: centerY - 150 },     // Mascotas (teal) - top center
      'hobbies': { x: centerX + 80, y: centerY - 150 },  // Hobbies (green) - top center right
      'education': { x: centerX, y: centerY - 180 },     // Educación - top center
    };
  };

  // Render connection line between two points
  const renderConnection = (from: { x: number; y: number }, to: { x: number; y: number }, key: string) => {
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    return (
      <Animated.View
        key={key}
        style={[
          {
            position: 'absolute',
            opacity: branchesOpacity,
            width: distance,
            height: 3,
            left: from.x,
            top: from.y - 1.5,
            backgroundColor: '#8B4513',
            borderRadius: 1.5,
            transform: [
              { rotate: `${angle}rad` },
            ],
          },
        ]}
      />
    );
  };

  // Get actual roots from the tree data
  const actualRoots = tree.roots.slice(0, 3); // Show max 3 roots

  return (
    <ScrollView 
      style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]}
      contentContainerStyle={{ minHeight: screenHeight }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={[styles.zoomButton, isDarkMode && styles.zoomButtonDark]} onPress={zoomIn}>
            <Text style={[styles.zoomButtonText, isDarkMode && styles.zoomButtonTextDark]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.zoomButton, isDarkMode && styles.zoomButtonDark]} onPress={zoomOut}>
            <Text style={[styles.zoomButtonText, isDarkMode && styles.zoomButtonTextDark]}>-</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[{ width: TREE_WIDTH, height: TREE_HEIGHT, position: 'relative' }, { transform: [{ scale }] }]}>
          {/* Title at the top */}
          <View style={[styles.titleContainer, { top: 20 }]}>
            <Text style={[styles.titleText, { color: isDarkMode ? '#fff' : '#333' }]}>Mi Árbol de Vida</Text>
          </View>
          
          {/* Tree trunk - clean and simple */}
          <Animated.View style={[
            {
              position: 'absolute',
              opacity: treeOpacity,
              left: positions.trunk.x - 8,
              top: positions.vida.y + 50,
              width: 16,
              height: 60,
              backgroundColor: '#8B4513',
              borderRadius: 8,
            }
          ]} />
          
          {/* Branch connections - clean lines from center to branches */}
          {tree.branches.map((branch) => {
            const branchPositions = getBranchPositions();
            const position = branchPositions[branch.categoryId as keyof typeof branchPositions];
            if (position) {
              return renderConnection(
                { x: positions.vida.x, y: positions.vida.y },
                { x: position.x, y: position.y },
                `conn_${branch.id}`
              );
            }
            return null;
          })}
          
          {/* Central node "Vida" - clean and centered */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                opacity: treeOpacity,
                left: positions.vida.x - 40,
                top: positions.vida.y - 40,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: BRANCH_COLORS.vida,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
                borderWidth: 4,
                borderColor: '#fff',
              },
            ]}
          >
            <Text style={[{ color: '#fff', fontSize: 18, fontWeight: 'bold' }]}>Vida</Text>
          </Animated.View>
          
          {/* Dynamic branches - positioned cleanly */}
          {tree.branches.map((branch) => {
            const branchPositions = getBranchPositions();
            const position = branchPositions[branch.categoryId as keyof typeof branchPositions];
            
            if (!position) {
              // For new branches, position them in expanding layers around the center
              const existingBranches = tree.branches.filter(b => branchPositions[b.categoryId as keyof typeof branchPositions]);
              const newBranchIndex = tree.branches.indexOf(branch) - existingBranches.length;
              const layer = Math.floor(newBranchIndex / 6) + 1; // Which layer (1, 2, 3...)
              const positionInLayer = newBranchIndex % 6; // Position within that layer
              const branchAngle = (positionInLayer * Math.PI * 2) / 6;
              const branchRadius = 180 + (layer * 60); // Expanding radius for each layer
              const branchX = positions.vida.x + branchRadius * Math.cos(branchAngle);
              const branchY = positions.vida.y + branchRadius * Math.sin(branchAngle);
              
              return (
                <React.Fragment key={branch.id}>
                  {/* Connection line for new branch */}
                  {renderConnection(
                    { x: positions.vida.x, y: positions.vida.y },
                    { x: branchX, y: branchY },
                    `conn_new_${branch.id}`
                  )}
                  
                  {/* New branch node */}
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        opacity: branchesOpacity,
                        left: branchX - 32.5,
                        top: branchY - 32.5,
                        transform: [
                          {
                            scale: newBranchAnimations.get(branch.id) || 1,
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        {
                          width: 65,
                          height: 65,
                          borderRadius: 32.5,
                          backgroundColor: branch.color,
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 8,
                          borderWidth: 3,
                          borderColor: '#fff',
                        },
                      ]}
                      onPress={() => handleBranchPress(branch)}
                    >
                      <Text style={[{ color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }]}>
                        {branch.name.length > 7 ? branch.name.substring(0, 7) + '...' : branch.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {/* Small fruits around this branch */}
                  {tree.fruits
                    .filter(fruit => fruit.branchId === branch.id)
                    .map((fruit, fruitIndex) => {
                      const fruitCount = tree.fruits.filter(f => f.branchId === branch.id).length;
                      const fruitAngle = ((fruitIndex * Math.PI * 2) / Math.max(fruitCount, 4));
                      const fruitRadius = 45;
                      const fruitX = branchX + fruitRadius * Math.cos(fruitAngle);
                      const fruitY = branchY + fruitRadius * Math.sin(fruitAngle);
                      
                      return (
                        <Animated.View
                          key={fruit.id}
                          style={[
                            {
                              position: 'absolute',
                              opacity: fruitsOpacity,
                              left: fruitX - 12,
                              top: fruitY - 12,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              {
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: branch.color,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3,
                                elevation: 4,
                                borderWidth: 2,
                                borderColor: '#fff',
                              },
                            ]}
                            onPress={() => handleFruitPress(fruit)}
                          />
                        </Animated.View>
                      );
                    })
                  }
                </React.Fragment>
              );
            }
            
            const branchX = position.x;
            const branchY = position.y;
            
            return (
              <React.Fragment key={branch.id}>
                {/* Branch node */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      opacity: branchesOpacity,
                      left: branchX - 32.5,
                      top: branchY - 32.5,
                      transform: [
                        {
                          scale: newBranchAnimations.get(branch.id) || 1,
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      {
                        width: 65,
                        height: 65,
                        borderRadius: 32.5,
                        backgroundColor: BRANCH_COLORS[branch.categoryId as keyof typeof BRANCH_COLORS] || branch.color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 8,
                        borderWidth: 3,
                        borderColor: '#fff',
                      },
                    ]}
                    onPress={() => handleBranchPress(branch)}
                  >
                    <Text style={[{ color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }]}>
                      {branch.name.length > 7 ? branch.name.substring(0, 7) + '...' : branch.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                
                {/* Small fruits around this branch */}
                {tree.fruits
                  .filter(fruit => fruit.branchId === branch.id)
                  .map((fruit, fruitIndex) => {
                    const fruitCount = tree.fruits.filter(f => f.branchId === branch.id).length;
                    const fruitAngle = ((fruitIndex * Math.PI * 2) / Math.max(fruitCount, 4));
                    const fruitRadius = 45;
                    const fruitX = branchX + fruitRadius * Math.cos(fruitAngle);
                    const fruitY = branchY + fruitRadius * Math.sin(fruitAngle);
                    
                    return (
                      <Animated.View
                        key={fruit.id}
                        style={[
                          {
                            position: 'absolute',
                            opacity: fruitsOpacity,
                            left: fruitX - 12,
                            top: fruitY - 12,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            {
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: BRANCH_COLORS[branch.categoryId as keyof typeof BRANCH_COLORS] || branch.color,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 3,
                              elevation: 4,
                              borderWidth: 2,
                              borderColor: '#fff',
                            },
                          ]}
                          onPress={() => handleFruitPress(fruit)}
                        />
                      </Animated.View>
                    );
                  })
                }
              </React.Fragment>
            );
          })}
          
          {/* Roots - simple and clean */}
          <Animated.View style={[{ opacity: rootsOpacity }]}>
            {actualRoots.map((root, index) => {
              const totalRoots = actualRoots.length;
              const rootAngle = ((index - (totalRoots - 1) / 2) * Math.PI / 6);
              const rootDistance = 60;
              const rootX = positions.trunk.x + rootDistance * Math.sin(rootAngle);
              const rootY = positions.trunk.y + 80;
              
              return (
                <React.Fragment key={root.id}>
                  {/* Root line */}
                  <View
                    style={[
                      {
                        position: 'absolute',
                        left: positions.trunk.x,
                        top: positions.trunk.y + 60,
                        width: Math.sqrt(Math.pow(rootX - positions.trunk.x, 2) + Math.pow(rootY - positions.trunk.y - 60, 2)),
                        height: 3,
                        backgroundColor: '#8B4513',
                        borderRadius: 1.5,
                        transform: [
                          {
                            rotate: `${Math.atan2(rootY - positions.trunk.y - 60, rootX - positions.trunk.x)}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                  
                  {/* Root node */}
                  <TouchableOpacity
                    style={[
                      {
                        position: 'absolute',
                        left: rootX - 15,
                        top: rootY - 15,
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: colors.family,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 3,
                      },
                    ]}
                    onPress={() => handleRootPress(root)}
                  >
                    <Text style={[{ color: '#fff', fontSize: 10, fontWeight: 'bold' }]}>
                      {root.name.charAt(0)}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
};

// Styles are imported from _Tree.styles.ts

export default Tree;