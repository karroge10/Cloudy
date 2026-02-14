import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Share, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { useJournal } from '../context/JournalContext';
import { MascotImage } from '../components/MascotImage';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
    withSpring,
    runOnJS
} from 'react-native-reanimated';

export const MemoryScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { entries, toggleFavorite } = useJournal();
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Filter non-deleted entries
    const journalEntries = entries.filter(e => !e.deleted_at);

    // Initial effect to jump to a specific entry if entryId is provided in navigation params
    useEffect(() => {
        if (route.params?.entryId && journalEntries.length > 0) {
            const index = journalEntries.findIndex(e => e.id === route.params.entryId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [route.params?.entryId, journalEntries.length]);
    
    const contentOpacity = useSharedValue(1);
    const contentScale = useSharedValue(1);
    const heartScale = useSharedValue(1);

    if (journalEntries.length === 0) {
        return (
            <Layout backgroundColors={['#FFF9F0', '#fff1db']}>
                <View className="px-6 pt-4">
                    <TopNav title="No Memories Yet" onBack={() => navigation.goBack()} />
                </View>
                <View className="flex-1 items-center justify-center px-10">
                    <MascotImage source={MASCOTS.SAD} className="w-64 h-64 mb-6" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-4">You haven't written anything yet</Text>
                    <Text className="text-lg font-q-medium text-muted text-center">Start your journey on the home screen!</Text>
                </View>
            </Layout>
        );
    }

    const currentMemory = journalEntries[currentIndex];
    const isLiked = currentMemory.is_favorite;

    const handleNextMemory = () => {
        haptics.medium();
        contentOpacity.value = withTiming(0, { duration: 150 }, () => {
            runOnJS(setCurrentIndex)((currentIndex + 1) % journalEntries.length);
            contentOpacity.value = withTiming(1, { duration: 250 });
        });
    };

    const toggleHeart = () => {
        toggleFavorite(currentMemory.id, !isLiked);
        heartScale.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withSpring(1)
        );
    };

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ scale: contentScale.value }]
    }));

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const handleShare = async () => {
        haptics.selection();
        try {
            const dateStr = new Date(currentMemory.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            await Share.share({
                message: `Check out this memory from Cloudy: "${currentMemory.text}" - ${dateStr}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const ShareButton = (
        <TouchableOpacity onPress={handleShare} className="w-12 h-12 items-center justify-center">
            <Ionicons name="share-outline" size={28} color="#333" />
        </TouchableOpacity>
    );

    const formattedDate = new Date(currentMemory.created_at).toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    const isInspectorMode = !!route.params?.entryId;

    return (
        <Layout 
            noScroll={true} 
            backgroundColors={['#FFF9F0', '#fff1db']}
            className="px-0 py-0"
        >
            <View className="px-6 pt-4">
                <Animated.View style={animatedContentStyle}>
                    <TopNav 
                        subtitle={isInspectorMode ? "Memory Inspector" : "Sunrays"}
                        title={formattedDate}
                        rightElement={ShareButton}
                        onBack={() => navigation.goBack()}
                        roundButtons={true}
                    />
                </Animated.View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24, paddingVertical: 10 }}>
                <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                    <MascotImage 
                        source={isInspectorMode ? MASCOTS.INSPECT : MASCOTS.SUN} 
                        className="w-48 h-48" 
                        resizeMode="contain" 
                    />
                </View>

                {/* Fixed Card Container - Optimized height */}
                <View 
                    className="bg-card rounded-[48px] p-8 shadow-sm w-full relative"
                    style={{ height: 380 }} // Reduced from 420 for better universal fit
                >
                    <View style={{ flex: 1 }}>
                        <View className="absolute -top-2 -left-2">
                            <Text className="text-[#FF9E7D15] text-7xl font-q-bold">“</Text>
                        </View>
                        
                        <Text className="text-2xl font-q-bold text-text mb-3 px-2">I am grateful for...</Text>
                        
                        {/* ONLY the text animates during transitions */}
                        <Animated.View style={[{ flex: 1 }, animatedContentStyle]}>
                            <ScrollView 
                                style={{ flex: 1 }} 
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 8 }}
                            >
                                <Text className="text-lg font-q-medium text-text/70 leading-relaxed">
                                    {currentMemory.text}
                                </Text>
                            </ScrollView>
                        </Animated.View>

                        <View className="flex-row justify-between items-center pt-4 border-t border-primary/10">
                             <View className="flex-row items-center bg-[#FF9E7D10] px-4 py-2 rounded-full">
                                <Ionicons name="leaf" size={16} color="#FF9E7D" />
                                <Text className="text-primary font-q-semibold ml-2 text-sm">Daily Gratitude</Text>
                            </View>
                            <TouchableOpacity onPress={toggleHeart} activeOpacity={0.6}>
                                <Animated.View style={animatedHeartStyle}>
                                    <Ionicons 
                                        name={isLiked ? "heart" : "heart-outline"} 
                                        size={32} 
                                        color={isLiked ? "#FF9E7D" : "#AAA"} 
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Actions - Hidden in Inspector Mode to focus on single entry */}
            {!isInspectorMode ? (
                <View className="items-center pb-12">
                    <TouchableOpacity 
                        onPress={handleNextMemory} 
                        className="items-center active:scale-95" 
                        activeOpacity={1}
                        delayPressIn={0}
                    >
                        <View 
                            className="bg-white w-16 h-16 items-center justify-center rounded-full mb-4 shadow-xl shadow-[#00000015]"
                            style={{ elevation: 5 }}
                        >
                            <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                        </View>
                        <Text className="text-muted font-q-bold text-[10px] tracking-[2px] uppercase">Tap for next memory</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="pb-20" /> 
            )}
        </Layout>
    );
};
