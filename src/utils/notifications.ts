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
    LAST_STREAK_PROTECTION: 'cloudy_last_streak_protection',
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

const RESCUE_MESSAGES = [
    { title: "Cloudy is worried... ☁️", body: "Forgot to post today? Your streak resets in 2 hours!" },
    { title: "Don't lose your progress! ✨", body: "A quick 1-minute reflection and your streak is safe." },
    { title: "Your streak is on the line! 🔥", body: "Keep the momentum going. Just a few words to save it." }
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

            const today = new Date().toDateString();
            const lastSent = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REMINDER_SENT_DATE);
            
            let trigger: any = {
                hour: h,
                minute: m,
                repeats: true,
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
            };

            if (lastSent === today) {
                const now = new Date();
                const targetToday = new Date();
                targetToday.setHours(h, m, 0, 0);
                
                if (targetToday > now) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(h, m, 0, 0);
                    const seconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
                    trigger = {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds,
                        repeats: false,
                    };
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
                    ...(Platform.OS === 'android' ? { channelId: 'default' } : {})
                },
                trigger,
            });

            await Notifications.cancelScheduledNotificationAsync('daily-safety-net');
            if (h < 20) {
                const rescueMsg = RESCUE_MESSAGES[Math.floor(Math.random() * RESCUE_MESSAGES.length)];
                await Notifications.scheduleNotificationAsync({
                    identifier: 'daily-safety-net',
                    content: {
                        title: rescueMsg.title,
                        body: rescueMsg.body,
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                        data: { type: 'SAFETY_NET' },
                        ...(Platform.OS === 'android' ? { channelId: 'default' } : {})
                    },
                    trigger: {
                        hour: 22,
                        minute: 0,
                        repeats: true,
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    } as any,
                });
            }
        } catch (error) {
        }
    }

    async markReminderAsSent() {
        const today = new Date().toDateString();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_REMINDER_SENT_DATE, today);
    }

    async performBackgroundCheck(entries: any[]) {
        const now = new Date();
        const todayStr = now.toDateString();
        
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_APP_OPEN, now.toISOString());
        await this.scheduleRescueNudges();

        const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_FLASHBACK_CHECK);
        if (lastCheck === todayStr) return;

        await AsyncStorage.setItem(STORAGE_KEYS.LAST_FLASHBACK_CHECK, todayStr);

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const hasFlashback = scheduled.some(n => n.identifier.startsWith('flashback-'));
        
        if (hasFlashback) {
            return;
        }

        const delivered = await Notifications.getPresentedNotificationsAsync();
        const hasDeliveredReminder = delivered.some(n => n.request.content.data?.type === 'DAILY_REMINDER');
        if (hasDeliveredReminder) {
            await this.markReminderAsSent();
        }

        const findEntry = (monthsAgo: number) => {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - monthsAgo);
            const targetStr = targetDate.toDateString();
            return entries.find(e => new Date(e.created_at).toDateString() === targetStr);
        };

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
            const reminderTime = await AsyncStorage.getItem('cloudy_reminder_time');
            if (reminderTime) {
                this.scheduleDailyReminder(reminderTime, false);
            }
        }
    }

    private async scheduleFlashback(entryId: string, content: string, label: string) {
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
    }

    async scheduleRescueNudges() {
        const hasPermission = await this.requestPermissions(false);
        if (!hasPermission) return;

        const stages = [3, 7, 14, 30];
        for (const stage of stages) {
            await Notifications.cancelScheduledNotificationAsync(`rescue-nudge-${stage}`);
        }

        const nudges = [
            { day: 3, title: "We miss your thoughts! ☁️", body: "No pressure, just wanted to say hi. Ready to capture a memory?" },
            { day: 7, title: "Sparky is feeling lonely... 🥺", body: "It's been a week since we talked. How are you doing?" },
            { day: 14, title: "Remember this? 📸", body: "You wrote a beautiful memory 2 weeks ago. Tap to read it." },
            { day: 30, title: "A fresh start? 🌟", body: "It's been a month. Come back and begin a new journey with Cloudy." }
        ];

        for (const nudge of nudges) {
            const triggerDate = new Date();
            triggerDate.setDate(triggerDate.getDate() + nudge.day);
            triggerDate.setHours(11, 0, 0, 0);

            await Notifications.scheduleNotificationAsync({
                identifier: `rescue-nudge-${nudge.day}`,
                content: {
                    title: nudge.title,
                    body: nudge.body,
                    sound: true,
                    data: { type: 'RESCUE_NUDGE', stage: nudge.day }
                },
                trigger: triggerDate as any,
            });
        }
    }

    async scheduleRescueNotification() {
        await this.scheduleRescueNudges();
    }

    async cancelRescueNudges() {
        const stages = [3, 7, 14, 30];
        for (const stage of stages) {
            await Notifications.cancelScheduledNotificationAsync(`rescue-nudge-${stage}`);
        }
    }

    async scheduleStreakProtection(lastEntryDate: string, maxStreak: number = 0) {
        const hasPermission = await this.requestPermissions(false);
        if (!hasPermission) return;

        await Notifications.cancelScheduledNotificationAsync('streak-protection');

        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + 2);
        triggerDate.setHours(9, 0, 0, 0);

        const canFreeze = maxStreak >= 14;
        const title = canFreeze ? "Streak Frozen! ❄️" : "Oh no! Your streak reset 😢";
        const body = canFreeze 
            ? "You missed yesterday, but Cloudy used your monthly freeze. Post today to keep it active!" 
            : "You missed a day, but don't worry! Start a new streak today and keep the momentum going.";

        await Notifications.scheduleNotificationAsync({
            identifier: 'streak-protection',
            content: {
                title,
                body,
                sound: true,
                data: { type: 'STREAK_LOST' }
            },
            trigger: triggerDate as any,
        });
    }

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await AsyncStorage.multiRemove([STORAGE_KEYS.LAST_FLASHBACK_CHECK, STORAGE_KEYS.NEXT_FLASHBACK_DATE]);
    }
}

export const notifications = new NotificationService();
