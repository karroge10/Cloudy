import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomSheet } from './BottomSheet';
import { MascotImage } from './MascotImage';
import { Button } from './Button';
import { MASCOTS } from '../constants/Assets';
import { haptics } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';
import { useAppLogout } from '../hooks/useAppLogout';
import { useTranslation } from 'react-i18next';

interface LogoutSheetProps {
    visible: boolean;
    onClose: () => void;
    isAnonymous: boolean;
}

export const LogoutSheet = ({ visible, onClose, isAnonymous }: LogoutSheetProps) => {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const { isLoggingOut, handleLogout } = useAppLogout();
    const { t } = useTranslation();

    return (
        <>
            <BottomSheet visible={visible} onClose={onClose}>
                <View className="items-center w-full">
                    {isAnonymous ? (
                        <>
                            <MascotImage source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
                            <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">{t('logout.loseAccessTitle')}</Text>
                            <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                                {t('logout.loseAccessMessage')}
                            </Text>

                            <Button
                                label={t('logout.secureAccount')}
                                onPress={() => {
                                    onClose();
                                    navigation.navigate('SecureAccount', { initialMode: 'signup' });
                                }}
                                haptic="selection"
                            />
                            
                            <TouchableOpacity 
                                onPress={() => { 
                                    haptics.heavy(); 
                                    onClose();
                                    handleLogout(); 
                                }} 
                                className="mt-4 py-2 active:scale-95 transition-transform"
                            >
                                <Text className="text-red-400 font-q-bold text-base">{t('logout.loseData')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <MascotImage source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
                            <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">{t('logout.readyTitle')}</Text>
                            <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                                {t('logout.safeMessage')}
                            </Text>

                            <Button
                                label={t('logout.stay')}
                                onPress={() => { 
                                    haptics.selection();
                                    onClose();
                                }}
                                haptic="selection"
                            />

                            <TouchableOpacity 
                                onPress={() => { 
                                    haptics.heavy(); 
                                    onClose();
                                    handleLogout(); 
                                }} 
                                className="mt-4 py-2 active:scale-95 transition-transform"
                            >
                                <Text className="text-red-400 font-q-bold text-base">{t('logout.confirm')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </BottomSheet>

            <Modal visible={isLoggingOut} transparent={true} animationType="fade">
                <View className={`flex-1 justify-center items-center bg-black/40 ${isDarkMode ? 'dark' : ''}`}>
                    <View className="bg-card p-10 rounded-[40px] items-center shadow-2xl mx-10">
                        <MascotImage 
                            source={MASCOTS.HELLO} 
                            className="w-40 h-40 mb-2" 
                            resizeMode="contain" 
                        />
                        <Text className="text-2xl font-q-bold text-text text-center">{t('logout.title')}</Text>
                        <Text className="text-base font-q-medium text-muted mt-2 text-center px-4">{t('logout.loggingOut')}</Text>
                        <View className="mt-6">
                            <ActivityIndicator size="small" color="#FF9E7D" />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};
