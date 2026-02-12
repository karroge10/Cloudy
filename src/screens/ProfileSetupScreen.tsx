import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Available mascots for selection
const MASCOTS = [
    { id: 'wavy', name: 'Wavy', emoji: '🌊' },
    { id: 'dreamy', name: 'Dreamy', emoji: '☁️' }, // Default
    { id: 'author', name: 'Author', emoji: '✍️' },
    { id: 'brainy', name: 'Brainy', emoji: '🧠' },
    { id: 'firey', name: 'Firey', emoji: '🔥' },
    { id: 'flow', name: 'Flow', emoji: '🍃' },
];

export const ProfileSetupScreen = () => {
    const [displayName, setDisplayName] = useState('');
    const [selectedMascot, setSelectedMascot] = useState(MASCOTS[1]); // Default to Dreamy
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    async function finishSetup() {
        if (!displayName.trim()) {
            Alert.alert('Hey there!', 'Please enter a name so we know what to call you.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updates = {
                id: user.id,
                display_name: displayName.trim(),
                mascot_name: selectedMascot.name,
                // onboarding_completed: false, // Don't finish yet!
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Navigate to next step: Reminder Setup
            navigation.navigate('ReminderSetup' as never);
            
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    async function skipSetup() {
        // Just navigate to Reminder Setup, don't save anything yet or just nickname if they typed it?
        // User explicitly pressed SKIP, so let's move on.
        navigation.navigate('ReminderSetup' as never);
    }

    return (
        <LinearGradient
            colors={['#FFF9F0', '#FFFDF9']}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}>
                    <View className="mb-8">
                        <Text className="text-3xl font-q-bold text-text mb-2">Almost there! 🎉</Text>
                        <Text className="text-lg font-q-medium text-muted">
                            Let's set up your profile to make Cloudy truly yours.
                        </Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm font-q-bold text-muted mb-2 ml-1">What should Cloudy call you?</Text>
                        <TextInput
                            className="bg-white px-5 py-4 rounded-2xl font-q-bold text-lg text-text border border-gray-200 shadow-sm"
                            placeholder="Your Name"
                            placeholderTextColor="#CBD5E1"
                            onChangeText={setDisplayName}
                            value={displayName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-q-bold text-muted mb-3 ml-1">Pick a Companion</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {MASCOTS.map((mascot) => (
                                <TouchableOpacity
                                    key={mascot.id}
                                    onPress={() => setSelectedMascot(mascot)}
                                    className={`w-[30%] aspect-square mb-4 rounded-2xl items-center justify-center border-2 ${
                                        selectedMascot.id === mascot.id 
                                            ? 'bg-white border-primary shadow-sm' 
                                            : 'bg-white/50 border-transparent'
                                    }`}
                                >
                                    <Text className="text-3xl mb-1">{mascot.emoji}</Text>
                                    <Text className={`font-q-bold text-xs ${
                                        selectedMascot.id === mascot.id ? 'text-primary' : 'text-muted'
                                    }`}>
                                        {mascot.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="mt-auto">
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                            onPress={finishSetup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text className="text-white font-q-bold text-lg">All Set!</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="py-3 items-center"
                            onPress={skipSetup}
                            disabled={loading}
                        >
                            <Text className="text-muted font-q-medium">Skip for now</Text>
                        </TouchableOpacity>
                        <View className="flex-row justify-between mt-8 opacity-30">
                             <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text className="text-gray-400 font-q-medium">← Dev: Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('ReminderSetup' as never)}>
                                <Text className="text-gray-400 font-q-medium">Dev: Next →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};
