import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';

export const HomeScreen = () => {
    const [text, setText] = useState('');
    const streak = 3;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const charCount = text.length;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <Image 
                        source={MASCOTS.WRITE} 
                        className="w-24 h-24" 
                        resizeMode="contain" 
                    />
                    <View className="items-end">
                        <View className="flex-row items-center">
                        <Text className="text-lg text-muted font-q-bold">TODAY</Text>
                            <View className="flex-row items-center bg-white px-2 py-1 rounded-full shadow-sm">
                                <Ionicons name="flame" size={16} color="#FF9E7D" />
                                <Text className="font-q-bold text-primary ml-1 text-base">{streak}</Text>
                            </View>
                        </View>
                        <Text className="text-xl font-q-bold text-text mr-2">{formattedDate}</Text>
                    </View>
                </View>

                {/* Main Writing Card */}
                <View className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl mb-6" style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 5 }}>
                    <Text className="text-xl font-q-bold text-text mb-4 text-center">
                        Daily Gratitude
                    </Text>
                    <TextInput
                        multiline
                        placeholder="What's on your mind today?"
                        placeholderTextColor="#999"
                        className="text-text font-q-regular text-lg min-h-[200px] mb-4"
                        textAlignVertical="top"
                        value={text}
                        onChangeText={setText}
                        maxLength={200}
                    />
                    
                    <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                        <Text className="text-muted font-q-medium">
                            {charCount} / 200 symbols
                        </Text>
                        <TouchableOpacity 
                            className="bg-primary px-8 py-2.5 rounded-xl shadow-sm active:opacity-90"
                        >
                            <Text className="text-white font-q-bold text-base">Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tip Box */}
                <View className="bg-card rounded-2xl p-5 flex-row items-center shadow-[#0000000D] shadow-lg mb-10" style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 3 }}>
                    <View className="bg-orange-50 p-3 rounded-2xl mr-4">
                        <Ionicons name="bulb-outline" size={24} color="#FF9E7D" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-q-bold text-base mb-0.5">Writing Tip</Text>
                        <Text className="text-muted font-q-regular text-sm leading-5">
                            Focus on one small thing that went well today, no matter how tiny it seems.
                        </Text>
                    </View>
                </View>

                {/* Bottom padding for scrollability */}
                <View className="h-4" />

            </ScrollView>
        </SafeAreaView>
    );
};
