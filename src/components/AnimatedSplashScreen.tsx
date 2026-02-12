import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay, 
  runOnJS,
  Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationFinish: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationFinish }) => {
  const scale = useSharedValue(0.3);
  const mascotY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Entrance: Mascot pops in and slides up
    scale.value = withTiming(1, { 
      duration: 1000, 
      easing: Easing.out(Easing.back(1.5)) 
    });
    mascotY.value = withTiming(0, { 
      duration: 1000, 
      easing: Easing.out(Easing.exp) 
    });
    opacity.value = withTiming(1, { duration: 800 });

    // 2. Text appears slightly later
    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 800 })
    );

    // 3. Exit: Scale up and fade out everything
    const exitDelay = 2000;
    
    scale.value = withDelay(
      exitDelay,
      withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.quad) })
    );

    opacity.value = withDelay(
      exitDelay,
      withTiming(0, { duration: 600 })
    );

    containerOpacity.value = withDelay(
      exitDelay + 200,
      withTiming(0, { 
        duration: 400 
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationFinish)();
        }
      })
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: mascotY.value }
    ],
    opacity: opacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { translateY: withTiming(textOpacity.value === 1 ? 0 : 10) }
    ]
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Image 
          source={require('../../assets/splash-icon.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={animatedTextStyle}>
        <Animated.Text style={styles.appName}>
          Cloudy
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: width * 0.4,
    height: width * 0.4,
  },
  appName: {
    marginTop: 20,
    fontSize: 32,
    fontFamily: 'Quicksand_700Bold',
    color: '#FF9E7D',
  },
});
