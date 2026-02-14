import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, AppState, AppStateStatus, ActivityIndicator } from 'react-native';
import { security } from '../utils/security';
import { haptics } from '../utils/haptics';
import { useProfile } from '../context/ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MASCOTS } from '../constants/Assets';
import { MascotImage } from './MascotImage';

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
    initialLocked = false 
}: { 
    children: React.ReactNode, 
    isActive: boolean,
    initialLocked?: boolean
}) => {
    const { profile, loading } = useProfile();
    const [isLocked, setIsLocked] = useState(initialLocked);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    
    // sessionAuthenticated: tracks if we've successfully unlocked since the app was last in focus
    const sessionAuthenticated = useRef(false);
    const isFirstMount = useRef(true);

    // 1. Instant Boot Protection: Check local cache first
    useEffect(() => {
        const checkCache = async () => {
            if (!isActive) return;

            const cachedLock = await AsyncStorage.getItem('security_lock_enabled');
            if (cachedLock === 'true') {
                setIsLocked(true);
            }
            
            // If this is the first mount and we have a session, 
            // it's a cold start. If not, it's a login.
            if (!isFirstMount.current) {
                sessionAuthenticated.current = true;
                setIsLocked(false);
            }
            isFirstMount.current = false;
        };
        checkCache();
    }, [isActive]);

    // 2. Main Logic: Sync with Profile & Handle Authentication
    useEffect(() => {
        if (!loading && profile) {
            const isEnabled = profile.security_lock_enabled;
            
            if (isEnabled && !sessionAuthenticated.current) {
                // If the app is active and we JUST turned this on,
                // we handle the prompt but don't necessarily need to lock the whole screen
                // with the overlay yet. Actually, handleAuthentication handles successful 
                // unlock setting sessionAuthenticated.current = true.
                
                if (!isLocked && !isAuthenticating) {
                    setIsLocked(true);
                    handleAuthentication();
                }
            } else if (!isEnabled) {
                setIsLocked(false);
                sessionAuthenticated.current = false;
            }
        }
    }, [loading, profile?.security_lock_enabled, isLocked, isAuthenticating]);

    // 3. Re-lock on Background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                // IMPORTANT: Only invalidate the session if we were actually authenticated.
                // If we were logged out (isActive = false), the backgrounding (like Google Auth)
                // shouldn't count as a reason to lock the app later.
                if (isActive) {
                    sessionAuthenticated.current = false;
                }
            }
            
            if (nextAppState === 'active' && isActive && profile?.security_lock_enabled) {
                // If we just returned from background and we are logged in, 
                // check if we need to re-challenge based on the flag we set above.
                if (!sessionAuthenticated.current) {
                    setIsLocked(true);
                    handleAuthentication();
                }
            }
        });

        return () => subscription.remove();
    }, [profile?.security_lock_enabled, isActive]);

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

    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            {/* The app content is rendered but obscured by the gradient overlay */}
            <View style={StyleSheet.absoluteFill}>
                {children}
            </View>
            
            <LinearGradient 
                colors={['#FFF9F0', '#fff1db']} 
                style={styles.overlay}
            >
                <View style={styles.content}>
                    <MascotImage 
                        source={MASCOTS.LOCK} 
                        style={styles.mascot} 
                        resizeMode="contain" 
                    />
                    
                    <Text style={styles.title}>Cloudy is Secure</Text>
                    <Text style={styles.subtitle}>Unlock to continue your journey</Text>
                    
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={handleAuthentication}
                        activeOpacity={0.8}
                        disabled={isAuthenticating}
                    >
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.buttonText, { opacity: isAuthenticating ? 0 : 1 }]}>Unlock Now</Text>
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
