import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'outline';
    showArrow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    disabled = false,
    variant = 'primary',
    showArrow = false
}) => {
    const baseClasses = "w-full py-5 rounded-full items-center justify-center flex-row shadow-sm";
    const primaryClasses = disabled ? "bg-inactive" : "bg-primary active:opacity-90";
    const outlineClasses = "bg-transparent border-2 border-primary"; 

    const textClasses = "text-2xl font-q-bold";
    const primaryText = "text-white";
    const outlineText = "text-primary";

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`${baseClasses} ${variant === 'primary' ? primaryClasses : outlineClasses}`}
        >
            <Text className={`${textClasses} ${variant === 'primary' ? primaryText : outlineText}`}>
                {label}
            </Text>
            {showArrow && (
                <View className="ml-2 absolute right-8">
                    <Ionicons name="arrow-forward" size={28} color={variant === 'primary' ? 'white' : '#FF9E7D'} />
                </View>
            )}
        </TouchableOpacity>
    );
};
