import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const hours = value.getHours();
    const minutes = value.getMinutes();
    
    // 12h Logic
    const isPM = hours >= 12;
    const displayHours = hours % 12 || 12;
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

    const toggleAMPM = (pm: boolean) => {
        if (pm === isPM) return;
        let h = pm ? hours + 12 : hours - 12;
        handleUpdate(h, minutes);
    };

    return (
        <View className="w-full items-center">
            <View className="flex-row items-center justify-center">
                {/* Hours Section */}
                <View className="items-center">
                    <TouchableOpacity 
                        onPress={() => adjustHours(1)}
                        className="p-3 active:scale-125 mb-1"
                    >
                        <Ionicons name="chevron-up" size={32} color="#FF9E7D" />
                    </TouchableOpacity>
                    
                    <View className="bg-white rounded-[32px] w-[110px] h-[110px] items-center justify-center border-2 border-primary/10 shadow-sm">
                        <Text className="text-6xl font-q-bold text-text">{displayHours}</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => adjustHours(-1)}
                        className="p-3 active:scale-125 mt-1"
                    >
                        <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-2">Hour</Text>
                </View>

                {/* Colon Separator */}
                <View className="pt-2 px-2 items-center justify-center mb-8">
                    <Text className="text-5xl font-q-bold text-inactive/40">:</Text>
                </View>

                {/* Minutes Section */}
                <View className="items-center">
                    <TouchableOpacity 
                        onPress={() => adjustMinutes(5)}
                        className="p-3 active:scale-125 mb-1"
                    >
                        <Ionicons name="chevron-up" size={32} color="#FF9E7D" />
                    </TouchableOpacity>
                    
                    <View className="bg-white rounded-[32px] w-[110px] h-[110px] items-center justify-center border-2 border-primary/10 shadow-sm">
                        <Text className="text-6xl font-q-bold text-text">{displayMinutes}</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => adjustMinutes(-5)}
                        className="p-3 active:scale-125 mt-1"
                    >
                        <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-2">Minute</Text>
                </View>

                {/* AM/PM Toggle Section */}
                <View className="ml-5 h-[230px] justify-center pt-8">
                    <View className="bg-background rounded-3xl border-2 border-inactive/10 p-1.5 shadow-sm">
                        <TouchableOpacity 
                            onPress={() => toggleAMPM(false)}
                            className={`w-16 h-14 items-center justify-center rounded-2xl mb-1 ${!isPM ? 'bg-primary shadow-md' : 'bg-transparent'}`}
                        >
                            <Text className={`text-lg font-q-bold ${!isPM ? 'text-white' : 'text-text'}`}>AM</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => toggleAMPM(true)}
                            className={`w-16 h-14 items-center justify-center rounded-2xl ${isPM ? 'bg-primary shadow-md' : 'bg-transparent'}`}
                        >
                            <Text className={`text-lg font-q-bold ${isPM ? 'text-white' : 'text-text'}`}>PM</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};
