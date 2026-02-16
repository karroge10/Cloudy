import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { haptics } from '../utils/haptics';
import Animated, { 
    withTiming,
    withSpring,
    withSequence,
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';

import { TopNav } from '../components/TopNav';
import { Layout } from '../components/Layout';
import { BottomSheet } from '../components/BottomSheet';
import { MASCOTS } from '../constants/Assets';
import { Image } from 'react-native';
import { useJournal, JournalEntry } from '../context/JournalContext';
import { ProfileNudge } from '../components/ProfileNudge';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/Button';

import { useProfile } from '../context/ProfileContext';

const ITEM_HEIGHT = 180;

/**
 * TimelineItem - Optimized with FlashList recycling support
 * 
 * Simplified animations: Removed scroll-linked interpolateColor and 
 * per-frame opacity calculations that caused jank. Now uses simple
 * fade-in on mount and delete animation.
 */
const TimelineItem = ({ 
    item, 
    index,
    totalCount,
    onToggleFavorite,
    onDelete,
    isDeletingProp,
    onDeleteAnimationComplete
}: { 
    item: JournalEntry; 
    index: number;
    totalCount: number;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDelete: (id: string) => void;
    isDeletingProp: boolean;
    onDeleteAnimationComplete: (id: string) => void;
}) => {
    const navigation = useNavigation();
    const trashScale = useSharedValue(1);
    const itemOpacity = useSharedValue(1);
    const itemHeight = useSharedValue(ITEM_HEIGHT);

    const isFirst = index === 0;
    const isLast = index === totalCount - 1;

    // Delete animation
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
        onDelete(item.id);
        trashScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
    };

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: itemOpacity.value,
        height: itemHeight.value,
        overflow: 'hidden',
    }));

    const trashAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: trashScale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <View className="flex-row" style={{ height: ITEM_HEIGHT }}>
                {/* Left Column: Date & Line */}
                <View className="items-center mr-6">
                    <View className={`w-[1px] h-4 ${isFirst ? 'bg-transparent' : 'bg-inactive'}`} />
                    
                    <View 
                        className="w-16 h-16 rounded-full items-center justify-center shadow-sm z-10 bg-white"
                        style={{ shadowColor: '#00000010', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}
                    >
                        <View className="items-center justify-center">
                            <Text className="text-[10px] font-q-bold text-text">
                                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short' })}
                            </Text>
                            <Text className="text-xl font-q-bold text-text">
                                {new Date(item.created_at).getDate()}
                            </Text>
                        </View>
                    </View>

                    <View className={`w-[1px] flex-1 ${isLast ? 'bg-transparent' : 'bg-inactive'}`} />
                </View>

                {/* Right Column: Entry Card */}
                <View className="flex-1 pb-6">
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => {
                            haptics.selection();
                            (navigation as any).navigate('Memory', { entryId: item.id });
                        }}
                        className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl flex-1 justify-between"
                        style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                    >
                        <View>
                            <Text 
                                className="font-q-medium text-base leading-6 text-text"
                                numberOfLines={3}
                            >
                                {item.text}
                            </Text>
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
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleTrashPress();
                                        }}
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
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

// Memoized item for FlashList recycling
const MemoizedTimelineItem = React.memo(TimelineItem, (prev, next) => {
    return (
        prev.item.id === next.item.id &&
        prev.item.text === next.item.text &&
        prev.item.is_favorite === next.item.is_favorite &&
        prev.isDeletingProp === next.isDeletingProp &&
        prev.index === next.index &&
        prev.totalCount === next.totalCount
    );
});

export const JourneyScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();
    const { profile, isAnonymous, loading: profileLoading } = useProfile();
    const { 
        entries, 
        loading, 
        loadingMore,
        hasMore,
        toggleFavorite, 
        deleteEntry, 
        refreshEntries,
        loadMore 
    } = useJournal();
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Deletion states
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

    // FlashList ref for layout animations
    const listRef = useRef<FlashList<JournalEntry>>(null);

    const onRefresh = async () => {
        setIsRefreshing(true);
        haptics.light();
        await refreshEntries();
        setIsRefreshing(false);
    };

    const isProfileIncomplete = useMemo(() => {
        return !profile?.display_name || !profile?.onboarding_completed;
    }, [profile]);

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
        haptics.heavy();
        const id = deletingId;
        setDeletingId(null);
        
        // Prepare FlashList for layout animation
        listRef.current?.prepareForLayoutAnimationRender();
        
        // Start animation
        setAnimatingIds(prev => new Set(prev).add(id));
    };

    const handleAnimationComplete = async (id: string) => {
        setAnimatingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        await deleteEntry(id);
    };

    const renderItem = ({ item, index }: { item: JournalEntry; index: number }) => (
        <MemoizedTimelineItem 
            item={item} 
            index={index}
            totalCount={filteredEntries.length}
            onToggleFavorite={toggleFavorite}
            onDelete={handleTrashPress} 
            isDeletingProp={animatingIds.has(item.id)}
            onDeleteAnimationComplete={handleAnimationComplete}
        />
    );

    const ListHeader = useMemo(() => (
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
                    className={`px-6 py-2 rounded-[14px] active:scale-95 transition-transform ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-q-bold ${filter === 'all' ? 'text-text' : 'text-muted'}`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setFilter('favorites'); }}
                    className={`px-6 py-2 rounded-[14px] active:scale-95 transition-transform ${filter === 'favorites' ? 'bg-white shadow-sm' : ''}`}
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
    ), [isAnonymous, isProfileIncomplete, profileLoading, entries.length, filter, navigation]);

    const ListEmpty = useMemo(() => (
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
    ), [loading, filter]);

    const ListFooter = useMemo(() => (
        loadingMore ? (
            <View className="py-8 items-center">
                <ActivityIndicator color="#FF9E7D" size="large" />
                <Text className="text-muted font-q-bold mt-4">Discovering more memories...</Text>
            </View>
        ) : (
            <View className="h-24" />
        )
    ), [loadingMore]);

    return (
        <>
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Your Journey" />
            </View>

            <FlashList
                ref={listRef}
                data={filteredEntries}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                estimatedItemSize={ITEM_HEIGHT}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                
                // Pull to refresh
                onRefresh={onRefresh}
                refreshing={isRefreshing}
                
                // Infinite scroll
                onEndReached={() => {
                    if (filter === 'all' && hasMore) {
                        loadMore();
                    }
                }}
                onEndReachedThreshold={0.5}
            />
        </Layout>
        
        {/* Delete Confirmation Sheet */}
        <BottomSheet 
            visible={!!deletingId} 
            onClose={() => setDeletingId(null)}
        >
            <View className="items-center w-full">
                <Image source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
                <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">Wait, are you sure?</Text>
                <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                    Mistakes happen! Are you sure you want to let this memory go?
                </Text>

                <Button 
                    label="Yes, Delete It"
                    onPress={confirmDelete}
                    haptic="heavy"
                />

                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setDeletingId(null); }}
                    className="mt-4 py-2 active:scale-95 transition-transform"
                >
                    <Text className="text-muted font-q-bold text-base">No, Keep It</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
        </>
    );
};
