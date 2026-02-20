import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { MASCOTS } from '../constants/Assets';
import { InteractionManager } from 'react-native';

/**
 * Preloads critical assets needed for the first screen (Home) and lock screen.
 * This should be awaited before hiding the splash screen.
 */
export const preloadCriticalAssets = async () => {
    const start = Date.now();
    try {
        console.log('[AssetLoader] Starting critical asset preload...');
        // Load what's needed for Home screen, Tab menu, and Privacy overlay
        await Promise.all([
            Asset.loadAsync([
                MASCOTS.WRITE, 
                MASCOTS.LOCK,
                MASCOTS.HUG,    // Streak Lost
                MASCOTS.SAD,    // Logout/No data
                MASCOTS.HELLO,  // Logout/Welcome
                MASCOTS.STAR,   // Review nudge
                MASCOTS.ENVELOPE // Feedback
            ]),
            Font.loadAsync(Ionicons.font)
        ]);
        
        const duration = (Date.now() - start) / 1000;
        console.log(`[AssetLoader] Critical assets loaded in ${duration.toFixed(3)}s`);
    } catch (error) {
        console.error('[AssetLoader] Error preloading critical assets:', error);
    }
};

/**
 * Preloads all other mascots in the background with staggering.
 * This ensures the JS bridge and network aren't saturated all at once.
 */
export const preloadBackgroundAssets = async () => {
    try {
        // Wait for first interaction/paint to settle
        await new Promise(resolve => InteractionManager.runAfterInteractions(() => resolve(null)));
        
        const mascotAssets = Object.values(MASCOTS);
        const criticalMascots = [
            MASCOTS.WRITE, 
            MASCOTS.LOCK, 
            MASCOTS.HUG, 
            MASCOTS.SAD, 
            MASCOTS.HELLO, 
            MASCOTS.STAR,
            MASCOTS.ENVELOPE
        ];
        const remaining = mascotAssets.filter(m => !criticalMascots.includes(m));

        console.log(`[AssetLoader] Starting background preload for ${remaining.length} assets...`);
        
        // Load in smaller batches to avoid "bunching up"
        const BATCH_SIZE = 3;
        for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
            const batch = remaining.slice(i, i + BATCH_SIZE);
            await Asset.loadAsync(batch);
            
            // Small gap between batches to let other tasks run
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('[AssetLoader] Background assets preloaded successfully');
    } catch (error) {
        console.error('[AssetLoader] Error preloading background assets:', error);
    }
};

