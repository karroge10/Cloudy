import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
// import DateTimePicker from '@react-native-community/datetimepicker'; // Removing unused import

export const ReminderSetupScreen = () => {
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>(); // any for navigation prop stack



    // Helper to format time for display (e.g. "9:00 PM")
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    async function finishReminderSetup() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // Format date to ISO string or simple time string? 
            // DB expects text for `reminder_time`. Let's store ISO string to be precise, or just HH:mm.
            // Let's store full ISO string but we really only care about time.
            const updates = {
                id: user.id,
                reminder_time: date.toISOString(),
                onboarding_completed: true,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            
            // Navigate to MainApp via App.tsx state change
            // But we need to make sure App.tsx sees the change.
            // For now, we rely on the state update to propagate? 
            // Actually, since we updated `onboarding_completed=true` in DB, 
            // App.tsx's subscription *might* not catch it immediately unless we trigger a refresh.
            // But usually realtime is not enabled by default for all tables unless configured.
            // We might need to manually set state or better calling a context function.
            // For this implementation, let's assume App.tsx re-checks or we can't easily force it without context.
            // However, since we are in `onboarding_completed` flow, typically we want to trigger a re-render.
            
            // HACK: Since App.tsx listens to AUTH state changes, not PROFILE changes (except on mount/login),
            // simply updating the DB won't trigger the view switch in App.tsx immediately if we don't have a listener.
            // But wait, App.tsx has `supabase.auth.onAuthStateChange`. Updating a table doesn't trigger auth state change.
            // SO: We need to reload the app or implement a global state for this.
            // Strategy: We can navigate to 'MainApp' if it's in the stack? No, it's conditional.
            // Strategy Rewrite: We need to ensure App.tsx knows.
            // Since we can't easily change App.tsx state from here without Context, 
            // we will implement a simple reload trigger or make App.tsx listen to something else.
            // OR: We force a session refresh? `supabase.auth.refreshSession()` might trigger the listener in App.tsx.

             await supabase.auth.refreshSession(); 

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
                reminder_time: null, // explicit null
                onboarding_completed: true,
                updated_at: new Date(),
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            
            await supabase.auth.refreshSession();

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <LinearGradient
            colors={['#FFF9F0', '#FFFDF9']}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60, alignItems: 'center' }}>
                <View className="mb-10 w-full">
                    <Text className="text-3xl font-q-bold text-text mb-2 text-center">Make it a Habit 📅</Text>
                    <Text className="text-lg font-q-medium text-muted text-center">
                        When is a good time for you to reflect? We can send you a gentle nudge.
                    </Text>
                </View>

                <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 items-center w-full mb-10">
                    <View className="flex-row items-center justify-between w-full px-4 mb-4">
                        {/* Hours */}
                        <View className="items-center">
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setHours(next.getHours() + 1);
                                    setDate(next);
                                }}
                                className="p-2"
                            >
                                <Ionicons name="chevron-up" size={32} color="#FF9E7D" />
                            </TouchableOpacity>
                            <Text className="text-5xl font-q-bold text-text my-2">
                                {date.getHours().toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setHours(next.getHours() - 1);
                                    setDate(next);
                                }}
                                className="p-2"
                            >
                                <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-4xl font-q-bold text-muted mb-4">:</Text>

                        {/* Minutes */}
                        <View className="items-center">
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setMinutes(next.getMinutes() + 5);
                                    setDate(next);
                                }}
                                className="p-2"
                            >
                                <Ionicons name="chevron-up" size={32} color="#FF9E7D" />
                            </TouchableOpacity>
                            <Text className="text-5xl font-q-bold text-text my-2">
                                {date.getMinutes().toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    const next = new Date(date);
                                    next.setMinutes(next.getMinutes() - 5);
                                    setDate(next);
                                }}
                                className="p-2"
                            >
                                <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text className="text-sm font-q-bold text-muted uppercase tracking-widest mt-2">{formattedTime}</Text>
                </View>

                <View className="mt-auto w-full">
                    <TouchableOpacity
                        className="bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                        onPress={finishReminderSetup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className="text-white font-q-bold text-lg">Start My Journey</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="py-3 items-center"
                        onPress={skipReminder}
                        disabled={loading}
                    >
                        <Text className="text-muted font-q-medium">No thanks, I'll remember myself</Text>
                    </TouchableOpacity>
                        <View className="flex-row justify-between mt-8 opacity-30">
                             <TouchableOpacity onPress={() => navigation.goBack()}>
                                 <Text className="text-gray-400 font-q-medium">← Dev: Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
            </ScrollView>
        </LinearGradient>
    );
};
