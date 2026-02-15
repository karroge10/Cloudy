import { Asset } from 'expo-asset';
import { MASCOTS } from '../constants/Assets';

/**
 * Preloads all mascot images into memory silently.
 * This ensures that when the user opens mascot selector or any screen
 * with mascots, the images appear instantly.
 */
export const preloadAssets = async () => {
    try {
        // Priority 1: Splash screen mascot
        await Asset.loadAsync([MASCOTS.WRITE]);
        
        // Priority 2: All other mascots
        const mascotAssets = Object.values(MASCOTS);
        await Asset.loadAsync(mascotAssets);
    } catch (error) {
        console.error('[AssetLoader] Error preloading assets:', error);
    }
};
