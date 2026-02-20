import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { haptics } from '../utils/haptics';
import { useAccent } from '../context/AccentContext';

interface SelectionPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const SelectionPill: React.FC<SelectionPillProps> = ({ label, selected, onPress }) => {
    const { currentAccent } = useAccent();

    const containerBase = "flex-row items-center justify-between px-5 py-2 rounded-full border-2 transition-all duration-200 active:scale-95 transition-transform";
    // We remove bg-primary and border-primary from here to use inline styles
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
            className={`${containerBase} ${selected ? '' : containerInactive}`}
            style={selected ? { backgroundColor: currentAccent.hex, borderColor: currentAccent.hex } : {}}
        >
            <Text className={`${textBase} ${selected ? textSelected : textInactive} text-center`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};
