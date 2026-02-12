import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * HapticService: A centralized utility for handling device vibrations.
 * 
 * DESIGN RATIONALE:
 * 1. Centralizes all haptic logic to one place (DRY).
 * 2. Provides console logging for emulator testing.
 * 3. Safely handles calls only if the user has enabled them in settings.
 */

class HapticService {
    private enabled: boolean = true;

    /**
     * Set the global enablement state. 
     * Usually populated from the user's Profile settings.
     */
    setEnabled(status: boolean) {
        this.enabled = status;
    }

    private run(impact: () => Promise<void>, label: string) {
        if (!this.enabled) return;

        // EMULATOR TESTING: Since emulators don't vibrate, we log to the console
        // so the developer can see the interaction firing.
        if (__DEV__) {
            console.log(`[HapticService] ${label} impact generated`);
        }

        impact().catch(e => console.warn('Haptic failed', e));
    }

    light() {
        this.run(
            () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
            'LIGHT'
        );
    }

    medium() {
        this.run(
            () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
            'MEDIUM'
        );
    }

    heavy() {
        this.run(
            () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
            'HEAVY'
        );
    }

    success() {
        this.run(
            () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
            'SUCCESS'
        );
    }

    warning() {
        this.run(
            () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
            'WARNING'
        );
    }

    error() {
        this.run(
            () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
            'ERROR'
        );
    }

    selection() {
        this.run(
            () => Haptics.selectionAsync(),
            'SELECTION'
        );
    }
}

export const haptics = new HapticService();
