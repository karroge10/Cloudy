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
    max_streak: number;
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
        const currentUserId = session?.user?.id || userId;
        
        if (!currentUserId) {
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
                .select('display_name, haptics_enabled, security_lock_enabled, onboarding_completed, reminder_time, age, gender, country, mascot_name, goals, struggles, max_streak')
                .eq('id', currentUserId)
                .maybeSingle();

            if (error) {
                console.error('[Profile] Error fetching profile:', error);
                
                if (error.code === '42703') { 
                     const { data: fallbackData } = await supabase
                        .from('profiles')
                        .select('display_name, haptics_enabled, security_lock_enabled, onboarding_completed, reminder_time, age, gender, country, mascot_name, goals, struggles')
                        .eq('id', currentUserId)
                        .maybeSingle();
                        
                     if (fallbackData) {
                        const mappedProfile: Profile = {
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
                }
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
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) return false;
        const activeUserId = currentUser.id;

        const oldProfile = profile;
        if (profile) {
            setProfile({ ...profile, ...updates });
        } else if (updates.onboarding_completed) {
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

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const profileData = { ...updates, id: activeUserId, updated_at: new Date().toISOString() };
            
            const { error: updateError, data: updateData } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', activeUserId)
                .select();

            if (updateError || !updateData || updateData.length === 0) {
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(profileData);

                if (insertError) {
                    setProfile(oldProfile);
                    return false;
                }
            }

            if (updates.onboarding_completed) return true;

            await fetchProfile();
            return true;
        } catch (err) {
            setProfile(oldProfile);
            return false;
        }
    };

    useEffect(() => {
        setProfile(null);
        fetchProfile();
        const refreshListener = DeviceEventEmitter.addListener('refresh_profile', fetchProfile);
        return () => {
            refreshListener.remove();
        };
    }, [userId]);

    return (
        <ProfileContext.Provider value={{ profile, isAnonymous, userId: userId || session?.user?.id || null, loading, refreshProfile: fetchProfile, updateProfile }}>
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
