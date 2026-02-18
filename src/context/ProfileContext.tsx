import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface Profile {
    id: string;
    display_name: string | null;
    haptics_enabled: boolean;
    security_lock_enabled: boolean;
    onboarding_completed: boolean;
    reminder_time: string | null;
    age: number | null;
    gender: string | null;
    country: string | null;
    mascot_name: string | null;
    goals: string[];
    struggles: string[];
    max_streak: number;
}

interface ProfileContextType {
    profile: Profile | null;
    isAnonymous: boolean;
    userId: string | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
    logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(true);
    const lastUpdateTimestamp = useRef(0);
    const operationInFlight = useRef(false);
    const prevSessionRef = useRef(session);

    const userId = session?.user?.id || null;

    // Synchronous merge detection to prevent flash
    const isTransitingFromAnon = prevSessionRef.current?.user?.is_anonymous && !session?.user?.is_anonymous && session?.user?.id;
    
    useEffect(() => {
        prevSessionRef.current = session;
    }, [session]);

    // Update isAnonymous immediately when session changes
    useEffect(() => {
        const isAnon = session?.user?.is_anonymous || false;
        setIsAnonymous(isAnon);
    }, [session?.user?.is_anonymous]);

    const fetchProfile = useCallback(async () => {
        const currentUserId = session?.user?.id || userId;
        
        if (!currentUserId) {
            setProfile(null);
            setIsAnonymous(false);
            setLoading(false);
            return;
        }

        if (operationInFlight.current) {
            return;
        }

        if (!profile) setLoading(true);
        const fetchStartTime = Date.now();

        try {
            const isAnon = session?.user?.is_anonymous || false;
            setIsAnonymous(isAnon);

            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, haptics_enabled, security_lock_enabled, onboarding_completed, reminder_time, age, gender, country, mascot_name, goals, struggles, max_streak')
                .eq('id', currentUserId)
                .maybeSingle();

            if (error) {
                // Attempt 2: Fallback to base schema (without max_streak)
                // We try this regardless of the error code to be safe against schema mismatches
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('profiles')
                    .select('display_name, haptics_enabled, security_lock_enabled, onboarding_completed, reminder_time, age, gender, country, mascot_name, goals, struggles')
                    .eq('id', currentUserId)
                    .maybeSingle();
                    
                if (fetchStartTime < lastUpdateTimestamp.current) {
                    // Discarding stale fetch result
                    return;
                }
                
                if (fallbackData) {
                    const mappedProfile: Profile = {
                        id: currentUserId,
                        display_name: fallbackData.display_name,
                        haptics_enabled: fallbackData.haptics_enabled ?? true,
                        security_lock_enabled: fallbackData.security_lock_enabled ?? false,
                        onboarding_completed: fallbackData.onboarding_completed ?? false,
                        reminder_time: fallbackData.reminder_time,
                        age: fallbackData.age,
                        gender: fallbackData.gender,
                        country: fallbackData.country,
                        mascot_name: fallbackData.mascot_name,
                        goals: fallbackData.goals || [],
                        struggles: fallbackData.struggles || [],
                        max_streak: 0,
                    };
                    setProfile(mappedProfile);
                    return;
                }
                 
                if (fetchStartTime < lastUpdateTimestamp.current) return;
                setProfile(null);
            } else if (data) {
                if (fetchStartTime < lastUpdateTimestamp.current) {
                    // Discarding stale fetch result
                    return;
                }

                if (session?.user?.is_anonymous) {
                    console.log('[ProfileContext] Anon User Data Found:', data);
                }

                const mappedProfile: Profile = {
                    id: currentUserId,
                    display_name: data.display_name,
                    haptics_enabled: data.haptics_enabled ?? true,
                    security_lock_enabled: data.security_lock_enabled ?? false,
                    onboarding_completed: data.onboarding_completed ?? false,
                    reminder_time: data.reminder_time,
                    age: data.age,
                    gender: data.gender,
                    country: data.country,
                    mascot_name: data.mascot_name,
                    goals: data.goals || [],
                    struggles: data.struggles || [],
                    max_streak: data.max_streak || 0,
                };
                setProfile(mappedProfile);
                haptics.setEnabled(mappedProfile.haptics_enabled);
                notifications.scheduleDailyReminder(mappedProfile.reminder_time, false);
                
                if (mappedProfile.security_lock_enabled) {
                    await AsyncStorage.setItem('security_lock_enabled', 'true');
                } else {
                    await AsyncStorage.removeItem('security_lock_enabled');
                }
            } else {
                // No profile found - auto-create for authenticated users (Google sign-in)
                if (fetchStartTime < lastUpdateTimestamp.current) return;
                
                if (!isAnon) {
                    const defaultProfile = {
                        id: currentUserId,
                        display_name: null,
                        haptics_enabled: true,
                        security_lock_enabled: false,
                        onboarding_completed: false, // Ensure they see setup flow
                        reminder_time: null,
                        age: null,
                        gender: null,
                        country: null,
                        mascot_name: null,
                        goals: [],
                        struggles: [],
                        max_streak: 0,
                        updated_at: new Date().toISOString()
                    };
                    
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert(defaultProfile);
                    
                    if (!insertError) {
                        setProfile({
                            id: currentUserId,
                            display_name: null,
                            haptics_enabled: true,
                            security_lock_enabled: false,
                            onboarding_completed: true,
                            reminder_time: null,
                            age: null,
                            gender: null,
                            country: null,
                            mascot_name: null,
                            goals: [],
                            struggles: [],
                            max_streak: 0,
                        });
                    } else {
                        setProfile(null);
                    }
                } else {
                    setProfile(null);
                }
            }
        } catch (error) {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, userId]);

    const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
        operationInFlight.current = true;
        lastUpdateTimestamp.current = Date.now();
        
        // Capture old profile for rollback
        const oldProfile = profile;

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (!currentUser) return false;
            const activeUserId = currentUser.id;

            // Optimistic update
            if (profile) {
                setProfile({ ...profile, ...updates });
            } else if (updates.onboarding_completed) {
                setProfile({
                    id: activeUserId,
                    display_name: null,
                    haptics_enabled: true,
                    security_lock_enabled: false,
                    onboarding_completed: true,
                    reminder_time: null,
                    age: null,
                    gender: null,
                    country: null,
                    mascot_name: null,
                    goals: updates.goals || [],
                    struggles: updates.struggles || [],
                    max_streak: 0,
                });
            }
            
            if (updates.haptics_enabled !== undefined) haptics.setEnabled(updates.haptics_enabled);
            if (updates.security_lock_enabled !== undefined) {
                if (updates.security_lock_enabled) {
                    AsyncStorage.setItem('security_lock_enabled', 'true');
                } else {
                    AsyncStorage.removeItem('security_lock_enabled');
                }
            }
            if (updates.reminder_time !== undefined) {
                notifications.scheduleDailyReminder(updates.reminder_time, true);
            }

            // DB Operations
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const { error: updateError, data: updateData } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', activeUserId)
                .select();

            if (updateError || !updateData || updateData.length === 0) {
                // Profile doesn't exist, create a complete one
                // For existing auth users (e.g., Google sign-in), mark onboarding as completed
                const completeProfileData = {
                    id: activeUserId,
                    display_name: updates.display_name || null,
                    haptics_enabled: updates.haptics_enabled ?? true,
                    security_lock_enabled: updates.security_lock_enabled ?? false,
                    onboarding_completed: updates.onboarding_completed ?? (currentUser.is_anonymous ? false : true),
                    reminder_time: updates.reminder_time || null,
                    age: updates.age || null,
                    gender: updates.gender || null,
                    country: updates.country || null,
                    mascot_name: updates.mascot_name || null,
                    goals: updates.goals || [],
                    struggles: updates.struggles || [],
                    max_streak: updates.max_streak || 0,
                    updated_at: new Date().toISOString()
                };
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(completeProfileData);

                if (insertError) {
                    throw insertError;
                }
                
                // Update local state to reflect the complete profile
                if (!profile || updates.onboarding_completed) {
                    setProfile({
                        id: completeProfileData.id,
                        display_name: completeProfileData.display_name,
                        haptics_enabled: completeProfileData.haptics_enabled,
                        security_lock_enabled: completeProfileData.security_lock_enabled,
                        onboarding_completed: completeProfileData.onboarding_completed,
                        reminder_time: completeProfileData.reminder_time,
                        age: completeProfileData.age,
                        gender: completeProfileData.gender,
                        country: completeProfileData.country,
                        mascot_name: completeProfileData.mascot_name,
                        goals: completeProfileData.goals,
                        struggles: completeProfileData.struggles,
                        max_streak: completeProfileData.max_streak,
                    });
                }
            }

            if (updates.onboarding_completed) return true;

            // We temporarily release the lock to allow this specific fetch to proceed
            operationInFlight.current = false;
            await fetchProfile();
            return true;

        } catch (err) {
            setProfile(oldProfile); // Revert state on error
            return false;
        } finally {
            // Ensure lock is released unless we already did it (but redundant sets are fine)
            // But wait, if we released it at line 223, and then finally sets it false again. That is fine.
            // If line 223 set it false, then fetchProfile ran.
            // Then finally runs. Sets false. OK.
            operationInFlight.current = false;
        }
    };

    useEffect(() => {
        const transitionListener = DeviceEventEmitter.addListener('session_transition', () => {
            setProfile(null);
            setLoading(true);
        });

        return () => transitionListener.remove();
    }, []);

    useEffect(() => {
        const syncProfile = async () => {
            const currentUserId = session?.user?.id || null;
            const isAnon = session?.user?.is_anonymous;

            if (!currentUserId) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // Clear state immediately to show skeleton during identity transition
            setProfile(null);
            fetchProfile();
        };

        syncProfile();
        
        const refreshListener = DeviceEventEmitter.addListener('refresh_profile', fetchProfile);
        return () => {
            refreshListener.remove();
        };
    }, [session?.user?.id]);

    const dataMatchesUser = !!session?.user?.id && profile?.id === session.user.id;
    // Note: We don't have the ID in the mapped Profile object currently, 
    // but the session check is enough for basic visual isolation. 
    // Actually, let's just check if it's the right session essentially.

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setProfile(null);
            // Session update should be handled by onAuthStateChange in App.tsx
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <ProfileContext.Provider value={{ 
            profile: dataMatchesUser ? profile : null, 
            isAnonymous, 
            userId: userId || session?.user?.id || null, 
            loading: loading || !dataMatchesUser, 
            refreshProfile: fetchProfile, 
            updateProfile,
            logout 
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
