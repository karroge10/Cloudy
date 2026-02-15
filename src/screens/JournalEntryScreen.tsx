import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MASCOTS } from '../constants/Assets';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/Button';
import { MascotImage } from '../components/MascotImage';
import { useAnalytics } from '../hooks/useAnalytics';
import { useJournal } from '../context/JournalContext';



export const JournalEntryScreen = () => {
    const { showAlert } = useAlert();
    const [gratitude, setGratitude] = useState('');
    const navigation = useNavigation();
    const { addEntry } = useJournal();
    const { trackEvent } = useAnalytics();



    const handleSave = async () => {
        if (gratitude.trim().length === 0) return;
        
        try {
            await addEntry(gratitude.trim());
            setGratitude('');
            
            showAlert(
                "Gratitude Saved!", 
                "See you tomorrow!", 
                [{ text: "Okay", onPress: () => navigation.goBack() }],
                'success'
            );
        } catch (error: any) {
            showAlert('Error', 'Could not save your entry.', [{ text: 'Okay' }], 'error');
        }
    };

    return (
        <Layout noScroll={true} useSafePadding={false}>
            <View className="px-6 pt-4">
                <TopNav title="Journal" />
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 px-6"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                >
                    {/* Header Content */}
                    <View className="items-center mb-8">
                        <MascotImage
                            source={MASCOTS.WRITE}
                            className="w-40 h-40 mb-4"
                            resizeMode="contain"
                        />
                        <Text className="text-2xl font-q-bold text-text text-center">
                            Focus on the good.
                        </Text>
                        <Text className="text-base text-text text-center font-q-regular mt-2 opacity-80">
                            What is one small thing you are grateful for today?
                        </Text>
                    </View>

                    <View 
                        className="bg-card rounded-3xl p-6 shadow-[#0000000D] shadow-xl min-h-[200px]"
                        style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}
                    >
                        <TextInput
                            className="flex-1 text-lg text-text font-q-regular text-left align-top"
                            placeholder="I am grateful for..."
                            placeholderTextColor="#999"
                            multiline
                            textAlignVertical="top"
                            value={gratitude}
                            onChangeText={setGratitude}
                            autoFocus
                        />
                    </View>

                    <View className="mt-8">
                        <Button
                            label="Save Entry"
                            onPress={handleSave}
                            disabled={gratitude.trim().length === 0}
                            haptic="heavy"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Layout>
    );
};
