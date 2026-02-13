import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';

interface ButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'outline';
    showArrow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    showArrow = false
}) => {
    const baseClasses = "w-full py-4 min-h-[56px] rounded-full items-center justify-center flex-row shadow-sm";
    const primaryClasses = (disabled || loading) ? "bg-inactive" : "bg-primary active:opacity-90";
    const outlineClasses = "bg-transparent border-2 border-primary"; 

    const textClasses = "text-2xl font-q-bold";
    const primaryText = "text-white";
    const outlineText = "text-primary";

    const handlePress = () => {
        haptics.medium();
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled || loading}
            className={`${baseClasses} ${variant === 'primary' ? primaryClasses : outlineClasses}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#FF9E7D'} size="small" className="scale-125" />
            ) : (
                <>
                    <Text className={`${textClasses} ${variant === 'primary' ? primaryText : outlineText}`}>
                        {label}
                    </Text>
                    {showArrow && (
                        <View className="ml-2 absolute right-8">
                            <Ionicons name="arrow-forward" size={28} color={variant === 'primary' ? 'white' : '#FF9E7D'} />
                        </View>
                    )}
                </>
            )}
        </TouchableOpacity>
    );
};
