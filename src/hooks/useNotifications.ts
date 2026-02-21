import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notifications } from '../utils/notifications';
import { navigationRef } from '../utils/navigation';

/**
 * useNotifications Hook: Listens for notification interactions and handles deep linking.
 */
export const useNotifications = (isGlobal = false) => {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        // Listener for when a notification is received while the app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {

            if (notification.request.content.data?.type === 'DAILY_REMINDER') {
                notifications.markReminderAsSent();
            }
        });

        // Listener for when a user interactions with a notification (taps it)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;


            if (data?.type === 'DAILY_REMINDER') {
                notifications.markReminderAsSent();
            }

            // Handle deep linking based on data
            if (data?.type === 'MEMORY_FLASHBACK' && data?.entryId) {
                // Navigate to the Memory screen using the global ref
                if (navigationRef.isReady()) {
                    navigationRef.navigate('Memory', { entryId: data.entryId });
                }
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, []);
};
