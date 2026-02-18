import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { useTheme } from '../context/ThemeContext';

export const StatisticsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { data } = route.params || {};
    const { isDarkMode } = useTheme();

    if (!data) return null;

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4 mb-4">
                <TopNav title="Deep Dive" subtitle="ALL TIME STATS" onBack={() => navigation.goBack()} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            >
                <View className="items-center w-full mb-8">
                    <MascotImage source={MASCOTS.ANALYTICS} className="w-48 h-48 mb-4" resizeMode="contain" />
                </View>

                {/* Active Days */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="calendar-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Active Days</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    Total days journaled
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {data.activeDays} Days
                        </Text>
                        </View>
                </View>

                {/* Total Entries */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="documents-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Total Entries</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    Memories captured
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {data.totalEntries} Entries
                        </Text>
                        </View>
                </View>

                {/* Avg Length */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="text-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Average Length</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    Words per entry
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {data.avgWordsPerEntry} Words
                        </Text>
                        </View>
                </View>

                {/* Max Length */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="trophy-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Longest Entry</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    Most words in one go
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {data.longestEntryWords} Words
                        </Text>
                        </View>
                </View>

                {/* Time Invested */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="hourglass-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Time Invested</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    Estimated writing time
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {data.totalTimeSpentMinutes}m
                        </Text>
                        </View>
                </View>

                {/* Productivity */}
                <View className="w-full bg-card border border-inactive/10 rounded-[24px] p-5 mb-4 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center">
                            <View className="bg-primary/10 p-3 rounded-full mr-4">
                            <Ionicons name="sunny-outline" size={20} color="#FF9E7D" />
                            </View>
                            <View>
                                <Text className="text-base font-q-bold text-text">Most Productive</Text>
                                <Text className="text-sm text-muted font-q-medium">
                                    {
                                    data.timeOfDay.morning >= data.timeOfDay.afternoon && data.timeOfDay.morning >= data.timeOfDay.evening ? 'Morning' :
                                    data.timeOfDay.afternoon >= data.timeOfDay.morning && data.timeOfDay.afternoon >= data.timeOfDay.evening ? 'Afternoon' : 'Evening'
                                    }
                                </Text>
                            </View>
                        </View>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-q-bold text-sm">
                            {Math.max(data.timeOfDay.morning, data.timeOfDay.afternoon, data.timeOfDay.evening)} Entries
                        </Text>
                        </View>
                </View>

                {/* Top Themes Section */}
                {data.topWords.length > 0 && (
                    <View className="mb-12">
                            <Text className="text-base font-q-bold text-text mb-4 ml-2">Top Themes</Text>
                            <View className="flex-row flex-wrap gap-3">
                                {data.topWords.map((item: any, index: number) => (
                                    <View key={index} className="bg-card border border-inactive/20 px-4 py-3 rounded-2xl flex-row items-center shadow-sm">
                                        <Text className="text-base font-q-medium text-text mr-2 capitalize">{item.word}</Text>
                                        <Text className="text-xs font-q-bold text-primary/60">{item.count}</Text>
                                    </View>
                                ))}
                            </View>
                    </View>
                )}
            </ScrollView>
        </Layout>
    );
};
