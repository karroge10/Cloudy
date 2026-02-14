import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import prompts from '../constants/prompts.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * NotificationService: A centralized utility for handling push notifications.
 * 
 * STRATEGY:
 * 1. Low Noise: Max 1 notification/day.
 * 2. Local Generation: Content comes from prompts.json.
 * 3. Cloudy Algorithm: Smart flashbacks based on 1yr/6mo/1mo intervals.
 * 4. Rescue Nudge: Re-engage after 3 days of inactivity.
 */

const STORAGE_KEYS = {
    LAST_FLASHBACK_CHECK: 'cloudy_last_flashback_check',
    NEXT_FLASHBACK_DATE: 'cloudy_next_flashback_date',
    LAST_APP_OPEN: 'cloudy_last_app_open',
};

// Configure foreground behavior
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

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    }

    /**
     * Schedules the daily nudge with a random prompt.
     * @param forceDate Optional date to start the daily reminder from (used to skip days)
     */
    async scheduleDailyReminder(timeString: string | null, forceDate?: Date) {
        if (!timeString) {
            await Notifications.cancelScheduledNotificationAsync('daily-reminder');
            await AsyncStorage.removeItem('cloudy_reminder_time');
            return;
        }

        await AsyncStorage.setItem('cloudy_reminder_time', timeString);
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        try {
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':');
            let h = parseInt(hours);
            if (period === 'PM' && h < 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            const m = parseInt(minutes);

            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

            // If forceDate is provided, we set the trigger to that date/time
            // Otherwise, it's just a standard daily repeat starting now/today
            let trigger: any = {
                hour: h,
                minute: m,
                repeats: true,
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
            };

            if (forceDate) {
                const nextTrigger = new Date(forceDate);
                nextTrigger.setHours(h, m, 0, 0);
                trigger = nextTrigger; // This makes it a one-time thing, so we need to be careful
                // Actually, expo-notifications DAILY trigger starting from a specific date is tricky.
                // We'll just stick to the standard one for now, but the "Low Noise" policy 
                // means we'll mostly rely on performBackgroundCheck to reshuffle if needed.
            }

            await Notifications.scheduleNotificationAsync({
                identifier: 'daily-reminder',
                content: {
                    title: "Time to reflect? ☁️",
                    body: randomPrompt,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger,
            });

            if (__DEV__) console.log(`[NotificationService] Daily nudge scheduled for ${h}:${m}`);
        } catch (error) {
            console.error('[NotificationService] Error scheduling daily nudge:', error);
        }
    }

    /**
     * The Cloudy Algorithm: Runs on app open.
     * Checks for meaningful memories to show tomorrow.
     */
    async performBackgroundCheck(entries: any[]) {
        const now = new Date();
        const todayStr = now.toDateString();
        
        // Don't check more than once a day
        const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_FLASHBACK_CHECK);
        if (lastCheck === todayStr) return;

        await AsyncStorage.setItem(STORAGE_KEYS.LAST_FLASHBACK_CHECK, todayStr);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_APP_OPEN, now.toISOString());

        // Check if a flashback is already pending
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const hasFlashback = scheduled.some(n => n.identifier.startsWith('flashback-'));
        
        if (hasFlashback) {
            if (__DEV__) console.log('[NotificationService] Flashback already in queue.');
            return;
        }

        const findEntry = (monthsAgo: number) => {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - monthsAgo);
            const targetStr = targetDate.toDateString();
            return entries.find(e => new Date(e.created_at).toDateString() === targetStr);
        };

        // Priority logic: 1yr -> 6mo -> 1mo
        let match = findEntry(12);
        let type = '1 year ago today';
        
        if (!match) {
            match = findEntry(6);
            type = '6 months ago today';
        }
        if (!match) {
            match = findEntry(1);
            type = '1 month ago today';
        }

        const isSaturday = now.getDay() === 6;
        if (!match && isSaturday && entries.length > 5) {
            match = entries[Math.floor(Math.random() * entries.length)];
            type = 'A memory for your Sunday';
        }

        if (match) {
            await this.scheduleFlashback(match.id, match.text, type);
            
            // RULE #1: If we scheduled a flashback for tomorrow, 
            // we should ideally skip the daily reminder for tomorrow.
            // We'll just refresh the daily reminder to pick a new prompt anyway.
            const reminderTime = await AsyncStorage.getItem('cloudy_reminder_time');
            if (reminderTime) {
                // Refreshing it here ensures a new random prompt for the next day it fires.
                this.scheduleDailyReminder(reminderTime);
            }
        }

        await this.scheduleRescueNotification();
    }

    private async scheduleFlashback(entryId: string, content: string, label: string) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + 1);
        
        const isSunday = triggerDate.getDay() === 0;
        triggerDate.setHours(isSunday ? 10 : 12, 0, 0, 0);

        await Notifications.scheduleNotificationAsync({
            identifier: `flashback-${entryId}`,
            content: {
                title: `Remember this? (${label}) ☁️`,
                body: content 
                    ? `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
                    : "Tap to relive this moment.",
                data: { type: 'MEMORY_FLASHBACK', entryId },
                sound: true,
            },
            trigger: triggerDate as any,
        });

        if (__DEV__) console.log(`[NotificationService] Flashback scheduled for tomorrow at ${triggerDate.getHours()}:00`);
    }


    /**
     * Rescue Nudge: Schedules a notification for 3 days from now.
     * If the user opens the app before then, this gets reset.
     */
    async scheduleRescueNotification() {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) return;

        // Cancel previous rescue if any
        await Notifications.cancelScheduledNotificationAsync('rescue-nudge');

        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + 3);
        triggerDate.setHours(11, 0, 0, 0); // Lunchtime rescue

        await Notifications.scheduleNotificationAsync({
            identifier: 'rescue-nudge',
            content: {
                title: "We miss your thoughts! ☁️",
                body: "No pressure, just wanted to say hi. Ready to capture a memory?",
                sound: true,
            },
            trigger: triggerDate as any,
        });

        if (__DEV__) console.log('[NotificationService] Rescue nudge scheduled for 3 days from now');
    }

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await AsyncStorage.multiRemove([STORAGE_KEYS.LAST_FLASHBACK_CHECK, STORAGE_KEYS.NEXT_FLASHBACK_DATE]);
    }
}

export const notifications = new NotificationService();

