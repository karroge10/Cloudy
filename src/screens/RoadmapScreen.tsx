import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { MASCOTS } from '../constants/Assets';
import { COMPANIONS } from '../constants/Companions';
import { MascotImage } from '../components/MascotImage';
import { useJournal } from '../context/JournalContext';
import { Button } from '../components/Button';
import { haptics } from '../utils/haptics';

export const RoadmapScreen = () => {
    const navigation = useNavigation();
    const { streak } = useJournal();

    // Logic for Level tied to milestones
    const unlockedCompanions = COMPANIONS.filter(c => streak >= c.requiredStreak);
    const currentLevel = unlockedCompanions.length;
    
    // Find next companion for "days until" message
    const nextCompanion = COMPANIONS.find(c => streak < c.requiredStreak);
    const daysUntilNextLevel = nextCompanion ? nextCompanion.requiredStreak - streak : null;

    return (
        <Layout noScroll={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav 
                    title="Path of the Mind" 
                    onBack={() => navigation.goBack()}
                    roundButtons={true}
                />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            >
                {/* Header Section */}
                <View className="items-center mt-4 mb-10">
                    <View className="bg-primary/10 p-6 rounded-[40px] mb-4">
                        <MascotImage source={MASCOTS.STREAK} className="w-32 h-32" resizeMode="contain" />
                    </View>
                    <Text className="text-3xl font-q-bold text-text mb-2">Level {currentLevel}</Text>
                    <View className="bg-white px-6 py-2.5 rounded-2xl shadow-sm border border-primary/5">
                        <Text className="text-primary font-q-bold text-base">
                            {streak} Day Streak
                        </Text>
                    </View>
                    {daysUntilNextLevel !== null && (
                        <Text className="text-muted font-q-bold text-[10px] uppercase tracking-[3px] mt-6">
                            Next Reward in {daysUntilNextLevel} {daysUntilNextLevel === 1 ? 'day' : 'days'}
                        </Text>
                    )}
                </View>

                {/* Harmonized Info Card */}
                <View className="bg-card/50 rounded-[32px] p-6 mb-12 border border-primary/5">
                    <Text className="text-lg font-q-bold text-text mb-2">Evolving with Cloudy</Text>
                    <Text className="text-sm font-q-medium text-muted leading-5">
                        As you cultivate your daily habit, you level up and unlock new companions. Each friend represents a milestone in your mental growth.
                    </Text>
                </View>

                {/* Rewards List */}
                <View style={{ gap: 24 }}>
                    {COMPANIONS.map((companion, index) => {
                        const isUnlocked = streak >= companion.requiredStreak;
                        const isNext = streak < companion.requiredStreak && (index === 0 || streak >= COMPANIONS[index-1].requiredStreak);
                        
                        return (
                            <View 
                                key={companion.id} 
                                className={`flex-row items-center p-6 rounded-[32px] border ${
                                    isUnlocked 
                                        ? 'bg-white border-primary/10 shadow-sm' 
                                        : 'bg-inactive/5 border-transparent'
                                }`}
                            >
                                <View className={`p-4 rounded-2xl mr-5 ${isUnlocked ? 'bg-secondary/30' : 'bg-transparent'}`}>
                                    <MascotImage 
                                        source={companion.asset} 
                                        className={`w-14 h-14 ${isUnlocked ? '' : 'grayscale opacity-20'}`} 
                                        resizeMode="contain" 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={`font-q-bold text-xl ${isUnlocked ? 'text-text' : 'text-muted/60'}`}>
                                        {isUnlocked ? companion.name : 'Unknown Friend'}
                                    </Text>
                                    <View className="flex-row items-center mt-1.5">
                                        {isUnlocked ? (
                                            <Ionicons name="checkmark-circle" size={16} color="#FF9E7D" />
                                        ) : (
                                            <Ionicons name="lock-closed" size={16} color="#CBD5E1" />
                                        )}
                                        <Text className={`font-q-bold text-xs ml-2 ${isUnlocked ? 'text-primary' : 'text-muted/40'}`}>
                                            {isUnlocked ? 'Unlocked' : `${companion.requiredStreak} Days of Reflection`}
                                        </Text>
                                    </View>
                                </View>
                                
                                {isNext && (
                                    <View className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                        <Text className="text-primary font-q-bold text-[10px] uppercase tracking-wider">Goal</Text>
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
