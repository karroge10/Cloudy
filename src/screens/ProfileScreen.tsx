import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Switch, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MASCOTS } from '../constants/Assets';
import { GOALS } from '../constants/Goals';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { ActivityGraph } from '../components/ActivityGraph';
import { SelectionPill } from '../components/SelectionPill';
import { BottomSheet } from '../components/BottomSheet';

const COMPANIONS = [
    { id: 'HELLO', name: 'Wavy', asset: MASCOTS.HELLO },
    { id: 'SLEEP_1', name: 'Dreamy', asset: MASCOTS.SLEEP_1 },
    { id: 'WRITE', name: 'Author', asset: MASCOTS.WRITE },
    { id: 'THINK', name: 'Brainy', asset: MASCOTS.THINK },
    { id: 'STREAK', name: 'Firey', asset: MASCOTS.STREAK },
    { id: 'ZEN', name: 'Flow', asset: MASCOTS.ZEN },
] as const;

export const ProfileScreen = () => {
    const [isReminderEnabled, setIsReminderEnabled] = useState(true);
    const [isHapticsEnabled, setIsHapticsEnabled] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState('Inner Peace');
    const [reminderTime, setReminderTime] = useState('8:00 PM');
    const [selectedMascot, setSelectedMascot] = useState<typeof COMPANIONS[number]['id']>('STREAK');

    // Modal States
    const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
    const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);
    const [isMascotSheetVisible, setIsMascotSheetVisible] = useState(false);

    const streak = 3;

    const TIMES = ['7:00 AM', '8:00 AM', '9:00 AM', '12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];

    const currentMascot = COMPANIONS.find(c => c.id === selectedMascot) || COMPANIONS[4];

    return (
        <Layout isTabScreen={true}>
            <TopNav title="Profile" />

            {/* Streak & Mascot Header */}
            <View className="flex-row justify-between items-center mb-10">
                <View className="flex-1">
                    <Text className="text-[44px] leading-[50px] font-q-bold text-text">{streak} Day</Text>
                    <Text className="text-[44px] leading-[50px] font-q-bold text-text">Streak!</Text>
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
            <ActivityGraph />

            {/* Goal Pill */}
            <TouchableOpacity 
                onPress={() => setIsGoalSheetVisible(true)}
                className="bg-card rounded-full py-5 px-8 flex-row justify-between items-center shadow-[#0000000D] shadow-xl mb-10"
                style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
            >
                <Text className="text-lg font-q-semibold text-text">
                    My Goal: <Text className="font-q-regular text-primary">{selectedGoal}</Text>
                </Text>
                <Ionicons name="pencil-sharp" size={20} color="#FF9E7D" />
            </TouchableOpacity>

            {/* Settings Section */}
            <View className="mb-10 bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl"
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
                        onValueChange={() => setIsReminderEnabled(!isReminderEnabled)}
                        value={isReminderEnabled}
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
                        thumbColor={isHapticsEnabled ? '#FFFFFF' : '#f4f3f4'}
                        onValueChange={() => setIsHapticsEnabled(!isHapticsEnabled)}
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
            <TouchableOpacity className="mb-20 items-center py-4">
                <Text className="text-lg font-q-bold text-red-400 opacity-60">Log Out</Text>
                <Text className="text-[10px] font-q-medium text-muted mt-2 opacity-30">Cloudy v1.0.42</Text>
            </TouchableOpacity>

            {/* Goal Selection Sheet */}
            <BottomSheet 
                visible={isGoalSheetVisible} 
                onClose={() => setIsGoalSheetVisible(false)}
                title="Your Focus"
            >
                <View className="flex-row flex-wrap gap-3 mt-2">
                    {GOALS.map((goal) => (
                        <SelectionPill
                            key={goal}
                            label={goal}
                            selected={selectedGoal === goal}
                            onPress={() => {
                                setSelectedGoal(goal);
                                setIsGoalSheetVisible(false);
                            }}
                        />
                    ))}
                </View>
                <TouchableOpacity 
                    onPress={() => setIsGoalSheetVisible(false)}
                    className="mt-10 py-4 items-center"
                >
                    <Text className="text-lg font-q-bold text-muted">Cancel</Text>
                </TouchableOpacity>
            </BottomSheet>

            {/* Time Selection Sheet */}
            <BottomSheet 
                visible={isTimeSheetVisible} 
                onClose={() => setIsTimeSheetVisible(false)}
                title="Reminder Time"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-[350px] mt-2">
                    <View className="flex-row flex-wrap gap-3">
                        {TIMES.map((time) => (
                            <TouchableOpacity
                                key={time}
                                onPress={() => {
                                    setReminderTime(time);
                                    setIsTimeSheetVisible(false);
                                }}
                                className={`px-6 py-3 rounded-2xl border-2 ${reminderTime === time ? 'bg-primary border-primary' : 'bg-card border-inactive/30'}`}
                            >
                                <Text className={`text-lg font-q-bold ${reminderTime === time ? 'text-white' : 'text-text'}`}>{time}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </BottomSheet>

            {/* Mascot Selection Sheet */}
            <BottomSheet 
                visible={isMascotSheetVisible} 
                onClose={() => setIsMascotSheetVisible(false)}
                title="Your Companion"
            >
                <View className="flex-row flex-wrap mt-2">
                    {COMPANIONS.map((companion) => (
                        <TouchableOpacity 
                            key={companion.id}
                            onPress={() => {
                                setSelectedMascot(companion.id);
                                setIsMascotSheetVisible(false);
                            }}
                            className={`w-[30%] m-[1.5%] p-4 rounded-3xl items-center border-2 ${selectedMascot === companion.id ? 'bg-secondary border-primary' : 'bg-card border-transparent'}`}
                        >
                            <Image source={companion.asset} className="w-14 h-14" resizeMode="contain" />
                            <Text className="text-[10px] font-q-bold text-text mt-2 uppercase">{companion.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity 
                    onPress={() => setIsMascotSheetVisible(false)}
                    className="mt-6 py-4 items-center"
                >
                    <Text className="text-lg font-q-bold text-muted">Go Back</Text>
                </TouchableOpacity>
            </BottomSheet>
        </Layout>
    );
};
