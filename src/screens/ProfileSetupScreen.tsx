import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/Button';
import { MascotCard } from '../components/MascotCard';
import { haptics } from '../utils/haptics';

import { COMPANIONS } from '../constants/Companions';

export const ProfileSetupScreen = () => {
    const [displayName, setDisplayName] = useState('');
    const [selectedMascot, setSelectedMascot] = useState<typeof COMPANIONS[number]>(COMPANIONS[0]); // Default to Hero
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
            mascotName: 'Hero' // Default
        });
    }

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                 <TopNav showBack={navigation.canGoBack()} />
            </View>

            <View className="flex-1 px-6 pb-10">
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
                            <MascotCard
                                key={companion.id}
                                name={companion.name}
                                asset={companion.asset}
                                isSelected={selectedMascot.id === companion.id}
                                onPress={() => setSelectedMascot(companion)}
                            />
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
                        onPress={() => { haptics.selection(); skipSetup(); }}
                        disabled={loading}
                    >
                        <Text className="text-muted font-q-bold text-base">Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
};

