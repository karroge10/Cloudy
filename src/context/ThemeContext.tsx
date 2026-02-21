import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from './ProfileContext';
import { useJournal } from './JournalContext';
import { COMPANIONS } from '../constants/Companions';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
    isThemeUnlocked: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, setColorScheme } = useColorScheme();
    const { profile } = useProfile();
    // Drive isDarkMode into state management
    // We used to gate this behind a streak, but we are making it accessible for everyone now.
    const [optimisticTheme, setOptimisticTheme] = useState<string | null>(null);
    const isDarkMode = (optimisticTheme || colorScheme) === 'dark';
    


    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('app_theme_preference');

            
            if (savedTheme) {
                // Apply saved theme immediately to optimistic state to prevent flash
                if (savedTheme !== optimisticTheme && savedTheme !== colorScheme) {
                     setOptimisticTheme(savedTheme);
                     setColorScheme(savedTheme as any);
                }
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newScheme = isDarkMode ? 'light' : 'dark';

        
        // Optimistic update
        setOptimisticTheme(newScheme);
        setColorScheme(newScheme as any);
        
        try {
            await AsyncStorage.setItem('app_theme_preference', newScheme);
        } catch (e) {
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isThemeUnlocked: true }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
