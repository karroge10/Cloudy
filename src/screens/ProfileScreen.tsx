import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { useJournal } from '../context/JournalContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../utils/haptics';
import { TopNav } from '../components/TopNav';
import { ProfileNudge } from '../components/ProfileNudge';
import { Button } from '../components/Button';
import { ActivityGraph } from '../components/ActivityGraph';
import { AppFooter } from '../components/AppFooter';
import { BottomSheet } from '../components/BottomSheet';
import { MascotCard } from '../components/MascotCard';
import { SelectionPill } from '../components/SelectionPill';
import { Skeleton } from '../components/Skeleton';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { Insights } from '../components/Insights';
import { Flashback } from '../components/Flashback';
import { useAnalytics } from '../hooks/useAnalytics';
import { Layout } from '../components/Layout';
import { LogoutSheet } from '../components/LogoutSheet';
import { Divider } from '../components/Divider';
import { useTranslation } from 'react-i18next';

import { COMPANIONS } from '../constants/Companions';
import { useTheme } from '../context/ThemeContext';
import { TimePicker } from '../components/TimePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GOALS } from '../constants/Goals';
import { STRUGGLES } from '../constants/Struggles';

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

import { useAccent } from '../context/AccentContext';

export const ProfileScreen = () => {
    const { streak, rawStreakData, refreshEntries } = useJournal();
    const { profile, loading: profileLoading, updateProfile, isAnonymous, userId, logout } = useProfile();
    const { isDarkMode } = useTheme();
    const { trackEvent } = useAnalytics();
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    const renderGenderLabel = (g: string) => {
        switch (g) {
            case 'Female': return t('profile.genders.female');
            case 'Male': return t('profile.genders.male');
            case 'Non-binary': return t('profile.genders.nonBinary');
            case 'Prefer not to say': return t('profile.genders.noSay');
            default: return g;
        }
    };

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
    let navigation: any;
    try {
        navigation = useNavigation<any>();
    } catch (e) {
        console.error('[ProfileScreen] Navigation context missing!');
    }
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 80 + insets.bottom;
    
    // Local state for sheets
    const [isNameSheetVisible, setIsNameSheetVisible] = useState(false);
    const [isMascotSheetVisible, setIsMascotSheetVisible] = useState(false);
    const [isAgeSheetVisible, setIsAgeSheetVisible] = useState(false);
    const [isGenderSheetVisible, setIsGenderSheetVisible] = useState(false);
    const [isCountrySheetVisible, setIsCountrySheetVisible] = useState(false);
    const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
    const [isStruggleSheetVisible, setIsStruggleSheetVisible] = useState(false);
    const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

    // Temp states for editing
    const [tempName, setTempName] = useState('');
    const [tempAge, setTempAge] = useState('');
    const [tempGender, setTempGender] = useState('');
    const [tempCountry, setTempCountry] = useState('');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedStruggles, setSelectedStruggles] = useState<string[]>([]);
    const [tempMascotName, setTempMascotName] = useState('');
    
    // Session state to prevent loops
    const hasDismissedOnboarding = React.useRef(false);

    // Onboarding flow states
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0); // 0: Name, 1: Reminder
    const [tempReminderTime, setTempReminderTime] = useState(new Date(new Date().setHours(20, 0, 0, 0)));
    const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

    const displayName = profile?.display_name;
    const currentMascotName = profile?.mascot_name || 'cloudy';
    // Handle 'cloudy' manually since it's no longer in COMPANIONS list
    const currentMascot = currentMascotName.toLowerCase() === 'cloudy' 
        ? { asset: MASCOTS.WRITE, name: 'Cloudy' } 
        : (COMPANIONS.find(c => c.name === currentMascotName) || COMPANIONS[0]);

    useEffect(() => {
        console.log('[ProfileScreen] Profile effect triggered:', { 
            hasProfile: !!profile, 
            loading: profileLoading, 
            displayName: profile?.display_name,
            onboardingCompleted: profile?.onboarding_completed
        });

        if (profile) {
            setTempName(profile.display_name || '');
            setTempAge(profile.age ? profile.age.toString() : '');
            setTempGender(profile.gender || '');
            setTempCountry(profile.country || '');
            setSelectedGoals(profile.goals || []);
            setSelectedStruggles(profile.struggles || []);
            setTempMascotName(profile.mascot_name || 'Cloudy');

            // Auto-trigger onboarding based on completion flag.
            // If user has a name but no completion flag -> jump to step 1 (Reminder).
            // If they have no name -> step 0.
            console.log('[ProfileScreen] Check onboarding:', { 
                completed: profile.onboarding_completed, 
                name: profile.display_name,
                isAnon: isAnonymous 
            });

            const checkOnboardingStatus = async () => {
                const storageKey = `profile_setup_seen_v2_${profile.id}`;
                const hasSeen = await AsyncStorage.getItem(storageKey);
                
                if (hasSeen === 'true') {
                     hasDismissedOnboarding.current = true;
                     return;
                }

                // Verify if profile setup is truly complete (has name) or if the flag is false
                const isProfileIncomplete = !profile.onboarding_completed || !profile.display_name;

                if (isProfileIncomplete && !hasDismissedOnboarding.current && !showOnboarding) {
                     if (profile.display_name) {
                         setOnboardingStep(1);
                         setShowOnboarding(true);
                     } else {
                         setOnboardingStep(0);
                         setShowOnboarding(true);
                     }
                }
            };
            checkOnboardingStatus();
        } else if (!profileLoading && isAnonymous) {
            // Fresh anonymous user has no profile record yet -> Start onboarding
            console.log('[ProfileScreen] No profile found (Anonymous), starting onboarding');
            setOnboardingStep(0);
            setShowOnboarding(true);
        }
    }, [profile, profileLoading, isAnonymous]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        haptics.light();
        await refreshEntries();
        setIsRefreshing(false);
    };

    const currentRank = [...COMPANIONS].reverse().find(c => (profile?.max_streak || 0) >= c.requiredStreak)?.trait || 'Beginner';
    
    const getRankTranslation = (rank: string) => {
        switch (rank) {
            case 'Beginner': return t('ranks.beginner');
            case 'Expert': return t('ranks.expert');
            case 'Master': return t('ranks.master');
            case 'Dedicated': return t('ranks.dedicated');
            case 'Legend': return t('ranks.legend');
            case 'HERO': return t('ranks.hero');
            default: return rank;
        }
    };

    return (
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav 
                    title={t('profile.title')} 
                    rightElement={
                        <TouchableOpacity onPress={() => { 
                            haptics.selection(); 
                            requestAnimationFrame(() => {
                                navigation.navigate('Settings'); 
                            });
                        }}>
                             <Ionicons name="settings-outline" size={24} color={isDarkMode ? "#E5E7EB" : "#333333"} />
                        </TouchableOpacity>
                    }
                />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: TAB_BAR_HEIGHT + 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={currentAccent.hex}
                        colors={[currentAccent.hex]}
                    />
                }
            >
                <ProfileNudge 
                    isAnonymous={isAnonymous}
                    loading={profileLoading}
                    className="mb-8"
                />

                <View className="flex-row justify-between items-center mb-8">
                    <View className="flex-1">
                         <TouchableOpacity onPress={() => { haptics.selection(); setIsNameSheetVisible(true); }} className="mb-1">
                              {profileLoading ? (
                                 <Skeleton width={120} height={24} style={{ marginBottom: 4 }} borderRadius={12} />
                              ) : (
                                 <View className="flex-row items-center flex-wrap">
                                    <Text className="text-xl font-q-bold text-muted mr-1">{t('profile.hi', { name: displayName || t('profile.friend') })}</Text>
                                    
                                    {currentRank === 'HERO' && (
                                        <Ionicons name="checkmark-circle" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                                    )}
                                    
                                    {currentRank === 'HERO' ? (
                                            <View className={`${isDarkMode ? 'bg-[#FFD700]/20' : 'bg-black'} px-3 py-1 rounded-full border border-[#FFD700] flex-row items-center shadow-sm`}>
                                                <Ionicons name="flash" size={10} color="#FFD700" />
                                                <Text className="text-[#FFD700] font-q-bold text-[10px] ml-1.5 uppercase tracking-widest">{t('common.hero')}</Text>
                                            </View>
                                    ) : (
                                        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${currentAccent.hex}33` }}>
                                            <Text className="font-q-bold text-[10px] uppercase tracking-wider" style={{ color: currentAccent.hex }}>{getRankTranslation(currentRank)}</Text>
                                        </View>
                                    )}
                                 </View>
                              )}
                         </TouchableOpacity>
                        
                        {profileLoading && streak === 0 ? (
                            <View className="mt-2">
                                <Skeleton width={130} height={50} borderRadius={16} style={{ marginBottom: 6 }} />
                                <Skeleton width={110} height={50} borderRadius={16} />
                            </View>
                        ) : (
                            <View>
                                <Text className="text-[44px] leading-[50px] font-q-bold text-text">{t('profile.streakDay', { count: streak })}</Text>
                                <Text className="text-[44px] leading-[50px] font-q-bold text-text">{t('profile.streakTitle')}</Text>
                             </View>
                         )}
                     </View>
                     <TouchableOpacity onPress={() => { haptics.selection(); setIsMascotSheetVisible(true); }} className="active:scale-95 transition-transform items-center justify-center">
                         {currentRank === 'HERO' && (
                             <View 
                                className="absolute w-28 h-28 rounded-full bg-[#FFD700]" 
                                style={{ opacity: 0.2, transform: [{ scale: 1.2 }] }} 
                             />
                         )}
                         <MascotImage 
                             source={currentMascot.asset} 
                             className="w-32 h-32" 
                             resizeMode="contain" 
                         />
                         <View 
                             className="absolute bottom-0 right-0 rounded-full p-1.5 border-2 border-background shadow-sm"
                             style={{ backgroundColor: currentAccent.hex }}
                         >
                             <Ionicons name="sync" size={14} color="white" />
                         </View>
                     </TouchableOpacity>
                 </View>

                 <ActivityGraph entries={rawStreakData} maxStreak={profile?.max_streak || streak} />

                 <Insights userId={userId || undefined} />
                 
                 <Flashback />



                <View className="mb-8 bg-card rounded-[32px] p-6 shadow-xl"
                    style={{ shadowColor: isDarkMode ? '#000' : '#0000000D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
                    
                    <View className="py-2">
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsNameSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.name')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" style={{ color: currentAccent.hex }}>{profile?.display_name || t('profile.placeholders.setName')}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsAgeSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.age')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" style={{ color: currentAccent.hex }}>{profile?.age || t('profile.placeholders.setAge')}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsGenderSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.gender')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" style={{ color: currentAccent.hex }}>{renderGenderLabel(profile?.gender || '') || t('profile.placeholders.setGender')}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsCountrySheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.location')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" style={{ color: currentAccent.hex }}>{profile?.country || t('profile.placeholders.setCountry')}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsGoalSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.goals')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" numberOfLines={1} style={{ color: currentAccent.hex }}>
                                    {(profile?.goals?.length ?? 0) === 0 ? t('profile.placeholders.setGoals') : 
                                     profile?.goals?.length === 1 ? renderGoalLabel(profile.goals[0]) : 
                                     `${renderGoalLabel(profile?.goals?.[0] || '')} ${t('common.plusMore', { count: (profile?.goals?.length ?? 0) - 1 })}`}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity onPress={() => { haptics.selection(); setIsStruggleSheetVisible(true); }} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">{t('profile.sections.struggles')}</Text>
                            <View className="flex-1 flex-row items-center justify-end ml-4">
                                <Text className="font-q-bold text-base mr-2" numberOfLines={1} style={{ color: currentAccent.hex }}>
                                    {(profile?.struggles?.length ?? 0) === 0 ? t('profile.placeholders.setStruggles') : 
                                     profile?.struggles?.length === 1 ? renderStruggleLabel(profile.struggles[0]) : 
                                     `${renderStruggleLabel(profile?.struggles?.[0] || '')} ${t('common.plusMore', { count: (profile?.struggles?.length ?? 0) - 1 })}`}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#64748B" : "#CBD5E1"} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => {
                        haptics.heavy();
                        setIsLogoutSheetVisible(true);
                    }}
                    className="mt-4 items-center py-4 active:scale-95 transition-transform"
                >
                    <Text className="text-lg font-q-bold text-red-400/60">{t('profile.logout')}</Text>
                </TouchableOpacity>



                <AppFooter />
            </ScrollView>
            
             <BottomSheet visible={isNameSheetVisible} onClose={() => {
                setIsNameSheetVisible(false);
                setTempName(profile?.display_name || '');
             }}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">{t('profile.setup.nameTitle')}</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-secondary mb-8"
                        placeholder={t('home.setup.namePlaceholder')}
                        placeholderTextColor={isDarkMode ? "#64748B" : "#CBD5E1"}
                        onChangeText={setTempName}
                        value={tempName}
                        autoCapitalize="words"
                        autoFocus={true}
                    />
                    <Button 
                        label={t('home.setup.saveProfile')}
                        onPress={() => {
                            updateProfile({ display_name: tempName });
                            setIsNameSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection(); 
                            setIsNameSheetVisible(false);
                            setTempName(profile?.display_name || '');
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isAgeSheetVisible} onClose={() => {
                setIsAgeSheetVisible(false);
                setTempAge(profile?.age ? profile.age.toString() : '');
             }}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.CAKE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">{t('profile.setup.ageTitle')}</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                        placeholder={t('profile.sections.age')}
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempAge}
                        value={tempAge}
                        keyboardType="numeric"
                        autoFocus={true}
                    />
                    <Button 
                        label={t('common.save')}
                        onPress={() => {
                            const val = parseInt(tempAge);
                            if (!isNaN(val)) {
                                updateProfile({ age: val });
                                haptics.success();
                            }
                            setIsAgeSheetVisible(false);
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection(); 
                            setIsAgeSheetVisible(false);
                            setTempAge(profile?.age ? profile.age.toString() : '');
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isGenderSheetVisible} onClose={() => {
                setIsGenderSheetVisible(false);
                setTempGender(profile?.gender || '');
             }}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.MIRROR} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">{t('profile.setup.genderTitle')}</Text>
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {GENDERS.map((g) => (
                            <SelectionPill
                                key={g}
                                label={renderGenderLabel(g)}
                                selected={tempGender === g}
                                onPress={() => {
                                    setTempGender(g);
                                    haptics.selection();
                                }}
                            />
                        ))}
                    </View>
                    <Button 
                        label={t('common.save')}
                        onPress={() => {
                            updateProfile({ gender: tempGender });
                            setIsGenderSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            setIsGenderSheetVisible(false);
                            setTempGender(profile?.gender || '');
                        }} 
                        className="mt-4 py-2"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isCountrySheetVisible} onClose={() => {
                setIsCountrySheetVisible(false);
                setTempCountry(profile?.country || '');
             }}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.GLOBE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">{t('profile.setup.locationTitle')}</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-8"
                        placeholder={t('profile.sections.location')}
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempCountry}
                        value={tempCountry}
                        autoFocus={true}
                    />
                    <Button 
                        label={t('common.save')}
                        onPress={() => {
                            updateProfile({ country: tempCountry });
                            setIsCountrySheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection(); 
                            setIsCountrySheetVisible(false); 
                            setTempCountry(profile?.country || '');
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isGoalSheetVisible} 
                onClose={() => {
                    setIsGoalSheetVisible(false);
                    setSelectedGoals(profile?.goals || []);
                }}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.ZEN} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                        {t('profile.setup.goalsTitle')}
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {GOALS.map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={renderGoalLabel(goal)}
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
                        label={t('common.save')}
                        onPress={() => {
                            updateProfile({ goals: selectedGoals });
                            setIsGoalSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection(); 
                            setIsGoalSheetVisible(false); 
                            setSelectedGoals(profile?.goals || []);
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isStruggleSheetVisible} 
                onClose={() => {
                    setIsStruggleSheetVisible(false);
                    setSelectedStruggles(profile?.struggles || []);
                }}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.SAD} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                        {t('profile.setup.strugglesTitle')}
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {STRUGGLES.map((struggle) => (
                            <SelectionPill
                                key={struggle}
                                label={renderStruggleLabel(struggle)}
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
                        label={t('common.save')}
                        onPress={() => {
                            updateProfile({ struggles: selectedStruggles });
                            setIsStruggleSheetVisible(false);
                            haptics.success();
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => { 
                            haptics.selection(); 
                            setIsStruggleSheetVisible(false); 
                            setSelectedStruggles(profile?.struggles || []);
                        }} 
                        className="mt-4 py-2 active:scale-95 transition-transform"
                    >
                         <Text className="text-muted font-q-bold text-base">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isMascotSheetVisible} 
                onClose={() => {
                    setIsMascotSheetVisible(false);
                    setTempMascotName(profile?.mascot_name || 'Cloudy');
                }}
            >
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.HUG} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-1 px-4">{t('profile.setup.mascotTitle')}</Text>
                    
                    <TouchableOpacity 
                        onPress={() => {
                            haptics.selection();
                            setIsMascotSheetVisible(false);
                            navigation.navigate('Progress');
                        }}
                        className="mb-8"
                    >
                         <View style={{ borderBottomWidth: 1, borderBottomColor: currentAccent.hex, paddingBottom: 2 }}>
                             <Text className="font-q-bold text-sm uppercase tracking-widest" style={{ color: currentAccent.hex }}>{t('profile.setup.seeProgress')}</Text>
                         </View>
                    </TouchableOpacity>

                    <View className="flex-row flex-wrap justify-between w-full mb-4">
                        {(() => {
                            const effectiveStreak = Math.max(streak, profile?.max_streak || 0);
                            const hasAnyUnlocked = COMPANIONS.some(c => effectiveStreak >= c.requiredStreak);
                            
                            return (
                                <>
                                    {COMPANIONS.map((companion) => {
                                        const isLocked = effectiveStreak < companion.requiredStreak;
                                        return (
                                            <MascotCard 
                                                key={companion.id}
                                                name={t(`companions.${companion.id}.name`)}
                                                asset={companion.asset}
                                                isSelected={tempMascotName === companion.name}
                                                isLocked={isLocked}
                                                requiredStreak={companion.requiredStreak}
                                                unlockPerk={t(`companions.${companion.id}.perk`)}
                                                onPress={() => {
                                                    if (!isLocked) {
                                                        setTempMascotName(companion.name);
                                                        haptics.selection();
                                                    } else {
                                                        haptics.error();
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                    
                                    <View className="w-full mt-4">
                                        {hasAnyUnlocked && (
                                            <Button 
                                                label={t('common.save')}
                                                onPress={() => {
                                                    const selected = COMPANIONS.find(c => c.name === tempMascotName);
                                                    if (selected && effectiveStreak < selected.requiredStreak) {
                                                        haptics.error();
                                                        return;
                                                    }
                                                    updateProfile({ mascot_name: tempMascotName });
                                                    setIsMascotSheetVisible(false);
                                                    haptics.success();
                                                }}
                                            />
                                        )}
                                        <TouchableOpacity 
                                            onPress={() => { 
                                                haptics.selection(); 
                                                setIsMascotSheetVisible(false); 
                                                setTempMascotName(profile?.mascot_name || 'Cloudy');
                                            }}
                                            className="mt-4 py-2 items-center active:scale-95 transition-transform"
                                        >
                                            <Text className="text-muted font-q-bold text-base">{t('common.maybeLater')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </BottomSheet>

            <BottomSheet 
                visible={showOnboarding} 
                onClose={() => {
                    // If closing from Step 0 (Name), go to Step 1 (Reminder) as requested
                    if (onboardingStep === 0) {
                        setOnboardingStep(1);
                    } else {
                        // Fully close
                        setShowOnboarding(false);
                        updateProfile({ onboarding_completed: true }).catch(console.warn);
                        if (profile?.id) {
                            AsyncStorage.setItem(`profile_setup_seen_v2_${profile.id}`, 'true');
                        }
                        hasDismissedOnboarding.current = true;
                    }
                }}
            >
                {onboardingStep === 0 ? (
                    <View className="items-center w-full">
                        <MascotImage source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                        <Text className="text-xl font-q-bold text-center mb-1" style={{ color: currentAccent.hex }}>{t('profile.setup.aFreshStart')}</Text>
                        <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                            {t('profile.setup.nameTitle')}
                        </Text>
                        
                        <TextInput
                            className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-secondary mb-8"
                            placeholder={t('home.setup.namePlaceholder')}
                            placeholderTextColor={isDarkMode ? "#64748B" : "#CBD5E1"}
                            onChangeText={setTempName}
                            value={tempName}
                            autoCapitalize="words"
                            autoFocus={true}
                        />

                        <Button 
                            label={t('common.continue')}
                            loading={isSavingOnboarding}
                            onPress={async () => {
                                if (!tempName.trim()) return;
                                setIsSavingOnboarding(true);
                                try {
                                    await updateProfile({ display_name: tempName.trim() });
                                    setOnboardingStep(1);
                                    haptics.success();
                                } catch (e) {
                                    console.warn(e);
                                } finally {
                                    setIsSavingOnboarding(false);
                                }
                            }}
                        />

                        <TouchableOpacity 
                            onPress={() => { 
                                haptics.selection(); 
                                setOnboardingStep(1);
                            }}
                            className="mt-4 py-2 active:scale-95 transition-transform"
                        >
                            <Text className="text-muted font-q-bold text-base">{t('common.maybeLater')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="items-center w-full">
                        <MascotImage source={MASCOTS.WATCH} className="w-40 h-40 mb-4" resizeMode="contain" />
                        <Text className="text-xl font-q-bold text-center mb-1 px-4" style={{ color: currentAccent.hex }}>
                            {tempName ? t('profile.setup.niceToMeetYouWithName', { name: tempName }) : t('profile.setup.niceToMeetYou')}
                        </Text>
                        <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">
                            {t('home.setup.reminderTitle')}
                        </Text>

                        <View className="w-full mb-8">
                            <TimePicker value={tempReminderTime} onChange={setTempReminderTime} />
                        </View>

                        <Button 
                            label={t('home.setup.setReminder')}
                            loading={isSavingOnboarding}
                            onPress={async () => {
                                setIsSavingOnboarding(true);
                                try {
                                    const h = tempReminderTime.getHours().toString().padStart(2, '0');
                                    const m = tempReminderTime.getMinutes().toString().padStart(2, '0');
                                    await updateProfile({ 
                                        reminder_time: `${h}:${m}`,
                                        onboarding_completed: true 
                                    });
                                    setShowOnboarding(false);
                                    if (profile?.id) {
                                        AsyncStorage.setItem(`profile_setup_seen_v2_${profile.id}`, 'true');
                                    }
                                    hasDismissedOnboarding.current = true;
                                    haptics.success();
                                } catch (e) {
                                    console.warn(e);
                                } finally {
                                    setIsSavingOnboarding(false);
                                }
                            }}
                        />

                        <TouchableOpacity 
                             onPress={() => { 
                                haptics.selection(); 
                                setShowOnboarding(false);
                                updateProfile({ onboarding_completed: true }).catch(console.warn);
                                if (profile?.id) {
                                    AsyncStorage.setItem(`profile_setup_seen_v2_${profile.id}`, 'true');
                                }
                                hasDismissedOnboarding.current = true;
                            }}
                            className="mt-4 py-2 active:scale-95 transition-transform"
                        >
                            <Text className="text-muted font-q-bold text-base">{t('home.setup.noThanks')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </BottomSheet>

            <LogoutSheet 
                visible={isLogoutSheetVisible} 
                onClose={() => setIsLogoutSheetVisible(false)} 
                isAnonymous={!!isAnonymous}
            />
        </Layout>
    );
};
