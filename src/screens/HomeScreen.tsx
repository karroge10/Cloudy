import React, { useState, useRef, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Animated, Pressable } from 'react-native';
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

export const HomeScreen = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<any>();
    const { addEntry, streak } = useJournal();
    const { profile, updateProfile } = useProfile();
    
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSetupSheet, setShowSetupSheet] = useState(false);
    const [showStreakNudge, setShowStreakNudge] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [tempDisplayName, setTempDisplayName] = useState('');
    
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

    const handleSave = async () => {
        if (!text.trim()) {
            showAlert('Empty Entry', 'Please write something to save.', [{ text: 'Okay' }], 'info');
            return;
        }

        setLoading(true);
        try {
            haptics.selection();
            await addEntry(text.trim());
            haptics.success();
            
            Keyboard.dismiss();
            
            // Get user for anon check
            const { data: { user } } = await supabase.auth.getUser();
            const isAnon = user?.is_anonymous;

            const likelyStreak = streak + 1; 
            const hasSeenFirstEntry = await AsyncStorage.getItem('has_seen_first_entry');

            if (!hasSeenFirstEntry && !profile?.display_name) {
                // First time entry and no name set yet
                setShowSetupSheet(true);
            } else if (isAnon && likelyStreak === 3) {  
                // Suggest linking account on 3rd entry
                setShowStreakNudge(true);
            } else {
                 setText('');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'Could not save your entry.', [{ text: 'Okay' }], 'error');
        } finally {
            setLoading(false);
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
                onboarding_completed: true,
            });

            await AsyncStorage.setItem('has_seen_first_entry', 'true');
            setShowSetupSheet(false);
            setText('');
        } catch (error: any) {
            showAlert('Error', error.message, [{ text: 'Okay' }], 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleMaybeLater = async () => {
        await AsyncStorage.setItem('has_seen_first_entry', 'true');
        setShowSetupSheet(false);
        setText('');
    };

    const charCount = text.length;
    const isNewUser = !!(profile && profile.onboarding_completed === false);

    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isNewUser) {
            // Small delay to ensure the component is fully ready
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isNewUser]);

    return (
        <Layout isTabScreen={true} useSafePadding={false} className="px-6 pt-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Pressable onPress={handleMascotPress}>
                    <Animated.Image 
                        source={isNewUser ? MASCOTS.HELLO : MASCOTS.WRITE} 
                        className="w-24 h-24" 
                        resizeMode="contain"
                        style={{ transform: [{ scale: scaleAnim }] }}
                    />
                </Pressable>
                <View className="items-end">
                    <View className="flex-row items-center">
                        <Text className="text-lg text-muted font-q-bold">TODAY</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="ml-3">
                            <View className="flex-row items-center bg-white px-2 py-1 rounded-full shadow-sm">
                                <Ionicons name="flame" size={16} color="#FF9E7D" />
                                <Text className="font-q-bold text-primary ml-1 text-base">{streak}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text className="text-xl font-q-bold text-text mr-2">{formattedDate}</Text>
                </View>
            </View>

            {/* Main Writing Card */}
            <View className="bg-card rounded-[32px] p-6 shadow-[#0000000D] shadow-xl mb-8 flex-1" style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 5 }}>
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
                    autoFocus={isNewUser}
                />
                
                <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                    <Text className="text-muted font-q-medium">
                        {charCount} / 200 symbols
                    </Text>
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={loading}
                        className="bg-primary px-8 py-2.5 rounded-xl shadow-sm active:opacity-90"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-q-bold text-base">Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tip Box */}
            <InfoCard 
                title="Writing Tip"
                subtitle="Focus on one small thing that went well today, no matter how tiny it seems."
                icon="bulb"
                className="mb-8"
            />

            {/* Post-Save Setup Sheet */}
            <BottomSheet 
                visible={showSetupSheet} 
                onClose={() => {
                    handleMaybeLater();
                }}
            >
                <View className="items-center">
                    <Image source={MASCOTS.THINK} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">Beautifully said!</Text>
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4">
                        What should Cloudy call you?
                    </Text>
                    
                    <TextInput
                        className="w-full bg-white px-6 py-4 rounded-2xl font-q-bold text-lg text-text border border-gray-100 shadow-sm mb-8"
                        placeholder="Your Name"
                        placeholderTextColor="#CBD5E1"
                        onChangeText={setTempDisplayName}
                        value={tempDisplayName}
                        autoCapitalize="words"
                    />

                    <TouchableOpacity 
                        onPress={handleSaveProfile}
                        disabled={isSavingName}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        {isSavingName ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-q-bold text-lg">Save Profile</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                       onPress={handleMaybeLater}
                       className="py-2"
                    >
                        <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
            {/* 3-Day Streak Nudge Sheet */}
            <BottomSheet 
                visible={showStreakNudge} 
                onClose={() => {
                    handleMaybeLater(); // Also treat closing this as maybe later
                }}
            >
                <View className="items-center">
                    <Image source={MASCOTS.STREAK} className="w-40 h-40 mb-4" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">You're doing great!</Text>
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 px-4">
                        You've reached a 3-day streak! Want to link an account so you never lose these memories?
                    </Text>

                    <TouchableOpacity 
                        onPress={() => {
                            setShowStreakNudge(false);
                            setText('');
                            navigation.navigate('Auth', { initialMode: 'signup' });
                        }}
                        className="w-full bg-primary py-4 rounded-full items-center shadow-md active:opacity-90 mb-4"
                    >
                        <Text className="text-white font-q-bold text-lg">Link Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                       onPress={() => {
                           setShowStreakNudge(false);
                           setText('');
                       }}
                       className="py-2"
                    >
                        <Text className="text-muted font-q-bold text-base">Maybe later</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </Layout>
    );
};
