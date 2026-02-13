import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { haptics } from '../utils/haptics';
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

import { BottomSheet } from '../components/BottomSheet';
import { MASCOTS } from '../constants/Assets';
import { Image } from 'react-native';
import { useJournal, JournalEntry } from '../context/JournalContext';
import { ProfileNudge } from '../components/ProfileNudge';
import { useAlert } from '../context/AlertContext';

const ITEM_HEIGHT = 180;

const TimelineItem = ({ 
    item, 
    index, 
    scrollY, 
    isLast, 
    isFirst, 
    viewportHeight,
    onToggleFavorite,
    onDelete,
    isDeletingProp,
    onDeleteAnimationComplete
}: { 
    item: JournalEntry; 
    index: number; 
    scrollY: SharedValue<number>; 
    isLast: boolean; 
    isFirst: boolean;
    viewportHeight: number;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDelete: (id: string) => void;
    isDeletingProp: boolean;
    onDeleteAnimationComplete: (id: string) => void;
}) => {
    
    const trashScale = useSharedValue(1);
    const itemHeight = useSharedValue(ITEM_HEIGHT);
    const itemOpacity = useSharedValue(1);

    React.useEffect(() => {
        if (isDeletingProp) {
            itemOpacity.value = withTiming(0, { duration: 200 });
            itemHeight.value = withTiming(0, { duration: 300 }, (animFinished) => {
                if (animFinished) {
                    runOnJS(onDeleteAnimationComplete)(item.id);
                }
            });
        }
    }, [isDeletingProp]);

    const handleTrashPress = () => {
        if (isDeletingProp) return;
        haptics.success();
        
        // Immediate trigger for bottom sheet
        onDelete(item.id);
        
        // Optional: still run a small bouncy animation for feedback concurrently
        trashScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
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
            opacity: opacity * itemOpacity.value,
            transform: [{ scale }],
            height: itemHeight.value,
            overflow: 'hidden'
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
            ['#E5E5E5', '#FF9E7D', '#E5E5E5'],
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
                         style={[{ backgroundColor: '#FF9E7D' }, useAnimatedStyle(() => {
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
                        <Text className="text-[10px] font-q-bold text-text">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short' })}
                        </Text>
                        <Text className="text-xl font-q-bold text-text">
                            {new Date(item.created_at).getDate()}
                        </Text>
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
                            onPress={() => { haptics.selection(); onToggleFavorite(item.id, !item.is_favorite); }}
                            className="p-2"
                        >
                            <Ionicons 
                                name={item.is_favorite ? "heart" : "heart-outline"} 
                                size={22} 
                                color={item.is_favorite ? "#FF9E7D" : "#333"} 
                                style={{ opacity: item.is_favorite ? 1 : 0.2 }}
                            />
                        </TouchableOpacity>
                        
                        {(() => {
                            const now = new Date();
                            const entryDate = new Date(item.created_at);
                            const diffInHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
                            const canDelete = diffInHours <= 24;
                            
                            if (!canDelete) return null;

                            return (
                                <TouchableOpacity 
                                    onPress={handleTrashPress}
                                    className="p-2"
                                    disabled={isDeletingProp}
                                >
                                    <Animated.View style={trashAnimatedStyle}>
                                        {isDeletingProp ? (
                                            <View className="w-[22px] h-[22px] items-center justify-center">
                                                <ActivityIndicator size="small" color="#FF9E7D" />
                                            </View>
                                        ) : (
                                            <Ionicons name="trash-outline" size={22} color="#333" style={{ opacity: 0.2 }} />
                                        )}
                                    </Animated.View>
                                </TouchableOpacity>
                            );
                        })()}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};



export const JourneyScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();
    const { height: viewportHeight } = useWindowDimensions();
    const { entries, loading, toggleFavorite, deleteEntry } = useJournal();
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
    
    // Deletion states
    const [deletingId, setDeletingId] = useState<string | null>(null); // ID of item pending confirmation
    const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set()); // IDs currently animating out

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler(event => {
        scrollY.value = event.contentOffset.y;
    });

    useFocusEffect(
        React.useCallback(() => {
            checkProfileStatus();
            // We rely on Context for data fetching, effectively caching it.
        }, [])
    );

    const checkProfileStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setProfileLoading(false);
            return;
        }

        setIsAnonymous(user.is_anonymous || false);

        const { data } = await supabase
            .from('profiles')
            .select('display_name, onboarding_completed')
            .eq('id', user.id)
            .single();

        if (data) {
            setDisplayName(data.display_name);
            if (!data.display_name || !data.onboarding_completed) {
                setIsProfileIncomplete(true);
            } else {
                setIsProfileIncomplete(false);
            }
        }
        setProfileLoading(false);
    };

    const filteredEntries = useMemo(() => {
        if (filter === 'favorites') return entries.filter(e => e.is_favorite);
        return entries;
    }, [entries, filter]);

    const handleTrashPress = (id: string) => {
        const item = entries.find(e => e.id === id);
        if (!item) return;
        
        haptics.selection();
        const now = new Date();
        const entryDate = new Date(item.created_at);
        const diffInHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours > 24) {
            showAlert(
                "Too Late", 
                "You can only delete memories within 24 hours of creating them.", 
                [{ text: "Okay" }],
                'info'
            );
            return;
        }

        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        haptics.selection();
        const id = deletingId;
        setDeletingId(null);
        
        // Start animation
        setAnimatingIds(prev => new Set(prev).add(id));
    };

    const handleAnimationComplete = async (id: string) => {
        // Remove from animating set
        setAnimatingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        // Call context to delete (update state and DB)
        await deleteEntry(id);
    };

    const renderHeader = () => (
        <View>
            {/* Profile Nudge */}
            <ProfileNudge 
                isAnonymous={isAnonymous}
                isComplete={!isProfileIncomplete}
                loading={profileLoading}
                className="mb-8"
            />

            {/* Sunrays Card - Only show after a week of memories */}
            {entries.length >= 7 && (
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => { haptics.selection(); navigation.navigate('Memory' as never); }}
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
            )}

            {/* Filter Tabs */}
            <View className="flex-row mb-8 bg-inactive/10 p-1.5 rounded-2xl self-start">
                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setFilter('all'); }}
                    className={`px-6 py-2 rounded-[14px] ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-q-bold ${filter === 'all' ? 'text-text' : 'text-muted'}`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setFilter('favorites'); }}
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
        <>
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Your Journey" />
            </View>

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
                        onDelete={handleTrashPress} 
                        isDeletingProp={animatingIds.has(item.id)}
                        onDeleteAnimationComplete={handleAnimationComplete}
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
                        {loading ? (
                            <ActivityIndicator size="large" color="#FF9E7D" />
                        ) : (
                            <>
                                <Ionicons name="journal-outline" size={48} color="#E0E0E0" />
                                <Text className="text-lg font-q-medium text-muted mt-4 text-center">
                                    {filter === 'favorites' ? "No favorite entries yet." : "Your journey is just beginning."}
                                </Text>
                            </>
                        )}
                    </View>
                }
            />
        </Layout>
        
        {/* Delete Confirmation Sheet */}
        <BottomSheet 
            visible={!!deletingId} 
            onClose={() => setDeletingId(null)}
        >
            <View className="items-center">
                <Image source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
                <Text className="text-2xl font-q-bold text-text text-center mb-2">Wait, are you sure?</Text>
                <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4">
                    Mistakes happen! Are you sure you want to let this memory go?
                </Text>

                <TouchableOpacity 
                    onPress={confirmDelete}
                    className="w-full bg-[#FF7D7D] py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                >
                    <Text className="text-white font-q-bold text-lg">Yes, Delete It</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setDeletingId(null)}
                    className="py-2"
                >
                    <Text className="text-muted font-q-bold text-base">No, Keep It</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
        </>
    );
};
