import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { haptics } from '../utils/haptics';
import { AppFooter } from '../components/AppFooter';
import { useAccent } from '../context/AccentContext';
import { Linking } from 'react-native';
import { LINKS } from '../constants/Links';

export const LegalScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(route.params?.type || 'privacy');
    const { currentAccent } = useAccent();

    const privacyPolicy = `
Last Updated: February 14, 2026

1. Introduction
Welcome to Cloudy. We are committed to protecting your personal information and your right to privacy.

2. Information We Collect
- Profile Information: Name, age, gender, and country (if provided).
- Journal Entries: Your text entries are stored in our secure database.
- Biometric Data: We do NOT collect or store your biometric data. FaceID/Fingerprint authentication is handled entirely by your device's operating system.
- Authentication: We use Google Sign-In and anonymous authentication via Supabase.

3. How We Use Your Data
Your data is used solely to provide and improve the Cloudy experience, including streak tracking and daily reminders. We do NOT sell your data to third parties.

4. Data Security
We implement industry-standard security measures to protect your data. Your memories are your own.

5. Data Deletion
You have the right to delete your account and all associated data at any time through the "Delete Account" option in the Profile settings.

6. Changes to This Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
    `;

    const termsOfService = `
Last Updated: February 14, 2026

1. Acceptance of Terms
By using Cloudy, you agree to be bound by these terms.

2. User Content
You are responsible for the content you post in your journal. We do not claim ownership of your content.

3. Privacy
Your use of Cloudy is also governed by our Privacy Policy.

4. Prohibited Uses
You agree not to use the app for any illegal or unauthorized purpose.

5. Termination
We reserve the right to terminate or suspend your access to the app at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the app, us, or third parties, or for any other reason.

6. Limitation of Liability
Cloudy is provided "as is" without any warranties. We are not liable for any damages arising out of your use of the app.
    `;

    return (
        <Layout noScroll={true} useSafePadding={false} edges={['top', 'left', 'right']}>
            <View className="px-6 pt-4">
                <TopNav title="Legal" onBack={() => navigation.goBack()} />
            </View>

            <View className="flex-row px-6 mt-4 gap-4">
                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setActiveTab('privacy'); }}
                    className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'privacy' ? '' : 'bg-card border border-inactive/10'}`}
                    style={activeTab === 'privacy' ? { backgroundColor: currentAccent.hex } : {}}
                >
                    <Text className={`font-q-bold ${activeTab === 'privacy' ? 'text-white' : 'text-muted'}`}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => { haptics.selection(); setActiveTab('terms'); }}
                    className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'terms' ? '' : 'bg-card border border-inactive/10'}`}
                    style={activeTab === 'terms' ? { backgroundColor: currentAccent.hex } : {}}
                >
                    <Text className={`font-q-bold ${activeTab === 'terms' ? 'text-white' : 'text-muted'}`}>Terms of Service</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1 mt-6 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="bg-card p-6 rounded-[32px] border border-inactive/5">
                    <Text className="text-text font-q-medium leading-6">
                        {activeTab === 'privacy' ? privacyPolicy.trim() : termsOfService.trim()}
                    </Text>
                </View>

                <TouchableOpacity 
                    onPress={() => Linking.openURL(LINKS.WEBSITE)}
                    className="mt-6 items-center"
                >
                    <Text className="text-muted font-q-medium text-xs text-center">
                        Full policies and terms are also available at{"\n"}
                        <Text style={{ color: currentAccent.hex }} className="font-q-bold">cloudyapp.vercel.app</Text>
                    </Text>
                </TouchableOpacity>

                <AppFooter />
            </ScrollView>
        </Layout>
    );
};
