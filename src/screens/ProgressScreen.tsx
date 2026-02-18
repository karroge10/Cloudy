import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
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
import { useTheme } from '../context/ThemeContext';

export const ProgressScreen = () => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const { streak, refreshEntries, rawStreakData, loading: journalLoading } = useJournal();
    const { profile, loading: profileLoading } = useProfile();
    const [refreshing, setRefreshing] = useState(false);

    const maxStreak = profile?.max_streak || streak;
    const effectiveStreak = maxStreak;

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
        <Layout noScroll={true} useSafePadding={false} edges={['top', 'left', 'right']}>
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
                    <View className="bg-card p-6 rounded-[40px] mb-4 shadow-sm border border-secondary/20">
                        <MascotImage source={MASCOTS.STAR} className="w-32 h-32" resizeMode="contain" />
                    </View>
                    <Text className="text-3xl font-q-bold text-text mb-2">
                        {unlockedCompanions.length}/{COMPANIONS.length} Unlocked
                    </Text>
                    <View className="bg-card px-6 py-2.5 rounded-2xl shadow-sm border border-primary/5 flex-row items-center">
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
                                className={`p-5 rounded-[40px] border-2 ${isUnlocked
                                        ? 'bg-card border-secondary shadow-xl shadow-secondary/10'
                                        : 'bg-card border-dashed border-inactive/30 opacity-80'
                                    }`}
                                style={isUnlocked ? { shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 } : {}}
                            >
                                <View className="flex-row items-center mb-4">
                                    <View className={`p-4 rounded-[28px] mr-5 items-center justify-center ${isUnlocked ? 'bg-secondary' : 'bg-transparent'}`}>
                                        <MascotImage
                                            source={companion.asset}
                                            className={`w-16 h-16 ${isUnlocked ? '' : 'grayscale opacity-30 scale-90'}`}
                                            resizeMode="contain"
                                        />
                                        {!isUnlocked && (
                                            <View className="absolute bg-card rounded-full p-1.5 shadow-sm border border-inactive/20">
                                                <Ionicons name="lock-closed" size={14} color={isDarkMode ? "#E5E7EB" : "#CBD5E1"} />
                                            </View>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className={`font-q-bold text-2xl ${isUnlocked ? 'text-text' : 'text-text/40'}`}>
                                                {companion.name}
                                            </Text>
                                             {isUnlocked && (
                                                 companion.trait === 'HERO' ? (
                                                     <View className={`${isDarkMode ? 'bg-[#FFD700]/30' : 'bg-black'} px-3 py-1 rounded-full border border-[#FFD700] flex-row items-center shadow-sm`}>
                                                         <Ionicons name="flash" size={10} color="#FFD700" />
                                                         <Text className="text-[#FFD700] font-q-bold text-[10px] ml-1.5 uppercase tracking-widest">HERO</Text>
                                                     </View>
                                                 ) : (
                                                     <View className="bg-primary/20 px-3 py-1 rounded-full">
                                                         <Text className="text-primary font-q-bold text-[10px] uppercase tracking-[1px]">{companion.trait}</Text>
                                                     </View>
                                                 )
                                             )}
                                        </View>

                                        <Text className={`font-q-medium text-sm leading-5 ${isUnlocked ? 'text-text/60' : 'text-text/30'}`}>
                                            {isUnlocked ? companion.description : `${companion.requiredStreak} days of mindfulness to unlock.`}
                                        </Text>
                                    </View>
                                </View>

                                {/* Reward Section - Beautiful Integrated Pill */}
                                {companion.id !== 'SUNNY' && (
                                    <View className={`rounded-[28px] p-5 flex-row items-center ${isUnlocked ? 'bg-secondary' : 'bg-secondary/30'}`}>
                                        <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isUnlocked ? 'bg-card' : 'bg-card/50'}`}>
                                            <Ionicons 
                                                name={isUnlocked ? "gift" : "gift-outline"} 
                                                size={22} 
                                                color={isUnlocked ? "#FF9E7D" : (isDarkMode ? "#64748B" : "#94A3B8")} 
                                            />
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className={`font-q-bold text-xs uppercase tracking-widest ${isUnlocked ? 'text-primary' : 'text-text/30'}`}>
                                                REWARD {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                            </Text>
                                            <Text className={`font-q-bold text-base mt-0.5 ${isUnlocked ? 'text-text' : 'text-text/40'}`}>
                                                {companion.unlockPerk}
                                            </Text>
                                            <Text className={`font-q-medium text-xs mt-1 leading-4 ${isUnlocked ? 'text-text/50' : 'text-text/20'}`}>
                                                {companion.unlockPerkDescription}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Progress Indicator */}
                                {!isUnlocked && (
                                    <View className="mt-6 pt-6 border-t border-primary/5">
                                        <View className="flex-row justify-between items-center mb-3">
                                            <Text className="font-q-bold text-xs text-muted/60 uppercase tracking-wider">Progress</Text>
                                            <Text className="font-q-bold text-xs text-primary">{streak}/{companion.requiredStreak} Days</Text>
                                        </View>
                                        <View className="h-2 bg-primary/10 rounded-full overflow-hidden">
                                            <View
                                                style={{ width: `${Math.min(1, streak / companion.requiredStreak) * 100}%` }}
                                                className="h-full bg-primary"
                                            />
                                        </View>
                                    </View>
                                )}
                                
                                {isUnlocked && detail?.unlockDate && (
                                    <View className="mt-6 flex-row items-center justify-center">
                                        <Ionicons name="checkmark-circle" size={14} color="#FF9E7D" />
                                        <Text className="font-q-bold text-[11px] text-primary/60 uppercase tracking-widest ml-2">
                                            Unlocked on {detail.unlockDate}
                                        </Text>
                                    </View>
                                )}
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
