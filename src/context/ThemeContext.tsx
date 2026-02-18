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
    // We use the same 'effective streak' logic as ProgressScreen for consistency
    const { streak } = useJournal(); 
    
    // Calculate effective max streak (profile sync + current session peak)
    const effectiveMaxStreak = Math.max(profile?.max_streak ?? 0, streak ?? 0);
    
    // Derive isDarkMode directly from colorScheme source of truth
    const isDarkMode = colorScheme === 'dark';
    
    console.log('[ThemeContext] Render: colorScheme=', colorScheme, 'isDarkMode=', isDarkMode, 'streak=', effectiveMaxStreak);

    const dreamyRequirement = COMPANIONS.find(c => c.id === 'DREAMY')?.requiredStreak ?? 30;
    const isThemeUnlocked = effectiveMaxStreak >= dreamyRequirement;

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('app_theme_preference');
            console.log('[ThemeContext] Loading theme:', savedTheme, 'Current:', colorScheme);
            
            if (savedTheme) {
                // Only allow dark mode if unlocked OR if it's already dark (to allow turning it off)
                const shouldBeDark = savedTheme === 'dark' && isThemeUnlocked;
                if (shouldBeDark && colorScheme !== 'dark') {
                    console.log('[ThemeContext] Applying saved DARK theme');
                    setColorScheme('dark');
                } else if (!shouldBeDark && colorScheme !== 'light') {
                    console.log('[ThemeContext] Applying saved LIGHT theme');
                    setColorScheme('light');
                } else {
                    console.log('[ThemeContext] Saved theme matches current (or locked)');
                }
            } else {
                // Default to light
                if (colorScheme !== 'light') {
                    console.log('[ThemeContext] Defaulting to LIGHT');
                    setColorScheme('light');
                }
            }
        };
        loadTheme();
    }, [isThemeUnlocked]);

    // Force light mode only if it's dark AND locked
    useEffect(() => {
        if (!isThemeUnlocked && isDarkMode) {
            console.log('[ThemeContext] Forcing light mode (locked)');
            setColorScheme('light');
            AsyncStorage.setItem('app_theme_preference', 'light');
        }
    }, [isThemeUnlocked, isDarkMode]);

    const toggleTheme = async () => {
        // Only prevent turning it ON if locked. Always allow turning it OFF.
        if (!isThemeUnlocked && !isDarkMode) {
             console.log('[ThemeContext] Blocked toggle: Locked');
             return;
        }

        const newScheme = isDarkMode ? 'light' : 'dark';
        console.log('[ThemeContext] Toggling theme to:', newScheme);
        setColorScheme(newScheme);
        await AsyncStorage.setItem('app_theme_preference', newScheme);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isThemeUnlocked }}>
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
