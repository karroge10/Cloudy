import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, InteractionManager, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from './Skeleton';
import { useJournal } from '../context/JournalContext';
import { BottomSheet } from './BottomSheet'; 
import { haptics } from '../utils/haptics';
import { MascotImage } from './MascotImage';
import { MASCOTS } from '../constants/Assets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryption } from '../utils/encryption';
import { useProfile } from '../context/ProfileContext';
import { LockedFeature } from './LockedFeature';
import { useTheme } from '../context/ThemeContext';

interface InsightsProps {
    userId: string | undefined;
}

interface InsightsData {
    totalEntries: number;
    totalWords: number;
    avgWordsPerEntry: number;
    topWords: { word: string; count: number }[];
    // Extended Stats
    longestEntryWords: number;
    timeOfDay: { morning: number; afternoon: number; evening: number };
    totalTimeSpentMinutes: number; 
    activeDays: number;
    totalDays: number;
}

const STOP_WORDS = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'was', 'he', 'for', 'it', 'with', 'as', 'his', 'on', 'be', 'at', 'by', 'i', 'this', 'had', 'not', 'are', 'but', 'from', 'or', 'have', 'an', 'they', 'which', 'one', 'you', 'were', 'her', 'all', 'she', 'there', 'would', 'their', 'we', 'him', 'been', 'has', 'when', 'who', 'will', 'no', 'if', 'out', 'so', 'said', 'what', 'up', 'its', 'about', 'into', 'than', 'them', 'can', 'only', 'other', 'new', 'some', 'could', 'time', 'these', 'two', 'may', 'then', 'do', 'first', 'any', 'my', 'now', 'such', 'like', 'our', 'over', 'man', 'me', 'even', 'most', 'made', 'after', 'also', 'did', 'many', 'before', 'must', 'through', 'back', 'years', 'where', 'much', 'your', 'way', 'well', 'down', 'should', 'because', 'each', 'just', 'those', 'people', 'mr', 'how', 'too', 'little', 'state', 'good', 'very', 'make', 'world', 'still', 'own', 'see', 'men', 'work', 'long', 'get', 'here', 'between', 'both', 'life', 'being', 'under', 'never', 'day', 'same', 'another', 'know', 'while', 'last', 'might', 'us', 'great', 'since', 'off', 'come', 'go', 'came', 'right', 'used', 'take', 'three', 'am', 'today', 'feeling', 'felt', 'feel'
]);

