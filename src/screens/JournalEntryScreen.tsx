import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MASCOTS } from '../constants/Assets';
import { useNavigation } from '@react-navigation/native';

export const JournalEntryScreen = () => {
    const [gratitude, setGratitude] = useState('');
    const navigation = useNavigation();

    const handleSave = () => {
        if (gratitude.trim().length === 0) return;
        // In a real app, save to storage here
        console.log("Saved gratitude:", gratitude);
        setGratitude('');
        alert("Gratitude saved! See you tomorrow!");
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-6">
                    {/* Header with Back Button (optional, relying on native back for now or custom) */}
                    <View className="items-center mt-4 mb-8">
                        <Image
                            source={MASCOTS.WRITE}
                            className="w-40 h-40 mb-4"
                            resizeMode="contain"
                        />
                        <Text className="text-2xl font-bold text-text text-center font-sans">
                            Focus on the good.
                        </Text>
                        <Text className="text-base text-text text-center font-sans mt-2 opacity-80">
                            What is one small thing you are grateful for today?
                        </Text>
                    </View>

                    <View className="bg-white rounded-3xl p-6 shadow-sm border border-inactive min-h-[200px]">
                        <TextInput
                            className="flex-1 text-lg text-text font-sans text-left align-top"
                            placeholder="I am grateful for..."
                            placeholderTextColor="#999"
                            multiline
                            textAlignVertical="top"
                            value={gratitude}
                            onChangeText={setGratitude}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        className={`mt-8 py-4 rounded-full items-center shadow-lg active:scale-95 transition-transform ${gratitude.trim().length > 0 ? "bg-primary" : "bg-inactive"
                            }`}
                        disabled={gratitude.trim().length === 0}
                    >
                        <Text className="text-white text-lg font-bold font-sans">
                            Save Entry
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
