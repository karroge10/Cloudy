import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Animated, { 
    useAnimatedScrollHandler, 
    useSharedValue, 
    useAnimatedStyle, 
    interpolate,
    interpolateColor,
    withSequence,
    withTiming,
    withSpring,
    runOnJS,
    Extrapolation, 
    SharedValue,
} from 'react-native-reanimated';

import { TopNav } from '../components/TopNav';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/Skeleton';

interface JournalEntry {
    id: string;
    month: string;
    day: string;
    text: string;
    color: string;
    isFavorite?: boolean;
}

// Removed MOCK_ENTRIES

const ITEM_HEIGHT = 180;

const TimelineItem = ({ 
    item, 
    index, 
    scrollY, 
    isLast, 
    isFirst, 
    viewportHeight,
    onToggleFavorite,
    onDelete 
}: { 
    item: JournalEntry; 
    index: number; 
    scrollY: SharedValue<number>; 
    isLast: boolean; 
    isFirst: boolean;
    viewportHeight: number;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    
    const trashScale = useSharedValue(1);

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        trashScale.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withSpring(1, {}, (finished) => {
                if (finished) {
                    runOnJS(onDelete)(item.id);
                }
            })
        );
    };

    const animatedStyle = useAnimatedStyle(() => {
        const itemTop = index * ITEM_HEIGHT;
        const relativePos = itemTop - scrollY.value;
        const bottomThreshold = viewportHeight - 150;
        
        const opacity = interpolate(
            relativePos,
            [0, 50, bottomThreshold, viewportHeight],
            [1, 1, 1, 0.2],
            Extrapolation.CLAMP
        );

        const scale = interpolate(
            relativePos,
            [bottomThreshold, viewportHeight],
            [1, 0.9],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }]
        };
    });

    const circleAnimatedStyle = useAnimatedStyle(() => {
        const isActiveRange = [
            (index - 0.5) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 0.5) * ITEM_HEIGHT
        ];
        
        const borderColor = interpolateColor(
            scrollY.value,
            isActiveRange,
            ['#E5E5E5', item.color, '#E5E5E5'],
        );

        return { borderColor };
    });

    const trashAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: trashScale.value }]
    }));

    return (
        <Animated.View className="flex-row" style={animatedStyle}>
            {/* Left Column: Date & Line */}
            <View className="items-center mr-6">
                <View className={`w-[1px] h-4 ${isFirst ? 'bg-transparent' : 'bg-inactive'}`} />
                
                <Animated.View 
                    style={[{ backgroundColor: 'white', borderWidth: 2 }, circleAnimatedStyle]}
                    className="w-16 h-16 rounded-full items-center justify-center shadow-sm z-10 bg-white shadow-[#00000010]"
                >
                     <Animated.View 
                         className="absolute inset-0 rounded-full items-center justify-center"
                         style={[{ backgroundColor: item.color }, useAnimatedStyle(() => {
                             const isActiveRange = [
                                (index - 0.5) * ITEM_HEIGHT,
                                index * ITEM_HEIGHT,
                                (index + 0.5) * ITEM_HEIGHT
                             ];
                             const activeOpacity = interpolate(
                                 scrollY.value,
                                 isActiveRange,
                                 [0, 1, 0],
                                 Extrapolation.CLAMP
                             );
                             return { opacity: activeOpacity };
                         })]}
                     />

                    <View className="items-center justify-center">
                        <Text className="text-[10px] font-q-bold text-text">{item.month}</Text>
                        <Text className="text-xl font-q-bold text-text">{item.day}</Text>
                    </View>
                </Animated.View>

                <View className={`w-[1px] flex-1 ${isLast ? 'bg-transparent' : 'bg-inactive'}`} />
            </View>

            {/* Right Column: Entry Card */}
            <View className="flex-1 pb-10">
                <View 
                    className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl min-h-[140px] justify-between"
                    style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                >
                    <View>
                        <Text className="font-q-medium text-base leading-6 text-text">{item.text}</Text>
                    </View>
                    
                    <View className="flex-row justify-end mt-4 items-center space-x-4">
                        <TouchableOpacity 
                            onPress={() => onToggleFavorite(item.id)}
                            className="p-2"
                        >
                            <Ionicons 
                                name={item.isFavorite ? "heart" : "heart-outline"} 
                                size={22} 
                                color={item.isFavorite ? "#FF9E7D" : "#333"} 
                                style={{ opacity: item.isFavorite ? 1 : 0.2 }}
                            />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handleDelete}
                            className="p-2"
                        >
                            <Animated.View style={trashAnimatedStyle}>
                                <Ionicons name="trash-outline" size={22} color="#333" style={{ opacity: 0.2 }} />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const LoadingSkeleton = () => (
    <View className="px-6 space-y-8 mt-2">
        {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row">
                {/* Timeline Column Skeleton */}
                <View className="items-center mr-6">
                    <View className="w-[1px] h-4 bg-transparent" />
                    <Skeleton width={64} height={64} borderRadius={32} />
                    <View className="w-[1px] flex-1 bg-inactive/10" />
                </View>
                {/* Card Skeleton */}
                <View className="flex-1 pb-10">
                    <Skeleton height={150} borderRadius={32} />
                </View>
            </View>
        ))}
    </View>
);

