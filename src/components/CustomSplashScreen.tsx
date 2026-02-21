import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { MascotImage } from './MascotImage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

/**
 * A beautiful, animated splash screen that bridges the gap between 
 * the native splash and the app content.
 */
export const CustomSplashScreen = ({ onFinish, skipAnimation = false }: { onFinish: () => void, skipAnimation?: boolean }) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
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
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();

        // Finish after 1.6 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(onFinish);
        }, 1600);

        return () => clearTimeout(timer);
    }, [skipAnimation]);

    if (skipAnimation) return null;

    return (
        <Animated.View 
            style={{ 
                opacity: fadeAnim,
                backgroundColor: isDarkMode ? '#111427' : '#FFF9F0',
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
            
            <Animated.View style={{ opacity: textOpacity, marginTop: 40, alignItems: 'center', width: '100%', paddingHorizontal: 32 }}>
                <Text className="text-4xl font-q-bold text-text text-center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} allowFontScaling={false}>
                    {t('common.appName')}
                </Text>
                <Text className="text-lg font-q-medium text-muted mt-2 text-center" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>
                    {t('splash.tagline')}
                </Text>
            </Animated.View>
        </Animated.View>
    );
};
