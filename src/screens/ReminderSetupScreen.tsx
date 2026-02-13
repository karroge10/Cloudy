import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, DeviceEventEmitter } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { TimePicker } from '../components/TimePicker';
import { Button } from '../components/Button';
import { haptics } from '../utils/haptics';

export const ReminderSetupScreen = () => {
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();
    const route = useRoute();
    
    // Get data passed from ProfileSetupScreen
    const { displayName, mascotName } = (route.params as any) || {};

    // Helper to format time for display (e.g. "09:00 PM")
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    async function finishReminderSetup() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updates = {
                id: user.id,
                display_name: displayName,
                mascot_name: mascotName,
                reminder_time: formattedTime,
                onboarding_completed: true,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);
            if (error) throw error;
            
            DeviceEventEmitter.emit('refresh_profile');
            navigation.navigate('MainApp');

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }
    
    async function skipReminder() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updates = {
                id: user.id,
                display_name: displayName,
                mascot_name: mascotName,
                reminder_time: null,
                onboarding_completed: true,
                updated_at: new Date(),
            };
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);
            if (error) throw error;
            
            DeviceEventEmitter.emit('refresh_profile');
            navigation.navigate('MainApp');

        } catch (error: any) {
            Alert.alert('Error', error.message);
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

