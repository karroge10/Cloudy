import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { InfoCard } from './InfoCard';
import { useTranslation } from 'react-i18next';

interface ProfileNudgeProps {
    isAnonymous: boolean;
    className?: string;
    loading?: boolean;
}

export const ProfileNudge = ({ isAnonymous, className, loading }: ProfileNudgeProps) => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();

    // Only show for anonymous users
    if (!isAnonymous || loading) return null;

    const handlePress = () => {
        navigation.navigate('SecureAccount');
    };

    return (
        <InfoCard
            title={t('profileNudge.title')}
            subtitle={t('profileNudge.message')}
            icon="sparkles"
            onPress={handlePress}
            className={className}
        />
    );
};
