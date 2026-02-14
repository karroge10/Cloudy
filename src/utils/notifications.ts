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
    LAST_REMINDER_SENT_DATE: 'cloudy_last_reminder_sent_date',
};

const REMINDER_TITLES = [
    "Time to reflect? ☁️",
    "How was your day? ✨",
    "A moment for yourself 🧘",
    "Penny for your thoughts? 💭",
    "Capture a memory 📸",
    "Your cloud is waiting 🌫️",
    "Dear Diary... ✍️",
    "Evening check-in 🌙",
    "Daily brain dump 🧠",
    "Stay mindful 🌊"
];

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Legacy support
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    async requestPermissions(ask: boolean = true): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted' && ask) {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            if (__DEV__ && ask) console.log('[NotificationService] Permission not granted after request');
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
    async scheduleDailyReminder(timeString: string | null, request: boolean = true, forceDate?: Date) {
        if (!timeString) {
            await Notifications.cancelScheduledNotificationAsync('daily-reminder');
            await AsyncStorage.removeItem('cloudy_reminder_time');
            return;
        }

        await AsyncStorage.setItem('cloudy_reminder_time', timeString);
        const hasPermission = await this.requestPermissions(request);
        if (!hasPermission) return;

        try {
            const [hours, minutes] = timeString.split(':');
            const h = parseInt(hours);
            const m = parseInt(minutes);

            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            const randomTitle = REMINDER_TITLES[Math.floor(Math.random() * REMINDER_TITLES.length)];

            // Daily Cap Mechanism: 
            // If we already sent a reminder today, we must ensure the next one is tomorrow.
            const today = new Date().toDateString();
            const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REMINDER_SENT_DATE);
            
            let trigger: any = {
                hour: h,
                minute: m,
                repeats: true,
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
            };

            // If we already sent today, or if the time for today has passed,
            // we should ideally schedule starting from tomorrow. 
            // Expo's DAILY trigger handles "past time" by default, but we need to
            // handle the "already sent" case specifically.
            if (lastSent === today) {
                if (__DEV__) console.log('[NotificationService] Already sent today. Pushing next to tomorrow.');
                // To force "starting tomorrow", we can use a date trigger for the first one.
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(h, m, 0, 0);
                
                // We schedule a one-time for tomorrow, and the daily repetition will pick up.
                // Actually, the most reliable way in Expo is to just use the DAILY trigger.
                // If lastSent === today AND the time is in the future today, 
                // we have a problem.
                
                const now = new Date();
                const targetToday = new Date();
                targetToday.setHours(h, m, 0, 0);
                
                if (targetToday > now) {
                    // It's in the future today, but we already sent one.
                    const seconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
                    trigger = {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds,
                        repeats: false,
                    };
                    if (__DEV__) console.log(`[NotificationService] Overriding DAILY trigger with ${seconds}s delay to respect cap.`);
                }
            }

            await Notifications.scheduleNotificationAsync({
                identifier: 'daily-reminder',
                content: {
                    title: randomTitle,
                    body: randomPrompt,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    data: { type: 'DAILY_REMINDER', sent_at: new Date().toISOString() },
                    // Explicit channel for Android safety
                    ...(Platform.OS === 'android' ? { channelId: 'default' } : {})
                },
                trigger,
            });

            const isRepeating = !!(trigger as any).repeats;
            if (__DEV__) console.log(`[NotificationService] Daily nudge scheduled for ${h}:${m} (Repeating: ${isRepeating})`);
        } catch (error) {
            console.error('[NotificationService] Error scheduling daily nudge:', error);
        }
    }

    async markReminderAsSent() {
        const today = new Date().toDateString();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_REMINDER_SENT_DATE, today);
        if (__DEV__) console.log('[NotificationService] Marked daily reminder as sent for today.');
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

        // Clean up delivered notifications and track reminder sent status
        const delivered = await Notifications.getPresentedNotificationsAsync();
        const hasDeliveredReminder = delivered.some(n => n.request.content.data?.type === 'DAILY_REMINDER');
        if (hasDeliveredReminder) {
            await this.markReminderAsSent();
            // Optionally clear them to keep drawer clean
            // await Notifications.dismissAllNotificationsAsync();
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
                // We definitely don't want to request permissions here if they were revoked.
                this.scheduleDailyReminder(reminderTime, false);
            }
        }

        await this.scheduleRescueNotification();
    }

    private async scheduleFlashback(entryId: string, content: string, label: string) {
        // Flashbacks are automated; never prompt from here
        const hasPermission = await this.requestPermissions(false);
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
        // Rescue nudges are automated; never prompt from here
        const hasPermission = await this.requestPermissions(false);
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