export const Insights = ({ userId }: InsightsProps) => {
    const navigation = useNavigation<any>();
    const { entries: cachedEntries, rawStreakData } = useJournal();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<InsightsData | null>(null);
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    // Unique key for caching all-time stats
    const cacheKey = useMemo(() => {
        if (!userId) return null;
        return `insights_all_time_${userId}_${rawStreakData.length}`;
    }, [userId, rawStreakData.length]);

    // Initial load from cache
    useEffect(() => {
        const loadFromCache = async () => {
            if (!cacheKey) return;
            try {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setData(JSON.parse(cached));
                    setLoading(false); // Show cached content immediately
                }
            } catch (e) {
                console.warn('Failed to load insights cache', e);
            }
        };
        loadFromCache();
    }, [cacheKey]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchInsights = async () => {
            try {
                // If we already have data matching the current cache key (entry count), don't re-fetch
                // verifying against the rawStreakData length
                if (data && data.totalEntries === rawStreakData.length) {
                    setLoading(false);
                    return;
                }

                if (rawStreakData.length === 0) {
                     if (loading) setData(null);
                     setLoading(false);
                    return;
                }

                let entries: { text: string; created_at: string }[] = [];

                // Use cached entries if we have them all, otherwise fetch all
                // This might be expensive for users with thousands of entries, but necessary for all-time text stats
                if (rawStreakData.length > 0 && rawStreakData.length === cachedEntries.length) {
                    entries = cachedEntries;
                } else {
                    // Fetch all
                     const { data: fetchedEntries, error } = await supabase
                        .from('posts')
                        .select('text, created_at')
                        .eq('user_id', userId)
                        .is('deleted_at', null);
                    
                    if (error) throw error;
                    
                    if (fetchedEntries && fetchedEntries.length > 0) {
                        entries = await Promise.all(fetchedEntries.map(async (e) => {
                            try {
                                return {
                                    ...e,
                                    text: await encryption.decrypt(e.text)
                                };
                            } catch (err) {
                                console.warn('Decryption failed for insights:', err);
                                return e; 
                            }
                        }));
                    }
                }

                if (!entries || entries.length === 0) {
                     if (loading) setData(null);
                     setLoading(false);
                    return;
                }

                let totalWordCount = 0;
                const wordFrequency: Record<string, number> = {};
                const activeDaysSet = new Set<string>();
                let firstEntryDate = new Date();

                if (entries.length > 0) {
                    // Find earliest date
                    const dates = entries.map(e => new Date(e.created_at).getTime());
                    firstEntryDate = new Date(Math.min(...dates));
                }

                entries.forEach(entry => {
                    if (!entry.text || typeof entry.text !== 'string') return;
                    
                    // Track active days
                    const dateStr = new Date(entry.created_at).toDateString();
                    activeDaysSet.add(dateStr);

                    const words = entry.text
                        .toLowerCase()
                        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                        .split(/\s+/)
                        .filter(w => w.length > 0);
                    
                    totalWordCount += words.length;
                    
                    words.forEach(word => {
                        if (word.length > 3 && !STOP_WORDS.has(word)) {
                            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                        }
                    });
                });

                const topWords = Object.entries(wordFrequency)
                    .map(([word, count]) => ({ word, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                const avgWords = Math.round(totalWordCount / entries.length);

                // Extended Calcs
                let maxWords = 0;
                const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };
                
                entries.forEach(e => {
                    // Time of day
                    const hour = new Date(e.created_at).getHours();
                    if (hour >= 5 && hour < 12) timeOfDay.morning++;
                    else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
                    else timeOfDay.evening++; 

                    // Longest entry
                    const wCount = (e.text || '').split(/\s+/).filter((w: string) => w.length > 0).length;
                    if (wCount > maxWords) maxWords = wCount;
                });

                // Estimate time spent (30 wpm)
                const estimatedMinutes = Math.round(totalWordCount / 30);

                // Calculate total days since first entry
                const now = new Date();
                const totalDays = Math.max(1, Math.ceil((now.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24)));

                const newData: InsightsData = {
                    totalEntries: entries.length,
                    totalWords: totalWordCount,
                    avgWordsPerEntry: avgWords,
                    topWords,
                    longestEntryWords: maxWords,
                    timeOfDay,
                    totalTimeSpentMinutes: estimatedMinutes,
                    activeDays: activeDaysSet.size,
                    totalDays: totalDays
                };

                setData(newData);
                
                // Save to cache
                if (cacheKey) {
                    await AsyncStorage.setItem(cacheKey, JSON.stringify(newData));
                }

            } catch (error) {
                console.error('[Insights] Failed:', error);
            } finally {
                setLoading(false);
            }
        };

        // Run fetch logic
        const task = InteractionManager.runAfterInteractions(() => {
            fetchInsights();
        });

        return () => task.cancel();
    }, [userId, cachedEntries, rawStreakData, cacheKey]);

    const { profile } = useProfile();
    const { isDarkMode } = useTheme();
    const isUnlocked = (profile?.max_streak || 0) >= 7;

    if (loading) {
        return (
            <View className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl mb-8"
                style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
                <View className="flex-row justify-between items-center mb-6">
                    <Skeleton width={120} height={20} borderRadius={10} />
                    <Skeleton width={60} height={32} borderRadius={16} />
                </View>
                <View className="flex-row justify-between mb-6">
                    <Skeleton width={80} height={60} borderRadius={12} />
                    <Skeleton width={80} height={60} borderRadius={12} />
                    <Skeleton width={80} height={60} borderRadius={12} />
                </View>
                <Skeleton width="100%" height={40} borderRadius={12} />
            </View>
        );
    }

    if (!data && isUnlocked) return null;

    return (
        <View className="mb-8">
            <TouchableOpacity 
                className="bg-card rounded-[32px] p-6 shadow-xl border border-inactive/5 overflow-hidden"
                style={{ 
                    shadowColor: isDarkMode ? '#000' : '#0000000D', 
                    shadowOffset: { width: 0, height: 0 }, 
                    shadowOpacity: 1, 
                    shadowRadius: 15, 
                    elevation: 4 
                }}
                onPress={() => { 
                    haptics.selection(); 
                    if (!isUnlocked) {
                        navigation.navigate('Progress');
                        return;
                    }
                    if (data) {
                        navigation.navigate('Statistics', { data });
                    }
                }}
                activeOpacity={0.9}
            >
                {/* Header - Stays consistent or changes slightly */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-q-bold text-text">Insights</Text>
                    {isUnlocked ? (
                        <View className="flex-row items-center">
                            <Text className="text-sm font-q-medium text-muted mr-1">All Time</Text>
                            <Ionicons name="chevron-forward" size={14} color={isDarkMode ? "#CBD5E1" : "#94A3B8"} />
                        </View>
                    ) : (
                        <View className="bg-inactive/10 px-3 py-1 rounded-full flex-row items-center">
                            <Ionicons name="lock-closed" size={10} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                            <Text className="text-[10px] font-q-bold text-muted ml-1 uppercase">Locked</Text>
                        </View>
                    )}
                </View>

                {isUnlocked && data ? (
                    <View>
                        <View className="flex-row justify-between mb-6">
                            <View className="items-center flex-1">
                                <Text className="text-3xl font-q-bold text-primary mb-1">{data.totalEntries}</Text>
                                <Text className="text-xs font-q-medium text-muted">Entries</Text>
                            </View>
                            <View className="w-[1px] bg-inactive/20 mx-4" />
                            <View className="items-center flex-1">
                                <Text className="text-3xl font-q-bold text-primary mb-1">{data.totalWords}</Text>
                                <Text className="text-xs font-q-medium text-muted">Words</Text>
                            </View>
                            <View className="w-[1px] bg-inactive/20 mx-4" />
                            <View className="items-center flex-1">
                                <Text className="text-3xl font-q-bold text-primary mb-1">{data.avgWordsPerEntry}</Text>
                                <Text className="text-xs font-q-medium text-muted">Words / Entry</Text>
                            </View>
                        </View>

                        {data.topWords.length > 0 && (
                            <View>
                                <Text className="text-xs font-q-bold text-muted mb-3 uppercase tracking-wider">Top Themes</Text>
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 8 }}
                                    className="flex-row"
                                >
                                    {data.topWords.map((item) => (
                                        <View 
                                            key={item.word} 
                                            className="bg-primary/10 px-4 py-2 rounded-full"
                                        >
                                            <Text className="text-primary font-q-semibold text-sm">
                                                {item.word} <Text className="text-xs text-primary/60">×{item.count}</Text>
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="items-center py-2 pb-6">
                        <View className="bg-inactive/5 p-4 rounded-3xl mb-4">
                            <Ionicons name="stats-chart" size={32} color={isDarkMode ? "#334155" : "#E2E8F0"} />
                            <View className="absolute -right-1 -top-1 bg-card rounded-full p-1 border border-inactive/10">
                                <Ionicons name="lock-closed" size={12} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                            </View>
                        </View>
                        
                        <Text className="text-base font-q-bold text-text mb-2 text-center px-6">
                            Reach 7 day streak to unlock.
                        </Text>
                        
                        <View className="w-full max-w-[220px] mb-6">
                            <View className="flex-row justify-between mb-2 px-1">
                                <Text className="text-[10px] font-q-bold text-muted uppercase tracking-tight">Progress</Text>
                                <Text className="text-[10px] font-q-bold text-primary font-q-bold">{Math.min(profile?.max_streak || 0, 7)} / 7 days</Text>
                            </View>
                            <View className="w-full h-2 bg-inactive/10 rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${Math.min(((profile?.max_streak || 0) / 7) * 100, 100)}%` }} 
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="text-[11px] font-q-bold text-primary uppercase tracking-[0.15em]">Track Progress</Text>
                            <Ionicons name="chevron-forward" size={12} color="#FF9E7D" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

