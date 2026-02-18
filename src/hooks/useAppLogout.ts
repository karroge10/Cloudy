import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import { resetUser } from '../lib/posthog';
import { useAnalytics } from './useAnalytics';
import { useAlert } from '../context/AlertContext';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';

export const useAppLogout = () => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { trackEvent } = useAnalytics();
    const { showAlert } = useAlert();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        // Short delay to allow UI to render modal
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
            await AsyncStorage.removeItem('has_seen_first_entry');
            await AsyncStorage.removeItem('user_streak_cache');
            await AsyncStorage.removeItem('pending_merge_anonymous_id');
            await AsyncStorage.removeItem('security_lock_enabled');

            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }

            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            trackEvent('user_logged_out');
            resetUser();

        } catch (error: any) {
            setIsLoggingOut(false);
            const { title, message } = getFriendlyAuthErrorMessage(error);
            showAlert(title, message, [{ text: 'Okay' }], 'error');
        }
    };

    return { isLoggingOut, handleLogout };
};
