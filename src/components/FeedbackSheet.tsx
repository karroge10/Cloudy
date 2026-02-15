import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Button } from './Button';
import { haptics } from '../utils/haptics';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAlert } from '../context/AlertContext';

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

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            showAlert('Wait!', 'Please write something before sending.', [{ text: 'Okay' }], 'info');
            return;
        }

        setLoading(true);
        try {
            // We use PostHog for feedback as it's the most efficient way to capture insights 
            // without adding database complexity for now.
            trackEvent('cloudy_whisper_feedback', {
                message: feedback.trim(),
                contact_email: email.trim() || undefined,
                timestamp: new Date().toISOString()
            });

            haptics.success();
            setFeedback('');
            setEmail('');
            onClose();
            
            showAlert(
                'Thank You!',
                'Your feedback reached my cloud. I appreciate you!',
                [{ text: 'You’re welcome!' }],
                'success'
            );
        } catch (error) {
            showAlert('Oops', 'Could not send feedback. Please try again.', [{ text: 'Okay' }], 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View className="items-center w-full">
                <MascotImage source={MASCOTS.THINK} className="w-32 h-32 mb-4" resizeMode="contain" />
                <Text className="text-2xl font-q-bold text-text text-center mb-2 px-6">
                    Cloudy Whisper
                </Text>
                <Text className="text-base font-q-medium text-muted text-center mb-8 px-4 leading-5">
                    Found a bug? Have an idea? Or just want to say hi? I'm all ears!
                </Text>

                <TextInput
                    multiline
                    numberOfLines={4}
                    className="w-full bg-card px-6 py-5 rounded-[24px] font-q-medium text-lg text-text border-2 border-inactive/10 mb-4 min-h-[120px]"
                    placeholder="Tell me everything..."
                    placeholderTextColor="#CBD5E1"
                    onChangeText={setFeedback}
                    value={feedback}
                    textAlignVertical="top"
                    autoFocus={true}
                />

                <TextInput
                    className="w-full bg-card px-6 py-4 rounded-[20px] font-q-medium text-base text-text border-2 border-inactive/10 mb-8"
                    placeholder="Email for reply (optional)"
                    placeholderTextColor="#CBD5E1"
                    onChangeText={setEmail}
                    value={email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Button 
                    label="Send to the Cloud"
                    onPress={handleSubmit}
                    loading={loading}
                />

                <TouchableOpacity 
                    onPress={() => { haptics.selection(); onClose(); }} 
                    className="mt-4 py-2 active:scale-95 transition-transform"
                >
                    <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};
