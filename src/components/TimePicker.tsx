import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, NativeSyntheticEvent, NativeScrollEvent, Animated, Platform } from 'react-native';
import { haptics } from '../utils/haptics';

interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Increased REPEAT_COUNT allows us to remove the aggressive "silent jump" logic during scroll
// which is what causes the jittery/stuck feeling.
const REPEAT_COUNT = 100; 

interface ScrollWheelProps {
    data: string[];
    index: number;
    onSelect: (value: number) => void;
    label: string;
}

const ScrollWheel: React.FC<ScrollWheelProps> = ({ data, index, onSelect, label }) => {
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const isScrolling = useRef(false);
    
    // Create an expanded array for infinite-like scrolling
    const infiniteData = Array.from({ length: REPEAT_COUNT }, (_) => data).flat();
    const centerOffset = Math.floor(REPEAT_COUNT / 2) * data.length;
    const initialIndex = centerOffset + index;

    // Use a ref and state together for performant haptics + visual feedback
    const localIndexRef = useRef(initialIndex);
    const [localIndex, setLocalIndex] = useState(initialIndex);

    useEffect(() => {
        // Initial positioning - using small delay to ensure layout is ready
        const timer = setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: initialIndex,
                animated: false,
                viewOffset: ITEM_HEIGHT // Offset by one ITEM_HEIGHT to center it
            });
            scrollY.setValue(initialIndex * ITEM_HEIGHT);
            localIndexRef.current = initialIndex;
            setLocalIndex(initialIndex);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleScrollComplete = (offsetY: number) => {
        const newIndex = Math.round(offsetY / ITEM_HEIGHT);
        // Correctly handling negative indices if user swipes past header
        const actualValue = ((newIndex % data.length) + data.length) % data.length;
        
        onSelect(actualValue);
        isScrolling.current = false;
    };

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { 
            useNativeDriver: true,
            listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const y = event.nativeEvent.contentOffset.y;
                const newIndex = Math.round(y / ITEM_HEIGHT);
                
                // Haptics and local visual state update immediately when a new number centers
                if (newIndex !== localIndexRef.current) {
                    localIndexRef.current = newIndex;
                    setLocalIndex(newIndex);
                    haptics.selection();
                }
            }
        }
    );

    const renderItem = ({ item, index: itemIndex }: { item: string; index: number }) => {
        const inputRange = [
            (itemIndex - 1) * ITEM_HEIGHT,
            itemIndex * ITEM_HEIGHT,
            (itemIndex + 1) * ITEM_HEIGHT,
        ];

        const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
        });

        const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.8, 1.1, 0.8],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View 
                style={{ 
                    height: ITEM_HEIGHT, 
                    opacity, 
                    transform: [{ scale }] 
                }} 
                className="items-center justify-center w-full"
            >
                <Text className="font-q-bold text-3xl text-text">
                    {item}
                </Text>
            </Animated.View>
        );
    };

    return (
        <View className="items-center">
            <View 
                className="bg-white rounded-[32px] w-[85px] items-center justify-center border-2 border-primary/20 shadow-sm overflow-hidden"
                style={{ height: CONTAINER_HEIGHT }}
            >
                {/* Selection Highlight Track */}
                <View 
                    style={{ height: ITEM_HEIGHT, top: ITEM_HEIGHT }}
                    className="absolute w-full border-y-2 border-primary/10 bg-primary/5 rounded-xl"
                />

                <Animated.FlatList
                    ref={flatListRef}
                    data={infiniteData}
                    keyExtractor={(_, i) => `${label}-${i}`}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    // disableIntervalMomentum is key for that "snap and lock" feel on Android/iOS
                    disableIntervalMomentum={true}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    onScrollBeginDrag={() => { isScrolling.current = true; }}
                    onScrollEndDrag={(e) => handleScrollComplete(e.nativeEvent.contentOffset.y)}
                    onMomentumScrollEnd={(e) => handleScrollComplete(e.nativeEvent.contentOffset.y)}
                    getItemLayout={(_, i) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * i,
                        index: i,
                    })}
                    // Header and Footer provide the necessary padding to center items
                    ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    renderItem={renderItem}
                    removeClippedSubviews={true}
                    initialNumToRender={VISIBLE_ITEMS + 2}
                    onScrollToIndexFailed={() => {
                        // Safe fallback for edge cases
                    }}
                />
            </View>
            <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-3">{label}</Text>
        </View>
    );
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const hoursArr = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutesArr = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const currentHours = value.getHours();
    const currentMinutes = value.getMinutes();

    const handleHourSelect = (val: number) => {
        const next = new Date(value);
        next.setHours(val);
        onChange(next);
    };

    const handleMinuteSelect = (val: number) => {
        const next = new Date(value);
        next.setMinutes(val);
        onChange(next);
    };

    return (
        <View className="w-full items-center">
            <View className="flex-row items-center justify-center">
                <ScrollWheel 
                    data={hoursArr} 
                    index={currentHours} 
                    onSelect={handleHourSelect} 
                    label="Hour"
                />

                <View className="px-5 items-center justify-center mb-6">
                    <Text className="text-5xl font-q-bold text-primary/30">:</Text>
                </View>

                <ScrollWheel 
                    data={minutesArr} 
                    index={currentMinutes} 
                    onSelect={handleMinuteSelect} 
                    label="Min"
                />
            </View>
        </View>
    );
};
