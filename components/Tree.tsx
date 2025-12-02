import React, { memo, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import { BranchType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Sprout, Share2 } from 'lucide-react-native';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;
const CENTER_X = CANVAS_WIDTH / 2;
const BASE_Y = CANVAS_HEIGHT - 200;

const DESIGN_THEME = {
  bg: '#F3F0E9',
  trunk: '#795548',
  textDark: '#2D3436',
};

const BranchBubble = memo(
  ({ branch, x, y, onPress, fruitCount }: { branch: BranchType; x: number; y: number; onPress: (b: BranchType) => void; fruitCount: number }) => (
    <View style={[styles.branchWrapper, { left: x - 45, top: y - 45 }]}>
      {fruitCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{fruitCount}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.branchCircle, { backgroundColor: branch.color || colors.primary }]}
        onPress={() => onPress(branch)}
        activeOpacity={0.85}
        testID={`branch-${branch.id}`}
      >
        <Text style={styles.branchText} numberOfLines={2} adjustsFontSizeToFit>
          {branch.name}
        </Text>
      </TouchableOpacity>
    </View>
  ),
);
BranchBubble.displayName = 'BranchBubble';

const RootCard = memo(({ root, onPress }: { root: RootType; onPress: (r: RootType) => void }) => (
  <TouchableOpacity style={styles.rootCard} onPress={() => onPress(root)} testID={`root-${root.id}`}>
    <View style={styles.rootIconContainer}>
      <Sprout size={18} color="#5D4037" />
    </View>
    <View>
      <Text style={styles.rootName}>{root.name}</Text>
      <Text style={styles.rootRelation}>{root.relation}</Text>
    </View>
  </TouchableOpacity>
));
RootCard.displayName = 'RootCard';

export default function Tree() {
  const { tree, isLoading } = useTreeStore();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { layoutBranches, trunkPath, canopyRadius } = useMemo(() => {
    if (!tree) return { layoutBranches: [], trunkPath: '', canopyRadius: 260 };

    const branches = tree.branches || [];
    const verticalSpacing = Math.max(110, 420 / Math.max(branches.length, 1));
    const layoutBranches = branches.map((branch, index) => {
      const isLeft = index % 2 === 0;
      const sideMultiplier = isLeft ? -1 : 1;
      const startY = BASE_Y - 220 - index * verticalSpacing;
      const branchLength = 170 + Math.min(index * 5, 60);
      const endX = CENTER_X + sideMultiplier * branchLength;
      const endY = startY - 28;
      const startX = CENTER_X;
      const cp1x = CENTER_X + sideMultiplier * 90;
      const cp1y = startY;
      const cp2x = endX - sideMultiplier * 40;
      const cp2y = endY + 18;
      const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
      const fruitCount = tree.fruits.filter((f) => f.branchId === branch.id).length;
      return { ...branch, x: endX, y: endY, path, fruitCount };
    });

    const trunkWidth = 40;
    const trunkHeight = 920;
    const trunkTopY = BASE_Y - trunkHeight;
    const trunkPath = `M ${CENTER_X - trunkWidth / 2} ${BASE_Y} L ${CENTER_X - trunkWidth / 2} ${trunkTopY} Q ${CENTER_X} ${trunkTopY - 20} ${CENTER_X + trunkWidth / 2} ${trunkTopY} L ${CENTER_X + trunkWidth / 2} ${BASE_Y} Z`;
    const canopyRadius = 260 + branches.length * 14;

    return { layoutBranches, trunkPath, canopyRadius };
  }, [tree]);

  const initialZoom = useMemo(() => {
    const ratio = screenWidth / (CANVAS_WIDTH * 0.75);
    return Math.min(1.05, Math.max(ratio, 0.65));
  }, [screenWidth]);

  const bottomPanelHeight = 260;

  const initialOffsets = useMemo(() => {
    const focusX = CENTER_X;
    const focusY = BASE_Y - 320;
    const offsetX = -(focusX * initialZoom - screenWidth / 2);
    const visibleHeight = screenHeight - bottomPanelHeight;
    const offsetY = -(focusY * initialZoom - visibleHeight / 2);
    return { offsetX, offsetY };
  }, [initialZoom, screenHeight, screenWidth, bottomPanelHeight]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <ReactNativeZoomableView
        maxZoom={2}
        minZoom={0.45}
        zoomStep={0.25}
        initialZoom={initialZoom}
        bindToBorders={false}
        style={styles.zoomView}
        contentWidth={CANVAS_WIDTH}
        contentHeight={CANVAS_HEIGHT}
        initialOffsetX={initialOffsets.offsetX}
        initialOffsetY={initialOffsets.offsetY}
        movementSensibility={1.2}
      >
        <View style={styles.canvas}>
          <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E0E0E0" stopOpacity="0.5" />
                <Stop offset="1" stopColor="#F3F0E9" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            <Circle cx={CENTER_X} cy={BASE_Y - 650} r={canopyRadius} fill="rgba(144,164,174,0.18)" />

            <Path d={`M 0 ${BASE_Y} Q ${CENTER_X} ${BASE_Y - 80} ${CANVAS_WIDTH} ${BASE_Y} V ${CANVAS_HEIGHT} H 0 Z`} fill="#E8E6DC" />
            <Path d={trunkPath} fill={DESIGN_THEME.trunk} />

            {layoutBranches.map((branch) => (
              <Path
                key={`path-${branch.id}`}
                d={branch.path}
                stroke={DESIGN_THEME.trunk}
                strokeWidth={12}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </Svg>

          {layoutBranches.map((branch) => (
            <BranchBubble
              key={branch.id}
              branch={branch}
              x={branch.x}
              y={branch.y}
              fruitCount={branch.fruitCount}
              onPress={(selected) => router.push({ pathname: '/branch-details', params: { id: selected.id } })}
            />
          ))}
        </View>
      </ReactNativeZoomableView>

      <View style={styles.bottomPanel}>
        <View style={styles.primaryActions}>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => router.push('/connect-root' as never)}
            testID="connect-root-button"
          >
            <Text style={styles.connectText}>+ Conectar raíz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => router.push('/share-tree')}
            testID="share-tree-button"
          >
            <Share2 size={16} color={colors.white} />
            <Text style={styles.shareButtonText}>Compartir mi legado</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.panelTitle}>Raíces familiares</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rootsList}>
          {tree?.roots && tree.roots.length > 0 ? (
            tree.roots.map((root) => (
              <RootCard
                key={root.id}
                root={root}
                onPress={(selected) => router.push({ pathname: '/root-details', params: { id: selected.id } })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Añade a tus padres para empezar.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_THEME.bg,
  },
  zoomView: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  loaderContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  branchWrapper: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  branchText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F5F5F5',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingBottom: 30,
    paddingHorizontal: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#E1F5FE',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  connectText: {
    color: '#0277BD',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DESIGN_THEME.textDark,
    marginTop: 18,
    marginBottom: 12,
  },
  rootsList: {
    alignItems: 'center',
    paddingRight: 20,
  },
  rootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    paddingRight: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  rootIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFEBE9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rootName: {
    fontWeight: '700',
    color: '#333',
    fontSize: 14,
  },
  rootRelation: {
    color: '#888',
    fontSize: 11,
  },
  emptyState: {
    marginRight: 10,
  },
  emptyText: {
    color: '#AAA',
    fontStyle: 'italic',
  },
});
