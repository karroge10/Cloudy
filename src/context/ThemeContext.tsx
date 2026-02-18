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
    
    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    const dreamyRequirement = COMPANIONS.find(c => c.id === 'DREAMY')?.requiredStreak ?? 30;
    const isThemeUnlocked = effectiveMaxStreak >= dreamyRequirement;

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('app_theme_preference');
            if (savedTheme) {
                // Only allow dark mode if unlocked OR if it's already dark (to allow turning it off)
                const shouldBeDark = savedTheme === 'dark' && isThemeUnlocked;
                setColorScheme(shouldBeDark ? 'dark' : 'light');
                setIsDarkMode(shouldBeDark);
            } else {
                setColorScheme('light');
                setIsDarkMode(false);
            }
        };
        loadTheme();
    }, [isThemeUnlocked]);

    // Force light mode only if it's dark AND locked
    useEffect(() => {
        if (!isThemeUnlocked && isDarkMode) {
            // We don't force it off here automatically if the user is in the middle of something,
            // but for safety we should. However, the user said they couldn't turn it off.
            // If we force it off here, it solves the "stuck" problem.
            setColorScheme('light');
            setIsDarkMode(false);
            AsyncStorage.setItem('app_theme_preference', 'light');
        }
    }, [isThemeUnlocked]);

    const toggleTheme = async () => {
        // Only prevent turning it ON if locked. Always allow turning it OFF.
        if (!isThemeUnlocked && !isDarkMode) return;

        const newScheme = isDarkMode ? 'light' : 'dark';
        setColorScheme(newScheme);
        setIsDarkMode(newScheme === 'dark');
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
