import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    View, Text, TouchableOpacity, Share, ScrollView, 
    FlatList, 
    useWindowDimensions, ListRenderItem, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { useJournal, JournalEntry } from '../context/JournalContext';
import { useTheme } from '../context/ThemeContext';
import { MascotImage } from '../components/MascotImage';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { navigationRef } from '../utils/navigation';
import { useAccent } from '../context/AccentContext';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSequence, 
    withSpring,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const GENERIC_TITLES = [
    "A moment from your journey",
    "A thought to remember",
    "A piece of your story",
    "Reflecting on the day",
    "A mindful capture",
    "Your journey in words",
    "A thought to keep",
    "Personal reflection"
];

const MemoryItem = React.memo(({ 
    item, 
    onToggleFavorite, 
    onDelete, 
    cardWidth, 
    screenWidth,
    getPrompt,
    isDarkMode,
    accentColor
}: { 
    item: JournalEntry, 
    onToggleFavorite: (item: JournalEntry) => void, 
    onDelete: (id: string) => void,
    cardWidth: number,
    screenWidth: number,
    getPrompt: (item: JournalEntry) => string,
    isDarkMode: boolean,
    accentColor: string
}) => {
    const now = new Date();
    const entryDate = new Date(item.created_at);
    const diffInHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
    const canDelete = diffInHours <= 24;

    const heartScale = useSharedValue(1);
    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const handleFavorite = () => {
        onToggleFavorite(item);
        heartScale.value = withSequence(withSpring(1.4), withSpring(1));
    };

    return (
        <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
            <View 
                className="bg-card rounded-[48px] p-8 shadow-sm"
                style={{ height: 380, width: cardWidth }}
            >
                <View style={{ flex: 1 }}>

                    
                    <Text className="text-xl font-q-bold text-text mb-4 px-2 leading-7">
                        {getPrompt(item)}
                    </Text>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-lg font-q-medium text-text/70 leading-relaxed px-2">
                            {item.text}
                        </Text>
                    </ScrollView>

                    <Divider className="mt-2" />

                    <View className="flex-row justify-between items-center pt-4">
                        <View className="flex-row items-center px-4 py-2 rounded-full" style={{ backgroundColor: `${accentColor}1A` }}>
                            <Ionicons name="time-outline" size={16} color={accentColor} />
                            <Text className="font-q-semibold ml-2 text-sm" style={{ color: accentColor }}>
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </Text>
                        </View>
                        <View className="flex-row items-center space-x-1">
                            <TouchableOpacity 
                                onPress={handleFavorite}
                                className="p-2"
                            >
                                <Animated.View style={animatedHeartStyle}>
                                    <Ionicons 
                                        name={item.is_favorite ? "heart" : "heart-outline"} 
                                        size={22} 
                                        color={item.is_favorite ? accentColor : (isDarkMode ? "#E5E7EB" : "#333333")} 
                                        style={{ opacity: item.is_favorite ? 1 : 0.4 }}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                            
                            {canDelete && (
                                <TouchableOpacity 
                                    onPress={() => onDelete(item.id)}
                                    className="p-2"
                                >
                                    <Ionicons 
                                        name="trash-outline" 
                                        size={22} 
                                        color={isDarkMode ? "#E5E7EB" : "#333333"} 
                                        style={{ opacity: 0.4 }} 
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.item.is_favorite === next.item.is_favorite &&
           prev.item.text === next.item.text &&
           prev.cardWidth === next.cardWidth &&
           prev.screenWidth === next.screenWidth &&
           prev.isDarkMode === next.isDarkMode &&
           prev.accentColor === next.accentColor;
});

export const MemoryScreen = () => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CARD_WIDTH = SCREEN_WIDTH - 48;
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();

    const getNavigation = () => {
        try {
            return useNavigation<any>();
        } catch (e) {
            return navigationRef as any;
        }
    };
    
    const navigation = getNavigation();
    const route = useRoute<any>();
    const { entries, toggleFavorite, deleteEntry, rawStreakData, hasMore, loadMore } = useJournal();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const listRef = useRef<FlatList>(null);
    
    const isMixMode = route.params?.filter === 'mix';

    const journalEntries = useMemo(() => {
        const filtered = entries.filter(e => !e.deleted_at);
        if (isMixMode) {
            // Fisher-Yates shuffle
            const array = [...filtered];
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        return filtered;
    }, [entries, isMixMode]);

    const totalCount = rawStreakData.length;

    const initialIndex = useMemo(() => {
        const entryId = route.params?.entryId;
        if (entryId && journalEntries.length > 0 && !isMixMode) {
            return journalEntries.findIndex(e => e.id === entryId);
        }
        return 0;
    }, [route.params?.entryId, journalEntries, isMixMode]);

    useEffect(() => {
        if (initialIndex !== -1 && journalEntries.length > 0) {
            setCurrentIndex(initialIndex);
            
            const timer = setTimeout(() => {
                listRef.current?.scrollToIndex({ 
                    index: initialIndex, 
                    animated: false 
                });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [initialIndex, journalEntries.length]);

    const getPromptForEntry = useCallback((item: JournalEntry) => {
        let hash = 0;
        for (let i = 0; i < item.id.length; i++) {
            hash = ((hash << 5) - hash) + item.id.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % GENERIC_TITLES.length;
        return GENERIC_TITLES[index] + '...';
    }, []);

    const scrollX = useSharedValue(0);
    const handleScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const mascotAnimatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (currentIndex - 1) * SCREEN_WIDTH,
            currentIndex * SCREEN_WIDTH,
            (currentIndex + 1) * SCREEN_WIDTH
        ];
        
        const rotate = interpolate(
            scrollX.value,
            inputRange,
            [5, 0, -5],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollX.value,
            inputRange,
            [10, 0, 10],
            Extrapolation.CLAMP
        );
        
        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.9, 1, 0.9],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateY },
                { rotate: `${rotate}deg` },
                { scale }
            ]
        };
    });

    const handleToggleFavorite = useCallback(async (item: JournalEntry) => {
        haptics.selection();
        await toggleFavorite(item.id, !item.is_favorite);
    }, [toggleFavorite]);

    const onDelete = useCallback((id: string) => {
        setDeletingId(id);
    }, []);

    const confirmDelete = async () => {
        if (!deletingId) return;
        haptics.heavy();
        setIsDeleting(true);
        const id = deletingId;
        setDeletingId(null);

        try {
            await deleteEntry(id);
            if (journalEntries.length <= 1) {
                navigation.goBack();
            }
        } catch (error) {
            console.error('[MemoryScreen] Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleShare = async (item: JournalEntry) => {
        haptics.selection();
        try {
            const dateStr = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            await Share.share({
                message: `Journal Entry (${dateStr}): "${item.text}"`,
            });
        } catch (error) {
            console.error('[MemoryScreen] Share error:', error);
        }
    };

    const renderItem: ListRenderItem<JournalEntry> = useCallback(({ item }) => (
        <MemoryItem
            item={item}
            onToggleFavorite={handleToggleFavorite}
            onDelete={onDelete}
            cardWidth={CARD_WIDTH}
            screenWidth={SCREEN_WIDTH}
            getPrompt={getPromptForEntry}
            isDarkMode={isDarkMode}
            accentColor={currentAccent.hex}
        />
    ), [handleToggleFavorite, onDelete, CARD_WIDTH, SCREEN_WIDTH, getPromptForEntry, isDarkMode, currentAccent.hex]);

    if (!journalEntries || journalEntries.length === 0) {
        return (
            <Layout useSafePadding={false}>
                <View className="px-6 pt-4">
                    <TopNav title="Journal" onBack={() => navigation.goBack()} />
                </View>
                <View className="flex-1 items-center justify-center p-12">
                     <MascotImage source={MASCOTS.SAD} className="w-48 h-48 mb-6" resizeMode="contain" />
                     <Text className="text-lg font-q-bold text-muted text-center">No memories found.</Text>
                </View>
            </Layout>
        );
    }

    const activeEntry = journalEntries[currentIndex] || journalEntries[0];
    const displayDate = new Date(activeEntry.created_at).toLocaleDateString([], { 
        month: 'short', day: 'numeric', year: 'numeric' 
    });

    return (
        <>
            <Layout noScroll useSafePadding={false} className="px-0 py-0">
                <View className="px-6 pt-4">
                    <TopNav 
                        title={displayDate}
                        subtitle={isMixMode ? "CHEF'S SPECIAL" : "MEMORY INSPECTOR"}
                        rightElement={
                            <TouchableOpacity 
                                onPress={() => handleShare(activeEntry)} 
                                className="p-2 -mr-2 items-center justify-center w-12 h-12 active:scale-90 transition-transform"
                            >
                                <Ionicons name="share-outline" size={28} color={isDarkMode ? "#E5E7EB" : "#333333"} />
                            </TouchableOpacity>
                        }
                        onBack={() => navigation.goBack()}
                        roundButtons
                    />
                </View>

                <View className="flex-1">
                    <Animated.View style={[{ height: 256, justifyContent: 'center', alignItems: 'center' }, mascotAnimatedStyle]}>
                        <MascotImage source={isMixMode ? MASCOTS.CHEF : MASCOTS.INSPECT} className="w-56 h-56" resizeMode="contain" />
                    </Animated.View>

                    <AnimatedFlatList
                        ref={listRef}
                        data={journalEntries}
                        renderItem={renderItem as any}
                        keyExtractor={(item: any) => item.id}
                        horizontal
                        pagingEnabled
                        disableIntervalMomentum={true}
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={SCREEN_WIDTH}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                            if (index !== currentIndex) {
                                setCurrentIndex(index);
                                haptics.selection();
                            }
                        }}
                        onEndReached={() => {
                            if (hasMore) {
                                loadMore();
                            }
                        }}
                        onEndReachedThreshold={2}
                        windowSize={3}
                        initialScrollIndex={initialIndex !== -1 ? initialIndex : 0}
                        getItemLayout={(_, index) => ({
                            length: SCREEN_WIDTH,
                            offset: SCREEN_WIDTH * index,
                            index,
                        })}
                    />
                </View>


                <View className="flex-row items-center justify-between px-8 pb-12 w-full">
                    <TouchableOpacity 
                        onPress={() => listRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })}
                        disabled={currentIndex === 0}
                        className={`bg-card w-14 h-14 items-center justify-center rounded-full shadow-lg ${currentIndex === 0 ? 'opacity-20' : ''}`}
                    >
                        <Ionicons name="chevron-back" size={24} color={currentAccent.hex} />
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-text font-q-bold text-base">{currentIndex + 1} / {totalCount}</Text>
                        <Text className="text-muted font-q-medium text-[10px] uppercase tracking-widest mt-1">Swipe to explore</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => {
                            if (currentIndex < journalEntries.length - 1) {
                                listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
                            }
                        }}
                        disabled={currentIndex === totalCount - 1}
                        className={`bg-card w-14 h-14 items-center justify-center rounded-full shadow-lg ${currentIndex === totalCount - 1 ? 'opacity-20' : ''}`}
                    >
                        <Ionicons name="chevron-forward" size={24} color={currentAccent.hex} />
                    </TouchableOpacity>
                </View>
            </Layout>

            <BottomSheet visible={!!deletingId} onClose={() => setDeletingId(null)}>
                <View className="items-center w-full">
                    <Image source={MASCOTS.SAD} className="w-32 h-32 mb-4" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-4">Delete this memory?</Text>
                    <Text className="text-base font-q-medium text-muted text-center mb-8 px-4 leading-6">This action cannot be undone. Are you sure?</Text>
                    <Button label="Yes, Delete It" onPress={confirmDelete} variant="primary" />
                    <TouchableOpacity onPress={() => setDeletingId(null)} className="mt-4">
                        <Text className="text-muted font-q-bold">No, Keep It</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </>
    );
};
