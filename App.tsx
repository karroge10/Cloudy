import "./global.css";
import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { DeviceEventEmitter } from 'react-native';

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
import { useNotifications } from './src/hooks/useNotifications';

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

  useEffect(() => {
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

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [fontsLoaded, isAuthLoading]);

  if (!fontsLoaded || isAuthLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <JournalProvider session={session}>
          <NavigationContainer theme={CloudyTheme}>
            <AppContent />
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
                  <Stack.Screen name="Auth" component={AuthScreen} />
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

            <StatusBar style="dark" />
          </NavigationContainer>
        </JournalProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}


