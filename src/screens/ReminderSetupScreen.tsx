import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, DeviceEventEmitter } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';

export const ReminderSetupScreen = () => {
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    // Helper to format time for display (e.g. "09:00 PM")
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    async function finishReminderSetup() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updates = {
                id: user.id,
                reminder_time: formattedTime, // Store simple time string as Used in Profile
                onboarding_completed: true,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            
            // Force App.tsx to re-check profile instead of relying on refreshSession
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
                reminder_time: null,
                onboarding_completed: true,
                updated_at: new Date(),
            };
            const { error } = await supabase.from('profiles').upsert(updates);
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

            <View className="flex-1 px-6 pb-8">
                <View className="items-center mb-10 w-full">
                    <Image source={MASCOTS.HELLO} className="w-48 h-48 mb-6" resizeMode="contain" />
                    <Text className="text-4xl font-q-bold text-text mb-2 text-center">Make it a habit</Text>
                    <Text className="text-lg font-q-medium text-muted text-center px-4">
                        When is a good time for you to reflect? We can send you a gentle nudge.
                    </Text>
                </View>

                <View className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-inactive/10 items-center w-full mb-10">
                    <View className="flex-row items-center justify-between w-full px-4 mb-4">
                        {/* Hours */}
                        <View className="items-center">
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setHours(next.getHours() + 1);
                                    setDate(next);
                                }}
                                className="p-3 bg-secondary/30 rounded-full mb-3"
                            >
                                <Ionicons name="chevron-up" size={28} color="#FF9E7D" />
                            </TouchableOpacity>
                            <Text className="text-6xl font-q-bold text-text">
                                {date.getHours().toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setHours(next.getHours() - 1);
                                    setDate(next);
                                }}
                                className="p-3 bg-secondary/30 rounded-full mt-3"
                            >
                                <Ionicons name="chevron-down" size={28} color="#FF9E7D" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-5xl font-q-bold text-inactive/30 mb-2">:</Text>

                        {/* Minutes */}
                        <View className="items-center">
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setMinutes(next.getMinutes() + 5);
                                    setDate(next);
                                }}
                                className="p-3 bg-secondary/30 rounded-full mb-3"
                            >
                                <Ionicons name="chevron-up" size={28} color="#FF9E7D" />
                            </TouchableOpacity>
                            <Text className="text-6xl font-q-bold text-text">
                                {date.getMinutes().toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setMinutes(next.getMinutes() - 5);
                                    setDate(next);
                                }}
                                className="p-3 bg-secondary/30 rounded-full mt-3"
                            >
                                <Ionicons name="chevron-down" size={28} color="#FF9E7D" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className="bg-primary/10 px-6 py-2 rounded-full mt-2">
                         <Text className="text-primary font-q-bold text-lg">{formattedTime}</Text>
                    </View>
                </View>

                <View className="mt-auto w-full">
                    <TouchableOpacity
                        className="bg-primary py-5 rounded-full items-center shadow-lg active:scale-[0.98] transition-transform mb-4"
                        onPress={finishReminderSetup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className="text-white font-q-bold text-xl">Start My Journey</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="py-3 items-center"
                        onPress={skipReminder}
                        disabled={loading}
                    >
                        <Text className="text-muted font-q-bold text-base">No thanks, I'll remember myself</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
};

