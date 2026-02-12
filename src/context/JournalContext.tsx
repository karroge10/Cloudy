import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStreak } from '../utils/streakUtils';

export interface JournalEntry {
    id: string;
    month: string;
    day: string;
    text: string;
    color: string;
    isFavorite?: boolean;
    createdAt: Date;
    isDeleted?: boolean;
}

interface JournalContextType {
    entries: JournalEntry[];
    loading: boolean;
    streak: number;
    rawStreakData: string[]; // ISO strings of dates for ActivityGraph
    refreshEntries: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    deleteEntry: (id: string, soft?: boolean) => Promise<void>;
    addEntry: (text: string) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const STREAK_CACHE_KEY = 'user_streak_cache';

export const JournalProvider = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [streak, setStreak] = useState(0);

    // 1. Initial Load of Cached Streak
    useEffect(() => {
        (async () => {
            try {
                const cached = await AsyncStorage.getItem(STREAK_CACHE_KEY);
                if (cached) {
                    setStreak(parseInt(cached, 10));
                }
            } catch (e) {
                console.error('Error loading cached streak:', e);
            }
        })();
    }, []);

    // 2. Fetch Entries Logic
    const fetchEntries = useCallback(async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
             // We get ALL entries, so this IS the source of truth for streak too.
             const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
             
             if (error) throw error;
             
             if (data) {
                const mappedEntries: JournalEntry[] = data.map((post: any) => {
                    const date = new Date(post.created_at);
                    return {
                        id: post.id,
                        month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
                        day: date.getDate().toString(),
                        text: post.text,
                        color: '#FF9E7D', 
                        isFavorite: post.is_favorite || false,
                        createdAt: date,
                        isDeleted: !!post.deleted_at,
                    };
                });
                setEntries(mappedEntries);
             }
        } catch (e) {
            console.error('Error fetching entries:', e);
        } finally {
            setLoading(false);
        }
    }, [session]);

    // 3. Computed Streak Logic
    // Whenever entries change (e.g. initial fetch, or optimize delete/update),
    // we recalculate the streak immediately.
    // We use ALL entries (including soft deleted) for streak.
    const rawStreakData = useMemo(() => {
        return entries.map(e => e.createdAt.toISOString());
    }, [entries]);

    useEffect(() => {
        // Only run calculation if we actually have entries or if an empty array was explicitly set
        // But entries starts as [] so this runs once. That's fine.
        const streakInput = entries.map(e => ({ created_at: e.createdAt.toISOString() }));
        const currentStreak = calculateStreak(streakInput);
        
        setStreak(currentStreak);
        
        // Cache it for next app launch
        AsyncStorage.setItem(STREAK_CACHE_KEY, currentStreak.toString());

        // Optional: Silent Sync to Profile to keep DB in sync
        if (session?.user && entries.length > 0) {
             supabase.from('profiles').update({ streak_count: currentStreak }).eq('id', session.user.id);
        }
    }, [entries, session]);


    // 4. Session Change Handler
    useEffect(() => {
        if (session) {
            fetchEntries();
        } else {
            setEntries([]);
            setStreak(0);
        }
    }, [session, fetchEntries]);

    const refreshEntries = async () => {
         return fetchEntries();
    };

    const toggleFavorite = async (id: string) => {
        const targetEntry = entries.find(e => e.id === id);
        if (!targetEntry) return;

        const newStatus = !targetEntry.isFavorite;

        // Optimistic update
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: newStatus } : e));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const { error } = await supabase
                .from('posts')
                .update({ is_favorite: newStatus })
                .eq('id', id);

            if (error) {
                // Revert
                setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !newStatus } : e));
                console.error('Error toggling favorite:', error);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !newStatus } : e));
        }
    };

    const deleteEntry = async (id: string, soft = true) => {
        // Optimistically mark as deleted? 
        // If we remove it from the list, the streak WILL break locally until re-fetch.
        // So we should just mark it as isDeleted: true.
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));

        try {
            let error;
            if (soft) {
                const { error: softError } = await supabase
                    .from('posts')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', id);
                error = softError;

                 // If soft delete fails (e.g. column missing), fallback to hard delete
                 if (error) {
                    console.warn("Soft delete failed, attempting hard delete...", error);
                    const { error: deleteError } = await supabase
                        .from('posts')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    
                    if (!error) {
                         // If hard delete was necessary, we MUST remove it from state so it's not "stuck"
                         setEntries(prev => prev.filter(e => e.id !== id));
                    }
                 }
            } else {
                const { error: deleteError } = await supabase
                    .from('posts')
                    .delete()
                    .eq('id', id);
                error = deleteError;
                if (!error) {
                    setEntries(prev => prev.filter(e => e.id !== id));
                }
            }
            
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting entry:', error);
            // Revert
            setEntries(prev => prev.map(e => e.id === id ? { ...e, isDeleted: false } : e));
        }
    };

    const addEntry = async (text: string) => {
        if (!session?.user) throw new Error('User not authenticated');

        // Optimistically add entry
        const tempId = Math.random().toString(36).substring(7);
        const now = new Date();
        const optimisticEntry: JournalEntry = {
            id: tempId,
            text,
            month: now.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: now.getDate().toString(),
            color: '#FF9E7D', 
            isFavorite: false,
            createdAt: now,
            isDeleted: false,
        };

        setEntries(prev => [optimisticEntry, ...prev]);

        try {
            const { data, error } = await supabase
                .from('posts')
                .insert({
                    user_id: session.user.id,
                    text: text.trim(),
                    type: 'gratitude'
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Replace optimistic entry with real one
                const realEntry: JournalEntry = {
                     ...optimisticEntry,
                     id: data.id,
                     createdAt: new Date(data.created_at) // Use server time
                };
                setEntries(prev => prev.map(e => e.id === tempId ? realEntry : e));
            }
        } catch (error) {
             console.error('Error adding entry:', error);
             // Revert optimistic add
             setEntries(prev => prev.filter(e => e.id !== tempId));
             throw error;
        }
    };

    // Derived state for components: only non-deleted entries
    const visibleEntries = useMemo(() => entries.filter(e => !e.isDeleted), [entries]);

    return (
        <JournalContext.Provider value={{ entries: visibleEntries, loading, streak, rawStreakData, refreshEntries, toggleFavorite, deleteEntry, addEntry }}>
            {children}
        </JournalContext.Provider>
    )
}

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (context === undefined) {
        throw new Error('useJournal must be used within a JournalProvider');
    }
    return context;
}
