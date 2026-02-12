import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const hours = value.getHours();
    const minutes = value.getMinutes();
    
    // 24h Logic
    const displayHours = hours.toString().padStart(2, '0');
    const displayMinutes = minutes.toString().padStart(2, '0');

    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleUpdate = (newHours: number, newMinutes: number) => {
        const next = new Date(value);
        next.setHours(newHours);
        next.setMinutes(newMinutes);
        onChange(next);
        triggerHaptic();
    };

    const adjustHours = (delta: number) => {
        let h = (hours + delta + 24) % 24;
        handleUpdate(h, minutes);
    };

    const adjustMinutes = (delta: number) => {
        let m = (minutes + delta + 60) % 60;
        handleUpdate(hours, m);
    };

    return (
        <View className="w-full items-center">
            <View className="flex-row items-center justify-center">
                {/* Hours Section */}
                <View className="items-center">
                    <TouchableOpacity 
                        onPress={() => adjustHours(1)}
                        className="p-1.5 active:scale-125 mb-1"
                    >
                        <Ionicons name="chevron-up" size={24} color="#333333" />
                    </TouchableOpacity>
                    
                    <View className="bg-white rounded-[24px] w-[80px] h-[80px] items-center justify-center border-2 border-primary/10 shadow-sm">
                        <Text className="text-4xl font-q-bold text-text">{displayHours}</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => adjustHours(-1)}
                        className="p-1.5 active:scale-125 mt-1"
                    >
                        <Ionicons name="chevron-down" size={24} color="#333333" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-0.5">Hour</Text>
                </View>

                {/* Colon Separator */}
                <View className="px-2 items-center justify-center mb-6">
                    <Text className="text-3xl font-q-bold text-inactive/40">:</Text>
                </View>

                {/* Minutes Section */}
                <View className="items-center">
                    <TouchableOpacity 
                        onPress={() => adjustMinutes(1)}
                        className="p-1.5 active:scale-125 mb-1"
                    >
                        <Ionicons name="chevron-up" size={24} color="#333333" />
                    </TouchableOpacity>
                    
                    <View className="bg-white rounded-[24px] w-[80px] h-[80px] items-center justify-center border-2 border-primary/10 shadow-sm">
                        <Text className="text-4xl font-q-bold text-text">{displayMinutes}</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => adjustMinutes(-1)}
                        className="p-1.5 active:scale-125 mt-1"
                    >
                        <Ionicons name="chevron-down" size={24} color="#333333" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-0.5">Min</Text>
                </View>
            </View>
        </View>
    );
};
