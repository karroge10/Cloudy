import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils/haptics';

interface Profile {
    display_name: string | null;
    haptics_enabled: boolean;
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
    loading: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            const mappedProfile: Profile = {
                display_name: data.display_name,
                haptics_enabled: data.haptics_enabled ?? true,
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
            
            // Sync current setting to the HapticService
            haptics.setEnabled(mappedProfile.haptics_enabled);
        }
        setLoading(false);
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic UI update
        if (profile) {
            const newProfile = { ...profile, ...updates };
            setProfile(newProfile);
            
            // Immediately sync haptics if that was the change
            if (updates.haptics_enabled !== undefined) {
                haptics.setEnabled(updates.haptics_enabled);
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', error);
            // Revert on error
            fetchProfile();
        }
    };

    useEffect(() => {
        fetchProfile();

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
        };
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile, updateProfile }}>
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
