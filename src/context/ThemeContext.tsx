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
    const isDarkMode = colorScheme === 'dark';
    
    console.log('[ThemeContext] Render: colorScheme=', colorScheme, 'isDarkMode=', isDarkMode);

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('app_theme_preference');
            console.log('[ThemeContext] Loading theme:', savedTheme, 'Current:', colorScheme);
            
            if (savedTheme) {
                if (savedTheme === 'dark' && colorScheme !== 'dark') {
                    console.log('[ThemeContext] Applying saved DARK theme');
                    setColorScheme('dark');
                } else if (savedTheme === 'light' && colorScheme !== 'light') {
                    console.log('[ThemeContext] Applying saved LIGHT theme');
                    setColorScheme('light');
                }
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newScheme = isDarkMode ? 'light' : 'dark';
        console.log('[ThemeContext] Toggling theme to:', newScheme);
        setColorScheme(newScheme);
        await AsyncStorage.setItem('app_theme_preference', newScheme);
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
