import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStreak } from '../utils/streakUtils';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import { useAlert } from './AlertContext';
import { posthog } from '../lib/posthog';
import { encryption } from '../utils/encryption';


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
    loadingMore: boolean;
    hasMore: boolean;
    streak: number;
    rawStreakData: { id: string, created_at: string }[];
    addEntry: (text: string) => Promise<void>;
    toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
    deleteEntry: (id: string, soft?: boolean) => Promise<void>;
    refreshEntries: () => Promise<void>;
    loadMore: () => Promise<void>;
}

const PAGE_SIZE = 20;

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode, session: Session | null }> = ({ children, session }) => {
    const { showAlert } = useAlert();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [metadata, setMetadata] = useState<{ id: string, created_at: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [streak, setStreak] = useState(0);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Initial load from cache
    useEffect(() => {
        const loadCache = async () => {
            const cachedStreak = await AsyncStorage.getItem('user_streak_cache');
            if (cachedStreak) setStreak(parseInt(cachedStreak));
        };
        loadCache();
    }, []);

    const fetchMetadata = useCallback(async () => {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
            .from('posts')
            .select('id, created_at')
            .eq('user_id', session.user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMetadata(data);
        }
    }, [session]);

    const fetchPage = useCallback(async (pageNum: number, clearExisting = false) => {
        if (!session?.user?.id) return;

        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        const { data, error } = await supabase
            .from('posts')
            .select('id, user_id, text, is_favorite, created_at, type')
            .eq('user_id', session.user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (!error && data) {
            // Decrypt entries
            const decryptedData = await Promise.all(data.map(async (entry: JournalEntry) => ({
                ...entry,
                text: await encryption.decrypt(entry.text)
            })));
            setEntries(prev => clearExisting ? decryptedData : [...prev, ...decryptedData]);
            setHasMore(data.length === PAGE_SIZE);
        }
        
        setLoading(false);
        setLoadingMore(false);
    }, [session]);

    const refreshEntries = useCallback(async () => {
        setPage(0);
        await Promise.all([
            fetchMetadata(),
            fetchPage(0, true)
        ]);
    }, [fetchMetadata, fetchPage]);

    // Handle anonymous account merging
    useEffect(() => {
        const handleMerge = async () => {
            if (!session?.user?.id || session.user.is_anonymous) return;

            try {
                const anonId = await AsyncStorage.getItem('pending_merge_anonymous_id');
                if (anonId && anonId !== session.user.id) {
                    setLoading(true);
                    const { data: name, error } = await supabase.rpc('merge_anonymous_data', { 
                        old_uid: anonId, 
                        new_uid: session.user.id 
                    });
                    
                    if (error) {
                        console.warn('Merge failed:', error.message);
                        setLoading(false);
                    } else {
                        await AsyncStorage.removeItem('pending_merge_anonymous_id');
                        
                        // Re-fetch now that data has moved
                        await refreshEntries();

                        showAlert(
                            'Success', 
                            `Welcome back, ${name}! We've added your recent memories to your journal.`,
                            [{ text: 'Great!' }],
                            'success'
                        );
                    }
                }
            } catch (err) {
                console.error('Merge check error:', err);
                setLoading(false);
            }
        };

        handleMerge();
    }, [session, refreshEntries, showAlert]);

    useEffect(() => {
        refreshEntries();
    }, [refreshEntries]);

    useEffect(() => {
        if (metadata.length > 0) {
            const newStreak = calculateStreak(metadata);
            setStreak(newStreak);
            
            AsyncStorage.setItem('user_streak_cache', newStreak.toString()).catch(console.warn);
        } else if (!loading) {
            setStreak(0);
            AsyncStorage.setItem('user_streak_cache', '0').catch(console.warn);
        }
    }, [metadata, loading]);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchPage(nextPage);
    };

    const addEntry = async (text: string) => {
        if (!session?.user?.id) return;

        const encryptedText = await encryption.encrypt(text);

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                user_id: session.user.id,
                text: encryptedText,
                is_favorite: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        if (data) {
            posthog.capture('journal_entry_saved', { 
                length: text.length,
                current_streak: streak + 1 // +1 because the streak recalculation happens in useEffect after this
            });
            
            // For local state, keep the unencrypted text
            const localEntry = { ...data, text: text };
            setEntries(prev => [localEntry, ...prev]);

            setMetadata(prev => [{ id: data.id, created_at: data.created_at }, ...prev]);
        }
    };

    const toggleFavorite = async (id: string, isFavorite: boolean) => {
        // Optimistic UI update
        setEntries(prev => prev.map(e => e.id === id ? { ...e, is_favorite: isFavorite } : e));
        
        if (isFavorite) {
            haptics.success();
            posthog.capture('journal_entry_favorited', { entry_id: id });
        } else {
            posthog.capture('journal_entry_unfavorited', { entry_id: id });
        }

        const { error } = await supabase

            .from('posts')
            .update({ is_favorite: isFavorite })
            .eq('id', id);

        if (error) {
            setEntries(prev => prev.map(e => e.id === id ? { ...e, is_favorite: !isFavorite } : e));
            throw error;
        }
    };

    const deleteEntry = async (id: string, soft: boolean = true) => {
        // Optimistic UI update
        const now = new Date().toISOString();
        setEntries(prev => prev.filter(e => e.id !== id));
        setMetadata(prev => prev.filter(e => e.id !== id));
        
        posthog.capture('journal_entry_deleted', { entry_id: id, is_soft: soft });

        if (soft) {

            const { error } = await supabase
                .from('posts')
                .update({ deleted_at: now })
                .eq('id', id);

            if (error) {
                refreshEntries();
                throw error;
            }
        } else {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);

            if (error) {
                refreshEntries();
                throw error;
            }
        }
    };

    // Notification algorithm trigger
    useEffect(() => {
        if (!loading && metadata.length > 0) {
            // Background check using metadata is enough for notifications algorithm 
            // as it typically checks for inactivity or patterns.
            notifications.performBackgroundCheck(metadata.map(m => ({ created_at: m.created_at })));
        }
    }, [loading, metadata.length]);

    const value = useMemo(() => ({
        entries,
        loading,
        loadingMore,
        hasMore,
        streak,
        rawStreakData: metadata,
        addEntry,
        toggleFavorite,
        deleteEntry,
        refreshEntries,
        loadMore
    }), [entries, loading, loadingMore, hasMore, streak, refreshEntries, loadMore]);

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
