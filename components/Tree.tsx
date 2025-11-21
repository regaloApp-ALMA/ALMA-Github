import React, { useEffect, useMemo, useRef } from 'react';
import { View, Dimensions, TouchableOpacity, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { BranchType, FruitType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SCREEN_WIDTH = screenWidth;
const BASE_CANVAS_HEIGHT = screenHeight * 1.1;
const BRANCHES_PER_LEVEL = 2;
const LEVEL_SPACING = 150;
const BRANCH_BUTTON_SIZE = 96;
const BRANCH_RADIUS = BRANCH_BUTTON_SIZE / 2;
const FRUIT_SIZE = 28;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const INITIAL_ZOOM = 1;
const TRUNK_WIDTH = 28;
const TRUNK_COLOR = '#8C5A2F';

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

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type TreeProps = {
  onBranchPress?: (branch: BranchType) => void;
  onFruitPress?: (fruit: FruitType) => void;
  onRootPress?: (root: RootType) => void;
};

type ArrangedBranch = {
  branch: BranchType;
  anchorX: number;
  anchorY: number;
  centerX: number;
  centerY: number;
  side: number;
};

type FruitLayout = {
  fruit: FruitType;
  x: number;
  y: number;
};

type TreeLayout = {
  arranged: ArrangedBranch[];
  trunkBottom: number;
  trunkTop: number;
  trunkHeight: number;
  canvasHeight: number;
  canvasWidth: number;
};

const Tree = ({ onBranchPress, onFruitPress, onRootPress }: TreeProps) => {
  const { tree } = useTreeStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const scale = useRef(new Animated.Value(INITIAL_ZOOM)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScaleRef = useRef(INITIAL_ZOOM);
  const currentTranslateRef = useRef({ x: 0, y: 0 });
  const lastScale = useRef(INITIAL_ZOOM);
  const lastTranslate = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(1);
  const isPinchingRef = useRef(false);
  const panBoundsRef = useRef({ x: 0, y: 0 });

  const sortedBranches = useMemo(() => {
    const ordered = [...tree.branches].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return aDate - bDate;
    });
    if (__DEV__) {
      console.log('[Tree] Branch ordering', ordered.map((item) => item.id));
    }
    return ordered;
  }, [tree.branches]);

  const layout = useMemo<TreeLayout>(() => {
    const totalBranches = sortedBranches.length;
    const levels = Math.max(1, Math.ceil(totalBranches / BRANCHES_PER_LEVEL));
    const trunkBottom = BASE_CANVAS_HEIGHT * 0.78;
    const baseTrunkHeight = Math.max(LEVEL_SPACING * (levels + 0.6), BASE_CANVAS_HEIGHT * 0.45);
    const anchorBaseOffset = 48;
    const spreadBase = SCREEN_WIDTH * 0.26;
    const spreadStep = 36;

    const provisional = sortedBranches.map((branch, index) => {
      const level = Math.floor(index / BRANCHES_PER_LEVEL);
      const side = index % BRANCHES_PER_LEVEL === 0 ? -1 : 1;
      const anchorY = trunkBottom - LEVEL_SPACING * (level + 0.6);
      const centerY = anchorY - anchorBaseOffset;
      const horizontalOffset = spreadBase + level * spreadStep;
      return {
        branch,
        side,
        anchorY,
        centerY,
        offsetX: side * horizontalOffset,
      };
    });

    const maxOffset = provisional.length > 0 ? Math.max(...provisional.map((item) => Math.abs(item.offsetX))) : SCREEN_WIDTH * 0.12;
    const canvasWidth = Math.max(SCREEN_WIDTH, maxOffset * 2 + BRANCH_BUTTON_SIZE + SCREEN_WIDTH * 0.4);
    const centerX = canvasWidth / 2;

    const arranged: ArrangedBranch[] = provisional.map((item) => ({
      branch: item.branch,
      side: item.side,
      anchorX: centerX,
      anchorY: item.anchorY,
      centerX: centerX + item.offsetX,
      centerY: item.centerY,
    }));

    const highestAnchor = arranged.length > 0 ? Math.min(...arranged.map((item) => item.anchorY)) : trunkBottom - baseTrunkHeight + 80;
    const dynamicTrunkHeight = Math.max(baseTrunkHeight, trunkBottom - highestAnchor + 160);
    const trunkTop = trunkBottom - dynamicTrunkHeight;
    const canvasHeight = Math.max(BASE_CANVAS_HEIGHT, dynamicTrunkHeight + screenHeight * 0.4);

    if (__DEV__) {
      console.log('[Tree] Layout metrics', {
        totalBranches,
        levels,
        trunkTop,
        trunkBottom,
        canvasHeight,
        canvasWidth,
      });
    }

    return {
      arranged,
      trunkBottom,
      trunkTop,
      trunkHeight: dynamicTrunkHeight,
      canvasHeight,
      canvasWidth,
    };
  }, [sortedBranches]);

  const horizontalLimit = useMemo(() => Math.max(0, (layout.canvasWidth - SCREEN_WIDTH) / 2 + SCREEN_WIDTH * 0.2), [layout.canvasWidth]);
  const verticalLimit = useMemo(() => Math.max(0, (layout.canvasHeight - screenHeight) / 2 + screenHeight * 0.15), [layout.canvasHeight]);

  useEffect(() => {
    panBoundsRef.current = { x: horizontalLimit, y: verticalLimit };
    const clampedX = clampValue(currentTranslateRef.current.x, -horizontalLimit, horizontalLimit);
    const clampedY = clampValue(currentTranslateRef.current.y, -verticalLimit, verticalLimit);
    currentTranslateRef.current = { x: clampedX, y: clampedY };
    lastTranslate.current = { x: clampedX, y: clampedY };
    translateX.setValue(clampedX);
    translateY.setValue(clampedY);
  }, [horizontalLimit, verticalLimit, translateX, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          initialDistance.current = Math.sqrt(dx * dx + dy * dy) || 1;
          isPinchingRef.current = true;
        } else {
          isPinchingRef.current = false;
        }
        lastScale.current = currentScaleRef.current;
        lastTranslate.current = { ...currentTranslateRef.current };
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          if (!isPinchingRef.current) {
            initialDistance.current = distance;
            isPinchingRef.current = true;
          }
          const pinchRatio = distance / initialDistance.current;
          const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastScale.current * pinchRatio));
          currentScaleRef.current = newScale;
          scale.setValue(newScale);
        } else if (evt.nativeEvent.touches.length === 1) {
          isPinchingRef.current = false;
          const newX = lastTranslate.current.x + gestureState.dx;
          const newY = lastTranslate.current.y + gestureState.dy;
          const bounds = panBoundsRef.current;
          const clampedX = clampValue(newX, -bounds.x, bounds.x);
          const clampedY = clampValue(newY, -bounds.y, bounds.y);
          currentTranslateRef.current = { x: clampedX, y: clampedY };
          translateX.setValue(clampedX);
          translateY.setValue(clampedY);
        }
      },
      onPanResponderRelease: () => {
        isPinchingRef.current = false;
        lastScale.current = currentScaleRef.current;
        lastTranslate.current = { ...currentTranslateRef.current };
      },
    })
  ).current;

  const handleBranchPress = (branch: BranchType) => {
    if (onBranchPress) {
      onBranchPress(branch);
      return;
    }
    router.push({ pathname: '/branch-details', params: { id: branch.id } });
  };

  const handleFruitPress = (fruit: FruitType) => {
    if (onFruitPress) {
      onFruitPress(fruit);
      return;
    }
    router.push({ pathname: '/fruit-details', params: { id: fruit.id } });
  };

  const handleRootPress = (root: RootType) => {
    if (onRootPress) {
      onRootPress(root);
      return;
    }
    router.push({ pathname: '/root-details', params: { id: root.id } });
  };

  const fruitLayouts = useMemo(() => {
    const mapping: Record<string, FruitLayout[]> = {};
    layout.arranged.forEach((item) => {
      const fruitList = tree.fruits.filter((fruit) => fruit.branchId === item.branch.id);
      if (fruitList.length === 0) {
        mapping[item.branch.id] = [];
        return;
      }
      const perRow = 3;
      const rowGap = 26;
      const columnGap = 28;
      const cluster: FruitLayout[] = fruitList.map((fruit, index) => {
        const row = Math.floor(index / perRow);
        const column = index % perRow;
        const columnOffset = column - (perRow - 1) / 2;
        const x = item.centerX + columnOffset * columnGap;
        const y = item.centerY - BRANCH_RADIUS - 12 - row * rowGap;
        return {
          fruit,
          x,
          y,
        };
      });
      mapping[item.branch.id] = cluster;
    });
    if (__DEV__) {
      console.log('[Tree] Fruit layout computed', Object.keys(mapping));
    }
    return mapping;
  }, [layout.arranged, tree.fruits]);

  const rootsToDisplay = useMemo(() => tree.roots.slice(0, 6), [tree.roots]);

  const backgroundColor = isDarkMode ? '#0C1117' : '#F5F1E6';
  const canopyColor = isDarkMode ? 'rgba(46, 125, 50, 0.25)' : 'rgba(129, 199, 132, 0.35)';
  const trunkShadowColor = isDarkMode ? '#000' : '#2B170A';
  const canopyScale = 1 + Math.min(sortedBranches.length / 10, 0.8);

  return (
    <View style={[styles.container, { backgroundColor }]} testID="tree-container">
      <View
        style={[
          styles.backgroundCanopy,
          {
            height: BASE_CANVAS_HEIGHT * 0.35 * canopyScale,
            width: layout.canvasWidth,
          },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.canopyGlow,
            {
              backgroundColor: canopyColor,
              width: layout.canvasWidth * 0.72 * canopyScale,
              height: BASE_CANVAS_HEIGHT * 0.32 * canopyScale,
              borderRadius: layout.canvasWidth * 0.36 * canopyScale,
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.canvas,
          {
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}
        testID="tree-canvas"
      >
        <Text style={[styles.title, { color: isDarkMode ? '#E8EFEB' : '#1F2A24' }]} testID="tree-title">
          Mi Árbol de Vida
        </Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#9FB4AA' : '#5E6F65' }]}>Cada rama suma a tu legado</Text>
        <View
          style={[
            styles.trunk,
            {
              left: layout.canvasWidth * 0.5 - TRUNK_WIDTH / 2,
              top: layout.trunkTop,
              height: layout.trunkHeight,
              backgroundColor: TRUNK_COLOR,
              shadowColor: trunkShadowColor,
            },
          ]}
          testID="tree-trunk"
          pointerEvents="none"
        />
        <Svg width={layout.canvasWidth} height={layout.canvasHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
          {layout.arranged.map((item) => {
            const controlX = item.anchorX + item.side * Math.abs(item.centerX - item.anchorX) * 0.55;
            const controlY = item.centerY - 50;
            const path = `M ${item.anchorX} ${item.anchorY} Q ${controlX} ${controlY} ${item.centerX} ${item.centerY}`;
            return (
              <Path
                key={`connector-${item.branch.id}`}
                d={path}
                stroke={TRUNK_COLOR}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                opacity={0.9}
              />
            );
          })}
        </Svg>
        {layout.arranged.map((item) => {
          const fruitsForBranch = fruitLayouts[item.branch.id] ?? [];
          const branchColor = BRANCH_COLORS[item.branch.categoryId] ?? item.branch.color ?? colors.primary;
          const fruitCount = fruitsForBranch.length;
          return (
            <React.Fragment key={item.branch.id}>
              <View
                style={[
                  styles.branchCluster,
                  {
                    left: item.centerX - BRANCH_RADIUS,
                    top: item.centerY - BRANCH_RADIUS,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.branchButton,
                    {
                      backgroundColor: branchColor,
                      shadowColor: branchColor,
                    },
                  ]}
                  onPress={() => handleBranchPress(item.branch)}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir rama ${item.branch.name}`}
                  testID={`branch-${item.branch.id}`}
                >
                  <Text style={styles.branchName} numberOfLines={2}>
                    {item.branch.name}
                  </Text>
                  {fruitCount > 0 && (
                    <View style={styles.branchCounter} testID={`branch-${item.branch.id}-count`}>
                      <Text style={styles.branchCounterText}>{fruitCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              {fruitsForBranch.map((fruitLayout) => (
                <View
                  key={fruitLayout.fruit.id}
                  style={[
                    styles.fruitNode,
                    {
                      left: fruitLayout.x - FRUIT_SIZE / 2,
                      top: fruitLayout.y - FRUIT_SIZE / 2,
                    },
                  ]}
                  testID={`fruit-${fruitLayout.fruit.id}`}
                >
                  <TouchableOpacity
                    style={[
                      styles.fruitButton,
                      {
                        backgroundColor: branchColor,
                        shadowColor: branchColor,
                      },
                    ]}
                    onPress={() => handleFruitPress(fruitLayout.fruit)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir recuerdo ${fruitLayout.fruit.title}`}
                    testID={`fruit-${fruitLayout.fruit.id}-button`}
                  >
                    <Text style={styles.fruitEmoji}>🍃</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </React.Fragment>
          );
        })}
        <View
          style={[
            styles.rootSection,
            {
              top: layout.trunkBottom + 24,
              backgroundColor: isDarkMode ? '#101720' : '#FDFBF5',
              borderColor: isDarkMode ? '#1D2A33' : '#E0D7C8',
            },
          ]}
          testID="root-section"
        >
          <Text style={[styles.rootTitle, { color: isDarkMode ? '#E5DED3' : '#2F1A0F' }]}>Raíces familiares</Text>
          <View style={styles.rootList}>
            {rootsToDisplay.map((root) => (
              <TouchableOpacity
                key={root.id}
                style={[
                  styles.rootCard,
                  {
                    backgroundColor: isDarkMode ? '#18222D' : '#FFFFFF',
                    shadowColor: isDarkMode ? '#000' : '#8A714E',
                  },
                ]}
                onPress={() => handleRootPress(root)}
                accessibilityRole="button"
                accessibilityLabel={`Ver raíz ${root.name}`}
                testID={`root-${root.id}`}
              >
                <Text style={[styles.rootEmoji, { color: isDarkMode ? '#C8E6C9' : '#2E7D32' }]}>🌱</Text>
                <View style={styles.rootTextWrapper}>
                  <Text style={[styles.rootName, { color: isDarkMode ? '#E6E0D6' : '#3A2A1D' }]} numberOfLines={1}>
                    {root.name}
                  </Text>
                  <Text style={[styles.rootRelation, { color: isDarkMode ? '#9FB4AA' : '#8C7763' }]} numberOfLines={1}>
                    {root.relation}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {rootsToDisplay.length === 0 && (
              <Text style={[styles.emptyRoots, { color: isDarkMode ? '#94A397' : '#8C7B65' }]}>Añade tus raíces para completar el legado</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundCanopy: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  canopyGlow: {
    transform: [{ scaleX: 1.1 }],
    opacity: 0.9,
    marginTop: 40,
  },
  canvas: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 64,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 36,
  },
  trunk: {
    position: 'absolute',
    width: TRUNK_WIDTH,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  branchCluster: {
    position: 'absolute',
    width: BRANCH_BUTTON_SIZE,
    height: BRANCH_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchButton: {
    width: BRANCH_BUTTON_SIZE,
    height: BRANCH_BUTTON_SIZE,
    borderRadius: BRANCH_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  branchName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  branchCounter: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F3E7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  branchCounterText: {
    color: '#53412E',
    fontSize: 16,
    fontWeight: '700',
  },
  fruitNode: {
    position: 'absolute',
    width: FRUIT_SIZE,
    height: FRUIT_SIZE,
    borderRadius: FRUIT_SIZE / 2,
  },
  fruitButton: {
    width: '100%',
    height: '100%',
    borderRadius: FRUIT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fruitEmoji: {
    fontSize: 14,
  },
  rootSection: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  rootTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  rootList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  rootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    width: SCREEN_WIDTH * 0.38,
    maxWidth: 220,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  rootEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  rootTextWrapper: {
    flex: 1,
  },
  rootName: {
    fontSize: 15,
    fontWeight: '700',
  },
  rootRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyRoots: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default Tree;
