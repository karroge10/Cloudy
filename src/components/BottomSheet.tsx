import React, { useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    TouchableOpacity, 
    Animated, 
    PanResponder, 
    Dimensions,
    TouchableWithoutFeedback
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
    
    const backdropOpacity = translateY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
                const isSwipeDown = gestureState.dy > 5;
                
                if (isVerticalSwipe && isSwipeDown) {
                    return true;
                }
                return false;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.3) {
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
                    style={{ 
                        transform: [{ translateY }],
                        maxHeight: SCREEN_HEIGHT * 0.9
                    }}
                    className="bg-background rounded-t-[44px] shadow-2xl overflow-hidden"
                >
                    {/* Handle Bar Area */}
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

                    {/* Content - wrapped in a View that stops propagation if needed, but currently allowing swipes from empty space */}
                    <View className="px-8 pb-12 pt-4">
                        {children}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};



