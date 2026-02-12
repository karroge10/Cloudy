import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Switch, ScrollView, FlatList, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { calculateStreak } from '../utils/streakUtils';
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


export const ProfileScreen = () => {
    const { streak, rawStreakData } = useJournal();
    const { profile, loading: profileLoading, updateProfile } = useProfile();
    
    // UI Local States (for sheets/modals)
    const [isNameSheetVisible, setIsNameSheetVisible] = useState(false);
    const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
    const [isStruggleSheetVisible, setIsStruggleSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [isMascotSheetVisible, setIsMascotSheetVisible] = useState(false);
    const [isAgeSheetVisible, setIsAgeSheetVisible] = useState(false);
    const [isGenderSheetVisible, setIsGenderSheetVisible] = useState(false);
    const [isCountrySheetVisible, setIsCountrySheetVisible] = useState(false);
    
    const [tempAge, setTempAge] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempCountry, setTempCountry] = useState('');
    const [reminderDate, setReminderDate] = useState(new Date());
    const [isAnonymous, setIsAnonymous] = useState(false);

    const navigation = useNavigation<any>();

    useEffect(() => {
        if (profile) {
            setTempName(profile.display_name || '');
            setTempAge(profile.age?.toString() || '');
            setTempCountry(profile.country || '');
            
            if (profile.reminder_time) {
                const [time, period] = profile.reminder_time.split(' ');
                const [hours, minutes] = time.split(':');
                let h = parseInt(hours);
                if (period === 'PM' && h < 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;
                
                const d = new Date();
                d.setHours(h);
                d.setMinutes(parseInt(minutes));
                setReminderDate(d);
            }
        }
    }, [profile]);

    useEffect(() => {
        const checkAnon = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsAnonymous(user?.is_anonymous || false);
        };
        checkAnon();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('has_seen_first_entry');
            await AsyncStorage.removeItem('user_streak_cache');
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    
    const currentMascot = COMPANIONS.find(c => c.name === profile?.mascot_name) || COMPANIONS[0];
    const reminderTime = profile?.reminder_time || '8:00 PM';
    const isHapticsEnabled = profile?.haptics_enabled ?? true;
    const displayName = profile?.display_name || '';


    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('has_seen_first_entry');
            await AsyncStorage.removeItem('user_streak_cache');
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };


    const TIMES = ['7:00 AM', '8:00 AM', '9:00 AM', '12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
    const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

    const currentMascot = COMPANIONS.find(c => c.id === selectedMascot) || COMPANIONS[0];

    return (
        <Layout noScroll={true} isTabScreen={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Profile" />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130 }}
            >
                {/* Profile Nudge Banner */}
                <ProfileNudge 
                    isAnonymous={isAnonymous}
                    isComplete={!!displayName}
                    loading={loading}
                    onPressCompleteProfile={() => setIsNameSheetVisible(true)}
                    className="mb-8"
                />

                {/* Streak & Mascot Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <View className="flex-1">
                         <TouchableOpacity onPress={() => setIsNameSheetVisible(true)} className="mb-1">
                              {loading ? (
                                 <Skeleton width={120} height={24} style={{ marginBottom: 4 }} borderRadius={12} />
                              ) : (
                                 <Text className="text-xl font-q-bold text-muted">Hi, {displayName || 'Friend'}! 👋</Text>
                              )}
                         </TouchableOpacity>
                        
                        {/* We use loading state for entire profile, but streak comes from Context instantly */}
                        {loading && streak === 0 ? (
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
                    <TouchableOpacity onPress={() => setIsMascotSheetVisible(true)} className="active:scale-95 transition-transform">
                        <Image 
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
                            <TouchableOpacity onPress={() => setIsTimeSheetVisible(true)}>
                                <Text className="text-primary font-q-bold text-base mt-1">{reminderTime}</Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            trackColor={{ false: '#E0E0E0', true: '#FF9E7D' }}
                            thumbColor={isReminderEnabled ? '#FFFFFF' : '#f4f3f4'}
                            onValueChange={() => {
                                const newVal = !isReminderEnabled;
                                setIsReminderEnabled(newVal);
                            }}
                            value={isReminderEnabled}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Age, Gender, Country, Goals, Struggles row */}
                    <View className="py-2">
                        <TouchableOpacity onPress={() => setIsAgeSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Age</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{age || 'Set Age'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsGenderSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Gender</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{gender || 'Set Gender'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsCountrySheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Location</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base">{country || 'Set Country'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsGoalSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Goals</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base" numberOfLines={1}>
                                    {selectedGoals.length === 0 ? 'Set Goals' : 
                                     selectedGoals.length === 1 ? selectedGoals[0] : 
                                     `${selectedGoals[0]} +${selectedGoals.length - 1} more`}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsStruggleSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Struggles</Text>
                            <View className="flex-1 items-end ml-4">
                                <Text className="text-primary font-q-bold text-base" numberOfLines={1}>
                                    {selectedStruggles.length === 0 ? 'Set Struggles' : 
                                     selectedStruggles.length === 1 ? selectedStruggles[0] : 
                                     `${selectedStruggles[0]} +${selectedStruggles.length - 1} more`}
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
                            thumbColor={isHapticsEnabled ? '#FFFFFF' : '#f4f3f4'}
                            onValueChange={() => {
                                const newVal = !isHapticsEnabled;
                                setIsHapticsEnabled(newVal);
                                updateProfile({ haptics_enabled: newVal });
                            }}
                            value={isHapticsEnabled}
                        />
                    </View>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Export Data */}
                    <TouchableOpacity className="flex-row items-center justify-between py-4">
                        <Text className="text-lg font-q-bold text-text">Export Journal (.pdf)</Text>
                        <Ionicons name="download-outline" size={22} color="#FF9E7D" />
                    </TouchableOpacity>

                    <View className="h-[1px] bg-inactive opacity-10" />

                    {/* Privacy Policy */}
                    <TouchableOpacity className="flex-row items-center justify-between py-4">
                        <Text className="text-lg font-q-bold text-text">Privacy & Security</Text>
                        <Ionicons name="lock-closed-outline" size={22} color="#FF9E7D" />
                    </TouchableOpacity>
                </View>

                {/* Log Out */}
                <TouchableOpacity onPress={handleLogout} className="mb-20 items-center py-4">
                    <Text className="text-lg font-q-bold text-red-400 opacity-60">Log Out</Text>
                    <Text className="text-[10px] font-q-medium text-muted mt-2 opacity-30">Cloudy v1.0.42</Text>
                </TouchableOpacity>
            </ScrollView>

             <BottomSheet visible={isNameSheetVisible} onClose={() => setIsNameSheetVisible(false)}>
                <View className="items-center mt-2">
                     <Image source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-6">What should Cloudy call you?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-6"
                        placeholder="Your Name"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempName}
                        value={tempName}
                        autoCapitalize="words"
                        autoFocus={true}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            updateProfile({ display_name: tempName });
                            setIsNameSheetVisible(false);
                            setDisplayName(tempName);
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Save Name</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsNameSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isAgeSheetVisible} onClose={() => setIsAgeSheetVisible(false)}>
                <View className="items-center mt-2">
                     <Image source={MASCOTS.CAKE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-6">How old are you?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-6"
                        placeholder="Age"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempAge}
                        value={tempAge}
                        keyboardType="numeric"
                        autoFocus={true}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            const val = parseInt(tempAge);
                            if (!isNaN(val)) {
                                updateProfile({ age: val });
                                setAge(val);
                            }
                            setIsAgeSheetVisible(false);
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Save Age</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsAgeSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isGenderSheetVisible} onClose={() => setIsGenderSheetVisible(false)}>
                <View className="items-center mt-2">
                    <Image source={MASCOTS.MIRROR} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">How do you identify?</Text>
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-6">
                        {GENDERS.map((g) => (
                            <SelectionPill
                                key={g}
                                label={g}
                                selected={gender === g}
                                onPress={() => {
                                    setGender(g);
                                    updateProfile({ gender: g });
                                    setIsGenderSheetVisible(false);
                                }}
                            />
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => setIsGenderSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet visible={isCountrySheetVisible} onClose={() => setIsCountrySheetVisible(false)}>
                <View className="items-center mt-2">
                     <Image source={MASCOTS.GLOBE} className="w-40 h-40 mb-4" resizeMode="contain" />
                     <Text className="text-2xl font-q-bold text-text text-center mb-6">Where are you from?</Text>
                    <TextInput
                        className="w-full bg-card px-6 py-5 rounded-[24px] font-q-bold text-lg text-text border-2 border-inactive/10 mb-6"
                        placeholder="Country"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempCountry}
                        value={tempCountry}
                        autoFocus={true}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            updateProfile({ country: tempCountry });
                            setCountry(tempCountry);
                            setIsCountrySheetVisible(false);
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Save Location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsCountrySheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isGoalSheetVisible} 
                onClose={() => setIsGoalSheetVisible(false)}
                title="My Goals"
            >
                <View className="items-center mt-2">
                    <Image source={MASCOTS.ZEN} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-lg font-q-medium text-muted text-center mb-6 px-4">
                        What are your main goals for using Cloudy?
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {GOALS.map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={goal}
                                selected={selectedGoals.includes(goal)}
                                onPress={() => {
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

                    <TouchableOpacity 
                        onPress={() => {
                            updateProfile({ goals: selectedGoals });
                            setIsGoalSheetVisible(false);
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Save Goals</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsGoalSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

             <BottomSheet 
                visible={isStruggleSheetVisible} 
                onClose={() => setIsStruggleSheetVisible(false)}
                title="My Struggles"
            >
                <View className="items-center mt-2">
                    <Image source={MASCOTS.SAD} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-lg font-q-medium text-muted text-center mb-6 px-4">
                        What's been weighing on you lately?
                    </Text>
                    
                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-8">
                        {STRUGGLES.map((struggle) => (
                            <SelectionPill
                                key={struggle}
                                label={struggle}
                                selected={selectedStruggles.includes(struggle)}
                                onPress={() => {
                                    if (selectedStruggles.includes(struggle)) {
                                        setSelectedStruggles(selectedStruggles.filter(s => s !== struggle));
                                    } else {
                                        setSelectedStruggles([...selectedStruggles, struggle]);
                                    }
                                }}
                            />
                        ))}
                    </View>

                    <TouchableOpacity 
                        onPress={() => {
                            updateProfile({ struggles: selectedStruggles });
                            setIsStruggleSheetVisible(false);
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Save Struggles</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsStruggleSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* Time Selection Sheet */}
             <BottomSheet visible={isTimeSheetVisible} onClose={() => setIsTimeSheetVisible(false)}>
                <View className="items-center mt-2 w-full">
                    <Image source={MASCOTS.WATCH} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">When to remind you?</Text>
                    
                    <View className="w-full mb-8">
                        <TimePicker value={reminderDate} onChange={setReminderDate} />
                    </View>

                    <Button 
                        label="Update Time"
                        onPress={() => {
                            const formatted = reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            setReminderTime(formatted);
                            updateProfile({ reminder_time: formatted });
                            setIsTimeSheetVisible(false);
                        }}
                    />

                    <TouchableOpacity onPress={() => setIsTimeSheetVisible(false)} className="mt-4 py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* Mascot Selection Sheet */}
            <BottomSheet visible={isMascotSheetVisible} onClose={() => setIsMascotSheetVisible(false)}>
                <View className="items-center mt-2 w-full">
                    <Image source={MASCOTS.HUG} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">Choose your companion</Text>
                    <View className="flex-row flex-wrap justify-between w-full">
                        {COMPANIONS.map((companion) => (
                            <MascotCard 
                                key={companion.id}
                                name={companion.name}
                                asset={companion.asset}
                                isSelected={selectedMascot === companion.id}
                                onPress={() => {
                                    setSelectedMascot(companion.id);
                                    updateProfile({ mascot_name: companion.name });
                                    setIsMascotSheetVisible(false);
                                }}
                            />
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => setIsMascotSheetVisible(false)} className="mt-6 py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </Layout>
    );
};
