import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useAccent, ACCENT_COLORS } from '../context/AccentContext';
import { useProfile } from '../context/ProfileContext';
import * as Haptics from 'expo-haptics';

export const AccentSettingsScreen = () => {
    const navigation = useNavigation();
    const { currentAccent, setAccent } = useAccent();
    const { profile } = useProfile();
    const isGroovyUnlocked = (profile?.max_streak || 0) >= 60;

    const handleSelect = async (id: string) => {
        if (!isGroovyUnlocked) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        // @ts-ignore
        await setAccent(id);
        await Haptics.selectionAsync();
    };

    return (
        <Layout noScroll={true}>
            <View className="px-6 pt-4">
                <TopNav title="Accent Color" showBack={true} />
            </View>

            <ScrollView 
                className="flex-1 px-6 pt-6" 
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-8">
                    <Text className="text-3xl font-q-bold text-text mb-2">
                        Your Vibe.
                    </Text>
                    <Text className="text-base font-q-medium text-muted leading-6">
                        Personalize Cloudy with a color that matches your energy.
                    </Text>
                    {!isGroovyUnlocked && (
                        <View className="mt-4 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 flex-row items-center">
                            <Ionicons name="lock-closed" size={20} color="#F97316" />
                            <Text className="ml-2 text-orange-600 font-q-bold">
                                Unlock at 60 Day Streak
                            </Text>
                        </View>
                    )}
                </View>

                {/* Grid */}
                <View className="flex-row flex-wrap justify-between">
                    {Object.values(ACCENT_COLORS).map((color) => {
                        const isSelected = currentAccent.id === color.id;
                        
                        return (
                            <TouchableOpacity
                                key={color.id}
                                onPress={() => handleSelect(color.id)}
                                activeOpacity={0.8}
                                className="w-[48%] mb-4 p-4 rounded-3xl bg-card border-2 shadow-sm"
                                style={{
                                    borderColor: isSelected ? color.hex : 'transparent',
                                    shadowColor: color.hex,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 2
                                }}
                            >
                                {isSelected && (
                                    <View 
                                        style={{ 
                                            position: 'absolute', 
                                            top: 0, left: 0, right: 0, bottom: 0, 
                                            backgroundColor: `${color.hex}15`,
                                            borderRadius: 22 
                                        }} 
                                    />
                                )}
                                <View className="items-center">
                                    <View 
                                        className="w-16 h-16 rounded-full mb-3 items-center justify-center"
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={32} color="white" />
                                        )}
                                        {!isGroovyUnlocked && !isSelected && (
                                            <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.5)" />
                                        )}
                                    </View>
                                    
                                    <Text className={`text-lg font-q-bold text-center mb-1 ${isSelected ? 'text-primary' : 'text-text'}`}>
                                        {color.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </Layout>
    );
};
