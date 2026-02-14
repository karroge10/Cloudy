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

import { supabase } from './src/lib/supabase';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

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
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { ReminderSetupScreen } from './src/screens/ReminderSetupScreen';
import { JournalProvider } from './src/context/JournalContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AlertProvider } from './src/context/AlertContext';
import { useNotifications } from './src/hooks/useNotifications';
import { LockScreen } from './src/components/LockScreen';
import { preloadAssets } from './src/utils/assetLoader';
import { AssetWarmup } from './src/components/AssetWarmup';
import { CustomSplashScreen } from './src/components/CustomSplashScreen';

const AppContent = () => {
  useNotifications();
  return null; // This component just runs the hook
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

    return () => {
        subscription.unsubscribe();
    };
  }, []);

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

      <SafeAreaProvider>
        <AlertProvider>
          <ProfileProvider>
            <JournalProvider session={session}>
              <NavigationContainer theme={CloudyTheme}>
                <AppContent />
                
                {fontsLoaded && !isAuthLoading ? (
                  <>
                    <AssetWarmup />
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
                          <>
                            <Stack.Screen name="MainApp" component={MainTabNavigator} />
                            <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
                            <Stack.Screen name="Memory" component={MemoryScreen} />
                            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                            <Stack.Screen name="ReminderSetup" component={ReminderSetupScreen} />
                          </>
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
    </View>
  );
}
