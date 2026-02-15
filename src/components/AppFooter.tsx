import React from 'react';
import { View, Text } from 'react-native';
import appJson from '../../app.json';

export const AppFooter = () => {
    const APP_VERSION = appJson.expo.version;

    return (
        <View className="mt-8 items-center opacity-40 px-6">
            <Text className="text-xs font-q-bold text-muted uppercase tracking-[2px]">Cloudy Journal App</Text>
            <Text className="text-[10px] font-q-medium text-muted mt-1">Version {APP_VERSION}</Text>
            <Text className="text-[11px] font-q-medium text-muted mt-3">Made with ❤️ for your mind.</Text>
        </View>
    );
};
