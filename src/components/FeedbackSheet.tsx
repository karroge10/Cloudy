import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Button } from './Button';
import { haptics } from '../utils/haptics';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';

interface FeedbackSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const FeedbackSheet = ({ visible, onClose }: FeedbackSheetProps) => {
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { trackEvent } = useAnalytics();
    const { showAlert } = useAlert();
    const { t } = useTranslation();

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            showAlert(t('feedback.waitTitle'), t('feedback.waitMessage'), [{ text: t('common.okay') }], 'info');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('feedbacks')
                .insert([
                    {
                        message: feedback.trim(),
                        email: email.trim() || null,
                        user_id: user?.id || null,
                    }
                ]);

            if (error) throw error;

            trackEvent('cloudy_whisper_feedback_sent', {
                has_email: !!email.trim(),
                is_authenticated: !!user,
            });

            haptics.success();
            setFeedback('');
            setEmail('');
            onClose();
            
            showAlert(
                t('feedback.successTitle'),
                t('feedback.successMessage'),
                [{ text: t('feedback.successButton') }],
                'success'
            );
        } catch (error) {
            console.error('Feedback error:', error);
            showAlert(t('feedback.errorTitle'), t('feedback.errorMessage'), [{ text: t('common.okay') }], 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full">
                <MascotImage source={MASCOTS.ENVELOPE} className="w-32 h-32 mb-4" resizeMode="contain" />
                <Text className="text-2xl font-q-bold text-text text-center mb-2 px-6">
                    {t('feedback.title')}
                </Text>
                <Text className="text-base font-q-medium text-muted text-center mb-8 px-4 leading-5">
                    {t('feedback.description')}
                </Text>

                <TextInput
                    multiline
                    numberOfLines={4}
                    className="w-full bg-card px-6 py-5 rounded-[24px] font-q-medium text-lg text-text border-2 border-inactive/10 mb-4 min-h-[120px]"
                    placeholder={t('feedback.placeholder')}
                    placeholderTextColor="#CBD5E1"
                    onChangeText={setFeedback}
                    value={feedback}
                    textAlignVertical="top"
                    autoFocus={true}
                />

                <TextInput
                    className="w-full bg-card px-6 py-4 rounded-[20px] font-q-medium text-base text-text border-2 border-inactive/10 mb-8"
                    placeholder={t('feedback.emailPlaceholder')}
                    placeholderTextColor="#CBD5E1"
                    onChangeText={setEmail}
                    value={email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Button 
                    label={t('feedback.sendButton')}
                    onPress={handleSubmit}
                    loading={loading}
                />

                <TouchableOpacity 
                    onPress={() => { haptics.selection(); onClose(); }} 
                    className="mt-4 py-2 active:scale-95 transition-transform"
                >
                    <Text className="text-muted font-q-bold text-base">{t('common.maybeLater')}</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};
