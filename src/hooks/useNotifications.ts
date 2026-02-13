import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

/**
 * useNotifications Hook: Listens for notification interactions and handles deep linking.
 */
export const useNotifications = () => {
    const navigation = useNavigation<any>();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        // Listener for when a notification is received while the app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            if (__DEV__) console.log('[useNotifications] Foreground notification received:', notification);
        });

        // Listener for when a user interactions with a notification (taps it)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (__DEV__) console.log('[useNotifications] Notification interaction:', data);

            // Handle deep linking based on data
            if (data?.type === 'MEMORY_FLASHBACK' && data?.entryId) {
                // Navigate to the Memory screen
                navigation.navigate('Memory', { entryId: data.entryId });
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [navigation]);
};
