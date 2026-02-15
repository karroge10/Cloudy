import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { InfoCard } from './InfoCard';

interface ProfileNudgeProps {
    isAnonymous: boolean;
    isComplete?: boolean;
    onPressCompleteProfile?: () => void;
    className?: string;
    loading?: boolean;
}

export const ProfileNudge = ({ isAnonymous, isComplete, onPressCompleteProfile, className, loading }: ProfileNudgeProps) => {
    const navigation = useNavigation<any>();

    // Show if not loading AND (anonymous OR profile not complete)
    const showNudge = !loading && (isAnonymous || isComplete === false);
    
    if (!showNudge) return null;

    const handlePress = () => {
        if (isAnonymous) {
            navigation.navigate('SecureAccount', { initialMode: 'signup' });
        } else if (onPressCompleteProfile) {
            onPressCompleteProfile();
        } else {
            navigation.navigate('Profile');
        }
    };

    return (
        <InfoCard
            title={isAnonymous ? 'Secure your journey' : 'Complete your profile'}
            subtitle={isAnonymous 
                ? 'Save your progress to the cloud so you never lose your memories.' 
                : 'Add your name to unlock daily reminders and personalized tips.'}
            icon="sparkles"
            onPress={handlePress}
            className={className}
        />
    );
};
