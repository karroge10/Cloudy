import "./global.css";
import "./src/lib/i18n";
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { DeviceEventEmitter, View, ActivityIndicator, AppState, AppStateStatus, StyleSheet, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AlertProvider } from './src/context/AlertContext';
import { useNotifications } from './src/hooks/useNotifications';
import { LockScreen } from './src/components/LockScreen';
import { preloadCriticalAssets, preloadBackgroundAssets } from './src/utils/assetLoader';
import { AssetWarmup } from './src/components/AssetWarmup';
import { CustomSplashScreen } from './src/components/CustomSplashScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ProfileScreen } from './src/screens/ProfileScreen'; // Added ProfileScreen import
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { FlashbackScreen } from './src/screens/FlashbackScreen';

import { AccentProvider } from './src/context/AccentContext';


const AppContent = () => {
  useNotifications(true); // Pass flag to ignore hook errors if needed, but we'll use ref now
  return null; 
};


const Stack = createNativeStackNavigator();

const getCloudyTheme = (isDark: boolean) => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: isDark ? '#111427' : '#FFF9F0',
    card: isDark ? '#111427' : '#FFF9F0',
    text: isDark ? '#E5E7EB' : '#333333',
  },
});

// Prevent auto hide splash screen
SplashScreen.preventAutoHideAsync();

