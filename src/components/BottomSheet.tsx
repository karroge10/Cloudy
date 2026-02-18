import React, { useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    Animated, 
    PanResponder, 
    Dimensions,
    TouchableWithoutFeedback,
    Keyboard,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
    visible, 
    onClose, 
    title, 
    children 
}) => {
    const { isDarkMode } = useTheme();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            Animated.spring(keyboardOffset, {
                toValue: -e.endCoordinates.height,
                useNativeDriver: true,
                damping: 25,
                stiffness: 200,
            }).start();
        });

        const hideSub = Keyboard.addListener(hideEvent, () => {
            Animated.spring(keyboardOffset, {
                toValue: 0,
                useNativeDriver: true,
                damping: 25,
                stiffness: 200,
            }).start();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const combinedTranslateY = Animated.add(translateY, keyboardOffset);
    
    const backdropOpacity = translateY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (e) => {
                const isHandle = e.nativeEvent.locationY < 80;
                // Only claim immediately on handle to avoid blocking buttons on start
                return isHandle;
            },
            onStartShouldSetPanResponderCapture: () => false,
            
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const absDy = Math.abs(gestureState.dy);
                const absDx = Math.abs(gestureState.dx);
                // Be more permissive: if moving down even slightly, check if it's vertical
                const isVertical = absDy > absDx;
                const isSignificant = absDy > 10 && isVertical;
                
                if (isSignificant) {
                    return true;
                }
                return false;
            },
            
            onMoveShouldSetPanResponderCapture: (e, gestureState) => {
                const isHandle = e.nativeEvent.locationY < 80;
                const isDragDown = gestureState.dy > 5;

                // Handle priority: capture immediately on drag down
                if (isHandle && isDragDown) {
                    return true;
                }

                // Body priority: capture if dragging down significantly (15px) 
                // and it's clearly a vertical gesture (to not block horizontal scroll if any)
                if (gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5) {
                    return true;
                }
                
                return false;
            },

            onPanResponderGrant: () => {
                // Granted logic here if needed
            },
            onPanResponderMove: (e, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || (gestureState.dy > 20 && gestureState.vy > 0.5)) {
                    haptics.selection();
                    closeModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 25, // Increased damping for faster settling
                        stiffness: 250, // Increased stiffness 
                        restDisplacementThreshold: 0.1,
                        restSpeedThreshold: 0.1,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 250,
                }).start();
            },
            onPanResponderTerminationRequest: () => true,
        })
    ).current;

    useEffect(() => {
        if (visible) {
            // Use timing for opening to be 100% sure it finishes fast and doesn't have a long spring-tail delay
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        } else {
            translateY.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

     return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="none"
            onRequestClose={closeModal}
        >
            <View className={`flex-1 justify-end ${isDarkMode ? 'dark' : ''}`}>
                <TouchableWithoutFeedback onPress={() => { haptics.selection(); closeModal(); }}>
                    <Animated.View 
                        style={{ opacity: backdropOpacity }} 
                        className="absolute inset-0 bg-black/40" 
                    />
                </TouchableWithoutFeedback>
                
                <Animated.View 
                    {...panResponder.panHandlers}
                    collapsable={false}
                    style={{ 
                        transform: [{ translateY: combinedTranslateY }],
                        maxHeight: SCREEN_HEIGHT * 0.9
                    }}
                    className="bg-background rounded-t-[44px] shadow-2xl"
                >
                    {/* Wrap everything in a touch consumer to prevent fall-through to backdrop */}
                    <TouchableWithoutFeedback onPress={() => { /* Consumes touch */ }}>
                        <View>
                            {/* Visual Handle Bar */}
                            <View className="items-center pt-5 pb-5 w-full">
                                <View className="w-16 h-1.5 bg-text/10 rounded-full" />
                            </View>

                            {title && (
                                <View className="px-8 pt-4 pb-2">
                                    <Text className="text-2xl font-q-bold text-text">
                                        {title}
                                    </Text>
                                </View>
                            )}

                            {/* Content area */}
                            <View className="px-8 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 24) + 12 }}>
                                {children}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>

                    {/* Bottom Filler: covers the gap when the sheet slides up for the keyboard */}
                    <View 
                        className="absolute top-[100%] left-0 right-0 bg-background" 
                        style={{ height: SCREEN_HEIGHT }}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};
