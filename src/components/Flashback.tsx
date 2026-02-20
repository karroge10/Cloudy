import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { useAccent } from '../context/AccentContext';

export const Flashback = () => {
    const navigation = useNavigation<any>();
    const { profile } = useProfile();
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();
    
    // Cookie unlocks at 30 days
    const isUnlocked = (profile?.max_streak || 0) >= 30;

    return (
        <View className="mb-8">
            <TouchableOpacity 
                className="bg-card rounded-[32px] p-6 shadow-xl border border-inactive/5 overflow-hidden"
                style={{ 
                    shadowColor: isDarkMode ? '#000' : '#0000000D', 
                    shadowOffset: { width: 0, height: 0 }, 
                    shadowOpacity: 1, 
                    shadowRadius: 15, 
                    elevation: 4 
                }}
                onPress={() => { 
                    haptics.selection(); 
                    if (isUnlocked) {
                        navigation.navigate('Flashback');
                    } else {
                        navigation.navigate('Progress');
                    }
                }}
                activeOpacity={0.9}
            >
                {isUnlocked ? (
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center mb-2">
                                <Text className="text-lg font-q-bold text-text mr-2">Flashback</Text>
                            </View>
                            
                            <Text className="text-base font-q-medium text-muted leading-6">
                                A curated blend of your past, served daily.
                            </Text>
                            
                            <View className="flex-row items-center mt-4">
                                <Text className="font-q-bold text-sm uppercase tracking-wider mr-1" style={{ color: currentAccent.hex }}>Enter Mix</Text>
                                <Ionicons name="arrow-forward" size={14} color={currentAccent.hex} />
                            </View>
                        </View>
                        
                        <MascotImage 
                            source={MASCOTS.CHEF} 
                            className="w-24 h-24" 
                            resizeMode="contain" 
                        />
                    </View>
                ) : (
                    <View className="items-center py-2 pb-6">
                        <View className="flex-row justify-between items-center w-full mb-6">
                            <Text className="text-lg font-q-bold text-text">Flashback</Text>
                            <View className="bg-inactive/10 px-3 py-1 rounded-full flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                                <Text className="text-[10px] font-q-bold text-muted ml-1 uppercase">Locked</Text>
                            </View>
                        </View>

                        <View className="bg-inactive/5 p-4 rounded-3xl mb-4 relative">
                            <MascotImage 
                                source={MASCOTS.CHEF} 
                                className="w-16 h-16 opacity-50 grayscale" 
                                resizeMode="contain" 
                            />
                            <View className="absolute -right-2 -top-2 bg-card rounded-full p-1.5 border border-inactive/10">
                                <Ionicons name="lock-closed" size={14} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                            </View>
                        </View>
                        
                        <Text className="text-base font-q-bold text-text mb-2 text-center px-6">
                            Reach 30 day streak to unlock.
                        </Text>
                        
                        <View className="w-full max-w-[220px] mb-6">
                            <View className="flex-row justify-between mb-2 px-1">
                                <Text className="text-[10px] font-q-bold text-muted uppercase tracking-tight">Progress</Text>
                                <Text className="text-[10px] font-q-bold font-q-bold" style={{ color: currentAccent.hex }}>{Math.min(profile?.max_streak || 0, 30)} / 30 days</Text>
                            </View>
                            <View className="w-full h-2 bg-inactive/10 rounded-full overflow-hidden">
                                <View 
                                    className="h-full rounded-full" 
                                    style={{ 
                                        width: `${Math.min(((profile?.max_streak || 0) / 30) * 100, 100)}%`,
                                        backgroundColor: currentAccent.hex
                                    }} 
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="text-[11px] font-q-bold uppercase tracking-[0.15em]" style={{ color: currentAccent.hex }}>Track Progress</Text>
                            <Ionicons name="chevron-forward" size={12} color={currentAccent.hex} style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};
