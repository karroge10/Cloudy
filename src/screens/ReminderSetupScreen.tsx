import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { TimePicker } from '../components/TimePicker';
import { Button } from '../components/Button';
import { haptics } from '../utils/haptics';
import { useProfile } from '../context/ProfileContext';
import { useAlert } from '../context/AlertContext';

export const ReminderSetupScreen = () => {
    const { showAlert } = useAlert();
    const [date, setDate] = useState(new Date(new Date().setHours(20, 0, 0, 0)));
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { updateProfile } = useProfile();
    
    // Get data passed from ProfileSetupScreen
    const { displayName, mascotName } = (route.params as any) || {};

    // Helper to format time for display (e.g. "21:00")
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${h}:${m}`;

    async function finishReminderSetup() {
        setLoading(true);
        try {
            await updateProfile({
                display_name: displayName,
                mascot_name: mascotName,
                reminder_time: formattedTime,
                onboarding_completed: true,
            });
            
            navigation.navigate('MainApp');
        } catch (error: any) {
            showAlert('Error', error.message, [{ text: 'Okay' }], 'error');
        } finally {
            setLoading(false);
        }
    }
    
    async function skipReminder() {
        setLoading(true);
        try {
            await updateProfile({
                display_name: displayName,
                mascot_name: mascotName,
                reminder_time: null,
                onboarding_completed: true,
            });
            
            navigation.navigate('MainApp');
        } catch (error: any) {
            showAlert('Error', error.message, [{ text: 'Okay' }], 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                 <TopNav showBack={true} />
            </View>

            <View className="flex-1 px-6 justify-between pb-10">
                <View>
                    <View className="items-center mb-0 w-full">
                         <Text className="text-4xl font-q-bold text-text mb-2 text-center">Make it a habit</Text>
                        <Text className="text-lg font-q-medium text-muted text-center px-4 mb-4">
                            When is a good time for you to reflect? We can send you a gentle nudge.
                        </Text>
                        <Image source={MASCOTS.WATCH} className="w-64 h-64 mb-6" resizeMode="contain" />
                    </View>

                    <View className="items-center w-full">
                        <TimePicker value={date} onChange={setDate} />
                    </View>
                </View>

                <View className="w-full">
                    <Button
                        label="Start My Journey"
                        onPress={finishReminderSetup}
                        loading={loading}
                        haptic="heavy"
                    />

                    <TouchableOpacity 
                        className="py-4 items-center mt-2"
                        onPress={() => { haptics.selection(); skipReminder(); }}
                        disabled={loading}
                    >
                        <Text className="text-muted font-q-bold text-base">No thanks, I'll remember myself</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
};
