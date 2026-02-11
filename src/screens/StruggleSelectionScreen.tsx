import React, { useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { SelectionPill } from '../components/SelectionPill';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';

const STRUGGLES = [
    "Stress",
    "Anxiety",
    "Overthinking",
    "Low Energy",
    "Sleep Issues",
    "Lack of Focus"
];

export const StruggleSelectionScreen = () => {
    const navigation = useNavigation(); // Typing omitted for brevity
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
                {/* Header */}
                <View className="mt-4 mb-8">
                    <Image
                        source={MASCOTS.THINK}
                        className="w-20 h-20 mb-4 self-center"
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-bold text-text text-center font-sans">
                        What's been weighing on you lately?
                    </Text>
                </View>

                {/* Options */}
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                    <View className="flex-row flex-wrap justify-center gap-3">
                        {STRUGGLES.map((struggle) => (
                            <SelectionPill
                                key={struggle}
                                label={struggle}
                                selected={selected.includes(struggle)}
                                onPress={() => toggleSelection(struggle)}
                            />
                        ))}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View className="pt-4">
                    <Button
                        label="Continue"
                        onPress={() => (navigation.navigate as any)('GoalSelection', { struggles: selected })}
                        disabled={!canContinue}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};
