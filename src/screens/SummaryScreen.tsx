import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Button } from '../components/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { MascotImage } from '../components/MascotImage';

import { Layout } from '../components/Layout';
import { useAlert } from '../context/AlertContext';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { useAnalytics } from '../hooks/useAnalytics';
import { identifyUser } from '../lib/posthog';
import { useProfile } from '../context/ProfileContext';
import { useAccent } from '../context/AccentContext';


export const SummaryScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
    const route = useRoute();
    const { trackEvent } = useAnalytics();
    const { updateProfile } = useProfile();
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    const renderGoalLabel = (goal: string) => {
        switch (goal) {
            case 'Mental Clarity': return t('profile.goals.clarity');
            case 'Memory keeping': return t('profile.goals.memory');
            case 'Self-discipline': return t('profile.goals.discipline');
            case 'Creativity': return t('profile.goals.creativity');
            case 'Gratitude': return t('profile.goals.gratitude');
            case 'Inner Peace': return t('profile.goals.innerPeace');
            case 'Happiness': return t('profile.goals.happiness');
            case 'Better Sleep': return t('profile.goals.betterSleep');
            case 'Productivity': return t('profile.goals.productivity');
            case 'Self-Love': return t('profile.goals.selfLove');
            case 'Focus': return t('profile.goals.focus');
            default: return goal;
        }
    };

    const renderStruggleLabel = (s: string) => {
        switch (s) {
            case 'Anxiety': return t('profile.struggles.anxiety');
            case 'Stress': return t('profile.struggles.stress');
            case 'Sleep': return t('profile.struggles.sleep');
            case 'Focus': return t('profile.struggles.focus');
            case 'Motivation': return t('profile.struggles.motivation');
            case 'N/A': return t('profile.struggles.na');
            case 'Overthinking': return t('profile.struggles.overthinking');
            case 'Low Energy': return t('profile.struggles.lowEnergy');
            case 'Sleep Issues': return t('profile.struggles.sleepIssues');
            case 'Lack of Focus': return t('profile.struggles.lackOfFocus');
            default: return s;
        }
    };

    const mascotSize = height < 750 ? 'w-48 h-48' : height < 850 ? 'w-64 h-64' : 'w-72 h-72';

    const [loading, setLoading] = useState(false);
    const { struggles, goals } = route.params as { struggles: string[], goals: string[] } || { struggles: [], goals: [] };

    const formatList = (items: string[], type: 'goal' | 'struggle') => {
        const labels = items.map(i => type === 'goal' ? renderGoalLabel(i) : renderStruggleLabel(i));
        if (labels.length === 0) return type === 'struggle' ? t('profile.struggles.stress').toLowerCase() : t('profile.goals.clarity').toLowerCase();
        if (labels.length === 1) return labels[0].toLowerCase();
        if (labels.length === 2) return `${labels[0].toLowerCase()} ${t('summary.andJoin')} ${labels[1].toLowerCase()}`;
        return `${labels[0].toLowerCase()} ${t('summary.andSuffix')}`;
    };

    const struggleText = formatList(struggles, 'struggle');
    const goalText = formatList(goals, 'goal');

    const handleStartWriting = async () => {
        haptics.selection();
        setLoading(true);
        try {
            // Check if we already have a session (e.g. from email signup earlier in the flow)
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            let user: any = currentSession?.user;
            
            if (!user) {
                const { data: { user: newUser }, error: authError } = await supabase.auth.signInAnonymously();
                if (authError) throw authError;
                user = newUser;
            }
            
            if (user) {
                identifyUser(user.id, undefined, {
                    onboarding_struggles: struggles,
                    onboarding_goals: goals,
                    primary_struggle: struggles[0] || 'none'
                });

                // Initialize profile with onboarding data via Context
                const success = await updateProfile({
                    goals: goals,
                    struggles: struggles,
                    onboarding_completed: true,
                });

                if (!success) {
                    throw new Error('Profile creation failed. No active session detected.');
                }
            }

            trackEvent('onboarding_finished', { struggles, goals });
        } catch (error: any) {
            // Log the raw error for debugging purposes
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: t('common.okay') }], 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout useSafePadding={false} noScroll={true}>
            <View className="px-6 pt-4">
                 <TopNav showBack={true} />
            </View>

            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
            <View className="flex-1 px-6 justify-between">
                <View>
                    {/* Main Content Area */}
                    <View className="items-center mb-6">
                        <Text className="text-4xl font-q-bold text-text text-center mb-6 pt-4 leading-tight">
                            {t('summary.title')}
                        </Text>

                        <MascotImage
                            source={MASCOTS.SHINE}
                            className={`${mascotSize} mb-6`}
                            resizeMode="contain"
                        />

                         <Text className="text-2xl text-text text-center font-q-regular leading-relaxed px-4">
                            {t('summary.body_start')}
                            <Text className="font-q-bold" style={{ color: currentAccent.hex }}>{t('summary.gratitude')}</Text>
                            {t('summary.body_mid')}
                            <Text className="font-q-bold" style={{ color: currentAccent.hex }}>{struggleText}</Text>
                            {t('summary.body_end')}
                            <Text className="font-q-bold" style={{ color: currentAccent.hex }}>{goalText}</Text>.
                        </Text>
                    </View>
                </View>

                <View className="w-full">
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: currentAccent.hex }} />
                    </View>

                    <Button
                        label={t('summary.startWriting')}
                        onPress={handleStartWriting}
                        loading={loading}
                    />
                </View>
            </View>
            </ScrollView>
        </Layout>
    );
};
