import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * SecurityService: Handles biometric authentication (FaceID/Fingerprint).
 * 
 * DESIGN RATIONALE:
 * 1. Simple wrapper around expo-local-authentication.
 * 2. Checks for hardware support and enrollment before attempting.
 * 3. Provides a clean async interface for the UI.
 */

class SecurityService {
    /**
     * Checks if the device has biometric hardware and if any biometrics are enrolled.
     */
    async isSupported(): Promise<boolean> {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    }

    /**
     * Attempts to authenticate the user.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async authenticate(): Promise<boolean> {
        try {
            const results = await LocalAuthentication.authenticateAsync({
                promptMessage: Platform.OS === 'ios' ? 'Unlock your Cloud' : 'Authenticate to open Cloudy',
                fallbackLabel: 'Enter Passcode',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            return results.success;
        } catch (error) {
            console.error('[SecurityService] Authentication error:', error);
            return false;
        }
    }

    /**
     * Gets the types of biometrics supported on this device.
     */
    async getSupportedTypes() {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    }
}

export const security = new SecurityService();
