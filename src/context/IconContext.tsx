import React, { createContext, useContext, useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { AppIconModule } = NativeModules;

export type IconId = 'DEFAULT' | 'SUNNY' | 'BRAINY' | 'DREAMY' | 'COOKIE' | 'GROOVY' | 'SPARKY';

interface IconContextType {
    currentIcon: IconId;
    setIcon: (iconId: IconId) => Promise<boolean>;
}

const IconContext = createContext<IconContextType | undefined>(undefined);

export const IconProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentIcon, setCurrentIcon] = useState<IconId>('DEFAULT');

    useEffect(() => {
        const loadIcon = async () => {
            if (Platform.OS === 'android' && AppIconModule) {
                try {
                    const icon = await AppIconModule.getCurrentIcon();
                    setCurrentIcon(icon as IconId);
                } catch (e) {
                    console.error('[IconContext] Failed to get current icon:', e);
                }
            } else {
                const saved = await AsyncStorage.getItem('app_icon');
                if (saved) setCurrentIcon(saved as IconId);
            }
        };
        loadIcon();
    }, []);

    const setIcon = async (iconId: IconId): Promise<boolean> => {
        try {
            if (Platform.OS === 'android' && AppIconModule) {
                await AppIconModule.setAppIcon(iconId);
            }
            setCurrentIcon(iconId);
            await AsyncStorage.setItem('app_icon', iconId);
            return true;
        } catch (e) {
            console.error('[IconContext] Failed to set app icon:', e);
            return false;
        }
    };

    return (
        <IconContext.Provider value={{ currentIcon, setIcon }}>
            {children}
        </IconContext.Provider>
    );
};

export const useIcon = () => {
    const context = useContext(IconContext);
    if (context === undefined) {
        throw new Error('useIcon must be used within an IconProvider');
    }
    return context;
};
