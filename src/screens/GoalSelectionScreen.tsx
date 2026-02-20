import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Button } from '../components/Button';
import { SelectionPill } from '../components/SelectionPill';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { TopNav } from '../components/TopNav';
import { Layout } from '../components/Layout';
import { GOALS } from '../constants/Goals';
import { MascotImage } from '../components/MascotImage';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAccent } from '../context/AccentContext';

export const GoalSelectionScreen = () => {
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
    const route = useRoute();
    const { trackEvent } = useAnalytics();
    const { currentAccent } = useAccent();

    const mascotSize = height < 750 ? 'w-48 h-48' : height < 850 ? 'w-64 h-64' : 'w-72 h-72';

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
        <Layout useSafePadding={false} noScroll={true}>
            <View className="px-6 pt-4">
                <TopNav showBack={true} />
            </View>

            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
            <View className="flex-1 px-6 justify-between">
                <View>
                    {/* Main Content Area */}
                    <View className="items-center mb-6">
                        <Text className="text-4xl font-q-bold text-text text-center mb-6 pt-4 leading-tight">
                            What are your goals?
                        </Text>
                        <MascotImage
                            source={MASCOTS.ZEN}
                            className={mascotSize}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View className="flex-1 justify-center mb-8">
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
                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: currentAccent.hex }} />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                    </View>

                    <Button
                        label="Continue"
                        onPress={() => {
                            trackEvent('onboarding_goals_selected', { goals: selected });
                            (navigation.navigate as any)('Summary', { struggles, goals: selected });
                        }}
                        disabled={!canContinue}
                    />

                </View>
            </View>
            </ScrollView>
        </Layout>
    );
};
