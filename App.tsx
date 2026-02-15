import "./global.css";
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { DeviceEventEmitter, View, ActivityIndicator, AppState, AppStateStatus, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { navigationRef } from './src/utils/navigation';
import { supabase } from './src/lib/supabase';

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';
import { posthog, identifyUser } from './src/lib/posthog';
import { useProfile } from './src/context/ProfileContext';
import { MascotImage } from './src/components/MascotImage';
import { MASCOTS } from './src/constants/Assets';


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
import { RoadmapScreen } from './src/screens/RoadmapScreen';

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

const RootNavigator = ({ session, isBioLocked, isColdStartWithSession }: { session: Session | null, isBioLocked: boolean | null, isColdStartWithSession: boolean }) => {
  const { profile, loading: profileLoading } = useProfile();
  
  // Decide which stack to show. 
  // We use a state to "lock in" the view so we don't flicker during loading.
  const [viewMode, setViewMode] = useState<'loading' | 'onboarding' | 'app' | 'auth'>('loading');

  useEffect(() => {
    console.log('[Nav] State Update:', {
        hasSession: !!session,
        profileLoading,
        hasProfile: !!profile,
        isColdStartWithSession,
        currentMode: viewMode
    });

    // Stage 1: Absolute Logout
    if (!session) {
      if (viewMode !== 'auth') setViewMode('auth');
      return;
    }

    // Stage 2: Profile is ready
    if (!profileLoading && profile) {
      setViewMode(profile.onboarding_completed ? 'app' : 'onboarding');
      return;
    }

    // Stage 3: Profile is missing but loading is done (Brand new account)
    if (!profileLoading && !profile) {
      setViewMode('onboarding');
      return;
    }

    // Stage 4: Profile is loading
    // We only show the full-screen loader if it's a cold boot with a session.
    // If we just logged in, we stay in the current viewMode (usually 'auth') 
    // until Stage 2 or 3 kicks in, preventing the transition flicker.
    if (isColdStartWithSession) {
      setViewMode('loading');
    }
  }, [session, profileLoading, profile?.onboarding_completed, isColdStartWithSession, viewMode]); // Added viewMode to dependencies for console.log

  // If we are cold starting with a session, show a loader until profile is ready.
  // Otherwise, we keep the current viewMode to prevent jumping.
  if (viewMode === 'loading' || (profileLoading && session && isColdStartWithSession)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F0' }}>
        <ActivityIndicator color="#FF9E7D" size="large" />
      </View>
    );
  }

  return (
    <LockScreen 
        isActive={!!session} 
        initialLocked={isBioLocked === true && isColdStartWithSession}
        isColdStart={isColdStartWithSession}
    >
      <Stack.Navigator
        key={viewMode}
        initialRouteName={viewMode === 'app' ? "MainApp" : viewMode === 'onboarding' ? "StruggleSelection" : "Welcome"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF9F0' },
          animation: 'slide_from_right'
        }}
      >
        {viewMode === 'app' ? (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
              <Stack.Screen name="Memory" component={MemoryScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
              <Stack.Screen name="Roadmap" component={RoadmapScreen} />
              {/* Unique name to prevent navigation focus leakage from the Login screen */}
              <Stack.Screen name="SecureAccount" component={AuthScreen} />
            </>
        ) : viewMode === 'onboarding' ? (
            <>
              <Stack.Screen name="StruggleSelection" component={StruggleSelectionScreen} />
              <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
              <Stack.Screen name="Summary" component={SummaryScreen} />
              <Stack.Screen name="Auth" component={AuthScreen} />
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
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const isColdStartWithSession = useRef<boolean | null>(null);

  useEffect(() => {
    // 0. Quick check for biometric lock to decide on splash strategy
    AsyncStorage.getItem('security_lock_enabled').then(val => {
      setIsBioLocked(val === 'true');
    });

    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isColdStartWithSession.current === null) {
        isColdStartWithSession.current = !!session;
      }
      setSession(session);
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setIsAuthLoading(false);
      
      // If we logout, we are definitely no longer in a "cold start with session"
      if (event === 'SIGNED_OUT') {
        isColdStartWithSession.current = false;
        setIsBioLocked(false);
      }
      
      // If we just logged in (anon or otherwise), we check for the lock state
      // but we don't treat it as a cold start lock.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const val = await AsyncStorage.getItem('security_lock_enabled');
        setIsBioLocked(val === 'true');
      }
    });

    // 3. Preload mascot assets silently in the background
    // We prioritize the WRITE mascot which is used on the splash screen
    const loadCriticalAssets = async () => {
      try {
        await preloadAssets();
        setAssetsLoaded(true);
      } catch (e) {
        console.warn('Failed to preload assets', e);
        setAssetsLoaded(true); // Don't block app if this fails
      }
    };
    loadCriticalAssets();

    // 4. Capture a manual start event to ensure reliable funnel sequencing.
    // Native 'Application Opened' can be delayed in React Native/Expo.
    posthog.capture('app_session_start');

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  // 4. Privacy Overlay for App Switcher (Snapshot Protection)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If biometric lock is enabled, show overlay as soon as app is backgrounded/inactive
      // This protects the app snapshot in the app switcher
      if (isBioLocked && (nextAppState === 'background' || nextAppState === 'inactive')) {
        setShowPrivacyOverlay(true);
      } else if (nextAppState === 'active') {
        setShowPrivacyOverlay(false);
      }
    });

    return () => subscription.remove();
  }, [isBioLocked]);

  // 4. Identify user in PostHog as soon as session is available
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id, session.user.email);
    }
  }, [session]);


  useEffect(() => {
    // Decision: Hide native splash and show app
    // We now also wait for assetsLoaded to ensure mascot appears immediately
    if (fontsLoaded && !isAuthLoading && isBioLocked !== null && assetsLoaded) {
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
  }, [fontsLoaded, isAuthLoading, isBioLocked, session, assetsLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
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
                      <RootNavigator 
                        session={session} 
                        isBioLocked={isBioLocked} 
                        isColdStartWithSession={isColdStartWithSession.current === true} 
                      />
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
      {showPrivacyOverlay && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF9F0', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
           <MascotImage source={MASCOTS.LOCK} style={{ width: 120, height: 120 }} resizeMode="contain" />
        </View>
      )}

    </View>
  );
}
