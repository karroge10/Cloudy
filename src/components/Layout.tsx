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
}

export const Layout = ({ children, isTabScreen = false, className = "", noScroll = false, backgroundColors }: LayoutProps) => {
    const content = (
        <View className={`flex-1 px-6 py-4 ${className}`}>
            {children}
            {isTabScreen && <View className="h-32" />}
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

    if (backgroundColors) {
        return (
            <LinearGradient 
                colors={backgroundColors as [string, string, ...string[]]} 
                className="flex-1"
            >
                <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                    <StatusBar style="dark" />
                    {renderContent()}
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <View className="flex-1">
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

