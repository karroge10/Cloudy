import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

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
    const [currentAccent, setCurrentAccent] = useState<typeof ACCENT_COLORS[AccentColorId]>(ACCENT_COLORS.ORANGE);

    useEffect(() => {
        loadAccent();
    }, []);

    const loadAccent = async () => {
        try {
            const saved = await AsyncStorage.getItem('accent_color');
            if (saved && saved in ACCENT_COLORS) {
                setCurrentAccent(ACCENT_COLORS[saved as AccentColorId]);
            }
        } catch (e) {
            console.error('Failed to load accent color', e);
        }
    };

    const setAccent = async (id: AccentColorId) => {
        try {
            setCurrentAccent(ACCENT_COLORS[id]);
            await AsyncStorage.setItem('accent_color', id);
        } catch (e) {
            console.error('Failed to save accent color', e);
        }
    };

    // We inject the CSS variable here. 
    // Note: NativeWind 4+ often picks up vars from inline styles on parent Views.
    // If using NativeWind 2/3, we might need a different approach, but let's try this standard way first.
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
