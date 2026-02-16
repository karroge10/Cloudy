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
import { haptics } from '../utils/haptics';

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
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;

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
            // Claim the touch if it hits the background area
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            
            // Steal the touch if moving down, even from children
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },

            onPanResponderGrant: (evt) => {
                console.log('[BottomSheet] Responder Granted at Y:', evt.nativeEvent.locationY);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    haptics.selection();
                    closeModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 150,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                }).start();
            },
            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 150,
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
            <View className="flex-1 justify-end">
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
                    {/* Entire container is now the swipe area */}
                    <View pointerEvents="box-none">
                        {/* Visual Handle Bar */}
                        <View className="items-center pt-4 pb-2 w-full">
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
                        <View className="px-8 pb-12 pt-4" pointerEvents="box-none">
                            {children}
                        </View>
                    </View>

                    {/* Bottom Filler: covers the gap when the sheet slides up for the keyboard */}
                    <View 
                        className="absolute top-[98%] left-0 right-0 height-[1000px] bg-background" 
                        style={{ height: SCREEN_HEIGHT }}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};



