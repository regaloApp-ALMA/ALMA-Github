import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const BRANCH_COLORS: Record<string, string> = {
  family: '#FF6B35',
  travel: '#4A90E2',
  work: '#E91E63',
  education: '#9B59B6',
  friends: '#2ECC71',
  pets: '#00B8D9',
  hobbies: '#27AE60',
  vida: '#8E44AD',
};

type TreeProps = {
  onBranchPress?: (branch: BranchType) => void;
  onFruitPress?: (fruit: FruitType) => void;
  onRootPress?: (root: RootType) => void;
};

const Tree = ({ onBranchPress, onFruitPress, onRootPress }: TreeProps) => {
  const { tree, newlyAddedBranchId, clearNewlyAddedBranch } = useTreeStore();
  const router = useRouter();
  const [scale, setScale] = useState<number>(1);
  const [treeOpacity] = useState<Animated.Value>(new Animated.Value(0));
  const [branchesOpacity] = useState<Animated.Value>(new Animated.Value(0));
  const [fruitsOpacity] = useState<Animated.Value>(new Animated.Value(0));
  const [rootsOpacity] = useState<Animated.Value>(new Animated.Value(0));
  const [newBranchAnimations] = useState<Map<string, Animated.Value>>(new Map<string, Animated.Value>());
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    Animated.sequence([
      Animated.timing(treeOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(branchesOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(fruitsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(rootsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (newlyAddedBranchId) {
      const animValue = new Animated.Value(0);
      newBranchAnimations.set(newlyAddedBranchId, animValue);
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
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
      router.push({ pathname: '/branch-details', params: { id: branch.id } });
    }
  };

  const handleFruitPress = (fruit: FruitType) => {
    if (onFruitPress) {
      onFruitPress(fruit);
    } else {
      router.push({ pathname: '/fruit-details', params: { id: fruit.id } });
    }
  };

  const handleRootPress = (root: RootType) => {
    if (onRootPress) {
      onRootPress(root);
    } else {
      router.push({ pathname: '/root-details', params: { id: root.id } });
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const positions = useMemo(() => {
    const centerX = TREE_WIDTH * 0.5;
    const centerY = TREE_HEIGHT * 0.45;
    return {
      trunk: { x: centerX, y: centerY + 80 },
      vida: { x: centerX, y: centerY },
    };
  }, []);

  const getBranchPositions = useCallback(() => {
    const centerX = positions.vida.x;
    const centerY = positions.vida.y;
    return {
      travel: { x: centerX - 110, y: centerY + 40 },
      family: { x: centerX - 200, y: centerY + 10 },
      pets: { x: centerX - 40, y: centerY - 90 },
      work: { x: centerX + 40, y: centerY - 90 },
      friends: { x: centerX + 120, y: centerY + 20 },
      hobbies: { x: centerX + 210, y: centerY - 10 },
      education: { x: centerX, y: centerY - 140 },
    } as Record<string, { x: number; y: number }>;
  }, [positions.vida.x, positions.vida.y]);

  const renderConnection = useCallback(
    (
      from: { x: number; y: number },
      to: { x: number; y: number },
      key: string,
      color: string = '#6B4F2A'
    ) => {
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
              backgroundColor: color,
              borderRadius: 2,
              transform: [{ rotate: `${angle}rad` }],
            },
          ]}
        />
      );
    },
    [branchesOpacity]
  );

  const actualRoots = useMemo(() => tree.roots.slice(0, 5), [tree.roots]);

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]}
      contentContainerStyle={{ minHeight: screenHeight, alignItems: 'center', paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]} testID="tree-screen">
        <View style={styles.zoomControls} testID="zoom-controls">
          <TouchableOpacity
            style={[styles.zoomButton, isDarkMode && styles.zoomButtonDark]}
            onPress={zoomIn}
            accessibilityRole="button"
            accessibilityLabel="Acercar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="zoom-in"
          >
            <Text style={[styles.zoomButtonText, isDarkMode && styles.zoomButtonTextDark]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomButton, isDarkMode && styles.zoomButtonDark]}
            onPress={zoomOut}
            accessibilityRole="button"
            accessibilityLabel="Alejar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="zoom-out"
          >
            <Text style={[styles.zoomButtonText, isDarkMode && styles.zoomButtonTextDark]}>-</Text>
          </TouchableOpacity>
        </View>

        <View style={[{ width: TREE_WIDTH, height: TREE_HEIGHT, position: 'relative' }, { transform: [{ scale }] }]} testID="tree-canvas">
          <View style={[styles.titleContainer, { top: 20 }]} testID="tree-title">
            <Text style={[styles.titleText, { color: isDarkMode ? '#fff' : '#333' }]}>Mi Árbol de Vida</Text>
          </View>

          <Animated.View
            testID="tree-trunk"
            style={[
              {
                position: 'absolute',
                opacity: treeOpacity,
                left: positions.trunk.x - 8,
                top: positions.vida.y + 50,
                width: 16,
                height: 60,
                backgroundColor: '#8B4513',
                borderRadius: 8,
              },
            ]}
          />

          {tree.branches.map((branch) => {
            const branchPositions = getBranchPositions();
            const position = branchPositions[branch.categoryId];
            if (position) {
              const angle = Math.atan2(position.y - positions.vida.y, position.x - positions.vida.x);
              const offset = 44;
              const from = {
                x: positions.vida.x + Math.cos(angle) * offset,
                y: positions.vida.y + Math.sin(angle) * offset,
              };
              const lineColor = BRANCH_COLORS[branch.categoryId] ?? branch.color ?? '#6B4F2A';
              return renderConnection(
                from,
                { x: position.x, y: position.y },
                `conn_${branch.id}`,
                lineColor
              );
            }
            return null;
          })

          }

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

          {tree.branches.map((branch) => {
            const branchPositions = getBranchPositions();
            const position = branchPositions[branch.categoryId];

            if (!position) {
              const existingBranches = tree.branches.filter((b) => branchPositions[b.categoryId]);
              const newBranchIndex = tree.branches.indexOf(branch) - existingBranches.length;
              const layer = Math.floor(newBranchIndex / 6) + 1;
              const positionInLayer = newBranchIndex % 6;
              const branchAngle = (positionInLayer * Math.PI * 2) / 6;
              const branchRadius = 180 + layer * 60;
              const branchX = positions.vida.x + branchRadius * Math.cos(branchAngle);
              const branchY = positions.vida.y + branchRadius * Math.sin(branchAngle);

              return (
                <React.Fragment key={branch.id}>
                  {renderConnection(
                    { x: positions.vida.x, y: positions.vida.y },
                    { x: branchX, y: branchY },
                    `conn_new_${branch.id}`
                  )}

                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        opacity: branchesOpacity,
                        left: branchX - 32.5,
                        top: branchY - 32.5,
                        transform: [
                          {
                            scale: (newBranchAnimations.get(branch.id) ?? new Animated.Value(1)),
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
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir rama ${branch.name}`}
                      testID={`branch-${branch.id}`}
                    >
                      <Text style={[{ color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }]}>
                        {branch.name.length > 7 ? branch.name.substring(0, 7) + '...' : branch.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {tree.fruits
                    .filter((fruit) => fruit.branchId === branch.id)
                    .map((fruit, fruitIndex) => {
                      const fruitCount = tree.fruits.filter((f) => f.branchId === branch.id).length;
                      const fruitAngle = (fruitIndex * Math.PI * 2) / Math.max(fruitCount, 4);
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
                          testID={`fruit-${fruit.id}`}
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
                            accessibilityRole="button"
                            accessibilityLabel={`Abrir recuerdo ${fruit.title}`}
                            testID={`fruit-${fruit.id}-button`}
                          />
                        </Animated.View>
                      );
                    })}
                </React.Fragment>
              );
            }

            const branchX = position.x;
            const branchY = position.y;

            return (
              <React.Fragment key={branch.id}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      opacity: branchesOpacity,
                      left: branchX - 32.5,
                      top: branchY - 32.5,
                      transform: [
                        {
                          scale: (newBranchAnimations.get(branch.id) ?? new Animated.Value(1)),
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
                        backgroundColor: BRANCH_COLORS[branch.categoryId] ?? branch.color,
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
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir rama ${branch.name}`}
                    testID={`branch-${branch.id}`}
                  >
                    <Text style={[{ color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }]}>
                      {branch.name.length > 7 ? branch.name.substring(0, 7) + '...' : branch.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {tree.fruits
                  .filter((fruit) => fruit.branchId === branch.id)
                  .map((fruit, fruitIndex) => {
                    const fruitCount = tree.fruits.filter((f) => f.branchId === branch.id).length;
                    const fruitAngle = (fruitIndex * Math.PI * 2) / Math.max(fruitCount, 4);
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
                        testID={`fruit-${fruit.id}`}
                      >
                        <TouchableOpacity
                          style={[
                            {
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: BRANCH_COLORS[branch.categoryId] ?? branch.color,
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
                          accessibilityRole="button"
                          accessibilityLabel={`Abrir recuerdo ${fruit.title}`}
                          testID={`fruit-${fruit.id}-button`}
                        />
                      </Animated.View>
                    );
                  })}
              </React.Fragment>
            );
          })}

          <Animated.View style={[{ opacity: rootsOpacity }]}>
            
            {actualRoots.map((root, index) => {
              const total = actualRoots.length;
              const baseY = positions.trunk.y + 60;
              const spread = Math.PI / 3;
              const angle = -Math.PI / 2 + ((index - (total - 1) / 2) * spread) / Math.max(total - 1, 1);
              const length = 110;
              const endX = positions.trunk.x + Math.cos(angle) * length;
              const endY = baseY + Math.sin(angle) * length;

              return (
                <React.Fragment key={root.id}>
                  <View
                    style={[
                      {
                        position: 'absolute',
                        left: positions.trunk.x,
                        top: baseY,
                        width: Math.sqrt(Math.pow(endX - positions.trunk.x, 2) + Math.pow(endY - baseY, 2)),
                        height: 3,
                        backgroundColor: '#8B4513',
                        borderRadius: 2,
                        transform: [
                          { rotate: `${Math.atan2(endY - baseY, endX - positions.trunk.x)}rad` },
                        ],
                      },
                    ]}
                    testID={`root-connector-${root.id}`}
                  />

                  <TouchableOpacity
                    style={[
                      {
                        position: 'absolute',
                        left: endX - 15,
                        top: endY - 15,
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
                    accessibilityRole="button"
                    accessibilityLabel={`Ver raíz ${root.name}`}
                    testID={`root-${root.id}`}
                  >
                    <Text style={[{ color: '#fff', fontSize: 10, fontWeight: 'bold' }]}>{root.name.charAt(0)}</Text>
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

export default Tree;
