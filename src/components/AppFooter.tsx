import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import appJson from '../../app.json';
import { LINKS } from '../constants/Links';
import { useTranslation } from 'react-i18next';

export const AppFooter = () => {
    const APP_VERSION = appJson.expo.version;

    const { t } = useTranslation();

    return (
        <View className="mt-8 items-center opacity-40 px-6">
            <TouchableOpacity onPress={() => Linking.openURL(LINKS.WEBSITE)}>
                <Text className="text-xs font-q-bold text-muted uppercase tracking-[2px]">Cloudy Journal App</Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-q-medium text-muted mt-1">{t('common.version')} {APP_VERSION}</Text>
            <Text className="text-[11px] font-q-medium text-muted mt-3">{t('common.madeWithLove')}</Text>
        </View>
    );
};
