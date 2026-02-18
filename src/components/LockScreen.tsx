import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, AppState, AppStateStatus, ActivityIndicator, Keyboard, Pressable, BackHandler } from 'react-native';
import { security } from '../utils/security';
import { haptics } from '../utils/haptics';
import { useProfile } from '../context/ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MASCOTS } from '../constants/Assets';
import { MascotImage } from './MascotImage';
import { useTheme } from '../context/ThemeContext';

/**
 * LockScreen: A premium security gate that protects the user's journal.
 * 
 * DESIGN RATIONALE:
 * 1. Instant Boot Protection: Uses AsyncStorage to lock before the first frame.
 * 2. Session Integrity: Uses a ref to ensure we don't re-lock after a successful auth 
 *    until the app actually leaves the foreground.
 * 3. Brand Aligned: Uses the same gradients and mascots as the rest of the app.
 */

export const LockScreen = ({ 
    children, 
    isActive, 
    initialLocked = false,
    isColdStart = true
}: { 
    children: React.ReactNode, 
    isActive: boolean,
    initialLocked?: boolean,
    isColdStart?: boolean
}) => {
    const { profile, loading } = useProfile();
    const { isDarkMode } = useTheme();
    const [isLocked, setIsLocked] = useState(initialLocked);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    
    // sessionAuthenticated: tracks if we've successfully unlocked since the app was last in focus
    const sessionAuthenticated = useRef(false);
    const isFirstMount = useRef(true);

    // 0. Session Tracking: If it's not a cold start, we consider the session authenticated
    useEffect(() => {
        if (isActive && !isColdStart) {
            sessionAuthenticated.current = true;
        }
    }, [isActive, isColdStart]);

    // 1. Instant Boot Protection: Only check cache on initial mount OR cold start
    useEffect(() => {
        const checkCache = async () => {
            if (!isActive) return;

            // If we've already authenticated in this session, don't lock
            if (sessionAuthenticated.current) return;

            // ONLY auto-lock from cache if we are in a cold start scenario
            if (initialLocked) {
                setIsLocked(true);
            }
        };
        checkCache();
    }, [isActive, initialLocked]);

    // 2. Main Logic: Sync with Profile & Handle Authentication
    useEffect(() => {
        if (!loading && profile) {
            const isEnabled = profile.security_lock_enabled;
            
            // SECURITY TWEAK: Only trigger the "auto-lock on mount" if we are in a cold start.
            // If the user just logged in (isColdStart === false), we don't want to 
            // immediately prompt for biometrics since they JUST authenticated.
            if (isEnabled && !sessionAuthenticated.current && isColdStart) {
                if (!isLocked && !isAuthenticating) {
                    setIsLocked(true);
                    handleAuthentication();
                }
            } else if (!isEnabled) {
                setIsLocked(false);
                sessionAuthenticated.current = false;
            }
        }
    }, [loading, profile?.security_lock_enabled, isLocked, isAuthenticating, isColdStart]);

    // 3. Re-lock on Background with Grace Period
    const backgroundTimestamp = useRef<number | null>(null);
    const GRACE_PERIOD_MS = 60000; // 60 seconds

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                if (isActive) {
                    // Record when we left the app
                    backgroundTimestamp.current = Date.now();
                }
            }
            
            if (nextAppState === 'active' && isActive && profile?.security_lock_enabled) {
                // If we just returned from background
                const now = Date.now();
                const timeInBackground = backgroundTimestamp.current ? now - backgroundTimestamp.current : Infinity;
                
                if (timeInBackground > GRACE_PERIOD_MS) {
                    // Only invalidate session if grace period expired
                    sessionAuthenticated.current = false;
                }
                
                backgroundTimestamp.current = null; // Reset

                if (!sessionAuthenticated.current) {
                    setIsLocked(true);
                    handleAuthentication();
                }
            }
        });

        return () => subscription.remove();
    }, [profile?.security_lock_enabled, isActive]);
    
    // 4. Keyboard Management & BackHandler
    useEffect(() => {
        if (isLocked) {
            Keyboard.dismiss();
            
            // Android BackHandler Guard: Prevent bypassing the lock screen
            const backAction = () => {
                return true; // Consume the event, doing nothing
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }
    }, [isLocked]);

    const handleAuthentication = async () => {
        if (isAuthenticating) return;
        
        setIsAuthenticating(true);
        const success = await security.authenticate();
        
        if (success) {
            setIsLocked(false);
            sessionAuthenticated.current = true;
            haptics.success();
        } else {
            haptics.error();
        }
        setIsAuthenticating(false);
    };

    // ACCESSIBILITY SHIELD: If locked, we don't render children at all 
    // to prevent screen readers from leaking content.
    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient 
                colors={isDarkMode ? ['#111427', '#1a1d35'] : ['#FFF9F0', '#fff1db']} 
                style={styles.overlay}
            >
                <View style={styles.content}>
                    <MascotImage 
                        source={MASCOTS.LOCK} 
                        style={styles.mascot} 
                        resizeMode="contain" 
                    />
                    
                    <Text style={[styles.title, { color: isDarkMode ? '#E5E7EB' : '#2D3436' }]}>Cloudy is Secure</Text>
                    <Text style={[styles.subtitle, { color: isDarkMode ? '#CBD5E1' : '#636E72' }]}>Unlock to continue your journey</Text>
                    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={handleAuthentication}
                        activeOpacity={0.8}
                        disabled={isAuthenticating}
                    >
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.buttonText, { opacity: isAuthenticating ? 0 : 1 }]}>Unlock</Text>
                            {isAuthenticating && (
                                <View style={StyleSheet.absoluteFill}>
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <ActivityIndicator color="white" size="small" />
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.footer}>Your memories are private & encrypted</Text>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        marginTop: -40,
    },
    mascot: {
        width: 180,
        height: 180,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Quicksand_700Bold',
        color: '#2D3436',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Quicksand_500Medium',
        color: '#636E72',
        marginBottom: 48,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FF9E7D', // Cloudy Primary
        paddingHorizontal: 48,
        paddingVertical: 18,
        borderRadius: 35,
        shadowColor: '#FF9E7D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Quicksand_700Bold',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        fontSize: 12,
        fontFamily: 'Quicksand_600SemiBold',
        color: '#B2BEC3',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    }
});
