import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStreak } from '../utils/streakUtils';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import { useAlert } from './AlertContext';

export interface JournalEntry {
    id: string;
    user_id: string;
    text: string;
    is_favorite: boolean;
    created_at: string;
    type?: string;
    deleted_at?: string | null;
}

interface JournalContextType {
    entries: JournalEntry[];
    loading: boolean;
    streak: number;
    rawStreakData: { created_at: string }[];
    addEntry: (text: string) => Promise<void>;
    toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
    deleteEntry: (id: string, soft?: boolean) => Promise<void>;
    refreshEntries: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode, session: Session | null }> = ({ children, session }) => {
    const { showAlert } = useAlert();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);

    // Initial load from cache
    useEffect(() => {
        const loadCache = async () => {
            const cachedStreak = await AsyncStorage.getItem('user_streak_cache');
            if (cachedStreak) setStreak(parseInt(cachedStreak));
        };
        loadCache();
    }, []);

    const fetchEntries = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setEntries(data);
        }
        setLoading(false);
    }, [session]);

    // Handle anonymous account merging
    useEffect(() => {
        const handleMerge = async () => {
            if (!session?.user?.id || session.user.is_anonymous) return;

            try {
                const anonId = await AsyncStorage.getItem('pending_merge_anonymous_id');
                if (anonId && anonId !== session.user.id) {
                    const { data: name, error } = await supabase.rpc('merge_anonymous_data', { 
                        old_uid: anonId, 
                        new_uid: session.user.id 
                    });
                    
                    if (error) {
                        console.warn('Merge failed:', error.message);
                    } else {
                        await AsyncStorage.removeItem('pending_merge_anonymous_id');
                        
                        // Success Toast (The "Pro" Way)
                        showAlert(
                            'Success', 
                            `Welcome back, ${name}! We've added your recent memories to your journal.`,
                            [{ text: 'Great!' }],
                            'success'
                        );

                        // Re-fetch now that data has moved
                        fetchEntries();
                    }
                }
            } catch (err) {
                console.error('Merge check error:', err);
            }
        };

        handleMerge();
    }, [session, fetchEntries]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Derived raw dates for streak calculation - includes soft-deleted entries to maintain streak
    const rawStreakData = useMemo(() => {
        return entries.map(e => ({ created_at: e.created_at }));
    }, [entries]);

    useEffect(() => {
        if (rawStreakData.length > 0) {
            const newStreak = calculateStreak(rawStreakData);
            setStreak(newStreak);
            
            // Background update cache
            AsyncStorage.setItem('user_streak_cache', newStreak.toString()).catch(console.warn);
        } else {
            setStreak(0);
            AsyncStorage.setItem('user_streak_cache', '0').catch(console.warn);
        }
    }, [rawStreakData]);

    const addEntry = async (text: string) => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                user_id: session.user.id,
                text: text,
                is_favorite: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        if (data) {
            setEntries(prev => [data, ...prev]);
        }
    };

    const toggleFavorite = async (id: string, isFavorite: boolean) => {
        // Optimistic UI update
        setEntries(prev => prev.map(e => e.id === id ? { ...e, is_favorite: isFavorite } : e));
        
        if (isFavorite) {
            haptics.success();
        }

        const { error } = await supabase
            .from('posts')
            .update({ is_favorite: isFavorite })
            .eq('id', id);

        if (error) {
            // Revert on error
            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_favorite: !isFavorite } : e));
            throw error;
        }
    };

    const deleteEntry = async (id: string, soft: boolean = true) => {
        // Optimistic UI update
        if (soft) {
            const now = new Date().toISOString();
            setEntries(prev => prev.map(e => e.id === id ? { ...e, deleted_at: now } : e));
            
            const { error } = await supabase
                .from('posts')
                .update({ deleted_at: now })
                .eq('id', id);

            if (error) {
                setEntries(prev => prev.map(e => e.id === id ? { ...e, deleted_at: null } : e));
                throw error;
            }
        } else {
            setEntries(prev => prev.filter(e => e.id !== id));

            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) {
                fetchEntries();
                throw error;
            }
        }
    };

    const activeEntries = useMemo(() => entries.filter(e => !e.deleted_at), [entries]);

    // Notification algorithm trigger
    useEffect(() => {
        if (!loading && activeEntries.length > 0) {
            notifications.performBackgroundCheck(activeEntries);
        }
    }, [loading, activeEntries.length]);

    const value = useMemo(() => ({
        entries: activeEntries,
        loading,
        streak,
        rawStreakData,
        addEntry,
        toggleFavorite,
        deleteEntry,
        refreshEntries: fetchEntries
    }), [activeEntries, loading, streak, rawStreakData, fetchEntries]);

    return (
        <JournalContext.Provider value={value}>
            {children}
        </JournalContext.Provider>
    );
};

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (context === undefined) {
        throw new Error('useJournal must be used within a JournalProvider');
    }
    return context;
};
