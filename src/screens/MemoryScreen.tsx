import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import * as Haptics from 'expo-haptics';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
    withSpring,
    runOnJS
} from 'react-native-reanimated';

const MOCK_MEMORIES = [
    {
        id: '1',
        date: 'Oct 24, 2023',
        text: 'A delicious cup of coffee and the feeling of calm it brought me this morning before the rush started.',
        category: 'Inner Peace',
    },
    {
        id: '2',
        date: 'Oct 23, 2023',
        text: 'My supportive friend who listened without judgment when I was feeling overwhelmed.',
        category: 'Social Support',
    },
    {
        id: '3',
        date: 'Oct 22, 2023',
        text: 'Finally finishing that book I\'ve been reading for months. The ending was perfect.',
        category: 'Achievement',
    }
];

export const MemoryScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    
    const contentOpacity = useSharedValue(1);
    const contentScale = useSharedValue(1);
    const heartScale = useSharedValue(1);

    const currentMemory = MOCK_MEMORIES[currentIndex];
    const isLiked = !!favorites[currentMemory.id];

    const handleNextMemory = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Simple fade out/in sequence without scale/shadow effects
        contentOpacity.value = withTiming(0, { duration: 150 }, () => {
            runOnJS(setCurrentIndex)((currentIndex + 1) % MOCK_MEMORIES.length);
            contentOpacity.value = withTiming(1, { duration: 250 });
        });
    };


    const toggleHeart = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        heartScale.value = withSequence(
            withTiming(1.4, { duration: 100 }),
            withSpring(1)
        );
        
        setFavorites(prev => ({
            ...prev,
            [currentMemory.id]: !prev[currentMemory.id]
        }));
    };

    const animatedContentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ scale: contentScale.value }]
    }));

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }]
    }));

    const handleShare = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({
                message: `Check out this memory from Cloudy: "${currentMemory.text}" - ${currentMemory.date}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const ShareButton = (
        <TouchableOpacity 
            onPress={handleShare}
            className="w-12 h-12 items-center justify-center"
        >
            <Ionicons name="share-outline" size={28} color="#333" />
        </TouchableOpacity>
    );

    return (
        <Layout 
            noScroll={true} 
            // Layout now defaults to our gradient, so we can remove this if we want strict conformity, 
            // but keeping it explicit here is fine too.
            backgroundColors={['#FFF9F0', '#fff1db']}
            className="px-0 py-0" // Remove Layout default padding to control specifically
        >
            <View className="px-6 pt-4">
                <TopNav 
                    subtitle="Memory"
                    title={currentMemory.date}
                    rightElement={ShareButton}
                    onBack={() => navigation.goBack()}
                    roundButtons={true}
                />
            </View>

            <View 
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
            >
                <View className="mb-12 items-center justify-center">
                    <Image 
                        source={MASCOTS.ZEN} 
                        className="w-56 h-56"
                        resizeMode="contain"
                    />
                </View>

                <View className="bg-card rounded-[48px] p-10 shadow-sm w-full relative">
                    <Animated.View style={animatedContentStyle}>
                        <View className="absolute top-8 left-8">
                            <Text className="text-[#FF9E7D15] text-7xl font-q-bold">“</Text>
                        </View>

                        <Text className="text-3xl font-q-bold text-text mb-6">I am grateful for...</Text>
                        
                        <Text className="text-xl font-q-medium text-text/70 leading-relaxed mb-10">
                            {currentMemory.text}
                        </Text>

                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center bg-[#FF9E7D10] px-5 py-2.5 rounded-full">
                                <Ionicons name="leaf" size={18} color="#FF9E7D" />
                                <Text className="text-primary font-q-semibold ml-2 text-lg">{currentMemory.category}</Text>
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
                <TouchableOpacity 
                    onPress={handleNextMemory}
                    className="items-center active:opacity-70"
                >
                    <View className="bg-white/60 w-16 h-16 items-center justify-center rounded-full mb-4 shadow-sm">
                        <Ionicons name="chevron-down" size={32} color="#FF9E7D" />
                    </View>
                    <Text className="text-muted font-q-bold text-[10px] tracking-[2px] uppercase">Tap for next memory</Text>
                </TouchableOpacity>
            </View>
        </Layout>
    );
};
