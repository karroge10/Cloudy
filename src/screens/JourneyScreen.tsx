import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ActivityIndicator, RefreshControl, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FlashList, ViewToken, FlashListRef } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJournal, JournalEntry } from '../context/JournalContext';
import { ProfileNudge } from '../components/ProfileNudge';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/Button';
import { useProfile } from '../context/ProfileContext';
import { CalendarView } from '../components/CalendarView';

const ITEM_HEIGHT = 190;

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
    onDeleteAnimationComplete,
    onPress
}: { 
    item: JournalEntry; 
    index: number;
    totalCount: number;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    onDelete: (id: string) => void;
    isDeletingProp: boolean;
    onDeleteAnimationComplete: (id: string) => void;
    onPress: () => void;
}) => {
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
                        className="w-16 h-16 rounded-full items-center justify-center shadow-sm bg-white"
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
                        onPress={onPress}
                        className="bg-card rounded-[40px] p-6 shadow-[#0000000D] shadow-xl flex-1 justify-between relative overflow-hidden"
                        style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                    >
                        <View className="absolute -top-3 -left-3 opacity-30">
                             <Text className="text-[#FF9E7D] text-8xl font-q-bold opacity-10 leading-none">"</Text>
                        </View>

                        <View className="mt-2 ml-1">
                            <Text 
                                className="font-q-medium text-base leading-6 text-text/80"
                                numberOfLines={4}
                            >
                                {item.text}
                            </Text>
                        </View>
                        
                        <View className="flex-row justify-between mt-4 md:mt-6 items-center">
                            <View className="flex-row items-center bg-[#FF9E7D10] px-3 py-1 rounded-full">
                                <Ionicons name="time-outline" size={14} color="#FF9E7D" />
                                <Text className="text-primary font-q-semibold ml-2 text-xs">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </Text>
                            </View>
                            <View className="flex-row items-center space-x-2">
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
        loadMore,
        rawStreakData,
        fetchEntriesForDate,
        filterMode,
        setFilterMode
    } = useJournal();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const skipResetRef = useRef(false);

    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 80 + insets.bottom;

    useFocusEffect(
        useCallback(() => {
            skipResetRef.current = false;
            return () => {
                if (skipResetRef.current) {
                    return;
                }
                setFilterMode('all');
                setSelectedDate(null);
                setShowCalendar(false);
                fetchEntriesForDate(null);
            };
        }, [fetchEntriesForDate])
    );

    const handleEntryPress = useCallback((entryId: string) => {
        haptics.selection();
        skipResetRef.current = true;
        (navigation as any).navigate('Memory', { entryId });
    }, [navigation]);

    const handleDateSelect = (date: string | null) => {
        haptics.selection();
        setSelectedDate(date);
        setShowCalendar(false);
        fetchEntriesForDate(date);
        
        if (!date) {
            setTimeout(() => {
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 250); // Slightly longer timeout for server fetch to start/finish
        }
    };

    const markedDates = useMemo(() => {
        const dates = new Set<string>();
        rawStreakData.forEach(item => {
            const date = new Date(item.created_at);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            dates.add(`${year}-${month}-${day}`);
        });
        return dates;
    }, [rawStreakData]);
    
    // Deletion states
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

    // Track centered/visible item for subtle highlight
    const [centeredId, setCenteredId] = useState<string | null>(null);

    // FlashList ref for layout animations
    const listRef = useRef<FlashListRef<JournalEntry>>(null);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
    }), []);

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
        // Now handled server-side in JournalContext
        return entries;
    }, [entries]);

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

       // Viewability config - track which item is most centered
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<JournalEntry>[] }) => {
        if (viewableItems.length > 0) {
            // Find the item closest to center (first in the middle of visible items)
            const middleIndex = Math.floor(viewableItems.length / 2);
            const centeredItem = viewableItems[middleIndex];
            if (centeredItem?.item?.id) {
                setCenteredId(centeredItem.item.id);
            }
        }
    }, []);
    const renderItem = ({ item, index }: { item: JournalEntry; index: number }) => (
        <MemoizedTimelineItem 
            item={item} 
            index={index}
            totalCount={filteredEntries.length}
            onToggleFavorite={toggleFavorite}
            onDelete={handleTrashPress} 
            isDeletingProp={animatingIds.has(item.id)}
            onDeleteAnimationComplete={handleAnimationComplete}
            onPress={() => handleEntryPress(item.id)}
        />
    );

    const ListHeader = useMemo(() => (
        <View style={{ zIndex: 100, elevation:Platform.OS === 'android' ? 100 : 0 }}>
            {/* Profile Nudge */}
            <ProfileNudge 
                isAnonymous={isAnonymous}
                loading={profileLoading}
                className="mb-8"
            />


            {/* Filter Controls */}
            <View className="mb-6">
                <View className="flex-row items-center justify-between">
                    <View 
                        className="flex-row items-center bg-card rounded-full p-1 shadow-sm border border-inactive/10"
                        style={{ shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: Platform.OS === 'android' ? 2 : undefined }}
                    >
                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); setFilterMode('all'); }}
                            className={`px-5 py-2 rounded-full ${filterMode === 'all' ? 'bg-primary' : 'bg-transparent'}`}
                            style={{ borderRadius: 20, overflow: 'hidden' }}
                        >
                            <Text className={`font-q-bold text-sm ${filterMode === 'all' ? 'text-white' : 'text-muted'}`}>
                                All
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); setFilterMode('favorites'); }}
                            className={`px-5 py-2 rounded-full flex-row items-center ${filterMode === 'favorites' ? 'bg-primary' : 'bg-transparent'}`}
                            style={{ borderRadius: 20, overflow: 'hidden' }}
                        >
                            <Ionicons 
                                name="heart" 
                                size={14} 
                                color={filterMode === 'favorites' ? "#FFFFFF" : "#7F7F7F"} 
                                style={{ marginRight: 4 }}
                            />
                            <Text className={`font-q-bold text-sm ${filterMode === 'favorites' ? 'text-white' : 'text-muted'}`}>
                                Favorites
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Button */}
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection();
                            setShowCalendar(prev => !prev); 
                        }}
                        className={`p-3 rounded-2xl shadow-sm ${selectedDate ? 'bg-primary/10 border-2 border-primary' : 'bg-card border border-inactive/10'}`}
                        style={{ shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: Platform.OS === 'android' ? 2 : undefined }}
                    >
                        <Ionicons 
                            name={selectedDate ? "calendar" : "calendar-outline"} 
                            size={20} 
                            color={selectedDate ? "#FF9E7D" : "#333"} 
                        />
                        {selectedDate && (
                            <View className="absolute -top-1 -right-1 bg-primary rounded-full w-5 h-5 items-center justify-center border-2 border-background">
                                <Text className="text-white text-[9px] font-q-bold">
                                    {new Date(selectedDate).getDate()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    ), [isAnonymous, isProfileIncomplete, profileLoading, entries.length, filterMode, navigation, showCalendar, selectedDate, markedDates]);

    const ListEmpty = useMemo(() => (
        <View className="items-center justify-center py-20">
            {loading ? (
                <View className="items-center">
                    <ActivityIndicator size="large" color="#FF9E7D" />
                    <Text className="text-muted font-q-bold mt-4">Loading memories...</Text>
                </View>
            ) : (
                <>
                    <Ionicons name="journal-outline" size={48} color="#E0E0E0" />
                    <Text className="text-lg font-q-medium text-muted mt-4 text-center px-6">
                        {selectedDate 
                            ? `No memories found for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                            : filterMode === 'favorites' 
                                ? "No favorite entries yet." 
                                : "Your journey is just beginning."
                        }
                    </Text>
                    {selectedDate && (
                        <TouchableOpacity 
                            onPress={() => handleDateSelect(null)}
                            className="mt-4"
                        >
                            <Text className="text-primary font-q-bold">View all entries</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    ), [loading, filterMode, selectedDate]);

    const ListFooter = useMemo(() => (
        loadingMore && !loading && !selectedDate ? (
            <View className="py-8 items-center">
                <ActivityIndicator color="#FF9E7D" size="large" />
                <Text className="text-muted font-q-bold mt-4">Loading memories...</Text>
            </View>
        ) : (
            <View className="h-24" />
        )
    ), [loadingMore, selectedDate, filterMode]);

    return (
        <>


        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <StatusBar style="dark" backgroundColor={showCalendar ? 'rgba(0,0,0,0.4)' : 'transparent'} translucent />
            <View className="px-6 pt-4">
                <TopNav title="Your Journey" />
            </View>

            <FlashList<JournalEntry>
                ref={listRef}
                data={filteredEntries}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={ListEmpty}
                ListFooterComponent={ListFooter}
                contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                
                // Pull to refresh
                onRefresh={onRefresh}
                refreshing={isRefreshing}
                
                // Viewability config
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                
                // Infinite scroll
                onEndReached={() => {
                    if (!selectedDate && hasMore) {
                        loadMore();
                    }
                }}
                onEndReachedThreshold={0.5}
            />

            {/* Calendar Overlay */}
            <Modal
                visible={showCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCalendar(false)}
            >
                <TouchableOpacity 
                    activeOpacity={1}
                    style={{ 
                        flex: 1, 
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        justifyContent: 'flex-start', // Moved to top
                        alignItems: 'center',
                        paddingHorizontal: 24,
                        paddingTop: Platform.OS === 'android' ? 120 : 140, // Closer to filter buttons
                    }}
                    onPress={() => setShowCalendar(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
                        <CalendarView 
                            markedDates={markedDates}
                            onDateSelect={handleDateSelect}
                            selectedDate={selectedDate}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
