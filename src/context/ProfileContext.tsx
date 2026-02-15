import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
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
}

interface ProfileContextType {
    profile: Profile | null;
    isAnonymous: boolean;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        setLoading(true);
        console.log('[Profile] set loading: true');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('[Profile] Fetching for user:', user?.id);
            if (!user) {
                setProfile(null);
                setIsAnonymous(false);
                setLoading(false); // Ensure loading is set to false if no user
                return;
            }

            setIsAnonymous(user.is_anonymous || false);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                const mappedProfile: Profile = {
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
                };
                console.log('[Profile] Fetch complete, setting profile');
                setProfile(mappedProfile);
            
            // Sync current settings to services
            haptics.setEnabled(mappedProfile.haptics_enabled);
            notifications.scheduleDailyReminder(mappedProfile.reminder_time, false);
            
            // Cache lock state
            if (mappedProfile.security_lock_enabled) {
                await AsyncStorage.setItem('security_lock_enabled', 'true');
            } else {
                await AsyncStorage.removeItem('security_lock_enabled');
            }
        } else if (error) {
            console.error('[Profile] Error fetching profile:', error);
            setProfile(null);
        } else {
            console.log('[Profile] No profile found for user, setting null');
            setProfile(null);
        }
        setLoading(false);
    } catch (error) {
        console.error('[Profile] Unexpected error during profile fetch:', error);
        setProfile(null);
        setLoading(false);
    }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        // 1. Optimistic UI Update
        if (profile) {
            setProfile({ ...profile, ...updates });
        } else if (updates.onboarding_completed) {
            // If we are creating the profile for the first time during onboarding
            // we can't do a full optimistic update easily (missing other fields), 
            // but we MUST ensure we don't block the UI.
            // We'll trigger a fetch after the upsert.
        }
        
        // Fire immediate side effects
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

        // 2. Database Sync
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({ ...updates, id: user.id, updated_at: new Date() });

        if (error) {
            console.error('Error updating profile:', error);
            fetchProfile(); // Revert/Sync on error
        } else {
            // SUCCESS: Re-fetch to ensure the local state is 100% accurate 
            // and contains the newly created record if it's the first time.
            fetchProfile();
        }
    };

    useEffect(() => {
        fetchProfile();

        const refreshListener = DeviceEventEmitter.addListener('refresh_profile', fetchProfile);

        // Optional: Listen for auth state changes to re-fetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile();
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            refreshListener.remove();
        };
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, isAnonymous, loading, refreshProfile: fetchProfile, updateProfile }}>
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
