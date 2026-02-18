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
import { useAnalytics } from '../hooks/useAnalytics';
import { Layout } from '../components/Layout';

import { COMPANIONS } from '../constants/Companions';
import { useTheme } from '../context/ThemeContext';

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const GOALS = ['Mental Clarity', 'Memory keeping', 'Self-discipline', 'Creativity', 'Gratitude'];
const STRUGGLES = ['Anxiety', 'Stress', 'Sleep', 'Focus', 'Motivation', 'N/A'];

export const ProfileScreen = () => {
    const { streak, rawStreakData, refreshEntries } = useJournal();
    const { profile, loading: profileLoading, updateProfile, isAnonymous, userId, logout } = useProfile();
    const { isDarkMode } = useTheme();
    const { trackEvent } = useAnalytics();
    let navigation: any;
    try {
        navigation = useNavigation<any>();
    } catch (e) {
        console.error('[ProfileScreen] Navigation context missing!');
    }
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
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

    // Temp states for editing
    const [tempName, setTempName] = useState('');
    const [tempAge, setTempAge] = useState('');
    const [tempGender, setTempGender] = useState('');
    const [tempCountry, setTempCountry] = useState('');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedStruggles, setSelectedStruggles] = useState<string[]>([]);
    const [tempMascotName, setTempMascotName] = useState('');

    const displayName = profile?.display_name;
    const currentMascotName = profile?.mascot_name || 'cloudy';
    const currentMascot = COMPANIONS.find(c => c.name === currentMascotName) || COMPANIONS[0];

    useEffect(() => {
        if (profile) {
            setTempName(profile.display_name || '');
            setTempAge(profile.age ? profile.age.toString() : '');
            setTempGender(profile.gender || '');
            setTempCountry(profile.country || '');
            setSelectedGoals(profile.goals || []);
            setSelectedStruggles(profile.struggles || []);
            setTempMascotName(profile.mascot_name || COMPANIONS[0].name);
        }
    }, [profile]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        haptics.light();
        await refreshEntries();
        setIsRefreshing(false);
    };

    const currentRank = [...COMPANIONS].reverse().find(c => (profile?.max_streak || 0) >= c.requiredStreak)?.trait || 'Beginner';

    return (
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav 
                    title="Profile" 
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
                        tintColor="#FF9E7D"
                        colors={["#FF9E7D"]}
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
                                    <Text className="text-xl font-q-bold text-muted mr-3">Hi, {displayName || 'Friend'}!</Text>
                                    
                                    {currentRank === 'HERO' ? (
                                        <View className={`${isDarkMode ? 'bg-[#FFD700]/20' : 'bg-black'} px-3 py-1 rounded-full border border-[#FFD700] flex-row items-center shadow-sm`}>
                                            <Ionicons name="flash" size={10} color="#FFD700" />
                                            <Text className="text-[#FFD700] font-q-bold text-[10px] ml-1.5 uppercase tracking-widest">HERO</Text>
                                        </View>
                                    ) : (
                                        <View className="bg-primary/20 px-2.5 py-1 rounded-full">
                                            <Text className="text-primary font-q-bold text-[10px] uppercase tracking-wider">{currentRank}</Text>
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

                 <ActivityGraph entries={rawStreakData} maxStreak={profile?.max_streak || streak} />

                 <Insights userId={userId || undefined} />



                <View className="mb-8 bg-card rounded-[32px] p-6 shadow-xl"
                    style={{ shadowColor: isDarkMode ? '#000' : '#0000000D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
                    
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

                <TouchableOpacity 
                    onPress={() => {
                        haptics.heavy();
                        setIsLoggingOut(true);
                        // Short timeout to ensure UI renders before the heavy async operation potentially blocks
                        setTimeout(() => {
                            logout();
                        }, 50);
                    }}
                    className="mt-4 items-center py-4 active:scale-95 transition-transform"
                >
                    <Text className="text-lg font-q-bold text-red-400/60">Log Out</Text>
                </TouchableOpacity>

                <Modal visible={isLoggingOut} transparent={true} animationType="fade">
                    <View className="flex-1 justify-center items-center bg-black/40">
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

                <AppFooter />
            </ScrollView>
            
             <BottomSheet visible={isNameSheetVisible} onClose={() => setIsNameSheetVisible(false)}>
                <View className="items-center w-full">
                     <MascotImage source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-8 px-4">What should Cloudy call you?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-secondary mb-8"
                        placeholder="Your Name"
                        placeholderTextColor={isDarkMode ? "#64748B" : "#CBD5E1"}
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

             <BottomSheet visible={isMascotSheetVisible} onClose={() => setIsMascotSheetVisible(false)}>
                <View className="items-center w-full">
                    <MascotImage source={MASCOTS.HUG} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-1 px-4">Choose your companion</Text>
                    
                    <TouchableOpacity 
                        onPress={() => {
                            haptics.selection();
                            setIsMascotSheetVisible(false);
                            navigation.navigate('Progress');
                        }}
                        className="mb-8"
                    >
                        <Text className="text-primary font-q-bold text-sm uppercase tracking-widest border-b border-primary pb-0.5">See Progress</Text>
                    </TouchableOpacity>

                    <View className="flex-row flex-wrap justify-between w-full mb-4">
                        {COMPANIONS.map((companion) => {
                            const effectiveStreak = Math.max(streak, profile?.max_streak || 0);
                            const isLocked = effectiveStreak < companion.requiredStreak;
                            return (
                                <MascotCard 
                                    key={companion.id}
                                    name={companion.name}
                                    asset={companion.asset}
                                    isSelected={tempMascotName === companion.name}
                                    isLocked={isLocked}
                                    requiredStreak={companion.requiredStreak}
                                    unlockPerk={companion.unlockPerk}
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
                    <View className="w-full">
                        <Button 
                            label="Save"
                            onPress={() => {
                                updateProfile({ mascot_name: tempMascotName });
                                setIsMascotSheetVisible(false);
                                haptics.success();
                            }}
                        />
                        <TouchableOpacity 
                            onPress={() => { haptics.selection(); setIsMascotSheetVisible(false); }}
                            className="mt-4 py-2 items-center active:scale-95 transition-transform"
                        >
                             <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheet>



        </Layout>
    );
};
