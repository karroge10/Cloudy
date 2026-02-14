import { Asset } from 'expo-asset';
import { MASCOTS } from '../constants/Assets';

/**
 * Preloads all mascot images into memory silently.
 * This ensures that when the user opens mascot selector or any screen
 * with mascots, the images appear instantly.
 */
export const preloadAssets = async () => {
    try {
        const mascotAssets = Object.values(MASCOTS);
        
        // Use Asset.loadAsync for official Expo preloading
        await Asset.loadAsync(mascotAssets);
        
        if (__DEV__) console.log('[AssetLoader] All mascot assets preloaded successfully');
    } catch (error) {
        console.error('[AssetLoader] Error preloading assets:', error);
    }
};
