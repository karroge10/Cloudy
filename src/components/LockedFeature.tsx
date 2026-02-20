import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { haptics } from '../utils/haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';

interface LockedFeatureProps {
    featureName: string;
    requiredStreak: number;
    currentStreak: number;
    icon?: keyof typeof Ionicons.glyphMap;
    mascotAsset?: any;
}

export const LockedFeature = ({ 
    featureName, 
    requiredStreak, 
    currentStreak,
    icon = "lock-closed",
    mascotAsset = MASCOTS.CHEF 
}: LockedFeatureProps) => {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();

    return (
        <View className="bg-card rounded-[32px] p-8 shadow-xl mb-8 items-center border-2 border-dashed border-inactive/20"
            style={{ shadowColor: isDarkMode ? '#000' : '#0000000D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
            
            <View className="p-4 rounded-full mb-6" style={{ backgroundColor: `${currentAccent.hex}1A` }}>
                <Ionicons name={icon} size={32} color={currentAccent.hex} />
            </View>

            <MascotImage 
                source={mascotAsset} 
                className="w-40 h-40 mb-4 opacity-50" 
                resizeMode="contain" 
            />

            <Text className="text-2xl font-q-bold text-text text-center mb-2">
                {featureName} Locked
            </Text>
            
            <Text className="text-base font-q-medium text-muted text-center mb-8 px-4">
                Unlock this feature by reaching a {requiredStreak}-day streak once. You're at {currentStreak} days!
            </Text>

            <TouchableOpacity 
                onPress={() => {
                    haptics.selection();
                    navigation.navigate('Progress');
                }}
                className="px-8 py-4 rounded-[20px] active:scale-95 transition-transform"
                style={{ backgroundColor: currentAccent.hex }}
            >
                <Text className="text-white font-q-bold text-lg">See Progress</Text>
            </TouchableOpacity>
        </View>
    );
};
