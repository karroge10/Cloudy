import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { useJournal } from '../context/JournalContext';
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
    const journalEntries = entries.filter(e => !e.is_deleted);

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
                    <Image source={MASCOTS.SAD} className="w-64 h-64 mb-6" resizeMode="contain" />
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
                message: `Check out this memory from Cloudy: "${currentMemory.content}" - ${dateStr}`,
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

    return (
        <Layout 
            noScroll={true} 
            backgroundColors={['#FFF9F0', '#fff1db']}
            className="px-0 py-0"
        >
            <View className="px-6 pt-4">
                <TopNav 
                    subtitle="Memory"
                    title={formattedDate}
                    rightElement={ShareButton}
                    onBack={() => navigation.goBack()}
                    roundButtons={true}
                />
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                <View className="mb-12 items-center justify-center">
                    <Image source={MASCOTS.ZEN} className="w-56 h-56" resizeMode="contain" />
                </View>

                <View className="bg-card rounded-[48px] p-10 shadow-sm w-full relative">
                    <Animated.View style={animatedContentStyle}>
                        <View className="absolute top-8 left-8">
                            <Text className="text-[#FF9E7D15] text-7xl font-q-bold">“</Text>
                        </View>
                        <Text className="text-3xl font-q-bold text-text mb-6">I am grateful for...</Text>
                        <Text className="text-xl font-q-medium text-text/70 leading-relaxed mb-10">
                            {currentMemory.content}
                        </Text>
                        <View className="flex-row justify-between items-center">
                             <View className="flex-row items-center bg-[#FF9E7D10] px-5 py-2.5 rounded-full">
                                <Ionicons name="leaf" size={18} color="#FF9E7D" />
                                <Text className="text-primary font-q-semibold ml-2 text-lg">Daily Gratitude</Text>
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
                    </Animated.View>
                </View>
            </View>

            <View className="items-center pb-12">
                <TouchableOpacity onPress={handleNextMemory} className="items-center active:opacity-70">
                    <View className="bg-white/60 w-16 h-16 items-center justify-center rounded-full mb-4 shadow-sm">
                        <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                    </View>
                    <Text className="text-muted font-q-bold text-[10px] tracking-[2px] uppercase">Tap for next memory</Text>
                </TouchableOpacity>
            </View>
        </Layout>
    );
};
