import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANIONS } from '../constants/Companions';
import { MASCOTS } from '../constants/Assets';
import { MascotImage } from './MascotImage';
import { haptics } from '../utils/haptics';
import { Skeleton } from './Skeleton';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

import { useAccent } from '../context/AccentContext';

interface StreakGoalProps {
    streak: number;
    maxStreak?: number;
    className?: string;
    onPress?: () => void;
    isLoading?: boolean;
}

export const StreakGoal: React.FC<StreakGoalProps> = ({ streak, maxStreak = 0, className, onPress, isLoading }) => {
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();
    const progressValue = useSharedValue(0);

    const handlePress = () => {
        if (onPress && !isLoading) {
            haptics.selection();
            onPress();
        }
    };

    // Determine the next companion reward
    // Skip companions that have already been unlocked via maxStreak
    const nextCompanion = COMPANIONS.find(c => c.requiredStreak > Math.max(streak, maxStreak || 0));

    // Fallback to standard milestones if all companions are unlocked
    const milestones = [3, 7, 10, 14, 21, 30, 50, 75, 100, 365];
    const effectiveStreak = Math.max(streak, maxStreak || 0);
    const nextMilestoneValue = nextCompanion ? nextCompanion.requiredStreak : (milestones.find(m => m > effectiveStreak) || milestones[milestones.length - 1]);

    // Progress calculation remains based on CURRENT streak because you have to climb back up
    const targetProgress = Math.min(streak / nextMilestoneValue, 1);
    const daysLeft = nextMilestoneValue - streak;

    useEffect(() => {
        progressValue.value = withTiming(targetProgress, { duration: 800 });
    }, [targetProgress]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`
    }));

    // If all companions are unlocked and we're not loading, hide the milestone card
    if (!nextCompanion && !isLoading) {
        return null;
    }

    const containerClasses = `bg-card p-5 rounded-[32px] border border-inactive/10 ${className}`;

    // Helper for faint background
    const accentFaint = { backgroundColor: `${currentAccent.hex}1A` }; // ~10% opacity

    return (
        <View style={{
            shadowColor: isDarkMode ? '#000' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.3 : 0.05,
            shadowRadius: 12,
            elevation: 3
        }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={onPress && !isLoading ? 0.8 : 1}
                disabled={isLoading}
                className={containerClasses}
            >
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center flex-1">
                        <View className="p-2.5 rounded-2xl mr-3" style={accentFaint}>
                            {isLoading ? (
                                <Skeleton width={32} height={32} borderRadius={8} />
                            ) : nextCompanion ? (
                                <View className="items-center justify-center">
                                    <MascotImage source={nextCompanion.asset} className="w-8 h-8 grayscale opacity-50" resizeMode="contain" />
                                    <View className="absolute bg-card rounded-full p-0.5 border border-inactive/20">
                                        <Ionicons name="lock-closed" size={8} color={isDarkMode ? "#E5E7EB" : "#94A3B8"} />
                                    </View>
                                </View>
                            ) : (
                                <MascotImage source={MASCOTS.STAR} className="w-8 h-8" resizeMode="contain" />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] font-q-bold text-muted uppercase tracking-wider mb-0.5">
                                {isLoading ? (
                                    <Skeleton width={60} height={10} borderRadius={2} />
                                ) : (
                                    'Next Milestone'
                                )}
                            </Text>
                            <View className="h-Auto justify-center">
                                {isLoading ? (
                                    <Skeleton width={120} height={18} borderRadius={4} />
                                ) : (
                                    <View>
                                        <Text className="text-lg font-q-bold text-text leading-6" numberOfLines={1}>
                                            {nextCompanion ? (
                                                (maxStreak >= nextCompanion.requiredStreak) ? `Reach ${nextCompanion.name}` : `Unlock ${nextCompanion.name}`
                                            ) : `${nextMilestoneValue} Day Streak`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View className="items-end ml-4">
                        {isLoading ? (
                            <>
                                <Skeleton width={30} height={28} borderRadius={4} style={{ marginBottom: 4 }} />
                                <Skeleton width={45} height={10} borderRadius={2} />
                            </>
                        ) : (
                            <>
                                <Text className="font-q-bold text-2xl leading-7" style={{ color: currentAccent.hex }}>{daysLeft}</Text>
                                <Text className="text-[10px] font-q-bold text-muted uppercase">days left</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Progress Bar */}
                <View className="h-3 w-full bg-inactive/40 rounded-full overflow-hidden">
                    <Animated.View
                        style={[animatedProgressStyle, { backgroundColor: currentAccent.hex }]}
                        className="h-full rounded-full"
                    />
                </View>

                <View className="flex-row justify-between mt-2.5">
                    <View className="flex-row items-center">
                        {isLoading ? (
                            <Skeleton width={6} height={6} borderRadius={3} style={{ marginRight: 6 }} />
                        ) : (
                            <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: currentAccent.hex }} />
                        )}
                        {isLoading ? (
                            <Skeleton width={70} height={12} borderRadius={2} />
                        ) : (
                            <Text className="text-[11px] font-q-bold text-muted">{streak} days active</Text>
                        )}
                    </View>
                    {isLoading ? (
                        <Skeleton width={60} height={12} borderRadius={2} />
                    ) : (
                        <Text className="text-[11px] font-q-bold text-muted">{nextMilestoneValue} days goal</Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};


