import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { useJournal } from '../context/JournalContext';
import { useTheme } from '../context/ThemeContext';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { haptics } from '../utils/haptics';
import { TopNav } from '../components/TopNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MemoryMixScreen = () => {
    const navigation = useNavigation<any>();
    const { entries, rawStreakData } = useJournal();
    const { isDarkMode } = useTheme();

    const journalEntries = useMemo(() => 
        entries.filter(e => !e.deleted_at), 
    [entries]);

    const stats = useMemo(() => {
        if (journalEntries.length === 0) return null;

        const dates = journalEntries.map(e => new Date(e.created_at).getTime());
        const firstEntry = new Date(Math.min(...dates));
        const lastEntry = new Date(Math.max(...dates));
        
        // Memory Span (Days)
        const spanDays = Math.ceil((lastEntry.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        
        // Favorite Density
        const favorites = journalEntries.filter(e => e.is_favorite);
        const favoritePercent = Math.round((favorites.length / journalEntries.length) * 100);

        // Longest Gap
        const sortedDates = [...dates].sort((a,b) => a - b);
        let maxGapDays = 0;
        for (let i = 1; i < sortedDates.length; i++) {
            const gap = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
            if (gap > maxGapDays) maxGapDays = Math.floor(gap);
        }

        // Random Special
        const dailySpecial = journalEntries[Math.floor(Math.random() * journalEntries.length)];
        const fansFavorite = favorites.length > 0 ? favorites[Math.floor(Math.random() * favorites.length)] : null;
        const firstCourse = journalEntries.find(e => new Date(e.created_at).getTime() === Math.min(...dates));

        return {
            spanDays,
            favoritePercent,
            maxGapDays,
            dailySpecial,
            fansFavorite,
            firstCourse,
            totalCount: journalEntries.length
        };
    }, [journalEntries]);

    if (!stats) {
        return (
            <Layout>
                <TopNav title="Memory Mix" onBack={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-10">
                    <MascotImage source={MASCOTS.SAD} className="w-48 h-48 mb-6" />
                    <Text className="text-lg font-q-bold text-muted text-center">Cookie needs more memories to start the mix!</Text>
                </View>
            </Layout>
        );
    }

    const StatCard = ({ title, value, subtitle, icon, color }: any) => (
        <View className="bg-card rounded-3xl p-5 mb-4 shadow-sm border border-inactive/5 flex-row items-center">
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 bg-${color}/10`}>
                <Ionicons name={icon} size={24} color={color === 'primary' ? '#FF9E7D' : '#94A3B8'} />
            </View>
            <View className="flex-1">
                <Text className="text-xs font-q-bold text-muted uppercase tracking-wider mb-1">{title}</Text>
                <View className="flex-row items-baseline">
                    <Text className="text-2xl font-q-bold text-text mr-1">{value}</Text>
                    <Text className="text-sm font-q-medium text-muted">{subtitle}</Text>
                </View>
            </View>
        </View>
    );

    const MemoryPreview = ({ title, entry, label }: any) => {
        if (!entry) return null;
        const date = new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        
        return (
            <TouchableOpacity 
                onPress={() => { haptics.selection(); navigation.navigate('Memory', { entryId: entry.id }); }}
                className="bg-card rounded-[32px] p-6 mb-6 shadow-md border border-inactive/5"
            >
                <View className="flex-row justify-between items-center mb-4">
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-[10px] uppercase tracking-widest">{label}</Text>
                    </View>
                    <Text className="text-xs font-q-bold text-muted">{date}</Text>
                </View>
                <Text className="text-lg font-q-medium text-text leading-7 italic" numberOfLines={3}>
                    "{entry.text}"
                </Text>
                <View className="flex-row items-center mt-4">
                    <Text className="text-primary font-q-bold text-xs uppercase tracking-wider">Taste this memory</Text>
                    <Ionicons name="arrow-forward" size={12} color="#FF9E7D" style={{ marginLeft: 4 }} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Memory Mix" onBack={() => navigation.goBack()} />
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="items-center my-6">
                    <MascotImage source={MASCOTS.CHEF} className="w-40 h-40" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text mt-4">Cookie's Today Special</Text>
                    <Text className="text-base font-q-medium text-muted text-center mt-1">A unique blend of your journey</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">The Daily Serving</Text>
                    <MemoryPreview label="Daily Special" entry={stats.dailySpecial} />
                </View>

                <View className="mb-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">Menu Highlights</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <View style={{ width: '48%' }}>
                            <StatCard title="Memory Span" value={stats.spanDays} subtitle="days" icon="time-outline" color="primary" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Longest Gap" value={stats.maxGapDays} subtitle="days" icon="pause-outline" color="muted" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Heart Ratio" value={`${stats.favoritePercent}%`} subtitle="loved" icon="heart-outline" color="primary" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Total Plates" value={stats.totalCount} subtitle="logs" icon="layers-outline" color="muted" />
                        </View>
                    </View>
                </View>

                {stats.fansFavorite && (
                    <View className="mb-4">
                        <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">A Fan Favorite</Text>
                        <MemoryPreview label="Top Pick" entry={stats.fansFavorite} />
                    </View>
                )}

                <View className="mb-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">The First Course</Text>
                    <MemoryPreview label="Where it began" entry={stats.firstCourse} />
                </View>

                <TouchableOpacity 
                    onPress={() => { haptics.selection(); navigation.navigate('Memory', { filter: 'mix' }); }}
                    className="bg-primary/10 p-6 rounded-[32px] items-center border border-primary/20 mt-4 active:scale-95 transition-transform"
                >
                    <Ionicons name="shuffle" size={32} color="#FF9E7D" />
                    <Text className="text-lg font-q-bold text-primary mt-2">Shuffle All Memories</Text>
                    <Text className="text-sm font-q-medium text-primary/60 mt-1">Visit the full Memory Mix Inspector</Text>
                </TouchableOpacity>
            </ScrollView>
        </Layout>
    );
};
