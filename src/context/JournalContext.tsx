import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
            const userId = session?.user?.id;
            if (!userId) return;
            
            const cachedStreak = await AsyncStorage.getItem(`user_streak_cache_${userId}`);
            if (cachedStreak) setStreak(parseInt(cachedStreak));
        };
        loadCache();
    }, []);

    const activeUserIdRef = useRef<string | null>(session?.user?.id || null);

    // Sync ref with current session ID
    useEffect(() => {
        activeUserIdRef.current = session?.user?.id || null;
    }, [session?.user?.id]);

    const fetchMetadata = useCallback(async (currentUserId: string) => {
        if (!currentUserId) return;

        const { data, error } = await supabase
            .from('posts')
            .select('id, created_at')
            .eq('user_id', currentUserId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (!error && data && activeUserIdRef.current === currentUserId) {
            setMetadata(data);
        }
    }, []);

    const fetchPage = useCallback(async (pageNum: number, currentUserId: string, clearExisting = false) => {
        if (!currentUserId) return;

        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        const { data, error } = await supabase
            .from('posts')
            .select('id, user_id, text, is_favorite, created_at, type')
            .eq('user_id', currentUserId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (!error && data && activeUserIdRef.current === currentUserId) {
            // Decrypt entries
            const decryptedData = await Promise.all(data.map(async (entry: JournalEntry) => ({
                ...entry,
                text: await encryption.decrypt(entry.text)
            })));
            
            setEntries(prev => clearExisting ? decryptedData : [...prev, ...decryptedData]);
            setHasMore(data.length === PAGE_SIZE);
        }
        
        if (activeUserIdRef.current === currentUserId) {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const refreshEntries = useCallback(async () => {
        const currentUserId = activeUserIdRef.current;
        if (!currentUserId) return;

        setPage(0);
        await Promise.all([
            fetchMetadata(currentUserId),
            fetchPage(0, currentUserId, true)
        ]);
    }, [fetchMetadata, fetchPage]);

    // Handle anonymous account merging
    useEffect(() => {
        const handleMerge = async () => {
            const currentUserId = session?.user?.id;
            if (!currentUserId || session.user.is_anonymous) return;

            try {
                const anonId = await SecureStore.getItemAsync('pending_merge_anonymous_id');
                if (anonId && anonId !== currentUserId) {
                    setLoading(true);
                    const { data: name, error } = await supabase.rpc('merge_anonymous_data', { 
                        old_uid: anonId, 
                        new_uid: currentUserId 
                    });
                    
                    if (error) {
                        console.warn('Merge failed:', error.message);
                        if (activeUserIdRef.current === currentUserId) setLoading(false);
                    } else {
                        await SecureStore.deleteItemAsync('pending_merge_anonymous_id');
                        
                        // Re-fetch now that data has moved
                        if (activeUserIdRef.current === currentUserId) {
                            await refreshEntries();
                            showAlert(
                                'Success', 
                                `Welcome back, ${name}! We've added your recent memories to your journal.`,
                                [{ text: 'Great!' }],
                                'success'
                            );
                        }
                    }
                }
            } catch (err) {
                console.error('Merge check error:', err);
                if (activeUserIdRef.current === currentUserId) setLoading(false);
            }
        };

        handleMerge();
    }, [session, refreshEntries, showAlert]);

    // Simplified fetch on session change
    // Since the provider now remounts when session ID changes (App.tsx keys),
    // this effect primarily handles the initial mount fetch and any session object updates.
    useEffect(() => {
        const currentUserId = session?.user?.id;
        if (currentUserId) {
            refreshEntries();
        } else {
            setEntries([]);
            setMetadata([]);
            setStreak(0);
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        const userId = session?.user?.id;
        if (metadata.length > 0) {
            const newStreak = calculateStreak(metadata);
            setStreak(newStreak);
            
            if (userId) {
                AsyncStorage.setItem(`user_streak_cache_${userId}`, newStreak.toString()).catch(console.warn);
            }
        } else if (!loading) {
            setStreak(0);
            if (userId) {
                AsyncStorage.setItem(`user_streak_cache_${userId}`, '0').catch(console.warn);
            }
        }
    }, [metadata, loading, session?.user?.id]);

    const loadMore = async () => {
        if (loadingMore || !hasMore || !session?.user?.id) return;
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchPage(nextPage, session.user.id);
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

        if (error) {
            console.error('[Journal] Add Entry Failed:', error.code, error.message);
            throw error;
        }
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

    const effectiveLoading = loading || (!!session?.user?.id && activeUserIdRef.current !== session.user.id);

    const value = useMemo(() => ({
        entries,
        loading: effectiveLoading,
        loadingMore,
        hasMore,
        streak,
        rawStreakData: metadata,
        addEntry,
        toggleFavorite,
        deleteEntry,
        refreshEntries,
        loadMore
    }), [entries, effectiveLoading, loadingMore, hasMore, streak, refreshEntries, loadMore]);

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
