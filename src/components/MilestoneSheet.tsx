import React from 'react';
import { View, Text, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { Button } from './Button';
import { haptics } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';
import { useTranslation } from 'react-i18next';

interface MilestoneSheetProps {
    visible: boolean;
    companionId: string;
    mascotAsset: ImageSourcePropType;
    onClose: () => void;
    onViewProgress: () => void;
}

export const MilestoneSheet: React.FC<MilestoneSheetProps> = ({ 
    visible, 
    companionId,
    mascotAsset,
    onClose,
    onViewProgress
}) => {
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    if (!companionId) return null;

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full px-6 mb-4">
                <View className="bg-card w-40 h-40 rounded-[40px] shadow-sm mb-6 items-center justify-center border border-secondary/20 relative">
                    <View className="absolute -top-3 -right-3 z-10 bg-secondary px-3 py-1 rounded-full shadow-sm">
                        <Text className="font-q-bold text-xs uppercase tracking-widest" style={{ color: currentAccent.hex }}>{t('common.unlocked')}</Text>
                    </View>
                    <MascotImage 
                        source={mascotAsset} 
                        className="w-32 h-32" 
                        resizeMode="contain" 
                        isAnimated
                    />
                </View>

                <Text className="text-2xl font-q-bold text-text text-center mb-1">
                    {t('progress.unlockedMascot', { name: t(`companions.${companionId}.name`) })}
                </Text>
                <Text className="text-base font-q-medium text-muted text-center mb-6 leading-5">
                    {t(`companions.${companionId}.description`)}
                </Text>

                <View className="w-full bg-secondary rounded-[28px] p-5 mb-8 flex-row items-center">
                    <View className="bg-card w-12 h-12 rounded-2xl items-center justify-center mr-4">
                        <Ionicons name="gift" size={24} color={currentAccent.hex} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] font-q-bold uppercase tracking-[2px] mb-1" style={{ color: currentAccent.hex }}>
                            {t('progress.rewardUnlocked')}
                        </Text>
                        <Text className="text-base font-q-bold text-text">
                            {t(`companions.${companionId}.perk`)}
                        </Text>
                        <Text className="text-xs font-q-medium text-text/50 leading-4 mt-0.5">
                            {t(`companions.${companionId}.perkDesc`)}
                        </Text>
                    </View>
                </View>

                <View className="w-full gap-3">
                    <Button 
                        label={t('profile.setup.seeProgress')}
                        onPress={() => {
                            haptics.selection();
                            onClose();
                            // Slight delay to allow sheet close animation before navigation
                            setTimeout(onViewProgress, 300);
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            haptics.selection();
                            onClose();
                        }}
                        className="w-full py-3 items-center active:scale-95 transition-transform"
                    >
                        <Text className="text-muted font-q-bold text-base">{t('common.continue')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheet>
    );
};
