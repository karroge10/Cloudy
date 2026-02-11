import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
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
    // Inactive: Transparent with dark grey border (maybe #E0E0E0 is too light, let's use slightly darker gray-300 or reuse inactive color).
    // Active: Peach (primary) with white content.

    const containerBase = "flex-row items-center px-4 py-3 rounded-full border-2 transition-all duration-200";
    const containerSelected = "bg-primary border-primary";
    const containerInactive = "bg-transparent border-gray-300";

    const textBase = "text-base font-medium font-sans ml-2";
    const textSelected = "text-white";
    const textInactive = "text-text";

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className={`${containerBase} ${selected ? containerSelected : containerInactive}`}
        >
            {selected && (
                <Ionicons name="checkmark" size={20} color="white" />
            )}
            <Text className={`${textBase} ${selected ? textSelected : textInactive}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};
