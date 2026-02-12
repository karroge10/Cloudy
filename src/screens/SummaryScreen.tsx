import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MASCOTS } from '../constants/Assets';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export const SummaryScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const { struggles, goals } = route.params as { struggles: string[], goals: string[] } || { struggles: [], goals: [] };

    const formatList = (items: string[]) => {
        if (items.length === 0) return "stress";
        if (items.length === 1) return items[0].toLowerCase();
        if (items.length === 2) return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`;
        return `${items[0].toLowerCase()} and others`;
    };

    const struggleText = formatList(struggles);
    const goalText = formatList(goals);

    const handleStartWriting = async () => {
        setLoading(true);
        try {
            // Sign in anonymously to bypass traditional auth for now
            const { error } = await supabase.auth.signInAnonymously();
            
            if (error) throw error;
            
            // Note: App.tsx has an auth listener that will pick up the session 
            // change and update the navigation stack automatically.
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />
            <View className="flex-1 px-6 justify-between py-4">
                 <View className="flex-row justify-between items-center w-full min-h-[40px]" />

                <View className="items-center">
                    <Text className="text-4xl font-q-bold text-text mb-8 text-center">
                        We can get there, together.
                    </Text>

                    <Image
                        source={MASCOTS.SHINE}
                        className="w-96 h-96 mb-4"
                        resizeMode="contain"
                    />

                    <Text className="text-2xl text-text text-center font-q-regular leading-9 mb-12 px-2">
                        Research shows that writing down just <Text className="font-q-bold text-primary">one gratitude</Text> a day can reduce <Text className="font-q-bold text-primary">{struggleText}</Text> and help you find <Text className="font-q-bold text-primary">{goalText}</Text>.
                    </Text>
                </View>

                <View className="w-full">
                     <View className="flex-row justify-center gap-2 mb-8">
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-gray-300" />
                        <View className="w-3 h-3 rounded-full bg-primary" />
                    </View>

                    <Button
                        label="Start Writing"
                        onPress={handleStartWriting}
                        loading={loading}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};
