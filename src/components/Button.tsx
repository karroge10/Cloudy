import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { useAccent } from '../context/AccentContext';

interface ButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'outline' | 'danger';
    showArrow?: boolean;
    haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    showArrow = false,
    haptic = 'selection'
}) => {
    const { currentAccent } = useAccent();

    const baseClasses = "w-full py-4 min-h-[56px] rounded-full items-center justify-center flex-row shadow-sm active:scale-95 transition-transform";
    const primaryClasses = (disabled || loading) ? "bg-inactive" : "active:opacity-90"; 
    const outlineClasses = "bg-transparent border-2"; 
    const dangerClasses = (disabled || loading) ? "bg-inactive" : "bg-red-500 active:opacity-90";

    const textClasses = "text-xl font-q-bold";
    const primaryText = "text-white";
    const outlineText = ""; 
    const dangerText = "text-white";

    const handlePress = () => {
        if (haptic && haptic !== 'none') {
            switch (haptic) {
                case 'light': haptics.light(); break;
                case 'medium': haptics.medium(); break;
                case 'heavy': haptics.heavy(); break;
                case 'selection': haptics.selection(); break;
                case 'success': haptics.success(); break;
            }
        }
        if (onPress) onPress();
    };

    const dynamicStyle = variant === 'primary' && !disabled && !loading 
        ? { backgroundColor: currentAccent.hex } 
        : variant === 'outline' 
            ? { borderColor: currentAccent.hex } 
            : {};

    const dynamicTextStyle = variant === 'outline' ? { color: currentAccent.hex } : {};

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled || loading}
            className={`${baseClasses} ${variant === 'primary' ? primaryClasses : variant === 'danger' ? dangerClasses : outlineClasses}`}
            style={dynamicStyle}
        >
            <View className="w-full h-full flex-row items-center justify-center">
                <Text 
                    className={`${textClasses} ${variant === 'primary' || variant === 'danger' ? primaryText : outlineText} ${loading ? "opacity-0" : "opacity-100"}`}
                    style={dynamicTextStyle}
                >
                    {label}
                </Text>
                
                {loading && (
                    <View className="absolute inset-0 items-center justify-center">
                        <ActivityIndicator 
                            color={variant === 'primary' ? 'white' : currentAccent.hex} 
                            size="small" 
                            className="scale-125" 
                        />
                    </View>
                )}

                {!loading && showArrow && (
                    <View className="absolute right-6">
                        <Ionicons name="arrow-forward" size={28} color={variant === 'primary' || variant === 'danger' ? 'white' : currentAccent.hex} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};
