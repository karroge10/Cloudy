import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { Session } from '@supabase/supabase-js';
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
    userId: string | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(true);

    const userId = session?.user?.id || null;

    const fetchProfile = async () => {
        if (!userId) {
            setProfile(null);
            setIsAnonymous(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const isAnon = session?.user?.is_anonymous || false;
            setIsAnonymous(isAnon);

            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, haptics_enabled, security_lock_enabled, onboarding_completed, reminder_time, age, gender, country, mascot_name, goals, struggles')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('[Profile] Error fetching profile:', error);
                setProfile(null);
            } else if (data) {
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
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('[Profile] Unexpected error during profile fetch:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
        // 1. Resolve Identity - ALWAYS use the client's current truth to avoid RLS 42501
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
            console.warn('[Profile] Aborting update: No authenticated user found in Supabase client.');
            return false;
        }

        const activeUserId = currentUser.id;

        // 2. Optimistic UI Update
        const oldProfile = profile;
        if (profile) {
            setProfile({ ...profile, ...updates });
        } else if (updates.onboarding_completed) {
            // Trigger transition for new users by providing a skeleton profile
            setProfile({
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
            });
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

        // 3. Database Sync
        try {
            // Tiny delay to ensure SDK headers are synchronized after sign-in
            await new Promise(resolve => setTimeout(resolve, 100));

            // More granular approach than simple upsert to isolate RLS issues
            const profileData = { ...updates, id: activeUserId, updated_at: new Date().toISOString() };
            
            // Try updating first (if returning user)
            const { error: updateError, data: updateData } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', activeUserId)
                .select();

            // If no rows were updated (updateData is empty), try insert
            if (updateError || !updateData || updateData.length === 0) {
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(profileData);

                if (insertError) {
                    console.error('[Profile] Profile initialization failed:', insertError.code, insertError.message);
                    setProfile(oldProfile);
                    return false;
                }
            }

            // If we just finished onboarding, the optimistic state is enough to trigger navigation.
            // We skip immediate fetchProfile() to avoid race conditions/resetting profile to false.
            if (updates.onboarding_completed) {
                console.log('[Profile] Onboarding save complete. Skipping re-fetch to maintain navigation state.');
                return true;
            }

            await fetchProfile();
            return true;
        } catch (err) {
            console.error('[Profile] Unexpected database sync error:', err);
            setProfile(oldProfile);
            return false;
        }
    };

    useEffect(() => {
        setProfile(null);
        if (userId) {
            setLoading(true);
        }
        fetchProfile();

        const refreshListener = DeviceEventEmitter.addListener('refresh_profile', fetchProfile);

        return () => {
            refreshListener.remove();
        };
    }, [userId]);

    return (
        <ProfileContext.Provider value={{ profile, isAnonymous, userId, loading, refreshProfile: fetchProfile, updateProfile }}>
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
