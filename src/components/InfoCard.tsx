import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { useAccent } from '../context/AccentContext';

interface InfoCardProps {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    className?: string;
    showChevron?: boolean;
    iconBackgroundColor?: string;
    iconColor?: string;
}

export const InfoCard = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    className = '', 
    showChevron = true,
    iconBackgroundColor,
    iconColor
}: InfoCardProps) => {
    const { currentAccent } = useAccent();

    const finalIconBackgroundColor = iconBackgroundColor || `${currentAccent.hex}1A`; // 10% opacity
    const finalIconColor = iconColor || currentAccent.hex;
    
    const handlePress = () => {
        if (onPress) {
            haptics.selection();
            onPress();
        }
    };

    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container 
            onPress={handlePress}
            activeOpacity={onPress ? 0.7 : 1}
            className={`bg-card border rounded-[32px] overflow-hidden ${className}`}
            style={{ 
                borderColor: `${currentAccent.hex}33`, // 20% opacity
            }}
        >
            <View className="p-6 flex-row items-center" style={{ backgroundColor: `${currentAccent.hex}0D` }}>
                <View 
                    className="p-3 rounded-2xl items-center justify-center w-12 h-12"
                    style={{ backgroundColor: finalIconBackgroundColor }}
                >
                     <Ionicons name={icon} size={24} color={finalIconColor} />
                </View>
                <View className="ml-4 flex-1 justify-center">
                    <Text className="text-lg font-q-bold text-text mb-0.5">
                        {title}
                    </Text>
                    <Text className="text-sm font-q-medium text-muted leading-4">
                        {subtitle}
                    </Text>
                </View>
                {showChevron && onPress && (
                    <View className="flex justify-center ml-2">
                        <Ionicons name="chevron-forward" size={20} color={finalIconColor} />
                    </View>
                )}
            </View>
        </Container>
    );
};
