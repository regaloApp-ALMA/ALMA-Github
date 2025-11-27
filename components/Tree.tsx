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

// LIENZO GRANDE
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2500;
const CENTER_X = CANVAS_WIDTH / 2;
const TRUNK_BASE_Y = CANVAS_HEIGHT - 300; // Base del árbol

// --- COMPONENTES VISUALES ---

const CenterNode = memo(({ photoUrl, name }: { photoUrl?: string, name: string }) => (
    <View style={[styles.centerNodeContainer, { left: CENTER_X - 50, top: TRUNK_BASE_Y - 50 }]}>
        <View style={styles.centerNode}>
            {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.centerImage} />
            ) : (
                <View style={[styles.centerImage, { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{(name || 'Y').charAt(0).toUpperCase()}</Text>
                </View>
            )}
        </View>
        <View style={styles.centerLabelBadge}>
            <Text style={styles.centerLabelText}>RAÍZ</Text>
        </View>
    </View>
));

const BranchNode = memo(({ branch, x, y, onPress }: { branch: BranchType; x: number; y: number; onPress: (b: BranchType) => void }) => (
    <TouchableOpacity
        style={[styles.branchNode, { left: x - 45, top: y - 45, backgroundColor: branch.color || colors.primary }]}
        onPress={() => onPress(branch)}
        activeOpacity={0.9}
    >
        <Text style={styles.branchText} numberOfLines={2}>{branch.name}</Text>
    </TouchableOpacity>
));

const FruitNode = memo(({ fruit, x, y, color, onPress }: { fruit: FruitType; x: number; y: number; color: string; onPress: (f: FruitType) => void }) => {
    const hasImage = fruit.mediaUrls && fruit.mediaUrls.length > 0;
    return (
        <TouchableOpacity
            style={[
                styles.fruitNode,
                { left: x - 20, top: y - 20, backgroundColor: hasImage ? '#FFF' : color, borderColor: color }
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

    // Centrar la vista en la base del tronco
    const initialOffsetX = -(CANVAS_WIDTH - SCREEN_WIDTH) / 2;
    const initialOffsetY = -(CANVAS_HEIGHT - SCREEN_HEIGHT) + 200;

    const { layoutBranches, layoutFruits, trunkPath, branchPaths } = useMemo(() => {
        if (!tree) return { layoutBranches: [], layoutFruits: [], trunkPath: '', branchPaths: [] };

        const branches = tree.branches || [];
        const fruits = tree.fruits || [];

        // 1. ESTRUCTURA DE TRONCO Y RAMAS (Jerárquico)
        const trunkTopY = TRUNK_BASE_Y - 200; // Altura del primer nivel

        // Tronco Central
        const trunkPath = `M ${CENTER_X} ${TRUNK_BASE_Y + 50} L ${CENTER_X} ${trunkTopY + 50}`;

        const layoutBranches = branches.map((branch, i) => {
            // Alternar Lado: Pares izquierda (-1), Impares derecha (1)
            const side = i % 2 === 0 ? -1 : 1;
            const level = Math.floor(i / 2); // Nivel de altura (0, 1, 2...)

            // Posición
            // Cuanto más alto, más separado del centro (efecto copa)
            const spreadX = 160 + (level * 60);
            const heightStep = 180;

            const startX = CENTER_X;
            const startY = trunkTopY - (level * 100); // Nacen del "tronco invisible" central

            const endX = CENTER_X + (spreadX * side);
            const endY = trunkTopY - (level * heightStep) - 50;

            // Curva Bezier
            const cp1x = CENTER_X + (spreadX * 0.3 * side);
            const cp1y = endY + 100;

            return { ...branch, x: endX, y: endY, startX, startY, cp1x, cp1y };
        });

        const branchPaths = layoutBranches.map(b =>
            `M ${CENTER_X} ${b.startY + 100} Q ${b.cp1x} ${b.cp1y} ${b.x} ${b.y}`
        );

        // 2. FRUTOS (Orbitando el final de la rama)
        const layoutFruits = fruits.map((fruit, i) => {
            const parent = layoutBranches.find(b => b.id === fruit.branchId);
            if (!parent) return null;

            const fruitsInBranch = fruits.filter(f => f.branchId === parent.id);
            const myIndex = fruitsInBranch.indexOf(fruit);

            // Abanico superior
            const spreadAngle = Math.PI / 1.5; // 120 grados
            const startAngle = -Math.PI / 2 - (spreadAngle / 2);
            const step = fruitsInBranch.length > 1 ? spreadAngle / (fruitsInBranch.length - 1) : 0;
            const angle = fruitsInBranch.length === 1 ? -Math.PI / 2 : startAngle + (step * myIndex);

            const dist = 80;

            const x = parent.x + Math.cos(angle) * dist;
            const y = parent.y + Math.sin(angle) * dist;

            return {
                ...fruit,
                x, y,
                parentX: parent.x,
                parentY: parent.y,
                color: parent.color
            };
        }).filter(Boolean);

        return { layoutBranches, layoutFruits, trunkPath, branchPaths };
    }, [tree]);

    return (
        <View style={styles.container}>
            <ReactNativeZoomableView
                maxZoom={1.5}
                minZoom={0.3}
                zoomStep={0.5}
                initialZoom={0.65}
                bindToBorders={false}
                style={styles.zoomView}
                contentWidth={CANVAS_WIDTH}
                contentHeight={CANVAS_HEIGHT}
                initialOffsetX={initialOffsetX}
                initialOffsetY={initialOffsetY}
            >
                <View style={styles.canvas}>
                    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#4E342E" />
                                <Stop offset="1" stopColor="#795548" />
                            </LinearGradient>
                        </Defs>

                        {/* Tronco Principal */}
                        <Path d={trunkPath} stroke="url(#wood)" strokeWidth="24" strokeLinecap="round" />

                        {/* Ramas */}
                        {branchPaths.map((d, i) => (
                            <Path
                                key={`branch-path-${i}`}
                                d={d}
                                stroke="#5D4037"
                                strokeWidth="12"
                                strokeLinecap="round"
                                fill="none"
                            />
                        ))}

                        {/* Tallos de Frutos */}
                        {layoutFruits.map((f: any, i) => (
                            <Line
                                key={`stem-${i}`}
                                x1={f.parentX} y1={f.parentY}
                                x2={f.x} y2={f.y}
                                stroke={f.color}
                                strokeWidth="3"
                                opacity={0.5}
                            />
                        ))}
                    </Svg>

                    {/* Nodos */}
                    <CenterNode photoUrl={(user as any)?.avatar_url} name={user?.name || 'Yo'} />

                    {layoutBranches.map((b) => (
                        <BranchNode
                            key={b.id}
                            branch={b}
                            x={b.x}
                            y={b.y}
                            onPress={(branch) => router.push({ pathname: '/branch-details', params: { id: branch.id } })}
                        />
                    ))}

                    {layoutFruits.map((f: any) => (
                        <FruitNode
                            key={f.id}
                            fruit={f}
                            x={f.x}
                            y={f.y}
                            color={f.color}
                            onPress={(fruit) => router.push({ pathname: '/fruit-details', params: { id: fruit.id } })}
                        />
                    ))}
                </View>
            </ReactNativeZoomableView>

            {/* Panel de Raíces (Limpio) */}
            <View style={styles.rootsPanel}>
                <Text style={styles.rootsTitle}>Familiares conectados</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {tree?.roots && tree.roots.length > 0 ? (
                        tree.roots.map((root) => (
                            <RootCard
                                key={root.id}
                                root={root}
                                onPress={(r) => router.push({ pathname: '/root-details', params: { id: r.id } })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyRootsContainer}>
                            <Text style={styles.emptyRoots}>Invita a tu familia.</Text>
                            <TouchableOpacity onPress={() => router.push('/share-tree')}>
                                <Text style={styles.inviteLink}>Invitar</Text>
                            </TouchableOpacity>
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
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    zoomView: { width: '100%', height: '100%' },
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },

    centerNodeContainer: { position: 'absolute', width: 100, height: 100, alignItems: 'center', justifyContent: 'center', zIndex: 30 },
    centerNode: { width: 90, height: 90, borderRadius: 45, padding: 4, backgroundColor: '#FFF', elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2 },
    centerImage: { width: '100%', height: '100%', borderRadius: 45 },
    centerLabelBadge: { position: 'absolute', bottom: -5, backgroundColor: '#5D4037', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    centerLabelText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    branchNode: { position: 'absolute', width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, zIndex: 20 },
    branchText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center', fontSize: 11, paddingHorizontal: 4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 2 },

    fruitNode: { position: 'absolute', width: 40, height: 40, borderRadius: 20, elevation: 4, justifyContent: 'center', alignItems: 'center', zIndex: 25, borderWidth: 2, overflow: 'hidden' },
    fruitImage: { width: '100%', height: '100%' },
    fruitDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.7)' },

    rootsPanel: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, borderWidth: 1, borderColor: '#F0F0F0' },
    rootsTitle: { fontSize: 15, fontWeight: 'bold', color: '#2D3436', marginBottom: 10 },
    rootCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 8, paddingRight: 14, borderRadius: 30, marginRight: 10, borderWidth: 1, borderColor: '#EEE', elevation: 1 },
    rootAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    rootInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    rootName: { fontWeight: '600', fontSize: 13, color: '#2D3436' },
    rootRelation: { fontSize: 10, color: '#636E72' },
    emptyRootsContainer: { flexDirection: 'row', alignItems: 'center' },
    emptyRoots: { color: '#999', fontStyle: 'italic', fontSize: 13, marginRight: 8 },
    inviteLink: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },

    loadingFloat: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5 },
    loadingText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 }
});