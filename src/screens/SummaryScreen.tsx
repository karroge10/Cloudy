import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Button } from '../components/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { MascotImage } from '../components/MascotImage';

import { Layout } from '../components/Layout';
import { useAlert } from '../context/AlertContext';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { useAnalytics } from '../hooks/useAnalytics';
import { identifyUser } from '../lib/posthog';
import { useProfile } from '../context/ProfileContext';



export const SummaryScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
    const route = useRoute();
    const { trackEvent } = useAnalytics();
    const { updateProfile } = useProfile();

    const mascotSize = height < 750 ? 'w-48 h-48' : height < 850 ? 'w-64 h-64' : 'w-72 h-72';

    const [loading, setLoading] = useState(false);
    const { struggles, goals } = route.params as { struggles: string[], goals: string[] } || { struggles: [], goals: [] };

    const formatList = (items: string[]) => {
        if (items.length === 0) return "stress";
        if (items.length === 1) return items[0].toLowerCase();
        if (items.length === 2) return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`;
        return `${items[0].toLowerCase()} and others`;
    };

    const struggleText = formatList(struggles);
    const goalText = formatList(goals);

    const handleStartWriting = async () => {
        haptics.selection();
        setLoading(true);
        try {
            // Sign in anonymously to bypass traditional auth for now
            const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();
            
            if (authError) throw authError;
            
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
                    throw new Error('Could not save your preferences. Please try again.');
                }
            }

            trackEvent('onboarding_finished', { struggles, goals });
        } catch (error: any) {
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
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
                            We can get there, together.
                        </Text>

                        <MascotImage
                            source={MASCOTS.SHINE}
                            className={`${mascotSize} mb-6`}
                            resizeMode="contain"
                        />

                         <Text className="text-2xl text-text text-center font-q-regular leading-relaxed px-4">
                            Research shows that writing down just <Text className="font-q-bold text-primary">one gratitude</Text> a day can reduce <Text className="font-q-bold text-primary">{struggleText}</Text> and help you find <Text className="font-q-bold text-primary">{goalText}</Text>.
                        </Text>
                    </View>
                </View>

                <View className="w-full">
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-primary" />
                    </View>

                    <Button
                        label="Start Writing"
                        onPress={handleStartWriting}
                        loading={loading}
                    />
                </View>
            </View>
            </ScrollView>
        </Layout>
    );
};
