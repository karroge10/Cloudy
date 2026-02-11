import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { SelectionPill } from '../components/SelectionPill';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';

const GOALS = [
    "Inner Peace",
    "Happiness",
    "Better Sleep",
    "Mental Clarity",
    "Productivity",
    "Self-Love"
];

export const GoalSelectionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { struggles } = route.params as { struggles: string[] } || { struggles: [] };

    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelection = (item: string) => {
        if (selected.includes(item)) {
            setSelected(selected.filter(i => i !== item));
        } else {
            setSelected([...selected, item]);
        }
    };

    const canContinue = selected.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <View className="flex-1 px-6 py-8 justify-between">
                <View>
                    {/* Header / Dev Back */}
                    <View className="flex-row justify-between items-center w-full mb-2 min-h-[40px]" />

                    {/* Main Content Area */}
                    <View className="items-center mb-6">
                        <Text className="text-4xl font-q-bold text-text text-center mb-6 pt-4 leading-tight">
                            And what do you want to find more of?
                        </Text>
                        <Image
                            source={MASCOTS.ZEN}
                            className="w-72 h-72"
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View className="flex-1 justify-center">
                     <View className="w-full flex-row flex-wrap justify-center gap-3">
                        {GOALS.map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={goal}
                                selected={selected.includes(goal)}
                                onPress={() => toggleSelection(goal)}
                            />
                        ))}
                    </View>
                </View>

                <View className="w-full">
                    {/* Progress Dots */}
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-primary" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                    </View>

                    <Button
                        label="Continue"
                        onPress={() => (navigation.navigate as any)('Summary', { struggles, goals: selected })}
                        disabled={!canContinue}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};
