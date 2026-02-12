import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/Button';

// Available mascots for selection
const COMPANIONS = [
    { id: 'HELLO', name: 'Wavy', asset: MASCOTS.HELLO },
    { id: 'SLEEP_1', name: 'Dreamy', asset: MASCOTS.SLEEP_1 },
    { id: 'WRITE', name: 'Author', asset: MASCOTS.WRITE },
    { id: 'THINK', name: 'Brainy', asset: MASCOTS.THINK },
    { id: 'STREAK', name: 'Firey', asset: MASCOTS.STREAK },
    { id: 'ZEN', name: 'Flow', asset: MASCOTS.ZEN },
] as const;

export const ProfileSetupScreen = () => {
    const [displayName, setDisplayName] = useState('');
    const [selectedMascot, setSelectedMascot] = useState<typeof COMPANIONS[number]>(COMPANIONS[1]); // Default to Dreamy (SLEEP_1)
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    function finishSetup() {
        if (!displayName.trim()) {
            Alert.alert('Hey there!', 'Please enter a name so we know what to call you.');
            return;
        }

        // Navigate to next step: Reminder Setup, passing data forward
        (navigation as any).navigate('ReminderSetup', {
            displayName: displayName.trim(),
            mascotName: selectedMascot.name
        });
    }

    function skipSetup() {
        (navigation as any).navigate('ReminderSetup', {
            displayName: null,
            mascotName: 'Dreamy' // Default
        });
    }

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                 <TopNav showBack={navigation.canGoBack()} />
            </View>

            <View className="flex-1 px-6 pb-8">
                <View className="mb-8 items-center">
                    <Text className="text-4xl font-q-bold text-text mb-2 text-center">Almost there!</Text>
                    <Text className="text-lg font-q-medium text-muted text-center">
                        Let's set up your profile to make Cloudy truly yours.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-base font-q-bold text-muted mb-2 ml-1 uppercase tracking-widest text-[10px]">What should Cloudy call you?</Text>
                    <TextInput
                        className="bg-white px-6 py-5 rounded-3xl font-q-bold text-lg text-text border-2 border-primary/10 shadow-sm"
                        placeholder="Your Name"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setDisplayName}
                        value={displayName}
                        autoCapitalize="words"
                    />
                </View>

                <View className="mb-8 flex-1">
                    <Text className="text-base font-q-bold text-muted mb-4 ml-1 uppercase tracking-widest text-[10px]">Pick a Companion</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {COMPANIONS.map((companion) => (
                            <TouchableOpacity
                                key={companion.id}
                                onPress={() => setSelectedMascot(companion)}
                                className={`w-[30%] aspect-square mb-4 rounded-[32px] items-center justify-center border-2 ${
                                    selectedMascot.id === companion.id 
                                        ? 'bg-secondary border-primary shadow-sm' 
                                        : 'bg-white border-primary/10 shadow-sm'
                                }`}
                            >
                                <Image 
                                    source={companion.asset} 
                                    className="w-14 h-14" 
                                    resizeMode="contain" 
                                />
                                <Text className={`font-q-bold text-[10px] mt-2 uppercase ${
                                    selectedMascot.id === companion.id ? 'text-primary' : 'text-muted'
                                }`}>
                                    {companion.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mt-auto">
                    <Button
                        label="Continue"
                        onPress={finishSetup}
                        loading={loading}
                    />

                    <TouchableOpacity 
                        className="py-4 items-center mt-2"
                        onPress={skipSetup}
                        disabled={loading}
                    >
                        <Text className="text-muted font-q-bold text-base">Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
};

