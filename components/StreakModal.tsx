import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur'; // Si tienes expo-blur, si no, usa View con opacidad
import { X, Flame, Calendar as CalendarIcon } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useTreeStore } from '@/stores/treeStore';
import { useThemeStore } from '@/stores/themeStore';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');

interface StreakModalProps {
    visible: boolean;
    onClose: () => void;
    currentStreak: number;
}

export default function StreakModal({ visible, onClose, currentStreak }: StreakModalProps) {
    const { theme } = useThemeStore();
    const { tree } = useTreeStore();
    const isDarkMode = theme === 'dark';

    // Obtener fechas donde hay frutos
    const activeDates = useMemo(() => {
        if (!tree?.fruits) return [];
        return tree.fruits.map(f => new Date(f.createdAt));
    }, [tree]);

    // Configuración del calendario (Mes actual)
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Empezar lunes
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const hasMemoryOnDate = (date: Date) => {
        return activeDates.some(activeDate => isSameDay(activeDate, date));
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
                    {/* Cabecera */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Sección de Racha */}
                    <View style={styles.streakHeader}>
                        <View style={styles.flameContainer}>
                            <Flame size={60} color={colors.warning} fill={colors.warning} />
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakNumber}>{currentStreak}</Text>
                            </View>
                        </View>
                        <Text style={[styles.streakTitle, isDarkMode && styles.textWhite]}>¡Estás en racha!</Text>
                        <Text style={[styles.streakSubtitle, isDarkMode && styles.textLight]}>
                            Has cultivado recuerdos {currentStreak} días seguidos.
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Calendario */}
                    <View style={styles.calendarContainer}>
                        <View style={styles.monthHeader}>
                            <CalendarIcon size={18} color={colors.primary} />
                            <Text style={[styles.monthText, isDarkMode && styles.textWhite]}>
                                {format(today, 'MMMM yyyy', { locale: es }).toUpperCase()}
                            </Text>
                        </View>

                        {/* Días de la semana */}
                        <View style={styles.weekDays}>
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                                <Text key={i} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        {/* Días del mes */}
                        <View style={styles.daysGrid}>
                            {calendarDays.map((day, index) => {
                                const isActive = hasMemoryOnDate(day);
                                const isCurrentMonth = isSameMonth(day, today);
                                const isTodayDate = isToday(day);

                                return (
                                    <View key={index} style={styles.dayCell}>
                                        <View style={[
                                            styles.dayCircle,
                                            isActive && styles.dayActive,
                                            isTodayDate && !isActive && styles.dayToday
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                !isCurrentMonth && styles.dayTextDisabled,
                                                isActive && styles.dayTextActive,
                                                isTodayDate && !isActive && { color: colors.primary }
                                            ]}>
                                                {format(day, 'd')}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.continueButton} onPress={onClose}>
                        <Text style={styles.continueText}>Seguir cultivando</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10,
    },
    modalContainerDark: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
    header: { alignItems: 'flex-end' },
    closeButton: { padding: 4 },

    streakHeader: { alignItems: 'center', marginBottom: 20 },
    flameContainer: { marginBottom: 10, position: 'relative', alignItems: 'center', justifyContent: 'center' },
    streakBadge: { position: 'absolute', top: '40%' },
    streakNumber: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    streakTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    streakSubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center' },

    divider: { height: 1, backgroundColor: colors.lightGray, width: '100%', marginVertical: 16 },

    calendarContainer: { marginBottom: 20 },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
    monthText: { fontSize: 14, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },

    weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    weekDayText: { width: 30, textAlign: 'center', fontSize: 12, color: colors.textLight, fontWeight: 'bold' },

    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    dayCell: { width: '14.28%', alignItems: 'center', marginBottom: 8 },
    dayCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    dayActive: { backgroundColor: colors.primary }, // Día con recuerdo = Verde
    dayToday: { borderWidth: 1, borderColor: colors.primary }, // Hoy sin recuerdo

    dayText: { fontSize: 13, color: colors.text },
    dayTextDisabled: { color: colors.lightGray },
    dayTextActive: { color: '#FFF', fontWeight: 'bold' },

    continueButton: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    continueText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    textWhite: { color: '#FFF' },
    textLight: { color: '#AAA' },
});