import React, { useRef, useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Animated,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Platform,
    Pressable,
} from 'react-native';
import { haptics } from '../utils/haptics';

/**
 * TIMEPICKER DESIGN RATIONALE:
 * 1. Uses FlatList with snapToInterval for a native wheel feel.
 * 2. Animated.Value tracks scroll position for smooth visual scaling/opacity.
 * 3. Haptics fire on every index change for tactile feedback.
 * 4. ListHeader/Footer components provide padding for selection centering.
 * 5. Pressable items allow tapping top/bottom numbers to slide them into focus.
 */

const ITEM_HEIGHT = 64; 
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface TimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

interface ScrollWheelProps {
    data: string[];
    initialValue: number;
    onSelect: (value: number) => void;
    label: string;
}

const ScrollItem = memo(({ 
    item, 
    index, 
    scrollY, 
    onPress 
}: { 
    item: string, 
    index: number, 
    scrollY: Animated.Value,
    onPress: (index: number) => void
}) => {
    const inputRange = [
        (index - 1) * ITEM_HEIGHT,
        index * ITEM_HEIGHT,
        (index + 1) * ITEM_HEIGHT,
    ];

    const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.8, 1.2, 0.8],
        extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.35, 1, 0.35],
        extrapolate: 'clamp',
    });

    return (
        <Pressable onPress={() => onPress(index)}>
            <Animated.View
                style={[
                    styles.itemContainer,
                    {
                        opacity,
                        transform: [{ scale }],
                    },
                ]}
            >
                <Text 
                    style={styles.itemText}
                    className="font-q-bold text-3xl text-text"
                >
                    {item}
                </Text>
            </Animated.View>
        </Pressable>
    );
});

const ScrollWheel = ({ data, initialValue, onSelect, label }: ScrollWheelProps) => {
    const scrollY = useRef(new Animated.Value(initialValue * ITEM_HEIGHT)).current;
    const flatListRef = useRef<FlatList>(null);
    const lastIdx = useRef(initialValue);

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: true,
            listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const y = event.nativeEvent.contentOffset.y;
                const idx = Math.round(y / ITEM_HEIGHT);
                
                if (idx !== lastIdx.current && idx >= 0 && idx < data.length) {
                    lastIdx.current = idx;
                    haptics.selection();
                }
            },
        }
    );

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        const idx = Math.round(y / ITEM_HEIGHT);
        if (idx >= 0 && idx < data.length) {
            onSelect(idx);
        }
    };

    const handlePressItem = useCallback((index: number) => {
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
        });
    }, []);

    return (
        <View className="items-center">
            <View 
                style={styles.wheelContainer}
                className="bg-card rounded-[32px] border-2 border-primary/20 shadow-sm overflow-hidden"
            >
                {/* Horizontal Center Guide */}
                <View 
                    style={styles.highlightBar}
                    className="absolute w-full bg-primary/5 border-y border-primary/10"
                    pointerEvents="none"
                />
                
                <Animated.FlatList
                    ref={flatListRef}
                    data={data}
                    renderItem={({ item, index }) => (
                        <ScrollItem 
                            item={item} 
                            index={index} 
                            scrollY={scrollY} 
                            onPress={handlePressItem}
                        />
                    )}
                    keyExtractor={(_, i) => i.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onScrollEndDrag={handleMomentumScrollEnd}
                    getItemLayout={(_, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                    })}
                    initialScrollIndex={initialValue}
                    ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            </View>
            <Text className="text-[10px] font-q-bold text-muted uppercase tracking-[2px] mt-3">{label}</Text>
        </View>
    );
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handleHourChange = useCallback((h: number) => {
        const next = new Date(value);
        next.setHours(h);
        onChange(next);
    }, [value, onChange]);

    const handleMinuteChange = useCallback((m: number) => {
        const next = new Date(value);
        next.setMinutes(m);
        onChange(next);
    }, [value, onChange]);

    return (
        <View className="w-full items-center">
            <View className="flex-row items-center justify-center">
                <ScrollWheel
                    data={hours}
                    initialValue={value.getHours()}
                    onSelect={handleHourChange}
                    label="Hour"
                />
                
                <View className="px-5 items-center justify-center mb-6">
                    <Text className="text-5xl font-q-bold text-primary/30">:</Text>
                </View>

                <ScrollWheel
                    data={minutes}
                    initialValue={value.getMinutes()}
                    onSelect={handleMinuteChange}
                    label="Min"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wheelContainer: {
        height: CONTAINER_HEIGHT,
        width: 100,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontFamily: Platform.OS === 'ios' ? 'Quicksand-Bold' : 'Quicksand_700Bold',
    },
    highlightBar: {
        height: ITEM_HEIGHT,
        top: ITEM_HEIGHT,
        zIndex: 1,
    },
});
