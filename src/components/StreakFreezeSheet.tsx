import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { haptics } from '../utils/haptics';
import { useAccent } from '../context/AccentContext';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface StreakFreezeSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const StreakFreezeSheet: React.FC<StreakFreezeSheetProps> = ({ visible, onClose }) => {
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full px-6 mb-2">
                <View className="relative mb-4">
                    <MascotImage source={MASCOTS.WIZARD} className="w-32 h-32" resizeMode="contain" />
                    <View className="absolute -right-2 -top-2 bg-blue-400 rounded-full p-2 border-4 border-card shadow-sm">
                        <Ionicons name="snow" size={24} color="white" />
                    </View>
                </View>
                
                <Text className="text-xl font-q-bold text-center mb-2" style={{ color: currentAccent.hex }}>
                    {t('streakFreeze.title')}
                </Text>
                <Text className="text-base font-q-medium text-text text-center mb-8 leading-5 opacity-80">
                    {t('streakFreeze.message')}
                </Text>

                <TouchableOpacity 
                    onPress={() => {
                        haptics.selection();
                        onClose();
                    }}
                    className="w-full py-3.5 rounded-xl items-center shadow-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: currentAccent.hex }}
                >
                    <Text className="text-white font-q-bold text-lg">{t('common.keepItUp')}</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};
