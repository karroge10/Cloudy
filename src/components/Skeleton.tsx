import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence 
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
    borderRadius?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
    width = '100%', 
    height = 20, 
    style, 
    borderRadius = 4 
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    backgroundColor: '#E0E0E0',
                },
                style,
                animatedStyle,
            ]}
        />
    );
};

const LoadingSkeleton = () => (
    <View className="px-6 space-y-8">
        {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row">
                <View className="items-center mr-6">
                    <View className="w-[1px] h-4 bg-transparent" />
                    <Skeleton width={64} height={64} borderRadius={32} />
                    <View className="w-[1px] flex-1 bg-inactive" />
                </View>
                <View className="flex-1 pb-10">
                    <Skeleton height={140} borderRadius={32} />
                </View>
            </View>
        ))}
    </View>
);
