import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Image, ScrollView, ActivityIndicator } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import Svg, { Path, Line, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import { useUserStore } from '@/stores/userStore';
import { BranchType, FruitType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CANVAS_SIZE = 2500;
const CENTER = CANVAS_SIZE / 2;

// --- COMPONENTES VISUALES ---

// CORRECCIÓN: Aceptamos string, null o undefined explícitamente
const CenterNode = memo(({ photoUrl, name }: { photoUrl?: string | null, name: string }) => (
    <View style={[styles.centerNodeContainer, { left: CENTER - 65, top: CENTER - 65 }]}>
        <View style={styles.centerPulse} />
        <View style={styles.centerNode}>
            {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.centerImage} />
            ) : (
                <View style={[styles.centerImage, { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>{(name || 'Y').charAt(0).toUpperCase()}</Text>
                </View>
            )}
        </View>
        <View style={styles.centerLabelBadge}>
            <Text style={styles.centerLabelText}>MI VIDA</Text>
        </View>
    </View>
));

const BranchNode = memo(({ branch, x, y, onPress }: { branch: BranchType; x: number; y: number; onPress: (b: BranchType) => void }) => (
    <TouchableOpacity
        style={[styles.branchNode, { left: x - 55, top: y - 55, borderColor: branch.color || colors.primary }]}
        onPress={() => onPress(branch)}
        activeOpacity={0.8}
    >
        <View style={[styles.branchInner, { backgroundColor: branch.color || colors.primary }]}>
            <Text style={styles.branchText} numberOfLines={2}>{branch.name}</Text>
        </View>
    </TouchableOpacity>
));

const FruitNode = memo(({ fruit, x, y, color, onPress }: { fruit: FruitType; x: number; y: number; color: string; onPress: (f: FruitType) => void }) => {
    const hasImage = fruit.mediaUrls && fruit.mediaUrls.length > 0;
    return (
        <TouchableOpacity
            style={[
                styles.fruitNode,
                { left: x - 20, top: y - 20 },
                hasImage ? { borderWidth: 2, borderColor: '#FFF' } : { backgroundColor: color }
            ]}
            onPress={() => onPress(fruit)}
            activeOpacity={0.8}
        >
            {hasImage ? (
                <Image source={{ uri: fruit.mediaUrls![0] }} style={styles.fruitImage} />
            ) : (
                <View style={styles.fruitDot} />
            )}
        </TouchableOpacity>
    );
});

const RootCard = memo(({ root, onPress }: { root: RootType; onPress: (r: RootType) => void }) => (
    <TouchableOpacity style={styles.rootCard} onPress={() => onPress(root)}>
        <View style={[styles.rootAvatar, { backgroundColor: colors.family }]}>
            <Text style={styles.rootInitial}>{root.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
            <Text style={styles.rootName}>{root.name}</Text>
            <Text style={styles.rootRelation}>{root.relation}</Text>
        </View>
    </TouchableOpacity>
));

export default function Tree() {
    const { tree, isLoading } = useTreeStore();
    const { user } = useUserStore();
    const router = useRouter();

    const initialOffsetX = -(CANVAS_SIZE - SCREEN_WIDTH) / 2;
    const initialOffsetY = -(CANVAS_SIZE - SCREEN_HEIGHT) / 2;

    const { layoutBranches, layoutFruits, connectionPaths } = useMemo(() => {
        if (!tree) return { layoutBranches: [], layoutFruits: [], connectionPaths: [] };

        const branches = tree.branches || [];
        const fruits = tree.fruits || [];
        const totalBranches = branches.length;

        const layoutBranches = branches.map((branch, i) => {
            const angle = (i * (2 * Math.PI)) / Math.max(totalBranches, 1) - (Math.PI / 2);
            const radius = 350;

            const x = CENTER + Math.cos(angle) * radius;
            const y = CENTER + Math.sin(angle) * radius;
            const cp1x = CENTER + Math.cos(angle) * (radius * 0.5);
            const cp1y = CENTER + Math.sin(angle) * (radius * 0.5);

            return { ...branch, x, y, angle, cp1x, cp1y };
        });

        const layoutFruits = fruits.map((fruit, i) => {
            const parent = layoutBranches.find(b => b.id === fruit.branchId);
            if (!parent) return null;

            const fruitsInBranch = fruits.filter(f => f.branchId === parent.id);
            const myIndex = fruitsInBranch.indexOf(fruit);

            const spreadAngle = 1.5;
            const startAngle = parent.angle - (spreadAngle / 2);
            const step = fruitsInBranch.length > 1 ? spreadAngle / (fruitsInBranch.length - 1) : 0;
            const finalAngle = fruitsInBranch.length === 1 ? parent.angle : startAngle + (step * myIndex);

            const dist = 110;

            return {
                ...fruit,
                x: parent.x + Math.cos(finalAngle) * dist,
                y: parent.y + Math.sin(finalAngle) * dist,
                parentX: parent.x,
                parentY: parent.y,
                color: parent.color
            };
        }).filter(Boolean);

        const connectionPaths = layoutBranches.map(b =>
            `M ${CENTER} ${CENTER} Q ${b.cp1x} ${b.cp1y} ${b.x} ${b.y}`
        );

        return { layoutBranches, layoutFruits, connectionPaths };
    }, [tree]);

    // Extraemos la URL de forma segura
    const userAvatar = (user as any)?.avatar_url || null;
    const userName = user?.name || 'Yo';

    return (
        <View style={styles.container}>
            <ReactNativeZoomableView
                maxZoom={1.5}
                minZoom={0.3}
                zoomStep={0.5}
                initialZoom={0.7}
                bindToBorders={false}
                style={styles.zoomView}
                contentWidth={CANVAS_SIZE}
                contentHeight={CANVAS_SIZE}
                initialOffsetX={initialOffsetX}
                initialOffsetY={initialOffsetY}
            >
                <View style={styles.canvas}>
                    <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor={colors.primary} stopOpacity="0.05" />
                                <Stop offset="1" stopColor={colors.secondary} stopOpacity="0.02" />
                            </LinearGradient>
                        </Defs>

                        <Circle cx={CENTER} cy={CENTER} r={500} fill="url(#grad)" />

                        {connectionPaths.map((d, i) => (
                            <Path key={`conn-${i}`} d={d} stroke={layoutBranches[i]?.color || colors.primary} strokeWidth="8" strokeOpacity="0.4" strokeLinecap="round" fill="none" />
                        ))}

                        {layoutFruits.map((f: any, i) => (
                            <Line key={`stem-${i}`} x1={f.parentX} y1={f.parentY} x2={f.x} y2={f.y} stroke={f.color} strokeWidth="2" opacity={0.4} />
                        ))}
                    </Svg>

                    {/* Pasamos las variables seguras */}
                    <CenterNode photoUrl={userAvatar} name={userName} />

                    {layoutBranches.map((b) => (
                        <BranchNode key={b.id} branch={b} x={b.x} y={b.y} onPress={(branch) => router.push({ pathname: '/branch-details', params: { id: branch.id } })} />
                    ))}

                    {layoutFruits.map((f: any) => (
                        <FruitNode key={f.id} fruit={f} x={f.x} y={f.y} color={f.color} onPress={(fruit) => router.push({ pathname: '/fruit-details', params: { id: fruit.id } })} />
                    ))}
                </View>
            </ReactNativeZoomableView>

            <View style={styles.rootsPanel}>
                <View style={styles.rootsHeader}>
                    <Text style={styles.rootsTitle}>Raíces familiares</Text>
                    {tree?.roots && tree.roots.length > 0 && (
                        <View style={styles.rootsBadge}>
                            <Text style={styles.rootsCount}>{tree.roots.length}</Text>
                        </View>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {tree?.roots && tree.roots.length > 0 ? (
                        tree.roots.map((root) => (
                            <RootCard key={root.id} root={root} onPress={(r) => router.push({ pathname: '/root-details', params: { id: r.id } })} />
                        ))
                    ) : (
                        <View style={styles.emptyRootsContainer}>
                            <Text style={styles.emptyRoots}>Conecta con tu familia.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {isLoading && (
                <View style={styles.loadingFloat}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    zoomView: { width: '100%', height: '100%' },
    canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE },
    centerNodeContainer: { position: 'absolute', width: 130, height: 130, alignItems: 'center', justifyContent: 'center', zIndex: 30 },
    centerNode: { width: 100, height: 100, borderRadius: 50, padding: 4, backgroundColor: '#FFF', elevation: 10, shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    centerImage: { width: '100%', height: '100%', borderRadius: 50 },
    centerPulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.secondary, opacity: 0.1 },
    centerLabelBadge: { position: 'absolute', bottom: 0, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, elevation: 5 },
    centerLabelText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    branchNode: { position: 'absolute', width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 4, backgroundColor: '#FFF', elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, zIndex: 20 },
    branchInner: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
    branchText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center', fontSize: 12, paddingHorizontal: 5 },
    fruitNode: { position: 'absolute', width: 40, height: 40, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, justifyContent: 'center', alignItems: 'center', zIndex: 25, backgroundColor: '#FFF', overflow: 'hidden' },
    fruitImage: { width: '100%', height: '100%' },
    fruitDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.6)' },
    rootsPanel: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 16, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#F0F0F0' },
    rootsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rootsTitle: { fontSize: 16, fontWeight: '800', color: '#2D3436' },
    rootsBadge: { backgroundColor: '#F0F2F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
    rootsCount: { fontSize: 12, fontWeight: 'bold', color: '#636E72' },
    rootCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 8, paddingRight: 16, borderRadius: 40, marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0', elevation: 1 },
    rootAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    rootInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    rootName: { fontWeight: '700', fontSize: 13, color: '#2D3436' },
    rootRelation: { fontSize: 10, color: '#636E72' },
    emptyRootsContainer: { flexDirection: 'row', alignItems: 'center' },
    emptyRoots: { color: '#999', fontStyle: 'italic', fontSize: 14, marginRight: 8 },
    loadingFloat: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5 },
    loadingText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 }
});