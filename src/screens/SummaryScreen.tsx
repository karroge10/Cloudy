import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';

export const SummaryScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { struggles, goals } = route.params as { struggles: string[], goals: string[] } || { struggles: [], goals: [] };

    // Generate dynamic text
    // "Research shows that writing down just one gratitude a day can reduce [Struggle] and help you find [Goal]."
    // We'll join the first item, or handle multiple gracefully?
    // User requested: "Selection from Screen 2" and "Selection from Screen 3".
    // Let's pick the first one from each for simplicity, or join them with commas if length < 3.

    const formatList = (items: string[]) => {
        if (items.length === 0) return "stress"; // Fallback
        if (items.length === 1) return items[0].toLowerCase();
        if (items.length === 2) return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`;
        return `${items[0].toLowerCase()} and others`;
    };

    const struggleText = formatList(struggles);
    const goalText = formatList(goals);

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <View className="flex-1 px-6 justify-between py-12">
                <View />

                <View className="items-center">
                    <Image
                        source={MASCOTS.SHINE}
                        className="w-48 h-48 mb-8"
                        resizeMode="contain"
                    />

                    <Text className="text-2xl font-bold text-text mb-2 text-center font-sans">
                        We can get there, together.
                    </Text>

                    <Text className="text-lg text-text text-center font-sans leading-7 mt-4">
                        Research shows that writing down just <Text className="font-bold text-primary">one gratitude</Text> a day can reduce <Text className="font-bold text-primary">{struggleText}</Text> and help you find <Text className="font-bold text-primary">{goalText}</Text>.
                    </Text>
                </View>

                <View className="w-full">
                    <Button
                        label="Start Writing"
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' as never }],
                        })}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};
