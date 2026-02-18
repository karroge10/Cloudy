import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, TextInput, Modal, ActivityIndicator, InteractionManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useProfile } from '../context/ProfileContext';
import { haptics } from '../utils/haptics';
import { security } from '../utils/security';
import { useAlert } from '../context/AlertContext';
import { AppFooter } from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';
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
    const { profile, updateProfile, logout, isAnonymous, userId } = useProfile();
    const { showAlert } = useAlert();
    const { trackEvent } = useAnalytics();
    const { isDarkMode, toggleTheme, isThemeUnlocked } = useTheme();

    const [isFeedbackSheetVisible, setIsFeedbackSheetVisible] = useState(false);
    const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
    const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [isPasswordSheetVisible, setIsPasswordSheetVisible] = useState(false);
    const [hasPasswordLogin, setHasPasswordLogin] = useState(true); 
    // Default true (hidden) to prevent flash for most users. 
    // We will update this in useEffect.
    
    // NOTE: isAnonymous is available from useProfile() hook, which is called at the top of this component.
    // const { profile, updateProfile, isAnonymous } = useProfile(); <-- This line exists in the file (implied).
    
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [bioSupported, setBioSupported] = useState(false);

    const isHapticsEnabled = profile?.haptics_enabled ?? true;
    const reminderTime = profile?.reminder_time;
    const displayReminderTime = reminderTime || '20:00';
    
    useEffect(() => {
        if (isAnonymous) {
            setHasPasswordLogin(true); 
        } else {
             const checkAuthStatus = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const providers = user?.app_metadata?.providers || [];
                const hasEmailProvider = providers.includes('email');
                setHasPasswordLogin(hasEmailProvider);

                const supported = await security.isSupported();
                setBioSupported(supported);
             };
             
             const task = InteractionManager.runAfterInteractions(() => {
                 checkAuthStatus();
             });
             return () => task.cancel();
        }
    }, [isAnonymous]);

    useEffect(() => {
        if (profile?.reminder_time) {
            const [hours, minutes] = profile.reminder_time.split(':');
            const d = new Date();
            d.setHours(parseInt(hours));
            d.setMinutes(parseInt(minutes));
            setReminderDate(d);
        }
    }, [profile]);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        // Short delay to allow UI to render modal
        await new Promise(resolve => setTimeout(resolve, 50));
        
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
            setIsLoggingOut(false);
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

    const handleAddPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showAlert('Wait', 'Password must be at least 6 characters.', [{ text: 'Okay' }], 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setHasPasswordLogin(true);
            setIsPasswordSheetVisible(false);
            setNewPassword('');
            haptics.success();
            showAlert('Success', 'Password added! You can now log in with either Google or email.', [{ text: 'Great' }], 'success');
            trackEvent('user_added_password');

        } catch (error: any) {
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
        } finally {
            setPasswordLoading(false);
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

                    {/* Cloudy Night Theme (Dark Mode) */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1 pr-4">
                            <TouchableOpacity 
                                onPress={() => { haptics.selection(); toggleTheme(); }}
                                className="active:opacity-70"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-lg font-q-bold text-text">Cloudy Night Theme</Text>
                                </View>
                                <Text className="text-muted font-q-medium text-xs mt-0.5">
                                    Switch to a calming dark palette
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: '#FF9E7D' }}
                            thumbColor="#FFFFFF"
                            onValueChange={() => {
                                haptics.selection();
                                toggleTheme();
                            }}
                            value={isDarkMode}
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

                    <View className="h-[1px] bg-inactive opacity-10" />

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Add Password (for Google-only users without password) */}
                    {/* We reserve space or render if we know they lack a password */}
                    {/* Logic: If user has 'google' provider AND DOES NOT have 'email' (password) provider */}
                    {/* OR if they are anonymous (handled by profile context mostly, but here we check providers) */}
                    
                    {(() => {
                        const showAddPassword = !hasPasswordLogin; 
                        
                        // To prevent layout shift, if we are loading, we can keep the view mounted or show nothing if we want it to "pop in" only if needed.
                        // But user asked to prevent pop-in. So we should ideally default to hidden?
                        // Actually, if we default to true (hasPasswordLogin=true), it starts hidden.
                        // If we discover they DON'T have a password, it pops in.
                        // To fix this, we need to know SOONER.
                        // But we can't block render.
                        // Best UX: Show it if we suspect they might need it (e.g. isAnonymous is true) or just accept the pop-in but make it smooth?
                        // The user said: "It should be preloaded like all other things on screen."
                        // Since checking providers is async, we can't "preload" it before render without a loading state for the whole screen.
                        // COMPROMISE: We will show a skeleton or just render it if specific criteria met.
                        // User Request Clarification: "It is not a feature for accounts that already have email and password provider."
                        
                        if (hasPasswordLogin) return null;

                        return (
                            <>
                                <TouchableOpacity
                                    onPress={() => { haptics.selection(); setIsPasswordSheetVisible(true); }}
                                    className="flex-row items-center justify-between py-4"
                                >
                                    <View>
                                        <Text className="text-lg font-q-bold text-text">Add Password Login</Text>
                                        <Text className="text-muted font-q-medium text-xs">Enable logging in with email & password</Text>
                                    </View>
                                    <Ionicons name="key-outline" size={22} color="#FF9E7D" />
                                </TouchableOpacity>
                                <View className="h-[1px] bg-inactive opacity-10" />
                            </>
                        );
                    })()}

                    {/* Secure Account (Anonymous users) */}
                    {isAnonymous && (
                        <>
                            <TouchableOpacity
                                onPress={() => { haptics.selection(); navigation.navigate('SecureAccount'); }}
                                className="flex-row items-center justify-between py-4"
                            >
                                <View>
                                    <Text className="text-lg font-q-bold text-text">Secure Your Journey</Text>
                                    <Text className="text-muted font-q-medium text-xs">Create an account to save your progress</Text>
                                </View>
                                <Ionicons name="sparkles-outline" size={22} color="#FF9E7D" />
                            </TouchableOpacity>
                            <View className="h-[1px] bg-inactive opacity-10" />
                        </>
                    )}

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
                <TouchableOpacity onPress={() => { haptics.heavy(); setIsLogoutSheetVisible(true); }} className="mt-4 items-center py-4 active:scale-95 transition-transform">
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

            <BottomSheet visible={isPasswordSheetVisible} onClose={() => setIsPasswordSheetVisible(false)}>
                <View className="items-center w-full px-4">
                    <MascotImage source={MASCOTS.SAVE} className="w-32 h-32 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">Create Password</Text>
                    <Text className="text-base font-q-medium text-muted text-center mb-6">
                        This will allow you to log in to your account using your email and this password.
                    </Text>

                    <View className="w-full mb-6">
                        <TextInput
                            className="bg-card px-6 py-4 rounded-3xl font-q-bold text-lg text-text border-2 border-inactive/10 w-full"
                            placeholder="Set a secure password"
                            placeholderTextColor="#CBD5E1"
                            onChangeText={setNewPassword}
                            value={newPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />
                    </View>

                    <Button
                        label="Set Password"
                        onPress={handleAddPassword}
                        loading={passwordLoading}
                    />

                    <TouchableOpacity onPress={() => { haptics.selection(); setIsPasswordSheetVisible(false); }} className="mt-4 py-2">
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
                        label="Wait, I'll stay!"
                        onPress={() => { 
                            haptics.selection(); 
                            setIsDeleteSheetVisible(false); 
                        }}
                        haptic="selection"
                    />

                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.heavy(); 
                            handleDeleteAccount(); 
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                        <Text className="text-red-400 font-q-bold text-base">Yes, Delete Everything</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <BottomSheet visible={isLogoutSheetVisible} onClose={() => setIsLogoutSheetVisible(false)}>
                <View className="items-center w-full">
                    {isAnonymous ? (
                        <>
                            <MascotImage source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
                            <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">Wait! You'll lose everything!</Text>
                            <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                                Your progress will not be saved and you'll lose access unless you create an account first.
                            </Text>

                            <Button
                                label="Secure My Account"
                                onPress={() => {
                                    setIsLogoutSheetVisible(false);
                                    navigation.navigate('SecureAccount', { initialMode: 'signup' });
                                }}
                                haptic="selection"
                            />
                            
                            <TouchableOpacity 
                                onPress={() => { 
                                    haptics.heavy(); 
                                    setIsLogoutSheetVisible(false);
                                    handleLogout(); 
                                }} 
                                className="mt-4 py-2 active:scale-95 transition-transform"
                            >
                                <Text className="text-red-400 font-q-bold text-base">Log Out & Lose Data</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <MascotImage source={MASCOTS.HELLO} className="w-32 h-32 mb-4" resizeMode="contain" />
                            <Text className="text-2xl font-q-bold text-text text-center mb-4 px-6">Ready to sign out?</Text>
                            <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4 leading-6">
                                We'll save your progress safely until you return.
                            </Text>

                            <Button
                                variant="danger"
                                label="Log Out"
                                onPress={() => { 
                                    setIsLogoutSheetVisible(false);
                                    handleLogout(); 
                                }}
                                haptic="heavy"
                            />

                            <TouchableOpacity onPress={() => { haptics.selection(); setIsLogoutSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                                <Text className="text-muted font-q-bold text-base">Wait, I'll stay!</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </BottomSheet>

            <FeedbackSheet
                visible={isFeedbackSheetVisible}
                onClose={() => setIsFeedbackSheetVisible(false)}
            />

            <Modal visible={isLoggingOut} transparent={true} animationType="fade">
                <View className={`flex-1 justify-center items-center bg-black/40 ${isDarkMode ? 'dark' : ''}`}>
                    <View className="bg-card p-10 rounded-[40px] items-center shadow-2xl mx-10">
                        <MascotImage 
                            source={MASCOTS.HELLO} 
                            className="w-40 h-40 mb-2" 
                            resizeMode="contain" 
                        />
                        <Text className="text-2xl font-q-bold text-text text-center">See you soon!</Text>
                        <Text className="text-base font-q-medium text-muted mt-2 text-center px-4">Logging out...</Text>
                        <View className="mt-6">
                            <ActivityIndicator size="small" color="#FF9E7D" />
                        </View>
                    </View>
                </View>
            </Modal>
        </Layout>
    );
};