export const JourneyScreen = () => {
    const navigation = useNavigation();
    const { height: viewportHeight } = useWindowDimensions();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
    const [loading, setLoading] = useState(true);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler(event => {
        scrollY.value = event.contentOffset.y;
    });

    useFocusEffect(
        React.useCallback(() => {
            checkProfileStatus();
            fetchEntries();
        }, [])
    );

    const fetchEntries = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

                if (data) {
                const mappedEntries: JournalEntry[] = data.map((post: any) => {
                    const date = new Date(post.created_at);
                    return {
                        id: post.id,
                        month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
                        day: date.getDate().toString(),
                        text: post.text,
                        color: '#FF9E7D', // Default color
                        isFavorite: post.is_favorite || false,
                    };
                });
                setEntries(mappedEntries);
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkProfileStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('display_name, onboarding_completed')
            .eq('id', user.id)
            .single();

        if (!data || !data.display_name || !data.onboarding_completed) {
            setIsProfileIncomplete(true);
        }
    };

    const filteredEntries = useMemo(() => {
        if (filter === 'favorites') return entries.filter(e => e.isFavorite);
        return entries;
    }, [entries, filter]);

    const toggleFavorite = async (id: string) => {
        // Optimistic Update
        const targetEntry = entries.find(e => e.id === id);
        if (!targetEntry) return;

        const newStatus = !targetEntry.isFavorite;

        setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: newStatus } : e));
        
        try {
            const { error } = await supabase
                .from('posts')
                .update({ is_favorite: newStatus })
                .eq('id', id);

            if (error) {
                // Revert if error
                setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !newStatus } : e));
                console.error('Error toggling favorite:', error);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert
            setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !newStatus } : e));
        }
    };

    const deleteEntry = async (id: string) => {
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const renderHeader = () => (
        <View>
            {/* Profile Nudge */}
            {isProfileIncomplete && (
                <TouchableOpacity 
                    onPress={() => (navigation as any).navigate('Profile')}
                    className="bg-secondary/30 border border-primary/20 rounded-2xl p-4 mb-6 flex-row items-center"
                >
                    <Ionicons name="sparkles" size={18} color="#FF9E7D" />
                    <Text className="text-sm font-q-medium text-text ml-3 flex-1">
                        Complete your profile to unlock reminders and cloud sync.
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#FF9E7D" />
                </TouchableOpacity>
            )}

            {/* Sunrays Card */}
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => (navigation as any).navigate('Memory')}
                className="bg-secondary rounded-[32px] p-6 mb-8 flex-row items-center justify-between border border-primary/20 shadow-[#FF9E7D20] shadow-lg"
                style={{ elevation: 4 }}
            >
                <View className="flex-row items-center flex-1">
                    <View className="bg-white p-3 rounded-2xl mr-4 shadow-sm border border-secondary">
                        <Ionicons name="sunny" size={24} color="#FF9E7D" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-q-bold text-text mb-1">Sunrays</Text>
                        <Text className="text-muted font-q-medium text-sm leading-5">
                            Your weekly highlights and brightest moments.
                        </Text>
                    </View>
                </View>
                <View className="bg-white p-2 rounded-full shadow-sm">
                    <Ionicons name="chevron-forward" size={20} color="#FF9E7D" />
                </View>
            </TouchableOpacity>

            {/* Filter Tabs */}
            <View className="flex-row mb-8 bg-inactive/10 p-1.5 rounded-2xl self-start">
                <TouchableOpacity 
                    onPress={() => setFilter('all')}
                    className={`px-6 py-2 rounded-[14px] ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-q-bold ${filter === 'all' ? 'text-text' : 'text-muted'}`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setFilter('favorites')}
                    className={`px-6 py-2 rounded-[14px] ${filter === 'favorites' ? 'bg-white shadow-sm' : ''}`}
                >
                    <View className="flex-row items-center">
                        <Ionicons 
                            name="heart" 
                            size={14} 
                            color={filter === 'favorites' ? "#FF9E7D" : "#7F7F7F"} 
                            style={{ marginRight: 4 }}
                        />
                        <Text className={`font-q-bold ${filter === 'favorites' ? 'text-text' : 'text-muted'}`}>Favorites</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Your Journey" />
            </View>

            {loading ? (
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                     {renderHeader()}
                     <LoadingSkeleton />
                </ScrollView>
            ) : (
                <Animated.FlatList
                    data={filteredEntries}
                    renderItem={({ item, index }) => (
                        <TimelineItem 
                            item={item} 
                            index={index}
                            scrollY={scrollY}
                            viewportHeight={viewportHeight}
                            isFirst={index === 0}
                            isLast={index === filteredEntries.length - 1} 
                            onToggleFavorite={toggleFavorite}
                            onDelete={deleteEntry}
                        />
                    )}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24, paddingTop: 0 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons name="journal-outline" size={48} color="#E0E0E0" />
                            <Text className="text-lg font-q-medium text-muted mt-4 text-center">
                                {filter === 'favorites' ? "No favorite entries yet." : "Your journey is just beginning."}
                            </Text>
                        </View>
                    }
                />
            )}
        </Layout>
    );
};
