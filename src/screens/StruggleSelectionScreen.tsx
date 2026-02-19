import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Button } from '../components/Button';
import { SelectionPill } from '../components/SelectionPill';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { TopNav } from '../components/TopNav';
import { MascotImage } from '../components/MascotImage';

import { Layout } from '../components/Layout';

import { STRUGGLES } from '../constants/Struggles';
import { useAnalytics } from '../hooks/useAnalytics';


export const StruggleSelectionScreen = () => {
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
    const { trackEvent } = useAnalytics();
    const [selected, setSelected] = useState<string[]>([]);

    const mascotSize = height < 750 ? 'w-48 h-48' : height < 850 ? 'w-64 h-64' : 'w-72 h-72';


    const toggleSelection = (item: string) => {
        if (selected.includes(item)) {
            setSelected(selected.filter(i => i !== item));
        } else {
            setSelected([...selected, item]);
        }
    };

    const canContinue = selected.length > 0;

    return (
        <Layout useSafePadding={false}>
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
                            What's been weighing on you lately?
                        </Text>
                        <MascotImage
                            source={MASCOTS.SAD}
                            className={mascotSize}
                            resizeMode="contain"
                        />
                    </View>
                </View>
                
                <View className="flex-1 justify-center mb-8">
                     <View className="w-full flex-row flex-wrap justify-center gap-3">
                        {STRUGGLES.map((struggle) => (
                            <SelectionPill
                                key={struggle}
                                label={struggle}
                                selected={selected.includes(struggle)}
                                onPress={() => toggleSelection(struggle)}
                            />
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View className="w-full">
                     {/* Progress Dots */}
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-primary" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                    </View>

                    <Button
                        label="Continue"
                        onPress={() => {
                            trackEvent('onboarding_struggles_selected', { struggles: selected });
                            (navigation.navigate as any)('GoalSelection', { struggles: selected });
                        }}
                        disabled={!canContinue}
                    />

                </View>
            </View>
            </ScrollView>
        </Layout>
    );
};
