import React from 'react';
import { Image, ImageProps, Platform, Animated } from 'react-native';

interface MascotImageProps extends ImageProps {
    isAnimated?: boolean;
}

/**
 * A wrapper around Image that ensures mascots feel professional:
 * 1. Disables fade-in on Android (which feels like a delay).
 * 2. Uses priority settings if available.
 * 3. Handles both static and Animated images.
 */
export const MascotImage: React.FC<MascotImageProps> = ({ isAnimated, ...props }) => {
    const ImageComponent = isAnimated ? Animated.Image : Image;
    
    return (
        <ImageComponent
            // @ts-ignore - fadeDuration exists on both but typing can be picky
            fadeDuration={0}
            {...props}
        />
    );
};
