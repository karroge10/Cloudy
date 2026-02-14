import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, Platform } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { MascotImage } from './MascotImage';

const { width, height } = Dimensions.get('window');

/**
 * A beautiful, animated splash screen that bridges the gap between 
 * the native splash and the app content.
 */
export const CustomSplashScreen = ({ onFinish, skipAnimation = false }: { onFinish: () => void, skipAnimation?: boolean }) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const mascotScale = useRef(new Animated.Value(0.8)).current;
    const mascotTranslateY = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;

    useEffect(() => {
        if (skipAnimation) {
            onFinish();
            return;
        }

        // Start animations
        Animated.parallel([
            // Mascot pop in
            Animated.spring(mascotScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            // Floating effect
            Animated.loop(
                Animated.sequence([
                    Animated.timing(mascotTranslateY, {
                        toValue: -15,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(mascotTranslateY, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ])
            ),
            // Text fade in
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 800,
                delay: 400,
                useNativeDriver: true,
            })
        ]).start();

        // Finish after 2.2 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(onFinish);
        }, 2200);

        return () => clearTimeout(timer);
    }, [skipAnimation]);

    if (skipAnimation) return null;

    return (
        <Animated.View 
            style={{ 
                opacity: fadeAnim,
                backgroundColor: '#FFF9F0',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Animated.View style={{ 
                transform: [
                    { scale: mascotScale },
                    { translateY: mascotTranslateY }
                ],
                alignItems: 'center'
            }}>
                <MascotImage 
                    source={MASCOTS.WRITE} 
                    className="w-56 h-56" 
                    resizeMode="contain" 
                />
            </Animated.View>
            
            <Animated.View style={{ opacity: textOpacity, marginTop: 40, alignItems: 'center' }}>
                <Text className="text-4xl font-q-bold text-text">Cloudy</Text>
                <Text className="text-lg font-q-medium text-muted mt-2">Your mindful companion</Text>
            </Animated.View>
        </Animated.View>
    );
};
