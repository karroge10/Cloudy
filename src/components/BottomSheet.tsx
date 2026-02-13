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
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
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
                        bounciness: 5,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
            }).start();
        }
    }, [visible]);

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
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
                    <Animated.View style={{ opacity: backdropOpacity }} className="absolute inset-0 bg-black/40" />
                </TouchableWithoutFeedback>
                
                <Animated.View 
                    style={{ 
                        transform: [{ translateY }],
                        maxHeight: SCREEN_HEIGHT * 0.85
                    }}
                    className="bg-background rounded-t-[40px] shadow-2xl overflow-hidden"
                >
                    {/* Handle Bar Area */}
                    <View 
                        {...panResponder.panHandlers}
                        className="items-center pt-3 pb-6 w-full"
                    >
                        <View className="w-12 h-1.5 bg-inactive rounded-full mb-4" />
                        {title && (
                            <Text className="text-2xl font-q-bold text-text px-8 self-start">
                                {title}
                            </Text>
                        )}
                    </View>

                    {/* Content */}
                    <View className="px-8 pb-12">
                        {children}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
