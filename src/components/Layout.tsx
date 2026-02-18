import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
    children: React.ReactNode;
    isTabScreen?: boolean;
    className?: string;
    noScroll?: boolean;
    backgroundColors?: string[];
    useSafePadding?: boolean;
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Layout = ({ 
    children, 
    isTabScreen = false, 
    className = "", 
    noScroll = false, 
    useSafePadding = true,
    edges,
    backgroundColors
}: LayoutProps) => {
    const { isDarkMode } = useTheme();
    const defaultColors = isDarkMode ? ['#111427', '#0f1122'] : ['#FFF9F0', '#fff1db'];
    const finalColors = backgroundColors || defaultColors;

    const content = (
        <View className={`flex-1 ${useSafePadding ? 'px-6 py-4' : ''} ${className}`}>
            {children}
            {isTabScreen && !noScroll && <View className="h-32" />}
        </View>
    );

    const renderContent = () => (
        noScroll ? (
            content
        ) : (
            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                {content}
            </ScrollView>
        )
    );

    const renderLayout = () => (
        <SafeAreaView 
            className="flex-1" 
            edges={edges || (isTabScreen ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom'])}
        >
            <StatusBar style={isDarkMode ? "light" : "dark"} translucent />
            {renderContent()}
        </SafeAreaView>
    );

    return (
        <View className="flex-1 bg-background">
            {finalColors ? (
                <LinearGradient 
                    colors={finalColors as [string, string, ...string[]]} 
                    className="flex-1"
                >
                    {renderLayout()}
                </LinearGradient>
            ) : (
                renderLayout()
            )}
        </View>
    );
};


