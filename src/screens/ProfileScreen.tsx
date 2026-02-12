import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Switch, ScrollView, FlatList, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { MASCOTS } from '../constants/Assets';
import { GOALS } from '../constants/Goals';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { ActivityGraph } from '../components/ActivityGraph';
import { SelectionPill } from '../components/SelectionPill';
import { BottomSheet } from '../components/BottomSheet';
import { calculateStreak } from '../utils/streakUtils';
import { Skeleton } from '../components/Skeleton';
import { useJournal } from '../context/JournalContext';
import { ProfileNudge } from '../components/ProfileNudge';

const COMPANIONS = [
    { id: 'HELLO', name: 'Wavy', asset: MASCOTS.HELLO },
    { id: 'SLEEP_1', name: 'Dreamy', asset: MASCOTS.SLEEP_1 },
    { id: 'WRITE', name: 'Author', asset: MASCOTS.WRITE },
    { id: 'THINK', name: 'Brainy', asset: MASCOTS.THINK },
    { id: 'STREAK', name: 'Firey', asset: MASCOTS.STREAK },
    { id: 'ZEN', name: 'Flow', asset: MASCOTS.ZEN },
] as const;

export const ProfileScreen = () => {
    // Data States
    const { streak, rawStreakData } = useJournal();
    const [displayName, setDisplayName] = useState('');
    const [isReminderEnabled, setIsReminderEnabled] = useState(true);
    const [isHapticsEnabled, setIsHapticsEnabled] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState('Inner Peace');
    const [reminderTime, setReminderTime] = useState('8:00 PM');
    const [selectedMascot, setSelectedMascot] = useState<typeof COMPANIONS[number]['id']>('SLEEP_1');
    const [loading, setLoading] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [onboardingGoals, setOnboardingGoals] = useState<string[]>([]);
    
    // Detailed Profile States
    const [age, setAge] = useState<number | null>(null);
    const [gender, setGender] = useState('');
    const [country, setCountry] = useState('');

    const navigation = useNavigation<any>();

    // Modal States
    const [isNameSheetVisible, setIsNameSheetVisible] = useState(false);
    const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [isMascotSheetVisible, setIsMascotSheetVisible] = useState(false);
    const [isAgeSheetVisible, setIsAgeSheetVisible] = useState(false);
    const [isGenderSheetVisible, setIsGenderSheetVisible] = useState(false);
    const [isCountrySheetVisible, setIsCountrySheetVisible] = useState(false);
    
    const [tempAge, setTempAge] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempCountry, setTempCountry] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            setDisplayName(data.display_name || '');
            setTempName(data.display_name || '');
            setSelectedGoal(data.goal || 'Inner Peace');
            setReminderTime(data.reminder_time || '8:00 PM');
            setIsHapticsEnabled(data.haptics_enabled ?? true);
            setAge(data.age || null);
            setTempAge(data.age?.toString() || '');
            setGender(data.gender || '');
            setCountry(data.country || '');
            setTempCountry(data.country || '');
            
            // Map mascot name back to ID
            const mascot = COMPANIONS.find(c => c.name === data.mascot_name);
            if (mascot) setSelectedMascot(mascot.id);
            
            setOnboardingGoals(data.goals || []);
        }
        setIsAnonymous(user.is_anonymous || false);
        setLoading(false);
    };

    const updateProfile = async (updates: Record<string, any>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', user.id);

        if (!error) {
            fetchProfile();
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        }
    };

    const TIMES = ['7:00 AM', '8:00 AM', '9:00 AM', '12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
    const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

    const currentMascot = COMPANIONS.find(c => c.id === selectedMascot) || COMPANIONS[4];

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

                {/* Goal Pill */}
                <TouchableOpacity 
                    onPress={() => setIsGoalSheetVisible(true)}
                    className="bg-card rounded-full py-5 px-8 flex-row justify-between items-center shadow-[#0000000D] shadow-xl mb-8"
                    style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                >
                    <Text className="text-lg font-q-semibold text-text">
                        My Goal: <Text className="font-q-regular text-primary">{selectedGoal}</Text>
                    </Text>
                    <Ionicons name="pencil-sharp" size={20} color="#FF9E7D" />
                </TouchableOpacity>

                {/* Settings Section */}
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

                    {/* Age, Gender, Country row */}
                    <View className="py-2">
                        <TouchableOpacity onPress={() => setIsAgeSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Age</Text>
                            <Text className="text-primary font-q-bold text-base">{age || 'Set Age'}</Text>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsGenderSheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Gender</Text>
                            <Text className="text-primary font-q-bold text-base">{gender || 'Set Gender'}</Text>
                        </TouchableOpacity>
                        <View className="h-[1px] bg-inactive opacity-10" />
                        <TouchableOpacity onPress={() => setIsCountrySheetVisible(true)} className="flex-row justify-between items-center py-3">
                            <Text className="text-lg font-q-bold text-text">Location</Text>
                            <Text className="text-primary font-q-bold text-base">{country || 'Set Country'}</Text>
                        </TouchableOpacity>
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

            {/* Name Edit Sheet */}
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

            {/* Age Edit Sheet */}
            <BottomSheet visible={isAgeSheetVisible} onClose={() => setIsAgeSheetVisible(false)}>
                <View className="items-center mt-2">
                     <Ionicons name="calendar-outline" size={60} color="#FF9E7D" className="mb-4" />
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

            {/* Gender Selection Sheet */}
            <BottomSheet visible={isGenderSheetVisible} onClose={() => setIsGenderSheetVisible(false)}>
                <View className="items-center mt-2">
                    <Ionicons name="people-outline" size={60} color="#FF9E7D" className="mb-4" />
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

            {/* Country Selection Sheet */}
            <BottomSheet visible={isCountrySheetVisible} onClose={() => setIsCountrySheetVisible(false)}>
                <View className="items-center mt-2">
                     <Ionicons name="earth-outline" size={60} color="#FF9E7D" className="mb-4" />
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

            {/* Goal Selection Sheet */}
            <BottomSheet visible={isGoalSheetVisible} onClose={() => setIsGoalSheetVisible(false)}>
                <View className="items-center mt-2">
                    <Ionicons name="trophy-outline" size={60} color="#FF9E7D" className="mb-4" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">What's your focus?</Text>
                    
                    {onboardingGoals.length > 0 && (
                        <View className="w-full mb-4">
                            <Text className="text-xs font-q-bold text-muted uppercase mb-3 ml-2 tracking-widest">Picked during onboarding</Text>
                            <View className="flex-row flex-wrap gap-3 justify-center w-full mb-6">
                                {onboardingGoals.map((goal) => (
                                    <SelectionPill
                                        key={`onboarding-${goal}`}
                                        label={goal}
                                        selected={selectedGoal === goal}
                                        onPress={() => {
                                            setSelectedGoal(goal);
                                            updateProfile({ goal: goal });
                                            setIsGoalSheetVisible(false);
                                        }}
                                    />
                                ))}
                            </View>
                            <View className="h-[1px] bg-inactive/10 w-full mb-6" />
                            <Text className="text-xs font-q-bold text-muted uppercase mb-3 ml-2 tracking-widest">All Goals</Text>
                        </View>
                    )}

                    <View className="flex-row flex-wrap gap-3 justify-center w-full mb-6">
                        {GOALS.filter(g => !onboardingGoals.includes(g)).map((goal) => (
                            <SelectionPill
                                key={goal}
                                label={goal}
                                selected={selectedGoal === goal}
                                onPress={() => {
                                    setSelectedGoal(goal);
                                    updateProfile({ goal: goal });
                                    setIsGoalSheetVisible(false);
                                }}
                            />
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => setIsGoalSheetVisible(false)} className="py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* Time Selection Sheet */}
            <BottomSheet visible={isTimeSheetVisible} onClose={() => setIsTimeSheetVisible(false)}>
                <View className="items-center mt-2 w-full">
                    <Ionicons name="alarm-outline" size={60} color="#FF9E7D" className="mb-4" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">When to remind you?</Text>
                    <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px] w-full">
                        <View className="flex-row flex-wrap gap-3 justify-center">
                            {TIMES.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    onPress={() => {
                                        setReminderTime(time);
                                        updateProfile({ reminder_time: time });
                                        setIsTimeSheetVisible(false);
                                    }}
                                    className={`px-6 py-3 rounded-2xl border-2 ${reminderTime === time ? 'bg-primary border-primary' : 'bg-card border-inactive/30'}`}
                                >
                                    <Text className={`text-lg font-q-bold ${reminderTime === time ? 'text-white' : 'text-text'}`}>{time}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    <TouchableOpacity onPress={() => setIsTimeSheetVisible(false)} className="mt-6 py-2">
                         <Text className="text-muted font-q-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            {/* Mascot Selection Sheet */}
            <BottomSheet visible={isMascotSheetVisible} onClose={() => setIsMascotSheetVisible(false)}>
                <View className="items-center mt-2 w-full">
                    <Image source={currentMascot.asset} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-6">Choose your companion</Text>
                    <View className="flex-row flex-wrap justify-center w-full">
                        {COMPANIONS.map((companion) => (
                            <TouchableOpacity 
                                key={companion.id}
                                onPress={() => {
                                    setSelectedMascot(companion.id);
                                    updateProfile({ mascot_name: companion.name });
                                    setIsMascotSheetVisible(false);
                                }}
                                className={`w-[30%] m-[1.5%] p-4 rounded-3xl items-center border-2 ${selectedMascot === companion.id ? 'bg-secondary border-primary' : 'bg-card/50 border-transparent'}`}
                            >
                                <Image source={companion.asset} className="w-14 h-14" resizeMode="contain" />
                                <Text className="text-[10px] font-q-bold text-text mt-2 uppercase">{companion.name}</Text>
                            </TouchableOpacity>
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
