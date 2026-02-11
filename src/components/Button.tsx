import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface ButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    disabled = false,
    variant = 'primary'
}) => {
    const baseClasses = "w-full py-4 rounded-full items-center justify-center flex-row shadow-sm";
    const primaryClasses = disabled ? "bg-inactive" : "bg-primary active:opacity-90";
    const outlineClasses = "bg-transparent border-2 border-primary"; // Or border-inactive?

    const textClasses = "text-lg font-bold font-sans";
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
        </TouchableOpacity>
    );
};
