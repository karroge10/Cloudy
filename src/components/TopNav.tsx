import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface TopNavProps {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    centerContent?: React.ReactNode;
    roundButtons?: boolean;
}

export const TopNav = ({ title, subtitle, showBack = true, onBack, rightElement, centerContent, roundButtons = false }: TopNavProps) => {
    const navigation = useNavigation();


    return (
        <View className="flex-row items-center justify-between mb-4 min-h-[48px] w-full">
            <View className="w-12 items-start">
                {showBack && (
                    <TouchableOpacity 
                        onPress={onBack || (() => navigation.goBack())} 
                        className="p-2 -ml-2 items-center justify-center w-12 h-12"
                    >
                        <Ionicons 
                            name={roundButtons ? "close" : "arrow-back"} 
                            size={28} 
                            color="#333333" 
                        />
                    </TouchableOpacity>
                )}

            </View>

            
            <View className="flex-1 items-center px-1">
                {centerContent ? centerContent : (
                    <View className="items-center">
                        {subtitle && (
                            <Text className="text-[10px] font-q-bold text-muted tracking-[2px] uppercase mb-0.5">
                                {subtitle}
                            </Text>
                        )}
                        {title && (
                            <Text 
                                className={`font-q-bold text-text text-center ${subtitle ? 'text-2xl' : 'text-3xl'}`}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        )}

                    </View>
                )}
            </View>


            
            <View className="w-12 items-end">
                {rightElement || <View className="w-12" />}
            </View>
        </View>
    );
};

