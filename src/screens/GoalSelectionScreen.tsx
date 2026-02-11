import React, { useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
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
            <View className="flex-1 px-6 py-8">
                <View className="mt-4 mb-8">
                    <Image
                        source={MASCOTS.ZEN}
                        className="w-20 h-20 mb-4 self-center"
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-bold text-text text-center font-sans">
                        And what do you want to find more of?
                    </Text>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                    <View className="flex-row flex-wrap justify-center gap-3">
                        {GOALS.map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={goal}
                                selected={selected.includes(goal)}
                                onPress={() => toggleSelection(goal)}
                            />
                        ))}
                    </View>
                </ScrollView>

                <View className="pt-4">
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
