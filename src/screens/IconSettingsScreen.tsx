import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useProfile } from '../context/ProfileContext';
import { useIcon, IconId } from '../context/IconContext';
import { haptics } from '../utils/haptics';
import { MASCOTS } from '../constants/Assets';
import { COMPANIONS } from '../constants/Companions';
import { MascotImage } from '../components/MascotImage';

export const IconSettingsScreen = () => {
    const navigation = useNavigation();
    const { profile } = useProfile();
    const { currentIcon, setIcon } = useIcon();
    
    const maxStreak = profile?.max_streak || 0;
    const isFeatureUnlocked = maxStreak >= 60; // Gated by Groovy's perk

    const handleSelectIcon = async (iconId: IconId) => {
        if (!isFeatureUnlocked && iconId !== 'DEFAULT') {
            haptics.error();
            return;
        }
        
        const success = await setIcon(iconId);
        if (success) {
            haptics.success();
        } else {
            haptics.error();
        }
    };

    const IconOption = ({ id, name, description, unlocked, asset, isCustom }: { id: IconId, name: string, description: string, unlocked: boolean, asset?: any, isCustom: boolean }) => (
        <TouchableOpacity 
            onPress={() => handleSelectIcon(id)}
            disabled={!unlocked && isCustom}
            className={`flex-row items-center p-6 bg-card rounded-[32px] mb-4 border-2 ${currentIcon === id ? 'border-primary' : 'border-transparent'} ${!unlocked && isCustom ? 'opacity-60' : ''}`}
        >
            <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-4 ${id === 'DEFAULT' ? 'bg-primary/10' : 'bg-inactive/5'}`}>
                {id === 'DEFAULT' ? (
                   <Ionicons name="apps-outline" size={32} color="#FF9E7D" />
                ) : (
                    <MascotImage source={asset} className="w-12 h-12" resizeMode="contain" />
                )}
            </View>
            <View className="flex-1">
                <Text className="text-lg font-q-bold text-text">{name}</Text>
                <Text className="text-muted font-q-medium text-xs leading-4">{description}</Text>
            </View>
            <View className="ml-2 w-8 items-center justify-center">
                {currentIcon === id ? (
                    <Ionicons name="checkmark-circle" size={28} color="#FF9E7D" />
                ) : (!unlocked && isCustom) ? (
                    <Ionicons name="lock-closed" size={20} color="#94A3B8" />
                ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-inactive/20" />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <Layout noScroll={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="App Icons" showBack={true} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}
            >
                <View className="mb-10 items-center">
                    <View className="bg-primary/5 p-6 rounded-[40px] mb-6">
                        <MascotImage source={MASCOTS.ROCK} className="w-32 h-32" resizeMode="contain" />
                    </View>
                    <Text className="text-2xl font-q-bold text-text text-center">Home Screen Style</Text>
                    <Text className="text-base font-q-medium text-muted text-center mt-2 px-4 leading-5">
                        {isFeatureUnlocked 
                            ? "Choose your favorite companion to guide you from the home screen."
                            : "Customize how Cloudy looks on your device by reaching a 60-day streak."
                        }
                    </Text>
                </View>

                <IconOption 
                    id="DEFAULT" 
                    name="Classic Cloudy" 
                    description="The original sky-blue breeze" 
                    unlocked={true} 
                    isCustom={false}
                />

                <View className="py-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">Unlocked Companions</Text>
                    {COMPANIONS.map((companion) => {
                        const isUnlocked = maxStreak >= companion.requiredStreak;
                        return (
                            <IconOption 
                                key={companion.id}
                                id={companion.id as IconId}
                                name={companion.name}
                                description={isUnlocked ? companion.trait : `Unlock on day ${companion.requiredStreak}`}
                                unlocked={isUnlocked && isFeatureUnlocked}
                                asset={companion.asset}
                                isCustom={true}
                            />
                        );
                    })}
                </View>

                {!isFeatureUnlocked && (
                    <View className="mt-4 bg-card p-6 rounded-[32px] border-2 border-primary/10">
                        <View className="flex-row items-center justify-center mb-2">
                            <Ionicons name="trending-up" size={20} color="#FF9E7D" className="mr-2" />
                            <Text className="text-lg font-q-bold text-text">Keep Growing</Text>
                        </View>
                        <Text className="text-muted font-q-medium text-center leading-5 px-4">
                            You're currently at a <Text className="text-primary font-q-bold">{maxStreak} day</Text> max streak. Complete {60 - maxStreak} more days to unlock mascot icons!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </Layout>
    );
};

