import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { calculateStreak } from '../utils/streakUtils';
import { haptics } from '../utils/haptics';
import { notifications } from '../utils/notifications';
import { useAlert } from './AlertContext';
import { posthog, identifyUser } from '../lib/posthog';
import { useAnalytics } from '../hooks/useAnalytics';
import { DeviceEventEmitter } from 'react-native';
import { encryption } from '../utils/encryption';
import { useProfile } from './ProfileContext';
import { useTranslation } from 'react-i18next';


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
    isFrozen: boolean;
    frozenDates: string[];
    rawStreakData: { id: string, created_at: string }[];
    addEntry: (text: string) => Promise<void>;
    toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
    deleteEntry: (id: string, soft?: boolean) => Promise<void>;
    refreshEntries: () => Promise<void>;
    loadMore: () => Promise<void>;
    fetchEntriesForDate: (date: string | null) => Promise<void>;
    filterMode: 'all' | 'favorites';
    setFilterMode: (mode: 'all' | 'favorites') => void;
    isMerging: boolean;
}

const PAGE_SIZE = 20;

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode, session: Session | null }> = ({ children, session }) => {
    const { showAlert } = useAlert();
    const { profile, updateProfile, refreshProfile } = useProfile();
    const { t } = useTranslation();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [metadata, setMetadata] = useState<{ id: string, created_at: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [filterMode, setFilterModeState] = useState<'all' | 'favorites'>('all');
    const [isMerging, setIsMerging] = useState(false);
    const mergeInProgress = useRef(false);
    const lastSyncedUserIdRef = useRef<string | null>(null);
    const prevSessionRef = useRef(session);

    const JOURNAL_CACHE_KEY = (uid: string) => `journal_entries_cache_${uid}`;
    const METADATA_CACHE_KEY = (uid: string) => `journal_metadata_cache_${uid}`;

    const persistEntries = useCallback(async (uid: string, data: JournalEntry[]) => {
        try {
            await AsyncStorage.setItem(JOURNAL_CACHE_KEY(uid), JSON.stringify(data));
        } catch (e) {
            console.error('[Journal] Cache persist error (entries):', e);
        }
    }, []);

    const persistMetadata = useCallback(async (uid: string, data: { id: string, created_at: string }[]) => {
        try {
            await AsyncStorage.setItem(METADATA_CACHE_KEY(uid), JSON.stringify(data));
        } catch (e) {
            console.error('[Journal] Cache persist error (metadata):', e);
        }
    }, []);

    const loadCache = useCallback(async (uid: string) => {
        try {
            const [cachedEntries, cachedMeta] = await Promise.all([
                AsyncStorage.getItem(JOURNAL_CACHE_KEY(uid)),
                AsyncStorage.getItem(METADATA_CACHE_KEY(uid))
            ]);

            if (cachedEntries && activeUserIdRef.current === uid) {
                setEntries(JSON.parse(cachedEntries));
            }
            if (cachedMeta && activeUserIdRef.current === uid) {
                setMetadata(JSON.parse(cachedMeta));
            }
            
            if (cachedEntries || cachedMeta) {
                console.log('[Journal] Loaded from local cache');
                setLoading(false); // Short circuit loading state if we have cached data
            }
        } catch (e) {
            console.error('[Journal] Cache load error:', e);
        }
    }, []);

    // Initial load - Note: Initial streak is derived from metadata or cache.
    // For a cold start, metadata will initially be empty. 
    // We don't use 'setStreak' anymore as it's a memo.

    const activeUserIdRef = useRef<string | null>(session?.user?.id || null);

    // Synchronous merge detection to prevent flash
    if (prevSessionRef.current?.user?.is_anonymous && !session?.user?.is_anonymous && session?.user?.id && !isMerging) {
        setIsMerging(true);
        mergeInProgress.current = true;
    }
    
    useEffect(() => {
        prevSessionRef.current = session;
    }, [session]);

    // Sync ref with current session ID
    useEffect(() => {
        activeUserIdRef.current = session?.user?.id || null;
    }, [session?.user?.id]);

    const fetchMetadata = useCallback(async (currentUserId: string) => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('posts')
            .select('id, created_at')
            .eq('user_id', currentUserId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (!error && data && activeUserIdRef.current === currentUserId) {
            setMetadata(data);
            persistMetadata(currentUserId, data);
            const duration = (Date.now() - start) / 1000;
            console.log(`[Journal] Metadata loaded in ${duration.toFixed(3)}s`);
        } else if (error) {
            console.warn(`[Journal] fetchMetadata error:`, error);
        }
    }, []);

    const fetchPage = useCallback(async (pageNum: number, currentUserId: string, clearExisting = false, mode: 'all' | 'favorites' = 'all') => {
        const start = Date.now();
        if (!currentUserId) return;

        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        let query = supabase
            .from('posts')
            .select('id, user_id, text, is_favorite, created_at, type')
            .eq('user_id', currentUserId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (mode === 'favorites') {
            query = query.eq('is_favorite', true);
        }

        const { data, error } = await query;

        if (!error && data && activeUserIdRef.current === currentUserId) {
            // Decrypt entries
            const decryptedData = await Promise.all(data.map(async (entry: JournalEntry) => {
                try {
                    const decryptedText = await encryption.decrypt(entry.text);
                    return { ...entry, text: decryptedText };
                } catch (e) {
                    console.error(`[Journal] Decryption error for entry ${entry.id}:`, e);
                    return entry;
                }
            }));
            
            setEntries(prev => {
                const next = clearExisting ? decryptedData : [...prev, ...decryptedData];
                // Only cache the first page (most recent) for performance and simplicity
                if (pageNum === 0 && mode === 'all') {
                    persistEntries(currentUserId, decryptedData);
                }
                return next;
            });

            setHasMore(data.length === PAGE_SIZE);
            const duration = (Date.now() - start) / 1000;
            console.log(`[Journal] Page ${pageNum} loaded in ${duration.toFixed(3)}s`);
        }
        
        if (activeUserIdRef.current === currentUserId) {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const setFilterMode = useCallback((mode: 'all' | 'favorites') => {
        setFilterModeState(mode);
        const currentUserId = activeUserIdRef.current;
        if (currentUserId) {
            setPage(0);
            setEntries([]);
            setHasMore(true);
            fetchPage(0, currentUserId, true, mode);
        }
    }, [fetchPage]);

    const refreshEntries = useCallback(async () => {
        const currentUserId = activeUserIdRef.current;
        if (!currentUserId) return;

        setPage(0);
        // On refresh, we respect the current filter mode
        await Promise.all([
            fetchMetadata(currentUserId),
            fetchPage(0, currentUserId, true, filterMode)
        ]);
    }, [fetchMetadata, fetchPage, filterMode]);

    // Unified Session and Merge Handler
    useEffect(() => {
        const transitionListener = DeviceEventEmitter.addListener('session_transition', () => {
            setEntries([]);
            setMetadata([]);
            setLoading(true);
            setIsMerging(true);
            mergeInProgress.current = true;
        });

        return () => transitionListener.remove();
    }, []);

    useEffect(() => {
        const syncSessionData = async () => {
            const currentUserId = session?.user?.id;
            const currentUserEmail = session?.user?.email;
            const isAnon = session?.user?.is_anonymous;

            if (!currentUserId) {
                setEntries([]);
                setMetadata([]);
                    setLoading(false);
                setIsMerging(false);
                return;
            }

            try {
                // 1. Check for pending merge
                const anonId = await SecureStore.getItemAsync('pending_merge_anonymous_id');
                
                if (anonId && anonId !== currentUserId && !isAnon) {
                    mergeInProgress.current = true;
                    setIsMerging(true); 
                    
                    // Clear stale anonymous data immediately to show skeleton
                    setEntries([]);
                    setMetadata([]);
                    setLoading(true); // Ensure loading is true for the skeleton state

                    const { data: userName, error } = await supabase.rpc('merge_anonymous_data', { 
                        old_uid: anonId, 
                        new_uid: currentUserId 
                    });
                    
                    if (error) {
                        console.error('[Journal] Merge RPC failed:', error.message);
                    } else {
                        
                        // IMPORTANT: Sync ref immediately so the subsequent fetches are accepted
                        activeUserIdRef.current = currentUserId;

                        await SecureStore.deleteItemAsync('pending_merge_anonymous_id');
                        identifyUser(currentUserId, currentUserEmail || undefined);
                        // Note: Re-keying is skipped as master key is device-persistent.
                        await Promise.all([
                            refreshEntries(),
                            refreshProfile().catch(() => {})
                        ]);
                    }
                    
                    mergeInProgress.current = false;
                    setIsMerging(false); // Release guards
                    lastSyncedUserIdRef.current = currentUserId;

                    if (!error) {
                        setTimeout(() => {
                            showAlert(
                                t('journalMerge.successTitle'), 
                                t('journalMerge.welcomeBack', { name: userName || t('profile.friend') }),
                                [{ text: t('journalMerge.great') }],
                                'success'
                            );
                        }, 100);
                    }
                    return;
                }

                if (lastSyncedUserIdRef.current === currentUserId) {
                    return;
                }

                lastSyncedUserIdRef.current = currentUserId;
                activeUserIdRef.current = currentUserId; // Sync ref before refresh
                mergeInProgress.current = false;
                setIsMerging(false);
                identifyUser(currentUserId, currentUserEmail || undefined);
                
                // Load from cache first for instant UI
                await loadCache(currentUserId);
                
                // Then refresh from network
                await refreshEntries();

            } catch (err) {
                console.error('[Journal] syncSessionData error:', err);
                mergeInProgress.current = false;
                setIsMerging(false);
            }
        };

        syncSessionData();
    }, [session?.user?.id, refreshEntries, showAlert, refreshProfile]);

    // Derived streak calculation - synchronous with metadata updates
    const streakResult = useMemo(() => {
        if (metadata.length === 0) return { streak: 0, isFrozen: false, frozenDates: [] };
        const res = calculateStreak(metadata, profile?.max_streak || 0);
        return res;
    }, [metadata, profile?.max_streak]);

    const streak = streakResult.streak;
    const isFrozen = streakResult.isFrozen;
    const frozenDates = streakResult.frozenDates;

    // Side effect: sync max_streak to profile and cache
    useEffect(() => {
        const userId = session?.user?.id;
        if (streak > 0) {
            if (profile && streak > (profile.max_streak || 0)) {
                updateProfile({ max_streak: streak });
            }
            if (userId) {
                AsyncStorage.setItem(`user_streak_cache_${userId}`, streak.toString()).catch(console.warn);
            }
        } else if (!loading && userId) {
            AsyncStorage.setItem(`user_streak_cache_${userId}`, '0').catch(console.warn);
        }
    }, [streak, profile?.max_streak, session?.user?.id, loading]);

    const loadMore = async () => {
        if (loadingMore || !hasMore || !session?.user?.id) return;
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchPage(nextPage, session.user.id, false, filterMode);
    };

    const fetchEntriesForDate = useCallback(async (dateStr: string | null) => {
        const currentUserId = activeUserIdRef.current;
        if (!currentUserId || !session?.user?.id) return;

        if (!dateStr) {
            setPage(0);
            setEntries([]);
            await fetchPage(0, session.user.id, true);
            return;
        }

        setLoading(true);
        setEntries([]);
        // Find IDs in metadata that match the local date string
        const matchingIds = metadata.filter(item => {
            const d = new Date(item.created_at);
            const userYear = d.getFullYear();
            const userMonth = (d.getMonth() + 1).toString().padStart(2, '0');
            const userDay = d.getDate().toString().padStart(2, '0');
            return `${userYear}-${userMonth}-${userDay}` === dateStr;
        }).map(item => item.id);

        if (matchingIds.length === 0) {
            setEntries([]);
            setHasMore(false);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('posts')
            .select('id, user_id, text, is_favorite, created_at, type')
            .in('id', matchingIds)
            .order('created_at', { ascending: false });

        if (!error && data && activeUserIdRef.current === currentUserId) {
            const decryptedData = await Promise.all(data.map(async (entry: JournalEntry) => ({
                ...entry,
                text: await encryption.decrypt(entry.text)
            })));
            setEntries(decryptedData);
            setHasMore(false);
        }
        
        if (activeUserIdRef.current === currentUserId) {
            setLoading(false);
        }
    }, [metadata, session?.user?.id, fetchPage]);

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
                current_streak: streak + 1 
            });
            
            const localEntry = { ...data, text: text };
            setEntries(prev => {
                const next = [localEntry, ...prev];
                persistEntries(session.user.id, next.slice(0, PAGE_SIZE)); // Keep cache in sync
                return next;
            });

            setMetadata(prev => {
                const next = [{ id: data.id, created_at: data.created_at }, ...prev];
                persistMetadata(session.user.id, next);
                return next;
            });
            
            notifications.scheduleStreakProtection(data.created_at, profile?.max_streak || 0);
        }
    };

    const toggleFavorite = async (id: string, isFavorite: boolean) => {
        // Optimistic UI update
        const previousEntries = [...entries];
        setEntries(prev => {
            if (filterMode === 'favorites' && !isFavorite) {
                return prev.filter(e => e.id !== id);
            }
            return prev.map(e => e.id === id ? { ...e, is_favorite: isFavorite } : e);
        });
        
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
            console.error('[Journal] toggleFavorite error:', error);
            setEntries(previousEntries);
            throw error;
        } else {
            // Update cache after success
            setEntries(prev => {
                persistEntries(session!.user.id, prev.slice(0, PAGE_SIZE));
                return prev;
            });
        }
    };

    const deleteEntry = async (id: string, soft: boolean = true) => {
        // Optimistic UI update
        const previousEntries = [...entries];
        const previousMetadata = [...metadata];
        const now = new Date().toISOString();

        setEntries(prev => prev.filter(e => e.id !== id));
        setMetadata(prev => prev.filter(e => e.id !== id));
        
        posthog.capture('journal_entry_deleted', { entry_id: id, is_soft: soft });

        try {
            if (soft) {
                const { error } = await supabase
                    .from('posts')
                    .update({ deleted_at: now })
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('posts')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            }
        } catch (error) {
            console.error('[Journal] deleteEntry error:', error);
            setEntries(previousEntries);
            setMetadata(previousMetadata);
            throw error;
        } finally {
            // Persist the UI removal (optimistic) or restoration (on error)
            persistEntries(session!.user.id, entries.slice(0, PAGE_SIZE));
            persistMetadata(session!.user.id, metadata);
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

    const dataMatchesUser = !!session?.user?.id && activeUserIdRef.current === session.user.id;
    const effectiveLoading = loading || !dataMatchesUser;

    const value = useMemo(() => ({
        entries: dataMatchesUser ? entries : [],
        loading: effectiveLoading,
        isMerging, 
        loadingMore,
        hasMore,
        streak,
        isFrozen,
        frozenDates,
        rawStreakData: dataMatchesUser ? metadata : [],
        addEntry,
        toggleFavorite,
        deleteEntry,
        refreshEntries,
        loadMore,
        fetchEntriesForDate,
        filterMode,
        setFilterMode
    }), [entries, effectiveLoading, isMerging, loadingMore, hasMore, streak, metadata, refreshEntries, loadMore, fetchEntriesForDate, filterMode, setFilterMode]);

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
