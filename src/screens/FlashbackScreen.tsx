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
import { useAccent } from '../context/AccentContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Seeded random for daily consistency
const getSeededRandom = (seed: number) => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

export const FlashbackScreen = () => {
    const navigation = useNavigation<any>();
    const { entries } = useJournal();
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();

    const journalEntries = useMemo(() => 
        entries.filter(e => !e.deleted_at), 
    [entries]);

    const stats = useMemo(() => {
        if (journalEntries.length === 0) return null;

        const dates = journalEntries.map(e => new Date(e.created_at).getTime());
        const firstEntry = new Date(Math.min(...dates));
        const lastEntry = new Date(Math.max(...dates));
        
        // Journey Length (Days)
        const storyAge = Math.ceil((lastEntry.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        
        // Favorite Density
        const favorites = journalEntries.filter(e => e.is_favorite);
        const favoritePercent = Math.round((favorites.length / journalEntries.length) * 100);

        // Active days for consistency
        const activeDaysCount = new Set(journalEntries.map(e => new Date(e.created_at).toDateString())).size;
        const consistency = Math.round((activeDaysCount / storyAge) * 100);

        // Longest Gap
        const sortedDates = [...dates].sort((a,b) => a - b);
        let maxGapDays = 0;
        for (let i = 1; i < sortedDates.length; i++) {
            const gap = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
            if (gap > maxGapDays) maxGapDays = Math.floor(gap);
        }

        // Daily consistency logic
        const now = new Date();
        const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        
        const random1 = getSeededRandom(seed);
        const random2 = getSeededRandom(seed + 12345);

        const dailySpecial = journalEntries[Math.floor(random1 * journalEntries.length)];
        const fansFavorite = favorites.length > 0 ? favorites[Math.floor(random2 * favorites.length)] : null;
        const firstCourse = journalEntries.find(e => new Date(e.created_at).getTime() === Math.min(...dates));

        return {
            storyAge,
            favoritePercent,
            maxGapDays,
            consistency,
            dailySpecial,
            fansFavorite,
            firstCourse
        };
    }, [journalEntries]);

    if (!stats) {
        return (
            <Layout>
                <TopNav title="Flashback" onBack={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-10">
                    <MascotImage source={MASCOTS.SAD} className="w-48 h-48 mb-6" />
                    <Text className="text-lg font-q-bold text-muted text-center">Cookie needs more memories to start the flashback!</Text>
                </View>
            </Layout>
        );
    }

    const StatCard = ({ title, value, subtitle, icon }: any) => (
        <View className="bg-card rounded-3xl p-5 mb-4 shadow-sm border border-inactive/5 flex-row items-center h-28">
            <View 
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: `${currentAccent.hex}1A` }}
            >
                <Ionicons name={icon} size={24} color={currentAccent.hex} />
            </View>
            <View className="flex-1">
                <Text className="text-[10px] font-q-bold text-muted uppercase tracking-wider mb-1" numberOfLines={1}>{title}</Text>
                <View className="flex-row items-baseline">
                    <Text className="text-2xl font-q-bold text-text mr-1" numberOfLines={1}>{value}</Text>
                    <Text className="text-sm font-q-medium text-muted" numberOfLines={1}>{subtitle}</Text>
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
                    <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${currentAccent.hex}1A` }}>
                        <Text className="font-q-bold text-[10px] uppercase tracking-widest" style={{ color: currentAccent.hex }}>{label}</Text>
                    </View>
                    <Text className="text-xs font-q-bold text-muted">{date}</Text>
                </View>
                <Text className="text-lg font-q-medium text-text leading-7 italic" numberOfLines={3}>
                    "{entry.text}"
                </Text>
                <View className="flex-row items-center mt-4">
                    <Text className="text-primary font-q-bold text-xs uppercase tracking-wider" style={{ color: currentAccent.hex }}>Taste this memory</Text>
                    <Ionicons name="arrow-forward" size={12} color={currentAccent.hex} style={{ marginLeft: 4 }} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Flashback" onBack={() => navigation.goBack()} />
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="items-center my-6">
                    <MascotImage source={MASCOTS.CHEF} className="w-40 h-40" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text mt-4">Cookie's Daily Mix</Text>
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
                            <StatCard title="Account Age" value={stats.storyAge} subtitle="days" icon="time-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Longest Gap" value={stats.maxGapDays} subtitle="days" icon="pause-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Love Meter" value={`${stats.favoritePercent}%`} subtitle="loved" icon="heart-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title="Consistency" value={`${stats.consistency}%`} subtitle="active" icon="checkmark-circle-outline" />
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
            </ScrollView>
        </Layout>
    );
};
