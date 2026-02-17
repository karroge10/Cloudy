import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { MASCOTS } from '../constants/Assets';
import { COMPANIONS } from '../constants/Companions';
import { MascotImage } from '../components/MascotImage';
import { useJournal } from '../context/JournalContext';
import { useProfile } from '../context/ProfileContext';
import { Button } from '../components/Button';
import { haptics } from '../utils/haptics';

export const ProgressScreen = () => {
    const navigation = useNavigation();
    const { streak, refreshEntries, rawStreakData, loading: journalLoading } = useJournal();
    const { profile, loading: profileLoading } = useProfile();
    const [refreshing, setRefreshing] = useState(false);

    const maxStreak = profile?.max_streak || streak;
    const effectiveStreak = Math.max(streak, maxStreak);

    // Calculate unlock dates efficiently
    const companionDetails = React.useMemo(() => {
        if (!rawStreakData || rawStreakData.length === 0) return {};

        const uniqueDays = Array.from(new Set(
            rawStreakData.map(entry => new Date(entry.created_at).toLocaleDateString('en-CA'))
        )).sort((a, b) => a.localeCompare(b)); // Sort chronological

        const details: Record<string, { unlockDate?: string }> = {};
        COMPANIONS.forEach(c => {
            if (c.requiredStreak <= uniqueDays.length && uniqueDays.length > 0) {
                // If requiredStreak is 0, it's the first day. 
                // If it's 3, it's the 3rd unique day of participation.
                const dayIndex = Math.max(0, c.requiredStreak - 1);
                const dateStr = uniqueDays[dayIndex];
                if (dateStr) {
                    details[c.id] = {
                        unlockDate: new Date(dateStr).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                    };
                }
            }
        });
        return details;
    }, [rawStreakData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshEntries();
        setRefreshing(false);
    };

    // Logic for Level tied to milestones
    const unlockedCompanions = COMPANIONS.filter(c => effectiveStreak >= c.requiredStreak);
    const currentLevel = unlockedCompanions.length;

    // Find next companion for "days until" message
    const nextCompanion = COMPANIONS.find(c => streak < c.requiredStreak);
    const daysUntilNextLevel = nextCompanion ? nextCompanion.requiredStreak - streak : null;

    return (
        <Layout noScroll={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav
                    title="Progress"
                    onBack={() => navigation.goBack()}
                    roundButtons={true}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9E7D" />
                }
            >
                {/* Header Section */}
                <View className="items-center mt-4 mb-10">
                    <View className="bg-primary/10 p-6 rounded-[40px] mb-4">
                        <MascotImage source={MASCOTS.STAR} className="w-32 h-32" resizeMode="contain" />
                    </View>
                    <Text className="text-3xl font-q-bold text-text mb-2">
                        {unlockedCompanions.length}/{COMPANIONS.length} Unlocked
                    </Text>
                    <View className="bg-white px-6 py-2.5 rounded-2xl shadow-sm border border-primary/5 flex-row items-center">
                        <Text className="text-primary font-q-bold text-base">
                            Max Streak: {maxStreak} Days 🔥
                        </Text>
                    </View>

                    <View className="flex-row items-center mt-8 px-4">
                        <Text className="text-sm font-q-medium text-muted leading-5 text-center flex-1">
                            Each friend represents a milestone in your mental growth as you cultivate your daily habits.
                        </Text>
                    </View>

                    {nextCompanion && daysUntilNextLevel !== null && (
                        <Text className="text-muted font-q-bold text-[10px] uppercase tracking-[3px] mt-8">
                            Next Reward in {Math.max(0, nextCompanion.requiredStreak - effectiveStreak)} {Math.max(0, nextCompanion.requiredStreak - effectiveStreak) === 1 ? 'day' : 'days'}
                        </Text>
                    )}
                </View>

                {/* Rewards List */}
                <View style={{ gap: 24 }}>
                    {COMPANIONS.map((companion, index) => {
                        const isUnlocked = effectiveStreak >= companion.requiredStreak;
                        const isNext = effectiveStreak < companion.requiredStreak && (index === 0 || effectiveStreak >= COMPANIONS[index - 1].requiredStreak);
                        const progress = Math.min(1, effectiveStreak / companion.requiredStreak);
                        const detail = companionDetails[companion.id];

                        return (
                            <View
                                key={companion.id}
                                className={`p-6 rounded-[32px] border ${isUnlocked
                                        ? 'bg-white border-primary/10 shadow-sm'
                                        : 'bg-[#F8FAFC] border-dashed border-2 border-primary/10' // Improved locked state
                                    }`}
                            >
                                <View className="flex-row items-center mb-4">
                                    <View className={`p-4 rounded-2xl mr-5 items-center justify-center ${isUnlocked ? 'bg-secondary/30' : 'bg-transparent'}`}>
                                        <MascotImage
                                            source={companion.asset}
                                            className={`w-14 h-14 ${isUnlocked ? '' : 'grayscale opacity-50'}`}
                                            resizeMode="contain"
                                        />
                                        {!isUnlocked && (
                                            <View className="absolute bg-white/90 rounded-full p-1 border border-inactive/20">
                                                <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                                            </View>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text className={`font-q-bold text-xl ${isUnlocked ? 'text-text' : 'text-text/60'}`}>
                                                {companion.name}
                                            </Text>
                                            {isUnlocked && (
                                                <View className="flex-row items-center bg-[#FF9E7D10] px-3 py-1.5 rounded-full border border-primary/5">
                                                    <Ionicons
                                                        name={
                                                            companion.trait === 'Beginner' ? 'flag' :
                                                                companion.trait === 'Consistency' ? 'repeat' :
                                                                    companion.trait === 'Dedication' ? 'heart' :
                                                                        companion.trait === 'Insight' ? 'bulb' :
                                                                            companion.trait === 'Growth' ? 'trending-up' :
                                                                                'trophy'
                                                        }
                                                        size={12}
                                                        color="#FF9E7D"
                                                    />
                                                    <Text className="text-primary font-q-bold text-[10px] uppercase tracking-wider ml-1.5">{companion.trait}</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text className={`font-q-medium text-xs mt-1.5 leading-4 ${isUnlocked ? 'text-text/70' : 'text-text/40'}`} numberOfLines={2}>
                                            {isUnlocked ? companion.description : 'Keep practicing to unlock this companion.'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress Bar Area */}
                                <View>
                                    <View className="flex-row justify-between items-end mb-2">
                                        <View className="flex-row items-center">
                                            {isUnlocked ? (
                                                <Ionicons name="checkmark-circle" size={14} color="#FF9E7D" />
                                            ) : (
                                                <Ionicons name="lock-closed" size={14} color="#CBD5E1" />
                                            )}
                                            <Text className={`font-q-bold text-[11px] ml-1.5 ${isUnlocked ? 'text-primary' : 'text-muted/40'}`}>
                                                {isUnlocked ? `Unlocked ${detail?.unlockDate ? `on ${detail.unlockDate}` : ''}` : `${companion.requiredStreak} Days Required`}
                                            </Text>
                                        </View>
                                        <Text className={`font-q-bold text-[11px] ${isUnlocked ? 'text-primary' : 'text-muted/40'}`}>
                                            {Math.min(effectiveStreak, companion.requiredStreak)}/{companion.requiredStreak}
                                        </Text>
                                    </View>

                                    <View className="h-2 bg-inactive/30 rounded-full overflow-hidden">
                                        <View
                                            style={{ width: `${progress * 100}%` }}
                                            className={`h-full ${isUnlocked ? 'bg-primary' : 'bg-primary/60'}`}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View className="mt-12">
                    <Button
                        label="Maintain the Habit"
                        onPress={() => {
                            haptics.selection();
                            navigation.goBack();
                        }}
                    />
                </View>
            </ScrollView>
        </Layout>
    );
};
