import React, { useState } from 'react';
import Constants from 'expo-constants';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';
import { TopNav } from '../components/TopNav';
import { Layout } from '../components/Layout';
import { haptics } from '../utils/haptics';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/Button';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { identifyUser } from '../lib/posthog';
import { useAnalytics } from '../hooks/useAnalytics';



GoogleSignin.configure({
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
});

export const AuthScreen = () => {
    const { showAlert } = useAlert();
    const { trackEvent } = useAnalytics();
    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const route = useRoute<any>();
    const [isLogin, setIsLogin] = useState(route.params?.initialMode !== 'signup');
    
    const navigation = useNavigation<any>();
    
    async function signInWithEmail() {
        haptics.selection();
        if (!email || !password) {
            showAlert('Missing info', 'Please enter both email and password.', [{ text: 'Okay' }], 'error');
            return;
        }
        setLoading(true);
        
        // Capture anonymous ID for merging if signing in to existing account
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.is_anonymous) {
            await AsyncStorage.setItem('pending_merge_anonymous_id', currentUser.id);
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (data.user) {
            identifyUser(data.user.id, data.user.email ?? undefined);
            trackEvent('user_signed_in', { method: 'email' });
            
            // CONVERSION GUARD: Only navigate manually if we are securing a guest journey.
            const isGuestConversion = route.name === 'SecureAccount';
            if (isGuestConversion) {
                navigation.navigate('MainApp');
            }
        }

        if (error) {
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
            setLoading(false);
        }
    }

    async function signUpWithEmail() {
        haptics.selection();
        if (!email || !password) {
            showAlert('Missing info', 'Please enter both email and password.', [{ text: 'Okay' }], 'error');
            return;
        }
        setLoading(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser?.is_anonymous) {
                const { data, error } = await supabase.auth.updateUser({
                    email,
                    password,
                });

                if (data.user) {
                    identifyUser(data.user.id, data.user.email ?? undefined);
                    trackEvent('user_converted_from_anonymous', { method: 'email' });
                }



                if (error) {
                    if (error.message.includes('already registered') || error.status === 422) {
                        showAlert(
                            'Account already exists',
                            'Would you like to log into your existing journey instead? Your current temporary data will not be merged.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Log In', 
                                    onPress: async () => {
                                        await supabase.auth.signOut();
                                        setIsLogin(true);
                                    } 
                                }
                            ],
                            'info'
                        );
                    } else {
                        throw error;
                    }
                } else {
                    showAlert('Success', 'Your journey is secured!', [
                        { text: 'Okay' }
                    ], 'success');
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;
                
                if (data.session) {
                    // App.tsx handles the switch
                } else {
                    showAlert('Success', 'Please check your email to confirm your account.', [
                        { text: 'Okay', onPress: () => navigation.goBack() }
                    ], 'success');
                    trackEvent('user_signed_up', { method: 'email' });
                }

            }
        } catch (error: any) {
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
            setLoading(false);
        }
    }

    const signInWithGoogle = async () => {
        try {
            haptics.selection();
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            
            if (response.type === 'cancelled') {
                setLoading(false);
                return;
            }

            if (response.type === 'success' && response.data.idToken) {
                // Capture anonymous ID for merging
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser?.is_anonymous) {
                    await AsyncStorage.setItem('pending_merge_anonymous_id', currentUser.id);
                }

                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: response.data.idToken,
                });
                
                if (data.user) {
                    identifyUser(data.user.id, data.user.email ?? undefined);
                    trackEvent('user_signed_in', { method: 'google', is_conversion: !!currentUser?.is_anonymous });

                    // CONVERSION GUARD: Only navigate manually if we are securing a guest journey.
                    const isGuestConversion = route.name === 'SecureAccount';
                    if (isGuestConversion) {
                        navigation.navigate('MainApp');
                    }
                }

                if (error) throw error;

            } else if (response.type === 'success' && !response.data.idToken) {
                throw new Error('No ID Token found');
            }
        } catch (error: any) {
            console.error('[Auth] Google Sign-In Error:', error);
            // Only show alert if it's not a cancellation or operation in progress
            if (error.code !== statusCodes.IN_PROGRESS && error.code !== statusCodes.SIGN_IN_CANCELLED) {
                const { title, message } = getFriendlyAuthErrorMessage(error);
                showAlert(title, message, [{ text: 'Okay' }], 'error');
            }
            setLoading(false);
        }
    }

    return (
        <Layout useSafePadding={false} noScroll={true}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="px-6 pt-4">
                    <TopNav showBack={true} />
                </View>

                <ScrollView 
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="items-center mb-4">
                        <View className="w-32 h-32 mb-2 items-center justify-center">
                            <Image 
                                source={isLogin ? MASCOTS.KEY : MASCOTS.SAVE} 
                                className="w-32 h-32" 
                                resizeMode="contain" 
                            />
                        </View>
                        <Text className="text-3xl font-q-bold text-text">
                            {isLogin ? 'Welcome Back!' : 'Save Your Journey'}
                        </Text>
                        <View className="h-14 justify-center">
                            <Text className="text-base font-q-medium text-muted text-center px-4">
                                {isLogin 
                                    ? 'Cloudy missed you.' 
                                    : 'Create an account to secure your progress and memories.'}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <View className="mb-3">
                            <Text className="text-lg font-q-bold text-muted mb-2 ml-1">Email</Text>
                            <TextInput
                                className="bg-white/60 px-6 py-4 rounded-3xl font-q-bold text-lg text-text border-2 border-inactive/10"
                                placeholder="hello@cloudy.app"
                                placeholderTextColor="#CBD5E1"
                                onChangeText={setEmail}
                                value={email}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-lg font-q-bold text-muted mb-2 ml-1">Password</Text>
                            <TextInput
                                className="bg-white/60 px-6 py-4 rounded-3xl font-q-bold text-lg text-text border-2 border-inactive/10"
                                placeholder="••••••••"
                                placeholderTextColor="#CBD5E1"
                                onChangeText={setPassword}
                                value={password}
                                secureTextEntry={true}
                                autoCapitalize="none"
                            />
                        </View>

                        <Button
                            label={isLogin ? 'Sign In' : 'Sign Up'}
                            onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                            loading={loading}
                        />

                        <TouchableOpacity 
                            className="mt-2 py-2 items-center"
                            onPress={() => { haptics.selection(); setIsLogin(!isLogin); }}
                        >
                            <Text className="text-muted font-q-bold text-base">
                                {isLogin ? "New here? " : "Already joined? "}
                                <Text className="text-primary">
                                    {isLogin ? 'Create Account' : 'Sign In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Google Sign In Divider */}
                    <View className="flex-row items-center mb-4 px-4 opacity-30">
                        <View className="flex-1 h-[1px] bg-gray-400" />
                        <Text className="mx-4 text-gray-500 font-q-bold text-sm">OR</Text>
                        <View className="flex-1 h-[1px] bg-gray-400" />
                    </View>

                    <TouchableOpacity
                        className="bg-white/80 py-4 rounded-full border-2 border-inactive/10 shadow-sm min-h-[58px] justify-center"
                        onPress={signInWithGoogle}
                        disabled={loading}
                    >
                        <View className="flex-row items-center justify-center">
                            <View className={`flex-row items-center justify-center ${loading ? "opacity-0" : "opacity-100"}`}>
                                <Ionicons name="logo-google" size={20} color="#64748B" />
                                <Text className="text-[#64748B] font-q-bold text-lg ml-2">Continue with Google</Text>
                            </View>
                            {loading && (
                                <View className="absolute inset-0 items-center justify-center">
                                    <ActivityIndicator color="#64748B" size="small" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Layout>
    );
};
