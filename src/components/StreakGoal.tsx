import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANIONS } from '../constants/Companions';
import { MascotImage } from './MascotImage';
import { haptics } from '../utils/haptics';
import { Skeleton } from './Skeleton';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

interface StreakGoalProps {
    streak: number;
    className?: string;
    onPress?: () => void;
    isLoading?: boolean;
}

export const StreakGoal: React.FC<StreakGoalProps> = ({ streak, className, onPress, isLoading }) => {
    const progressValue = useSharedValue(0);

    const handlePress = () => {
        if (onPress && !isLoading) {
            haptics.selection();
            onPress();
        }
    };

    // Determine the next companion reward
    const nextCompanion = COMPANIONS.find(c => c.requiredStreak > streak);
    
    // Fallback to standard milestones if all companions are unlocked
    const milestones = [3, 7, 10, 14, 21, 30, 50, 75, 100, 365];
    const nextMilestoneValue = nextCompanion ? nextCompanion.requiredStreak : (milestones.find(m => m > streak) || milestones[milestones.length - 1]);
    
    const targetProgress = isLoading ? 0 : Math.min(streak / nextMilestoneValue, 1);
    const daysLeft = nextMilestoneValue - streak;

    useEffect(() => {
        progressValue.value = withTiming(targetProgress, { duration: 800 });
    }, [targetProgress]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`
    }));

    const containerClasses = `bg-white p-5 rounded-[32px] border border-primary/10 shadow-sm ${className}`;

    return (
        <View style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
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
                    <View className="bg-primary/10 p-2.5 rounded-2xl mr-3">
                        {isLoading ? (
                            <Skeleton width={32} height={32} borderRadius={8} />
                        ) : nextCompanion ? (
                            <MascotImage source={nextCompanion.asset} className="w-8 h-8" resizeMode="contain" />
                        ) : (
                            <Ionicons name="trophy" size={24} color="#FF9E7D" />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-q-bold text-muted uppercase tracking-wider mb-0.5">
                            {isLoading ? (
                                <Skeleton width={60} height={10} borderRadius={2} />
                            ) : (
                                nextCompanion ? 'Next Companion' : 'Next Milestone'
                            )}
                        </Text>
                        <View className="h-6 justify-center">
                            {isLoading ? (
                                <Skeleton width={120} height={18} borderRadius={4} />
                            ) : (
                                <Text className="text-lg font-q-bold text-text leading-6" numberOfLines={1}>
                                    {nextCompanion ? `Unlock ${nextCompanion.name}` : `${nextMilestoneValue} Day Streak`}
                                </Text>
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
                            <Text className="text-primary font-q-bold text-2xl leading-7">{daysLeft}</Text>
                            <Text className="text-[10px] font-q-bold text-muted uppercase">days left</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 w-full bg-inactive/10 rounded-full overflow-hidden">
                <Animated.View 
                    style={animatedProgressStyle} 
                    className="h-full bg-primary rounded-full" 
                />
            </View>
            
            <View className="flex-row justify-between mt-2.5">
                <View className="flex-row items-center">
                    {isLoading ? (
                        <Skeleton width={6} height={6} borderRadius={3} style={{ marginRight: 6 }} />
                    ) : (
                        <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
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


