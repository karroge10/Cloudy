import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStreak } from '../utils/streakUtils';
import { haptics } from '../utils/haptics';

export interface JournalEntry {
    id: string;
    user_id: string;
    content: string;
    is_favorite: boolean;
    created_at: string;
    mood?: string;
    is_deleted?: boolean;
}

interface JournalContextType {
    entries: JournalEntry[];
    loading: boolean;
    streak: number;
    rawStreakData: { created_at: string }[];
    addEntry: (content: string) => Promise<void>;
    toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
    deleteEntry: (id: string, soft?: boolean) => Promise<void>;
    refreshEntries: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode, session: Session | null }> = ({ children, session }) => {
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
            .from('journal_entries')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setEntries(data);
        }
        setLoading(false);
    }, [session]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Derived raw dates for streak calculation
    const rawStreakData = useMemo(() => {
        // Filter out soft-deleted entries for streak calculation
        return entries
            .filter(e => !e.is_deleted)
            .map(e => ({ created_at: e.created_at }));
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

    const addEntry = async (content: string) => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('journal_entries')
            .insert([{
                user_id: session.user.id,
                content,
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
            .from('journal_entries')
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
            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_deleted: true } : e));
            
            const { error } = await supabase
                .from('journal_entries')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) {
                setEntries(prev => prev.map(e => e.id === id ? { ...e, is_deleted: false } : e));
                throw error;
            }
        } else {
            setEntries(prev => prev.filter(e => e.id !== id));

            const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', id);

            if (error) {
                fetchEntries();
                throw error;
            }
        }
    };

    const value = useMemo(() => ({
        entries,
        loading,
        streak,
        rawStreakData,
        addEntry,
        toggleFavorite,
        deleteEntry,
        refreshEntries: fetchEntries
    }), [entries, loading, streak, rawStreakData, fetchEntries]);

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
