import React from 'react';
import { View, Image } from 'react-native';
import { MASCOTS } from '../constants/Assets';

/**
 * This component renders all mascot images at 0 size and opacity.
 * This forces the OS/Native side to decode the image bitmaps into memory
 * before they are ever shown to the user. 
 */
export const AssetWarmup = () => {
    return (
        <View 
            style={{ 
                position: 'absolute', 
                width: 0, 
                height: 0, 
                opacity: 0, 
                overflow: 'hidden' 
            }} 
            pointerEvents="none"
        >
            {Object.values(MASCOTS).map((asset, index) => (
                <Image 
                    key={index} 
                    source={asset} 
                    fadeDuration={0}
                />
            ))}
        </View>
    );
};
