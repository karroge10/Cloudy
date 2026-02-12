import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Button } from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';

import { Layout } from '../components/Layout';

export const WelcomeScreen = () => {
    const navigation = useNavigation();

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4">
                 <View className="flex-row justify-between items-center w-full min-h-[48px]" />
            </View>

            <View className="flex-1 px-6 justify-between pb-8">
                {/* Content */}
                <View className="items-center">
                    <Image
                        source={MASCOTS.HELLO}
                        className="w-72 h-72 mb-10"
                        resizeMode="contain"
                    />

                    <Text className="text-5xl font-q-bold text-text mb-6 text-center leading-[60px]">
                        Hi, I'm Cloudy
                    </Text>
                    <Text className="text-2xl text-text opacity-80 text-center font-q-regular leading-relaxed px-4">
                        Your tiny companion for a clearer mind.
                    </Text>
                </View>

                {/* Footer */}
                <View className="w-full">
                     {/* Progress Dots */}
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-primary" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                    </View>

                    <Button
                        label="Let's Start"
                        onPress={() => navigation.navigate('StruggleSelection' as never)}
                        showArrow
                    />

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Auth' as never)}
                        className="mt-6 items-center py-2"
                    >
                        <Text className="text-muted font-q-bold text-lg">
                            Already have an account? <Text className="text-primary">Log In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
};
