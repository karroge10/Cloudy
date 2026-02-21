import React, { useState, useEffect, useRef } from 'react';
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
import { useAnalytics } from '../hooks/useAnalytics';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { TimePicker } from '../components/TimePicker';
import { LogoutSheet } from '../components/LogoutSheet';
import { Divider } from '../components/Divider';
import { useAccent, ACCENT_COLORS } from '../context/AccentContext';
import { useAppLogout } from '../hooks/useAppLogout';
import { Linking } from 'react-native';
import { LINKS } from '../constants/Links';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { profile, updateProfile, isAnonymous, userId } = useProfile();
    const { showAlert } = useAlert();
    const { trackEvent } = useAnalytics();
    const { isDarkMode, toggleTheme } = useTheme();
    const { currentAccent, setAccent } = useAccent();

    const [isFeedbackSheetVisible, setIsFeedbackSheetVisible] = useState(false);
    const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
    const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [isAccentSheetVisible, setIsAccentSheetVisible] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [isPasswordSheetVisible, setIsPasswordSheetVisible] = useState(false);
    const [hasPasswordLogin, setHasPasswordLogin] = useState(true); 
    
    const initialAccentId = useRef(currentAccent.id);
    const [prevAccentVisible, setPrevAccentVisible] = useState(false);

    useEffect(() => {
        if (isAccentSheetVisible && !prevAccentVisible) {
            initialAccentId.current = currentAccent.id;
        }
        setPrevAccentVisible(isAccentSheetVisible);
    }, [isAccentSheetVisible]);

    const revertAccent = () => {
        setAccent(initialAccentId.current as any);
        setIsAccentSheetVisible(false);
    };
    
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [bioSupported, setBioSupported] = useState(false);

    const [localHaptics, setLocalHaptics] = useState(profile?.haptics_enabled ?? true);
    const [localReminder, setLocalReminder] = useState(!!profile?.reminder_time);

    // Logout Hook for Delete Account
    const { isLoggingOut: isHookLoggingOut, handleLogout: hookHandleLogout } = useAppLogout();

    useEffect(() => {
        setLocalHaptics(profile?.haptics_enabled ?? true);
        setLocalReminder(!!profile?.reminder_time);
    }, [profile?.haptics_enabled, profile?.reminder_time]);

    const reminderTime = profile?.reminder_time;
    const displayReminderTime = reminderTime || '20:00';
    
    useEffect(() => {
        const checkStatus = async () => {
            const supported = await security.isSupported();
            setBioSupported(supported);

            if (isAnonymous) {
                setHasPasswordLogin(true); 
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                const providers = user?.app_metadata?.providers || [];
                const hasEmailProvider = providers.includes('email');
                setHasPasswordLogin(hasEmailProvider);
            }
        };

        const task = InteractionManager.runAfterInteractions(() => {
            checkStatus();
        });
        
        return () => task.cancel();
    }, [isAnonymous]);

    const resetReminderDate = () => {
        if (profile?.reminder_time) {
            const [hours, minutes] = profile.reminder_time.split(':');
            const d = new Date();
            d.setHours(parseInt(hours));
            d.setMinutes(parseInt(minutes));
            setReminderDate(d);
        } else {
            const d = new Date();
            d.setHours(20, 0, 0, 0); // Default 8 PM
            setReminderDate(d);
        }
    };

    useEffect(() => {
        resetReminderDate();
    }, [profile?.reminder_time]);

    const handleDeleteAccount = async () => {
        try {
            if (!userId) return;

            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) throw profileError;

            trackEvent('user_deleted_account');
            await hookHandleLogout();

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
                                <Text className="font-q-bold text-base mt-1" style={{ color: currentAccent.hex }}>{displayReminderTime}</Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: currentAccent.hex }}
                            thumbColor="#FFFFFF"
                            onValueChange={(val) => {
                                setLocalReminder(val);
                                haptics.selection();
                                if (val) {
                                    updateProfile({ reminder_time: displayReminderTime });
                                } else {
                                    updateProfile({ reminder_time: null });
                                }
                            }}
                            value={localReminder}
                        />
                    </View>

                    <Divider />

                    {/* Haptic Feedback */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1">
                            <Text className="text-lg font-q-bold text-text">Haptic Feedback</Text>
                            <Text className="text-muted font-q-medium text-xs">Soft vibrations for interactions</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: currentAccent.hex }}
                            thumbColor="#FFFFFF"
                            onValueChange={(val) => {
                                setLocalHaptics(val);
                                haptics.selection();
                                updateProfile({ haptics_enabled: val });
                            }}
                            value={localHaptics}
                        />
                    </View>

                    <Divider />

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
                            trackColor={{ false: '#E0E0E0', true: currentAccent.hex }}
                            thumbColor="#FFFFFF"
                            onValueChange={() => {
                                haptics.selection();
                                toggleTheme();
                            }}
                            value={isDarkMode}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive/10" />

                    {/* Accent Color */}
                    <TouchableOpacity
                        onPress={() => {
                            if (profile?.max_streak && profile.max_streak >= 60) {
                                haptics.selection();
                                setIsAccentSheetVisible(true);
                            } else {
                                haptics.error();
                                showAlert('Feature Locked', 'Reach a 60-day streak to unlock accent colors!', [{ text: 'Okay' }], 'info');
                            }
                        }}
                        className={`flex-row items-center justify-between py-4 ${profile?.max_streak && profile.max_streak >= 60 ? '' : 'opacity-60'}`}
                    >
                        <View>
                            <Text className="text-lg font-q-bold text-text">Accent Color</Text>
                            <Text className="text-muted font-q-medium text-xs">Personalize your app's primary color</Text>
                        </View>
                        {profile?.max_streak && profile.max_streak >= 60 ? (
                            <View className="w-6 h-6 rounded-full border-2 border-white/20" style={{ backgroundColor: currentAccent.hex }} />
                        ) : (
                            <Ionicons name="lock-closed-outline" size={22} color="#94A3B8" />
                        )}
                    </TouchableOpacity>

                    <Divider />

                    {/* Biometric Lock */}
                    <View className="flex-row items-center justify-between py-4">
                        <View className="flex-1">
                            <Text className="text-lg font-q-bold text-text">Lock my Cloud</Text>
                            <Text className="text-muted font-q-medium text-xs">Biometric protection for your diary</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: currentAccent.hex }}
                            thumbColor="#FFFFFF"
                            onValueChange={async (val) => {
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

                                const prompt = val ? 'Authenticate to Enable Lock' : 'Authenticate to Disable Lock';
                                const authenticated = await security.authenticate(prompt);

                                if (authenticated) {
                                    updateProfile({ security_lock_enabled: val });
                                    haptics.success();
                                }
                            }}
                            value={profile?.security_lock_enabled ?? false}
                        />
                    </View>

                    <Divider />

                    <Divider />

                    {/* Official Website */}
                    <TouchableOpacity
                        onPress={() => { haptics.selection(); Linking.openURL(LINKS.WEBSITE); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <View>
                            <Text className="text-lg font-q-bold text-text">Our Home</Text>
                            <Text className="text-muted font-q-medium text-xs">Visit cloudyapp.vercel.app</Text>
                        </View>
                        <Ionicons name="globe-outline" size={22} color={currentAccent.hex} />
                    </TouchableOpacity>

                    <Divider />

                    {/* Privacy Policy */}
                    <TouchableOpacity
                        onPress={() => { haptics.selection(); navigation.navigate('Legal', { type: 'privacy' }); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <Text className="text-lg font-q-bold text-text">Privacy & Security</Text>
                        <Ionicons name="lock-closed-outline" size={22} color={currentAccent.hex} />
                    </TouchableOpacity>

                    <Divider />

                    {/* Feedback */}
                    <TouchableOpacity
                        onPress={() => { haptics.selection(); setIsFeedbackSheetVisible(true); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <View>
                            <Text className="text-lg font-q-bold text-text">Cloudy Whisper</Text>
                            <Text className="text-muted font-q-medium text-xs">Send feedback or report bugs</Text>
                        </View>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={currentAccent.hex} />
                    </TouchableOpacity>

                    <Divider />

                    {/* Add Password (for Google-only users without password) */}
                    
                    {(() => {
                        // If hasPasswordLogin is true, we hide this section
                        if (hasPasswordLogin) return null;

                        return (
                            <>
                                <View className="h-[1px] bg-inactive/10" />
                                <TouchableOpacity
                                    onPress={() => { haptics.selection(); setIsPasswordSheetVisible(true); }}
                                    className="flex-row items-center justify-between py-4"
                                >
                                    <View>
                                        <Text className="text-lg font-q-bold text-text">Add Password Login</Text>
                                        <Text className="text-muted font-q-medium text-xs">Enable logging in with email & password</Text>
                                    </View>
                                    <Ionicons name="key-outline" size={22} color={currentAccent.hex} />
                                </TouchableOpacity>
                                <Divider />
                            </>
                        );
                    })()}

                    {/* Secure Account (Anonymous users) */}
                    {isAnonymous && (
                        <>
                            <View className="h-[1px] bg-inactive/10" />
                            <TouchableOpacity
                                onPress={() => { haptics.selection(); navigation.navigate('SecureAccount'); }}
                                className="flex-row items-center justify-between py-4"
                            >
                                <View>
                                    <Text className="text-lg font-q-bold text-text">Secure Your Journey</Text>
                                    <Text className="text-muted font-q-medium text-xs">Create an account to save your progress</Text>
                                </View>
                                <Ionicons name="sparkles-outline" size={22} color={currentAccent.hex} />
                            </TouchableOpacity>
                            <Divider />
                        </>
                    )}

                    {/* Delete Account */}
                    <TouchableOpacity
                        onPress={() => { haptics.selection(); setIsDeleteSheetVisible(true); }}
                        className="flex-row items-center justify-between py-4"
                    >
                        <Text className="text-lg font-q-bold text-text">Delete Account & Data</Text>
                        <Ionicons name="trash-outline" size={22} color={currentAccent.hex} />
                    </TouchableOpacity>
                </View>

                {/* Log Out */}
                <TouchableOpacity onPress={() => { haptics.heavy(); setIsLogoutSheetVisible(true); }} className="mt-4 items-center py-4 active:scale-95 transition-transform">
                    <Text className="text-lg font-q-bold text-red-400/60">Log Out</Text>
                </TouchableOpacity>

                <AppFooter />
            </ScrollView>

            <BottomSheet visible={isTimeSheetVisible} onClose={() => { setIsTimeSheetVisible(false); resetReminderDate(); }}>
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

                    <TouchableOpacity onPress={() => { haptics.selection(); setIsTimeSheetVisible(false); resetReminderDate(); }} className="mt-4 py-2 active:scale-95 transition-transform">
                        <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <BottomSheet visible={isAccentSheetVisible} onClose={revertAccent}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.HUG} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">Choose your vibe</Text>

                    <View className="flex-row flex-wrap justify-between w-full mb-4">
                        {Object.values(ACCENT_COLORS).map((color) => {
                            const isSelected = currentAccent.id === color.id;
                            
                            return (
                                <TouchableOpacity
                                    key={color.id}
                                    onPress={() => {
                                        haptics.selection();
                                        setAccent(color.id);
                                    }}
                                    delayPressIn={0}
                                    activeOpacity={0.7}
                                    className="w-[30%] aspect-square mb-4 rounded-[32px] items-center justify-center p-2 bg-card shadow-sm active:scale-95"
                                    style={{
                                        borderColor: isSelected ? color.hex : 'transparent',
                                        borderWidth: 2,
                                        elevation: isSelected ? 2 : 0
                                    }}
                                >
                                    {isSelected && (
                                        <View 
                                            style={{ 
                                                position: 'absolute', 
                                                top: 0, left: 0, right: 0, bottom: 0, 
                                                backgroundColor: `${color.hex}15`,
                                                borderRadius: 30
                                            }} 
                                        />
                                    )}
                                    <View className="items-center justify-center">
                                         <View 
                                            className="w-12 h-12 rounded-full shadow-sm shadow-black/10" 
                                            style={{ backgroundColor: color.hex }} 
                                        />
                                        {isSelected && (
                                            <View className="absolute bg-white rounded-full p-0.5 shadow-sm border border-inactive/20 -right-1 -top-1">
                                                <Ionicons name="checkmark-circle" size={16} color={color.hex} />
                                            </View>
                                        )}
                                    </View>
                                    <Text 
                                        className={`font-q-bold text-[10px] mt-2 uppercase ${isSelected ? '' : 'text-muted'}`}
                                        style={isSelected ? { color: color.hex } : undefined}
                                        numberOfLines={1}
                                    >
                                        {color.label.replace('Cloudy ', '').replace('Sunset ', '')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View className="w-full mt-4">
                        <Button 
                            label="Looks Great" 
                            onPress={() => {
                                haptics.success();
                                setIsAccentSheetVisible(false);
                            }}
                        />
                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); revertAccent(); }}
                            className="mt-4 py-2 items-center active:scale-95 transition-transform"
                        >
                            <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                        </TouchableOpacity>
                    </View>
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

            <LogoutSheet
                visible={isLogoutSheetVisible}
                onClose={() => setIsLogoutSheetVisible(false)}
                isAnonymous={!!isAnonymous}
            />

            <FeedbackSheet
                visible={isFeedbackSheetVisible}
                onClose={() => setIsFeedbackSheetVisible(false)}
            />

            <Modal visible={isHookLoggingOut} transparent={true} animationType="fade">
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
                            <ActivityIndicator size="small" color={currentAccent.hex} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Layout>
    );
};
