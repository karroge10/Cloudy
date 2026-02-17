import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { InfoCard } from './InfoCard';

interface ProfileNudgeProps {
    isAnonymous: boolean;
    className?: string;
    loading?: boolean;
}

export const ProfileNudge = ({ isAnonymous, className, loading }: ProfileNudgeProps) => {
    const navigation = useNavigation<any>();

    // Only show for anonymous users
    if (!isAnonymous || loading) return null;

    const handlePress = () => {
        navigation.navigate('SecureAccount');
    };

    return (
        <InfoCard
            title="Secure your journey"
            subtitle="Save your progress to the cloud so you never lose your memories."
            icon="sparkles"
            onPress={handlePress}
            className={className}
        />
    );
};
