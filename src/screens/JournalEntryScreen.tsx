import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';

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
        <Layout noScroll={true}>
            <TopNav title="Journal" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {/* Header Content */}
                    <View className="items-center mb-8">
                        <Image
                            source={MASCOTS.WRITE}
                            className="w-40 h-40 mb-4"
                            resizeMode="contain"
                        />
                        <Text className="text-2xl font-q-bold text-text text-center">
                            Focus on the good.
                        </Text>
                        <Text className="text-base text-text text-center font-q-regular mt-2 opacity-80">
                            What is one small thing you are grateful for today?
                        </Text>
                    </View>

                    <View 
                        className="bg-card rounded-3xl p-6 shadow-[#0000000D] shadow-xl min-h-[200px]"
                        style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                    >
                        <TextInput
                            className="flex-1 text-lg text-text font-q-regular text-left align-top"
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
                        <Text className="text-white text-lg font-q-bold">
                            Save Entry
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Layout>
    );
};
