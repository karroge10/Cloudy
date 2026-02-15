import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakGoalProps {
    streak: number;
    className?: string;
}

export const StreakGoal: React.FC<StreakGoalProps> = ({ streak, className }) => {
    // Determine the next milestone
    const milestones = [3, 7, 10, 14, 21, 30, 50, 75, 100, 365];
    const nextMilestone = milestones.find(m => m > streak) || milestones[milestones.length - 1];
    const progress = Math.min(streak / nextMilestone, 1);

    return (
        <View className={`bg-white/60 p-5 rounded-[24px] border border-primary/5 ${className}`}>
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                    <View className="bg-primary/10 p-2 rounded-xl mr-3">
                        <Ionicons name="trophy" size={20} color="#FF9E7D" />
                    </View>
                    <View>
                        <Text className="text-xs font-q-bold text-muted uppercase tracking-wider">Next Goal</Text>
                        <Text className="text-base font-q-bold text-text">{nextMilestone} Day Streak</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-primary font-q-bold text-lg">{nextMilestone - streak}</Text>
                    <Text className="text-[10px] font-q-bold text-muted uppercase">days left</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="h-2 w-full bg-inactive/10 rounded-full overflow-hidden">
                <View 
                    style={{ width: `${progress * 100}%` }} 
                    className="h-full bg-primary rounded-full" 
                />
            </View>
            
            <View className="flex-row justify-between mt-2">
                <Text className="text-[10px] font-q-bold text-muted">{streak} days</Text>
                <Text className="text-[10px] font-q-bold text-muted">{nextMilestone} days</Text>
            </View>
        </View>
    );
};
