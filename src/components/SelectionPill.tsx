import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { haptics } from '../utils/haptics';
// If I want icons, I might need Lucide or Ionicons. I'll stick to a simple ✓ character or install vector-icons.
// Since I installed @expo/vector-icons implicitly? No. I should verify.
// Expo includes vector icons usually.
import { Ionicons } from '@expo/vector-icons';

interface SelectionPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const SelectionPill: React.FC<SelectionPillProps> = ({ label, selected, onPress }) => {
    // Inactive: Transparent with dark grey border
    // Active: Peach (primary) with white content.

    const containerBase = "flex-row items-center justify-between px-5 py-2 rounded-full border-2 transition-all duration-200 active:scale-95 transition-transform";
    const containerSelected = "bg-primary border-primary";
    const containerInactive = "bg-card border-inactive/20";

    const textBase = "text-lg font-q-semibold"; 
    const textSelected = "text-white";
    const textInactive = "text-text";

    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            delayPressIn={0}
            className={`${containerBase} ${selected ? containerSelected : containerInactive}`}
        >
            <Text className={`${textBase} ${selected ? textSelected : textInactive} text-center`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};
