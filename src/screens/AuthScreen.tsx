import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../components/CustomAlert';

export const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'error' | 'success' | 'info';
        buttons: any[];
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    const navigation = useNavigation<any>();

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info', buttons: any[] = []) => {
        setAlertConfig({ visible: true, title, message, type, buttons });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };
    
    async function signInWithEmail() {
        if (!email || !password) {
            showAlert('Missing info', 'Please enter both email and password.', 'error');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showAlert('Error', error.message, 'error');
        } else {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
            });
        }
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!email || !password) {
            showAlert('Missing info', 'Please enter both email and password.', 'error');
            return;
        }
        setLoading(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser?.is_anonymous) {
                const { error } = await supabase.auth.updateUser({
                    email,
                    password,
                });

                if (error) {
                    if (error.message.includes('already registered') || error.status === 422) {
                        showAlert(
                            'Account already exists',
                            'Would you like to log into your existing journey instead? Your current temporary data will not be merged.',
                            'info',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Log In', 
                                    onPress: async () => {
                                        await supabase.auth.signOut();
                                        setIsLogin(true);
                                    } 
                                }
                            ]
                        );
                    } else {
                        throw error;
                    }
                } else {
                    showAlert('Success', 'Your journey is secured!', 'success', [
                        { text: 'Okay', onPress: () => navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainApp' }],
                        }) }
                    ]);
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;
                
                if (data.session) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainApp' }],
                    });
                } else {
                    showAlert('Success', 'Please check your email to confirm your account.', 'success', [
                        { text: 'Okay', onPress: () => navigation.goBack() }
                    ]);
                }
            }
        } catch (error: any) {
            showAlert('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    const signInWithGoogle = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser?.is_anonymous) {
                const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                if (error) throw error;
            }
        } catch (error: any) {
            showAlert('Error', error.message, 'error');
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#FFF9F0' }}
        >
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className="mb-4"
                >
                    <Ionicons name="arrow-back" size={28} color="#FF9E7D" />
                </TouchableOpacity>

                <View className="items-center mb-8">
                    <Image 
                        source={isLogin ? MASCOTS.HELLO : MASCOTS.THINK} 
                        className="w-48 h-48 mb-2" 
                        resizeMode="contain" 
                    />
                    <Text className="text-3xl font-q-bold text-text">
                        {isLogin ? 'Welcome Back!' : 'Save Your Journey'}
                    </Text>
                    <Text className="text-lg font-q-medium text-muted mt-2 text-center px-4">
                        {isLogin 
                            ? 'Cloudy missed you.' 
                            : 'Create an account to secure your progress and memories.'}
                    </Text>
                </View>

                <View className="mb-6">
                    <View className="mb-5">
                        <Text className="text-sm font-q-bold text-muted mb-2 ml-1">Email</Text>
                        <TextInput
                            className="bg-white/60 px-6 py-5 rounded-3xl font-q-bold text-lg text-text border-2 border-inactive/10"
                            placeholder="hello@cloudy.app"
                            placeholderTextColor="#CBD5E1"
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-q-bold text-muted mb-2 ml-1">Password</Text>
                        <TextInput
                            className="bg-white/60 px-6 py-5 rounded-3xl font-q-bold text-lg text-text border-2 border-inactive/10"
                            placeholder="••••••••"
                            placeholderTextColor="#CBD5E1"
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        className="bg-primary py-5 rounded-full items-center shadow-lg active:scale-[0.98] transition-all"
                        onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className="text-white font-q-bold text-xl">
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="mt-6 py-3 items-center"
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text className="text-muted font-q-bold text-lg">
                            {isLogin ? "New here? " : "Already joined? "}
                            <Text className="text-primary">
                                {isLogin ? 'Create Account' : 'Sign In'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Google Sign In Divider */}
                <View className="flex-row items-center mb-8 px-4 opacity-30">
                    <View className="flex-1 h-[1px] bg-gray-400" />
                    <Text className="mx-4 text-gray-500 font-q-bold text-sm">OR</Text>
                    <View className="flex-1 h-[1px] bg-gray-400" />
                </View>

                <TouchableOpacity
                    className="bg-white/80 py-5 rounded-full flex-row justify-center items-center border-2 border-inactive/10 shadow-sm"
                    onPress={signInWithGoogle}
                >
                    <Ionicons name="logo-google" size={20} color="#64748B" className="mr-3" />
                    <Text className="text-[#64748B] font-q-bold text-lg ml-2">Continue with Google</Text>
                </TouchableOpacity>
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </KeyboardAvoidingView>
    );
};
