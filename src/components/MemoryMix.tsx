import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { haptics } from '../utils/haptics';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';

export const MemoryMix = () => {
    const navigation = useNavigation<any>();
    const { profile } = useProfile();
    const { isDarkMode } = useTheme();
    
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
                        navigation.navigate('Memory', { filter: 'mix' });
                    } else {
                        navigation.navigate('Progress');
                    }
                }}
                activeOpacity={0.9}
            >
                <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                        <View className="flex-row items-center mb-2">
                            <Text className="text-lg font-q-bold text-text mr-2">Chef's Special</Text>
                            {!isUnlocked && (
                                <View className="bg-inactive/10 px-2 py-0.5 rounded-full flex-row items-center">
                                    <Ionicons name="lock-closed" size={10} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                                    <Text className="text-[10px] font-q-bold text-muted ml-1 uppercase">30 Days</Text>
                                </View>
                            )}
                        </View>
                        
                        <Text className="text-base font-q-medium text-muted leading-6">
                            {isUnlocked 
                                ? "Serve up a delicious mix of your past memories." 
                                : "Cookie is preparing a special menu for 30-day masters."}
                        </Text>
                        
                        {isUnlocked && (
                            <View className="flex-row items-center mt-4">
                                <Text className="text-primary font-q-bold text-sm uppercase tracking-wider mr-1">Open Menu</Text>
                                <Ionicons name="arrow-forward" size={14} color="#FF9E7D" />
                            </View>
                        )}
                        
                        {!isUnlocked && (
                             <View className="w-full max-w-[160px] mt-4">
                                <View className="flex-row justify-between mb-2 px-1">
                                    <Text className="text-[10px] font-q-bold text-muted uppercase tracking-tight">Progress</Text>
                                    <Text className="text-[10px] font-q-bold text-primary">{Math.min(profile?.max_streak || 0, 30)} / 30</Text>
                                </View>
                                <View className="w-full h-1.5 bg-inactive/10 rounded-full overflow-hidden">
                                    <View 
                                        className="h-full bg-primary rounded-full" 
                                        style={{ width: `${Math.min(((profile?.max_streak || 0) / 30) * 100, 100)}%` }} 
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <MascotImage 
                        source={MASCOTS.CHEF} 
                        className={`w-24 h-24 ${!isUnlocked ? 'opacity-50 grayscale' : ''}`} 
                        resizeMode="contain" 
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
};
