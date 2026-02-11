import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MASCOTS } from '../constants/Assets';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {
    const navigation = useNavigation();
    const streak = 3;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <ScrollView className="flex-1 px-6 py-6">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className="text-lg text-text opacity-60 font-sans">Good Morning</Text>
                        <Text className="text-2xl font-bold text-text font-sans">Ready to shine?</Text>
                    </View>
                    <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                        <Image source={MASCOTS.STREAK} className="w-5 h-5 mr-1.5" resizeMode="contain" />
                        <Text className="font-bold text-primary font-sans">{streak}</Text>
                    </View>
                </View>

                {/* Main Action Card */}
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 items-center">
                    <Image
                        source={MASCOTS.WRITE}
                        className="w-32 h-32 mb-4"
                        resizeMode="contain"
                    />
                    <Text className="text-xl font-bold text-text mb-2 text-center font-sans">
                        Daily Gratitude
                    </Text>
                    <Text className="text-text opacity-70 text-center font-sans mb-6 leading-5">
                        Take a moment to appreciate the little things. What made you smile today?
                    </Text>

                    <TouchableOpacity
                        className="bg-primary w-full py-4 rounded-2xl items-center shadow-sm active:opacity-90"
                        onPress={() => navigation.navigate('JournalEntry' as never)}
                    >
                        <Text className="text-white font-bold font-sans text-lg">Write an Entry</Text>
                    </TouchableOpacity>
                </View>

                {/* Quote of the day (Placeholder) */}
                <View className="bg-secondary/10 rounded-2xl p-5 mb-8 border border-secondary/20">
                    <Text className="text-primary italic font-medium font-sans text-center leading-6">
                        "The only way to do great work is to love what you do."
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};
