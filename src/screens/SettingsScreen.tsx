import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useProfile } from '../context/ProfileContext';
import { haptics } from '../utils/haptics';
import { security } from '../utils/security';
import { useAlert } from '../context/AlertContext';
import { AppFooter } from '../components/AppFooter';
import { FeedbackSheet } from '../components/FeedbackSheet';
import { supabase } from '../lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetUser } from '../lib/posthog';
import { useAnalytics } from '../hooks/useAnalytics';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { TimePicker } from '../components/TimePicker';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { profile, updateProfile, userId } = useProfile();
    const { showAlert } = useAlert();
    const { trackEvent } = useAnalytics();

    const [isFeedbackSheetVisible, setIsFeedbackSheetVisible] = useState(false);
    const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [bioSupported, setBioSupported] = useState(false);

    const isHapticsEnabled = profile?.haptics_enabled ?? true;
    const reminderTime = profile?.reminder_time;
    const displayReminderTime = reminderTime || '20:00';

    useEffect(() => {
        const checkBio = async () => {
            const supported = await security.isSupported();
            setBioSupported(supported);
        };
        checkBio();
    }, []);

    useEffect(() => {
        if (profile?.reminder_time) {
            const [hours, minutes] = profile.reminder_time.split(':');
            const d = new Date();
            d.setHours(parseInt(hours));
            d.setMinutes(parseInt(minutes));
            setReminderDate(d);
        }
    }, [profile]);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('has_seen_first_entry');
            await AsyncStorage.removeItem('user_streak_cache');
            await AsyncStorage.removeItem('pending_merge_anonymous_id');
            await AsyncStorage.removeItem('security_lock_enabled');
            
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }

            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            trackEvent('user_logged_out');
            resetUser();

        } catch (error: any) {
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            if (!userId) return;

            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) throw profileError;

            trackEvent('user_deleted_account');
            await handleLogout();
            
            setIsDeleteSheetVisible(false);
            
            showAlert(
                'Account Deleted',
                'Your data has been removed. We hope to see you again someday.',
                [{ text: 'Goodbye' }],
                'success'
            );
        } catch (error: any) {
            showAlert('Error', 'Could not delete account. Please try logging out instead.', [{ text: 'Okay' }], 'error');
        }
    };

    return (
        <Layout noScroll={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Settings" showBack={true} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}
            >
                {/* App Settings Section */}
                <View className="mb-8 bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl"
                    style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
                    
                    {/* Daily Reminder */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1">
                            <Text className="text-lg font-q-bold text-text">Daily Reminder</Text>
                            <TouchableOpacity onPress={() => { haptics.selection(); setIsTimeSheetVisible(true); }}>
                                <Text className="text-primary font-q-bold text-base mt-1">{displayReminderTime}</Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: '#FF9E7D' }}
                            thumbColor="#FFFFFF"
                            onValueChange={(val) => {
                                haptics.selection();
                                if (val) {
                                    updateProfile({ reminder_time: displayReminderTime });
                                } else {
                                    updateProfile({ reminder_time: null });
                                }
                            }}
                            value={!!reminderTime}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Haptic Feedback */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1">
                            <Text className="text-lg font-q-bold text-text">Haptic Feedback</Text>
                            <Text className="text-muted font-q-medium text-xs">Soft vibrations for interactions</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: '#FF9E7D' }}
                            thumbColor="#FFFFFF"
                            onValueChange={(val) => {
                                updateProfile({ haptics_enabled: val });
                                haptics.selection();
                            }}
                            value={isHapticsEnabled}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Biometric Lock */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1">
                            <Text className="text-lg font-q-bold text-text">Lock my Cloud</Text>
                            <Text className="text-muted font-q-medium text-xs">Biometric protection for your diary</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: '#FF9E7D' }}
                            thumbColor="#FFFFFF"
                            onValueChange={(val) => {
                                haptics.selection();
                                if (val && !bioSupported) {
                                    showAlert(
                                        'Not Supported', 
                                        'Your device does not support biometrics or none are enrolled.', 
                                        [{ text: 'Okay' }], 
                                        'info'
                                    );
                                    return;
                                }
                                updateProfile({ security_lock_enabled: val });
                            }}
                            value={profile?.security_lock_enabled ?? false}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Privacy Policy */}
                    <TouchableOpacity 
                        onPress={() => { haptics.selection(); navigation.navigate('Legal', { type: 'privacy' }); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <Text className="text-lg font-q-bold text-text">Privacy & Security</Text>
                        <Ionicons name="lock-closed-outline" size={22} color="#FF9E7D" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Feedback */}
                    <TouchableOpacity 
                        onPress={() => { haptics.selection(); setIsFeedbackSheetVisible(true); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <View>
                            <Text className="text-lg font-q-bold text-text">Cloudy Whisper</Text>
                            <Text className="text-muted font-q-medium text-xs">Send feedback or report bugs</Text>
                        </View>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FF9E7D" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Delete Account */}
                    <TouchableOpacity 
                        onPress={() => { haptics.selection(); setIsDeleteSheetVisible(true); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <Text className="text-lg font-q-bold text-text">Delete Account & Data</Text>
                        <Ionicons name="trash-outline" size={22} color="#FF9E7D" />
                    </TouchableOpacity>
                </View>

                {/* Log Out */}
                <TouchableOpacity onPress={() => { haptics.heavy(); handleLogout(); }} className="mt-4 items-center py-4 active:scale-95 transition-transform">
                    <Text className="text-lg font-q-bold text-red-400/60">Log Out</Text>
                </TouchableOpacity>

                <AppFooter />
            </ScrollView>

            <BottomSheet visible={isTimeSheetVisible} onClose={() => setIsTimeSheetVisible(false)}>
                <View className="items-center mt-2 w-full">
                    <MascotImage source={MASCOTS.WATCH} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">When to remind you?</Text>
                    
                    <View className="w-full mb-8">
                        <TimePicker value={reminderDate} onChange={setReminderDate} />
                    </View>

                    <Button 
                        label="Update Time"
                        onPress={() => {
                            const h = reminderDate.getHours().toString().padStart(2, '0');
                            const m = reminderDate.getMinutes().toString().padStart(2, '0');
                            const formatted = `${h}:${m}`;
                            updateProfile({ reminder_time: formatted });
                            setIsTimeSheetVisible(false);
                            haptics.success();
                        }}
                    />

                    <TouchableOpacity onPress={() => { haptics.selection(); setIsTimeSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                            <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <BottomSheet visible={isDeleteSheetVisible} onClose={() => setIsDeleteSheetVisible(false)}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.CRY} className="w-32 h-32 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">Are you sure you want to leave?</Text>
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                        This will permanently erase all your memories and your profile. This action cannot be undone.
                    </Text>
                    
                    <Button 
                        label="Yes, Delete Everything"
                        onPress={() => { haptics.heavy(); handleDeleteAccount(); }}
                        haptic="heavy"
                    />

                    <TouchableOpacity onPress={() => { haptics.selection(); setIsDeleteSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                            <Text className="text-muted font-q-bold text-base">Wait, I'll stay!</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <FeedbackSheet 
                visible={isFeedbackSheetVisible} 
                onClose={() => setIsFeedbackSheetVisible(false)} 
            />
        </Layout>
    );
};
