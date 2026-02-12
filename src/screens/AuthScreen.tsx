import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const navigation = useNavigation<any>();
    // Optional context passed from previous screens (e.g. "Create an account to save your journey...")
    // We can use useRoute to get params if we want to be dynamic.
    // For now, let's just hardcode the "Value-First" message if coming from Summary flow or just always show it appropriately?
    // The user requested: "Create an account to save your journey and track your progress toward [Selected Goal]."
    // To do that, we need to pass the goal from SummaryScreen -> AuthScreen.
    // But AuthScreen is currently just a generic login. Let's make it a bit more flexible.
    
    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Check your inbox for email verification!');
            setIsLogin(true); // Switch to login after signup
        }
        setLoading(false);
    }

    const signInWithGoogle = () => {
        Alert.alert('Coming Soon', 'Google Sign In will be available in the next update!');
    }

    return (
        <LinearGradient
            colors={['#FFF9F0', '#FFFDF9']}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="items-center mb-10">
                        <Text className="text-4xl">☁️</Text> 
                        <Text className="text-3xl font-q-bold text-text mt-4">Cloudy</Text>
                        <Text className="text-lg font-q-medium text-muted mt-2 text-center px-4">
                            Create an account to save your journey and track your progress.
                        </Text>
                    </View>

                    <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <Text className="text-xl font-q-bold text-text mb-6">
                            {isLogin ? 'Welcome Back!' : 'Create an Account'}
                        </Text>

                        <View className="mb-4">
                            <Text className="text-sm font-q-bold text-muted mb-2 ml-1">Email</Text>
                            <TextInput
                                className="bg-card px-4 py-3.5 rounded-2xl font-q-medium text-text border border-gray-200"
                                placeholder="hello@cloudy.app"
                                placeholderTextColor="#94A3B8"
                                onChangeText={(text) => setEmail(text)}
                                value={email}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-q-bold text-muted mb-2 ml-1">Password</Text>
                            <TextInput
                                className="bg-card px-4 py-3.5 rounded-2xl font-q-medium text-text border border-gray-200"
                                placeholder="••••••••"
                                placeholderTextColor="#94A3B8"
                                onChangeText={(text) => setPassword(text)}
                                value={password}
                                secureTextEntry={true}
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            className="bg-primary py-4 rounded-full items-center shadow-sm active:opacity-90"
                            onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text className="text-white font-q-bold text-lg">
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="mt-4 py-3 items-center"
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            <Text className="text-muted font-q-medium">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <Text className="text-primary font-q-bold">
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Google Sign In Divider */}
                    <View className="flex-row items-center mb-6">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 font-q-medium text-sm">Or continue with</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    <TouchableOpacity
                        className="bg-white border border-gray-200 py-4 rounded-full flex-row justify-center items-center shadow-sm active:opacity-90"
                        onPress={signInWithGoogle}
                    >
                        <Text className="text-2xl mr-2">G</Text> 
                        {/* Can replace 'G' with actual Google SVG later */}
                        <Text className="text-text font-q-bold text-lg">Google</Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-between mt-8 opacity-30">
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text className="text-gray-400 font-q-medium">← Dev: Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('ProfileSetup' as never)}>
                            <Text className="text-gray-400 font-q-medium">Dev: Next →</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};
