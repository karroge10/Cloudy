import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * NotificationService: A centralized utility for handling push notifications.
 * 
 * DESIGN RATIONALE:
 * 1. Handles permission requests and scheduling in one place.
 * 2. Provides clear methods for daily reminders and flashback notifications.
 * 3. Includes debug logging for development sanity.
 */

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    /**
     * Request notification permissions from the user.
     * Returns true if granted.
     */
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            if (__DEV__) console.log('[NotificationService] Permission not granted');
            return false;
        }

        // On Android, we need to set a channel for notifications
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    }

    /**
     * Schedules a daily reminder at a specific time.
     * @param timeString String in format "HH:mm AM/PM" (e.g., "09:00 PM")
     */
    async scheduleDailyReminder(timeString: string | null) {
        if (!timeString) {
            await Notifications.cancelScheduledNotificationAsync('daily-reminder');
            if (__DEV__) console.log('[NotificationService] Daily reminder cancelled');
            return;
        }

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        try {
            // Parse "HH:mm AM/PM"
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':');
            let h = parseInt(hours);
            
            if (period === 'PM' && h < 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;

            const m = parseInt(minutes);

            await Notifications.scheduleNotificationAsync({
                identifier: 'daily-reminder', // Fixed ID to overwrite previous daily reminder
                content: {
                    title: "Time for your daily reflection ☁️",
                    body: "What went well today? Take a moment for yourself.",
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    hour: h,
                    minute: m,
                    repeats: true,
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                } as any,
            });

            if (__DEV__) {
                console.log(`[NotificationService] Scheduled daily reminder for ${h}:${m} (Source: ${timeString})`);
            }
        } catch (error) {
            console.error('[NotificationService] Error scheduling notification:', error);
        }
    }

    /**
     * Cancel all currently scheduled notifications.
     */
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (__DEV__) console.log('[NotificationService] All notifications cancelled');
    }

    /**
     * Schedule a flashback notification for a specific entry.
     */
    async scheduleFlashback(entryId: string, content: string, delayDays: number) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        try {
            // Schedule for X days in the future, at a reasonable time (e.g., 10 AM)
            const triggerDate = new Date();
            triggerDate.setDate(triggerDate.getDate() + delayDays);
            triggerDate.setHours(10, 0, 0, 0);

            await Notifications.scheduleNotificationAsync({
                identifier: `flashback-${entryId}`, // Unique ID per entry flashback
                content: {
                    title: "A small memory for you ☁️",
                    body: content 
                        ? `Remember this? "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
                        : "Remember this moment? Tap to view.",
                    data: { type: 'MEMORY_FLASHBACK', entryId },
                    sound: true,
                },
                trigger: triggerDate as any,
            });

            if (__DEV__) {
                console.log(`[NotificationService] Flashback scheduled for entry ${entryId} in ${delayDays} days`);
            }
        } catch (error) {
            console.error('[NotificationService] Error scheduling flashback:', error);
        }
    }
}

export const notifications = new NotificationService();
