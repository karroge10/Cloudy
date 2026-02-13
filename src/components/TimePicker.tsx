import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, NativeSyntheticEvent, NativeScrollEvent, Animated } from 'react-native';
import { haptics } from '../utils/haptics';

interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// To create an infinite feel, we repeat the data
const REPEAT_COUNT = 10; 

interface ScrollWheelProps {
    data: string[];
    index: number;
    onSelect: (value: number) => void;
    label: string;
}

const ScrollWheel: React.FC<ScrollWheelProps> = ({ data, index, onSelect, label }) => {
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const [localIndex, setLocalIndex] = useState(index);
    const isScrolling = useRef(false);
    
    // Create an expanded array for infinite-like scrolling
    const infiniteData = Array.from({ length: REPEAT_COUNT }, (_) => data).flat();
    const centerOffset = (REPEAT_COUNT / 2) * data.length;
    const initialIndex = centerOffset + index;

    useEffect(() => {
        // Initial positioning
        const timer = setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: initialIndex,
                animated: false,
                viewOffset: 0
            });
            scrollY.setValue(initialIndex * ITEM_HEIGHT);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // We only update the parent DATE when the user is done interacting.
    // This prevents the whole screen from re-rendering 60 times a second,
    // which is what causes the "buggy" feel/jumping.
    const handleScrollComplete = (offsetY: number) => {
        const newIndex = Math.round(offsetY / ITEM_HEIGHT);
        const actualValue = newIndex % data.length;
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
                
                // Haptics and local visual state update immediately
                if (newIndex !== localIndex) {
                    setLocalIndex(newIndex);
                    haptics.selection();
                }

                // Handle silent jump for infinite looping
                if (y <= data.length * ITEM_HEIGHT || y >= (infiniteData.length - data.length * 2) * ITEM_HEIGHT) {
                    const actualValue = newIndex % data.length;
                    const jumpIndex = centerOffset + actualValue;
                    flatListRef.current?.scrollToIndex({
                        index: jumpIndex,
                        animated: false,
                        viewOffset: 0
                    });
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
                    style={{ height: ITEM_HEIGHT + 4, top: ITEM_HEIGHT - 2 }}
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
                    ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    renderItem={renderItem}
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
                    <Text className="text-4xl font-q-bold text-primary/30">:</Text>
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