const RootNavigator = ({ session, isBioLocked, isColdStartWithSession, isAuthLoading, fontsLoaded }: { session: Session | null, isBioLocked: boolean | null, isColdStartWithSession: boolean, isAuthLoading: boolean, fontsLoaded: boolean }) => {
  const { profile, loading: profileLoading } = useProfile();
  const { isDarkMode } = useTheme();
  
  // Decide which stack to show. 
  const [viewMode, setViewMode] = useState<'loading' | 'onboarding' | 'app' | 'auth'>('loading');

  useEffect(() => {
    const nextViewMode = (() => {
        // Stage 0: Initializing
        if (!fontsLoaded || isAuthLoading || isBioLocked === null) return 'loading';

        // Stage 1: Logged Out
        if (!session) return 'auth';

        // Stage 2: Session exists, checking Profile
        // If we have a session but no profile yet, and we are NOT anon (or even if we are), 
        // we should wait for profile to load before deciding 'app' or 'onboarding'.
        // The previous logic allowed falling through to 'onboarding' if profile was undefined.
        if (profileLoading && !profile) {
             // If we are already in 'app' (e.g. slight refresh), stay there to avoid flash
             if (viewMode === 'app') return 'app';
             return 'loading';
        }

        // Stage 3: Ready
        // If we have a profile and onboarding is explicitly true
        if (profile?.onboarding_completed) return 'app';

        // If we have a session but profile says onboarding NOT completed, go to Onboarding
        // If profile is still null here (shouldn't be if profileLoading is false), default to onboarding safely?
        // Actually if profile is null but loading is false, it means profile fetch failed or user has no profile row.
        // In that case, we probably want to treat them as new -> Onboarding (which creates profile)
        return 'onboarding';
    })();

    if (nextViewMode !== viewMode) {
        console.log(`[RootNavigator] Changing viewMode: ${viewMode} -> ${nextViewMode}`, { 
            session: !!session, 
            profile: !!profile, 
            onboarding: profile?.onboarding_completed,
            profileLoading
        });
        setViewMode(nextViewMode);
    }
  }, [session, profileLoading, profile?.onboarding_completed, isAuthLoading, fontsLoaded, isBioLocked, viewMode]);

  // We rely on the button loaders and screen transitions for UI feedback.
  // Full-screen empty blocks are disruptive to navigation states.

  return (
    <LockScreen 
        isActive={!!session} 
        initialLocked={isBioLocked === true && isColdStartWithSession}
        isColdStart={isColdStartWithSession}
    >
      <Stack.Navigator
        initialRouteName={viewMode === 'app' ? "MainApp" : viewMode === 'loading' ? "InitialLoading" : "Welcome"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDarkMode ? '#111427' : '#FFF9F0' },
          animation: 'slide_from_right'
        }}
      >
        {viewMode === 'app' ? (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
              <Stack.Screen name="Memory" component={MemoryScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />

              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              {/* Unique name to prevent navigation focus leakage from the Login screen */}
              <Stack.Screen name="SecureAccount" component={AuthScreen} />
              <Stack.Screen name="Statistics" component={StatisticsScreen} />
              <Stack.Screen name="Flashback" component={FlashbackScreen} />

            </>
        ) : viewMode === 'loading' ? (
            <Stack.Screen name="InitialLoading">
              {() => <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111427' : '#FFF9F0' }} />}
            </Stack.Screen>
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

const AppNavigator = ({ 
  session, 
  isAuthLoading, 
  isBioLocked, 
  isColdStartWithSession, 
  fontsLoaded,
  showAnimatedSplash,
  setShowAnimatedSplash,
  showPrivacyOverlay
}: { 
  session: Session | null, 
  isAuthLoading: boolean, 
  isBioLocked: boolean | null, 
  isColdStartWithSession: boolean, 
  fontsLoaded: boolean,
  showAnimatedSplash: boolean,
  setShowAnimatedSplash: (val: boolean) => void,
  showPrivacyOverlay: boolean
}) => {
  const { isDarkMode } = useTheme();
  const theme = React.useMemo(() => getCloudyTheme(isDarkMode), [isDarkMode]);

  // Global Android back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (!navigationRef.isReady()) return false;

      // Get the current route
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      
      // Screens that should exit the app when back is pressed
      const exitScreens = ['Entry', 'Welcome', 'InitialLoading'];
      
      // If we're on an exit screen, let the app close
      if (exitScreens.includes(currentRoute || '')) {
        return false;
      }

      // Check if there's something to go back to
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      // No back history - let app exit
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  return (
    <View className={`flex-1 ${isDarkMode ? 'dark' : ''}`} style={{ backgroundColor: isDarkMode ? '#111427' : (session && isBioLocked ? '#111427' : '#FFF9F0') }}>
      <NavigationContainer 
        theme={theme} 
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
        {fontsLoaded && !isAuthLoading && isBioLocked !== null ? (
            <>
              <AppContent />
              <AssetWarmup />
              <RootNavigator 
                session={session} 
                isBioLocked={isBioLocked} 
                isColdStartWithSession={isColdStartWithSession} 
                isAuthLoading={isAuthLoading}
                fontsLoaded={fontsLoaded}
              />
            </>
        ) : null}

        {showAnimatedSplash && !(isBioLocked && session) && (
           <CustomSplashScreen 
            onFinish={() => setShowAnimatedSplash(false)} 
           />
        )}
        <StatusBar style={isDarkMode ? "light" : "dark"} translucent />
      </NavigationContainer>
      {showPrivacyOverlay && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111427', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }]}>
           <MascotImage source={MASCOTS.LOCK} style={{ width: 120, height: 120 }} resizeMode="contain" />
        </View>
      )}
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    ...Ionicons.font,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [isBioLocked, setIsBioLocked] = useState<boolean | null>(null);
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const isColdStartWithSession = useRef<boolean | null>(null);

    // Parallel INITIALIZATION
    useEffect(() => {
        const init = async () => {
            const start = Date.now();
            
            try {
                // Run non-dependent tasks in parallel
                const [lockVal, sessionResult] = await Promise.all([
                    AsyncStorage.getItem('security_lock_enabled'),
                    supabase.auth.getSession(),
                    preloadCriticalAssets()
                ]);

                // Handle Auth session
                const { data: { session: initialSession } } = sessionResult;
                if (isColdStartWithSession.current === null) {
                    isColdStartWithSession.current = !!initialSession;
                }
                setSession(initialSession);
                setIsAuthLoading(false);

                // Handle Bio Lock state
                setIsBioLocked(lockVal === 'true');
                
                // Signal critical path complete
                setAssetsLoaded(true);

                const duration = (Date.now() - start) / 1000;
                console.log(`[App] Critical init complete in ${duration.toFixed(3)}s`);

                // STAGE 2: Background tasks
                preloadBackgroundAssets();
                posthog.capture('app_session_start');
            } catch (error) {
                console.error('[App] Init error:', error);
                setIsAuthLoading(false);
                setAssetsLoaded(true); // Fallback to let user in
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setIsAuthLoading(false);
      
      if (event === 'SIGNED_OUT') {
        isColdStartWithSession.current = false;
        setIsBioLocked(false);
      }
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const val = await AsyncStorage.getItem('security_lock_enabled');
        setIsBioLocked(val === 'true');
        
        if (event === 'SIGNED_IN') {
           isColdStartWithSession.current = false;
        }
      }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (isBioLocked && (nextAppState === 'background' || nextAppState === 'inactive')) {
        setShowPrivacyOverlay(true);
      } else if (nextAppState === 'active') {
        setShowPrivacyOverlay(false);
      }
    });

    return () => subscription.remove();
  }, [isBioLocked]);

  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id, session.user.email);
    }
  }, [session]);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading && isBioLocked !== null && assetsLoaded) {
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
    <PostHogProvider client={posthog} autocapture={false}>
      <SafeAreaProvider>
         <ProfileProvider session={session}>
          <AccentProvider>
            <ThemeProvider>
              <AlertProvider>
                <JournalProvider session={session}>
                  <AppNavigator 
                    session={session} 
                    isAuthLoading={isAuthLoading} 
                    isBioLocked={isBioLocked} 
                    isColdStartWithSession={isColdStartWithSession.current === true}
                    fontsLoaded={fontsLoaded}
                    showAnimatedSplash={showAnimatedSplash}
                    setShowAnimatedSplash={setShowAnimatedSplash}
                    showPrivacyOverlay={showPrivacyOverlay}
                  />
                </JournalProvider>
              </AlertProvider>
            </ThemeProvider>
          </AccentProvider>
        </ProfileProvider>
      </SafeAreaProvider>
    </PostHogProvider>
  );
}
