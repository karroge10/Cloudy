import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { useProfile } from './ProfileContext';

export const ACCENT_COLORS = {
    ORANGE: { id: 'ORANGE', label: 'Sunny Orange', value: '255 158 125', hex: '#FF9E7D' },
    BLUE: { id: 'BLUE', label: 'Ocean Blue', value: '59 130 246', hex: '#3B82F6' },
    GREEN: { id: 'GREEN', label: 'Nature Green', value: '34 197 94', hex: '#22C55E' },
    PURPLE: { id: 'PURPLE', label: 'Royal Purple', value: '168 85 247', hex: '#A855F7' },
    PINK: { id: 'PINK', label: 'Rose Pink', value: '236 72 153', hex: '#EC4899' },
    TEAL: { id: 'TEAL', label: 'Calm Teal', value: '20 184 166', hex: '#14B8A6' },
} as const;

export type AccentColorId = keyof typeof ACCENT_COLORS;

interface AccentContextType {
    currentAccent: typeof ACCENT_COLORS[AccentColorId];
    setAccent: (id: AccentColorId) => Promise<void>;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export const AccentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userId } = useProfile();
    const [currentAccent, setCurrentAccent] = useState<typeof ACCENT_COLORS[AccentColorId]>(ACCENT_COLORS.ORANGE);

    const getStorageKey = useCallback((uid: string | null) => {
        return uid ? `accent_color_${uid}` : 'accent_color_anonymous';
    }, []);

    const loadAccent = useCallback(async (uid: string | null) => {
        try {
            const key = getStorageKey(uid);
            const saved = await AsyncStorage.getItem(key);
            if (saved && saved in ACCENT_COLORS) {
                setCurrentAccent(ACCENT_COLORS[saved as AccentColorId]);
            } else {
                setCurrentAccent(ACCENT_COLORS.ORANGE);
            }
        } catch (e) {
        }
    }, [getStorageKey]);

    useEffect(() => {
        loadAccent(userId);
    }, [userId, loadAccent]);

    const setAccent = async (id: AccentColorId) => {
        try {
            setCurrentAccent(ACCENT_COLORS[id]);
            const key = getStorageKey(userId);
            await AsyncStorage.setItem(key, id);
        } catch (e) {
        }
    };

    return (
        <AccentContext.Provider value={{ currentAccent, setAccent }}>
            <View style={{ flex: 1, '--primary': currentAccent.value } as any}>
                {children}
            </View>
        </AccentContext.Provider>
    );
};

export const useAccent = () => {
    const context = useContext(AccentContext);
    if (!context) throw new Error('useAccent must be used within AccentProvider');
    return context;
};
