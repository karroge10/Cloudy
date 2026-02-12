import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
    iconBackgroundColor = 'rgba(255, 158, 125, 0.1)', // bg-primary/10
    iconColor = '#FF9E7D' // primary
}: InfoCardProps) => {
    
    const handlePress = () => {
        if (onPress) {
            Haptics.selectionAsync();
            onPress();
        }
    };

    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container 
            onPress={handlePress}
            activeOpacity={onPress ? 0.7 : 1}
            className={`bg-white border border-primary/20 rounded-[32px] overflow-hidden ${className}`}
        >
            <View className="bg-secondary/30 p-6 flex-row items-center">
                <View 
                    style={{ backgroundColor: iconBackgroundColor }}
                    className="p-3 rounded-2xl"
                >
                     <Ionicons name={icon} size={24} color={iconColor} />
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-lg font-q-bold text-text">
                        {title}
                    </Text>
                    <Text className="text-sm font-q-medium text-muted mt-0.5 leading-5">
                        {subtitle}
                    </Text>
                </View>
                {showChevron && onPress && (
                    <Ionicons name="chevron-forward" size={20} color={iconColor} />
                )}
            </View>
        </Container>
    );
};
