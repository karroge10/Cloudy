import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { haptics } from '../utils/haptics';
import { useAccent } from '../context/AccentContext';

interface StreakLostSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const StreakLostSheet: React.FC<StreakLostSheetProps> = ({ visible, onClose }) => {
    const { currentAccent } = useAccent();

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full px-6 mb-2">
                <MascotImage source={MASCOTS.HUG} className="w-32 h-32 mb-4" resizeMode="contain" />
                <Text className="text-xl font-q-bold text-center mb-2" style={{ color: currentAccent.hex }}>
                    Don't sweat it!
                </Text>
                <Text className="text-base font-q-medium text-text text-center mb-8 leading-5 opacity-80">
                    You missed a day, but that's just part of the journey. Let's start a fresh streak today!
                </Text>

                <TouchableOpacity 
                    onPress={() => {
                        haptics.selection();
                        onClose();
                    }}
                    className="w-full py-3.5 rounded-xl items-center shadow-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: currentAccent.hex }}
                >
                    <Text className="text-white font-q-bold text-lg">Let's Go</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};
