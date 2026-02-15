import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANIONS } from '../constants/Companions';
import { MascotImage } from './MascotImage';

interface StreakGoalProps {
    streak: number;
    className?: string;
}

export const StreakGoal: React.FC<StreakGoalProps> = ({ streak, className }) => {
    // Determine the next companion reward
    const nextCompanion = COMPANIONS.find(c => c.requiredStreak > streak);
    
    // Fallback to standard milestones if all companions are unlocked
    const milestones = [3, 7, 10, 14, 21, 30, 50, 75, 100, 365];
    const nextMilestoneValue = nextCompanion ? nextCompanion.requiredStreak : (milestones.find(m => m > streak) || milestones[milestones.length - 1]);
    
    const progress = Math.min(streak / nextMilestoneValue, 1);
    const daysLeft = nextMilestoneValue - streak;

    return (
        <View className={`bg-white/60 p-5 rounded-[24px] border border-primary/5 ${className}`}>
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center flex-1">
                    <View className="bg-primary/10 p-2.5 rounded-2xl mr-3">
                        {nextCompanion ? (
                            <MascotImage source={nextCompanion.asset} className="w-8 h-8" resizeMode="contain" />
                        ) : (
                            <Ionicons name="trophy" size={24} color="#FF9E7D" />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-q-bold text-muted uppercase tracking-wider mb-0.5">
                            {nextCompanion ? 'Next Companion' : 'Next Milestone'}
                        </Text>
                        <Text className="text-lg font-q-bold text-text leading-6" numberOfLines={1}>
                            {nextCompanion ? `Unlock ${nextCompanion.name}` : `${nextMilestoneValue} Day Streak`}
                        </Text>
                    </View>
                </View>
                <View className="items-end ml-4">
                    <Text className="text-primary font-q-bold text-2xl leading-7">{daysLeft}</Text>
                    <Text className="text-[10px] font-q-bold text-muted uppercase">days left</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 w-full bg-inactive/10 rounded-full overflow-hidden">
                <View 
                    style={{ width: `${progress * 100}%` }} 
                    className="h-full bg-primary rounded-full" 
                />
            </View>
            
            <View className="flex-row justify-between mt-2.5">
                <View className="flex-row items-center">
                    <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                    <Text className="text-[11px] font-q-bold text-muted">{streak} days active</Text>
                </View>
                <Text className="text-[11px] font-q-bold text-muted">{nextMilestoneValue} days goal</Text>
            </View>
        </View>
    );
};
