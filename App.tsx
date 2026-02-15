import "./global.css";
import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { DeviceEventEmitter, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { navigationRef } from './src/utils/navigation';
import { supabase } from './src/lib/supabase';

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';
import { posthog, identifyUser } from './src/lib/posthog';
import { useProfile } from './src/context/ProfileContext';


// Disable reanimated strict mode to avoid noisy warnings during render transitions
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { StruggleSelectionScreen } from './src/screens/StruggleSelectionScreen';
import { GoalSelectionScreen } from './src/screens/GoalSelectionScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { JournalEntryScreen } from './src/screens/JournalEntryScreen';
import { MemoryScreen } from './src/screens/MemoryScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { JournalProvider } from './src/context/JournalContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AlertProvider } from './src/context/AlertContext';
import { useNotifications } from './src/hooks/useNotifications';
import { LockScreen } from './src/components/LockScreen';
import { preloadAssets } from './src/utils/assetLoader';
import { AssetWarmup } from './src/components/AssetWarmup';
import { CustomSplashScreen } from './src/components/CustomSplashScreen';
import { LegalScreen } from './src/screens/LegalScreen';

const AppContent = () => {
  useNotifications(true); // Pass flag to ignore hook errors if needed, but we'll use ref now
  return null; 
};


const Stack = createNativeStackNavigator();

const CloudyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFF9F0',
    card: '#FFF9F0',
  },
};

// Prevent auto hide splash screen
SplashScreen.preventAutoHideAsync();

const RootNavigator = ({ session, isBioLocked }: { session: Session | null, isBioLocked: boolean | null }) => {
  const { profile, loading: profileLoading } = useProfile();
  
  if (profileLoading && session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF9E7D" size="large" />
      </View>
    );
  }

  const showOnboarding = session && profile && !profile.onboarding_completed;

  return (
    <LockScreen 
        isActive={!!session} 
        initialLocked={isBioLocked === true && !!session}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF9F0' },
          animation: 'slide_from_right'
        }}
      >
        {session ? (
          showOnboarding ? (
            <>
              <Stack.Screen name="StruggleSelection" component={StruggleSelectionScreen} />
              <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
              <Stack.Screen name="Summary" component={SummaryScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
              <Stack.Screen name="Memory" component={MemoryScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="StruggleSelection" component={StruggleSelectionScreen} />
            <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </LockScreen>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [isBioLocked, setIsBioLocked] = useState<boolean | null>(null);

  useEffect(() => {
    // 0. Quick check for biometric lock to decide on splash strategy
    AsyncStorage.getItem('security_lock_enabled').then(val => {
      setIsBioLocked(val === 'true');
    });

    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    // 3. Preload mascot assets silently in the background
    preloadAssets();

    // 4. Capture a manual start event to ensure reliable funnel sequencing.
    // Native 'Application Opened' can be delayed in React Native/Expo.
    posthog.capture('app_session_start');

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  // 4. Identify user in PostHog as soon as session is available
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id, session.user.email);
    }
  }, [session]);


  useEffect(() => {
    // Decision: Hide native splash and show app
    if (fontsLoaded && !isAuthLoading && isBioLocked !== null) {
      // If we are bio locked AND authenticated, we want to give the stack 
      // a tiny bit of time to layout before we hide the native splash.
      // This prevents the "empty cream screen" flash.
      const settleTime = (isBioLocked && session) ? 400 : 0;

      setTimeout(() => {
        SplashScreen.hideAsync().catch(console.warn);
      
        if (isBioLocked && session) {
            setShowAnimatedSplash(false);
        }
      }, settleTime);
    }
  }, [fontsLoaded, isAuthLoading, isBioLocked, session]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      {/* Universal Fallback Loader: Visible during heavy navigation mount or asset gaps */}
      <View 
        style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}
      >
        <ActivityIndicator color="#FF9E7D" size="large" />
      </View>

      <PostHogProvider client={posthog} autocapture={false}>
        <SafeAreaProvider>

        <AlertProvider>
          <ProfileProvider>
            <JournalProvider session={session}>
              <NavigationContainer 
                theme={CloudyTheme} 
                ref={navigationRef}
                onReady={() => {
                  const currentRouteName = navigationRef.getCurrentRoute()?.name;
                  if (currentRouteName) {
                    posthog.screen(currentRouteName);
                  }
                }}
                onStateChange={() => {
                  const currentRouteName = navigationRef.getCurrentRoute()?.name;
                  if (currentRouteName) {
                    posthog.screen(currentRouteName);
                  }
                }}
              >

                {fontsLoaded && !isAuthLoading ? (
                  <>
                    <AppContent />
                    <AssetWarmup />
                    <RootNavigator session={session} isBioLocked={isBioLocked} />
                  </>
                ) : null}

                {showAnimatedSplash && !(isBioLocked && session) && (
                   <CustomSplashScreen 
                    onFinish={() => setShowAnimatedSplash(false)} 
                   />
                )}
                <StatusBar style="dark" />
              </NavigationContainer>
            </JournalProvider>
          </ProfileProvider>
        </AlertProvider>
      </SafeAreaProvider>
      </PostHogProvider>

    </View>
  );
}
