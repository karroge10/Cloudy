import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

interface LayoutProps {
    children: React.ReactNode;
    isTabScreen?: boolean;
    className?: string;
    noScroll?: boolean;
    backgroundColors?: string[];
    useSafePadding?: boolean;
}

export const Layout = ({ 
    children, 
    isTabScreen = false, 
    className = "", 
    noScroll = false, 
    useSafePadding = true,
    backgroundColors = ['#FFF9F0', '#fff1db'] 
}: LayoutProps) => {
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
            edges={isTabScreen ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
        >
            <StatusBar style="dark" translucent />
            {renderContent()}
        </SafeAreaView>
    );

    return (
        <View className="flex-1 bg-background">
            {backgroundColors ? (
                <LinearGradient 
                    colors={backgroundColors as [string, string, ...string[]]} 
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


