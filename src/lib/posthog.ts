import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = 'phc_tykDrHCqmBWyzTdzsrui9De9q45isA17Zev5qigCsP6';
// Crucial: Use the ingest URL for EU region
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    // Native lifecycle events (background/foreground/etc)
    captureAppLifecycleEvents: true, 
    // Important: Create profiles for all users (including anonymous) 
    // so they show up in Funnels and Retention reports.
    personProfiles: 'always',
});

export const identifyUser = (
    userId: string, 
    email?: string, 
    properties?: Record<string, string | number | boolean | null | string[]>
) => {
    // We create the identity object safely to avoid undefined values which TS dislikes
    const identifyProps: Record<string, string | number | boolean | null | string[]> = { ...properties };
    if (email) identifyProps.email = email;

    posthog.identify(userId, identifyProps);
};

export const resetUser = () => {
    posthog.reset();
};
