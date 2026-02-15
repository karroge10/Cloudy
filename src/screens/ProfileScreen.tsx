import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, TextInput } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { MASCOTS } from '../constants/Assets';
import { GOALS } from '../constants/Goals';
import { STRUGGLES } from '../constants/Struggles';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { ActivityGraph } from '../components/ActivityGraph';
import { SelectionPill } from '../components/SelectionPill';
import { BottomSheet } from '../components/BottomSheet';
import { Skeleton } from '../components/Skeleton';
import { useJournal } from '../context/JournalContext';
import { useProfile } from '../context/ProfileContext';
import { ProfileNudge } from '../components/ProfileNudge';
import { MascotCard } from '../components/MascotCard';
import { COMPANIONS } from '../constants/Companions';
import { TimePicker } from '../components/TimePicker';
import { Button } from '../components/Button';
import { haptics } from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../context/AlertContext';
import { MascotImage } from '../components/MascotImage';
import { security } from '../utils/security';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { resetUser } from '../lib/posthog';
import { useAnalytics } from '../hooks/useAnalytics';
import { AppFooter } from '../components/AppFooter';
import { FeedbackSheet } from '../components/FeedbackSheet';
import { ActivityIndicator } from 'react-native';


export const ProfileScreen = () => {
    const { showAlert } = useAlert();
    const { streak, rawStreakData } = useJournal();
    const { profile, isAnonymous, loading: profileLoading, updateProfile } = useProfile();
    const { trackEvent } = useAnalytics();

    
    // UI Local States (for sheets/modals)
    const [isNameSheetVisible, setIsNameSheetVisible] = useState(false);
    const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
    const [isStruggleSheetVisible, setIsStruggleSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [isMascotSheetVisible, setIsMascotSheetVisible] = useState(false);
    const [isAgeSheetVisible, setIsAgeSheetVisible] = useState(false);
    const [isGenderSheetVisible, setIsGenderSheetVisible] = useState(false);
    const [isCountrySheetVisible, setIsCountrySheetVisible] = useState(false);
    const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
    const [isFeedbackSheetVisible, setIsFeedbackSheetVisible] = useState(false);
    
    const [tempAge, setTempAge] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempCountry, setTempCountry] = useState('');
    const [reminderDate, setReminderDate] = useState(new Date());
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedStruggles, setSelectedStruggles] = useState<string[]>([]);
    const [tempGender, setTempGender] = useState('');
    const [tempMascotName, setTempMascotName] = useState('');
    const [bioSupported, setBioSupported] = useState(false);


    const navigation = useNavigation<any>();

    useEffect(() => {
        if (profile) {
            setTempName(profile.display_name || '');
            setTempAge(profile.age?.toString() || '');
            setTempCountry(profile.country || '');
            setSelectedGoals(profile.goals || []);
            setSelectedStruggles(profile.struggles || []);
            setTempGender(profile.gender || '');
            setTempMascotName(profile.mascot_name || COMPANIONS[0].name);
            
            if (profile.reminder_time) {
                const [hours, minutes] = profile.reminder_time.split(':');
                const d = new Date();
                d.setHours(parseInt(hours));
                d.setMinutes(parseInt(minutes));
                setReminderDate(d);
            }
        }
    }, [profile]);

    useEffect(() => {
        const checkBio = async () => {
            const supported = await security.isSupported();
            setBioSupported(supported);
        };
        checkBio();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('has_seen_first_entry');
            await AsyncStorage.removeItem('user_streak_cache');
            await AsyncStorage.removeItem('pending_merge_anonymous_id');
            await AsyncStorage.removeItem('security_lock_enabled');
            
            // Log out from Google if applicable
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Delete the profile (posts will cascade delete)
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Log out and clear local data
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



    const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    
    const currentMascot = COMPANIONS.find(c => c.name === profile?.mascot_name) || COMPANIONS[0];
    const reminderTime = profile?.reminder_time;
    const displayReminderTime = reminderTime || '20:00';
    const isHapticsEnabled = profile?.haptics_enabled ?? true;
    const displayName = profile?.display_name || '';

    return (
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Profile" />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
            >
                {/* Profile Nudge Banner */}
                <ProfileNudge 
                    isAnonymous={isAnonymous}
                    isComplete={!!displayName}
                    loading={profileLoading}
                    onPressCompleteProfile={() => setIsNameSheetVisible(true)}
                    className="mb-8"
                />

                {/* Streak & Mascot Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <View className="flex-1">
                         <TouchableOpacity onPress={() => { haptics.selection(); setIsNameSheetVisible(true); }} className="mb-1">
                              {profileLoading ? (
                                 <Skeleton width={120} height={24} style={{ marginBottom: 4 }} borderRadius={12} />
                              ) : (
                                 <Text className="text-xl font-q-bold text-muted">Hi, {displayName || 'Friend'}! 👋</Text>
                              )}
                         </TouchableOpacity>
                        
                        {profileLoading && streak === 0 ? (
                            <View className="mt-2">
                                <Skeleton width={130} height={50} borderRadius={16} style={{ marginBottom: 6 }} />
                                <Skeleton width={110} height={50} borderRadius={16} />
                            </View>
                        ) : (
                            <View>
                                <Text className="text-[44px] leading-[50px] font-q-bold text-text">{streak} Day</Text>
                                <Text className="text-[44px] leading-[50px] font-q-bold text-text">Streak!</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsMascotSheetVisible(true); }} className="active:scale-95 transition-transform">
                        <MascotImage 
                            source={currentMascot.asset} 
                            className="w-32 h-32" 
                            resizeMode="contain" 
                        />
                        <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background shadow-sm">
                            <Ionicons name="sync" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Activity Graph */}
                <ActivityGraph entries={rawStreakData} />

                {/* Personal Settings Section */}
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
                                    // Turn on: use current display time or default
                                    updateProfile({ reminder_time: displayReminderTime });
                                } else {
                                    // Turn off: set to null
                                    updateProfile({ reminder_time: null });
                                }
                            }}
                            value={!!reminderTime}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Age, Gender, Country, Goals, Struggles row */}
                    <View className="py-2">
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsAgeSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Age</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{profile?.age || 'Set Age'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsGenderSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Gender</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{profile?.gender || 'Set Gender'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsCountrySheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Location</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{profile?.country || 'Set Country'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsGoalSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Goals</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base" numberOfLines={1}>
                                    {(profile?.goals?.length ?? 0) === 0 ? 'Set Goals' : 
                                     profile?.goals?.length === 1 ? profile.goals[0] : 
                                     `${profile?.goals?.[0]} +${(profile?.goals?.length ?? 0) - 1} more`}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsStruggleSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Struggles</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base" numberOfLines={1}>
                                    {(profile?.struggles?.length ?? 0) === 0 ? 'Set Struggles' : 
                                     profile?.struggles?.length === 1 ? profile.struggles[0] : 
                                     `${profile?.struggles?.[0]} +${(profile?.struggles?.length ?? 0) - 1} more`}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Settings Section */}
                <View className="mb-8 bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl"
                    style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
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

             <BottomSheet visible={isNameSheetVisible} onClose={() => setIsNameSheetVisible(false)}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">What should Cloudy call you?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                        placeholder="Your Name"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempName}
                        value={tempName}
                        autoCapitalize="words"
                        autoFocus={true}
                    />
                    <Button 
                        label="Save Name"
                        onPress={() => {
                            updateProfile({ display_name: tempName });
                            setIsNameSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsNameSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isAgeSheetVisible} onClose={() => setIsAgeSheetVisible(false)}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.CAKE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">How old are you?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                        placeholder="Age"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempAge}
                        value={tempAge}
                        keyboardType="numeric"
                        autoFocus={true}
                    />
                    <Button 
                        label="Save Age"
                        onPress={() => {
                            const val = parseInt(tempAge);
                            if (!isNaN(val)) {
                                updateProfile({ age: val });
                                haptics.success();
                            }
                            setIsAgeSheetVisible(false);
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsAgeSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isGenderSheetVisible} onClose={() => setIsGenderSheetVisible(false)}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.MIRROR} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">How do you identify?</Text>
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {GENDERS.map((g) => (
                            <SelectionPill
                                key={g}
                                label={g}
                                selected={tempGender === g}
                                onPress={() => {
                                    setTempGender(g);
                                    haptics.selection();
                                }}
                            />
                        ))}
                    </View>
                    <Button 
                        label="Save Gender"
                        onPress={() => {
                            updateProfile({ gender: tempGender });
                            setIsGenderSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => setIsGenderSheetVisible(false)} className="mt-4 py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isCountrySheetVisible} onClose={() => setIsCountrySheetVisible(false)}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.GLOBE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">Where are you from?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                        placeholder="Country"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempCountry}
                        value={tempCountry}
                        autoFocus={true}
                    />
                    <Button 
                        label="Save Location"
                        onPress={() => {
                            updateProfile({ country: tempCountry });
                            setIsCountrySheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsCountrySheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isGoalSheetVisible} 
                onClose={() => setIsGoalSheetVisible(false)}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.ZEN} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                        What are your main goals for using Cloudy?
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {GOALS.map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={goal}
                                selected={selectedGoals.includes(goal)}
                                onPress={() => {
                                    haptics.selection();
                                    if (selectedGoals.includes(goal)) {
                                        if (selectedGoals.length > 1) {
                                            setSelectedGoals(selectedGoals.filter(g => g !== goal));
                                        }
                                    } else {
                                        setSelectedGoals([...selectedGoals, goal]);
                                    }
                                }}
                            />
                        ))}
                    </View>
                    <Button 
                        label="Save Goals"
                        onPress={() => {
                            updateProfile({ goals: selectedGoals });
                            setIsGoalSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsGoalSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isStruggleSheetVisible} 
                onClose={() => setIsStruggleSheetVisible(false)}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.SAD} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                        What's been weighing on you lately?
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {STRUGGLES.map((struggle) => (
                            <SelectionPill
                                key={struggle}
                                label={struggle}
                                selected={selectedStruggles.includes(struggle)}
                                onPress={() => {
                                    haptics.selection();
                                    if (selectedStruggles.includes(struggle)) {
                                        setSelectedStruggles(selectedStruggles.filter(s => s !== struggle));
                                    } else {
                                        setSelectedStruggles([...selectedStruggles, struggle]);
                                    }
                                }}
                            />
                        ))}
                    </View>
                    <Button 
                        label="Save Struggles"
                        onPress={() => {
                            updateProfile({ struggles: selectedStruggles });
                            setIsStruggleSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsStruggleSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

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

             <BottomSheet visible={isMascotSheetVisible} onClose={() => setIsMascotSheetVisible(false)}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.HUG} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">Choose your companion</Text>
                    <View className="flex-row flex-wrap justify-between w-full mb-8">
                        {COMPANIONS.map((companion) => {
                            const isLocked = streak < companion.requiredStreak;
                            return (
                                <MascotCard 
                                    key={companion.id}
                                    name={companion.name}
                                    asset={companion.asset}
                                    isSelected={tempMascotName === companion.name}
                                    isLocked={isLocked}
                                    onPress={() => {
                                        if (!isLocked) {
                                            setTempMascotName(companion.name);
                                            haptics.selection();
                                        }
                                    }}
                                />
                            );
                        })}
                    </View>
                    <Button 
                        label="Save Companion"
                        onPress={() => {
                            updateProfile({ mascot_name: tempMascotName });
                            setIsMascotSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity onPress={() => { haptics.selection(); setIsMascotSheetVisible(false); }} className="mt-4 py-2 active:scale-95 transition-transform">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <BottomSheet visible={isDeleteSheetVisible} onClose={() => setIsDeleteSheetVisible(false)}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.SAD} className="w-32 h-32 mb-4" resizeMode="contain" />
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
