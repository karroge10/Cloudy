import React, { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { BottomSheet } from '../components/BottomSheet';
import { calculateStreak } from '../utils/streakUtils'; // Preserving this import I might have missed
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [onboardingCompleted, setOnboardingCompleted] = useState(true);
    const [showSetupSheet, setShowSetupSheet] = useState(false);
    const [showStreakNudge, setShowStreakNudge] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [streak, setStreak] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const confettiRef = React.useRef<ConfettiCannon>(null);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    useFocusEffect(
        React.useCallback(() => {
            checkProfile();
        }, [])
    );

    const checkProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Profile Data
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed, display_name')
            .eq('id', user.id)
            .single();

        // 2. Fetch Posts for Real Streak Calculation
        const { data: postsData } = await supabase
            .from('posts')
            .select('created_at')
            .eq('user_id', user.id);

        const realStreak = calculateStreak(postsData || []);
        setStreak(realStreak);

        // 3. Sync streak to profile if slightly out of date (silent update)
        if (profileData) {
             const { error: updateError } = await supabase
                .from('profiles')
                .update({ streak_count: realStreak })
                .eq('id', user.id);
        }

        if (profileData && !profileError) {
            setOnboardingCompleted(profileData.onboarding_completed ?? false);
            setDisplayName(profileData.display_name || '');
        } else if (profileError && profileError.code === 'PGRST116') {
             setOnboardingCompleted(false);
        }
    };

    const handleSave = async () => {
        if (!text.trim()) {
            Alert.alert('Empty Entry', 'Please write something to save.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to save.');

            // 1. Save entry to 'posts' table
            const { error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    text: text.trim(),
                    type: 'gratitude'
                });

            if (postError) throw postError;

            // 2. Success Feedback
            Keyboard.dismiss();
            
            const hasSeenFirstEntry = await AsyncStorage.getItem('has_seen_first_entry');
            const isAnon = user.is_anonymous;

            // Update streak locally for immediate feedback 
            // (In a real app, we'd wait for server, but we want snappy UI)
            const newStreak = streak + 1; // Simplified optimistic update

            if (!hasSeenFirstEntry) {
                // First time entry celebration
                setShowConfetti(true);
                confettiRef.current?.start();
                setShowSetupSheet(true);
            } else if (isAnon && newStreak === 3) { 
                // Suggest linking account on 3rd entry
                setShowStreakNudge(true);
            } else {
                 // Standard success toast/haptic could go here
                 setText('');
            }
            
            // Refresh real data in background
            checkProfile();

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not save your entry.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            Alert.alert('Name Required', 'Please let us know what to call you.');
            return;
        }

        setIsSavingName(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: displayName.trim(),
                    onboarding_completed: true,
                    updated_at: new Date()
                });

            if (error) throw error;

            await AsyncStorage.setItem('has_seen_first_entry', 'true');
            setOnboardingCompleted(true);
            setShowSetupSheet(false);
            setText('');
            // Confetti or Toast could go here, but we already showed confetti on open
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleMaybeLater = async () => {
        await AsyncStorage.setItem('has_seen_first_entry', 'true');
        setShowSetupSheet(false);
        setText('');
    };

    const charCount = text.length;

    return (
        <Layout isTabScreen={true} useSafePadding={false} className="px-6 pt-4">
            {showConfetti && (
                <View className="absolute top-0 left-0 right-0 bottom-0 z-50 pointer-events-none">
                    <ConfettiCannon
                        count={200}
                        origin={{x: -10, y: 0}}
                        autoStart={true}
                        ref={confettiRef}
                        fadeOut={true}
                        onAnimationEnd={() => setShowConfetti(false)}
                    />
                </View>
            )}

            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Image 
                    source={onboardingCompleted ? MASCOTS.WRITE : MASCOTS.HELLO} 
                    className="w-24 h-24" 
                    resizeMode="contain" 
                />
                <View className="items-end">
                    <View className="flex-row items-center">
                        <Text className="text-lg text-muted font-q-bold">TODAY</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                            <View className="flex-row items-center bg-white px-2 py-1 rounded-full shadow-sm">
                                <Ionicons name="flame" size={16} color="#FF9E7D" />
                                <Text className="font-q-bold text-primary ml-1 text-base">{streak}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text className="text-xl font-q-bold text-text mr-2">{formattedDate}</Text>
                </View>
            </View>

            {/* Main Writing Card */}
            <View className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl mb-8 flex-1" style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 5 }}>
                <Text className="text-xl font-q-bold text-text mb-4 text-center">
                    Daily Gratitude
                </Text>
                <TextInput
                    multiline
                    placeholder="What's on your mind today?"
                    placeholderTextColor="#999"
                    className="text-text font-q-regular text-lg flex-1 mb-4"
                    textAlignVertical="top"
                    value={text}
                    onChangeText={setText}
                    maxLength={200}
                    autoFocus={!onboardingCompleted}
                />
                
                <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                    <Text className="text-muted font-q-medium">
                        {charCount} / 200 symbols
                    </Text>
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={loading}
                        className="bg-primary px-8 py-2.5 rounded-xl shadow-sm active:opacity-90"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-q-bold text-base">Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tip Box */}
            <View className="bg-tip-bg rounded-2xl p-5 flex-row items-center shadow-[#00000005] shadow-sm mb-8" style={{ elevation: 2 }}>
                <View className="bg-secondary p-3 rounded-full mr-4 w-12 h-12 items-center justify-center">
                    <Ionicons name="bulb" size={24} color="#FF9E7D" />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-q-bold text-base mb-0.5">Writing Tip</Text>
                    <Text className="text-muted font-q-regular text-sm leading-5">
                        Focus on one small thing that went well today, no matter how tiny it seems.
                    </Text>
                </View>
            </View>

            {/* Post-Save Setup Sheet */}
            <BottomSheet 
                visible={showSetupSheet} 
                onClose={() => {
                    handleMaybeLater();
                }}
            >
                <View className="items-center">
                    <Image source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">Beautifully said!</Text>
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4">
                        What should Cloudy call you?
                    </Text>
                    
                    <TextInput
                        className="w-full bg-white px-6 py-4 rounded-2xl font-q-bold text-lg text-text border border-gray-100 shadow-sm mb-8"
                        placeholder="Your Name"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setDisplayName}
                        value={displayName}
                        autoCapitalize="words"
                    />

                    <TouchableOpacity 
                        onPress={handleSaveProfile}
                        disabled={isSavingName}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        {isSavingName ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-q-bold text-lg">Save Profile</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                       onPress={handleMaybeLater}
                       className="py-2"
                    >
                        <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
            {/* 3-Day Streak Nudge Sheet */}
            <BottomSheet 
                visible={showStreakNudge} 
                onClose={() => {
                    handleMaybeLater(); // Also treat closing this as maybe later
                }}
            >
                <View className="items-center">
                    <Image source={MASCOTS.STREAK} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">You're doing great!</Text>
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4">
                        You've reached a 3-day streak! Want to link an account so you never lose these memories?
                    </Text>

                    <TouchableOpacity 
                        onPress={() => {
                            setShowStreakNudge(false);
                            setText('');
                            navigation.navigate('Auth');
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Link Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                       onPress={() => {
                           setShowStreakNudge(false);
                           setText('');
                       }}
                       className="py-2"
                    >
                        <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </Layout>
    );
};
