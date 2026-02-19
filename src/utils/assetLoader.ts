import { Asset } from 'expo-asset';
import { MASCOTS } from '../constants/Assets';

/**
 * Preloads critical assets needed for the first screen (Home) and lock screen.
 * This should be awaited before hiding the splash screen.
 */
export const preloadCriticalAssets = async () => {
    const start = Date.now();
    try {
        console.log('[AssetLoader] Starting critical asset preload...');
        // Load what's needed for Home screen and Privacy overlay
        await Asset.loadAsync([MASCOTS.WRITE, MASCOTS.LOCK]);
        
        const duration = (Date.now() - start) / 1000;
        console.log(`[AssetLoader] Critical assets loaded in ${duration.toFixed(3)}s`);
    } catch (error) {
        console.error('[AssetLoader] Error preloading critical assets:', error);
    }
};

/**
 * Preloads all other mascots in the background.
 * This should NOT be awaited during startup.
 */
export const preloadBackgroundAssets = async () => {
    try {
        const mascotAssets = Object.values(MASCOTS);
        // Expo is smart enough to skip already loaded assets (WRITE/LOCK)
        await Asset.loadAsync(mascotAssets);
        console.log('[AssetLoader] Background assets preloaded');
    } catch (error) {
        console.error('[AssetLoader] Error preloading background assets:', error);
    }
};

