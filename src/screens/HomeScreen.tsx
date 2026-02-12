import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const [text, setText] = useState('');
    const streak = 3;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const charCount = text.length;

    return (
        <Layout isTabScreen={true} useSafePadding={false} className="px-6 pt-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
                <Image 
                    source={MASCOTS.WRITE} 
                    className="w-24 h-24" 
                    resizeMode="contain" 
                />
                <View className="items-end">
                    <View className="flex-row items-center">
                    <Text className="text-lg text-muted font-q-bold">TODAY</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
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
                    multiline
                    placeholder="What's on your mind today?"
                    placeholderTextColor="#999"
                    className="text-text font-q-regular text-lg flex-1 mb-4"
                    textAlignVertical="top"
                    value={text}
                    onChangeText={setText}
                    maxLength={200}
                />
                
                <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                    <Text className="text-muted font-q-medium">
                        {charCount} / 200 symbols
                    </Text>
                    <TouchableOpacity 
                        className="bg-primary px-8 py-2.5 rounded-xl shadow-sm active:opacity-90"
                    >
                        <Text className="text-white font-q-bold text-base">Save</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tip Box */}
            <View className="bg-tip-bg rounded-2xl p-5 flex-row items-center shadow-[#00000005] shadow-sm mb-8" style={{ elevation: 2 }}>
                <View className="bg-secondary p-3 rounded-full mr-4 w-12 h-12 items-center justify-center">
                    <Ionicons name="bulb" size={24} color="#FF9E7D" />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-q-bold text-base mb-0.5">Writing Tip</Text>
                    <Text className="text-muted font-q-regular text-sm leading-5">
                        Focus on one small thing that went well today, no matter how tiny it seems.
                    </Text>
                </View>
            </View>
        </Layout>
    );
};
