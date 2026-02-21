import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Button } from './Button';
import { haptics } from '../utils/haptics';
import { useAnalytics } from '../hooks/useAnalytics';

import { useAccent } from '../context/AccentContext';
import { useTranslation } from 'react-i18next';

interface ReviewNudgeProps {
    visible: boolean;
    onClose: () => void;
}

export const ReviewNudge = ({ visible, onClose }: ReviewNudgeProps) => {
    const { trackEvent } = useAnalytics();
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    const handleRateNow = async () => {
        haptics.success();
        trackEvent('review_nudge_clicked_rate');
        
        try {
            if (StoreReview && await StoreReview.hasAction()) {
                await StoreReview.requestReview();
            } else {
                // console.log('StoreReview not supported or module missing');
            }
        } catch (e) {
            console.warn('StoreReview error:', e);
        }
        onClose();
    };

    const handleLater = () => {
        haptics.selection();
        trackEvent('review_nudge_clicked_later');
        onClose();
    };

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full">
                <MascotImage source={MASCOTS.STAR} className="w-40 h-40 mb-4" resizeMode="contain" />
                <Text className="text-xl font-q-bold text-center mb-1" style={{ color: currentAccent.hex }}>{t('review.delight')}</Text>
                <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">
                    {t('review.enjoyingTitle')}
                </Text>
                <Text className="text-base font-q-medium text-muted text-center mb-8 px-6 leading-5">
                    {t('review.enjoyingMessage')}
                </Text>

                <Button 
                    label={t('review.rateButton')}
                    onPress={handleRateNow}
                />

                <TouchableOpacity 
                    onPress={handleLater}
                    className="mt-4 py-2 active:scale-95 transition-transform"
                >
                    <Text className="text-muted font-q-bold text-base">{t('common.maybeLater')}</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};
