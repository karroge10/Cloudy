import React, { useState, useRef, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Animated, Pressable, ScrollView, RefreshControl } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { BottomSheet } from '../components/BottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useJournal } from '../context/JournalContext';
import { useProfile } from '../context/ProfileContext';
import { haptics } from '../utils/haptics';
import { InfoCard } from '../components/InfoCard';
import { useAlert } from '../context/AlertContext';
import { TimePicker } from '../components/TimePicker';
import { MascotImage } from '../components/MascotImage';
import { StreakGoal } from '../components/StreakGoal';
import { useAnalytics } from '../hooks/useAnalytics';
import { Button } from '../components/Button';
import { COMPANIONS } from '../constants/Companions';
import { ReviewNudge } from '../components/ReviewNudge';
import { StreakLostSheet } from '../components/StreakLostSheet';

export const HomeScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<any>();
    const { addEntry, streak, rawStreakData, loading: journalLoading, refreshEntries, isMerging } = useJournal();
    const { profile, loading: profileLoading, updateProfile, isAnonymous, userId, refreshProfile } = useProfile();
    const { trackEvent } = useAnalytics();

    
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSetupSheet, setShowSetupSheet] = useState(false);
    const [showStreakNudge, setShowStreakNudge] = useState(false);
    const [showReviewNudge, setShowReviewNudge] = useState(false);
    const [showStreakLostSheet, setShowStreakLostSheet] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [tempDisplayName, setTempDisplayName] = useState('');
    const [tempReminderTime, setTempReminderTime] = useState(new Date(new Date().setHours(20, 0, 0, 0))); // Default 8 PM
    
    // Animation for mascot
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const handleMascotPress = () => {
        haptics.selection();
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            })
        ]).start();
    };

    // Check for streak loss on mount/updates
    // Check for streak loss on mount/updates
    useEffect(() => {
        const checkStreakLoss = async () => {
             // Only show if user is fully loaded and has a past max streak of importance (e.g. >= 3)
             if (!journalLoading && streak === 0 && (profile?.max_streak || 0) >= 3) {
                 const lastShownEntryDate = await AsyncStorage.getItem('last_loss_sheet_shown_for_entry_date');
                 
                 // Find the most recent entry
                 const sortedData = [...rawStreakData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                 const latestEntry = sortedData[0];

                 if (latestEntry) {
                     // logic: If the latest entry is different from the one we last showed the sheet for,
                     // it means we haven't acknowledged THIS streak loss yet.
                     // Even if I post today, streak becomes 1. last_loss_sheet_shown_for_entry_date stays old.
                     // If I lose streak again, streak becomes 0. Latest entry is new. Mismatch! -> Show.
                     if (latestEntry.created_at !== lastShownEntryDate) {
                        setShowStreakLostSheet(true);
                        await AsyncStorage.setItem('last_loss_sheet_shown_for_entry_date', latestEntry.created_at);
                        trackEvent('streak_loss_sheet_shown', { max_streak: profile?.max_streak });
                     }
                 }
             }
        };
        checkStreakLoss();
    }, [streak, journalLoading, profile?.max_streak, rawStreakData]);

    const handleSave = async () => {
        if (!text.trim()) {
            showAlert('Empty Entry', 'Please write something to save.', [{ text: 'Okay' }], 'info');
            return;
        }

        setLoading(true);
        try {
            haptics.heavy();
            await addEntry(text.trim());
            haptics.success();


            
            Keyboard.dismiss();
            
            // Use isAnonymous from profile context instead of fetching from Supabase
            const isAnon = isAnonymous;

            const likelyStreak = streak + 1; 
            const hasSeenFirstEntry = await AsyncStorage.getItem('has_seen_first_entry');

            if (!hasSeenFirstEntry && !profile?.display_name) {
                // First time entry and no name set yet
                trackEvent('setup_sheet_shown');
                setShowSetupSheet(true);
            } else if (isAnon && likelyStreak === 3) {  
                // Suggest linking account on 3rd entry
                trackEvent('conversion_nudge_shown', { streak: likelyStreak });
                setShowStreakNudge(true);
            } else if (likelyStreak === 3) {
                // Moment of Delight: Show Review Nudge on 3rd day for non-anon users
                // Or if they just linked their account it might trigger here later
                const hasShownReview = await AsyncStorage.getItem('has_shown_review_nudge');
                if (!hasShownReview) {
                    trackEvent('review_nudge_shown');
                    setShowReviewNudge(true);
                    await AsyncStorage.setItem('has_shown_review_nudge', 'true');
                } else {
                    setText('');
                }
            } else {
                 setText('');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'Could not save your entry.', [{ text: 'Okay' }], 'error');
        } finally {
            setLoading(false);
        }
    };

    const [setupStep, setSetupStep] = useState(0); // 0: Name, 1: Notifications

    const onRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refreshProfile(),
                refreshEntries()
            ]);
            haptics.selection();
        } catch (error) {
            console.error('[HomeScreen] Refresh error:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!tempDisplayName.trim()) {
            showAlert('Name Required', 'Please let us know what to call you.', [{ text: 'Okay' }], 'info');
            return;
        }

        setIsSavingName(true);
        try {
            await updateProfile({
                display_name: tempDisplayName.trim(),
            });

            trackEvent('onboarding_name_saved');
            // Move to notification step instead of closing
            setSetupStep(1);
            haptics.success();

        } catch (error: any) {
            showAlert('Error', error.message, [{ text: 'Okay' }], 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleEnableNotifications = async () => {
        setIsSavingName(true);
        try {
            // Manual format to ensure 'HH:mm' regardless of locale
            const h = tempReminderTime.getHours().toString().padStart(2, '0');
            const m = tempReminderTime.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${h}:${m}`;
            
            await updateProfile({
                reminder_time: formattedTime,
                onboarding_completed: true,
            });
            
            trackEvent('onboarding_notifications_enabled', { time: formattedTime });
            trackEvent('onboarding_completed');

            await AsyncStorage.setItem('has_seen_first_entry', 'true');

            setShowSetupSheet(false);
            trackEvent('setup_sheet_completed');
            setText('');
        } catch (error: any) {
            showAlert('Error', error.message, [{ text: 'Okay' }], 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleMaybeLater = () => {
        // Close sheet immediately - don't block UI on I/O
        setShowSetupSheet(false);
        setText('');
        setSetupStep(0);

        // Fire and forget persistence
        updateProfile({ onboarding_completed: true }).catch(err => {
            console.warn('[HomeScreen] Failed to mark onboarding complete:', err);
        });
        AsyncStorage.setItem('has_seen_first_entry', 'true').catch(err => {
            console.warn('[HomeScreen] Failed to set first entry flag:', err);
        });
        trackEvent('setup_sheet_dismissed');
    };

    const charCount = text.length;
    const isNewUser = !!(profile && profile.onboarding_completed === false);

    const inputRef = useRef<TextInput>(null);

    return (
        <Layout isTabScreen={true} noScroll={true} useSafePadding={false}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 110 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF9E7D"
                        colors={["#FF9E7D"]}
                    />
                }
            >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Pressable onPress={handleMascotPress}>
                    <MascotImage 
                        isAnimated
                        source={MASCOTS.WRITE} 
                        className="w-24 h-24" 
                        resizeMode="contain"
                        style={{ transform: [{ scale: scaleAnim }] }}
                    />
                </Pressable>
                <View className="items-end">
                    <View className="flex-row items-center">
                        <Text className="text-lg text-muted font-q-bold">TODAY</Text>
                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); navigation.navigate('Profile'); }} 
                            className="ml-3 active:scale-90 transition-transform"
                        >
                            <View className="flex-row items-center bg-white px-2 py-1 rounded-full shadow-sm">
                                <Ionicons name="flame" size={16} color="#FF9E7D" />
                                {journalLoading && streak === 0 ? (
                                    <View className="bg-primary/10 w-4 h-4 rounded-full ml-1" />
                                ) : (
                                    <Text className="font-q-bold text-primary ml-1 text-base">{streak}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text className="text-xl font-q-bold text-text mr-2">{formattedDate}</Text>
                </View>
            </View>

            {/* Streak Goal Milestone - Now at the top */}
            <StreakGoal 
                streak={streak} 
                maxStreak={profile?.max_streak}
                isLoading={journalLoading || profileLoading || isMerging}
                className="mb-8" 
                onPress={() => {
                    trackEvent('progress_viewed');
                    navigation.navigate('Progress');
                }}
            />
            


            {/* Main Writing Card */}
            <View className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl mb-6 flex-1 min-h-[300px]" style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 5 }}>
                <Text className="text-xl font-q-bold text-text mb-4 text-center">
                    Daily Gratitude
                </Text>
                <TextInput
                    ref={inputRef}
                    multiline
                    placeholder="What's on your mind today?"
                    placeholderTextColor="#999"
                    className="text-text font-q-regular text-lg flex-1 mb-4"
                    textAlignVertical="top"
                    value={text}
                    onChangeText={setText}
                    maxLength={200}
                />
                
                <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                    <Text className="text-muted font-q-medium">
                        {charCount} / 200 symbols
                    </Text>
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={loading}
                        delayPressIn={0}
                        className="bg-primary px-8 py-2.5 rounded-xl shadow-sm active:scale-95 transition-transform min-h-[44px] justify-center"
                    >
                        <View className="items-center justify-center">
                            <Text className={`text-white font-q-bold text-base ${loading ? "opacity-0" : "opacity-100"}`}>
                                Save
                            </Text>
                            {loading && (
                                <View className="absolute inset-0 items-center justify-center">
                                    <ActivityIndicator color="white" size="small" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            </ScrollView>

            {/* Post-Save Setup Sheet */}
            <BottomSheet 
                visible={showSetupSheet} 
                onClose={handleMaybeLater}
            >
                {setupStep === 0 ? (
                    <View className="items-center w-full">
                        <MascotImage source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                        <Text className="text-xl font-q-bold text-primary text-center mb-1">Beautifully said!</Text>
                        <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                            What should Cloudy call you?
                        </Text>
                        
                        <TextInput
                            className="w-full bg-white px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                            placeholder="Your Name"
                            placeholderTextColor="#CBD5E1"
                            onChangeText={setTempDisplayName}
                            value={tempDisplayName}
                            autoCapitalize="words"
                            autoFocus={true}
                        />

                        <Button 
                            label="Save Profile"
                            onPress={handleSaveProfile}
                            loading={isSavingName}
                        />

                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); handleMaybeLater(); }}
                            className="mt-4 py-2 active:scale-95 transition-transform"
                        >
                            <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="items-center w-full">
                        <MascotImage source={MASCOTS.WATCH} className="w-40 h-40 mb-4" resizeMode="contain" />
                        <Text className="text-xl font-q-bold text-primary text-center mb-1 px-4">Nice to meet you, {tempDisplayName}!</Text>
                        <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                            When should I remind you to reflect?
                        </Text>

                        <View className="w-full mb-8">
                            <TimePicker value={tempReminderTime} onChange={setTempReminderTime} />
                        </View>

                        <Button 
                            label="Set Reminder"
                            onPress={handleEnableNotifications}
                            loading={isSavingName}
                        />

                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); handleMaybeLater(); }}
                            className="mt-4 py-2 active:scale-95 transition-transform"
                        >
                            <Text className="text-muted font-q-bold text-base">No thanks, I'll remember</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheet>
            {/* 3-Day Streak Nudge Sheet */}
            <BottomSheet 
                visible={showStreakNudge} 
                onClose={() => {
                    handleMaybeLater(); // Also treat closing this as maybe later
                }}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.STREAK} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-xl font-q-bold text-primary text-center mb-1">You're doing great!</Text>
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-6">
                        Want to link an account so you never lose these memories?
                    </Text>

                    <Button 
                        label="Link Account"
                        onPress={() => {
                            haptics.medium();
                            trackEvent('conversion_nudge_clicked');
                            setShowStreakNudge(false);
                            setText('');
                            navigation.navigate('SecureAccount', { initialMode: 'signup' });
                        }}
                    />

                    <TouchableOpacity 
                       onPress={() => {
                           haptics.selection();
                           trackEvent('conversion_nudge_dismissed');
                           setShowStreakNudge(false);
                           setText('');
                       }}
                       className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                        <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <ReviewNudge 
                visible={showReviewNudge} 
                onClose={() => {
                    setShowReviewNudge(false);
                    setText('');
                }}
            />

            <StreakLostSheet 
                visible={showStreakLostSheet}
                onClose={() => setShowStreakLostSheet(false)}
            />
        </Layout>
    );
};
