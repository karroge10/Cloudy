import React, { useEffect, useState } from 'react';
import { View, Image, InteractionManager } from 'react-native';
import { MASCOTS } from '../constants/Assets';

/**
 * This component renders mascot images at 0 size and opacity.
 * This forces the OS/Native side to decode the image bitmaps into memory.
 * 
 * FIX: We now stagger this process to avoid locking the UI thread 
 * during the critical first paint.
 */
export const AssetWarmup = () => {
    const [warmupPhase, setWarmupPhase] = useState<'critical' | 'remaining' | 'none'>('none');

    useEffect(() => {
        // Start critical warmup immediately
        setWarmupPhase('critical');

        // Delay remaining assets until the UI is idle
        const task = InteractionManager.runAfterInteractions(() => {
            setWarmupPhase('remaining');
        });

        return () => task.cancel();
    }, []);

    const criticalMascots = [MASCOTS.WRITE, MASCOTS.LOCK];
    const remainingMascots = Object.values(MASCOTS).filter(m => !criticalMascots.includes(m));

    if (warmupPhase === 'none') return null;

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
            {/* Phase 1: Critical (Immediate) */}
            {criticalMascots.map((asset, index) => (
                <Image 
                    key={`critical-${index}`} 
                    source={asset} 
                    fadeDuration={0}
                />
            ))}

            {/* Phase 2: Remaining (Staggered/Delayed) */}
            {warmupPhase === 'remaining' && remainingMascots.map((asset, index) => (
                <Image 
                    key={`remaining-${index}`} 
                    source={asset} 
                    fadeDuration={0}
                />
            ))}
        </View>
    );
};

