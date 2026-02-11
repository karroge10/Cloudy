import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';

export const WelcomeScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <View className="flex-1 px-6 justify-between py-12">
                {/* Top Spacer */}
                <View />

                {/* Content */}
                <View className="items-center">
                    <Image
                        source={MASCOTS.HELLO}
                        className="w-48 h-48 mb-6"
                        resizeMode="contain"
                    />

                    <Text className="text-3xl font-bold text-text mb-4 text-center font-sans">
                        Hi, I'm Cloudy
                    </Text>
                    <Text className="text-lg text-text opacity-80 text-center font-sans leading-6">
                        Your tiny companion for a clearer mind.
                    </Text>
                </View>

                {/* Footer */}
                <View className="w-full">
                    <Button
                        label="Let's Start"
                        onPress={() => navigation.navigate('StruggleSelection' as never)}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};
